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
    const importJsonInput = document.getElementById('import-json');
    const clearFormBtn = document.getElementById('clear-form');
    const clearAllBtn = document.getElementById('clear-all');
    const outputList = document.getElementById('output-list');
    const statusMessage = document.getElementById('status-message');
    const statusText = statusMessage.querySelector('.status-text');
    
    // 侧边栏相关元素
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const difficultySidebar = document.getElementById('difficulty-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // 难度类型映射
    const difficultyTypes = {
        0: { name: 'PST', badgeClass: 'difficulty-pst' },
        1: { name: 'PRS', badgeClass: 'difficulty-prs' },
        2: { name: 'FTR', badgeClass: 'difficulty-ftr' },
        3: { name: 'BYD', badgeClass: 'difficulty-byd' },
        4: { name: 'ETR', badgeClass: 'difficulty-etr' }
    };

    // 验证歌曲数据格式（根据example.txt中的要求，同时兼容songlist-example.json）
    function validateSong(song) {
        try {
            // 检查必需字段，但idx根据示例文件可以不存在
            // 如果idx不存在，会在导入时自动生成
            if (!song.id || typeof song.id !== 'string') return false; // id必须存在且为字符串
            if (!song.title_localized || typeof song.title_localized !== 'object') return false; // title_localized必须存在且为对象
            // artist可以是空字符串
            if (song.artist === undefined || typeof song.artist !== 'string') return false;
            // bpm可以是空字符串
            if (song.bpm === undefined || typeof song.bpm !== 'string') return false;
            // bpm_base可以是0
            if (song.bpm_base === undefined) return false;
            // set必须存在且为字符串
            if (!song.set || typeof song.set !== 'string') return false;
            // purchase可以是空字符串
            if (song.purchase === undefined || typeof song.purchase !== 'string') return false;
            // side必须存在（0, 1, 2, 3）
            if (song.side === undefined) return false;
            // bg必须存在且为字符串
            if (!song.bg || typeof song.bg !== 'string') return false;
            // date可以是0
            if (song.date === undefined) return false;
            // difficulties必须是数组且至少有一个元素
            if (!Array.isArray(song.difficulties) || song.difficulties.length === 0) return false;
            
            // 检查难度格式 - 只验证必需字段
            for (const diff of song.difficulties) {
                // ratingClass必须存在（0, 1, 2, 3, 4）
                if (diff.ratingClass === undefined) return false;
                // chartDesigner可以是空字符串
                if (diff.chartDesigner === undefined || typeof diff.chartDesigner !== 'string') return false;
                // jacketDesigner可以是空字符串
                if (diff.jacketDesigner === undefined || typeof diff.jacketDesigner !== 'string') return false;
                // rating可以是0
                if (diff.rating === undefined) return false;
            }
            
            // 所有必需字段验证通过
            return true;
        } catch (error) {
            console.error('验证歌曲时出错:', error);
            return false;
        }
    }
    
    // 导入JSON
    function importJson(file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                // 解析JSON
                const jsonData = JSON.parse(event.target.result);
                
                // 验证顶层数据格式
                if (!jsonData || typeof jsonData !== 'object') {
                    showStatus('JSON格式错误：不是有效的JSON对象', 'error');
                    return;
                }
                
                // 检查是否有songs数组
                if (!jsonData.songs || !Array.isArray(jsonData.songs)) {
                    // 尝试直接将JSON数据作为歌曲数组处理（支持简化格式）
                    if (Array.isArray(jsonData)) {
                        jsonData.songs = jsonData;
                    } else {
                        showStatus('JSON格式错误：缺少songs数组', 'error');
                        return;
                    }
                }
                
                // 验证每首歌曲的格式
                const validSongs = [];
                const invalidSongs = [];
                
                jsonData.songs.forEach((song, index) => {
                    if (validateSong(song)) {
                        // 深拷贝以避免引用问题
                        const songCopy = JSON.parse(JSON.stringify(song));
                        
                        // 自动生成idx字段（如果不存在）
                        if (songCopy.idx === undefined) {
                            // 生成一个唯一的idx值
                            // 考虑songList和已经导入的validSongs中的最大值
                            let maxIdx = 0;
                            
                            // 检查songList中的最大idx
                            if (songList.length > 0) {
                                maxIdx = songList.reduce((max, s) => s.idx > max ? s.idx : max, 0);
                            }
                            
                            // 检查已导入validSongs中的最大idx
                            if (validSongs.length > 0) {
                                const currentMax = validSongs.reduce((max, s) => s.idx && s.idx > max ? s.idx : max, 0);
                                maxIdx = Math.max(maxIdx, currentMax);
                            }
                            
                            // 生成新的idx
                            songCopy.idx = maxIdx + 1;
                        }
                        
                        validSongs.push(songCopy);
                    } else {
                        invalidSongs.push({
                            index: index,
                            song: song
                        });
                        console.error(`歌曲索引 ${index} 验证失败:`, song);
                    }
                });
                
                if (validSongs.length === 0) {
                    showStatus(`没有有效的歌曲数据。共 ${invalidSongs.length} 首歌曲验证失败。`, 'error');
                    return;
                }
                
                // 合并或替换现有歌曲
                if (confirm(`发现 ${validSongs.length} 首有效歌曲。是否要替换当前所有歌曲？点击取消将合并到当前列表。\n注意：${invalidSongs.length} 首歌曲因格式不符合要求被跳过。`)) {
                    songList = validSongs;
                    showStatus(`成功导入 ${validSongs.length} 首歌曲，已替换当前列表`, 'success');
                } else {
                    // 确保不添加重复歌曲（基于idx和id）
                    const existingIds = new Set(songList.map(s => `${s.idx}-${s.id}`));
                    const newSongs = validSongs.filter(s => !existingIds.has(`${s.idx}-${s.id}`));
                    
                    songList = [...songList, ...newSongs];
                    
                    if (newSongs.length < validSongs.length) {
                        showStatus(`成功导入 ${newSongs.length} 首新歌曲，${validSongs.length - newSongs.length} 首歌曲因已存在而跳过，已合并到当前列表`, 'info');
                    } else {
                        showStatus(`成功导入 ${validSongs.length} 首歌曲，已合并到当前列表`, 'success');
                    }
                }
                
                // 显示导入详情
                if (invalidSongs.length > 0) {
                    console.log('导入失败的歌曲详情:', invalidSongs);
                    showStatus(`导入完成！成功导入 ${validSongs.length} 首歌曲，${invalidSongs.length} 首歌曲因格式问题被跳过`, 'warning');
                }
                
                updateSongList();
            } catch (error) {
                console.error('JSON解析错误:', error);
                showStatus('JSON解析失败: ' + error.message, 'error');
            }
        };
        
        reader.onerror = function() {
            showStatus('文件读取失败，请检查文件是否可读', 'error');
        };
        
        reader.readAsText(file);
    }

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
        importJsonInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                importJson(this.files[0]);
                // 重置input以允许重新选择同一文件
                this.value = '';
            }
        });
        clearFormBtn.addEventListener('click', clearForm);
        clearAllBtn.addEventListener('click', clearAllSongs);
        
        // 侧边栏控制逻辑
        toggleSidebarBtn.addEventListener('click', function() {
            difficultySidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
            document.body.style.overflow = difficultySidebar.classList.contains('open') ? 'hidden' : 'auto';
        });
        
        sidebarOverlay.addEventListener('click', function() {
            difficultySidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
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
        
        // 监听屏幕大小变化，在调整为大屏幕时关闭侧边栏
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && difficultySidebar.classList.contains('open')) {
                difficultySidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
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
        document.getElementById('difficulty-jacket-override').checked = false;
        document.getElementById('difficulty-audio-override').checked = false;
        
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
        document.getElementById('difficulty-jacket-override').checked = difficulty.jacketOverride || false;
        document.getElementById('difficulty-audio-override').checked = difficulty.audioOverride || false;
        
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
        const jacketOverride = document.getElementById('difficulty-jacket-override').checked;
        const audioOverride = document.getElementById('difficulty-audio-override').checked;
        
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
            rating: rating  // 必须字段
        };
        
        // 可选字段，只有在为true时才包含
        if (ratingPlus) {
            difficultyData.ratingPlus = true;
        }
        if (legacy11) {
            difficultyData.legacy11 = true;
        }
        if (plusFingers) {
            difficultyData.plusFingers = true;
        }
        if (jacketOverride) {
            difficultyData.jacketOverride = true;
        }
        if (audioOverride) {
            difficultyData.audioOverride = true;
        }
        
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
            // 侧边栏版本的空状态提示 - 更简洁的文本和更小的图标
            outputList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music fa-2x text-gray-400"></i>
                    <p>暂无生成的歌曲</p>
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
            
            // 为侧边栏优化的歌曲项结构
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