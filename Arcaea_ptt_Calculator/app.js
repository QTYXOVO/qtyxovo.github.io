document.addEventListener('DOMContentLoaded', () => {
    const scoreInput = document.getElementById('score-input');
    const difficultyInput = document.getElementById('difficulty-input');
    const calculateButton = document.getElementById('calculate-button');
    const resultValue = document.getElementById('result-value');

    calculateButton.addEventListener('click', () => {
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

    // 添加回车键触发计算
    [scoreInput, difficultyInput].forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                calculateButton.click();
            }
        });
    });
});