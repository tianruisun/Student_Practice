/* Mini game (v1.10.0): Sudoku. Easy 4×4 (2×2 boxes), Medium 6×6 (2×3 boxes), Hard 9×9 (3×3 boxes).
   Every puzzle has exactly one solution. The clock runs until the grid is full and correct; the best time per level is kept.

   SudokuRules: the pure rules (no page), also loaded by tests/run.js under Node.
   SudokuGame.create(body, ui, { t, onEnd }): the playable board in the page. */
(function (root) {
  'use strict';

  const LEVELS = {
    easy: { n: 4, br: 2, bc: 2, holes: 8 },      // 8 of 16 cells to fill
    medium: { n: 6, br: 2, bc: 3, holes: 20 },   // 20 of 36
    hard: { n: 9, br: 3, bc: 3, holes: 48 }      // 48 of 81 (33 given)
  };

  const shuffle = (a, rand) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const range = n => [...Array(n).keys()];

  /* A full grid: a pattern that is always valid, then digits relabelled and rows/columns moved only within their band /
     stack, and bands / stacks moved as wholes, which keeps it valid. Values 1..n, row by row. */
  function solved(L, rand) {
    const { n, br, bc } = L;
    const digits = shuffle(range(n).map(i => i + 1), rand);
    const rows = shuffle(range(n / br), rand).flatMap(b => shuffle(range(br), rand).map(r => b * br + r));
    const cols = shuffle(range(n / bc), rand).flatMap(s => shuffle(range(bc), rand).map(c => s * bc + c));
    const g = [];
    for (const r of rows) for (const c of cols) g.push(digits[(bc * (r % br) + Math.floor(r / br) + c) % n]);
    return g;
  }

  const peersCache = {};
  function peers(L) {
    const key = L.n + 'x' + L.br;
    if (peersCache[key]) return peersCache[key];
    const { n, br, bc } = L, out = [];
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n, set = new Set();
      for (let k = 0; k < n; k++) { set.add(r * n + k); set.add(k * n + c); }
      const r0 = r - (r % br), c0 = c - (c % bc);
      for (let a = 0; a < br; a++) for (let b = 0; b < bc; b++) set.add((r0 + a) * n + c0 + b);
      set.delete(i); out.push([...set]);
    }
    return (peersCache[key] = out);
  }

  /* How many solutions a grid (0 = empty) has, stopping at `limit`. Fills the cell with the fewest choices first. */
  function count(grid, L, limit = 2, out = null) {
    const g = grid.slice(), P = peers(L), n = L.n;
    let found = 0;
    (function solve() {
      if (found >= limit) return;
      let best = -1, bestOpts = null;
      for (let i = 0; i < g.length; i++) {
        if (g[i]) continue;
        const used = new Set(P[i].map(p => g[p]));
        const opts = [];
        for (let v = 1; v <= n; v++) if (!used.has(v)) opts.push(v);
        if (!opts.length) return;
        if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; if (opts.length === 1) break; }
      }
      if (best < 0) { found++; if (out) out.push(g.slice()); return; }
      for (const v of bestOpts) { g[best] = v; solve(); if (found >= limit) break; }
      g[best] = 0;
    })();
    return found;
  }

  /* the first full answer of a grid, or null (tests use it to fill a board as a student would) */
  function solve(grid, L) { const out = []; count(grid, L, 1, out); return out[0] || null; }

  /* A puzzle with exactly one solution: empty cells one by one (random order), keeping each only if still unique. */
  function puzzle(level, rand) {
    const L = LEVELS[level], solution = solved(L, rand), grid = solution.slice();
    let holes = 0;
    for (const i of shuffle(range(grid.length), rand)) {
      if (holes >= L.holes) break;
      const keep = grid[i];
      grid[i] = 0;
      if (count(grid, L, 2) === 1) holes++; else grid[i] = keep;
    }
    return { level, n: L.n, br: L.br, bc: L.bc, solution, grid };
  }

  /* Cells whose value repeats in their row, column or box */
  function conflicts(grid, L) {
    const P = peers(L), bad = new Set();
    grid.forEach((v, i) => { if (v && P[i].some(p => grid[p] === v)) bad.add(i); });
    return bad;
  }
  const done = (grid, L) => grid.every(v => v > 0) && conflicts(grid, L).size === 0;

  const R = { LEVELS, solved, count, solve, puzzle, conflicts, done, peers };

  /* ---------- the board in the page ---------- */
  function create(body, ui, opts) {
    const t = opts.t, rand = opts.rand || Math.random, Kit = root.GameKit;
    let P = null, L = null, cells = [], fixed = [], sel = -1, running = false, keyHandler = null;
    const clock = Kit.clock(ms => { ui.clock.textContent = Kit.fmt(ms); });

    function paint() {
      const bad = conflicts(P.grid, L);
      cells.forEach((b, i) => {
        const v = P.grid[i];
        b.textContent = v ? String(v) : '';
        b.classList.toggle('sel', i === sel);
        b.classList.toggle('bad', bad.has(i));
        b.setAttribute('aria-label', t('sudoku.cell', { r: Math.floor(i / L.n) + 1, c: (i % L.n) + 1, v: v ? String(v) : t('sudoku.empty') }));
      });
      ui.score.textContent = String(P.grid.filter(v => !v).length);
    }

    function select(i) { sel = i; paint(); if (cells[i]) cells[i].focus(); }

    function put(v) {
      if (!running || sel < 0 || fixed[sel]) return;
      P.grid[sel] = v;
      paint();
      if (conflicts(P.grid, L).has(sel)) ui.status.textContent = t('sudoku.clash');
      if (done(P.grid, L)) finish();
    }

    function key(k) { if (k === 'back') put(0); else if (/^\d$/.test(k) && Number(k) <= L.n) put(Number(k)); }

    function onKey(e) {
      if (!running || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = L.n;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); key(e.key === '0' ? 'back' : e.key); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); key('back'); }
      else if (e.key.startsWith('Arrow') && sel >= 0) {
        e.preventDefault();
        const r = Math.floor(sel / n), c = sel % n;
        const to = { ArrowUp: [r - 1, c], ArrowDown: [r + 1, c], ArrowLeft: [r, c - 1], ArrowRight: [r, c + 1] }[e.key];
        if (to && to[0] >= 0 && to[0] < n && to[1] >= 0 && to[1] < n) select(to[0] * n + to[1]);
      }
    }

    function build() {
      body.innerHTML = '';
      const board = document.createElement('div');
      board.className = 'sd-board sd-' + L.n;
      board.setAttribute('role', 'group');
      board.setAttribute('aria-label', t('sudoku.board', { n: L.n }));
      board.style.setProperty('--n', L.n);
      cells = []; fixed = P.grid.map(v => v > 0);
      for (let i = 0; i < L.n * L.n; i++) {
        const r = Math.floor(i / L.n), c = i % L.n;
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'sd-cell';
        if (fixed[i]) b.classList.add('given');
        if (r % L.br === 0 && r) b.classList.add('sb-t');
        if (c % L.bc === 0 && c) b.classList.add('sb-l');
        b.dataset.i = i;
        b.addEventListener('click', () => select(i));
        cells.push(b); board.append(b);
      }
      const keys = [];
      for (let v = 1; v <= L.n; v++) keys.push({ k: String(v), text: String(v) });
      keys.push({ k: 'back', text: '⌫', label: t('game.del') });
      body.append(Kit.main(board), Kit.pad(keys, key, t('game.pad'), 'sd-pad sd-pad-' + L.n));
    }

    function clear() {
      clock.stop();
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    function finish() {
      running = false;
      clear();
      cells.forEach(b => { b.disabled = true; });
      opts.onEnd({ level: P.level, ms: clock.ms });
    }

    return {
      start(level) {
        this.stop();
        L = LEVELS[level];
        P = puzzle(level, rand);
        build();
        sel = P.grid.findIndex(v => !v);
        running = true;
        clock.start(); paint();
        keyHandler = onKey; document.addEventListener('keydown', keyHandler);
        if (cells[sel]) cells[sel].focus();
      },
      stop() { running = false; clear(); body.innerHTML = ''; },
      key,
      get running() { return running; },
      get state() { return P && { level: P.level, n: L.n, grid: P.grid.slice(), solution: P.solution.slice(), selected: sel }; }
    };
  }

  root.SudokuRules = R;
  root.SudokuGame = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
