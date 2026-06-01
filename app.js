// =============================================
// Character Bible — App Logic
// Supabase + GitHub Pages + Auth
// =============================================

const SUPABASE_URL = 'https://zebrsqahswrnkjogxttm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYnJzcWFoc3dybmtqb2d4dHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDA1NzUsImV4cCI6MjA5NTgxNjU3NX0.3aOvXShuHgnhHKVPbk07KBmwtpmjE9VufIbtoPbRmXE';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = ['#8b3a1a','#2a5c8b','#2a8b4a','#8b2a7a','#8b7a2a','#2a7a8b','#6b4a2a','#4a2a8b'];
const EMOTIONS = ['Нейтральное','Радость','Гнев','Грусть','Страх','Удивление','Решимость'];

// ── STATE ──
let chars = [];
let images = [];
let relationships = [];
let currentChar = null;
let currentRelCharId = null;
let editingId = null;
let bookFilter = '';
let currentUser = null;

// ── AUTH ──
async function init() {
  // Check existing session
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    showApp();
  } else {
    showLoginScreen();
  }

  // Listen for auth changes
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      showApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLoginScreen();
    }
  });
}

function showLoginScreen() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'grid';
  loadAndRender();
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');

  if (!email || !password) { err.textContent = 'Введи email и пароль'; return; }

  btn.disabled = true;
  btn.textContent = 'Вход...';
  err.textContent = '';

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    err.textContent = 'Неверный email или пароль';
    btn.disabled = false;
    btn.textContent = 'Войти';
  }
  // success handled by onAuthStateChange
}

async function logout() {
  await db.auth.signOut();
}

// Enter key on login form
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') {
    login();
  }
});

// ── LOAD DATA ──
async function loadAndRender() {
  showView('loading');
  try {
    await loadAll();
    showView('all');
    renderSidebar();
    renderGrid();
    updateBookFilter();
  } catch (e) {
    console.error('Load error:', e);
    showToast('Ошибка загрузки данных');
    showView('all');
  }
}

async function loadAll() {
  const [charsRes, imgsRes, relsRes] = await Promise.all([
    db.from('characters').select('*').order('created_at'),
    db.from('character_images').select('*').order('created_at'),
    db.from('relationships').select('*')
  ]);
  if (charsRes.error) throw charsRes.error;
  chars = charsRes.data || [];
  images = imgsRes.data || [];
  relationships = relsRes.data || [];
}

// ── HELPERS ──
function getChar(id) { return chars.find(c => c.id === id); }
function colorFor(c) { return c.color || COLORS[0]; }
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function getImages(charId) { return images.filter(i => i.character_id === charId); }
function getRels(charId) { return relationships.filter(r => r.character_id === charId); }

// ── VIEWS ──
function showView(v) {
  ['loading','all','detail','relations'].forEach(n => {
    const el = document.getElementById('view-' + n);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('view-' + v);
  if (target) target.style.display = 'block';
  document.querySelectorAll('[id^=nav-]').forEach(el => el.classList.remove('active'));
  const nav = document.getElementById('nav-' + v);
  if (nav) nav.classList.add('active');
  if (v === 'relations') renderRelMap();
}

function goBack() {
  currentChar = null;
  showView('all');
  renderGrid();
}

// ── SIDEBAR ──
function renderSidebar() {
  const el = document.getElementById('sidebar-chars');
  el.innerHTML = chars.map(c => `
    <div class="sidebar-char" onclick="openChar('${c.id}')">
      <div class="char-mini-avatar" style="background:${colorFor(c)}22;color:${colorFor(c)}">
        ${c.emoji || initials(c.name)}
      </div>
      <span class="sidebar-char-name">${c.name}</span>
    </div>
  `).join('');
}

// ── BOOK FILTER ──
function updateBookFilter() {
  const books = [...new Set(chars.map(c => c.book).filter(Boolean))];
  const sel = document.getElementById('bookFilter');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Все книги</option>' + books.map(b => `<option value="${b}">${b}</option>`).join('');
  sel.value = books.includes(cur) ? cur : '';
}

function filterByBook(v) { bookFilter = v; filterChars(); }

function filterChars() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let list = chars;
  if (bookFilter) list = list.filter(c => c.book === bookFilter);
  if (q) list = list.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.tags || []).some(t => t.toLowerCase().includes(q)) ||
    (c.role || '').toLowerCase().includes(q)
  );
  renderGrid(list);
}

// ── GRID ──
function renderGrid(list) {
  list = list || chars;
  const grid = document.getElementById('charGrid');
  document.getElementById('char-count-label').textContent =
    `${list.length} персонаж${list.length === 1 ? '' : list.length < 5 ? 'а' : 'ей'}`;

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <i class="ti ti-ghost"></i>
      <p>${chars.length === 0 ? 'Персонажей пока нет. Создайте первого!' : 'Ничего не найдено'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(c => {
    const imgs = getImages(c.id);
    const rels = getRels(c.id);
    const mainImg = imgs[0];
    return `
      <div class="char-card" onclick="openChar('${c.id}')">
        ${mainImg
          ? `<img class="char-card-img" src="${mainImg.url}" alt="${c.name}">`
          : `<div class="char-card-img-placeholder" style="background:${colorFor(c)}15">${c.emoji || '👤'}</div>`
        }
        <div class="char-card-body">
          <div class="char-card-name">${c.name}</div>
          <div class="char-card-role">${c.role || ''}</div>
          ${c.bio ? `<div class="char-card-excerpt">${c.bio}</div>` : ''}
          ${(c.tags || []).length ? `<div class="char-card-tags">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        </div>
        <div class="char-card-footer">
          <span class="meta-count"><i class="ti ti-link"></i> ${rels.length}</span>
          <span class="meta-count"><i class="ti ti-photo"></i> ${imgs.length}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── OPEN CHAR ──
function openChar(id) {
  currentChar = getChar(id);
  if (!currentChar) return;
  showView('detail');
  renderDetail();
}

// ── DETAIL ──
function renderDetail() {
  const c = currentChar;
  const col = colorFor(c);
  const imgs = getImages(c.id);
  const rels = getRels(c.id);

  const imgsHtml = imgs.length
    ? `<div class="img-grid">${imgs.map(img => `
        <div class="img-item" onclick="openLightbox('${img.url}')">
          <img src="${img.url}" alt="${img.emotion}">
          <div class="img-item-label">${img.emotion}</div>
          <button class="img-item-del" onclick="event.stopPropagation();deleteImage('${img.id}','${c.id}')">
            <i class="ti ti-x"></i>
          </button>
        </div>
      `).join('')}</div>`
    : `<div class="notice"><i class="ti ti-info-circle"></i> Загрузи сгенерированные изображения персонажа в разных эмоциях — они пригодятся для более точных AI-генераций сцен.</div>`;

  const relsHtml = rels.length
    ? rels.map(r => {
        const t = getChar(r.target_id);
        if (!t) return '';
        return `<div class="rel-item" onclick="openChar('${t.id}')">
          <div class="rel-avatar" style="background:${colorFor(t)}22;color:${colorFor(t)}">${t.emoji || initials(t.name)}</div>
          <div class="rel-info">
            <div class="rel-name">${t.name}</div>
            <div class="rel-type-text">${r.description || ''}</div>
          </div>
          <span class="rel-badge" style="background:${col}18;color:${col}">${r.type}</span>
        </div>`;
      }).join('')
    : `<div style="color:var(--ink3);font-size:13px;padding:0.5rem 0">Связей пока нет</div>`;

  const prompt = buildGenPrompt(c);

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-layout">
      <div class="detail-sidebar">
        <div class="detail-avatar" style="background:${col}18">
          ${imgs[0]
            ? `<img src="${imgs[0].url}" alt="${c.name}">`
            : `<div class="detail-avatar-placeholder">${c.emoji || '👤'}</div>`
          }
        </div>
        <div class="section-title">Галерея изображений</div>
        ${imgsHtml}
        <button class="add-img-btn" onclick="showImgModal('${c.id}')">
          <i class="ti ti-photo-plus"></i> Добавить изображение
        </button>
      </div>

      <div class="detail-content">
        <div class="detail-name">${c.name}</div>
        <div class="detail-role">${c.role || ''}${c.book ? ' · ' + c.book : ''}${c.age ? ' · ' + c.age + ' лет' : ''}</div>

        <div class="tabs">
          <div class="tab active" onclick="switchTab('info', this)">Данные</div>
          <div class="tab" onclick="switchTab('relations', this)">Связи (${rels.length})</div>
          <div class="tab" onclick="switchTab('prompt', this)">AI-промпт</div>
        </div>

        <div id="tab-info">
          ${c.appearance ? `<div class="info-block"><h3>Внешность</h3><p class="bio-text">${c.appearance}</p></div>` : ''}
          ${c.personality ? `<div class="info-block"><h3>Характер</h3><p class="bio-text">${c.personality}</p></div>` : ''}
          ${c.bio ? `<div class="info-block"><h3>Биография</h3><p class="bio-text">${c.bio}</p></div>` : ''}
          ${(c.tags || []).length ? `<div class="char-card-tags" style="margin-top:0.5rem">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
          <div class="action-btns">
            <button class="btn-edit" onclick="editChar('${c.id}')"><i class="ti ti-edit"></i> Редактировать</button>
            <button class="btn-delete" onclick="deleteChar('${c.id}')"><i class="ti ti-trash"></i> Удалить</button>
          </div>
        </div>

        <div id="tab-relations" style="display:none">
          <div class="rel-list">${relsHtml}</div>
          <button class="add-rel-btn" onclick="showRelModal('${c.id}')">
            <i class="ti ti-plus"></i> Добавить связь
          </button>
        </div>

        <div id="tab-prompt" style="display:none">
          <div class="info-block">
            <h3>Базовый промпт</h3>
            <div class="prompt-box" onclick="copyText(this.textContent)">${prompt}</div>
            <div class="copy-hint"><i class="ti ti-copy"></i> Нажми на текст чтобы скопировать</div>
            <div style="font-size:12px;color:var(--ink3);margin-bottom:8px">Добавить эмоцию:</div>
            <div class="emotion-tags">
              ${EMOTIONS.map(em => `<span class="emotion-tag" onclick="copyPromptWithEmotion('${c.id}','${em}')">${em}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchTab(name, el) {
  ['info','relations','prompt'].forEach(t => {
    const e = document.getElementById('tab-' + t);
    if (e) e.style.display = t === name ? 'block' : 'none';
  });
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}

// ── GEN PROMPT ──
function buildGenPrompt(c) {
  let parts = [`Portrait of ${c.name}`];
  if (c.appearance) parts.push(c.appearance.split(/[.,]/)[0].trim());
  if (c.role) parts.push(c.role.toLowerCase());
  if (c.tags && c.tags.length) parts.push(c.tags.join(', '));
  parts.push('fantasy illustration, detailed, cinematic lighting, concept art, high quality');
  return parts.join(', ');
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Скопировано!'));
}

function copyPromptWithEmotion(charId, emotion) {
  const c = getChar(charId);
  const prompt = buildGenPrompt(c) + `, ${emotion.toLowerCase()} expression`;
  navigator.clipboard.writeText(prompt).then(() => showToast(`Промпт с "${emotion}" скопирован!`));
}

// ── ADD CHAR MODAL ──
function showAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Новый персонаж';
  document.getElementById('saveBtnText').textContent = 'Сохранить';
  ['f-name','f-age','f-book','f-appearance','f-personality','f-bio','f-tags','f-emoji'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-role').value = 'Главный герой';
  document.getElementById('addModal').style.display = 'flex';
}

function editChar(id) {
  const c = getChar(id);
  if (!c) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Редактировать персонажа';
  document.getElementById('f-name').value = c.name || '';
  document.getElementById('f-role').value = c.role || 'Второстепенный';
  document.getElementById('f-age').value = c.age || '';
  document.getElementById('f-book').value = c.book || '';
  document.getElementById('f-appearance').value = c.appearance || '';
  document.getElementById('f-personality').value = c.personality || '';
  document.getElementById('f-bio').value = c.bio || '';
  document.getElementById('f-tags').value = (c.tags || []).join(', ');
  document.getElementById('f-emoji').value = c.emoji || '';
  document.getElementById('addModal').style.display = 'flex';
}

async function saveChar() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('Введи имя персонажа'); return; }

  const btn = document.getElementById('saveCharBtn');
  btn.disabled = true;
  document.getElementById('saveBtnText').textContent = 'Сохранение...';

  const tags = document.getElementById('f-tags').value
    .split(',').map(t => t.trim()).filter(Boolean);

  const data = {
    name,
    role: document.getElementById('f-role').value,
    age: document.getElementById('f-age').value,
    book: document.getElementById('f-book').value,
    appearance: document.getElementById('f-appearance').value,
    personality: document.getElementById('f-personality').value,
    bio: document.getElementById('f-bio').value,
    tags,
    emoji: document.getElementById('f-emoji').value,
  };

  try {
    if (editingId) {
      const { error } = await db.from('characters').update(data).eq('id', editingId);
      if (error) throw error;
      const idx = chars.findIndex(c => c.id === editingId);
      if (idx >= 0) chars[idx] = { ...chars[idx], ...data };
      currentChar = getChar(editingId);
      hideModal('addModal');
      renderDetail();
      renderSidebar();
    } else {
      data.color = COLORS[chars.length % COLORS.length];
      const { data: newChar, error } = await db.from('characters').insert(data).select().single();
      if (error) throw error;
      chars.push(newChar);
      hideModal('addModal');
      renderSidebar();
      renderGrid();
      updateBookFilter();
    }
    showToast(editingId ? 'Персонаж обновлён' : 'Персонаж добавлен');
  } catch (e) {
    console.error(e);
    showToast('Ошибка сохранения');
  } finally {
    btn.disabled = false;
    document.getElementById('saveBtnText').textContent = 'Сохранить';
  }
}

async function deleteChar(id) {
  if (!confirm('Удалить персонажа? Это действие нельзя отменить.')) return;
  try {
    const { error } = await db.from('characters').delete().eq('id', id);
    if (error) throw error;
    chars = chars.filter(c => c.id !== id);
    images = images.filter(i => i.character_id !== id);
    relationships = relationships.filter(r => r.character_id !== id && r.target_id !== id);
    renderSidebar();
    showView('all');
    renderGrid();
    updateBookFilter();
    showToast('Персонаж удалён');
  } catch (e) {
    showToast('Ошибка удаления');
  }
}

// ── IMAGE UPLOAD ──
let imgCharId = null;
let imgFile = null;

function showImgModal(charId) {
  imgCharId = charId;
  imgFile = null;
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('uploadBtnText').textContent = 'Загрузить';
  document.getElementById('imgFileInput').value = '';
  document.getElementById('imgModal').style.display = 'flex';
}

function previewImage(event) {
  imgFile = event.target.files[0];
  if (!imgFile) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('imgPreview');
    prev.src = e.target.result;
    prev.style.display = 'block';
  };
  reader.readAsDataURL(imgFile);
}

async function uploadImage() {
  if (!imgFile) { showToast('Выбери файл'); return; }

  const btn = document.querySelector('#imgModal .btn-save');
  btn.disabled = true;
  document.getElementById('uploadBtnText').textContent = 'Загрузка...';

  try {
    const ext = imgFile.name.split('.').pop();
    const fileName = `${imgCharId}/${Date.now()}.${ext}`;

    const { error: upError } = await db.storage
      .from('character-images')
      .upload(fileName, imgFile, { cacheControl: '3600', upsert: false });

    if (upError) throw upError;

    const { data: urlData } = db.storage.from('character-images').getPublicUrl(fileName);
    const url = urlData.publicUrl;

    const emotion = document.getElementById('img-emotion').value;
    const { data: imgRecord, error: dbError } = await db.from('character_images')
      .insert({ character_id: imgCharId, emotion, url })
      .select().single();

    if (dbError) throw dbError;

    images.push(imgRecord);
    hideModal('imgModal');
    if (currentChar && currentChar.id === imgCharId) renderDetail();
    renderGrid();
    renderSidebar();
    showToast('Изображение загружено');
  } catch (e) {
    console.error(e);
    showToast('Ошибка загрузки: ' + (e.message || 'неизвестная'));
  } finally {
    btn.disabled = false;
    document.getElementById('uploadBtnText').textContent = 'Загрузить';
  }
}

async function deleteImage(imgId, charId) {
  if (!confirm('Удалить изображение?')) return;
  try {
    const img = images.find(i => i.id === imgId);
    if (img) {
      const path = img.url.split('/character-images/')[1];
      if (path) await db.storage.from('character-images').remove([path]);
    }
    await db.from('character_images').delete().eq('id', imgId);
    images = images.filter(i => i.id !== imgId);
    if (currentChar && currentChar.id === charId) renderDetail();
    renderGrid();
    showToast('Изображение удалено');
  } catch (e) {
    showToast('Ошибка удаления');
  }
}

// ── RELATIONSHIPS ──
function showRelModal(charId) {
  currentRelCharId = charId;
  const others = chars.filter(c => c.id !== charId);
  document.getElementById('rel-target').innerHTML =
    others.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('rel-desc').value = '';
  document.getElementById('relModal').style.display = 'flex';
}

async function saveRel() {
  const targetId = document.getElementById('rel-target').value;
  const type = document.getElementById('rel-type').value;
  const description = document.getElementById('rel-desc').value;
  try {
    const { data: newRel, error } = await db.from('relationships')
      .insert({ character_id: currentRelCharId, target_id: targetId, type, description })
      .select().single();
    if (error) throw error;
    relationships.push(newRel);
    hideModal('relModal');
    if (currentChar) renderDetail();
    showToast('Связь добавлена');
  } catch (e) {
    showToast('Ошибка');
  }
}

// ── RELATIONS MAP ──
function renderRelMap() {
  const el = document.getElementById('relMapContent');
  if (!el) return;
  const charsWithRels = chars.filter(c => getRels(c.id).length > 0);
  if (charsWithRels.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-topology-star"></i><p>Добавьте связи между персонажами</p></div>`;
    return;
  }
  el.innerHTML = charsWithRels.map(c => {
    const rels = getRels(c.id);
    return `<div class="rel-map-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div class="char-mini-avatar" style="background:${colorFor(c)}22;color:${colorFor(c)};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px">
          ${c.emoji || initials(c.name)}
        </div>
        <strong style="font-family:'Cormorant Garamond',serif;font-size:20px">${c.name}</strong>
      </div>
      ${rels.map(r => {
        const t = getChar(r.target_id);
        if (!t) return '';
        return `<div class="rel-map-row">
          <span style="color:var(--ink3);width:140px;flex-shrink:0;font-size:13px">${r.type}</span>
          <span style="color:var(--ink3);margin:0 8px">→</span>
          <span style="cursor:pointer;color:var(--accent);font-weight:500" onclick="openChar('${t.id}')">${t.name}</span>
          ${r.description ? `<span style="color:var(--ink3);font-size:12px;margin-left:8px">· ${r.description}</span>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

// ── MODAL HELPERS ──
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
function closeModalBg(e, id) { if (e.target.id === id) hideModal(id); }

// ── LIGHTBOX ──
function openLightbox(url) {
  document.getElementById('lbImg').src = url;
  document.getElementById('lightbox').style.display = 'flex';
}
function closeLightbox() { document.getElementById('lightbox').style.display = 'none'; }

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2500);
}

// ── START ──
init();
