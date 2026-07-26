// =============================================
// Character Bible — Relations Graph
// Интерактивный граф связей на Canvas
// =============================================

let graphNodes = [];
let graphEdges = [];
let dragging = null;
let dragOffX = 0, dragOffY = 0;
let graphCanvas = null;
let graphCtx = null;
let graphScale = 1;
let graphOffX = 0, graphOffY = 0;
let isPanning = false;
let panStartX = 0, panStartY = 0;
let hoveredNode = null;
let animFrame = null;
let graphFilter = 'all'; // all | book | family

const INTENSITY_COLORS = {
  'враждебные':  '#e74c3c',
  'напряжённые': '#e67e22',
  'нейтральные': '#95a5a6',
  'тёплые':      '#27ae60',
  'близкие':     '#2980b9',
  'преданные':   '#8b3a1a',
};

function renderRelMap() {
  const el = document.getElementById('relMapContent');
  if (!el) return;

  // Build filter controls
  const books = [...new Set(chars.map(c=>c.book).filter(Boolean))];
  const families = [...new Set(chars.map(c=>c.family).filter(Boolean))];

  el.innerHTML = `
    <div class="graph-controls">
      <div class="graph-filter-group">
        <span style="font-size:12px;color:var(--ink3)">Фильтр:</span>
        <button class="graph-filter-btn active" onclick="setGraphFilter('all',this)">Все</button>
        ${books.map(b=>`<button class="graph-filter-btn book-btn" data-val="${b}" onclick="setGraphFilter('book',this,'${b}')">${b}</button>`).join('')}
        ${families.map(f=>`<button class="graph-filter-btn fam-btn" data-val="${f}" onclick="setGraphFilter('family',this,'${f}')">${f}</button>`).join('')}
      </div>
      <div class="graph-legend">
        ${Object.entries(INTENSITY_COLORS).map(([k,v])=>`<span class="legend-item"><span class="legend-dot" style="background:${v}"></span>${k}</span>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--ink3)">Тяни узлы · Колесо мыши = зум · Кликни = перейти к персонажу</div>
    </div>
    <canvas id="relGraphCanvas" style="width:100%;border-radius:12px;cursor:grab;display:block;background:var(--parch2);border:0.5px solid var(--parch3)"></canvas>
  `;

  initGraph();
}

function setGraphFilter(type, btn, val) {
  document.querySelectorAll('.graph-filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  graphFilter = type === 'all' ? 'all' : { type, val };
  initGraph();
}

function initGraph() {
  graphCanvas = document.getElementById('relGraphCanvas');
  if (!graphCanvas) return;

  // Size canvas
  const container = graphCanvas.parentElement;
  const W = container.clientWidth;
  const H = Math.max(500, Math.min(700, window.innerHeight - 280));
  graphCanvas.width = W;
  graphCanvas.height = H;
  graphCanvas.style.height = H + 'px';
  graphCtx = graphCanvas.getContext('2d');
  graphScale = 1; graphOffX = 0; graphOffY = 0;

  // Filter chars
  let visibleChars = chars;
  if (graphFilter !== 'all') {
    const { type, val } = graphFilter;
    if (type === 'book') {
      visibleChars = chars.filter(c => c.book === val || getCharBooks(c.id).some(b=>b.book_title===val));
    } else if (type === 'family') {
      visibleChars = chars.filter(c => c.family === val);
    }
  }

  // Only show chars that have at least one relationship, plus connected ones
  const charIdsWithRels = new Set();
  relationships.forEach(r => {
    if (visibleChars.find(c=>c.id===r.character_id) && visibleChars.find(c=>c.id===r.target_id)) {
      charIdsWithRels.add(r.character_id);
      charIdsWithRels.add(r.target_id);
    }
  });
  // Also include chars with no rels if filter is active (so you still see them)
  if (graphFilter !== 'all') visibleChars.forEach(c => charIdsWithRels.add(c.id));
  const nodeChars = visibleChars.filter(c => charIdsWithRels.has(c.id));

  if (nodeChars.length === 0) {
    graphCtx.fillStyle = '#8a7a6e';
    graphCtx.font = '14px Jost, sans-serif';
    graphCtx.textAlign = 'center';
    graphCtx.fillText('Нет персонажей с заданными связями', W/2, H/2);
    return;
  }

  // Layout: force-directed initial positions in a circle, then simulate
  const cx = W / 2, cy = H / 2;
  const radius = Math.min(W, H) * 0.35;
  graphNodes = nodeChars.map((c, i) => {
    const angle = (2 * Math.PI * i) / nodeChars.length - Math.PI/2;
    return {
      id: c.id,
      char: c,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0, vy: 0,
      r: (c.char_type || 'main') === 'main' ? 34 : 26,
    };
  });

  graphEdges = [];
  const seen = new Set();
  relationships.forEach(r => {
    const src = graphNodes.find(n=>n.id===r.character_id);
    const tgt = graphNodes.find(n=>n.id===r.target_id);
    if (!src || !tgt) return;
    const key = [r.character_id, r.target_id].sort().join('-');
    if (seen.has(key)) return;
    seen.add(key);
    graphEdges.push({ src, tgt, rel: r });
  });

  // Run force simulation for initial layout
  for (let iter = 0; iter < 200; iter++) forceStep(W, H);

  // Events
  graphCanvas.onmousedown = graphMouseDown;
  graphCanvas.onmousemove = graphMouseMove;
  graphCanvas.onmouseup = graphMouseUp;
  graphCanvas.onmouseleave = graphMouseUp;
  graphCanvas.onclick = graphClick;
  graphCanvas.onwheel = graphWheel;

  // Touch
  graphCanvas.ontouchstart = e => { e.preventDefault(); graphMouseDown(e.touches[0]); };
  graphCanvas.ontouchmove = e => { e.preventDefault(); graphMouseMove(e.touches[0]); };
  graphCanvas.ontouchend = e => { e.preventDefault(); graphMouseUp(); };

  if (animFrame) cancelAnimationFrame(animFrame);
  drawGraph();
}

function forceStep(W, H) {
  const REPEL = 4000, ATTRACT = 0.04, IDEAL = 180, DAMP = 0.7;
  graphNodes.forEach(n => { n.fx = 0; n.fy = 0; });

  // Repulsion
  for (let i = 0; i < graphNodes.length; i++) {
    for (let j = i+1; j < graphNodes.length; j++) {
      const a = graphNodes[i], b = graphNodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx+dy*dy) || 1;
      const force = REPEL / (dist*dist);
      const fx = (dx/dist)*force, fy = (dy/dist)*force;
      a.fx -= fx; a.fy -= fy;
      b.fx += fx; b.fy += fy;
    }
  }

  // Attraction along edges
  graphEdges.forEach(e => {
    const dx = e.tgt.x - e.src.x, dy = e.tgt.y - e.src.y;
    const dist = Math.sqrt(dx*dx+dy*dy) || 1;
    const force = (dist - IDEAL) * ATTRACT;
    const fx = (dx/dist)*force, fy = (dy/dist)*force;
    e.src.fx += fx; e.src.fy += fy;
    e.tgt.fx -= fx; e.tgt.fy -= fy;
  });

  // Center gravity
  const cx = W/2, cy = H/2;
  graphNodes.forEach(n => {
    n.fx += (cx - n.x) * 0.01;
    n.fy += (cy - n.y) * 0.01;
  });

  // Apply
  graphNodes.forEach(n => {
    if (n === dragging) return;
    n.vx = (n.vx + n.fx) * DAMP;
    n.vy = (n.vy + n.fy) * DAMP;
    n.x += n.vx;
    n.y += n.vy;
    // Bounds
    const pad = n.r + 10;
    n.x = Math.max(pad, Math.min(W - pad, n.x));
    n.y = Math.max(pad, Math.min(H - pad, n.y));
  });
}

function drawGraph() {
  const canvas = graphCanvas;
  if (!canvas) return;
  const ctx = graphCtx;
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(graphOffX, graphOffY);
  ctx.scale(graphScale, graphScale);

  // Draw edges
  graphEdges.forEach(e => {
    const color = INTENSITY_COLORS[e.rel.intensity || 'нейтральные'] || '#95a5a6';
    const isHovered = hoveredNode && (e.src === hoveredNode || e.tgt === hoveredNode);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(e.src.x, e.src.y);
    ctx.lineTo(e.tgt.x, e.tgt.y);
    ctx.strokeStyle = isHovered ? color : color + '88';
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.setLineDash(e.rel.type === 'Нейтральные' ? [4,4] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // Edge label (midpoint)
    if (isHovered) {
      const mx = (e.src.x + e.tgt.x) / 2;
      const my = (e.src.y + e.tgt.y) / 2;
      const label = e.rel.type || '';
      ctx.font = '11px Jost, sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(250,246,240,0.92)';
      ctx.beginPath();
      ctx.roundRect(mx - tw/2 - 6, my - 10, tw + 12, 20, 4);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, mx, my + 4);
    }
    ctx.restore();
  });

  // Draw nodes
  graphNodes.forEach(n => {
    const c = n.char;
    const isHov = n === hoveredNode;
    const col = colorFor(c);
    const isMain = (c.char_type || 'main') === 'main';

    ctx.save();

    // Shadow on hover
    if (isHov) {
      ctx.shadowColor = col + '66';
      ctx.shadowBlur = 16;
    }

    // Avatar image or colored circle
    const img = (() => {
      const imgs = getImages(c.id);
      const av = imgs.find(i=>i.id===c.avatar_image_id) || imgs[0];
      return av ? av._imgEl : null;
    })();

    // Circle background
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
    ctx.fillStyle = col + (isMain ? '22' : '15');
    ctx.fill();
    ctx.strokeStyle = isHov ? col : col + '88';
    ctx.lineWidth = isHov ? 2.5 : isMain ? 2 : 1.5;
    ctx.stroke();

    // Image clip or emoji
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r - 2, 0, Math.PI*2);
      ctx.clip();
      ctx.drawImage(img, n.x - n.r + 2, n.y - n.r + 2, (n.r-2)*2, (n.r-2)*2);
      ctx.restore();
    } else {
      ctx.font = `${n.r * 0.75}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.emoji || '👤', n.x, n.y);
    }

    ctx.shadowBlur = 0;

    // Name label
    ctx.font = `${isMain ? 500 : 400} ${isMain ? 12 : 11}px Jost, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const name = c.name.split(' ')[0]; // First name only to save space
    const tw = ctx.measureText(name).width;

    ctx.fillStyle = 'rgba(250,246,240,0.92)';
    ctx.beginPath();
    ctx.roundRect(n.x - tw/2 - 5, n.y + n.r + 4, tw + 10, 18, 3);
    ctx.fill();

    ctx.fillStyle = isHov ? col : '#1a1410';
    ctx.fillText(name, n.x, n.y + n.r + 6);

    // Secondary marker
    if (!isMain) {
      ctx.beginPath();
      ctx.arc(n.x + n.r - 5, n.y - n.r + 5, 5, 0, Math.PI*2);
      ctx.fillStyle = '#8a7a6e';
      ctx.fill();
    }

    // Family badge on hover
    if (isHov && c.family) {
      ctx.font = '10px Jost, sans-serif';
      ctx.textAlign = 'center';
      const fw = ctx.measureText(c.family).width;
      ctx.fillStyle = '#b8922a22';
      ctx.beginPath();
      ctx.roundRect(n.x - fw/2 - 5, n.y + n.r + 24, fw + 10, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#b8922a';
      ctx.fillText(c.family, n.x, n.y + n.r + 26);
    }

    ctx.restore();
  });

  ctx.restore();

  // Run physics if anything is moving
  const moving = graphNodes.some(n => Math.abs(n.vx) > 0.1 || Math.abs(n.vy) > 0.1);
  if (moving) {
    forceStep(graphCanvas.width / graphScale, graphCanvas.height / graphScale);
  }
  animFrame = requestAnimationFrame(drawGraph);
}

// Load avatar images for canvas
function preloadGraphImages() {
  chars.forEach(c => {
    const imgs = getImages(c.id);
    const av = imgs.find(i=>i.id===c.avatar_image_id) || imgs[0];
    if (av && !av._imgEl) {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => { av._imgEl = el; };
      el.onerror = () => {};
      el.src = av.url;
    }
  });
}

function graphCanvasCoords(e) {
  const rect = graphCanvas.getBoundingClientRect();
  const scaleX = graphCanvas.width / rect.width;
  const scaleY = graphCanvas.height / rect.height;
  return {
    x: ((e.clientX - rect.left) * scaleX - graphOffX) / graphScale,
    y: ((e.clientY - rect.top) * scaleY - graphOffY) / graphScale,
  };
}

function findNodeAt(x, y) {
  return graphNodes.find(n => Math.hypot(n.x - x, n.y - y) < n.r + 4);
}

function graphMouseDown(e) {
  if (!graphCanvas) return;
  const { x, y } = graphCanvasCoords(e);
  const node = findNodeAt(x, y);
  if (node) {
    dragging = node;
    dragOffX = x - node.x;
    dragOffY = y - node.y;
    graphCanvas.style.cursor = 'grabbing';
  } else {
    isPanning = true;
    const rect = graphCanvas.getBoundingClientRect();
    panStartX = e.clientX - graphOffX;
    panStartY = e.clientY - graphOffY;
    graphCanvas.style.cursor = 'grabbing';
  }
}

let lastMouseX = 0, lastMouseY = 0;
function graphMouseMove(e) {
  if (!graphCanvas) return;
  lastMouseX = e.clientX; lastMouseY = e.clientY;
  const { x, y } = graphCanvasCoords(e);

  if (dragging) {
    dragging.x = x - dragOffX;
    dragging.y = y - dragOffY;
    dragging.vx = 0; dragging.vy = 0;
    return;
  }
  if (isPanning) {
    graphOffX = e.clientX - panStartX;
    graphOffY = e.clientY - panStartY;
    return;
  }
  const node = findNodeAt(x, y);
  hoveredNode = node || null;
  graphCanvas.style.cursor = node ? 'pointer' : 'grab';
}

let lastClickTime = 0;
function graphMouseUp() {
  dragging = null;
  isPanning = false;
  if (graphCanvas) graphCanvas.style.cursor = 'grab';
}

function graphClick(e) {
  const now = Date.now();
  if (now - lastClickTime < 300) return; // debounce
  lastClickTime = now;
  const { x, y } = graphCanvasCoords(e);
  const node = findNodeAt(x, y);
  if (node && !dragging) {
    // Navigate to char after small delay to distinguish from drag
    setTimeout(() => openChar(node.id), 50);
  }
}

function graphWheel(e) {
  e.preventDefault();
  const rect = graphCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (graphCanvas.width / rect.width);
  const my = (e.clientY - rect.top) * (graphCanvas.height / rect.height);
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.3, Math.min(3, graphScale * delta));
  graphOffX = mx - (mx - graphOffX) * (newScale / graphScale);
  graphOffY = my - (my - graphOffY) * (newScale / graphScale);
  graphScale = newScale;
}
