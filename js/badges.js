/* Badges (v2.3.0, W13): each badge is earned once per student, by one event or by a total that is passed.
   Pure code, no screen: the page and the Node tests both load this file. The record of a student is
   { e: { badgeId: timeEarned }, s: { counters } } and is kept in the account's records, so it follows the student
   to another device and a cleared browser cannot earn a badge twice (Records.mergeAchv joins two copies). */
(function (root) {
  'use strict';

  const MIN_QUESTIONS = 5;                                  // a perfect, first-try or speed set needs a real set
  const SPEED_SECONDS = { 1: 20, 2: 30, 3: 60, 4: 90 };     // per question, by difficulty (Core ... Competitive)
  const DAY = 86400000, HOUR = 3600;

  /* group order is the order on the profile. `goal` + `stat` make a badge with a progress bar. */
  const GROUPS = ['start', 'social', 'totals', 'streak', 'breadth'];
  const DEFS = [
    { id: 'firstSet', group: 'start', icon: '🚩' },
    { id: 'firstPlan', group: 'start', icon: '📅' },
    { id: 'firstLesson', group: 'start', icon: '📖' },
    { id: 'lessonPractise', group: 'start', icon: '🎓' },
    { id: 'bilingual', group: 'start', icon: '🌏' },
    { id: 'perfectSet', group: 'start', icon: '✅' },

    { id: 'firstFriend', group: 'social', icon: '👥' },
    { id: 'firstChallenge', group: 'social', icon: '⚔️' },
    { id: 'firstWin', group: 'social', icon: '🏆' },
    { id: 'challenges10', group: 'social', icon: '🎖️', stat: 'ch', goal: 10 },
    { id: 'rematch', group: 'social', icon: '🔁' },

    { id: 'correct100', group: 'totals', icon: '🌱', stat: 'c', goal: 100 },
    { id: 'correct500', group: 'totals', icon: '🌿', stat: 'c', goal: 500 },
    { id: 'correct1000', group: 'totals', icon: '🌳', stat: 'c', goal: 1000 },
    { id: 'correct5000', group: 'totals', icon: '🏔️', stat: 'c', goal: 5000 },
    { id: 'hours10', group: 'totals', icon: '⏳', stat: 'h', goal: 10 },
    { id: 'hours50', group: 'totals', icon: '⌛', stat: 'h', goal: 50 },
    { id: 'hours100', group: 'totals', icon: '🕰️', stat: 'h', goal: 100 },
    { id: 'sets10', group: 'totals', icon: '📘', stat: 'n', goal: 10 },
    { id: 'sets50', group: 'totals', icon: '📗', stat: 'n', goal: 50 },
    { id: 'sets200', group: 'totals', icon: '📕', stat: 'n', goal: 200 },

    { id: 'streak3', group: 'streak', icon: '🔥', stat: 'run', goal: 3 },
    { id: 'streak7', group: 'streak', icon: '⚡', stat: 'run', goal: 7 },
    { id: 'streak30', group: 'streak', icon: '🌟', stat: 'run', goal: 30 },
    { id: 'planDay', group: 'streak', icon: '🗓️' },
    { id: 'comeback', group: 'streak', icon: '🦋' },

    { id: 'topics10', group: 'breadth', icon: '🧩', stat: 'top', goal: 10 },
    { id: 'higherYear', group: 'breadth', icon: '🚀' },
    { id: 'challenging', group: 'breadth', icon: '🧗' },
    { id: 'competitive', group: 'breadth', icon: '🏅' },
    { id: 'speed', group: 'breadth', icon: '💨' },
    { id: 'firstTryAll', group: 'breadth', icon: '🎯' }
  ];
  const IDS = DEFS.map(d => d.id);
  const BY_ID = {}; DEFS.forEach(d => { BY_ID[d.id] = d; });

  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const num = v => (Number.isFinite(v) ? v : 0);
  const dayOf = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayNum = iso => { const p = iso.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / DAY); };

  /* a clean record from whatever is stored (an old list of badges from before v2.3.0 is not a record: it gives an empty one) */
  function clean(v) {
    const out = { e: {}, s: { c: 0, t: 0, n: 0, top: [], d: [], l: [], ch: 0, w: 0, lo: 0, ids: [] } };
    if (!isObj(v)) return out;
    if (isObj(v.e)) for (const id of IDS) if (Number.isFinite(v.e[id]) && v.e[id] > 0) out.e[id] = v.e[id];
    const s = isObj(v.s) ? v.s : {};
    out.s.c = Math.max(0, Math.floor(num(s.c))); out.s.t = Math.max(0, num(s.t)); out.s.n = Math.max(0, Math.floor(num(s.n)));
    out.s.ch = Math.max(0, Math.floor(num(s.ch))); out.s.w = Math.max(0, Math.floor(num(s.w))); out.s.lo = Math.max(0, num(s.lo));
    const list = (a, ok, cap) => (Array.isArray(a) ? [...new Set(a.filter(ok))].slice(-cap) : []);
    out.s.top = list(s.top, x => typeof x === 'string' && /^[a-z][a-z0-9_]{0,39}$/i.test(x), 100);
    out.s.d = list(s.d, x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x), 400).sort();
    out.s.l = list(s.l, x => x === 'en' || x === 'zh', 2);
    out.s.ids = list(s.ids, x => typeof x === 'string' || Number.isFinite(x), 300).map(String);
    return out;
  }

  /* the longest run of days in a row */
  function longestRun(days) {
    let best = 0, run = 0, prev = null;
    for (const d of days) { const n = dayNum(d); run = prev !== null && n === prev + 1 ? run + 1 : 1; prev = n; if (run > best) best = run; }
    return best;
  }
  /* what the progress bars count, from a record */
  function stats(rec) {
    const s = rec.s;
    return { c: s.c, h: s.t / HOUR, n: s.n, run: longestRun(s.d), top: s.top.length, ch: s.ch };
  }

  function award(rec, id, now, out) { if (!rec.e[id]) { rec.e[id] = now; out.push(id); } }
  /* every badge that has a total behind it */
  function totals(rec, now, out) {
    const st = stats(rec);
    for (const d of DEFS) if (d.stat && st[d.stat] >= d.goal) award(rec, d.id, now, out);
  }

  /* One finished set. f: { date, correct, n, firstTry, seconds, diff, year, topic, paper, lang, schoolYear, fromLesson }.
     Returns { rec, newly } (rec is a new object; the old one is untouched). */
  function onSet(old, f, now) {
    const rec = clean(JSON.parse(JSON.stringify(old || null))), s = rec.s, out = [];
    now = now || f.date || Date.now();
    const date = f.date || now, day = dayOf(date);
    const last = s.d.length ? s.d[s.d.length - 1] : null;
    if (last && day > last && dayNum(day) - dayNum(last) >= 7) award(rec, 'comeback', now, out);
    s.c += Math.max(0, f.correct | 0); s.t += Math.max(0, num(f.seconds)); s.n += 1;
    if (f.topic && f.topic !== 'mixed' && !f.paper && !s.top.includes(f.topic)) s.top = s.top.concat(f.topic).slice(-100);
    if (!s.d.includes(day)) s.d = s.d.concat(day).sort().slice(-400);
    if (f.lang && !s.l.includes(f.lang)) s.l = s.l.concat(f.lang).slice(-2);
    award(rec, 'firstSet', now, out);
    const n = f.n | 0, real = n >= MIN_QUESTIONS && !f.paper;
    if (n >= MIN_QUESTIONS && f.correct === n) award(rec, 'perfectSet', now, out);
    if (real && f.firstTry === n && f.correct === n) award(rec, 'firstTryAll', now, out);
    if (real && f.correct === n && f.seconds > 0 && f.seconds / n <= (SPEED_SECONDS[f.diff] || 30)) award(rec, 'speed', now, out);
    if (real && f.correct / n > 0.5) {
      if (f.diff === 3) award(rec, 'challenging', now, out);
      if (f.diff === 4) award(rec, 'competitive', now, out);
    }
    if (real && Number.isFinite(f.schoolYear) && Number.isFinite(f.year) && f.year > f.schoolYear && f.correct / n > 0.5) award(rec, 'higherYear', now, out);
    if (s.l.length >= 2) award(rec, 'bilingual', now, out);
    if (f.fromLesson) award(rec, 'lessonPractise', now, out);
    totals(rec, now, out);
    return { rec, newly: out };
  }

  /* a single event: 'plan' (a plan item made), 'planDay' (every task of a planned day done), 'lesson' (a lesson read),
     'friend' (data: the number of friends) */
  function onEvent(old, name, data, now) {
    const rec = clean(JSON.parse(JSON.stringify(old || null))), out = [];
    now = now || Date.now();
    if (name === 'plan') award(rec, 'firstPlan', now, out);
    else if (name === 'planDay') award(rec, 'planDay', now, out);
    else if (name === 'lesson') award(rec, 'firstLesson', now, out);
    else if (name === 'friend' && data > 0) award(rec, 'firstFriend', now, out);
    return { rec, newly: out };
  }

  /* the challenges the server lists: each finished one counts once (by id). c: { id, over, winner: 'me'|'them'|'draw'|'none'|null, date } */
  function onChallenges(old, list, now) {
    const rec = clean(JSON.parse(JSON.stringify(old || null))), s = rec.s, out = [];
    now = now || Date.now();
    const fresh = (list || []).filter(c => c && c.over && ['me', 'them', 'draw'].includes(c.winner) && !s.ids.includes(String(c.id)))
      .sort((a, b) => (a.date || 0) - (b.date || 0));
    for (const c of fresh) {
      s.ids = s.ids.concat(String(c.id)).slice(-300); s.ch += 1;
      const at = c.date || now;
      award(rec, 'firstChallenge', now, out);
      if (c.winner === 'me') {
        s.w += 1; award(rec, 'firstWin', now, out);
        if (s.lo && at - s.lo <= DAY && at >= s.lo) award(rec, 'rematch', now, out);
      } else if (c.winner === 'them') s.lo = Math.max(s.lo, at);
    }
    totals(rec, now, out);
    return { rec, newly: out };
  }

  /* two copies of one student's record: a badge stays earned (the earlier time), counters keep the larger value,
     lists are joined. Used when a device and the account's server copy meet. */
  function merge(a, b) {
    const x = clean(a), y = clean(b), out = clean(null);
    for (const id of IDS) { const t = [x.e[id], y.e[id]].filter(Boolean); if (t.length) out.e[id] = Math.min(...t); }
    for (const k of ['c', 't', 'n', 'ch', 'w', 'lo']) out.s[k] = Math.max(x.s[k], y.s[k]);
    out.s.top = [...new Set([...x.s.top, ...y.s.top])].slice(-100);
    out.s.d = [...new Set([...x.s.d, ...y.s.d])].sort().slice(-400);
    out.s.l = [...new Set([...x.s.l, ...y.s.l])].slice(0, 2);
    out.s.ids = [...new Set([...x.s.ids, ...y.s.ids])].slice(-300);
    return out;
  }

  /* what the profile shows: the groups, each with its badges (earned time or null, and a progress {now, goal} when it counts something) */
  function view(rec) {
    const r = clean(rec), st = stats(r);
    const groups = GROUPS.map(g => {
      const items = DEFS.filter(d => d.group === g).map(d => ({
        id: d.id, icon: d.icon, earned: r.e[d.id] || null,
        progress: d.stat ? { now: Math.min(d.goal, Math.floor(st[d.stat] * 10) / 10), goal: d.goal } : null
      }));
      return { id: g, items, earned: items.filter(i => i.earned).length, total: items.length };
    });
    return { groups, earned: groups.reduce((n, g) => n + g.earned, 0), total: DEFS.length };
  }
  const count = rec => Object.keys(clean(rec).e).length;

  const api = { DEFS, IDS, GROUPS, MIN_QUESTIONS, SPEED_SECONDS, clean, onSet, onEvent, onChallenges, merge, view, count, stats, longestRun, dayOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Badges = api;
})(typeof window !== 'undefined' ? window : globalThis);
