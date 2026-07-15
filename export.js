// =============================================
// Character Bible — PDF Export
// =============================================

async function exportToPDF() {
  if (!chars || chars.length === 0) {
    showToast('Нет персонажей для экспорта');
    return;
  }
  showToast('Подготовка PDF...');

  const now = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Character Bible</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Jost',sans-serif;background:white;color:#1a1410;font-size:11pt}
@page{margin:0;size:A4}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}

.cover{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1410;color:#faf6f0;page-break-after:always;text-align:center;padding:2rem}
.cover-title{font-family:'Cormorant Garamond',serif;font-size:52pt;font-weight:300;letter-spacing:0.06em}
.cover-title span{color:#b8922a;font-style:italic}
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
.toc-section{margin-bottom:18px}
.toc-section-label{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#8a7a6e;margin-bottom:6px;padding-bottom:3px;border-bottom:0.5px solid #e8dfd2}
.toc-item{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11pt;color:#4a3f35}
.toc-item-role{font-size:9pt;color:#8a7a6e;margin-left:auto}

.char-page{padding:48px 56px;page-break-after:always;min-height:100vh}
.char-header{display:flex;gap:28px;margin-bottom:28px;align-items:flex-start}
.char-main-img{width:190px;height:250px;object-fit:cover;border-radius:8px;display:block;flex-shrink:0}
.char-placeholder{width:190px;height:250px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:60px;flex-shrink:0}
.char-name{font-family:'Cormorant Garamond',serif;font-size:30pt;font-weight:500;line-height:1.1}
.char-nickname{font-style:italic;color:#8a7a6e;font-size:16pt}
.char-role{font-size:9pt;text-transform:uppercase;letter-spacing:0.08em;color:#8b3a1a;margin-top:6px}
.char-meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px}
.char-meta-item{font-size:10pt;color:#8a7a6e}
.char-meta-item strong{color:#1a1410}
.char-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:10px}
.char-tag{font-size:8pt;padding:2px 8px;border-radius:20px;background:#f2ece2;color:#4a3f35;border:0.5px solid #e8dfd2}

.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.section-block{margin-bottom:16px}
.section-block h3{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#8a7a6e;margin-bottom:6px;padding-bottom:3px;border-bottom:0.5px solid #e8dfd2}
.section-block p{font-family:'Cormorant Garamond',serif;font-size:13pt;line-height:1.75;color:#4a3f35}
.info-grid{display:grid;grid-template-columns:110px 1fr;gap:3px 10px}
.info-k{font-size:9.5pt;color:#8a7a6e}
.info-v{font-size:9.5pt;color:#1a1410}

.emotion-gallery{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.emotion-item{text-align:center}
.emotion-item img{width:76px;height:76px;object-fit:cover;border-radius:6px;display:block}
.emotion-item span{font-size:7.5pt;color:#8a7a6e;margin-top:3px;display:block}

.rel-row{display:flex;align-items:center;gap:8px;padding:5px 8px;background:#f2ece2;border-radius:5px;margin-bottom:5px;font-size:10pt}
.rel-type{color:#8a7a6e;width:110px;flex-shrink:0;font-size:9pt}

.world-page{padding:48px 56px;page-break-after:always}
.world-name{font-family:'Cormorant Garamond',serif;font-size:30pt;font-weight:500;margin-bottom:4px}
.world-genre{font-size:9pt;color:#b8922a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:24px}
</style>
</head>
<body>`;

  // ── COVER ──
  html += `<div class="cover">
    <div class="cover-title">Character <span>Bible</span></div>
    <div class="cover-sub">База знаний писателя</div>
    <div class="cover-stats">
      <div><div class="cover-stat-num">${chars.length}</div><div class="cover-stat-label">Персонажей</div></div>
      <div><div class="cover-stat-num">${worlds.length}</div><div class="cover-stat-label">Миров</div></div>
      <div><div class="cover-stat-num">${images.length}</div><div class="cover-stat-label">Изображений</div></div>
    </div>
    <div class="cover-date">Экспорт: ${now}</div>
  </div>`;

  // ── TOC ──
  const byBook = {};
  chars.forEach(c => {
    const book = c.book || 'Без книги';
    if (!byBook[book]) byBook[book] = [];
    byBook[book].push(c);
  });

  html += `<div class="toc"><div class="toc-title">Содержание</div>`;
  if (worlds.length) {
    html += `<div class="toc-section"><div class="toc-section-label">Миры</div>`;
    worlds.forEach(w => {
      html += `<div class="toc-item"><span>${w.name}</span><span class="toc-item-role">${w.genre||''}</span></div>`;
    });
    html += `</div>`;
  }
  Object.entries(byBook).forEach(([book, list]) => {
    html += `<div class="toc-section"><div class="toc-section-label">${book}</div>`;
    list.forEach(c => {
      html += `<div class="toc-item"><span>${c.emoji||'👤'} ${c.name}${c.nickname ? ` "${c.nickname}"` : ''}</span><span class="toc-item-role">${c.role||''}</span></div>`;
    });
    html += `</div>`;
  });
  html += `</div>`;

  // ── WORLDS ──
  if (worlds.length) {
    html += `<div class="divider"><div class="divider-label">Часть I</div><div class="divider-title">Миры</div></div>`;
    worlds.forEach(w => {
      const sections = [
        ['Краткое описание', w.summary], ['История мира', w.history],
        ['География', w.geography], ['Магическая система', w.magic_system],
        ['Технологии', w.technology], ['Политика', w.politics],
        ['Религия', w.religion], ['Культура', w.culture],
        ['Главные конфликты', w.conflicts], ['Заметки', w.notes]
      ].filter(([,v]) => v);

      html += `<div class="world-page">
        <div class="world-name">🌍 ${w.name}</div>
        <div class="world-genre">${w.genre||''}</div>
        <div class="two-col">
          ${sections.map(([t,v]) => `<div class="section-block"><h3>${t}</h3><p>${v.replace(/\n/g,'<br>')}</p></div>`).join('')}
        </div>
      </div>`;
    });
  }

  // ── CHARACTERS ──
  html += `<div class="divider"><div class="divider-label">Часть II</div><div class="divider-title">Персонажи</div></div>`;

  for (const c of chars) {
    const charImgs = getImages(c.id);
    const charRels = getRels(c.id);

    const avatarImg = charImgs.find(i => i.id === c.avatar_image_id) || charImgs[0];
    let avatarHtml = `<div class="char-placeholder" style="background:${colorFor(c)}18">${c.emoji||'👤'}</div>`;
    if (avatarImg) {
      try {
        const b64 = await urlToBase64(avatarImg.url);
        avatarHtml = `<img class="char-main-img" src="${b64}" alt="${c.name}">`;
      } catch(e) {}
    }

    // emotion gallery (all other images)
    let emotionHtml = '';
    const otherImgs = charImgs.filter(i => i.id !== (avatarImg && avatarImg.id));
    if (otherImgs.length) {
      const emotionItems = await Promise.all(otherImgs.map(async img => {
        try {
          const b64 = await urlToBase64(img.url);
          const label = [img.period, img.emotion].filter(Boolean).join(' · ');
          return `<div class="emotion-item"><img src="${b64}" alt="${label}"><span>${label}</span></div>`;
        } catch(e) { return ''; }
      }));
      const validItems = emotionItems.filter(Boolean);
      if (validItems.length) {
        emotionHtml = `<div class="section-block"><h3>Галерея</h3><div class="emotion-gallery">${validItems.join('')}</div></div>`;
      }
    }

    // relations
    const relsHtml = charRels.length ? charRels.map(r => {
      const t = getChar(r.target_id);
      if (!t) return '';
      return `<div class="rel-row"><span class="rel-type">${r.type}</span><span>${t.emoji||''} ${t.name}</span>${r.description ? `<span style="color:#8a7a6e;font-size:9pt"> · ${r.description}</span>` : ''}</div>`;
    }).join('') : '';

    // helper: section block
    const sb = (title, val) => val ? `<div class="section-block"><h3>${title}</h3><p>${String(val).replace(/\n/g,'<br>')}</p></div>` : '';
    const infoBlock = (title, rows) => {
      const valid = rows.filter(([,v])=>v);
      if (!valid.length) return '';
      return `<div class="section-block"><h3>${title}</h3><div class="info-grid">${valid.map(([k,v])=>`<span class="info-k">${k}</span><span class="info-v">${v}</span>`).join('')}</div></div>`;
    };

    html += `<div class="char-page">
      <div class="char-header">
        ${avatarHtml}
        <div style="flex:1">
          <div class="char-name">${c.name}${c.nickname ? ` <span class="char-nickname">"${c.nickname}"</span>` : ''}</div>
          <div class="char-role">${c.role||''}</div>
          <div class="char-meta">
            ${c.birth_date ? `<div class="char-meta-item"><strong>Р.</strong> ${c.birth_date}</div>` : ''}
            ${c.death_date ? `<div class="char-meta-item"><strong>Ум.</strong> ${c.death_date}</div>` : ''}
            ${c.book ? `<div class="char-meta-item"><strong>Книга:</strong> ${c.book}</div>` : ''}
            ${c.gender ? `<div class="char-meta-item">${c.gender}</div>` : ''}
          </div>
          ${(c.tags||[]).length ? `<div class="char-tags">${c.tags.map(t=>`<span class="char-tag">${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>

      <div class="two-col">
        <div>
          ${infoBlock('Внешность', [['Рост',c.height],['Телосложение',c.body_type],['Волосы',c.hair],['Глаза',c.eyes],['Кожа',c.skin],['Голос',c.voice]])}
          ${sb('Описание', c.appearance)}
          ${sb('Особые приметы', c.distinctive_marks)}
          ${sb('Стиль', c.style)}
          ${sb('Манера держаться', c.mannerisms)}
          ${sb('Взгляд', c.gaze)}
          ${sb('Первое впечатление', c.first_impression)}
          ${sb('Что делает узнаваемым', c.signature_feature)}
        </div>
        <div>
          ${sb('Три слова', c.personality_words)}
          ${sb('Характер', c.personality)}
          ${sb('Мотивация', c.motivation)}
          ${sb('Ценности', c.worldview)}
          ${sb('Страхи', c.fears)}
          ${sb('Желания', c.desires)}
          ${sb('Тайна', c.secret)}
          ${sb('Парадоксы личности', c.paradoxes)}
          ${sb('Внутренние противоречия', c.inner_conflicts)}
        </div>
      </div>

      ${c.bio ? sb('Биография', c.bio) : ''}
      ${c.backstory ? sb('Предыстория', c.backstory) : ''}
      ${c.arc ? sb('Арка персонажа', c.arc) : ''}
      ${c.key_events ? sb('Ключевые события', c.key_events) : ''}
      ${c.happiest_memory || c.painful_memory ? `<div class="two-col">${sb('Счастливейшая память', c.happiest_memory)}${sb('Болезненная память', c.painful_memory)}</div>` : ''}
      ${c.notes ? sb('📝 Заметки автора', c.notes) : ''}

      ${relsHtml ? `<div class="section-block"><h3>Связи</h3>${relsHtml}</div>` : ''}
      ${emotionHtml}
    </div>`;
  }

  html += `</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { showToast('Разреши всплывающие окна в браузере'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 1500);
  showToast('PDF готов! Выбери "Сохранить как PDF" в диалоге печати');
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
