import requests
import os
import json
from bs4 import BeautifulSoup
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # 允许所有来源的跨域请求（测试用）

# 缓存数据以避免频繁请求
CACHE = {
    'data': None,
    'last_updated': None
}

# 定义本地离线数据文件路径
OFFLINE_DATA_PATH = os.path.join(os.path.dirname(__file__), 'offline', 'songs.json')

@app.route('/api/songs')
def get_songs():
    # 如果有缓存数据，直接返回
    if CACHE['data']:
        return jsonify(CACHE['data'])

    # 从维基页面获取数据
    url = 'https://arcwiki.mcd.blue/%E5%AE%9A%E6%95%B0%E8%AF%A6%E8%A1%A8'
    try:
        response = requests.get(url)
        response.raise_for_status()  # 抛出HTTP错误状态码
    except requests.exceptions.RequestException as e:
        # 在线请求失败，尝试加载本地文件
        if os.path.exists(OFFLINE_DATA_PATH):
            with open(OFFLINE_DATA_PATH, 'r', encoding='utf-8') as f:
                CACHE['data'] = json.load(f)
            return jsonify(CACHE['data'])
        else:
            return jsonify({"error": "在线获取数据失败，且本地无缓存数据"}), 500

    soup = BeautifulSoup(response.text, 'html.parser')

    # 查找表格并解析数据
    table = soup.find('table', class_='wikitable')
    if not table:
        # 无法找到表格，尝试使用本地缓存
        if os.path.exists(OFFLINE_DATA_PATH):
            with open(OFFLINE_DATA_PATH, 'r', encoding='utf-8') as f:
                CACHE['data'] = json.load(f)
            return jsonify(CACHE['data'])
        else:
            return jsonify({"error": "无法解析在线数据，且本地无缓存数据"}), 500

    rows = table.find_all('tr')[1:]  # 跳过表头

    songs = []
    for row in rows:
        cols = row.find_all('td')
        if len(cols) >= 5:
            name = cols[0].text.strip()
            difficulties = {
                'PST': cols[1].text.strip() if cols[1].text.strip() else '',
                'PRS': cols[2].text.strip() if cols[2].text.strip() else '',
                'FTR': cols[3].text.strip() if cols[3].text.strip() else '',
                'BYD': cols[4].text.strip() if cols[4].text.strip() else '',
                'ETR': cols[5].text.strip() if len(cols) > 5 and cols[5].text.strip() else ''
            }
            songs.append({'name': name, 'difficulties': difficulties})

    # 去重处理
    seen = set()
    unique_songs = []
    for song in songs:
        if song['name'] not in seen:
            seen.add(song['name'])
            unique_songs.append(song)

    # 更新缓存
    CACHE['data'] = unique_songs

    # 保存数据到本地文件
    os.makedirs(os.path.dirname(OFFLINE_DATA_PATH), exist_ok=True)
    with open(OFFLINE_DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(unique_songs, f, ensure_ascii=False, indent=2)

    return jsonify(unique_songs)

if __name__ == '__main__':
    app.run(port=5000, debug=True)