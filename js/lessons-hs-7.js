/* High school study mode lessons, Years 7 and 8 (v2.2.0, W12). One lesson per topic and year of js/scope-hs.js.
   L(year, topic, english, chinese), each [intro, [key points], [[worked example, how to solve it]], tip]. */
(function (root) {
  'use strict';
  const B = root.LessonsK6 = root.LessonsK6 || {};
  const L = (y, id, en, zh) => { B[y + ':' + id] = { en: pack(en), zh: pack(zh) }; };
  const pack = a => ({ intro: a[0], points: a[1], ex: a[2], tip: a[3] });

  /* ---------------- Year 7 ---------------- */
  L(7, 'numth',
    ['Every whole number can be built from smaller ones. Factors divide into a number exactly, multiples are in its times table, and primes have just two factors.',
      ['A factor divides a number with no remainder: the factors of 12 are 1, 2, 3, 4, 6 and 12.', 'A prime number has exactly two factors, 1 and itself. 2, 3, 5, 7, 11 are prime; 1 is not.', 'The highest common factor (HCF) is the biggest number that divides both. The lowest common multiple (LCM) is the smallest number that both divide into.'],
      [['Find the HCF and LCM of 12 and 18.', 'Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18. The biggest in both is 6, so HCF = 6. Multiples of 12: 12, 24, 36. 36 is also a multiple of 18, so LCM = 36.'], ['Write 60 as a product of primes.', '60 = 6 × 10 = 2 × 3 × 2 × 5, so 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5.']],
      'A quick check: HCF × LCM of two numbers equals the two numbers multiplied together (6 × 36 = 216 = 12 × 18).'],
    ['每个整数都可以由更小的数构成。因数能整除这个数，倍数在它的乘法表里，质数只有两个因数。',
      ['因数能整除一个数而没有余数：12 的因数是 1、2、3、4、6、12。', '质数只有两个因数：1 和它自己。2、3、5、7、11 是质数；1 不是质数。', '最大公因数（HCF）是能同时整除两个数的最大的数；最小公倍数（LCM）是两个数都能整除的最小的数。'],
      [['求 12 和 18 的最大公因数和最小公倍数。', '12 的因数：1、2、3、4、6、12；18 的因数：1、2、3、6、9、18。两者共有的最大的是 6，所以 HCF = 6。12 的倍数：12、24、36，36 也是 18 的倍数，所以 LCM = 36。'], ['把 60 写成质数的乘积。', '60 = 6 × 10 = 2 × 3 × 2 × 5，所以 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5。']],
      '快速检查：两个数的 HCF × LCM 等于这两个数的乘积（6 × 36 = 216 = 12 × 18）。']);

  L(7, 'int',
    ['Negative numbers are below zero on the number line. Adding moves you right, subtracting moves you left, and the signs tell you which way.',
      ['On a number line, bigger numbers are further right: −5 < −2 < 3.', 'Subtracting a negative is the same as adding: 4 − (−3) = 4 + 3 = 7.', 'Multiplying or dividing: same signs give a positive, different signs give a negative.'],
      [['Work out −6 + 9 − 5.', '−6 + 9 = 3, then 3 − 5 = −2.'], ['Work out (−4) × (−3) and 20 ÷ (−5).', 'Same signs: (−4) × (−3) = 12. Different signs: 20 ÷ (−5) = −4.']],
      'Two minus signs side by side make a plus: −(−3) is +3.'],
    ['负数在数轴上位于 0 的左边。加是向右走，减是向左走，符号告诉你方向。',
      ['在数轴上，越靠右的数越大：−5 < −2 < 3。', '减去一个负数等于加上它的相反数：4 − (−3) = 4 + 3 = 7。', '乘除法：同号得正，异号得负。'],
      [['计算 −6 + 9 − 5。', '−6 + 9 = 3，再 3 − 5 = −2。'], ['计算 (−4) × (−3) 和 20 ÷ (−5)。', '同号：(−4) × (−3) = 12。异号：20 ÷ (−5) = −4。']],
      '两个负号连在一起变成正号：−(−3) 就是 +3。']);

  L(7, 'frac',
    ['A fraction is part of a whole. Equivalent fractions name the same amount, and a common denominator lets us add and subtract.',
      ['Multiply or divide the top and bottom by the same number to get an equivalent fraction: 1/2 = 3/6.', 'To add or subtract, first give the fractions the same denominator.', 'A mixed number is a whole number and a fraction: 7/4 = 1 3/4.'],
      [['Work out 2/3 + 1/4.', 'The common denominator is 12. 2/3 = 8/12 and 1/4 = 3/12. So 8/12 + 3/12 = 11/12.'], ['Write 17/5 as a mixed number.', '17 ÷ 5 = 3 remainder 2, so 17/5 = 3 2/5.']],
      'Simplify your answer at the end by dividing the top and bottom by their HCF.'],
    ['分数表示整体的一部分。等值分数表示同一个量，通分后才能加减。',
      ['分子分母同乘或同除以一个数，得到等值分数：1/2 = 3/6。', '加减之前，先把分母变成相同的。', '带分数是整数加分数：7/4 = 1 3/4。'],
      [['计算 2/3 + 1/4。', '公分母是 12。2/3 = 8/12，1/4 = 3/12。所以 8/12 + 3/12 = 11/12。'], ['把 17/5 写成带分数。', '17 ÷ 5 = 3 余 2，所以 17/5 = 3 2/5。']],
      '最后用分子分母的最大公因数约分，把答案化到最简。']);

  L(7, 'dec',
    ['Decimals use place value to the right of the decimal point: tenths, hundredths, thousandths. They are another way to write fractions.',
      ['Line up the decimal points when adding or subtracting.', 'To multiply, ignore the points, multiply, then count the decimal places in total.', 'To round, look at the digit after the place you want: 5 or more rounds up.'],
      [['Work out 3.4 × 0.2.', '34 × 2 = 68. There are 2 decimal places altogether, so the answer is 0.68.'], ['Round 4.678 to 2 decimal places.', 'The third decimal place is 8, so round up: 4.68.']],
      'Estimate first: 3.4 × 0.2 is about 3 × 0.2 = 0.6, so 0.68 is sensible.'],
    ['小数用小数点右边的数位表示：十分位、百分位、千分位。它也是分数的另一种写法。',
      ['加减时要把小数点对齐。', '乘法先不管小数点，算出乘积，再数一共有几位小数。', '四舍五入：看要保留的数位后面那一位，5 或更大就进一。'],
      [['计算 3.4 × 0.2。', '34 × 2 = 68。一共有 2 位小数，所以结果是 0.68。'], ['把 4.678 保留 2 位小数。', '第三位小数是 8，进一：4.68。']],
      '先估算：3.4 × 0.2 约等于 3 × 0.2 = 0.6，所以 0.68 合理。']);

  L(7, 'pct',
    ['Percent means "out of 100". Fractions, decimals and percentages are three ways of writing the same amount.',
      ['50% = 50/100 = 1/2 = 0.5.', 'To find a percentage of an amount, change it to a decimal and multiply: 20% of 60 = 0.2 × 60.', 'To write one amount as a percentage of another, write a fraction and multiply by 100%.'],
      [['Find 15% of 80.', '15% = 0.15, and 0.15 × 80 = 12.'], ['Write 18 out of 24 as a percentage.', '18/24 = 3/4 = 0.75 = 75%.']],
      '10% is easy: divide by 10. Then build other percentages from it (5% is half of 10%).'],
    ['百分数的意思是“每一百份中的几份”。分数、小数和百分数是同一个量的三种写法。',
      ['50% = 50/100 = 1/2 = 0.5。', '求一个量的百分之几：把百分数化成小数再乘：60 的 20% = 0.2 × 60。', '求一个数是另一个数的百分之几：先写成分数，再乘 100%。'],
      [['求 80 的 15%。', '15% = 0.15，0.15 × 80 = 12。'], ['把 24 中的 18 写成百分数。', '18/24 = 3/4 = 0.75 = 75%。']],
      '10% 最容易：除以 10。其他百分数可以用它来凑（5% 是 10% 的一半）。']);

  L(7, 'ratio',
    ['A ratio compares amounts of the same kind. 2 : 3 means for every 2 of one thing there are 3 of the other.',
      ['Simplify a ratio by dividing both parts by their HCF: 12 : 18 = 2 : 3.', 'To share in a ratio, add the parts, find one part, then multiply.', 'Ratios have no units when both amounts are in the same unit.'],
      [['Share $60 in the ratio 2 : 3.', 'There are 2 + 3 = 5 parts. One part = 60 ÷ 5 = $12. So the shares are 2 × 12 = $24 and 3 × 12 = $36.'], ['Simplify 20 : 50.', 'Divide both by 10: 2 : 5.']],
      'Check your shares add back to the total: 24 + 36 = 60.'],
    ['比用来比较同类的量。2 : 3 表示一种东西有 2 份时，另一种有 3 份。',
      ['化简比：两项同除以它们的最大公因数：12 : 18 = 2 : 3。', '按比分配：先把各份相加，求出一份，再乘。', '两个量单位相同时，比没有单位。'],
      [['把 $60 按 2 : 3 分配。', '一共 2 + 3 = 5 份。一份 = 60 ÷ 5 = $12。所以分别得 2 × 12 = $24 和 3 × 12 = $36。'], ['化简 20 : 50。', '两项同除以 10：2 : 5。']],
      '检查：分到的各份加起来要等于总数：24 + 36 = 60。']);

  L(7, 'index',
    ['A power says how many times to multiply a number by itself: 5³ = 5 × 5 × 5. A root undoes a power.',
      ['The square of 6 is 6² = 36, so the square root of 36 is 6 (√36 = 6).', 'The cube of 2 is 2³ = 8, so the cube root of 8 is 2.', 'Order of operations: brackets, then powers and roots, then × and ÷, then + and −.'],
      [['Work out 3 + 2² × 5.', 'Powers first: 2² = 4. Then multiply: 4 × 5 = 20. Then add: 3 + 20 = 23.'], ['Find √49 + 4³.', '√49 = 7 and 4³ = 64, so the answer is 71.']],
      'A square number is a number times itself: 1, 4, 9, 16, 25, 36, … Learn them well.'],
    ['乘方表示把一个数自己乘自己几次：5³ = 5 × 5 × 5。开方是乘方的逆运算。',
      ['6 的平方是 6² = 36，所以 36 的平方根是 6（√36 = 6）。', '2 的立方是 2³ = 8，所以 8 的立方根是 2。', '运算顺序：先算括号，再算乘方和开方，再算乘除，最后算加减。'],
      [['计算 3 + 2² × 5。', '先算乘方：2² = 4。再乘：4 × 5 = 20。最后加：3 + 20 = 23。'], ['求 √49 + 4³。', '√49 = 7，4³ = 64，所以结果是 71。']],
      '平方数就是一个数乘它自己：1、4、9、16、25、36……要熟记。']);

  L(7, 'alg',
    ['Algebra uses letters called pronumerals for numbers we do not know yet. Substitute a number to find the value of an expression.',
      ['3a means 3 × a, and a² means a × a.', 'Like terms have the same letter part and can be collected: 4x + 3x = 7x.', 'To solve an equation, do the same to both sides until the pronumeral is alone.'],
      [['Find the value of 2x + 5 when x = 4.', 'Substitute x = 4: 2 × 4 + 5 = 8 + 5 = 13.'], ['Solve 3x − 4 = 11.', 'Add 4 to both sides: 3x = 15. Divide both sides by 3: x = 5.']],
      'Check by putting the answer back in: 3 × 5 − 4 = 11 ✓.'],
    ['代数用字母（未知数）表示还不知道的数。把数代进去，就能算出式子的值。',
      ['3a 表示 3 × a，a² 表示 a × a。', '同类项的字母部分相同，可以合并：4x + 3x = 7x。', '解方程：两边做同样的运算，直到字母单独在一边。'],
      [['当 x = 4 时，求 2x + 5 的值。', '代入 x = 4：2 × 4 + 5 = 8 + 5 = 13。'], ['解 3x − 4 = 11。', '两边加 4：3x = 15。两边除以 3：x = 5。']],
      '把答案代回去检查：3 × 5 − 4 = 11 ✓。']);

  L(7, 'meas',
    ['Perimeter is the distance around a shape. Area is the space inside it. We measure area in square units.',
      ['Rectangle: area = length × width. Triangle: area = ½ × base × height.', 'Parallelogram: area = base × perpendicular height.', '1 m = 100 cm, so 1 m² = 100 × 100 = 10 000 cm².'],
      [['Find the area of a triangle with base 10 cm and height 6 cm.', '½ × 10 × 6 = 30 cm².'], ['A rectangle is 8 m by 5 m. Find its perimeter.', '2 × (8 + 5) = 26 m.']],
      'The height must make a right angle with the base, not run along a slanted side.'],
    ['周长是图形一周的长度，面积是图形里面的大小，面积用平方单位。',
      ['长方形：面积 = 长 × 宽。三角形：面积 = ½ × 底 × 高。', '平行四边形：面积 = 底 × 垂直高。', '1 m = 100 cm，所以 1 m² = 100 × 100 = 10 000 cm²。'],
      [['求底 10 cm、高 6 cm 的三角形面积。', '½ × 10 × 6 = 30 cm²。'], ['一个长方形长 8 m、宽 5 m，求周长。', '2 × (8 + 5) = 26 m。']],
      '高必须和底成直角，不是沿着斜边的长度。']);

  L(7, 'angle',
    ['Angles are measured in degrees. Some angles always add to the same total, so you can find a missing one by working it out.',
      ['Angles on a straight line add to 180°; angles at a point add to 360°.', 'Vertically opposite angles are equal.', 'With parallel lines: corresponding angles are equal, alternate angles are equal, co-interior angles add to 180°.'],
      [['Two angles on a straight line are 2x and 70°. Find x.', '2x + 70 = 180, so 2x = 110 and x = 55°.'], ['A transversal cuts two parallel lines. One angle is 65°. What is its alternate angle?', 'Alternate angles are equal, so it is also 65°.']],
      'Always give a reason, such as "angles on a straight line add to 180°".'],
    ['角用度来量。有些角加起来总是同一个数，所以可以算出缺少的角。',
      ['直线上的角加起来是 180°；一点周围的角加起来是 360°。', '对顶角相等。', '平行线：同位角相等，内错角相等，同旁内角互补（加起来 180°）。'],
      [['直线上两个角分别是 2x 和 70°，求 x。', '2x + 70 = 180，所以 2x = 110，x = 55°。'], ['一条截线截两条平行线，其中一个角是 65°，它的内错角是多少？', '内错角相等，所以也是 65°。']],
      '解题时要写理由，比如“直线上的角之和是 180°”。']);

  L(7, 'stats',
    ['Statistics starts with collecting data and showing it clearly so we can see what it tells us.',
      ['A frequency table counts how many times each value occurs.', 'A column graph has gaps between the columns; a dot plot has one dot for each value.', 'Every graph needs a title, labelled axes and an equal scale.'],
      [['A table shows pets: dog 6, cat 5, fish 3. How many pets in all?', '6 + 5 + 3 = 14 pets.'], ['What fraction of the pets are dogs?', '6 out of 14, which is 3/7.']],
      'Check that the scale on a graph starts at zero, or the columns can give the wrong idea.'],
    ['统计从收集数据开始，再把数据清楚地表示出来，看它告诉我们什么。',
      ['频数表记录每个数值出现了几次。', '柱状图的柱子之间有空隙；点图每个数据画一个点。', '每个图都需要标题、标明的坐标轴和均匀的刻度。'],
      [['表格显示宠物：狗 6、猫 5、鱼 3。一共有多少只？', '6 + 5 + 3 = 14 只。'], ['狗占宠物总数的几分之几？', '14 只里有 6 只，也就是 3/7。']],
      '看图时要检查刻度是不是从 0 开始，否则柱子的高低会给人错误的印象。']);

  L(7, 'prob',
    ['Probability measures how likely an event is, from 0 (impossible) to 1 (certain).',
      ['P(event) = the number of ways it can happen ÷ the number of possible outcomes.', 'Probabilities can be written as fractions, decimals or percentages.', 'Outcomes that are equally likely have the same chance.'],
      [['A bag has 3 red and 5 blue marbles. What is the chance of picking red?', '3 red out of 8 marbles: P(red) = 3/8.'], ['What is the chance of rolling an even number on a die?', 'Even numbers: 2, 4, 6 are 3 of the 6 outcomes, so P = 3/6 = 1/2.']],
      'A probability can never be bigger than 1 or smaller than 0.'],
    ['概率表示一件事发生的可能性有多大，从 0（不可能）到 1（一定）。',
      ['事件的概率 = 事件可能发生的方式数 ÷ 所有可能结果数。', '概率可以写成分数、小数或百分数。', '可能性相同的结果，发生的机会相同。'],
      [['袋子里有 3 个红球、5 个蓝球，摸到红球的概率是多少？', '8 个球中有 3 个红球：P(红) = 3/8。'], ['掷一个骰子，出现偶数的概率是多少？', '偶数 2、4、6 共 3 种，一共 6 种结果，所以 P = 3/6 = 1/2。']],
      '概率永远不会大于 1，也不会小于 0。']);

  /* ---------------- Year 8 ---------------- */
  L(8, 'frac',
    ['To multiply fractions, multiply the tops and the bottoms. To divide, flip the second fraction and multiply.',
      ['2/3 × 3/4 = 6/12 = 1/2. Cancel common factors first to keep the numbers small.', '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6.', 'To find a fraction of an amount, divide by the denominator and multiply by the numerator.'],
      [['Find 3/5 of 40.', '40 ÷ 5 = 8, then 8 × 3 = 24.'], ['Work out 3/4 ÷ 1/2.', '3/4 × 2/1 = 6/4 = 3/2 = 1 1/2.']],
      'Dividing by a fraction gives a bigger answer when the fraction is less than 1.'],
    ['分数乘法：分子乘分子，分母乘分母。分数除法：除以一个分数，等于乘它的倒数。',
      ['2/3 × 3/4 = 6/12 = 1/2。先约分，数字就会小一些。', '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6。', '求一个量的几分之几：先除以分母，再乘分子。'],
      [['求 40 的 3/5。', '40 ÷ 5 = 8，再 8 × 3 = 24。'], ['计算 3/4 ÷ 1/2。', '3/4 × 2/1 = 6/4 = 3/2 = 1 1/2。']],
      '除以一个小于 1 的分数，结果会变大。']);

  L(8, 'pct',
    ['Percentages can describe a change. Find the change, then add it to or take it from the original amount.',
      ['Increase by 10%: multiply by 1.10. Decrease by 10%: multiply by 0.90.', 'Discount = original price × discount rate. Sale price = original price − discount.', 'Profit = selling price − cost price. Profit % = profit ÷ cost × 100%.'],
      [['A $80 jacket is on sale at 25% off. What is the sale price?', 'Discount = 0.25 × 80 = $20. Sale price = 80 − 20 = $60.'], ['A shop buys a toy for $20 and sells it for $26. Find the profit percentage.', 'Profit = 6. 6 ÷ 20 = 0.3 = 30%.']],
      'Percentage change always compares with the original amount, not the new one.'],
    ['百分数可以描述变化。先算出变化量，再加到原来的量上或从中减去。',
      ['增加 10%：乘 1.10。减少 10%：乘 0.90。', '折扣额 = 原价 × 折扣率，售价 = 原价 − 折扣额。', '利润 = 售价 − 成本，利润率 = 利润 ÷ 成本 × 100%。'],
      [['一件 $80 的外套打 75 折（减 25%），售价是多少？', '折扣额 = 0.25 × 80 = $20，售价 = 80 − 20 = $60。'], ['商店 $20 买进一个玩具，$26 卖出，利润率是多少？', '利润 = 6，6 ÷ 20 = 0.3 = 30%。']],
      '百分数的变化总是和原来的量比较，而不是和新的量比较。']);

  L(8, 'ratio',
    ['A rate compares two different kinds of quantity, such as distance and time. Speed is a rate.',
      ['Speed = distance ÷ time; distance = speed × time; time = distance ÷ speed.', 'Rates have units: km/h, $/kg, mL/min.', 'Keep the units consistent: change minutes to hours before using km/h.'],
      [['A car travels 150 km in 2 hours. What is its average speed?', '150 ÷ 2 = 75 km/h.'], ['How far does a cyclist go in 45 minutes at 16 km/h?', '45 min = 0.75 h. Distance = 16 × 0.75 = 12 km.']],
      'Use the triangle D / (S × T) to remember the three formulas.'],
    ['比率比较两种不同的量，比如路程和时间。速度就是一种比率。',
      ['速度 = 路程 ÷ 时间；路程 = 速度 × 时间；时间 = 路程 ÷ 速度。', '比率带单位：km/h、$/kg、mL/min。', '单位要统一：用 km/h 算之前，先把分钟换成小时。'],
      [['一辆车 2 小时行驶 150 km，平均速度是多少？', '150 ÷ 2 = 75 km/h。'], ['骑车人以 16 km/h 骑 45 分钟，走了多远？', '45 分钟 = 0.75 小时。路程 = 16 × 0.75 = 12 km。']],
      '可以用“路程在上，速度和时间在下”的三角形来记三个公式。']);

  L(8, 'pattern',
    ['A pattern follows a rule. A rule written with n gives any term of the pattern.',
      ['In 3, 7, 11, 15, … each term is 4 more, so the rule is "add 4".', 'The rule for the nth term is 4n − 1: for n = 1, 4 − 1 = 3.', 'A table of values (n, term) shows the pattern and helps to find the rule.'],
      [['Find the 10th term of 3, 7, 11, 15, …', 'The nth term is 4n − 1. For n = 10: 4 × 10 − 1 = 39.'], ['Find the rule for 5, 8, 11, 14, …', 'Each term is 3 more, so start with 3n. When n = 1, 3n = 3, but the term is 5, so add 2: the rule is 3n + 2.']],
      'The number you add each time is the number multiplying n.'],
    ['图案和数列遵循一个规律。用 n 写出的规律可以给出数列中任意一项。',
      ['在 3、7、11、15…… 中每项比前一项多 4，规律是“加 4”。', '第 n 项的规律是 4n − 1：n = 1 时，4 − 1 = 3。', '数值表 (n, 项) 能让规律更清楚，帮你找出公式。'],
      [['求 3、7、11、15…… 的第 10 项。', '第 n 项是 4n − 1。当 n = 10：4 × 10 − 1 = 39。'], ['求 5、8、11、14…… 的规律。', '每项多 3，所以先写 3n。n = 1 时 3n = 3，而该项是 5，所以加 2：规律是 3n + 2。']],
      '每次加的那个数，就是 n 前面的系数。']);

  L(8, 'alg',
    ['We can expand brackets and collect like terms to simplify, and solve equations and inequalities by doing the same thing to both sides.',
      ['Expand: 3(x + 4) = 3x + 12, and −2(x − 5) = −2x + 10.', 'Collect like terms: 5x + 2 + 3x − 7 = 8x − 5.', 'An inequality is solved like an equation, but reverse the sign if you multiply or divide by a negative.'],
      [['Solve 2(x + 3) = 14.', 'Expand: 2x + 6 = 14. Subtract 6: 2x = 8. Divide by 2: x = 4.'], ['Solve 3x + 1 < 10.', 'Subtract 1: 3x < 9. Divide by 3: x < 3.']],
      'Multiply every term inside the bracket, not just the first.'],
    ['可以去括号、合并同类项来化简，用对两边做同样的运算来解方程和不等式。',
      ['去括号：3(x + 4) = 3x + 12，−2(x − 5) = −2x + 10。', '合并同类项：5x + 2 + 3x − 7 = 8x − 5。', '解不等式和解方程相似，但乘或除以负数时，不等号要反向。'],
      [['解 2(x + 3) = 14。', '去括号：2x + 6 = 14。减 6：2x = 8。除以 2：x = 4。'], ['解 3x + 1 < 10。', '减 1：3x < 9。除以 3：x < 3。']],
      '括号里的每一项都要乘，不能只乘第一项。']);

  L(8, 'linear',
    ['A linear relationship makes a straight line when graphed. Each x gives one y, and y goes up (or down) by the same amount each time.',
      ['Make a table of values by putting in x = 0, 1, 2, 3, …', 'Plot the points (x, y); they lie on a straight line.', 'The rule y = 2x + 1 means y is twice x, plus 1.'],
      [['Complete the table for y = 2x + 1 for x = 0, 1, 2.', 'x = 0: y = 1; x = 1: y = 3; x = 2: y = 5.'], ['Is (3, 7) on the line y = 2x + 1?', 'Put x = 3: y = 2 × 3 + 1 = 7. Yes, (3, 7) is on the line.']],
      'Two points are enough to draw a line, but plot a third to check.'],
    ['线性关系的图像是一条直线。每个 x 对应一个 y，x 每增加一样多，y 也增加（或减少）一样多。',
      ['列数值表：代入 x = 0、1、2、3……', '描出点 (x, y)，它们在同一条直线上。', '规则 y = 2x + 1 的意思是 y 等于 x 的两倍再加 1。'],
      [['对 x = 0、1、2，完成 y = 2x + 1 的数值表。', 'x = 0 时 y = 1；x = 1 时 y = 3；x = 2 时 y = 5。'], ['点 (3, 7) 在直线 y = 2x + 1 上吗？', '代入 x = 3：y = 2 × 3 + 1 = 7，所以点 (3, 7) 在这条直线上。']],
      '两个点就能画出直线，但多描第三个点可以检查对错。']);

  L(8, 'meas',
    ['A circle has a centre, a radius and a diameter. We can find its circumference and area using π ≈ 3.14, and the volume of a prism from its base.',
      ['Circumference C = 2πr = πd. Area A = πr².', 'The area of a composite shape is the sum or difference of simpler shapes.', 'Volume of a prism = area of the base × height.'],
      [['Find the area of a circle with radius 5 cm (use π = 3.14).', 'A = π × 5² = 3.14 × 25 = 78.5 cm².'], ['A triangular prism has a base area of 12 cm² and a length of 10 cm. Find its volume.', 'V = 12 × 10 = 120 cm³.']],
      'The diameter is twice the radius: halve it before you use πr².'],
    ['圆有圆心、半径和直径。用 π ≈ 3.14 可以求圆的周长和面积，棱柱的体积由底面积求出。',
      ['周长 C = 2πr = πd，面积 A = πr²。', '组合图形的面积等于几个简单图形面积的和或差。', '棱柱的体积 = 底面积 × 高。'],
      [['求半径 5 cm 的圆的面积（取 π = 3.14）。', 'A = π × 5² = 3.14 × 25 = 78.5 cm²。'], ['一个三棱柱的底面积是 12 cm²，长 10 cm，求体积。', 'V = 12 × 10 = 120 cm³。']],
      '直径是半径的两倍：用 πr² 之前先把直径除以 2。']);

  L(8, 'angle',
    ['Triangles and quadrilaterals have angle sums we can use to find missing angles, and each shape has its own properties.',
      ['Angles in a triangle add to 180°; angles in a quadrilateral add to 360°.', 'An isosceles triangle has two equal sides and two equal angles; an equilateral triangle has three of each.', 'The exterior angle of a triangle equals the sum of the two opposite interior angles.'],
      [['Two angles of a triangle are 50° and 65°. Find the third.', '180 − 50 − 65 = 65°.'], ['Three angles of a quadrilateral are 90°, 100° and 80°. Find the fourth.', '360 − 90 − 100 − 80 = 90°.']],
      'In an isosceles triangle, the equal angles are opposite the equal sides.'],
    ['三角形和四边形的内角和是定值，可以用来求缺少的角；每种图形还有各自的性质。',
      ['三角形的内角和是 180°；四边形的内角和是 360°。', '等腰三角形有两条边相等、两个角相等；等边三角形三条边、三个角都相等。', '三角形的外角等于不相邻的两个内角之和。'],
      [['三角形的两个角是 50° 和 65°，求第三个角。', '180 − 50 − 65 = 65°。'], ['四边形的三个角是 90°、100°、80°，求第四个角。', '360 − 90 − 100 − 80 = 90°。']],
      '等腰三角形中，相等的角对着相等的边。']);

  L(8, 'pyth',
    ['In a right-angled triangle, the square on the longest side (the hypotenuse) equals the sum of the squares on the other two sides.',
      ['a² + b² = c², where c is the hypotenuse, opposite the right angle.', 'To find a shorter side, rearrange: a² = c² − b².', 'A Pythagorean triple is a set of whole numbers that fits, such as 3, 4, 5 and 5, 12, 13.'],
      [['A right-angled triangle has sides 6 and 8. Find the hypotenuse.', 'c² = 6² + 8² = 36 + 64 = 100, so c = 10.'], ['The hypotenuse is 13 and one side is 5. Find the other side.', 'b² = 13² − 5² = 169 − 25 = 144, so b = 12.']],
      'The hypotenuse is always the longest side: check that your answer is the biggest.'],
    ['在直角三角形中，斜边（最长的边）的平方等于另外两条边的平方和。',
      ['a² + b² = c²，c 是斜边，在直角的对面。', '求较短的边时，变形：a² = c² − b²。', '勾股数是满足这个关系的整数组，比如 3、4、5 和 5、12、13。'],
      [['直角三角形两条直角边是 6 和 8，求斜边。', 'c² = 6² + 8² = 36 + 64 = 100，所以 c = 10。'], ['斜边是 13，一条直角边是 5，求另一条直角边。', 'b² = 13² − 5² = 169 − 25 = 144，所以 b = 12。']],
      '斜边永远是最长的边：检查你的答案是不是最大的。']);

  L(8, 'stats',
    ['A single number can describe a whole data set. The mean, median and mode show the centre; the range shows the spread.',
      ['Mean = sum of values ÷ number of values.', 'Median = the middle value when the data are in order (the mean of the middle two if there are two).', 'Mode = the most common value. Range = highest − lowest.'],
      [['Find the mean, median and range of 3, 7, 5, 9, 6.', 'Mean = 30 ÷ 5 = 6. In order: 3, 5, 6, 7, 9, so the median is 6. Range = 9 − 3 = 6.'], ['Find the median of 2, 4, 6, 8.', 'The middle two are 4 and 6, and (4 + 6) ÷ 2 = 5.']],
      'Put the data in order before you find the median.'],
    ['一个数就能概括一组数据。平均数、中位数和众数表示数据的中心，极差表示数据的分散程度。',
      ['平均数 = 所有数据之和 ÷ 数据个数。', '中位数 = 数据按大小排列后位于中间的数（如果有两个中间数，取它们的平均）。', '众数 = 出现次数最多的数；极差 = 最大值 − 最小值。'],
      [['求 3、7、5、9、6 的平均数、中位数和极差。', '平均数 = 30 ÷ 5 = 6。排序：3、5、6、7、9，中位数是 6。极差 = 9 − 3 = 6。'], ['求 2、4、6、8 的中位数。', '中间两个数是 4 和 6，(4 + 6) ÷ 2 = 5。']],
      '求中位数之前，先把数据排好序。']);

  L(8, 'prob',
    ['We can find the chance that an event does not happen, and organise outcomes in two-way tables and Venn diagrams.',
      ['The complement of an event is "not the event": P(not A) = 1 − P(A).', 'A two-way table shows two things at once, such as year level and favourite sport.', 'A Venn diagram uses overlapping circles: the overlap holds the outcomes in both groups.'],
      [['The chance of rain is 0.3. What is the chance it does not rain?', '1 − 0.3 = 0.7.'], ['In a class of 30, 18 play tennis, 12 play soccer and 5 play both. How many play neither?', 'Either sport: 18 + 12 − 5 = 25. Neither: 30 − 25 = 5.']],
      'Probabilities of all possible outcomes add up to 1.'],
    ['我们可以求事件不发生的概率，也可以用双向表和韦恩图整理结果。',
      ['互补事件是“事件不发生”：P(非 A) = 1 − P(A)。', '双向表可以同时显示两个特征，比如年级和最喜欢的运动。', '韦恩图用相交的圆，相交部分表示两组都属于的结果。'],
      [['下雨的概率是 0.3，不下雨的概率是多少？', '1 − 0.3 = 0.7。'], ['一个班 30 人，18 人打网球，12 人踢足球，5 人两样都做。两样都不做的有多少人？', '至少做一样：18 + 12 − 5 = 25。两样都不做：30 − 25 = 5。']],
      '所有可能结果的概率加起来等于 1。']);
})(typeof window !== 'undefined' ? window : globalThis);
