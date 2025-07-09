# Arcaea Difficulty Lookup 运行指南

## 项目介绍
Arcaea Difficulty Lookup是一个用于查询Arcaea歌曲难度数据的Web应用，前端基于HTML/CSS/JavaScript开发。支持在线API获取最新数据和离线本地数据查询两种模式，无需后端服务也可使用。

## 环境要求
- 现代浏览器（Chrome, Firefox, Edge等）
- （可选）Python 3.6+（仅在线模式需要）
- 必要Python依赖：requests, beautifulsoup4（通过requirements.txt安装）

## 安装步骤

### 1. 克隆或下载项目
将项目文件保存到本地目录

### 2. 安装依赖（仅在线模式需要）
打开命令提示符，进入项目目录并安装所需依赖：
```bash
pip install -r requirements.txt
```

## 运行步骤

### 模式一：在线模式（推荐，获取最新数据）
1. （可选）手动更新数据（如需强制刷新数据时使用）：
   ```bash
   python crawler.py
   ```
   该命令会直接从维基获取最新数据并保存到`offline/songs.json`

2. 启动后端服务：
   ```bash
   python backend.py
   ```
   后端服务将运行在 http://127.0.0.1:5000
   *注：后端服务启动时会自动检查数据是否存在，如不存在将自动调用爬虫获取数据*

### 模式二：离线模式
1. 确保`offline`目录下存在`songs.json`文件（首次使用需通过在线模式获取）
2. 启动前端HTTP服务器：
   ```bash
   python -m http.server 8000 --directory Arcaea_Difficulty_Lookup
   ```
3. 打开浏览器访问：http://localhost:8000



3. 启动前端HTTP服务器（新命令窗口）：
   ```bash
   python -m http.server 8000
   ```
   前端服务将运行在 http://localhost:8000

3. 打开浏览器访问：http://localhost:8000

## 数据管理
- **数据爬取模块**：独立的`crawler.py`负责数据获取和更新，支持手动运行更新数据
- 在线模式下，应用会自动从维基获取最新数据并保存到`offline/songs.json`
- 离线模式下，应用将直接读取本地`offline/songs.json`文件
- 如需更新离线数据，只需启动在线模式一次即可刷新缓存

## 注意事项
- 端口占用时可更换端口号，例如：
  ```bash
  python -m http.server 8080  # 使用8080端口
  ```
- 关闭服务时，在命令提示符窗口按 Ctrl+C
- 首次使用若无离线数据，需先运行在线模式获取数据

## 数据来源
数据来源于Arcaea中文维基：<https://arcwiki.mcd.blue/>