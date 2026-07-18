// =============================================
// Character Bible — PDF Export v3
// Полный экспорт: все персонажи или один
// =============================================

// Показать диалог выбора экспорта
function showExportModal() {
  const sel = document.getElementById('export-char-select');
  sel.innerHTML = '<option value="all">Все персонажи</option>' +
    chars.map(c => `<option value="${c.id}">${c.emoji||'👤'} ${c.name}</option>`).join('');
  document.getElementById('exportModal').style.display = 'flex';
}

async function startExport() {
  const charId = document.getElementById('export-char-select').value;
  const includeImages = document.getElementById('export-include-images').checked;
  hideModal('exportModal');

  const exportChars = charId === 'all' ? chars : chars.filter(c => c.id === charId);
  await buildPDF(exportChars, includeImages);
}

// ── MAIN BUILD ──
async function buildPDF(exportChars, includeImages) {
  if (!exportChars.length) { showToast('Нет персонажей для экспорта'); return; }
  showToast('Подготовка PDF...');

  const now = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const isSingle = exportChars.length === 1;

  const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Jost',sans-serif;background:white;color:#1a1410;font-size:11pt}
@page{margin:0;size:A4}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}

/* COVER */
.cover{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1410;color:#faf6f0;page-break-after:always;text-align:center;padding:2rem}
.cover-title{font-family:'Cormorant Garamond',serif;font-size:52pt;font-weight:300;letter-spacing:0.06em}
.cover-title span{color:#b8922a;font-style:italic}
.cover-sub{font-size:11pt;opacity:0.45;margin-top:10px;letter-spacing:0.12em;text-transform:uppercase}
.cover-char-name{font-family:'Cormorant Garamond',serif;font-size:28pt;color:#b8922a;margin-top:24px}
.cover-stats{display:flex;gap:48px;margin-top:48px}
.cover-stat-num{font-family:'Cormorant Garamond',serif;font-size:30pt;color:#b8922a}
.cover-stat-label{font-size:9pt;opacity:0.45;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px}
.cover-date{font-size:9pt;opacity:0.3;margin-top:40px}

/* DIVIDERS */
.divider{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f2ece2;page-break-before:always;page-break-after:always}
.divider-label{font-size:9pt;text-transform:uppercase;letter-spacing:0.15em;color:#8a7a6e;margin-bottom:14px}
.divider-title{font-family:'Cormorant Garamond',serif;font-size:40pt;color:#1a1410}

/* TOC */
.toc{padding:60px;page-break-after:always}
.toc-title{font-family:'Cormorant Garamond',serif;font-size:26pt;margin-bottom:28px}
.toc-section{margin-bottom:18px}
.toc-section-label{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#8a7a6e;margin-bottom:6px;padding-bottom:3px;border-bottom:0.5px solid #e8dfd2}
.toc-item{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11pt;color:#4a3f35}
.toc-item-role{font-size:9pt;color:#8a7a6e;margin-left:auto}

/* FULL PAGE IMAGE */
.img-page{height:100vh;display:flex;flex-direction:column;page-break-after:always;position:relative;background:#1a1410}
.img-page img{width:100%;height:100%;object-fit:contain;display:block}
.img-page-caption{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));color:white;padding:24px 32px 28px;font-family:'Cormorant Garamond',serif}
.img-page-caption-name{font-size:22pt;font-weight:400}
.img-page-caption-meta{font-size:11pt;opacity:0.7;margin-top:4px}

/* CHAR PAGE */
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

/* SECTIONS */
.section-title{font-size:8pt;text-transform:uppercase;letter-spacing:0.12em;color:#8a7a6e;margin:20px 0 10px;padding-bottom:4px;border-bottom:0.5px solid #e8dfd2}
.section-title:first-child{margin-top:0}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sb{margin-bottom:14px}
.sb h3{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#8a7a6e;margin-bottom:5px}
.sb p{font-family:'Cormorant Garamond',serif;font-size:12.5pt;line-height:1.75;color:#4a3f35}
.info-grid{display:grid;grid-template-columns:110px 1fr;gap:3px 10px}
.info-k{font-size:9.5pt;color:#8a7a6e;padding:2px 0}
.info-v{font-size:9.5pt;color:#1a1410;padding:2px 0}

/* RELATIONS */
.rel-row{display:flex;align-items:center;gap:8px;padding:5px 8px;background:#f2ece2;border-radius:5px;margin-bottom:4px;font-size:10pt}
.rel-type{color:#8a7a6e;width:110px;flex-shrink:0;font-size:9pt}

/* BOOK ENTRY */
.book-entry{border-left:3px solid #b8922a;padding:12px 14px;background:#f2ece2;border-radius:0 6px 6px 0;margin-bottom:12px}
.book-entry-title{font-family:'Cormorant Garamond',serif;font-size:16pt;font-weight:500}
.book-entry-role{font-size:9pt;color:#b8922a;text-transform:uppercase;margin-top:2px;margin-bottom:8px}

/* WORLD */
.world-page{padding:48px 56px;page-break-after:always}
.world-name{font-family:'Cormorant Garamond',serif;font-size:28pt;font-weight:500;margin-bottom:4px}
.world-genre{font-size:9pt;color:#b8922a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:24px}
`;

  let html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<title>Character Bible</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>`;

  // ── COVER ──
  if (isSingle) {
    const c = exportChars[0];
    html += `<div class="cover">
      <div class="cover-title">Character <span>Bible</span></div>
      <div class="cover-char-name">${c.emoji||''} ${c.name}</div>
      <div class="cover-sub">${c.role||''}</div>
      <div class="cover-date">${now}</div>
    </div>`;
  } else {
    html += `<div class="cover">
      <div class="cover-title">Character <span>Bible</span></div>
      <div class="cover-sub">База знаний писателя</div>
      <div class="cover-stats">
        <div><div class="cover-stat-num">${exportChars.length}</div><div class="cover-stat-label">Персонажей</div></div>
        <div><div class="cover-stat-num">${worlds.length}</div><div class="cover-stat-label">Миров</div></div>
        <div><div class="cover-stat-num">${images.length}</div><div class="cover-stat-label">Изображений</div></div>
      </div>
      <div class="cover-date">${now}</div>
    </div>`;

    // TOC
    const byBook = {};
    exportChars.forEach(c => { const b = c.book||'Без книги'; if(!byBook[b]) byBook[b]=[]; byBook[b].push(c); });
    html += `<div class="toc"><div class="toc-title">Содержание</div>`;
    if (worlds.length) {
      html += `<div class="toc-section"><div class="toc-section-label">Миры</div>`;
      worlds.forEach(w => { html += `<div class="toc-item"><span>${w.name}</span><span class="toc-item-role">${w.genre||''}</span></div>`; });
      html += `</div>`;
    }
    Object.entries(byBook).forEach(([book, list]) => {
      html += `<div class="toc-section"><div class="toc-section-label">${book}</div>`;
      list.forEach(c => { html += `<div class="toc-item"><span>${c.emoji||'👤'} ${c.name}${c.nickname?` "${c.nickname}"`:''}</span><span class="toc-item-role">${c.role||''}</span></div>`; });
      html += `</div>`;
    });
    html += `</div>`;

    // WORLDS
    if (worlds.length) {
      html += `<div class="divider"><div class="divider-label">Часть I</div><div class="divider-title">Миры</div></div>`;
      worlds.forEach(w => {
        const sections = [
          ['Краткое описание',w.summary],['История мира',w.history],['География',w.geography],
          ['Магическая система',w.magic_system],['Технологии',w.technology],['Политика',w.politics],
          ['Религия',w.religion],['Культура',w.culture],['Конфликты',w.conflicts],['Заметки',w.notes]
        ].filter(([,v])=>v);
        html += `<div class="world-page"><div class="world-name">🌍 ${w.name}</div><div class="world-genre">${w.genre||''}</div>
          <div class="two-col">${sections.map(([t,v])=>`<div class="sb"><h3>${t}</h3><p>${esc(v)}</p></div>`).join('')}</div></div>`;
      });
    }
    html += `<div class="divider"><div class="divider-label">Часть II</div><div class="divider-title">Персонажи</div></div>`;
  }

  // ── CHARACTERS ──
  for (const c of exportChars) {
    const charImgs = getImages(c.id);
    const charRels = getRels(c.id);
    const cBooks = getCharBooks(c.id);
    const avatarImg = charImgs.find(i => i.id === c.avatar_image_id) || charImgs[0];
    const pos = {'top':'50% 15%','center':'50% 50%','bottom':'50% 85%'}[c.avatar_position||'top']||'50% 15%';

    // ── FULL-PAGE IMAGES ──
    if (includeImages && charImgs.length) {
      for (const img of charImgs) {
        try {
          const b64 = await urlToBase64(img.url);
          const label = [img.period, img.emotion].filter(Boolean).join(' · ');
          html += `<div class="img-page">
            <img src="${b64}" alt="${label}">
            <div class="img-page-caption">
              <div class="img-page-caption-name">${c.name}</div>
              <div class="img-page-caption-meta">${label}</div>
            </div>
          </div>`;
        } catch(e) {}
      }
    }

    // ── CHAR HEADER ──
    let avatarHtml = `<div class="char-placeholder">${c.emoji||'👤'}</div>`;
    if (!includeImages && avatarImg) {
      try {
        const b64 = await urlToBase64(avatarImg.url);
        avatarHtml = `<img class="char-main-img" src="${b64}" style="object-position:${pos}" alt="${c.name}">`;
      } catch(e) {}
    } else if (includeImages) {
      // images already shown full-page, just show small avatar
      if (avatarImg) {
        try {
          const b64 = await urlToBase64(avatarImg.url);
          avatarHtml = `<img class="char-main-img" src="${b64}" style="object-position:${pos}" alt="${c.name}">`;
        } catch(e) {}
      }
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
            ${c.gender?`<div class="char-meta-item">${c.gender}</div>`:''}
          </div>
          ${(c.tags||[]).length?`<div class="char-tags">${c.tags.map(t=>`<span class="char-tag">${t}</span>`).join('')}</div>`:''}
        </div>
      </div>`;

    // ── APPEARANCE ──
    const appRows = [
      ['Рост',c.height],['Телосложение',c.body_type],['Телосложение (впечатление)',c.build_strength],
      ['Осанка',c.posture],['Походка',c.gait],['Правша/левша',c.handedness]
    ].filter(([,v])=>v);
    const faceRows = [
      ['Форма лица',c.face_shape],['Лоб',c.forehead],['Скулы',c.cheekbones],
      ['Подбородок',c.chin],['Челюсть',c.jaw]
    ].filter(([,v])=>v);
    const eyeRows = [
      ['Цвет',c.eyes],['Форма',c.eye_shape],['Расположение',c.eye_set],
      ['Ресницы/брови',c.brows_lashes],['Взгляд',c.gaze]
    ].filter(([,v])=>v);

    html += `<div class="section-title">Внешность</div><div class="two-col"><div>`;
    if (appRows.length) html += `<div class="sb"><h3>Параметры</h3><div class="info-grid">${appRows.map(([k,v])=>`<span class="info-k">${k}</span><span class="info-v">${v}</span>`).join('')}</div></div>`;
    if (faceRows.length) html += `<div class="sb"><h3>Лицо</h3><div class="info-grid">${faceRows.map(([k,v])=>`<span class="info-k">${k}</span><span class="info-v">${v}</span>`).join('')}</div></div>`;
    html += sb('Кожа', [c.skin, c.skin_tan].filter(Boolean).join('. '));
    html += sb('Особые приметы', c.distinctive_marks);
    html += `</div><div>`;
    if (eyeRows.length) html += `<div class="sb"><h3>Глаза</h3><div class="info-grid">${eyeRows.map(([k,v])=>`<span class="info-k">${k}</span><span class="info-v">${v}</span>`).join('')}</div></div>`;
    const faceDetails = [[c.nose,'Нос'],[c.lips,'Губы'],[c.ears,'Уши'],[c.neck,'Шея'],[c.hands,'Руки']].filter(([v])=>v);
    if (faceDetails.length) html += `<div class="sb"><h3>Детали</h3><div class="info-grid">${faceDetails.map(([v,k])=>`<span class="info-k">${k}</span><span class="info-v">${v}</span>`).join('')}</div></div>`;
    html += sb('Волосы', [c.hair, c.hair_texture].filter(Boolean).join(', '));
    html += sb('Причёска', c.hairstyle);
    html += sb('Голос', c.voice);
    html += `</div></div>`;
    html += sb('Стиль одежды', c.style);
    const accessRows = [[c.accessories,'Аксессуары'],[c.footwear,'Обувь'],[c.personal_items,'Личные предметы'],[c.color_palette,'Цветовая палитра']].filter(([v])=>v);
    if (accessRows.length) html += `<div class="sb"><h3>Аксессуары и предметы</h3><div class="info-grid">${accessRows.map(([v,k])=>`<span class="info-k">${k}</span><span class="info-v">${v}</span>`).join('')}</div></div>`;
    html += sb('Манера держаться', c.mannerisms);
    html += sb('Первое впечатление', c.first_impression);
    html += sb('Что делает узнаваемым', c.signature_feature);
    html += sb('Описание (своими словами)', c.appearance);

    // ── CHARACTER ──
    html += `<div class="section-title">Характер</div>`;
    if (c.personality_words) html += `<div class="sb"><h3>Три слова</h3><p><strong>${esc(c.personality_words)}</strong></p></div>`;
    html += `<div class="two-col"><div>`;
    html += sb('Общий характер', c.personality);
    html += sb('Темперамент', [c.temperament, c.introvert, c.core_priority].filter(Boolean).join(' · '));
    html += sb('Шкалы', c.personality_scales);
    html += sb('Самооценка', c.self_esteem);
    html += sb('Сильные стороны', c.strengths);
    html += sb('Слабые стороны', c.weaknesses);
    html += sb('Мировоззрение / ценности', c.worldview);
    html += sb('Что считает непростительным', c.unforgivable);
    html += sb('Моральные границы', c.moral_limits);
    html += `</div><div>`;
    html += sb('Страхи', c.fears);
    html += sb('Желания и мечты', c.desires);
    html += sb('Главная мотивация', c.motivation);
    html += sb('Общение с людьми', c.social);
    html += sb('Дружба', c.friendship);
    html += sb('Конфликты', c.conflict_style);
    html += sb('Лидерство', c.leadership);
    html += sb('Интеллект', c.intellect);
    html += sb('Особенности мышления', c.thinking_style);
    html += `</div></div>`;
    html += `<div class="two-col">`;
    html += sb('Речь', c.speech_style);
    html += sb('Юмор', c.humor);
    html += `</div>`;
    html += sb('Реакция на стресс', c.stress_response);
    html += sb('Поведение среди близких', c.behavior_close);
    html += sb('Повседневные привычки', c.habits);
    html += sb('Маленькие слабости и любимое', c.favorites);
    html += sb('Что выводит из себя', c.triggers);
    html += sb('Парадоксы личности', c.paradoxes);
    html += sb('Внутренние противоречия', c.inner_conflicts);
    html += sb('Как воспринимают разные люди', c.perception);
    html += sb('Тайна', c.secret);

    // ── DEEP QUESTIONS ──
    const deepFields = [
      ['Что делает когда никто не видит', c.alone_behavior],
      ['Счастливейшая память', c.happiest_memory],
      ['Болезненная память', c.painful_memory],
      ['Сожаления', c.regrets],
      ['Что хотел бы услышать', c.longing],
      ['Что никогда не скажет вслух', c.would_change]
    ].filter(([,v])=>v);
    if (deepFields.length) {
      html += `<div class="section-title">Глубокие вопросы</div><div class="two-col">`;
      deepFields.forEach(([t,v]) => { html += sb(t, v); });
      html += `</div>`;
    }

    // ── STORY ──
    html += `<div class="section-title">История</div>`;
    html += sb('Биография', c.bio);
    html += sb('Предыстория', c.backstory);
    html += sb('Ключевые события (общее)', c.key_events);
    html += sb('Общая арка', c.arc);
    html += sb('Заметки автора', c.notes);

    // ── BY BOOKS ──
    if (cBooks.length) {
      html += `<div class="section-title">По книгам</div>`;
      cBooks.forEach(b => {
        html += `<div class="book-entry">
          <div class="book-entry-title">${b.book_title}</div>
          <div class="book-entry-role">${b.role||''}${b.age_at_events?' · '+b.age_at_events:''}</div>
          ${b.appearance_changes?`<div class="sb"><h3>Изменения внешности</h3><p>${esc(b.appearance_changes)}</p></div>`:''}
          ${b.personality_changes?`<div class="sb"><h3>Изменения характера</h3><p>${esc(b.personality_changes)}</p></div>`:''}
          ${b.arc?`<div class="sb"><h3>Арка</h3><p>${esc(b.arc)}</p></div>`:''}
          ${b.key_events?`<div class="sb"><h3>Ключевые события</h3><p>${esc(b.key_events)}</p></div>`:''}
          ${b.relationships_changes?`<div class="sb"><h3>Изменения в отношениях</h3><p>${esc(b.relationships_changes)}</p></div>`:''}
          ${b.notes?`<div class="sb"><h3>Заметки</h3><p>${esc(b.notes)}</p></div>`:''}
        </div>`;
      });
    }

    // ── RELATIONS ──
    if (charRels.length) {
      html += `<div class="section-title">Связи</div>`;
      charRels.forEach(r => {
        const t = getChar(r.target_id); if(!t) return;
        html += `<div class="rel-row"><span class="rel-type">${r.type}</span><span>${t.emoji||''} ${t.name}</span>${r.description?`<span style="color:#8a7a6e;font-size:9pt"> · ${r.description}</span>`:''}</div>`;
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

// helpers
function sb(title, val) {
  if (!val) return '';
  return `<div class="sb"><h3>${title}</h3><p>${esc(val)}</p></div>`;
}
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}
async function urlToBase64(url) {
  const r = await fetch(url);
  const blob = await r.blob();
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}
