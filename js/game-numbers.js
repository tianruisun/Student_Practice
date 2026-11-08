/* Mini game (v1.10.0 R4): Use all the numbers. Fifteen kinds of card: the digits 0–9 and + − × ÷ =.
   Round 1 deals the cards of one true equation (e.g. 4 + 5 = 9), shuffled; round 2 the cards of two, and so on.
   The player puts every card into the equation rows (one row per equation). Digits side by side make one number
   (1 then 2 is 12). Every row must be a true equation and no card may be left over. The first failed round ends
   the game; the best is the most rounds passed.

   NumbersRules: the pure rules (no page), also loaded by tests/run.js under Node.
   NumbersGame.create(body, ui, { t, onEnd }): the playable game in the page. */
(function (root) {
  'use strict';

  const MAX_ROUNDS = 10;
  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const OPS = ['+', '-', '×', '÷'];
  const CARDS = DIGITS.concat(OPS, ['=']);   // the 15 kinds of card
  const int = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));

  /* the operations a round may use, and how big its numbers are */
  function stage(round) {
    const ops = round <= 1 ? ['+'] : round === 2 ? ['+', '-'] : round === 3 ? ['+', '-', '×'] : OPS.slice();
    return { ops, max: round <= 3 ? 9 : round <= 6 ? 20 : 30, mul: round <= 5 ? 9 : 12 };
  }

  /* one true equation "a op b = c" with whole numbers from 1 up */
  function equation(round, rand) {
    const S = stage(round), op = S.ops[Math.floor(rand() * S.ops.length)];
    let a, b, c;
    if (op === '+') { a = int(1, S.max, rand); b = int(1, S.max, rand); c = a + b; }
    else if (op === '-') { b = int(1, S.max, rand); c = int(1, S.max, rand); a = b + c; }
    else if (op === '×') { a = int(2, 9, rand); b = int(2, S.mul, rand); c = a * b; }
    else { b = int(2, 9, rand); c = int(2, S.mul, rand); a = b * c; }
    return `${a}${op}${b}=${c}`;
  }

  /* round n: n equations, and their cards shuffled */
  function deal(round, rand) {
    const solution = [];
    for (let k = 0; k < round; k++) solution.push(equation(round, rand));
    const cards = [...solution.join('')];
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return { round, solution, cards };
  }

  /* exact fractions, so 7 ÷ 2 × 2 = 7 is true and nothing is lost to rounding */
  const gcd = (x, y) => { x = Math.abs(x); y = Math.abs(y); while (y) [x, y] = [y, x % y]; return x || 1; };
  const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  function apply(x, op, y) {
    if (op === '+') return frac(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
    if (op === '-') return frac(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
    if (op === '×') return frac(x[0] * y[0], x[1] * y[1]);
    if (y[0] === 0) return null;
    return frac(x[0] * y[1], x[1] * y[0]);
  }

  /* one side, e.g. ['1','2','+','3','×','4']: numbers and operations in turn, × and ÷ before + and − */
  function side(cards) {
    const nums = [], ops = [];
    let cur = '';
    for (const c of cards) {
      if (DIGITS.includes(c)) { cur += c; continue; }
      if (!OPS.includes(c) || !cur) return { error: 'shape' };
      nums.push(cur); ops.push(c); cur = '';
    }
    if (!cur) return { error: 'shape' };
    nums.push(cur);
    if (nums.some(s => s.length > 1 && s[0] === '0')) return { error: 'lead' };
    // × and ÷ first, left to right
    let vals = [frac(+nums[0], 1)], rest = [];
    for (let i = 0; i < ops.length; i++) {
      const y = frac(+nums[i + 1], 1);
      if (ops[i] === '×' || ops[i] === '÷') {
        const v = apply(vals[vals.length - 1], ops[i], y);
        if (!v) return { error: 'zero' };
        vals[vals.length - 1] = v;
      } else { rest.push(ops[i]); vals.push(y); }
    }
    let v = vals[0];
    for (let i = 0; i < rest.length; i++) v = apply(v, rest[i], vals[i + 1]);
    return { value: v };
  }

  /* is one row of cards a true equation? → { ok, reason } with reason one of
     'empty', 'noEquals', 'twoEquals', 'shape' (a sign at an end or two signs together), 'lead' (a number starting with 0),
     'zero' (÷ 0), 'false' (both sides are numbers but not equal) */
  function check(cards) {
    if (!cards.length) return { ok: false, reason: 'empty' };
    const eq = cards.filter(c => c === '=').length;
    if (!eq) return { ok: false, reason: 'noEquals' };
    if (eq > 1) return { ok: false, reason: 'twoEquals' };
    const at = cards.indexOf('='), L = side(cards.slice(0, at)), R = side(cards.slice(at + 1));
    if (L.error || R.error) return { ok: false, reason: L.error || R.error };
    const ok = L.value[0] === R.value[0] && L.value[1] === R.value[1];
    return { ok, reason: ok ? '' : 'false' };
  }

  /* a whole round: every card placed and every row true */
  function checkRound(rows, left) {
    const each = rows.map(check);
    return { ok: !left && each.every(r => r.ok), left, rows: each };
  }

  const R = { MAX_ROUNDS, CARDS, DIGITS, OPS, stage, equation, deal, check, checkRound };

  /* ---------- the game in the page ---------- */
  const SHOW = { '-': '−' };   // a real minus sign on the cards
  function create(body, ui, opts) {
    const t = opts.t, rand = opts.rand || Math.random, Kit = root.GameKit;
    let round = 1, passed = 0, deal_ = null, rows = [], tray = [], sel = 0, running = false, waiting = false, keyHandler = null, nodes = {};
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
    const clock = Kit.clock(ms => { ui.clock.textContent = Kit.fmt(ms); });
    const say = s => { ui.status.textContent = s; };
    const cardName = c => t('numbers.card.' + ({ '+': 'plus', '-': 'minus', '×': 'times', '÷': 'divide', '=': 'equals' }[c] || 'digit'), { d: c });
    const rowText = cards => cards.map(c => SHOW[c] || c).join(' ');
    /* an equation as people write it: 12 × 3 = 36 (spaces round the signs only) */
    const eqText = s => s.replace(/[+×÷=-]/g, c => ' ' + (SHOW[c] || c) + ' ');

    /* tray: { id, c } so two cards with the same face stay two cards */
    function newRound() {
      deal_ = R.deal(round, rand);
      tray = deal_.cards.map((c, id) => ({ id, c }));
      rows = deal_.solution.map(() => []);
      sel = 0; waiting = false;
      nodes.rows.scrollTop = 0;
      ui.score.textContent = String(round);
      nodes.msg.className = 'un-msg';
      nodes.msg.textContent = t('numbers.find', { n: round, cards: tray.length });
      paint();
    }

    function cardBtn(card, where) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'un-card' + (OPS.includes(card.c) || card.c === '=' ? ' op' : '');
      b.textContent = SHOW[card.c] || card.c; b.dataset.c = card.c; b.dataset.id = card.id;
      b.setAttribute('aria-label', cardName(card.c) + ' – ' + t(where === 'tray' ? 'numbers.toRow' : 'numbers.toTray'));
      b.disabled = !running || waiting;
      return b;
    }

    function paint(marks) {
      const box = nodes.rows, keep = box.scrollTop; box.innerHTML = '';
      rows.forEach((cards, r) => {
        const row = document.createElement('div');
        row.className = 'un-row' + (r === sel ? ' sel' : '') + (marks ? (marks[r].ok ? ' ok' : ' no') : '');
        row.dataset.row = r;
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', t('numbers.row', { n: r + 1, text: cards.length ? rowText(cards) : t('numbers.rowEmpty') }));
        const pick = document.createElement('button');
        pick.type = 'button'; pick.className = 'un-pick'; pick.textContent = String(r + 1);
        pick.setAttribute('aria-pressed', String(r === sel));
        pick.setAttribute('aria-label', t('numbers.pickRow', { n: r + 1 }));
        pick.disabled = !running || waiting;
        pick.addEventListener('click', () => select(r));
        row.append(pick);
        const slot = document.createElement('div'); slot.className = 'un-slot';
        if (!cards.length) { const h = document.createElement('span'); h.className = 'un-hint'; h.textContent = t(r === sel ? 'numbers.hintSel' : 'numbers.hint'); slot.append(h); }
        cards.forEach((card, k) => { const b = cardBtn(card, 'row'); b.addEventListener('click', () => back(r, k)); slot.append(b); });
        row.append(slot);
        row.addEventListener('click', e => { if (e.target === row || e.target === slot || e.target.classList.contains('un-hint')) select(r); });
        box.append(row);
      });
      // R4.2: the rows box scrolls on its own; keep its place and bring the chosen row into view
      box.scrollTop = keep;
      const cur = box.children[sel];
      if (cur && box.scrollHeight > box.clientHeight) {
        if (cur.offsetTop < box.scrollTop) box.scrollTop = cur.offsetTop;
        else if (cur.offsetTop + cur.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = cur.offsetTop + cur.offsetHeight - box.clientHeight;
      }
      const tr = nodes.tray; tr.innerHTML = '';
      tray.forEach((card, k) => { const b = cardBtn(card, 'tray'); b.addEventListener('click', () => place(k)); tr.append(b); });
      if (!tray.length) { const e = document.createElement('span'); e.className = 'un-hint'; e.textContent = t('numbers.trayEmpty'); tr.append(e); }
      nodes.left.textContent = t('numbers.left', { n: tray.length });
      nodes.back.disabled = nodes.check.disabled = !running || waiting;
    }

    function select(r) { if (!running || waiting) return; sel = r; paint(); }
    /* a card from the tray goes to the end of the chosen row */
    function place(k) {
      if (!running || waiting || !tray[k]) return;
      rows[sel].push(tray.splice(k, 1)[0]);
      paint();
      const next = nodes.tray.querySelectorAll('.un-card')[Math.min(k, tray.length - 1)];
      if (next) next.focus({ preventScroll: true });
    }
    /* a card in a row goes back to the tray */
    function back(r, k) {
      if (!running || waiting || !rows[r][k]) return;
      tray.push(rows[r].splice(k, 1)[0]);
      sel = r; paint();
    }

    function submit() {
      if (!running || waiting) return;
      const res = R.checkRound(rows.map(cs => cs.map(x => x.c)), tray.length);
      waiting = true;
      if (res.ok) {
        passed = round;
        paint(res.rows);
        nodes.msg.className = 'un-msg ok';
        nodes.msg.textContent = round >= MAX_ROUNDS ? t('numbers.allDone', { n: MAX_ROUNDS }) : t('numbers.pass', { n: round });
        say(nodes.msg.textContent);
        later(() => { if (round >= MAX_ROUNDS) finish(); else { round++; newRound(); } }, 1200);
      } else {
        paint(tray.length ? null : res.rows);
        nodes.msg.className = 'un-msg no';
        const why = tray.length ? t('numbers.cardsLeft', { n: tray.length }) : t('numbers.wrongRows', { n: res.rows.filter(r => !r.ok).length });
        nodes.msg.textContent = why + ' ' + t('numbers.oneWay', { list: deal_.solution.map(eqText).join(' · ') });
        say(nodes.msg.textContent);
        finish();
      }
    }

    function key(k) {
      if (!running || waiting) return;
      if (k === 'back') { const r = rows[sel]; if (r.length) back(sel, r.length - 1); return; }
      if (k === 'ok') return submit();
      if (k === 'up' || k === 'down') { sel = (sel + (k === 'up' ? -1 : 1) + rows.length) % rows.length; paint(); return; }
      const i = tray.findIndex(x => x.c === k);
      if (i >= 0) place(i);
    }

    function onKey(e) {
      if (!running || e.ctrlKey || e.metaKey || e.altKey) return;
      const map = { '*': '×', x: '×', X: '×', '/': '÷', '+': '+', '-': '-', '=': '=' };
      if (/^\d$/.test(e.key) || map[e.key]) { e.preventDefault(); key(/^\d$/.test(e.key) ? e.key : map[e.key]); }
      else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); key(e.key === 'ArrowUp' ? 'up' : 'down'); }
      else if (e.key === 'Enter') { if (Kit.onButton(e)) return; e.preventDefault(); key('ok'); }
    }

    function build() {
      body.innerHTML = '';
      const rowsBox = document.createElement('div'); rowsBox.className = 'un-rows';
      const msg = document.createElement('p'); msg.className = 'un-msg'; msg.setAttribute('aria-hidden', 'true');
      const pad = document.createElement('div'); pad.className = 'pz-pad un-pad';
      pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', t('numbers.tray'));
      const trayBox = document.createElement('div'); trayBox.className = 'un-tray';
      const left = document.createElement('p'); left.className = 'un-left';
      const acts = document.createElement('div'); acts.className = 'un-acts';
      const bk = document.createElement('button'); bk.type = 'button'; bk.dataset.k = 'back'; bk.textContent = '⌫'; bk.setAttribute('aria-label', t('numbers.backLast'));
      bk.addEventListener('click', () => key('back'));
      const ck = document.createElement('button'); ck.type = 'button'; ck.dataset.k = 'ok'; ck.className = 'bl-fire'; ck.textContent = t('numbers.check');
      ck.addEventListener('click', () => key('ok'));
      acts.append(bk, ck);
      pad.append(trayBox, left, acts);
      body.append(Kit.main(rowsBox, msg), pad);
      nodes = { rows: rowsBox, msg, tray: trayBox, left, back: bk, check: ck };
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
      body.querySelectorAll('button').forEach(b => { b.disabled = true; });
      opts.onEnd({ score: passed, ms: clock.ms, all: passed >= MAX_ROUNDS });
    }

    return {
      start() {
        this.stop();
        round = 1; passed = 0; running = true;
        build(); newRound();
        clock.start();
        keyHandler = onKey; document.addEventListener('keydown', keyHandler);
      },
      stop() { running = false; clear(); body.innerHTML = ''; },
      key,
      get running() { return running; },
      get state() {
        return deal_ && { round, passed, solution: deal_.solution.slice(), tray: tray.map(x => x.c), rows: rows.map(cs => cs.map(x => x.c)), sel, timers: timers.size };
      }
    };
  }

  root.NumbersRules = R;
  root.NumbersGame = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
