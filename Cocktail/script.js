let cards = [];
let currentTags = [];
let currentImageData = null;
let currentCardId = null;

function init() {
    loadCards();
    renderCards();
    updateStats();
    setupImageUpload();
}

function loadCards() {
    const saved = localStorage.getItem('cocktailCards');
    if (saved) {
        cards = JSON.parse(saved);
    }
}

function saveCards() {
    localStorage.setItem('cocktailCards', JSON.stringify(cards));
}

function updateStats() {
}

function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    resetForm();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function handleOverlayClick(event) {
    if (event.target === document.getElementById('modalOverlay')) {
        closeModal();
    }
}

function resetForm() {
    document.getElementById('barInput').value = '';
    document.getElementById('baseSpiritSelect').value = '龙舌兰';
    document.getElementById('reviewInput').value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('formMessage').textContent = '';
    document.getElementById('formMessage').className = 'form-message';
    currentTags = [];
    currentImageData = null;
    renderTags();
    resetImagePreview();
}

function setupImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    const fileInput = document.getElementById('fileInput');
    
    imageUpload.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height);
            canvas.width = 500;
            canvas.height = 500;
            const ctx = canvas.getContext('2d');
            
            const offsetX = (img.width - size) / 2;
            const offsetY = (img.height - size) / 2;
            
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 500, 500);
            currentImageData = canvas.toDataURL('image/jpeg', 0.8);
            
            showImagePreview(currentImageData);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showImagePreview(imageData) {
    const previewImg = document.getElementById('previewImg');
    previewImg.src = imageData;
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'block';
}

function resetImagePreview() {
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

function removeImage(event) {
    event.stopPropagation();
    currentImageData = null;
    resetImagePreview();
}

function addTag() {
    const input = document.getElementById('tagInput');
    const tag = input.value.trim();
    
    if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        renderTags();
        input.value = '';
    }
}

function handleTagKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTag();
    }
}

function removeTag(index) {
    currentTags.splice(index, 1);
    renderTags();
}

function renderTags() {
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = currentTags.map((tag, index) => `
        <div class="tag-item">
            <span>${tag}</span>
            <button onclick="removeTag(${index})">×</button>
        </div>
    `).join('');
}

function submitForm() {
    const barName = document.getElementById('barInput').value.trim();
    const drinkName = document.getElementById('drinkNameInput').value.trim();
    const baseSpirit = document.getElementById('baseSpiritSelect').value;
    const review = document.getElementById('reviewInput').value.trim();
    let date = document.getElementById('dateInput').value;
    
    if (!barName) {
        showMessage('请填写酒吧名字');
        return;
    }
    
    if (!date) {
        const today = new Date();
        date = today.toISOString().split('T')[0];
    }
    
    const card = {
        id: Date.now(),
        barName,
        drinkName,
        baseSpirit,
        tags: [...currentTags],
        review,
        date,
        imageData: currentImageData
    };
    
    cards.unshift(card);
    saveCards();
    renderCards();
    updateStats();
    showMessage('保存成功！', true);
    
    setTimeout(() => {
        closeModal();
    }, 800);
}

function showMessage(text, isSuccess = false) {
    const message = document.getElementById('formMessage');
    message.textContent = text;
    message.className = isSuccess ? 'form-message success' : 'form-message';
}

function renderCards() {
    const grid = document.getElementById('cardsGrid');
    
    if (cards.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍸</div>
                <p>还没有记录，点击上方按钮添加</p>
            </div>
        `;
        return;
    }
    
    cards.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    grid.innerHTML = cards.map(card => `
        <div class="cocktail-card" onclick="openDetail(${card.id})">
            <div class="card-image">
                ${card.imageData 
                    ? `<img src="${card.imageData}" alt="调酒">`
                    : `<div class="card-image-placeholder">🍸</div>`
                }
            </div>
            <div class="card-content">
                <div class="card-bar">${escapeHtml(card.barName)}</div>
                <div class="card-spirit">${escapeHtml(card.baseSpirit)}</div>
                ${card.tags && card.tags.length > 0 ? `
                    <div class="card-tags">
                        ${card.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                ${card.review ? `<div class="card-review">${escapeHtml(card.review)}</div>` : ''}
                <div class="card-date">${formatDate(card.date)}</div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function goBack() {
    window.history.back();
}

function openDetail(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    currentCardId = cardId;
    
    const title = card.drinkName || card.barName || '卡片详情';
    document.querySelector('.detail-header h2').textContent = title;
    
    const detailBody = document.getElementById('detailBody');
    detailBody.innerHTML = `
        <div class="detail-image">
            ${card.imageData 
                ? `<img src="${card.imageData}" alt="调酒">`
                : `<div class="detail-image-placeholder">🍸</div>`
            }
        </div>
        <div class="detail-bar">${escapeHtml(card.barName)}</div>
        ${card.drinkName ? `<div class="detail-drink">${escapeHtml(card.drinkName)}</div>` : ''}
        <div class="detail-spirit">基酒：${escapeHtml(card.baseSpirit)}</div>
        ${card.tags && card.tags.length > 0 ? `
            <div class="detail-tags">
                ${card.tags.map(tag => `<span class="detail-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        ` : ''}
        ${card.review ? `<div class="detail-review">${escapeHtml(card.review)}</div>` : ''}
        <div class="detail-date">记录日期：${formatDate(card.date)}</div>
    `;
    
    document.getElementById('detailOverlay').classList.add('active');
}

function closeDetail() {
    document.getElementById('detailOverlay').classList.remove('active');
    currentCardId = null;
}

function deleteCurrentCard() {
    if (!currentCardId) return;
    
    if (confirm('确定要删除这张卡片吗？')) {
        cards = cards.filter(c => c.id !== currentCardId);
        saveCards();
        renderCards();
        updateStats();
        closeDetail();
    }
}

function openStats() {
    const statsBody = document.getElementById('statsBody');
    
    if (cards.length === 0) {
        statsBody.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <div class="empty-icon">📊</div>
                <p>还没有数据</p>
            </div>
        `;
        document.getElementById('statsOverlay').classList.add('active');
        return;
    }
    
    const totalCards = cards.length;
    
    const spiritCount = {};
    cards.forEach(card => {
        spiritCount[card.baseSpirit] = (spiritCount[card.baseSpirit] || 0) + 1;
    });
    
    const allTags = [];
    cards.forEach(card => {
        if (card.tags && card.tags.length > 0) {
            allTags.push(...card.tags);
        }
    });
    const uniqueTags = [...new Set(allTags)];
    
    const dates = [...new Set(cards.map(c => c.date))];
    
    const sortedSpirits = Object.entries(spiritCount).sort((a, b) => b[1] - a[1]);
    
    statsBody.innerHTML = `
        <div class="stats-summary">
            <div class="stats-item">
                <div class="stats-item-value">${totalCards}</div>
                <div class="stats-item-label">总卡牌数</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-value">${dates.length}</div>
                <div class="stats-item-label">记录天数</div>
            </div>
        </div>
        
        <div class="stats-section">
            <div class="stats-section-title">🍸 基酒分布</div>
            <div class="stats-list">
                ${sortedSpirits.map(([spirit, count]) => `
                    <span class="stats-tag">${spirit} (${count})</span>
                `).join('')}
            </div>
        </div>
        
        <div class="stats-section">
            <div class="stats-section-title">🏷️ 风味标签</div>
            <div class="stats-list">
                ${uniqueTags.map(tag => `<span class="stats-tag">${tag}</span>`).join('')}
            </div>
        </div>
        
        <div class="stats-section">
            <div class="stats-section-title">📅 记录日期</div>
            <div class="stats-list">
                ${dates.sort((a, b) => new Date(b) - new Date(a)).map(date => `<span class="stats-tag">${date}</span>`).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('statsOverlay').classList.add('active');
}

function closeStats() {
    document.getElementById('statsOverlay').classList.remove('active');
}

window.addEventListener('DOMContentLoaded', init);
