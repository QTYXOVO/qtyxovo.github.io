document.addEventListener('DOMContentLoaded', () => {
    // 标签切换元素
    const pttTab = document.getElementById('ptt-tab');
    const worldTab = document.getElementById('world-tab');
    const pttCalculator = document.getElementById('ptt-calculator');
    const worldCalculator = document.getElementById('world-calculator');
    const pttFormula = document.getElementById('ptt-formula');
    const worldFormula = document.getElementById('world-formula');

    // 恢复保存的标签状态
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab === 'ptt') {
        pttTab.classList.add('active-tab');
        worldTab.classList.remove('active-tab');
        pttCalculator.classList.add('active-calculator');
        worldCalculator.classList.remove('active-calculator');
        pttFormula.classList.add('active-formula');
        worldFormula.classList.remove('active-formula');
    } else if (savedTab === 'world') {
        worldTab.classList.add('active-tab');
        pttTab.classList.remove('active-tab');
        worldCalculator.classList.add('active-calculator');
        pttCalculator.classList.remove('active-calculator');
        worldFormula.classList.add('active-formula');
        pttFormula.classList.remove('active-formula');
    } else {
        // 默认显示世界模式计算器
        worldTab.classList.add('active-tab');
        pttTab.classList.remove('active-tab');
        worldCalculator.classList.add('active-calculator');
        pttCalculator.classList.remove('active-calculator');
        worldFormula.classList.add('active-formula');
        pttFormula.classList.remove('active-formula');
    }

    // PTT计算器元素
    const scoreInput = document.getElementById('score-input');
    const difficultyInput = document.getElementById('difficulty-input');
    const calculatePttButton = document.getElementById('calculate-ptt-button');
    const pttResult = document.getElementById('ptt-result');

    // 世界模式计算器元素
    const potentialInput = document.getElementById('potential-input');
    const partnerStepInput = document.getElementById('partner-step-input');
    const partnerSkillInput = document.getElementById('partner-skill-input');
    const sourceEnhanceCheckbox = document.getElementById('source-enhance');
    const staminaCostSelect = document.getElementById('stamina-cost');
    const shardCostSelect = document.getElementById('shard-cost');
    const calculateWorldButton = document.getElementById('calculate-world-button');
    const worldResult = document.getElementById('world-result');

    // 标签切换功能
    pttTab.addEventListener('click', () => {
        pttTab.classList.add('active-tab');
        worldTab.classList.remove('active-tab');
        pttCalculator.classList.add('active-calculator');
        worldCalculator.classList.remove('active-calculator');
        pttFormula.classList.add('active-formula');
        worldFormula.classList.remove('active-formula');
        // 保存状态到localStorage
        localStorage.setItem('activeTab', 'ptt');
    });

    worldTab.addEventListener('click', () => {
        worldTab.classList.add('active-tab');
        pttTab.classList.remove('active-tab');
        worldCalculator.classList.add('active-calculator');
        pttCalculator.classList.remove('active-calculator');
        worldFormula.classList.add('active-formula');
        pttFormula.classList.remove('active-formula');
        // 保存状态到localStorage
        localStorage.setItem('activeTab', 'world');
    });

    // PTT计算功能
    calculatePttButton.addEventListener('click', () => {
        // 获取输入值
        const score = parseFloat(scoreInput.value);
        const difficulty = parseFloat(difficultyInput.value);

        // 验证输入
        if (isNaN(score) || isNaN(difficulty) || score < 0 || score > 10000000 || difficulty < 0) {
            alert('请输入有效的分数(0-10000000)和定数');
            return;
        }

        // 计算PTT
        let ptt;
        const clampedScore = Math.min(score, 10000000); // 分数超过10000000按10000000计算

        if (clampedScore >= 10000000) {
            ptt = difficulty + 2;
        } else if (clampedScore >= 9800000) {
            ptt = difficulty + 1 + (clampedScore - 9800000) / 200000;
        } else {
            ptt = difficulty + (clampedScore - 9500000) / 300000;
            ptt = Math.max(ptt, 0); // 确保下限为0
        }

        // 保留两位小数
        ptt = Math.round(ptt * 100) / 100;

        // 显示结果
        resultValue.textContent = ptt;
    });

    // 世界模式步数计算功能
    calculateWorldButton.addEventListener('click', () => {
        // 获取输入值
        const potential = parseFloat(potentialInput.value);
        const partnerStep = parseFloat(partnerStepInput.value);
        const partnerSkill = parseFloat(partnerSkillInput.value);
        const sourceEnhance = sourceEnhanceCheckbox.checked;
        const staminaMultiplier = parseFloat(staminaCostSelect.value);
        const shardMultiplier = parseFloat(shardCostSelect.value);

        // 验证输入
        if (isNaN(potential) || isNaN(partnerStep) || isNaN(partnerSkill) || potential < 0 || partnerStep < 0 || partnerSkill < 0) {
            alert('请输入有效的单曲潜力值、搭档Step值和搭档技能加成');
            return;
        }

        // 计算游玩结果
        const playResult = 2.5 + 2.45 * Math.sqrt(potential);

        // 计算搭档效果
        const partnerEffect = partnerStep / 50;

        // 计算基础进度
        let baseProgress = playResult * partnerEffect + partnerSkill;

        // 应用Play+加成
        let totalProgress = baseProgress * staminaMultiplier * shardMultiplier;

        // 应用源韵强化
        if (sourceEnhance) {
            totalProgress *= 4;
            // 提示用户源韵强化已使用
            alert('源韵强化已启用，本次结算步数×4！');
            // 关闭源韵强化
            sourceEnhanceCheckbox.checked = false;
        }

        // 保留两位小数
        totalProgress = Math.round(totalProgress * 100) / 100;

        // 显示结果
        worldResult.textContent = totalProgress;
    });

    // 添加回车键触发计算
    [scoreInput, difficultyInput].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                calculatePttButton.click();
            }
        });
    });

    [potentialInput, partnerStepInput, partnerSkillInput].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                calculateWorldButton.click();
            }
        });
    });

    // Play+机制联动 - 体力消耗和残片消耗
    staminaCostSelect.addEventListener('change', () => {
        // 如果选择了体力消耗大于0，则禁用源韵强化
        if (staminaCostSelect.value > 1) {
            sourceEnhanceCheckbox.disabled = true;
            sourceEnhanceCheckbox.checked = false;
        } else {
            sourceEnhanceCheckbox.disabled = false;
        }
    });

    // 恢复保存的源韵强化状态
    const savedSourceEnhance = localStorage.getItem('sourceEnhance');
    if (savedSourceEnhance !== null) {
        sourceEnhanceCheckbox.checked = savedSourceEnhance === 'true';
    }

    // 保存源韵强化状态到localStorage
    sourceEnhanceCheckbox.addEventListener('change', () => {
        localStorage.setItem('sourceEnhance', sourceEnhanceCheckbox.checked);
    });

    // 初始检查
    if (staminaCostSelect.value > 1) {
        sourceEnhanceCheckbox.disabled = true;
        // 如果禁用，确保状态为未选中
        sourceEnhanceCheckbox.checked = false;
        localStorage.setItem('sourceEnhance', 'false');
    }
});