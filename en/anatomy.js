/* =====================================================================
   엔진: 아이소메트릭 SVG 장면 + 단계 UI
   ===================================================================== */
const U = 36, C30 = Math.cos(Math.PI / 6);
const NS = 'http://www.w3.org/2000/svg';
const iso = (gx, gy, z = 0) => [(gx - gy) * U * C30, (gx + gy) * U * 0.5 - z * U];
const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const pts = (arr) => arr.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const TONE = { data: '--c-data', undo: '--c-undo', redo: '--c-redo', signal: '--c-signal', sql: '--c-sql', muted: '--c-muted' };
const CHAPTER = {
  problem: { label: 'Problem', color: 'var(--c-signal)' },
  technique: { label: 'Principle', color: 'var(--accent)' },
  case: { label: 'Case', color: 'var(--c-redo)' },
  recap: { label: 'Summary', color: 'var(--c-data)' },
};
const CALLOUT = {
  insight: { label: 'Key point', tone: 'var(--accent)', icon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>' },
  tip: { label: 'Good to know', tone: 'var(--c-data)', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>' },
  warn: { label: 'Caution', tone: 'var(--c-signal)', icon: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>' },
};

const S = { i: 0, paused: false, t0: performance.now(), pauseAt: 0, flows: [], maxSeen: 0, consoleLines: [] };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('ohb:' + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('ohb:' + k, JSON.stringify(v)); } catch (e) {} },
};
/* 페이지마다 다른 값. Oracle 해부도(루트)는 기본값을 그대로 쓴다.
   LESSON.page: course.js의 해부도↔실습 연결표에서 이 페이지를 찾는 키('oracle' | 'linux')
   LESSON.base: 실습 페이지로 가는 상대 경로 앞부분('' 또는 '../')
   LESSON.storeKey: 마지막으로 본 단계를 저장하는 키
   LESSON.cellHost / segHost: 칸(cells)과 막대(segs)를 칠할 상자. multiHost면 step.cells·segs를 상자 id별로 적는다. */
const PAGE = LESSON.page || 'oracle';
const BASE = LESSON.base == null ? '' : LESSON.base;
const SEEN_KEY = LESSON.storeKey || 'maxSeen';
const CONSOLE_TITLE = LESSON.consoleTitle || 'SQL*Plus';

/* ---------- geometry ---------- */
function center(e) {
  return e.type === 'cyl' ? e.at : [e.at[0] + e.size[0] / 2, e.at[1] + e.size[1] / 2];
}
function topCenter(e) {
  if (e.type === 'cyl') { const [x, y] = iso(...e.at); return [x, y - e.h * U]; }
  const c = center(e); return iso(c[0], c[1], e.size[2]);
}
function topPoint(e) {
  if (e.type === 'cyl') { const [x, y] = iso(...e.at); return [x, y - e.h * U - 0.7071 * e.r * U]; }
  return iso(e.at[0], e.at[1], e.size[2]);
}
function labelAnchor(e) {
  if (e.type === 'box' && e.labelPos === 'left') {
    const p = iso(e.at[0], e.at[1] + e.size[1], e.size[2]);
    return { x: p[0] - 12, y: p[1], anchor: 'end' };
  }
  if (e.type === 'cyl' && e.labelPos === 'right') {
    const [cx, cy] = iso(...e.at);
    return { x: cx + 1.2247 * e.r * U + 10, y: cy - e.h * U * 0.5, anchor: 'start' };
  }
  if (e.type === 'box' && e.labelPos === 'right') {
    const p = iso(e.at[0] + e.size[0], e.at[1], e.size[2]);
    return { x: p[0] + 12, y: p[1], anchor: 'start' };
  }
  const p = topPoint(e);
  return { x: p[0], y: p[1] - 18, anchor: 'middle' };
}
function linkD(L) {
  const A = LESSON.entities[L.from], B = LESSON.entities[L.to];
  if (L.arc) {
    const a = topCenter(A), b = topCenter(B);
    const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - L.arc;
    return `M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  }
  const P = [center(A), ...(L.via || []), center(B)].map((p) => iso(p[0], p[1]));
  return 'M' + P.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
}

/* ---------- scene build ---------- */
const svg = $('#scene');
const layer = {};
const entEls = {}, linkEls = {}, zoneEls = {};

function buildScene() {
  svg.innerHTML = '';
  const defs = el('defs', {}, svg);
  const rg = el('radialGradient', { id: 'fade', cx: '50%', cy: '50%', r: '60%' }, defs);
  el('stop', { offset: '0.55', 'stop-color': '#fff', 'stop-opacity': 1 }, rg);
  el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);
  const mask = el('mask', { id: 'gridMask', maskUnits: 'userSpaceOnUse' }, defs);

  ['grid', 'zones', 'links', 'dots', 'ents', 'arcs', 'arcdots', 'labels'].forEach((k) => (layer[k] = el('g', {}, svg)));
  layer.grid.setAttribute('mask', 'url(#gridMask)');

  // bounds
  const B = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (p) => { B.x0 = Math.min(B.x0, p[0]); B.x1 = Math.max(B.x1, p[0]); B.y0 = Math.min(B.y0, p[1]); B.y1 = Math.max(B.y1, p[1]); };

  // zones
  LESSON.zones.forEach((z) => {
    const g = el('g', { class: 'zone-g off' }, layer.zones);
    const [x0, y0] = z.from, [x1, y1] = z.to;
    const c = [iso(x0, y0), iso(x1, y0), iso(x1, y1), iso(x0, y1)];
    c.forEach(grow);
    el('polygon', { class: 'zone', points: pts(c) }, g);
    const p = iso(x0 + 0.35, y1 - 0.3);
    const t = el('text', { class: 'zone-label', transform: `matrix(${C30},0.5,${-C30},0.5,${p[0].toFixed(1)},${p[1].toFixed(1)})` }, g);
    t.textContent = z.label;
    zoneEls[z.id] = g;
  });

  // entities, back to front
  const order = Object.keys(LESSON.entities).sort((a, b) => {
    const ca = center(LESSON.entities[a]), cb = center(LESSON.entities[b]);
    return ca[0] + ca[1] - (cb[0] + cb[1]);
  });
  order.forEach((id) => {
    const e = LESSON.entities[id];
    const g = el('g', { class: 'ent off', 'data-id': id, style: `--tone: var(${TONE[e.tone]})` }, layer.ents);
    if (e.type === 'box') drawBox(g, e, grow); else drawCyl(g, e, grow);
    const tp = topPoint(e); grow([tp[0], tp[1] - 80]);
    const la = labelAnchor(e); grow([la.x + (la.anchor === 'end' ? -150 : la.anchor === 'start' ? 150 : 0), la.y - 60]);
    entEls[id] = g;
  });

  // links
  Object.entries(LESSON.links).forEach(([id, L]) => {
    const g = el('g', { class: 'link off' + (L.arc ? ' arc' : '') }, L.arc ? layer.arcs : layer.links);
    const d = linkD(L);
    el('path', { class: 'trk', d }, g);
    const ln = el('path', { class: 'ln', d }, g);
    linkEls[id] = { g, path: ln, len: 0 };
  });

  const pad = 24;
  const vb = [B.x0 - pad, B.y0 - pad, B.x1 - B.x0 + pad * 2, B.y1 - B.y0 + pad * 2];
  svg.setAttribute('viewBox', vb.map((n) => n.toFixed(0)).join(' '));
  el('rect', { x: vb[0], y: vb[1], width: vb[2], height: vb[3], fill: 'url(#fade)' }, mask);

  // floor grid
  for (let gx = -8; gx <= 22; gx++) {
    const a = iso(gx, -4), b = iso(gx, 14);
    el('line', { class: 'gridline', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, layer.grid);
  }
  for (let gy = -4; gy <= 14; gy++) {
    const a = iso(-8, gy), b = iso(22, gy);
    el('line', { class: 'gridline', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, layer.grid);
  }
  Object.values(linkEls).forEach((L) => (L.len = L.path.getTotalLength()));
}

function drawBox(g, e, grow) {
  const [x, y] = e.at, [w, d, h] = e.size;
  const P = iso;
  [P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0), P(x, y, h)].forEach(grow);
  const m = 0.32;
  el('polygon', { class: 'focus-ring', points: pts([P(x - m, y - m), P(x + w + m, y - m), P(x + w + m, y + d + m), P(x - m, y + d + m)]) }, g);
  el('polygon', { class: 'shadow', points: pts([P(x + 0.18, y + 0.3), P(x + w + 0.3, y + 0.3), P(x + w + 0.3, y + d + 0.35), P(x + 0.18, y + d + 0.35)]) }, g);
  el('polygon', { class: 'face left', points: pts([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, h), P(x, y + d, h)]) }, g);
  el('polygon', { class: 'face right', points: pts([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, h), P(x + w, y, h)]) }, g);
  el('polygon', { class: 'face top', points: pts([P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)]) }, g);
  if (e.led) {
    const a = P(x + 0.25, y + d, h * 0.55), b = P(x + w * 0.55, y + d, h * 0.55);
    el('line', { class: 'led', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, g);
  }
  if (e.cells) {
    const [cols, rows] = e.cells, cw = w / cols, rh = d / rows, mm = 0.12;
    e._cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = x + c * cw + mm, x1 = x + (c + 1) * cw - mm, y0 = y + r * rh + mm, y1 = y + (r + 1) * rh - mm;
      e._cells.push(el('polygon', { class: 'cell', points: pts([P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)]) }, g));
    }
  }
  if (e.segs) {
    const sw = w / e.segs, mm = 0.09, my = 0.22;
    e._segs = [];
    for (let i = 0; i < e.segs; i++) {
      const x0 = x + i * sw + mm, x1 = x + (i + 1) * sw - mm;
      e._segs.push(el('polygon', { class: 'seg', points: pts([P(x0, y + my, h), P(x1, y + my, h), P(x1, y + d - my, h), P(x0, y + d - my, h)]) }, g));
    }
  }
}

function drawCyl(g, e, grow) {
  const [cx, cy] = iso(...e.at), rx = 1.2247 * e.r * U, ry = 0.7071 * e.r * U, H = e.h * U;
  [[cx - rx, cy], [cx + rx, cy + ry], [cx, cy - H - ry]].forEach(grow);
  el('ellipse', { class: 'focus-ring', cx, cy, rx: rx + 14, ry: ry + 8 }, g);
  el('ellipse', { class: 'shadow', cx: cx + 7, cy: cy + 5, rx, ry }, g);
  el('path', { class: 'face left', d: `M${cx - rx},${cy - H} L${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy - H} Z` }, g);
  el('path', { class: 'face right', style: 'stroke:none', d: `M${cx},${cy - H + ry} L${cx},${cy + ry} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy - H} A${rx},${ry} 0 0 1 ${cx},${cy - H + ry} Z` }, g);
  el('path', { class: 'face left', style: 'fill:none', d: `M${cx - rx},${cy - H} L${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy - H}` }, g);
  [0.36, 0.68].forEach((f) => el('path', { class: 'ring-line', d: `M${cx - rx},${cy - H * f} A${rx},${ry} 0 0 0 ${cx + rx},${cy - H * f}` }, g));
  el('ellipse', { class: 'face top', cx, cy: cy - H, rx, ry }, g);
  el('ellipse', { class: 'ring-line', cx, cy: cy - H, rx: rx * 0.42, ry: ry * 0.42 }, g);
}

/* ---------- pills ---------- */
function pill(parent, text, cls, x, y, anchor, style, delay) {
  const g = el('g', { class: 'pill ' + cls }, parent);
  if (style) g.setAttribute('style', style);
  if (delay) g.style.animationDelay = delay + 'ms';
  const r = el('rect', { rx: 10, height: 20, y: y - 10 }, g);
  const hasDot = cls.includes('lbl');
  const dot = hasDot ? el('circle', { class: 'pdot', r: 3.5, cy: y }, g) : null;
  const t = el('text', { y }, g);
  t.textContent = text;
  const tw = t.getComputedTextLength();
  const padL = hasDot ? 20 : 9, padR = 9, w = tw + padL + padR;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'start' ? x : x - w;
  r.setAttribute('x', x0.toFixed(1)); r.setAttribute('width', w.toFixed(1));
  t.setAttribute('x', (x0 + padL).toFixed(1));
  if (dot) dot.setAttribute('cx', (x0 + 11).toFixed(1));
  return g;
}

/* ---------- apply a step ---------- */
function applyScene(step, prevStep) {
  const shown = new Set(step.show || []);
  const dim = new Set(step.dim || []);
  const focus = new Set(step.focus || []);
  const prevShown = new Set(prevStep ? prevStep.show || [] : []);

  for (const [id, g] of Object.entries(entEls)) {
    const on = shown.has(id);
    g.classList.toggle('off', !on);
    g.classList.toggle('dim', on && dim.has(id));
    g.classList.toggle('focus', on && focus.has(id));
    g.classList.remove('enter');
    if (on && !prevShown.has(id) && !reduceMotion.matches) { void g.getBBox(); g.classList.add('enter'); }
  }
  LESSON.zones.forEach((z) => zoneEls[z.id].classList.toggle('off', !z.members.some((m) => shown.has(m))));

  // cells & segments
  for (const [id, e] of Object.entries(LESSON.entities)) {
    if (e._cells) {
      const base = LESSON.multiHost ? ((LESSON.baseCells || {})[id] || {}) : (LESSON.baseCells || {});
      const own = LESSON.multiHost ? ((step.cells || {})[id] || {}) : (id === (LESSON.cellHost || 'bc') ? step.cells || {} : {});
      const cells = Object.assign({}, step.noBaseCells ? {} : base, own);
      e._cells.forEach((c, i) => c.setAttribute('class', 'cell ' + (cells[i] || '')));
    }
    if (e._segs) {
      const segs = (LESSON.multiHost ? (step.segs || {})[id] : (id === (LESSON.segHost || 'lb') ? step.segs : null)) || [];
      e._segs.forEach((s, i) => s.setAttribute('class', 'seg ' + (segs[i] || '')));
    }
  }

  // links
  const flowLinks = new Map((step.flows || []).map((f) => [f.link, f.kind]));
  for (const [id, L] of Object.entries(LESSON.links)) {
    const both = shown.has(L.from) && shown.has(L.to);
    const on = flowLinks.has(id) || (both && !L.onDemand);
    const le = linkEls[id];
    le.g.classList.toggle('off', !on);
    le.g.classList.toggle('act', flowLinks.has(id));
    le.g.setAttribute('class', le.g.getAttribute('class').replace(/\bk-\w+/g, '').trim() + (flowLinks.has(id) ? ' k-' + flowLinks.get(id) : ''));
  }

  // labels & tags
  layer.labels.innerHTML = '';
  for (const id of Object.keys(LESSON.entities)) {
    if (!shown.has(id)) continue;
    const e = LESSON.entities[id];
    const a = labelAnchor(e);
    const lg = pill(layer.labels, e.label, 'lbl', a.x, a.y, a.anchor, `--tone: var(${TONE[e.tone]})`);
    if (dim.has(id)) lg.style.opacity = 0.4;
    ((step.tags || {})[id] || []).forEach((t, k) => {
      const dy = (e.tagDir === 'down' ? 24 : -24) * (k + 1);
      pill(layer.labels, t.text, 'tag k-' + (t.tone || 'muted'), a.x, a.y + dy, a.anchor, null, 150 + k * 80);
    });
  }

  // flows
  layer.dots.innerHTML = ''; layer.arcdots.innerHTML = '';
  S.flows = (step.flows || []).map((f) => {
    const L = LESSON.links[f.link], le = linkEls[f.link];
    const parent = L.arc ? layer.arcdots : layer.dots;
    const n = f.n || 1;
    const dots = [];
    for (let i = 0; i < n; i++) {
      const g = el('g', { class: 'k-' + f.kind }, parent);
      const halo = el('circle', { class: 'flowhalo', r: 8 }, g);
      const dot = el('circle', { class: 'flowdot', r: 4.2 }, g);
      dots.push({ g, halo, dot });
    }
    return { ...f, n, path: le.path, len: le.len, dots };
  });
  S.t0 = performance.now();
  drawFlows(S.t0);
  scrollToFocus(step);
}

// 좁은 화면에서는 장면이 가로로 스크롤되므로, 이번 단계의 주인공이 보이도록 옮긴다.
function scrollToFocus(step) {
  const wrap = svg.parentElement;
  if (wrap.scrollWidth <= wrap.clientWidth + 4) return;
  const ids = (step.focus && step.focus.length ? step.focus : step.show) || [];
  if (!ids.length) return;
  const xs = ids.map((id) => labelAnchor(LESSON.entities[id]).x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const vb = svg.viewBox.baseVal;
  const px = ((mid - vb.x) / vb.width) * svg.clientWidth;
  wrap.scrollTo({ left: px - wrap.clientWidth / 2, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

function drawFlows(now) {
  const t = (now - S.t0) / 1000;
  for (const f of S.flows) {
    const dur = Math.max(1.3, f.len / 150) / (f.rate || 1);
    f.dots.forEach((d, i) => {
      let s;
      if (reduceMotion.matches) s = (i + 0.5) / f.n;
      else {
        const span = f.bounce ? 2 : 1;
        const u = ((t / dur) + (i / f.n) * span) % span;
        s = f.bounce ? (u < 1 ? u : 2 - u) : u;
      }
      if (f.rev) s = 1 - s;
      const p = f.path.getPointAtLength(s * f.len);
      d.g.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
      const edge = Math.min(1, s * 7, (1 - s) * 7);
      d.g.style.opacity = reduceMotion.matches ? 1 : edge.toFixed(2);
    });
  }
}

function loop(now) {
  if (!S.paused && !reduceMotion.matches) drawFlows(now);
  requestAnimationFrame(loop);
}

/* ---------- panel, metrics, console, stepper ---------- */
function renderMetrics(step, prev) {
  const box = $('#metrics');
  if (!box.children.length) {
    LESSON.metrics.forEach((m) => {
      const d = document.createElement('div');
      d.className = 'metric'; d.dataset.k = m.key;
      d.innerHTML = `<div class="metric-k">${m.label}</div><div class="metric-v"></div>`;
      box.appendChild(d);
    });
  }
  LESSON.metrics.forEach((m) => {
    const d = box.querySelector(`[data-k="${m.key}"]`);
    const v = step.metrics[m.key];
    const pv = prev ? prev.metrics[m.key] : undefined;
    d.classList.toggle('empty', v == null);
    d.querySelector('.metric-v').textContent = v == null ? '—' : v;
    d.classList.remove('flash');
    if (prev && v !== pv && v != null) { void d.offsetWidth; d.classList.add('flash'); }
  });
}

function consoleFor(i) {
  let title = CONSOLE_TITLE, lines = [];
  for (let k = 0; k <= i; k++) {
    const c = LESSON.steps[k].console || {};
    if (c.title) title = c.title;
    if (c.lines) lines = c.lines.slice();
    if (c.add) lines = lines.concat(c.add);
  }
  return { title, lines };
}
function esc(s) { return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function renderConsole(i, prevI) {
  const { title, lines } = consoleFor(i);
  const prev = prevI == null ? [] : consoleFor(prevI).lines;
  $('#consoleTitle').textContent = title;
  $('#consoleBody').innerHTML = lines.map((l, k) => {
    const [txt, kind] = l.split('|');
    let cls = kind || (txt.trim().startsWith('--') ? 'cmt' : '');
    const isNew = prev[k] !== l;
    const body = esc(txt).replace(/(--.*)$/, '<span class="cmt">$1</span>');
    return `<span class="${cls}${isNew ? ' ln-new' : ''}">${body || ' '}</span>`;
  }).join('\n');
}

function renderStepper() {
  const ol = $('#steps');
  ol.innerHTML = '';
  LESSON.steps.forEach((s, i) => {
    const li = document.createElement('li');
    li.style.setProperty('--chap', CHAPTER[s.chapter].color);
    li.innerHTML = `<button class="dot" type="button" aria-label="Step ${i + 1}: ${s.title}">${i + 1}</button>`;
    li.querySelector('button').addEventListener('click', () => go(i));
    ol.appendChild(li);
  });
}
function updateStepper() {
  [...$('#steps').children].forEach((li, i) => {
    const b = li.querySelector('.dot');
    b.classList.toggle('now', i === S.i);
    b.classList.toggle('seen', i <= S.maxSeen);
    b.setAttribute('aria-current', i === S.i ? 'step' : 'false');
    const old = li.querySelector('.step-short'); if (old) old.remove();
    if (i === S.i) {
      const sp = document.createElement('span');
      sp.className = 'step-short'; sp.textContent = LESSON.steps[i].short;
      li.appendChild(sp);
    }
  });
  $('#stepperCount').textContent = `Step ${S.i + 1} of ${LESSON.steps.length}`;
}

function renderPanel(step) {
  const N = LESSON.steps.length, ch = CHAPTER[step.chapter];
  const next = LESSON.steps[S.i + 1];
  const co = step.callout ? CALLOUT[step.callout.kind] : null;
  const chg = (step.changes || []).map((c) => {
    const sym = c[0], text = c.slice(2);
    const cls = sym === '+' ? 'chg-add' : sym === '×' ? 'chg-bad' : 'chg-mod';
    return `<li class="${cls}"><b>${sym}</b><span>${text}</span></li>`;
  }).join('');
  const card = $('#stepCard');
  card.style.setProperty('--chap', ch.color);
  card.innerHTML = `
    <div class="step-top"><span class="step-count">Step ${S.i + 1} / ${N}</span><span class="chap">${ch.label}</span></div>
    <h2 class="step-title">${step.title}</h2>
    <div class="step-body">${step.body.map((p) => `<p>${p}</p>`).join('')}</div>
    ${co ? `<div class="callout" style="--tone:${co.tone}">
      <span class="callout-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${co.icon}</svg></span>
      <div><span class="callout-k">${co.label}</span>${step.callout.text}</div></div>` : ''}
    ${chg ? `<div class="changes"><span class="changes-k">What changed</span><ul>${chg}</ul></div>` : ''}
    ${practiceHtml(S.i + 1)}
    <div class="nav">
      <button class="btn" id="prevBtn" type="button" ${S.i === 0 ? 'disabled' : ''} aria-label="Previous step">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Back</button>
      <button class="btn btn-primary" id="nextBtn" type="button">
        <span>${next ? 'Next: ' + next.short : 'Start over'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
    </div>
    <div class="keys"><kbd>←</kbd><kbd>→</kbd> Steps · <kbd>R</kbd> Replay · <kbd>Space</kbd> Pause</div>`;
  $('#prevBtn').addEventListener('click', () => go(S.i - 1));
  $('#nextBtn').addEventListener('click', () => go(next ? S.i + 1 : 0));
}

/* 이 장면을 직접 해 보는 실습 레슨(course.js의 연결표에서 가져온다) */
function practiceHtml(stepNo) {
  const list = window.Course && Course.practiceFor ? Course.practiceFor(PAGE, stepNo, BASE) : [];
  if (!list.length) return '';
  return `<div class="practice"><span class="practice-k">Practice this</span><ul>${list.map((p) => `
    <li><a href="${p.href}"><span class="practice-no">${p.where}</span><span class="practice-t">${p.title}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>`).join('')}</ul></div>`;
}

function renderGoals() {
  const ul = $('#goals');
  ul.innerHTML = LESSON.goals.map((g, k) => `
    <li class="${S.maxSeen + 1 >= g.step ? 'done' : ''}"><button type="button" data-step="${g.step}">
      <span class="chk"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg></span>
      <span>${g.text}</span></button></li>`).join('');
  ul.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => go(+b.dataset.step - 1)));
}

function renderOutline() {
  $('#outline').innerHTML = LESSON.outline.map((p) => `
    <div class="outline-part"><b>${p.part}</b><ul>
      ${p.items.map((it, k) => {
        // 항목은 글자 하나이거나 { text, href, note } 객체다. href가 있으면 다른 페이지로 가는 링크가 된다.
        const o = typeof it === 'string' ? { text: it } : it;
        const note = p.current === k ? 'Now viewing' : o.note || 'Coming soon';
        const t = o.href ? `<a href="${o.href}">${o.text}</a>` : `<span>${o.text}</span>`;
        return `<li class="${p.current === k ? 'cur' : ''}">${t}<em>${note}</em></li>`;
      }).join('')}
    </ul></div>`).join('');
}

/* ---------- navigation ---------- */
function go(i, opts = {}) {
  const N = LESSON.steps.length;
  i = Math.max(0, Math.min(N - 1, i));
  const prevI = opts.initial ? null : S.i;
  const prev = prevI == null ? null : LESSON.steps[prevI];
  S.i = i;
  S.maxSeen = Math.max(S.maxSeen, i);
  store.set(SEEN_KEY, S.maxSeen);
  const step = LESSON.steps[i];
  applyScene(step, prev);
  renderMetrics(step, prev);
  renderConsole(i, prevI);
  renderPanel(step);
  updateStepper();
  renderGoals();
  const h = '#step-' + (i + 1);
  if (location.hash !== h) location.hash = h;
}

function setPaused(p) {
  const now = performance.now();
  if (p && !S.paused) S.pauseAt = now;
  if (!p && S.paused) S.t0 += now - S.pauseAt;
  S.paused = p;
  $('#pauseIc').innerHTML = p
    ? '<path d="M7 4.5v15l13-7.5z"/>'
    : '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
  $('#pauseBtn').setAttribute('aria-label', p ? 'Play the animation' : 'Pause the animation');
}

function stepFromHash() {
  const m = /^#step-(\d+)$/.exec(location.hash);
  return m ? +m[1] - 1 : null;
}

/* ---------- theme ---------- */
function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
$('#themeBtn').addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('theme', next);
});
(() => { const t = store.get('theme'); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; })();

/* ---------- boot ---------- */
$('#pauseBtn').addEventListener('click', () => setPaused(!S.paused));
$('#replayBtn').addEventListener('click', () => { go(S.i); setPaused(false); });
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); go(S.i + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); go(S.i - 1); }
  else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); setPaused(!S.paused); }
  else if (e.key === 'r' || e.key === 'R') { go(S.i); }
});
window.addEventListener('hashchange', () => { const i = stepFromHash(); if (i != null && i !== S.i) go(i); });

function renderSite() {
  const isUrl = (u) => /^https:\/\//.test(u);
  if (isUrl(SITE.github)) {
    const a = $('#githubLink');
    a.href = SITE.github; a.hidden = false;
  }
}

function boot() {
  renderSite();
  buildScene();
  renderStepper();
  renderOutline();
  S.maxSeen = Math.max(0, Math.min(LESSON.steps.length - 1, store.get(SEEN_KEY) || 0));
  const start = stepFromHash();
  go(start == null ? 0 : start, { initial: true });
  requestAnimationFrame(loop);
}
boot();
// 웹폰트가 늦게 오면 라벨 폭을 다시 잰다.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => applyScene(LESSON.steps[S.i], LESSON.steps[S.i]));
