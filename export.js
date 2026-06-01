// =============================================
// Character Bible — PDF Export
// =============================================

async function exportToPDF() {
  showToast('Подготовка PDF...');

  // Build a full HTML page for printing
  const allChars = chars;
  const allWorlds = worlds;

  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Character Bible Export</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --ink:#1a1410; --ink2:#4a3f35; --ink3:#8a7a6e;
    --parch:#faf6f0; --parch2:#f2ece2; --parch3:#e8dfd2;
    --accent:#8b3a1a; --gold:#b8922a;
  }
  body { font-family:'Jost',sans-serif; background:white; color:var(--ink); font-size:11pt; }

  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--ink);
    color: var(--parch);
    page-break-after: always;
    text-align: center;
  }
  .cover-title { font-family:'Cormorant Garamond',serif; font-size:56pt; font-weight:300; letter-spacing:0.06em; }
  .cover-title span { color: #b8922a; font-style: italic; }
  .cover-subtitle { font-size:13pt; opacity:0.5; margin-top:12px; letter-spacing:0.1em; text-transform:uppercase; }
  .cover-date { font-size:10pt; opacity:0.35; margin-top:40px; }
  .cover-stats { display:flex; gap:40px; margin-top:50px; }
  .cover-stat { text-align:center; }
  .cover-stat-num { font-family:'Cormorant Garamond',serif; font-size:32pt; color:#b8922a; }
  .cover-stat-label { font-size:9pt; opacity:0.5; letter-spacing:0.1em; text-transform:uppercase; margin-top:4px; }

  .toc { padding: 60px; page-break-after: always; }
  .toc-title { font-family:'Cormorant Garamond',serif; font-size:28pt; margin-bottom:30px; }
  .toc-section { margin-bottom:20px; }
  .toc-section-title { font-size:9pt; text-transform:uppercase; letter-spacing:0.1em; color:var(--ink3); margin-bottom:8px; border-bottom:0.5px solid var(--parch3); padding-bottom:4px; }
  .toc-item { display:flex; align-items:center; padding:5px 0; font-size:11pt; color:var(--ink2); }
  .toc-item-emoji { width:24px; }
  .toc-item-name { flex:1; }
  .toc-item-role { font-size:9pt; color:var(--ink3); }

  .section-divider {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--parch2);
    page-break-before: always;
    page-break-after: always;
  }
  .section-divider-label { font-size:9pt; text-transform:uppercase; letter-spacing:0.15em; color:var(--ink3); margin-bottom:16px; }
  .section-divider-title { font-family:'Cormorant Garamond',serif; font-size:42pt; font-weight:400; color:var(--ink); }

  .char-page { padding:50px 60px; page-break-after: always; min-height:100vh; }
  .char-header { display:flex; gap:32px; margin-bottom:32px; align-items:flex-start; }
  .char-images { display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
  .char-main-img { width:200px; height:260px; object-fit:cover; border-radius:8px; display:block; }
  .char-main-placeholder { width:200px; height:260px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:64px; }
  .char-name { font-family:'Cormorant Garamond',serif; font-size:32pt; font-weight:500; line-height:1.1; }
  .char-nickname { font-style:italic; color:var(--ink3); font-size:16pt; }
  .char-role { font-size:9pt; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent); margin-top:6px; }
  .char-meta { display:flex; gap:20px; margin-top:12px; flex-wrap:wrap; }
  .char-meta-item { font-size:10pt; color:var(--ink3); }
  .char-meta-item strong { color:var(--ink); }
  .char-tags { display:flex; flex-wrap:wrap; gap:5px; margin-top:12px; }
  .char-tag { font-size:8pt; padding:2px 8px; border-radius:20px; background:var(--parch2); color:var(--ink2); border:0.5px solid var(--parch3); }

  .section-block { margin-bottom:20px; }
  .section-block h3 { font-size:8pt; text-transform:uppercase; letter-spacing:0.1em; color:var(--ink3); margin-bottom:8px; padding-bottom:4px; border-bottom:0.5px solid var(--parch3); }
  .section-block p { font-family:'Cormorant Garamond',serif; font-size:13pt; line-height:1.8; color:var(--ink2); }
  .section-block .info-grid { display:grid; grid-template-columns:120px 1fr; gap:4px 12px; }
  .section-block .info-k { font-size:10pt; color:var(--ink3); }
  .section-block .info-v { font-size:10pt; color:var(--ink); }

  .emotion-gallery { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
  .emotion-item { text-align:center; }
  .emotion-item img { width:80px; height:80px; object-fit:cover; border-radius:6px; display:block; }
  .emotion-item span { font-size:8pt; color:var(--ink3); margin-top:3px; display:block; }

  .rel-list { display:flex; flex-direction:column; gap:6px; }
  .rel-row { display:flex; align-items:center; gap:10px; padding:6px 10px; background:var(--parch2); border-radius:6px; font-size:10pt; }
  .rel-type { color:var(--ink3); width:120px; flex-shrink:0; }
  .rel-name { font-weight:500; color:var(--ink); }
  .rel-desc { color:var(--ink3); font-size:9pt; }

  .world-page { padding:50px 60px; page-break-after: always; }
  .world-name { font-family:'Cormorant Garamond',serif; font-size:32pt; font-weight:500; margin-bottom:4px; }
  .world-genre { font-size:9pt; color:var(--gold); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:28px; }

  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @page { margin: 0; size: A4; }
</style>
</head>
<body>`;

  // ── COVER ──
  const now = new Date().toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'});
  html += `
  <div class="cover">
    <div class="cover-title">Character <span>Bible</span></div>
    <div class="cover-subtitle">База знаний писателя</div>
    <div class="cover-stats">
      <div class="cover-stat"><div class="cover-stat-num">${allChars.length}</div><div class="cover-stat-label">Персонажей</div></div>
      <div class="cover-stat"><div class="cover-stat-num">${allWorlds.length}</div><div class="cover-stat-label">Миров</div></div>
      <div class="cover-stat"><div class="cover-stat-num">${images.length}</div><div class="cover-stat-label">Изображений</div></div>
    </div>
    <div class="cover-date">Экспорт: ${now}</div>
  </div>`;

  // ── TABLE OF CONTENTS ──
  if (allChars.length > 0) {
    const byBook = {};
    allChars.forEach(c => {
      const book = c.book || 'Без книги';
      if (!byBook[book]) byBook[book] = [];
      byBook[book].push(c);
    });

    html += `<div class="toc"><div class="toc-title">Содержание</div>`;
    if (allWorlds.length) {
      html += `<div class="toc-section"><div class="toc-section-title">Миры</div>`;
      allWorlds.forEach(w => {
        html += `<div class="toc-item"><span class="toc-item-emoji">🌍</span><span class="toc-item-name">${w.name}</span><span class="toc-item-role">${w.genre||''}</span></div>`;
      });
      html += `</div>`;
    }
    Object.entries(byBook).forEach(([book, chars]) => {
      html += `<div class="toc-section"><div class="toc-section-title">${book}</div>`;
      chars.forEach(c => {
        html += `<div class="toc-item"><span class="toc-item-emoji">${c.emoji||'👤'}</span><span class="toc-item-name">${c.name}${c.nickname?` "${c.nickname}"`:''}  </span><span class="toc-item-role">${c.role||''}</span></div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
  }

  // ── WORLDS ──
  if (allWorlds.length) {
    html += `<div class="section-divider"><div class="section-divider-label">Часть I</div><div class="section-divider-title">Миры</div></div>`;
    allWorlds.forEach(w => {
      html += `<div class="world-page">
        <div class="world-name">🌍 ${w.name}</div>
        <div class="world-genre">${w.genre||''}</div>
        <div class="two-col">`;

      const worldSections = [
        ['Краткое описание', w.summary],
        ['История мира', w.history],
        ['Geography', w.geography],
        ['Магическая система', w.magic_system],
        ['Технологии', w.technology],
        ['Политика', w.politics],
        ['Религия', w.religion],
        ['Культура', w.culture],
        ['Главные конфликты', w.conflicts],
        ['Заметки', w.notes],
      ].filter(([,v]) => v);

      worldSections.forEach(([title, text]) => {
        html += `<div class="section-block"><h3>${title}</h3><p>${text.replace(/\n/g,'<br>')}</p></div>`;
      });

      html += `</div></div>`;
    });
  }

  // ── CHARACTERS ──
  if (allChars.length) {
    html += `<div class="section-divider"><div class="section-divider-label">Часть II</div><div class="section-divider-title">Персонажи</div></div>`;

    for (const c of allChars) {
      const charImgs = getImages(c.id);
      const mainImg = charImgs[0];
      const charRels = getRels(c.id);

      // Convert image URL to base64 for PDF embedding
      let mainImgHtml = '';
      if (mainImg) {
        try {
          const b64 = await urlToBase64(mainImg.url);
          mainImgHtml = `<img class="char-main-img" src="${b64}" alt="${c.name}">`;
        } catch(e) {
          mainImgHtml = `<div class="char-main-placeholder" style="background:${colorFor(c)}15">${c.emoji||'👤'}</div>`;
        }
      } else {
        mainImgHtml = `<div class="char-main-placeholder" style="background:${colorFor(c)}15">${c.emoji||'👤'}</div>`;
      }

      // Emotion gallery
      let emotionGallery = '';
      if (charImgs.length > 1) {
        const emotionImgsHtml = await Promise.all(charImgs.slice(1).map(async img => {
          try {
            const b64 = await urlToBase64(img.url);
            return `<div class="emotion-item"><img src="${b64}" alt="${img.emotion}"><span>${img.emotion}</span></div>`;
          } catch(e) { return ''; }
        }));
        if (emotionImgsHtml.some(h=>h)) {
          emotionGallery = `<div class="section-block"><h3>Галерея эмоций</h3><div class="emotion-gallery">${emotionImgsHtml.join('')}</div></div>`;
        }
      }

      html += `<div class="char-page">
        <div class="char-header">
          <div class="char-images">${mainImgHtml}</div>
          <div style="flex:1">
            <div class="char-name">${c.name} ${c.nickname?`<span class="char-nickname">"${c.nickname}"</span>`:''}</div>
            <div class="char-role">${c.role||''}</div>
            <div class="char-meta">
              ${c.age?`<div class="char-meta-item"><strong>Возраст:</strong> ${c.age}</div>`:''}
              ${c.book?`<div class="char-meta-item"><strong>Книга:</strong> ${c.book}</div>`:''}
              ${c.gender?`<div class="char-meta-item"><strong>Пол:</strong> ${c.gender}</div>`:''}
              ${c.height?`<div class="char-meta-item"><strong>Рост:</strong> ${c.height}</div>`:''}
            </div>
            ${(c.tags||[]).length?`<div class="char-tags">${c.tags.map(t=>`<span class="char-tag">${t}</span>`).join('')}</div>`:''}
          </div>
        </div>

        <div class="two-col">
          <div>
            ${buildCharSection('Внешность', null, [['Телосложение',c.body_type],['Волосы',c.hair],['Глаза',c.eyes],['Кожа',c.skin],['Голос',c.voice]])}
            ${c.appearance?`<div class="section-block"><h3>Описание</h3><p>${c.appearance.replace(/\n/g,'<br>')}</p></div>`:''}
            ${c.distinctive_marks?`<div class="section-block"><h3>Особые приметы</h3><p>${c.distinctive_marks.replace(/\n/g,'<br>')}</p></div>`:''}
            ${c.style?`<div class="section-block"><h3>Стиль</h3><p>${c.style.replace(/\n/g,'<br>')}</p></div>`:''}
          </div>
          <div>
            ${c.personality?`<div class="section-block"><h3>Характер</h3><p>${c.personality.replace(/\n/g,'<br>')}</p></div>`:''}
            ${buildCharSection('Профиль', null, [['Сильные стороны',c.strengths],['Слабые стороны',c.weaknesses],['Страхи',c.fears],['Желания',c.desires],['Мотивация',c.motivation]])}
            ${c.habits?`<div class="section-block"><h3>Привычки</h3><p>${c.habits.replace(/\n/g,'<br>')}</p></div>`:''}
            ${c.speech_style?`<div class="section-block"><h3>Манера речи</h3><p>${c.speech_style.replace(/\n/g,'<br>')}</p></div>`:''}
            ${c.worldview?`<div class="section-block"><h3>Мировоззрение</h3><p>${c.worldview.replace(/\n/g,'<br>')}</p></div>`:''}
            ${c.secret?`<div class="section-block"><h3>🔒 Тайна</h3><p>${c.secret.replace(/\n/g,'<br>')}</p></div>`:''}
          </div>
        </div>

        ${c.bio?`<div class="section-block"><h3>Биография</h3><p>${c.bio.replace(/\n/g,'<br>')}</p></div>`:''}
        ${c.backstory?`<div class="section-block"><h3>Предыстория</h3><p>${c.backstory.replace(/\n/g,'<br>')}</p></div>`:''}
        ${c.key_events?`<div class="section-block"><h3>Ключевые события</h3><p>${c.key_events.replace(/\n/g,'<br>')}</p></div>`:''}
        ${c.arc?`<div class="section-block"><h3>Арка персонажа</h3><p>${c.arc.replace(/\n/g,'<br>')}</p></div>`:''}
        ${c.notes?`<div class="section-block"><h3>📝 Заметки автора</h3><p>${c.notes.replace(/\n/g,'<br>')}</p></div>`:''}

        ${charRels.length ? `<div class="section-block"><h3>Связи</h3><div class="rel-list">${charRels.map(r=>{
          const t=getChar(r.target_id); if(!t) return '';
          return `<div class="rel-row"><span class="rel-type">${r.type}</span><span class="rel-name">${t.emoji||''} ${t.name}</span><span class="rel-desc">${r.description||''}</span></div>`;
        }).join('')}</div></div>` : ''}

        ${emotionGallery}
      </div>`;
    }
  }

  html += '</body></html>';

  // Open in new window and trigger print
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.print();
    }, 1500); // wait for fonts/images
  };

  showToast('PDF готов! Выбери "Сохранить как PDF" в диалоге печати');
}

function buildCharSection(title, text, rows) {
  const validRows = rows.filter(([,v]) => v);
  if (!validRows.length && !text) return '';
  return `<div class="section-block"><h3>${title}</h3>
    ${text ? `<p>${text.replace(/\n/g,'<br>')}</p>` : ''}
    ${validRows.length ? `<div class="info-grid">${validRows.map(([k,v])=>`<span class="info-k">${k}</span><span class="info-v">${v}</span>`).join('')}</div>` : ''}
  </div>`;
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
