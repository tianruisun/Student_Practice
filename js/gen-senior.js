/* Senior maths: Year 11–12 Mathematics Advanced (11–14), Extension 1 / 3U (13–14), Extension 2 / 4U (14).
   Year 13 = Year 12 Extension 1, Year 14 = Year 12 Extension 2. Answers are numbers (exact or 2 d.p.).
   Challenging/Competitive also draw on the olympiad bank. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, round, MINUS, num, paren, sg, coef, fracStr, gcd, mk } = G;
  const reg = (topic, minYear, fn) => G.register('maths', topic, minYear, fn, { maxYear: 14 });
  const dp2 = v => round(v, 2), TOL = 0.011;
  const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const poly = cs => { // cs: [[coef, power], ...] → "3x² − 2x + 5"
    const sup = p => (p === 1 ? 'x' : p === 0 ? '' : 'x' + String(p).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join(''));
    return cs.filter(([c]) => c).map(([c, p], i) => (i === 0 ? (c < 0 ? MINUS : '') : c < 0 ? ` ${MINUS} ` : ' + ') + (Math.abs(c) === 1 && p ? '' : Math.abs(c)) + sup(p)).join('');
  };

  /* ---------- functions ---------- */
  reg('func', 11, (y, d) => {
    const k = pick(d <= 1 ? ['eval', 'comp'] : ['comp', 'inv', 'vertex', 'solve']);
    const a = R(1, 4), b = R(-6, 6), c = R(-9, 9), f = x => a * x * x + b * x + c, fs = poly([[a, 2], [b, 1], [c, 0]]);
    if (k === 'eval') { const x = R(-4, 5); return mk({ topic: 'func', value: f(x), en: `If f(x) = ${fs}, find f(${num(x)}).`, zh: `已知 f(x) = ${fs}，求 f(${num(x)})。`, solEn: `Substitute x = ${num(x)}: ${num(f(x))}`, solZh: `代入 x = ${num(x)}：${num(f(x))}` }); }
    if (k === 'comp') { const m = R(2, 5), n = R(-5, 5), g = x => m * x + n, x = R(-3, 3); return mk({ topic: 'func', value: f(g(x)), en: `f(x) = ${fs} and g(x) = ${coef(m)}${n ? sg(n) : ''}. Find f(g(${num(x)})).`, zh: `f(x) = ${fs}，g(x) = ${coef(m)}${n ? sg(n) : ''}，求 f(g(${num(x)}))。`, solEn: `g(${num(x)}) = ${num(g(x))}; f(${num(g(x))}) = ${num(f(g(x)))}`, solZh: `g(${num(x)}) = ${num(g(x))}；f(${num(g(x))}) = ${num(f(g(x)))}` }); }
    if (k === 'inv') { const m = R(2, 7), n = R(-9, 9), t = R(-5, 8), v = m * t + n; return mk({ topic: 'func', value: t, en: `f(x) = ${coef(m)}${n ? sg(n) : ''}. Find f⁻¹(${num(v)}).`, zh: `f(x) = ${coef(m)}${n ? sg(n) : ''}，求 f⁻¹(${num(v)})。`, solEn: `Solve ${coef(m)}${n ? sg(n) : ''} = ${num(v)}: x = ${num(t)}`, solZh: `解 ${coef(m)}${n ? sg(n) : ''} = ${num(v)}：x = ${num(t)}` }); }
    if (k === 'vertex') { const h = R(-5, 5), kk = R(-9, 9), A = R(1, 3), B = -2 * A * h, Cc = A * h * h + kk; return mk({ topic: 'func', value: kk, en: `Find the minimum value of y = ${poly([[A, 2], [B, 1], [Cc, 0]])}.`, zh: `求 y = ${poly([[A, 2], [B, 1], [Cc, 0]])} 的最小值。`, solEn: `Vertex at x = −b/2a = ${num(h)}; y = ${num(kk)}`, solZh: `顶点 x = −b/2a = ${num(h)}，最小值 ${num(kk)}` }); }
    const r = R(1, 6), s = R(-6, -1), A = 1, B = -(r + s), Cc = r * s;   // solve f(x) = 0, larger root of |x| style
    return mk({ topic: 'func', value: r, en: `Find the positive solution of ${poly([[A, 2], [B, 1], [Cc, 0]])} = 0.`, zh: `求方程 ${poly([[A, 2], [B, 1], [Cc, 0]])} = 0 的正根。`, solEn: `(x − ${r})(x + ${-s}) = 0 → x = ${r}`, solZh: `(x − ${r})(x + ${-s}) = 0，正根 x = ${r}` });
  });

  /* ---------- exponentials & logarithms ---------- */
  reg('explog', 11, (y, d) => {
    const k = pick(d <= 1 ? ['log', 'solve'] : ['laws', 'solve2', 'change', 'growth']);
    if (k === 'log') { const b = pick([2, 3, 5, 10]), e = R(2, b === 2 ? 8 : 4); const sub = String(b).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join(''); return mk({ topic: 'explog', value: e, en: `Evaluate log${sub}(${b ** e}).`, zh: `求 log_${b}(${b ** e}) 的值。`, solEn: `${b}^${e} = ${b ** e}`, solZh: `因为 ${b}^${e} = ${b ** e}` }); }
    if (k === 'solve') { const b = pick([2, 3, 4, 5]), e = R(2, 6); return mk({ topic: 'explog', value: e, en: `Solve ${b}^x = ${b ** e}.`, zh: `解方程 ${b}^x = ${b ** e}。`, solEn: `${b ** e} = ${b}^${e}, so x = ${e}`, solZh: `${b ** e} = ${b}^${e}，所以 x = ${e}` }); }
    if (k === 'laws') { const b = pick([2, 3]), p = R(1, 5), q = R(1, 5), r = R(1, 4), v = p + q - r; return mk({ topic: 'explog', value: v, en: `Evaluate log_${b} ${b ** p} + log_${b} ${b ** q} − log_${b} ${b ** r}.`, zh: `求 log_${b} ${b ** p} + log_${b} ${b ** q} − log_${b} ${b ** r} 的值。`, solEn: `${p} + ${q} − ${r} = ${num(v)}`, solZh: `${p} + ${q} − ${r} = ${num(v)}` }); }
    if (k === 'solve2') { const b = pick([2, 3]), e = R(1, 4), m = R(2, 5), v = m * b ** (e + 1); return mk({ topic: 'explog', value: e, en: `Solve ${m} × ${b}^(x + 1) = ${v}.`, zh: `解方程 ${m} × ${b}^(x + 1) = ${v}。`, solEn: `${b}^(x + 1) = ${v / m} = ${b}^${e + 1}, so x = ${e}`, solZh: `${b}^(x + 1) = ${v / m} = ${b}^${e + 1}，x = ${e}` }); }
    if (k === 'change') { const N = R(3, 60), b = pick([2, 3, 5]), v = dp2(Math.log(N) / Math.log(b)); return mk({ topic: 'explog', value: v, tol: TOL, answer: v.toFixed(2), en: `Solve ${b}^x = ${N}, giving x to 2 decimal places.`, zh: `解方程 ${b}^x = ${N}，结果保留两位小数。`, solEn: `x = ln ${N} / ln ${b} ≈ ${v.toFixed(2)}`, solZh: `x = ln ${N} / ln ${b} ≈ ${v.toFixed(2)}` }); }
    const P = R(2, 9) * 100, r = pick([2, 3, 4, 5, 6]) / 100, t = R(3, 10), v = dp2(P * (1 + r) ** t);
    return mk({ topic: 'explog', value: v, unit: '$', tol: 0.011, answer: '$' + v.toFixed(2), en: `$${P} is invested at ${r * 100}% p.a. compounded annually. What is it worth after ${t} years? (to the nearest cent)`, zh: `${P} 元按年利率 ${r * 100}% 复利计息，${t} 年后本息和是多少元？（精确到分）`, solEn: `${P} × ${1 + r}^${t} ≈ ${v.toFixed(2)}`, solZh: `${P} × ${1 + r}^${t} ≈ ${v.toFixed(2)}` });
  });

  /* ---------- trigonometry ---------- */
  reg('trig', 11, (y, d) => {
    const k = pick(d <= 1 ? ['exact', 'solveDeg', 'sineRule'] : ['solveDeg', 'sineRule', 'cosRule', 'area', 'count']);
    if (k === 'exact') { const [e, v, z] = pick([['sin 30°', 0.5, '1/2'], ['cos 60°', 0.5, '1/2'], ['tan 45°', 1, '1'], ['sin² 45°', 0.5, '1/2'], ['cos² 30°', 0.75, '3/4'], ['tan² 60°', 3, '3']]); return mk({ topic: 'trig', value: v, answer: z, en: `Find the exact value of ${e}.`, zh: `求 ${e} 的精确值。`, solEn: `${e} = ${z}`, solZh: `${e} = ${z}` }); }
    if (k === 'solveDeg') { const [fn, c, base] = pick([['sin', '1/2', 30], ['cos', '1/2', 60], ['tan', '1', 45], ['sin', '√3/2', 60], ['cos', '√2/2', 45]]), q = pick([2, 3]); // second solution in [0°, 360°)
      const sols = fn === 'sin' ? [base, 180 - base] : fn === 'cos' ? [base, 360 - base] : [base, 180 + base], v = q === 2 ? sols[1] : sols[0] + sols[1];
      return mk({ topic: 'trig', value: v, unit: '°', en: q === 2 ? `Find the larger solution of ${fn} x = ${c} for 0° ≤ x < 360°.` : `Find the sum of the solutions of ${fn} x = ${c} for 0° ≤ x < 360°.`, zh: q === 2 ? `求 ${fn} x = ${c}（0° ≤ x < 360°）的较大解。` : `求 ${fn} x = ${c}（0° ≤ x < 360°）所有解之和。`, solEn: `Solutions: ${sols.join('°, ')}°`, solZh: `解为 ${sols.join('°、')}°` }); }
    if (k === 'sineRule') { const A = R(30, 70), B = R(40, 90), a = R(5, 15), b = dp2(a * Math.sin(B * Math.PI / 180) / Math.sin(A * Math.PI / 180));
      return mk({ topic: 'trig', value: b, tol: TOL, unit: 'cm', answer: b.toFixed(2) + ' cm', fig: { type: 'triangle', angles: [`${A}°`, `${B}°`, null], sides: [null, `${a} cm`, 'x'], note: { en: '[not to scale]', zh: '［不按比例］' } },
        en: `In the triangle, find x (to 2 decimal places). The ${a} cm side is opposite the ${A}° angle and x is opposite the ${B}° angle.`, zh: `在三角形中，${a} 厘米的边对着 ${A}° 角，x 对着 ${B}° 角。求 x（保留两位小数）。`, solEn: `x / sin ${B}° = ${a} / sin ${A}° → x ≈ ${b.toFixed(2)}`, solZh: `正弦定理：x / sin ${B}° = ${a} / sin ${A}°，x ≈ ${b.toFixed(2)}` }); }
    if (k === 'cosRule') { const b = R(4, 12), c = R(4, 12), A = pick([60, 120, 45, 30, 100]), a = dp2(Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A * Math.PI / 180)));
      return mk({ topic: 'trig', value: a, tol: TOL, unit: 'cm', answer: a.toFixed(2) + ' cm', fig: { type: 'triangle', angles: [`${A}°`, null, null], sides: [`${b} cm`, 'x', `${c} cm`] },
        en: `Two sides of a triangle are ${b} cm and ${c} cm with an included angle of ${A}°. Find the third side x (2 d.p.).`, zh: `三角形两边长 ${b} 厘米和 ${c} 厘米，夹角 ${A}°。求第三边 x（保留两位小数）。`, solEn: `x² = ${b}² + ${c}² − 2(${b})(${c})cos ${A}° → x ≈ ${a.toFixed(2)}`, solZh: `余弦定理：x² = ${b}² + ${c}² − 2·${b}·${c}·cos ${A}°，x ≈ ${a.toFixed(2)}` }); }
    if (k === 'area') { const a = R(4, 14), b = R(4, 14), C2 = pick([30, 150]), v = a * b / 4; return mk({ topic: 'trig', value: v, unit: 'cm²', en: `Find the area of a triangle with sides ${a} cm and ${b} cm and included angle ${C2}°.`, zh: `三角形两边 ${a} 厘米、${b} 厘米，夹角 ${C2}°，求面积。`, solEn: `½ab sin C = ½ × ${a} × ${b} × ½ = ${v}`, solZh: `S = ½ab sin C = ½ × ${a} × ${b} × ½ = ${v}` }); }
    const n = R(2, 5), v = 2 * n;
    return mk({ topic: 'trig', value: v, en: `How many solutions does sin(${n}x) = 0.3 have for 0 ≤ x < 2π?`, zh: `方程 sin(${n}x) = 0.3 在 0 ≤ x < 2π 内有多少个解？`, solEn: `${n} complete periods, two solutions each: ${v}`, solZh: `共 ${n} 个周期，每个周期两个解：${v}` });
  });

  /* ---------- calculus ---------- */
  reg('calc', 11, (y, d) => {
    const k = pick(d <= 1 ? ['deriv', 'integ'] : ['deriv', 'tangent', 'stat', 'integ', 'area', 'chain']);
    const a = R(1, 4), b = R(-6, 6), c = R(-9, 9), x0 = R(-3, 3);
    if (k === 'deriv') { const n = R(2, 4), v = n * a * x0 ** (n - 1) + b; return mk({ topic: 'calc', value: v, en: `If f(x) = ${poly([[a, n], [b, 1], [c, 0]])}, find f′(${num(x0)}).`, zh: `已知 f(x) = ${poly([[a, n], [b, 1], [c, 0]])}，求 f′(${num(x0)})。`, solEn: `f′(x) = ${poly([[n * a, n - 1], [b, 0]])}; f′(${num(x0)}) = ${num(v)}`, solZh: `f′(x) = ${poly([[n * a, n - 1], [b, 0]])}，f′(${num(x0)}) = ${num(v)}` }); }
    if (k === 'tangent') { const f = x => a * x * x + b * x + c, m = 2 * a * x0 + b, yi = f(x0) - m * x0; return mk({ topic: 'calc', value: yi, en: `Find the y-intercept of the tangent to y = ${poly([[a, 2], [b, 1], [c, 0]])} at x = ${num(x0)}.`, zh: `求曲线 y = ${poly([[a, 2], [b, 1], [c, 0]])} 在 x = ${num(x0)} 处切线的 y 轴截距。`, solEn: `Gradient ${num(m)}, point (${num(x0)}, ${num(f(x0))}); y = ${num(m)}x + ${num(yi)}`, solZh: `斜率 ${num(m)}，切点 (${num(x0)}, ${num(f(x0))})，截距 ${num(yi)}` }); }
    if (k === 'stat') { const p = R(-4, 1), q = p + R(1, 5), A = 2, B = -3 * (p + q), Cc = 6 * p * q; // f' = 6(x−p)(x−q)
      return mk({ topic: 'calc', value: q, en: `Find the x-coordinate of the local minimum of y = ${poly([[A, 3], [B, 2], [Cc, 1]])}.`, zh: `求 y = ${poly([[A, 3], [B, 2], [Cc, 1]])} 的极小值点的横坐标。`, solEn: `y′ = 6(x ${p < 0 ? '+ ' + -p : '− ' + p})(x ${q < 0 ? '+ ' + -q : '− ' + q}); minimum at the larger root x = ${q}`, solZh: `y′ = 6(x − ${paren(p)})(x − ${paren(q)})，极小值点在较大的根 x = ${q}` }); }
    if (k === 'integ') { const lo = R(0, 1), hi = lo + R(1, 3), F = x => a * x ** 3 / 3 + b * x * x / 2 + c * x, v = F(hi) - F(lo), den = 6;
      return mk({ topic: 'calc', value: v, answer: fracStr(Math.round(v * den), den), en: `Evaluate ∫ from ${lo} to ${hi} of (${poly([[a, 2], [b, 1], [c, 0]])}) dx. (Exact answer; a fraction is fine.)`, zh: `求 ∫_${lo}^${hi} (${poly([[a, 2], [b, 1], [c, 0]])}) dx 的值（精确值，可用分数）。`, solEn: `[${a}x³/3 + ${b}x²/2 + ${c}x] from ${lo} to ${hi} = ${fracStr(Math.round(v * den), den)}`, solZh: `原函数 ${a}x³/3 + ${b}x²/2 + ${c}x，代入上下限得 ${fracStr(Math.round(v * den), den)}` }); }
    if (k === 'area') { const r = R(1, 5), v = r ** 3 / 6 * 1; // area between y = x(r − x) and x-axis = r³/6
      return mk({ topic: 'calc', value: v, answer: fracStr(r ** 3, 6), en: `Find the area enclosed between y = x(${r} − x) and the x-axis.`, zh: `求曲线 y = x(${r} − x) 与 x 轴围成的面积。`, solEn: `∫₀^${r} (${r}x − x²) dx = ${r}³/6 = ${fracStr(r ** 3, 6)}`, solZh: `∫₀^${r} (${r}x − x²) dx = ${r}³/6 = ${fracStr(r ** 3, 6)}` }); }
    const m = R(2, 4), n = R(2, 5), x1 = R(0, 2), v = n * m * (m * x1 + 1) ** (n - 1);
    return mk({ topic: 'calc', value: v, en: `If y = (${m}x + 1)^${n}, find dy/dx when x = ${x1}.`, zh: `若 y = (${m}x + 1)^${n}，求 x = ${x1} 时 dy/dx 的值。`, solEn: `dy/dx = ${n}·${m}(${m}x + 1)^${n - 1} = ${v}`, solZh: `链式法则：dy/dx = ${n}·${m}(${m}x + 1)^${n - 1} = ${v}` });
  });

  /* ---------- sequences & series ---------- */
  reg('series', 11, (y, d) => {
    const k = pick(d <= 1 ? ['apN', 'gpN'] : ['apS', 'gpS', 'limit', 'apFind']);
    const a = R(-5, 12), dd = R(2, 7), n = R(10, 30);
    if (k === 'apN') return mk({ topic: 'series', value: a + (n - 1) * dd, en: `An arithmetic sequence has first term ${num(a)} and common difference ${dd}. Find the ${n}th term.`, zh: `等差数列首项 ${num(a)}，公差 ${dd}。求第 ${n} 项。`, solEn: `a + (n − 1)d = ${num(a)} + ${n - 1} × ${dd} = ${num(a + (n - 1) * dd)}`, solZh: `a + (n − 1)d = ${num(a + (n - 1) * dd)}` });
    if (k === 'apS') { const S = n * (2 * a + (n - 1) * dd) / 2; return mk({ topic: 'series', value: S, en: `Find the sum of the first ${n} terms of ${a}, ${a + dd}, ${a + 2 * dd}, …`, zh: `求等差数列 ${a}，${a + dd}，${a + 2 * dd}，……前 ${n} 项的和。`, solEn: `S = n/2 (2a + (n − 1)d) = ${S}`, solZh: `S = n/2 (2a + (n − 1)d) = ${S}` }); }
    if (k === 'apFind') { const t5 = a + 4 * dd, t12 = a + 11 * dd; return mk({ topic: 'series', value: a, en: `In an arithmetic sequence the 5th term is ${num(t5)} and the 12th term is ${num(t12)}. Find the first term.`, zh: `等差数列第 5 项是 ${num(t5)}，第 12 项是 ${num(t12)}，求首项。`, solEn: `7d = ${t12 - t5} → d = ${dd}; a = ${num(t5)} − 4 × ${dd} = ${num(a)}`, solZh: `7d = ${t12 - t5}，d = ${dd}；a = ${num(a)}` }); }
    const g = R(1, 5), r = pick([2, 3, -2]), m = R(4, 8);
    if (k === 'gpN') return mk({ topic: 'series', value: g * r ** (m - 1), en: `A geometric sequence has first term ${g} and common ratio ${r}. Find the ${m}th term.`, zh: `等比数列首项 ${g}，公比 ${r}。求第 ${m} 项。`, solEn: `ar^(n − 1) = ${g} × ${paren(r)}^${m - 1} = ${num(g * r ** (m - 1))}`, solZh: `ar^(n − 1) = ${num(g * r ** (m - 1))}` });
    if (k === 'gpS') { const S = g * (r ** m - 1) / (r - 1); return mk({ topic: 'series', value: S, en: `Find the sum of the first ${m} terms of the geometric series ${g} + ${g * r} + ${g * r * r} + …`, zh: `求等比数列 ${g} + ${g * r} + ${g * r * r} + …… 前 ${m} 项的和。`, solEn: `S = a(rⁿ − 1)/(r − 1) = ${num(S)}`, solZh: `S = a(rⁿ − 1)/(r − 1) = ${num(S)}` }); }
    const [p, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-1, 2], [-1, 3]]), A = R(2, 12), lim = A / (1 - p / q);
    return mk({ topic: 'series', value: lim, answer: fracStr(A * q, q - p), en: `Find the limiting sum of the geometric series with first term ${A} and common ratio ${fracStr(p, q)}.`, zh: `等比数列首项 ${A}，公比 ${fracStr(p, q)}，求其无穷项和。`, solEn: `S∞ = a/(1 − r) = ${A}/(1 − ${fracStr(p, q)}) = ${fracStr(A * q, q - p)}`, solZh: `S∞ = a/(1 − r) = ${fracStr(A * q, q - p)}` });
  });

  /* ---------- statistics & probability ---------- */
  reg('stats2', 11, (y, d) => {
    const k = pick(d <= 1 ? ['ev', 'z'] : ['binom', 'ev', 'z', 'cond']);
    if (k === 'ev') { const xs = [0, 1, 2, 3], w = [R(1, 4), R(1, 4), R(1, 4), R(1, 4)], T = w.reduce((a, b) => a + b, 0), E = xs.reduce((s, x, i) => s + x * w[i], 0);
      return mk({ topic: 'stats2', value: E / T, answer: fracStr(E, T), en: `A random variable X takes values 0, 1, 2, 3 with probabilities ${w.map(v => fracStr(v, T)).join(', ')}. Find E(X).`, zh: `随机变量 X 取 0、1、2、3 的概率分别为 ${w.map(v => fracStr(v, T)).join('、')}，求 E(X)。`, solEn: `Σ x·P(x) = ${fracStr(E, T)}`, solZh: `E(X) = Σ x·P(x) = ${fracStr(E, T)}` }); }
    if (k === 'z') { const mu = R(40, 80), sd = R(2, 12), z = pick([-2, -1, 1, 1.5, 2, 2.5]), x = mu + z * sd; return mk({ topic: 'stats2', value: z, en: `Test scores have mean ${mu} and standard deviation ${sd}. What is the z-score of a mark of ${num(x)}?`, zh: `成绩平均分 ${mu}，标准差 ${sd}。${num(x)} 分的 z 分数是多少？`, solEn: `z = (${num(x)} − ${mu}) / ${sd} = ${num(z)}`, solZh: `z = (${num(x)} − ${mu}) / ${sd} = ${num(z)}` }); }
    if (k === 'binom') { const n = R(3, 6), kk = R(1, n - 1), [p, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4]]), N = C(n, kk) * p ** kk * (q - p) ** (n - kk), D = q ** n;
      return mk({ topic: 'stats2', value: N / D, answer: fracStr(N, D), en: `X ~ Bin(${n}, ${fracStr(p, q)}). Find P(X = ${kk}) as a fraction.`, zh: `X ~ B(${n}, ${fracStr(p, q)})，求 P(X = ${kk})（用分数表示）。`, solEn: `C(${n}, ${kk})(${fracStr(p, q)})^${kk}(${fracStr(q - p, q)})^${n - kk} = ${fracStr(N, D)}`, solZh: `C(${n}, ${kk})(${fracStr(p, q)})^${kk}(${fracStr(q - p, q)})^${n - kk} = ${fracStr(N, D)}` }); }
    const a = R(2, 6), b = R(2, 6), c = R(1, 5), e = R(1, 5);   // two-way table conditional probability
    return mk({ topic: 'stats2', value: a / (a + b), answer: fracStr(a, a + b), fig: { type: 'table', head: ['', { en: 'Sport', zh: '运动' }, { en: 'No sport', zh: '不运动' }], rowHeads: true, rows: [[{ en: 'Year 11', zh: '11 年级' }, a, c], [{ en: 'Year 12', zh: '12 年级' }, b, e]] },
      en: 'The table shows students who play sport. A student who plays sport is chosen at random. What is the probability they are in Year 11?', zh: '下表是学生参加运动的情况。从参加运动的学生中随机选一人，他是 11 年级学生的概率是多少？', solEn: `P(Year 11 | sport) = ${a}/(${a} + ${b}) = ${fracStr(a, a + b)}`, solZh: `P(11 年级 | 运动) = ${a}/(${a} + ${b}) = ${fracStr(a, a + b)}` });
  });

  /* ---------- gradient from a graph (with coordinate grid) ---------- */
  reg('graphs', 11, (y, d) => {
    const x1 = R(-4, 0), y1 = R(-4, 1), dx = R(1, 4), dy = R(-4, 5) || 3, x2 = x1 + dx, y2 = y1 + dy;
    if (x2 > 5 || y2 > 5 || y2 < -5) return null;
    const ask = pick(['grad', 'yint']), m = dy / dx, c = y1 - m * x1;
    return mk({ topic: 'graphs', value: ask === 'grad' ? m : c, answer: ask === 'grad' ? fracStr(dy, dx) : fracStr(Math.round(c * dx), dx), fig: { type: 'coord', xmin: -5, xmax: 5, ymin: -5, ymax: 5, points: [[x1, y1, 'A'], [x2, y2, 'B']], segments: [[x1, y1, x2, y2]] },
      en: ask === 'grad' ? 'Find the gradient of the line through A and B.' : 'The line through A and B is extended. Where does it cross the y-axis? (Give the y-value.)', zh: ask === 'grad' ? '求经过 A、B 两点的直线的斜率。' : '延长直线 AB，它与 y 轴交点的纵坐标是多少？',
      solEn: `A(${x1}, ${y1}), B(${x2}, ${y2}); m = ${dy}/${dx}${ask === 'yint' ? `; c = y − mx = ${fracStr(Math.round(c * dx), dx)}` : ''}`, solZh: `A(${x1}, ${y1})，B(${x2}, ${y2})；斜率 ${dy}/${dx}${ask === 'yint' ? `；截距 ${fracStr(Math.round(c * dx), dx)}` : ''}` });
  });

  /* ======================= Extension 1 (3U) ======================= */
  reg('comb', 13, (y, d) => {
    const k = pick(['word', 'ncr', 'circle', 'together']);
    if (k === 'word') { const w = pick(['BANANA', 'LETTER', 'MISSISSIPPI', 'STATISTICS', 'PEPPER', 'ALGEBRA', 'COMMITTEE']); const cnt = {}; for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1; let v = 1; for (let i = 2; i <= w.length; i++) v *= i; for (const ch in cnt) for (let i = 2; i <= cnt[ch]; i++) v /= i;
      return mk({ topic: 'comb', value: v, en: `How many different arrangements are there of the letters of the word ${w}?`, zh: `单词 ${w} 的字母有多少种不同的排列？`, solEn: `${w.length}! divided by the factorials of repeated letters = ${v}`, solZh: `${w.length}! 除以重复字母个数的阶乘 = ${v}` }); }
    if (k === 'ncr') { const n = R(8, 12), g = R(2, 4), b = R(2, 4), boys = R(4, 7), girls = n - boys, v = C(boys, b) * C(girls, g); if (girls < g) return null;
      return mk({ topic: 'comb', value: v, en: `A committee of ${b} boys and ${g} girls is chosen from ${boys} boys and ${girls} girls. How many committees are possible?`, zh: `从 ${boys} 名男生和 ${girls} 名女生中选 ${b} 男 ${g} 女组成委员会，有多少种选法？`, solEn: `C(${boys}, ${b}) × C(${girls}, ${g}) = ${v}`, solZh: `C(${boys}, ${b}) × C(${girls}, ${g}) = ${v}` }); }
    if (k === 'circle') { const n = R(5, 8); let v = 1; for (let i = 2; i < n; i++) v *= i; return mk({ topic: 'comb', value: v, en: `In how many ways can ${n} people sit around a round table?`, zh: `${n} 人围坐圆桌，有多少种坐法？`, solEn: `(${n} − 1)! = ${v}`, solZh: `(${n} − 1)! = ${v}` }); }
    const n = R(5, 7); let f = 1; for (let i = 2; i <= n - 1; i++) f *= i; const v = f * 2;
    return mk({ topic: 'comb', value: v, en: `${n} people stand in a line. In how many ways can this be done if two particular people must stand next to each other?`, zh: `${n} 人站成一排，其中两人必须相邻，有多少种站法？`, solEn: `Treat the pair as one: (${n - 1})! × 2 = ${v}`, solZh: `捆绑法：(${n - 1})! × 2 = ${v}` });
  });
  reg('poly', 13, (y, d) => {
    const k = pick(['remainder', 'factor', 'roots']);
    const a = R(1, 3), b = R(-5, 5), c = R(-6, 6), e = R(-9, 9), P = x => a * x ** 3 + b * x * x + c * x + e, ps = poly([[a, 3], [b, 2], [c, 1], [e, 0]]);
    if (k === 'remainder') { const t = R(-3, 3); return mk({ topic: 'poly', value: P(t), en: `Find the remainder when P(x) = ${ps} is divided by (x ${t < 0 ? '+ ' + -t : '− ' + t}).`, zh: `求 P(x) = ${ps} 除以 (x ${t < 0 ? '+ ' + -t : '− ' + t}) 的余数。`, solEn: `Remainder theorem: P(${t}) = ${P(t)}`, solZh: `余数定理：P(${t}) = ${P(t)}` }); }
    if (k === 'factor') { const t = R(1, 3), kk = -(a * t ** 3 + b * t * t + c * t); return mk({ topic: 'poly', value: kk, en: `(x − ${t}) is a factor of ${poly([[a, 3], [b, 2], [c, 1]])} + k. Find k.`, zh: `(x − ${t}) 是 ${poly([[a, 3], [b, 2], [c, 1]])} + k 的因式，求 k。`, solEn: `P(${t}) = 0 → k = ${kk}`, solZh: `P(${t}) = 0，得 k = ${kk}` }); }
    const r = [R(-4, 4), R(-4, 4), R(1, 5)], s1 = r[0] + r[1] + r[2], s2 = r[0] * r[1] + r[1] * r[2] + r[0] * r[2], s3 = r[0] * r[1] * r[2], want = pick(['sum', 'prod', 'recip']);
    if (want === 'recip' && s3 === 0) return null;
    const v = want === 'sum' ? s1 : want === 'prod' ? s3 : s2 / s3;
    return mk({ topic: 'poly', value: v, answer: want === 'recip' ? fracStr(s2, s3) : undefined, en: `α, β, γ are the roots of ${poly([[1, 3], [-s1, 2], [s2, 1], [-s3, 0]])} = 0. Find ${want === 'sum' ? 'α + β + γ' : want === 'prod' ? 'αβγ' : '1/α + 1/β + 1/γ'}.`, zh: `α、β、γ 是 ${poly([[1, 3], [-s1, 2], [s2, 1], [-s3, 0]])} = 0 的根，求 ${want === 'sum' ? 'α + β + γ' : want === 'prod' ? 'αβγ' : '1/α + 1/β + 1/γ'}。`,
      solEn: `Vieta: α + β + γ = ${s1}, αβ + βγ + γα = ${s2}, αβγ = ${s3}`, solZh: `韦达定理：α + β + γ = ${s1}，αβ + βγ + γα = ${s2}，αβγ = ${s3}` });
  });
  reg('vectors', 13, (y, d) => {
    const k = pick(['dot', 'mag', 'perp']), a = [R(-6, 6), R(-6, 6)], b = [R(-6, 6), R(-6, 6)];
    if (k === 'dot') return mk({ topic: 'vectors', value: a[0] * b[0] + a[1] * b[1], en: `a = ${a[0]}i ${a[1] < 0 ? MINUS : '+'} ${Math.abs(a[1])}j and b = ${b[0]}i ${b[1] < 0 ? MINUS : '+'} ${Math.abs(b[1])}j. Find a · b.`, zh: `a = ${a[0]}i ${a[1] < 0 ? MINUS : '+'} ${Math.abs(a[1])}j，b = ${b[0]}i ${b[1] < 0 ? MINUS : '+'} ${Math.abs(b[1])}j，求 a · b。`, solEn: `${a[0]} × ${paren(b[0])} + ${a[1]} × ${paren(b[1])} = ${a[0] * b[0] + a[1] * b[1]}`, solZh: `${a[0] * b[0] + a[1] * b[1]}` });
    if (k === 'mag') { const [p, q, r] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [7, 24, 25]]), sgn = Math.random() < 0.5 ? MINUS : '+'; return mk({ topic: 'vectors', value: r, en: `Find |${p}i ${sgn} ${q}j|.`, zh: `求 |${p}i ${sgn} ${q}j|。`, solEn: `√(${p}² + ${q}²) = ${r}`, solZh: `√(${p}² + ${q}²) = ${r}` }); }
    const p = R(1, 6), q = R(1, 6), m = R(1, 4), kk = m * q;   // (p i + q j)·(k i − m p j)=0 → p k − q m p = 0 → k = m q
    return mk({ topic: 'vectors', value: kk, en: `Find k if ${p}i + ${q}j is perpendicular to ki − ${m * p}j.`, zh: `若 ${p}i + ${q}j 与 ki − ${m * p}j 垂直，求 k。`, solEn: `${p}k − ${q * m * p} = 0 → k = ${kk}`, solZh: `${p}k − ${q * m * p} = 0，k = ${kk}` });
  });
  reg('invtrig', 13, (y, d) => {
    if (Math.random() < 0.5) {   // f(g⁻¹(p/r)) using a right-angled triangle with sides p, q, r
      const [p, q, r] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]);
      const [outer, inv, N, D] = pick([['sin', 'cos⁻¹', q, r], ['cos', 'sin⁻¹', q, r], ['tan', 'cos⁻¹', q, p], ['tan', 'sin⁻¹', p, q]]);
      const e2 = `${outer}(${inv}(${p}/${r}))`;
      return mk({ topic: 'invtrig', value: N / D, answer: fracStr(N, D), en: `Find the exact value of ${e2}.`, zh: `求 ${e2} 的精确值。`,
        solEn: `Let θ = ${inv}(${p}/${r}); draw a right-angled triangle with sides ${p}, ${q}, ${r}: ${outer} θ = ${fracStr(N, D)}`, solZh: `设 θ = ${inv}(${p}/${r})，画边长 ${p}、${q}、${r} 的直角三角形：${outer} θ = ${fracStr(N, D)}` });
    }
    const [e, v] = pick([['sin⁻¹(1/2)', 30], ['cos⁻¹(1/2)', 60], ['tan⁻¹(1)', 45], ['cos⁻¹(−1/2)', 120], ['sin⁻¹(−√3/2)', -60], ['tan⁻¹(√3)', 60], ['cos⁻¹(0)', 90]]), two = d >= 2 && Math.random() < 0.5;
    if (two) { const [e2, v2] = pick([['sin⁻¹(1/2)', 30], ['cos⁻¹(1/2)', 60], ['tan⁻¹(1)', 45]]); return mk({ topic: 'invtrig', value: v + v2, unit: '°', en: `Find ${e} + ${e2} in degrees.`, zh: `求 ${e} + ${e2}（用度表示）。`, solEn: `${v}° + ${v2}° = ${v + v2}°`, solZh: `${v}° + ${v2}° = ${v + v2}°` }); }
    return mk({ topic: 'invtrig', value: v, unit: '°', en: `Find the exact value of ${e}, in degrees.`, zh: `求 ${e} 的值（用度表示）。`, solEn: `${e} = ${v}° (principal value)`, solZh: `主值为 ${v}°` });
  });

  /* ======================= Extension 2 (4U) ======================= */
  reg('complex', 14, (y, d) => {
    const k = pick(['mod', 'mult', 'arg', 'demoivre', 'roots']);
    if (k === 'mod') { const [p, q, r] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]]), sgn = Math.random() < 0.5 ? MINUS : '+'; return mk({ topic: 'complex', value: r, en: `Find |${p} ${sgn} ${q}i|.`, zh: `求 |${p} ${sgn} ${q}i|。`, solEn: `√(${p}² + ${q}²) = ${r}`, solZh: `√(${p}² + ${q}²) = ${r}` }); }
    if (k === 'mult') { const a = R(-5, 5), b = R(-5, 5), c = R(-5, 5), e = R(-5, 5), part = pick(['real', 'imag']), v = part === 'real' ? a * c - b * e : a * e + b * c;
      return mk({ topic: 'complex', value: v, en: `Find the ${part === 'real' ? 'real' : 'imaginary'} part of (${a} ${b < 0 ? MINUS : '+'} ${Math.abs(b)}i)(${c} ${e < 0 ? MINUS : '+'} ${Math.abs(e)}i).`, zh: `求 (${a} ${b < 0 ? MINUS : '+'} ${Math.abs(b)}i)(${c} ${e < 0 ? MINUS : '+'} ${Math.abs(e)}i) 的${part === 'real' ? '实部' : '虚部'}。`, solEn: `Expand: ${a * c - b * e} ${a * e + b * c < 0 ? MINUS : '+'} ${Math.abs(a * e + b * c)}i`, solZh: `展开得 ${a * c - b * e} ${a * e + b * c < 0 ? MINUS : '+'} ${Math.abs(a * e + b * c)}i` }); }
    if (k === 'arg') { const [z, v] = pick([['1 + i', 45], ['1 + √3 i', 60], ['√3 + i', 30], ['−1 + i', 135], ['−√3 − i', -150], ['1 − i', -45]]); return mk({ topic: 'complex', value: v, unit: '°', en: `Find the principal argument of ${z} in degrees (−180° < arg ≤ 180°).`, zh: `求 ${z} 的主辐角（−180° < arg ≤ 180°，用度表示）。`, solEn: `arg = ${v}°`, solZh: `arg = ${v}°` }); }
    if (k === 'demoivre') { const n = R(3, 12), [z, r, th] = pick([['1 + i', Math.SQRT2, 45], ['√3 + i', 2, 30], ['1 + √3 i', 2, 60]]), v = Math.round(r ** n * Math.cos(n * th * Math.PI / 180));
      return mk({ topic: 'complex', value: v, en: `Using De Moivre's theorem, find the real part of (${z})^${n}.`, zh: `用棣莫弗定理求 (${z})^${n} 的实部。`, solEn: `(${z})^${n} = ${num(round(r ** n, 4))} cis(${n * th}°); real part = ${v}`, solZh: `(${z})^${n} = ${num(round(r ** n, 4))} cis(${n * th}°)，实部 = ${v}` }); }
    const n = R(3, 8);
    return mk({ topic: 'complex', value: 0, en: `ω ≠ 1 is a root of z^${n} = 1. Find 1 + ω + ω² + … + ω^${n - 1}.`, zh: `ω ≠ 1 是 z^${n} = 1 的根，求 1 + ω + ω² + … + ω^${n - 1}。`, solEn: `Geometric series: (ω^${n} − 1)/(ω − 1) = 0`, solZh: `等比求和：(ω^${n} − 1)/(ω − 1) = 0`, answer: '0' });
  });
  reg('integ', 14, (y, d) => {
    const k = pick(['parts', 'sub', 'log', 'trig']);
    if (k === 'parts') { const v = 1; return mk({ topic: 'integ', value: v, en: 'Evaluate ∫₀¹ x eˣ dx.', zh: '求 ∫₀¹ x eˣ dx。', solEn: '[x eˣ − eˣ]₀¹ = (e − e) − (0 − 1) = 1', solZh: '分部积分：[x eˣ − eˣ]₀¹ = 1' }); }
    if (k === 'sub') { const n = R(2, 6), v = dp2((2 ** (n + 1) - 1) / (2 * (n + 1))); // ∫0^1 x(1+x²)^n dx = (2^(n+1) − 1)/(2(n+1))
      return mk({ topic: 'integ', value: (2 ** (n + 1) - 1) / (2 * (n + 1)), answer: fracStr(2 ** (n + 1) - 1, 2 * (n + 1)), en: `Evaluate ∫₀¹ x(1 + x²)^${n} dx exactly.`, zh: `求 ∫₀¹ x(1 + x²)^${n} dx 的精确值。`, solEn: `Let u = 1 + x²: ½∫₁² u^${n} du = (2^${n + 1} − 1)/${2 * (n + 1)} = ${fracStr(2 ** (n + 1) - 1, 2 * (n + 1))} ≈ ${v}`, solZh: `令 u = 1 + x²：结果 = ${fracStr(2 ** (n + 1) - 1, 2 * (n + 1))}` }); }
    if (k === 'log') { const a = R(1, 4), b = R(2, 6), v = dp2(Math.log((b * b + a) / a) / 2); return mk({ topic: 'integ', value: v, tol: TOL, answer: v.toFixed(2), en: `Evaluate ∫₀^${b} x/(x² + ${a}) dx to 2 decimal places.`, zh: `求 ∫₀^${b} x/(x² + ${a}) dx（保留两位小数）。`, solEn: `½ ln(x² + ${a}) from 0 to ${b} = ½ ln(${b * b + a}/${a}) ≈ ${v.toFixed(2)}`, solZh: `½ ln(x² + ${a})，代入得 ½ ln(${b * b + a}/${a}) ≈ ${v.toFixed(2)}` }); }
    const n = pick([2, 4]), v = n === 2 ? Math.PI / 4 : 3 * Math.PI / 16;
    return mk({ topic: 'integ', value: dp2(v), tol: TOL, answer: dp2(v).toFixed(2), en: `Evaluate ∫₀^(π/2) sin^${n} x dx to 2 decimal places.`, zh: `求 ∫₀^(π/2) sin^${n} x dx（保留两位小数）。`, solEn: n === 2 ? 'Use sin²x = (1 − cos 2x)/2: π/4 ≈ 0.79' : 'Reduction formula: (3/4)(1/2)(π/2) = 3π/16 ≈ 0.59', solZh: n === 2 ? '用 sin²x = (1 − cos 2x)/2：π/4 ≈ 0.79' : '递推公式：3π/16 ≈ 0.59' });
  });
  reg('mech', 14, (y, d) => {
    const k = pick(['shmPeriod', 'shmSpeed', 'range', 'height']);
    if (k === 'shmPeriod') { const n = R(2, 6), v = dp2(2 * Math.PI / n); return mk({ topic: 'mech', value: v, tol: TOL, unit: 's', answer: v.toFixed(2) + ' s', en: `A particle moves in simple harmonic motion with ẍ = −${n * n}x. Find its period in seconds (2 d.p.).`, zh: `质点作简谐运动，ẍ = −${n * n}x。求周期（秒，保留两位小数）。`, solEn: `n = ${n}; T = 2π/${n} ≈ ${v.toFixed(2)} s`, solZh: `n = ${n}，T = 2π/${n} ≈ ${v.toFixed(2)} 秒` }); }
    if (k === 'shmSpeed') { const a = R(2, 8), n = R(2, 5); return mk({ topic: 'mech', value: a * n, unit: 'm/s', en: `x = ${a} cos(${n}t) metres. What is the maximum speed (m/s)?`, zh: `x = ${a} cos(${n}t) 米，求最大速率（米/秒）。`, solEn: `v_max = an = ${a} × ${n} = ${a * n}`, solZh: `v_max = an = ${a * n}` }); }
    const v0 = R(2, 6) * 10, th = pick([30, 45, 60]), g = 10, rng = v0 * v0 * Math.sin(2 * th * Math.PI / 180) / g, h = (v0 * Math.sin(th * Math.PI / 180)) ** 2 / (2 * g);
    const val = k === 'range' ? dp2(rng) : dp2(h);
    return mk({ topic: 'mech', value: val, tol: TOL, unit: 'm', answer: val.toFixed(2) + ' m', en: `A projectile is fired at ${v0} m/s at ${th}° to the horizontal (g = 10 m/s², no air resistance). Find the ${k === 'range' ? 'horizontal range' : 'maximum height'} (2 d.p.).`, zh: `以 ${v0} 米/秒、与水平成 ${th}° 抛出物体（g = 10 米/秒²，忽略空气阻力）。求${k === 'range' ? '水平射程' : '最大高度'}（保留两位小数）。`,
      solEn: k === 'range' ? `R = v² sin 2θ / g ≈ ${val.toFixed(2)} m` : `H = (v sin θ)² / 2g ≈ ${val.toFixed(2)} m`, solZh: k === 'range' ? `R = v² sin 2θ / g ≈ ${val.toFixed(2)} 米` : `H = (v sin θ)² / 2g ≈ ${val.toFixed(2)} 米` });
  });
})(typeof window !== 'undefined' ? window : globalThis);
