import requests
import os
import json
import datetime
from bs4 import BeautifulSoup

# 定义本地离线数据文件路径
OFFLINE_DATA_PATH = os.path.join(os.path.dirname(__file__), 'offline', 'songs.json')
WIKI_URL = 'https://arcwiki.mcd.blue/%E5%AE%9A%E6%95%B0%E8%AF%A6%E8%A1%A8'

class SongDataCrawler:
    @staticmethod
    def fetch_online_data():
        """从维基页面爬取最新定数数据"""
        try:
            response = requests.get(WIKI_URL)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"在线请求失败: {e}")
            return None

    @staticmethod
    def parse_html(html_content):
        """解析HTML内容提取歌曲定数数据"""
        if not html_content:
            return []

        soup = BeautifulSoup(html_content, 'html.parser')
        table = soup.find('table', class_='wikitable')
        if not table:
            return []

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

        return unique_songs

    @staticmethod
    def save_to_offline(data):
        """保存数据到本地离线文件"""
        os.makedirs(os.path.dirname(OFFLINE_DATA_PATH), exist_ok=True)
        with open(OFFLINE_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump({
                'songs': data,
                'last_updated': datetime.datetime.now().isoformat()
            }, f, ensure_ascii=False, indent=2)

    @staticmethod
    def load_from_offline():
        """从本地离线文件加载数据"""
        if os.path.exists(OFFLINE_DATA_PATH):
            with open(OFFLINE_DATA_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None

    @staticmethod
    def get_latest_data(force_update=False):
        """获取最新数据，优先在线获取，失败则使用本地缓存"""
        if force_update:
            html = SongDataCrawler.fetch_online_data()
            if html:
                songs = SongDataCrawler.parse_html(html)
                if songs:
                    SongDataCrawler.save_to_offline(songs)
                    return {
                        'songs': songs,
                        'last_updated': datetime.datetime.now().isoformat(),
                        'source': 'online'
                    }

        # 尝试加载本地数据
        offline_data = SongDataCrawler.load_from_offline()
        if offline_data:
            return offline_data

        # 本地无数据时尝试最后一次在线获取
        html = SongDataCrawler.fetch_online_data()
        if html:
            songs = SongDataCrawler.parse_html(html)
            if songs:
                SongDataCrawler.save_to_offline(songs)
                return {
                    'songs': songs,
                    'last_updated': datetime.datetime.now().isoformat(),
                    'source': 'online'
                }

        return {'songs': [], 'last_updated': None, 'source': 'none'}

if __name__ == '__main__':
    # 当直接运行此脚本时，强制更新数据并保存到本地
    SongDataCrawler.get_latest_data(force_update=True)
    print(f"数据已更新并保存至 {OFFLINE_DATA_PATH}")