document.addEventListener('DOMContentLoaded', function() {
    // 全局状态
    let currentDifficulties = [];
    let songList = [];
    let currentEditingDifficultyIndex = -1;
    let isDarkMode = false;

    // DOM元素
    const difficultyList = document.querySelector('.difficulty-list');
    const addDifficultyBtn = document.getElementById('add-difficulty');
    const difficultyModal = document.getElementById('difficulty-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveDifficultyBtn = document.getElementById('save-difficulty');
    const deleteDifficultyBtn = document.getElementById('delete-difficulty');
    const difficultyTypeSelect = document.getElementById('difficulty-type');
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
    const getCurrentTimestampBtn = document.getElementById('get-current-timestamp');
    const addSongBtn = document.getElementById('add-song');
    const exportJsonBtn = document.getElementById('export-json');
    const clearFormBtn = document.getElementById('clear-form');
    const clearAllBtn = document.getElementById('clear-all');
    const outputList = document.getElementById('output-list');
    const statusMessage = document.getElementById('status-message');
    const statusText = statusMessage.querySelector('.status-text');

    // 难度类型映射
    const difficultyTypes = {
        0: { name: 'PST', badgeClass: 'difficulty-pst' },
        1: { name: 'PRS', badgeClass: 'difficulty-prs' },
        2: { name: 'FTR', badgeClass: 'difficulty-ftr' },
        3: { name: 'BYD', badgeClass: 'difficulty-byd' },
        4: { name: 'ETR', badgeClass: 'difficulty-etr' }
    };

    // 初始化
    function init() {
        // 添加默认难度
        addDefaultDifficulties();
        updateDifficultyList();
        
        // 事件监听
        addDifficultyBtn.addEventListener('click', openAddDifficultyModal);
        closeModalBtn.addEventListener('click', closeDifficultyModal);
        saveDifficultyBtn.addEventListener('click', saveDifficulty);
        deleteDifficultyBtn.addEventListener('click', deleteDifficulty);
        toggleDarkModeBtn.addEventListener('click', toggleDarkMode);
        getCurrentTimestampBtn.addEventListener('click', setCurrentTimestamp);
        addSongBtn.addEventListener('click', addSong);
        exportJsonBtn.addEventListener('click', exportJson);
        clearFormBtn.addEventListener('click', clearForm);
        clearAllBtn.addEventListener('click', clearAllSongs);
        
        // 点击模态框背景关闭
        difficultyModal.addEventListener('click', function(e) {
            if (e.target === difficultyModal.querySelector('.modal-backdrop')) {
                closeDifficultyModal();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !difficultyModal.classList.contains('hidden')) {
                closeDifficultyModal();
            }
        });
    }

    // 添加默认难度
    function addDefaultDifficulties() {
        currentDifficulties.push({
            ratingClass: 0,  // 必须字段
            chartDesigner: "",  // 必须字段，如果为空则使用空字符串
            jacketDesigner: "",  // 必须字段，如果为空则使用空字符串
            rating: 0,  // 必须字段
            // 可选字段，使用默认值
            ratingPlus: false,
            legacy11: false,
            plusFingers: false,
            world_unlock: false
        });
        currentDifficulties.push({
            ratingClass: 1,  // 必须字段
            chartDesigner: "",  // 必须字段，如果为空则使用空字符串
            jacketDesigner: "",  // 必须字段，如果为空则使用空字符串
            rating: 0,  // 必须字段
            // 可选字段，使用默认值
            ratingPlus: false,
            legacy11: false,
            plusFingers: false,
            world_unlock: false
        });
        currentDifficulties.push({
            ratingClass: 2,  // 必须字段
            chartDesigner: "",  // 必须字段，如果为空则使用空字符串
            jacketDesigner: "",  // 必须字段，如果为空则使用空字符串
            rating: 0,  // 必须字段
            // 可选字段，使用默认值
            ratingPlus: false,
            legacy11: false,
            plusFingers: false,
            world_unlock: false
        });
    }

    // 更新难度列表
    function updateDifficultyList() {
        difficultyList.innerHTML = '';
        
        currentDifficulties.forEach((difficulty, index) => {
            const difficultyItem = document.createElement('div');
            difficultyItem.className = 'difficulty-item';
            difficultyItem.dataset.index = index;
            
            const typeInfo = difficultyTypes[difficulty.ratingClass];
            const ratingClass = typeInfo ? typeInfo.name : '未知';
            const ratingClassValue = difficulty.ratingClass;
            
            difficultyItem.innerHTML = `
                <div class="difficulty-item-header">
                    <span class="difficulty-name">
                        <span class="difficulty-type">${ratingClass}</span>
                    </span>
                    <span class="difficulty-rating ${difficulty.ratingPlus ? 'plus' : ''}">
                        ${difficulty.rating}
                    </span>
                </div>
                <div class="difficulty-details">
                    ${difficulty.chartDesigner ? `谱师: ${difficulty.chartDesigner}` : '未设置谱师'}
                </div>
            `;
            
            difficultyItem.addEventListener('click', function() {
                openEditDifficultyModal(index);
            });
            
            difficultyList.appendChild(difficultyItem);
        });
    }

    // 打开添加难度模态框
    function openAddDifficultyModal() {
        currentEditingDifficultyIndex = -1;
        document.getElementById('modal-title').textContent = '添加难度';
        deleteDifficultyBtn.classList.add('hidden');
        
        // 重置表单
        document.getElementById('difficulty-type').value = '0';
        document.getElementById('difficulty-rating').value = '0';
        document.getElementById('chart-designer').value = '';
        document.getElementById('jacket-designer').value = '';
        document.getElementById('difficulty-rating-plus').checked = false;
        document.getElementById('difficulty-legacy11').checked = false;
        document.getElementById('difficulty-plus-fingers').checked = false;
        
        difficultyModal.classList.remove('hidden');
        document.getElementById('difficulty-rating').focus();
    }

    // 打开编辑难度模态框
    function openEditDifficultyModal(index) {
        currentEditingDifficultyIndex = index;
        const difficulty = currentDifficulties[index];
        
        document.getElementById('modal-title').textContent = '编辑难度';
        deleteDifficultyBtn.classList.remove('hidden');
        
        // 填充表单
        document.getElementById('difficulty-type').value = difficulty.ratingClass;
        document.getElementById('difficulty-rating').value = difficulty.rating;
        document.getElementById('chart-designer').value = difficulty.chartDesigner || '';
        document.getElementById('jacket-designer').value = difficulty.jacketDesigner || '';
        document.getElementById('difficulty-rating-plus').checked = difficulty.ratingPlus || false;
        document.getElementById('difficulty-legacy11').checked = difficulty.legacy11 || false;
        document.getElementById('difficulty-plus-fingers').checked = difficulty.plusFingers || false;
        
        difficultyModal.classList.remove('hidden');
        document.getElementById('difficulty-rating').focus();
    }

    // 关闭难度模态框
    function closeDifficultyModal() {
        difficultyModal.classList.add('hidden');
        currentEditingDifficultyIndex = -1;
    }

    // 保存难度
    function saveDifficulty() {
        const difficultyType = parseInt(document.getElementById('difficulty-type').value);
        const rating = parseInt(document.getElementById('difficulty-rating').value);
        const chartDesigner = document.getElementById('chart-designer').value.trim();
        const jacketDesigner = document.getElementById('jacket-designer').value.trim();
        const ratingPlus = document.getElementById('difficulty-rating-plus').checked;
        const legacy11 = document.getElementById('difficulty-legacy11').checked;
        const plusFingers = document.getElementById('difficulty-plus-fingers').checked;
        
        // 验证
        if (isNaN(rating) || rating < 0 || rating > 15) {
            showStatus('难度等级必须在0-15之间', 'error');
            return;
        }
        
        // 构建难度数据 - 只包含example.txt中定义的必须字段
        const difficultyData = {
            ratingClass: difficultyType,  // 必须字段
            chartDesigner: chartDesigner || "",  // 必须字段，如果为空则使用空字符串
            jacketDesigner: jacketDesigner || "",  // 必须字段，如果为空则使用空字符串
            rating: rating,  // 必须字段
            // 以下为可选字段，只有在为true时才包含
            ratingPlus: ratingPlus,
            legacy11: legacy11,
            plusFingers: plusFingers
        };
        
        if (currentEditingDifficultyIndex === -1) {
            // 检查是否已存在相同类型的难度
            const exists = currentDifficulties.some(d => d.ratingClass === difficultyType);
            if (exists) {
                showStatus('已存在相同类型的难度', 'error');
                return;
            }
            currentDifficulties.push(difficultyData);
        } else {
            // 检查是否修改了类型并且该类型已存在
            const oldType = currentDifficulties[currentEditingDifficultyIndex].ratingClass;
            if (oldType !== difficultyType && currentDifficulties.some((d, i) => i !== currentEditingDifficultyIndex && d.ratingClass === difficultyType)) {
                showStatus('已存在相同类型的难度', 'error');
                return;
            }
            currentDifficulties[currentEditingDifficultyIndex] = difficultyData;
        }
        
        updateDifficultyList();
        closeDifficultyModal();
        showStatus('难度保存成功', 'success');
    }

    // 删除难度
    function deleteDifficulty() {
        if (currentEditingDifficultyIndex !== -1) {
            if (currentDifficulties.length <= 1) {
                showStatus('至少需要保留一个难度', 'error');
                return;
            }
            
            currentDifficulties.splice(currentEditingDifficultyIndex, 1);
            updateDifficultyList();
            closeDifficultyModal();
            showStatus('难度删除成功', 'success');
        }
    }

    // 切换暗黑模式
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        
        const icon = toggleDarkModeBtn.querySelector('i');
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        
        // 保存设置到localStorage
        localStorage.setItem('isDarkMode', isDarkMode);
    }

    // 设置当前时间戳
    function setCurrentTimestamp() {
        const timestamp = Math.floor(Date.now() / 1000);
        document.getElementById('date').value = timestamp;
        showStatus('已设置当前时间戳', 'success');
    }

    // 添加歌曲
    function addSong() {
        // 获取example.txt中定义的必须字段
        const idx = document.getElementById('idx').value.trim();
        const id = document.getElementById('id').value.trim();
        const set = document.getElementById('set').value.trim();
        const purchase = document.getElementById('purchase').value.trim();
        const side = document.getElementById('side').value;
        const bg = document.getElementById('bg').value.trim();
        const date = document.getElementById('date').value.trim();
        const artist = document.getElementById('artist').value.trim();
        const bpm = document.getElementById('bpm').value.trim();
        const bpmBase = document.getElementById('bpm-base').value.trim();
        
        // 获取多语言曲名
        const titleEn = document.getElementById('title-en').value.trim();
        const titleJa = document.getElementById('title-ja').value.trim();
        const titleZhHans = document.getElementById('title-zh-hans').value.trim();
        const titleZhHant = document.getElementById('title-zh-hant').value.trim();
        
        // 验证数据 - 所有字段格式验证
        if (idx && !/^\d+$/.test(idx)) {
            showStatus('索引必须是整数', 'error');
            return;
        }
        
        if (id && !/^[\x20-\x7E]+$/.test(id)) {
            showStatus('歌曲ID只能使用ASCII字符', 'error');
            return;
        }
        
        if (bg && !/^[\x20-\x7E]+$/.test(bg)) {
            showStatus('背景文件名只能使用ASCII字符', 'error');
            return;
        }
        
        if (date && !/^\d+$/.test(date)) {
            showStatus('时间戳必须是整数', 'error');
            return;
        }
        
        if (bpmBase && !/^\d*(\.\d+)?$/.test(bpmBase)) {
            showStatus('基准BPM必须是数字', 'error');
            return;
        }
        
        // 构建曲名对象
        const titleLocalized = {};
        if (titleEn) titleLocalized.en = titleEn;
        if (titleJa) titleLocalized.ja = titleJa;
        if (titleZhHans) titleLocalized['zh-Hans'] = titleZhHans;
        if (titleZhHant) titleLocalized['zh-Hant'] = titleZhHant;
        
        // 获取可选字段
        const category = document.getElementById('category').value;
        const version = document.getElementById('version').value.trim();
        const audioPreview = document.getElementById('audio-preview').value.trim();
        const audioPreviewEnd = document.getElementById('audio-preview-end').value.trim();
        const worldUnlock = document.getElementById('world-unlock').checked;
        const remoteDl = document.getElementById('remote-dl').checked;
        const bydLocalUnlock = document.getElementById('byd-local-unlock').checked;
        const songlistHidden = document.getElementById('songlist-hidden').checked;
        const noPp = document.getElementById('no-pp').checked;
        const noStream = document.getElementById('no-stream').checked;
        const bgInverse = document.getElementById('bg-inverse').value.trim();
        const sourceLocalizedEn = document.getElementById('source-localized-en').value.trim();
        const sourceCopyright = document.getElementById('source-copyright').value.trim();
        
        // 构建歌曲对象 - 只包含example.txt中定义的必须字段
        const songData = {
            idx: idx ? parseInt(idx) : 0,  // 如果为空，设置默认值
            id: id || "",
            title_localized: Object.keys(titleLocalized).length > 0 ? titleLocalized : { en: "" },
            artist: artist || "",
            bpm: bpm || "",
            bpm_base: bpmBase ? parseFloat(bpmBase) : 0,
            set: set || "",
            purchase: purchase || "",
            side: parseInt(side),
            bg: bg || "",
            date: date ? parseInt(date) : 0,
            difficulties: [...currentDifficulties]
        };
        
        // 添加可选字段（如果用户填写了）
        if (category) songData.category = category;
        if (version) songData.version = version;
        if (audioPreview) songData.audioPreview = parseInt(audioPreview);
        if (audioPreviewEnd) songData.audioPreviewEnd = parseInt(audioPreviewEnd);
        if (worldUnlock) songData.world_unlock = true;
        if (remoteDl) songData.remote_dl = true;
        if (bydLocalUnlock) songData.byd_local_unlock = true;
        if (songlistHidden) songData.songlist_hidden = true;
        if (noPp) songData.no_pp = true;
        if (noStream) songData.no_stream = true;
        if (bgInverse) songData.bg_inverse = bgInverse;
        
        // 添加出处信息
        if (sourceLocalizedEn) {
            songData.source_localized = { en: sourceLocalizedEn };
            if (sourceCopyright) {
                songData.source_copyright = sourceCopyright;
            }
        }
        
        // 添加到歌曲列表
        songList.push(songData);
        updateSongList();
        
        showStatus('歌曲添加成功', 'success');
    }

    // 更新歌曲列表
    function updateSongList() {
        if (songList.length === 0) {
            outputList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music fa-4x text-gray-400"></i>
                    <p>暂无生成的歌曲，请填写表单并点击"添加歌曲"</p>
                </div>
            `;
            return;
        }
        
        outputList.innerHTML = '';
        
        songList.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            
            // 获取曲名（优先使用英文）
            const title = song.title_localized.en || Object.values(song.title_localized)[0] || '未命名歌曲';
            
            songItem.innerHTML = `
                <div class="song-header">
                    <div>
                        <div class="song-title">${title}</div>
                        <div class="song-id">ID: ${song.id}</div>
                    </div>
                    <div class="song-actions">
                        <button class="btn btn-icon btn-secondary edit-song" data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon btn-danger delete-song" data-index="${index}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="song-details">
                    <div class="detail-item">
                        <span class="detail-label">索引:</span>
                        <span class="detail-value">${song.idx}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">艺术家:</span>
                        <span class="detail-value">${song.artist}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">曲包:</span>
                        <span class="detail-value">${song.set}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">BPM:</span>
                        <span class="detail-value">${song.bpm}</span>
                    </div>
                </div>
                <div class="song-difficulties">
                    ${song.difficulties.map(diff => {
                        const typeInfo = difficultyTypes[diff.ratingClass];
                        return `<span class="difficulty-badge ${typeInfo.badgeClass}">${typeInfo.name} ${diff.rating}${diff.ratingPlus ? '+' : ''}</span>`;
                    }).join('')}
                </div>
            `;
            
            outputList.appendChild(songItem);
        });
        
        // 添加编辑和删除按钮事件
        document.querySelectorAll('.edit-song').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                editSong(index);
            });
        });
        
        document.querySelectorAll('.delete-song').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                deleteSong(index);
            });
        });
    }

    // 编辑歌曲
    function editSong(index) {
        const song = songList[index];
        
        // 填充表单
        document.getElementById('idx').value = song.idx;
        document.getElementById('id').value = song.id;
        document.getElementById('set').value = song.set;
        document.getElementById('purchase').value = song.purchase;
        document.getElementById('side').value = song.side;
        document.getElementById('bg').value = song.bg;
        document.getElementById('date').value = song.date;
        document.getElementById('artist').value = song.artist;
        document.getElementById('bpm').value = song.bpm;
        document.getElementById('bpm-base').value = song.bpm_base;
        
        // 填充多语言曲名
        document.getElementById('title-en').value = song.title_localized.en || '';
        document.getElementById('title-ja').value = song.title_localized.ja || '';
        document.getElementById('title-zh-hans').value = song.title_localized['zh-Hans'] || '';
        document.getElementById('title-zh-hant').value = song.title_localized['zh-Hant'] || '';
        
        // 填充可选字段
        document.getElementById('category').value = song.category || '';
        document.getElementById('version').value = song.version || '';
        document.getElementById('audio-preview').value = song.audioPreview || '';
        document.getElementById('audio-preview-end').value = song.audioPreviewEnd || '';
        document.getElementById('world-unlock').checked = song.world_unlock || false;
        document.getElementById('remote-dl').checked = song.remote_dl || false;
        document.getElementById('byd-local-unlock').checked = song.byd_local_unlock || false;
        document.getElementById('songlist-hidden').checked = song.songlist_hidden || false;
        document.getElementById('no-pp').checked = song.no_pp || false;
        document.getElementById('no-stream').checked = song.no_stream || false;
        document.getElementById('bg-inverse').value = song.bg_inverse || '';
        
        // 填充出处信息
        if (song.source_localized) {
            document.getElementById('source-localized-en').value = song.source_localized.en || '';
        }
        document.getElementById('source-copyright').value = song.source_copyright || '';
        
        // 更新当前难度
        currentDifficulties = [...song.difficulties];
        updateDifficultyList();
        
        // 删除原歌曲
        songList.splice(index, 1);
        updateSongList();
        
        // 滚动到表单顶部
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        
        showStatus('已加载歌曲进行编辑', 'info');
    }

    // 删除歌曲
    function deleteSong(index) {
        if (confirm('确定要删除这首歌曲吗？')) {
            songList.splice(index, 1);
            updateSongList();
            showStatus('歌曲删除成功', 'success');
        }
    }

    // 导出JSON
    function exportJson() {
        if (songList.length === 0) {
            showStatus('没有可导出的歌曲', 'error');
            return;
        }
        
        const jsonData = {
            songs: songList
        };
        
        try {
            const jsonString = JSON.stringify(jsonData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'songlist.json';
            a.click();
            URL.revokeObjectURL(url);
            
            showStatus('JSON导出成功', 'success');
        } catch (error) {
            showStatus('JSON导出失败: ' + error.message, 'error');
        }
    }

    // 清空表单
    function clearForm() {
        if (confirm('确定要清空表单吗？')) {
            // 清空必填字段
            document.getElementById('idx').value = '';
            document.getElementById('id').value = '';
            document.getElementById('set').value = '';
            document.getElementById('purchase').value = '';
            document.getElementById('side').value = '0';
            document.getElementById('bg').value = '';
            document.getElementById('date').value = '';
            document.getElementById('artist').value = '';
            document.getElementById('bpm').value = '';
            document.getElementById('bpm-base').value = '';
            
            // 清空多语言曲名
            document.getElementById('title-en').value = '';
            document.getElementById('title-ja').value = '';
            document.getElementById('title-zh-hans').value = '';
            document.getElementById('title-zh-hant').value = '';
            
            // 清空可选字段
            document.getElementById('category').value = '';
            document.getElementById('version').value = '';
            document.getElementById('audio-preview').value = '';
            document.getElementById('audio-preview-end').value = '';
            document.getElementById('world-unlock').checked = false;
            document.getElementById('remote-dl').checked = false;
            document.getElementById('byd-local-unlock').checked = false;
            document.getElementById('songlist-hidden').checked = false;
            document.getElementById('no-pp').checked = false;
            document.getElementById('no-stream').checked = false;
            document.getElementById('bg-inverse').value = '';
            document.getElementById('source-localized-en').value = '';
            document.getElementById('source-copyright').value = '';
            
            // 重置难度
            currentDifficulties = [];
            addDefaultDifficulties();
            updateDifficultyList();
            
            showStatus('表单已清空', 'success');
        }
    }

    // 清空所有歌曲
    function clearAllSongs() {
        if (songList.length === 0) {
            showStatus('没有可清空的歌曲', 'info');
            return;
        }
        
        if (confirm('确定要清空所有歌曲吗？此操作不可恢复。')) {
            songList = [];
            updateSongList();
            showStatus('所有歌曲已清空', 'success');
        }
    }

    // 显示状态消息
    function showStatus(message, type = 'info') {
        statusText.textContent = message;
        statusMessage.className = 'status ' + type;
        statusMessage.classList.remove('hidden');
        
        // 3秒后自动隐藏
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 3000);
    }

    // 从localStorage加载设置
    function loadSettings() {
        const savedDarkMode = localStorage.getItem('isDarkMode');
        if (savedDarkMode === 'true') {
            isDarkMode = true;
            document.body.classList.add('dark-mode');
            const icon = toggleDarkModeBtn.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // 初始化应用
    loadSettings();
    init();
});