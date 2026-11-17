/* Student records without the screen: the year to suggest for a student, and the progress file (CSV) used to export and
   import a student's progress. Badges are in js/badges.js (v2.3.0). Loaded by the page and by the Node tests. */
(function (root) {
  'use strict';

  /* ---------- suggested year ----------
     School year entered by the parent moves up by itself each new calendar year (NSW school years follow the calendar).
     Otherwise from the birth month: NSW children start Kindergarten in the year they turn 5 if born January–July,
     else the year after. Year 1 follows Kindergarten. Result 0 (Kindergarten, also for a child not at school yet) to 12,
     or null when nothing is known. */
  function suggestYear(profile, now) {
    const year = now.getFullYear();
    let y = null;
    if (profile && profile.schoolYear != null) y = profile.schoolYear + (year - (profile.schoolYearSet || year));
    else if (profile) y = yearByAge(profile.dob, now);
    if (y === null || !Number.isFinite(y)) return null;
    return Math.max(0, Math.min(12, y));
  }
  /* The school year a birth month gives this calendar year, NOT clamped: 0 is Kindergarten, below that not at school
     yet, above 12 left school. null without a valid birth month. */
  function yearByAge(dob, now) {
    if (!/^\d{4}-\d{2}$/.test(dob || '')) return null;
    const [by, bm] = dob.split('-').map(Number);
    return now.getFullYear() - by - (bm <= 7 ? 5 : 6);
  }

  /* ---------- progress file (CSV) ----------
     One row per record. "student" holds the details, "session" a finished set. (A "badge" row from before v2.3.0 is read and ignored.)
     The readable columns are for a spreadsheet; the last column, data, is the whole record as JSON so an import
     restores it exactly (including the questions to review). */
  const COLUMNS = ['record', 'date', 'name', 'school_year', 'birth_month', 'subject', 'year', 'topic', 'difficulty',
    'questions', 'correct', 'stars', 'seconds', 'badge', 'data'];
  const MAX_FILE = 2 * 1024 * 1024;

  const cell = v => {
    const s = v === undefined || v === null ? '' : String(v);
    // quote when needed; a leading = + - @ is prefixed so a spreadsheet does not run it as a formula
    const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
    return /[",\r\n]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe;
  };
  const iso = ms => new Date(ms).toISOString();

  function toCSV(student, history, achv) {
    const rows = [COLUMNS];
    rows.push(['student', '', student.name || '', student.schoolYear != null ? student.schoolYear : '', student.dob || '', '', '', '', '', '', '', '', '', '',
      JSON.stringify({ name: student.name || '', schoolYear: student.schoolYear != null ? student.schoolYear : null, schoolYearSet: student.schoolYearSet || null, dob: student.dob || '' })]);
    for (const h of history || []) {
      rows.push(['session', iso(h.date), '', '', '', h.subject || '', h.year != null ? h.year : '', h.topic || '', h.diff || '', h.n, h.correct,
        h.stars !== undefined ? h.stars : '', h.time ? Math.round(h.time / 1000) : '', '', JSON.stringify(h)]);
    }
    // v2.3.0 R2.3: the badges, one row, so a student with no account can back them up (the data column is the record)
    if (achv && badges() && badges().count(achv) > 0) rows.push(['achv', '', '', '', '', '', '', '', '', '', '', '', '', '', JSON.stringify(badges().clean(achv))]);
    // the byte-order mark lets Excel open Chinese names correctly
    return '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
  }

  /* RFC 4180 parser: quoted fields, doubled quotes, commas and line breaks inside quotes. */
  function parseCSV(text) {
    const rows = []; let row = [], f = '', q = false;
    const s = String(text).replace(/^﻿/, '');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(r => r.length > 1 || r[0] !== '');
  }

  // an empty cell is missing, not 0 (Number('') is 0) (R2.2, v1.7.0)
  const num = (v, lo, hi) => { if (v === null || v === undefined || typeof v === 'boolean' || String(v).trim() === '') return null; const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const json = v => { try { const o = JSON.parse(v); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch (e) { return null; } };

  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const int = (v, lo, hi) => { const n = num(v, lo, hi); return n !== null && Number.isInteger(n) ? n : null; };
  /* Text in both languages, as the screens read it: { en, zh? }, en required. */
  const text2 = (v, max) => (isObj(v) && typeof v.en === 'string'
    ? Object.assign({ en: v.en.slice(0, max) }, typeof v.zh === 'string' ? { zh: v.zh.slice(0, max) } : {}) : null);

  /* What the app knows, given by the page to fromCSV: key(k) says whether a text key exists, fig(f) whether a figure
     draws. A name the app does not know would show as a raw key (R2.3, v1.7.0). Without it (Node tests of the file
     format alone) only the shapes are checked. Set for the length of one fromCSV call. */
  let known = null;
  const knows = k => !known || typeof known.key !== 'function' || known.key(k) === true;
  const topicOk = k => k === 'mixed' || (WORD.test(k) && knows('topic.' + k));
  const topicOf = v => { const k = str(v, 40); return topicOk(k) ? k : 'mixed'; };
  const figOk = f => !known || typeof known.fig !== 'function' || known.fig(f) === true;
  const TIMED = ['sel', 'comp'];
  /* A timed paper's name as the progress file writes it: sel:<length> or comp:<paper>:<length>. */
  function paperOk(p) {
    const x = String(p).split(':');
    if (x[0] === 'sel') return x.length === 2 && WORD.test(x[1]) && knows('sel.len.' + x[1]);
    if (x[0] === 'comp') return x.length === 3 && topicOk(x[1]) && x[1] !== 'mixed' && WORD.test(x[2]) && knows('comp.len.' + x[2]);
    return false;
  }

  /* A question to review, from a file: only the fields the review screens read, each of the shape they expect.
     Returns null when the question could not be shown. */
  function cleanWrong(w) {
    if (!isObj(w)) return null;
    const q = text2(w.q, 2000);
    if (!q) return null;
    const out = { q, topic: topicOf(w.topic), type: w.type === 'mc' ? 'mc' : str(w.type, 20) || 'num' };
    if (out.type === 'mc') {
      const choices = Array.isArray(w.choices) ? w.choices.slice(0, 5).map(c => text2(c, 500)) : [];
      const correct = int(w.correct, 0, choices.length - 1);
      if (choices.length < 2 || choices.includes(null) || correct === null) return null;
      out.choices = choices; out.correct = correct;
      out.given = (Array.isArray(w.given) ? w.given : []).map(i => int(i, 0, choices.length - 1)).filter(i => i !== null).slice(0, 5);
    } else {
      if (typeof w.answer !== 'string' && typeof w.answer !== 'number') return null;
      out.answer = String(w.answer).slice(0, 200);
      out.given = (Array.isArray(w.given) ? w.given : []).filter(g => typeof g === 'string' || typeof g === 'number').map(g => String(g).slice(0, 200)).slice(0, 5);
    }
    const sol = text2(w.sol, 4000); if (sol) out.sol = sol;
    if (isObj(w.fig) && WORD.test(w.fig.type || '') && figOk(w.fig)) out.fig = w.fig;
    const ref = cleanRef(w.ref); if (ref) out.ref = ref;
    if (w.reviewed === true) out.reviewed = true;   // R4 (v1.10.0): removed from the review list
    if (QUESTION_SUBJECTS.includes(w.subject)) out.subject = w.subject;
    const year = int(w.year, 0, 14), diff = int(w.diff, 1, 4);
    if (year !== null) out.year = year;
    if (diff !== null) out.diff = diff;
    return out;
  }
  const WORD = /^[a-z][a-z0-9_]{0,39}$/i;
  const QUESTION_SUBJECTS = ['maths', 'ga', 'sel', 'comp'];
  /* Where a question came from, used by "practise similar" to make more like it. */
  function cleanRef(r) {
    if (!isObj(r)) return null;
    const out = {};
    const oly = int(r.oly, 0, 100000); if (oly !== null) out.oly = oly;
    if (Array.isArray(r.sel) && r.sel.length === 2 && int(r.sel[0], 1, 3) !== null && int(r.sel[1], 0, 100000) !== null) out.sel = [r.sel[0], r.sel[1]];
    if (WORD.test(r.gen || '')) out.gen = r.gen;
    if (QUESTION_SUBJECTS.includes(r.subject)) out.subject = r.subject;
    const year = int(r.year, 0, 14), diff = int(r.diff, 1, 4);
    if (year !== null) out.year = year;
    if (diff !== null) out.diff = diff;
    return Object.keys(out).length ? out : null;
  }

  /* A session from a file, checked: numbers in range, a date, and text fields as text. Every field a screen reads is
     checked here, so a file the app accepts cannot break a screen. Returns null if unusable. */
  function cleanSession(o, row) {
    const date = num(o.date, 0, 4102444800000) || Date.parse(row.date);
    const n = int(o.n !== undefined ? o.n : row.questions, 1, 200), correct = int(o.correct !== undefined ? o.correct : row.correct, 0, 200);
    if (!date || n === null || correct === null || correct > n) return null;
    // a subject the app does not have, or a practice set with no year, cannot be shown: skipped and counted (R2.3)
    const subject = str(o.subject || row.subject, 20) || 'maths';
    const year = int(o.year !== undefined ? o.year : row.year, 0, 14);
    if (!QUESTION_SUBJECTS.includes(subject) || (year === null && !TIMED.includes(subject))) return null;
    const s = Object.assign({}, o, {
      date, n, correct, subject, topic: topicOf(o.topic || row.topic),
      year, diff: int(o.diff !== undefined ? o.diff : row.difficulty, 1, 4)
    });
    const stars = int(o.stars !== undefined ? o.stars : row.stars, 0, 3);
    if (stars !== null) s.stars = stars; else delete s.stars;
    // time in ms; a row typed in a spreadsheet gives seconds
    const sec = row.seconds === '' ? null : num(row.seconds, 0, 86400);
    s.time = o.time !== undefined && o.time !== null ? num(o.time, 0, 86400000) : sec !== null ? sec * 1000 : null;
    const marks = num(o.marks, 0, 1000), maxMarks = num(o.maxMarks, 1, 1000);
    if (marks !== null && maxMarks !== null && marks <= maxMarks) { s.marks = marks; s.maxMarks = maxMarks; } else { delete s.marks; delete s.maxMarks; }
    s.wrong = (Array.isArray(o.wrong) ? o.wrong.slice(0, 200) : []).map(cleanWrong).filter(Boolean);
    const by = {};
    if (isObj(o.byTopic)) {
      for (const k of Object.keys(o.byTopic).slice(0, 50)) {
        const v = o.byTopic[k], c = Array.isArray(v) ? int(v[0], 0, 200) : null, t = Array.isArray(v) ? int(v[1], 1, 200) : null;
        if (topicOk(k) && c !== null && t !== null && c <= t) by[k] = [c, t];
      }
    }
    s.byTopic = isObj(o.byTopic) ? by : { [s.topic]: [correct, n] };   // timed papers record none
    return s;
  }
  /* text → { student, history, skipped } or throws Error('format'). app: { key(k), fig(f) }, see `known`. */
  function fromCSV(text, app) {
    known = app || null;
    try { return readCSV(text); } finally { known = null; }
  }
  function readCSV(text) {
    if (String(text).length > MAX_FILE) throw new Error('size');
    const rows = parseCSV(text);
    if (!rows.length || rows[0].join(',') !== COLUMNS.join(',')) throw new Error('format');
    const out = { student: null, history: [], skipped: 0, achv: null };
    for (const r of rows.slice(1)) {
      const row = {}; COLUMNS.forEach((c, i) => { row[c] = (r[i] || '').replace(/^'(?=[=+\-@])/, ''); });
      const o = json(row.data) || {};
      if (row.record === 'student') {
        out.student = { name: str(o.name || row.name, 20), schoolYear: num(o.schoolYear != null ? o.schoolYear : row.school_year, 0, 12),
          schoolYearSet: num(o.schoolYearSet, 2000, 2100), dob: /^\d{4}-\d{2}$/.test(o.dob || row.birth_month) ? (o.dob || row.birth_month) : '' };
      } else if (row.record === 'session') { const s = cleanSession(o, row); s ? out.history.push(s) : out.skipped++; }
      else if (row.record === 'achv') { if (badges() && isObj(o)) out.achv = badges().merge(out.achv, o); else out.skipped++; }
      else if (row.record === 'badge') { /* v2.3.0: badges are not in the progress file any more; an old file's badge rows are ignored */ }
      else out.skipped++;
    }
    return out;
  }

  /* Adds imported records to existing ones without duplicates (same time and same counts = same record), oldest first. */
  function merge(existing, incoming, keyOf, cap) {
    const seen = new Set(existing.map(keyOf)), out = existing.slice();
    let added = 0;
    for (const x of incoming) { const k = keyOf(x); if (!seen.has(k)) { seen.add(k); out.push(x); added++; } }
    out.sort((a, b) => a.date - b.date);
    return { list: cap ? out.slice(-cap) : out, added };
  }
  const sessionKey = h => [h.date, h.subject, h.n, h.correct].join('|');

  /* ---------- an account's records on two devices (v2.0.0 R1.1) ----------
     data: { v, keys: { history, settings, achv, games, plan }, profile } as js/friends.js sends it.
     A three-way merge: `base` lists the record keys both copies last agreed on (baseOf), so a record that is in one copy
     and not in the other was either added there (kept) or removed on the other side (dropped, when base has it).
     Without a base (null) nothing counts as removed: the two copies are simply joined. */
  const LISTS = { history: [sessionKey, 100], plan: [p => String(p && p.id), 300] };
  const arr = v => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : []);
  function baseOf(data) {
    const k = (data && data.keys) || {}, out = {};
    for (const [name, [keyOf]] of Object.entries(LISTS)) out[name] = arr(k[name]).map(keyOf);
    if (isObj(k.achv) && badges()) out.achv = badges().clean(k.achv).s;   // the counters both copies last agreed on (v2.3.0 R2.2)
    return out;
  }
  function join3(local, server, base, keyOf) {
    const was = base ? new Set(base) : new Set(), L = new Map(), S = new Map(), out = [];
    arr(local).forEach(x => L.set(keyOf(x), x));
    arr(server).forEach(x => S.set(keyOf(x), x));
    for (const [k, x] of L) { if (S.has(k)) out.push(both(x, S.get(k))); else if (!was.has(k)) out.push(x); }
    for (const [k, x] of S) if (!L.has(k) && !was.has(k)) out.push(x);
    return out;
  }
  /* the same record on both devices: this device's copy, with what the other device added to it (reviewed questions,
     ticked plan days) */
  function both(a, b) {
    const x = Object.assign({}, a);
    if (Array.isArray(a.wrong) && Array.isArray(b.wrong) && a.wrong.length === b.wrong.length) x.wrong = a.wrong.map((w, i) => (b.wrong[i] && b.wrong[i].reviewed && w && !w.reviewed ? Object.assign({}, w, { reviewed: true }) : w));
    if (Array.isArray(a.done) || Array.isArray(b.done)) x.done = [...new Set([...(a.done || []), ...(b.done || [])])].sort().slice(-60);
    return x;
  }
  /* games: { id: { best, plays, last, date } } or, for the timed puzzles, { id: { level: { best (ms), … } } } */
  function joinGame(a, b, lowerBetter) {
    if (!isObj(a)) return b; if (!isObj(b)) return a;
    const newer = (b.date || 0) > (a.date || 0) ? b : a;
    const bests = [a.best, b.best].filter(v => Number.isFinite(v) && v > 0);
    return Object.assign({}, newer, { best: bests.length ? (lowerBetter ? Math.min(...bests) : Math.max(...bests)) : (newer.best || 0), plays: Math.max(a.plays || 0, b.plays || 0) });
  }
  function joinGames(a, b) {
    if (!isObj(a)) return isObj(b) ? b : undefined; if (!isObj(b)) return a;
    const out = Object.assign({}, b, a);
    for (const id of Object.keys(a)) {
      if (!isObj(b[id])) continue;
      const x = a[id], y = b[id];
      if ('best' in x || 'best' in y) out[id] = joinGame(x, y, false);
      else { out[id] = Object.assign({}, y, x); for (const lv of Object.keys(x)) if (isObj(y[lv])) out[id][lv] = joinGame(x[lv], y[lv], true); }
    }
    return out;
  }
  const badges = () => root.Badges || (typeof require !== 'undefined' ? require('./badges.js') : null);
  function mergeAccount(local, server, base) {
    const lk = (local && local.keys) || {}, sk = (server && server.keys) || {}, keys = {};
    for (const [name, [keyOf, cap]] of Object.entries(LISTS)) {
      if (lk[name] === undefined && sk[name] === undefined) continue;
      let l = join3(lk[name], sk[name], base && base[name], keyOf);
      if (name !== 'plan') l.sort((x, y) => (x.date || 0) - (y.date || 0));
      keys[name] = l.slice(-cap);
    }
    if (lk.achv !== undefined || sk.achv !== undefined) keys.achv = badges() ? badges().merge(lk.achv, sk.achv, base && base.achv) : (lk.achv !== undefined ? lk.achv : sk.achv);   // v2.3.0: a badge stays earned
    const settings = lk.settings !== undefined ? lk.settings : sk.settings;   // the choices made on the device in use
    if (settings !== undefined) keys.settings = settings;
    const games = joinGames(lk.games, sk.games);
    if (games !== undefined) keys.games = games;
    return { v: 1, keys, profile: Object.assign({}, (server && server.profile) || {}, (local && local.profile) || {}) };
  }

  const api = { suggestYear, yearByAge, COLUMNS, toCSV, parseCSV, fromCSV, merge, sessionKey, baseOf, mergeAccount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Records = api;
})(typeof window !== 'undefined' ? window : globalThis);
