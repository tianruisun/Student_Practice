/* Mini game (v1.9.0): times-table balloons, 1×1 to 9×9.
   Balloons with a gift hanging below rise from the bottom of the field and fly away off the top. Each carries a question;
   typing its answer and firing shoots an arrow that pops it for one point. A wrong answer locks the bow for a moment.
   One minute; balloons start slow and few, and get faster and more numerous.

   BalloonRules: the pure rules (no DOM), also loaded by tests/run.js under Node.
   BalloonGame.create(field, ui, { t, onEnd }): the playable game in the page. */
(function (root) {
  'use strict';

  const R = {
    SECONDS: 60,            // one round
    LOCK_MS: 1500,          // a wrong answer: the bow cannot fire for this long
    LANES: 4,
    /* difficulty at `sec` seconds into the round: how long a balloon takes to cross the field, how often a new one
       comes, and how many may be in the air at once */
    level(sec) {
      const k = Math.max(0, Math.min(1, sec / R.SECONDS));
      return { rise: 9 - 5 * k, every: 2.4 - 1.5 * k, max: Math.min(5, 1 + Math.floor(sec / 12)) };
    },
    /* a question a×b (1–9 each) whose answer is not already on screen, so one typed answer means one balloon */
    question(rand, busy) {
      let a, b;
      for (let i = 0; i < 60; i++) {
        a = 1 + Math.floor(rand() * 9); b = 1 + Math.floor(rand() * 9);
        if (!busy.has(a * b)) return { a, b, answer: a * b };
      }
      // 60 unlucky draws: pick from the pairs whose answer is free, so the rule holds for certain, not just almost always
      const free = [];
      for (let x = 1; x <= 9; x++) for (let y = 1; y <= 9; y++) if (!busy.has(x * y)) free.push([x, y]);
      if (free.length) [a, b] = free[Math.floor(rand() * free.length)];
      return { a, b, answer: a * b };
    },
    COLORS: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'],   // balloon fills (tests check the question text on them)
    /* the balloon a typed answer hits: the one with that answer that is highest (closest to flying away), or null */
    target(balloons, typed) {
      const n = Number(typed);
      if (!/^\d{1,2}$/.test(String(typed))) return null;
      return balloons.filter(b => !b.hit && b.answer === n).sort((x, y) => x.y - y.y)[0] || null;
    },
    /* a free lane, preferring ones with no balloon still low in the field */
    lane(rand, balloons, fieldH) {
      const low = new Set(balloons.filter(b => b.y > fieldH * 0.45).map(b => b.lane));
      const free = [...Array(R.LANES).keys()].filter(l => !low.has(l));
      const from = free.length ? free : [...Array(R.LANES).keys()];
      return from[Math.floor(rand() * from.length)];
    }
  };

  const COLORS = R.COLORS;
  const NS = 'http://www.w3.org/2000/svg';

  function balloonSVG(color) {
    // balloon, knot, string, gift box with ribbon
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 80 130'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('bl-svg');
    svg.innerHTML =
      `<ellipse cx="40" cy="34" rx="31" ry="34" fill="${color}"/>` +
      '<ellipse cx="29" cy="22" rx="7" ry="11" fill="#fff" opacity=".35"/>' +
      `<path d="M36 67 L44 67 L40 73 Z" fill="${color}"/>` +
      '<path d="M40 73 C35 82 45 88 40 97" stroke="#7c6f9b" stroke-width="1.6" fill="none"/>' +
      '<rect x="27" y="97" width="26" height="22" rx="3" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>' +
      '<rect x="37" y="97" width="6" height="22" fill="#ef4444"/><rect x="27" y="105" width="26" height="5" fill="#ef4444"/>';
    return svg;
  }

  function create(field, ui, opts) {
    const t = opts.t, rand = opts.rand || Math.random;
    let balloons = [], running = false, paused = false, elapsed = 0, last = 0, nextAt = 0, raf = 0;
    let score = 0, missed = 0, wrong = 0, typed = '', lockUntil = 0, seq = 0;
    const timers = new Set();   // an arrow's two timeouts; clear() cancels them, so a stopped round leaves none
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

    const now = () => performance.now();
    const say = text => { ui.status.textContent = text; };
    const showTyped = () => { ui.typed.textContent = typed || ' '; };
    const locked = () => elapsed * 1000 < lockUntil;

    let lockShown = null;
    function showLock() {
      const on = locked();
      if (on === lockShown) return;   // called every frame: touch the page only when it changes
      lockShown = on;
      ui.pad.classList.toggle('locked', on);
      ui.warn.hidden = !on;
      ui.pad.querySelectorAll('button').forEach(b => { b.disabled = on; });
    }

    function spawn() {
      const H = field.clientHeight, W = field.clientWidth;
      const busy = new Set(balloons.filter(b => !b.hit).map(b => b.answer));
      const q = R.question(rand, busy), lane = R.lane(rand, balloons, H);
      const node = document.createElement('div');
      node.className = 'bl';
      node.append(balloonSVG(COLORS[seq % COLORS.length]));
      const label = document.createElement('span'); label.className = 'bl-q'; label.textContent = `${q.a} × ${q.b}`;
      node.append(label);
      field.append(node);
      const w = node.offsetWidth || 80, laneW = W / R.LANES;
      const x = Math.max(0, Math.min(W - w, lane * laneW + (laneW - w) / 2 + (rand() - 0.5) * Math.max(0, laneW - w)));
      const b = { id: ++seq, a: q.a, b: q.b, answer: q.answer, lane, x, y: H, h: node.offsetHeight || 130, rise: R.level(elapsed).rise, node, hit: false };
      node.style.left = x + 'px';
      node.style.transform = `translateY(${b.y}px)`;
      node.dataset.id = b.id;
      balloons.push(b);
    }

    function tick() {
      if (!running) return;
      const n = now(), dt = Math.min(0.1, (n - last) / 1000);   // a long gap (tab in the background) is not a jump
      last = n;
      if (!paused) {
        elapsed += dt;
        const H = field.clientHeight, lv = R.level(elapsed);
        if (elapsed >= nextAt && balloons.filter(b => !b.hit).length < lv.max) { spawn(); nextAt = elapsed + lv.every; }
        for (const b of balloons) {
          if (b.hit) continue;
          b.y -= (H + b.h) / b.rise * dt;
          b.node.style.transform = `translateY(${b.y}px)`;
          if (b.y < -b.h) { b.gone = true; b.node.remove(); missed++; }   // flew away
        }
        balloons = balloons.filter(b => !b.gone);
        ui.time.textContent = Math.max(0, Math.ceil(R.SECONDS - elapsed));
        showLock();
        if (elapsed >= R.SECONDS) return finish();
      }
      raf = requestAnimationFrame(tick);
    }

    function shootAt(b) {
      b.hit = true;
      b.node.classList.add('hit');   // the page shows which balloons are still in play (tests read it on Production too)
      const fr = field.getBoundingClientRect(), br = b.node.getBoundingClientRect();
      const arrow = document.createElement('div');
      arrow.className = 'bl-arrow'; arrow.setAttribute('aria-hidden', 'true');
      const sx = fr.width / 2, sy = fr.height - 10;
      const tx = br.left - fr.left + br.width / 2, ty = br.top - fr.top + br.height * 0.3;
      const ang = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;
      arrow.style.left = sx + 'px'; arrow.style.top = sy + 'px';
      arrow.style.transform = `rotate(${ang}deg)`;
      field.append(arrow);
      requestAnimationFrame(() => {
        arrow.style.transition = 'left .22s linear, top .22s linear';
        arrow.style.left = tx + 'px'; arrow.style.top = ty + 'px';
      });
      later(() => {
        arrow.remove();
        b.node.classList.add('pop');
        const plus = document.createElement('span'); plus.className = 'bl-plus'; plus.textContent = '+1';
        b.node.append(plus);
        later(() => { b.node.remove(); balloons = balloons.filter(x => x !== b); }, 450);
      }, 230);
    }

    function fire() {
      if (!running || paused || locked() || !typed) return;
      const b = R.target(balloons, typed);
      typed = ''; showTyped();
      if (b) {
        score++; ui.score.textContent = score;
        say(t('game.hit', { n: score }));
        shootAt(b);
      } else {
        wrong++;
        lockUntil = elapsed * 1000 + R.LOCK_MS;
        say(t('game.wrong'));
        showLock();
      }
    }

    function key(k) {
      if (!running || paused) return;
      if (/^\d$/.test(k)) { if (!locked() && typed.length < 2) { typed += k; showTyped(); } }
      else if (k === 'back') { typed = typed.slice(0, -1); showTyped(); }
      else if (k === 'fire') fire();
    }

    function onKeydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) { e.preventDefault(); key(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
      else if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest && e.target.closest('.bl-pad button, #gameQuit')) return; e.preventDefault(); key('fire'); }
    }
    function onVisibility() { paused = document.hidden; last = now(); }

    function clear() {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout); timers.clear();
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('visibilitychange', onVisibility);
      field.querySelectorAll('.bl, .bl-arrow').forEach(n => n.remove());
      balloons = [];
    }
    function finish() {
      running = false;
      clear();
      lockUntil = 0; showLock();
      opts.onEnd({ score, missed, wrong });
    }

    return {
      start() {
        clear();
        balloons = []; elapsed = 0; nextAt = 0.4; score = 0; missed = 0; wrong = 0; typed = ''; lockUntil = 0; seq = 0;
        ui.score.textContent = '0'; ui.time.textContent = R.SECONDS; showTyped(); say(''); showLock();
        running = true; paused = document.hidden; last = now();
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('visibilitychange', onVisibility);
        raf = requestAnimationFrame(tick);
      },
      stop() { if (running) { running = false; clear(); } },   // leaving the screen: no score is kept
      key,
      get running() { return running; },
      get state() { return { score, missed, wrong, elapsed, typed, locked: locked(), balloons: balloons.filter(b => !b.hit).length, timers: timers.size }; }
    };
  }

  root.BalloonRules = R;
  root.BalloonGame = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
