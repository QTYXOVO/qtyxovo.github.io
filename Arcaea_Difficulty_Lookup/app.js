// 从后端API获取歌曲数据
let songData = [];
let lastUpdated = null;
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading';
loadingIndicator.innerHTML = `<div class="spinner"></div><p>加载数据中...</p>`;

document.querySelector('.container').insertBefore(loadingIndicator, document.querySelector('.search-container'));

// 获取歌曲数据
async function fetchSongData() {
    try {
        // 后端API地址，部署服务器需要修改
        const response = await fetch('http://127.0.0.1:5000/api/songs');
        if (!response.ok) throw new Error('网络响应不正常');
        const data = await response.json();
        songData = data.songs || [];
        lastUpdated = data.last_updated;
        loadingIndicator.style.display = 'none';
        renderResults(songData);
        updateLastUpdatedDisplay();
    } catch (error) {
        console.error('API请求失败，尝试加载本地数据:', error);
        try {
            // 尝试加载本地JSON文件
            const localResponse = await fetch('offline/songs.json');
            if (!localResponse.ok) throw new Error('本地文件不存在或无法访问');
            const localData = await localResponse.json();
            songData = Array.isArray(localData) ? localData : (localData.songs || []);
            lastUpdated = Array.isArray(localData) ? null : localData.last_updated;
            loadingIndicator.style.display = 'none';
            renderResults(songData);
            updateLastUpdatedDisplay();
        } catch (localError) {
            console.error('本地数据加载失败:', localError);
            loadingIndicator.innerHTML = `<p>加载失败，请确保后端服务已启动或本地数据文件存在</p>`;
        }
    }
}

// 关于按钮弹窗逻辑
const modal = document.getElementById('about-modal');
const closeButton = document.querySelector('.close-button');

// 打开弹窗
document.getElementById('about-button').addEventListener('click', () => {
    modal.style.display = 'block';
});

// 关闭按钮关闭弹窗
closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

// 点击弹窗外部关闭弹窗
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// 暗黑模式切换逻辑
const themeToggle = document.getElementById('theme-toggle');

// 检查本地存储中的主题偏好
if (localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark-mode');
    themeToggle.textContent = '切换亮色模式';
} else {
    document.documentElement.classList.remove('dark-mode');
    themeToggle.textContent = '切换暗黑模式';
}

// 主题切换按钮事件监听
themeToggle.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark-mode')) {
        document.documentElement.classList.remove('dark-mode');
        themeToggle.textContent = '切换暗黑模式';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark-mode');
        themeToggle.textContent = '切换亮色模式';
        localStorage.setItem('theme', 'dark');
    }
});

// 页面加载时获取数据
fetchSongData();

// DOM元素
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortDifficultySelect = document.getElementById('sort-difficulty');
const sortDirectionSelect = document.getElementById('sort-direction');
const resultsBody = document.getElementById('results-body');
const noResults = document.getElementById('no-results');

// 初始化页面 - 显示所有歌曲
renderResults(songData);

// 搜索按钮点击事件
searchButton.addEventListener('click', performSearch);

// 回车键触发搜索
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

sortDifficultySelect.addEventListener('change', performSearch);
sortDirectionSelect.addEventListener('change', performSearch);

// 执行搜索
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const sortDifficulty = sortDifficultySelect.value;
    const sortDirection = sortDirectionSelect.value;

    // 过滤歌曲
    const filteredSongs = songData.filter(song => {
        // 检查歌曲名称是否匹配搜索词
        const nameMatches = song.name.toLowerCase().includes(searchTerm);
        return nameMatches;
    });

    // 排序歌曲
    let sortedSongs = [...filteredSongs]; // 始终创建一个副本
    if (sortDifficulty !== 'none') {
        // 只对所选难度有值的歌曲进行排序
        sortedSongs = filteredSongs.filter(song => {
            return song.difficulties[sortDifficulty] !== '' && !isNaN(parseFloat(song.difficulties[sortDifficulty]));
        }).sort((a, b) => {
            // 获取两个歌曲的难度值
            const aValue = parseFloat(a.difficulties[sortDifficulty]);
            const bValue = parseFloat(b.difficulties[sortDifficulty]);

            // 根据排序方向返回比较结果
            if (sortDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }

    renderResults(sortedSongs);
}

// 渲染搜索结果
function renderResults(songs) {
    // 清空之前的结果
    resultsBody.innerHTML = '';

    // 显示或隐藏无结果提示
    if (songs.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }

    // 创建表格行
    songs.forEach(song => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${song.name}</td>
            <td>${formatDifficulty('PST', song.difficulties.PST)}</td>
            <td>${formatDifficulty('PRS', song.difficulties.PRS)}</td>
            <td>${formatDifficulty('FTR', song.difficulties.FTR)}</td>
            <td>${formatDifficulty('BYD', song.difficulties.BYD)}</td>
            <td>${formatDifficulty('ETR', song.difficulties.ETR)}</td>
        `;
        resultsBody.appendChild(row);
    });
}

// 格式化难度显示
function formatDifficulty(difficulty, value) {
    if (!value) return '-';
    return `<span class="difficulty-${difficulty.toLowerCase()}">${value}</span>`;}

// 添加数据更新时间显示
function updateLastUpdatedDisplay() {
    let updateElement = document.getElementById('data-update-time');
    if (!updateElement) {
        updateElement = document.createElement('div');
        updateElement.id = 'data-update-time';
        updateElement.className = 'update-time';
        document.querySelector('.container').insertBefore(updateElement, document.querySelector('.search-container'));
    }
    if (lastUpdated) {
        const date = new Date(lastUpdated);
        updateElement.textContent = `离线数据最后更新: ${date.toLocaleString()}`;
    } else {
        updateElement.textContent = '离线数据最后更新: 未知';
    }
}