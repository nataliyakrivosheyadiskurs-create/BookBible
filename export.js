// =============================================
// Character Bible — PDF Export v4
// Полные данные: связи, мир, города
// =============================================

function showExportModal() {
  const sel = document.getElementById('export-char-select');
  sel.innerHTML = '<option value="all">Все персонажи</option>' +
    chars.map(c => `<option value="${c.id}">${c.emoji||'👤'} ${c.name}</option>`).join('');
  document.getElementById('exportModal').style.display = 'flex';
}

async function startExport() {
  const charId = document.getElementById('export-char-select').value;
  const includeImages = document.getElementById('export-include-images').checked;
  const includeWorld = document.getElementById('export-include-world').checked;
  hideModal('exportModal');
  const exportChars = charId === 'all' ? chars : chars.filter(c => c.id === charId);
  await buildPDF(exportChars, includeImages, includeWorld);
}

async function buildPDF(exportChars, includeImages, includeWorld) {
  if (!exportChars.length) { showToast('Нет персонажей для экспорта'); return; }
  showToast('Подготовка PDF...');

  const now = new Date().toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' });
  const isSingle = exportChars.length === 1;

  const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Jost',sans-serif;background:white;color:#1a1410;font-size:11pt;line-height:1.6}
@page{margin:0;size:A4}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}

.cover{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1410;color:#faf6f0;page-break-after:always;text-align:center;padding:2rem}
.cover-title{font-family:'Cormorant Garamond',serif;font-size:52pt;font-weight:300;letter-spacing:0.06em}
.cover-title span{color:#b8922a;font-style:italic}
.cover-char-name{font-family:'Cormorant Garamond',serif;font-size:28pt;color:#b8922a;margin-top:24px}
.cover-sub{font-size:11pt;opacity:0.45;margin-top:10px;letter-spacing:0.12em;text-transform:uppercase}
.cover-stats{display:flex;gap:48px;margin-top:48px}
.cover-stat-num{font-family:'Cormorant Garamond',serif;font-size:30pt;color:#b8922a}
.cover-stat-label{font-size:9pt;opacity:0.45;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px}
.cover-date{font-size:9pt;opacity:0.3;margin-top:40px}

.divider{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f2ece2;page-break-before:always;page-break-after:always}
.divider-label{font-size:9pt;text-transform:uppercase;letter-spacing:0.15em;color:#8a7a6e;margin-bottom:14px}
.divider-title{font-family:'Cormorant Garamond',serif;font-size:40pt;color:#1a1410}

.toc{padding:60px;page-break-after:always}
.toc-title{font-family:'Cormorant Garamond',serif;font-size:26pt;margin-bottom:28px}
.toc-sec-label{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#8a7a6e;margin-bottom:6px;padding-bottom:3px;border-bottom:0.5px solid #e8dfd2}
.toc-item{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11pt;color:#4a3f35}
.toc-role{font-size:9pt;color:#8a7a6e;margin-left:auto}

.img-page{height:100vh;display:flex;flex-direction:column;page-break-after:always;position:relative;background:#1a1410}
.img-page img{width:100%;height:100%;object-fit:contain;display:block}
.img-caption{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.8));color:white;padding:24px 32px 28px}
.img-caption-name{font-family:'Cormorant Garamond',serif;font-size:22pt}
.img-caption-meta{font-size:11pt;opacity:0.7;margin-top:4px}

.char-page{padding:48px 56px;page-break-after:always}
.char-header{display:flex;gap:28px;margin-bottom:28px;align-items:flex-start}
.char-main-img{width:180px;height:240px;object-fit:cover;border-radius:8px;display:block;flex-shrink:0}
.char-placeholder{width:180px;height:240px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:56px;flex-shrink:0;background:#f2ece2}
.char-name{font-family:'Cormorant Garamond',serif;font-size:28pt;font-weight:500;line-height:1.1}
.char-nickname{font-style:italic;color:#8a7a6e;font-size:14pt}
.char-role{font-size:9pt;text-transform:uppercase;letter-spacing:0.08em;color:#8b3a1a;margin-top:6px}
.char-meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px}
.char-meta-item{font-size:10pt;color:#8a7a6e}
.char-meta-item strong{color:#1a1410}
.char-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:10px}
.char-tag{font-size:8pt;padding:2px 8px;border-radius:20px;background:#f2ece2;color:#4a3f35;border:0.5px solid #e8dfd2}

.sec-title{font-size:8.5pt;text-transform:uppercase;letter-spacing:0.12em;color:#8a7a6e;margin:20px 0 10px;padding-bottom:4px;border-bottom:1px solid #e8dfd2;font-weight:600}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sb{margin-bottom:14px}
.sb h3{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#8a7a6e;margin-bottom:5px}
.sb p{font-family:'Cormorant Garamond',serif;font-size:12.5pt;line-height:1.75;color:#4a3f35}
.info-grid{display:grid;grid-template-columns:110px 1fr;gap:3px 10px}
.info-k{font-size:9.5pt;color:#8a7a6e;padding:2px 0}
.info-v{font-size:9.5pt;color:#1a1410;padding:2px 0}

/* RELATIONS — полный блок */
.rel-block{border:0.5px solid #e8dfd2;border-radius:8px;padding:14px;margin-bottom:12px;background:#faf6f0}
.rel-block-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.rel-avatar-pdf{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.rel-name-pdf{font-family:'Cormorant Garamond',serif;font-size:15pt;font-weight:500}
.rel-badges{display:flex;gap:6px;align-items:center;margin-top:2px;flex-wrap:wrap}
.rel-type-badge{font-size:8pt;padding:2px 8px;border-radius:20px;background:#f2ece2;color:#4a3f35;border:0.5px solid #e8dfd2}
.rel-intensity-badge{font-size:8pt;padding:2px 8px;border-radius:20px;font-weight:600}
.rel-detail{display:grid;grid-template-columns:150px 1fr;gap:4px 10px;font-size:10pt;margin-top:6px;padding-top:8px;border-top:0.5px solid #e8dfd2}
.rel-detail-k{color:#8a7a6e;font-size:9.5pt;padding:3px 0}
.rel-detail-v{color:#1a1410;padding:3px 0;font-family:'Cormorant Garamond',serif;font-size:12pt;line-height:1.6}

.book-entry-pdf{border-left:3px solid #b8922a;padding:10px 14px;background:#f2ece2;border-radius:0 6px 6px 0;margin-bottom:10px}
.book-entry-title-pdf{font-family:'Cormorant Garamond',serif;font-size:15pt;font-weight:500}
.book-entry-role-pdf{font-size:9pt;color:#b8922a;text-transform:uppercase;margin-top:2px;margin-bottom:8px}

.rel-row{display:flex;align-items:center;gap:8px;padding:5px 8px;background:#f2ece2;border-radius:5px;margin-bottom:4px;font-size:10pt}
.rel-type{color:#8a7a6e;width:110px;flex-shrink:0;font-size:9pt}

.world-page{padding:48px 56px;page-break-after:always}
.world-name{font-family:'Cormorant Garamond',serif;font-size:28pt;font-weight:500;margin-bottom:4px}
.world-genre{font-size:9pt;color:#b8922a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:24px}
`;

  const INTENSITY_COLORS = {
    'враждебные':'#e74c3c','напряжённые':'#e67e22','нейтральные':'#95a5a6',
    'тёплые':'#27ae60','близкие':'#2980b9','преданные':'#8b3a1a'
  };

  let html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<title>Character Bible</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>`;

  // helpers
  const esc = str => String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  const sb = (title, val) => val ? `<div class="sb"><h3>${title}</h3><p>${esc(val)}</p></div>` : '';
  const infoGrid = (title, rows) => {
    const valid = rows.filter(([,v])=>v);
    if (!valid.length) return '';
    return `<div class="sb"><h3>${title}</h3><div class="info-grid">${valid.map(([k,v])=>`<span class="info-k">${k}</span><span class="info-v">${esc(v)}</span>`).join('')}</div></div>`;
  };

  // ── COVER ──
  if (isSingle) {
    const c = exportChars[0];
    html += `<div class="cover"><div class="cover-title">Character <span>Bible</span></div>
      <div class="cover-char-name">${c.emoji||''} ${c.name}</div>
      <div class="cover-sub">${c.role||''}</div>
      <div class="cover-date">${now}</div></div>`;
  } else {
    html += `<div class="cover"><div class="cover-title">Character <span>Bible</span></div>
      <div class="cover-sub">База знаний писателя</div>
      <div class="cover-stats">
        <div><div class="cover-stat-num">${exportChars.length}</div><div class="cover-stat-label">Персонажей</div></div>
        <div><div class="cover-stat-num">${worlds.length}</div><div class="cover-stat-label">Миров</div></div>
        <div><div class="cover-stat-num">${images.length}</div><div class="cover-stat-label">Изображений</div></div>
      </div>
      <div class="cover-date">${now}</div></div>`;

    // TOC
    const byBook = {};
    exportChars.forEach(c => { const b=c.book||'Без книги'; if(!byBook[b]) byBook[b]=[]; byBook[b].push(c); });
    html += `<div class="toc"><div class="toc-title">Содержание</div>`;
    if (includeWorld && worlds.length) {
      html += `<div class="toc-sec-label" style="margin-bottom:8px">Миры</div>`;
      worlds.forEach(w => { html += `<div class="toc-item"><span>${w.name}</span><span class="toc-role">${w.genre||''}</span></div>`; });
    }
    Object.entries(byBook).forEach(([book,list]) => {
      html += `<div class="toc-sec-label" style="margin-top:16px;margin-bottom:8px">${book}</div>`;
      list.forEach(c => { html += `<div class="toc-item"><span>${c.emoji||'👤'} ${c.name}${c.nickname?` "${c.nickname}"`:''}</span><span class="toc-role">${c.role||''}</span></div>`; });
    });
    html += `</div>`;
  }

  // ── WORLDS ──
  if (includeWorld && worlds.length) {
    html += `<div class="divider"><div class="divider-label">Часть I</div><div class="divider-title">Миры</div></div>`;
    for (const w of worlds) {
      const worldCitiesList = cities.filter(c=>c.world_id===w.id);
      html += `<div class="world-page">
        <div class="world-name">🌍 ${w.name}</div>
        <div class="world-genre">${[w.genre,w.subgenres,w.mood].filter(Boolean).join(' · ')}</div>
        ${w.world_motto?`<div style="font-style:italic;color:#8a7a6e;margin-bottom:20px">"${esc(w.world_motto)}"</div>`:''}

        <div class="sec-title">Основное</div>
        <div class="two-col">
          ${sb('Краткое описание', w.summary)}
          ${sb('Центральная идея', w.central_idea)}
          ${sb('Уникальная особенность', w.unique_feature)}
          ${sb('Основные темы', w.main_themes)}
        </div>

        ${w.history||w.epochs||w.important_events ? `<div class="sec-title">История</div>
        ${sb('История мира', w.history)}
        ${sb('Эпохи', w.epochs)}
        ${sb('Важнейшие события', w.important_events)}
        ${sb('Войны и катастрофы', [w.destructive_wars,w.disasters].filter(Boolean).join(' | '))}
        ${sb('Хронология', w.chronology)}` : ''}

        ${w.magic_system||w.magic_definition ? `<div class="sec-title">Магия</div>
        <div class="two-col">
          ${sb('Источник магии', w.magic_source||w.magic_definition)}
          ${sb('Кто может / не может', [w.magic_who_can,w.magic_who_cannot].filter(Boolean).join(' | '))}
          ${sb('Ограничения и цена', [w.magic_limits,w.magic_cost].filter(Boolean).join(' | '))}
          ${sb('Школы магии', w.magic_schools)}
        </div>
        ${sb('Магическая система', w.magic_system)}` : ''}

        ${w.gov_form||w.politics ? `<div class="sec-title">Государство и общество</div>
        <div class="two-col">
          ${sb('Форма правления', w.gov_form||w.politics)}
          ${sb('Сословия и титулы', [w.gov_classes,w.gov_titles].filter(Boolean).join(' | '))}
          ${sb('Армия', w.army_service)}
          ${sb('Право', w.law_main)}
        </div>` : ''}

        ${w.econ_currency||w.tech_level||w.technology ? `<div class="sec-title">Экономика и технологии</div>
        <div class="two-col">
          ${sb('Валюта', w.econ_currency)}
          ${sb('Основные отрасли', w.econ_industries)}
          ${sb('Уровень технологий', w.tech_level||w.technology)}
          ${sb('Источники энергии', w.tech_energy)}
        </div>` : ''}

        ${w.life_food||w.daily_workday ? `<div class="sec-title">Быт</div>
        <div class="two-col">
          ${sb('Что едят', w.life_food)}
          ${sb('Жильё', w.life_housing)}
          ${sb('Транспорт', w.trans_roads||w.tech_transport)}
          ${sb('Рабочий день', w.daily_workday)}
        </div>` : ''}

        ${w.religion||w.cult_holidays ? `<div class="sec-title">Культура и религия</div>
        ${sb('Религия', w.religion)}
        ${sb('Праздники', w.cult_holidays)}
        ${sb('Язык', w.lang_state)}` : ''}

        ${worldCitiesList.length ? `<div class="sec-title">Города (${worldCitiesList.length})</div>
        <div class="two-col">${worldCitiesList.map(city=>`
          <div class="sb">
            <h3>🏙️ ${city.name}</h3>
            <p>${[city.region, city.population?city.population+' жителей':'', city.three_words].filter(Boolean).join(' · ')}</p>
            ${city.first_impression?`<p style="margin-top:4px;font-size:11pt">${esc(city.first_impression)}</p>`:''}
          </div>`).join('')}</div>` : ''}
      </div>`;
    }
    html += `<div class="divider"><div class="divider-label">Часть II</div><div class="divider-title">Персонажи</div></div>`;
  }

  // ── CHARACTERS ──
  for (const c of exportChars) {
    const charImgs = getImages(c.id);
    const charRels = getRels(c.id);
    const cBooks = getCharBooks(c.id);
    const avatarImg = charImgs.find(i=>i.id===c.avatar_image_id)||charImgs[0];
    const pos = {'top':'50% 15%','center':'50% 50%','bottom':'50% 85%'}[c.avatar_position||'top']||'50% 15%';

    // Full-page images
    if (includeImages && charImgs.length) {
      for (const img of charImgs) {
        try {
          const b64 = await urlToBase64(img.url);
          const label = [img.period, img.emotion, img.comment].filter(Boolean).join(' · ');
          html += `<div class="img-page"><img src="${b64}" alt="${label}">
            <div class="img-caption">
              <div class="img-caption-name">${c.name}</div>
              <div class="img-caption-meta">${label}</div>
            </div></div>`;
        } catch(e) {}
      }
    }

    // Avatar
    let avatarHtml = `<div class="char-placeholder">${c.emoji||'👤'}</div>`;
    if (avatarImg) {
      try {
        const b64 = await urlToBase64(avatarImg.url);
        avatarHtml = `<img class="char-main-img" src="${b64}" style="object-position:${pos}" alt="${c.name}">`;
      } catch(e) {}
    }

    html += `<div class="char-page">
      <div class="char-header">
        ${avatarHtml}
        <div style="flex:1">
          <div class="char-name">${c.name}${c.nickname?` <span class="char-nickname">"${c.nickname}"</span>`:''}</div>
          <div class="char-role">${c.role||''}</div>
          <div class="char-meta">
            ${c.birth_date?`<div class="char-meta-item"><strong>Р.</strong> ${c.birth_date}</div>`:''}
            ${c.death_date?`<div class="char-meta-item"><strong>Ум.</strong> ${c.death_date}</div>`:''}
            ${c.book?`<div class="char-meta-item"><strong>Книга:</strong> ${c.book}</div>`:''}
            ${c.family?`<div class="char-meta-item"><strong>Семья:</strong> ${c.family}</div>`:''}
            ${c.generation?`<div class="char-meta-item">${c.generation}</div>`:''}
            ${c.gender?`<div class="char-meta-item">${c.gender}</div>`:''}
          </div>
          ${(c.tags||[]).length?`<div class="char-tags">${c.tags.map(t=>`<span class="char-tag">${t}</span>`).join('')}</div>`:''}
        </div>
      </div>`;

    // ── APPEARANCE ──
    html += `<div class="sec-title">Внешность</div>`;
    html += `<div class="two-col">`;
    html += infoGrid('Параметры',[['Рост',c.height],['Телосложение',c.body_type],['Осанка',c.posture],['Походка',c.gait],['Правша/левша',c.handedness]]);
    html += infoGrid('Лицо',[['Форма',c.face_shape],['Лоб',c.forehead],['Скулы',c.cheekbones],['Подбородок',c.chin],['Челюсть',c.jaw]]);
    html += `</div><div class="two-col">`;
    html += infoGrid('Глаза',[['Цвет',c.eyes],['Форма',c.eye_shape],['Расположение',c.eye_set],['Ресницы/брови',c.brows_lashes],['Взгляд',c.gaze]]);
    html += infoGrid('Детали',[['Нос',c.nose],['Губы',c.lips],['Уши',c.ears],['Шея',c.neck],['Руки',c.hands]]);
    html += `</div>`;
    html += infoGrid('Кожа',[['Оттенок',c.skin],['Загар/веснушки',c.skin_tan]]);
    html += sb('Особые приметы', c.distinctive_marks);
    html += `<div class="two-col">`;
    html += infoGrid('Волосы',[['Цвет',c.hair],['Текстура',c.hair_texture]]);
    html += infoGrid('Образ',[['Голос',c.voice],['Аксессуары',c.accessories],['Обувь',c.footwear],['Предметы',c.personal_items],['Палитра',c.color_palette]]);
    html += `</div>`;
    html += sb('Причёска', c.hairstyle);
    html += sb('Стиль одежды', c.style);
    html += sb('Манера держаться', c.mannerisms);
    html += sb('Первое впечатление', c.first_impression);
    html += sb('Что делает узнаваемым', c.signature_feature);
    html += sb('Описание внешности', c.appearance);

    // ── CHARACTER ──
    html += `<div class="sec-title">Характер</div>`;
    if (c.personality_words) html += `<div class="sb"><h3>Три слова</h3><p><strong>${esc(c.personality_words)}</strong>${c.personality_not?` / <span style="color:#8a7a6e">не: ${esc(c.personality_not)}</span>`:''}</p></div>`;
    html += `<div class="two-col">`;
    html += sb('Общий характер', c.personality);
    html += infoGrid('Профиль',[['Темперамент',c.temperament],['Тип',c.introvert],['Приоритет',c.core_priority]]);
    html += sb('Шкалы', c.personality_scales);
    html += sb('Мировоззрение / ценности', c.worldview);
    html += `</div><div class="two-col">`;
    html += sb('Страхи', c.fears);
    html += sb('Желания и мечты', c.desires);
    html += sb('Мотивация', c.motivation);
    html += sb('Моральные границы', c.moral_limits);
    html += `</div>`;
    html += `<div class="two-col">`;
    html += sb('Сильные стороны', c.strengths);
    html += sb('Слабые стороны', c.weaknesses);
    html += `</div>`;
    html += sb('Парадоксы личности', c.paradoxes);
    html += sb('Внутренние противоречия', c.inner_conflicts);
    html += `<div class="two-col">`;
    html += sb('Общение', c.social);
    html += sb('Дружба', c.friendship);
    html += sb('Конфликты', c.conflict_style);
    html += sb('Реакция на стресс', c.stress_response);
    html += `</div>`;
    html += sb('Речь', c.speech_style);
    html += sb('Тайна', c.secret);

    // ── DEEP ──
    const deepFields = [['Когда никто не видит',c.alone_behavior],['Счастливейшая память',c.happiest_memory],['Болезненная память',c.painful_memory],['Сожаления',c.regrets],['Никогда не скажет вслух',c.would_change]].filter(([,v])=>v);
    if (deepFields.length) {
      html += `<div class="sec-title">Глубокие вопросы</div><div class="two-col">`;
      deepFields.forEach(([t,v]) => { html += sb(t,v); });
      html += `</div>`;
    }

    // ── STORY ──
    if (c.bio||c.backstory||c.arc||c.key_events) {
      html += `<div class="sec-title">История персонажа</div>`;
      html += sb('Биография', c.bio);
      html += sb('Предыстория', c.backstory);
      html += sb('Арка', c.arc);
      html += sb('Ключевые события', c.key_events);
      html += sb('Заметки автора', c.notes);
    }

    // ── BY BOOKS ──
    if (cBooks.length) {
      html += `<div class="sec-title">Персонаж по книгам</div>`;
      cBooks.forEach(b => {
        html += `<div class="book-entry-pdf">
          <div class="book-entry-title-pdf">${b.book_title}</div>
          <div class="book-entry-role-pdf">${b.role||''}${b.age_at_events?' · '+b.age_at_events:''}</div>
          ${b.appearance_changes?`<div class="sb"><h3>Изменения внешности</h3><p>${esc(b.appearance_changes)}</p></div>`:''}
          ${b.personality_changes?`<div class="sb"><h3>Изменения характера</h3><p>${esc(b.personality_changes)}</p></div>`:''}
          ${b.arc?`<div class="sb"><h3>Арка</h3><p>${esc(b.arc)}</p></div>`:''}
          ${b.key_events?`<div class="sb"><h3>Ключевые события</h3><p>${esc(b.key_events)}</p></div>`:''}
          ${b.relationships_changes?`<div class="sb"><h3>Изменения в отношениях</h3><p>${esc(b.relationships_changes)}</p></div>`:''}
          ${b.notes?`<div class="sb"><h3>Заметки</h3><p>${esc(b.notes)}</p></div>`:''}
        </div>`;
      });
    }

    // ── RELATIONS — ПОЛНЫЕ ДАННЫЕ ──
    if (charRels.length) {
      html += `<div class="sec-title">Связи (${charRels.length})</div>`;
      charRels.forEach(r => {
        const t = getChar(r.target_id); if (!t) return;
        const col = colorFor(t);
        const intColor = INTENSITY_COLORS[r.intensity||'нейтральные'] || '#95a5a6';

        html += `<div class="rel-block">
          <div class="rel-block-header">
            <div class="rel-avatar-pdf" style="background:${col}22;color:${col}">${t.emoji||initials(t.name)}</div>
            <div style="flex:1">
              <div class="rel-name-pdf">${t.name}${t.family?` <span style="font-size:10pt;color:#8a7a6e;font-family:'Jost'">${t.family}</span>`:''}</div>
              <div class="rel-badges">
                <span class="rel-type-badge">${r.type||''}</span>
                ${r.intensity?`<span class="rel-intensity-badge" style="color:${intColor};background:${intColor}18">${r.intensity}</span>`:''}
                ${r.current_status?`<span class="rel-type-badge">${r.current_status}</span>`:''}
              </div>
            </div>
          </div>
          ${r.description||r.how_they_met||r.dynamic||r.conflicts||r.secrets||r.history ? `
          <div class="rel-detail">
            ${r.description?`<span class="rel-detail-k">Описание</span><span class="rel-detail-v">${esc(r.description)}</span>`:''}
            ${r.how_they_met?`<span class="rel-detail-k">Как познакомились</span><span class="rel-detail-v">${esc(r.how_they_met)}</span>`:''}
            ${r.dynamic?`<span class="rel-detail-k">Динамика</span><span class="rel-detail-v">${esc(r.dynamic)}</span>`:''}
            ${r.conflicts?`<span class="rel-detail-k">Конфликты</span><span class="rel-detail-v">${esc(r.conflicts)}</span>`:''}
            ${r.secrets?`<span class="rel-detail-k">Тайны</span><span class="rel-detail-v">${esc(r.secrets)}</span>`:''}
            ${r.history?`<span class="rel-detail-k">История отношений</span><span class="rel-detail-v">${esc(r.history)}</span>`:''}
          </div>` : ''}
        </div>`;
      });
    }

    html += `</div>`; // end char-page
  }

  html += `</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { showToast('Разреши всплывающие окна в браузере'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 2000);
  showToast('PDF готов! Выбери "Сохранить как PDF"');
}

async function urlToBase64(url) {
  const r = await fetch(url);
  const blob = await r.blob();
  return new Promise((res,rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}
