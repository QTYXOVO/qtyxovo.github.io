import os
import json
import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from crawler import SongDataCrawler

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # 允许所有来源的跨域请求（测试用）

# 缓存数据以避免频繁请求
CACHE = {
    'songs': None,
    'last_updated': None
}

@app.route('/api/songs')
def get_songs():
    # 如果有缓存数据，直接返回
    if CACHE['songs']:
        return jsonify({
            'songs': CACHE['songs'],
            'last_updated': CACHE['last_updated']
        })

    # 使用爬虫模块获取最新数据
    data = SongDataCrawler.get_latest_data()
    
    if not data['songs']:
        return jsonify({"error": "无法获取歌曲数据"}), 500
    
    # 更新缓存
    CACHE['songs'] = data['songs']
    CACHE['last_updated'] = data['last_updated']
    
    return jsonify({
        'songs': CACHE['songs'],
        'last_updated': CACHE['last_updated'],
        'source': data.get('source', 'unknown')
    })

if __name__ == '__main__':
    app.run(port=int(os.environ.get('PORT', 5000)), debug=True)