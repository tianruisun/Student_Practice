/* Maths topics (typed answers). Calibrated to China (人教版) / Singapore (MOE) year levels.
   d = difficulty 1..4 (Core, Elevated, Challenging, Competitive). */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, gcd, lcm, round, MINUS, num, paren, sg, coef, fracStr, mk } = G;
  const MAXY = { quad: 12, index: 12 };
  const reg = (topic, minYear, fn) => G.register('maths', topic, minYear, fn, { maxYear: MAXY[topic] || 10 });
  const yt = b => (b < 0 ? ` ${MINUS} ` : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'y';
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
    const k = y <= 4 ? pick(['add', 'of', 'mixed']) : y === 5 ? pick(['add', 'mixed', 'mul', 'of']) : pick(['mixed', 'mul', 'div', 'combo', 'combo']);
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
    const k = pick(y <= 5 ? ['of', 'whatpct'] : y <= 6 ? ['of', 'whatpct', 'change'] : ['change', 'reverse', 'successive', 'whatpct']);
    if (k === 'of') {
      const p = pick([5, 12.5, 15, 35, 45, 65, 120, 2.5]), n = R(2, 40) * 40, v = round(p * n / 100, 4);
      return mk({ topic: 'pct', value: v, en: `What is ${p}% of ${n}?`, zh: `${n} 的 ${p}% 是多少？`, solEn: `${p}/100 × ${n} = ${v}`, solZh: `${n} × ${p}% = ${v}` });
    }
    if (k === 'whatpct') {
      const whole = pick([16, 25, 40, 80, 125, 250, 400]), part = R(1, whole * (d >= 3 ? 1.5 : 1)), pc = round(part / whole * 100, 2);
      return mk({ topic: 'pct', value: pc, unit: '%', en: `What percentage of ${whole} is ${part}?${Number.isInteger(pc) ? '' : ' (2 d.p.)'}`, zh: `${part} 是 ${whole} 的百分之几？${Number.isInteger(pc) ? '' : '（保留两位小数）'}`,
        solEn: `${part} ÷ ${whole} × 100% = ${pc}%`, solZh: `${part} ÷ ${whole} × 100% = ${pc}%` });
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
    const k = pick(d <= 1 ? ['share', 'simplify'] : ['share', 'three', 'speed', 'simplify']);
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
    const k = pick(y >= 9 ? ['law', 'neg', 'surd', 'sci', 'root'] : ['pow', 'root', 'law', 'sci']);
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
    const ks = y <= 6 ? ['two', 'two', 'brk'] : y === 7 ? ['two', 'brk', 'fracEq', 'sides'] : y === 8 ? ['fracEq', 'sides', 'sim', 'ineq', 'expand'] : ['sim', 'ineq', 'expand', 'fracEq', 'sides'];
    const k = pick(d <= 1 ? ks.slice(0, 2) : ks);
    const x = y >= 7 ? R(-9, 12) || 3 : R(2, 15);
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
    const r1 = R(-9, 9), r2 = R(-9, 9), a = d >= 3 ? R(1, 3) : 1;
    const b = -a * (r1 + r2), c = a * r1 * r2, eq = `${a === 1 ? '' : a}x²${b ? sg(b) + 'x' : ''}${c ? sg(c) : ''} = 0`;
    const k = pick(['big', 'small', 'sum', 'vertex']);
    if (k === 'vertex') {
      const h = R(-6, 6), kk = R(-9, 9), p = R(1, 3) * (Math.random() < 0.5 ? -1 : 1);
      const B = -2 * p * h, C = p * h * h + kk;
      return mk({ topic: 'quad', value: kk, en: `For y = ${coef(p, 'x²')}${B ? sg(B) + 'x' : ''}${C ? sg(C) : ''}, what is the y-coordinate of the turning point (vertex)?`,
        zh: `对于 y = ${coef(p, 'x²')}${B ? sg(B) + 'x' : ''}${C ? sg(C) : ''}，顶点的纵坐标是多少？`,
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
    const k = pick(['grad', 'eval', 'cross', 'xint']);
    const m = R(-5, 5) || 2, c = R(-9, 9);
    const line = (mm, cc) => `y = ${coef(mm)}${cc ? sg(cc) : ''}`;
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
    const ks = y <= 4 ? ['rect', 'conv', 'compound'] : y === 5 ? ['trap', 'tri', 'compound', 'cuboid', 'conv'] : y <= 7 ? ['circle', 'ring', 'cyl', 'cone', 'trap', 'semi'] : ['cyl', 'cone', 'sector', 'ring', 'sphere', 'compound'];
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
    const ks = y <= 5 ? ['line', 'point', 'tri', 'clock'] : y <= 7 ? ['tri', 'iso', 'ext', 'parallel', 'clock'] : ['poly', 'ext', 'iso', 'parallel', 'regular'];
    const k = pick(ks);
    if (k === 'line') { const a = R(15, 165), v = 180 - a; return mk({ topic: 'angle', value: v, unit: '°', en: `Two angles make a straight line. One is ${a}°. Find the other.`, zh: `两个角组成一个平角，一个角是 ${a}°，另一个角是多少度？`, solEn: `180 ${MINUS} ${a} = ${v}°`, solZh: `180 ${MINUS} ${a} = ${v}°` }); }
    if (k === 'point') { const a = R(40, 150), b = R(40, 150), v = 360 - a - b; return mk({ topic: 'angle', value: v, unit: '°', en: `Three angles meet at a point. Two are ${a}° and ${b}°. Find the third.`, zh: `三个角组成一个周角，其中两个是 ${a}° 和 ${b}°，求第三个角。`, solEn: `360 ${MINUS} ${a} ${MINUS} ${b} = ${v}°`, solZh: `360 ${MINUS} ${a} ${MINUS} ${b} = ${v}°` }); }
    if (k === 'tri') { const a = R(20, 100), b = R(20, 150 - a), v = 180 - a - b; return mk({ topic: 'angle', value: v, unit: '°', en: `Two angles of a triangle are ${a}° and ${b}°. Find the third.`, zh: `三角形的两个内角是 ${a}° 和 ${b}°，第三个角是多少度？`, solEn: `180 ${MINUS} ${a} ${MINUS} ${b} = ${v}°`, solZh: `180 ${MINUS} ${a} ${MINUS} ${b} = ${v}°` }); }
    if (k === 'iso') { const apex = 2 * R(10, 70), v = (180 - apex) / 2; return mk({ topic: 'angle', value: v, unit: '°', en: `An isosceles triangle has apex angle ${apex}°. Find each base angle.`, zh: `等腰三角形的顶角是 ${apex}°，每个底角是多少度？`, solEn: `(180 ${MINUS} ${apex}) ÷ 2 = ${v}°`, solZh: `(180 ${MINUS} ${apex}) ÷ 2 = ${v}°` }); }
    if (k === 'ext') { const a = R(25, 80), b = R(25, 80), v = a + b; return mk({ topic: 'angle', value: v, unit: '°', en: `Two interior angles of a triangle are ${a}° and ${b}°. Find the exterior angle at the third vertex.`, zh: `三角形的两个内角是 ${a}° 和 ${b}°，第三个顶点处的外角是多少度？`, solEn: `Exterior angle = sum of the two opposite interior angles = ${v}°`, solZh: `外角等于与它不相邻的两个内角之和：${v}°` }); }
    if (k === 'parallel') { const a = R(35, 145), t = pick(['alt', 'co']), v = t === 'alt' ? a : 180 - a; return mk({ topic: 'angle', value: v, unit: '°', en: `A line crosses two parallel lines. One angle is ${a}°. Find the ${t === 'alt' ? 'alternate' : 'co-interior (same-side interior)'} angle.`, zh: `一条直线截两条平行线，其中一个角是 ${a}°，求它的${t === 'alt' ? '内错角' : '同旁内角'}。`, solEn: t === 'alt' ? `Alternate angles are equal: ${v}°` : `Co-interior angles add to 180°: ${v}°`, solZh: t === 'alt' ? `内错角相等：${v}°` : `同旁内角互补：${v}°` }); }
    if (k === 'clock') { const h = R(1, 11), m = d >= 3 ? pick([0, 30, 20, 40]) : 0, raw = Math.abs(30 * h + 0.5 * m - 6 * m), v = Math.min(raw, 360 - raw); return mk({ topic: 'angle', value: v, unit: '°', en: `What is the smaller angle between the hour and minute hands at ${h}:${String(m).padStart(2, '0')}?`, zh: `${h} 点 ${m} 分时，时针与分针所成的较小角是多少度？`, solEn: `Hour hand ${30 * h + 0.5 * m}°, minute hand ${6 * m}°; difference ${v}°`, solZh: `时针 ${30 * h + 0.5 * m}°，分针 ${6 * m}°，夹角 ${v}°` }); }
    const n = R(5, 12), sum = (n - 2) * 180;
    if (k === 'poly') return mk({ topic: 'angle', value: sum, unit: '°', en: `Find the sum of the interior angles of a ${n}-sided polygon.`, zh: `求 ${n} 边形的内角和。`, solEn: `(${n} ${MINUS} 2) × 180 = ${sum}°`, solZh: `(${n} ${MINUS} 2) × 180° = ${sum}°` });
    const ext = pick([24, 30, 36, 40, 45, 60, 72, 20, 18, 15]);
    return mk({ topic: 'angle', value: 360 / ext, en: `Each exterior angle of a regular polygon is ${ext}°. How many sides does it have?`, zh: `一个正多边形的每个外角是 ${ext}°，它有几条边？`, solEn: `360 ÷ ${ext} = ${360 / ext}`, solZh: `360 ÷ ${ext} = ${360 / ext}` });
  });

  /* ---------- Pythagoras & trigonometry ---------- */
  reg('pyth', 8, (y, d) => {
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
    const k = pick(d <= 1 ? ['mean', 'median', 'range'] : ['missing', 'median', 'combined', 'mean']);
    const n = R(5, 8), data = Array.from({ length: n }, () => R(d >= 3 ? 20 : 5, d >= 3 ? 99 : 40)), sorted = [...data].sort((a, b) => a - b);
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
    const k = pick(y <= 7 ? ['bag', 'dice'] : ['bag', 'dice', 'two', 'norepl']);
    if (k === 'dice') { const t = R(4, 10), ways = [1, 2, 3, 4, 5, 6].reduce((s, a) => s + [1, 2, 3, 4, 5, 6].filter(b => a + b === t).length, 0); return mk({ topic: 'prob', value: ways / 36, answer: fracStr(ways, 36), en: `Two fair dice are rolled. What is the probability that the total is ${t}? (fraction)`, zh: `同时掷两个均匀的骰子，点数之和为 ${t} 的概率是多少？（用分数表示）`, solEn: `${ways} of the 36 outcomes give ${t}: ${fracStr(ways, 36)}`, solZh: `36 种等可能结果中有 ${ways} 种和为 ${t}：${fracStr(ways, 36)}` }); }
    const r = R(2, 9), b = R(2, 9), g = R(1, 6), t = r + b + g;
    if (k === 'two') return mk({ topic: 'prob', value: r / t * r / t, answer: fracStr(r * r, t * t), en: `A bag has ${r} red, ${b} blue and ${g} green balls. A ball is taken, replaced, then another is taken. P(both red)? (fraction)`, zh: `袋中有 ${r} 个红球、${b} 个蓝球、${g} 个绿球。摸出一个放回，再摸一个。两次都是红球的概率？（分数）`, solEn: `${r}/${t} × ${r}/${t} = ${fracStr(r * r, t * t)}`, solZh: `${r}/${t} × ${r}/${t} = ${fracStr(r * r, t * t)}` });
    if (k === 'norepl') return mk({ topic: 'prob', value: r * (r - 1) / (t * (t - 1)), answer: fracStr(r * (r - 1), t * (t - 1)), en: `A bag has ${r} red, ${b} blue and ${g} green balls. Two balls are taken without replacement. P(both red)? (fraction)`, zh: `袋中有 ${r} 个红球、${b} 个蓝球、${g} 个绿球。不放回地摸出两个球，两个都是红球的概率？（分数）`, solEn: `${r}/${t} × ${r - 1}/${t - 1} = ${fracStr(r * (r - 1), t * (t - 1))}`, solZh: `${r}/${t} × ${r - 1}/${t - 1} = ${fracStr(r * (r - 1), t * (t - 1))}` });
    const not = Math.random() < 0.5, c = not ? t - r : b;
    return mk({ topic: 'prob', value: c / t, answer: fracStr(c, t), en: `A bag has ${r} red, ${b} blue and ${g} green balls. One is picked at random. P(${not ? 'not red' : 'blue'})? (fraction)`, zh: `袋中有 ${r} 个红球、${b} 个蓝球、${g} 个绿球，任意摸一个，摸到${not ? '不是红球' : '蓝球'}的概率？（分数）`, solEn: `${c}/${t} = ${fracStr(c, t)}`, solZh: `${c}/${t} = ${fracStr(c, t)}` });
  });
})(typeof window !== 'undefined' ? window : globalThis);
