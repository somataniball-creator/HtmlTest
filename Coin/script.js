// 全局变量
const coin = document.getElementById('coin');
const result = document.getElementById('result');
const clearBtn = document.getElementById('clearBtn');
const historyList = document.getElementById('historyList');
const frontTextInput = document.getElementById('frontText');
const backTextInput = document.getElementById('backText');
// const themeToggle = document.getElementById('themeToggle'); // 主题切换已注释
const coinContainer = document.getElementById('coinContainer');
const flipSound = document.getElementById('flipSound');

// 弹窗相关元素
const historyEntryBtn = document.getElementById('historyEntryBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');

let isFlipping = false;
let flipCount = 0;
let history = [];

// 主题切换功能已注释，只保留深色模式
// let currentTheme = localStorage.getItem('theme') || 'light';
// document.documentElement.setAttribute('data-theme', currentTheme);
// updateThemeIcon();

// 自定义音效（简化版，实际使用可替换为完整音频）
function playFlipSound() {
    try {
        flipSound.play().catch(e => console.log("音效播放失败:", e));
    } catch (e) {
        // 静默失败
    }
}

// 打开弹窗
function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭弹窗
function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// 抛硬币核心函数
function flipCoin() {
    if (isFlipping) return;
    isFlipping = true;
    
    // 播放音效
    playFlipSound();
    
    // 重置结果显示（如果元素存在）
    if (result) {
        result.textContent = "抛掷中...";
    }
    
    // 获取当前硬币的旋转角度
    const currentTransform = window.getComputedStyle(coin).getPropertyValue('transform');
    let currentRotation = 0;
    
    // 解析当前旋转角度
    if (currentTransform && currentTransform !== 'none') {
        const values = currentTransform.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        currentRotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }
    
    // 随机决定正反面
    const isHeads = Math.random() < 0.5;
    const targetRotation = isHeads ? 0 : 180;
    const totalRotation = currentRotation + (360 * 6) + (targetRotation - ((currentRotation % 360) + 360) % 360);
    
    // 设置动画变量
    coin.style.setProperty('--flip-rotation', `${totalRotation}deg`);
    coin.classList.add('flipping');
    
    // 动画结束后显示结果
    setTimeout(() => {
        const frontText = frontTextInput ? (frontTextInput.value || "正面") : "正面";
        const backText = backTextInput ? (backTextInput.value || "反面") : "反面";
        const resultText = isHeads ? frontText : backText;
        const resultType = isHeads ? "正面" : "反面";
        
        // 更新结果显示（如果元素存在）
        if (result) {
            result.textContent = `结果: ${resultType} → ${resultText}`;
            result.style.color = isHeads ? "#ffc107" : "#6c757d";
        }
        
        // 更新历史记录
        flipCount++;
        const timestamp = new Date().toLocaleTimeString();
        const historyItem = `${timestamp} - 第${flipCount}次: ${resultType} (${resultText})`;
        history.push(historyItem);
        updateHistory();
        
        isFlipping = false;
        coin.classList.remove('flipping');
        
        // 保持硬币在结果那一面
        coin.style.transform = `rotateY(${targetRotation}deg)`;
    }, 1500);
}

// 更新历史记录显示
function updateHistory() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = '暂无历史记录';
        historyList.appendChild(emptyState);
        return;
    }
    
    history.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        historyList.appendChild(li);
    });
}

// 清空历史记录
function clearHistory() {
    flipCount = 0;
    history = [];
    updateHistory();
    if (result) {
        result.textContent = "点击硬币开始抛掷";
        result.style.color = "";
    }
    
    // 可选：清空后自动关闭弹窗
    // closeModal();
}

// 主题切换功能已注释
// function toggleTheme() {
//     currentTheme = currentTheme === 'light' ? 'dark' : 'light';
//     document.documentElement.setAttribute('data-theme', currentTheme);
//     localStorage.setItem('theme', currentTheme);
//     updateThemeIcon();
// }

// function updateThemeIcon() {
//     themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
// }

// 事件监听
coinContainer.addEventListener('click', flipCoin);
clearBtn.addEventListener('click', clearHistory);
// themeToggle.addEventListener('click', toggleTheme); // 主题切换已注释

// 弹窗事件监听
historyEntryBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// ESC键关闭弹窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

// 初始化历史记录
updateHistory();
