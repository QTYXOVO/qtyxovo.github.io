import requests
from bs4 import BeautifulSoup
import os
import re
import json
from urllib.parse import urljoin
import time
from typing import Optional, Dict, Any

# 配置常量
BASE_URL = 'https://arcwiki.mcd.blue/%E6%9B%B2%E7%9B%AE%E5%88%97%E8%A1%A8'
SAVE_DIR = os.path.join(os.path.dirname(__file__), 'images')
METADATA_FILE = os.path.join(os.path.dirname(__file__), 'image_metadata.json')
REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
REQUEST_DELAY = 1  # 请求延迟(秒)
MIN_COVER_SIZE = 50  # 封面图片最小尺寸
CHECK_FOR_UPDATES = True  # 是否检查更新


def get_original_image_url(img_tag: BeautifulSoup) -> Optional[str]:
    """
    从img标签提取原始图片URL
    
    参数:
        img_tag: BeautifulSoup img标签对象
    
    返回:
        原始图片URL或None
    """
    if 'src' not in img_tag.attrs:
        return None
        
    src = img_tag['src']
    # 转换缩略图URL为原始URL (格式: /images/thumb/a/ab/xxx.jpg/100px-xxx.jpg -> /images/a/ab/xxx.jpg)
    # 改进URL转换逻辑，处理更多情况
    match = re.match(r'/images/thumb/(.*?)/\d+px-[^/]+$', src)
    if match:
        return f'/images/{match.group(1)}'
    # 直接匹配原始图片URL格式
    match = re.match(r'/images/[0-9a-f]/[0-9a-f][0-9a-f]/[^/]+\.(jpg|png)$', src)
    if match:
        return src
    return None


def is_valid_cover(img_tag: BeautifulSoup) -> bool:
    """
    验证是否为有效的曲目封面图片
    
    参数:
        img_tag: BeautifulSoup img标签对象
    
    返回:
        是否为有效封面的布尔值
    """
    if not img_tag or 'alt' not in img_tag.attrs:
        return False
        
    # 检查尺寸
    width = int(img_tag.get('width', 0))
    height = int(img_tag.get('height', 0))
    size_ok = width >= MIN_COVER_SIZE or height >= MIN_COVER_SIZE
    
    # 检查alt文本
    alt_text = img_tag['alt']
    text_ok = ('Songs ' in alt_text or '曲目' in alt_text) and 'Icon' not in alt_text
    
    return size_ok and text_ok


def sanitize_filename(title: str) -> str:
    """清理文件名中的非法字符"""
    # 先移除所有扩展名
    name, _ = os.path.splitext(title)
    # 清理非法字符并添加.jpg
    return re.sub(r'[\\/:*?"<>|]', '_', name) + '.jpg'


def load_metadata() -> Dict[str, Dict[str, Any]]:
    """加载图片元数据"""
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f'加载元数据失败: {str(e)}')
    return {}


def save_metadata(metadata: Dict[str, Dict[str, Any]]) -> None:
    """保存图片元数据"""
    try:
        with open(METADATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'保存元数据失败: {str(e)}')


def download_image(url: str, save_path: str, metadata: Dict[str, Dict[str, Any]]) -> bool:
    """下载并保存图片，支持增量更新检查"""
    try:
        # 仅检查文件名是否存在
        if os.path.exists(save_path):
            print(f'文件已存在，跳过下载: {os.path.basename(save_path)}')
            return False
        response = requests.get(url, headers=REQUEST_HEADERS, stream=True)

        response.raise_for_status()

        # 保存图片
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # 更新元数据
        # 存储相对路径而非绝对路径
        filename = os.path.basename(save_path)
        relative_path = filename
        metadata[url] = {
            'local_path': relative_path,
            'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
        }

        return True
    except Exception as e:
        print(f'下载失败: {url} - {str(e)}')
        return False


def extract_song_title(cell: BeautifulSoup) -> str:
    """从表格单元格提取歌曲标题"""
    title_text = cell.get_text(strip=True)
    title_parts = [t for t in title_text.split('\n') if t.strip()]
    return title_parts[0] if title_parts else f'unknown_{int(time.time())}'


def crawl_song_images() -> None:
    """爬取曲目封面图片主函数"""
    # 创建保存目录
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    # 加载现有元数据
    metadata = load_metadata()
    
    try:
        # 获取页面内容
        response = requests.get(BASE_URL, headers=REQUEST_HEADERS)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        # 定位曲目表格
        table = soup.find('table', class_='wikitable')
        if not table:
            print('错误: 未找到曲目表格')
            return

        # 处理表格行
        for row in table.find_all('tr')[1:]:  # 跳过表头
            try:
                cells = row.find_all('td')
                if len(cells) < 4:
                    continue
                    
                # 封面图片在第2列
                img_cell = cells[1]
                img_tag = img_cell.find('img')
                
                # 验证封面图片
                if not img_tag or not is_valid_cover(img_tag):
                    continue
                    
                # 获取原始图片URL
                original_url = get_original_image_url(img_tag)
                if not original_url:
                    continue
                    
                full_url = urljoin(BASE_URL, original_url)
                
                # 从URL提取原始文件名
                # 移除URL中的现有扩展名，确保只添加一个.jpg
                original_basename = os.path.basename(original_url)
                name, _ = os.path.splitext(original_basename)
                filename = sanitize_filename(f"{name}.jpg")
                save_path = os.path.join(SAVE_DIR, filename)
                
                # 检查是否需要下载/更新
                if os.path.exists(save_path) and CHECK_FOR_UPDATES and full_url in metadata:
                    # 已存在且有元数据，通过download_image检查更新
                    print(f'检查更新: {filename}')
                    if download_image(full_url, save_path, metadata):
                        time.sleep(REQUEST_DELAY)
                elif not os.path.exists(save_path):
                    # 新文件，直接下载
                    print(f'正在下载: {filename}')
                    if download_image(full_url, save_path, metadata):
                        time.sleep(REQUEST_DELAY)
                else:
                    # 已存在但无元数据，视为新文件下载
                    print(f'元数据缺失，重新下载: {filename}')
                    if download_image(full_url, save_path, metadata):
                        time.sleep(REQUEST_DELAY)
                
            except Exception as e:
                print(f'处理行出错: {str(e)}')
                continue

        # 保存更新后的元数据
        save_metadata(metadata)
        print('图片爬取完成')
        
    except Exception as e:
        print(f'爬取失败: {str(e)}')
        # 即使出错也保存已获取的元数据
        save_metadata(metadata)


if __name__ == '__main__':
    crawl_song_images()