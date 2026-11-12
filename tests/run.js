/* Run with: node tests/run.js */
const assert = require('assert');
const C = require('../js/checker.js');
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.log('FAIL', name, '-', e.message); } }
const ok = (q, s) => t(`accept ${JSON.stringify(s)} for ${q.value}${q.unit || ''}`, () => assert.ok(C.check(q, s).ok, JSON.stringify(C.check(q, s))));
const no = (q, s) => t(`reject ${JSON.stringify(s)} for ${q.value}${q.unit || ''}`, () => assert.ok(!C.check(q, s).ok));

const threeQ = { value: 0.75 };
['3/4', '6/8', ' 3 / 4 ', '0.75', '.75', '75/100', '３／４', '0.75 ', '4分之3'].forEach(s => ok(threeQ, s));
['4/3', '0.7', '3/5', '', 'abc', '3/0'].forEach(s => no(threeQ, s));
ok({ value: 1.5 }, '1 1/2'); ok({ value: 1.5 }, '3/2'); ok({ value: -1.5 }, '-1 1/2'); ok({ value: -1.5 }, '−3/2');
ok({ value: 2 / 3 }, '0.67'); ok({ value: 2 / 3 }, '0.667'); no({ value: 2 / 3 }, '0.6'); no({ value: 2 / 3 }, '0.7');
ok({ value: 12.35 }, '12.35'); ok({ value: 12.35 }, '12.354'); no({ value: 12.35 }, '12.4');
ok({ value: 1000 }, '1 000'); ok({ value: 1000 }, '1,000'); ok({ value: 12345 }, '12,345'); ok({ value: 3.5 }, '3,5');
ok({ value: 5 }, 'x = 5'); ok({ value: 5 }, 'x=5'); ok({ value: -4 }, '-4'); ok({ value: -4 }, '－４'); no({ value: 5 }, '50');
no({ value: 12 }, '12.4'); ok({ value: 12 }, '12.0');
const cm2 = { value: 24, unit: 'cm²' };
['24', '24cm²', '24 cm2', '24 cm^2', '24平方厘米', '24 sq cm'].forEach(s => ok(cm2, s));
['24cm', '24 m²', '24 bananas'].forEach(s => no(cm2, s));
const cm = { value: 13, unit: 'cm' };
['13', '13cm', '13 厘米', '13 CM', '13.0 cm'].forEach(s => ok(cm, s)); no(cm, '13 cm²'); no(cm, '13km');
const deg = { value: 72, unit: '°' }; ['72', '72°', '72 degrees', '72度', '72 °'].forEach(s => ok(deg, s));
const money = { value: 46.5, unit: '$' }; ['46.5', '$46.50', '46.50 dollars', '46.5元', '¥46.5'].forEach(s => ok(money, s));
const pct = { value: 35, unit: '%' }; ['35', '35%', '35 %', '35 percent'].forEach(s => ok(pct, s)); no({ value: 35 }, '35%');
ok({ value: 4, unit: '' }, '4个'); ok({ value: 4, unit: '' }, '4.'); ok({ value: 4 }, '答案：4');
ok({ value: 7.33, tol: 1e-9 }, '7.33'); no({ value: 7.33, tol: 1e-9 }, '7.3349');

/* every generated question: clean text; typed answers accept their own displayed answer; MC well-formed */
require('../js/gen-core.js'); require('../js/gen-maths.js'); require('../js/gen-word.js'); require('../js/gen-junior.js');
require('../js/gen-senior.js'); require('../js/gen-charts.js'); require('../js/gen-olympiad.js'); require('../js/gen-amo.js'); require('../js/gen-ga.js');
require('../js/gen-k6.js'); require('../js/scope-k6.js'); require('../js/lessons-k2.js'); require('../js/lessons-36.js');
const G = globalThis.Gen, K6 = globalThis.ScopeK6;
const FIGR = require('../js/figures.js');
let gen = 0;
const BAD = /undefined|NaN|Infinity|null|\[object|function\s*\(/;
const k6list = (subject, y) => (subject === 'maths' && y <= 6 ? K6.topicsFor(y).concat(G.topicsFor('maths', y).includes('olymp') ? ['olymp'] : []) : G.topicsFor(subject, y));
for (const subject of ['maths', 'ga']) for (const y of G.YEARS.filter(y => y > 0 || subject === 'maths')) for (const d of [1, 2, 3, 4]) for (const topic of ['mixed', ...k6list(subject, y)]) {
  const set = G.generateSet(subject, y, topic, d, 15);
  t(`set size ${subject} y${y} d${d} ${topic}`, () => assert.ok(set.length >= 8, 'got ' + set.length));
  if (subject === 'maths' && topic === 'mixed' && y >= 4 && y <= 10 && d <= 2) t(`mixed has word problems y${y} d${d}`, () => assert.ok(set.filter(q => q.topic === 'word' || q.topic === 'k6word').length >= 3));
  if (subject === 'maths' && topic === 'mixed' && d === 4 && y >= 1) t(`challenge mixes in competition problems y${y}`, () => assert.ok(set.filter(q => q.olympiad).length >= 5, 'only ' + set.filter(q => q.olympiad).length));
  for (const q of set) {
    gen++;
    const id = `${subject} y${y} d${d} ${q.topic}: ${q.q.en}`;
    t(id + ' clean', () => {
      const texts = [q.q.en, q.q.zh, q.sol.en, q.sol.zh, ...(q.type === 'mc' ? q.choices.flatMap(c => [c.en, c.zh]) : [q.answer])];
      for (const s of texts) assert.ok(typeof s === 'string' && s.length && !BAD.test(s), JSON.stringify(s));
      assert.strictEqual(q.subject, subject);
      const reg = G.SUBJECTS[subject][q.topic];
      if (K6.has(q.topic)) assert.ok(K6.inYear(q.topic, y) && q.year === y, 'K–6 topic outside its years');
      else assert.ok(reg && reg.minYear <= y && y <= reg.maxYear, 'topic outside its years');
      if (q.fig) for (const l of ['en', 'zh']) { const h = FIGR.render(q.fig, l); assert.ok(h.startsWith('<figure') && !/NaN|undefined/.test(h), 'figure ' + q.fig.type); }
      // v1.6.4 (F.3): a topic with too few distinct questions is topped up from the year's other topics, after its own
      if (topic !== 'mixed' && q.topic !== topic) assert.ok(set.slice(set.indexOf(q)).every(x => x.topic !== topic), 'top-up before the topic ran out');
    });
    if (q.type === 'mc') {
      t(id + ' mc', () => {
        assert.ok(q.choices.length >= (/^k[a-z]+$/.test(q.ref.gen) ? 2 : 3) && q.choices.length <= 5, 'options ' + q.choices.length);
        assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.choices.length);
        assert.strictEqual(new Set(q.choices.map(c => c.en)).size, q.choices.length, 'duplicate options');
      });
    } else {
      t(id + ' self-check ' + q.answer, () => {
        assert.ok(Number.isFinite(q.value));
        assert.ok(C.check(q, q.answer).ok, JSON.stringify(C.check(q, q.answer)));
      });
    }
  }
}


/* Year coverage, school split and olympiad bank */
t('years 1–14 all have maths topics', () => { for (const y of G.YEARS) assert.ok(G.topicsFor('maths', y).length >= 6, 'year ' + y); });
t('ga available every school year from Year 1 (Kindergarten is maths only, v1.10.0)', () => { for (const y of G.YEARS.filter(y => y > 0)) assert.ok(G.topicsFor('ga', y).length >= 5, 'year ' + y); });
t('primary/high split', () => { assert.deepStrictEqual(G.PRIMARY, [0, 1, 2, 3, 4, 5, 6]); assert.deepStrictEqual(G.HIGH, [7, 8, 9, 10, 11, 12, 13, 14]); });
t('extension topics only in 3U/4U', () => {
  assert.ok(!G.topicsFor('maths', 12).includes('comb') && G.topicsFor('maths', 13).includes('comb'));
  assert.ok(!G.topicsFor('maths', 13).includes('complex') && G.topicsFor('maths', 14).includes('complex'));
});
{
  const O = globalThis.Olympiad;
  O.T.forEach((tpl, i) => {
    for (let k = 0; k < 60; k++) {
      const q = tpl.fn(); if (!q) continue;
      t(`olympiad #${i} ${q.q.en.slice(0, 40)}`, () => {
        assert.ok(Number.isFinite(q.value), 'value');
        assert.ok(C.check(q, q.answer).ok, 'self-check ' + q.answer);
        assert.ok(!/NaN|undefined|null/.test(q.q.en + q.q.zh + q.sol.en + q.sol.zh), 'text');
      });
    }
  });
  /* spot-check brute-force answers against known values */
  t('olympiad known answers', () => {
    let z = 0; for (let p = 5; p <= 100; p *= 5) z += Math.floor(100 / p);
    assert.strictEqual(z, 24);
  });
  t('challenge sets are mostly competition problems', () => {
    let oly = 0, tot = 0;
    for (const y of [2, 5, 8, 12]) for (let k = 0; k < 10; k++) { const s2 = G.generateSet('maths', y, 'mixed', 4, 10); tot += s2.length; oly += s2.filter(q => q.olympiad).length; }
    assert.ok(oly / tot > 0.5, 'share ' + (oly / tot));
  });
  t('core sets never use competition problems', () => {
    for (const y of [2, 5, 8, 12]) { const s2 = G.generateSet('maths', y, 'mixed', 1, 15); assert.ok(!s2.some(q => q.olympiad)); }
  });
}
/* Selective test: right length and shape, 5 distinct options, valid answers, easy → hard */
const SEL = require('../js/gen-selective.js');
for (let k = 0; k < 40; k++) {
  for (const len of ['full', 'short']) {
    const test = SEL.generateTest(len), n = len === 'full' ? 35 : 18;
    t(`selective ${len} #${k} length`, () => assert.strictEqual(test.length, n));
    t(`selective ${len} #${k} order`, () => { for (let i = 1; i < test.length; i++) assert.ok(test[i].tier >= test[i - 1].tier); });
    t(`selective ${len} #${k} distinct questions`, () => assert.strictEqual(new Set(test.map(q => q.q.en)).size, n));
    for (const q of test) {
      gen++;
      t(`selective q ${q.q.en.slice(0, 50)}`, () => {
        assert.strictEqual(q.choices.length, 5);
        assert.strictEqual(new Set(q.choices.map(c => c.en)).size, 5, 'duplicate options');
        assert.strictEqual(new Set(q.choices.map(c => c.zh)).size, 5, 'duplicate zh options');
        assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 5);
        assert.ok(['snum', 'smeas', 'sspace', 'sstat', 'slogic'].includes(q.topic));
        for (const s of [q.q.en, q.q.zh, q.sol.en, q.sol.zh, ...q.choices.flatMap(c => [c.en, c.zh])]) assert.ok(s && !BAD.test(s), JSON.stringify(s));
      });
    }
  }
}

/* Figures: every figure in generated selective questions renders in both languages */
const FIG = require('../js/figures.js');
{
  let figs = 0;
  for (let k = 0; k < 30; k++) for (const q of SEL.generateTest('full')) {
    if (!q.fig) continue;
    figs++;
    for (const l of ['en', 'zh']) t(`figure ${q.fig.type} ${l}`, () => {
      const h = FIG.render(q.fig, l);
      assert.ok(h.startsWith('<figure'), 'no figure markup');
      assert.ok(!/NaN|undefined|null|\[object/.test(h), h.slice(0, 120));
    });
  }
  t('tests include charts/diagrams', () => assert.ok(figs > 30, 'only ' + figs));
}
t('figure escapes text', () => assert.ok(!FIG.render({ type: 'table', rows: [['<b>x</b>']] }, 'en').includes('<b>x')));
t('selective timing', () => { assert.strictEqual(SEL.FULL.n, 35); assert.strictEqual(SEL.FULL.minutes, 40); assert.strictEqual(SEL.SHORT.n, 18); assert.strictEqual(SEL.SHORT.minutes, 20); });
/* GA option count is normally 4 */
t('ga mostly 4 options', () => {
  const qs = G.generateSet('ga', 8, 'mixed', 3, 200);
  assert.ok(qs.filter(q => q.choices.length === 4).length / qs.length > 0.95);
});

/* AI item validation */
global.window = undefined; global.Checker = C;
const AI = require('../js/ai.js');
globalThis.Checker = C;
t('ai mc item', () => {
  const q = AI.toMcQuestion({ topic: 'gseries', question_en: 'Next? 2, 4, 8, ?', question_zh: '下一个？2，4，8，？', choices_en: ['10', '12', '16', '14'], choices_zh: ['10', '12', '16', '14'], correct_index: 2, solution_en: 'x2', solution_zh: '乘2' }, 6, 2, ['gseries'], 'mixed');
  assert.ok(q && q.type === 'mc' && q.correct === 2 && q.choices[2].zh === '16');
  assert.strictEqual(AI.toMcQuestion({ question_en: 'a', question_zh: 'b', choices_en: ['1', '2'], choices_zh: ['1', '2'], correct_index: 0 }, 6, 2, ['gseries'], 'mixed'), null);
  assert.strictEqual(AI.toMcQuestion({ question_en: 'a', question_zh: 'b', choices_en: ['1', '2', '3', '4'], choices_zh: ['1', '2', '3', '4'], correct_index: 7 }, 6, 2, ['gseries'], 'mixed'), null);
});
const good = AI.toQuestion({ topic: 'frac', question_en: 'What is 1/2 + 1/4?', question_zh: '1/2 + 1/4 等于多少？', answer: '3/4', unit: '', solution_en: 's', solution_zh: 's' }, 6, 1, ['frac'], 'mixed');
t('ai good item', () => { assert.ok(good); assert.strictEqual(good.value, 0.75); assert.ok(C.check(good, '6/8').ok); });
t('ai rejects word answer', () => assert.strictEqual(AI.toQuestion({ topic: 'frac', question_en: 'a', question_zh: 'b', answer: 'three', unit: '' }, 6, 1, ['frac'], 'frac'), null));
t('ai money unit', () => { const q = AI.toQuestion({ topic: 'pct', question_en: 'a', question_zh: 'b', answer: '12.5', unit: '$', solution_en: '', solution_zh: '' }, 8, 1, ['pct'], 'pct'); assert.strictEqual(q.answer, '$12.5'); assert.ok(C.check(q, '$12.50').ok); });

/* AMO-level bank and competition papers */
{
  const O = globalThis.Olympiad;
  t('amo templates exist', () => assert.ok(O.T.filter(x => x.amo).length >= 20));
  t('tiling counts match known values', () => {
    const D = [[0, 0], [0, 1]], SQ = [[0, 0], [0, 1], [1, 0], [1, 1]];
    assert.strictEqual(O.tilings(2, 8, [D]), 34); assert.strictEqual(O.tilings(3, 8, [D]), 153);
    assert.strictEqual(O.tilings(4, 4, [D]), 36); assert.strictEqual(O.tilings(2, 10, [D, SQ]), 683);
  });
  t('amo answers are whole numbers 0-999', () => {
    O.T.filter(x => x.amo).forEach(tpl => { for (let k = 0; k < 20; k++) { const q = tpl.fn(); if (q) assert.ok(Number.isInteger(q.value) && q.value >= 0 && q.value <= 999, q.q.en); } });
  });
  t('challenge high school sets use AMO problems', () => {
    let a = 0; for (let k = 0; k < 200; k++) { const q = O.generate(9, 4); if (q && /power of 2|f\(f\(n\)\)|tiled|second player|ordered pairs|consecutive positive|subsets|chairs|strictly inside|perimeter|cannot be bought|digit sums|divisible by n \+|written in a row|exactly \d+ positive divisors|ordered triples|a₁, a₂|right-angled|different numbers appear/.test(q.q.en)) a++; }
    assert.ok(a > 80, 'amo share ' + a);
  });
  const CP = require('../js/gen-comp.js');
  for (const paper of Object.keys(CP.PAPERS)) for (const len of ['full', 'short']) {
    t(`competition ${paper} ${len}`, () => {
      for (let k = 0; k < 5; k++) {
        const qs = CP.buildPaper(paper, len), lay = CP.layout(paper, len);
        assert.strictEqual(qs.length, lay.length);
        assert.strictEqual(CP.totalMarks(qs), lay.reduce((m, x) => m + x[1], 0));
        qs.forEach((q, i) => {
          assert.ok(!BAD.test(q.q.en + q.q.zh), 'text');
          if (lay[i][0][0] === 'N') { assert.ok(q.intAnswer && Number.isInteger(q.value) && q.value >= 0 && q.value <= 999); assert.ok(C.check(q, String(q.value)).ok); }
          else { assert.strictEqual(q.type, 'mc'); assert.strictEqual(new Set(q.choices.map(c => c.en)).size, 5); assert.ok(q.correct >= 0 && q.correct < 5); }
        });
      }
    });
  }
  t('competition marks', () => {
    assert.strictEqual(CP.totalMarks(CP.buildPaper('amc_j', 'full')), 135);
    assert.strictEqual(CP.totalMarks(CP.buildPaper('aimo', 'full')), 35);
    assert.strictEqual(CP.minutes('amc_mp', 'full'), 60); assert.strictEqual(CP.minutes('amc_s', 'full'), 75); assert.strictEqual(CP.minutes('aimo', 'full'), 240);
  });
}

/* v1.6.4 full-review fixes */
t('F.3 thin topics still give the number asked for', () => {
  for (const [y, tp] of [[1, 'frac1'], [1, 'shape1']]) for (let k = 0; k < 5; k++) {
    const s = G.generateSet('maths', y, tp, 1, 20);
    assert.strictEqual(s.length, 20, `y${y} ${tp}: ${s.length}`);
    assert.ok(s.filter(q => q.topic === tp).length >= 10, `y${y} ${tp}: too few from the topic`);
  }
});
t('F.4 Year 1-3 fraction multiple choice has 4 options, all different values', () => {
  for (const y of [1, 2, 3]) for (const d of [1, 2, 3, 4]) for (let k = 0; k < 100; k++) {
    const q = G.generate('maths', y, 'frac1', d);
    if (q.type !== 'mc') continue;
    assert.strictEqual(q.choices.length, 4, q.choices.map(c => c.en).join(' | '));
    const vals = q.choices.map(c => { const m = c.en.match(/^(\d+)\/(\d+)$/); return m ? +m[1] / +m[2] : c.en; });
    assert.strictEqual(new Set(vals).size, 4, 'equal values: ' + q.choices.map(c => c.en).join(' | '));
  }
});

/* similar questions for the review */
{
  require('../js/gen-selective.js'); const Sim = require('../js/similar.js');
  for (const [sub, y, tp, d] of [['maths', 6, 'frac', 2], ['maths', 9, 'olymp', 4], ['maths', 4, 'word', 1], ['ga', 7, 'mixed', 2], ['maths', 12, 'calc', 3], ['maths', 2, 'mixed', 1]]) {
    t(`similar ${sub} y${y} ${tp}`, () => {
      for (const q of G.generateSet(sub, y, tp, d, 4)) {
        const out = Sim.make(q, 3);
        assert.ok(out.length >= 2, 'only ' + out.length + ' for ' + q.q.en);
        const oly = q.ref && q.ref.oly !== undefined;
        const same = x => oly ? x.ref.oly === q.ref.oly : x.ref.gen === q.ref.gen;
        out.forEach((x, i) => {
          assert.notStrictEqual(x.q.en + JSON.stringify(x.fig || ''), q.q.en + JSON.stringify(q.fig || ''));
          if (x.type !== 'mc') assert.ok(C.check(x, x.answer).ok, 'self-check');
          if (same(x)) return;
          // Another problem type is allowed only after the template ran out of new versions (by design in similar.js).
          assert.ok(oly, 'topic changed: ' + x.ref.gen + ' for ' + q.ref.gen);
          assert.ok(out.slice(0, i).every(same), 'same-template questions must come first');
          const versions = new Set(); const fn = globalThis.Olympiad.T[q.ref.oly].fn;
          for (let k = 0; k < 300; k++) { const v = fn(); if (v) versions.add(v.q.en + '|' + v.answer); }
          versions.delete(q.q.en + '|' + q.answer);
          assert.ok(versions.size < 3, `template ${q.ref.oly} has ${versions.size} other versions but only ${i} were used`);
        });
      }
    });
  }
  t('similar selective uses the same template', () => {
    const q = globalThis.Selective.generateTest('short')[5], out = Sim.make(q, 2);
    assert.ok(out.length >= 1); out.forEach(x => assert.deepStrictEqual(x.ref.sel, q.ref.sel));
  });
  t('similar for old history items without ref', () => {
    const out = Sim.make({ topic: 'pct', type: 'input', q: { en: 'What is 20% of 50?', zh: '' } }, 3, { subject: 'maths', year: 7, diff: 2 });
    assert.strictEqual(out.length, 3); out.forEach(x => assert.strictEqual(x.ref.gen, 'pct'));
  });
  t('similar set is capped', () => {
    const qs = G.generateSet('maths', 6, 'mixed', 2, 10).map(q => ({ q, fb: {} }));
    assert.strictEqual(Sim.makeSet(qs, 10, 50).length, 50);
  });
}

/* v1.7.0: badges, suggested year, progress file (js/records.js) */
{
  const Rec = require('../js/records.js');
  const base = { subject: 'maths', year: 4, diff: 2, n: 10, correct: 10, firstTry: 10, seconds: 100 };
  t('badges: all three for a fast, first-try, perfect set', () => assert.deepStrictEqual(Rec.awardsFor(base), ['perfect', 'firstTry', 'speed']));
  t('badges: none below 100%', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, correct: 9 }), []));
  t('badges: a second try loses First try only', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, firstTry: 9 }), ['perfect', 'speed']));
  t('badges: speed limit per difficulty (Elevated 30 s a question)', () => {
    assert.ok(Rec.awardsFor({ ...base, seconds: 300 }).includes('speed'));
    assert.ok(!Rec.awardsFor({ ...base, seconds: 301 }).includes('speed'));
    assert.ok(Rec.awardsFor({ ...base, diff: 4, seconds: 900 }).includes('speed'));
  });
  t('badges: fewer than 5 questions earn Perfect only', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, n: 4, correct: 4, firstTry: 4, seconds: 4 }), ['perfect']));
  t('badges: timed papers earn Perfect only', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, paper: 'sel:full' }), ['perfect']));
  t('badges: each year and difficulty is its own level', () => {
    const col = Rec.collection([
      { kind: 'perfect', subject: 'maths', year: 4, diff: 2 }, { kind: 'perfect', subject: 'maths', year: 4, diff: 2 },
      { kind: 'perfect', subject: 'maths', year: 5, diff: 2 }, { kind: 'speed', subject: 'maths', year: 4, diff: 3 },
      { subject: 'maths', topic: 'mixed', n: 5 }   // a v1.6 badge: no level recorded
    ]);
    assert.deepStrictEqual(col, { 'maths:4:2': { perfect: 2 }, 'maths:5:2': { perfect: 1 }, 'maths:4:3': { speed: 1 }, earlier: { perfect: 1 } });
  });

  const nov = new Date(2026, 10, 6);
  t('suggested year: school year entered this year', () => assert.strictEqual(Rec.suggestYear({ schoolYear: 4, schoolYearSet: 2026 }, nov), 4));
  t('suggested year: moves up each new calendar year', () => assert.strictEqual(Rec.suggestYear({ schoolYear: 4, schoolYearSet: 2026 }, new Date(2028, 1, 1)), 6));
  t('year by age: not clamped (R6.3)', () => { assert.strictEqual(Rec.yearByAge('2022-06', nov), -1); assert.strictEqual(Rec.yearByAge('2021-03', nov), 0); assert.strictEqual(Rec.yearByAge('2010-03', nov), 11); assert.strictEqual(Rec.yearByAge('', nov), null); assert.strictEqual(Rec.yearByAge('2010-3', nov), null); });
  t('suggested year: a preschool birth month clamps to Kindergarten (R9.3)', () => assert.strictEqual(Rec.suggestYear({ dob: '2022-06' }, nov), 0));
  t('suggested year: school year wins over birth month', () => assert.strictEqual(Rec.suggestYear({ schoolYear: 3, schoolYearSet: 2026, dob: '2016-03' }, nov), 3));
  t('suggested year: born Jan-Jul starts Kindergarten the year they turn 5', () => {
    assert.strictEqual(Rec.suggestYear({ dob: '2016-03' }, nov), 5);   // K 2021, Year 5 in 2026
    assert.strictEqual(Rec.suggestYear({ dob: '2016-07' }, nov), 5);
  });
  t('suggested year: born Aug-Dec starts a year later', () => assert.strictEqual(Rec.suggestYear({ dob: '2016-08' }, nov), 4));
  t('suggested year: kept within Kindergarten to Year 12, null when unknown', () => {
    assert.strictEqual(Rec.suggestYear({ dob: '2022-01' }, nov), 0);
    assert.strictEqual(Rec.suggestYear({ dob: '2000-01' }, nov), 12);
    assert.strictEqual(Rec.suggestYear({}, nov), null);
    assert.strictEqual(Rec.suggestYear({ dob: 'not a date' }, nov), null);
  });

  const student = { name: 'Lily, "Li" 李', schoolYear: 4, schoolYearSet: 2026, dob: '2016-03' };
  const history = [
    { date: 1762400000000, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 4, stars: 2, time: null, byTopic: { frac: [4, 5] },
      wrong: [{ topic: 'frac', type: 'input', q: { en: 'What is 1/2 + 1/4?\nSay "why", too.', zh: '1/2 + 1/4 等于多少？' }, answer: '3/4', given: ['=1+1'] }] },
    { date: 1762500000000, subject: 'sel', year: 6, topic: 'sel', diff: 2, n: 35, correct: 35, stars: 3, time: 1800000, byTopic: {}, wrong: [] }
  ];
  const badges = [{ date: 1762500000000, kind: 'perfect', subject: 'sel', paper: 'sel:full', n: 35 }, { date: 1762400000000, kind: 'speed', subject: 'maths', year: 4, diff: 2, n: 5 }];
  const csv = Rec.toCSV(student, history, badges);
  t('progress file: one header, one student, every session and badge', () => {
    const rows = Rec.parseCSV(csv);
    assert.strictEqual(rows[0].join(','), Rec.COLUMNS.join(','));
    assert.deepStrictEqual(rows.slice(1).map(r => r[0]), ['student', 'session', 'session', 'badge', 'badge']);
  });
  t('progress file: round trip restores everything exactly', () => {
    const back = Rec.fromCSV(csv);
    assert.deepStrictEqual(back.student, student);
    assert.deepStrictEqual(back.history, history);
    assert.deepStrictEqual(back.badges, badges);
    assert.strictEqual(back.skipped, 0);
  });
  t('progress file: readable columns for a spreadsheet', () => {
    const r = Rec.parseCSV(csv)[2];
    assert.deepStrictEqual(r.slice(0, 14), ['session', '2025-11-06T03:33:20.000Z', '', '', '', 'maths', '4', 'frac', '2', '5', '4', '2', '', '']);
  });
  t('progress file: a cell starting with = is not run as a spreadsheet formula', () => {
    const c = Rec.toCSV({ name: '=HYPERLINK("x")' }, [], []);
    assert.ok(c.includes(`"'=HYPERLINK(""x"")"`), c.split('\r\n')[1]);
    assert.strictEqual(Rec.fromCSV(c).student.name, '=HYPERLINK("x")');
  });
  t('progress file: a file from elsewhere is refused', () => {
    assert.throws(() => Rec.fromCSV('name,score\nA,1\n'), /format/);
    assert.throws(() => Rec.fromCSV(''), /format/);
    assert.throws(() => Rec.fromCSV('x'.repeat(2 * 1024 * 1024 + 1)), /size/);
  });
  t('progress file: impossible rows are skipped, not imported', () => {
    const bad = Rec.COLUMNS.join(',') + '\r\nsession,2026-01-01T00:00:00Z,,,,maths,4,frac,2,5,9,,,,\r\nsession,not a date,,,,maths,4,frac,2,5,4,,,,\r\nmystery,,,,,,,,,,,,,,\r\n';
    const r = Rec.fromCSV(bad);
    assert.strictEqual(r.history.length, 0);
    assert.strictEqual(r.skipped, 3);
  });
  t('progress file: rows typed in a spreadsheet (no data column) still import', () => {
    const typed = Rec.COLUMNS.join(',') + '\r\nsession,2026-03-01T09:00:00Z,,,,maths,5,dec,3,10,8,2,,,\r\nbadge,2026-03-01T09:00:00Z,,,,maths,5,dec,3,10,,,,firstTry,\r\n';
    const r = Rec.fromCSV(typed);
    assert.strictEqual(r.history.length, 1); assert.strictEqual(r.history[0].correct, 8); assert.strictEqual(r.history[0].diff, 3);
    assert.strictEqual(r.badges[0].kind, 'firstTry'); assert.strictEqual(Rec.levelOf(r.badges[0]), 'maths:5:3');
  });
  /* R1.1: a file the app accepts must not break a screen. Each field a screen reads is checked on import. */
  const withData = o => Rec.COLUMNS.join(',') + '\r\nsession,,,,,,,,,,,,,,' + '"' + JSON.stringify(o).replace(/"/g, '""') + '"\r\n';
  const ok = { date: 1762400000000, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 4 };
  t('import checks inside data: stars kept to 0-3, time and marks in range', () => {
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, stars: 99 })).history[0].stars, undefined);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, stars: -1 })).history[0].stars, undefined);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, stars: 2 })).history[0].stars, 2);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, time: 'x' })).history[0].time, null);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, time: 5000 })).history[0].time, 5000);
    const m = Rec.fromCSV(withData({ ...ok, marks: 50, maxMarks: 10 })).history[0];
    assert.ok(!('marks' in m) && !('maxMarks' in m));
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, n: 2.5, correct: 1 })).skipped, 1);
  });
  t('import checks inside data: questions the review cannot show are dropped', () => {
    const good = { topic: 'frac', type: 'input', q: { en: '1/2 + 1/4?' }, answer: '3/4', given: ['1'] };
    const mc = { topic: 'pat', type: 'mc', q: { en: 'Pick', zh: '选' }, choices: [{ en: 'a' }, { en: 'b' }], correct: 1, given: [0, 9, 'x'] };
    const wrong = [null, 5, { q: null }, { q: { en: 7 } }, { q: 'text' }, { type: 'mc', q: { en: 'x' }, choices: [{ en: 'a' }], correct: 3 },
      { type: 'input', q: { en: 'no answer' } }, good, mc];
    const s = Rec.fromCSV(withData({ ...ok, wrong })).history[0];
    assert.strictEqual(s.wrong.length, 2);
    assert.deepStrictEqual(s.wrong[0], good);
    assert.deepStrictEqual(s.wrong[1].given, [0]);        // a choice that does not exist is not "given"
  });
  t('import checks inside data: byTopic, refs and figures are well-formed', () => {
    const s = Rec.fromCSV(withData({ ...ok, byTopic: { frac: [4, 5], bad: [9, 5], worse: 'x', '__proto__': [1, 1] },
      wrong: [{ type: 'input', q: { en: 'q' }, answer: 1, ref: { oly: 'constructor', sel: ['__proto__', 'x'], gen: 'frac', year: 99 }, fig: { type: 'x" onload="y' } }] })).history[0];
    assert.deepStrictEqual(s.byTopic, { frac: [4, 5] });
    assert.deepStrictEqual(s.wrong[0].ref, { gen: 'frac' });
    assert.ok(!('fig' in s.wrong[0]));
    assert.deepStrictEqual(Rec.fromCSV(withData({ ...ok, byTopic: 'x' })).history[0].byTopic, { frac: [4, 5] });
  });
  t('similar: a ref naming no real template does not throw', () => {
    const Sim = require('../js/similar.js');
    const item = { topic: 'frac', type: 'input', q: { en: 'q' }, answer: '1', ref: { oly: 'constructor', sel: ['constructor', 'name'] } };
    assert.doesNotThrow(() => Sim.makeSet([{ q: item, fb: { subject: 'maths', year: 4, diff: 2 } }], 2, 10));
  });
  /* R2.2: an empty cell typed in a spreadsheet is missing, not 0 */
  const typedRow = cells => Rec.COLUMNS.join(',') + '\r\n' + cells + '\r\n';
  t('import: a blank stars cell is worked out from the score, not stored as 0', () => {
    const r = Rec.fromCSV(typedRow('session,2026-03-01T09:00:00Z,,,,maths,5,dec,3,5,5,,,,'));
    assert.strictEqual(r.history.length, 1); assert.ok(!('stars' in r.history[0]), JSON.stringify(r.history[0]));
  });
  t('import: a blank correct (or questions) cell skips the row', () => {
    const r = Rec.fromCSV(typedRow('session,2026-03-01T09:00:00Z,,,,maths,5,dec,3,5,,2,,,') + 'session,2026-03-02T09:00:00Z,,,,maths,5,dec,3, ,4,,,,\r\n');
    assert.strictEqual(r.history.length, 0); assert.strictEqual(r.skipped, 2);
  });
  /* R2.3: names the app does not know are not imported. `known` is what the page passes: text keys and figures. */
  const i18nSrc = require('fs').readFileSync(require('path').join(__dirname, '../js/i18n.js'), 'utf8');
  const keys = new Set([...i18nSrc.matchAll(/^\s*'([\w.]+)':/gm)].map(m => m[1]));
  const Fig = require('../js/figures.js');
  const known = { key: k => keys.has(k), fig: f => Fig.draws(f) };
  t('import vocabulary: unknown subject or a practice set with no year is skipped; unknown topic becomes mixed', () => {
    const r = Rec.fromCSV(withData({ ...ok, subject: 'zzz' }) + 'session,2026-03-01T09:00:00Z,,,,maths,,frac,2,5,4,,,,\r\n' +
      'session,2026-03-01T09:00:00Z,,,,sel,,selfull,2,35,30,,,,\r\n', known);
    assert.strictEqual(r.skipped, 2); assert.strictEqual(r.history.length, 1); assert.strictEqual(r.history[0].subject, 'sel');
    const s = Rec.fromCSV(withData({ ...ok, topic: 'zzz', byTopic: { frac: [4, 5], zzz: [1, 1] }, wrong: [{ topic: 'zzz', type: 'input', q: { en: 'q' }, answer: 1 }] }), known).history[0];
    assert.strictEqual(s.topic, 'mixed'); assert.deepStrictEqual(s.byTopic, { frac: [4, 5] }); assert.strictEqual(s.wrong[0].topic, 'mixed');
  });
  t('import vocabulary: a badge for a paper the app does not have is skipped', () => {
    const badge = o => 'badge,,,,,,,,,,,,,,"' + JSON.stringify(o).replace(/"/g, '""') + '"\r\n';
    const r = Rec.fromCSV(Rec.COLUMNS.join(',') + '\r\n' + badge({ date: 1, kind: 'perfect', subject: 'sel', paper: 'x' }) +
      badge({ date: 2, kind: 'perfect', subject: 'comp', paper: 'comp' }) + badge({ date: 3, kind: 'perfect', subject: 'sel', paper: 'sel:full' }) +
      badge({ date: 4, kind: 'perfect', subject: 'comp', paper: 'comp:amc_j:short' }) + badge({ date: 5, kind: 'perfect', subject: 'zzz', year: 4, diff: 2 }), known);
    assert.deepStrictEqual(r.badges.map(b => b.paper), ['sel:full', 'comp:amc_j:short']); assert.strictEqual(r.skipped, 3);
  });
  t('import vocabulary: a figure is kept only if it draws', () => {
    const good = { type: 'clock', h: 3, m: 15 };
    const w = f => ({ type: 'input', q: { en: 'q' }, answer: 1, fig: f });
    const s = Rec.fromCSV(withData({ ...ok, wrong: [w({ type: 'bar', values: 'x' }), w(good)] }), known).history[0];
    assert.ok(!('fig' in s.wrong[0])); assert.deepStrictEqual(s.wrong[1].fig, good);
  });
  t('figures: a figure whose numbers would loop for ever stops (budget)', () => {
    const t0 = Date.now();
    assert.strictEqual(Fig.draws({ type: 'bar', values: [1], cats: ['a'], max: 10, step: 0 }), false);
    assert.strictEqual(Fig.draws({ type: 'grid', w: 1e9, h: 1, shapes: [] }), false);
    assert.strictEqual(Fig.draws({ type: 'picto', icon: 'x', key: '', rows: [{ label: 'a', count: 1e9 }] }), false);
    const warn = console.warn; console.warn = () => {};      // render logs the failure it catches
    try { assert.strictEqual(Fig.render({ type: 'jug', max: 10, value: 1, minor: 0, labelStep: 1, unit: 'mL' }), ''); } finally { console.warn = warn; }
    assert.ok(Date.now() - t0 < 2000, 'took ' + (Date.now() - t0) + ' ms');
    assert.ok(Fig.draws({ type: 'bar', values: [3, 5], cats: ['a', 'b'], max: 10, step: 2 }));
  });
  t('import merge: no duplicates, oldest first, capped', () => {
    const a = [{ date: 3, subject: 'm', n: 1, correct: 1 }, { date: 1, subject: 'm', n: 1, correct: 1 }];
    const m = Rec.merge(a, [{ date: 1, subject: 'm', n: 1, correct: 1 }, { date: 2, subject: 'm', n: 1, correct: 0 }], Rec.sessionKey, 2);
    assert.strictEqual(m.added, 1);
    assert.deepStrictEqual(m.list.map(x => x.date), [2, 3]);
  });
}

/* every text key is defined once per language (a second definition silently replaces the first) */
t('i18n: no key defined twice in a language', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/i18n.js'), 'utf8');
  const zhAt = src.indexOf('\n    zh: {');
  assert.ok(zhAt > 0, 'zh block not found');
  for (const [name, part] of [['en', src.slice(0, zhAt)], ['zh', src.slice(zhAt)]]) {
    const keys = [...part.matchAll(/^\s*'([\w.]+)':/gm)].map(m => m[1]);
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    assert.deepStrictEqual(dup, [], name + ' duplicates');
  }
});

/* R6.2 (v1.7.0): phones only fetch new files when sw.js itself changes, so its BUILD must follow the version, and must
   change whenever an app file changed since the last pushed tag. */
{
  const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
  const root = path.join(__dirname, '..');
  const buildOf = src => ((/const BUILD = '([^']+)'/.exec(src || '') || [])[1]) || null;
  const build = buildOf(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'));
  const version = (/APP_VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(root, 'version.js'), 'utf8')) || [])[1];
  t('sw.js BUILD is <version>+<n> of version.js', () => assert.ok(build && new RegExp('^' + version.replace(/\./g, '\\.') + '\\+\\d+$').test(build), `BUILD ${build}, version ${version}`));
  const git = (...a) => spawnSync('git', ['-C', root, ...a], { encoding: 'utf8', windowsHide: true, timeout: 20000 });
  const tag = (git('tag', '--list', 'v*', '--sort=-creatordate').stdout || '').split('\n')[0].trim();
  if (!tag) console.log('note: no v* tag found (or no git), the BUILD-since-last-push check is skipped');
  else t(`sw.js BUILD changed since ${tag} when an app file did`, () => {
    const changed = (git('diff', '--name-only', tag).stdout || '').split('\n').map(s => s.trim()).filter(Boolean)
      // sw.js itself is left out (R7.1, v1.7.0): a change to it already changes the bytes phones compare
      .filter(f => f !== 'sw.js' && !/^tests\/|\.md$|^\.|^package(-lock)?\.json$/.test(f));
    const before = buildOf(git('show', tag + ':sw.js').stdout);
    assert.ok(changed.length === 0 || before !== build, `app files changed since ${tag} (${changed.slice(0, 5).join(', ')}) but BUILD is still ${build}`);
  });
}

/* v1.8.0: every script and stylesheet the page loads is in the offline list, or the app breaks offline (js/tour.js is new) */
{
  const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const files = [...html.matchAll(/<(?:script[^>]*\ssrc|link[^>]*rel="(?:stylesheet|manifest)"[^>]*\shref)="([^"]+)"/g)]
    .map(m => m[1]).filter(u => !/^https?:/.test(u)).map(u => './' + u.replace(/^\.\//, ''));
  t('offline list: the page loads files', () => assert.ok(files.includes('./js/tour.js') && files.length > 20, files.join(',')));
  t('offline list: every file the page loads is cached by sw.js', () => {
    assert.deepStrictEqual(files.filter(u => !sw.includes("'" + u + "'")), []);
  });
}

/* v1.8.0 guided tour: every step names a text that exists in both languages, and every target is on the page */
{
  const fs = require('fs'), path = require('path'), vm = require('vm'), root = path.join(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const box = { navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem() {} }, document: {} };
  box.window = box;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8'), box);
  const S = box.I18N.STRINGS;
  const block = (/const TOUR = \[([\s\S]*?)\n\s*\];/.exec(app) || [])[1] || '';
  const steps = [...block.matchAll(/target: (?:null|'([^']+)'), title: '([\w.]+)', text: '([\w.]+)'/g)];
  // v1.12.0 W7: the steps follow the new Home (school, My plan, today's plan, the cards, Carry on, Friends); the options are in the sheet
  t('tour: 12 steps found in app.js (v1.12.0 W7: school, My plan, today, cards, Carry on, Friends; no options, Start or Print)', () => assert.strictEqual(steps.length, 12));
  t('tour: every text is in English and Chinese', () => {
    const keys = steps.flatMap(m => [m[2], m[3]]).concat(['tour.step', 'tour.next', 'tour.back', 'tour.skip', 'tour.done']);
    assert.deepStrictEqual(keys.filter(k => !S.en[k] || !S.zh[k] || S.zh[k] === S.en[k]), []);
  });
  t('tour: every highlighted part is in index.html', () => {
    const sels = steps.map(m => m[1]).filter(Boolean);
    const found = sel => (sel.startsWith('#') ? html.includes('id="' + sel.slice(1) + '"') : /data-go="progress"/.test(html));
    assert.deepStrictEqual(sels.filter(s => !found(s)), []);
  });
}

/* v1.9.0 mini game: the rules of times-table balloons (js/game-balloons.js, no page needed) */
{
  const B = require('../js/game-balloons.js');
  t('balloons: a round is one minute; a wrong answer locks for 1.5 s', () => { assert.strictEqual(B.SECONDS, 60); assert.strictEqual(B.LOCK_MS, 1500); });
  t('balloons: slow and one at a time at the start', () => assert.deepStrictEqual(B.level(0), { rise: 9, every: 2.4, max: 1 }));
  t('balloons: fast and up to 5 at once at the end', () => { const e = B.level(60); assert.ok(Math.abs(e.rise - 4) < 1e-9 && Math.abs(e.every - 0.9) < 1e-9 && e.max === 5, JSON.stringify(e)); });
  t('balloons: never slower, never fewer as the minute goes on', () => {
    for (let s = 1; s <= 60; s++) {
      const a = B.level(s - 1), b = B.level(s);
      assert.ok(b.rise < a.rise && b.every < a.every && b.max >= a.max, `second ${s}`);
    }
  });
  t('balloons: questions are 1×1 to 9×9 and all 81 come up', () => {
    const seen = new Set();
    for (let i = 0; i < 20000; i++) {
      const q = B.question(Math.random, new Set());
      assert.ok(q.a >= 1 && q.a <= 9 && q.b >= 1 && q.b <= 9 && q.answer === q.a * q.b, JSON.stringify(q));
      seen.add(q.a + 'x' + q.b);
    }
    assert.strictEqual(seen.size, 81);
  });
  t('balloons: a new question never repeats an answer already in the air', () => {
    const busy = new Set([6, 12, 24, 36, 18]);
    for (let i = 0; i < 3000; i++) assert.ok(!busy.has(B.question(Math.random, busy).answer));
  });
  t('balloons: the no-repeat rule holds even after 60 unlucky draws (R1 caveat)', () => {
    // rand() = 0 always draws 1 × 1; with 1 busy, every draw collides and the fallback must pick a free pair
    const q = B.question(() => 0, new Set([1]));
    assert.ok(q.answer !== 1 && q.answer === q.a * q.b, JSON.stringify(q));
    const almost = new Set(); for (let x = 1; x <= 9; x++) for (let y = 1; y <= 9; y++) if (x * y !== 72) almost.add(x * y);
    for (let i = 0; i < 50; i++) assert.strictEqual(B.question(Math.random, almost).answer, 72);
  });
  t('balloons: the question text has at least 4.5:1 contrast on every balloon (R1.2)', () => {
    const css = require('fs').readFileSync(require('path').join(__dirname, '../css/style.css'), 'utf8');
    const ink = (/\.bl-q\s*\{[^}]*?[\s;]color:\s*(#[0-9a-f]{6})/i.exec(css) || [])[1];
    assert.ok(ink, 'no .bl-q colour in style.css');
    const lum = hex => {
      const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (x, y) => { const [h, l] = [lum(x), lum(y)].sort((p, q) => q - p); return (h + 0.05) / (l + 0.05); };
    assert.strictEqual(B.COLORS.length, 6);
    const low = B.COLORS.map(c => [c, ratio(ink, c)]).filter(([, r]) => r < 4.5);
    assert.deepStrictEqual(low, []);
  });
  t('balloons: an answer hits the matching balloon closest to flying away', () => {
    const list = [{ answer: 12, y: 300 }, { answer: 12, y: 80 }, { answer: 56, y: 10 }, { answer: 12, y: 5, hit: true }];
    assert.strictEqual(B.target(list, '12'), list[1]);
    assert.strictEqual(B.target(list, '56'), list[2]);
    assert.strictEqual(B.target(list, '7'), null);
    assert.strictEqual(B.target(list, ''), null);
    assert.strictEqual(B.target(list, '012'), null);
  });
  t('balloons: a new balloon avoids lanes with one still low down', () => {
    const list = [{ lane: 0, y: 400 }, { lane: 1, y: 380 }, { lane: 2, y: 300 }, { lane: 3, y: 50 }];
    for (let i = 0; i < 200; i++) assert.strictEqual(B.lane(Math.random, list, 500), 3);
  });
}

/* v1.10.0 mini games: Sudoku, Money Master, Broken Calculator (the pure rules, no page needed) */
{
  const SD = require('../js/game-sudoku.js'), MM = require('../js/game-money.js'), BC = require('../js/game-broken.js'), Kit = require('../js/game-kit.js');
  t('sudoku: three levels, 4×4, 6×6 and 9×9 with boxes that tile the grid', () => {
    assert.deepStrictEqual(Object.keys(SD.LEVELS), ['easy', 'medium', 'hard']);
    for (const L of Object.values(SD.LEVELS)) assert.ok(L.br * L.bc === L.n && L.n % L.br === 0 && L.n % L.bc === 0, JSON.stringify(L));
    assert.deepStrictEqual(Object.values(SD.LEVELS).map(L => L.n), [4, 6, 9]);
  });
  t('sudoku: a made solution is a valid full grid', () => {
    for (const L of Object.values(SD.LEVELS)) for (let i = 0; i < 50; i++) assert.ok(SD.done(SD.solved(L, Math.random), L));
  });
  t('sudoku: every puzzle has exactly one answer, fits its solution, and has the planned number of blanks', () => {
    for (const lv of ['easy', 'medium', 'hard']) {
      const L = SD.LEVELS[lv];
      for (let i = 0; i < (lv === 'hard' ? 15 : 60); i++) {
        const p = SD.puzzle(lv, Math.random);
        assert.strictEqual(SD.count(p.grid, L, 3), 1, lv);
        assert.ok(p.grid.every((v, j) => !v || v === p.solution[j]), lv);
        assert.strictEqual(p.grid.filter(v => !v).length, L.holes, lv);
      }
    }
  });
  t('sudoku: a clash is found in a row, a column and a box; a correct full grid is done', () => {
    const L = SD.LEVELS.easy, g = SD.solved(L, Math.random);
    assert.strictEqual(SD.conflicts(g, L).size, 0);
    const row = g.slice(); row[1] = row[0]; assert.ok(SD.conflicts(row, L).has(0) && SD.conflicts(row, L).has(1));
    const col = g.slice(); col[4] = col[0]; assert.ok(SD.conflicts(col, L).has(4));
    const box = g.slice(); box[5] = box[0]; assert.ok(SD.conflicts(box, L).has(5));
    const gap = g.slice(); gap[3] = 0; assert.ok(!SD.done(gap, L));
    assert.ok(!SD.done(row, L));
  });
  t('sudoku: the solver counts two answers when a grid has two', () => {
    assert.strictEqual(SD.count(new Array(16).fill(0), SD.LEVELS.easy, 2), 2);
  });

  t('money: five questions a round; change is always above 0 and a multiple of 5c', () => {
    assert.strictEqual(MM.ROUNDS, 5);
    for (const lv of ['easy', 'medium', 'hard']) for (let i = 0; i < 3000; i++) {
      const q = MM.question(lv, Math.random);
      assert.ok(q.change > 0 && q.change % 5 === 0 && q.total % 5 === 0 && q.change === q.paid - q.total, JSON.stringify(q));
      assert.ok(q.total === q.items.reduce((s, x) => s + x.cents, 0));
      assert.strictEqual(new Set(q.items.map(x => x.id)).size, q.items.length);
    }
  });
  t('money: each level pays with its own notes and has its own number of items', () => {
    const want = { easy: [[1, 1], [1000, 2000]], medium: [[1, 2], [2000, 5000]], hard: [[2, 3], [5000, 10000]] };
    for (const [lv, [[lo, hi], notes]] of Object.entries(want)) for (let i = 0; i < 2000; i++) {
      const q = MM.question(lv, Math.random);
      assert.ok(q.items.length >= lo && q.items.length <= hi && notes.includes(q.paid), lv + ' ' + JSON.stringify(q));
      if (lv === 'easy') assert.ok(q.total % 100 === 0 && q.change % 100 === 0, 'easy is whole dollars');
    }
  });
  t('money: a typed answer is read as dollars and cents', () => {
    const cases = { '3': 300, '3.5': 350, '3.50': 350, '$3.05': 305, '0.45': 45, '12.': 1200, ' 7.25 ': 725 };
    for (const [s, c] of Object.entries(cases)) assert.strictEqual(MM.parse(s), c, s);
    for (const s of ['', 'abc', '1.234', '3..5', '-2', '1,50', '1234']) assert.strictEqual(MM.parse(s), null, s);
  });
  t('money: change is shown with the fewest Australian notes and coins (no 1c or 2c)', () => {
    assert.ok(!MM.DENOMS.includes(1) && !MM.DENOMS.includes(2));
    assert.deepStrictEqual(MM.breakdown(1385), [[1000, 1], [200, 1], [100, 1], [50, 1], [20, 1], [10, 1], [5, 1]]);
    assert.deepStrictEqual(MM.breakdown(4000), [[2000, 2]]);
    for (let c = 5; c <= 10000; c += 5) assert.strictEqual(MM.breakdown(c).reduce((s, [d, n]) => s + d * n, 0), c);
    assert.deepStrictEqual(Object.keys(MM.NOTE_COLOURS).map(Number), [500, 1000, 2000, 5000, 10000]);
  });

  t('broken: a round is three minutes', () => assert.strictEqual(BC.SECONDS, 180));
  t('broken: the solver finds every way to fill the broken digits, with no leading zeros', () => {
    assert.deepStrictEqual(BC.solve('4?+25=7?'), ['50', '61', '72', '83', '94']);
    assert.deepStrictEqual(BC.solve('?+5=12'), ['7']);
    assert.deepStrictEqual(BC.solve('?7+1=8'), []);   // only 07 works, and a number may not start with 0
    assert.deepStrictEqual(BC.solve('12×?=36'), ['3']);
  });
  t('broken: every sum is right, and its broken digits have exactly one answer', () => {
    for (const score of [0, 2, 3, 6, 10, 15, 25]) for (let i = 0; i < 150; i++) {
      const q = BC.make(score, Math.random);
      const m = /^(\d+)([+\-×])(\d+)=(\d+)$/.exec(q.text);
      assert.ok(m && BC.calc(+m[1], m[2], +m[3]) === +m[4], q.text);
      assert.deepStrictEqual(BC.solve(q.masked), [q.answer], q.masked);
      assert.strictEqual(q.answer.length, (q.masked.match(/\?/g) || []).length);
      assert.notStrictEqual(q.text, '1+1=2', 'fell back to the spare sum at score ' + score);
    }
  });
  t('broken: sums get harder as the score goes up', () => {
    const holes = s => { const h = BC.stage(s).holes; return Array.isArray(h) ? h[1] : h; };
    assert.deepStrictEqual(BC.stage(0).ops, ['+']);
    assert.ok(BC.stage(10).ops.includes('×'));
    for (let s = 1; s < 30; s++) assert.ok(holes(s) >= holes(s - 1) && BC.stage(s).a[1] >= BC.stage(s - 1).a[1], 'score ' + s);
  });
  t('games: m:ss clock text', () => {
    assert.strictEqual(Kit.fmt(0), '0:00'); assert.strictEqual(Kit.fmt(59999), '0:59'); assert.strictEqual(Kit.fmt(180000), '3:00'); assert.strictEqual(Kit.fmt(-5), '0:00');
  });
}

/* v1.10.0 low fixes */
{
  const css = require('fs').readFileSync(require('path').join(__dirname, '../css/style.css'), 'utf8');
  t('R2.1 (v1.9.0): the bottom bar switches to small labels up to 365 px', () => assert.ok(/@media \(max-width: 365px\)/.test(css)));
  t('R2.2 (v1.9.0): very short screens have their own balloon layout', () => {
    assert.ok(/@media \(max-height: 520px\)/.test(css));
    assert.ok(/@media \(max-height: 430px\) and \(min-aspect-ratio: 1\/1\)\s*\{\s*#screen-game/.test(css));
  });
  t('R3.2 (v1.7.0): a figure that would draw NaN is not drawn and not kept', () => {
    const bad = { type: 'coord', xmin: 'a', xmax: 5, ymin: 0, ymax: 5 };
    const warn = console.warn; console.warn = () => {};
    try {
      assert.strictEqual(Fig.draws(bad), false);
      assert.strictEqual(Fig.render(bad, 'en'), '');
    } finally { console.warn = warn; }
    assert.ok(Fig.draws({ type: 'coord', xmin: 0, xmax: 5, ymin: 0, ymax: 5 }));
  });
}

/* v1.10.0 R3: answer to R2.1 */
t('R2.1 (v1.10.0): every easy Sudoku has an empty square next to a given number, which the flow uses for its clash', () => {
  const SD = require('../js/game-sudoku.js'), P = SD.peers(SD.LEVELS.easy);
  for (let i = 0; i < 2000; i++) {
    const g = SD.puzzle('easy', Math.random).grid;
    assert.ok(g.some((v, k) => !v && P[k].some(j => g[j])), JSON.stringify(g));
  }
});

/* v1.10.0 R2: answers to the R1 findings */
{
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const MM = require('../js/game-money.js');
  const box = { navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem() {} }, document: {} };
  box.window = box;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8'), box);
  const I18N = box.I18N;
  t('R1.6: one m:ss for the games (app.js uses GameKit.fmt); MoneyRules has no unused fmt', () => {
    assert.ok(/const fmtMs = ms => \(window\.GameKit \? window\.GameKit\.fmt\(ms\)/.test(app));
    assert.ok(!/padStart\(2, '0'\); };\s*\n\s*const gameRec/.test(app), 'a second m:ss copy is back in app.js');
    assert.strictEqual(MM.fmt, undefined);
  });
  t('R1.2 / R1.5: the new words exist in English and Chinese', () => {
    for (const k of ['broken.short', 'pz.timeShort', 'pz.leftShort', 'pz.questionShort', 'pz.pointsShort']) {
      for (const lang of ['en', 'zh']) {
        assert.ok(I18N.STRINGS[lang][k], lang + ' ' + k);
      }
    }
    assert.strictEqual(I18N.STRINGS.en['broken.short'].replace('{n}', 2), 'Digits still to type: 2');
  });
}

/* v1.10.0 R4: Use all the numbers, submit in one go, badge tips, remove from review */
{
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const N = require('../js/game-numbers.js'), Rec = require('../js/records.js');
  const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const box = { navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem() {} }, document: {} };
  box.window = box;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8'), box);
  const I18N = box.I18N;
  const ok = s => N.check([...s]);
  t('numbers: 15 kinds of card (0-9 + - × ÷ =), ten rounds', () => {
    assert.deepStrictEqual(N.CARDS, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '×', '÷', '=']);
    assert.strictEqual(N.MAX_ROUNDS, 10);
  });
  t('numbers: a true equation passes, in any order of sides, with × and ÷ before + and −', () => {
    for (const s of ['4+5=9', '9=4+5', '12÷3=4', '2+3×4=14', '7÷2×2=7', '0+0=0', '10-10=0', '12=3×4', '1+2+3=6', '8-2-1=5']) assert.ok(ok(s).ok, s);
  });
  t('numbers: wrong or broken rows fail with a reason', () => {
    const want = { '': 'empty', '4+5': 'noEquals', '4+5=9=9': 'twoEquals', '4+=9': 'shape', '+4=4': 'shape', '4=4+': 'shape', '4++5=9': 'shape',
      '05+1=6': 'lead', '3÷0=0': 'zero', '1+1=3': 'false', '7÷2=3': 'false' };
    for (const [s, r] of Object.entries(want)) assert.deepStrictEqual(ok(s), { ok: false, reason: r }, s);
  });
  t('numbers: digits side by side are one number (1 then 2 is 12)', () => {
    assert.ok(ok('12+3=15').ok);
    assert.ok(!ok('1+2+3=15').ok);
  });
  t('numbers: round n deals the cards of n true equations, shuffled, using only the 15 kinds', () => {
    for (let r = 1; r <= N.MAX_ROUNDS; r++) for (let i = 0; i < 300; i++) {
      const d = N.deal(r, Math.random);
      assert.strictEqual(d.solution.length, r);
      assert.ok(d.solution.every(s => ok(s).ok), JSON.stringify(d.solution));
      assert.deepStrictEqual(d.cards.slice().sort(), [...d.solution.join('')].sort());
      assert.ok(d.cards.every(c => N.CARDS.includes(c)));
      assert.strictEqual(d.cards.filter(c => c === '=').length, r);
    }
  });
  t('numbers: rounds start with + only, then add −, × and ÷', () => {
    assert.deepStrictEqual(N.stage(1).ops, ['+']);
    assert.deepStrictEqual(N.stage(2).ops, ['+', '-']);
    assert.ok(N.stage(3).ops.includes('×') && !N.stage(3).ops.includes('÷'));
    assert.deepStrictEqual(N.stage(4).ops, ['+', '-', '×', '÷']);
    for (let i = 0; i < 2000; i++) assert.ok(/^\d+\+\d+=\d+$/.test(N.equation(1, Math.random)));
  });
  t('numbers: a round passes only when every card is used and every row is true', () => {
    assert.ok(N.checkRound([['4', '+', '5', '=', '9']], 0).ok);
    assert.ok(!N.checkRound([['4', '+', '5', '=', '9']], 1).ok, 'a card left over fails the round');
    assert.ok(!N.checkRound([['4', '+', '5', '=', '9'], ['1', '=', '2']], 0).ok);
    assert.ok(!N.checkRound([['4', '+', '5', '=', '9'], []], 0).ok, 'an empty row fails');
  });
  t('R4: the new words exist in English and Chinese', () => {
    const keys = Object.keys(I18N.STRINGS.en).filter(k => /^(numbers\.|badge\.how\.|rev\.(remove|removeLabel|removed|undo)$|pz\.roundShort$)/.test(k));
    assert.ok(keys.length >= 40, String(keys.length));
    for (const k of keys) assert.ok(I18N.STRINGS.zh[k], 'zh ' + k);
    for (const k of ['badge.how.perfect', 'badge.how.firstTry', 'badge.how.speed']) assert.ok(I18N.STRINGS.en[k] && I18N.STRINGS.zh[k], k);
  });
  t('R4: See results marks typed but unchecked answers (first try, or the second after one wrong Check)', () => {
    assert.ok(/function markUnchecked\(q, st\)/.test(app));
    assert.ok(/tries: st\.tries \+ 1/.test(app));
    assert.ok(/filter\(i => !hasAnswer\(Q, i\)\)/.test(app), 'the reminder counts only questions with nothing chosen or typed');
  });
  t('R4: a question removed from the review list stays removed through a CSV export and import', () => {
    const w = { q: { en: '1 + 1 = ?' }, topic: 'add', type: 'num', answer: '2', given: ['3'] };
    const h = [{ date: 1700000000000, subject: 'maths', year: 4, topic: 'mixed', diff: 2, n: 5, correct: 3, wrong: [Object.assign({ reviewed: true }, w), w] }];
    const back = Rec.fromCSV(Rec.toCSV({ name: 'A' }, h, []));
    assert.deepStrictEqual(back.history[0].wrong.map(x => x.reviewed === true), [true, false]);
  });
}

/* v1.10.0 R6: answer to R5.1 */
{
  const fs = require('fs'), path = require('path');
  const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
  t('R5.1: an open tip is kept inside the part of the page the phone shows (visualViewport), not the widened page', () => {
    assert.ok(/vw = vv \? Math\.min\(innerWidth, vv\.width\) : innerWidth/.test(app));
    assert.ok(/if \(r\.right > x0 \+ vw - pad\)/.test(app));
  });
  t('R6: a question card cannot grow wider than the list for a long one-line formula', () => {
    assert.ok(/\.qlist > \* \{ min-width: 0; \}/.test(css));
  });
}

/* v1.10.0 R7: answer to R6.1 */
{
  const fs = require('fs'), path = require('path');
  const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
  t('R6.1 / R7.1: a long formula wraps at its spaces, and a long token is not split (it scrolls in its box)', () => {
    const rule = (css.match(/\n\.formula \{[^}]*\}/) || [""])[0];
    assert.ok(/white-space: normal;/.test(rule), rule);
    assert.ok(!/nowrap/.test(rule), rule);
    assert.ok(!/overflow-wrap|word-break/.test(rule), rule);
    assert.ok(/overflow-x: auto;/.test(rule), rule);
  });
}

/* v1.10.0 R9: K–6 study mode (Terry's 2026-11-09 request): NSW K–6 topics, Kindergarten, lessons */
{
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const box = { navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem() {} }, document: {} };
  box.window = box;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8'), box);
  const STR = box.I18N.STRINGS, LES = globalThis.LessonsK6, Rec = require('../js/records.js'), Sim = require('../js/similar.js');
  const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

  t('K–6: Kindergarten (0) to Year 6 each list the NSW topics, Kindergarten has no word problems or chance', () => {
    assert.deepStrictEqual(K6.YEARS, [0, 1, 2, 3, 4, 5, 6]);
    assert.deepStrictEqual(K6.topicsFor(0), ['k6place', 'k6add', 'k6mul', 'k6frac', 'k6len', 'k6mass', 'k6shape', 'k6time', 'k6data']);
    for (const y of [1, 2]) assert.ok(K6.topicsFor(y).includes('k6chance') && !K6.topicsFor(y).includes('k6word'));
    for (const y of [3, 4, 5, 6]) assert.strictEqual(K6.topicsFor(y).length, 11);
    assert.deepStrictEqual(K6.topicsFor(7), []);
  });
  t('K–6: every topic and year names generators that exist for the year they run at, and says what is new in both languages', () => {
    for (const y of K6.YEARS) for (const id of K6.topicsFor(y)) {
      assert.ok(K6.STRANDS.includes(K6.strandOf(id)), id);
      const w = K6.what(id, y);
      assert.ok(w && w.en && w.zh, `what ${y}:${id}`);
      for (const [gen, gy] of K6.gens(id, y)) {
        const g = G.SUBJECTS.maths[gen];
        assert.ok(g && g.minYear <= gy && gy <= g.maxYear, `${y}:${id} → ${gen} at ${gy}`);
      }
    }
  });
  t('K–6: one full lesson per topic and year, in English and Chinese, and no stray lessons', () => {
    let n = 0;
    for (const y of K6.YEARS) for (const id of K6.topicsFor(y)) {
      n++;
      const L = LES[y + ':' + id];
      assert.ok(L, 'no lesson ' + y + ':' + id);
      for (const lang of ['en', 'zh']) {
        const c = L[lang];
        assert.ok(c.intro && c.tip && c.points.length >= 3 && c.ex.length >= 2, `${y}:${id} ${lang}`);
        for (const [q, a] of c.ex) assert.ok(q && a, `${y}:${id} ${lang} example`);
        if (lang === 'zh') assert.ok(/[一-鿿]/.test(c.intro + c.tip), `${y}:${id} zh is Chinese`);
      }
    }
    assert.strictEqual(Object.keys(LES).length, n);
    assert.strictEqual(n, 73);
  });
  t('K–6: a 20-question set on any topic, year and level is full, on its topic and labelled with the year', () => {
    for (const y of K6.YEARS) for (const id of K6.topicsFor(y)) for (const d of [1, 2, 3, 4]) {
      const set = G.generateSet('maths', y, id, d, 20);
      assert.strictEqual(set.length, 20, `${y}:${id} d${d}`);
      assert.ok(set.every(q => q.topic === id && q.year === y && q.subject === 'maths'), `${y}:${id} d${d}`);
    }
  });
  t('K–6: Kindergarten keeps to small numbers (answers 20 or less) and has no competition problems', () => {
    for (let i = 0; i < 40; i++) for (const d of [1, 2, 3, 4]) for (const q of G.generateSet('maths', 0, 'mixed', d, 15)) {
      assert.ok(!q.olympiad && K6.inYear(q.topic, 0), q.topic);
      if (q.type === 'input') assert.ok(q.value >= 0 && q.value <= 20, q.q.en + ' = ' + q.value);
    }
  });
  t('K–6: only the K–6 question types may offer two choices; all others keep at least three', () => {
    for (const subject of ['maths', 'ga']) for (const y of [1, 4, 8]) for (const q of G.generateSet(subject, y, 'mixed', 2, 30)) {
      if (q.type === 'mc' && q.choices.length < 3) assert.ok(/^k[a-z]+$/.test(q.ref.gen), q.ref.gen);
    }
  });
  t('K–6: every K–6 topic, question type, study word and Kindergarten exist in English and Chinese', () => {
    const keys = ['year.0', 'year.0short', 'study.open', 'mode.study', 'mode.practice', 'mode.test', 'study.heading', 'study.intro', 'study.year', 'study.source',
      'study.strand.num', 'study.strand.mes', 'study.strand.sta', 'study.done', 'study.back', 'study.newThisYear', 'study.keyIdeas', 'study.examples',
      'study.example', 'study.tip', 'study.practise', 'study.practiseNote', 'study.next',
      ...K6.ORDER.map(k => 'topic.' + k), ...Object.keys(G.SUBJECTS.maths).filter(k => /^k[a-z]+$/.test(k) && !K6.has(k)).map(k => 'topic.' + k)];
    for (const lang of ['en', 'zh']) for (const k of keys) assert.ok(STR[lang][k], lang + ' ' + k);
  });
  t('K–6: Home lists the K–6 topics (and competition problems from Year 1) for Kindergarten to Year 6 maths', () => {
    assert.ok(/if \(subject === 'maths' && year <= 6 && window\.ScopeK6\) return ScopeK6\.topicsFor\(year\)/.test(app));
    assert.ok(/Gen\.PRIMARY\.filter\(y => y > 0 \|\| st\.subject === 'maths'\)/.test(app), 'Kindergarten is offered for maths only');
  });
  t('K–6: a Kindergarten session and badge keep year 0 through the progress file', () => {
    const h = [{ date: 1762400000000, subject: 'maths', year: 0, topic: 'k6add', diff: 1, n: 5, correct: 5, stars: 3, time: null, byTopic: { k6add: [5, 5] }, wrong: [] }];
    const b = [{ date: 1762400000000, kind: 'perfect', subject: 'maths', year: 0, diff: 1, n: 5 }];
    const back = Rec.fromCSV(Rec.toCSV({ name: 'K' }, h, b));
    assert.strictEqual(back.history[0].year, 0);
    assert.strictEqual(back.badges[0].year, 0);
    assert.strictEqual(Rec.levelOf(b[0]), 'maths:0:1');
    // a timed paper with no year stays without one
    const t2 = Rec.fromCSV(Rec.toCSV({ name: 'S' }, [{ date: 1762500000000, subject: 'sel', topic: 'sel', diff: 2, n: 35, correct: 30, stars: 2, time: 1800000, byTopic: {}, wrong: [] }], []));
    assert.ok(t2.history[0].year == null, "a timed paper must not become Kindergarten: " + t2.history[0].year);
  });
  t('K–6: similar questions keep the K–6 topic and the student year (Kindergarten too)', () => {
    for (const [y, id] of [[0, 'k6add'], [3, 'k6len'], [6, 'k6shape'], [1, 'k6chance']]) for (const q of G.generateSet('maths', y, id, 2, 3)) {
      const out = Sim.make(q, 3);
      assert.ok(out.length >= 2, `${y}:${id} only ${out.length}`);
      assert.ok(out.every(x => x.topic === id && x.year === y), `${y}:${id}`);
    }
  });
}

/* v1.10.0 R9: answer to R8.1 (the long-number flow checks scroll reach, not only overflow) */
{
  const fs = require('fs'), path = require('path');
  const flows = fs.readFileSync(path.join(__dirname, 'flows.js'), 'utf8');
  t('R8.1: the R7.1 flow scrolls the long number to its end and checks the last digit comes into the box', () => {
    assert.ok(/f\.scrollLeft = 1e9/.test(flows));
    assert.ok(/reach/.test(flows) && /lastIn/.test(flows));
  });
}

/* v1.10.0 R10: answers to the R9 findings */
{
  const Rec = require('../js/records.js');
  t('R9.1: a Kindergarten-only question type stays in Kindergarten (a top year of 0 is kept)', () => {
    for (const k of ['kcount', 'kaddsub', 'kpattern']) assert.strictEqual(G.SUBJECTS.maths[k].maxYear, 0, k);
    for (const k of Object.keys(G.SUBJECTS.maths).filter(k => /^k[a-z]+$/.test(k))) assert.ok(G.SUBJECTS.maths[k].maxYear <= 6, k);
    for (const y of [7, 8, 9, 10, 11, 12, 13, 14]) {
      assert.deepStrictEqual(G.topicsFor('maths', y).filter(k => /^k[a-z]+$/.test(k)), [], 'year ' + y);
      for (let i = 0; i < 25; i++) for (const q of G.generateSet('maths', y, 'mixed', 2, 20)) assert.ok(!/^k[a-z]+$/.test(q.ref.gen) && !K6.has(q.topic), y + ' ' + q.ref.gen);
    }
  });
  t('R9.2: the Kindergarten AI brief asks for counting to 20, no word-problem share and no "harder than Australian" level', () => {
    const names = K6.topicsFor(0).map(k => [k, k]);
    for (const topic of ['mixed', 'k6add']) for (const d of [1, 2, 3, 4]) {
      const p = AI.buildPrompt('maths', 0, topic, d, 5, names);
      assert.ok(/Kindergarten/.test(p) && /within 20/.test(p), 'level');
      assert.ok(!/harder than Australian/.test(p) && !/word problems \(应用题\)/.test(p) && !/Include some word problems/.test(p), topic + ' d' + d);
    }
    const y1 = AI.buildPrompt('maths', 1, 'mixed', 2, 5, K6.topicsFor(1).map(k => [k, k]));
    assert.ok(/harder than Australian/.test(y1) && /word problems \(应用题\)/.test(y1), 'Year 1 unchanged');
  });
  t('R9.3: Kindergarten is a school year: by age, entered in a profile, moving up, and through the progress file', () => {
    const nov = new Date(2026, 10, 9);
    assert.strictEqual(Rec.suggestYear({ dob: '2021-03' }, nov), 0);
    assert.strictEqual(Rec.suggestYear({ schoolYear: 0, schoolYearSet: 2026 }, nov), 0);
    assert.strictEqual(Rec.suggestYear({ schoolYear: 0, schoolYearSet: 2026 }, new Date(2027, 1, 1)), 1);
    assert.strictEqual(Rec.suggestYear({ schoolYear: 0, schoolYearSet: 2026, dob: '2016-03' }, nov), 0, 'school year 0 wins over birth month');
    const back = Rec.fromCSV(Rec.toCSV({ name: 'K', schoolYear: 0, schoolYearSet: 2026, dob: '2021-03' }, [], []));
    assert.strictEqual(back.student.schoolYear, 0);
    assert.strictEqual(Rec.fromCSV(Rec.toCSV({ name: 'N' }, [], [])).student.schoolYear, null);
  });
  t('R9.5: a "Which is lighter?" method names the lighter thing', () => {
    let seen = 0;
    for (let i = 0; i < 400; i++) { const q = G.SUBJECTS.maths.kmass.fn(0, 1); if (!q || !/lighter/.test(q.q.en)) continue; seen++; assert.ok(/lighter/.test(q.sol.en) && !/heavier/.test(q.sol.en) && /更轻/.test(q.sol.zh), q.sol.en); }
    assert.ok(seen > 50, 'only ' + seen);
  });
  t('R9.6: 12 pm in 24-hour time keeps the hour 12, and no method adds 12 to 12', () => {
    let noon = 0;
    for (let i = 0; i < 6000; i++) for (const y of [5, 6]) {
      const q = G.SUBJECTS.maths.ktime.fn(y, 2); if (!q || !/24-hour/.test(q.q.en)) continue;
      assert.ok(!/12 \+ 12/.test(q.sol.en), q.sol.en);
      if (/^Write 12:\d\d pm/.test(q.q.en)) { noon++; assert.ok(/stays 12/.test(q.sol.en) && /中午/.test(q.sol.zh), q.sol.en); }
    }
    assert.ok(noon > 5, 'only ' + noon);
  });
  t('R10.1: the Kindergarten AI brief has no grade-level, multi-step or olympiad difficulty at any level', () => {
    const names = K6.topicsFor(0).map(k => [k, k]);
    const seen = new Set();
    for (const topic of ['mixed', 'k6add']) for (const d of [1, 2, 3, 4]) {
      const p = AI.buildPrompt('maths', 0, topic, d, 5, names);
      assert.ok(!/two or three steps|multi-step and non-routine|OLYMPIAD|AMO|AIMO|AMC|China \/ Singapore|TUTORING-CENTRE/.test(p), topic + ' d' + d + ': ' + p);
      const line = (p.match(/^Difficulty: (.*)$/m) || [])[1];
      assert.ok(line && /Kindergarten/.test(line) && /one step/.test(line) && /within (10|20)/.test(line), topic + ' d' + d + ': ' + line);
      seen.add(line);
    }
    assert.strictEqual(seen.size, 4, 'each level has its own Kindergarten line');
    const y1 = AI.buildPrompt('maths', 1, 'mixed', 2, 5, K6.topicsFor(1).map(k => [k, k]));
    assert.ok(/two or three steps/.test(y1), 'Year 1 keeps the grade-level difficulty');
    assert.ok(/OLYMPIAD/.test(AI.buildPrompt('maths', 1, 'mixed', 4, 5, K6.topicsFor(1).map(k => [k, k]))), 'Year 1 Challenge unchanged');
  });
  t('R10.2: 12-hour time methods are right at 12 pm (hour stays 12) and at 00 (written 12 am), and say the take-away sum otherwise', () => {
    let noon = 0, midnight = 0;
    for (let i = 0; i < 6000; i++) for (const y of [5, 6]) {
      const q = G.SUBJECTS.maths.ktime.fn(y, 2); if (!q || !/12-hour/.test(q.q.en)) continue;
      const h = +q.q.en.match(/Write (\d\d):/)[1];
      assert.ok(!/12 is after 12/.test(q.sol.en) && !/12 大于 12/.test(q.sol.zh), q.sol.en);
      if (h === 12) { noon++; assert.ok(/stays 12/.test(q.sol.en) && /pm/.test(q.sol.en) && /中午/.test(q.sol.zh), q.sol.en); }
      else if (h === 0) { midnight++; assert.ok(/midnight/.test(q.sol.en) && /12:\d\d am/.test(q.sol.en) && /午夜/.test(q.sol.zh), q.sol.en); }
      else if (h > 12) assert.ok(q.sol.en.includes(`${h} − 12 = ${h - 12}`), q.sol.en);
    }
    assert.ok(noon > 5 && midnight > 5, 'noon ' + noon + ', midnight ' + midnight);
  });
  t('R9.4: the long-number flow also needs a box a finger can swipe, and checks hidden and clip fail', () => {
    const flows = require('fs').readFileSync(require('path').join(__dirname, 'flows.js'), 'utf8');
    assert.ok(/getComputedStyle\(f\)\.overflowX/.test(flows) && /\['hidden', 'clip'\]/.test(flows));
  });
}

/* v1.11.0 W1: release notes. Every item has a title and a how-to in both languages; newest first; the top entry is this
   version; history starts at v1.10.0 (Terry, 2026-11-11); every "Show me" target is on the page. */
{
  const fs = require('fs'), path = require('path'), vm = require('vm'), root = path.join(__dirname, '..');
  const box = { navigator: { language: 'en' }, localStorage: { getItem: () => null, setItem() {} }, document: {} };
  box.window = box; box.self = box;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8'), box);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'version.js'), 'utf8'), box);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/releases.js'), 'utf8'), box);
  const S = box.I18N.STRINGS, R = JSON.parse(JSON.stringify(box.RELEASES)), cmp = box.compareVersions;
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  t('releases: newest first, top entry is APP_VERSION, oldest is 1.10.0', () => {
    assert.strictEqual(R[0].v, box.APP_VERSION);
    assert.strictEqual(R[R.length - 1].v, '1.10.0');
    for (let i = 1; i < R.length; i++) assert.strictEqual(cmp(R[i - 1].v, R[i].v), 1, R[i - 1].v + ' before ' + R[i].v);
  });
  t('releases: every item has a title and a how-to in English and Chinese', () => {
    const keys = R.flatMap(r => r.items.flatMap(it => ['rel.' + r.v + '.' + it.id + 'T', 'rel.' + r.v + '.' + it.id]))
      .concat(['news.btn', 'news.title', 'news.history', 'news.version', 'news.current', 'news.show', 'news.close', 'news.closeHistory']);
    assert.deepStrictEqual(keys.filter(k => !S.en[k] || !S.zh[k] || S.zh[k] === S.en[k]), []);
  });
  t('releases: every Show me target is in index.html', () => {
    const sels = R.flatMap(r => r.items.map(it => it.show)).filter(Boolean);
    assert.deepStrictEqual(sels.filter(s => !html.includes('id="' + s.slice(1) + '"')), []);
  });
  t('releases: compareVersions orders by number, not by text', () => {
    assert.strictEqual(cmp('1.10.0', '1.9.0'), 1); assert.strictEqual(cmp('1.9.9', '1.10.0'), -1);
    assert.strictEqual(cmp('1.11.0', '1.11.0'), 0); assert.strictEqual(cmp('999.0.0', '1.11.0'), 1);
  });
  t('releases: release history text keeps no olympiad words on the levels (W2)', () => {
    assert.ok(!/olympiad|AMO/i.test(S.en['rel.1.11.0.levels'].split('.')[0]));
  });
  /* v1.11.0 W2: the four levels, one plain word each */
  t('levels: Core / Elevated / Challenging / Competitive and 基础 / 进阶 / 挑战 / 竞赛, also in the short form', () => {
    for (const p of ['diff.', 'diff.short.']) {
      assert.deepStrictEqual([1, 2, 3, 4].map(d => S.en[p + d]), ['Core', 'Elevated', 'Challenging', 'Competitive'], p);
      assert.deepStrictEqual([1, 2, 3, 4].map(d => S.zh[p + d]), ['基础', '进阶', '挑战', '竞赛'], p);
    }
  });
  t('levels: no old level name is left in the interface text', () => {
    const bad = /\b(Standard|Advanced) and\b|\bAdvanced and Challenge\b|Core \/ Standard|Advanced – tutoring-centre level|Challenge – olympiad \(AMO\) level|提高 \/|拓展和挑战|培优班水平/;
    const hits = ['en', 'zh'].flatMap(l => Object.entries(S[l]).filter(([, v]) => bad.test(v)).map(([k]) => l + ':' + k));
    assert.deepStrictEqual(hits, []);
  });
  /* v1.11.0 W3: the Get started banner is gone from Home */
  t('Home: no hero banner or Get started button', () => {
    assert.ok(!/class="hero"|id="heroStart"|id="heroSummary"/.test(html));
    assert.ok(/id="startBtn"/.test(html));
  });
  /* v1.12.0 W4: Home and the bottom bar (Terry's notes on the v1.11.0 screenshot) */
  t('W4: one start button on Home; no ▶ and no Students tab in the bottom bar; four tabs', () => {
    assert.ok(!/id="fabStart"|id="navStudents"|id="studyCard"|id="studyTopicBtn"|id="sourceLine"|id="subjectNote"/.test(html));
    const nav = (/<nav class="bottom-nav"[\s\S]*?<\/nav>/.exec(html) || [''])[0];
    assert.strictEqual((nav.match(/class="tab"/g) || []).length, 4);
  });
  t('W4: the header keeps only the language button; tour and parent lock are in Settings', () => {
    const header = (/<header class="top">[\s\S]*?<\/header>/.exec(html) || [''])[0];
    assert.ok(/id="langBtn"/.test(header) && !/id="tourBtn"|id="parentBtn"/.test(header));
    const settings = (/<section id="screen-parent"[\s\S]*?<\/section>/.exec(html) || [''])[0];
    assert.ok(/id="tourBtn"/.test(settings) && /id="newsBtn"/.test(settings) && /id="studentsBtn"/.test(settings) && /id="parentUnlock"/.test(settings));
  });
  t('W4: Relax replaces Games in both languages; the mode texts exist', () => {
    assert.strictEqual(S.en['nav.games'], 'Relax'); assert.strictEqual(S.zh['nav.games'], '放松');
    for (const k of ['mode.legend', 'mode.study', 'mode.study.sub', 'mode.practice', 'mode.practice.sub', 'mode.test', 'mode.test.sub', 'study.open', 'settings.tour', 'parent.unlock'])
      assert.ok(S.en[k] && S.zh[k] && S.en[k] !== S.zh[k], k);
  });
  /* v1.12.0 W6 (Terry chose Option B): four cards on Home; the options and Start in a sheet */
  t('W7: Home has the school switch, My plan, today\'s plan, four cards, Carry on and Friends; no week, Badges or Start', () => {
    const home = (/<section id="screen-home"[\s\S]*?<\/section>/.exec(html) || [''])[0];
    for (const id of ['schoolSwitch', 'planBtn', 'todayPlan', 'modeCards', 'cardStudy', 'cardPractice', 'cardTest', 'cardRelax', 'carryOn', 'friendsBox', 'inviteBtn']) assert.ok(home.includes('id="' + id + '"'), id);
    assert.ok(!/id="startBtn"|id="diffSel"|id="modeTiles"|id="weekCard"|id="badgeBox"|id="homeBadges"/.test(home));
    assert.ok(!/id="schoolSel"|id="schoolField"/.test(html), 'the school is chosen on Home only');
  });
  t('W7: My plan has the month, the days and a form to add to the plan', () => {
    const plan = (/<section id="screen-plan"[\s\S]*?<\/section>/.exec(html) || [''])[0];
    for (const id of ['planBack', 'calPrev', 'calNext', 'calMonth', 'calGrid', 'dayTitle', 'dayList', 'planForm', 'planWhat', 'planTopic', 'planCount', 'planRepeat', 'planAdd']) assert.ok(plan.includes('id="' + id + '"'), id);
  });
  t('W7: English and Chinese are not mixed: Primary school / High school, 小学 / 中学', () => {
    assert.strictEqual(S.en['school.primary'], 'Primary school'); assert.strictEqual(S.en['school.high'], 'High school');
    assert.strictEqual(S.zh['school.primary'], '小学'); assert.strictEqual(S.zh['school.high'], '中学');
  });
  t('R2.1 (v1.12.0): the sheet opens without showModal', () => {
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    assert.ok(app.includes("try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }"));
  });
  t('W6: the sheet holds the subject, the options, Start and Print', () => {
    const sheet = (/<dialog id="setupDlg"[\s\S]*?<\/dialog>/.exec(html) || [''])[0];
    for (const id of ['subjectBox', 'practiceOptions', 'selOptions', 'compOptions', 'startBtn', 'printHome', 'setupClose', 'studyNote']) assert.ok(sheet.includes('id="' + id + '"'), id);
  });
  t('W6: the new words are in English and Chinese', () => {
    const keys = ['mode.relax.sub', 'study.k6note', 'sheet.close', 'home.streak', 'home.streak1', 'home.streak0', 'home.carry', 'home.lastTime',
      'plan.my', 'plan.open', 'plan.today', 'plan.todayNone', 'plan.todayDone', 'plan.start', 'plan.make', 'plan.add', 'plan.weekly', 'plan.byParent', 'mode.study.soon', 'mode.study.soonNote',
      'friends.title', 'friends.soon', 'friends.invite', 'friends.note', 'friends.inviteSoon', 'tour.schoolT', 'tour.planT', 'tour.todayT', 'tour.friendsT',
      'tour.carryT', 'tour.carry', 'day.1', 'day.2', 'day.3', 'day.4', 'day.5', 'day.6', 'day.7'];
    assert.deepStrictEqual(keys.filter(k => !S.en[k] || !S.zh[k] || S.en[k] === S.zh[k]), []);
  });
  t('R1.5 (v1.12.0): release history names no single Start button; R1.6: tour.open is gone', () => {
    assert.ok(!/Start practice/.test(S.en['rel.1.11.0.start']) && !/开始练习/.test(S.zh['rel.1.11.0.start']));
    assert.ok(!('tour.open' in S.en) && !('tour.open' in S.zh));
  });
  t('R1.1 (v1.12.0): setMode keeps the Practice topic', () => {
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    assert.ok(/st\.pracTopic = st\.topic/.test(app) && /st\.topic = st\.pracTopic/.test(app));
  });
  t('W4: every topic the app offers has an emoji in the topic list', () => {
    const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    const icons = (/const TOPIC_ICON = \{([\s\S]*?)\n  \};/.exec(app) || [])[1] || '';
    const has = new Set([...icons.matchAll(/(\w+): '/g)].map(m => m[1]));
    const topics = Object.keys(S.en).filter(k => /^topic\./.test(k)).map(k => k.slice(6));
    const offered = topics.filter(k => k === 'mixed' || globalThis.Gen && (Object.keys(Gen.SUBJECTS.maths).includes(k) || Object.keys(Gen.SUBJECTS.ga).includes(k)) || /^k6/.test(k));
    assert.deepStrictEqual(offered.filter(k => !has.has(k)), []);
  });
}

console.log(`${pass} passed, ${fail} failed (${gen} generated questions checked)`);
process.exit(fail ? 1 : 0);
