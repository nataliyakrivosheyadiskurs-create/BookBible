// =============================================
// Character Bible — App Logic v3
// =============================================

const SUPABASE_URL = 'https://zebrsqahswrnkjogxttm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYnJzcWFoc3dybmtqb2d4dHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDA1NzUsImV4cCI6MjA5NTgxNjU3NX0.3aOvXShuHgnhHKVPbk07KBmwtpmjE9VufIbtoPbRmXE';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = ['#8b3a1a','#2a5c8b','#2a8b4a','#8b2a7a','#8b7a2a','#2a7a8b','#6b4a2a','#4a2a8b'];
const EMOTIONS = ['Нейтральное','Радость','Гнев','Грусть','Страх','Удивление','Решимость'];

const CHAR_FIELDS = [
  'name','nickname','role','gender','birth_date','death_date','book','emoji','tags','avatar_image_id','avatar_position','family','char_type','generation',
  'appearance','height','body_type','hair','eyes','skin','distinctive_marks','style','voice',
  'build_strength','posture','handedness','gait','mannerisms',
  'face_shape','forehead','cheekbones','chin','jaw',
  'skin_tan','eye_shape','eye_set','brows_lashes','gaze',
  'nose','lips','ears','neck','hands',
  'hair_texture','hairstyle','accessories','footwear','personal_items','color_palette',
  'first_impression','signature_feature',
  'personality','personality_words','personality_not','temperament','introvert','core_priority','personality_scales',
  'self_esteem','self_strength','self_weakness','self_fears',
  'worldview','unforgivable','moral_limits','people_values',
  'strengths','weaknesses','fears','desires','motivation',
  'social','friendship','behavior_close','conflict_style','leadership',
  'intellect','thinking_style','emotions','stress_response',
  'speech_style','humor','habits','favorites','triggers',
  'paradoxes','inner_conflicts','perception',
  'alone_behavior','happiest_memory','painful_memory','regrets','longing','secret','would_change',
  'bio','backstory','key_events','arc','notes'
];

const WORLD_FIELDS = ['name','genre','summary','history','geography','magic_system','technology','politics','religion','culture','conflicts','notes'];

const CHARBOOK_FIELDS = ['book_title','book_order','role','age_at_events','appearance_changes','personality_changes','arc','key_events','relationships_changes','notes'];

let chars = [], images = [], relationships = [], worlds = [], charBooks = [], cities = [];

const WORLD_EXTENDED_FIELDS = [
  'name','genre','subgenres','mood','main_themes','central_idea','unique_feature',
  'differs_from_typical','what_is_impossible','world_origin','world_motto',
  'summary','history','world_creation','creation_legends','historians_knowledge',
  'myths_vs_truth','epochs','important_events','destructive_wars','disasters',
  'important_discoveries','modern_era_start','before_after_events','chronology',
  'physical_laws','immortality','resurrection','soul','afterlife','ghosts','time_travel','fate',
  'peoples','ethnic_groups','appearance_differences','typical_names','languages','lifespan','beauty_standards',
  'geography','magic_system','magic_definition','magic_source','magic_who_can','magic_who_cannot',
  'magic_how_appears','magic_can_lose','magic_limits','magic_cost','magic_can_learn',
  'magic_schools','magic_society_impact','magic_forbidden','magic_control',
  'gov_form','gov_ruler','gov_succession','gov_parliament','gov_aristocracy','gov_classes','gov_titles',
  'law_main','law_crimes','law_police','law_court','law_prisons','law_punishment','law_rights',
  'army_service','army_ranks','army_branches','army_weapons','army_commanders','army_academies',
  'econ_currency','econ_income','econ_taxes','econ_industries','econ_trade','econ_rich','econ_poor',
  'tech_level','tech_discoveries','tech_energy','tech_transport','tech_communication','tech_medicine','tech_weapons','tech_construction',
  'soc_men','soc_women','soc_children','soc_family','soc_marriage','soc_inheritance','soc_poor','soc_rich',
  'cult_holidays','cult_music','cult_theatre','cult_literature','cult_architecture','cult_fashion','cult_symbols',
  'edu_schools','edu_universities','edu_who_can','edu_literacy','edu_prestigious','edu_subjects',
  'med_healers','med_diseases','med_deadly','med_surgery','med_herbs','med_lifespan',
  'life_food','life_drinks','life_cooking','life_breakfast','life_dinner','life_housing','life_lighting','life_heating','life_water',
  'trans_roads','trans_railways','trans_ships','trans_air','trans_speed','trans_cost',
  'media_newspapers','media_books','media_post','media_telegraph','media_news',
  'lang_state','lang_alphabet','lang_dialects','lang_proverbs','lang_slang',
  'daily_workday','daily_hours','daily_weekends','daily_evening','daily_entertainment','daily_sports',
  'notable_scientists','notable_commanders','notable_artists','notable_criminals','notable_heroes',
  'orgs_guilds','orgs_secret','orgs_military','orgs_banks',
  'technology','politics','religion','culture','conflicts','notes'
];

const CITY_FIELDS = [
  'name','name_origin','founded','motto','region','population','area','languages','literacy',
  'city_history','city_events','famous_residents',
  'layout','architecture','landmarks',
  'economy','government',
  'daily_life','smells','sounds','food',
  'first_impression','three_words','color_palette','rhythm',
  'danger_places','safe_places','locals_only','city_legends','notes'
];
let charTypeFilter = 'all'; // all | main | secondary
let familyFilter = '';
let editingRelId = null;
let currentChar = null, currentWorld = null;
let currentRelCharId = null;
let editingCharId = null, editingWorldId = null, editingCharBookId = null;
let bookFilter = '';

// ── AUTH ──
async function init() {
  const { data: { session } } = await db.auth.getSession();
  if (session) showApp(); else showLoginScreen();

  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      showLoginScreen();
    } else if (event === 'SIGNED_IN' && !appLoaded) {
      // Only load on first sign-in, not on tab refocus
      showApp();
    }
  });
}

let appLoaded = false;
function showLoginScreen() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}
function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'grid';
  if (!appLoaded) {
    appLoaded = true;
    loadAndRender();
  }
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
    const [charsRes, imgsRes, relsRes, worldsRes, charBooksRes, citiesRes] = await Promise.all([
      db.from('characters').select('*').order('created_at'),
      db.from('character_images').select('*').order('created_at'),
      db.from('relationships').select('*'),
      db.from('worlds').select('*').order('created_at'),
      db.from('character_books').select('*').order('book_order'),
      db.from('world_cities').select('*').order('created_at')
    ]);
    if (charsRes.error) throw charsRes.error;
    chars = charsRes.data || [];
    images = imgsRes.data || [];
    relationships = relsRes.data || [];
    worlds = worldsRes.data || [];
    charBooks = charBooksRes.data || [];
    cities = citiesRes.data || [];
    preloadGraphImages();
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
function getCharBooks(charId) { return charBooks.filter(b => b.character_id === charId).sort((a,b) => (a.book_order||0)-(b.book_order||0)); }

// ── VIEWS ──
const ALL_VIEWS = ['loading','all','detail','worlds','world-detail','relations'];
function showView(v) {
  ALL_VIEWS.forEach(n => { const el = document.getElementById('view-'+n); if(el) el.style.display='none'; });
  const target = document.getElementById('view-'+v);
  if (target) target.style.display = 'block';
  document.querySelectorAll('[id^=nav-]').forEach(el => el.classList.remove('active'));
  const nav = document.getElementById('nav-'+v);
  if (nav) nav.classList.add('active');
  // Sync mobile nav
  ['all','worlds','relations'].forEach(mn => {
    const btn = document.getElementById('mnav-'+mn);
    if (btn) btn.classList.toggle('active', mn === v);
  });
  if (v === 'relations') renderRelMap();
  if (v === 'worlds') renderWorlds();
}

function mobileNav(view) {
  showView(view);
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
  const allBooks = [...new Set([
    ...chars.map(c=>c.book),
    ...charBooks.map(b=>b.book_title)
  ].filter(Boolean))];
  const sel = document.getElementById('bookFilter');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Все книги</option>' + allBooks.map(b=>`<option value="${b}">${b}</option>`).join('');
  sel.value = allBooks.includes(cur) ? cur : '';

  // Update families
  const families = [...new Set(chars.map(c=>c.family).filter(Boolean))].sort();
  const famSel = document.getElementById('familyFilter');
  if (famSel) {
    famSel.innerHTML = '<option value="">Все семьи</option>' + families.map(f=>`<option value="${f}">${f}</option>`).join('');
  }
}
function filterByBook(v) { bookFilter = v; filterChars(); }
function filterChars() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let list = chars;
  if (bookFilter) {
    list = list.filter(c => {
      const inMain = c.book === bookFilter;
      const inBooks = getCharBooks(c.id).some(b => b.book_title === bookFilter);
      return inMain || inBooks;
    });
  }
  if (charTypeFilter !== 'all') {
    list = list.filter(c => (c.char_type || 'main') === charTypeFilter);
  }
  if (familyFilter) {
    list = list.filter(c => c.family === familyFilter);
  }
  if (q) list = list.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.tags||[]).some(t=>t.toLowerCase().includes(q)) ||
    (c.family||'').toLowerCase().includes(q)
  );
  renderGrid(list);
}

function setCharTypeFilter(type) {
  charTypeFilter = type;
  document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.type-filter-btn[data-type="${type}"]`);
  if (btn) btn.classList.add('active');
  filterChars();
}

function setFamilyFilter(val) {
  familyFilter = val;
  filterChars();
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
    const imgs = getImages(c.id), rels = getRels(c.id), cBooks = getCharBooks(c.id);
    const avatarImg = imgs.find(i => i.id === c.avatar_image_id) || imgs[0];
    const mainImg = avatarImg;
    const avatarPos = c.avatar_position || 'top';
    const posMap = { top: '50% 15%', center: '50% 50%', bottom: '50% 85%' };
    const objPos = posMap[avatarPos] || '50% 15%';
    const bookBadges = cBooks.map(b => `<span class="book-badge">${b.book_title}</span>`).join('');
    const isSecondary = (c.char_type || 'main') === 'secondary';
    return `<div class="char-card ${isSecondary ? 'char-card-secondary' : ''}" onclick="openChar('${c.id}')">
      ${isSecondary ? '<div class="secondary-badge">Второстепенный</div>' : ''}
      ${mainImg ? `<img class="char-card-img" src="${mainImg.url}" alt="${c.name}" style="object-position:${objPos}">` : `<div class="char-card-img-placeholder" style="background:${colorFor(c)}15">${c.emoji||'👤'}</div>`}
      <div class="char-card-body">
        <div class="char-card-name">${c.name}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
          ${c.family ? `<span class="family-badge">${c.family}</span>` : ''}
        </div>
        ${buildBookRolesHTML(c, cBooks)}
        ${c.bio?`<div class="char-card-excerpt" style="margin-top:8px">${c.bio}</div>`:''}
        ${(c.tags||[]).length?`<div class="char-card-tags">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`:''}
      </div>
      <div class="char-card-footer">
        <span class="meta-count"><i class="ti ti-link"></i> ${rels.length}</span>
        <span class="meta-count"><i class="ti ti-photo"></i> ${imgs.length}</span>
        <span class="meta-count"><i class="ti ti-book"></i> ${cBooks.length}</span>
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
  const imgs = getImages(c.id), rels = getRels(c.id), cBooks = getCharBooks(c.id);

  const imgsHtml = imgs.length
    ? `<div class="img-grid">${imgs.map(img=>`
        <div class="img-item ${img.id === c.avatar_image_id ? 'is-avatar' : ''}" onclick="openLightbox('${img.url}')">
          <img src="${img.url}" alt="${img.emotion}">
          <div class="img-item-label">${[img.period, img.emotion, img.comment].filter(Boolean).join(' · ')}</div>
          ${img.id === c.avatar_image_id ? '<div class="avatar-crown" title="Аватар">★</div>' : ''}
          <div class="img-item-actions">
            <button class="img-action-btn" title="Сделать аватаром" onclick="event.stopPropagation();setAvatar('${c.id}','${img.id}')"><i class="ti ti-user-circle"></i></button>
            <button class="img-action-btn danger" title="Удалить" onclick="event.stopPropagation();deleteImage('${img.id}','${c.id}')"><i class="ti ti-trash"></i></button>
          </div>
        </div>`).join('')}</div>`
    : `<div class="notice"><i class="ti ti-info-circle"></i> Загрузи изображения персонажа с разными эмоциями для AI-генераций.</div>`;

  const relsHtml = rels.length
    ? rels.map(r=>{const t=getChar(r.target_id);if(!t)return '';
        const intensityColor = {
          'враждебные':'#c0392b','напряжённые':'#e67e22','нейтральные':'#8a7a6e',
          'тёплые':'#27ae60','близкие':'#2980b9','преданные':'#8b3a1a'
        }[r.intensity||'нейтральные'] || '#8a7a6e';
        return `<div class="rel-item-v2">
          <div class="rel-item-header">
            <div class="rel-avatar" style="background:${colorFor(t)}22;color:${colorFor(t)};cursor:pointer" onclick="openChar('${t.id}')">${t.emoji||initials(t.name)}</div>
            <div class="rel-info" style="cursor:pointer" onclick="openChar('${t.id}')">
              <div class="rel-name">${t.name}${t.family?` <span style="font-size:11px;color:var(--ink3)">${t.family}</span>`:''}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                <span class="rel-badge" style="background:${col}18;color:${col}">${r.type}</span>
                <span style="font-size:11px;color:${intensityColor};font-weight:500">${r.intensity||''}</span>
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button onclick="editRel('${r.id}')" style="background:none;border:0.5px solid var(--parch3);color:var(--ink3);padding:4px 8px;border-radius:6px;cursor:pointer;font-size:12px"><i class="ti ti-edit"></i></button>
              <button onclick="deleteRel('${r.id}')" style="background:none;border:0.5px solid var(--parch3);color:var(--ink3);padding:4px 8px;border-radius:6px;cursor:pointer;font-size:12px"><i class="ti ti-trash"></i></button>
            </div>
          </div>
          ${r.description ? `<div class="rel-detail-row"><span class="rel-detail-label">Описание</span><span>${r.description}</span></div>` : ''}
          ${r.how_they_met ? `<div class="rel-detail-row"><span class="rel-detail-label">Как познакомились</span><span>${r.how_they_met}</span></div>` : ''}
          ${r.dynamic ? `<div class="rel-detail-row"><span class="rel-detail-label">Динамика</span><span>${r.dynamic}</span></div>` : ''}
          ${r.conflicts ? `<div class="rel-detail-row"><span class="rel-detail-label">Конфликты</span><span>${r.conflicts}</span></div>` : ''}
          ${r.secrets ? `<div class="rel-detail-row"><span class="rel-detail-label">Тайны / что скрывают</span><span>${r.secrets}</span></div>` : ''}
          ${r.current_status ? `<div class="rel-detail-row"><span class="rel-detail-label">Текущий статус</span><span>${r.current_status}</span></div>` : ''}
          ${r.history ? `<div class="rel-detail-row"><span class="rel-detail-label">История отношений</span><span>${r.history}</span></div>` : ''}
        </div>`;}).join('')
    : `<div style="color:var(--ink3);font-size:13px;padding:.5rem 0">Связей пока нет</div>`;

  // Books timeline
  const booksHtml = cBooks.length ? cBooks.map(b => `
    <div class="book-entry">
      <div class="book-entry-header">
        <div>
          <div class="book-entry-title">${b.book_title}</div>
          <div class="book-entry-role">${b.role||''}${b.age_at_events?' · '+b.age_at_events:''}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="book-entry-del" onclick="editCharBookEntry('${b.id}')" title="Редактировать"><i class="ti ti-edit"></i></button>
          <button class="book-entry-del" onclick="deleteCharBook('${b.id}')" title="Удалить"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      ${b.appearance_changes?`<div class="book-entry-section"><span class="book-entry-label">Изменения внешности</span><p>${b.appearance_changes}</p></div>`:''}
      ${b.personality_changes?`<div class="book-entry-section"><span class="book-entry-label">Изменения характера</span><p>${b.personality_changes}</p></div>`:''}
      ${b.arc?`<div class="book-entry-section"><span class="book-entry-label">Арка</span><p>${b.arc}</p></div>`:''}
      ${b.key_events?`<div class="book-entry-section"><span class="book-entry-label">Ключевые события</span><p>${b.key_events}</p></div>`:''}
      ${b.relationships_changes?`<div class="book-entry-section"><span class="book-entry-label">Изменения в отношениях</span><p>${b.relationships_changes}</p></div>`:''}
      ${b.notes?`<div class="book-entry-section"><span class="book-entry-label">Заметки</span><p>${b.notes}</p></div>`:''}
    </div>`).join('')
  : `<div style="color:var(--ink3);font-size:13px;padding:.5rem 0">Ещё не добавлено ни одной книги</div>`;

  const prompt = buildGenPrompt(c);

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-layout">
      <div class="detail-sidebar">
        <div class="detail-avatar" style="background:${col}18">
          ${(() => { const av = imgs.find(i => i.id === c.avatar_image_id) || imgs[0]; const pos = {'top':'50% 15%','center':'50% 50%','bottom':'50% 85%'}[c.avatar_position||'top']||'50% 15%'; return av ? `<img src="${av.url}" alt="${c.name}" style="object-position:${pos}">` : `<div class="detail-avatar-placeholder">${c.emoji||'👤'}</div>`; })()}
        </div>
        <div class="section-title">Галерея</div>
        ${imgsHtml}
        <button class="add-img-btn" onclick="showImgModal('${c.id}')"><i class="ti ti-photo-plus"></i> Добавить изображение</button>
      </div>

      <div class="detail-content">
        <div class="detail-name">${c.name}${c.nickname?` <span style="font-size:18px;color:var(--ink3);font-style:italic">"${c.nickname}"</span>`:''}</div>
        <div class="detail-role">
          ${c.role||''}
          ${c.birth_date?` · р. ${c.birth_date}`:''}
          ${c.death_date?` · ум. ${c.death_date}`:''}
          ${c.gender?' · '+c.gender:''}
        </div>
        ${(c.tags||[]).length?`<div class="char-card-tags" style="margin-bottom:1rem">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`:''}

        <div class="tabs">
          <div class="tab active" onclick="switchTab('info',this)">Внешность</div>
          <div class="tab" onclick="switchTab('char',this)">Характер</div>
          <div class="tab" onclick="switchTab('story',this)">История</div>
          <div class="tab" onclick="switchTab('books',this)">По книгам <span class="tab-badge">${cBooks.length}</span></div>
          <div class="tab" onclick="switchTab('relations',this)">Связи <span class="tab-badge">${rels.length}</span></div>
          <div class="tab" onclick="switchTab('prompt',this)">AI-промпт</div>
          <div class="tab" onclick="switchTab('all',this)" style="margin-left:auto;color:var(--gold)">📋 Всё</div>
        </div>

        <div id="tab-info">
          ${buildInfoBlock('Параметры', [['Рост',c.height],['Телосложение',c.body_type],['Волосы',c.hair],['Глаза',c.eyes],['Кожа',c.skin],['Голос',c.voice]])}
          ${c.appearance?`<div class="info-block"><h3>Описание внешности</h3><p class="bio-text">${c.appearance}</p></div>`:''}
          ${c.distinctive_marks?`<div class="info-block"><h3>Особые приметы</h3><p class="bio-text">${c.distinctive_marks}</p></div>`:''}
          ${c.style?`<div class="info-block"><h3>Стиль одежды</h3><p class="bio-text">${c.style}</p></div>`:''}
        </div>

        <div id="tab-char" style="display:none">
          ${c.personality?`<div class="info-block"><h3>Характер</h3><p class="bio-text">${c.personality}</p></div>`:''}
          ${buildInfoBlock('Психологический профиль',[['Сильные стороны',c.strengths],['Слабые стороны',c.weaknesses],['Страхи',c.fears],['Желания',c.desires],['Мотивация',c.motivation]])}
          ${c.habits?`<div class="info-block"><h3>Привычки</h3><p class="bio-text">${c.habits}</p></div>`:''}
          ${c.speech_style?`<div class="info-block"><h3>Манера речи</h3><p class="bio-text">${c.speech_style}</p></div>`:''}
          ${c.worldview?`<div class="info-block"><h3>Мировоззрение</h3><p class="bio-text">${c.worldview}</p></div>`:''}
          ${c.secret?`<div class="info-block"><h3>🔒 Тайна</h3><p class="bio-text">${c.secret}</p></div>`:''}
        </div>

        <div id="tab-story" style="display:none">
          ${c.bio?`<div class="info-block"><h3>Биография</h3><p class="bio-text">${c.bio}</p></div>`:''}
          ${c.backstory?`<div class="info-block"><h3>Предыстория</h3><p class="bio-text">${c.backstory}</p></div>`:''}
          ${c.key_events?`<div class="info-block"><h3>Ключевые события (общее)</h3><p class="bio-text">${c.key_events}</p></div>`:''}
          ${c.arc?`<div class="info-block"><h3>Общая арка</h3><p class="bio-text">${c.arc}</p></div>`:''}
          ${c.notes?`<div class="info-block"><h3>📝 Заметки автора</h3><p class="bio-text">${c.notes}</p></div>`:''}
        </div>

        <div id="tab-books" style="display:none">
          <div class="books-timeline">${booksHtml}</div>
          <button class="add-rel-btn" style="margin-top:1rem" onclick="showCharBookModal('${c.id}')">
            <i class="ti ti-plus"></i> Добавить книгу
          </button>
        </div>

        <div id="tab-relations" style="display:none">
          <div class="rel-list">${relsHtml}</div>
          <button class="add-rel-btn" onclick="showRelModal('${c.id}')"><i class="ti ti-plus"></i> Добавить связь</button>
        </div>

        <div id="tab-prompt" style="display:none">
          <div class="info-block">
            <h3>Базовый промпт</h3>
            <div class="prompt-box" onclick="copyText(this.textContent)">${prompt}</div>
            <div class="copy-hint"><i class="ti ti-copy"></i> Нажми чтобы скопировать</div>
            <div style="font-size:12px;color:var(--ink3);margin-bottom:8px">С эмоцией:</div>
            <div class="emotion-tags">${EMOTIONS.map(em=>`<span class="emotion-tag" onclick="copyPromptWithEmotion('${c.id}','${em}')">${em}</span>`).join('')}</div>
          </div>
        </div>

        <div id="tab-all" style="display:none">
          ${buildAllTab(c)}
        </div>

        <div class="action-btns">
          <button class="btn-edit" onclick="editChar('${c.id}')"><i class="ti ti-edit"></i> Редактировать</button>
          <button class="btn-delete" onclick="deleteChar('${c.id}')"><i class="ti ti-trash"></i> Удалить</button>
        </div>
      </div>
    </div>`;
}

function buildInfoBlock(title, rows) {
  const valid = rows.filter(([,v]) => v);
  if (!valid.length) return '';
  return `<div class="info-block"><h3>${title}</h3>${valid.map(([k,v])=>`
    <div class="info-row"><span class="info-key">${k}</span><span class="info-val">${v}</span></div>`).join('')}</div>`;
}

function switchTab(name, el) {
  ['info','char','story','books','relations','prompt','all'].forEach(t => {
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
    if (f === 'char_type') {
      const val = c[f] || 'main';
      const radio = document.querySelector(`input[name="char_type"][value="${val}"]`);
      if (radio) radio.checked = true;
      return;
    }
    if (f === 'avatar_image_id' || f === 'avatar_position') return;
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
    if (f === 'char_type') {
      const radio = document.querySelector('input[name="char_type"]:checked');
      data[f] = radio ? radio.value : 'main';
      return;
    }
    if (f === 'avatar_image_id' || f === 'avatar_position') return; // handled separately
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
    charBooks = charBooks.filter(b => b.character_id !== id);
    renderSidebar(); showView('all'); renderGrid(); updateBookFilter();
    showToast('Персонаж удалён');
  } catch(e) { showToast('Ошибка удаления'); }
}

// ── CHAR BOOK MODAL ──
function showCharBookModal(charId) {
  editingCharBookId = null;
  document.getElementById('cb-char-id').value = charId;
  document.getElementById('charBookModalTitle').textContent = 'Добавить книгу';
  CHARBOOK_FIELDS.forEach(f => { const el = document.getElementById('cb-'+f); if(el) el.value=''; });
  document.getElementById('cb-book_order').value = getCharBooks(charId).length + 1;
  document.getElementById('charBookModal').style.display = 'flex';
}

function editCharBookEntry(bookId) {
  const b = charBooks.find(b => b.id === bookId);
  if (!b) return;
  editingCharBookId = bookId;
  document.getElementById('cb-char-id').value = b.character_id;
  document.getElementById('charBookModalTitle').textContent = 'Редактировать книгу';
  CHARBOOK_FIELDS.forEach(f => {
    const el = document.getElementById('cb-'+f);
    if (el) el.value = b[f] || '';
  });
  document.getElementById('charBookModal').style.display = 'flex';
}
async function saveCharBook() {
  const charId = document.getElementById('cb-char-id').value;
  const bookTitle = document.getElementById('cb-book_title').value.trim();
  if (!bookTitle) { showToast('Введи название книги'); return; }
  const btn = document.getElementById('saveCharBookBtn');
  btn.disabled = true;
  const data = { character_id: charId };
  CHARBOOK_FIELDS.forEach(f => { const el = document.getElementById('cb-'+f); if(el) data[f] = el.value; });
  data.book_order = parseInt(data.book_order) || 1;
  try {
    if (editingCharBookId) {
      const { error } = await db.from('character_books').update(data).eq('id', editingCharBookId);
      if (error) throw error;
      const idx = charBooks.findIndex(b => b.id === editingCharBookId);
      if (idx >= 0) charBooks[idx] = { ...charBooks[idx], ...data };
      hideModal('charBookModal');
      if (currentChar && currentChar.id === charId) renderDetail();
      showToast('Запись обновлена');
    } else {
      const { data: newCB, error } = await db.from('character_books').insert(data).select().single();
      if (error) throw error;
      charBooks.push(newCB);
      hideModal('charBookModal');
      if (currentChar && currentChar.id === charId) renderDetail();
      updateBookFilter();
      showToast('Книга добавлена');
    }
  } catch(e) {
    console.error(e); showToast('Ошибка: ' + (e.message||''));
  } finally { btn.disabled = false; editingCharBookId = null; }
}
async function deleteCharBook(id) {
  if (!confirm('Удалить запись об этой книге?')) return;
  try {
    await db.from('character_books').delete().eq('id', id);
    charBooks = charBooks.filter(b => b.id !== id);
    if (currentChar) renderDetail();
    showToast('Удалено');
  } catch(e) { showToast('Ошибка'); }
}

// ── WORLDS ──
function renderWorlds() {
  const el = document.getElementById('worldsGrid');
  if (!worlds.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-world"></i><p>Миров пока нет. Создай первый!</p></div>`;
    return;
  }
  el.innerHTML = `<div class="worlds-grid">${worlds.map(w=>`
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
  const worldCities = cities.filter(c => c.world_id === w.id);

  const sb = (title, val) => val ? `<div class="info-block"><h3>${title}</h3><p class="bio-text">${val}</p></div>` : '';
  const infoRow = (k,v) => v ? `<div class="info-row"><span class="info-key">${k}</span><span class="info-val">${v}</span></div>` : '';

  document.getElementById('worldDetailContent').innerHTML = `
    <div style="max-width:900px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
        <div>
          <div class="detail-name">🌍 ${w.name}</div>
          <div class="detail-role">${[w.genre,w.subgenres,w.mood].filter(Boolean).join(' · ')}</div>
          ${w.world_motto?`<div style="font-style:italic;color:var(--ink3);margin-top:4px">"${w.world_motto}"</div>`:''}
        </div>
        <div class="action-btns" style="margin-top:0">
          <button class="btn-edit" onclick="editWorld('${w.id}')"><i class="ti ti-edit"></i> Редактировать</button>
          <button class="btn-delete" onclick="deleteWorld('${w.id}')"><i class="ti ti-trash"></i> Удалить</button>
        </div>
      </div>

      <div class="tabs" style="flex-wrap:wrap">
        <div class="tab active" onclick="switchWorldTab('overview',this)">Обзор</div>
        <div class="tab" onclick="switchWorldTab('history',this)">История</div>
        <div class="tab" onclick="switchWorldTab('magic',this)">Магия</div>
        <div class="tab" onclick="switchWorldTab('laws',this)">Законы</div>
        <div class="tab" onclick="switchWorldTab('people',this)">Люди</div>
        <div class="tab" onclick="switchWorldTab('state',this)">Государство</div>
        <div class="tab" onclick="switchWorldTab('society',this)">Общество</div>
        <div class="tab" onclick="switchWorldTab('economy',this)">Экономика</div>
        <div class="tab" onclick="switchWorldTab('culture2',this)">Культура</div>
        <div class="tab" onclick="switchWorldTab('daily',this)">Быт</div>
        <div class="tab" onclick="switchWorldTab('notable',this)">Личности</div>
        <div class="tab" onclick="switchWorldTab('cities',this)">Города <span class="tab-badge">${worldCities.length}</span></div>
      </div>

      <div id="wtab-overview">
        ${sb('Краткое описание', w.summary)}
        ${sb('Центральная идея', w.central_idea)}
        ${sb('Основные темы', w.main_themes)}
        ${sb('Уникальная особенность', w.unique_feature)}
        ${sb('Чем отличается от типичного фэнтези', w.differs_from_typical)}
        ${sb('Что считается невозможным', w.what_is_impossible)}
        ${sb('География', w.geography)}
        ${sb('Технологии', w.technology)}
        ${sb('Политика', w.politics)}
        ${sb('Религия', w.religion)}
        ${sb('Культура', w.culture)}
        ${sb('Конфликты', w.conflicts)}
        ${sb('Заметки', w.notes)}
      </div>

      <div id="wtab-history" style="display:none">
        ${sb('Как появился мир / кто создал', w.world_creation)}
        ${sb('Легенды о создании', w.creation_legends)}
        ${sb('Что известно историкам', w.historians_knowledge)}
        ${sb('Мифы vs. правда', w.myths_vs_truth)}
        ${sb('Эпохи', w.epochs)}
        ${sb('История мира', w.history)}
        ${sb('Важнейшие исторические события', w.important_events)}
        ${sb('Разрушительные войны', w.destructive_wars)}
        ${sb('Катастрофы', w.disasters)}
        ${sb('Важные открытия', w.important_discoveries)}
        ${sb('Начало современной эпохи', w.modern_era_start)}
        ${sb('События разделившие историю на "до" и "после"', w.before_after_events)}
        ${sb('Хронология', w.chronology)}
      </div>

      <div id="wtab-magic" style="display:none">
        ${sb('Что считается магией', w.magic_definition)}
        ${sb('Источник магии', w.magic_source)}
        ${sb('Кто может использовать', w.magic_who_can)}
        ${sb('Кто не может', w.magic_who_cannot)}
        ${sb('Как появляется способность', w.magic_how_appears)}
        ${sb('Можно ли потерять', w.magic_can_lose)}
        ${sb('Ограничения', w.magic_limits)}
        ${sb('Цена использования', w.magic_cost)}
        ${sb('Можно ли обучиться', w.magic_can_learn)}
        ${sb('Школы магии', w.magic_schools)}
        ${sb('Как магия влияет на общество', w.magic_society_impact)}
        ${sb('Запретные виды магии', w.magic_forbidden)}
        ${sb('Кто контролирует использование', w.magic_control)}
        ${sb('Магическая система (общее)', w.magic_system)}
      </div>

      <div id="wtab-laws" style="display:none">
        ${sb('Физические законы, которые отличаются', w.physical_laws)}
        ${sb('Бессмертие', w.immortality)}
        ${sb('Воскрешение', w.resurrection)}
        ${sb('Душа / что происходит после смерти', w.soul || w.afterlife)}
        ${sb('Призраки', w.ghosts)}
        ${sb('Путешествия во времени', w.time_travel)}
        ${sb('Судьба — существует ли, можно ли изменить', w.fate)}
      </div>

      <div id="wtab-people" style="display:none">
        ${sb('Основные народы и этносы', w.peoples || w.ethnic_groups)}
        ${sb('Внешние отличия народов', w.appearance_differences)}
        ${sb('Типичные имена', w.typical_names)}
        ${sb('Языки и диалекты', w.languages)}
        ${sb('Продолжительность жизни', w.lifespan)}
        ${sb('Стандарты красоты', w.beauty_standards)}
      </div>

      <div id="wtab-state" style="display:none">
        ${sb('Форма правления', w.gov_form)}
        ${sb('Кто руководит и как передаётся власть', w.gov_ruler || w.gov_succession)}
        ${sb('Парламент / выборы', w.gov_parliament)}
        ${sb('Аристократия и сословия', w.gov_aristocracy || w.gov_classes)}
        ${sb('Титулы и должности', w.gov_titles)}
        <div class="all-section-title" style="margin-top:1rem">Право</div>
        ${sb('Основные законы', w.law_main)}
        ${sb('Тяжкие преступления', w.law_crimes)}
        ${sb('Полиция и суд', w.law_police || w.law_court)}
        ${sb('Тюрьмы и наказания', w.law_prisons || w.law_punishment)}
        ${sb('Права граждан', w.law_rights)}
        <div class="all-section-title" style="margin-top:1rem">Армия</div>
        ${sb('Обязательная / профессиональная служба', w.army_service)}
        ${sb('Звания и рода войск', w.army_ranks || w.army_branches)}
        ${sb('Оружие', w.army_weapons)}
        ${sb('Известные полководцы', w.army_commanders)}
        ${sb('Военные академии', w.army_academies)}
        ${sb('Политика (общее)', w.politics)}
      </div>

      <div id="wtab-society" style="display:none">
        ${sb('Роль мужчин', w.soc_men)}
        ${sb('Роль женщин', w.soc_women)}
        ${sb('Роль детей', w.soc_children)}
        ${sb('Семья и брак', w.soc_family || w.soc_marriage)}
        ${sb('Наследование', w.soc_inheritance)}
        ${sb('Отношение к бедным', w.soc_poor)}
        ${sb('Отношение к богатым', w.soc_rich)}
        ${sb('Религия', w.religion)}
      </div>

      <div id="wtab-economy" style="display:none">
        ${sb('Валюта', w.econ_currency)}
        ${sb('Доход среднего человека', w.econ_income)}
        ${sb('Налоги', w.econ_taxes)}
        ${sb('Основные отрасли', w.econ_industries)}
        ${sb('Торговля (импорт/экспорт)', w.econ_trade)}
        ${sb('Богатейшие города/регионы', w.econ_rich)}
        ${sb('Беднейшие регионы', w.econ_poor)}
        <div class="all-section-title" style="margin-top:1rem">Технологии</div>
        ${sb('Общий уровень технологий', w.tech_level || w.technology)}
        ${sb('Открытия изменившие мир', w.tech_discoveries)}
        ${sb('Источники энергии', w.tech_energy)}
        ${sb('Транспорт', w.tech_transport)}
        ${sb('Связь', w.tech_communication)}
        ${sb('Медицина', w.tech_medicine)}
        ${sb('Оружие', w.tech_weapons)}
        ${sb('Строительство', w.tech_construction)}
      </div>

      <div id="wtab-culture2" style="display:none">
        ${sb('Праздники', w.cult_holidays)}
        ${sb('Музыка', w.cult_music)}
        ${sb('Театр', w.cult_theatre)}
        ${sb('Литература', w.cult_literature)}
        ${sb('Архитектура', w.cult_architecture)}
        ${sb('Мода и причёски', w.cult_fashion)}
        ${sb('Национальные символы', w.cult_symbols)}
        ${sb('Культура (общее)', w.culture)}
        <div class="all-section-title" style="margin-top:1rem">Образование</div>
        ${sb('Школы и университеты', w.edu_schools || w.edu_universities)}
        ${sb('Кто может учиться', w.edu_who_can)}
        ${sb('Грамотность населения', w.edu_literacy)}
        ${sb('Престижные профессии', w.edu_prestigious)}
        ${sb('Предметы', w.edu_subjects)}
        <div class="all-section-title" style="margin-top:1rem">СМИ и язык</div>
        ${sb('Газеты и книги', w.media_newspapers || w.media_books)}
        ${sb('Почта и телеграф', w.media_post || w.media_telegraph)}
        ${sb('Кто распространяет новости', w.media_news)}
        ${sb('Государственный язык и алфавит', w.lang_state || w.lang_alphabet)}
        ${sb('Диалекты', w.lang_dialects)}
        ${sb('Пословицы и идиомы', w.lang_proverbs)}
        ${sb('Сленг и ругательства', w.lang_slang)}
      </div>

      <div id="wtab-daily" style="display:none">
        <div class="all-section-title">Медицина</div>
        ${sb('Кто лечит людей', w.med_healers)}
        ${sb('Распространённые болезни', w.med_diseases)}
        ${sb('Смертельные болезни', w.med_deadly)}
        ${sb('Хирургия и анестезия', w.med_surgery)}
        ${sb('Лекарственные растения', w.med_herbs)}
        ${sb('Продолжительность жизни', w.med_lifespan)}
        <div class="all-section-title" style="margin-top:1rem">Быт</div>
        ${sb('Что едят', w.life_food)}
        ${sb('Что пьют', w.life_drinks)}
        ${sb('Как готовят', w.life_cooking)}
        ${sb('Типичный завтрак / обед / ужин', [w.life_breakfast, w.life_dinner].filter(Boolean).join(' | '))}
        ${sb('Жильё', w.life_housing)}
        ${sb('Освещение и отопление', [w.life_lighting, w.life_heating].filter(Boolean).join(' | '))}
        ${sb('Водоснабжение', w.life_water)}
        <div class="all-section-title" style="margin-top:1rem">Транспорт</div>
        ${sb('Дороги и железные дороги', w.trans_roads || w.trans_railways)}
        ${sb('Корабли и воздушный транспорт', w.trans_ships || w.trans_air)}
        ${sb('Скорость и стоимость путешествий', w.trans_speed || w.trans_cost)}
        <div class="all-section-title" style="margin-top:1rem">Повседневная жизнь</div>
        ${sb('Рабочий день', w.daily_workday || w.daily_hours)}
        ${sb('Выходные и отпуска', w.daily_weekends)}
        ${sb('Вечерний досуг', w.daily_evening)}
        ${sb('Развлечения и спорт', w.daily_entertainment || w.daily_sports)}
      </div>

      <div id="wtab-notable" style="display:none">
        ${sb('Величайшие учёные', w.notable_scientists)}
        ${sb('Полководцы', w.notable_commanders)}
        ${sb('Художники и изобретатели', w.notable_artists)}
        ${sb('Известные преступники', w.notable_criminals)}
        ${sb('Герои', w.notable_heroes)}
        <div class="all-section-title" style="margin-top:1rem">Главные организации</div>
        ${sb('Гильдии', w.orgs_guilds)}
        ${sb('Тайные общества', w.orgs_secret)}
        ${sb('Военные организации', w.orgs_military)}
        ${sb('Банки и корпорации', w.orgs_banks)}
      </div>

      <div id="wtab-cities" style="display:none">
        ${worldCities.length ? `
          <div class="worlds-grid">${worldCities.map(city=>`
            <div class="world-card" onclick="openCity('${city.id}')">
              <div class="world-card-icon">🏙️</div>
              <div class="world-card-body">
                <div class="world-card-name">${city.name}</div>
                <div class="world-card-genre">${city.region||''}</div>
                ${city.first_impression?`<div class="world-card-summary">${city.first_impression}</div>`:''}
              </div>
            </div>`).join('')}
          </div>` : `<div style="color:var(--ink3);font-size:14px;padding:1rem 0">Городов пока нет</div>`}
        <button class="topbar-btn" style="margin-top:1rem" onclick="showAddCityModal('${w.id}')">
          <i class="ti ti-building-plus"></i> Добавить город
        </button>
      </div>
    </div>`;
}

function switchWorldTab(name, el) {
  ['overview','history','magic','laws','people','state','society','economy','culture2','daily','notable','cities'].forEach(t => {
    const e = document.getElementById('wtab-'+t); if(e) e.style.display = t===name?'block':'none';
  });
  // Only update active tab within the world detail tabs container
  const tabsContainer = el ? el.closest('.tabs') : null;
  if (tabsContainer) {
    tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
}
function showAddWorldModal() {
  editingWorldId = null;
  document.getElementById('worldModalTitle').textContent = 'Новый мир';
  document.getElementById('saveWorldBtnText').textContent = 'Сохранить';
  WORLD_EXTENDED_FIELDS.forEach(f => { const el = document.getElementById('w-'+f); if(el) el.value=''; });
  switchModalTab('wbasic', document.querySelector('#worldModal .modal-tab'));
  document.getElementById('worldModal').style.display = 'flex';
}
function editWorld(id) {
  const w = getWorld(id); if(!w) return;
  editingWorldId = id;
  document.getElementById('worldModalTitle').textContent = 'Редактировать мир';
  WORLD_EXTENDED_FIELDS.forEach(f => { const el = document.getElementById('w-'+f); if(el) el.value=w[f]||''; });
  switchModalTab('wbasic', document.querySelector('#worldModal .modal-tab'));
  document.getElementById('worldModal').style.display = 'flex';
}
async function saveWorld() {
  const name = document.getElementById('w-name').value.trim();
  if (!name) { showToast('Введи название'); return; }
  const btn = document.getElementById('saveWorldBtn');
  btn.disabled = true; document.getElementById('saveWorldBtnText').textContent = 'Сохранение...';
  const data = {};
  WORLD_EXTENDED_FIELDS.forEach(f => { const el = document.getElementById('w-'+f); if(el) data[f]=el.value; });
  try {
    if (editingWorldId) {
      const { error } = await db.from('worlds').update(data).eq('id', editingWorldId);
      if (error) throw error;
      const idx = worlds.findIndex(w=>w.id===editingWorldId);
      if (idx>=0) worlds[idx]={...worlds[idx],...data};
      currentWorld = getWorld(editingWorldId);
      hideModal('worldModal'); renderWorldDetail();
    } else {
      const { data: nw, error } = await db.from('worlds').insert(data).select().single();
      if (error) throw error;
      worlds.push(nw); hideModal('worldModal'); renderWorlds();
    }
    showToast(editingWorldId?'Мир обновлён':'Мир добавлен');
  } catch(e) { console.error(e); showToast('Ошибка: '+(e.message||'')); }
  finally { btn.disabled=false; document.getElementById('saveWorldBtnText').textContent='Сохранить'; }
}
async function deleteWorld(id) {
  if (!confirm('Удалить этот мир?')) return;
  try {
    await db.from('worlds').delete().eq('id', id);
    worlds = worlds.filter(w=>w.id!==id);
    showView('worlds'); showToast('Мир удалён');
  } catch(e) { showToast('Ошибка'); }
}

// ── MODAL TABS ──
function switchModalTab(name, el) {
  const modal = el ? el.closest('.modal') : null;
  if (modal) { modal.querySelectorAll('.modal-tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); }
  document.querySelectorAll('[id^=mtab-]').forEach(t=>t.style.display='none');
  const target = document.getElementById('mtab-'+name);
  if (target) target.style.display='block';
}

// ── IMAGE UPLOAD ──
let imgCharId=null, imgFile=null;
function showImgModal(charId) {
  imgCharId = charId; imgFile = null; imgOriginalDataUrl = null;
  document.getElementById('imgPreviewWrap').style.display = 'none';
  document.getElementById('imgPreview').src = '';
  document.getElementById('uploadBtnText').textContent = 'Загрузить';
  document.getElementById('imgFileInput').value = '';
  document.getElementById('img-period').value = '';
  document.getElementById('img-comment').value = '';
  document.getElementById('imgModal').style.display = 'flex';
}
let imgOriginalDataUrl = null;

function previewImage(event) {
  imgFile = event.target.files[0]; if(!imgFile) return;
  const reader = new FileReader();
  reader.onload = e => {
    imgOriginalDataUrl = e.target.result;
    const p = document.getElementById('imgPreview');
    p.src = e.target.result;
    document.getElementById('imgPreviewWrap').style.display = 'block';
  };
  reader.readAsDataURL(imgFile);
}

function openCropperFromPreview() {
  if (!imgOriginalDataUrl) return;
  initCropper(imgOriginalDataUrl);
}
async function uploadImage() {
  if(!imgFile){showToast('Выбери файл');return;}
  const btn=document.querySelector('#imgModal .btn-save');
  btn.disabled=true; document.getElementById('uploadBtnText').textContent='Загрузка...';
  try {
    const ext=imgFile.name.split('.').pop();
    const fileName=`${imgCharId}/${Date.now()}.${ext}`;
    const {error:upError}=await db.storage.from('character-images').upload(fileName,imgFile,{cacheControl:'3600',upsert:false});
    if(upError) throw upError;
    const {data:urlData}=db.storage.from('character-images').getPublicUrl(fileName);
    const emotion = document.getElementById('img-emotion').value;
    const period = document.getElementById('img-period').value.trim();
    const comment = document.getElementById('img-comment').value.trim();
    const {data:imgRecord,error:dbError} = await db.from('character_images').insert({character_id:imgCharId,emotion,period,comment,url:urlData.publicUrl}).select().single();
    if(dbError) throw dbError;
    images.push(imgRecord);
    preloadGraphImages();
    hideModal('imgModal');
    if(currentChar&&currentChar.id===imgCharId) renderDetail();
    renderGrid(); renderSidebar();
    showToast('Изображение загружено');
  } catch(e){console.error(e);showToast('Ошибка: '+(e.message||''));}
  finally{btn.disabled=false;document.getElementById('uploadBtnText').textContent='Загрузить';}
}
async function setAvatar(charId, imgId) {
  showFocalModal(charId, imgId);
}

function showFocalModal(charId, imgId) {
  const img = images.find(i => i.id === imgId);
  if (!img) return;
  document.getElementById('focal-char-id').value = charId;
  document.getElementById('focal-img-id').value = imgId;
  document.getElementById('focal-preview').src = img.url;
  // Reset buttons
  document.querySelectorAll('.focal-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.focal-btn[data-pos="top"]').classList.add('active');
  document.getElementById('focalModal').style.display = 'flex';
}

async function applyFocal(position) {
  document.querySelectorAll('.focal-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.focal-btn[data-pos="${position}"]`).classList.add('active');
  document.getElementById('focal-position').value = position;
}

async function confirmAvatar() {
  const charId = document.getElementById('focal-char-id').value;
  const imgId = document.getElementById('focal-img-id').value;
  const position = document.getElementById('focal-position').value || 'top';
  try {
    const { error } = await db.from('characters').update({ avatar_image_id: imgId, avatar_position: position }).eq('id', charId);
    if (error) throw error;
    const c = getChar(charId);
    if (c) { c.avatar_image_id = imgId; c.avatar_position = position; }
    if (currentChar && currentChar.id === charId) {
      currentChar.avatar_image_id = imgId;
      currentChar.avatar_position = position;
      renderDetail();
    }
    hideModal('focalModal');
    renderGrid();
    showToast('Аватар обновлён');
  } catch(e) { showToast('Ошибка'); }
}

async function deleteImage(imgId,charId) {
  if(!confirm('Удалить изображение?')) return;
  try {
    const img=images.find(i=>i.id===imgId);
    if(img){const path=img.url.split('/character-images/')[1];if(path) await db.storage.from('character-images').remove([path]);}
    await db.from('character_images').delete().eq('id',imgId);
    images=images.filter(i=>i.id!==imgId);
    if(currentChar&&currentChar.id===charId) renderDetail();
    renderGrid(); showToast('Удалено');
  } catch(e){showToast('Ошибка');}
}

// ── RELATIONSHIPS ──
function showRelModal(charId) {
  editingRelId = null;
  currentRelCharId = charId;
  document.getElementById('relModalTitle').textContent = 'Добавить связь';
  document.getElementById('rel-target').innerHTML = chars.filter(c=>c.id!==charId).map(c=>`<option value="${c.id}">${c.emoji||''} ${c.name}</option>`).join('');
  ['rel-desc','rel-dynamic','rel-history','rel-conflicts','rel-secrets','rel-how_they_met','rel-current_status'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('rel-type').value = 'Друзья';
  document.getElementById('rel-intensity').value = 'нейтральные';
  document.getElementById('relModal').style.display='flex';
}

function editRel(relId) {
  const r = relationships.find(r=>r.id===relId);
  if (!r) return;
  editingRelId = relId;
  currentRelCharId = r.character_id;
  document.getElementById('relModalTitle').textContent = 'Редактировать связь';
  document.getElementById('rel-target').innerHTML = chars.filter(c=>c.id!==r.character_id).map(c=>`<option value="${c.id}">${c.emoji||''} ${c.name}</option>`).join('');
  document.getElementById('rel-target').value = r.target_id;
  document.getElementById('rel-type').value = r.type || 'Друзья';
  document.getElementById('rel-intensity').value = r.intensity || 'нейтральные';
  document.getElementById('rel-desc').value = r.description || '';
  document.getElementById('rel-dynamic').value = r.dynamic || '';
  document.getElementById('rel-history').value = r.history || '';
  document.getElementById('rel-conflicts').value = r.conflicts || '';
  document.getElementById('rel-secrets').value = r.secrets || '';
  document.getElementById('rel-how_they_met').value = r.how_they_met || '';
  document.getElementById('rel-current_status').value = r.current_status || '';
  document.getElementById('relModal').style.display='flex';
}
async function saveRel() {
  const targetId = document.getElementById('rel-target').value;
  const data = {
    character_id: currentRelCharId,
    target_id: targetId,
    type: document.getElementById('rel-type').value,
    intensity: document.getElementById('rel-intensity').value,
    description: document.getElementById('rel-desc').value,
    dynamic: document.getElementById('rel-dynamic').value,
    history: document.getElementById('rel-history').value,
    conflicts: document.getElementById('rel-conflicts').value,
    secrets: document.getElementById('rel-secrets').value,
    how_they_met: document.getElementById('rel-how_they_met').value,
    current_status: document.getElementById('rel-current_status').value,
  };
  try {
    if (editingRelId) {
      const { error } = await db.from('relationships').update(data).eq('id', editingRelId);
      if (error) throw error;
      const idx = relationships.findIndex(r=>r.id===editingRelId);
      if (idx>=0) relationships[idx] = { ...relationships[idx], ...data };
      showToast('Связь обновлена');
    } else {
      const { data: newRel, error } = await db.from('relationships').insert(data).select().single();
      if (error) throw error;
      relationships.push(newRel);
      showToast('Связь добавлена');
    }
    editingRelId = null;
    hideModal('relModal');
    if (currentChar) renderDetail();
  } catch(e) { console.error(e); showToast('Ошибка: '+(e.message||'')); }
}

async function deleteRel(relId) {
  if (!confirm('Удалить эту связь?')) return;
  try {
    await db.from('relationships').delete().eq('id', relId);
    relationships = relationships.filter(r=>r.id!==relId);
    if (currentChar) renderDetail();
    showToast('Связь удалена');
  } catch(e) { showToast('Ошибка'); }
}

// ── RELATIONS MAP ──
function renderRelMap() {
  const el=document.getElementById('relMapContent'); if(!el) return;
  const withRels=chars.filter(c=>getRels(c.id).length>0);
  if(!withRels.length){el.innerHTML=`<div class="empty-state"><i class="ti ti-topology-star"></i><p>Добавьте связи между персонажами</p></div>`;return;}
  el.innerHTML=withRels.map(c=>{
    const rels=getRels(c.id);
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
function hideModal(id){document.getElementById(id).style.display='none';}
function closeModalBg(e,id){if(e.target.id===id)hideModal(id);}
function openLightbox(url){document.getElementById('lbImg').src=url;document.getElementById('lightbox').style.display='flex';}
function closeLightbox(){document.getElementById('lightbox').style.display='none';}

// ── TOAST ──
let toastTimer;
function showToast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg; el.style.display='block';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.style.display='none',2500);
}

function buildAllTab(c) {
  const row = (label, val) => val ? `<div class="all-row"><span class="all-key">${label}</span><span class="all-val">${val}</span></div>` : '';
  const section = (title, rows) => {
    const content = rows.map(([l,v])=>row(l,v)).join('');
    return content ? `<div class="all-section"><div class="all-section-title">${title}</div>${content}</div>` : '';
  };
  const longRow = (label, val) => val ? `<div class="all-long-row"><div class="all-key">${label}</div><div class="all-long-val">${val.replace(/\n/g,'<br>')}</div></div>` : '';

  return `
    ${section('Основное', [
      ['Полное имя', c.name], ['Прозвище', c.nickname], ['Роль', c.role],
      ['Тип', c.char_type==='secondary'?'Второстепенный':'Главный'],
      ['Пол', c.gender], ['Дата рождения', c.birth_date], ['Дата смерти', c.death_date],
      ['Семья', c.family], ['Поколение', c.generation], ['Книга', c.book],
    ])}

    <div class="all-section-title" style="margin-top:1.5rem">Внешность</div>
    ${section('Параметры', [
      ['Рост', c.height], ['Телосложение', c.body_type],
      ['Физ. сила (впечатление)', c.build_strength], ['Осанка', c.posture],
      ['Правша/левша', c.handedness], ['Походка', c.gait],
    ])}
    ${section('Лицо', [
      ['Форма лица', c.face_shape], ['Лоб', c.forehead],
      ['Скулы', c.cheekbones], ['Подбородок', c.chin], ['Челюсть', c.jaw],
    ])}
    ${section('Кожа', [
      ['Оттенок', c.skin], ['Загар/веснушки', c.skin_tan],
    ])}
    ${section('Глаза', [
      ['Цвет', c.eyes], ['Форма', c.eye_shape],
      ['Расположение', c.eye_set], ['Ресницы/брови', c.brows_lashes], ['Взгляд', c.gaze],
    ])}
    ${section('Лицо (детали)', [
      ['Нос', c.nose], ['Губы', c.lips], ['Уши', c.ears],
      ['Шея', c.neck], ['Руки', c.hands],
    ])}
    ${section('Волосы', [
      ['Цвет', c.hair], ['Текстура/густота', c.hair_texture],
    ])}
    ${longRow('Причёска', c.hairstyle)}
    ${section('Голос и образ', [
      ['Голос', c.voice], ['Аксессуары', c.accessories],
      ['Обувь', c.footwear], ['Личные предметы', c.personal_items],
      ['Цветовая палитра', c.color_palette],
    ])}
    ${longRow('Манера держаться', c.mannerisms)}
    ${longRow('Стиль одежды', c.style)}
    ${longRow('Особые приметы', c.distinctive_marks)}
    ${longRow('Первое впечатление', c.first_impression)}
    ${longRow('Что делает узнаваемым', c.signature_feature)}
    ${longRow('Описание внешности', c.appearance)}

    <div class="all-section-title" style="margin-top:1.5rem">Характер</div>
    ${longRow('Три слова', c.personality_words)}
    ${longRow('Что не подходит', c.personality_not)}
    ${section('Базовые параметры', [
      ['Темперамент', c.temperament], ['Интроверт/экстраверт', c.introvert],
      ['Что важнее', c.core_priority],
    ])}
    ${longRow('Шкалы', c.personality_scales)}
    ${longRow('Общий характер', c.personality)}
    ${longRow('Самооценка', c.self_esteem)}
    ${section('Самооценка (детали)', [
      ['Главное достоинство', c.self_strength], ['Главный недостаток', c.self_weakness],
      ['Страхи самооценки', c.self_fears],
    ])}
    ${longRow('Мировоззрение / ценности', c.worldview)}
    ${longRow('Что считает непростительным', c.unforgivable)}
    ${longRow('Моральные границы', c.moral_limits)}
    ${longRow('Качества в людях', c.people_values)}
    ${longRow('Страхи', c.fears)}
    ${longRow('Желания и мечты', c.desires)}
    ${longRow('Мотивация', c.motivation)}
    ${longRow('Общение', c.social)}
    ${longRow('Дружба', c.friendship)}
    ${longRow('Поведение среди близких', c.behavior_close)}
    ${longRow('Конфликты', c.conflict_style)}
    ${longRow('Лидерство', c.leadership)}
    ${longRow('Интеллект', c.intellect)}
    ${longRow('Мышление', c.thinking_style)}
    ${longRow('Эмоциональность', c.emotions)}
    ${longRow('Реакция на стресс', c.stress_response)}
    ${longRow('Манера речи', c.speech_style)}
    ${longRow('Юмор', c.humor)}
    ${longRow('Повседневные привычки', c.habits)}
    ${longRow('Маленькие слабости', c.favorites)}
    ${longRow('Что выводит из себя', c.triggers)}
    ${longRow('Сильные стороны', c.strengths)}
    ${longRow('Слабые стороны', c.weaknesses)}
    ${longRow('Парадоксы личности', c.paradoxes)}
    ${longRow('Внутренние противоречия', c.inner_conflicts)}
    ${longRow('Как воспринимают', c.perception)}
    ${longRow('Тайна', c.secret)}

    <div class="all-section-title" style="margin-top:1.5rem">Глубокие вопросы</div>
    ${longRow('Когда никто не видит', c.alone_behavior)}
    ${longRow('Счастливейшая память', c.happiest_memory)}
    ${longRow('Болезненная память', c.painful_memory)}
    ${longRow('Сожаления', c.regrets)}
    ${longRow('Хотел бы услышать', c.longing)}
    ${longRow('Никогда не скажет вслух', c.would_change)}

    <div class="all-section-title" style="margin-top:1.5rem">История</div>
    ${longRow('Биография', c.bio)}
    ${longRow('Предыстория', c.backstory)}
    ${longRow('Ключевые события', c.key_events)}
    ${longRow('Общая арка', c.arc)}
    ${longRow('Заметки автора', c.notes)}
  `;
}

let currentCity = null;
let editingCityId = null;

function openCity(id) {
  currentCity = cities.find(c=>c.id===id);
  if (!currentCity) return;
  renderCityDetail();
}

function renderCityDetail() {
  const city = currentCity;
  const sb = (title, val) => val ? `<div class="info-block"><h3>${title}</h3><p class="bio-text">${val}</p></div>` : '';
  document.getElementById('worldDetailContent').innerHTML = `
    <div style="max-width:900px">
      <div class="back-btn" onclick="renderWorldDetail()" style="margin-bottom:1.5rem"><i class="ti ti-arrow-left"></i> К миру</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
        <div>
          <div class="detail-name">🏙️ ${city.name}</div>
          <div class="detail-role">${[city.region, city.founded?'основан '+city.founded:''].filter(Boolean).join(' · ')}</div>
          ${city.motto?`<div style="font-style:italic;color:var(--ink3);margin-top:4px">"${city.motto}"</div>`:''}
        </div>
        <div class="action-btns" style="margin-top:0">
          <button class="btn-edit" onclick="showAddCityModal('${city.world_id}','${city.id}')"><i class="ti ti-edit"></i> Редактировать</button>
          <button class="btn-delete" onclick="deleteCity('${city.id}')"><i class="ti ti-trash"></i> Удалить</button>
        </div>
      </div>
      <div class="tabs">
        <div class="tab active" onclick="switchCityTab('info',this)">Основное</div>
        <div class="tab" onclick="switchCityTab('history',this)">История</div>
        <div class="tab" onclick="switchCityTab('life',this)">Жизнь</div>
        <div class="tab" onclick="switchCityTab('mood',this)">Атмосфера</div>
      </div>
      <div id="ctab-info">
        ${sb('Население', city.population)} ${sb('Площадь', city.area)}
        ${sb('Языки', city.languages)} ${sb('Грамотность', city.literacy)}
        ${sb('Планировка', city.layout)} ${sb('Архитектура', city.architecture)}
        ${sb('Достопримечательности', city.landmarks)}
        ${sb('Экономика', city.economy)} ${sb('Власть', city.government)}
        ${sb('Заметки', city.notes)}
      </div>
      <div id="ctab-history" style="display:none">
        ${sb('История города', city.city_history)}
        ${sb('Главные события', city.city_events)}
        ${sb('Известные жители', city.famous_residents)}
      </div>
      <div id="ctab-life" style="display:none">
        ${sb('Повседневная жизнь', city.daily_life)}
        ${sb('Запахи города', city.smells)}
        ${sb('Звуки', city.sounds)}
        ${sb('Еда', city.food)}
      </div>
      <div id="ctab-mood" style="display:none">
        ${sb('Первое впечатление', city.first_impression)}
        ${sb('Три слова', city.three_words)}
        ${sb('Цветовая палитра', city.color_palette)}
        ${sb('Ритм жизни', city.rhythm)}
        ${sb('Опасные места', city.danger_places)}
        ${sb('Безопасные места', city.safe_places)}
        ${sb('Места, которые знают только местные', city.locals_only)}
        ${sb('Легенды', city.city_legends)}
      </div>
    </div>`;
}

function switchCityTab(name, el) {
  ['info','history','life','mood'].forEach(t => {
    const e = document.getElementById('ctab-'+t); if(e) e.style.display = t===name?'block':'none';
  });
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
}

function showAddCityModal(worldId, cityId) {
  editingCityId = cityId || null;
  document.getElementById('city-world-id').value = worldId;
  document.getElementById('cityModalTitle').textContent = cityId ? 'Редактировать город' : 'Новый город';
  const city = cityId ? cities.find(c=>c.id===cityId) : null;
  CITY_FIELDS.forEach(f => {
    const el = document.getElementById('city-'+f);
    if (el) el.value = city ? (city[f]||'') : '';
  });
  switchModalTab('citybasic', document.querySelector('#cityModal .modal-tab'));
  document.getElementById('cityModal').style.display = 'flex';
}

async function saveCity() {
  const worldId = document.getElementById('city-world-id').value;
  const name = document.getElementById('city-name').value.trim();
  if (!name) { showToast('Введи название города'); return; }
  const btn = document.getElementById('saveCityBtn');
  btn.disabled = true;
  const data = { world_id: worldId };
  CITY_FIELDS.forEach(f => { const el = document.getElementById('city-'+f); if(el) data[f]=el.value; });
  try {
    if (editingCityId) {
      const { error } = await db.from('world_cities').update(data).eq('id', editingCityId);
      if (error) throw error;
      const idx = cities.findIndex(c=>c.id===editingCityId);
      if (idx>=0) cities[idx] = {...cities[idx],...data};
      currentCity = cities.find(c=>c.id===editingCityId);
      hideModal('cityModal'); renderCityDetail();
    } else {
      const { data: newCity, error } = await db.from('world_cities').insert(data).select().single();
      if (error) throw error;
      cities.push(newCity);
      hideModal('cityModal'); renderWorldDetail();
      switchWorldTab('cities', null);
    }
    showToast(editingCityId ? 'Город обновлён' : 'Город добавлен');
  } catch(e) { console.error(e); showToast('Ошибка: '+(e.message||'')); }
  finally { btn.disabled=false; editingCityId=null; }
}

async function deleteCity(id) {
  if (!confirm('Удалить город?')) return;
  try {
    await db.from('world_cities').delete().eq('id', id);
    cities = cities.filter(c=>c.id!==id);
    renderWorldDetail();
    showToast('Город удалён');
  } catch(e) { showToast('Ошибка'); }
}

function buildBookRolesHTML(c, cBooks) {
  const roleColor = {
    'Главный герой':    '#8b3a1a',
    'Антагонист':       '#8b2a7a',
    'Любовный интерес': '#c0392b',
    'Наставник':        '#2a7a8b',
    'Союзник':          '#2a8b4a',
    'Второстепенный':   '#8a7a6e',
    'Другое':           '#8a7a6e',
  };

  // Collect all book appearances
  const appearances = [];

  // Main book from character card
  if (c.book && c.role) {
    appearances.push({ book: c.book, role: c.role, order: 999 });
  } else if (c.book) {
    appearances.push({ book: c.book, role: 'Второстепенный', order: 999 });
  }

  // From character_books table (overrides main if same book title)
  cBooks.forEach(b => {
    const existing = appearances.findIndex(a => a.book === b.book_title);
    if (existing >= 0) {
      appearances[existing] = { book: b.book_title, role: b.role || appearances[existing].role, order: b.book_order || 999 };
    } else {
      appearances.push({ book: b.book_title, role: b.role || 'Второстепенный', order: b.book_order || 999 });
    }
  });

  // Sort by order
  appearances.sort((a, b) => a.order - b.order);

  if (!appearances.length) return '';

  return `<div class="book-roles-list">${appearances.map(a => {
    const col = roleColor[a.role] || '#8a7a6e';
    const icon = a.role === 'Главный герой' ? '★' :
                 a.role === 'Антагонист' ? '⚔' :
                 a.role === 'Любовный интерес' ? '♡' :
                 a.role === 'Наставник' ? '◆' :
                 a.role === 'Союзник' ? '◇' : '·';
    return `<div class="book-role-row">
      <span class="book-role-icon" style="color:${col}">${icon}</span>
      <span class="book-role-name">${a.book}</span>
      <span class="book-role-label" style="color:${col}">${a.role}</span>
    </div>`;
  }).join('')}</div>`;
}

init();
