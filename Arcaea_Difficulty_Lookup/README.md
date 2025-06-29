# Arcaea Difficulty Lookup 运行指南

## 项目介绍
Arcaea Difficulty Lookup是一个用于查询Arcaea歌曲难度数据的Web应用，前端基于HTML/CSS/JavaScript，后端使用Flask提供API服务。

## 环境要求
- Python 3.6+ 
- 现代浏览器（Chrome, Firefox, Edge等）

## 安装步骤

### 1. 克隆或下载项目
将项目文件保存到本地目录

### 2. 安装依赖
打开命令提示符，进入项目目录并安装所需依赖：
```bash
pip install -r requirements.txt
```

## 运行步骤

### 1. 启动后端服务
在项目目录下执行以下命令启动Flask后端：
```bash
python backend.py
```
后端服务将运行在 http://127.0.0.1:5000

### 2. 启动前端HTTP服务器
打开新的命令提示符窗口，进入项目目录并启动HTTP服务器：
```bash
python -m http.server 8000
```
前端服务将运行在 http://localhost:8000

### 3. 访问应用
打开浏览器，访问以下地址即可使用应用：
http://localhost:8000

## 注意事项
- 确保后端服务和前端服务器都已启动
- 如果端口8000或5000被占用，可以更换端口号，例如：
  ```bash
  python -m http.server 8080  # 使用8080端口
  ```
- 关闭应用时，在命令提示符窗口按 Ctrl+C 停止服务

## 数据来源
数据来源于Arcaea中文维基：<https://arcwiki.mcd.blue/>