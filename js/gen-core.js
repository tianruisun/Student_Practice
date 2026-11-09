/* Shared helpers + topic registry for the built-in question generators.
   Two subjects: 'maths' (typed answers) and 'ga' (General ability, multiple choice).
   Every question carries both languages, so the language toggle never loses it.

   Typed question:  { subject, topic, type:'input', q:{en,zh}, value, answer, unit, tol, sol:{en,zh} }
   Multiple choice: { subject, topic, type:'mc', q:{en,zh}, choices:[{en,zh}], correct, sol:{en,zh} }

   Levels are calibrated so Year N matches what a student in Grade N in China (人教版) or
   Primary/Secondary N in Singapore (MOE) is expected to handle. Difficulty 1–4:
   1 Core 基础 · 2 Standard 提高 · 3 Advanced 拓展 · 4 Challenge 挑战 (competition style). */
(function (root) {
  'use strict';

  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[R(0, a.length - 1)];
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const round = (n, dp = 6) => {
    if (/e/i.test(String(n))) return Number(n.toFixed(Math.min(dp, 20)));   // exponent form, e.g. 1.1e-7
    return Number(Math.round(Number(n + 'e' + dp)) + 'e-' + dp);
  };
  const MINUS = '−';
  const fmt = n => String(round(n, 6));
  const num = n => (n < 0 ? MINUS + fmt(-n) : fmt(n));
  const paren = n => (n < 0 ? '(' + num(n) + ')' : num(n));
  const sg = n => (n < 0 ? ` ${MINUS} ${fmt(-n)}` : ` + ${fmt(n)}`);       // " + 3" / " − 3"
  const coef = (a, v = 'x') => (a === 1 ? v : a === -1 ? MINUS + v : num(a) + v);
  function fracStr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (d === 1) return num(n);
    return (n < 0 ? MINUS : '') + Math.abs(n) + '/' + d;
  }
  function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const both = s => ({ en: String(s), zh: String(s) });

  /* typed-answer question */
  function mk(o) {
    const unitSuffix = o.unit === '°' || o.unit === '%' ? o.unit : o.unit && o.unit !== '$' ? ' ' + o.unit : '';
    return {
      type: 'input', topic: o.topic, q: { en: o.en, zh: o.zh }, value: round(o.value, 9),
      answer: o.answer !== undefined ? o.answer : (o.unit === '$' ? '$' : '') + num(o.value) + unitSuffix,
      unit: o.unit || '', tol: o.tol, sol: { en: o.solEn || '', zh: o.solZh || o.solEn || '' }, source: 'local',
      ...(o.fig ? { fig: o.fig } : {})
    };
  }

  /* multiple-choice question.
     correct: {en,zh} or string; wrong: array of {en,zh} or strings (duplicates/blank removed). 4 options. */
  function mc(o) {
    const norm = c => (typeof c === 'object' ? c : both(c));
    const right = norm(o.correct);
    // options are compared by value, so "2/6" and "1/3" count as the same option
    const valueOf = str => { const f = /^(\d+)\/(\d+)$/.exec(str); if (!f || +f[2] === 0) return str; const g = gcd(+f[1], +f[2]) || 1; return (+f[1] / g) + '/' + (+f[2] / g); };
    const keys = new Set([valueOf(right.en)]);
    const seen = { has: x => keys.has(valueOf(x)), add: x => keys.add(valueOf(x)) };
    const wrong = [];
    for (const w of o.wrong.map(norm)) {
      if (!w.en || seen.has(w.en)) continue;
      seen.add(w.en); wrong.push(w);
      if (wrong.length === (o.options || 4) - 1) break;
    }
    // top up with near values when the answer is a number (optionally with a unit) or a single letter
    const want = (o.options || 4) - 1, m = right.en.match(/^(\u2212?-?\d+(?:\.\d+)?)(\D*)$/);
    // a fraction answer such as "1/3": near fractions with a different value (2/3, 1/4, 1/2 \u2026)
    const f = right.en.match(/^(\d+)\/(\d+)$/);
    if (f) {
      const a = +f[1], b = +f[2];
      for (const [p, q] of [[a + 1, b], [a, b + 1], [a, b - 1], [a - 1, b], [b, a], [a + 2, b], [a, b + 2]]) {
        if (wrong.length >= want) break;
        if (p < 1 || (a < b && p >= q) || p * b === a * q) continue;   // skip zero, improper when the answer is proper, equal values
        const cand = p + '/' + q;
        if (!seen.has(cand)) { seen.add(cand); wrong.push(both(cand)); }
      }
    }
    for (let step = 1; wrong.length < want && step < 40; step++) {
      let cand = null;
      if (m) { const v = Number(m[1].replace('\u2212', '-')) + (step % 2 ? 1 : -1) * Math.ceil(step / 2); cand = num(v) + m[2]; }
      else if (/^[A-Z]$/.test(right.en)) cand = String.fromCharCode(65 + ((right.en.charCodeAt(0) - 65 + (step % 2 ? 1 : -1) * Math.ceil(step / 2)) % 26 + 26) % 26);
      if (cand === null) break;
      if (!seen.has(cand)) { seen.add(cand); wrong.push(both(cand)); }
    }
    // caller retries; a question with only two sensible answers (longer or shorter, am or pm) sets minWrong: 1
    if (wrong.length < (o.minWrong || 2)) return null;
    const choices = shuffle([right, ...wrong]);
    return {
      type: 'mc', topic: o.topic, q: { en: o.en, zh: o.zh }, choices, correct: choices.indexOf(right),
      sol: { en: o.solEn || '', zh: o.solZh || o.solEn || '' }, source: 'local',
      ...(o.fig ? { fig: o.fig } : {})
    };
  }

  /* numeric distractors near the correct value */
  function nearNums(v, spread, extra = []) {
    const out = [...extra];
    for (const d of shuffle([1, -1, 2, -2, spread, -spread, spread + 1, -(spread + 1), 3, -3])) out.push(v + d);
    return out.filter(x => Number.isFinite(x) && x !== v).map(x => num(round(x, 4)));
  }

  /* ---------- registry ----------
     Years: 0 = Kindergarten (v1.10.0), 1–12, plus 13 = Year 12 Extension 1 (3U) and 14 = Year 12 Extension 2 (4U).
     Each topic covers minYear..maxYear. Kindergarten to Year 6 maths practice follows the NSW K–6 topics in
     js/scope-k6.js (generate and generateSet hand those over). */
  const YEARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const PRIMARY = [0, 1, 2, 3, 4, 5, 6], HIGH = [7, 8, 9, 10, 11, 12, 13, 14];
  const SUBJECTS = { maths: {}, ga: {} };   // subject -> topic -> { minYear, maxYear, fn }

  function register(subject, topic, minYear, fn, opts) {
    const o = typeof opts === 'object' && opts ? opts : {};
    SUBJECTS[subject][topic] = { minYear, maxYear: o.maxYear || 14, fn, olympiadOnly: !!o.olympiadOnly };
  }
  function topicsFor(subject, y) {
    const s = SUBJECTS[subject] || {};
    return Object.keys(s).filter(k => s[k].minYear <= y && y <= s[k].maxYear);
  }
  function subjectOf(topic) { return Object.keys(SUBJECTS).find(s => SUBJECTS[s][topic]) || 'maths'; }

  /* Advanced (3) and Challenge (4) draw on the olympiad / tutoring-centre bank (gen-olympiad.js) */
  const OLY_SHARE = { 3: 0.4, 4: 0.75 };
  function olympiad() { return root.Olympiad || null; }

  /* every question remembers where it came from (ref) so the review can make similar ones */
  function finish(q, subject, year, diff, topic) {
    q.topic = q.topic || topic; q.subject = subject; q.year = year; q.diff = diff;
    q.ref = Object.assign({ subject, year, diff }, q.ref, q.ref && q.ref.oly !== undefined ? {} : { gen: topic });
    return q;
  }
  /* one question from exactly this generator (no competition-problem mixing) */
  function generateExact(subject, year, topic, diff) {
    const g = SUBJECTS[subject] && SUBJECTS[subject][topic];
    if (!g) return null;
    for (let i = 0; i < 25; i++) { const q = g.fn(year, diff); if (q) return finish(q, subject, year, diff, topic); }
    return null;
  }

  const k6 = () => root.ScopeK6 || null;
  const isK6 = (subject, year, topic) => subject === 'maths' && year <= 6 && !!k6() && (topic === 'mixed' || k6().has(topic));
  function generate(subject, year, topic, diff) {
    if (subject === 'maths' && k6() && k6().has(topic)) return k6().generate(year, topic, diff);
    const list = topicsFor(subject, year).filter(k => !SUBJECTS[subject][k].olympiadOnly || topic === k);
    const t = topic !== 'mixed' && topicsFor(subject, year).includes(topic) ? topic : pick(list);
    const O = olympiad();
    // a specific topic at Advanced/Challenge: sometimes use a competition problem on that topic
    if (O && subject === 'maths' && diff >= 3 && t !== 'olymp' && Math.random() < OLY_SHARE[diff] * 0.8) {
      const q = O.generate(year, diff, t);
      if (q) return finish(q, subject, year, diff, t);
    }
    for (let i = 0; i < 25; i++) {
      const q = SUBJECTS[subject][t].fn(year, diff);
      if (q) return finish(q, subject, year, diff, t);
    }
    throw new Error('generator failed for ' + t);
  }

  /* n distinct questions. Mixed: spread topics evenly; in maths about 1 in 3 is a word problem (应用题)
     where word problems exist for the year, and Advanced/Challenge mix in competition problems. */
  function generateSet(subject, year, topic, diff, n) {
    if (isK6(subject, year, topic)) return k6().generateSet(year, topic, diff, n);
    const out = [], seen = new Set();
    const all = topicsFor(subject, year).filter(k => !SUBJECTS[subject][k].olympiadOnly);
    const others = [];
    for (const k of all.filter(k => k !== 'word')) {
      const age = year - SUBJECTS[subject][k].minYear, w = subject === 'ga' ? 1 : age <= 2 ? 3 : age <= 4 ? 2 : 1;
      for (let i = 0; i < w; i++) others.push(k);
    }
    let order = shuffle(others), oi = 0;
    const canOly = subject === 'maths' && diff >= 3 && topicsFor('maths', year).includes('olymp');
    for (let tries = 0; out.length < n && tries < n * 60; tries++) {
      let tp = topic;
      if (topic === 'mixed') {
        if (canOly && Math.random() < OLY_SHARE[diff]) tp = 'olymp';
        else if (subject === 'maths' && all.includes('word') && out.length % 3 === 1) tp = 'word';
        else { tp = order[oi % order.length]; oi++; if (oi % order.length === 0) order = shuffle(order); }
      }
      const q = generate(subject, year, tp, diff);
      // chart questions can share wording, so the picture and options count too
      const key = q.q.en + (q.fig ? JSON.stringify(q.fig) : '') + (q.choices ? q.choices.map(c => c.en).join('|') : '');
      if (seen.has(key)) continue;
      seen.add(key); out.push(q);
    }
    // Some early-years topics have fewer distinct questions than asked for (e.g. Year 1 fractions: 10).
    // Fill the count from the year's other topics instead of quietly returning a short set; the caller can tell
    // by the topic of each question.
    const pool = topic === 'mixed' ? [] : shuffle(all.filter(k => k !== topic));
    for (let tries = 0; out.length < n && pool.length && tries < n * 60; tries++) {
      const q = generate(subject, year, pool[tries % pool.length], diff);
      const key = q.q.en + (q.fig ? JSON.stringify(q.fig) : '') + (q.choices ? q.choices.map(c => c.en).join('|') : '');
      if (seen.has(key)) continue;
      seen.add(key); out.push(q);
    }
    return out;
  }

  const api = {
    R, pick, gcd, lcm, round, MINUS, fmt, num, paren, sg, coef, fracStr, shuffle, both,
    mk, mc, nearNums, register, topicsFor, subjectOf, generate, generateExact, generateSet, SUBJECTS, YEARS, PRIMARY, HIGH
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Gen = api;
})(typeof window !== 'undefined' ? window : globalThis);
