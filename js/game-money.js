/* Mini game (v1.10.0): Money Master. Work out the change in Australian dollars, five questions a round.
   Easy: one item in whole dollars, paid with $10 or $20. Medium: one or two items to the 5 cents, paid with $20 or $50.
   Hard: two or three items, paid with $50 or $100. Australia has no 1c or 2c coins, so every amount is a multiple of 5c.
   A wrong answer is tried again while the clock runs; the best time per level is kept.

   MoneyRules: the pure rules (no page), also loaded by tests/run.js under Node.
   MoneyGame.create(body, ui, { t, onEnd }): the playable round in the page. */
(function (root) {
  'use strict';

  const ROUNDS = 5;
  const ITEMS = ['apple', 'juice', 'pencil', 'sandwich', 'notebook', 'ball', 'teddy', 'book', 'icecream', 'paints', 'cap', 'kite'];
  const ICONS = { apple: '🍎', juice: '🧃', pencil: '✏️', sandwich: '🥪', notebook: '📒', ball: '⚽', teddy: '🧸', book: '📚', icecream: '🍦', paints: '🎨', cap: '🧢', kite: '🪁' };
  const LEVELS = {
    easy: { items: [1, 1], step: 100, min: 100, max: 1900, notes: [1000, 2000] },
    medium: { items: [1, 2], step: 5, min: 50, max: 995, notes: [2000, 5000] },
    hard: { items: [2, 3], step: 5, min: 105, max: 3295, notes: [5000, 10000] }
  };
  // Australian notes and coins, largest first (no 1c or 2c)
  const DENOMS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5];
  const NOTE_COLOURS = { 500: 'pink', 1000: 'blue', 2000: 'red', 5000: 'yellow', 10000: 'green' };

  const pick = (a, rand) => a[Math.floor(rand() * a.length)];
  const between = (lo, hi, step, rand) => lo + step * Math.floor(rand() * (Math.floor((hi - lo) / step) + 1));

  /* one question: items with prices (cents), the note handed over, and the change (always more than 0) */
  function question(level, rand) {
    const L = LEVELS[level];
    const k = between(L.items[0], L.items[1], 1, rand);
    const names = ITEMS.slice().sort(() => rand() - 0.5).slice(0, k);
    const items = names.map(id => ({ id, cents: between(L.min, L.max, L.step, rand) }));
    const total = items.reduce((s, x) => s + x.cents, 0);
    const notes = L.notes.filter(n => n > total);
    const paid = pick(notes.length ? notes : [L.notes[L.notes.length - 1]], rand);
    return { level, items, total, paid, change: paid - total };
  }

  /* what a student typed, as cents; null when it is not a money amount. "3", "3.5", "3.50", "$3.50" are all fine */
  function parse(text) {
    const m = /^\$?(\d{1,3})(?:\.(\d{0,2}))?$/.exec(String(text).trim());
    if (!m) return null;
    return Number(m[1]) * 100 + Number(((m[2] || '') + '00').slice(0, 2));
  }
  const fmt = cents => (cents < 100 && cents % 100 ? cents + 'c' : '$' + (cents / 100).toFixed(2));
  const price = cents => '$' + (cents / 100).toFixed(2);

  /* the fewest notes and coins that make an amount: [[value, count], ...] */
  function breakdown(cents) {
    const out = [];
    for (const d of DENOMS) { const n = Math.floor(cents / d); if (n) { out.push([d, n]); cents -= n * d; } }
    return out;
  }
  const denomText = d => (d >= 100 ? '$' + d / 100 : d + 'c');

  const R = { ROUNDS, ITEMS, ICONS, LEVELS, DENOMS, NOTE_COLOURS, question, parse, fmt, price, breakdown, denomText };

  /* ---------- the round in the page ---------- */
  function create(body, ui, opts) {
    const t = opts.t, rand = opts.rand || Math.random, Kit = root.GameKit;
    let level = 'easy', q = null, n = 0, typed = '', running = false, waiting = false, wrong = 0, keyHandler = null;
    let nodes = {};
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
    const clock = Kit.clock(ms => { ui.clock.textContent = Kit.fmt(ms); });
    const say = s => { ui.status.textContent = s; };

    function showTyped() { nodes.typed.textContent = '$' + (typed || ' '); }

    function ask() {
      q = question(level, rand);
      typed = ''; waiting = false;
      ui.score.textContent = (n + 1) + '/' + ROUNDS;
      const list = nodes.items; list.innerHTML = '';
      for (const it of q.items) {
        const li = document.createElement('li');
        li.className = 'mm-item'; li.dataset.cents = it.cents;
        const ic = document.createElement('span'); ic.className = 'mm-icon'; ic.textContent = ICONS[it.id]; ic.setAttribute('aria-hidden', 'true');
        const nm = document.createElement('span'); nm.className = 'mm-name'; nm.textContent = t('money.item.' + it.id);
        const pr = document.createElement('span'); pr.className = 'mm-price'; pr.textContent = price(it.cents);
        li.append(ic, nm, pr); list.append(li);
      }
      nodes.note.className = 'mm-note mm-' + NOTE_COLOURS[q.paid];
      nodes.note.dataset.cents = q.paid;
      nodes.note.textContent = '$' + q.paid / 100;
      nodes.note.setAttribute('aria-label', t('money.paidWith', { v: '$' + q.paid / 100 }));
      nodes.msg.textContent = ''; nodes.msg.className = 'mm-msg';
      showTyped();
    }

    function submit() {
      if (!running || waiting || !typed) return;
      const v = parse(typed);
      if (v === q.change) {
        waiting = true;
        const parts = breakdown(q.change).map(([d, c]) => (c > 1 ? c + ' × ' : '') + denomText(d)).join(' + ');
        nodes.msg.className = 'mm-msg ok'; nodes.msg.textContent = t('money.right', { v: price(q.change), parts });
        say(nodes.msg.textContent);
        n++;
        later(() => { if (n >= ROUNDS) finish(); else ask(); }, 1400);
      } else {
        wrong++;
        nodes.msg.className = 'mm-msg no'; nodes.msg.textContent = v === null ? t('money.format') : t('money.wrong');
        say(nodes.msg.textContent);
        typed = ''; showTyped();
      }
    }

    function key(k) {
      if (!running || waiting) return;
      if (/^\d$/.test(k)) { if (typed.length < 6 && !/\.\d\d$/.test(typed)) typed += k; }
      else if (k === '.') { if (!typed.includes('.') && typed.length < 4) typed += (typed ? '' : '0') + '.'; }
      else if (k === 'back') typed = typed.slice(0, -1);
      else if (k === 'ok') return submit();
      showTyped();
    }

    function onKey(e) {
      if (!running || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key) || e.key === '.') { e.preventDefault(); key(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
      else if (e.key === 'Enter') { if (Kit.onButton(e)) return; e.preventDefault(); key('ok'); }
    }

    function build() {
      body.innerHTML = '';
      const shop = document.createElement('div'); shop.className = 'mm-shop';
      const h = document.createElement('p'); h.className = 'mm-ask'; h.textContent = t('money.ask');
      const items = document.createElement('ul'); items.className = 'mm-items';
      const payRow = document.createElement('p'); payRow.className = 'mm-pay';
      const payLabel = document.createElement('span'); payLabel.textContent = t('money.paid');
      const note = document.createElement('span');
      payRow.append(payLabel, note);
      shop.append(h, items, payRow);
      const entry = document.createElement('div'); entry.className = 'mm-entry';
      const lab = document.createElement('span'); lab.className = 'mm-label'; lab.textContent = t('money.change');
      const typedOut = document.createElement('output'); typedOut.className = 'bl-typed mm-typed';
      entry.append(lab, typedOut);
      const msg = document.createElement('p'); msg.className = 'mm-msg'; msg.setAttribute('aria-hidden', 'true');
      // four across, so the keypad is four rows: 1 2 3 ⌫ / 4 5 6 . / 7 8 9 0 / ✓
      const d = k => ({ k, text: k });
      const keys = [d('1'), d('2'), d('3'), { k: 'back', text: '⌫', label: t('game.del') }, d('4'), d('5'), d('6'), { k: '.', text: '.', label: t('money.point') },
        d('7'), d('8'), d('9'), d('0'), { k: 'ok', text: '✓', label: t('money.check'), cls: 'bl-fire pz-wide' }];
      const pad = Kit.pad(keys, key, t('game.pad'), 'mm-pad');
      body.append(Kit.main(shop, entry, msg), pad);
      nodes = { items, note, typed: typedOut, msg };
    }

    function clear() {
      clock.stop();
      timers.forEach(clearTimeout); timers.clear();
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    function finish() {
      running = false;
      clear();
      opts.onEnd({ level, ms: clock.ms, wrong });
    }

    return {
      start(lv) {
        this.stop();
        level = lv; n = 0; wrong = 0; running = true;
        build(); ask();
        clock.start();
        keyHandler = onKey; document.addEventListener('keydown', keyHandler);
      },
      stop() { running = false; clear(); body.innerHTML = ''; },
      key,
      get running() { return running; },
      get state() { return q && { level, question: n + 1, change: q.change, typed, wrong, timers: timers.size }; }
    };
  }

  root.MoneyRules = R;
  root.MoneyGame = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
