// 从后端API获取歌曲数据
let songData = [];
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading';
loadingIndicator.innerHTML = `<div class="spinner"></div><p>加载数据中...</p>`;

document.querySelector('.container').insertBefore(loadingIndicator, document.querySelector('.search-container'));

// 获取歌曲数据
async function fetchSongData() {
    try {
        // 尝试连接后端API
        const response = await fetch('http://127.0.0.1:5000/api/songs');
        if (!response.ok) throw new Error('网络响应不正常');
        songData = await response.json();
        loadingIndicator.style.display = 'none';
        renderResults(songData); // 初始显示所有歌曲
    } catch (error) {
        console.error('API请求失败，尝试加载本地数据:', error);
        try {
            // 尝试加载本地JSON文件
            const localResponse = await fetch('offline/songs.json');
            if (!localResponse.ok) throw new Error('本地文件不存在或无法访问');
            songData = await localResponse.json();
            loadingIndicator.style.display = 'none';
            renderResults(songData);
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

// 页面加载时获取数据
fetchSongData();

// DOM元素
const searchInput = document.getElementById('search-input');
const difficultySelect = document.getElementById('difficulty-select');
const searchButton = document.getElementById('search-button');
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

difficultySelect.addEventListener('change', performSearch);

// 执行搜索
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedDifficulty = difficultySelect.value;

    // 过滤歌曲
    const filteredSongs = songData.filter(song => {
        // 检查歌曲名称是否匹配搜索词
        const nameMatches = song.name.toLowerCase().includes(searchTerm);

        // 检查难度是否匹配
        if (selectedDifficulty === 'all') {
            return nameMatches;
        } else {
            // 只返回选择的难度有值的歌曲
            return nameMatches && song.difficulties[selectedDifficulty] !== '';
        }
    });

    renderResults(filteredSongs);
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