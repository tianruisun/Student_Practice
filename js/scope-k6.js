/* NSW Mathematics K–6 scope and sequence: the primary topics, year by year (v1.10.0, K–6 study mode).
   Year 0 is Kindergarten. From the NSW Department of Education sample scope and sequences (Early Stage 1 to
   Stage 3). NSW plans in two-year Stages; the Part A topics are shown in the first year of a Stage and Part B in
   the second, which is an estimate (see the "Idea explore" summary page).
   Each topic lists, per year, what is new (`what`) and the question generators that practise it (`gens`, each
   [generator, the year it is run at]). Practice for Kindergarten to Year 6 maths follows this list. Lessons live
   in js/lessons-k6.js. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const YEARS = [0, 1, 2, 3, 4, 5, 6];
  const STRANDS = ['num', 'mes', 'sta'];
  const W = (en, zh) => ({ en, zh });

  /* topic → { strand, years: { year: { gens, what } } }, in the order the app lists them */
  const T = {
    k6place: { strand: 'num', years: {
      0: { gens: [['kcount', 0], ['kpattern', 0]], what: W('Seeing how many, counting by ones, numbers to 10 and beyond, and repeating patterns', '一眼看出有几个、一个一个地数、10 以内及更大的数，以及重复的规律') },
      1: { gens: [['count', 1]], what: W('Two-digit numbers: tens and ones, counting past 100, numbers on a number line', '两位数：几个十和几个一，数到 100 以上，数轴上的数') },
      2: { gens: [['count', 2]], what: W('Three-digit numbers up to 1000; counting by ones and tens from any number', '三位数（到 1000）；从任意一个数起一个一个、十个十个地数') },
      3: { gens: [['count', 3]], what: W('Numbers in the thousands: read, order and break up 4-digit numbers', '千以内的数：读、比较大小和拆分四位数') },
      4: { gens: [['place', 4], ['dec', 4]], what: W('Numbers up to 6 digits; decimals: tenths and hundredths', '六位数；小数：十分位和百分位') },
      5: { gens: [['place', 5], ['dec', 5]], what: W('Millions to 1 billion; decimals to thousandths', '百万到十亿；小数到千分位') },
      6: { gens: [['int', 6], ['pct', 6], ['dec', 6]], what: W('Negative numbers; fractions, decimals and percentages as the same amount; discounts', '负数；分数、小数和百分数表示同一个量；打折') } } },
    k6add: { strand: 'num', years: {
      0: { gens: [['kaddsub', 0]], what: W('Adding more and taking away; parts of numbers to 10', '添上和去掉；10 以内数的分与合') },
      1: { gens: [['add1', 1]], what: W('Number bonds to 10; adding and subtracting by counting on and back', '10 的分与合；用往后数、往前数来加减') },
      2: { gens: [['add1', 2]], what: W('Making tens to add and subtract two-digit numbers; using equality', '凑十法加减两位数；利用等式') },
      3: { gens: [['add1', 3], ['money1', 3]], what: W('Mental and written strategies up to 3 digits; money', '三位数以内的口算和笔算；钱') },
      4: { gens: [['addsub', 4]], what: W('Regrouping to add and subtract to 1000 and beyond; missing numbers', '进位和退位的加减法；求未知数') },
      5: { gens: [['addsub', 5], ['mental', 4]], what: W('Efficient strategies for large numbers; checking by estimating', '大数加减的简便方法；用估算检查') },
      6: { gens: [['addsub', 6], ['dec', 4]], what: W('Adding and subtracting decimals; multi-step problems', '小数加减；多步计算') } } },
    k6mul: { strand: 'num', years: {
      0: { gens: [['kshare', 0]], what: W('Sharing into equal groups', '平均分成几份') },
      1: { gens: [['kshare', 1]], what: W('Skip counting by 2s, 5s and 10s; equal groups; sharing', '2 个 2 个、5 个 5 个、10 个 10 个地数；相同的组；平均分') },
      2: { gens: [['mult1', 2]], what: W('Multiplication as equal groups; doubling and halving; simple division', '乘法表示几个相同的组；加倍和减半；简单的除法') },
      3: { gens: [['mult1', 3]], what: W('Times tables for 2, 3, 4, 5 and 10 and their division facts; fact families', '2、3、4、5、10 的乘法口诀和对应的除法；乘除算式家族') },
      4: { gens: [['muldiv', 4], ['pattern', 4]], what: W('All tables to 10 × 10; multiplying by tens; number patterns', '10 × 10 以内的全部乘法口诀；乘整十数；数的规律') },
      5: { gens: [['muldiv', 5], ['numth', 5]], what: W('Long multiplication; division with remainders; factors', '多位数乘法；有余数的除法；因数') },
      6: { gens: [['muldiv', 6], ['kops', 6]], what: W('Order of operations and brackets; multi-step × and ÷', '运算顺序和括号；多步乘除') } } },
    k6frac: { strand: 'num', years: {
      0: { gens: [['frac1', 1]], what: W('A half: two equal parts', '一半：分成相等的两份') },
      1: { gens: [['frac1', 2]], what: W('Halves and quarters', '二分之一和四分之一') },
      2: { gens: [['frac1', 2]], what: W('Eighths, by halving again and again', '八分之一：一次又一次地对半分') },
      3: { gens: [['frac1', 3]], what: W('Thirds and fifths; unit fractions on a number line', '三分之一和五分之一；数轴上的单位分数') },
      4: { gens: [['frac', 4]], what: W('Equivalent fractions; fractions bigger than one', '等值分数；大于 1 的分数') },
      5: { gens: [['frac', 5]], what: W('Comparing fractions; adding and subtracting with the same denominator', '比较分数大小；同分母分数加减') },
      6: { gens: [['frac', 6]], what: W('Fraction of a quantity; a fraction as a division; related denominators', '求一个数的几分之几；分数与除法；相关分母') } } },
    k6word: { strand: 'num', years: {
      3: { gens: [['word', 3]], what: W('Word problems: turning a story into a number sentence', '应用题：把故事写成算式') },
      4: { gens: [['word', 4]], what: W('Word problems written as number sentences, one or two steps', '应用题：一步或两步的算式') },
      5: { gens: [['word', 5]], what: W('Multi-step word problems; checking that the answer makes sense', '多步应用题；检查答案是否合理') },
      6: { gens: [['word', 6]], what: W('Multi-step word problems with fractions, decimals and percentages', '含分数、小数和百分数的多步应用题') } } },
    k6len: { strand: 'mes', years: {
      0: { gens: [['kmeas', 0]], what: W('Comparing: longer, shorter, holds more', '比较：更长、更短、装得更多') },
      1: { gens: [['kmeas', 1]], what: W('Measuring with informal units such as paper clips', '用回形针等非标准单位测量') },
      2: { gens: [['kmeas', 2]], what: W('Square units in rows and columns; first formal units (m, cm)', '按行和列排列的小正方形；第一次使用米和厘米') },
      3: { gens: [['kmeas', 3]], what: W('Metres, centimetres and millimetres; cm² and m²; litres', '米、厘米和毫米；平方厘米和平方米；升') },
      4: { gens: [['kmeas', 3]], what: W('Reading scales on instruments; comparing areas in metric units', '读测量工具上的刻度；用公制单位比较面积') },
      5: { gens: [['meas', 4]], what: W('Kilometres; perimeter; area of rectangles; hectares', '千米；周长；长方形面积；公顷') },
      6: { gens: [['meas', 5]], what: W('Converting units; area of triangles and composite shapes; volume of prisms', '单位换算；三角形和组合图形的面积；长方体的体积') } } },
    k6mass: { strand: 'mes', years: {
      0: { gens: [['kmass', 0]], what: W('Heavier and lighter', '更重和更轻') },
      1: { gens: [['kmass', 1]], what: W('Using an equal-arm balance', '使用等臂天平') },
      2: { gens: [['kmass', 2]], what: W('Comparing masses on a balance', '用天平比较质量') },
      3: { gens: [['kmass', 3]], what: W('The kilogram and the gram', '千克和克') },
      4: { gens: [['kmass', 4]], what: W('Reading scales for mass', '读秤上的刻度') },
      5: { gens: [['kmass', 5]], what: W('Choosing units; decimals for mass, e.g. 1.5 kg', '选择合适的单位；用小数表示质量，如 1.5 千克') },
      6: { gens: [['kmass', 6]], what: W('Converting between grams and kilograms', '克和千克的换算') } } },
    k6shape: { strand: 'mes', years: {
      0: { gens: [['kshape', 0]], what: W('Naming 2D shapes; exploring 3D objects; where things are', '认识平面图形；认识立体物体；描述位置') },
      1: { gens: [['kshape', 1], ['shape1', 1]], what: W('Grouping shapes by their features; slides and flips; 3D objects', '按特征给图形分类；平移和翻转；立体图形') },
      2: { gens: [['shape1', 2], ['kspace', 2]], what: W('Faces, edges and corners; quarter turns; simple maps', '面、棱和顶点；四分之一圈；简单的地图') },
      3: { gens: [['shape1', 3], ['kspace', 3]], what: W('Angles as turns; grid maps; reflect, translate and rotate', '角表示转动的大小；方格地图；对称、平移和旋转') },
      4: { gens: [['kspace', 4]], what: W('Right angles; symmetry; nets of 3D objects', '直角；对称；立体图形的展开图') },
      5: { gens: [['kspace', 5], ['shape1', 3]], what: W('Degrees and protractors; coordinates; prisms and pyramids', '度和量角器；坐标；棱柱和棱锥') },
      6: { gens: [['angle', 4], ['kspace', 6]], what: W('Angles on a line and at a point; all four quadrants', '平角和周角；四个象限的坐标') } } },
    k6time: { strand: 'mes', years: {
      0: { gens: [['ktime', 0]], what: W("O'clock; days of the week", '整点；一星期的七天') },
      1: { gens: [['ktime', 1]], what: W('Half past; months of the year', '半点；一年的十二个月') },
      2: { gens: [['time1', 2]], what: W('Quarter past and quarter to; how long things take', '一刻和三刻；经过的时间') },
      3: { gens: [['time1', 3]], what: W('Reading analog clocks to the minute', '读钟面上的时间（精确到分）') },
      4: { gens: [['ktime', 4]], what: W('Digital time; am and pm', '电子钟时间；上午和下午') },
      5: { gens: [['ktime', 5]], what: W('12- and 24-hour time', '12 小时制和 24 小时制') },
      6: { gens: [['ktime', 6]], what: W('Duration problems with 24-hour time', '用 24 小时制计算经过的时间') } } },
    k6data: { strand: 'sta', years: {
      0: { gens: [['kdata', 0], ['graph1', 1]], what: W('Sorting objects into simple displays', '把物品分类摆成简单的图') },
      1: { gens: [['graph1', 1]], what: W('Asking a question; picture displays', '提出问题；象形图') },
      2: { gens: [['graph1', 2]], what: W('Making and reading data displays', '制作和读统计图') },
      3: { gens: [['graph1', 3]], what: W('Tables and graphs', '统计表和统计图') },
      4: { gens: [['datafig', 4]], what: W('Graphs with scales: one symbol stands for many', '有刻度的统计图：一个图标表示多个') },
      5: { gens: [['kdata', 5], ['datafig', 5], ['stats', 5]], what: W('Surveys; choosing the right graph; interpreting data', '调查；选择合适的统计图；解读数据') },
      6: { gens: [['kdata', 6], ['datafig', 6]], what: W('Judging data in the media and online', '判断媒体和网络上的数据') } } },
    k6chance: { strand: 'sta', years: {
      1: { gens: [['kchance', 1]], what: W('Listing possible outcomes', '列出可能的结果') },
      2: { gens: [['kchance', 2]], what: W('Will it happen, might it happen, or won’t it happen?', '一定会、可能会，还是不可能发生？') },
      3: { gens: [['kchance', 3]], what: W('Outcomes of chance experiments', '可能性实验的结果') },
      4: { gens: [['kchance', 4]], what: W('Likely or unlikely', '很可能还是不太可能') },
      5: { gens: [['kchance', 5]], what: W('Equally likely outcomes; probability as a fraction', '等可能的结果；用分数表示可能性') },
      6: { gens: [['kchance', 6], ['prob', 6]], what: W('Probability as a fraction; expected and actual results over many trials', '用分数表示可能性；多次试验的预计结果与实际结果') } } }
  };
  const ORDER = Object.keys(T);

  const has = id => Object.prototype.hasOwnProperty.call(T, id);
  const inYear = (id, y) => has(id) && Object.prototype.hasOwnProperty.call(T[id].years, y);
  function topicsFor(y) { return ORDER.filter(id => inYear(id, y)); }
  function strandOf(id) { return has(id) ? T[id].strand : null; }
  function what(id, y) { return inYear(id, y) ? T[id].years[y].what : null; }
  function gens(id, y) { return inYear(id, y) ? T[id].years[y].gens : []; }

  /* one question on a K–6 topic: from one of its generators, labelled with the topic and the student's year */
  function generate(year, id, diff) {
    const list = gens(id, year);
    if (!list.length) throw new Error('no K–6 topic ' + id + ' in year ' + year);
    const [gen, gy] = G.pick(list), q = G.generate('maths', gy, gen, diff);
    q.topic = id; q.year = year;
    return q;
  }

  /* n distinct questions for a year. Mixed works as it did before v1.10.0 (Gen.generateSet), on the K–6 topics:
     at Challenging and Competitive some competition problems (Years 1–6), from Year 3 about 1 in 3 a word problem,
     and the year's other topics in turn. A topic with too few distinct questions is filled from the year's other
     topics, so a set never comes back short. */
  const OLY_SHARE = { 3: 0.4, 4: 0.75 };
  const keyOf = q => q.q.en + (q.fig ? JSON.stringify(q.fig) : '') + (q.choices ? q.choices.map(c => c.en).join('|') : '');
  function generateSet(year, topic, diff, n) {
    const all = topicsFor(year), rest = all.filter(k => k !== 'k6word'), out = [], seen = new Set();
    if (!all.length) return out;
    const canOly = year >= 1 && diff >= 3 && G.SUBJECTS.maths.olymp;
    let order = G.shuffle(rest.slice()), oi = 0;
    const add = q => { const k = keyOf(q); if (seen.has(k)) return false; seen.add(k); out.push(q); return true; };
    for (let tries = 0; out.length < n && tries < n * 60; tries++) {
      if (topic !== 'mixed') { add(generate(year, topic, diff)); continue; }
      if (canOly && Math.random() < OLY_SHARE[diff]) { const q = G.generate('maths', year, 'olymp', diff); q.year = year; add(q); continue; }
      if (all.includes('k6word') && out.length % 3 === 1) { add(generate(year, 'k6word', diff)); continue; }
      add(generate(year, order[oi % order.length], diff)); oi++;
      if (oi % order.length === 0) order = G.shuffle(order);
    }
    const pool = topic === 'mixed' ? [] : G.shuffle(all.filter(k => k !== topic));
    for (let tries = 0; out.length < n && pool.length && tries < n * 60; tries++) add(generate(year, pool[tries % pool.length], diff));
    return out;
  }

  const api = { YEARS, STRANDS, ORDER, T, has, inYear, topicsFor, strandOf, what, gens, generate, generateSet };
  root.ScopeK6 = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
