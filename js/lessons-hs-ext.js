/* High school study mode lessons, Year 12 Extension 1 (year 13) and Extension 2 (year 14), v2.2.0 (W12).
   One lesson per topic and year of js/scope-hs.js.
   L(year, topic, english, chinese), each [intro, [key points], [[worked example, how to solve it]], tip]. */
(function (root) {
  'use strict';
  const B = root.LessonsK6 = root.LessonsK6 || {};
  const L = (y, id, en, zh) => { B[y + ':' + id] = { en: pack(en), zh: pack(zh) }; };
  const pack = a => ({ intro: a[0], points: a[1], ex: a[2], tip: a[3] });

  /* ---------------- Year 12 Extension 1 (13) ---------------- */
  L(13, 'trig',
    ['Extension 1 trigonometry adds the double-angle formulas, the t-formulas and writing a sum of sine and cosine as a single wave.',
      ['sin 2x = 2 sin x cos x; cos 2x = cos²x − sin²x = 2cos²x − 1 = 1 − 2sin²x.', 'With t = tan(x/2): sin x = 2t/(1 + t²), cos x = (1 − t²)/(1 + t²).', 'a sin x + b cos x = R sin(x + α), where R = √(a² + b²) and tan α = b/a.'],
      [['Find the exact value of sin 2x if sin x = 3/5 and x is acute.', 'cos x = 4/5. sin 2x = 2 × 3/5 × 4/5 = 24/25.'], ['Write sin x + cos x in the form R sin(x + α).', 'R = √(1 + 1) = √2 and tan α = 1, so α = π/4: sin x + cos x = √2 sin(x + π/4).']],
      'A double-angle formula turns a hard 2x problem into one with x.'],
    ['拓展一的三角学增加了二倍角公式、t 公式，以及把正弦和余弦的和写成一个单一的波。',
      ['sin 2x = 2 sin x cos x；cos 2x = cos²x − sin²x = 2cos²x − 1 = 1 − 2sin²x。', '设 t = tan(x/2)：sin x = 2t/(1 + t²)，cos x = (1 − t²)/(1 + t²)。', 'a sin x + b cos x = R sin(x + α)，其中 R = √(a² + b²)，tan α = b/a。'],
      [['已知 sin x = 3/5，x 是锐角，求 sin 2x 的精确值。', 'cos x = 4/5。sin 2x = 2 × 3/5 × 4/5 = 24/25。'], ['把 sin x + cos x 写成 R sin(x + α) 的形式。', 'R = √(1 + 1) = √2，tan α = 1，所以 α = π/4：sin x + cos x = √2 sin(x + π/4)。']],
      '用二倍角公式，可以把含 2x 的难题化成只含 x 的题。']);

  L(13, 'invtrig',
    ['Inverse trigonometric functions give the angle for a given ratio. To make them functions, their ranges are restricted.',
      ['sin⁻¹x has domain −1 ≤ x ≤ 1 and range −π/2 ≤ y ≤ π/2.', 'cos⁻¹x has domain −1 ≤ x ≤ 1 and range 0 ≤ y ≤ π. tan⁻¹x has any x and range −π/2 < y < π/2.', 'd/dx (sin⁻¹x) = 1/√(1 − x²) and d/dx (tan⁻¹x) = 1/(1 + x²).'],
      [['Evaluate sin⁻¹(½).', 'sin(π/6) = ½ and π/6 is in the range, so the answer is π/6.'], ['Evaluate cos⁻¹(−1).', 'cos π = −1, so the answer is π.']],
      'The answer must be in the restricted range, even if other angles have the same ratio.'],
    ['反三角函数由给定的比值求出角度。为了使它们成为函数，值域要加以限制。',
      ['sin⁻¹x 的定义域是 −1 ≤ x ≤ 1，值域是 −π/2 ≤ y ≤ π/2。', 'cos⁻¹x 的定义域是 −1 ≤ x ≤ 1，值域是 0 ≤ y ≤ π。tan⁻¹x 的定义域是全体实数，值域是 −π/2 < y < π/2。', 'd/dx (sin⁻¹x) = 1/√(1 − x²)，d/dx (tan⁻¹x) = 1/(1 + x²)。'],
      [['求 sin⁻¹(½)。', 'sin(π/6) = ½ 并且 π/6 在值域内，所以答案是 π/6。'], ['求 cos⁻¹(−1)。', 'cos π = −1，所以答案是 π。']],
      '即使别的角有相同的比值，答案也必须在限定的值域里。']);

  L(13, 'calc',
    ['Extension 1 calculus studies rates of change and growth models. Differential equations connect a quantity to its own rate of change.',
      ['If the rate of change is proportional to the amount: dN/dt = kN, the solution is N = N₀eᵏᵗ.', 'Related rates: use the chain rule, dA/dt = dA/dr × dr/dt.', 'Integration by substitution: let u = g(x), then du = g′(x) dx.'],
      [['A circle\'s radius grows at 2 cm/s. How fast does its area grow when r = 5 cm?', 'A = πr², dA/dr = 2πr = 10π. dA/dt = 10π × 2 = 20π ≈ 62.8 cm²/s.'], ['Solve dy/dx = 3y with y = 2 at x = 0.', 'y = Ce^(3x). When x = 0, y = C = 2, so y = 2e^(3x).']],
      'Write the rate you want, then link it to the rate you are given by the chain rule.'],
    ['拓展一的微积分研究变化率和增长模型。微分方程把一个量和它自己的变化率联系起来。',
      ['如果变化率和量成正比：dN/dt = kN，解是 N = N₀eᵏᵗ。', '相关变化率：用链式法则，dA/dt = dA/dr × dr/dt。', '换元积分：令 u = g(x)，则 du = g′(x) dx。'],
      [['圆的半径以 2 cm/s 增大，r = 5 cm 时面积增大得多快？', 'A = πr²，dA/dr = 2πr = 10π。dA/dt = 10π × 2 = 20π ≈ 62.8 cm²/s。'], ['解 dy/dx = 3y，且 x = 0 时 y = 2。', 'y = Ce^(3x)。x = 0 时 y = C = 2，所以 y = 2e^(3x)。']],
      '先写出你要求的变化率，再用链式法则把它和已知的变化率联系起来。']);

  L(13, 'stats2',
    ['The binomial distribution counts the number of successes in a fixed number of independent trials. For many trials it looks like the normal distribution.',
      ['X ~ B(n, p): P(X = k) = C(n, k) × pᵏ × (1 − p)ⁿ⁻ᵏ.', 'E(X) = np and Var(X) = np(1 − p).', 'For large n, X is approximately normal with mean np and standard deviation √(np(1 − p)).'],
      [['A fair coin is tossed 4 times. Find P(exactly 2 heads).', 'C(4, 2) = 6, so P = 6 × (½)² × (½)² = 6/16 = 3/8.'], ['X ~ B(100, 0.3). Find E(X) and the standard deviation.', 'E(X) = 30. Var = 100 × 0.3 × 0.7 = 21, so the standard deviation is √21 ≈ 4.58.']],
      'Check there are only two outcomes, a fixed number of trials and a constant probability.'],
    ['二项分布数出固定次数的独立试验中成功的次数。试验次数很多时，它看起来像正态分布。',
      ['X ~ B(n, p)：P(X = k) = C(n, k) × pᵏ × (1 − p)ⁿ⁻ᵏ。', 'E(X) = np，Var(X) = np(1 − p)。', 'n 很大时，X 近似服从正态分布，平均数 np，标准差 √(np(1 − p))。'],
      [['抛一枚均匀的硬币 4 次，求恰好 2 次正面的概率。', 'C(4, 2) = 6，所以 P = 6 × (½)² × (½)² = 6/16 = 3/8。'], ['X ~ B(100, 0.3)，求 E(X) 和标准差。', 'E(X) = 30。Var = 100 × 0.3 × 0.7 = 21，所以标准差是 √21 ≈ 4.58。']],
      '先确认：只有两种结果、试验次数固定、概率不变。']);

  L(13, 'comb',
    ['Counting methods tell us how many arrangements or selections there are without listing them all.',
      ['Permutations (order matters): ⁿPᵣ = n! ÷ (n − r)!. Combinations (order does not matter): ⁿCᵣ = n! ÷ (r!(n − r)!).', 'The binomial theorem: (a + b)ⁿ = Σ ⁿCₖ aⁿ⁻ᵏ bᵏ.', 'Pascal\'s triangle gives the coefficients: 1, 4, 6, 4, 1 for n = 4.'],
      [['In how many ways can 3 people be chosen from 5?', '⁵C₃ = 5! ÷ (3! × 2!) = 10.'], ['Find the coefficient of x² in (1 + x)⁴.', '⁴C₂ = 6.']],
      'Ask: does the order matter? If yes use a permutation, if no use a combination.'],
    ['计数方法让我们不用一一列出，就知道有多少种排列或选法。',
      ['排列（有顺序）：ⁿPᵣ = n! ÷ (n − r)!。组合（无顺序）：ⁿCᵣ = n! ÷ (r!(n − r)!)。', '二项式定理：(a + b)ⁿ = Σ ⁿCₖ aⁿ⁻ᵏ bᵏ。', '杨辉（帕斯卡）三角形给出系数：n = 4 时是 1、4、6、4、1。'],
      [['从 5 个人里选 3 个人，有多少种选法？', '⁵C₃ = 5! ÷ (3! × 2!) = 10。'], ['求 (1 + x)⁴ 中 x² 的系数。', '⁴C₂ = 6。']],
      '先问：顺序重要吗？重要用排列，不重要用组合。']);

  L(13, 'poly',
    ['A polynomial like P(x) = x³ − 2x² − 5x + 6 can be divided, and its roots tell us its factors.',
      ['Remainder theorem: the remainder when P(x) is divided by (x − a) is P(a).', 'Factor theorem: (x − a) is a factor of P(x) if and only if P(a) = 0.', 'A polynomial of degree n has at most n roots.'],
      [['Find the remainder when x³ − 2x² − 5x + 6 is divided by (x − 1).', 'P(1) = 1 − 2 − 5 + 6 = 0, so the remainder is 0 and (x − 1) is a factor.'], ['Find the roots of P(x) = x³ − 2x² − 5x + 6.', 'P(1) = 0, P(−2) = −8 − 8 + 10 + 6 = 0, P(3) = 27 − 18 − 15 + 6 = 0. So the roots are 1, −2 and 3.']],
      'Try small whole numbers that divide the constant term when you look for a root.'],
    ['像 P(x) = x³ − 2x² − 5x + 6 这样的多项式可以做除法，它的根告诉我们它的因式。',
      ['余式定理：P(x) 除以 (x − a) 的余数是 P(a)。', '因式定理：(x − a) 是 P(x) 的因式，当且仅当 P(a) = 0。', 'n 次多项式最多有 n 个根。'],
      [['求 x³ − 2x² − 5x + 6 除以 (x − 1) 的余数。', 'P(1) = 1 − 2 − 5 + 6 = 0，余数是 0，所以 (x − 1) 是因式。'], ['求 P(x) = x³ − 2x² − 5x + 6 的根。', 'P(1) = 0，P(−2) = −8 − 8 + 10 + 6 = 0，P(3) = 27 − 18 − 15 + 6 = 0。所以根是 1、−2 和 3。']],
      '找根时，先试能整除常数项的小整数。']);

  L(13, 'vectors',
    ['A vector has both size (magnitude) and direction. We add vectors, scale them and use the dot product to find angles.',
      ['A vector a = (a₁, a₂) has magnitude |a| = √(a₁² + a₂²).', 'Add vectors by adding their components; a scalar multiple k a stretches the vector.', 'Dot product: a · b = a₁b₁ + a₂b₂ = |a||b| cos θ. If a · b = 0, the vectors are perpendicular.'],
      [['Find |(3, 4)|.', '√(9 + 16) = 5.'], ['Find the angle between a = (1, 0) and b = (1, 1).', 'a · b = 1; |a| = 1, |b| = √2; cos θ = 1/√2, so θ = 45°.']],
      'Vectors are equal when their magnitude and direction are the same, wherever they start.'],
    ['向量既有大小（模）又有方向。我们可以把向量相加、数乘，并用点积求夹角。',
      ['向量 a = (a₁, a₂) 的模是 |a| = √(a₁² + a₂²)。', '向量相加就是对应分量相加；数乘 k a 把向量拉长或缩短。', '点积：a · b = a₁b₁ + a₂b₂ = |a||b| cos θ。若 a · b = 0，两向量垂直。'],
      [['求 |(3, 4)|。', '√(9 + 16) = 5。'], ['求 a = (1, 0) 与 b = (1, 1) 的夹角。', 'a · b = 1；|a| = 1，|b| = √2；cos θ = 1/√2，所以 θ = 45°。']],
      '无论起点在哪里，模和方向相同的向量就是相等的向量。']);

  /* ---------------- Year 12 Extension 2 (14) ---------------- */
  L(14, 'complex',
    ['Complex numbers extend the number system with i, where i² = −1. They have a Cartesian form a + bi and a polar form r(cos θ + i sin θ).',
      ['|z| = √(a² + b²) is the modulus; arg z is the angle with the positive real axis.', 'Multiplying: moduli multiply and arguments add. De Moivre: [r cis θ]ⁿ = rⁿ cis nθ.', 'The nth roots of a complex number are equally spaced around a circle.'],
      [['Work out (2 + 3i)(1 − i).', '2 − 2i + 3i − 3i² = 2 + i + 3 = 5 + i.'], ['Find (1 + i)⁸.', '1 + i has modulus √2 and argument π/4. So (1 + i)⁸ = (√2)⁸ cis 2π = 16 × 1 = 16.']],
      'Remember that i² = −1 when you expand.'],
    ['复数用 i（i² = −1）扩展了数系。它有直角坐标形式 a + bi 和极坐标形式 r(cos θ + i sin θ)。',
      ['|z| = √(a² + b²) 是模；arg z 是与正实轴的夹角。', '相乘：模相乘，辐角相加。棣莫弗：[r cis θ]ⁿ = rⁿ cis nθ。', '复数的 n 次方根均匀地分布在一个圆上。'],
      [['计算 (2 + 3i)(1 − i)。', '2 − 2i + 3i − 3i² = 2 + i + 3 = 5 + i。'], ['求 (1 + i)⁸。', '1 + i 的模是 √2，辐角是 π/4。所以 (1 + i)⁸ = (√2)⁸ cis 2π = 16 × 1 = 16。']],
      '展开时要记住 i² = −1。']);

  L(14, 'poly',
    ['Over the complex numbers, every polynomial of degree n has exactly n roots (counting repeats). The roots and the coefficients are linked.',
      ['Roots of a quadratic ax² + bx + c = 0: sum = −b/a, product = c/a.', 'If a polynomial with real coefficients has root a + bi, then a − bi is also a root.', 'For a cubic with roots α, β, γ: α + β + γ = −b/a.'],
      [['A quadratic x² − 4x + 13 = 0 has root 2 + 3i. State the other root.', 'The coefficients are real, so the other root is the conjugate, 2 − 3i.'], ['The roots of x² − 5x + 6 = 0 are α and β. Find α² + β².', 'α + β = 5 and αβ = 6, so α² + β² = 25 − 12 = 13.']],
      'Use the sum and product of roots instead of solving, when the question asks about symmetric expressions.'],
    ['在复数范围内，每一个 n 次多项式恰好有 n 个根（重根重复计算）。根和系数之间有联系。',
      ['二次方程 ax² + bx + c = 0 的根：和 = −b/a，积 = c/a。', '若实系数多项式有根 a + bi，则 a − bi 也是根。', '三次方程的根 α、β、γ：α + β + γ = −b/a。'],
      [['二次方程 x² − 4x + 13 = 0 有一个根 2 + 3i，写出另一个根。', '系数是实数，所以另一个根是共轭复数 2 − 3i。'], ['x² − 5x + 6 = 0 的根是 α 和 β，求 α² + β²。', 'α + β = 5，αβ = 6，所以 α² + β² = 25 − 12 = 13。']],
      '题目问对称式时，直接用根的和与积，不必解出根。']);

  L(14, 'vectors',
    ['In three dimensions a vector has three components. We use vectors to describe lines, distances and projections in space.',
      ['a = (a₁, a₂, a₃), |a| = √(a₁² + a₂² + a₃²), and a · b = a₁b₁ + a₂b₂ + a₃b₃.', 'A line through point A in the direction d: r = a + λd.', 'The projection of a on b is (a · b ÷ |b|²) b.'],
      [['Find |(2, 3, 6)|.', '√(4 + 9 + 36) = √49 = 7.'], ['Write the line through (1, 0, 2) in the direction (3, 1, −1).', 'r = (1, 0, 2) + λ(3, 1, −1).']],
      'A vector equation of a line needs a point and a direction.'],
    ['在三维空间中向量有三个分量。我们用向量描述空间里的直线、距离和投影。',
      ['a = (a₁, a₂, a₃)，|a| = √(a₁² + a₂² + a₃²)，a · b = a₁b₁ + a₂b₂ + a₃b₃。', '过点 A、方向为 d 的直线：r = a + λd。', 'a 在 b 上的投影是 (a · b ÷ |b|²) b。'],
      [['求 |(2, 3, 6)|。', '√(4 + 9 + 36) = √49 = 7。'], ['写出过 (1, 0, 2)、方向为 (3, 1, −1) 的直线方程。', 'r = (1, 0, 2) + λ(3, 1, −1)。']],
      '直线的向量方程需要一个点和一个方向。']);

  L(14, 'integ',
    ['Extension 2 integration adds techniques for more difficult functions, and uses integrals to find volumes.',
      ['Substitution: choose u = g(x) so that the integral becomes simpler.', 'By parts: ∫ u dv = uv − ∫ v du. Partial fractions split a fraction into simpler ones.', 'Volume of revolution about the x-axis: V = π ∫ y² dx.'],
      [['Find ∫ x eˣ dx.', 'Let u = x, dv = eˣ dx. Then du = dx and v = eˣ. So ∫ x eˣ dx = x eˣ − ∫ eˣ dx = x eˣ − eˣ + C.'], ['Find the volume when y = x from x = 0 to x = 2 is rotated about the x-axis.', 'V = π ∫₀² x² dx = π [x³/3]₀² = 8π/3.']],
      'For by parts, choose u to be the part that gets simpler when you differentiate it.'],
    ['拓展二的积分增加了处理较难函数的方法，并用积分求体积。',
      ['换元法：选 u = g(x)，让积分变简单。', '分部积分：∫ u dv = uv − ∫ v du。部分分式把分式拆成较简单的分式。', '绕 x 轴旋转的体积：V = π ∫ y² dx。'],
      [['求 ∫ x eˣ dx。', '令 u = x，dv = eˣ dx，则 du = dx，v = eˣ。所以 ∫ x eˣ dx = x eˣ − ∫ eˣ dx = x eˣ − eˣ + C。'], ['y = x 在 x = 0 到 x = 2 之间绕 x 轴旋转，求体积。', 'V = π ∫₀² x² dx = π [x³/3]₀² = 8π/3。']],
      '分部积分时，选求导后会变简单的那部分作 u。']);

  L(14, 'mech',
    ['Mechanics describes how things move. Newton\'s second law, F = ma, links force, mass and acceleration.',
      ['Projectile motion: horizontal velocity is constant; vertical acceleration is −g (about −10 m/s²).', 'Motion with resistance: the net force is the push minus the resistance, F = ma.', 'Simple harmonic motion: ẍ = −n²x, with period T = 2π/n.'],
      [['A ball is thrown horizontally at 20 m/s from a cliff. How far has it travelled sideways after 3 s?', 'Horizontal velocity stays 20 m/s, so the distance is 20 × 3 = 60 m.'], ['A body moves in simple harmonic motion with ẍ = −4x. Find its period.', 'n² = 4, so n = 2 and T = 2π/2 = π seconds.']],
      'Treat the horizontal and vertical directions separately.'],
    ['力学描述物体怎样运动。牛顿第二定律 F = ma 把力、质量和加速度联系起来。',
      ['抛体运动：水平速度不变；竖直方向加速度是 −g（约 −10 m/s²）。', '有阻力的运动：合力是推力减去阻力，F = ma。', '简谐运动：ẍ = −n²x，周期 T = 2π/n。'],
      [['从悬崖上以 20 m/s 水平抛出一个球，3 s 后水平方向走了多远？', '水平速度保持 20 m/s，所以距离是 20 × 3 = 60 m。'], ['物体做简谐运动，ẍ = −4x，求周期。', 'n² = 4，所以 n = 2，T = 2π/2 = π 秒。']],
      '把水平方向和竖直方向分开处理。']);
})(typeof window !== 'undefined' ? window : globalThis);
