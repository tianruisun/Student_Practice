/* Similar questions for reinforcement after a review.
   Each generated question carries a "ref" telling where it came from:
     { oly: index }        – an olympiad / AMO template  → same template, new numbers
     { sel: [tier, index] } – a Selective test template  → same template, new numbers
     { gen: topic, subject, year, diff } – a topic generator → many candidates, keep the most alike
   Older history items (no ref) and AI questions fall back to their topic, year and difficulty. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');

  const words = s => new Set(String(s || '').toLowerCase().replace(/[0-9.,−\-+×÷=/()$%²³]+/g, ' ').split(/[\s，。、：:；;?？!！]+/).filter(w => w.length > 1));
  function likeness(a, b) {
    const A = words(a.q && a.q.en), B = words(b.q && b.q.en);
    let both = 0; A.forEach(w => { if (B.has(w)) both++; });
    let s = both / Math.max(1, A.size + B.size - both);
    if (a.type === b.type) s += 0.2;
    if ((a.fig && a.fig.type) === (b.fig && b.fig.type)) s += 0.2;
    return s;
  }
  // same wording + same picture + same correct answer = the same question (option order does not matter)
  const keyOf = q => q.q.en + (q.fig ? JSON.stringify(q.fig) : '') + '|' + (q.choices ? (q.choices[q.correct] || {}).en : q.answer);

  function fromTemplate(fn, n, orig) {
    const out = [], seen = new Set([keyOf(orig)]);
    // Some templates have only a handful of versions; 8 tries per question often missed one that exists.
    for (let i = 0; i < n * 30 && out.length < n; i++) {
      const q = fn(); if (!q) continue;
      const k = keyOf(q); if (seen.has(k)) continue;
      seen.add(k); out.push(q);
    }
    return out;
  }

  /* n questions like `item` (a question or a saved review item); fb = { subject, year, diff } from its session */
  function make(item, n, fb) {
    fb = fb || {};
    const ref = item.ref || {}, O = root.Olympiad, S = root.Selective;
    const year = [ref.year, item.year, fb.year].find(v => v != null && v !== '') ?? 6, diff = ref.diff || item.diff || fb.diff || 2;
    let out = [];
    // only templates that exist: a ref from an imported file may name anything
    const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
    if (ref.oly !== undefined && O && own(O.T, ref.oly) && typeof O.T[ref.oly].fn === 'function') {
      out = fromTemplate(O.T[ref.oly].fn, n, item).map(q => Object.assign(q, { topic: item.topic || 'olymp', olympiad: true, subject: 'maths', year, diff, ref: Object.assign({}, ref) }));
    } else if (Array.isArray(ref.sel) && S && own(S.T, ref.sel[0]) && own(S.T[ref.sel[0]], ref.sel[1]) && typeof S.T[ref.sel[0]][ref.sel[1]].fn === 'function') {
      out = fromTemplate(S.T[ref.sel[0]][ref.sel[1]].fn, n, item);
    }
    if (out.length < n) {
      // same generator; make plenty of candidates and keep the ones that read most like the original
      let subject = ref.subject || item.subject || fb.subject || 'maths';
      if (!G.SUBJECTS[subject]) subject = G.subjectOf(item.topic);
      let topic = ref.gen || item.topic;
      if (!G.topicsFor(subject, year).includes(topic)) topic = G.topicsFor(subject, year).find(k => k === item.topic) || null;
      const seen = new Set([keyOf(item), ...out.map(keyOf)]), cand = [];
      for (let i = 0; i < Math.max(24, n * 8); i++) {
        const q = topic ? G.generateExact(subject, year, topic, diff) : G.generate(subject, year, 'mixed', diff);
        if (!q) break;
        const k = keyOf(q); if (seen.has(k)) continue;
        seen.add(k); cand.push(q);
      }
      cand.sort((a, b) => likeness(b, item) - likeness(a, item));
      out = out.concat(cand.slice(0, n - out.length));
    }
    // a K–6 topic (v1.10.0) is made by one of several generators: keep the original's topic and year on the new ones
    const k6 = root.ScopeK6 && root.ScopeK6.has(item.topic);
    return out.slice(0, n).map(q => (k6 ? Object.assign(q, { topic: item.topic, year: item.year != null ? item.year : q.year }) : q));
  }

  /* a practice set from several review items, n of each (at most `max` in total) */
  function makeSet(items, n, max) {
    const out = [];
    for (const it of items) out.push(...make(it.q, n, it.fb));
    return out.slice(0, max || 50);
  }

  const api = { make, makeSet, likeness };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Similar = api;
})(typeof window !== 'undefined' ? window : globalThis);
