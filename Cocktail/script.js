
// 全局变量
let cards = [];
let currentTags = [];
let currentImageData = null;
let currentCardId = null;
let editImageData = null;
let currentRating = 0;
let editRating = 0;
let isLoginMode = true;
let supabaseClient = null;
let currentUser = null;

// 初始化 Supabase
function initSupabase() {
  if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
    console.warn('Supabase 配置未设置，请在 supabase/config.js 中配置');
    return false;
  }
  
  if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    return true;
  }
  
  console.warn('Supabase SDK 未加载');
  return false;
}

// 检查用户状态
async function checkAuth() {
  if (!supabaseClient) return;
  
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session?.user || null;
  updateAuthButton();
  
  if (currentUser) {
    await loadCards();
  }
}

// 更新登录按钮
function updateAuthButton() {
  const btn = document.getElementById('authBtn');
  if (!btn) return;
  
  btn.textContent = currentUser ? '退出' : '登录';
}

// 处理认证弹窗
function handleAuth() {
  if (currentUser) {
    signOut();
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  document.getElementById('authOverlay').classList.add('active');
  resetAuthForm();
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('active');
}

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  const title = document.getElementById('authTitle');
  const switchText = document.getElementById('authSwitchText');
  
  title.textContent = isLoginMode ? '登录' : '注册';
  switchText.textContent = isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录';
}

function resetAuthForm() {
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  document.getElementById('authMessage').textContent = '';
  document.getElementById('authMessage').className = 'form-message';
}

async function handleAuthSubmit() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const messageEl = document.getElementById('authMessage');
  
  if (!email || !password) {
    showAuthMessage('请填写邮箱和密码');
    return;
  }
  
  try {
    let result;
    
    if (isLoginMode) {
      result = await supabaseClient.auth.signInWithPassword({ email, password });
    } else {
      result = await supabaseClient.auth.signUp({ email, password });
    }
    
    if (result.error) {
      throw result.error;
    }
    
    showAuthMessage(isLoginMode ? '登录成功！' : '注册成功！', true);
    
    setTimeout(() => {
      closeAuthModal();
      checkAuth();
    }, 1000);
    
  } catch (error) {
    showAuthMessage(error.message);
  }
}

function showAuthMessage(text, isSuccess = false) {
  const messageEl = document.getElementById('authMessage');
  messageEl.textContent = text;
  messageEl.className = isSuccess ? 'form-message success' : 'form-message';
}

function handleAuthOverlayClick(event) {
  if (event.target === document.getElementById('authOverlay')) {
    closeAuthModal();
  }
}

async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  currentUser = null;
  cards = [];
  updateAuthButton();
  renderCards();
}

// 加载卡片数据
async function loadCards() {
  if (!supabaseClient || !currentUser) {
    loadLocalCards();
    return;
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('cocktail_cards')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    cards = data.map(item => ({
      id: item.id,
      barName: item.bar_name,
      drinkName: item.drink_name,
      baseSpirit: item.base_spirit,
      tags: item.tags || [],
      review: item.review,
      date: item.date,
      imageData: item.image_data,
      rating: item.rating || 0
    }));
    
  } catch (error) {
    console.error('加载卡片失败:', error);
    loadLocalCards();
  }
  
  renderCards();
  updateYearFilter();
}

// 本地存储回退
function loadLocalCards() {
  const saved = localStorage.getItem('cocktailCards');
  if (saved) {
    cards = JSON.parse(saved);
  }
}

// 保存卡片到 Supabase
async function saveCardToSupabase(card, isUpdate = false) {
  if (!supabaseClient || !currentUser) {
    // 回退到本地存储
    if (!isUpdate) {
      cards.unshift(card);
      saveCardsLocal();
    } else {
      const index = cards.findIndex(c => c.id === card.id);
      if (index !== -1) {
        cards[index] = card;
        saveCardsLocal();
      }
    }
    console.log('数据已保存到本地存储');
    return card;
  }
  
  try {
    const dbData = {
      bar_name: card.barName,
      drink_name: card.drinkName,
      base_spirit: card.baseSpirit,
      tags: card.tags,
      review: card.review,
      date: card.date,
      image_data: card.imageData,
      rating: card.rating,
      user_id: currentUser.id
    };
    
    let result;
    if (isUpdate) {
      result = await supabaseClient
        .from('cocktail_cards')
        .update(dbData)
        .eq('id', card.id)
        .select();
    } else {
      result = await supabaseClient
        .from('cocktail_cards')
        .insert(dbData)
        .select();
    }
    
    if (result.error) throw result.error;
    
    console.log('数据已成功保存到 Supabase 数据库:', result.data[0]);
    return result.data[0];
    
  } catch (error) {
    console.error('保存卡片失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    alert('保存失败: ' + error.message);
    throw error;
  }
}

// 删除卡片
async function deleteCardFromSupabase(id) {
  if (!supabaseClient || !currentUser) {
    cards = cards.filter(c => c.id !== id);
    saveCardsLocal();
    return;
  }
  
  try {
    const { error } = await supabaseClient
      .from('cocktail_cards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
  } catch (error) {
    console.error('删除卡片失败:', error);
    throw error;
  }
}

// 本地存储（备用）
function saveCardsLocal() {
  localStorage.setItem('cocktailCards', JSON.stringify(cards));
}

// 初始化应用
async function init() {
  if (initSupabase()) {
    await checkAuth();
  } else {
    loadCards();
  }
  
  setupImageUpload();
  setupEditImageUpload();
  setupStarRating();
}

// 其他原有功能...
function openModal() {
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  resetForm();
}

function handleOverlayClick(event) {
  if (event.target === document.getElementById('modalOverlay')) {
    closeModal();
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
  document.getElementById('uploadPlaceholder').style.display = 'flex';
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

async function submitForm() {
  if (!currentUser && supabaseClient) {
    showMessage('请先登录以保存到云端');
    return;
  }
  
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
  
  try {
    const savedCard = await saveCardToSupabase(card);
    if (savedCard) {
      if (savedCard.id !== card.id) {
        card.id = savedCard.id;
      }
    }
    
    cards.unshift(card);
    if (currentUser) {
      await loadCards();
    } else {
      saveCardsLocal();
    }
    
    updateYearFilter();
    renderCards();
    updateStats();
    showMessage('保存成功！', true);
    
    setTimeout(() => {
      closeModal();
    }, 800);
    
  } catch (error) {
    showMessage('保存失败，请重试');
  }
}

function showMessage(text, isSuccess = false) {
  const message = document.getElementById('formMessage');
  message.textContent = text;
  message.className = isSuccess ? 'form-message success' : 'form-message';
}

function setupStarRating() {
  const starRating = document.getElementById('starRating');
  const editStarRating = document.getElementById('editStarRating');
  
  if (starRating) {
    const stars = starRating.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', function () {
        currentRating = parseInt(this.dataset.value);
        updateStarDisplay(starRating, currentRating);
      });
    });
  }
  
  if (editStarRating) {
    const stars = editStarRating.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', function () {
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

function openDetail(id) {
  currentCardId = id;
  const card = cards.find(c => c.id === id);
  if (!card) return;
  
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
  
  document.getElementById('detailBody').style.display = 'block';
  document.getElementById('detailBodyEdit').style.display = 'none';
  const footerView = document.querySelector('.detail-footer-view');
  const footerEdit = document.querySelector('.detail-footer-edit');
  if (footerView) footerView.style.display = 'flex';
  if (footerEdit) footerEdit.style.display = 'none';
  
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

function handleDetailOverlayClick(event) {
  if (event.target === document.getElementById('detailOverlay')) {
    closeDetail();
  }
}

function deleteCurrentCard() {
  if (!currentCardId) return;
  
  if (confirm('确定要删除这张卡片吗？')) {
    deleteCardFromSupabase(currentCardId)
      .then(() => {
        cards = cards.filter(c => c.id !== currentCardId);
        if (!currentUser) {
          saveCardsLocal();
        }
        updateYearFilter();
        renderCards();
        closeDetail();
      })
      .catch(() => {
        alert('删除失败，请重试');
      });
  }
}

let editTags = [];

function toggleEditMode() {
  const detailBody = document.getElementById('detailBody');
  const detailBodyEdit = document.getElementById('detailBodyEdit');
  const footerView = document.querySelector('.detail-footer-view');
  const footerEdit = document.querySelector('.detail-footer-edit');
  
  if (!detailBody || !detailBodyEdit || !footerView || !footerEdit) {
    console.error('Element not found');
    return;
  }
  
  if (detailBodyEdit.style.display === 'none' || !detailBodyEdit.style.display) {
    const card = cards.find(c => c.id === currentCardId);
    if (!card) return;
    
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

function setupEditImageUpload() {
  const imageUpload = document.getElementById('editImageUpload');
  const fileInput = document.getElementById('editFileInput');
  
  if (imageUpload && fileInput) {
    imageUpload.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', handleEditFileSelect);
  }
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
  if (previewImg) {
    previewImg.src = imageData;
    document.getElementById('editUploadPlaceholder').style.display = 'none';
    document.getElementById('editImagePreview').style.display = 'block';
  }
}

function showEditImagePlaceholder() {
  document.getElementById('editUploadPlaceholder').style.display = 'flex';
  document.getElementById('editImagePreview').style.display = 'none';
  document.getElementById('editFileInput').value = '';
}

function removeEditImage(event) {
  event.stopPropagation();
  editImageData = null;
  showEditImagePlaceholder();
}

async function saveEdit() {
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
  
  try {
    await saveCardToSupabase(card, true);
    
    if (!currentUser) {
      saveCardsLocal();
    } else {
      await loadCards();
    }
    
    updateYearFilter();
    renderCards();
    
    const title = card.drinkName || card.barName || '卡片详情';
    const headerTitle = document.querySelector('.detail-header h2');
    if (headerTitle) {
      headerTitle.textContent = title;
    }
    
    const detailBody = document.getElementById('detailBody');
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
    }
    
    const detailBodyEdit = document.getElementById('detailBodyEdit');
    const footerView = document.querySelector('.detail-footer-view');
    const footerEdit = document.querySelector('.detail-footer-edit');
    
    if (detailBody) detailBody.style.display = 'block';
    if (detailBodyEdit) detailBodyEdit.style.display = 'none';
    if (footerView) footerView.style.display = 'flex';
    if (footerEdit) footerEdit.style.display = 'none';
    
  } catch (error) {
    alert('保存失败，请重试');
  }
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

function applyFilters() {
  renderCards();
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
  
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#E6E6FA'];
  
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
  
  const ratingCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  cards.forEach(card => {
    const rating = card.rating || 0;
    ratingCount[rating] = (ratingCount[rating] || 0) + 1;
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
  const sortedBars = Object.entries(barCount).sort((a, b) => b[1] - a[1]);
  const ratedCards = Object.entries(ratingCount).filter(([r, c]) => c > 0 && parseInt(r) > 0).sort((a, b) => b[0] - a[0]);
  
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
        
        <div class="stats-section">
            <div class="stats-section-title">📊 详细统计</div>
            <div class="stats-list">
                ${sortedSpirits.map(([spirit, count]) => `
                    <span class="stats-tag">${spirit}: ${count}杯</span>
                `).join('')}
            </div>
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

function handleStatsOverlayClick(event) {
  if (event.target === document.getElementById('statsOverlay')) {
    closeStats();
  }
}

function goBack() {
  window.location.href = '../index.html';
}

window.addEventListener('DOMContentLoaded', init);

