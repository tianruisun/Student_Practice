/* Mini game (v1.10.0): Broken Calculator. The calculator's screen shows a sum with some digits broken (■);
   work out the missing digits. Three minutes; as many right as possible. Sums start easy and get harder.
   Every sum has exactly one way to fill its broken digits (and no number starts with 0).

   BrokenRules: the pure rules (no page), also loaded by tests/run.js under Node.
   BrokenGame.create(body, ui, { t, onEnd }): the playable round in the page. */
(function (root) {
  'use strict';

  const SECONDS = 180;
  const HOLE = '?';
  const int = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));

  /* how hard the next sum is, from how many the student has right so far */
  function stage(score) {
    if (score < 3) return { ops: ['+'], a: [10, 49], b: [1, 9], holes: 1 };
    if (score < 6) return { ops: ['+', '-'], a: [10, 99], b: [10, 99], holes: [1, 2] };
    if (score < 10) return { ops: ['+', '-', '×'], a: [10, 99], b: [2, 9], holes: 2 };
    if (score < 15) return { ops: ['+', '-', '×'], a: [100, 999], b: [10, 99], holes: [2, 3], mulB: [2, 9] };
    return { ops: ['+', '-', '×'], a: [100, 999], b: [10, 99], holes: 3, mulB: [11, 19] };
  }

  const calc = (a, op, b) => (op === '+' ? a + b : op === '-' ? a - b : a * b);

  /* "4?+25=7?" → every way to fill the ?s that makes the sum right, as digit strings in order */
  function solve(masked) {
    const m = /^([\d?]+)([+\-×])([\d?]+)=([\d?]+)$/.exec(masked);
    if (!m) return [];
    const holes = (masked.match(/\?/g) || []).length, out = [];
    for (let x = 0; x < Math.pow(10, holes); x++) {
      const fill = String(x).padStart(holes, '0');
      let i = 0;
      const nums = [m[1], m[3], m[4]].map(s => s.replace(/\?/g, () => fill[i++]));
      if (nums.some(s => s.length > 1 && s[0] === '0')) continue;
      const [a, b, c] = nums.map(Number);
      if (calc(a, m[2], b) === c) out.push(fill);
    }
    return out;
  }

  /* a sum with broken digits that has exactly one answer */
  function make(score, rand) {
    const S = stage(score);
    for (let tries = 0; tries < 200; tries++) {
      const op = S.ops[Math.floor(rand() * S.ops.length)];
      let a = int(S.a[0], S.a[1], rand);
      let b = op === '×' ? int((S.mulB || S.b)[0], (S.mulB || S.b)[1], rand) : int(S.b[0], S.b[1], rand);
      if (op === '×' && !S.mulB) b = int(2, 9, rand);
      if (op === '-' && b > a) [a, b] = [b, a];
      const c = calc(a, op, b);
      if (c < 0) continue;
      const text = `${a}${op}${b}=${c}`;
      const digitAt = [...text].map((ch, i) => (/\d/.test(ch) ? i : -1)).filter(i => i >= 0);
      const k = Array.isArray(S.holes) ? int(S.holes[0], S.holes[1], rand) : S.holes;
      const at = digitAt.slice().sort(() => rand() - 0.5).slice(0, k).sort((x, y) => x - y);
      const masked = [...text].map((ch, i) => (at.includes(i) ? HOLE : ch)).join('');
      const ways = solve(masked);
      if (ways.length === 1) return { text, masked, holes: at, answer: ways[0], op };
    }
    return { text: '1+1=2', masked: '1+1=?', holes: [4], answer: '2', op: '+' };   // never reached in practice
  }

  const R = { SECONDS, HOLE, stage, solve, make, calc };

  /* ---------- the round in the page ---------- */
  function create(body, ui, opts) {
    const t = opts.t, rand = opts.rand || Math.random, Kit = root.GameKit;
    let q = null, typed = '', score = 0, wrong = 0, running = false, waiting = false, keyHandler = null, nodes = {};
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
    const clock = Kit.clock(ms => {
      ui.clock.textContent = Kit.fmt(SECONDS * 1000 - ms + 999);
      if (running && ms >= SECONDS * 1000) finish();
    });
    const say = s => { ui.status.textContent = s; };

    /* the screen: the sum, with typed digits in the broken places and ■ for the rest */
    function paint(showAll) {
      const lcd = nodes.lcd; lcd.innerHTML = '';
      let h = 0;
      [...q.masked].forEach((ch, i) => {
        const s = document.createElement('span');
        if (ch === HOLE) {
          const v = showAll ? q.text[i] : typed[h];
          s.className = 'bc-hole' + (v !== undefined ? ' filled' : '') + (!showAll && h === typed.length ? ' cur' : '');
          s.textContent = v !== undefined ? v : '■';
          h++;
        } else {
          s.className = /\d/.test(ch) ? 'bc-d' : 'bc-op';
          s.textContent = ch === '-' ? '−' : ch;
        }
        lcd.append(s);
      });
      lcd.setAttribute('aria-label', t('broken.screen', { sum: q.masked.replace(/\?/g, ' ■ ').replace(/-/g, ' − ') }));
      lcd.dataset.masked = q.masked;
    }

    function next() {
      q = make(score, rand);
      typed = ''; waiting = false;
      nodes.lcd.className = 'bc-lcd';
      nodes.msg.textContent = t('broken.find', { n: q.holes.length });
      paint(false);
    }

    function submit() {
      if (!running || waiting || typed.length < q.holes.length) return;
      waiting = true;
      if (typed === q.answer) {
        score++; ui.score.textContent = score;
        nodes.lcd.className = 'bc-lcd ok';
        say(t('broken.right', { n: score }));
        later(next, 500);
      } else {
        wrong++;
        nodes.lcd.className = 'bc-lcd no';
        paint(true);
        nodes.msg.textContent = t('broken.wrong');
        say(t('broken.wrong'));
        later(next, 1500);
      }
    }

    function key(k) {
      if (!running || waiting) return;
      if (/^\d$/.test(k)) { if (typed.length < q.holes.length) typed += k; }
      else if (k === 'back') typed = typed.slice(0, -1);
      else if (k === 'ok') return submit();
      paint(false);
    }

    function onKey(e) {
      if (!running || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) { e.preventDefault(); key(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
      else if (e.key === 'Enter' || e.key === '=') { if (Kit.onButton(e)) return; e.preventDefault(); key('ok'); }
    }

    function build() {
      body.innerHTML = '';
      const calcBox = document.createElement('div'); calcBox.className = 'bc-calc';
      const lcd = document.createElement('div'); lcd.className = 'bc-lcd'; lcd.setAttribute('role', 'img');
      calcBox.append(lcd);
      const msg = document.createElement('p'); msg.className = 'bc-msg';
      const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(d => ({ k: d, text: d }))
        .concat([{ k: 'back', text: '⌫', label: t('game.del') }, { k: '0', text: '0' }, { k: 'ok', text: '=', label: t('broken.check'), cls: 'bl-fire' }]);
      const pad = Kit.pad(keys, key, t('game.pad'), 'bc-pad');
      body.append(Kit.main(calcBox, msg), pad);
      nodes = { lcd, msg };
    }

    function clear() {
      clock.stop();
      timers.forEach(clearTimeout); timers.clear();
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    function finish() {
      if (!running) return;
      running = false;
      clear();
      ui.clock.textContent = '0:00';
      opts.onEnd({ score, wrong });
    }

    return {
      start() {
        this.stop();
        score = 0; wrong = 0; running = true;
        ui.score.textContent = '0';
        build(); next();
        clock.start();
        keyHandler = onKey; document.addEventListener('keydown', keyHandler);
      },
      stop() { running = false; clear(); body.innerHTML = ''; },
      key,
      get running() { return running; },
      get state() { return q && { score, wrong, masked: q.masked, answer: q.answer, typed, timers: timers.size }; }
    };
  }

  root.BrokenRules = R;
  root.BrokenGame = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
