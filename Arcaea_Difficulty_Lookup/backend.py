import requests
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

# 添加用户提到的'Last | Eternity'歌曲数据
ADDITIONAL_SONGS = [
    {'name': 'Last | Eternity', 'difficulties': {'PST': '', 'PRS': '', 'FTR': '', 'BYD': '11.8', 'ETR': ''}}
]

@app.route('/api/songs')
def get_songs():
    # 如果有缓存数据，直接返回
    if CACHE['data']:
        return jsonify(CACHE['data'])

    # 从维基页面获取数据
    url = 'https://arcwiki.mcd.blue/%E5%AE%9A%E6%95%B0%E8%AF%A6%E8%A1%A8'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # 查找表格并解析数据
    table = soup.find('table', class_='wikitable')
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

    # 添加额外的歌曲数据
    songs.extend(ADDITIONAL_SONGS)

    # 去重处理
    seen = set()
    unique_songs = []
    for song in songs:
        if song['name'] not in seen:
            seen.add(song['name'])
            unique_songs.append(song)

    # 更新缓存
    CACHE['data'] = unique_songs

    return jsonify(unique_songs)

if __name__ == '__main__':
    app.run(port=5000, debug=True)