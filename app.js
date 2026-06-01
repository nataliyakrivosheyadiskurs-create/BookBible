// =============================================
// Character Bible — App Logic v2
// =============================================

const SUPABASE_URL = 'https://zebrsqahswrnkjogxttm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYnJzcWFoc3dybmtqb2d4dHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDA1NzUsImV4cCI6MjA5NTgxNjU3NX0.3aOvXShuHgnhHKVPbk07KBmwtpmjE9VufIbtoPbRmXE';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = ['#8b3a1a','#2a5c8b','#2a8b4a','#8b2a7a','#8b7a2a','#2a7a8b','#6b4a2a','#4a2a8b'];
const EMOTIONS = ['Нейтральное','Радость','Гнев','Грусть','Страх','Удивление','Решимость'];

// ── CHAR FIELDS ──
const CHAR_FIELDS = [
  'name','nickname','role','gender','age','book','emoji','tags',
  'appearance','height','body_type','hair','eyes','skin','distinctive_marks','style','voice',
  'personality','strengths','weaknesses','fears','desires','habits','speech_style','worldview','motivation','secret',
  'bio','backstory','key_events','arc','notes'
];

// ── WORLD FIELDS ──
const WORLD_FIELDS = ['name','genre','summary','history','geography','magic_system','technology','politics','religion','culture','conflicts','notes'];

let chars = [], images = [], relationships = [], worlds = [];
let currentChar = null, currentWorld = null;
let currentRelCharId = null;
let editingCharId = null, editingWorldId = null;
let bookFilter = '';

// ── AUTH ──
async function init() {
  const { data: { session } } = await db.auth.getSession();
  if (session) { showApp(); }
  else { showLoginScreen(); }
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') showApp();
    else if (event === 'SIGNED_OUT') showLoginScreen();
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
  btn.disabled = true; btn.textContent = 'Вход...'; err.textContent = '';
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) { err.textContent = 'Неверный email или пароль'; btn.disabled = false; btn.textContent = 'Войти'; }
}
async function logout() { await db.auth.signOut(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') login();
});

// ── LOAD ──
async function loadAndRender() {
  showView('loading');
  try {
    const [charsRes, imgsRes, relsRes, worldsRes] = await Promise.all([
      db.from('characters').select('*').order('created_at'),
      db.from('character_images').select('*').order('created_at'),
      db.from('relationships').select('*'),
      db.from('worlds').select('*').order('created_at')
    ]);
    if (charsRes.error) throw charsRes.error;
    chars = charsRes.data || [];
    images = imgsRes.data || [];
    relationships = relsRes.data || [];
    worlds = worldsRes.data || [];
    showView('all');
    renderSidebar(); renderGrid(); updateBookFilter();
  } catch(e) {
    console.error(e);
    showToast('Ошибка: ' + (e.message || 'не удалось загрузить данные'));
    showView('all');
  }
}

// ── HELPERS ──
function getChar(id) { return chars.find(c => c.id === id); }
function getWorld(id) { return worlds.find(w => w.id === id); }
function colorFor(c) { return c.color || COLORS[0]; }
function initials(name) { return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function getImages(charId) { return images.filter(i => i.character_id === charId); }
function getRels(charId) { return relationships.filter(r => r.character_id === charId); }

// ── VIEWS ──
const ALL_VIEWS = ['loading','all','detail','worlds','world-detail','relations'];
function showView(v) {
  ALL_VIEWS.forEach(n => { const el = document.getElementById('view-'+n); if(el) el.style.display='none'; });
  const target = document.getElementById('view-'+v);
  if (target) target.style.display = 'block';
  document.querySelectorAll('[id^=nav-]').forEach(el => el.classList.remove('active'));
  const nav = document.getElementById('nav-'+v);
  if (nav) nav.classList.add('active');
  if (v === 'relations') renderRelMap();
  if (v === 'worlds') renderWorlds();
}
function goBack() { currentChar = null; showView('all'); renderGrid(); }

// ── SIDEBAR ──
function renderSidebar() {
  document.getElementById('sidebar-chars').innerHTML = chars.map(c => `
    <div class="sidebar-char" onclick="openChar('${c.id}')">
      <div class="char-mini-avatar" style="background:${colorFor(c)}22;color:${colorFor(c)}">${c.emoji||initials(c.name)}</div>
      <span class="sidebar-char-name">${c.name}</span>
    </div>`).join('');
}

function updateBookFilter() {
  const books = [...new Set(chars.map(c=>c.book).filter(Boolean))];
  const sel = document.getElementById('bookFilter');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Все книги</option>' + books.map(b=>`<option value="${b}">${b}</option>`).join('');
  sel.value = books.includes(cur) ? cur : '';
}
function filterByBook(v) { bookFilter = v; filterChars(); }
function filterChars() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let list = chars;
  if (bookFilter) list = list.filter(c => c.book === bookFilter);
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || (c.tags||[]).some(t=>t.toLowerCase().includes(q)));
  renderGrid(list);
}

// ── GRID ──
function renderGrid(list) {
  list = list || chars;
  const grid = document.getElementById('charGrid');
  document.getElementById('char-count-label').textContent =
    `${list.length} персонаж${list.length===1?'':list.length<5?'а':'ей'}`;
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><i class="ti ti-ghost"></i><p>${chars.length===0?'Персонажей пока нет. Создайте первого!':'Ничего не найдено'}</p></div>`;
    return;
  }
  grid.innerHTML = list.map(c => {
    const imgs = getImages(c.id), rels = getRels(c.id), mainImg = imgs[0];
    return `<div class="char-card" onclick="openChar('${c.id}')">
      ${mainImg ? `<img class="char-card-img" src="${mainImg.url}" alt="${c.name}">` : `<div class="char-card-img-placeholder" style="background:${colorFor(c)}15">${c.emoji||'👤'}</div>`}
      <div class="char-card-body">
        <div class="char-card-name">${c.name}</div>
        <div class="char-card-role">${c.role||''}</div>
        ${c.bio?`<div class="char-card-excerpt">${c.bio}</div>`:''}
        ${(c.tags||[]).length?`<div class="char-card-tags">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`:''}
      </div>
      <div class="char-card-footer">
        <span class="meta-count"><i class="ti ti-link"></i> ${rels.length}</span>
        <span class="meta-count"><i class="ti ti-photo"></i> ${imgs.length}</span>
      </div>
    </div>`;
  }).join('');
}

// ── OPEN CHAR ──
function openChar(id) {
  currentChar = getChar(id); if(!currentChar) return;
  showView('detail'); renderDetail();
}

// ── DETAIL ──
function renderDetail() {
  const c = currentChar, col = colorFor(c);
  const imgs = getImages(c.id), rels = getRels(c.id);
  const prompt = buildGenPrompt(c);

  const imgsHtml = imgs.length
    ? `<div class="img-grid">${imgs.map(img=>`
        <div class="img-item" onclick="openLightbox('${img.url}')">
          <img src="${img.url}" alt="${img.emotion}">
          <div class="img-item-label">${img.emotion}</div>
          <button class="img-item-del" onclick="event.stopPropagation();deleteImage('${img.id}','${c.id}')"><i class="ti ti-x"></i></button>
        </div>`).join('')}</div>`
    : `<div class="notice"><i class="ti ti-info-circle"></i> Загрузи сгенерированные изображения персонажа с разными эмоциями — пригодятся для AI-генераций.</div>`;

  const relsHtml = rels.length
    ? rels.map(r=>{const t=getChar(r.target_id);if(!t)return '';
        return `<div class="rel-item" onclick="openChar('${t.id}')">
          <div class="rel-avatar" style="background:${colorFor(t)}22;color:${colorFor(t)}">${t.emoji||initials(t.name)}</div>
          <div class="rel-info"><div class="rel-name">${t.name}</div><div class="rel-type-text">${r.description||''}</div></div>
          <span class="rel-badge" style="background:${col}18;color:${col}">${r.type}</span>
        </div>`;}).join('')
    : `<div style="color:var(--ink3);font-size:13px;padding:.5rem 0">Связей пока нет</div>`;

  // Build info sections
  const infoSection = (title, fields) => {
    const rows = fields.filter(([,v]) => v).map(([k,v]) => `
      <div class="info-row"><span class="info-key">${k}</span><span class="info-val">${v}</span></div>`).join('');
    return rows ? `<div class="info-block"><h3>${title}</h3>${rows}</div>` : '';
  };

  const appearance = infoSection('Внешность', [
    ['Рост',c.height],['Телосложение',c.body_type],['Волосы',c.hair],
    ['Глаза',c.eyes],['Кожа',c.skin],['Голос',c.voice]
  ]);
  const appearanceText = c.appearance ? `<div class="info-block"><h3>Описание внешности</h3><p class="bio-text">${c.appearance}</p></div>` : '';
  const marks = c.distinctive_marks ? `<div class="info-block"><h3>Особые приметы</h3><p class="bio-text">${c.distinctive_marks}</p></div>` : '';
  const style = c.style ? `<div class="info-block"><h3>Стиль одежды</h3><p class="bio-text">${c.style}</p></div>` : '';

  const personality = c.personality ? `<div class="info-block"><h3>Характер</h3><p class="bio-text">${c.personality}</p></div>` : '';
  const charRows = infoSection('Психологический профиль', [
    ['Сильные стороны',c.strengths],['Слабые стороны',c.weaknesses],
    ['Страхи',c.fears],['Желания',c.desires],['Мотивация',c.motivation]
  ]);
  const charText2 = [
    c.habits ? `<div class="info-block"><h3>Привычки</h3><p class="bio-text">${c.habits}</p></div>` : '',
    c.speech_style ? `<div class="info-block"><h3>Манера речи</h3><p class="bio-text">${c.speech_style}</p></div>` : '',
    c.worldview ? `<div class="info-block"><h3>Мировоззрение</h3><p class="bio-text">${c.worldview}</p></div>` : '',
    c.secret ? `<div class="info-block"><h3>🔒 Тайна</h3><p class="bio-text">${c.secret}</p></div>` : '',
  ].join('');

  const story = [
    c.bio ? `<div class="info-block"><h3>Биография</h3><p class="bio-text">${c.bio}</p></div>` : '',
    c.backstory ? `<div class="info-block"><h3>Предыстория</h3><p class="bio-text">${c.backstory}</p></div>` : '',
    c.key_events ? `<div class="info-block"><h3>Ключевые события</h3><p class="bio-text">${c.key_events}</p></div>` : '',
    c.arc ? `<div class="info-block"><h3>Арка персонажа</h3><p class="bio-text">${c.arc}</p></div>` : '',
    c.notes ? `<div class="info-block"><h3>📝 Заметки</h3><p class="bio-text">${c.notes}</p></div>` : '',
  ].join('');

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-layout">
      <div class="detail-sidebar">
        <div class="detail-avatar" style="background:${col}18">
          ${imgs[0] ? `<img src="${imgs[0].url}" alt="${c.name}">` : `<div class="detail-avatar-placeholder">${c.emoji||'👤'}</div>`}
        </div>
        <div class="section-title">Галерея</div>
        ${imgsHtml}
        <button class="add-img-btn" onclick="showImgModal('${c.id}')"><i class="ti ti-photo-plus"></i> Добавить изображение</button>
      </div>
      <div class="detail-content">
        <div class="detail-name">${c.name}${c.nickname?` <span style="font-size:18px;color:var(--ink3);font-style:italic">"${c.nickname}"</span>`:''}</div>
        <div class="detail-role">${c.role||''}${c.book?' · '+c.book:''}${c.age?' · '+c.age+' лет':''}${c.gender?' · '+c.gender:''}</div>
        ${(c.tags||[]).length?`<div class="char-card-tags" style="margin-bottom:1rem">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`:''}

        <div class="tabs">
          <div class="tab active" onclick="switchTab('info',this)">Данные</div>
          <div class="tab" onclick="switchTab('char',this)">Характер</div>
          <div class="tab" onclick="switchTab('story',this)">История</div>
          <div class="tab" onclick="switchTab('relations',this)">Связи (${rels.length})</div>
          <div class="tab" onclick="switchTab('prompt',this)">AI-промпт</div>
        </div>

        <div id="tab-info">${appearance}${appearanceText}${marks}${style}</div>
        <div id="tab-char" style="display:none">${personality}${charRows}${charText2}</div>
        <div id="tab-story" style="display:none">${story}</div>
        <div id="tab-relations" style="display:none">
          <div class="rel-list">${relsHtml}</div>
          <button class="add-rel-btn" onclick="showRelModal('${c.id}')"><i class="ti ti-plus"></i> Добавить связь</button>
        </div>
        <div id="tab-prompt" style="display:none">
          <div class="info-block">
            <h3>Базовый промпт</h3>
            <div class="prompt-box" onclick="copyText(this.textContent)">${prompt}</div>
            <div class="copy-hint"><i class="ti ti-copy"></i> Нажми на текст чтобы скопировать</div>
            <div style="font-size:12px;color:var(--ink3);margin-bottom:8px">Добавить эмоцию:</div>
            <div class="emotion-tags">${EMOTIONS.map(em=>`<span class="emotion-tag" onclick="copyPromptWithEmotion('${c.id}','${em}')">${em}</span>`).join('')}</div>
          </div>
        </div>

        <div class="action-btns">
          <button class="btn-edit" onclick="editChar('${c.id}')"><i class="ti ti-edit"></i> Редактировать</button>
          <button class="btn-delete" onclick="deleteChar('${c.id}')"><i class="ti ti-trash"></i> Удалить</button>
        </div>
      </div>
    </div>`;
}

function switchTab(name, el) {
  ['info','char','story','relations','prompt'].forEach(t => {
    const e = document.getElementById('tab-'+t); if(e) e.style.display = t===name?'block':'none';
  });
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
}

// ── GEN PROMPT ──
function buildGenPrompt(c) {
  let parts = [`Portrait of ${c.name}`];
  const looks = [c.hair, c.eyes, c.skin, c.height].filter(Boolean).join(', ');
  if (looks) parts.push(looks);
  else if (c.appearance) parts.push(c.appearance.split(/[.,]/)[0].trim());
  if (c.role) parts.push(c.role.toLowerCase());
  if (c.tags && c.tags.length) parts.push(c.tags.join(', '));
  parts.push('fantasy illustration, detailed, cinematic lighting, concept art, high quality');
  return parts.join(', ');
}
function copyText(text) { navigator.clipboard.writeText(text).then(() => showToast('Скопировано!')); }
function copyPromptWithEmotion(charId, emotion) {
  const prompt = buildGenPrompt(getChar(charId)) + `, ${emotion.toLowerCase()} expression`;
  navigator.clipboard.writeText(prompt).then(() => showToast(`Промпт с "${emotion}" скопирован!`));
}

// ── CHAR MODAL ──
function showAddCharModal() {
  editingCharId = null;
  document.getElementById('charModalTitle').textContent = 'Новый персонаж';
  document.getElementById('saveBtnText').textContent = 'Сохранить';
  CHAR_FIELDS.forEach(f => { const el = document.getElementById('f-'+f); if(el) el.value = ''; });
  document.getElementById('f-role').value = 'Главный герой';
  switchModalTab('basic', document.querySelector('#charModal .modal-tab'));
  document.getElementById('charModal').style.display = 'flex';
}

function editChar(id) {
  const c = getChar(id); if(!c) return;
  editingCharId = id;
  document.getElementById('charModalTitle').textContent = 'Редактировать персонажа';
  CHAR_FIELDS.forEach(f => {
    const el = document.getElementById('f-'+f); if(!el) return;
    el.value = f === 'tags' ? (c.tags||[]).join(', ') : (c[f]||'');
  });
  switchModalTab('basic', document.querySelector('#charModal .modal-tab'));
  document.getElementById('charModal').style.display = 'flex';
}

async function saveChar() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('Введи имя персонажа'); return; }
  const btn = document.getElementById('saveCharBtn');
  btn.disabled = true; document.getElementById('saveBtnText').textContent = 'Сохранение...';

  const data = {};
  CHAR_FIELDS.forEach(f => {
    const el = document.getElementById('f-'+f); if(!el) return;
    data[f] = f === 'tags' ? el.value.split(',').map(t=>t.trim()).filter(Boolean) : el.value;
  });

  try {
    if (editingCharId) {
      const { error } = await db.from('characters').update(data).eq('id', editingCharId);
      if (error) throw error;
      const idx = chars.findIndex(c => c.id === editingCharId);
      if (idx >= 0) chars[idx] = { ...chars[idx], ...data };
      currentChar = getChar(editingCharId);
      hideModal('charModal'); renderDetail(); renderSidebar();
    } else {
      data.color = COLORS[chars.length % COLORS.length];
      const { data: newChar, error } = await db.from('characters').insert(data).select().single();
      if (error) throw error;
      chars.push(newChar);
      hideModal('charModal'); renderSidebar(); renderGrid(); updateBookFilter();
    }
    showToast(editingCharId ? 'Персонаж обновлён' : 'Персонаж добавлен');
  } catch(e) {
    console.error(e); showToast('Ошибка: ' + (e.message||''));
  } finally {
    btn.disabled = false; document.getElementById('saveBtnText').textContent = 'Сохранить';
  }
}

async function deleteChar(id) {
  if (!confirm('Удалить персонажа?')) return;
  try {
    const { error } = await db.from('characters').delete().eq('id', id);
    if (error) throw error;
    chars = chars.filter(c => c.id !== id);
    images = images.filter(i => i.character_id !== id);
    relationships = relationships.filter(r => r.character_id !== id && r.target_id !== id);
    renderSidebar(); showView('all'); renderGrid(); updateBookFilter();
    showToast('Персонаж удалён');
  } catch(e) { showToast('Ошибка удаления'); }
}

// ── WORLDS ──
function renderWorlds() {
  const el = document.getElementById('worldsGrid');
  if (!worlds.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-world"></i><p>Миров пока нет. Создай первый!</p></div>`;
    return;
  }
  el.innerHTML = `<div class="worlds-grid">${worlds.map(w => `
    <div class="world-card" onclick="openWorld('${w.id}')">
      <div class="world-card-icon">🌍</div>
      <div class="world-card-body">
        <div class="world-card-name">${w.name}</div>
        <div class="world-card-genre">${w.genre||''}</div>
        ${w.summary?`<div class="world-card-summary">${w.summary}</div>`:''}
      </div>
    </div>`).join('')}</div>`;
}

function openWorld(id) {
  currentWorld = getWorld(id); if(!currentWorld) return;
  showView('world-detail'); renderWorldDetail();
}

function renderWorldDetail() {
  const w = currentWorld;
  const sections = [
    ['Краткое описание', w.summary],
    ['История мира', w.history],
    ['География', w.geography],
    ['Магическая система', w.magic_system],
    ['Технологии', w.technology],
    ['Политика', w.politics],
    ['Религия', w.religion],
    ['Культура', w.culture],
    ['Главные конфликты', w.conflicts],
    ['📝 Заметки', w.notes],
  ].filter(([,v]) => v).map(([title, text]) =>
    `<div class="info-block"><h3>${title}</h3><p class="bio-text">${text}</p></div>`
  ).join('');

  document.getElementById('worldDetailContent').innerHTML = `
    <div style="max-width:860px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
        <div>
          <div class="detail-name">🌍 ${w.name}</div>
          <div class="detail-role">${w.genre||''}</div>
        </div>
        <div class="action-btns" style="margin-top:0">
          <button class="btn-edit" onclick="editWorld('${w.id}')"><i class="ti ti-edit"></i> Редактировать</button>
          <button class="btn-delete" onclick="deleteWorld('${w.id}')"><i class="ti ti-trash"></i> Удалить</button>
        </div>
      </div>
      ${sections || '<div style="color:var(--ink3);font-size:14px">Заполни описание мира через редактирование</div>'}
    </div>`;
}

function showAddWorldModal() {
  editingWorldId = null;
  document.getElementById('worldModalTitle').textContent = 'Новый мир';
  document.getElementById('saveWorldBtnText').textContent = 'Сохранить';
  WORLD_FIELDS.forEach(f => { const el = document.getElementById('w-'+f); if(el) el.value=''; });
  switchModalTab('wbasic', document.querySelector('#worldModal .modal-tab'));
  document.getElementById('worldModal').style.display = 'flex';
}

function editWorld(id) {
  const w = getWorld(id); if(!w) return;
  editingWorldId = id;
  document.getElementById('worldModalTitle').textContent = 'Редактировать мир';
  WORLD_FIELDS.forEach(f => { const el = document.getElementById('w-'+f); if(el) el.value = w[f]||''; });
  switchModalTab('wbasic', document.querySelector('#worldModal .modal-tab'));
  document.getElementById('worldModal').style.display = 'flex';
}

async function saveWorld() {
  const name = document.getElementById('w-name').value.trim();
  if (!name) { showToast('Введи название мира'); return; }
  const btn = document.getElementById('saveWorldBtn');
  btn.disabled = true; document.getElementById('saveWorldBtnText').textContent = 'Сохранение...';
  const data = {};
  WORLD_FIELDS.forEach(f => { const el = document.getElementById('w-'+f); if(el) data[f] = el.value; });
  try {
    if (editingWorldId) {
      const { error } = await db.from('worlds').update(data).eq('id', editingWorldId);
      if (error) throw error;
      const idx = worlds.findIndex(w => w.id === editingWorldId);
      if (idx >= 0) worlds[idx] = { ...worlds[idx], ...data };
      currentWorld = getWorld(editingWorldId);
      hideModal('worldModal'); renderWorldDetail();
    } else {
      const { data: newWorld, error } = await db.from('worlds').insert(data).select().single();
      if (error) throw error;
      worlds.push(newWorld);
      hideModal('worldModal'); renderWorlds();
    }
    showToast(editingWorldId ? 'Мир обновлён' : 'Мир добавлен');
  } catch(e) {
    console.error(e); showToast('Ошибка: ' + (e.message||''));
  } finally {
    btn.disabled = false; document.getElementById('saveWorldBtnText').textContent = 'Сохранить';
  }
}

async function deleteWorld(id) {
  if (!confirm('Удалить этот мир?')) return;
  try {
    const { error } = await db.from('worlds').delete().eq('id', id);
    if (error) throw error;
    worlds = worlds.filter(w => w.id !== id);
    showView('worlds');
    showToast('Мир удалён');
  } catch(e) { showToast('Ошибка'); }
}

// ── MODAL TABS ──
function switchModalTab(name, el) {
  const modal = el ? el.closest('.modal') : null;
  if (modal) {
    modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  // Hide all mtabs in the same modal, show the right one
  document.querySelectorAll('[id^=mtab-]').forEach(t => t.style.display = 'none');
  const target = document.getElementById('mtab-'+name);
  if (target) target.style.display = 'block';
}

// ── IMAGE UPLOAD ──
let imgCharId = null, imgFile = null;
function showImgModal(charId) {
  imgCharId = charId; imgFile = null;
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('uploadBtnText').textContent = 'Загрузить';
  document.getElementById('imgFileInput').value = '';
  document.getElementById('imgModal').style.display = 'flex';
}
function previewImage(event) {
  imgFile = event.target.files[0]; if(!imgFile) return;
  const reader = new FileReader();
  reader.onload = e => { const p=document.getElementById('imgPreview'); p.src=e.target.result; p.style.display='block'; };
  reader.readAsDataURL(imgFile);
}
async function uploadImage() {
  if (!imgFile) { showToast('Выбери файл'); return; }
  const btn = document.querySelector('#imgModal .btn-save');
  btn.disabled = true; document.getElementById('uploadBtnText').textContent = 'Загрузка...';
  try {
    const ext = imgFile.name.split('.').pop();
    const fileName = `${imgCharId}/${Date.now()}.${ext}`;
    const { error: upError } = await db.storage.from('character-images').upload(fileName, imgFile, { cacheControl:'3600', upsert:false });
    if (upError) throw upError;
    const { data: urlData } = db.storage.from('character-images').getPublicUrl(fileName);
    const emotion = document.getElementById('img-emotion').value;
    const { data: imgRecord, error: dbError } = await db.from('character_images').insert({ character_id:imgCharId, emotion, url:urlData.publicUrl }).select().single();
    if (dbError) throw dbError;
    images.push(imgRecord);
    hideModal('imgModal');
    if (currentChar && currentChar.id === imgCharId) renderDetail();
    renderGrid(); renderSidebar();
    showToast('Изображение загружено');
  } catch(e) {
    console.error(e); showToast('Ошибка загрузки: ' + (e.message||''));
  } finally {
    btn.disabled = false; document.getElementById('uploadBtnText').textContent = 'Загрузить';
  }
}
async function deleteImage(imgId, charId) {
  if (!confirm('Удалить изображение?')) return;
  try {
    const img = images.find(i => i.id === imgId);
    if (img) { const path = img.url.split('/character-images/')[1]; if(path) await db.storage.from('character-images').remove([path]); }
    await db.from('character_images').delete().eq('id', imgId);
    images = images.filter(i => i.id !== imgId);
    if (currentChar && currentChar.id === charId) renderDetail();
    renderGrid(); showToast('Изображение удалено');
  } catch(e) { showToast('Ошибка'); }
}

// ── RELATIONSHIPS ──
function showRelModal(charId) {
  currentRelCharId = charId;
  document.getElementById('rel-target').innerHTML = chars.filter(c=>c.id!==charId).map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('rel-desc').value = '';
  document.getElementById('relModal').style.display = 'flex';
}
async function saveRel() {
  const targetId = document.getElementById('rel-target').value;
  const type = document.getElementById('rel-type').value;
  const description = document.getElementById('rel-desc').value;
  try {
    const { data: newRel, error } = await db.from('relationships').insert({ character_id:currentRelCharId, target_id:targetId, type, description }).select().single();
    if (error) throw error;
    relationships.push(newRel); hideModal('relModal');
    if (currentChar) renderDetail(); showToast('Связь добавлена');
  } catch(e) { showToast('Ошибка'); }
}

// ── RELATIONS MAP ──
function renderRelMap() {
  const el = document.getElementById('relMapContent'); if(!el) return;
  const withRels = chars.filter(c => getRels(c.id).length > 0);
  if (!withRels.length) { el.innerHTML=`<div class="empty-state"><i class="ti ti-topology-star"></i><p>Добавьте связи между персонажами</p></div>`; return; }
  el.innerHTML = withRels.map(c => {
    const rels = getRels(c.id);
    return `<div class="rel-map-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div class="char-mini-avatar" style="background:${colorFor(c)}22;color:${colorFor(c)};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px">${c.emoji||initials(c.name)}</div>
        <strong style="font-family:'Cormorant Garamond',serif;font-size:20px">${c.name}</strong>
      </div>
      ${rels.map(r=>{const t=getChar(r.target_id);if(!t)return '';
        return `<div class="rel-map-row">
          <span style="color:var(--ink3);width:140px;flex-shrink:0;font-size:13px">${r.type}</span>
          <span style="color:var(--ink3);margin:0 8px">→</span>
          <span style="cursor:pointer;color:var(--accent);font-weight:500" onclick="openChar('${t.id}')">${t.name}</span>
          ${r.description?`<span style="color:var(--ink3);font-size:12px;margin-left:8px">· ${r.description}</span>`:''}
        </div>`;}).join('')}
    </div>`;
  }).join('');
}

// ── MODAL HELPERS ──
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
function closeModalBg(e, id) { if(e.target.id===id) hideModal(id); }
function openLightbox(url) { document.getElementById('lbImg').src=url; document.getElementById('lightbox').style.display='flex'; }
function closeLightbox() { document.getElementById('lightbox').style.display='none'; }

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.style.display='none', 2500);
}

init();
