/* Maths topics (typed answers). Calibrated to China (人教版) / Singapore (MOE) year levels.
   d = difficulty 1..4 (Core, Elevated, Challenging, Competitive). */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, gcd, lcm, round, MINUS, num, paren, sg, coef, fracStr, mk } = G;
  const MAXY = { quad: 12, index: 12, fin: 10, factor: 10, formula: 10 };
  const reg = (topic, minYear, fn) => G.register('maths', topic, minYear, fn, { maxYear: MAXY[topic] || 10 });
  const yt = b => (b < 0 ? ` ${MINUS} ` : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'y';
  /* v2.2.0 R4: from Year 7 the question kinds follow the lesson of that year (js/lessons-hs-*.js): one list per topic and year,
     each name a kind in that topic's generator. null = no list for that year (Primary, or a year with no High school lesson). */
  const KY = {
    frac: y => y === 7 ? ['equiv', 'add', 'add', 'mixed', 'toMixed'] : y === 8 ? ['mul', 'div', 'of', 'of', 'combo'] : null,
    pct: y => y === 7 ? ['of', 'whatpct', 'conv'] : y === 8 ? ['change', 'discount', 'profit'] : null,
    ratio: y => y === 7 ? ['simplify', 'share2', 'three'] : y === 8 ? ['speed', 'rate'] : null,
    stats: y => y === 7 ? ['freq', 'column', 'dot'] : y === 8 ? ['mean', 'median', 'mode', 'range'] : y === 9 ? ['stem', 'compare'] : y === 10 ? ['quart', 'box', 'scatter'] : null,
    meas: y => y === 7 ? ['rect', 'tri', 'para', 'areaconv'] : y === 8 ? ['circle', 'semi', 'ring', 'compound', 'prism'] : y === 9 ? ['prism', 'cyl', 'cylsa', 'volconv'] : y === 10 ? ['pyramid', 'cone', 'sphere', 'spheresa', 'conecsa'] : null,
    angle: y => y === 7 ? ['line', 'point', 'vert', 'parallel', 'corr'] : y === 8 ? ['tri', 'iso', 'ext', 'quad'] : y === 9 ? ['congr', 'similar', 'scalearea'] : y === 10 ? ['centre', 'semicirc', 'cyclic', 'tangent', 'sameseg'] : null,
    prob: y => y === 7 ? ['bag', 'dice', 'pctform'] : y === 8 ? ['not', 'twoway', 'venn'] : y === 9 ? ['count', 'dice', 'count'] : y === 10 ? ['two', 'norepl', 'paths'] : null,
    index: y => y === 7 ? ['pow', 'root', 'order'] : y === 9 ? ['law', 'neg', 'sci'] : y === 10 ? ['surd', 'simpsurd', 'fracidx', 'mulsurd'] : null,
    alg: y => y === 7 ? ['subst', 'like', 'two'] : y === 8 ? ['expand1', 'collect', 'brk', 'ineq', 'ineqneg'] : y === 9 ? ['algfrac', 'sides', 'fracEq'] : y === 10 ? ['sim', 'sim', 'expand'] : null,
    linear: y => y === 8 ? ['eval', 'table', 'onpoint', 'rule'] : y === 9 ? ['grad', 'xint', 'eqmc', 'yint'] : y === 10 ? ['eqpt', 'eqc', 'par', 'perp'] : null,
    quad: y => y === 9 ? ['big', 'small'] : y === 10 ? ['big', 'small', 'qf', 'opens'] : y === 11 || y === 12 ? ['disc', 'nroots', 'axis', 'cts', 'vertex'] : null,
    fin: (y, d) => y === 9 ? (d <= 1 ? ['si', 'siAmount', 'wage', 'gst'] : d === 2 ? ['si', 'siRate', 'siTime', 'overtime', 'commission', 'gst'] : ['siPrincipal', 'siTime', 'overtime', 'commission', 'gstBack']) : y === 10 ? (d <= 2 ? ['ci', 'ciInterest', 'dep'] : ['ci', 'ciInterest', 'dep', 'depInterest', 'ciHalf']) : null,
    factor: (y, d) => y === 9 ? (d <= 1 ? ['hcf', 'hcf', 'mcDsq'] : ['hcf2', 'mcDsq', 'dsq2', 'hcf2']) : y === 10 ? (d <= 1 ? ['trin', 'mcTrin'] : ['trin', 'mcTrin', 'hcfTrin', 'hcfTrin']) : null
  };
  const ky = (topic, y, d) => { const f = KY[topic] && KY[topic](y, d); return f ? pick(f) : null; };
  const zhNum = n => ({ 10: '十', 100: '百', 1000: '千', 10000: '万', 100000: '十万', 1000000: '百万', 10000000: '千万', 100000000: '亿' }[n]);

  /* ---------- Place value, rounding, significant figures ---------- */
  reg('place', 4, (y, d) => {
    if (y >= 8 && Math.random() < 0.5) {
      const sf = R(2, 3), x = round(R(1001, 99999) / 10 ** R(0, 6), 8);
      const p = 10 ** (Math.floor(Math.log10(Math.abs(x))) - sf + 1), r = round(Math.round(x / p) * p, 10);
      return mk({ topic: 'place', value: r, tol: 1e-9, en: `Round ${x} to ${sf} significant figures.`, zh: `把 ${x} 保留 ${sf} 位有效数字。`,
        solEn: `The first ${sf} significant figures, rounded: ${r}`, solZh: `从左边第一个非零数字起取 ${sf} 位并四舍五入：${r}` });
    }
    if (y >= 5 && Math.random() < 0.4) {
      const dp = Math.min(d, 3); let xi = R(10001, 999999); if (xi % 10 === 0) xi += 3;
      const x = round(xi / 10000 + R(0, 99), 4), r = round(x, dp);
      return mk({ topic: 'place', value: r, answer: r.toFixed(dp), tol: 1e-9, en: `Round ${x} to ${dp} decimal place${dp > 1 ? 's' : ''}.`, zh: `把 ${x} 四舍五入保留 ${dp} 位小数。`,
        solEn: `Look at decimal place ${dp + 1}: ${x} ≈ ${r.toFixed(dp)}`, solZh: `看第 ${dp + 1} 位小数：${x} ≈ ${r.toFixed(dp)}` });
    }
    const to = pick(d <= 1 ? [1000, 10000] : d === 2 ? [10000, 100000] : [1000000, 100000000]);
    const x = R(to * 3, to * 999) + R(1, 9);
    const r = Math.round(x / to) * to;
    if (d >= 3 && to >= 10000 && Math.random() < 0.5) {   // Chinese style: rewrite in 万 / 亿
      const unit = to >= 100000000 ? 100000000 : 10000, v = round(r / unit, 4);
      return mk({ topic: 'place', value: v, en: `Round ${x} to the nearest ${to.toLocaleString('en')} and write it in units of ${unit === 10000 ? 'ten thousand (万)' : 'hundred million (亿)'}.`,
        zh: `把 ${x} 四舍五入到${zhNum(to)}位，并改写成用“${unit === 10000 ? '万' : '亿'}”作单位的数（只写数字）。`,
        solEn: `${x} ≈ ${r} = ${v} × ${unit}`, solZh: `${x} ≈ ${r} = ${v}${unit === 10000 ? '万' : '亿'}` });
    }
    return mk({ topic: 'place', value: r, en: `Round ${x} to the nearest ${to.toLocaleString('en')}.`, zh: `把 ${x} 四舍五入到${zhNum(to)}位。`,
      solEn: `Look at the digit to the right of the ${to.toLocaleString('en')}s place: ${x} ≈ ${r}`, solZh: `看${zhNum(to)}位右边一位：${x} ≈ ${r}` });
  });

  /* ---------- Add & subtract (multi-step, larger numbers) ---------- */
  reg('addsub', 4, (y, d) => {
    const digits = Math.min(3 + d + Math.floor((y - 4) / 3), 6);
    const big = () => R(10 ** (digits - 1), 10 ** digits - 1);
    let a = big(), b = big(), c = R(10 ** (digits - 2), 10 ** (digits - 1));
    if (b > a) [a, b] = [b, a];
    if (d === 1) {
      if (Math.random() < 0.5) return mk({ topic: 'addsub', value: a + b, en: `Work out ${a} + ${b}`, zh: `计算：${a} + ${b}`, solEn: `Column addition: ${a + b}`, solZh: `竖式计算：${a + b}` });
      return mk({ topic: 'addsub', value: a - b, en: `Work out ${a} ${MINUS} ${b}`, zh: `计算：${a} ${MINUS} ${b}`, solEn: `Column subtraction: ${a - b}`, solZh: `竖式计算：${a - b}` });
    }
    if (d === 2) {
      const v = a - b + c;
      return mk({ topic: 'addsub', value: v, en: `Work out ${a} ${MINUS} ${b} + ${c}`, zh: `计算：${a} ${MINUS} ${b} + ${c}`,
        solEn: `Left to right: ${a - b} + ${c} = ${v}`, solZh: `从左往右：${a - b} + ${c} = ${v}` });
    }
    // missing number: a − □ + c = v  /  decimals at higher years
    if (y >= 6 && Math.random() < 0.5) {
      const p = R(1001, 99999) / 100, q = R(1001, 99999) / 100, r2 = R(101, 9999) / 100, v = round(p + q - r2, 2);
      return mk({ topic: 'addsub', value: v, en: `Work out ${p} + ${q} ${MINUS} ${r2}`, zh: `计算：${p} + ${q} ${MINUS} ${r2}`, solEn: `Line up decimal points: ${round(p + q, 2)} ${MINUS} ${r2} = ${v}`, solZh: `小数点对齐：${round(p + q, 2)} ${MINUS} ${r2} = ${v}` });
    }
    const m = R(10 ** (digits - 2), b), v = a - m + c;
    return mk({ topic: 'addsub', value: m, en: `Find the missing number: ${a} ${MINUS} □ + ${c} = ${v}`, zh: `求方框里的数：${a} ${MINUS} □ + ${c} = ${v}`,
      solEn: `${a} ${MINUS} □ = ${v} ${MINUS} ${c} = ${v - c}, so □ = ${a} ${MINUS} ${v - c} = ${m}`, solZh: `${a} ${MINUS} □ = ${v} ${MINUS} ${c} = ${v - c}，所以 □ = ${a} ${MINUS} ${v - c} = ${m}` });
  });

  /* ---------- Multiply & divide, order of operations ---------- */
  reg('muldiv', 4, (y, d) => {
    const k = pick(d === 1 ? ['mul', 'div'] : d === 2 ? ['mul', 'div', 'mix'] : ['mix', 'brk', 'div', 'mul']);
    if (k === 'mul') {
      const a = R(100, d >= 3 ? 9999 : 999), b = R(12, d >= 2 ? 999 : 99);
      return mk({ topic: 'muldiv', value: a * b, en: `Work out ${a} × ${b}`, zh: `计算：${a} × ${b}`, solEn: `Long multiplication: ${a} × ${b} = ${a * b}`, solZh: `竖式计算：${a} × ${b} = ${a * b}` });
    }
    if (k === 'div') {
      const b = R(12, d >= 3 ? 99 : 48), q = R(21, d >= 2 ? 999 : 99);
      return mk({ topic: 'muldiv', value: q, en: `Work out ${q * b} ÷ ${b}`, zh: `计算：${q * b} ÷ ${b}`, solEn: `${b} × ${q} = ${q * b}, so the answer is ${q}`, solZh: `因为 ${b} × ${q} = ${q * b}，所以商是 ${q}` });
    }
    if (k === 'mix') {
      const a = R(100, 999), b = R(12, 45), c = R(6, 25), e = R(3, 9), f = e * R(5, 30);
      const v = a + b * c - f / e;
      return mk({ topic: 'muldiv', value: v, en: `Work out ${a} + ${b} × ${c} ${MINUS} ${f} ÷ ${e}`, zh: `计算：${a} + ${b} × ${c} ${MINUS} ${f} ÷ ${e}`,
        solEn: `× and ÷ first: ${b} × ${c} = ${b * c}, ${f} ÷ ${e} = ${f / e}; then ${a} + ${b * c} ${MINUS} ${f / e} = ${v}`,
        solZh: `先乘除：${b} × ${c} = ${b * c}，${f} ÷ ${e} = ${f / e}；再加减：${a} + ${b * c} ${MINUS} ${f / e} = ${v}` });
    }
    const a = R(20, 90), b = R(11, 60), c = R(3, 15), e = R(2, 9), inner = (a + b) * c, f = e * R(2, 9), v = inner - (f * 10) / e;
    // [ (a + b) × c ] − f×10 ÷ e
    return mk({ topic: 'muldiv', value: v, en: `Work out (${a} + ${b}) × ${c} ${MINUS} ${f * 10} ÷ ${e}`, zh: `计算：(${a} + ${b}) × ${c} ${MINUS} ${f * 10} ÷ ${e}`,
      solEn: `Brackets first: ${a + b} × ${c} = ${inner}; ${f * 10} ÷ ${e} = ${f * 10 / e}; ${inner} ${MINUS} ${f * 10 / e} = ${v}`,
      solZh: `先算括号：${a + b} × ${c} = ${inner}；${f * 10} ÷ ${e} = ${f * 10 / e}；${inner} ${MINUS} ${f * 10 / e} = ${v}` });
  });

  /* ---------- Clever calculation 简便计算 ---------- */
  reg('mental', 4, (y, d) => {
    const k = pick(d <= 1 ? ['round', 'pair', 'dist'] : d === 2 ? ['pair', 'dist', 'round', 'near100'] : ['dist', 'near100', 'gauss', 'telescope'].filter(x => x !== 'telescope' || y >= 6));
    if (k === 'round') {
      const a = R(101, 999) * (d > 1 ? 10 : 1), b = pick([99, 98, 199, 999, 101, 1001]), v = a + b;
      return mk({ topic: 'mental', value: v, en: `Work out cleverly: ${a} + ${b}`, zh: `简便计算：${a} + ${b}`,
        solEn: `${b} = ${Math.round(b / 100) * 100} ${b > Math.round(b / 100) * 100 ? '+' : MINUS} ${Math.abs(b - Math.round(b / 100) * 100)}, so ${a} + ${b} = ${v}`,
        solZh: `把 ${b} 看成 ${Math.round(b / 100) * 100} ${b > Math.round(b / 100) * 100 ? '+' : MINUS} ${Math.abs(b - Math.round(b / 100) * 100)}：${a} + ${b} = ${v}` });
    }
    if (k === 'pair') {
      const [p, q] = pick([[25, 4], [125, 8], [25, 8], [125, 4], [50, 2], [5, 2]]), m = R(13, 99), v = p * q * m;
      return mk({ topic: 'mental', value: v, en: `Work out cleverly: ${p} × ${m} × ${q}`, zh: `简便计算：${p} × ${m} × ${q}`,
        solEn: `${p} × ${q} = ${p * q} first, then × ${m} = ${v}`, solZh: `先算 ${p} × ${q} = ${p * q}，再乘 ${m}，得 ${v}` });
    }
    if (k === 'dist') {
      const m = R(12, 99), a = R(21, 79), b = pick([100, 1000, 10]) - a, v = m * (a + b);
      if (b <= 0) return null;
      return mk({ topic: 'mental', value: v, en: `Work out cleverly: ${m} × ${a} + ${m} × ${b}`, zh: `简便计算：${m} × ${a} + ${m} × ${b}`,
        solEn: `${m} × (${a} + ${b}) = ${m} × ${a + b} = ${v}`, solZh: `${m} × (${a} + ${b}) = ${m} × ${a + b} = ${v}` });
    }
    if (k === 'near100') {
      const m = R(13, 99), b = pick([99, 101, 999, 1001, 98, 102]), v = m * b, base = Math.round(b / 100) * 100;
      return mk({ topic: 'mental', value: v, en: `Work out cleverly: ${m} × ${b}`, zh: `简便计算：${m} × ${b}`,
        solEn: `${m} × (${base} ${b > base ? '+' : MINUS} ${Math.abs(b - base)}) = ${m * base} ${b > base ? '+' : MINUS} ${m * Math.abs(b - base)} = ${v}`,
        solZh: `${m} × (${base} ${b > base ? '+' : MINUS} ${Math.abs(b - base)}) = ${m * base} ${b > base ? '+' : MINUS} ${m * Math.abs(b - base)} = ${v}` });
    }
    if (k === 'gauss') {
      const s = R(1, 20), step = pick([1, 2, 3, 5]), n = R(10, 40), last = s + (n - 1) * step, v = (s + last) * n / 2;
      return mk({ topic: 'mental', value: v, en: `Work out ${s} + ${s + step} + ${s + 2 * step} + … + ${last}`, zh: `计算：${s} + ${s + step} + ${s + 2 * step} + … + ${last}`,
        solEn: `There are (${last} ${MINUS} ${s}) ÷ ${step} + 1 = ${n} terms. Sum = (first + last) × terms ÷ 2 = (${s} + ${last}) × ${n} ÷ 2 = ${v}`,
        solZh: `共 (${last} ${MINUS} ${s}) ÷ ${step} + 1 = ${n} 项。和 = (首项 + 末项) × 项数 ÷ 2 = (${s} + ${last}) × ${n} ÷ 2 = ${v}` });
    }
    const n = R(4, 19);   // telescoping 1/(1×2) + ... + 1/(n(n+1)) = n/(n+1)
    return mk({ topic: 'mental', value: n / (n + 1), answer: fracStr(n, n + 1), en: `Work out 1/(1×2) + 1/(2×3) + 1/(3×4) + … + 1/(${n}×${n + 1}). Give a fraction.`,
      zh: `计算：1/(1×2) + 1/(2×3) + 1/(3×4) + … + 1/(${n}×${n + 1})，用分数表示。`,
      solEn: `Each term 1/(k(k+1)) = 1/k ${MINUS} 1/(k+1); the middle terms cancel: 1 ${MINUS} 1/${n + 1} = ${n}/${n + 1}`,
      solZh: `裂项：1/(k(k+1)) = 1/k ${MINUS} 1/(k+1)，中间项相互抵消：1 ${MINUS} 1/${n + 1} = ${n}/${n + 1}` });
  });

  /* ---------- Number theory 数论 ---------- */
  reg('numth', 4, (y, d) => {
    const k = pick(d <= 1 ? ['hcf', 'lcm', 'factors'] : ['hcf', 'lcm', 'factors', 'remainder', 'remainder', 'digits']);
    if (k === 'hcf' || k === 'lcm') {
      const g = R(2, d >= 3 ? 24 : 12), a = g * R(2, 9), b = g * R(2, 11);
      if (a === b) return null;
      const v = k === 'hcf' ? gcd(a, b) : lcm(a, b);
      return mk({ topic: 'numth', value: v, en: `Find the ${k === 'hcf' ? 'highest common factor (HCF)' : 'lowest common multiple (LCM)'} of ${a} and ${b}.`,
        zh: `求 ${a} 和 ${b} 的${k === 'hcf' ? '最大公因数' : '最小公倍数'}。`,
        solEn: `HCF(${a}, ${b}) = ${gcd(a, b)}${k === 'lcm' ? `; LCM = ${a} × ${b} ÷ ${gcd(a, b)} = ${v}` : ''}`,
        solZh: `最大公因数是 ${gcd(a, b)}${k === 'lcm' ? `；最小公倍数 = ${a} × ${b} ÷ ${gcd(a, b)} = ${v}` : ''}` });
    }
    if (k === 'factors') {
      const n = pick(d <= 1 ? [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48] : [60, 72, 84, 90, 96, 100, 120, 144, 180, 210, 360]);
      let c = 0; const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) { c++; f.push(i); }
      return mk({ topic: 'numth', value: c, en: `How many factors does ${n} have?`, zh: `${n} 一共有多少个因数？`,
        solEn: `Factors: ${f.join(', ')} → ${c}`, solZh: `因数有：${f.join('、')}，共 ${c} 个` });
    }
    if (k === 'remainder') {
      // smallest number > 1 that leaves remainder r when divided by each of a, b (and c)
      const set = pick(d >= 3 ? [[3, 4, 5], [4, 5, 6], [3, 5, 7], [2, 3, 7], [4, 6, 9]] : [[3, 4], [4, 5], [5, 6], [3, 7], [6, 8]]);
      const r = R(1, Math.min(...set) - 1), L = set.reduce(lcm), v = L + r;
      return mk({ topic: 'numth', value: v, en: `What is the smallest number greater than ${r} that leaves remainder ${r} when divided by ${set.join(', ')}?`,
        zh: `一个大于 ${r} 的数分别除以 ${set.join('、')} 都余 ${r}，这个数最小是多少？`,
        solEn: `The number minus ${r} is a common multiple of ${set.join(', ')}; the LCM is ${L}, so ${L} + ${r} = ${v}`,
        solZh: `这个数减去 ${r} 是 ${set.join('、')} 的公倍数，最小公倍数是 ${L}，所以 ${L} + ${r} = ${v}` });
    }
    // digit sum / divisibility: smallest 4-digit multiple of m
    const m = pick([7, 9, 11, 12, 13, 15, 17]), low = 10 ** (d >= 3 ? 4 : 3), v = Math.ceil(low / m) * m;
    return mk({ topic: 'numth', value: v, en: `What is the smallest ${d >= 3 ? 'five' : 'four'}-digit number that is a multiple of ${m}?`,
      zh: `能被 ${m} 整除的最小${d >= 3 ? '五' : '四'}位数是多少？`,
      solEn: `${low} ÷ ${m} = ${Math.floor(low / m)} r ${low % m}, so the next multiple is ${m} × ${Math.ceil(low / m)} = ${v}`,
      solZh: `${low} ÷ ${m} = ${Math.floor(low / m)} 余 ${low % m}，所以下一个倍数是 ${m} × ${Math.ceil(low / m)} = ${v}` });
  });

  /* ---------- Sequences & patterns 找规律 ---------- */
  reg('pattern', 4, (y, d) => {
    const k = pick(y >= 8 && d >= 2 ? ['nth', 'sum', 'which', 'nthq'] : d >= 3 ? ['nth', 'sum', 'which'] : ['nth', 'which']);
    const a = R(1, 15), s = R(2, d >= 3 ? 13 : 7);
    const seq = [0, 1, 2, 3].map(i => a + i * s).join(', ');
    if (k === 'nth') {
      const n = R(15, d >= 3 ? 200 : 60), v = a + (n - 1) * s;
      return mk({ topic: 'pattern', value: v, en: `The sequence ${seq}, … continues. What is term number ${n}?`, zh: `数列 ${seq}，…… 按规律排列，第 ${n} 个数是多少？`,
        solEn: `It increases by ${s} each time: term n = ${a} + (n ${MINUS} 1) × ${s} = ${a} + ${n - 1} × ${s} = ${v}`,
        solZh: `每次增加 ${s}：第 n 项 = ${a} + (n ${MINUS} 1) × ${s} = ${a} + ${n - 1} × ${s} = ${v}` });
    }
    if (k === 'which') {
      const n = R(12, 80), v = a + (n - 1) * s;
      return mk({ topic: 'pattern', value: n, en: `In the sequence ${seq}, …, which term number is ${v}?`, zh: `在数列 ${seq}，…… 中，${v} 是第几个数？`,
        solEn: `(${v} ${MINUS} ${a}) ÷ ${s} + 1 = ${n}`, solZh: `(${v} ${MINUS} ${a}) ÷ ${s} + 1 = ${n}` });
    }
    if (k === 'sum') {
      const n = R(10, 30), last = a + (n - 1) * s, v = (a + last) * n / 2;
      return mk({ topic: 'pattern', value: v, en: `Find the sum of the first ${n} terms of ${seq}, …`, zh: `求数列 ${seq}，…… 前 ${n} 项的和。`,
        solEn: `Term ${n} = ${last}; sum = (${a} + ${last}) × ${n} ÷ 2 = ${v}`, solZh: `第 ${n} 项是 ${last}；和 = (${a} + ${last}) × ${n} ÷ 2 = ${v}` });
    }
    const b = R(1, 3), c = R(-3, 5), f = n => b * n * n + c, n = R(8, 20), v = f(n);   // quadratic sequence
    return mk({ topic: 'pattern', value: v, en: `The sequence ${[1, 2, 3, 4].map(f).map(num).join(', ')}, … follows a rule. Find term number ${n}.`,
      zh: `数列 ${[1, 2, 3, 4].map(f).map(num).join('，')}，…… 按规律排列，求第 ${n} 个数。`,
      solEn: `Second differences are constant (${2 * b}), so term n = ${b === 1 ? '' : b}n²${sg(c)}; n = ${n}: ${num(v)}`,
      solZh: `二次差恒为 ${2 * b}，通项为 ${b === 1 ? '' : b}n²${sg(c)}；n = ${n} 时为 ${num(v)}` });
  });

  /* ---------- Fractions ---------- */
  reg('frac', 4, (y, d) => {
    const dens = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
    const k = ky('frac', y, d) || (y <= 4 ? pick(['add', 'of', 'mixed']) : y === 5 ? pick(['add', 'mixed', 'mul', 'of']) : pick(['mixed', 'mul', 'div', 'combo', 'combo']));
    const fr = () => { const den = pick(dens); return [R(1, den - 1), den]; };
    const show = (n, dd) => fracStr(n, dd);
    if (k === 'of') {
      const den = pick(dens), n = R(1, den - 1), m = R(2, 30), amt = den * m * (d >= 3 ? R(2, 5) : 1), v = amt / den * n;
      return mk({ topic: 'frac', value: v, en: `What is ${n}/${den} of ${amt}?`, zh: `${amt} 的 ${n}/${den} 是多少？`, solEn: `${amt} ÷ ${den} × ${n} = ${v}`, solZh: `${amt} ÷ ${den} × ${n} = ${v}` });
    }
    if (k === 'mixed') {   // mixed numbers  a b/c ± d e/f
      const [n1, d1] = fr(), [n2b, d2b] = fr(), [n2, d2] = y <= 4 ? [R(1, d1 - 1), d1] : [n2b, d2b], w1 = R(2, 9), w2 = R(1, w1 - 1), add = d === 1 ? true : Math.random() < 0.5;
      const N = (w1 * d1 + n1) * d2 + (add ? 1 : -1) * (w2 * d2 + n2) * d1, D = d1 * d2;
      const g = gcd(N, D), nn = N / g, dd = D / g, whole = Math.floor(nn / dd), rem = nn - whole * dd;
      const ans = rem === 0 ? String(whole) : whole ? `${whole} ${rem}/${dd}` : `${rem}/${dd}`;
      return mk({ topic: 'frac', value: N / D, answer: ans, en: `Work out ${w1} ${n1}/${d1} ${add ? '+' : MINUS} ${w2} ${n2}/${d2}. (A mixed number or fraction is fine.)`,
        zh: `计算：${w1} ${n1}/${d1} ${add ? '+' : MINUS} ${w2} ${n2}/${d2}（可以写带分数或假分数）`,
        solEn: `As improper fractions: ${w1 * d1 + n1}/${d1} ${add ? '+' : MINUS} ${w2 * d2 + n2}/${d2} = ${show(N, D)} = ${ans}`,
        solZh: `化成假分数：${w1 * d1 + n1}/${d1} ${add ? '+' : MINUS} ${w2 * d2 + n2}/${d2} = ${show(N, D)} = ${ans}` });
    }
    if (k === 'combo') {   // a/b × c/d + e/f ÷ g/h
      const [a, b] = fr(), [c, dd] = fr(), [e, f] = fr(), [g, h] = fr();
      const N = a * c * f * g + e * h * b * dd, D = b * dd * f * g;
      return mk({ topic: 'frac', value: N / D, answer: show(N, D), en: `Work out ${a}/${b} × ${c}/${dd} + ${e}/${f} ÷ ${g}/${h}. Give your answer as a fraction.`,
        zh: `计算：${a}/${b} × ${c}/${dd} + ${e}/${f} ÷ ${g}/${h}，用分数表示。`,
        solEn: `× and ÷ first: ${show(a * c, b * dd)} + ${show(e * h, f * g)} = ${show(N, D)}`, solZh: `先乘除：${show(a * c, b * dd)} + ${show(e * h, f * g)} = ${show(N, D)}` });
    }
    if (k === 'equiv') {   // Year 7: equivalent fractions
      const [n, dd] = fr(), m = R(2, 6);
      if (Math.random() < 0.5) return mk({ topic: 'frac', value: n * m, en: `${n}/${dd} = ?/${dd * m}. What is the missing top number?`, zh: `${n}/${dd} = ?/${dd * m}，缺的分子是多少？`, solEn: `${dd} × ${m} = ${dd * m}, so ${n} × ${m} = ${n * m}`, solZh: `分母 ${dd} × ${m} = ${dd * m}，所以分子 ${n} × ${m} = ${n * m}` });
      return mk({ topic: 'frac', value: dd, en: `${n * m}/${dd * m} = ${n}/?. What is the missing bottom number?`, zh: `${n * m}/${dd * m} = ${n}/?，缺的分母是多少？`, solEn: `Divide the top and bottom by ${m}: ${n * m} ÷ ${m} = ${n}, ${dd * m} ÷ ${m} = ${dd}`, solZh: `分子分母同时除以 ${m}：${n * m} ÷ ${m} = ${n}，${dd * m} ÷ ${m} = ${dd}` });
    }
    if (k === 'toMixed') {   // Year 7: improper fraction to mixed number
      const dd = pick([3, 4, 5, 6, 7, 8]), w = R(1, 6), r = R(1, dd - 1), N = w * dd + r;
      return mk({ topic: 'frac', value: N / dd, answer: `${w} ${r}/${dd}`, en: `Write ${N}/${dd} as a mixed number.`, zh: `把 ${N}/${dd} 写成带分数。`, solEn: `${N} ÷ ${dd} = ${w} remainder ${r}, so ${w} ${r}/${dd}`, solZh: `${N} ÷ ${dd} = ${w}……${r}，所以是 ${w} ${r}/${dd}` });
    }
    let [n1, d1] = fr(), [n2, d2] = fr(), op, N, D;
    if (k === 'mul') { op = '×'; N = n1 * n2; D = d1 * d2; }
    else if (k === 'div') { op = '÷'; N = n1 * d2; D = d1 * n2; }
    else {
      op = Math.random() < 0.5 ? '+' : MINUS;
      if (op === MINUS && n1 * d2 < n2 * d1) [n1, d1, n2, d2] = [n2, d2, n1, d1];
      N = op === '+' ? n1 * d2 + n2 * d1 : n1 * d2 - n2 * d1; D = d1 * d2;
      if (N === 0) return null;
    }
    const L = lcm(d1, d2);
    return mk({ topic: 'frac', value: N / D, answer: show(N, D), en: `Work out ${n1}/${d1} ${op} ${n2}/${d2}. Give your answer as a fraction.`, zh: `计算 ${n1}/${d1} ${op} ${n2}/${d2}，用分数表示。`,
      solEn: op === '×' ? `Multiply tops and bottoms, then simplify: ${show(N, D)}` : op === '÷' ? `Multiply by the reciprocal: ${n1}/${d1} × ${d2}/${n2} = ${show(N, D)}` : `Common denominator ${L}: ${n1 * L / d1}/${L} ${op} ${n2 * L / d2}/${L} = ${show(N, D)}`,
      solZh: op === '×' ? `分子乘分子，分母乘分母，再约分：${show(N, D)}` : op === '÷' ? `乘除数的倒数：${n1}/${d1} × ${d2}/${n2} = ${show(N, D)}` : `通分（公分母 ${L}）：${n1 * L / d1}/${L} ${op} ${n2 * L / d2}/${L} = ${show(N, D)}` });
  });

  /* ---------- Decimals ---------- */
  reg('dec', 4, (y, d) => {
    const k = pick(y <= 4 ? ['addsub', 'shift'] : ['addsub', 'mul', 'div', 'mul', 'shift']);
    if (k === 'mul') {
      const a = R(11, d >= 3 ? 9999 : 999) / 100, b = R(11, d >= 2 ? 999 : 99) / 10, v = round(a * b, 6);
      return mk({ topic: 'dec', value: v, en: `Work out ${a} × ${b}`, zh: `计算：${a} × ${b}`, solEn: `Multiply as whole numbers, then count decimal places: ${v}`, solZh: `先按整数相乘，再数小数位数：${v}` });
    }
    if (k === 'div') {
      const b = pick([0.2, 0.4, 0.5, 0.8, 1.2, 1.5, 2.5, 0.25, 0.04, 3.2]), q = R(11, d >= 3 ? 999 : 99) / (d >= 2 ? 10 : 1), a = round(b * q, 6);
      return mk({ topic: 'dec', value: q, en: `Work out ${a} ÷ ${b}`, zh: `计算：${a} ÷ ${b}`, solEn: `Make the divisor whole: multiply both by ${10 ** (String(b).split('.')[1] || '').length}. Answer ${q}`, solZh: `把除数化成整数（两数同时扩大 ${10 ** (String(b).split('.')[1] || '').length} 倍），商是 ${q}` });
    }
    if (k === 'shift') {
      const a = R(11, 99999) / 1000, p = pick([10, 100, 1000]), mul = Math.random() < 0.5, v = round(mul ? a * p : a / p, 8);
      return mk({ topic: 'dec', value: v, en: `Work out ${a} ${mul ? '×' : '÷'} ${p}`, zh: `计算：${a} ${mul ? '×' : '÷'} ${p}`,
        solEn: `Move the decimal point ${String(p).length - 1} place(s) to the ${mul ? 'right' : 'left'}: ${v}`, solZh: `小数点向${mul ? '右' : '左'}移动 ${String(p).length - 1} 位：${v}` });
    }
    const dp = d === 1 ? 2 : 3, sc = 10 ** dp;
    let ai = R(1000, 99999), bi = R(100, 99999), ci = R(100, 9999);
    const v = round((ai - bi + ci) / sc, dp);
    if (ai - bi + ci <= 0) return null;
    return mk({ topic: 'dec', value: v, en: `Work out ${ai / sc} ${MINUS} ${bi / sc} + ${ci / sc}`, zh: `计算：${ai / sc} ${MINUS} ${bi / sc} + ${ci / sc}`, solEn: `Line up the decimal points: ${v}`, solZh: `小数点对齐计算：${v}` });
  });

  /* ---------- Percentages ---------- */
  reg('pct', 5, (y, d) => {
    const k = ky('pct', y, d) || (pick(y <= 5 ? ['of', 'whatpct'] : y <= 6 ? ['of', 'whatpct', 'change'] : ['change', 'reverse', 'successive', 'whatpct']));
    if (k === 'of') {
      const p = pick([5, 12.5, 15, 35, 45, 65, 120, 2.5]), n = R(2, 40) * 40, v = round(p * n / 100, 4);
      return mk({ topic: 'pct', value: v, en: `What is ${p}% of ${n}?`, zh: `${n} 的 ${p}% 是多少？`, solEn: `${p}/100 × ${n} = ${v}`, solZh: `${n} × ${p}% = ${v}` });
    }
    if (k === 'whatpct') {
      const whole = pick([16, 25, 40, 80, 125, 250, 400]), part = R(1, whole * (d >= 3 ? 1.5 : 1)), pc = round(part / whole * 100, 2);
      return mk({ topic: 'pct', value: pc, unit: '%', en: `What percentage of ${whole} is ${part}?${Number.isInteger(pc) ? '' : ' (2 d.p.)'}`, zh: `${part} 是 ${whole} 的百分之几？${Number.isInteger(pc) ? '' : '（保留两位小数）'}`,
        solEn: `${part} ÷ ${whole} × 100% = ${pc}%`, solZh: `${part} ÷ ${whole} × 100% = ${pc}%` });
    }
    if (k === 'conv') {   // Year 7: fractions, decimals and percentages
      const f = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 8], [3, 8], [1, 10], [7, 20], [9, 25], [13, 20]]), dec = round(f[0] / f[1], 4), pc = round(f[0] / f[1] * 100, 2);
      if (Math.random() < 0.5) return mk({ topic: 'pct', value: pc, unit: '%', en: `Write ${f[0]}/${f[1]} as a percentage.`, zh: `把 ${f[0]}/${f[1]} 写成百分数。`, solEn: `${f[0]} ÷ ${f[1]} = ${dec}, and ${dec} × 100% = ${pc}%`, solZh: `${f[0]} ÷ ${f[1]} = ${dec}，${dec} × 100% = ${pc}%` });
      return mk({ topic: 'pct', value: pc, unit: '%', en: `Write ${dec} as a percentage.`, zh: `把 ${dec} 写成百分数。`, solEn: `${dec} × 100% = ${pc}%`, solZh: `${dec} × 100% = ${pc}%` });
    }
    if (k === 'discount') {   // Year 8: discount and sale price
      const price = R(4, 40) * 10, p = pick([10, 15, 20, 25, 30, 40, 50]), disc = round(price * p / 100, 2), sale = round(price - disc, 2), askSale = Math.random() < 0.5;
      return mk({ topic: 'pct', value: askSale ? sale : disc, unit: '$', en: `A jacket costs $${price}. It is on sale with ${p}% off. What is the ${askSale ? 'sale price' : 'discount (in dollars)'}?`, zh: `一件外套原价 ${price} 元，打折优惠 ${p}%。${askSale ? '售价' : '优惠的金额'}是多少元？`,
        solEn: `Discount = ${p}% of ${price} = ${disc}; sale price = ${price} ${MINUS} ${disc} = ${sale}`, solZh: `优惠 = ${price} 的 ${p}% = ${disc}；售价 = ${price} ${MINUS} ${disc} = ${sale}` });
    }
    if (k === 'profit') {   // Year 8: profit or loss as a percentage of the cost
      const cost = R(4, 40) * 10, p = pick([10, 20, 25, 30, 40, 50]), loss = Math.random() < 0.3, sell = round(cost * (100 + (loss ? -p : p)) / 100, 2), gap = Math.abs(round(sell - cost, 2));
      return mk({ topic: 'pct', value: p, unit: '%', en: `A shop buys a bag for $${cost} and sells it for $${sell}. What is the ${loss ? 'loss' : 'profit'} as a percentage of the cost?`, zh: `商店以 ${cost} 元买进一个包，以 ${sell} 元卖出。${loss ? '亏损' : '利润'}占成本的百分之几？`,
        solEn: `${loss ? 'Loss' : 'Profit'} = ${gap}; ${gap} ÷ ${cost} × 100% = ${p}%`, solZh: `${loss ? '亏损' : '利润'} = ${gap}；${gap} ÷ ${cost} × 100% = ${p}%` });
    }
    const base = R(4, 60) * 25, p = pick([5, 10, 12, 15, 20, 25, 30, 40]), up = Math.random() < 0.5;
    if (k === 'change') {
      const v = round(base * (100 + (up ? p : -p)) / 100, 2);
      return mk({ topic: 'pct', value: v, unit: '$', en: `$${base} is ${up ? 'increased' : 'decreased'} by ${p}%. What is the new amount?`, zh: `${base} 元${up ? '增加' : '减少'} ${p}% 后是多少元？`,
        solEn: `${base} × ${(100 + (up ? p : -p)) / 100} = ${v}`, solZh: `${base} × (1 ${up ? '+' : MINUS} ${p}%) = ${v}` });
    }
    if (k === 'reverse') {
      const orig = R(4, 60) * 20, after = round(orig * (100 - p) / 100, 2);
      return mk({ topic: 'pct', value: orig, unit: '$', en: `After a ${p}% discount, a bike costs $${after}. What was the original price?`, zh: `一辆自行车打折后（降价 ${p}%）售价 ${after} 元，原价是多少元？`,
        solEn: `${after} is ${100 - p}% of the original: ${after} ÷ ${(100 - p) / 100} = ${orig}`, solZh: `${after} 元是原价的 ${100 - p}%：${after} ÷ ${100 - p}% = ${orig}` });
    }
    const p2 = pick([10, 20, 25]), v = round(100 * (1 + p / 100) * (1 - p2 / 100) - 100, 4);
    return mk({ topic: 'pct', value: v, unit: '%', en: `A price rises by ${p}% and then falls by ${p2}%. What is the overall percentage change? (Use a negative number for a decrease.)`,
      zh: `一件商品先涨价 ${p}%，再降价 ${p2}%。总体变化了百分之几？（下降用负数表示）`,
      solEn: `${1 + p / 100} × ${1 - p2 / 100} = ${round((1 + p / 100) * (1 - p2 / 100), 4)}, change = ${num(v)}%`, solZh: `(1 + ${p}%) × (1 ${MINUS} ${p2}%) = ${round((1 + p / 100) * (1 - p2 / 100), 4)}，变化 ${num(v)}%` });
  });

  /* ---------- Ratio & rates ---------- */
  reg('ratio', 6, (y, d) => {
    const k = ky('ratio', y, d) || (pick(d <= 1 ? ['share', 'simplify'] : ['share', 'three', 'speed', 'simplify']));
    if (k === 'simplify') {
      const g = R(2, 12), a = R(1, 9) * g, b = R(1, 9) * g, c = gcd(a, b);
      if (a === b) return null;
      const askA = Math.random() < 0.5;
      return mk({ topic: 'ratio', value: askA ? a / c : b / c, en: `Simplify ${a}:${b} to x:y in simplest form. What is ${askA ? 'x' : 'y'}?`, zh: `把 ${a}:${b} 化成最简整数比 x:y，${askA ? 'x' : 'y'} 是多少？`,
        solEn: `Divide both by ${c}: ${a / c}:${b / c}`, solZh: `两项同时除以 ${c}：${a / c}:${b / c}` });
    }
    if (k === 'three') {
      const a = R(1, 5), b = R(1, 6), c = R(2, 7), n = (a + b + c) * R(3, 20), part = n / (a + b + c);
      return mk({ topic: 'ratio', value: c * part, en: `$${n} is shared among A, B and C in the ratio ${a}:${b}:${c}. How much does C get?`, zh: `把 ${n} 元按 ${a}:${b}:${c} 分给甲、乙、丙，丙分得多少元？`, unit: '$',
        solEn: `${a + b + c} parts; 1 part = ${part}; C = ${c} × ${part} = ${c * part}`, solZh: `共 ${a + b + c} 份，每份 ${part} 元，丙 = ${c} × ${part} = ${c * part} 元` });
    }
    if (k === 'speed') {
      const v = R(4, 24) * 5, t = pick([1.5, 2.5, 0.75, 1.25, 3.5]), dist = round(v * t, 2);
      const which = pick(['d', 'v', 't']);
      if (which === 'd') return mk({ topic: 'ratio', value: dist, unit: 'km', en: `A car travels at ${v} km/h for ${t} hours. How far does it go (km)?`, zh: `汽车以每小时 ${v} 千米的速度行驶 ${t} 小时，行驶了多少千米？`, solEn: `${v} × ${t} = ${dist} km`, solZh: `${v} × ${t} = ${dist} 千米` });
      if (which === 'v') return mk({ topic: 'ratio', value: v, unit: 'km/h', en: `A train travels ${dist} km in ${t} hours. What is its average speed (km/h)?`, zh: `火车 ${t} 小时行驶 ${dist} 千米，平均速度是每小时多少千米？`, solEn: `${dist} ÷ ${t} = ${v} km/h`, solZh: `${dist} ÷ ${t} = ${v} 千米/小时` });
      return mk({ topic: 'ratio', value: t * 60, unit: 'min', en: `How many minutes does it take to travel ${dist} km at ${v} km/h?`, zh: `以每小时 ${v} 千米的速度行驶 ${dist} 千米，需要多少分钟？`, solEn: `${dist} ÷ ${v} = ${t} h = ${t * 60} min`, solZh: `${dist} ÷ ${v} = ${t} 小时 = ${t * 60} 分钟` });
    }
    if (k === 'share2') {   // Year 7: share an amount in a ratio
      const a = R(1, 7), b = R(1, 7); if (a === b) return null;
      const n = (a + b) * R(3, 20), part = n / (a + b), who = pick(['A', 'B']), mine = who === 'A' ? a : b;
      return mk({ topic: 'ratio', value: mine * part, unit: '$', en: `$${n} is shared between A and B in the ratio ${a}:${b}. How much does ${who} get?`, zh: `把 ${n} 元按 ${a}:${b} 分给甲、乙两人，${who === 'A' ? '甲' : '乙'}分得多少元？`,
        solEn: `${a + b} parts; 1 part = ${n} ÷ ${a + b} = ${part}; ${who} gets ${mine} × ${part} = ${mine * part}`, solZh: `共 ${a + b} 份，每份 ${n} ÷ ${a + b} = ${part} 元；${who === 'A' ? '甲' : '乙'}分得 ${mine} × ${part} = ${mine * part} 元` });
    }
    if (k === 'rate') {   // Year 8: rates with their units
      const t = pick([0, 1, 2]);
      if (t === 0) { const kg = R(2, 8), p = R(2, 12); return mk({ topic: 'ratio', value: p, unit: '$', en: `${kg} kg of apples cost $${kg * p}. What is the cost per kg?`, zh: `${kg} 千克苹果售价 ${kg * p} 元，每千克多少元？`, solEn: `${kg * p} ÷ ${kg} = ${p} dollars per kg`, solZh: `${kg * p} ÷ ${kg} = ${p}（元/千克）` }); }
      if (t === 1) { const m = R(2, 6), v = R(3, 15) * 5, dist = v * m; return mk({ topic: 'ratio', value: v, unit: 'km/h', en: `A cyclist rides ${dist} km in ${m} hours. What is the speed in km/h?`, zh: `骑车人 ${m} 小时骑了 ${dist} 千米，速度是每小时多少千米？`, solEn: `${dist} ÷ ${m} = ${v} km/h`, solZh: `${dist} ÷ ${m} = ${v}（千米/小时）` }); }
      const [mins, step] = pick([[30, 2], [15, 4], [45, 4], [20, 3], [40, 3], [90, 2], [12, 5], [24, 5]]), v = step * R(2, 14), dist = v * mins / 60;
      return mk({ topic: 'ratio', value: v, unit: 'km/h', en: `A car travels ${dist} km in ${mins} minutes. What is its speed in km/h? (Change the minutes to hours first.)`, zh: `汽车 ${mins} 分钟行驶 ${dist} 千米，速度是每小时多少千米？（先把分钟化成小时）`, solEn: `${mins} min = ${mins}/60 h, so speed = ${dist} ÷ (${mins}/60) = ${dist} × 60 ÷ ${mins} = ${v} km/h`, solZh: `${mins} 分钟 = ${mins}/60 小时，速度 = ${dist} ÷ (${mins}/60) = ${dist} × 60 ÷ ${mins} = ${v}（千米/小时）` });
    }
    let a = R(2, 7), b = R(2, 9); if (a === b) b++;
    const g = gcd(a, b); a /= g; b /= g;
    const diffAB = Math.abs(a - b) * R(2, 15), part = diffAB / Math.abs(a - b);
    return mk({ topic: 'ratio', value: (a + b) * part, en: `The ratio of boys to girls is ${a}:${b}. There are ${diffAB} more ${a > b ? 'boys' : 'girls'} than ${a > b ? 'girls' : 'boys'}. How many children are there altogether?`,
      zh: `男生与女生人数比是 ${a}:${b}，${a > b ? '男生比女生' : '女生比男生'}多 ${diffAB} 人。一共有多少人？`,
      solEn: `Difference = ${Math.abs(a - b)} parts = ${diffAB}, so 1 part = ${part}; total = ${a + b} × ${part} = ${(a + b) * part}`,
      solZh: `相差 ${Math.abs(a - b)} 份 = ${diffAB} 人，每份 ${part} 人；共 ${a + b} × ${part} = ${(a + b) * part} 人` });
  });

  /* ---------- Negative & rational numbers ---------- */
  reg('int', 6, (y, d) => {
    const k = pick(d <= 1 ? ['basic', 'basic', 'abs'] : ['chain', 'pow', 'frac', 'abs']);
    if (k === 'basic') {
      const a = R(-50, 50) || 7, b = R(-50, 50) || -9, op = pick(['+', MINUS, '×']);
      const v = op === '+' ? a + b : op === MINUS ? a - b : a * b, e = `${num(a)} ${op} ${paren(b)}`;
      return mk({ topic: 'int', value: v, en: `Work out ${e}`, zh: `计算：${e}`, solEn: `${e} = ${num(v)}`, solZh: `${e} = ${num(v)}` });
    }
    if (k === 'abs') {
      const a = R(-30, -1), b = R(-20, 20), v = Math.abs(a) - Math.abs(b) * 2;
      return mk({ topic: 'int', value: v, en: `Work out |${num(a)}| ${MINUS} 2 × |${num(b)}|`, zh: `计算：|${num(a)}| ${MINUS} 2 × |${num(b)}|`, solEn: `${-a} ${MINUS} 2 × ${Math.abs(b)} = ${num(v)}`, solZh: `${-a} ${MINUS} 2 × ${Math.abs(b)} = ${num(v)}` });
    }
    if (k === 'pow') {
      const b = R(2, 5), e = R(2, 4), c = R(-6, -2), v = (-b) ** e + c * 3;
      return mk({ topic: 'int', value: v, en: `Work out (${MINUS}${b})^${e} + ${paren(c)} × 3`, zh: `计算：(${MINUS}${b})^${e} + ${paren(c)} × 3`,
        solEn: `(${MINUS}${b})^${e} = ${num((-b) ** e)}; ${paren(c)} × 3 = ${num(c * 3)}; total ${num(v)}`, solZh: `(${MINUS}${b})^${e} = ${num((-b) ** e)}；${paren(c)} × 3 = ${num(c * 3)}；结果 ${num(v)}` });
    }
    if (k === 'frac') {
      const p = pick([2, 3, 4, 5, 6]), q = pick([2, 3, 4, 8]), a = R(1, p * 2), b = R(1, q * 2);
      const N = -(a * q + b * p), D = p * q;   // −a/p − b/q
      return mk({ topic: 'int', value: N / D, answer: fracStr(N, D), en: `Work out ${MINUS}${a}/${p} ${MINUS} ${b}/${q}. Give a fraction.`, zh: `计算：${MINUS}${a}/${p} ${MINUS} ${b}/${q}，用分数表示。`,
        solEn: `Common denominator ${D}: ${MINUS}${a * q}/${D} ${MINUS} ${b * p}/${D} = ${fracStr(N, D)}`, solZh: `通分：${MINUS}${a * q}/${D} ${MINUS} ${b * p}/${D} = ${fracStr(N, D)}` });
    }
    const a = R(-20, 20), b = R(-9, -2), c = R(2, 9), e = R(-12, 12) || 4, v = a - b * c + e;
    const ex = `${num(a)} ${MINUS} ${paren(b)} × ${c} + ${paren(e)}`;
    return mk({ topic: 'int', value: v, en: `Work out ${ex}`, zh: `计算：${ex}`, solEn: `${paren(b)} × ${c} = ${num(b * c)}; ${num(a)} ${MINUS} ${paren(b * c)} + ${paren(e)} = ${num(v)}`, solZh: `${paren(b)} × ${c} = ${num(b * c)}；${num(a)} ${MINUS} ${paren(b * c)} + ${paren(e)} = ${num(v)}` });
  });

  /* ---------- Powers, roots, standard form ---------- */
  reg('index', 7, (y, d) => {
    const k = ky('index', y, d) || (pick(y >= 9 ? ['law', 'neg', 'surd', 'sci', 'root'] : ['pow', 'root', 'law', 'sci']));
    if (k === 'order') {   // Year 7: the order of operations
      const a = R(2, 12), b = R(2, 9), c = R(2, 6), f = pick([0, 1, 2]);
      const T = [[`${a} + ${b} × ${c}²`, a + b * c * c], [`(${a} + ${b})² ${MINUS} ${c}`, (a + b) ** 2 - c], [`${a * a + b * b * c * c} ${MINUS} ${b} × ${c}²`, a * a + b * b * c * c - b * c * c]][f];
      return mk({ topic: 'index', value: T[1], en: `Work out ${T[0]}`, zh: `计算：${T[0]}`, solEn: 'Brackets first, then powers, then × and ÷, then + and −', solZh: '先算括号，再算乘方，再算乘除，最后算加减' });
    }
    if (k === 'fracidx') {   // Year 10: fractional indices
      if (Math.random() < 0.5) { const n = R(2, 15); return mk({ topic: 'index', value: n, en: `Work out ${n * n}^(1/2)`, zh: `计算：${n * n}^(1/2)`, solEn: `a^(1/2) = √a, and √${n * n} = ${n}`, solZh: `a^(1/2) = √a，√${n * n} = ${n}` }); }
      const n = R(2, 10); return mk({ topic: 'index', value: n, en: `Work out ${n ** 3}^(1/3)`, zh: `计算：${n ** 3}^(1/3)`, solEn: `a^(1/3) is the cube root of a: ∛${n ** 3} = ${n}`, solZh: `a^(1/3) 是 a 的立方根：∛${n ** 3} = ${n}` });
    }
    if (k === 'mulsurd') {   // Year 10: surds multiply and divide
      if (Math.random() < 0.5) { const p = R(2, 12), q = R(2, 12); return mk({ topic: 'index', value: p * q, en: `√${p} × √${q} = √n. Find n.`, zh: `√${p} × √${q} = √n，求 n。`, solEn: `√a × √b = √(ab), so n = ${p} × ${q} = ${p * q}`, solZh: `√a × √b = √(ab)，所以 n = ${p} × ${q} = ${p * q}` }); }
      const m = R(2, 9), q = R(2, 9); return mk({ topic: 'index', value: q, en: `√${m * q} ÷ √${m} = √n. Find n.`, zh: `√${m * q} ÷ √${m} = √n，求 n。`, solEn: `√a ÷ √b = √(a/b), so n = ${m * q} ÷ ${m} = ${q}`, solZh: `√a ÷ √b = √(a/b)，所以 n = ${m * q} ÷ ${m} = ${q}` });
    }
    if (k === 'simpsurd') {   // Year 10: take a square factor out of a surd
      const s2 = pick([2, 3, 5, 6, 7]), a = R(2, 9);
      return mk({ topic: 'index', value: a, en: `√${a * a * s2} can be written as k√${s2}. Find k.`, zh: `√${a * a * s2} 可化简为 k√${s2}，求 k。`, solEn: `√${a * a * s2} = √(${a * a} × ${s2}) = ${a}√${s2}`, solZh: `√${a * a * s2} = √(${a * a} × ${s2}) = ${a}√${s2}` });
    }
    if (k === 'pow') { const b = R(2, 9), e = R(3, b > 5 ? 4 : 6), v = b ** e; return mk({ topic: 'index', value: v, en: `Work out ${b}^${e}`, zh: `计算：${b}^${e}`, solEn: `${Array(e).fill(b).join(' × ')} = ${v}`, solZh: `${Array(e).fill(b).join(' × ')} = ${v}` }); }
    if (k === 'root') {
      const r = R(11, 35), cube = d >= 3, n = cube ? R(2, 12) ** 3 : r * r, v = cube ? Math.round(Math.cbrt(n)) : r;
      return mk({ topic: 'index', value: v, en: cube ? `Work out ∛${n}` : `Work out √${n}`, zh: cube ? `计算：∛${n}` : `计算：√${n}`, solEn: `${v}${cube ? '³' : '²'} = ${n}`, solZh: `${v}${cube ? '³' : '²'} = ${n}` });
    }
    if (k === 'law') {
      const a = R(2, 9), b = R(2, 9), c = R(2, 4), e = R(2, 9), v = a * c + b - e;   // (x^a)^c × x^b ÷ x^e
      return mk({ topic: 'index', value: v, en: `Simplify (x^${a})^${c} × x^${b} ÷ x^${e} = x^n. Find n.`, zh: `化简 (x^${a})^${c} × x^${b} ÷ x^${e} = x^n，求 n。`,
        solEn: `${a} × ${c} + ${b} ${MINUS} ${e} = ${num(v)}`, solZh: `${a} × ${c} + ${b} ${MINUS} ${e} = ${num(v)}` });
    }
    if (k === 'neg') {
      const b = R(2, 5), e = R(1, 3), v = 1 / b ** e + (d >= 3 ? 1 : 0);
      const extra = d >= 3 ? ' + 7^0' : '';
      return mk({ topic: 'index', value: v, answer: fracStr(1 + (d >= 3 ? b ** e : 0), b ** e), en: `Work out ${b}^(${MINUS}${e})${extra}. Give a fraction.`, zh: `计算：${b}^(${MINUS}${e})${extra}，用分数表示。`,
        solEn: `${b}^(${MINUS}${e}) = 1/${b ** e}${d >= 3 ? '; 7^0 = 1' : ''}`, solZh: `${b}^(${MINUS}${e}) = 1/${b ** e}${d >= 3 ? '；7^0 = 1' : ''}` });
    }
    if (k === 'surd') {
      const s = pick([2, 3, 5, 6, 7]), a = R(2, 6), b = R(2, 6), v = a * a * s;   // √(a²s) = a√s → ask a
      return mk({ topic: 'index', value: a + b, en: `√${v} + √${b * b * s} can be written as k√${s}. Find k.`, zh: `√${v} + √${b * b * s} 可化简为 k√${s}，求 k。`,
        solEn: `√${v} = ${a}√${s}, √${b * b * s} = ${b}√${s}, so k = ${a + b}`, solZh: `√${v} = ${a}√${s}，√${b * b * s} = ${b}√${s}，所以 k = ${a + b}` });
    }
    const m = R(11, 99) / 10, e = R(3, 8), n = round(m * 10 ** e, 0), neg = y >= 8 && Math.random() < 0.5;
    if (neg) { const small = round(m * 10 ** -e, 12); return mk({ topic: 'index', value: -e, en: `Write ${small.toFixed(e + 1)} in standard form a × 10^n. What is n?`, zh: `把 ${small.toFixed(e + 1)} 写成科学记数法 a × 10^n，n 是多少？`, solEn: `${small.toFixed(e + 1)} = ${m} × 10^${MINUS}${e}`, solZh: `${small.toFixed(e + 1)} = ${m} × 10^${MINUS}${e}` }); }
    return mk({ topic: 'index', value: e, en: `Write ${n} in standard form a × 10^n. What is n?`, zh: `把 ${n} 写成科学记数法 a × 10^n，n 是多少？`, solEn: `${n} = ${m} × 10^${e}`, solZh: `${n} = ${m} × 10^${e}` });
  });

  /* ---------- Algebra: equations, simultaneous, inequalities, expansion ---------- */
  reg('alg', 5, (y, d) => {
    const ks = (KY.alg && KY.alg(y, d)) || (y <= 6 ? ['two', 'two', 'brk'] : y === 7 ? ['two', 'brk', 'fracEq', 'sides'] : y === 8 ? ['fracEq', 'sides', 'sim', 'ineq', 'expand'] : ['sim', 'ineq', 'expand', 'fracEq', 'sides']);
    const k = pick(d <= 1 ? ks.slice(0, 2) : ks);
    const x = y >= 7 ? R(-9, 12) || 3 : R(2, 15);
    if (k === 'subst') {   // Year 7: substitution
      const a = R(-4, 9), b = R(2, 9), p = R(2, 6), q = R(1, 5), f = pick([0, 1]);
      if (f === 0) return mk({ topic: 'alg', value: p * a + q * b, en: `Find the value of ${p}a + ${q}b when a = ${num(a)} and b = ${b}.`, zh: `当 a = ${num(a)}，b = ${b} 时，求 ${p}a + ${q}b 的值。`, solEn: `${p} × ${paren(a)} + ${q} × ${b} = ${num(p * a + q * b)}`, solZh: `${p} × ${paren(a)} + ${q} × ${b} = ${num(p * a + q * b)}` });
      return mk({ topic: 'alg', value: p * b * b - a, en: `Find the value of ${p}b² ${MINUS} a when a = ${num(a)} and b = ${b}.`, zh: `当 a = ${num(a)}，b = ${b} 时，求 ${p}b² ${MINUS} a 的值。`, solEn: `${p} × ${b}² ${MINUS} ${paren(a)} = ${num(p * b * b - a)}`, solZh: `${p} × ${b}² ${MINUS} ${paren(a)} = ${num(p * b * b - a)}` });
    }
    if (k === 'like') {   // Year 7: collecting like terms
      const a = R(2, 9), b = R(2, 9), c = R(1, 8), askX = Math.random() < 0.5;
      let e = R(1, 8); while (Math.abs(b - e) < 2) e = R(1, 8);   // v2.3.0 R4.1: the y part is never 0y or 1y
      return mk({ topic: 'alg', value: askX ? a + c : b - e, en: `Simplify ${a}x + ${b}y + ${coef(c)} ${MINUS} ${coef(e, 'y')}. What is the coefficient of ${askX ? 'x' : 'y'}?`, zh: `化简 ${a}x + ${b}y + ${coef(c)} ${MINUS} ${coef(e, 'y')}，${askX ? 'x' : 'y'} 的系数是多少？`, solEn: `Collect like terms: ${a + c}x${sg(b - e)}y`, solZh: `合并同类项：${a + c}x${sg(b - e)}y` });
    }
    if (k === 'expand1') {   // Year 8: expanding brackets
      const p = R(2, 9) * (Math.random() < 0.3 ? -1 : 1), q = R(1, 9) * (Math.random() < 0.5 ? -1 : 1), askC = Math.random() < 0.5;
      return mk({ topic: 'alg', value: askC ? p * q : p, en: `Expand ${num(p)}(x${sg(q)}). What is the ${askC ? 'constant term' : 'coefficient of x'}?`, zh: `展开 ${num(p)}(x${sg(q)})，${askC ? '常数项' : 'x 的系数'}是多少？`, solEn: `${num(p)}(x${sg(q)}) = ${num(p)}x${sg(p * q)}`, solZh: `${num(p)}(x${sg(q)}) = ${num(p)}x${sg(p * q)}` });
    }
    if (k === 'collect') {   // Year 8: collecting like terms with a constant
      const a = R(2, 9), b = R(1, 12), c = R(1, 9), e = R(1, 12);
      return mk({ topic: 'alg', value: (a + c) + (b - e), en: `Collect like terms: ${a}x + ${b} + ${coef(c)} ${MINUS} ${e} = px + q. Find p + q.`, zh: `合并同类项：${a}x + ${b} + ${coef(c)} ${MINUS} ${e} = px + q，求 p + q。`, solEn: `${a + c}x${sg(b - e)}, so p + q = ${a + c}${sg(b - e)} = ${num(a + c + b - e)}`, solZh: `${a + c}x${sg(b - e)}，所以 p + q = ${a + c}${sg(b - e)} = ${num(a + c + b - e)}` });
    }
    if (k === 'ineqneg') {   // Year 8: dividing by a negative reverses the sign
      const a = R(2, 6), kk = R(-8, 8), b = R(-9, 9), c = -a * kk + b;
      return mk({ topic: 'alg', value: kk, en: `Solve ${MINUS}${a}x${sg(b)} > ${num(c)}. The solution is x < k. Find k.`, zh: `解不等式 ${MINUS}${a}x${sg(b)} > ${num(c)}，解为 x < k，求 k。`, solEn: `${MINUS}${a}x > ${num(c - b)}; divide by ${MINUS}${a} and reverse the sign: x < ${num(kk)}`, solZh: `${MINUS}${a}x > ${num(c - b)}；两边除以 ${MINUS}${a}，不等号反向：x < ${num(kk)}` });
    }
    if (k === 'algfrac') {   // Year 9: adding algebraic fractions
      const p = R(2, 6), q = R(2, 6); if (p === q) return null;
      return mk({ topic: 'alg', value: p + q, en: `x/${p} + x/${q} = kx/${p * q}. Find k.`, zh: `x/${p} + x/${q} = kx/${p * q}，求 k。`, solEn: `Common denominator ${p * q}: ${q}x/${p * q} + ${p}x/${p * q} = ${p + q}x/${p * q}, so k = ${p + q}`, solZh: `公分母 ${p * q}：${q}x/${p * q} + ${p}x/${p * q} = ${p + q}x/${p * q}，所以 k = ${p + q}` });
    }
    if (k === 'two') {
      const a = R(2, 12), b = R(1, 40), c = a * x + b;
      return mk({ topic: 'alg', value: x, en: `Solve for x: ${a}x + ${b} = ${num(c)}`, zh: `解方程：${a}x + ${b} = ${num(c)}`,
        solEn: `${a}x = ${num(c)} ${MINUS} ${b} = ${num(c - b)}; x = ${num(c - b)} ÷ ${a} = ${num(x)}`, solZh: `${a}x = ${num(c)} ${MINUS} ${b} = ${num(c - b)}；x = ${num(c - b)} ÷ ${a} = ${num(x)}` });
    }
    if (k === 'brk') {
      const a = R(2, 9), b = R(1, 12), c = a * (x + b);
      return mk({ topic: 'alg', value: x, en: `Solve for x: ${a}(x + ${b}) = ${num(c)}`, zh: `解方程：${a}(x + ${b}) = ${num(c)}`,
        solEn: `x + ${b} = ${num(c)} ÷ ${a} = ${num(c / a)}; x = ${num(x)}`, solZh: `x + ${b} = ${num(c)} ÷ ${a} = ${num(c / a)}；x = ${num(x)}` });
    }
    if (k === 'sides') {
      const a = R(5, 12), c = R(1, a - 2), b = R(-15, 15), e = (a - c) * x + b, p = R(2, 4);
      // p(a x + b) = p c x + p e  → keep brackets for challenge
      const left = d >= 3 ? `${p}(${coef(a)}${sg(b)})` : `${coef(a)}${sg(b)}`, right = d >= 3 ? `${coef(p * c)}${sg(p * e)}` : `${coef(c)}${sg(e)}`;
      return mk({ topic: 'alg', value: x, en: `Solve for x: ${left} = ${right}`, zh: `解方程：${left} = ${right}`,
        solEn: `${d >= 3 ? `Divide by ${p}: ` : ''}${coef(a)}${sg(b)} = ${coef(c)}${sg(e)} → ${a - c}x = ${num(e - b)} → x = ${num(x)}`,
        solZh: `${d >= 3 ? `两边除以 ${p}：` : ''}${coef(a)}${sg(b)} = ${coef(c)}${sg(e)} → ${a - c}x = ${num(e - b)} → x = ${num(x)}` });
    }
    if (k === 'fracEq') {
      // (x + a)/p − (x − b)/q = c  with integer solution
      const p = pick([2, 3, 4, 5]), q = pick([2, 3, 4, 6].filter(v => v !== p)), a = R(1, 9), b = R(1, 9);
      const X = p * q * R(-2, 4) + 0, xx = X || p * q;   // keep x multiple of pq-friendly
      const lhs = (xx + a) / p - (xx - b) / q;
      if (!Number.isInteger(lhs * p * q)) return null;
      const L = fracStr(Math.round(lhs * p * q), p * q);
      return mk({ topic: 'alg', value: xx, en: `Solve for x: (x + ${a})/${p} ${MINUS} (x ${MINUS} ${b})/${q} = ${L}`, zh: `解方程：(x + ${a})/${p} ${MINUS} (x ${MINUS} ${b})/${q} = ${L}`,
        solEn: `Multiply every term by ${p * q}: ${q}(x + ${a}) ${MINUS} ${p}(x ${MINUS} ${b}) = ${Math.round(lhs * p * q)} → ${q - p}x + ${q * a + p * b} = ${Math.round(lhs * p * q)} → x = ${num(xx)}`,
        solZh: `两边同乘 ${p * q} 去分母：${q}(x + ${a}) ${MINUS} ${p}(x ${MINUS} ${b}) = ${Math.round(lhs * p * q)} → ${q - p}x + ${q * a + p * b} = ${Math.round(lhs * p * q)} → x = ${num(xx)}` });
    }
    if (k === 'sim') {
      const X = R(-5, 9) || 2, Y = R(-5, 9) || -3, a = R(1, 6), b = R(1, 6), c = R(1, 6), e = R(1, 6) * (Math.random() < 0.5 ? -1 : 1);
      if (a * e - b * c === 0) return null;
      const askY = Math.random() < 0.5;
      return mk({ topic: 'alg', value: askY ? Y : X, en: `Solve the simultaneous equations: ${coef(a)}${yt(b)} = ${num(a * X + b * Y)} and ${coef(c)}${yt(e)} = ${num(c * X + e * Y)}. What is ${askY ? 'y' : 'x'}?`,
        zh: `解方程组：${coef(a)}${yt(b)} = ${num(a * X + b * Y)}，${coef(c)}${yt(e)} = ${num(c * X + e * Y)}。求 ${askY ? 'y' : 'x'}。`,
        solEn: `Eliminate one unknown (multiply and subtract): x = ${num(X)}, y = ${num(Y)}`, solZh: `用加减消元法：x = ${num(X)}，y = ${num(Y)}` });
    }
    if (k === 'ineq') {
      const a = R(2, 7), b = R(-10, 10), c = R(-5, 30), bound = (c - b) / a, v = Math.floor(bound) + 1;
      return mk({ topic: 'alg', value: v, en: `Find the smallest integer x that satisfies ${a}x${sg(b)} > ${num(c)}.`, zh: `求满足 ${a}x${sg(b)} > ${num(c)} 的最小整数 x。`,
        solEn: `${a}x > ${num(c - b)} → x > ${fracStr(c - b, a)}, so the smallest integer is ${num(v)}`, solZh: `${a}x > ${num(c - b)} → x > ${fracStr(c - b, a)}，最小整数为 ${num(v)}` });
    }
    const a = R(1, 5), b = R(-9, 9) || 2, c = R(1, 5), e = R(-9, 9) || -3, which = pick(['x', 'c']);
    const xc = a * e + b * c, cc = b * e;   // (ax + b)(cx + e) = ac x² + (ae + bc) x + be
    return mk({ topic: 'alg', value: which === 'x' ? xc : cc, en: `Expand (${coef(a)}${sg(b)})(${coef(c)}${sg(e)}). What is the ${which === 'x' ? 'coefficient of x' : 'constant term'}?`,
      zh: `展开 (${coef(a)}${sg(b)})(${coef(c)}${sg(e)})，${which === 'x' ? '一次项 x 的系数' : '常数项'}是多少？`,
      solEn: `= ${a * c}x²${sg(xc)}x${sg(cc)}`, solZh: `= ${a * c}x²${sg(xc)}x${sg(cc)}` });
  });

  /* ---------- Quadratics (Year 9+) ---------- */
  reg('quad', 9, (y, d) => {
    const bx = b => (b === 0 ? '' : (b < 0 ? ` ${MINUS} ` : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x');
    const r1 = R(-9, 9), r2 = R(-9, 9), a = d >= 3 ? R(1, 3) : 1;
    const b = -a * (r1 + r2), c = a * r1 * r2, eq = `${a === 1 ? '' : a}x²${bx(b)}${c ? sg(c) : ''} = 0`;
    const k = ky('quad', y, d) || (pick(['big', 'small', 'sum', 'vertex']));
    if (k === 'opens') {   // Year 10: which way the parabola opens
      const A = R(1, 5) * (Math.random() < 0.5 ? -1 : 1), B = R(-6, 6), C = R(-9, 9), up = A > 0;
      return G.mc({ topic: 'quad', en: `Which way does the parabola y = ${coef(A, 'x²')}${bx(B)}${C ? sg(C) : ''} open?`, zh: `抛物线 y = ${coef(A, 'x²')}${bx(B)}${C ? sg(C) : ''} 的开口朝哪个方向？`, correct: { en: up ? 'upwards' : 'downwards', zh: up ? '向上' : '向下' },
        wrong: [{ en: up ? 'downwards' : 'upwards', zh: up ? '向下' : '向上' }, { en: 'to the left', zh: '向左' }, { en: 'to the right', zh: '向右' }], solEn: `a = ${num(A)} is ${up ? 'positive, so it opens up' : 'negative, so it opens down'}`, solZh: `a = ${num(A)} 是${up ? '正数，开口向上' : '负数，开口向下'}` });
    }
    if (k === 'qf') {   // Year 10: the quadratic formula
      const A = R(1, 3), B = R(-9, 9), C = -R(1, 9), D = B * B - 4 * A * C, v = round((-B + Math.sqrt(D)) / (2 * A), 2);
      return mk({ topic: 'quad', value: v, tol: 0.011, answer: v.toFixed(2), en: `Use the quadratic formula to solve ${coef(A, 'x²')}${bx(B)}${sg(C)} = 0. Give the larger root to 2 decimal places.`, zh: `用求根公式解方程 ${coef(A, 'x²')}${bx(B)}${sg(C)} = 0，较大的根保留两位小数。`, solEn: `x = (${num(-B)} + √(${num(B)}² ${MINUS} 4 × ${A} × ${paren(C)})) ÷ ${2 * A} = (${num(-B)} + √${D}) ÷ ${2 * A} ≈ ${v.toFixed(2)}`, solZh: `x = (${num(-B)} + √(${num(B)}² ${MINUS} 4 × ${A} × ${paren(C)})) ÷ ${2 * A} = (${num(-B)} + √${D}) ÷ ${2 * A} ≈ ${v.toFixed(2)}` });
    }
    if (k === 'disc' || k === 'nroots') {   // Year 11: the discriminant and the number of roots
      const A = R(1, 4) * (Math.random() < 0.3 ? -1 : 1), B = R(-8, 8), C = R(-8, 8) || 3, D = B * B - 4 * A * C, f = `${coef(A, 'x²')}${bx(B)}${sg(C)}`;
      if (k === 'disc') return mk({ topic: 'quad', value: D, en: `Find the discriminant Δ = b² ${MINUS} 4ac of ${f}.`, zh: `求 ${f} 的判别式 Δ = b² ${MINUS} 4ac。`, solEn: `Δ = ${num(B)}² ${MINUS} 4 × ${paren(A)} × ${paren(C)} = ${num(D)}`, solZh: `Δ = ${num(B)}² ${MINUS} 4 × ${paren(A)} × ${paren(C)} = ${num(D)}` });
      const n = D > 0 ? 2 : D === 0 ? 1 : 0;
      return mk({ topic: 'quad', value: n, en: `How many real roots does ${f} = 0 have?`, zh: `方程 ${f} = 0 有几个实数根？`, solEn: `Δ = ${num(D)}, so ${D > 0 ? 'two roots (Δ > 0)' : D === 0 ? 'one root (Δ = 0)' : 'no real roots (Δ < 0)'}`, solZh: `Δ = ${num(D)}，所以${D > 0 ? '有两个根（Δ > 0）' : D === 0 ? '有一个根（Δ = 0）' : '没有实数根（Δ < 0）'}` });
    }
    if (k === 'axis') {   // Year 11: the axis of symmetry
      const A = R(1, 4) * (Math.random() < 0.3 ? -1 : 1), h = R(-6, 6), B = -2 * A * h, C = R(-9, 9);
      return mk({ topic: 'quad', value: h, en: `The axis of symmetry of y = ${coef(A, 'x²')}${bx(B)}${C ? sg(C) : ''} is x = k. Find k.`, zh: `y = ${coef(A, 'x²')}${bx(B)}${C ? sg(C) : ''} 的对称轴是 x = k，求 k。`, solEn: `k = ${MINUS}b ÷ 2a = ${num(-B)} ÷ ${num(2 * A)} = ${num(h)}`, solZh: `k = ${MINUS}b ÷ 2a = ${num(-B)} ÷ ${num(2 * A)} = ${num(h)}` });
    }
    if (k === 'cts') {   // Year 11: completing the square
      const p = R(-6, 6) || 2, C = R(-12, 12), q = C - p * p, bT = p < 0 ? ` ${MINUS} ${-2 * p}x` : ` + ${2 * p}x`, cT = C < 0 ? ` ${MINUS} ${-C}` : C > 0 ? ` + ${C}` : '', pT = p < 0 ? `x ${MINUS} ${-p}` : `x + ${p}`;
      return mk({ topic: 'quad', value: q, en: `x²${bT}${cT} = (${pT})² + q. Find q.`, zh: `x²${bT}${cT} = (${pT})² + q，求 q。`, solEn: `(${pT})² = x²${bT} + ${p * p}, so q = ${num(C)} ${MINUS} ${p * p} = ${num(q)}`, solZh: `(${pT})² = x²${bT} + ${p * p}，所以 q = ${num(C)} ${MINUS} ${p * p} = ${num(q)}` });
    }
    if (k === 'vertex') {
      const h = R(-6, 6), kk = R(-9, 9), p = R(1, 3) * (Math.random() < 0.5 ? -1 : 1);
      const B = -2 * p * h, C = p * h * h + kk;
      return mk({ topic: 'quad', value: kk, en: `For y = ${coef(p, 'x²')}${bx(B)}${C ? sg(C) : ''}, what is the y-coordinate of the turning point (vertex)?`,
        zh: `对于 y = ${coef(p, 'x²')}${bx(B)}${C ? sg(C) : ''}，顶点的纵坐标是多少？`,
        solEn: `x = ${MINUS}b/(2a) = ${num(h)}; y = ${num(kk)}`, solZh: `顶点横坐标 x = ${MINUS}b/(2a) = ${num(h)}，代入得 y = ${num(kk)}` });
    }
    if (k === 'sum') return mk({ topic: 'quad', value: r1 + r2, en: `Find the sum of the roots of ${eq}.`, zh: `求方程 ${eq} 两根之和。`, solEn: `Factorise: roots ${num(r1)} and ${num(r2)}; sum = ${num(r1 + r2)} (also −b/a)`, solZh: `因式分解得两根 ${num(r1)}、${num(r2)}，和为 ${num(r1 + r2)}（即 −b/a）` });
    if (r1 === r2) return null;
    const v = k === 'big' ? Math.max(r1, r2) : Math.min(r1, r2);
    return mk({ topic: 'quad', value: v, en: `Solve ${eq}. Give the ${k === 'big' ? 'larger' : 'smaller'} root.`, zh: `解方程 ${eq}，写出${k === 'big' ? '较大' : '较小'}的根。`,
      solEn: `${a === 1 ? '' : a}(x ${MINUS} ${paren(r1)})(x ${MINUS} ${paren(r2)}) = 0 → x = ${num(r1)} or ${num(r2)}`, solZh: `${a === 1 ? '' : a}(x ${MINUS} ${paren(r1)})(x ${MINUS} ${paren(r2)}) = 0 → x = ${num(r1)} 或 ${num(r2)}` });
  });

  /* ---------- Linear graphs ---------- */
  reg('linear', 8, (y, d) => {
    const k = ky('linear', y, d) || (pick(y >= 9 ? ['grad', 'eval', 'cross', 'xint', 'eqc', 'eqpt', 'par', 'eqmc', 'hv', ...(d >= 3 ? ['perp', 'perp'] : [])] : ['grad', 'eval', 'cross', 'xint']));
    const m = R(-5, 5) || 2, c = R(-9, 9);
    const line = (mm, cc) => `y = ${coef(mm)}${cc ? sg(cc) : ''}`;
    // W11 (v2.1.0, NSW Stage 5 Linear relationships): the equation of a line, y = mx + c
    if (k === 'eqc' || k === 'eqpt' || k === 'par' || k === 'perp') {
      const m1 = R(-5, 5) || 3, c1 = R(-9, 9) || 4, x1 = R(-5, 5), x2 = x1 + R(1, 4), y1 = m1 * x1 + c1, y2 = m1 * x2 + c1;
      if (k === 'eqc') return mk({ topic: 'linear', value: c1, en: `The line through (${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)}) has equation y = mx + c. Find c.`, zh: `经过 (${num(x1)}, ${num(y1)}) 和 (${num(x2)}, ${num(y2)}) 的直线方程是 y = mx + c。求 c。`,
        solEn: `m = (${num(y2)} ${MINUS} ${paren(y1)}) ÷ (${num(x2)} ${MINUS} ${paren(x1)}) = ${num(m1)}; c = ${num(y1)} ${MINUS} ${paren(m1)} × ${paren(x1)} = ${num(c1)}`, solZh: `m = (${num(y2)} ${MINUS} ${paren(y1)}) ÷ (${num(x2)} ${MINUS} ${paren(x1)}) = ${num(m1)}；c = ${num(y1)} ${MINUS} ${paren(m1)} × ${paren(x1)} = ${num(c1)}` });
      if (k === 'eqpt') return mk({ topic: 'linear', value: c1, en: `A line has gradient ${num(m1)} and passes through (${num(x1)}, ${num(y1)}). Its equation is y = mx + c. Find c.`, zh: `一条直线的斜率是 ${num(m1)}，经过点 (${num(x1)}, ${num(y1)})。它的方程是 y = mx + c。求 c。`,
        solEn: `${num(y1)} = ${paren(m1)} × ${paren(x1)} + c, so c = ${num(c1)}`, solZh: `${num(y1)} = ${paren(m1)} × ${paren(x1)} + c，所以 c = ${num(c1)}` });
      if (k === 'par') { const named = line(m1, c1 + R(1, 5)); return mk({ topic: 'linear', value: c1, en: `A line is parallel to ${named} and passes through (${num(x1)}, ${num(y1)}). Its equation is y = mx + c. Find c.`, zh: `一条直线与 ${named} 平行，并经过点 (${num(x1)}, ${num(y1)})。它的方程是 y = mx + c。求 c。`,
        solEn: `Parallel lines have the same gradient m = ${num(m1)}. ${num(y1)} = ${paren(m1)} × ${paren(x1)} + c, so c = ${num(c1)}`, solZh: `平行线斜率相同，m = ${num(m1)}。${num(y1)} = ${paren(m1)} × ${paren(x1)} + c，所以 c = ${num(c1)}` }); }
      const n = R(2, 4), x0 = n * R(-3, 3), y0 = R(-8, 8), cc = y0 + n * x0, b0 = R(1, 6);   // perpendicular to y = x/n + b0: gradient -n
      return mk({ topic: 'linear', value: cc, en: `A line is perpendicular to y = x/${n} + ${b0} and passes through (${num(x0)}, ${num(y0)}). Its equation is y = mx + c. Find c.`,
        zh: `一条直线垂直于 y = x/${n} + ${b0}，并经过点 (${num(x0)}, ${num(y0)})。它的方程是 y = mx + c。求 c。`,
        solEn: `The gradient of y = x/${n} + ${b0} is 1/${n}, so the perpendicular gradient is ${MINUS}${n}. ${num(y0)} = ${MINUS}${n} × ${paren(x0)} + c, so c = ${num(cc)}`, solZh: `原直线斜率是 1/${n}，垂直直线的斜率是 ${MINUS}${n}。${num(y0)} = ${MINUS}${n} × ${paren(x0)} + c，所以 c = ${num(cc)}` });
    }
    if (k === 'table') {   // Year 8: a table of values and the rule
      const xv = R(5, 12), ys = [0, 1, 2, 3].map(x => m * x + c).map(num).join(', ');
      return mk({ topic: 'linear', value: m * xv + c, en: `A table of values for a straight-line rule gives y = ${ys} for x = 0, 1, 2, 3. Use the rule to find y when x = ${xv}.`, zh: `某个直线规则的函数值表：x = 0, 1, 2, 3 时，y = ${ys}。用这个规则求 x = ${xv} 时的 y。`, solEn: `y goes up by ${num(m)} each time and starts at ${num(c)}, so y = ${coef(m)}${sg(c)}; at x = ${xv}: ${num(m * xv + c)}`, solZh: `x 每增加 1，y 增加 ${num(m)}，起点是 ${num(c)}，所以 y = ${coef(m)}${sg(c)}；x = ${xv} 时 y = ${num(m * xv + c)}` });
    }
    if (k === 'onpoint') {   // Year 8: plot points that lie on the line
      const px = R(-5, 6), py = m * px + c, pt = (a, b) => `(${num(a)}, ${num(b)})`;
      return G.mc({ topic: 'linear', en: `Which point lies on the line ${line(m, c)}?`, zh: `下面哪个点在直线 ${line(m, c)} 上？`, correct: pt(px, py), wrong: [pt(px, py + 1), pt(px, py - 2), pt(px + 1, py)], solEn: `Put x = ${num(px)} into the rule: y = ${num(py)}`, solZh: `把 x = ${num(px)} 代入：y = ${num(py)}` });
    }
    if (k === 'rule') {   // Year 8: from words to the rule
      const mm = R(2, 6), cc = R(1, 9);
      return G.mc({ topic: 'linear', en: `y is ${mm} times x, plus ${cc}. Which rule says this?`, zh: `y 是 x 的 ${mm} 倍再加 ${cc}。下面哪条规则表示这个关系？`, correct: `y = ${mm}x + ${cc}`, wrong: [`y = ${cc}x + ${mm}`, `y = ${mm + cc}x`, `y = ${mm}x ${MINUS} ${cc}`], solEn: `${mm} times x is ${mm}x, then add ${cc}: y = ${mm}x + ${cc}`, solZh: `x 的 ${mm} 倍是 ${mm}x，再加 ${cc}：y = ${mm}x + ${cc}` });
    }
    if (k === 'yint') {   // Year 9: read the gradient and the y-intercept from y = mx + b
      const mm = R(2, 6) * (Math.random() < 0.5 ? -1 : 1), bb = R(-9, 9) || 4, askM = Math.random() < 0.5;
      return mk({ topic: 'linear', value: askM ? mm : bb, en: `For the line y = ${num(bb)}${sg(mm).replace(/(\d+)$/, '$1x')}, what is the ${askM ? 'gradient' : 'y-intercept'}?`, zh: `直线 y = ${num(bb)}${sg(mm).replace(/(\d+)$/, '$1x')} 的${askM ? '斜率' : 'y 轴截距'}是多少？`, solEn: `Write it as y = ${coef(mm)}${sg(bb)}: gradient ${num(mm)}, y-intercept ${num(bb)}`, solZh: `改写成 y = ${coef(mm)}${sg(bb)}：斜率 ${num(mm)}，y 轴截距 ${num(bb)}` });
    }
    if (k === 'eqmc') {
      const m1 = R(2, 7) * (Math.random() < 0.5 ? -1 : 1), c1 = R(1, 9) * (Math.random() < 0.5 ? -1 : 1), f = (a, b) => `y = ${coef(a)}${sg(b)}`;
      return G.mc({ topic: 'linear', en: `Which is the equation of the line with gradient ${num(m1)} and y-intercept ${num(c1)}?`, zh: `斜率为 ${num(m1)}、y 轴截距为 ${num(c1)} 的直线，方程是哪一个？`, correct: f(m1, c1),
        wrong: [f(c1, m1), f(m1, -c1), f(-m1, c1)], solEn: `y = mx + c with m = ${num(m1)} and c = ${num(c1)}`, solZh: `y = mx + c，其中 m = ${num(m1)}，c = ${num(c1)}` });
    }
    if (k === 'hv') {
      const a = R(-6, 6) || 2, horiz = Math.random() < 0.5;
      const HOR = { en: 'horizontal (gradient 0)', zh: '水平线（斜率为 0）' }, VER = { en: 'vertical (no gradient)', zh: '竖直线（没有斜率）' };
      return G.mc({ topic: 'linear', en: `Which kind of line is ${horiz ? 'y' : 'x'} = ${num(a)}?`, zh: `${horiz ? 'y' : 'x'} = ${num(a)} 是什么样的直线？`, correct: horiz ? HOR : VER,
        wrong: [horiz ? VER : HOR, { en: 'passes through the origin', zh: '经过原点' }, { en: 'has gradient 1', zh: '斜率为 1' }], solEn: `${horiz ? 'y' : 'x'} = constant is ${horiz ? 'parallel to the x-axis' : 'parallel to the y-axis'}`, solZh: `${horiz ? 'y' : 'x'} = 常数，${horiz ? '平行于 x 轴（水平线）' : '平行于 y 轴（竖直线）'}` });
    }
    if (k === 'grad') {
      const x1 = R(-6, 3), x2 = x1 + R(1, 6), dy = R(-12, 12) || 5, y1 = R(-9, 9), y2 = y1 + dy;
      return mk({ topic: 'linear', value: dy / (x2 - x1), answer: fracStr(dy, x2 - x1), en: `Find the gradient of the line through (${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)}).`,
        zh: `求经过 (${num(x1)}, ${num(y1)}) 和 (${num(x2)}, ${num(y2)}) 的直线的斜率。`, solEn: `(${num(y2)} ${MINUS} ${paren(y1)}) ÷ (${num(x2)} ${MINUS} ${paren(x1)}) = ${fracStr(dy, x2 - x1)}`, solZh: `k = (${num(y2)} ${MINUS} ${paren(y1)}) ÷ (${num(x2)} ${MINUS} ${paren(x1)}) = ${fracStr(dy, x2 - x1)}` });
    }
    if (k === 'eval') { const xv = R(-6, 8), v = m * xv + c; return mk({ topic: 'linear', value: v, en: `For ${line(m, c)}, find y when x = ${num(xv)}.`, zh: `对于 ${line(m, c)}，当 x = ${num(xv)} 时，y 等于多少？`, solEn: `y = ${num(m)} × ${paren(xv)}${sg(c)} = ${num(v)}`, solZh: `y = ${num(m)} × ${paren(xv)}${sg(c)} = ${num(v)}` }); }
    if (k === 'xint') return mk({ topic: 'linear', value: -c / m, answer: fracStr(-c, m), en: `Where does ${line(m, c)} cross the x-axis? Give the x-value.`, zh: `直线 ${line(m, c)} 与 x 轴交点的横坐标是多少？`, solEn: `Set y = 0: x = ${fracStr(-c, m)}`, solZh: `令 y = 0：x = ${fracStr(-c, m)}` });
    const X = R(-5, 6), m2 = m + (R(1, 4) * (Math.random() < 0.5 ? -1 : 1)), Y = m * X + c, c2 = Y - m2 * X;
    if (m2 === 0) return null;
    return mk({ topic: 'linear', value: X, en: `The lines ${line(m, c)} and ${line(m2, c2)} intersect. Find the x-coordinate of the intersection.`, zh: `直线 ${line(m, c)} 与 ${line(m2, c2)} 相交，求交点的横坐标。`,
      solEn: `${coef(m)}${sg(c)} = ${coef(m2)}${sg(c2)} → ${num(m - m2)}x = ${num(c2 - c)} → x = ${num(X)}`, solZh: `联立：${coef(m)}${sg(c)} = ${coef(m2)}${sg(c2)} → ${num(m - m2)}x = ${num(c2 - c)} → x = ${num(X)}` });
  });

  /* ---------- Measurement: area, volume, circles (π = 3.14 Chinese style), cylinders & cones ---------- */
  reg('meas', 4, (y, d) => {
    const ks = (KY.meas && KY.meas(y, d)) || (y <= 4 ? ['rect', 'conv', 'compound'] : y === 5 ? ['trap', 'tri', 'compound', 'cuboid', 'conv'] : y <= 7 ? ['circle', 'ring', 'cyl', 'cone', 'trap', 'semi'] : ['cyl', 'cone', 'sector', 'ring', 'sphere', 'compound']);
    const k = pick(ks);
    const s = d <= 1 ? 15 : d === 2 ? 30 : 60;
    if (k === 'rect') { const a = R(6, s), b = R(4, s), p = Math.random() < 0.5; return mk({ topic: 'meas', value: p ? 2 * (a + b) : a * b, unit: p ? 'cm' : 'cm²', en: `A rectangle is ${a} cm by ${b} cm. Find its ${p ? 'perimeter (cm)' : 'area (cm²)'}.`, zh: `长方形长 ${a} 厘米，宽 ${b} 厘米，求它的${p ? '周长（厘米）' : '面积（平方厘米）'}。`, solEn: p ? `2 × (${a} + ${b}) = ${2 * (a + b)} cm` : `${a} × ${b} = ${a * b} cm²`, solZh: p ? `(${a} + ${b}) × 2 = ${2 * (a + b)} 厘米` : `${a} × ${b} = ${a * b} 平方厘米` }); }
    if (k === 'conv') {
      const c = pick([['m²', 'cm²', 10000, '平方米', '平方厘米'], ['km', 'm', 1000, '千米', '米'], ['l', 'ml', 1000, '升', '毫升'], ['h', 'min', 60, '小时', '分钟'], ['kg', 'g', 1000, '千克', '克'], ['m³', 'cm³', 1000000, '立方米', '立方厘米']].slice(0, y <= 4 ? 5 : 6));
      const a = R(11, 99) / (c[2] === 60 ? 4 : 10), v = round(a * c[2], 4), uen = { h: 'hours', min: 'minutes', l: 'L', ml: 'mL' };
      return mk({ topic: 'meas', value: v, unit: c[1], en: `Convert ${a} ${uen[c[0]] || c[0]} to ${uen[c[1]] || c[1]}.`, zh: `${a} ${c[3]} = ？${c[4]}`, solEn: `× ${c[2]}: ${v}`, solZh: `进率是 ${c[2]}：${v} ${c[4]}` });
    }
    if (k === 'compound') {   // L-shape: big rectangle minus corner
      const A = R(10, s + 5), B = R(8, s), a = R(2, A - 3), b = R(2, B - 3), v = A * B - a * b;
      return mk({ topic: 'meas', value: v, unit: 'm²', en: `An L-shaped garden is a ${A} m × ${B} m rectangle with a ${a} m × ${b} m corner cut out. Find its area (m²).`, zh: `一块 L 形花园是一个长 ${A} 米、宽 ${B} 米的长方形去掉一个角上 ${a} 米 × ${b} 米的长方形，求它的面积（平方米）。`,
        solEn: `${A} × ${B} ${MINUS} ${a} × ${b} = ${A * B} ${MINUS} ${a * b} = ${v} m²`, solZh: `${A} × ${B} ${MINUS} ${a} × ${b} = ${v} 平方米` });
    }
    if (k === 'trap') { const a = R(3, s), b = R(a + 1, s + 10), h = 2 * R(2, s / 2), v = (a + b) * h / 2; return mk({ topic: 'meas', value: v, unit: 'cm²', en: `A trapezium has parallel sides ${a} cm and ${b} cm and height ${h} cm. Find its area (cm²).`, zh: `梯形的上底 ${a} 厘米，下底 ${b} 厘米，高 ${h} 厘米，求面积（平方厘米）。`, solEn: `(${a} + ${b}) × ${h} ÷ 2 = ${v} cm²`, solZh: `(${a} + ${b}) × ${h} ÷ 2 = ${v} 平方厘米` }); }
    if (k === 'tri') { const a = R(5, s), h = 2 * R(3, s / 2), v = a * h / 2; return mk({ topic: 'meas', value: v, unit: 'cm²', en: `A triangle has base ${a} cm and height ${h} cm. Find its area (cm²).`, zh: `三角形底 ${a} 厘米，高 ${h} 厘米，求面积（平方厘米）。`, solEn: `${a} × ${h} ÷ 2 = ${v} cm²`, solZh: `${a} × ${h} ÷ 2 = ${v} 平方厘米` }); }
    if (k === 'cuboid') { const a = R(3, 20), b = R(3, 20), c = R(3, 20), surf = Math.random() < 0.5, v = surf ? 2 * (a * b + b * c + a * c) : a * b * c; return mk({ topic: 'meas', value: v, unit: surf ? 'cm²' : 'cm³', en: `A cuboid is ${a} cm × ${b} cm × ${c} cm. Find its ${surf ? 'total surface area (cm²)' : 'volume (cm³)'}.`, zh: `长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，求它的${surf ? '表面积（平方厘米）' : '体积（立方厘米）'}。`, solEn: surf ? `2 × (${a}×${b} + ${b}×${c} + ${a}×${c}) = ${v} cm²` : `${a} × ${b} × ${c} = ${v} cm³`, solZh: surf ? `(${a}×${b} + ${b}×${c} + ${a}×${c}) × 2 = ${v} 平方厘米` : `${a} × ${b} × ${c} = ${v} 立方厘米` }); }
    // π = 3.14 questions (exact answers)
    const r = R(2, d >= 3 ? 20 : 10), h = R(3, 20), PI = 3.14;
    const pi = { en: ' Use π = 3.14.', zh: '（π 取 3.14）' };
    if (k === 'areaconv') {   // Year 7: 1 m² = 10 000 cm²
      const a = R(11, 99) / 10;
      if (Math.random() < 0.5) return mk({ topic: 'meas', value: round(a * 10000, 4), unit: 'cm²', en: `Convert ${a} m² to cm². (1 m² = 100 × 100 = 10 000 cm²)`, zh: `把 ${a} 平方米换算成平方厘米。（1 平方米 = 100 × 100 = 10 000 平方厘米）`, solEn: `${a} × 10 000 = ${round(a * 10000, 4)} cm²`, solZh: `${a} × 10 000 = ${round(a * 10000, 4)} 平方厘米` });
      const c2 = R(11, 99) * 1000; return mk({ topic: 'meas', value: c2 / 10000, unit: 'm²', en: `Convert ${c2} cm² to m². (1 m² = 10 000 cm²)`, zh: `把 ${c2} 平方厘米换算成平方米。（1 平方米 = 10 000 平方厘米）`, solEn: `${c2} ÷ 10 000 = ${c2 / 10000} m²`, solZh: `${c2} ÷ 10 000 = ${c2 / 10000} 平方米` });
    }
    if (k === 'para') {   // Year 7: parallelogram
      const b = R(4, s), h = R(3, s);
      return mk({ topic: 'meas', value: b * h, unit: 'cm²', en: `A parallelogram has base ${b} cm and perpendicular height ${h} cm. Find its area (cm²).`, zh: `平行四边形的底是 ${b} 厘米，垂直高是 ${h} 厘米，面积是多少平方厘米？`, solEn: `base × perpendicular height = ${b} × ${h} = ${b * h} cm²`, solZh: `底 × 高 = ${b} × ${h} = ${b * h} 平方厘米` });
    }
    if (k === 'prism') {   // Year 8-9: volume = area of the base × height
      if (Math.random() < 0.5) { const A = R(6, 60), H = R(3, 20); return mk({ topic: 'meas', value: A * H, unit: 'cm³', en: `A prism has a base area of ${A} cm² and a height of ${H} cm. Find its volume (cm³).`, zh: `棱柱的底面积是 ${A} 平方厘米，高是 ${H} 厘米，体积是多少立方厘米？`, solEn: `V = area of the base × height = ${A} × ${H} = ${A * H} cm³`, solZh: `体积 = 底面积 × 高 = ${A} × ${H} = ${A * H} 立方厘米` }); }
      const b = R(3, 16), hh = 2 * R(2, 8), L = R(4, 20), A = b * hh / 2;
      return mk({ topic: 'meas', value: A * L, unit: 'cm³', en: `A triangular prism has a triangle as its base (base ${b} cm, height ${hh} cm) and a length of ${L} cm. Find its volume (cm³).`, zh: `三棱柱的底面是三角形（底 ${b} 厘米，高 ${hh} 厘米），柱长 ${L} 厘米。体积是多少立方厘米？`, solEn: `Base area = ½ × ${b} × ${hh} = ${A}; V = ${A} × ${L} = ${A * L} cm³`, solZh: `底面积 = ½ × ${b} × ${hh} = ${A}；体积 = ${A} × ${L} = ${A * L} 立方厘米` });
    }
    if (k === 'volconv') {   // Year 9: volume units, 1000 cm³ = 1 litre
      if (Math.random() < 0.5) { const L = R(2, 90) / 2; return mk({ topic: 'meas', value: L * 1000, unit: 'cm³', en: `A tank holds ${L} litres. What is its volume in cm³? (1 litre = 1000 cm³)`, zh: `水箱能装 ${L} 升水，体积是多少立方厘米？（1 升 = 1000 立方厘米）`, solEn: `${L} × 1000 = ${L * 1000} cm³`, solZh: `${L} × 1000 = ${L * 1000} 立方厘米` }); }
      const cm3 = R(5, 90) * 100;
      return mk({ topic: 'meas', value: cm3 / 1000, unit: 'l', en: `A container has a volume of ${cm3} cm³. How many litres does it hold? (1000 cm³ = 1 litre)`, zh: `容器的体积是 ${cm3} 立方厘米，能装多少升？（1000 立方厘米 = 1 升）`, solEn: `${cm3} ÷ 1000 = ${cm3 / 1000} litres`, solZh: `${cm3} ÷ 1000 = ${cm3 / 1000} 升` });
    }
    if (k === 'pyramid') {   // Year 10: V = 1/3 × base area × height
      const a = R(3, 12), b = R(3, 12), hh = 3 * R(1, 8), v = a * b * hh / 3;
      return mk({ topic: 'meas', value: v, unit: 'cm³', en: `A pyramid has a rectangular base ${a} cm by ${b} cm and a height of ${hh} cm. Find its volume (cm³).`, zh: `棱锥的底面是 ${a} 厘米 × ${b} 厘米的长方形，高 ${hh} 厘米。体积是多少立方厘米？`, solEn: `V = ⅓ × ${a * b} × ${hh} = ${v} cm³`, solZh: `体积 = ⅓ × ${a * b} × ${hh} = ${v} 立方厘米` });
    }
    if (k === 'cylsa') {   // Year 9: surface area of a cylinder
      return mk({ topic: 'meas', value: round(2 * PI * r * r + 2 * PI * r * h, 4), unit: 'cm²', en: `A cylinder has radius ${r} cm and height ${h} cm. Find its total surface area (cm²).${pi.en}`, zh: `圆柱的底面半径 ${r} 厘米，高 ${h} 厘米，表面积是多少平方厘米？${pi.zh}`, solEn: `2πr² + 2πrh = 2 × 3.14 × ${r * r} + 2 × 3.14 × ${r} × ${h} = ${round(2 * PI * r * r + 2 * PI * r * h, 4)}`, solZh: `2πr² + 2πrh = 2 × 3.14 × ${r * r} + 2 × 3.14 × ${r} × ${h} = ${round(2 * PI * r * r + 2 * PI * r * h, 4)}` });
    }
    if (k === 'spheresa') {   // Year 10: surface area of a sphere
      const v = round(4 * PI * r * r, 4);
      return mk({ topic: 'meas', value: v, unit: 'cm²', en: `Find the surface area of a sphere with radius ${r} cm (cm²).${pi.en}`, zh: `球的半径是 ${r} 厘米，表面积是多少平方厘米？${pi.zh}`, solEn: `4πr² = 4 × 3.14 × ${r * r} = ${v}`, solZh: `4πr² = 4 × 3.14 × ${r * r} = ${v}` });
    }
    if (k === 'conecsa') {   // Year 10: curved surface area of a cone, πrl
      const l = r + R(1, 8), v = round(PI * r * l, 4);
      return mk({ topic: 'meas', value: v, unit: 'cm²', en: `A cone has base radius ${r} cm and slant height ${l} cm. Find its curved surface area (cm²).${pi.en}`, zh: `圆锥的底面半径 ${r} 厘米，母线长 ${l} 厘米，侧面积是多少平方厘米？${pi.zh}`, solEn: `πrl = 3.14 × ${r} × ${l} = ${v}`, solZh: `πrl = 3.14 × ${r} × ${l} = ${v}` });
    }
    if (k === 'circle') { const area = Math.random() < 0.5, v = round(area ? PI * r * r : 2 * PI * r, 4); return mk({ topic: 'meas', value: v, unit: area ? 'cm²' : 'cm', en: `A circle has ${d >= 3 ? 'diameter ' + 2 * r : 'radius ' + r} cm. Find its ${area ? 'area (cm²)' : 'circumference (cm)'}.${pi.en}`, zh: `一个圆的${d >= 3 ? '直径是 ' + 2 * r : '半径是 ' + r} 厘米，求它的${area ? '面积（平方厘米）' : '周长（厘米）'}${pi.zh}。`, solEn: area ? `3.14 × ${r}² = ${v} cm²` : `2 × 3.14 × ${r} = ${v} cm`, solZh: area ? `S = πr² = 3.14 × ${r}² = ${v} 平方厘米` : `C = 2πr = 2 × 3.14 × ${r} = ${v} 厘米` }); }
    if (k === 'semi') { const v = round(PI * r + 2 * r, 4); return mk({ topic: 'meas', value: v, unit: 'cm', en: `Find the perimeter of a semicircle with radius ${r} cm (curved part + diameter).${pi.en}`, zh: `求半径为 ${r} 厘米的半圆的周长（弧长加直径）${pi.zh}。`, solEn: `3.14 × ${r} + 2 × ${r} = ${v} cm`, solZh: `3.14 × ${r} + ${r} × 2 = ${v} 厘米` }); }
    if (k === 'ring') { const R2 = r + R(1, 6), v = round(PI * (R2 * R2 - r * r), 4); return mk({ topic: 'meas', value: v, unit: 'cm²', en: `A ring (annulus) has outer radius ${R2} cm and inner radius ${r} cm. Find its area (cm²).${pi.en}`, zh: `一个圆环外圆半径 ${R2} 厘米，内圆半径 ${r} 厘米，求圆环面积（平方厘米）${pi.zh}。`, solEn: `3.14 × (${R2}² ${MINUS} ${r}²) = ${v} cm²`, solZh: `3.14 × (${R2}² ${MINUS} ${r}²) = ${v} 平方厘米` }); }
    if (k === 'cyl') { const surf = d >= 3 && Math.random() < 0.5, v = round(surf ? 2 * PI * r * r + 2 * PI * r * h : PI * r * r * h, 4); return mk({ topic: 'meas', value: v, unit: surf ? 'cm²' : 'cm³', en: `A cylinder has radius ${r} cm and height ${h} cm. Find its ${surf ? 'total surface area (cm²)' : 'volume (cm³)'}.${pi.en}`, zh: `圆柱的底面半径 ${r} 厘米，高 ${h} 厘米，求它的${surf ? '表面积（平方厘米）' : '体积（立方厘米）'}${pi.zh}。`, solEn: surf ? `2 × 3.14 × ${r}² + 2 × 3.14 × ${r} × ${h} = ${v} cm²` : `3.14 × ${r}² × ${h} = ${v} cm³`, solZh: surf ? `2 × 3.14 × ${r}² + 2 × 3.14 × ${r} × ${h} = ${v} 平方厘米` : `V = πr²h = 3.14 × ${r}² × ${h} = ${v} 立方厘米` }); }
    if (k === 'cone') { const hh = 3 * R(1, 8), v = round(PI * r * r * hh / 3, 4); return mk({ topic: 'meas', value: v, unit: 'cm³', en: `A cone has base radius ${r} cm and height ${hh} cm. Find its volume (cm³).${pi.en}`, zh: `圆锥的底面半径 ${r} 厘米，高 ${hh} 厘米，求它的体积（立方厘米）${pi.zh}。`, solEn: `⅓ × 3.14 × ${r}² × ${hh} = ${v} cm³`, solZh: `V = ⅓πr²h = ⅓ × 3.14 × ${r}² × ${hh} = ${v} 立方厘米` }); }
    if (k === 'sphere') { const rr = 3 * R(1, 4), v = round(4 / 3 * PI * rr ** 3, 4); return mk({ topic: 'meas', value: v, unit: 'cm³', en: `Find the volume of a sphere with radius ${rr} cm (cm³).${pi.en}`, zh: `求半径为 ${rr} 厘米的球的体积（立方厘米）${pi.zh}。`, solEn: `4/3 × 3.14 × ${rr}³ = ${v} cm³`, solZh: `V = 4/3 πr³ = ${v} 立方厘米` }); }
    const ang = pick([30, 45, 60, 72, 90, 120, 150]), rr = 6 * R(1, 5), v = round(PI * rr * rr * ang / 360, 4);
    return mk({ topic: 'meas', value: v, unit: 'cm²', en: `A sector has radius ${rr} cm and angle ${ang}°. Find its area (cm²).${pi.en}`, zh: `扇形半径 ${rr} 厘米，圆心角 ${ang}°，求扇形面积（平方厘米）${pi.zh}。`, solEn: `${ang}/360 × 3.14 × ${rr}² = ${v} cm²`, solZh: `${ang}/360 × 3.14 × ${rr}² = ${v} 平方厘米` });
  });

  /* ---------- Angles & geometry ---------- */
  reg('angle', 4, (y, d) => {
    const ks = (KY.angle && KY.angle(y, d)) || (y <= 5 ? ['line', 'point', 'tri', 'clock'] : y <= 7 ? ['tri', 'iso', 'ext', 'parallel', 'clock'] : ['poly', 'ext', 'iso', 'parallel', 'regular']);
    const k = pick(ks);
    if (k === 'line') { const a = R(15, 165), v = 180 - a; return mk({ topic: 'angle', value: v, unit: '°', en: `Two angles make a straight line. One is ${a}°. Find the other.`, zh: `两个角组成一个平角，一个角是 ${a}°，另一个角是多少度？`, solEn: `180 ${MINUS} ${a} = ${v}°`, solZh: `180 ${MINUS} ${a} = ${v}°` }); }
    if (k === 'point') { const a = R(40, 150), b = R(40, 150), v = 360 - a - b; return mk({ topic: 'angle', value: v, unit: '°', en: `Three angles meet at a point. Two are ${a}° and ${b}°. Find the third.`, zh: `三个角组成一个周角，其中两个是 ${a}° 和 ${b}°，求第三个角。`, solEn: `360 ${MINUS} ${a} ${MINUS} ${b} = ${v}°`, solZh: `360 ${MINUS} ${a} ${MINUS} ${b} = ${v}°` }); }
    if (k === 'tri') { const a = R(20, 100), b = R(20, 150 - a), v = 180 - a - b; return mk({ topic: 'angle', value: v, unit: '°', en: `Two angles of a triangle are ${a}° and ${b}°. Find the third.`, zh: `三角形的两个内角是 ${a}° 和 ${b}°，第三个角是多少度？`, solEn: `180 ${MINUS} ${a} ${MINUS} ${b} = ${v}°`, solZh: `180 ${MINUS} ${a} ${MINUS} ${b} = ${v}°` }); }
    if (k === 'iso') { const apex = 2 * R(10, 70), v = (180 - apex) / 2; return mk({ topic: 'angle', value: v, unit: '°', en: `An isosceles triangle has apex angle ${apex}°. Find each base angle.`, zh: `等腰三角形的顶角是 ${apex}°，每个底角是多少度？`, solEn: `(180 ${MINUS} ${apex}) ÷ 2 = ${v}°`, solZh: `(180 ${MINUS} ${apex}) ÷ 2 = ${v}°` }); }
    if (k === 'ext') { const a = R(25, 80), b = R(25, 80), v = a + b; return mk({ topic: 'angle', value: v, unit: '°', en: `Two interior angles of a triangle are ${a}° and ${b}°. Find the exterior angle at the third vertex.`, zh: `三角形的两个内角是 ${a}° 和 ${b}°，第三个顶点处的外角是多少度？`, solEn: `Exterior angle = sum of the two opposite interior angles = ${v}°`, solZh: `外角等于与它不相邻的两个内角之和：${v}°` }); }
    if (k === 'parallel') { const a = R(35, 145), t = pick(['alt', 'co']), v = t === 'alt' ? a : 180 - a; return mk({ topic: 'angle', value: v, unit: '°', en: `A line crosses two parallel lines. One angle is ${a}°. Find the ${t === 'alt' ? 'alternate' : 'co-interior (same-side interior)'} angle.`, zh: `一条直线截两条平行线，其中一个角是 ${a}°，求它的${t === 'alt' ? '内错角' : '同旁内角'}。`, solEn: t === 'alt' ? `Alternate angles are equal: ${v}°` : `Co-interior angles add to 180°: ${v}°`, solZh: t === 'alt' ? `内错角相等：${v}°` : `同旁内角互补：${v}°` }); }
    if (k === 'clock') { const h = R(1, 11), m = d >= 3 ? pick([0, 30, 20, 40]) : 0, raw = Math.abs(30 * h + 0.5 * m - 6 * m), v = Math.min(raw, 360 - raw); return mk({ topic: 'angle', value: v, unit: '°', en: `What is the smaller angle between the hour and minute hands at ${h}:${String(m).padStart(2, '0')}?`, zh: `${h} 点 ${m} 分时，时针与分针所成的较小角是多少度？`, solEn: `Hour hand ${30 * h + 0.5 * m}°, minute hand ${6 * m}°; difference ${v}°`, solZh: `时针 ${30 * h + 0.5 * m}°，分针 ${6 * m}°，夹角 ${v}°` }); }
    if (k === 'vert') {   // Year 7: vertically opposite angles are equal
      let x, p, r, q, s2;
      do { x = R(10, 40); p = R(2, 5); r = p + R(1, 3); q = R(5, 30); s2 = p * x + q - r * x; } while (s2 === 0);   // v2.3.0 R4.2: no "+ 0"
      return mk({ topic: 'angle', value: x, en: `Two straight lines cross. Two vertically opposite angles are (${p}x + ${q})° and (${coef(r)}${sg(s2)})°. Find x.`, zh: `两条直线相交，两个对顶角分别是 (${p}x + ${q})° 和 (${coef(r)}${sg(s2)})°。求 x。`, solEn: `Vertically opposite angles are equal: ${p}x + ${q} = ${coef(r)}${sg(s2)}, so x = ${x}`, solZh: `对顶角相等：${p}x + ${q} = ${coef(r)}${sg(s2)}，所以 x = ${x}` });
    }
    if (k === 'corr') {   // Year 7: corresponding angles on parallel lines
      const a = R(35, 145);
      return mk({ topic: 'angle', value: a, unit: '°', en: `A line crosses two parallel lines. One angle is ${a}°. Find the corresponding angle.`, zh: `一条直线与两条平行线相交，其中一个角是 ${a}°，求它的同位角。`, solEn: `Corresponding angles on parallel lines are equal: ${a}°`, solZh: `平行线的同位角相等：${a}°` });
    }
    if (k === 'quad') {   // Year 8: angles in a quadrilateral add to 360°
      const a = R(50, 120), b = R(50, 120), c = R(50, 120), v = 360 - a - b - c;
      if (v < 20) return null;
      return mk({ topic: 'angle', value: v, unit: '°', en: `Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. Find the fourth angle.`, zh: `四边形的三个角是 ${a}°、${b}°、${c}°，求第四个角。`, solEn: `360° ${MINUS} ${a}° ${MINUS} ${b}° ${MINUS} ${c}° = ${v}°`, solZh: `360° ${MINUS} ${a}° ${MINUS} ${b}° ${MINUS} ${c}° = ${v}°` });
    }
    if (k === 'congr') {   // Year 9: congruent figures
      const ab = R(4, 15), bc = R(4, 15), ang = R(35, 100), askAngle = Math.random() < 0.4;
      if (askAngle) return mk({ topic: 'angle', value: ang, unit: '°', en: `Triangles ABC and DEF are congruent, with A matching D, B matching E and C matching F. Angle B = ${ang}°. Find angle E.`, zh: `三角形 ABC 与 DEF 全等，A 对应 D，B 对应 E，C 对应 F。∠B = ${ang}°，求 ∠E。`, solEn: `Matching angles of congruent triangles are equal: angle E = ${ang}°`, solZh: `全等三角形的对应角相等：∠E = ${ang}°` });
      return mk({ topic: 'angle', value: bc, unit: 'cm', en: `Triangles ABC and DEF are congruent, with A matching D, B matching E and C matching F. AB = ${ab} cm and EF = ${bc} cm. Find BC.`, zh: `三角形 ABC 与 DEF 全等，A 对应 D，B 对应 E，C 对应 F。AB = ${ab} 厘米，EF = ${bc} 厘米。求 BC。`, solEn: `BC matches EF, so BC = ${bc} cm`, solZh: `BC 对应 EF，所以 BC = ${bc} 厘米` });
    }
    if (k === 'similar') {   // Year 9: similar figures and the scale factor
      const a = R(2, 9), f = R(2, 5), b = R(3, 12);
      return mk({ topic: 'angle', value: b * f, unit: 'cm', en: `Triangle PQR is similar to triangle ABC. AB = ${a} cm, PQ = ${a * f} cm and BC = ${b} cm. Find QR.`, zh: `三角形 PQR 与三角形 ABC 相似。AB = ${a} 厘米，PQ = ${a * f} 厘米，BC = ${b} 厘米。求 QR。`, solEn: `Scale factor = ${a * f} ÷ ${a} = ${f}; QR = ${b} × ${f} = ${b * f} cm`, solZh: `相似比 = ${a * f} ÷ ${a} = ${f}；QR = ${b} × ${f} = ${b * f} 厘米` });
    }
    if (k === 'scalearea') {   // Year 9: an area is multiplied by k²
      const A = R(2, 30), f = R(2, 5);
      return mk({ topic: 'angle', value: A * f * f, unit: 'cm²', en: `A shape has an area of ${A} cm². It is enlarged with a scale factor of ${f}. Find the area of the enlarged shape (cm²).`, zh: `一个图形的面积是 ${A} 平方厘米，按相似比 ${f} 放大，放大后的面积是多少平方厘米？`, solEn: `Areas are multiplied by ${f}² = ${f * f}: ${A} × ${f * f} = ${A * f * f}`, solZh: `面积乘以 ${f}² = ${f * f}：${A} × ${f * f} = ${A * f * f}` });
    }
    if (k === 'centre') {   // Year 10: the angle at the centre is twice the angle at the circumference
      const a = R(15, 80);
      if (Math.random() < 0.5) return mk({ topic: 'angle', value: 2 * a, unit: '°', en: `An arc of a circle makes an angle of ${a}° at the circumference. What angle does the same arc make at the centre?`, zh: `圆上一段弧所对的圆周角是 ${a}°，同一段弧所对的圆心角是多少度？`, solEn: `The angle at the centre is twice the angle at the circumference: 2 × ${a} = ${2 * a}°`, solZh: `圆心角是圆周角的 2 倍：2 × ${a} = ${2 * a}°` });
      return mk({ topic: 'angle', value: a, unit: '°', en: `An arc of a circle makes an angle of ${2 * a}° at the centre. What angle does the same arc make at the circumference?`, zh: `圆上一段弧所对的圆心角是 ${2 * a}°，同一段弧所对的圆周角是多少度？`, solEn: `The angle at the circumference is half the angle at the centre: ${2 * a} ÷ 2 = ${a}°`, solZh: `圆周角是圆心角的一半：${2 * a} ÷ 2 = ${a}°` });
    }
    if (k === 'semicirc') {   // Year 10: the angle in a semicircle is 90°
      const a = R(15, 75);
      return mk({ topic: 'angle', value: 90 - a, unit: '°', en: `AB is a diameter of a circle and C is a point on the circle. Angle CAB = ${a}°. Find angle CBA.`, zh: `AB 是圆的直径，C 是圆上一点。∠CAB = ${a}°，求 ∠CBA。`, solEn: `The angle in a semicircle is 90°, so angle CBA = 180° ${MINUS} 90° ${MINUS} ${a}° = ${90 - a}°`, solZh: `直径所对的圆周角是 90°，所以 ∠CBA = 180° ${MINUS} 90° ${MINUS} ${a}° = ${90 - a}°` });
    }
    if (k === 'sameseg') {   // Year 10: angles in the same segment are equal (v2.3.0 R4.7)
      const a = R(25, 80);
      return mk({ topic: 'angle', value: a, unit: '°', en: `A, B, C and D are points on a circle, with C and D on the same side of the chord AB. Angle ACB = ${a}°. Find angle ADB.`, zh: `A、B、C、D 是圆上的四个点，C 和 D 在弦 AB 的同一侧。∠ACB = ${a}°，求 ∠ADB。`, solEn: `Angles in the same segment are equal: angle ADB = angle ACB = ${a}°`, solZh: `同弓形内的圆周角相等：∠ADB = ∠ACB = ${a}°` });
    }
    if (k === 'cyclic') {   // Year 10: opposite angles of a cyclic quadrilateral
      const a = R(60, 120);
      return mk({ topic: 'angle', value: 180 - a, unit: '°', en: `ABCD is a cyclic quadrilateral. Angle A = ${a}°. Find the opposite angle C.`, zh: `ABCD 是圆内接四边形，∠A = ${a}°。求对角 ∠C。`, solEn: `Opposite angles of a cyclic quadrilateral add to 180°: 180° ${MINUS} ${a}° = ${180 - a}°`, solZh: `圆内接四边形的对角互补：180° ${MINUS} ${a}° = ${180 - a}°` });
    }
    if (k === 'tangent') {   // Year 10: a tangent meets the radius at 90°
      const a = R(20, 70);
      return mk({ topic: 'angle', value: 90 - a, unit: '°', en: `The line PT touches a circle with centre O at T. Angle TOP = ${a}°. Find angle OPT.`, zh: `直线 PT 与圆心为 O 的圆相切于 T。∠TOP = ${a}°，求 ∠OPT。`, solEn: `A tangent meets the radius at 90°, so angle OTP = 90° and angle OPT = 180° ${MINUS} 90° ${MINUS} ${a}° = ${90 - a}°`, solZh: `切线垂直于过切点的半径，∠OTP = 90°，所以 ∠OPT = 180° ${MINUS} 90° ${MINUS} ${a}° = ${90 - a}°` });
    }
    const n = R(5, 12), sum = (n - 2) * 180;
    if (k === 'poly') return mk({ topic: 'angle', value: sum, unit: '°', en: `Find the sum of the interior angles of a ${n}-sided polygon.`, zh: `求 ${n} 边形的内角和。`, solEn: `(${n} ${MINUS} 2) × 180 = ${sum}°`, solZh: `(${n} ${MINUS} 2) × 180° = ${sum}°` });
    const ext = pick([24, 30, 36, 40, 45, 60, 72, 20, 18, 15]);
    return mk({ topic: 'angle', value: 360 / ext, en: `Each exterior angle of a regular polygon is ${ext}°. How many sides does it have?`, zh: `一个正多边形的每个外角是 ${ext}°，它有几条边？`, solEn: `360 ÷ ${ext} = ${360 / ext}`, solZh: `360 ÷ ${ext} = ${360 / ext}` });
  });

  /* ---------- Pythagoras & trigonometry ---------- */
  /* Years 8-10 (v2.2.0 R4): what the year's lesson teaches. Year 8: Pythagoras' theorem. Year 9: sine, cosine and tangent.
     Year 10: angles of elevation and depression, and bearings. */
  function pythHS(y, d) {
    const deg = a => a * Math.PI / 180, r1 = v => round(v, 1), oneDp = { tol: 0.051 };
    if (y === 8) {
      const k = pick(['hyp', 'leg', 'leg', 'triple']), m = R(1, d + 2), [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]).map(v => v * m);
      if (k === 'hyp') return mk({ topic: 'pyth', value: c, unit: 'cm', en: `A right-angled triangle has legs ${a} cm and ${b} cm. Find the hypotenuse.`, zh: `直角三角形的两条直角边是 ${a} 厘米和 ${b} 厘米，求斜边。`, solEn: `c² = ${a}² + ${b}² = ${a * a + b * b}, so c = ${c}`, solZh: `c² = ${a}² + ${b}² = ${a * a + b * b}，所以 c = ${c}` });
      if (k === 'leg') return mk({ topic: 'pyth', value: b, unit: 'm', en: `A ladder ${c} m long leans against a wall. Its foot is ${a} m from the wall. How high up the wall does it reach (m)?`, zh: `一架 ${c} 米长的梯子靠在墙上，梯脚离墙 ${a} 米。梯子顶端离地多少米？`, solEn: `b² = ${c}² ${MINUS} ${a}² = ${c * c - a * a}, so b = ${b}`, solZh: `b² = ${c}² ${MINUS} ${a}² = ${c * c - a * a}，所以 b = ${b}` });
      const t = x => x.join(', ');
      return G.mc({ topic: 'pyth', en: 'Which set of numbers is a Pythagorean triple?', zh: '下面哪一组数是勾股数？', correct: t([a, b, c]), wrong: [t([a, b, c + 1]), t([a + 1, b, c]), t([a, b + 2, c - 1])].filter(w => { const n = w.split(', ').map(Number); return n[0] * n[0] + n[1] * n[1] !== n[2] * n[2]; }), solEn: `Check a² + b² = c²: ${a}² + ${b}² = ${a * a + b * b} = ${c}²`, solZh: `验证 a² + b² = c²：${a}² + ${b}² = ${a * a + b * b} = ${c}²` });
    }
    if (y === 9) {
      const k = pick(['opp', 'adj', 'ang']), ang = R(20, 70), h = R(8, 40);
      if (k === 'opp') { const v = r1(h * Math.sin(deg(ang))); return mk({ topic: 'pyth', value: v, unit: 'cm', ...oneDp, answer: v.toFixed(1) + ' cm', en: `In a right-angled triangle the hypotenuse is ${h} cm and one angle is ${ang}°. Find the side opposite that angle, to 1 decimal place.`, zh: `直角三角形的斜边是 ${h} 厘米，一个锐角是 ${ang}°。求这个角的对边，保留一位小数。`, solEn: `sin ${ang}° = opposite ÷ ${h}, so opposite = ${h} × sin ${ang}° ≈ ${v.toFixed(1)} cm`, solZh: `sin ${ang}° = 对边 ÷ ${h}，所以对边 = ${h} × sin ${ang}° ≈ ${v.toFixed(1)} 厘米` }); }
      if (k === 'adj') { const o = R(5, 30), v = r1(o / Math.tan(deg(ang))); return mk({ topic: 'pyth', value: v, unit: 'cm', ...oneDp, answer: v.toFixed(1) + ' cm', en: `In a right-angled triangle one angle is ${ang}° and the side opposite it is ${o} cm. Find the side adjacent to that angle, to 1 decimal place.`, zh: `直角三角形的一个锐角是 ${ang}°，它的对边是 ${o} 厘米。求这个角的邻边，保留一位小数。`, solEn: `tan ${ang}° = ${o} ÷ adjacent, so adjacent = ${o} ÷ tan ${ang}° ≈ ${v.toFixed(1)} cm`, solZh: `tan ${ang}° = ${o} ÷ 邻边，所以邻边 = ${o} ÷ tan ${ang}° ≈ ${v.toFixed(1)} 厘米` }); }
      const o = R(3, 20), hy = o + R(2, 15), v = Math.round(Math.asin(o / hy) * 180 / Math.PI), exact = Math.asin(o / hy) * 180 / Math.PI;
      if (Math.abs(exact - Math.floor(exact) - 0.5) < 0.08) return null;
      return mk({ topic: 'pyth', value: v, unit: '°', en: `In a right-angled triangle the side opposite angle θ is ${o} cm and the hypotenuse is ${hy} cm. Find θ to the nearest degree.`, zh: `直角三角形中，角 θ 的对边是 ${o} 厘米，斜边是 ${hy} 厘米。求 θ，精确到整数度。`, solEn: `sin θ = ${o} ÷ ${hy}, so θ = sin⁻¹(${o}/${hy}) ≈ ${v}°`, solZh: `sin θ = ${o} ÷ ${hy}，所以 θ = sin⁻¹(${o}/${hy}) ≈ ${v}°` });
    }
    const k = pick(['elev', 'depress', 'bearing']);
    if (k === 'elev') { const dist = R(10, 80), ang = R(15, 65), v = r1(dist * Math.tan(deg(ang))); return mk({ topic: 'pyth', value: v, unit: 'm', ...oneDp, answer: v.toFixed(1) + ' m', en: `From a point ${dist} m from the foot of a tower, the angle of elevation of the top is ${ang}°. Find the height of the tower, to 1 decimal place (m).`, zh: `在离塔底 ${dist} 米处，测得塔顶的仰角是 ${ang}°。求塔高（米），保留一位小数。`, solEn: `tan ${ang}° = height ÷ ${dist}, so height = ${dist} × tan ${ang}° ≈ ${v.toFixed(1)} m`, solZh: `tan ${ang}° = 塔高 ÷ ${dist}，所以塔高 = ${dist} × tan ${ang}° ≈ ${v.toFixed(1)} 米` }); }
    if (k === 'depress') { const hh = R(20, 90), ang = R(15, 65), v = r1(hh / Math.tan(deg(ang))); return mk({ topic: 'pyth', value: v, unit: 'm', ...oneDp, answer: v.toFixed(1) + ' m', en: `From the top of a ${hh} m cliff, the angle of depression of a boat is ${ang}°. How far is the boat from the foot of the cliff? Give the answer to 1 decimal place (m).`, zh: `在 ${hh} 米高的悬崖顶上，测得一艘船的俯角是 ${ang}°。船离崖脚多远（米）？保留一位小数。`, solEn: `The angle at the boat is also ${ang}°: tan ${ang}° = ${hh} ÷ distance, so distance = ${hh} ÷ tan ${ang}° ≈ ${v.toFixed(1)} m`, solZh: `船处的角也是 ${ang}°：tan ${ang}° = ${hh} ÷ 距离，所以距离 = ${hh} ÷ tan ${ang}° ≈ ${v.toFixed(1)} 米` }); }
    const f = R(2, 16) * 10, back = f + 180;
    return mk({ topic: 'pyth', value: back, unit: '°', en: `The bearing of B from A is ${String(f).padStart(3, '0')}°. What is the bearing of A from B? (A bearing is measured clockwise from north and written with 3 digits.)`, zh: `B 在 A 的方位角是 ${String(f).padStart(3, '0')}°。A 在 B 的方位角是多少度？（方位角从正北顺时针量起，写三位数）`, solEn: `Go back the other way: ${f}° + 180° = ${back}°`, solZh: `反方向再转 180°：${f}° + 180° = ${back}°` });
  }
  reg('pyth', 8, (y, d) => {
    if (y >= 8 && y <= 10) return pythHS(y, d);
    if (y >= 9 && Math.random() < 0.45) {
      const ang = pick([30, 60, 45]), h = 2 * R(2, 15), opp = ang === 30 ? h / 2 : null;
      if (ang === 30) return mk({ topic: 'pyth', value: opp, unit: 'cm', en: `In a right-angled triangle, the hypotenuse is ${h} cm and one angle is 30°. Find the side opposite the 30° angle.`, zh: `直角三角形中，斜边长 ${h} 厘米，一个锐角为 30°，求 30° 角所对的直角边。`, solEn: `sin 30° = 1/2, so ${h} × 1/2 = ${opp} cm`, solZh: `30° 角所对的直角边等于斜边的一半：${opp} 厘米` });
      const a = R(3, 20);
      if (ang === 45) return mk({ topic: 'pyth', value: a, unit: 'cm', en: `A right-angled triangle has a 45° angle and one leg of ${a} cm. Find the other leg.`, zh: `直角三角形有一个 45° 角，一条直角边长 ${a} 厘米，求另一条直角边。`, solEn: `tan 45° = 1, so both legs are ${a} cm`, solZh: `tan 45° = 1，两条直角边相等：${a} 厘米` });
      const v = round(a * Math.tan(Math.PI / 3), 2);
      return mk({ topic: 'pyth', value: v, unit: 'cm', tol: 0.011, answer: v.toFixed(2) + ' cm', en: `In a right-angled triangle, the side adjacent to a 60° angle is ${a} cm. Find the opposite side to 2 d.p.`, zh: `直角三角形中，60° 角的邻边长 ${a} 厘米，求它的对边（保留两位小数）。`, solEn: `opposite = ${a} × tan 60° ≈ ${v.toFixed(2)} cm`, solZh: `对边 = ${a} × tan 60° ≈ ${v.toFixed(2)} 厘米` });
    }
    if (d >= 3 && Math.random() < 0.4) {
      const x1 = R(-6, 6), y1 = R(-6, 6), [p, q, c] = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]]), x2 = x1 + p * (Math.random() < 0.5 ? -1 : 1), y2 = y1 + q * (Math.random() < 0.5 ? -1 : 1);
      return mk({ topic: 'pyth', value: c, en: `Find the distance between (${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)}).`, zh: `求点 (${num(x1)}, ${num(y1)}) 与 (${num(x2)}, ${num(y2)}) 之间的距离。`, solEn: `√(${p}² + ${q}²) = ${c}`, solZh: `√(${p}² + ${q}²) = ${c}` });
    }
    const T = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]), m = R(1, d + 2), [a, b, c] = T.map(v => v * m);
    if (Math.random() < 0.5) return mk({ topic: 'pyth', value: c, unit: 'cm', en: `A right-angled triangle has legs ${a} cm and ${b} cm. Find the hypotenuse.`, zh: `直角三角形两条直角边分别为 ${a} 厘米和 ${b} 厘米，求斜边。`, solEn: `√(${a}² + ${b}²) = √${a * a + b * b} = ${c} cm`, solZh: `√(${a}² + ${b}²) = √${a * a + b * b} = ${c} 厘米` });
    return mk({ topic: 'pyth', value: b, unit: 'cm', en: `A ladder ${c} m long leans against a wall. Its foot is ${a} m from the wall. How high up the wall does it reach (m)?`, zh: `一架长 ${c} 米的梯子靠在墙上，梯脚离墙 ${a} 米，梯子顶端离地面多高（米）？`, solEn: `√(${c}² ${MINUS} ${a}²) = √${c * c - a * a} = ${b} m`, solZh: `√(${c}² ${MINUS} ${a}²) = √${c * c - a * a} = ${b} 米`, unit: 'm' });
  });

  /* ---------- Statistics ---------- */
  reg('stats', 5, (y, d) => {
    const k = ky('stats', y, d) || (pick(d <= 1 ? ['mean', 'median', 'range'] : ['missing', 'median', 'combined', 'mean']));
    const n = R(5, 8), data = Array.from({ length: n }, () => R(d >= 3 ? 20 : 5, d >= 3 ? 99 : 40)), sorted = [...data].sort((a, b) => a - b);
    if (k === 'freq' || k === 'dot') {   // Year 7: frequency tables and dot plots
      const vals = [1, 2, 3, 4, 5, 6].slice(0, R(4, 6)), fr = vals.map(() => R(1, 9)), tot = fr.reduce((a, b) => a + b, 0), top = Math.max(...fr);
      const list = vals.map((v, i) => k === 'freq' ? `${v}: ${fr[i]}` : `${v} has ${fr[i]} ${fr[i] === 1 ? 'dot' : 'dots'}`).join(', ');
      const listZh = vals.map((v, i) => k === 'freq' ? `${v}：${fr[i]}` : `${v} 有 ${fr[i]} 个点`).join('，');
      const lead = k === 'freq' ? 'A frequency table shows each score and how many times it occurred (score: frequency)' : 'A dot plot has one dot for each value';
      const leadZh = k === 'freq' ? '频数表列出每个分数及其出现的次数（分数：频数）' : '点图中每个数据值对应一个点';
      const kind = k === 'freq' ? pick(['total', 'above']) : pick(['mode', 'above']);
      if (kind === 'total') return mk({ topic: 'stats', value: tot, en: `${lead}: ${list}. How many scores are there altogether?`, zh: `${leadZh}：${listZh}。一共有多少个分数？`, solEn: `Add the frequencies: ${fr.join(' + ')} = ${tot}`, solZh: `把频数相加：${fr.join(' + ')} = ${tot}` });
      if (kind === 'mode') { if (fr.filter(f => f === top).length !== 1) return null; const m = vals[fr.indexOf(top)]; return mk({ topic: 'stats', value: m, en: `${lead}: ${list}. Which value has the most dots (the mode)?`, zh: `${leadZh}：${listZh}。哪个值的点最多（众数）？`, solEn: `${m} has the most dots (${top})`, solZh: `${m} 的点最多（${top} 个）` }); }
      const cut = vals[R(1, vals.length - 2)], n = vals.reduce((s, v, i) => s + (v > cut ? fr[i] : 0), 0);
      return mk({ topic: 'stats', value: n, en: `${lead}: ${list}. How many values are greater than ${cut}?`, zh: `${leadZh}：${listZh}。有多少个值大于 ${cut}？`, solEn: `Add the frequencies of the values above ${cut}: ${n}`, solZh: `把大于 ${cut} 的各值的频数相加：${n}` });
    }
    if (k === 'column') {   // Year 7: column graphs
      const names = pick([[['cats', 'dogs', 'fish', 'birds'], ['猫', '狗', '鱼', '鸟']], [['football', 'tennis', 'cricket', 'swimming'], ['足球', '网球', '板球', '游泳']], [['red', 'blue', 'green', 'yellow'], ['红色', '蓝色', '绿色', '黄色']]]);
      const hs = G.shuffle(Array.from({ length: 15 }, (_, i) => i + 2)).slice(0, 4), hi = hs.indexOf(Math.max(...hs)), lo = hs.indexOf(Math.min(...hs));
      const list = names[0].map((nm, i) => `${nm} ${hs[i]}`).join(', '), listZh = names[1].map((nm, i) => `${nm} ${hs[i]}`).join('，');
      return mk({ topic: 'stats', value: hs[hi] - hs[lo], en: `A column graph has columns of these heights (number of students): ${list}. How many more are in the tallest column than in the shortest?`, zh: `柱状图各柱的高度（学生人数）：${listZh}。最高的柱比最矮的柱多多少人？`, solEn: `${hs[hi]} ${MINUS} ${hs[lo]} = ${hs[hi] - hs[lo]}`, solZh: `${hs[hi]} ${MINUS} ${hs[lo]} = ${hs[hi] - hs[lo]}` });
    }
    if (k === 'mode') {   // Year 8: the mode
      const m = R(5, 40), others = G.shuffle(Array.from({ length: 36 }, (_, i) => i + 5).filter(v => v !== m)).slice(0, R(4, 6)), all = G.shuffle([m, m, m, ...others]);
      return mk({ topic: 'stats', value: m, en: `Find the mode of: ${all.join(', ')}`, zh: `求这组数据的众数：${all.join('，')}`, solEn: `${m} occurs most often (3 times)`, solZh: `${m} 出现次数最多（3 次）` });
    }
    if (k === 'stem') {   // Year 9: stem-and-leaf plots
      const s0 = R(1, 5), rows = Array.from({ length: R(3, 4) }, (_, i) => ({ stem: s0 + i, leaves: G.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, R(2, 4)).sort((a, b) => a - b) }));
      if (rows.reduce((s, r) => s + r.leaves.length, 0) % 2 === 0) { const last = rows[rows.length - 1]; const free = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(v => !last.leaves.includes(v)); last.leaves.push(pick(free)); last.leaves.sort((a, b) => a - b); }
      const vals = rows.flatMap(r => r.leaves.map(l => r.stem * 10 + l)).sort((a, b) => a - b), plot = rows.map(r => `${r.stem} | ${r.leaves.join(' ')}`).join(';  ');
      const key = `${rows[0].stem} | ${rows[0].leaves[0]} means ${rows[0].stem * 10 + rows[0].leaves[0]}`, keyZh = `${rows[0].stem} | ${rows[0].leaves[0]} 表示 ${rows[0].stem * 10 + rows[0].leaves[0]}`;
      if (Math.random() < 0.5) return mk({ topic: 'stats', value: vals[(vals.length - 1) / 2], en: `A stem-and-leaf plot (key: ${key}) shows: ${plot}. Find the median.`, zh: `茎叶图（说明：${keyZh}）：${plot}。求中位数。`, solEn: `There are ${vals.length} values; the middle one is ${vals[(vals.length - 1) / 2]}`, solZh: `共 ${vals.length} 个数据，中间的一个是 ${vals[(vals.length - 1) / 2]}` });
      return mk({ topic: 'stats', value: vals[vals.length - 1] - vals[0], en: `A stem-and-leaf plot (key: ${key}) shows: ${plot}. Find the range.`, zh: `茎叶图（说明：${keyZh}）：${plot}。求极差。`, solEn: `${vals[vals.length - 1]} ${MINUS} ${vals[0]} = ${vals[vals.length - 1] - vals[0]}`, solZh: `${vals[vals.length - 1]} ${MINUS} ${vals[0]} = ${vals[vals.length - 1] - vals[0]}` });
    }
    if (k === 'compare') {   // Year 9: comparing two sets by centre and spread
      if (Math.random() < 0.5) {
        const mB = R(30, 70), mA = mB + R(2, 15), dev = () => { const a = R(-8, 8), b = R(-8, 8), c = R(-8, 8), e = R(-8, 8); return [a, b, c, e, -(a + b + c + e)]; };
        const A = dev().map(v => mA + v), B = dev().map(v => mB + v);
        return mk({ topic: 'stats', value: mA - mB, en: `Set A: ${A.join(', ')}. Set B: ${B.join(', ')}. By how much is the mean of A greater than the mean of B?`, zh: `A 组：${A.join('，')}。B 组：${B.join('，')}。A 组的平均数比 B 组大多少？`, solEn: `Mean of A = ${mA}, mean of B = ${mB}; ${mA} ${MINUS} ${mB} = ${mA - mB}`, solZh: `A 组平均数 ${mA}，B 组平均数 ${mB}；${mA} ${MINUS} ${mB} = ${mA - mB}` });
      }
      const mk5 = () => Array.from({ length: 5 }, () => R(10, 90)), A = mk5(), B = mk5(), rA = Math.max(...A) - Math.min(...A), rB = Math.max(...B) - Math.min(...B);
      if (rA === rB) return null;
      return mk({ topic: 'stats', value: Math.abs(rA - rB), en: `Set A: ${A.join(', ')}. Set B: ${B.join(', ')}. Find the range of each set. How much bigger is the larger range than the smaller one?`, zh: `A 组：${A.join('，')}。B 组：${B.join('，')}。分别求两组的极差，大的极差比小的大多少？`, solEn: `Range of A = ${rA}, range of B = ${rB}; difference = ${Math.abs(rA - rB)}`, solZh: `A 组极差 ${rA}，B 组极差 ${rB}；相差 ${Math.abs(rA - rB)}` });
    }
    if (k === 'quart') {   // Year 10: quartiles and the interquartile range (8 values, so the halves are clear)
      const x = Array.from({ length: 8 }, () => R(5, 60)).sort((a, b) => a - b), q1 = (x[1] + x[2]) / 2, q3 = (x[5] + x[6]) / 2, shown = G.shuffle(x), which = pick(['Q1', 'Q3', 'IQR']);
      const v = which === 'Q1' ? q1 : which === 'Q3' ? q3 : q3 - q1, nm = which === 'Q1' ? 'lower quartile Q1' : which === 'Q3' ? 'upper quartile Q3' : 'interquartile range (IQR = Q3 − Q1)', nmZh = which === 'Q1' ? '下四分位数 Q1' : which === 'Q3' ? '上四分位数 Q3' : '四分位距（IQR = Q3 − Q1）';
      return mk({ topic: 'stats', value: v, en: `Eight values: ${shown.join(', ')}. Q1 is the median of the lower four values and Q3 the median of the upper four. Find the ${nm}.`, zh: `八个数据：${shown.join('，')}。Q1 是较小四个数的中位数，Q3 是较大四个数的中位数。求${nmZh}。`, solEn: `Ordered: ${x.join(', ')}; Q1 = ${num(q1)}, Q3 = ${num(q3)}${which === 'IQR' ? `; IQR = ${num(q3 - q1)}` : ''}`, solZh: `从小到大：${x.join('，')}；Q1 = ${num(q1)}，Q3 = ${num(q3)}${which === 'IQR' ? `；IQR = ${num(q3 - q1)}` : ''}` });
    }
    if (k === 'box') {   // Year 10: box plots
      const f = [R(2, 20)]; for (let i = 0; i < 4; i++) f.push(f[i] + R(2, 15));
      const askIqr = Math.random() < 0.5;
      return mk({ topic: 'stats', value: askIqr ? f[3] - f[1] : f[4] - f[0], en: `A box plot has minimum ${f[0]}, Q1 = ${f[1]}, median = ${f[2]}, Q3 = ${f[3]} and maximum = ${f[4]}. Find the ${askIqr ? 'interquartile range (IQR)' : 'range'}.`, zh: `箱线图的最小值 ${f[0]}，Q1 = ${f[1]}，中位数 ${f[2]}，Q3 = ${f[3]}，最大值 ${f[4]}。求${askIqr ? '四分位距（IQR）' : '极差'}。`,
        solEn: askIqr ? `IQR = Q3 ${MINUS} Q1 = ${f[3]} ${MINUS} ${f[1]} = ${f[3] - f[1]}` : `Range = ${f[4]} ${MINUS} ${f[0]} = ${f[4] - f[0]}`, solZh: askIqr ? `IQR = Q3 ${MINUS} Q1 = ${f[3]} ${MINUS} ${f[1]} = ${f[3] - f[1]}` : `极差 = ${f[4]} ${MINUS} ${f[0]} = ${f[4] - f[0]}` });
    }
    if (k === 'scatter') {   // Year 10: scatter plots and the line of best fit
      const m = R(2, 9), c = R(10, 50), t = R(1, 9);
      return mk({ topic: 'stats', value: m * t + c, en: `The line of best fit on a scatter plot of test score (y) against hours studied (x) is y = ${m}x + ${c}. Use it to predict the score for x = ${t} hours.`, zh: `测验分数 (y) 对学习时数 (x) 的散点图，最佳拟合线是 y = ${m}x + ${c}。用它预测学习 ${t} 小时的分数。`, solEn: `y = ${m} × ${t} + ${c} = ${m * t + c}`, solZh: `y = ${m} × ${t} + ${c} = ${m * t + c}` });
    }
    if (k === 'range') return mk({ topic: 'stats', value: sorted[n - 1] - sorted[0], en: `Find the range of: ${data.join(', ')}`, zh: `求这组数据的极差：${data.join('，')}`, solEn: `${sorted[n - 1]} ${MINUS} ${sorted[0]} = ${sorted[n - 1] - sorted[0]}`, solZh: `${sorted[n - 1]} ${MINUS} ${sorted[0]} = ${sorted[n - 1] - sorted[0]}` });
    if (k === 'median') { const v = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2; return mk({ topic: 'stats', value: v, en: `Find the median of: ${data.join(', ')}`, zh: `求这组数据的中位数：${data.join('，')}`, solEn: `Sorted: ${sorted.join(', ')} → median ${v}`, solZh: `排序：${sorted.join('，')}，中位数 ${v}` }); }
    if (k === 'mean') { const s0 = data.reduce((a, b) => a + b, 0); data[0] += (n - s0 % n) % n; const s = data.reduce((a, b) => a + b, 0); return mk({ topic: 'stats', value: s / n, en: `Find the mean of: ${data.join(', ')}`, zh: `求这组数据的平均数：${data.join('，')}`, solEn: `${s} ÷ ${n} = ${s / n}`, solZh: `${s} ÷ ${n} = ${s / n}` }); }
    if (k === 'missing') {
      const mean = R(30, 90), known = Array.from({ length: n - 1 }, () => mean + R(-15, 15)), last = mean * n - known.reduce((a, b) => a + b, 0);
      if (last <= 0) return null;
      return mk({ topic: 'stats', value: last, en: `The mean of ${n} numbers is ${mean}. ${n - 1} of them are ${known.join(', ')}. Find the last number.`, zh: `${n} 个数的平均数是 ${mean}，其中 ${n - 1} 个数是 ${known.join('，')}，求最后一个数。`, solEn: `Total = ${mean} × ${n} = ${mean * n}; last = ${mean * n} ${MINUS} ${known.reduce((a, b) => a + b, 0)} = ${last}`, solZh: `总和 = ${mean} × ${n} = ${mean * n}；最后一个数 = ${mean * n} ${MINUS} ${known.reduce((a, b) => a + b, 0)} = ${last}` });
    }
    const n1 = R(10, 30), n2 = R(10, 30), m1 = R(60, 90), m2 = R(60, 90), tot = n1 * m1 + n2 * m2, v = round(tot / (n1 + n2), 2);
    return mk({ topic: 'stats', value: v, en: `Class A (${n1} students) has a mean score of ${m1}. Class B (${n2} students) has a mean of ${m2}. Find the mean of all students${Number.isInteger(v) ? '' : ' (2 d.p.)'}.`, zh: `甲班 ${n1} 人，平均分 ${m1}；乙班 ${n2} 人，平均分 ${m2}。求两班的总平均分${Number.isInteger(v) ? '' : '（保留两位小数）'}。`,
      solEn: `(${n1}×${m1} + ${n2}×${m2}) ÷ ${n1 + n2} = ${tot} ÷ ${n1 + n2} = ${v}`, solZh: `(${n1}×${m1} + ${n2}×${m2}) ÷ ${n1 + n2} = ${v}` });
  });

  /* ---------- Probability ---------- */
  reg('prob', 6, (y, d) => {
    const k = ky('prob', y, d) || (pick(y <= 7 ? ['bag', 'dice'] : ['bag', 'dice', 'two', 'norepl']));
    if (k === 'dice') { const t = R(4, 10), ways = [1, 2, 3, 4, 5, 6].reduce((s, a) => s + [1, 2, 3, 4, 5, 6].filter(b => a + b === t).length, 0); return mk({ topic: 'prob', value: ways / 36, answer: fracStr(ways, 36), en: `Two fair dice are rolled. What is the probability that the total is ${t}? (fraction)`, zh: `同时掷两个均匀的骰子，点数之和为 ${t} 的概率是多少？（用分数表示）`, solEn: `${ways} of the 36 outcomes give ${t}: ${fracStr(ways, 36)}`, solZh: `36 种等可能结果中有 ${ways} 种和为 ${t}：${fracStr(ways, 36)}` }); }
    if (k === 'pctform') {   // Year 7: a probability as a fraction, decimal or percentage
      const tot = pick([4, 5, 10, 20, 25, 50]), f = R(1, tot - 1), pc = round(f / tot * 100, 2);
      return mk({ topic: 'prob', value: pc, unit: '%', en: `A box has ${tot} counters and ${f} of them are red. One counter is picked at random. What is the probability that it is red, as a percentage?`, zh: `盒子里有 ${tot} 个球，其中 ${f} 个是红球。随机取出一个，取到红球的概率是百分之几？`, solEn: `${f}/${tot} = ${round(f / tot, 4)} = ${pc}%`, solZh: `${f}/${tot} = ${round(f / tot, 4)} = ${pc}%` });
    }
    if (k === 'twoway') {   // Year 8: two-way tables
      const B = R(8, 16), Gc = R(8, 16), gb = R(2, B - 2), gg = R(2, Gc - 2);
      return mk({ topic: 'prob', value: B + Gc - gb - gg, en: `A two-way table shows ${B} boys and ${Gc} girls in a class. ${gb} boys and ${gg} girls have a pet. How many students do not have a pet?`, zh: `双向表显示班里有 ${B} 名男生、${Gc} 名女生，其中 ${gb} 名男生和 ${gg} 名女生有宠物。没有宠物的学生有多少人？`, solEn: `${B} + ${Gc} = ${B + Gc} students; ${gb} + ${gg} = ${gb + gg} have a pet; ${B + Gc} ${MINUS} ${gb + gg} = ${B + Gc - gb - gg}`, solZh: `共 ${B} + ${Gc} = ${B + Gc} 人，有宠物的 ${gb} + ${gg} = ${gb + gg} 人；${B + Gc} ${MINUS} ${gb + gg} = ${B + Gc - gb - gg}` });
    }
    if (k === 'venn') {   // Year 8: Venn diagrams
      const both = R(2, 8), a = both + R(2, 10), b = both + R(2, 10), neither = R(1, 8), N = a + b - both + neither;
      return mk({ topic: 'prob', value: neither, en: `In a group of ${N} students, ${a} play soccer, ${b} play tennis and ${both} play both. How many play neither? (Use a Venn diagram.)`, zh: `${N} 名学生中，${a} 人踢足球，${b} 人打网球，${both} 人两项都参加。两项都不参加的有多少人？（可以画维恩图）`, solEn: `Only soccer ${a - both}, only tennis ${b - both}, both ${both}: ${a + b - both} play at least one, so ${N} ${MINUS} ${a + b - both} = ${neither}`, solZh: `只踢足球 ${a - both}，只打网球 ${b - both}，两项 ${both}：至少参加一项的有 ${a + b - both} 人，所以 ${N} ${MINUS} ${a + b - both} = ${neither}` });
    }
    if (k === 'count') {   // Year 9: the number of outcomes of a two-step experiment
      const m = R(2, 7), n = R(2, 8), t = pick([0, 1, 2]);
      const T = [[`A café has ${m} main meals and ${n} desserts. How many different meal-and-dessert combinations are there?`, `咖啡馆有 ${m} 种主菜和 ${n} 种甜点，主菜和甜点共有多少种不同的搭配？`], [`A spinner has ${m} equal sections and a die has 6 faces. The spinner is spun and the die is rolled. How many outcomes are there?`, `转盘分成 ${m} 个相等的扇形，骰子有 6 个面。转一次转盘并掷一次骰子，共有多少种可能的结果？`], [`A student chooses 1 of ${m} shirts and 1 of ${n} pairs of shorts. How many different outfits can be made?`, `学生从 ${m} 件衬衫和 ${n} 条短裤中各选一件，共可以搭配出多少种不同的穿法？`]][t];
      const v = t === 1 ? m * 6 : m * n;
      return mk({ topic: 'prob', value: v, en: T[0], zh: T[1], solEn: `Multiply the outcomes of each step: ${t === 1 ? m + ' × 6' : m + ' × ' + n} = ${v}`, solZh: `两步的结果数相乘：${t === 1 ? m + ' × 6' : m + ' × ' + n} = ${v}` });
    }
    const r = R(2, 9), b = R(2, 9), g = R(1, 6), t = r + b + g;
    if (k === 'paths') {   // Year 10: add the paths of a tree diagram that give the event
      const withRep = Math.random() < 0.5, N = r * (t - r) * 2, D = withRep ? t * t : t * (t - 1);
      return mk({ topic: 'prob', value: N / D, answer: fracStr(N, D), en: `A bag has ${r} red and ${t - r} other balls. Two balls are taken ${withRep ? 'with replacement' : 'without replacement'}. Using a tree diagram, find P(exactly one red).`, zh: `袋中有 ${r} 个红球和 ${t - r} 个其他颜色的球。${withRep ? '有放回' : '不放回'}地取两个球。用树形图求恰好取到一个红球的概率。`,
        solEn: `P(red, other) + P(other, red) = ${withRep ? `${r}/${t} × ${t - r}/${t} + ${t - r}/${t} × ${r}/${t}` : `${r}/${t} × ${t - r}/${t - 1} + ${t - r}/${t} × ${r}/${t - 1}`} = ${fracStr(N, D)}`, solZh: `P(红, 其他) + P(其他, 红) = ${withRep ? `${r}/${t} × ${t - r}/${t} + ${t - r}/${t} × ${r}/${t}` : `${r}/${t} × ${t - r}/${t - 1} + ${t - r}/${t} × ${r}/${t - 1}`} = ${fracStr(N, D)}` });
    }
    if (k === 'two') return mk({ topic: 'prob', value: r / t * r / t, answer: fracStr(r * r, t * t), en: `A bag has ${r} red, ${b} blue and ${g} green balls. A ball is taken, replaced, then another is taken. P(both red)? (fraction)`, zh: `袋中有 ${r} 个红球、${b} 个蓝球、${g} 个绿球。摸出一个放回，再摸一个。两次都是红球的概率？（分数）`, solEn: `${r}/${t} × ${r}/${t} = ${fracStr(r * r, t * t)}`, solZh: `${r}/${t} × ${r}/${t} = ${fracStr(r * r, t * t)}` });
    if (k === 'norepl') return mk({ topic: 'prob', value: r * (r - 1) / (t * (t - 1)), answer: fracStr(r * (r - 1), t * (t - 1)), en: `A bag has ${r} red, ${b} blue and ${g} green balls. Two balls are taken without replacement. P(both red)? (fraction)`, zh: `袋中有 ${r} 个红球、${b} 个蓝球、${g} 个绿球。不放回地摸出两个球，两个都是红球的概率？（分数）`, solEn: `${r}/${t} × ${r - 1}/${t - 1} = ${fracStr(r * (r - 1), t * (t - 1))}`, solZh: `${r}/${t} × ${r - 1}/${t - 1} = ${fracStr(r * (r - 1), t * (t - 1))}` });
    const not = k === 'not' || (k === 'bag' && !KY.prob(y, d) && Math.random() < 0.5), c = not ? t - r : b;
    return mk({ topic: 'prob', value: c / t, answer: fracStr(c, t), en: `A bag has ${r} red, ${b} blue and ${g} green balls. One is picked at random. P(${not ? 'not red' : 'blue'})? (fraction)`, zh: `袋中有 ${r} 个红球、${b} 个蓝球、${g} 个绿球，任意摸一个，摸到${not ? '不是红球' : '蓝球'}的概率？（分数）`, solEn: `${c}/${t} = ${fracStr(c, t)}`, solZh: `${c}/${t} = ${fracStr(c, t)}` });
  });
  /* ---------- W11 (v2.1.0): NSW Stage 5 gaps, items 1-2 of nsw-gap-analysis-y7-10.md ---------- */
  const dp2 = v => round(v, 2), usd = v => '$' + dp2(v).toFixed(2);
  const money = (topic, v, en, zh, solEn, solZh) => mk({ topic, value: dp2(v), unit: '$', tol: 0.011, answer: usd(v), en, zh, solEn, solZh });

  /* Financial mathematics (Years 9-10): simple interest, earning money, spending money, compound interest, depreciation */
  reg('fin', 9, (y, d) => {
    const kinds = d <= 1 ? ['si', 'siAmount', 'wage', 'gst'] : d === 2 ? ['si', 'siRate', 'siTime', 'overtime', 'commission', 'gst', 'budget'] :
      d === 3 ? ['siPrincipal', 'ci', 'ciInterest', 'depFlat', 'dep', 'overtime', 'budget'] : ['ciHalf', 'depInterest', 'ciInterest', 'dep', 'siPrincipal', 'gstBack'];
    const k = ky('fin', y, d) || pick(kinds);
    const P = R(2, 20) * 500, r = R(2, 9), T = R(2, 8), I = P * r * T / 100;
    if (k === 'si') return money('fin', I, `$${P} is invested at ${r}% p.a. simple interest for ${T} years. How much interest is earned?`, `${P} 元按年利率 ${r}% 单利计息，${T} 年。利息是多少元？`,
      `I = P × r × T = ${P} × ${r}/100 × ${T} = $${dp2(I)}`, `I = P × r × T = ${P} × ${r}/100 × ${T} = ${dp2(I)} 元`);
    if (k === 'siAmount') return money('fin', P + I, `$${P} is invested at ${r}% p.a. simple interest for ${T} years. What is the total amount at the end?`, `${P} 元按年利率 ${r}% 单利计息，${T} 年。到期本息共多少元？`,
      `I = ${P} × ${r}/100 × ${T} = $${dp2(I)}; total = ${P} + ${dp2(I)} = $${dp2(P + I)}`, `利息 = ${P} × ${r}/100 × ${T} = ${dp2(I)}；本息和 = ${P} + ${dp2(I)} = ${dp2(P + I)} 元`);
    if (k === 'siRate') return mk({ topic: 'fin', value: r, unit: '%', en: `Simple interest of $${I} is earned on $${P} in ${T} years. What is the rate (% per year)?`, zh: `${P} 元在 ${T} 年里得到单利利息 ${I} 元。年利率是多少（%）？`,
      solEn: `r = I ÷ (P × T) × 100 = ${I} ÷ (${P} × ${T}) × 100 = ${r}%`, solZh: `r = I ÷ (P × T) × 100 = ${I} ÷ (${P} × ${T}) × 100 = ${r}%` });
    if (k === 'siTime') return mk({ topic: 'fin', value: T, en: `$${P} earns $${I} simple interest at ${r}% p.a. For how many years was it invested?`, zh: `${P} 元按年利率 ${r}% 单利计息，得到利息 ${I} 元。存了多少年？`,
      solEn: `T = I ÷ (P × r/100) = ${I} ÷ ${P * r / 100} = ${T} years`, solZh: `T = I ÷ (P × r/100) = ${I} ÷ ${P * r / 100} = ${T} 年` });
    if (k === 'siPrincipal') return money('fin', P, `Simple interest of $${I} is earned in ${T} years at ${r}% p.a. How much was invested?`, `按年利率 ${r}% 单利计息，${T} 年得到利息 ${I} 元。本金是多少元？`,
      `P = I ÷ (r/100 × T) = ${I} ÷ ${r * T / 100} = $${P}`, `P = I ÷ (r/100 × T) = ${I} ÷ ${r * T / 100} = ${P} 元`);
    if (k === 'wage') { const rate = R(15, 45), h = R(15, 40); return money('fin', rate * h, `A worker is paid $${rate} per hour and works ${h} hours in a week. What is the weekly pay?`, `某人时薪 ${rate} 元，一周工作 ${h} 小时。周薪是多少元？`, `${rate} × ${h} = $${rate * h}`, `${rate} × ${h} = ${rate * h} 元`); }
    if (k === 'overtime') {
      const rate = pick([20, 24, 28, 30, 32, 36, 40]), ot = R(2, 8), mult = pick([1.5, 2]), pay = 38 * rate + ot * mult * rate, name = mult === 1.5 ? 'time and a half' : 'double time';
      return money('fin', pay, `A worker is paid $${rate} per hour for 38 hours, and ${name} for ${ot} extra hours. What is the total pay for the week?`, `某人时薪 ${rate} 元，正常工作 38 小时；另加班 ${ot} 小时，加班费是时薪的 ${mult} 倍。这周总共挣多少元？`,
        `38 × ${rate} = ${38 * rate}; overtime ${ot} × ${mult} × ${rate} = ${ot * mult * rate}; total $${pay}`, `38 × ${rate} = ${38 * rate}；加班 ${ot} × ${mult} × ${rate} = ${ot * mult * rate}；合计 ${pay} 元`);
    }
    if (k === 'commission') {
      const base = R(3, 9) * 100, S = R(4, 30) * 1000, c = pick([2, 3, 4, 5]), com = S * c / 100;
      return money('fin', base + com, `A salesperson earns a base wage of $${base} a week plus ${c}% commission on sales. Sales this week were $${S}. What is the total pay?`, `销售员每周底薪 ${base} 元，另加销售额的 ${c}% 作提成。本周销售额 ${S} 元。总收入是多少元？`,
        `Commission = ${c}% of ${S} = $${com}; total = ${base} + ${com} = $${base + com}`, `提成 = ${S} 的 ${c}% = ${com} 元；总收入 = ${base} + ${com} = ${base + com} 元`);
    }
    if (k === 'gst') { const p = R(2, 40) * 10; return money('fin', p * 1.1, `An item costs $${p} before GST. GST is 10%. What is the price including GST?`, `某物税前 ${p} 元，消费税（GST）10%。含税价是多少元？`, `${p} × 1.1 = $${dp2(p * 1.1)}`, `${p} × 1.1 = ${dp2(p * 1.1)} 元`); }
    if (k === 'gstBack') { const g = R(5, 60), x = 11 * g; return money('fin', g, `A price including 10% GST is $${x}. How much of it is GST?`, `含 10% GST 的价格是 ${x} 元。其中 GST 是多少元？`, `Price before GST = ${x} ÷ 1.1 = ${round(x / 1.1, 2)}; GST = ${x} ${MINUS} ${round(x / 1.1, 2)} = $${g}`, `税前价 = ${x} ÷ 1.1 = ${round(x / 1.1, 2)}；GST = ${x} ${MINUS} ${round(x / 1.1, 2)} = ${g} 元`); }
    if (k === 'budget') {
      const inc = R(5, 14) * 100, a = R(2, 8) * 5, b = R(2, 6) * 5, left = inc * (100 - a - b) / 100;
      return money('fin', left, `A weekly budget of $${inc} has ${a}% for rent and ${b}% for food. How much is left for everything else?`, `每周预算 ${inc} 元，房租占 ${a}%，食物占 ${b}%。剩下多少元可用于其他开支？`,
        `Spent ${a + b}% → left ${100 - a - b}% of ${inc} = $${left}`, `已花 ${a + b}%，剩 ${100 - a - b}%：${inc} × ${100 - a - b}% = ${left} 元`);
    }
    const P2 = R(1, 8) * 1000, rc = pick([2, 3, 4, 5, 6, 8]), n = R(2, 5);
    if (k === 'ci' || k === 'ciInterest') {
      const A = P2 * (1 + rc / 100) ** n;
      return money('fin', k === 'ci' ? A : A - P2, k === 'ci' ? `$${P2} is invested at ${rc}% p.a. compound interest (compounded annually). What is it worth after ${n} years? (to the nearest cent)` : `$${P2} is invested at ${rc}% p.a. compound interest (compounded annually) for ${n} years. How much interest is earned? (to the nearest cent)`,
        k === 'ci' ? `${P2} 元按年利率 ${rc}% 复利（每年一次）计息，${n} 年后本息和是多少元？（精确到分）` : `${P2} 元按年利率 ${rc}% 复利（每年一次）计息，${n} 年。利息共多少元？（精确到分）`,
        `A = P(1 + r)^n = ${P2} × ${1 + rc / 100}^${n} = $${usd(A).slice(1)}${k === 'ci' ? '' : `; interest = A ${MINUS} P = $${usd(A - P2).slice(1)}`}`, `A = P(1 + r)^n = ${P2} × ${1 + rc / 100}^${n} = ${usd(A).slice(1)} 元${k === 'ci' ? '' : `；利息 = A ${MINUS} P = ${usd(A - P2).slice(1)} 元`}`);
    }
    if (k === 'ciHalf') {
      const q = pick([2, 4]), rr = pick([4, 6, 8]), nn = R(2, 4), A = P2 * (1 + rr / 100 / q) ** (q * nn);
      return money('fin', A, `$${P2} is invested at ${rr}% p.a. compounded ${q === 2 ? 'half-yearly' : 'quarterly'}. What is it worth after ${nn} years? (to the nearest cent)`, `${P2} 元按年利率 ${rr}% 复利计息，${q === 2 ? '每半年' : '每季度'}结算一次，${nn} 年后本息和是多少元？（精确到分）`,
        `${q * nn} periods at ${rr / q}%: A = ${P2} × ${1 + rr / 100 / q}^${q * nn} = $${usd(A).slice(1)}`, `共 ${q * nn} 期，每期 ${rr / q}%：A = ${P2} × ${1 + rr / 100 / q}^${q * nn} = ${usd(A).slice(1)} 元`);
    }
    const V = R(4, 40) * 1000;
    if (k === 'depFlat') { const dpy = R(2, 9) * 100, nn = R(2, 6); if (dpy * nn >= V * 0.6) return null; return money('fin', V - dpy * nn, `A machine worth $${V} loses $${dpy} in value each year (flat rate). What is it worth after ${nn} years?`, `一台价值 ${V} 元的机器每年固定贬值 ${dpy} 元。${nn} 年后价值多少元？`, `${V} ${MINUS} ${nn} × ${dpy} = $${V - dpy * nn}`, `${V} ${MINUS} ${nn} × ${dpy} = ${V - dpy * nn} 元`); }
    const rd = pick([10, 15, 20, 25]), nn = R(2, 4), val = V * (1 - rd / 100) ** nn;
    if (k === 'dep') return money('fin', val, `A car worth $${V} depreciates by ${rd}% each year (reducing balance). What is it worth after ${nn} years? (to the nearest cent)`, `一辆价值 ${V} 元的汽车每年按剩余价值贬值 ${rd}%。${nn} 年后价值多少元？（精确到分）`,
      `V = ${V} × ${1 - rd / 100}^${nn} = $${usd(val).slice(1)}`, `V = ${V} × ${1 - rd / 100}^${nn} = ${usd(val).slice(1)} 元`);
    return money('fin', V - val, `A car worth $${V} depreciates by ${rd}% each year (reducing balance). How much value is lost in ${nn} years? (to the nearest cent)`, `一辆价值 ${V} 元的汽车每年按剩余价值贬值 ${rd}%。${nn} 年里共损失多少价值（元）？（精确到分）`,
      `V = ${V} × ${1 - rd / 100}^${nn} = ${usd(val).slice(1)}; lost = ${V} ${MINUS} ${usd(val).slice(1)} = $${usd(V - val).slice(1)}`, `V = ${V} × ${1 - rd / 100}^${nn} = ${usd(val).slice(1)}；损失 = ${V} ${MINUS} ${usd(val).slice(1)} = ${usd(V - val).slice(1)} 元`);
  });

  /* Factorising (Years 9-10): common factors, difference of two squares, trinomials */
  reg('factor', 9, (y, d) => {
    const lin = (m, c) => `(${coef(m)}${c ? sg(c) : ''})`;
    const xt = b => (b === 0 ? '' : ` ${b < 0 ? MINUS : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`), tm = (a, v) => (a === 1 ? '' : a) + v;
    const k = ky('factor', y, d) || (pick(d <= 1 ? ['hcf', 'hcf', 'mcDsq', 'mcTrin'] : d === 2 ? ['hcf2', 'trin', 'mcTrin', 'mcDsq'] : d === 3 ? ['dsq2', 'trin', 'trin', 'trin2', 'mcTrin'] : ['trin2', 'dsq2', 'trin2', 'hcfTrin']));
    if (k === 'hcf' || k === 'hcf2') {
      const g = R(2, 12), a = R(1, 9), b = R(1, 9), c = k === 'hcf2' ? R(1, 9) : 0; if (gcd(gcd(a, b), c || a) !== 1) return null;
      const ex = `${tm(g * a, 'x')} + ${tm(g * b, 'y')}${c ? ` + ${g * c}` : ''}`;
      return mk({ topic: 'factor', value: a + b + c, en: `Factorise ${ex} fully. It can be written as g(ax + by${c ? ' + c' : ''}) with g as large as possible. Find a + b${c ? ' + c' : ''}.`, zh: `把 ${ex} 完全分解，写成 g(ax + by${c ? ' + c' : ''})，其中 g 尽可能大。求 a + b${c ? ' + c' : ''}。`,
        solEn: `The highest common factor is ${g}: ${ex} = ${g}(${tm(a, 'x')} + ${tm(b, 'y')}${c ? ` + ${c}` : ''})`, solZh: `最大公因数是 ${g}：${ex} = ${g}(${tm(a, 'x')} + ${tm(b, 'y')}${c ? ` + ${c}` : ''})` });
    }
    if (k === 'dsq2') {
      const p = R(2, 5), q = R(1, 9);
      return mk({ topic: 'factor', value: p + q, en: `${p * p}x² ${MINUS} ${q * q} = (px ${MINUS} q)(px + q), with p > 0 and q > 0. Find p + q.`, zh: `${p * p}x² ${MINUS} ${q * q} = (px ${MINUS} q)(px + q)，其中 p > 0，q > 0。求 p + q。`,
        solEn: `(${p}x)² ${MINUS} ${q}² = (${p}x ${MINUS} ${q})(${p}x + ${q}); p + q = ${p + q}`, solZh: `(${p}x)² ${MINUS} ${q}² = (${p}x ${MINUS} ${q})(${p}x + ${q})；p + q = ${p + q}` });
    }
    if (k === 'hcfTrin') {
      const g = R(2, 5), p = R(-6, 6) || 2, q = R(-6, 6) || 3; if (p === q) return null;
      const lo = Math.min(p, q), hi = Math.max(p, q), expr = `${g}x²${xt(g * (p + q))}${sg(g * p * q)}`;
      if (p + q === 0 || p * q === 0) return null;
      return mk({ topic: 'factor', value: lo, en: `${expr} = ${g}(x + p)(x + q), with p < q. Find p.`, zh: `${expr} = ${g}(x + p)(x + q)，其中 p < q。求 p。`,
        solEn: `Take out ${g} first: ${g}(x²${xt(p + q)}${sg(p * q)}) = ${g}(x${sg(lo)})(x${sg(hi)})`, solZh: `先提公因数 ${g}：${g}(x²${xt(p + q)}${sg(p * q)}) = ${g}(x${sg(lo)})(x${sg(hi)})` });
    }
    if (k === 'trin' || k === 'mcTrin') {
      const p = R(-9, 9) || 2, q = R(-9, 9) || 4; if (p === q) return null;
      const lo = Math.min(p, q), hi = Math.max(p, q), expr = `x²${xt(p + q)}${p * q ? sg(p * q) : ''}`;
      if (k === 'mcTrin' && (p + q === 0 || p * q === 0)) return null;
      if (k === 'trin') return mk({ topic: 'factor', value: lo, en: `${expr} = (x + p)(x + q), with p < q. Find p.`, zh: `${expr} = (x + p)(x + q)，其中 p < q。求 p。`,
        solEn: `Two numbers that multiply to ${num(p * q)} and add to ${num(p + q)}: ${num(lo)} and ${num(hi)}`, solZh: `找两个数，积为 ${num(p * q)}，和为 ${num(p + q)}：${num(lo)} 和 ${num(hi)}` });
      const f = (a, b) => `(x${sg(a)})(x${sg(b)})`;
      return G.mc({ topic: 'factor', en: `Factorise ${expr}.`, zh: `分解因式：${expr}。`, correct: f(lo, hi), wrong: [f(-lo, -hi), f(lo, -hi), f(-lo, hi)],
        solEn: `Two numbers that multiply to ${num(p * q)} and add to ${num(p + q)}: ${num(lo)} and ${num(hi)}`, solZh: `找两个数，积为 ${num(p * q)}，和为 ${num(p + q)}：${num(lo)} 和 ${num(hi)}` });
    }
    if (k === 'mcDsq') {
      const a = R(2, 12);
      return G.mc({ topic: 'factor', en: `Factorise x² ${MINUS} ${a * a}.`, zh: `分解因式：x² ${MINUS} ${a * a}。`, correct: `(x ${MINUS} ${a})(x + ${a})`,
        wrong: [`(x ${MINUS} ${a})²`, `(x + ${a})²`, `(x ${MINUS} ${a * a})(x + 1)`], solEn: `Difference of two squares: (x ${MINUS} ${a})(x + ${a})`, solZh: `平方差：(x ${MINUS} ${a})(x + ${a})` });
    }
    // trin2: m x² + (m q + p) x + p q = (m x + p)(x + q); find p + q
    const m = R(2, 4), p = R(-6, 6) || 3, q = R(-6, 6) || 2; if (m * q + p === 0 || p % m === 0) return null;   // p % m: otherwise (mx + p)(x + q) can also be written the other way round
    const expr = `${m}x²${xt(m * q + p)}${p * q ? sg(p * q) : ''}`;
    return mk({ topic: 'factor', value: p + q, en: `${expr} = (${m}x + p)(x + q). Find p + q.`, zh: `${expr} = (${m}x + p)(x + q)。求 p + q。`,
      solEn: `${lin(m, p)}${lin(1, q)} expands to ${expr}, so p = ${num(p)}, q = ${num(q)}, p + q = ${num(p + q)}`, solZh: `${lin(m, p)}${lin(1, q)} 展开得 ${expr}，所以 p = ${num(p)}，q = ${num(q)}，p + q = ${num(p + q)}` });
  });

  /* Change the subject of a formula (Years 9-10) */
  reg('formula', 9, (y, d) => {
    const items = [
      { id: 1, eq: 'v = u + at', v: 't', ans: '(v − u)/a', wr: ['v − u/a', '(v + u)/a', 'a(v − u)', '(u − v)/a'], lv: [1, 2, 3],
        gen: () => { const a = R(2, 9), t = R(2, 12), u = R(1, 20); return { given: `v = ${u + a * t}, u = ${u}, a = ${a}`, val: t, step: `t = (${u + a * t} ${MINUS} ${u}) ÷ ${a}` }; } },
      { id: 2, eq: 'y = mx + c', v: 'x', ans: '(y − c)/m', wr: ['y − c/m', '(y + c)/m', 'm(y − c)', 'y/m − c'].slice(0, 4), lv: [1, 2, 3],
        gen: () => { const m = R(2, 7), x = R(-5, 9), c = R(-9, 9) || 4; return { given: `y = ${num(m * x + c)}, m = ${m}, c = ${num(c)}`, val: x, step: `x = (${num(m * x + c)} ${MINUS} ${paren(c)}) ÷ ${m}` }; } },
      { id: 3, eq: 'A = ½bh', v: 'h', ans: '2A/b', wr: ['A/(2b)', '2Ab', '2b/A', 'A ÷ 2 − b'], lv: [2, 3],
        gen: () => { const b = R(2, 10) * 2, h = R(2, 12); return { given: `A = ${b * h / 2}, b = ${b}`, val: h, step: `h = 2 × ${b * h / 2} ÷ ${b}` }; } },
      { id: 4, eq: 'P = 2(l + w)', v: 'w', ans: 'P/2 − l', wr: ['P − 2l', '2P − l', 'P/2 + l', 'P − l/2'], lv: [2, 3],
        gen: () => { const l = R(3, 15), w = R(2, 12); return { given: `P = ${2 * (l + w)}, l = ${l}`, val: w, step: `w = ${l + w} ${MINUS} ${l}` }; } },
      { id: 5, eq: 'F = 9C/5 + 32', v: 'C', ans: '5(F − 32)/9', wr: ['5F/9 − 32', '5(F + 32)/9', '9(F − 32)/5', '5F − 32/9'], lv: [3, 4],
        gen: () => { const c = R(-4, 24) * 5; return { given: `F = ${num(9 * c / 5 + 32)}`, val: c, step: `C = 5 × (${num(9 * c / 5 + 32)} ${MINUS} 32) ÷ 9` }; } },
      { id: 6, eq: 'V = ⅓Ah', v: 'h', ans: '3V/A', wr: ['V/(3A)', '3VA', 'A/(3V)', 'V − 3A'], lv: [2, 3],
        gen: () => { const A = R(2, 8) * 3, h = R(2, 12); return { given: `V = ${A * h / 3}, A = ${A}`, val: h, step: `h = 3 × ${A * h / 3} ÷ ${A}` }; } },
      { id: 7, eq: 'y = k/x', v: 'x', ans: 'k/y', wr: ['ky', 'y/k', 'k − y', 'k + y'], lv: [1, 2],
        gen: () => { const x = R(2, 12), k = R(2, 9) * x; return { given: `y = ${k / x}, k = ${k}`, val: x, step: `x = ${k} ÷ ${k / x}` }; } },
      { id: 8, eq: 's = ut + ½at²', v: 'a', ans: '2(s − ut)/t²', wr: ['2(s − ut)/t', '(s − ut)/t²', '2s − ut/t²', '2(s + ut)/t²'], lv: [3, 4],
        gen: () => { const u = R(1, 9), t = R(2, 6) , a = R(1, 5) * 2; return { given: `s = ${u * t + a * t * t / 2}, u = ${u}, t = ${t}`, val: a, step: `a = 2 × (${u * t + a * t * t / 2} ${MINUS} ${u * t}) ÷ ${t * t}` }; } },
      { id: 9, eq: 'E = ½mv²', v: 'v', ans: '√(2E/m)', wr: ['2E/m', '√(E/2m)', '√(2E)/m', '√(E/m)'], lv: [4],
        gen: () => { const m = R(1, 6) * 2, v = R(2, 12); return { given: `E = ${m * v * v / 2}, m = ${m}`, val: v, step: `v = √(2 × ${m * v * v / 2} ÷ ${m}) = √${v * v}` }; } },
      { id: 10, eq: 'c² = a² + b²', v: 'b', ans: '√(c² − a²)', wr: ['c² − a²', '√(c² + a²)', 'c − a', '√(a² − c²)'], lv: [1, 2, 3, 4],
        gen: () => { const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]]); return { given: `c = ${c}, a = ${a}`, val: b, step: `b = √(${c}² ${MINUS} ${a}²) = √${b * b}` }; } },
      { id: 11, eq: 'A = P + Prn', v: 'P', ans: 'A/(1 + rn)', wr: ['A − rn', 'A/(1 − rn)', 'A − Prn', 'A/rn'], lv: [1, 2, 3, 4],
        gen: () => { const P = R(2, 20) * 50, r = pick([0.05, 0.1, 0.2]), n = R(2, 6), A = round(P * (1 + r * n), 2); return { given: `A = ${A}, r = ${r}, n = ${n}`, val: P, step: `P = ${A} ÷ (1 + ${r} × ${n}) = ${A} ÷ ${round(1 + r * n, 2)}` }; } }
    ];
    /* Year 9 lesson: do the same to both sides, undo in reverse order. Year 10 lesson: squares, roots, fractions, a letter in two places */
    const YR = { 1: [9], 2: [9], 3: [9], 4: [9], 6: [9], 7: [9], 5: [10], 8: [10], 9: [10], 10: [10], 11: [10] };
    const inYear = items.filter(it => (YR[it.id] || [y]).includes(y)), byLevel = inYear.filter(it => it.lv.includes(d));
    const pool = y === 9 || y === 10 ? (byLevel.length ? byLevel : inYear) : items.filter(it => it.lv.includes(d));
    const it = pick(pool), asMc = Math.random() < 0.5;
    if (asMc) return G.mc({ topic: 'formula', en: `Make ${it.v} the subject of ${it.eq}.`, zh: `把公式 ${it.eq} 变形，使 ${it.v} 成为主项。`, correct: `${it.v} = ${it.ans}`, wrong: it.wr.map(w => `${it.v} = ${w}`),
      solEn: `Undo the operations around ${it.v} one at a time: ${it.v} = ${it.ans}`, solZh: `一步一步还原 ${it.v} 周围的运算：${it.v} = ${it.ans}` });
    const g = it.gen();
    return mk({ topic: 'formula', value: g.val, en: `Make ${it.v} the subject of ${it.eq}, then find ${it.v} when ${g.given}.`, zh: `把公式 ${it.eq} 变形，使 ${it.v} 成为主项，然后求当 ${g.given.replace(/, /g, '，')} 时 ${it.v} 的值。`,
      solEn: `${it.v} = ${it.ans}; ${g.step} = ${num(g.val)}`, solZh: `${it.v} = ${it.ans}；${g.step} = ${num(g.val)}` });
  });
})(typeof window !== 'undefined' ? window : globalThis);
