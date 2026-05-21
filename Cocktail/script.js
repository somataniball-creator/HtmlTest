let cards = [];
let currentTags = [];
let currentImageData = null;
let currentCardId = null;
let editImageData = null;
let currentRating = 0;
let editRating = 0;

function init() {
    loadCards();
    renderCards();
    updateStats();
    setupImageUpload();
    setupEditImageUpload();
    setupStarRating();
    updateYearFilter();
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

function handleDetailOverlayClick(event) {
    if (event.target === document.getElementById('detailOverlay')) {
        closeDetail();
    }
}

function handleStatsOverlayClick(event) {
    if (event.target === document.getElementById('statsOverlay')) {
        closeStats();
    }
}

function resetForm() {
    document.getElementById('barInput').value = '';
    document.getElementById('drinkNameInput').value = '';
    document.getElementById('baseSpiritSelect').value = '龙舌兰';
    document.getElementById('reviewInput').value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('formMessage').textContent = '';
    document.getElementById('formMessage').className = 'form-message';
    currentTags = [];
    currentImageData = null;
    renderTags();
    resetImagePreview();
    resetStarRating();
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

function setupEditImageUpload() {
    const imageUpload = document.getElementById('editImageUpload');
    const fileInput = document.getElementById('editFileInput');
    
    imageUpload.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleEditFileSelect);
}

function handleEditFileSelect(event) {
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
            editImageData = canvas.toDataURL('image/jpeg', 0.8);
            
            showEditImagePreview(editImageData);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showEditImagePreview(imageData) {
    const previewImg = document.getElementById('editPreviewImg');
    previewImg.src = imageData;
    document.getElementById('editUploadPlaceholder').style.display = 'none';
    document.getElementById('editImagePreview').style.display = 'block';
}

function removeEditImage(event) {
    event.stopPropagation();
    editImageData = null;
    showEditImagePlaceholder();
}

function showEditImagePlaceholder() {
    document.getElementById('editUploadPlaceholder').style.display = 'block';
    document.getElementById('editImagePreview').style.display = 'none';
    document.getElementById('editFileInput').value = '';
}

function setupStarRating() {
    const starRating = document.getElementById('starRating');
    const editStarRating = document.getElementById('editStarRating');
    
    if (starRating) {
        const stars = starRating.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                currentRating = parseInt(this.dataset.value);
                updateStarDisplay(starRating, currentRating);
            });
        });
    }
    
    if (editStarRating) {
        const stars = editStarRating.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                editRating = parseInt(this.dataset.value);
                updateStarDisplay(editStarRating, editRating);
            });
        });
    }
}

function updateStarDisplay(container, rating) {
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
        const value = parseInt(star.dataset.value);
        if (value <= rating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
}

function resetStarRating() {
    currentRating = 0;
    updateStarDisplay(document.getElementById('starRating'), 0);
}

function getStarDisplay(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '★' : '☆';
    }
    return stars;
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
        imageData: currentImageData,
        rating: currentRating
    };
    
    cards.unshift(card);
    saveCards();
    updateYearFilter();
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
        <div class="detail-spirit">基酒：${escapeHtml(card.baseSpirit)}</div>
        ${card.rating ? `<div class="detail-rating">评分：${getStarDisplay(card.rating)}</div>` : ''}
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
    
    document.getElementById('detailBody').style.display = 'block';
    document.getElementById('detailBodyEdit').style.display = 'none';
    
    const footerView = document.querySelector('.detail-footer-view');
    const footerEdit = document.querySelector('.detail-footer-edit');
    if (footerView) footerView.style.display = 'flex';
    if (footerEdit) footerEdit.style.display = 'none';
}

function deleteCurrentCard() {
    if (!currentCardId) return;
    
    if (confirm('确定要删除这张卡片吗？')) {
        cards = cards.filter(c => c.id !== currentCardId);
        saveCards();
        updateYearFilter();
        renderCards();
        closeDetail();
    }
}

let editTags = [];

function toggleEditMode() {
    console.log('toggleEditMode called');
    const card = cards.find(c => c.id === currentCardId);
    if (!card) {
        console.error('Card not found');
        return;
    }
    
    const detailBody = document.getElementById('detailBody');
    const detailBodyEdit = document.getElementById('detailBodyEdit');
    const footerView = document.querySelector('.detail-footer-view');
    const footerEdit = document.querySelector('.detail-footer-edit');
    
    console.log('Elements:', { detailBody, detailBodyEdit, footerView, footerEdit });
    
    if (!detailBody || !detailBodyEdit || !footerView || !footerEdit) {
        console.error('Element not found');
        return;
    }
    
    if (detailBodyEdit.style.display === 'none' || !detailBodyEdit.style.display) {
        console.log('Entering edit mode');
        const editBarInput = document.getElementById('editBarInput');
        const editDrinkInput = document.getElementById('editDrinkInput');
        const editBaseSpiritSelect = document.getElementById('editBaseSpiritSelect');
        const editReviewInput = document.getElementById('editReviewInput');
        const editDateInput = document.getElementById('editDateInput');
        
        if (editBarInput) editBarInput.value = card.barName || '';
        if (editDrinkInput) editDrinkInput.value = card.drinkName || '';
        if (editBaseSpiritSelect) editBaseSpiritSelect.value = card.baseSpirit || '龙舌兰';
        if (editReviewInput) editReviewInput.value = card.review || '';
        if (editDateInput) editDateInput.value = card.date || '';
        
        editTags = card.tags ? [...card.tags] : [];
        renderEditTags();
        
        editImageData = card.imageData || null;
        if (editImageData) {
            showEditImagePreview(editImageData);
        } else {
            showEditImagePlaceholder();
        }
        
        editRating = card.rating || 0;
        updateStarDisplay(document.getElementById('editStarRating'), editRating);
        
        detailBody.style.display = 'none';
        detailBodyEdit.style.display = 'block';
        footerView.style.display = 'none';
        footerEdit.style.display = 'flex';
    } else {
        console.log('Exiting edit mode');
        detailBody.style.display = 'block';
        detailBodyEdit.style.display = 'none';
        footerView.style.display = 'flex';
        footerEdit.style.display = 'none';
    }
}

function renderEditTags() {
    const tagsList = document.getElementById('editTagsList');
    if (!tagsList) return;
    
    tagsList.innerHTML = editTags.map((tag, index) => `
        <div class="tag-item">
            <span>${tag}</span>
            <button onclick="removeEditTag(${index})">×</button>
        </div>
    `).join('');
}

function addEditTag() {
    const input = document.getElementById('editTagInput');
    if (!input) return;
    
    const tag = input.value.trim();
    
    if (tag && !editTags.includes(tag)) {
        editTags.push(tag);
        renderEditTags();
        input.value = '';
    }
}

function handleEditTagKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addEditTag();
    }
}

function removeEditTag(index) {
    editTags.splice(index, 1);
    renderEditTags();
}

function saveEdit() {
    const card = cards.find(c => c.id === currentCardId);
    if (!card) return;
    
    const barName = document.getElementById('editBarInput').value.trim();
    const drinkName = document.getElementById('editDrinkInput').value.trim();
    const baseSpirit = document.getElementById('editBaseSpiritSelect').value;
    const review = document.getElementById('editReviewInput').value.trim();
    const date = document.getElementById('editDateInput').value;
    
    card.barName = barName;
    card.drinkName = drinkName;
    card.baseSpirit = baseSpirit;
    card.review = review;
    card.date = date;
    card.tags = [...editTags];
    card.imageData = editImageData;
    card.rating = editRating;
    
    saveCards();
    updateYearFilter();
    renderCards();
    
    const title = card.drinkName || card.barName || '卡片详情';
    const headerTitle = document.querySelector('.detail-header h2');
    if (headerTitle) {
        headerTitle.textContent = title;
    }
    
    const detailBody = document.getElementById('detailBody');
    const detailBodyEdit = document.getElementById('detailBodyEdit');
    const footerView = document.querySelector('.detail-footer-view');
    const footerEdit = document.querySelector('.detail-footer-edit');
    
    if (detailBody) {
        detailBody.innerHTML = `
            <div class="detail-image">
                ${card.imageData 
                    ? `<img src="${card.imageData}" alt="调酒">`
                    : `<div class="detail-image-placeholder">🍸</div>`
                }
            </div>
            <div class="detail-bar">${escapeHtml(card.barName)}</div>
            <div class="detail-spirit">基酒：${escapeHtml(card.baseSpirit)}</div>
            ${card.rating ? `<div class="detail-rating">评分：${getStarDisplay(card.rating)}</div>` : ''}
            ${card.tags && card.tags.length > 0 ? `
                <div class="detail-tags">
                    ${card.tags.map(tag => `<span class="detail-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            ${card.review ? `<div class="detail-review">${escapeHtml(card.review)}</div>` : ''}
            <div class="detail-date">记录日期：${formatDate(card.date)}</div>
        `;
        
        detailBody.style.display = 'block';
    }
    
    if (detailBodyEdit) detailBodyEdit.style.display = 'none';
    if (footerView) footerView.style.display = 'flex';
    if (footerEdit) footerEdit.style.display = 'none';
}

function drawPieChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    ctx.clearRect(0, 0, width, height);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -Math.PI / 2;
    
    const colors = ['#ff8c42', '#ffa726', '#ffb74d', '#ffcc80', '#ff9800', '#f57c00', '#ff6f00', '#e65100'];
    
    data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        startAngle += sliceAngle;
    });
    
    return data.map((item, index) => ({
        ...item,
        color: colors[index % colors.length]
    }));
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
    
    const barCount = {};
    cards.forEach(card => {
        if (card.barName) {
            barCount[card.barName] = (barCount[card.barName] || 0) + 1;
        }
    });
    
    const avgRating = cards.filter(c => c.rating > 0).length > 0 
        ? (cards.filter(c => c.rating > 0).reduce((sum, c) => sum + c.rating, 0) / cards.filter(c => c.rating > 0).length).toFixed(1)
        : '-';
    
    const sortedSpirits = Object.entries(spiritCount).sort((a, b) => b[1] - a[1]);
    const sortedBars = Object.entries(barCount).sort((a, b) => b[1] - a[0]);
    
    statsBody.innerHTML = `
        <div class="stats-summary">
            <div class="stats-item">
                <div class="stats-item-value">${totalCards}</div>
                <div class="stats-item-label">总卡牌数</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-value">${avgRating}</div>
                <div class="stats-item-label">平均评分</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-value">${sortedSpirits[0] ? sortedSpirits[0][0] : '-'}</div>
                <div class="stats-item-label">最常用基酒</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-value">${sortedBars[0] ? sortedBars[0][0] : '-'}</div>
                <div class="stats-item-label">最常去的酒吧</div>
            </div>
        </div>
        
        <div class="chart-container-full">
            <div class="stats-section-title">🍸 基酒分布</div>
            <canvas id="spiritChart" width="200" height="200"></canvas>
            <div class="chart-legend" id="spiritLegend"></div>
        </div>
    `;
    
    setTimeout(() => {
        const spiritCanvas = document.getElementById('spiritChart');
        const spiritLegend = document.getElementById('spiritLegend');
        if (spiritCanvas && spiritLegend) {
            const spiritData = sortedSpirits.map(([label, value]) => ({ label, value }));
            const spiritColors = drawPieChart(spiritCanvas, spiritData);
            spiritLegend.innerHTML = spiritColors.map(item => `
                <div class="legend-item">
                    <div class="legend-color" style="background: ${item.color}"></div>
                    <span class="legend-text">${item.label} (${item.value})</span>
                </div>
            `).join('');
        }
    }, 10);
    
    document.getElementById('statsOverlay').classList.add('active');
}

function closeStats() {
    document.getElementById('statsOverlay').classList.remove('active');
}

function updateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter) return;
    
    const years = new Set();
    cards.forEach(card => {
        if (card.date) {
            const year = new Date(card.date).getFullYear();
            years.add(year);
        }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const currentValue = yearFilter.value;
    
    yearFilter.innerHTML = '<option value="">全部</option>';
    sortedYears.forEach(year => {
        yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
    });
    
    if (currentValue) {
        yearFilter.value = currentValue;
    }
}

function applyFilters() {
    renderCards();
}

function renderCards() {
    const yearFilter = document.getElementById('yearFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const yearValue = yearFilter ? yearFilter.value : '';
    const ratingValue = ratingFilter ? ratingFilter.value : '';
    
    let filteredCards = cards.filter(card => {
        if (yearValue) {
            const cardYear = new Date(card.date).getFullYear();
            if (cardYear.toString() !== yearValue) {
                return false;
            }
        }
        if (ratingValue) {
            const cardRating = card.rating || 0;
            if (cardRating.toString() !== ratingValue) {
                return false;
            }
        }
        return true;
    });
    
    filteredCards.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const grid = document.getElementById('cardsGrid');
    if (!grid) return;
    
    if (cards.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍸</div>
                <p>还没有记录，点击上方按钮添加</p>
            </div>
        `;
        return;
    }
    
    if (filteredCards.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍸</div>
                <p>没有符合条件的记录</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredCards.map(card => `
        <div class="cocktail-card" onclick="openDetail(${card.id})">
            <div class="card-image">
                ${card.imageData 
                    ? `<img src="${card.imageData}" alt="调酒">`
                    : `<div class="card-image-placeholder">🍸</div>`
                }
            </div>
            <div class="card-content">
                ${card.drinkName ? `<div class="card-bar">${escapeHtml(card.drinkName)}</div>` : ''}
                <div class="card-spirit">${escapeHtml(card.barName)}</div>
                ${card.rating ? `<div class="card-rating">${getStarDisplay(card.rating)}</div>` : ''}
                <div class="card-date">${formatDate(card.date)}</div>
            </div>
        </div>
    `).join('');
}

window.addEventListener('DOMContentLoaded', init);
