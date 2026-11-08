/* Figures for questions: column & line graphs, pictographs, tables, scale dials, measuring jugs,
   clocks, spinners, labelled shapes and square grids.
   A question may carry `fig` (plain data); Fig.render(fig, lang) returns SVG/HTML markup.
   Labels can be strings or {en, zh}. Colours come from CSS variables so figures work in
   light mode, dark mode and print. */
(function (root) {
  'use strict';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const L = (v, lang) => (v && typeof v === 'object' ? (v[lang] || v.en) : v == null ? '' : String(v));
  const r1 = n => Math.round(n * 10) / 10;
  const svg = (w, h, body, label) =>
    `<svg class="fig-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label || '')}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  /* Every figure is drawn with a budget of marks. The loops below step by numbers from the figure (step, minor, w, xmax),
     and a figure read from a progress file could make one endless (step 0) and freeze the page (v1.7.0 R3). */
  const BUDGET = 5000;
  let budget = BUDGET;
  const spend = () => { if (--budget < 0) throw new Error('figure too large'); };
  const text = (x, y, s, o = {}) => spend() ||
    `<text x="${r1(x)}" y="${r1(y)}" class="${o.cls || 'ft'}" text-anchor="${o.anchor || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${r1(x)} ${r1(y)})"` : ''}${o.size ? ` font-size="${o.size}"` : ''}>${esc(s)}</text>`;
  const line = (x1, y1, x2, y2, cls = 'fl') => spend() || `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" class="${cls}"/>`;

  /* ---------- column graph ---------- */
  function bar(f, lang) {
    const W = 360, H = 250, ml = 52, mr = 12, mt = f.title ? 30 : 14, mb = f.xLabel ? 58 : 40;
    const pw = W - ml - mr, ph = H - mt - mb, n = f.values.length, max = f.max, step = f.step;
    const y = v => mt + ph - (v / max) * ph, bw = pw / n;
    let b = '';
    if (f.title) b += text(W / 2, 18, L(f.title, lang), { cls: 'ft fb' });
    for (let v = 0; v <= max + 1e-9; v += step) { b += line(ml, y(v), ml + pw, y(v), v === 0 ? 'fl fax' : 'fl fg'); b += text(ml - 6, y(v) + 4, v, { anchor: 'end', cls: 'ft fs' }); }
    f.values.forEach((v, i) => {
      const x = ml + i * bw;
      if (v !== null && v !== undefined) b += `<rect x="${r1(x + bw * 0.18)}" y="${r1(y(v))}" width="${r1(bw * 0.64)}" height="${r1(mt + ph - y(v))}" class="fbar"/>`;
      b += text(x + bw / 2, mt + ph + 16, L(f.cats[i], lang), { cls: 'ft fs' });
    });
    b += line(ml, mt, ml, mt + ph, 'fl fax');
    if (f.xLabel) b += text(ml + pw / 2, H - 10, L(f.xLabel, lang), { cls: 'ft fb' });
    if (f.yLabel) b += text(14, mt + ph / 2, L(f.yLabel, lang), { rot: -90, cls: 'ft fb' });
    return svg(W, H, b, L(f.title || f.yLabel, lang));
  }

  /* ---------- line graph ---------- */
  function lineGraph(f, lang) {
    const W = 360, H = 240, ml = 52, mr = 14, mt = 14, mb = 50, pw = W - ml - mr, ph = H - mt - mb;
    const min = f.min || 0, max = f.max, n = f.ys.length;
    const x = i => ml + (i / (n - 1)) * pw, y = v => mt + ph - ((v - min) / (max - min)) * ph;
    let b = '';
    for (let v = min; v <= max + 1e-9; v += f.step) { b += line(ml, y(v), ml + pw, y(v), v === min ? 'fl fax' : 'fl fg'); b += text(ml - 6, y(v) + 4, v, { anchor: 'end', cls: 'ft fs' }); }
    for (let i = 0; i < n; i++) { b += line(x(i), mt, x(i), mt + ph, 'fl fg'); b += text(x(i), mt + ph + 16, f.xs[i], { cls: 'ft fs' }); }
    b += `<polyline points="${f.ys.map((v, i) => `${r1(x(i))},${r1(y(v))}`).join(' ')}" class="fline"/>`;
    f.ys.forEach((v, i) => { b += `<circle cx="${r1(x(i))}" cy="${r1(y(v))}" r="3.5" class="fdot"/>`; });
    b += line(ml, mt, ml, mt + ph, 'fl fax');
    if (f.xLabel) b += text(ml + pw / 2, H - 8, L(f.xLabel, lang), { cls: 'ft fb' });
    if (f.yLabel) b += text(14, mt + ph / 2, L(f.yLabel, lang), { rot: -90, cls: 'ft fb' });
    return svg(W, H, b, L(f.yLabel, lang));
  }

  /* ---------- circular scale (kitchen scale / bathroom scale) ---------- */
  function dial(f, lang) {
    const W = 230, H = 230, cx = 115, cy = 118, R = 92, max = f.max;
    const ang = v => (v / max) * 2 * Math.PI - Math.PI / 2;
    let b = `<circle cx="${cx}" cy="${cy}" r="${R + 8}" class="fface"/>`;
    for (let v = 0; v < max - 1e-9; v += f.minor) {
      const a = ang(v), major = Math.abs(v / f.labelStep - Math.round(v / f.labelStep)) < 1e-9, r0 = major ? R - 14 : R - 7;
      b += line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * R, cy + Math.sin(a) * R, major ? 'fl fax' : 'fl');
      if (major) b += text(cx + Math.cos(a) * (R - 28), cy + Math.sin(a) * (R - 28) + 4, v, { cls: 'ft fs' });
    }
    const a = ang(f.value);
    b += `<line x1="${cx}" y1="${cy}" x2="${r1(cx + Math.cos(a) * (R - 10))}" y2="${r1(cy + Math.sin(a) * (R - 10))}" class="fneedle"/><circle cx="${cx}" cy="${cy}" r="5" class="fdot"/>`;
    b += text(cx, cy + 30, L(f.unit, lang), { cls: 'ft fb' });
    return svg(W, H, b, L(f.unit, lang));
  }

  /* ---------- measuring jug ---------- */
  function jug(f, lang) {
    const W = 200, H = 256, x0 = 70, x1 = 150, top = 26, bot = 236, max = f.max;
    const y = v => bot - (v / max) * (bot - top - 10);
    let b = `<rect x="${x0}" y="${r1(y(f.value))}" width="${x1 - x0}" height="${r1(bot - y(f.value))}" class="fliquid"/>`;
    b += `<path d="M${x0} ${top} L${x0} ${bot} L${x1} ${bot} L${x1} ${top}" class="fjug"/><path d="M${x1} ${top + 30} q 30 10 0 70" class="fjug"/>`;
    for (let v = f.minor; v <= max + 1e-9; v += f.minor) {
      const major = Math.abs(v / f.labelStep - Math.round(v / f.labelStep)) < 1e-9;
      b += line(x0, y(v), x0 + (major ? 18 : 10), y(v), 'fl fax');
      if (major) b += text(x0 - 6, y(v) + 4, v, { anchor: 'end', cls: 'ft fs' });
    }
    b += text(x0 + 6, top - 6, L(f.unit, lang), { anchor: 'start', cls: 'ft fb' });
    return svg(W, H, b, L(f.unit, lang));
  }

  /* ---------- analogue clock ---------- */
  function clock(f) {
    const W = 200, H = 200, c = 100, R = 88;
    let b = `<circle cx="${c}" cy="${c}" r="${R}" class="fface"/>`;
    for (let i = 0; i < 60; i++) { const a = i / 60 * 2 * Math.PI, r0 = i % 5 ? R - 5 : R - 10; b += line(c + Math.sin(a) * r0, c - Math.cos(a) * r0, c + Math.sin(a) * R, c - Math.cos(a) * R, i % 5 ? 'fl' : 'fl fax'); }
    for (let h = 1; h <= 12; h++) { const a = h / 12 * 2 * Math.PI; b += text(c + Math.sin(a) * (R - 22), c - Math.cos(a) * (R - 22) + 5, h, { cls: 'ft fb' }); }
    const ma = f.m / 60 * 2 * Math.PI, ha = ((f.h % 12) + f.m / 60) / 12 * 2 * Math.PI;
    b += `<line x1="${c}" y1="${c}" x2="${r1(c + Math.sin(ha) * 46)}" y2="${r1(c - Math.cos(ha) * 46)}" class="fhand fhour"/>`;
    b += `<line x1="${c}" y1="${c}" x2="${r1(c + Math.sin(ma) * 70)}" y2="${r1(c - Math.cos(ma) * 70)}" class="fhand"/><circle cx="${c}" cy="${c}" r="4" class="fdot"/>`;
    return svg(W, H, b, 'clock');
  }

  /* ---------- spinner with equal sections ---------- */
  function spinner(f, lang) {
    const W = 200, H = 200, c = 100, R = 86, n = f.labels.length;
    let b = '';
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / n * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2;
      b += `<path d="M${c} ${c} L${r1(c + Math.cos(a0) * R)} ${r1(c + Math.sin(a0) * R)} A${R} ${R} 0 0 1 ${r1(c + Math.cos(a1) * R)} ${r1(c + Math.sin(a1) * R)} Z" class="fsector${i % 2 ? ' alt' : ''}"/>`;
      b += text(c + Math.cos(am) * R * 0.58, c + Math.sin(am) * R * 0.58 + 7, L(f.labels[i], lang), { cls: 'ft fbig' });
    }
    const na = 2 * Math.PI / n - Math.PI / 2;   // needle rests on a section boundary, away from the numbers
    b += `<line x1="${c}" y1="${c}" x2="${r1(c + Math.cos(na) * 30)}" y2="${r1(c + Math.sin(na) * 30)}" class="fneedle"/><circle cx="${c}" cy="${c}" r="5" class="fdot"/>`;
    return svg(W, H, b, 'spinner');
  }

  /* ---------- rectilinear shape with labelled sides ---------- */
  function inside(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function shape(f, lang) {
    const xs = f.pts.map(p => p[0]), ys = f.pts.map(p => p[1]), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const sc = Math.min(240 / w, 170 / h), ox = 60 - Math.min(...xs) * sc, oy = 30 - Math.min(...ys) * sc;
    const P = f.pts.map(([x, y]) => [ox + x * sc, oy + y * sc]), W = w * sc + 120, H = h * sc + 60 + (f.note ? 18 : 0);
    let b = `<polygon points="${P.map(p => p.map(r1).join(',')).join(' ')}" class="fshape${f.shaded ? ' shaded' : ''}"/>`;
    (f.labels || []).forEach(lb => {
      const [x1, y1] = P[lb.edge], [x2, y2] = P[(lb.edge + 1) % P.length], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      let nx = (y2 - y1), ny = -(x2 - x1); const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      if (inside(P, mx + nx * 4, my + ny * 4)) { nx = -nx; ny = -ny; }
      // side labels sit beside vertical edges (left/right aligned) and above/below horizontal ones
      if (Math.abs(nx) > Math.abs(ny)) b += text(mx + nx * 7, my + 5, L(lb.text, lang), { cls: 'ft fb', anchor: nx > 0 ? 'start' : 'end' });
      else b += text(mx, my + ny * 14 + 5, L(lb.text, lang), { cls: 'ft fb' });
    });
    if (f.note) b += text(W / 2, H - 6, L(f.note, lang), { cls: 'ft fs' });
    return svg(Math.round(W), Math.round(H), b, 'shape');
  }

  /* ---------- shapes drawn on a square grid ---------- */
  function grid(f, lang) {
    const s = 22, W = f.w * s + 20, H = f.h * s + 20;
    let b = '';
    f.shapes.forEach((sh, k) => sh.cells.forEach(([x, y]) => { b += `<rect x="${10 + x * s}" y="${10 + y * s}" width="${s}" height="${s}" class="fcell c${k}"/>`; }));
    for (let x = 0; x <= f.w; x++) b += line(10 + x * s, 10, 10 + x * s, 10 + f.h * s, 'fl fg');
    for (let y = 0; y <= f.h; y++) b += line(10, 10 + y * s, 10 + f.w * s, 10 + y * s, 'fl fg');
    f.shapes.forEach(sh => { if (sh.label) { const [x, y] = sh.labelAt || sh.cells[0]; b += text(10 + x * s + s / 2, 10 + y * s + s / 2 + 5, L(sh.label, lang), { cls: 'ft fb' }); } });
    return svg(W, H, b, 'grid');
  }

  /* ---------- pictograph (HTML) ---------- */
  function picto(f, lang) {
    const rows = f.rows.map(r => {
      const whole = Math.floor(r.count), half = r.count - whole >= 0.5;
      if (!(whole >= 0 && whole <= 200)) throw new Error('figure too large');
      const icons = `<span class="picons">${esc(f.icon).repeat(whole)}${half ? `<span class="phalf">${esc(f.icon)}</span>` : ''}</span>`;
      return `<tr><th scope="row">${esc(L(r.label, lang))}</th><td>${icons}</td></tr>`;
    }).join('');
    return `<table class="ftable picto"><tbody>${rows}</tbody></table><p class="fkey">${esc(L(f.key, lang))}</p>`;
  }

  /* ---------- table (HTML) ---------- */
  function table(f, lang) {
    const head = f.head ? `<thead><tr>${f.head.map(h => `<th scope="col">${esc(L(h, lang))}</th>`).join('')}</tr></thead>` : '';
    const body = f.rows.map(r => `<tr>${r.map((c, i) => (i === 0 && f.rowHeads ? `<th scope="row">${esc(L(c, lang))}</th>` : `<td>${esc(L(c, lang))}</td>`)).join('')}</tr>`).join('');
    return `<table class="ftable${f.grid ? ' gridtable' : ''}">${head}<tbody>${body}</tbody></table>`;
  }


  /* ---------- pie chart ---------- */
  function pie(f, lang) {
    const W = 340, H = 220, c = 105, R = 92, tot = f.values.reduce((a, b) => a + b, 0);
    let a0 = -Math.PI / 2, b = '', leg = '';
    f.values.forEach((v, i) => {
      const a1 = a0 + v / tot * 2 * Math.PI, large = a1 - a0 > Math.PI ? 1 : 0, am = (a0 + a1) / 2;
      const cls = f.shade != null ? (i < f.shade ? 'p0' : 'pw') : 'p' + (i % 6);
      b += `<path d="M${c} ${c + 5} L${r1(c + Math.cos(a0) * R)} ${r1(c + 5 + Math.sin(a0) * R)} A${R} ${R} 0 ${large} 1 ${r1(c + Math.cos(a1) * R)} ${r1(c + 5 + Math.sin(a1) * R)} Z" class="fpie ${cls}"/>`;
      if (f.showValues) b += text(c + Math.cos(am) * R * 0.62, c + 5 + Math.sin(am) * R * 0.62 + 4, f.showValues[i], { cls: 'ft fb' });
      if (f.labels && f.labels[i]) leg += `<rect x="215" y="${22 + i * 28}" width="16" height="16" class="fpie p${i % 6}"/>` + text(238, 35 + i * 28, L(f.labels[i], lang), { anchor: 'start', cls: 'ft' });
      a0 = a1;
    });
    return svg(f.labels && f.labels.length ? W : 2 * c + 10, H, b + leg, 'pie chart');
  }

  /* ---------- coordinate plane with points / line segments ---------- */
  function coord(f, lang) {
    const s = 24, nx = f.xmax - f.xmin, ny = f.ymax - f.ymin, W = nx * s + 40, H = ny * s + 40;
    const X = x => 20 + (x - f.xmin) * s, Y = y => 20 + (f.ymax - y) * s;
    let b = '';
    for (let x = f.xmin; x <= f.xmax; x++) b += line(X(x), Y(f.ymin), X(x), Y(f.ymax), x === 0 ? 'fl fax' : 'fl fg');
    for (let y = f.ymin; y <= f.ymax; y++) b += line(X(f.xmin), Y(y), X(f.xmax), Y(y), y === 0 ? 'fl fax' : 'fl fg');
    for (let x = f.xmin; x <= f.xmax; x++) if (x && x % (f.tick || 2) === 0) b += text(X(x), Y(0) + 14, x, { cls: 'ft fs' });
    for (let y = f.ymin; y <= f.ymax; y++) if (y && y % (f.tick || 2) === 0) b += text(X(0) - 5, Y(y) + 4, y, { anchor: 'end', cls: 'ft fs' });
    b += text(X(f.xmax) - 4, Y(0) - 6, 'x', { cls: 'ft fb' }) + text(X(0) + 8, Y(f.ymax) + 12, 'y', { cls: 'ft fb' });
    (f.segments || []).forEach(([x1, y1, x2, y2]) => { b += `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" class="fline"/>`; });
    (f.points || []).forEach(([x, y, lab]) => { b += `<circle cx="${X(x)}" cy="${Y(y)}" r="4" class="fdot"/>`; if (lab) b += text(X(x) + 8, Y(y) - 7, L(lab, lang), { anchor: 'start', cls: 'ft fb' }); });
    return svg(W, H, b, 'coordinate grid');
  }

  /* ---------- triangle with labelled angles / sides ---------- */
  function triangle(f, lang) {
    const P = f.right ? [[40, 190], [300, 190], [40, 40]] : [[30, 190], [310, 190], [f.apex || 120, 40]];
    const names = ['A', 'B', 'C'];
    let b = `<polygon points="${P.map(p => p.join(',')).join(' ')}" class="fshape shaded"/>`;
    if (f.right) b += `<path d="M40 172 L58 172 L58 190" class="fl fax" fill="none"/>`;
    const cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
    (f.angles || []).forEach((a, i) => { if (a == null) return; const [x, y] = P[i], dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy); b += text(x + dx / d * 34, y + dy / d * 34 + 5, L(a, lang), { cls: 'ft fb' }); });
    (f.sides || []).forEach((sd, i) => { if (sd == null) return; const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 3], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy); b += text(mx + dx / d * 16, my + dy / d * 16 + 5, L(sd, lang), { cls: 'ft fb' }); });
    if (f.names) P.forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); b += text(x + dx / d * 14, y + dy / d * 14 + 5, names[i], { cls: 'ft fb' }); });
    if (f.note) b += text(170, 222, L(f.note, lang), { cls: 'ft fs' });
    return svg(340, f.note ? 230 : 215, b, 'triangle');
  }


  /* ---------- maths formatting for question text ----------
     a/b → stacked fraction, 2 1/3 → mixed number, x^2 / x^(n+1) → superscript.
     Input is plain text; output is safe HTML. */
  function math(s) {
    let h = esc(s);
    h = h.replace(/\^\(([^()]{1,24})\)/g, '<sup>$1</sup>').replace(/\^([−-]?[0-9a-zA-Zα-ω]{1,4})/g, '<sup>$1</sup>');
    const frac = (n, d) => `<span class="frac"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
    h = h.replace(/(^|[^\d./:,])(\d{1,4}) (\d{1,4})\/(\d{1,5})(?![\d/])/g, (m, pre, w, n, d) => `${pre}<span class="mixed">${w}${frac(n, d)}</span>`);
    h = h.replace(/(^|[^\d./:,])(\d{1,5})\/(\d{1,5})(?![\d/])/g, (m, pre, n, d) => `${pre}${frac(n, d)}`);
    return h;
  }
  /* Question text: "Work out …", "Solve for x: …", "计算：…" etc. get the expression in a formula block */
  const LEAD = /^(Work out cleverly:|Work out|Evaluate|Solve for x:|Solve|Simplify|简便计算：|计算：|计算|解方程：|化简|求)\s*/;
  const FORMULA_OK = /^[0-9a-zA-Z\s+×÷−\-=()\[\]^/√.,|⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉∫ΣπⁿαβγθωΔ□○△◆■●…·⌊⌋<>≤≥%°$′]+$/;
  function looksLikeFormula(t) {
    if (!t || !FORMULA_OK.test(t) || !/[0-9]/.test(t) || !/[=+×÷−\-^/√∫Σ]/.test(t)) return false;
    const words = (t.match(/[A-Za-z]{3,}/g) || []).filter(w => !/^(log|sin|cos|tan|lim|cis)$/i.test(w));
    return words.length === 0;
  }
  function questionHTML(text) {
    return String(text).split('\n').map(line => {
      const m = line.match(LEAD);
      if (m) {
        const rest = line.slice(m[0].length), cut = rest.search(/[.。](\s|$)|，|, (?=[A-Za-z])|；/), f = cut >= 0 ? rest.slice(0, cut) : rest, tail = cut >= 0 ? rest.slice(cut) : '';
        if (looksLikeFormula(f.trim())) return `${m[1] ? `<span class="lead">${esc(m[1])}</span>` : ''}<span class="formula">${math(f.trim())}</span>${tail.replace(/^[.。]\s*$/, '') ? `<span class="tail">${math(tail.replace(/^[.。，,；]\s*/, ''))}</span>` : ''}`;
      }
      return math(line);
    }).join('<br>');
  }

  const R = { bar, line: lineGraph, dial, jug, clock, spinner, shape, grid, picto, table, pie, coord, triangle };
  /* Markup is only kept when it is real drawing: not empty, not huge, and no attribute holding NaN / undefined / Infinity
     (R3.2, v1.7.0: a figure from a hand-edited file with xmin "a" drew width="NaN" and put 18 errors in the console). */
  const MAX_MARKUP = 300000;
  const valid = out => typeof out === 'string' && out.length > 0 && out.length <= MAX_MARKUP && !/="[^"]*(?:NaN|undefined|Infinity)[^"]*"/.test(out);
  function render(fig, lang) {
    if (!fig || !Object.prototype.hasOwnProperty.call(R, fig.type)) return '';
    budget = BUDGET;
    try {
      const out = R[fig.type](fig, lang || 'en');
      if (!valid(out)) { console.warn('figure not drawn: invalid numbers', fig.type); return ''; }
      return `<figure class="fig fig-${fig.type}">${out}</figure>`;
    } catch (e) { console.warn('figure failed', e); return ''; }
  }
  /* Whether a figure draws real markup: used to check a figure read from a progress file (R2.3, v1.7.0; R3.2). */
  function draws(fig) {
    if (!fig || !Object.prototype.hasOwnProperty.call(R, fig.type)) return false;
    budget = BUDGET;
    try { return valid(R[fig.type](fig, 'en')); } catch (e) { return false; }
  }
  const api = { render, draws, esc, math, questionHTML };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Fig = api;
})(typeof window !== 'undefined' ? window : globalThis);
