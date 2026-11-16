/* High school study mode lessons, Years 9 and 10 (v2.2.0, W12). One lesson per topic and year of js/scope-hs.js.
   L(year, topic, english, chinese), each [intro, [key points], [[worked example, how to solve it]], tip]. */
(function (root) {
  'use strict';
  const B = root.LessonsK6 = root.LessonsK6 || {};
  const L = (y, id, en, zh) => { B[y + ':' + id] = { en: pack(en), zh: pack(zh) }; };
  const pack = a => ({ intro: a[0], points: a[1], ex: a[2], tip: a[3] });

  /* ---------------- Year 9 ---------------- */
  L(9, 'index',
    ['Index laws let us simplify expressions with powers. Very large and very small numbers are written in scientific notation.',
      ['Multiply: aᵐ × aⁿ = aᵐ⁺ⁿ. Divide: aᵐ ÷ aⁿ = aᵐ⁻ⁿ. Power of a power: (aᵐ)ⁿ = aᵐⁿ.', 'a⁰ = 1 and a⁻ⁿ = 1/aⁿ.', 'Scientific notation: a × 10ⁿ with 1 ≤ a < 10, such as 4 500 000 = 4.5 × 10⁶.'],
      [['Simplify x⁵ × x³ ÷ x².', 'x⁵ × x³ = x⁸, then x⁸ ÷ x² = x⁶.'], ['Write 0.00032 in scientific notation.', 'Move the point 4 places right to get 3.2, so 0.00032 = 3.2 × 10⁻⁴.']],
      'Add the powers when you multiply, subtract when you divide; the base stays the same.'],
    ['指数法则帮我们化简带乘方的式子。很大和很小的数用科学记数法表示。',
      ['乘法：aᵐ × aⁿ = aᵐ⁺ⁿ。除法：aᵐ ÷ aⁿ = aᵐ⁻ⁿ。幂的乘方：(aᵐ)ⁿ = aᵐⁿ。', 'a⁰ = 1，a⁻ⁿ = 1/aⁿ。', '科学记数法：a × 10ⁿ，其中 1 ≤ a < 10，比如 4 500 000 = 4.5 × 10⁶。'],
      [['化简 x⁵ × x³ ÷ x²。', 'x⁵ × x³ = x⁸，再 x⁸ ÷ x² = x⁶。'], ['用科学记数法表示 0.00032。', '小数点右移 4 位得 3.2，所以 0.00032 = 3.2 × 10⁻⁴。']],
      '乘法时指数相加，除法时指数相减，底数不变。']);

  L(9, 'alg',
    ['Stage 5 algebra works with fractions and with unknowns on both sides. We use the same idea: keep the equation balanced.',
      ['Add or subtract algebraic fractions by finding a common denominator: x/2 + x/3 = 5x/6.', 'For an unknown on both sides, collect the x terms on one side and numbers on the other.', 'For an equation with fractions, multiply every term by the common denominator.'],
      [['Solve 5x − 3 = 2x + 9.', 'Subtract 2x: 3x − 3 = 9. Add 3: 3x = 12. Divide by 3: x = 4.'], ['Solve x/3 + 2 = 5.', 'Subtract 2: x/3 = 3. Multiply by 3: x = 9.']],
      'Check each answer by putting it back into the original equation.'],
    ['第五阶段的代数要处理分式和两边都有未知数的方程，思路不变：始终保持等式平衡。',
      ['代数分式的加减要先通分：x/2 + x/3 = 5x/6。', '未知数在两边时，把含 x 的项移到一边，数移到另一边。', '带分数的方程：两边每一项都乘以公分母。'],
      [['解 5x − 3 = 2x + 9。', '两边减 2x：3x − 3 = 9。加 3：3x = 12。除以 3：x = 4。'], ['解 x/3 + 2 = 5。', '减 2：x/3 = 3。乘 3：x = 9。']],
      '每个答案都代回原方程检查。']);

  L(9, 'linear',
    ['A straight line is described by its gradient (how steep it is) and where it crosses the y-axis. The equation y = mx + b shows both.',
      ['Gradient m = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).', 'In y = mx + b, m is the gradient and b is the y-intercept.', 'To find the x-intercept, put y = 0 and solve.'],
      [['Find the gradient of the line through (1, 3) and (3, 7).', 'm = (7 − 3) ÷ (3 − 1) = 4 ÷ 2 = 2.'], ['Find the x- and y-intercepts of y = 2x − 6.', 'Put x = 0: y = −6. Put y = 0: 2x = 6, so x = 3.']],
      'Going up from left to right gives a positive gradient; going down gives a negative one.'],
    ['一条直线由它的斜率（有多陡）和与 y 轴的交点来描述。方程 y = mx + b 同时给出这两样。',
      ['斜率 m = 上升 ÷ 水平移动 = (y₂ − y₁) ÷ (x₂ − x₁)。', 'y = mx + b 中，m 是斜率，b 是 y 轴截距。', '求 x 轴截距：令 y = 0 再解方程。'],
      [['求经过 (1, 3) 和 (3, 7) 的直线的斜率。', 'm = (7 − 3) ÷ (3 − 1) = 4 ÷ 2 = 2。'], ['求 y = 2x − 6 的 x 轴截距和 y 轴截距。', '令 x = 0：y = −6。令 y = 0：2x = 6，所以 x = 3。']],
      '从左到右往上走斜率是正的，往下走是负的。']);

  L(9, 'factor',
    ['Factorising is the opposite of expanding: we write an expression as a product. Always look for a common factor first.',
      ['Common factor: 6x + 9 = 3(2x + 3).', 'Difference of two squares: a² − b² = (a − b)(a + b).', 'Check by expanding: the brackets should give back the original expression.'],
      [['Factorise 12a² + 8a.', 'The HCF of 12a² and 8a is 4a, so 12a² + 8a = 4a(3a + 2).'], ['Factorise x² − 49.', 'x² − 7² = (x − 7)(x + 7).']],
      'Take out the biggest common factor, including any letters.'],
    ['因式分解是去括号的逆运算：把一个式子写成乘积。永远先找公因式。',
      ['提公因式：6x + 9 = 3(2x + 3)。', '平方差：a² − b² = (a − b)(a + b)。', '用去括号来检查：乘开后应得到原来的式子。'],
      [['分解 12a² + 8a。', '12a² 和 8a 的最大公因式是 4a，所以 12a² + 8a = 4a(3a + 2)。'], ['分解 x² − 49。', 'x² − 7² = (x − 7)(x + 7)。']],
      '提取最大的公因式，包括字母。']);

  L(9, 'formula',
    ['A formula links quantities, like A = ½bh. "Changing the subject" rearranges it to get a different letter alone.',
      ['Treat a formula like an equation: do the same thing to both sides.', 'Undo operations in the reverse order: subtract or add first, then divide or multiply.', 'Substituting numbers into the new formula gives the answer quickly.'],
      [['Make b the subject of A = ½bh.', 'Multiply both sides by 2: 2A = bh. Divide by h: b = 2A/h.'], ['Make x the subject of y = 3x + 5.', 'Subtract 5: y − 5 = 3x. Divide by 3: x = (y − 5)/3.']],
      'Whatever you do to one side, do to the whole other side.'],
    ['公式把几个量联系起来，比如 A = ½bh。“变换主项”就是把公式整理成另一个字母单独在一边。',
      ['把公式当作方程：两边做同样的运算。', '按相反的顺序还原运算：先加减，再乘除。', '把数代入新的公式，可以很快得到答案。'],
      [['把 A = ½bh 变成 b 为主项。', '两边乘 2：2A = bh。除以 h：b = 2A/h。'], ['把 y = 3x + 5 变成 x 为主项。', '减 5：y − 5 = 3x。除以 3：x = (y − 5)/3。']],
      '对一边做什么，就要对另一边的整体也做什么。']);

  L(9, 'fin',
    ['Financial maths is maths for everyday money: pay, buying things, and borrowing or saving.',
      ['Overtime is paid at a higher rate, such as time-and-a-half (× 1.5) or double time (× 2). Commission is a percentage of sales.', 'GST in Australia is 10%: price with GST = price × 1.1.', 'Simple interest: I = P × r × n (principal, rate per period, number of periods).'],
      [['Sam earns $20 an hour. How much for 4 hours at time-and-a-half?', '20 × 1.5 = $30 per hour, so 4 × 30 = $120.'], ['Find the simple interest on $2000 at 5% per year for 3 years.', 'I = 2000 × 0.05 × 3 = $300.']],
      'Write the rate as a decimal first: 5% = 0.05.'],
    ['金融数学是日常生活中用到的钱的数学：工资、买东西、借钱和存钱。',
      ['加班费的时薪更高，比如 1.5 倍（× 1.5）或 2 倍（× 2）。佣金是销售额的一个百分数。', '澳大利亚的商品及服务税（GST）是 10%：含税价 = 原价 × 1.1。', '单利：I = P × r × n（本金 × 每期利率 × 期数）。'],
      [['山姆时薪 $20。按 1.5 倍工资干 4 小时能拿多少钱？', '20 × 1.5 = 每小时 $30，所以 4 × 30 = $120。'], ['求 $2000 按年利率 5% 存 3 年的单利。', 'I = 2000 × 0.05 × 3 = $300。']],
      '先把利率写成小数：5% = 0.05。']);

  L(9, 'meas',
    ['Surface area is the total area of all the faces of a solid. Volume is the space inside it.',
      ['Prism: V = area of base × height. Cylinder: V = πr²h.', 'Surface area of a cylinder = 2πr² + 2πrh (two circles and the curved part).', 'Volume uses cubic units (cm³); 1000 cm³ = 1 litre.'],
      [['A cylinder has radius 3 cm and height 10 cm. Find its volume (π = 3.14).', 'V = 3.14 × 3² × 10 = 3.14 × 90 = 282.6 cm³.'], ['Find the surface area of a cube with side 4 cm.', 'A cube has 6 faces, each 4 × 4 = 16 cm². So 6 × 16 = 96 cm².']],
      'Draw the net of a solid to see all of its faces.'],
    ['表面积是立体图形所有面的面积之和，体积是它里面的空间大小。',
      ['棱柱：V = 底面积 × 高。圆柱：V = πr²h。', '圆柱的表面积 = 2πr² + 2πrh（两个圆和侧面）。', '体积用立方单位（cm³）；1000 cm³ = 1 升。'],
      [['圆柱的半径是 3 cm，高 10 cm，求体积（π = 3.14）。', 'V = 3.14 × 3² × 10 = 3.14 × 90 = 282.6 cm³。'], ['求边长 4 cm 的正方体的表面积。', '正方体有 6 个面，每个面 4 × 4 = 16 cm²，所以 6 × 16 = 96 cm²。']],
      '画出立体图形的展开图，就能看清所有的面。']);

  L(9, 'angle',
    ['Figures are congruent when they are exactly the same shape and size, and similar when they are the same shape but a different size.',
      ['Congruent triangles can be proved by SSS, SAS, ASA or RHS.', 'Similar figures have equal angles and sides in the same ratio (the scale factor).', 'A scale factor k multiplies every length; a unit of area is multiplied by k².'],
      [['Two similar triangles have sides 3 cm and 9 cm that match. What is the scale factor?', '9 ÷ 3 = 3.'], ['The shorter side of the small triangle is 4 cm and the scale factor is 2.5. How long is the matching side in the larger triangle?', '4 × 2.5 = 10 cm.']],
      'Match the sides carefully: the shortest with the shortest, the longest with the longest.'],
    ['形状和大小完全相同的图形叫全等，形状相同、大小不同的图形叫相似。',
      ['全等三角形可以用 SSS、SAS、ASA 或 RHS 判定。', '相似图形的对应角相等，对应边成比例（比例就是相似比）。', '相似比为 k 时，每条边长乘 k，面积乘 k²。'],
      [['两个相似三角形对应的边是 3 cm 和 9 cm，相似比是多少？', '9 ÷ 3 = 3。'], ['小三角形的最短边是 4 cm，相似比是 2.5。大三角形对应的边多长？', '4 × 2.5 = 10 cm。']],
      '要认真配对：最短边对最短边，最长边对最长边。']);

  L(9, 'pyth',
    ['Trigonometry links the angles and sides of a right-angled triangle using three ratios: sine, cosine and tangent.',
      ['sin θ = opposite ÷ hypotenuse; cos θ = adjacent ÷ hypotenuse; tan θ = opposite ÷ adjacent. Remember SOH CAH TOA.', 'To find a side, write the ratio, then solve.', 'To find an angle, use the inverse button: θ = sin⁻¹, cos⁻¹ or tan⁻¹ of the ratio.'],
      [['In a right-angled triangle, θ = 30° and the hypotenuse is 10. Find the side opposite θ.', 'sin 30° = opposite ÷ 10, so opposite = 10 × 0.5 = 5.'], ['The opposite side is 3 and the adjacent side is 4. Find θ.', 'tan θ = 3/4 = 0.75, so θ = tan⁻¹(0.75) ≈ 36.9°.']],
      'Label the sides from the angle you are using: opposite, adjacent, hypotenuse.'],
    ['三角学用三个比——正弦、余弦、正切——把直角三角形的角和边联系起来。',
      ['sin θ = 对边 ÷ 斜边；cos θ = 邻边 ÷ 斜边；tan θ = 对边 ÷ 邻边。记住“SOH CAH TOA”。', '求边长：先写出比，再解方程。', '求角度：用反函数键：θ = sin⁻¹、cos⁻¹ 或 tan⁻¹ 的比值。'],
      [['直角三角形中 θ = 30°，斜边是 10，求 θ 的对边。', 'sin 30° = 对边 ÷ 10，所以对边 = 10 × 0.5 = 5。'], ['对边是 3，邻边是 4，求 θ。', 'tan θ = 3/4 = 0.75，所以 θ = tan⁻¹(0.75) ≈ 36.9°。']],
      '边的名字是相对你用的那个角来说的：对边、邻边、斜边。']);

  L(9, 'stats',
    ['We compare data sets by looking at their centre and spread, and we can display data in a stem-and-leaf plot.',
      ['A stem-and-leaf plot keeps every value: the stem is the tens, the leaf is the ones.', 'A key tells how to read it, such as 3 | 4 means 34.', 'Compare two sets using the mean or median for the centre and the range for the spread.'],
      [['Data: 12, 15, 21, 23, 23, 38. Write the stem for the number 38 and its leaf.', 'The stem is 3 and the leaf is 8, so 3 | 8.'], ['Set A has mean 70 and range 5. Set B has mean 70 and range 30. What does that tell you?', 'They have the same centre, but B is much more spread out, while A is consistent.']],
      'Always write a key for a stem-and-leaf plot.'],
    ['我们通过数据的中心和分散程度来比较数据组，还可以用茎叶图来表示数据。',
      ['茎叶图保留了每一个数据：茎是十位，叶是个位。', '图上要有说明，比如 3 | 4 表示 34。', '比较两组数据：用平均数或中位数比较中心，用极差比较分散程度。'],
      [['数据：12、15、21、23、23、38。38 的茎和叶是什么？', '茎是 3，叶是 8，写作 3 | 8。'], ['A 组平均数 70、极差 5；B 组平均数 70、极差 30。这说明什么？', '两组的中心相同，但 B 组分散得多，A 组比较稳定。']],
      '茎叶图一定要写说明。']);

  L(9, 'prob',
    ['An experiment with two steps can be listed in a table or an organised list so no outcome is missed.',
      ['Use a table or a list to show every outcome.', 'The number of outcomes of two steps = (number of outcomes in step 1) × (number in step 2).', 'P(event) = favourable outcomes ÷ all outcomes.'],
      [['Two coins are tossed. How many outcomes are there? What is P(two heads)?', 'HH, HT, TH, TT: 4 outcomes. P(HH) = 1/4.'], ['Two dice are rolled. What is the chance both show 6?', '6 × 6 = 36 outcomes. Only one is (6, 6), so P = 1/36.']],
      'Count the outcomes by multiplying before you list them: 6 × 6 = 36.'],
    ['有两步的试验，可以用表格或有序的列举，保证不遗漏任何结果。',
      ['用表格或列举法写出所有结果。', '两步试验的结果总数 = 第一步结果数 × 第二步结果数。', 'P(事件) = 满足条件的结果数 ÷ 所有结果数。'],
      [['抛两枚硬币，一共有多少种结果？两个都是正面的概率是多少？', '正正、正反、反正、反反，共 4 种。P(正正) = 1/4。'], ['掷两个骰子，两个都是 6 的概率是多少？', '6 × 6 = 36 种结果，只有 (6, 6) 一种，所以 P = 1/36。']],
      '列举之前先用乘法算出结果总数：6 × 6 = 36。']);

  /* ---------------- Year 10 ---------------- */
  L(10, 'index',
    ['A surd is a root that cannot be written as a whole number, like √2. Fractional indices are another way to write roots.',
      ['a^(1/2) = √a and a^(1/3) is the cube root of a.', 'Simplify a surd by taking out square factors: √12 = √(4 × 3) = 2√3.', '√a × √b = √(ab) and √a ÷ √b = √(a/b).'],
      [['Simplify √50.', '√50 = √(25 × 2) = 5√2.'], ['Write 16^(1/2) as a whole number.', '16^(1/2) = √16 = 4.']],
      'Look for the biggest square number that divides into the number under the root.'],
    ['根式是不能写成整数的根，比如 √2。分数指数是写根的另一种方式。',
      ['a^(1/2) = √a，a^(1/3) 是 a 的立方根。', '化简根式：提出平方因数，√12 = √(4 × 3) = 2√3。', '√a × √b = √(ab)，√a ÷ √b = √(a/b)。'],
      [['化简 √50。', '√50 = √(25 × 2) = 5√2。'], ['把 16^(1/2) 写成整数。', '16^(1/2) = √16 = 4。']],
      '找出根号下能被整除的最大的平方数。']);

  L(10, 'alg',
    ['Simultaneous equations have two unknowns. Their solution is the pair of values that works in both equations.',
      ['Substitution: write one letter in terms of the other, then substitute.', 'Elimination: add or subtract the equations to remove one letter.', 'Expand binomials with FOIL: (x + 2)(x + 3) = x² + 5x + 6.'],
      [['Solve x + y = 7 and x − y = 1.', 'Add the equations: 2x = 8, so x = 4. Then y = 7 − 4 = 3.'], ['Expand (x + 4)(x − 2).', 'x² − 2x + 4x − 8 = x² + 2x − 8.']],
      'Put your answers into both equations to check.'],
    ['联立方程有两个未知数，解是同时满足两个方程的一对数值。',
      ['代入法：用一个字母表示另一个，再代入。', '消元法：把两个方程相加或相减，消去一个字母。', '用“首外内尾”展开二项式：(x + 2)(x + 3) = x² + 5x + 6。'],
      [['解 x + y = 7 和 x − y = 1。', '两式相加：2x = 8，所以 x = 4。再 y = 7 − 4 = 3。'], ['展开 (x + 4)(x − 2)。', 'x² − 2x + 4x − 8 = x² + 2x − 8。']],
      '把答案代入两个方程检查。']);

  L(10, 'linear',
    ['We can find the equation of a line from its gradient and a point, or from two points. Parallel and perpendicular lines have special gradients.',
      ['Gradient m, through (x₁, y₁): y − y₁ = m(x − x₁).', 'Parallel lines have the same gradient.', 'Perpendicular lines have gradients that multiply to −1: m₁ × m₂ = −1.'],
      [['Find the equation of the line with gradient 3 through (1, 5).', 'y − 5 = 3(x − 1), so y = 3x + 2.'], ['A line has gradient 2. What is the gradient of a line perpendicular to it?', '2 × m = −1, so m = −1/2.']],
      'Write the answer as y = mx + b, or in the form the question asks for.'],
    ['可以由斜率和一个点，或两个点，求出直线方程。平行线和垂直线的斜率有特别的关系。',
      ['斜率 m，经过 (x₁, y₁)：y − y₁ = m(x − x₁)。', '平行线的斜率相等。', '垂直线的斜率相乘得 −1：m₁ × m₂ = −1。'],
      [['求斜率为 3 且经过 (1, 5) 的直线方程。', 'y − 5 = 3(x − 1)，所以 y = 3x + 2。'], ['一条直线的斜率是 2，与它垂直的直线斜率是多少？', '2 × m = −1，所以 m = −1/2。']],
      '答案写成 y = mx + b，或写成题目要求的形式。']);

  L(10, 'factor',
    ['A quadratic trinomial, like x² + 5x + 6, can be written as a product of two brackets.',
      ['For x² + bx + c, find two numbers that multiply to c and add to b.', 'x² + 5x + 6 = (x + 2)(x + 3), because 2 × 3 = 6 and 2 + 3 = 5.', 'If the x² has a number in front, take out any common factor first.'],
      [['Factorise x² + 7x + 12.', 'Two numbers that multiply to 12 and add to 7: 3 and 4. So (x + 3)(x + 4).'], ['Factorise x² − 2x − 15.', 'Multiply to −15 and add to −2: 3 and −5. So (x + 3)(x − 5).']],
      'Expand your answer to check it.'],
    ['二次三项式，比如 x² + 5x + 6，可以写成两个括号的乘积。',
      ['对于 x² + bx + c，找两个数：乘积是 c，和是 b。', 'x² + 5x + 6 = (x + 2)(x + 3)，因为 2 × 3 = 6，2 + 3 = 5。', 'x² 前面有系数时，先提取公因式。'],
      [['分解 x² + 7x + 12。', '乘积是 12、和是 7 的两个数：3 和 4。所以 (x + 3)(x + 4)。'], ['分解 x² − 2x − 15。', '乘积是 −15、和是 −2 的两个数：3 和 −5。所以 (x + 3)(x − 5)。']],
      '把答案展开来检查。']);

  L(10, 'formula',
    ['Some formulas have squares, roots or fractions, so we undo those operations too.',
      ['To undo a square, take the square root; to undo a root, square both sides.', 'To clear a fraction, multiply both sides by the denominator.', 'Be careful when the letter appears in more than one place: collect it on one side first.'],
      [['Make r the subject of A = πr².', 'Divide by π: A/π = r². Take the square root: r = √(A/π).'], ['Make a the subject of v = u + at.', 'Subtract u: v − u = at. Divide by t: a = (v − u)/t.']],
      'Square roots can be positive or negative, but for a length use the positive one.'],
    ['有些公式带平方、根号或分数，所以我们也要还原这些运算。',
      ['还原平方：开平方；还原根号：两边平方。', '去分母：两边乘以分母。', '字母出现在好几个地方时，先把它们移到一边。'],
      [['把 A = πr² 变成 r 为主项。', '除以 π：A/π = r²。开平方：r = √(A/π)。'], ['把 v = u + at 变成 a 为主项。', '减 u：v − u = at。除以 t：a = (v − u)/t。']],
      '开平方有正负两个值，但长度只取正的那一个。']);

  L(10, 'fin',
    ['Compound interest means the interest earns interest too, so money grows faster than with simple interest. Depreciation is when value falls over time.',
      ['Compound interest: A = P(1 + r)ⁿ, where r is the rate per period.', 'Depreciation: A = P(1 − r)ⁿ, which is the same idea going down.', 'Interest earned = A − P.'],
      [['Find the amount if $1000 grows at 5% per year for 2 years, compounded annually.', 'A = 1000 × 1.05² = 1000 × 1.1025 = $1102.50.'], ['A car worth $20 000 depreciates 10% per year. Find its value after 2 years.', 'A = 20 000 × 0.9² = 20 000 × 0.81 = $16 200.']],
      'Compare: simple interest on $1000 for 2 years at 5% is $100, but compound interest is $102.50.'],
    ['复利就是利息也会产生利息，所以钱比单利增长得更快。折旧是价值随时间下降。',
      ['复利：A = P(1 + r)ⁿ，r 是每期利率。', '折旧：A = P(1 − r)ⁿ，思路相同，只是变小。', '利息 = A − P。'],
      [['$1000 按年利率 5% 复利计算，2 年后是多少？', 'A = 1000 × 1.05² = 1000 × 1.1025 = $1102.50。'], ['一辆价值 $20 000 的车每年折旧 10%，2 年后价值多少？', 'A = 20 000 × 0.9² = 20 000 × 0.81 = $16 200。']],
      '对比：$1000 按 5% 单利存 2 年利息是 $100，复利是 $102.50。']);

  L(10, 'quad',
    ['A quadratic equation has an x² term. Its graph is a U-shaped curve called a parabola.',
      ['Solve by factorising: if (x − 2)(x + 3) = 0, then x = 2 or x = −3.', 'The quadratic formula: x = (−b ± √(b² − 4ac)) ÷ 2a.', 'The graph of y = ax² + bx + c opens up if a > 0 and down if a < 0.'],
      [['Solve x² − 5x + 6 = 0.', '(x − 2)(x − 3) = 0, so x = 2 or x = 3.'], ['Solve x² − 9 = 0.', 'x² = 9, so x = 3 or x = −3.']],
      'Write the equation as "= 0" first, then factorise.'],
    ['二次方程含有 x² 项，它的图像是 U 形曲线，叫抛物线。',
      ['用因式分解来解：如果 (x − 2)(x + 3) = 0，那么 x = 2 或 x = −3。', '求根公式：x = (−b ± √(b² − 4ac)) ÷ 2a。', 'y = ax² + bx + c 的图像：a > 0 时开口向上，a < 0 时开口向下。'],
      [['解 x² − 5x + 6 = 0。', '(x − 2)(x − 3) = 0，所以 x = 2 或 x = 3。'], ['解 x² − 9 = 0。', 'x² = 9，所以 x = 3 或 x = −3。']],
      '先把方程化成“= 0”的形式，再分解因式。']);

  L(10, 'meas',
    ['Pyramids, cones and spheres have curved or sloping surfaces. Their volumes and surface areas have their own formulas.',
      ['Pyramid and cone: V = ⅓ × base area × height; cone V = ⅓πr²h.', 'Sphere: V = 4/3 πr³ and surface area = 4πr².', 'Cone curved surface area = πrl, where l is the slant height.'],
      [['Find the volume of a sphere with radius 3 cm (give the answer in terms of π).', 'V = 4/3 × π × 27 = 36π cm³.'], ['A square pyramid has a base of side 6 cm and a height of 5 cm. Find its volume.', 'Base area = 36, so V = ⅓ × 36 × 5 = 60 cm³.']],
      'A pyramid or cone is a third of the prism or cylinder with the same base and height.'],
    ['棱锥、圆锥和球有曲面或斜面，它们的体积和表面积有各自的公式。',
      ['棱锥和圆锥：V = ⅓ × 底面积 × 高；圆锥 V = ⅓πr²h。', '球：V = 4/3 πr³，表面积 = 4πr²。', '圆锥侧面积 = πrl，l 是母线（斜高）。'],
      [['求半径 3 cm 的球的体积（答案用 π 表示）。', 'V = 4/3 × π × 27 = 36π cm³。'], ['正四棱锥底边长 6 cm，高 5 cm，求体积。', '底面积 = 36，V = ⅓ × 36 × 5 = 60 cm³。']],
      '棱锥或圆锥的体积是同底同高的棱柱或圆柱的三分之一。']);

  L(10, 'angle',
    ['Circle geometry uses the properties of chords, tangents and angles to find lengths and angles.',
      ['The angle at the centre is twice the angle at the circumference standing on the same arc.', 'Angles in the same segment are equal; the angle in a semicircle is 90°.', 'A tangent meets the radius at 90°. Opposite angles of a cyclic quadrilateral add to 180°.'],
      [['An angle at the circumference is 35°. What is the angle at the centre on the same arc?', '2 × 35 = 70°.'], ['One angle of a cyclic quadrilateral is 100°. What is the opposite angle?', '180 − 100 = 80°.']],
      'Give a reason for each step using the circle property you used.'],
    ['圆的几何用弦、切线和角的性质来求长度和角度。',
      ['同弧所对的圆心角是圆周角的 2 倍。', '同弧所对的圆周角相等；半圆所对的圆周角是 90°。', '切线垂直于过切点的半径。圆内接四边形的对角互补（加起来 180°）。'],
      [['一个圆周角是 35°，同弧所对的圆心角是多少？', '2 × 35 = 70°。'], ['圆内接四边形的一个角是 100°，它的对角是多少？', '180 − 100 = 80°。']],
      '每一步都要写上用了哪条圆的性质作为理由。']);

  L(10, 'pyth',
    ['Trigonometry solves real problems with angles of elevation and depression and with bearings.',
      ['The angle of elevation is measured up from the horizontal; the angle of depression is measured down from it.', 'A bearing is measured clockwise from north, written with 3 digits, like 045°.', 'Draw a right-angled triangle, label it, then use sin, cos or tan.'],
      [['From 20 m from a tree, the angle of elevation to the top is 40°. Find its height (to 1 decimal place).', 'tan 40° = h ÷ 20, so h = 20 × tan 40° ≈ 20 × 0.839 = 16.8 m.'], ['What is the bearing of south-east?', 'South-east is halfway between east (090°) and south (180°), so 135°.']],
      'Make a clear sketch before you use any ratio.'],
    ['三角学可以用仰角、俯角和方位角来解决实际问题。',
      ['仰角是从水平线向上量的角；俯角是从水平线向下量的角。', '方位角是从正北顺时针量的角，写成三位数，如 045°。', '画出直角三角形、标好边，再用 sin、cos 或 tan。'],
      [['在距离树 20 m 的地方，看树顶的仰角是 40°，求树高（保留 1 位小数）。', 'tan 40° = h ÷ 20，所以 h = 20 × tan 40° ≈ 20 × 0.839 = 16.8 m。'], ['东南方向的方位角是多少？', '东南在正东（090°）和正南（180°）正中间，所以是 135°。']],
      '用比之前，先画一个清楚的草图。']);

  L(10, 'stats',
    ['Quartiles split ordered data into four equal parts. Box plots and scatter plots show how data spread and how two variables relate.',
      ['Q1 is the median of the lower half and Q3 is the median of the upper half. IQR = Q3 − Q1.', 'A box plot shows the minimum, Q1, median, Q3 and maximum.', 'A scatter plot shows two variables; the line of best fit shows the trend.'],
      [['Data: 2, 4, 6, 8, 10, 12, 14, 16. Find the median and the IQR.', 'Median = (8 + 10) ÷ 2 = 9. Q1 = (4 + 6) ÷ 2 = 5, Q3 = (12 + 14) ÷ 2 = 13. IQR = 13 − 5 = 8.'], ['A scatter plot goes up from left to right. What does that show?', 'A positive relationship: as one variable increases, so does the other.']],
      'Correlation does not mean one thing causes the other.'],
    ['四分位数把排好序的数据分成四等份。箱线图和散点图能显示数据的分布和两个变量的关系。',
      ['Q1 是下半部分的中位数，Q3 是上半部分的中位数。四分位距 IQR = Q3 − Q1。', '箱线图显示最小值、Q1、中位数、Q3 和最大值。', '散点图显示两个变量；最佳拟合线显示趋势。'],
      [['数据：2、4、6、8、10、12、14、16。求中位数和四分位距。', '中位数 = (8 + 10) ÷ 2 = 9。Q1 = (4 + 6) ÷ 2 = 5，Q3 = (12 + 14) ÷ 2 = 13。IQR = 13 − 5 = 8。'], ['散点图从左到右上升，这说明什么？', '正相关：一个变量增大时，另一个也增大。']],
      '相关并不表示其中一个是另一个的原因。']);

  L(10, 'prob',
    ['A multi-step experiment has several stages. A tree diagram shows every path, and we multiply along the branches.',
      ['With replacement: the chances stay the same at every step. Without replacement: the numbers change.', 'Multiply along a path: P(A then B) = P(A) × P(B after A).', 'Add the paths that give the event you want.'],
      [['A bag has 3 red and 2 blue marbles. Two are picked with replacement. Find P(red, red).', '3/5 × 3/5 = 9/25.'], ['Same bag, but without replacement. Find P(red, red).', '3/5 × 2/4 = 6/20 = 3/10.']],
      'In "without replacement", reduce both the top and the bottom for the second pick.'],
    ['多步试验有好几个阶段。树状图显示每一条路径，沿着树枝相乘。',
      ['放回：每一步的机会都一样；不放回：数目会变化。', '沿着路径相乘：P(先 A 后 B) = P(A) × P(A 之后 B)。', '把得到想要事件的所有路径相加。'],
      [['袋子里有 3 个红球、2 个蓝球，放回地摸两个。P(红，红) 是多少？', '3/5 × 3/5 = 9/25。'], ['同一个袋子，不放回地摸两个，P(红，红) 是多少？', '3/5 × 2/4 = 6/20 = 3/10。']],
      '不放回时，第二次摸的分子和分母都要变小。']);
})(typeof window !== 'undefined' ? window : globalThis);
