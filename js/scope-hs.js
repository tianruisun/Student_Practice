/* High school Study (v2.2.0, W12): the topics of Years 7–12, Year 12 Extension 1 and Year 12 Extension 2, by year and strand.
   Years 13 and 14 are the app's numbers for Extension 1 (3U) and Extension 2 (4U), as everywhere else in the app.
   From the NSW Mathematics K–10 syllabus (Stage 4 = Years 7–8, Stage 5 = Years 9–10) and the Stage 6 syllabuses
   (Advanced, Extension 1, Extension 2): see the outline in the review folder (nsw-math-outline-7-12.md).
   Same shape as js/scope-k6.js, so the Study screen treats both alike. Each topic lists, per year, what is new (`what`)
   and `gen`, the question generator that practises it at that year (a topic id of Gen.SUBJECTS.maths whose year range
   includes the year), or null when no generator covers the topic yet (the lesson then has no Practise button).
   Lessons: js/lessons-hs-*.js (stored with the K–6 ones in window.LessonsK6, keyed 'year:topic'). */
(function (root) {
  'use strict';
  const YEARS = [7, 8, 9, 10, 11, 12, 13, 14];
  const STRANDS = ['num', 'mes', 'sta', 'fun'];
  const W = (en, zh) => ({ en, zh });
  const E = (gen, en, zh) => ({ gen, what: W(en, zh) });

  const T = {
    numth: { strand: 'num', years: {
      7: E('numth', 'Factors, multiples, primes, highest common factor and lowest common multiple', '因数、倍数、质数，最大公因数和最小公倍数') } },
    int: { strand: 'num', years: {
      7: E('int', 'Negative numbers: ordering them and adding, subtracting, multiplying and dividing them', '负数：比较大小，以及负数的加、减、乘、除') } },
    frac: { strand: 'num', years: {
      7: E('frac', 'Equivalent fractions, mixed numbers, and adding and subtracting fractions', '等值分数、带分数，分数的加减'),
      8: E('frac', 'Multiplying and dividing fractions, and fractions of an amount', '分数的乘除，求一个量的几分之几') } },
    dec: { strand: 'num', years: {
      7: E('dec', 'Decimals: the four operations, rounding, and decimals as fractions', '小数的四则运算、四舍五入，小数与分数的互化') } },
    pct: { strand: 'num', years: {
      7: E('pct', 'Percentages of an amount; fractions, decimals and percentages as the same amount', '求一个量的百分之几；分数、小数、百分数表示同一个量'),
      8: E('pct', 'Percentage change: increase, decrease, discount, profit and loss', '百分数的变化：增加、减少、折扣、盈亏') } },
    ratio: { strand: 'num', years: {
      7: E('ratio', 'Ratios, simplifying them and sharing an amount in a ratio', '比，化简比，按比分配'),
      8: E('ratio', 'Rates and speed: distance, speed and time', '比率和速度：路程、速度、时间') } },
    index: { strand: 'num', years: {
      7: E('index', 'Powers, square roots and cube roots; the order of operations', '乘方、平方根、立方根；运算顺序'),
      9: E('index', 'Index laws, zero and negative powers, and scientific notation', '指数法则、零指数和负指数，科学记数法'),
      10: E('index', 'Surds and fractional indices', '根式和分数指数') } },
    pattern: { strand: 'num', years: {
      8: E('pattern', 'Number patterns: finding a rule and the nth term', '数的规律：找规律和第 n 项') } },
    alg: { strand: 'num', years: {
      7: E('alg', 'Algebra: pronumerals, substitution, simplifying and simple equations', '代数：字母、代入、化简和简单方程'),
      8: E('alg', 'Expanding brackets, collecting like terms, and solving equations and inequalities', '去括号、合并同类项，解方程和不等式'),
      9: E('alg', 'Algebraic fractions, equations with brackets and unknowns on both sides', '代数分式，带括号的方程，两边都有未知数的方程'),
      10: E('alg', 'Simultaneous equations, expanding binomials and algebraic skills for Stage 5', '联立方程、二项式展开，第五阶段的代数技能') } },
    linear: { strand: 'num', years: {
      8: E('linear', 'Linear relationships: tables of values and the graph of a straight line', '线性关系：数值表和直线的图像'),
      9: E('linear', 'Gradient, intercepts and the equation y = mx + b', '斜率、截距和方程 y = mx + b'),
      10: E('linear', 'Finding the equation of a line; parallel and perpendicular lines', '求直线方程；平行线和垂直线') } },
    factor: { strand: 'num', years: {
      9: E('factor', 'Factorising: common factors and the difference of two squares', '因式分解：公因式和平方差'),
      10: E('factor', 'Factorising quadratic trinomials', '二次三项式的因式分解') } },
    formula: { strand: 'num', years: {
      9: E('formula', 'Changing the subject of a formula', '变换公式的主项'),
      10: E('formula', 'Harder formulas: roots, squares and fractions', '较难的公式：根号、平方和分数') } },
    fin: { strand: 'num', years: {
      9: E('fin', 'Earning and spending: wages, overtime, commission, GST, budgets and simple interest', '赚钱和花钱：工资、加班费、佣金、商品及服务税、预算和单利'),
      10: E('fin', 'Compound interest and depreciation', '复利和折旧') } },
    quad: { strand: 'num', years: {
      10: E('quad', 'Quadratic equations and the parabola', '二次方程和抛物线'),
      11: E('quad', 'Quadratic functions: the vertex, the discriminant and the roots', '二次函数：顶点、判别式和根') } },
    meas: { strand: 'mes', years: {
      7: E('meas', 'Perimeter and area of rectangles, triangles and parallelograms; units', '长方形、三角形、平行四边形的周长和面积；单位'),
      8: E('meas', 'Circles, area of composite shapes, and the volume of prisms', '圆，组合图形的面积，棱柱的体积'),
      9: E('meas', 'Surface area and volume of prisms and cylinders', '棱柱和圆柱的表面积和体积'),
      10: E('meas', 'Surface area and volume of pyramids, cones and spheres', '棱锥、圆锥和球的表面积和体积') } },
    angle: { strand: 'mes', years: {
      7: E('angle', 'Angles at a point, on a line, and with parallel lines', '一点周围的角、直线上的角、平行线的角'),
      8: E('angle', 'Angles in triangles and quadrilaterals, and the properties of shapes', '三角形和四边形的内角，图形的性质'),
      9: E('angle', 'Congruent and similar figures', '全等图形和相似图形'),
      10: E('angle', 'Circle geometry: the angle and tangent properties', '圆的几何：角和切线的性质') } },
    pyth: { strand: 'mes', years: {
      8: E('pyth', 'Pythagoras\' theorem', '勾股定理'),
      9: E('pyth', 'Trigonometry in right-angled triangles: sine, cosine and tangent', '直角三角形的三角学：正弦、余弦和正切'),
      10: E('pyth', 'Problems with angles of elevation, depression and bearings', '仰角、俯角和方位角的问题') } },
    stats: { strand: 'sta', years: {
      7: E('stats', 'Collecting and displaying data: tables, column graphs and dot plots', '收集和表示数据：表格、柱状图和点图'),
      8: E('stats', 'Mean, median, mode and range', '平均数、中位数、众数和极差'),
      9: E('stats', 'Comparing data sets, and stem-and-leaf plots', '比较数据组，茎叶图'),
      10: E('stats', 'Quartiles, box plots, and scatter plots with the line of best fit', '四分位数、箱线图，散点图和最佳拟合线') } },
    prob: { strand: 'sta', years: {
      7: E('prob', 'Simple probability: the chance of an event as a fraction', '简单概率：用分数表示事件发生的可能性'),
      8: E('prob', 'Complementary events, two-way tables and Venn diagrams', '互补事件、双向表和韦恩图'),
      9: E('prob', 'Two-step experiments and tables of outcomes', '两步试验和结果表'),
      10: E('prob', 'Multi-step experiments with and without replacement, and tree diagrams', '多步试验（放回与不放回），树状图') } },
    func: { strand: 'fun', years: {
      11: E('func', 'Functions: domain, range, transformations and the graphs of common functions', '函数：定义域、值域、图像变换和常见函数的图像'),
      12: E('func', 'Reasoning with functions: composite functions, inverses and the reciprocal function', '函数的推理：复合函数、反函数和倒数函数') } },
    graphs: { strand: 'fun', years: {
      11: E('graphs', 'Gradients of lines and curves, and graphs of functions', '直线和曲线的斜率，函数的图像'),
      12: E('graphs', 'Reading curves: increasing, decreasing, stationary points and concavity', '读懂曲线：增、减、驻点和凹凸') } },
    trig: { strand: 'fun', years: {
      11: E('trig', 'Radians, trigonometric ratios beyond 90° and the sine and cosine rules', '弧度，大于 90° 的三角比，正弦定理和余弦定理'),
      12: E('trig', 'Trigonometric functions: graphs, identities and equations', '三角函数：图像、恒等式和方程'),
      13: E('trig', 'Further trigonometric equations and the auxiliary angle form', '更多三角方程和辅助角形式') } },
    explog: { strand: 'fun', years: {
      11: E('explog', 'Logarithms and exponential functions', '对数和指数函数'),
      12: E('explog', 'Exponential growth and decay, and the natural logarithm', '指数增长和衰减，自然对数') } },
    series: { strand: 'fun', years: {
      11: E('series', 'Arithmetic and geometric sequences and series', '等差数列、等比数列及其求和'),
      12: E('series', 'Geometric series: the sum to infinity, and applications to finance', '等比级数：无穷和及其在金融中的应用') } },
    calc: { strand: 'fun', years: {
      11: E('calc', 'Differentiation: the derivative from first principles and the power rule', '微分：用定义求导和幂函数求导法则'),
      12: E('calc', 'The chain, product and quotient rules, curve sketching, and integration', '链式法则、乘法法则和除法法则，曲线描绘，积分'),
      13: E('calc', 'Rates of change, differential equations and growth models', '变化率、微分方程和增长模型') } },
    stats2: { strand: 'sta', years: {
      11: E('stats2', 'Probability rules, conditional probability and the independence of events', '概率法则、条件概率和事件的独立性'),
      12: E('stats2', 'Discrete random variables, expected value and variance; the normal distribution', '离散型随机变量、期望和方差；正态分布'),
      13: E('stats2', 'The binomial distribution and the normal approximation', '二项分布和正态近似') } },
    comb: { strand: 'sta', years: {
      13: E('comb', 'Counting: permutations, combinations and the binomial theorem', '计数：排列、组合和二项式定理') } },
    poly: { strand: 'fun', years: {
      13: E('poly', 'Polynomials: the remainder and factor theorems, and the roots of a polynomial', '多项式：余式定理和因式定理，多项式的根'),
      14: E('poly', 'Polynomials with complex roots, and the relationships between roots and coefficients', '有复数根的多项式，根与系数的关系') } },
    vectors: { strand: 'fun', years: {
      13: E('vectors', 'Vectors in two dimensions: addition, scalar multiples and the dot product', '平面向量：加法、数乘和点积'),
      14: E('vectors', 'Vectors in three dimensions, projections, and lines in space', '空间向量、投影和空间中的直线') } },
    invtrig: { strand: 'fun', years: {
      13: E('invtrig', 'Inverse trigonometric functions: domain, range and graphs', '反三角函数：定义域、值域和图像') } },
    complex: { strand: 'fun', years: {
      14: E('complex', 'Complex numbers: Cartesian and polar forms, de Moivre\'s theorem and roots', '复数：直角坐标形式和极坐标形式，棣莫弗定理和复数的根') } },
    integ: { strand: 'fun', years: {
      14: E('integ', 'Integration: substitution, parts, partial fractions and volumes of revolution', '积分：换元法、分部积分法、部分分式和旋转体的体积') } },
    mech: { strand: 'fun', years: {
      14: E('mech', 'Mechanics: projectile motion, resisted motion and simple harmonic motion', '力学：抛体运动、有阻力的运动和简谐运动') } }
  };
  const ORDER = Object.keys(T);

  const has = id => Object.prototype.hasOwnProperty.call(T, id);
  const inYear = (id, y) => has(id) && Object.prototype.hasOwnProperty.call(T[id].years, y);
  /* in the order the Study screen shows them: strand by strand (so "Next topic" follows the list) */
  function topicsFor(y) { return STRANDS.flatMap(s => ORDER.filter(id => inYear(id, y) && T[id].strand === s)); }
  function strandOf(id) { return has(id) ? T[id].strand : null; }
  function what(id, y) { return inYear(id, y) ? T[id].years[y].what : null; }
  /* the generator that practises the topic in that year, or null */
  function gen(id, y) { return inYear(id, y) ? T[id].years[y].gen : null; }

  const api = { YEARS, STRANDS, ORDER, T, has, inYear, topicsFor, strandOf, what, gen };
  root.ScopeHS = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
