/* Shared parts of the v1.10.0 puzzle games (Sudoku, Money Master, Broken Calculator):
   a clock that stops while the page is hidden, m:ss formatting, and an on-screen keypad. */
(function (root) {
  'use strict';

  const fmt = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ms counted only while the page is visible (a phone locked mid-round does not cost time); onTick(ms) runs ~5 times a second */
  function clock(onTick, every = 200) {
    let ms = 0, last = 0, id = 0;
    const now = () => performance.now();
    const step = () => { const n = now(); if (!document.hidden) ms += Math.min(500, n - last); last = n; onTick(ms); };
    return {
      start() { this.stop(); ms = 0; last = now(); id = setInterval(step, every); onTick(0); },
      stop() { if (id) { step(); clearInterval(id); id = 0; } },
      get ms() { return id && !document.hidden ? ms + Math.min(500, now() - last) : ms; }
    };
  }

  /* keys: [{ k, text, label?, cls? }]; a tap calls onKey(k) */
  function pad(keys, onKey, label, cls) {
    const p = document.createElement('div');
    p.className = 'bl-pad pz-pad' + (cls ? ' ' + cls : '');
    p.setAttribute('role', 'group'); p.setAttribute('aria-label', label);
    for (const key of keys) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = key.text; b.dataset.k = key.k;
      if (key.label) b.setAttribute('aria-label', key.label);
      if (key.cls) b.className = key.cls;
      b.addEventListener('click', () => onKey(key.k));
      p.append(b);
    }
    return p;
  }

  /* Enter / Space on a focused on-screen key presses that key; the game must not also act on it */
  const onButton = e => !!(e.target && e.target.closest && e.target.closest('button'));

  /* the game's board or question, kept apart from its keypad so a sideways screen can put them side by side */
  function main(...kids) { const m = document.createElement('div'); m.className = 'pz-main'; m.append(...kids); return m; }

  root.GameKit = { fmt, clock, pad, onButton, main };
  if (typeof module !== 'undefined' && module.exports) module.exports = { fmt };
})(typeof window !== 'undefined' ? window : globalThis);
