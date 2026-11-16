/* High school study mode lessons, Years 11 and 12 (Advanced), v2.2.0 (W12). One lesson per topic and year of js/scope-hs.js.
   L(year, topic, english, chinese), each [intro, [key points], [[worked example, how to solve it]], tip]. */
(function (root) {
  'use strict';
  const B = root.LessonsK6 = root.LessonsK6 || {};
  const L = (y, id, en, zh) => { B[y + ':' + id] = { en: pack(en), zh: pack(zh) }; };
  const pack = a => ({ intro: a[0], points: a[1], ex: a[2], tip: a[3] });

  /* ---------------- Year 11 ---------------- */
  L(11, 'quad',
    ['A quadratic function f(x) = ax² + bx + c has a parabola as its graph. Its vertex, its roots and the discriminant tell us its shape.',
      ['The discriminant Δ = b² − 4ac: Δ > 0 gives two roots, Δ = 0 gives one, Δ < 0 gives none.', 'The axis of symmetry is x = −b ÷ 2a, and the vertex lies on it.', 'Completing the square: x² + 6x + 5 = (x + 3)² − 4.'],
      [['How many roots does x² − 4x + 5 = 0 have?', 'Δ = (−4)² − 4 × 1 × 5 = 16 − 20 = −4 < 0, so there are no real roots.'], ['Find the vertex of y = x² − 6x + 5.', 'x = 6 ÷ 2 = 3 and y = 9 − 18 + 5 = −4, so the vertex is (3, −4).']],
      'Check the sign of a first: it tells you whether the parabola opens up or down.'],
    ['二次函数 f(x) = ax² + bx + c 的图像是抛物线。顶点、根和判别式告诉我们它的形状。',
      ['判别式 Δ = b² − 4ac：Δ > 0 有两个根，Δ = 0 有一个根，Δ < 0 没有实根。', '对称轴是 x = −b ÷ 2a，顶点就在对称轴上。', '配方：x² + 6x + 5 = (x + 3)² − 4。'],
      [['x² − 4x + 5 = 0 有几个根？', 'Δ = (−4)² − 4 × 1 × 5 = 16 − 20 = −4 < 0，所以没有实根。'], ['求 y = x² − 6x + 5 的顶点。', 'x = 6 ÷ 2 = 3，y = 9 − 18 + 5 = −4，所以顶点是 (3, −4)。']],
      '先看 a 的符号：它决定抛物线开口向上还是向下。']);

  L(11, 'func',
    ['A function gives exactly one output for each input. We describe it with its domain (allowed inputs) and range (outputs), and we can move its graph around.',
      ['f(x) is the output for input x. To evaluate f(3), substitute x = 3.', 'y = f(x) + k moves the graph up by k; y = f(x − h) moves it right by h; y = −f(x) reflects it in the x-axis.', 'Domain restrictions: no division by zero and no square root of a negative number.'],
      [['If f(x) = 2x − 1, find f(4) and the value of x where f(x) = 9.', 'f(4) = 2 × 4 − 1 = 7. For f(x) = 9: 2x − 1 = 9, so x = 5.'], ['State the domain of f(x) = √(x − 2).', 'We need x − 2 ≥ 0, so the domain is x ≥ 2.']],
      'The vertical line test: a graph is a function if no vertical line cuts it twice.'],
    ['函数对每一个输入给出唯一的输出。我们用定义域（允许的输入）和值域（输出）来描述它，还可以平移图像。',
      ['f(x) 是输入 x 对应的输出。求 f(3) 就是代入 x = 3。', 'y = f(x) + k 使图像上移 k；y = f(x − h) 使图像右移 h；y = −f(x) 是关于 x 轴的反射。', '定义域的限制：分母不能为 0，负数不能开平方。'],
      [['若 f(x) = 2x − 1，求 f(4)，以及使 f(x) = 9 的 x。', 'f(4) = 2 × 4 − 1 = 7。f(x) = 9：2x − 1 = 9，所以 x = 5。'], ['求 f(x) = √(x − 2) 的定义域。', '需要 x − 2 ≥ 0，所以定义域是 x ≥ 2。']],
      '垂直线检验：如果任何一条竖直线与图像都不会有两个交点，它就是函数。']);

  L(11, 'graphs',
    ['The gradient of a line is constant, but a curve is steeper in some places than others. We use tangents to talk about the gradient at a point.',
      ['A line has gradient m = (y₂ − y₁) ÷ (x₂ − x₁).', 'The gradient of a curve at a point is the gradient of the tangent there.', 'The straight line through two points on a curve (a secant) approximates the tangent when the points are close.'],
      [['Find the gradient of the secant to y = x² between x = 1 and x = 3.', 'Points (1, 1) and (3, 9): m = (9 − 1) ÷ (3 − 1) = 4.'], ['Which has the greater gradient, y = 3x or y = x + 5?', 'y = 3x has gradient 3, which is greater than 1.']],
      'A bigger absolute value of the gradient means a steeper line.'],
    ['直线的斜率处处相同，但曲线在有些地方陡、有些地方缓。我们用切线来说明曲线在某一点的斜率。',
      ['直线的斜率 m = (y₂ − y₁) ÷ (x₂ − x₁)。', '曲线在某点的斜率就是该点切线的斜率。', '过曲线上两点的直线（割线），当两点很近时，就接近切线。'],
      [['求 y = x² 在 x = 1 和 x = 3 之间的割线斜率。', '两点是 (1, 1) 和 (3, 9)：m = (9 − 1) ÷ (3 − 1) = 4。'], ['y = 3x 和 y = x + 5，哪条斜率更大？', 'y = 3x 的斜率是 3，大于 1。']],
      '斜率的绝对值越大，直线越陡。']);

  L(11, 'trig',
    ['Radians measure angles by arc length, and trigonometry extends beyond right-angled triangles with the sine and cosine rules.',
      ['π radians = 180°, so 1 radian ≈ 57.3°.', 'Sine rule: a/sin A = b/sin B. Cosine rule: c² = a² + b² − 2ab cos C.', 'Area of a triangle = ½ab sin C.'],
      [['Convert 90° to radians.', '90° = 90 × π/180 = π/2 radians.'], ['A triangle has sides 5 and 8 with an angle of 60° between them. Find its area.', 'Area = ½ × 5 × 8 × sin 60° = 20 × (√3/2) = 10√3 ≈ 17.3 square units.']],
      'Use the sine rule when you have a matching side–angle pair; use the cosine rule when you know two sides and the angle between.'],
    ['弧度用弧长来度量角，三角学也扩展到非直角三角形，要用到正弦定理和余弦定理。',
      ['π 弧度 = 180°，所以 1 弧度 ≈ 57.3°。', '正弦定理：a/sin A = b/sin B。余弦定理：c² = a² + b² − 2ab cos C。', '三角形面积 = ½ab sin C。'],
      [['把 90° 换成弧度。', '90° = 90 × π/180 = π/2 弧度。'], ['一个三角形两边是 5 和 8，夹角 60°，求面积。', '面积 = ½ × 5 × 8 × sin 60° = 20 × (√3/2) = 10√3 ≈ 17.3 平方单位。']],
      '有一对边和对角时用正弦定理；已知两边和夹角时用余弦定理。']);

  L(11, 'explog',
    ['A logarithm answers the question "what power?". It is the inverse of an exponential function.',
      ['log_a(x) = y means aʸ = x. For example log₂ 8 = 3 because 2³ = 8.', 'Laws: log(ab) = log a + log b; log(a/b) = log a − log b; log(aⁿ) = n log a.', 'To solve aˣ = b, take logarithms: x = log b ÷ log a.'],
      [['Evaluate log₃ 81.', '3⁴ = 81, so log₃ 81 = 4.'], ['Solve 2ˣ = 20 (to 2 decimal places).', 'x = log 20 ÷ log 2 ≈ 1.301 ÷ 0.301 ≈ 4.32.']],
      'The logarithm of 1 is always 0, because a⁰ = 1.'],
    ['对数回答的是“要乘方几次”。它是指数函数的反函数。',
      ['log_a(x) = y 的意思是 aʸ = x。例如 log₂ 8 = 3，因为 2³ = 8。', '运算法则：log(ab) = log a + log b；log(a/b) = log a − log b；log(aⁿ) = n log a。', '解 aˣ = b：两边取对数，x = log b ÷ log a。'],
      [['求 log₃ 81。', '3⁴ = 81，所以 log₃ 81 = 4。'], ['解 2ˣ = 20（保留 2 位小数）。', 'x = log 20 ÷ log 2 ≈ 1.301 ÷ 0.301 ≈ 4.32。']],
      '1 的对数永远是 0，因为 a⁰ = 1。']);

  L(11, 'series',
    ['A sequence is a list of numbers that follows a rule, and a series is the sum of its terms. There are arithmetic and geometric types.',
      ['Arithmetic: add a common difference d. Tₙ = a + (n − 1)d and Sₙ = n/2 × (2a + (n − 1)d).', 'Geometric: multiply by a common ratio r. Tₙ = arⁿ⁻¹ and Sₙ = a(rⁿ − 1) ÷ (r − 1).', 'To tell them apart, check whether the difference or the ratio is the same each time.'],
      [['Find the 10th term of 3, 7, 11, …', 'a = 3, d = 4. T₁₀ = 3 + 9 × 4 = 39.'], ['Find the sum of the first 5 terms of 2, 6, 18, …', 'a = 2, r = 3: S₅ = 2(3⁵ − 1) ÷ 2 = 242.']],
      'Write down a, d (or r) and n before you use a formula.'],
    ['数列是按规律排成的一列数，级数是数列各项的和。有等差和等比两种。',
      ['等差：每次加公差 d。Tₙ = a + (n − 1)d，Sₙ = n/2 × (2a + (n − 1)d)。', '等比：每次乘公比 r。Tₙ = arⁿ⁻¹，Sₙ = a(rⁿ − 1) ÷ (r − 1)。', '区分它们：看相邻两项的差，还是比，每次都相同。'],
      [['求 3、7、11…… 的第 10 项。', 'a = 3，d = 4。T₁₀ = 3 + 9 × 4 = 39。'], ['求 2、6、18…… 的前 5 项的和。', 'a = 2，r = 3：S₅ = 2(3⁵ − 1) ÷ 2 = 242。']],
      '用公式之前，先写出 a、d（或 r）和 n。']);

  L(11, 'calc',
    ['Calculus begins with the derivative: how fast a function is changing at a point, which is the gradient of its tangent.',
      ['Power rule: if f(x) = xⁿ then f′(x) = nxⁿ⁻¹.', 'Constants disappear, and the derivative of a sum is the sum of the derivatives: d/dx (3x² + 5x − 7) = 6x + 5.', 'The derivative at x = a is the gradient of the tangent at x = a.'],
      [['Differentiate f(x) = x³ − 4x.', 'f′(x) = 3x² − 4.'], ['Find the gradient of y = x² at x = 3.', 'dy/dx = 2x, and at x = 3 it is 6.']],
      'Bring the power down in front, then reduce the power by 1.'],
    ['微积分从导数开始：它表示函数在某一点变化得多快，也就是该点切线的斜率。',
      ['幂函数求导法则：若 f(x) = xⁿ，则 f′(x) = nxⁿ⁻¹。', '常数的导数是 0，和的导数等于导数的和：d/dx (3x² + 5x − 7) = 6x + 5。', 'x = a 处的导数，就是该点切线的斜率。'],
      [['对 f(x) = x³ − 4x 求导。', 'f′(x) = 3x² − 4。'], ['求 y = x² 在 x = 3 处的斜率。', 'dy/dx = 2x，在 x = 3 处是 6。']],
      '把指数移到前面当系数，再把指数减 1。']);

  L(11, 'stats2',
    ['Probability rules let us work out the chance of combined events. Conditional probability is the chance of an event given that another has happened.',
      ['P(A or B) = P(A) + P(B) − P(A and B).', 'Independent events: P(A and B) = P(A) × P(B).', 'Conditional probability: P(A | B) = P(A and B) ÷ P(B).'],
      [['P(A) = 0.5, P(B) = 0.4, P(A and B) = 0.2. Find P(A or B).', '0.5 + 0.4 − 0.2 = 0.7.'], ['Find P(A | B) for the same events.', 'P(A | B) = 0.2 ÷ 0.4 = 0.5. Since this equals P(A), A and B are independent.']],
      'Subtract the overlap, or it is counted twice.'],
    ['概率法则帮我们算出组合事件的概率。条件概率是在另一个事件已经发生的前提下，某事件发生的概率。',
      ['P(A 或 B) = P(A) + P(B) − P(A 且 B)。', '独立事件：P(A 且 B) = P(A) × P(B)。', '条件概率：P(A | B) = P(A 且 B) ÷ P(B)。'],
      [['P(A) = 0.5，P(B) = 0.4，P(A 且 B) = 0.2。求 P(A 或 B)。', '0.5 + 0.4 − 0.2 = 0.7。'], ['对同样的事件求 P(A | B)。', 'P(A | B) = 0.2 ÷ 0.4 = 0.5。它等于 P(A)，所以 A 和 B 是独立的。']],
      '要减去重叠的部分，否则会被算两次。']);

  /* ---------------- Year 12 ---------------- */
  L(12, 'func',
    ['Functions can be combined, and some can be reversed. We also meet functions with a vertical asymptote, like y = 1/x.',
      ['Composite function: f(g(x)) means "apply g, then f".', 'The inverse f⁻¹ undoes f: swap x and y, then solve for y.', 'The graph of f⁻¹ is the reflection of the graph of f in the line y = x.'],
      [['If f(x) = 2x + 3 and g(x) = x², find f(g(2)).', 'g(2) = 4, then f(4) = 2 × 4 + 3 = 11.'], ['Find the inverse of f(x) = 2x + 3.', 'Let y = 2x + 3. Swap: x = 2y + 3. Solve: y = (x − 3)/2, so f⁻¹(x) = (x − 3)/2.']],
      'An inverse function exists only if each output comes from exactly one input.'],
    ['函数可以复合，有些还可以求反函数。我们也会学到有垂直渐近线的函数，比如 y = 1/x。',
      ['复合函数：f(g(x)) 的意思是“先做 g，再做 f”。', '反函数 f⁻¹ 还原 f：交换 x 和 y，再解出 y。', 'f⁻¹ 的图像是 f 的图像关于直线 y = x 的反射。'],
      [['若 f(x) = 2x + 3，g(x) = x²，求 f(g(2))。', 'g(2) = 4，再 f(4) = 2 × 4 + 3 = 11。'], ['求 f(x) = 2x + 3 的反函数。', '设 y = 2x + 3。交换：x = 2y + 3。解出 y = (x − 3)/2，所以 f⁻¹(x) = (x − 3)/2。']],
      '只有当每个输出都恰好来自一个输入时，才存在反函数。']);

  L(12, 'graphs',
    ['The derivative tells us the shape of a curve: where it rises, falls and turns.',
      ['If f′(x) > 0 the function is increasing; if f′(x) < 0 it is decreasing.', 'A stationary point has f′(x) = 0. A local maximum or minimum is a turning point.', 'The second derivative f″(x) shows concavity: f″ > 0 means concave up (a smile), f″ < 0 concave down.'],
      [['Find the stationary point of f(x) = x² − 6x + 5.', 'f′(x) = 2x − 6 = 0, so x = 3, and f(3) = −4. The stationary point is (3, −4); f″ = 2 > 0, so it is a minimum.'], ['Is f(x) = −x³ increasing or decreasing at x = 1?', 'f′(x) = −3x², so f′(1) = −3 < 0: decreasing.']],
      'Check the sign of f′ on both sides of a stationary point, or use f″.'],
    ['导数告诉我们曲线的形状：哪里上升、哪里下降、哪里转折。',
      ['f′(x) > 0 时函数递增；f′(x) < 0 时函数递减。', '驻点满足 f′(x) = 0。局部最大值或最小值是转折点。', '二阶导数 f″(x) 表示凹凸：f″ > 0 向上凹（像笑脸），f″ < 0 向下凹。'],
      [['求 f(x) = x² − 6x + 5 的驻点。', 'f′(x) = 2x − 6 = 0，所以 x = 3，f(3) = −4。驻点是 (3, −4)；f″ = 2 > 0，所以是最小值点。'], ['f(x) = −x³ 在 x = 1 处是递增还是递减？', 'f′(x) = −3x²，f′(1) = −3 < 0：递减。']],
      '检查驻点两边 f′ 的符号，或者用 f″。']);

  L(12, 'trig',
    ['Trigonometric functions repeat: sine and cosine are waves. We use identities and graphs to solve trigonometric equations.',
      ['sin²x + cos²x = 1, and tan x = sin x ÷ cos x.', 'The graphs of y = sin x and y = cos x have period 2π and amplitude 1.', 'Solving: find the basic angle, then use the quadrants (CAST) to find all solutions in the range.'],
      [['Solve sin x = ½ for 0 ≤ x ≤ 2π.', 'The basic angle is π/6. Sine is positive in quadrants 1 and 2: x = π/6 and x = 5π/6.'], ['If sin x = 3/5 and x is acute, find cos x.', 'cos²x = 1 − 9/25 = 16/25, so cos x = 4/5.']],
      'Check which quadrant each answer is in and whether the ratio has the right sign.'],
    ['三角函数是周期的：正弦和余弦是波。我们用恒等式和图像来解三角方程。',
      ['sin²x + cos²x = 1，tan x = sin x ÷ cos x。', 'y = sin x 和 y = cos x 的图像周期是 2π，振幅是 1。', '解方程：先求基本角，再用象限（CAST）找出范围内的所有解。'],
      [['解 sin x = ½，0 ≤ x ≤ 2π。', '基本角是 π/6。正弦在第一、二象限为正：x = π/6 和 x = 5π/6。'], ['若 sin x = 3/5 且 x 是锐角，求 cos x。', 'cos²x = 1 − 9/25 = 16/25，所以 cos x = 4/5。']],
      '检查每个答案在哪个象限，比值的符号对不对。']);

  L(12, 'explog',
    ['Exponential functions describe growth and decay. The number e ≈ 2.718 is special: the gradient of eˣ is eˣ itself.',
      ['Growth or decay: N = N₀ eᵏᵗ, with k > 0 for growth and k < 0 for decay.', 'The natural logarithm ln x is the inverse of eˣ: ln eˣ = x.', 'd/dx (eˣ) = eˣ and d/dx (ln x) = 1/x.'],
      [['A population of 1000 grows by N = 1000e^(0.1t). Find N when t = 10 (to the nearest whole number).', 'N = 1000 × e¹ ≈ 1000 × 2.718 = 2718.'], ['Solve eˣ = 5.', 'x = ln 5 ≈ 1.61.']],
      'Use ln when the base is e, and log when the base is 10.'],
    ['指数函数描述增长和衰减。数 e ≈ 2.718 很特别：eˣ 的斜率就是它自己。',
      ['增长或衰减：N = N₀ eᵏᵗ，k > 0 为增长，k < 0 为衰减。', '自然对数 ln x 是 eˣ 的反函数：ln eˣ = x。', 'd/dx (eˣ) = eˣ，d/dx (ln x) = 1/x。'],
      [['人口 1000，按 N = 1000e^(0.1t) 增长。求 t = 10 时的 N（取整数）。', 'N = 1000 × e¹ ≈ 1000 × 2.718 = 2718。'], ['解 eˣ = 5。', 'x = ln 5 ≈ 1.61。']],
      '底数是 e 时用 ln，底数是 10 时用 log。']);

  L(12, 'series',
    ['A geometric series can have a sum even if it goes on forever, as long as the terms shrink. This helps with finance, like annuities and loans.',
      ['The sum to infinity exists when |r| < 1: S∞ = a ÷ (1 − r).', 'Compound interest on regular deposits is a geometric series.', 'The recurring decimal 0.333… = 0.3 + 0.03 + 0.003 + … is a geometric series.'],
      [['Find the sum to infinity of 8 + 4 + 2 + 1 + …', 'a = 8, r = ½: S∞ = 8 ÷ (1 − ½) = 16.'], ['Write 0.666… as a fraction.', 'a = 0.6, r = 0.1: S∞ = 0.6 ÷ 0.9 = 2/3.']],
      'Always check that |r| < 1 before using the sum to infinity.'],
    ['如果各项越来越小，等比级数即使无限地加下去也可能有和。这在金融（年金、贷款）里很有用。',
      ['当 |r| < 1 时存在无穷和：S∞ = a ÷ (1 − r)。', '按期存款的复利是一个等比级数。', '循环小数 0.333… = 0.3 + 0.03 + 0.003 + … 是等比级数。'],
      [['求 8 + 4 + 2 + 1 + …… 的无穷和。', 'a = 8，r = ½：S∞ = 8 ÷ (1 − ½) = 16。'], ['把 0.666… 写成分数。', 'a = 0.6，r = 0.1：S∞ = 0.6 ÷ 0.9 = 2/3。']],
      '用无穷和之前，一定要检查 |r| < 1。']);

  L(12, 'calc',
    ['We have rules for differentiating products, quotients and composite functions, and integration is the reverse of differentiation.',
      ['Chain rule: d/dx f(g(x)) = f′(g(x)) × g′(x). For example, d/dx (2x + 1)⁵ = 5(2x + 1)⁴ × 2.', 'Product rule: (uv)′ = u′v + uv′. Quotient rule: (u/v)′ = (u′v − uv′) ÷ v².', 'Integration: ∫ xⁿ dx = xⁿ⁺¹ ÷ (n + 1) + C. The definite integral gives area under a curve.'],
      [['Differentiate (3x − 2)⁴.', '4(3x − 2)³ × 3 = 12(3x − 2)³.'], ['Find the area under y = x² from x = 0 to x = 3.', '∫₀³ x² dx = [x³/3]₀³ = 27/3 − 0 = 9.']],
      'Do not forget the constant C for an indefinite integral.'],
    ['乘积、商和复合函数各有求导法则，积分是微分的逆运算。',
      ['链式法则：d/dx f(g(x)) = f′(g(x)) × g′(x)。例如 d/dx (2x + 1)⁵ = 5(2x + 1)⁴ × 2。', '乘法法则：(uv)′ = u′v + uv′。除法法则：(u/v)′ = (u′v − uv′) ÷ v²。', '积分：∫ xⁿ dx = xⁿ⁺¹ ÷ (n + 1) + C。定积分给出曲线下的面积。'],
      [['对 (3x − 2)⁴ 求导。', '4(3x − 2)³ × 3 = 12(3x − 2)³。'], ['求 y = x² 从 x = 0 到 x = 3 下方的面积。', '∫₀³ x² dx = [x³/3]₀³ = 27/3 − 0 = 9。']],
      '不定积分别忘了常数 C。']);

  L(12, 'stats2',
    ['A random variable takes numerical values by chance. We describe it with its distribution, its expected value and its spread.',
      ['A discrete random variable has a probability for each value, and the probabilities add to 1.', 'Expected value E(X) = Σ x·p(x). Variance Var(X) = E(X²) − [E(X)]².', 'The normal distribution is bell-shaped: about 68% lie within 1 standard deviation of the mean, 95% within 2 and 99.7% within 3.'],
      [['X takes the values 1, 2, 3 with probabilities 0.2, 0.5, 0.3. Find E(X).', '1 × 0.2 + 2 × 0.5 + 3 × 0.3 = 0.2 + 1 + 0.9 = 2.1.'], ['Heights have mean 170 cm and standard deviation 10 cm. About what percentage lies between 160 and 180 cm?', 'That is within 1 standard deviation of the mean: about 68%.']],
      'The probabilities of a discrete random variable must always add to 1.'],
    ['随机变量按机会取数值。我们用它的分布、期望值和离散程度来描述它。',
      ['离散型随机变量对每个取值都有一个概率，概率之和为 1。', '期望 E(X) = Σ x·p(x)。方差 Var(X) = E(X²) − [E(X)]²。', '正态分布呈钟形：约 68% 的数据在平均数 1 个标准差内，95% 在 2 个标准差内，99.7% 在 3 个标准差内。'],
      [['X 取值 1、2、3，概率分别是 0.2、0.5、0.3，求 E(X)。', '1 × 0.2 + 2 × 0.5 + 3 × 0.3 = 0.2 + 1 + 0.9 = 2.1。'], ['身高的平均数是 170 cm，标准差是 10 cm。大约有百分之多少的人在 160 到 180 cm 之间？', '这是在平均数 1 个标准差之内：约 68%。']],
      '离散型随机变量的各个概率加起来一定等于 1。']);
})(typeof window !== 'undefined' ? window : globalThis);
