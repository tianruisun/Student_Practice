/* NSW Mathematics K–6 questions the older generators did not cover (v1.10.0, K–6 study mode).
   Year 0 is Kindergarten. Each generator takes (year, diff) like the others and keeps to what that year meets
   in the NSW sample scope and sequence (see js/scope-k6.js). Answers are numbers or multiple choice. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, shuffle, mk } = G;
  const mc = o => G.mc(Object.assign({ minWrong: 1 }, o));   // some K–6 questions have just two answers
  const reg = (topic, minYear, maxYear, fn) => G.register('maths', topic, minYear, fn, { maxYear });
  const NAMES = [['Lily', '小莉'], ['Noah', '小诺'], ['Mia', '小米'], ['Leo', '小乐'], ['Ava', '小艾'], ['Sam', '小山']];
  const THINGS = [['apples', '个苹果', '🍎'], ['stars', '颗星星', '⭐'], ['balls', '个球', '⚽'], ['fish', '条鱼', '🐟'], ['ducks', '只鸭子', '🦆'], ['cars', '辆小汽车', '🚗']];
  const row = (icon, n) => Array(n).fill(icon).join(' ');
  const both = s => ({ en: String(s), zh: String(s) });

  /* ---------- Kindergarten: counting and numbers to 20 ---------- */
  reg('kcount', 0, 0, (y, d) => {
    const k = pick(d <= 1 ? ['how', 'after', 'more'] : ['how', 'after', 'before', 'more', 'parts']);
    const th = pick(THINGS), top = d <= 1 ? 10 : 20;
    if (k === 'how') {
      const n = R(2, d <= 1 ? 8 : 12);
      return mk({ topic: 'kcount', value: n, en: `How many ${th[0]}? ${row(th[2], n)}`, zh: `有几${th[1]}？${row(th[2], n)}`,
        solEn: `Touch and count each one once: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}. There are ${n}.`, solZh: `每个只数一次：${Array.from({ length: n }, (_, i) => i + 1).join('、')}，一共 ${n}${th[1].slice(0, 1)}。` });
    }
    if (k === 'after') { const n = R(1, top - 1); return mk({ topic: 'kcount', value: n + 1, en: `What number comes just after ${n}?`, zh: `${n} 后面的一个数是几？`, solEn: `Count on one: ${n}, ${n + 1}`, solZh: `往后数一个：${n}，${n + 1}` }); }
    if (k === 'before') { const n = R(2, top); return mk({ topic: 'kcount', value: n - 1, en: `What number comes just before ${n}?`, zh: `${n} 前面的一个数是几？`, solEn: `Count back one: ${n}, ${n - 1}`, solZh: `往前数一个：${n}，${n - 1}` }); }
    if (k === 'more') {
      const a = R(1, 9), b = R(1, 9); if (a === b) return null;
      const t2 = pick(THINGS.filter(x => x !== th)), more = Math.random() < 0.5;
      const big = a > b ? th : t2, small = a > b ? t2 : th, ans = more ? big : small;
      return mc({ topic: 'kcount', en: `Which group has ${more ? 'more' : 'fewer'}?  ${row(th[2], a)}   or   ${row(t2[2], b)}`, zh: `哪一组${more ? '多' : '少'}？  ${row(th[2], a)}   还是   ${row(t2[2], b)}`,
        correct: { en: ans[0], zh: ans[1].replace(/^[个颗条只辆]/, '') }, wrong: [{ en: (ans === big ? small : big)[0], zh: (ans === big ? small : big)[1].replace(/^[个颗条只辆]/, '') }],
        solEn: `There are ${a} ${th[0]} and ${b} ${t2[0]}. ${Math.max(a, b)} is more than ${Math.min(a, b)}.`, solZh: `${th[1].replace(/^[个颗条只辆]/, '')} ${a} 个，${t2[1].replace(/^[个颗条只辆]/, '')} ${b} 个。${Math.max(a, b)} 比 ${Math.min(a, b)} 多。` });
    }
    const w = pick([5, 6, 7, 8, 9, 10]), a = R(1, w - 1);
    return mk({ topic: 'kcount', value: w - a, en: `${w} is ${a} and how many more?`, zh: `${w} 可以分成 ${a} 和几？`, solEn: `${a} + ${w - a} = ${w}`, solZh: `${a} + ${w - a} = ${w}` });
  });

  /* ---------- Kindergarten: adding more and taking away (within 10) ---------- */
  reg('kaddsub', 0, 0, (y, d) => {
    const P = pick(NAMES), th = pick(THINGS), top = d <= 1 ? 6 : 10, a = R(1, top - 1), b = R(1, top - a), add = Math.random() < 0.55;
    if (d >= 2 && Math.random() < 0.3) return mk({ topic: 'kaddsub', value: b, en: `${a} + ? = ${a + b}`, zh: `${a} + ？ = ${a + b}`, solEn: `Count on from ${a} to ${a + b}: that is ${b} more.`, solZh: `从 ${a} 数到 ${a + b}，多了 ${b}。` });
    if (add) return mk({ topic: 'kaddsub', value: a + b, en: `${P[0]} has ${a} ${th[0]}. ${P[0]} gets ${b} more. How many now?`, zh: `${P[1]}有 ${a} ${th[1]}，又得到 ${b} ${th[1]}。现在有几${th[1]}？`, solEn: `${a} and ${b} more: ${a} + ${b} = ${a + b}`, solZh: `${a} 再添 ${b}：${a} + ${b} = ${a + b}` });
    const s = a + b;
    return mk({ topic: 'kaddsub', value: s - b, en: `There are ${s} ${th[0]}. ${b} go away. How many are left?`, zh: `有 ${s} ${th[1]}，走了 ${b} ${th[1]}，还剩几${th[1]}？`, solEn: `${s} take away ${b}: ${s} − ${b} = ${s - b}`, solZh: `${s} 去掉 ${b}：${s} − ${b} = ${s - b}` });
  });

  /* ---------- Kindergarten and Year 1: sharing, equal groups, skip counting ---------- */
  reg('kshare', 0, 1, (y, d) => {
    const k = pick(y === 0 ? ['share', 'groups'] : ['share', 'groups', 'skip', 'skip']);
    const th = pick(THINGS.filter(x => x[0] !== 'fish' && x[0] !== 'ducks'));   // things you can hand out or put in a box
    if (k === 'share') {
      const kids = pick(y === 0 ? [2, 3] : [2, 3, 4, 5]), each = R(1, y === 0 ? 4 : 5), tot = kids * each;
      return mk({ topic: 'kshare', value: each, en: `Share ${tot} ${th[0]} equally between ${kids} children. How many does each child get?`, zh: `把 ${tot} ${th[1]}平均分给 ${kids} 个小朋友，每人分到几${th[1]}？`,
        solEn: `Give one each in turn until none are left: each child gets ${each}. (${kids} × ${each} = ${tot})`, solZh: `一人一个轮流分，分完为止：每人 ${each}${th[1].slice(0, 1)}。（${kids} × ${each} = ${tot}）` });
    }
    if (k === 'groups') {
      const g = R(2, y === 0 ? 3 : 5), e = R(2, y === 0 ? 3 : 5);
      return mk({ topic: 'kshare', value: g * e, en: `There are ${g} boxes with ${e} ${th[0]} in each box. How many ${th[0]} altogether?`, zh: `有 ${g} 个盒子，每个盒子里有 ${e} ${th[1]}。一共有几${th[1]}？`,
        solEn: `Count the groups: ${Array.from({ length: g }, (_, i) => e * (i + 1)).join(', ')}. That is ${g * e}.`, solZh: `一组一组地数：${Array.from({ length: g }, (_, i) => e * (i + 1)).join('、')}，一共 ${g * e}。` });
    }
    const step = pick([2, 5, 10]), s = step * R(0, 4), seq = [0, 1, 2, 3].map(i => s + i * step);
    return mk({ topic: 'kshare', value: s + 4 * step, en: `Skip count by ${step}s: ${seq.join(', ')}, ? What comes next?`, zh: `${step} 个 ${step} 个地数：${seq.join('，')}，？下一个是几？`, solEn: `Add ${step} each time: ${seq[3]} + ${step} = ${s + 4 * step}`, solZh: `每次加 ${step}：${seq[3]} + ${step} = ${s + 4 * step}` });
  });

  /* ---------- Kindergarten: repeating patterns ---------- */
  const PAT = [['🔴', 'red', '红色'], ['🔵', 'blue', '蓝色'], ['🟡', 'yellow', '黄色'], ['🟢', 'green', '绿色']];
  reg('kpattern', 0, 0, (y, d) => {
    const len = d <= 1 ? 2 : pick([2, 3]), unit = shuffle(PAT).slice(0, len), shown = R(2, 3) * len + R(0, len - 1);
    const seq = Array.from({ length: shown }, (_, i) => unit[i % len]), next = unit[shown % len];
    return mc({ topic: 'kpattern', en: `What comes next in the pattern?  ${seq.map(s => s[0]).join(' ')}  ?`, zh: `接下来是什么？  ${seq.map(s => s[0]).join(' ')}  ？`,
      correct: { en: `${next[0]} ${next[1]}`, zh: `${next[0]} ${next[2]}` }, wrong: PAT.filter(p => p !== next).map(p => ({ en: `${p[0]} ${p[1]}`, zh: `${p[0]} ${p[2]}` })),
      solEn: `The part that repeats is ${unit.map(s => s[0]).join(' ')}. After ${seq[shown - 1][0]} comes ${next[0]}.`, solZh: `重复的一组是 ${unit.map(s => s[0]).join(' ')}。${seq[shown - 1][0]} 后面是 ${next[0]}。` });
  });

  /* ---------- Kindergarten and Year 1: 2D shapes and 3D objects ---------- */
  const FLAT = [['circle', '圆', 0, 0], ['triangle', '三角形', 3, 3], ['square', '正方形', 4, 4], ['rectangle', '长方形', 4, 4]];
  const SOLID = [['ball (sphere)', '球', 'roll'], ['box (rectangular prism)', '盒子（长方体）', 'stack'], ['can (cylinder)', '罐子（圆柱）', 'both'], ['dice (cube)', '骰子（正方体）', 'stack']];
  reg('kshape', 0, 1, (y, d) => {
    if (y >= 1 && Math.random() < 0.45) {
      const ask = pick(['roll', 'stack']), right = SOLID.filter(s => s[2] === ask || s[2] === 'both'), wrongs = SOLID.filter(s => !right.includes(s));
      const c = pick(right.filter(s => s[2] === ask));
      return mc({ topic: 'kshape', en: ask === 'roll' ? 'Which object rolls but cannot be stacked flat?' : 'Which object can be stacked flat but does not roll?', zh: ask === 'roll' ? '哪个物体会滚动，但不能平稳地叠起来？' : '哪个物体能平稳地叠起来，但不会滚动？',
        correct: { en: c[0], zh: c[1] }, wrong: wrongs.concat(right.filter(s => s[2] === 'both')).map(s => ({ en: s[0], zh: s[1] })),
        solEn: ask === 'roll' ? 'A ball has one curved surface and no flat face, so it rolls but will not stack.' : 'A box or a dice has only flat faces, so it stacks but does not roll.', solZh: ask === 'roll' ? '球只有一个曲面，没有平的面，所以会滚动，但叠不稳。' : '盒子和骰子都是平的面，能叠起来，但不会滚动。' });
    }
    const s = pick(FLAT.filter(f => f[0] !== 'circle' || d <= 2)), sq = s[0] === 'square' || s[0] === 'rectangle';
    if (s[0] === 'circle' || Math.random() < 0.5) {
      const clue = s[0] === 'circle' ? { en: 'It is round and has no corners and no straight sides.', zh: '它是圆圆的，没有角，也没有直的边。' }
        : s[0] === 'triangle' ? { en: 'It has 3 straight sides and 3 corners.', zh: '它有 3 条直的边和 3 个角。' }
          : s[0] === 'square' ? { en: 'It has 4 straight sides that are all the same length.', zh: '它有 4 条一样长的直边。' } : { en: 'It has 4 straight sides: 2 long and 2 short.', zh: '它有 4 条直边：两条长，两条短。' };
      return mc({ topic: 'kshape', en: `Which shape am I? ${clue.en}`, zh: `我是什么图形？${clue.zh}`, correct: { en: s[0], zh: s[1] }, wrong: FLAT.filter(f => f !== s).map(f => ({ en: f[0], zh: f[1] })),
        solEn: `${clue.en} That is a ${s[0]}.`, solZh: `${clue.zh}所以是${s[1]}。` });
    }
    const w = pick([['sides', '条边'], ['corners', '个角']]);
    return mk({ topic: 'kshape', value: s[2], en: `How many ${w[0]} does a ${s[0]} have?`, zh: `${s[1]}有几${w[1]}？`,
      solEn: `Count around the ${s[0]}: ${s[2]}.${sq ? ' A square and a rectangle both have 4.' : ''}`, solZh: `沿着${s[1]}数一圈：${s[2]}。` });
  });

  /* ---------- measuring: length, area, volume and capacity (K–3) ---------- */
  const LONG = [['a bus', '公共汽车'], ['a door', '门'], ['a table', '桌子'], ['a bed', '床']], SHORT = [['a pencil', '铅笔'], ['a spoon', '勺子'], ['a crayon', '蜡笔'], ['a key', '钥匙']];
  reg('kmeas', 0, 3, (y, d) => {
    if (y === 0) {
      const k = pick(['long', 'holds']);
      if (k === 'long') {
        const L = pick(LONG), S = pick(SHORT), askLong = Math.random() < 0.5;
        return mc({ topic: 'kmeas', en: `Which is ${askLong ? 'longer' : 'shorter'}?`, zh: `哪个更${askLong ? '长' : '短'}？`, correct: askLong ? { en: L[0], zh: L[1] } : { en: S[0], zh: S[1] }, wrong: [askLong ? { en: S[0], zh: S[1] } : { en: L[0], zh: L[1] }],
          solEn: `Put them side by side with the ends lined up: ${L[0]} goes much further than ${S[0]}.`, solZh: `把一端对齐放在一起比：${L[1]}比${S[1]}长得多。` });
      }
      const big = pick([['a bath', '浴缸'], ['a bucket', '水桶']]), small = pick([['a cup', '杯子'], ['an egg cup', '蛋杯']]);
      return mc({ topic: 'kmeas', en: 'Which holds more water?', zh: '哪个能装更多的水？', correct: { en: big[0], zh: big[1] }, wrong: [{ en: small[0], zh: small[1] }],
        solEn: `If you pour the full ${small[0].replace(/^an? /, '')} into ${big[0]}, it does not fill it, so ${big[0]} holds more.`, solZh: `把装满水的${small[1]}倒进${big[1]}，装不满，所以${big[1]}装得多。` });
    }
    if (y === 1) {
      const u = pick([['paper clips', '个回形针'], ['blocks', '块积木'], ['hand spans', '拃']]), a = R(4, 12), b = R(2, a - 1), k = pick(['diff', 'total']);
      if (k === 'diff') return mk({ topic: 'kmeas', value: a - b, en: `A ruler is ${a} ${u[0]} long. A pencil is ${b} ${u[0]} long. How many ${u[0]} longer is the ruler?`, zh: `尺子有 ${a} ${u[1]}长，铅笔有 ${b} ${u[1]}长。尺子比铅笔长几${u[1]}？`, solEn: `${a} − ${b} = ${a - b}`, solZh: `${a} − ${b} = ${a - b}` });
      return mk({ topic: 'kmeas', value: a + b, en: `Two sticks are laid end to end. One is ${a} ${u[0]} long, the other ${b} ${u[0]}. How long are they together?`, zh: `两根小棒首尾相接，一根长 ${a} ${u[1]}，另一根长 ${b} ${u[1]}，合起来有多长（几${u[1]}）？`, solEn: `${a} + ${b} = ${a + b}`, solZh: `${a} + ${b} = ${a + b}` });
    }
    if (y === 2) {
      const k = pick(['rows', 'cm', 'unit']);
      if (k === 'rows') { const r = R(2, 5), c = R(2, 6); return mk({ topic: 'kmeas', value: r * c, en: `A rectangle is covered by ${r} rows of squares with ${c} squares in each row. How many squares cover it?`, zh: `一个长方形铺了 ${r} 行小正方形，每行 ${c} 个。一共铺了几个小正方形？`, solEn: `${r} rows of ${c}: ${Array.from({ length: r }, () => c).join(' + ')} = ${r * c}`, solZh: `${r} 行，每行 ${c} 个：${Array.from({ length: r }, () => c).join(' + ')} = ${r * c}` }); }
      if (k === 'cm') { const a = R(20, 90), b = R(5, a - 5); return mk({ topic: 'kmeas', value: a - b, unit: 'cm', en: `A ribbon is ${a} cm long. ${b} cm is cut off. How long is the ribbon now (cm)?`, zh: `一条丝带长 ${a} 厘米，剪掉 ${b} 厘米，还剩多长（厘米）？`, solEn: `${a} − ${b} = ${a - b} cm`, solZh: `${a} − ${b} = ${a - b} 厘米` }); }
      const it = pick([['the length of a pencil', '铅笔的长度', 'cm'], ['the height of a door', '门的高度', 'm'], ['the length of a playground', '操场的长度', 'm'], ['the width of a book', '书的宽度', 'cm']]);
      return mc({ topic: 'kmeas', en: `Which unit is best for measuring ${it[0]}?`, zh: `测量${it[1]}，用哪个单位最合适？`, correct: it[2] === 'cm' ? { en: 'centimetres (cm)', zh: '厘米（cm）' } : { en: 'metres (m)', zh: '米（m）' }, wrong: [it[2] === 'cm' ? { en: 'metres (m)', zh: '米（m）' } : { en: 'centimetres (cm)', zh: '厘米（cm）' }],
        solEn: it[2] === 'cm' ? 'It is short, much less than a metre, so centimetres fit.' : 'It is long, about a metre or more, so metres fit.', solZh: it[2] === 'cm' ? '它很短，比 1 米短得多，用厘米合适。' : '它比较长，大约 1 米或更长，用米合适。' });
    }
    const k = pick(['mcm', 'cmmm', 'area', 'litre']);
    if (k === 'mcm') { const m = R(1, 5), c = R(5, 95); return mk({ topic: 'kmeas', value: m * 100 + c, unit: 'cm', en: `How many centimetres is ${m} m ${c} cm?`, zh: `${m} 米 ${c} 厘米是多少厘米？`, solEn: `1 m = 100 cm, so ${m} m = ${m * 100} cm; ${m * 100} + ${c} = ${m * 100 + c} cm`, solZh: `1 米 = 100 厘米，${m} 米 = ${m * 100} 厘米；${m * 100} + ${c} = ${m * 100 + c} 厘米` }); }
    if (k === 'cmmm') { const c = R(2, 15), mm = R(1, 9); return mk({ topic: 'kmeas', value: c * 10 + mm, unit: 'mm', en: `How many millimetres is ${c} cm ${mm} mm?`, zh: `${c} 厘米 ${mm} 毫米是多少毫米？`, solEn: `1 cm = 10 mm, so ${c} cm = ${c * 10} mm; ${c * 10} + ${mm} = ${c * 10 + mm} mm`, solZh: `1 厘米 = 10 毫米；${c * 10} + ${mm} = ${c * 10 + mm} 毫米` }); }
    if (k === 'area') { const a = R(2, 9), b = R(2, 9); return mk({ topic: 'kmeas', value: a * b, unit: 'cm²', en: `A rectangle is covered by 1 cm squares: ${a} rows of ${b}. What is its area (cm²)?`, zh: `一个长方形铺满了边长 1 厘米的小正方形：${a} 行，每行 ${b} 个。面积是多少平方厘米？`, solEn: `${a} × ${b} = ${a * b} squares, so ${a * b} cm²`, solZh: `${a} × ${b} = ${a * b} 个，所以是 ${a * b} 平方厘米` }); }
    const cups = pick([2, 4, 5]), L = R(2, 6);
    return mk({ topic: 'kmeas', value: cups * L, en: `${cups} cups of water fill a 1 litre jug. How many cups fill ${L} litres?`, zh: `${cups} 杯水能装满 1 升的水壶。装满 ${L} 升要几杯？`, solEn: `${L} × ${cups} = ${cups * L} cups`, solZh: `${L} × ${cups} = ${cups * L} 杯` });
  });

  /* ---------- mass (K–6) ---------- */
  reg('kmass', 0, 6, (y, d) => {
    if (y === 0) {
      const hv = pick([['a watermelon', '西瓜'], ['a schoolbag full of books', '装满书的书包'], ['a brick', '砖头']]), lt = pick([['a feather', '羽毛'], ['a leaf', '树叶'], ['a balloon', '气球']]), askH = Math.random() < 0.5;
      return mc({ topic: 'kmass', en: `Which is ${askH ? 'heavier' : 'lighter'}?`, zh: `哪个更${askH ? '重' : '轻'}？`, correct: askH ? { en: hv[0], zh: hv[1] } : { en: lt[0], zh: lt[1] }, wrong: [askH ? { en: lt[0], zh: lt[1] } : { en: hv[0], zh: hv[1] }],
        solEn: `Hold one in each hand: ${hv[0]} pulls your hand down more, so ${askH ? 'it is heavier' : lt[0] + ' is lighter'}.`, solZh: `一只手拿一个：${hv[1]}让手往下沉得多，所以${askH ? '它更重' : lt[1] + '更轻'}。` });
    }
    if (y <= 2) {
      const a = R(2, 6), n = R(2, y === 1 ? 3 : 5);
      if (y === 2 && Math.random() < 0.5) {
        const A = R(4, 15), B = R(2, A - 1);
        return mk({ topic: 'kmass', value: A - B, en: `On a balance, a book weighs the same as ${A} blocks and an apple weighs the same as ${B} blocks. How many more blocks is the book?`, zh: `用天平称：一本书和 ${A} 块积木一样重，一个苹果和 ${B} 块积木一样重。书比苹果重几块积木？`, solEn: `${A} − ${B} = ${A - B}`, solZh: `${A} − ${B} = ${A - B}` });
      }
      const toy = pick([['toy car', 'toy cars', '辆玩具车'], ['apple', 'apples', '个苹果'], ['teddy bear', 'teddy bears', '只玩具熊'], ['book', 'books', '本书']]), unit = pick([['blocks', '块积木'], ['marbles', '颗弹珠'], ['cubes', '个小方块']]);
      return mk({ topic: 'kmass', value: a * n, en: `On an equal-arm balance, 1 ${toy[0]} balances ${a} ${unit[0]}. How many ${unit[0]} balance ${n} ${toy[1]}?`, zh: `在等臂天平上，1 ${toy[2]}和 ${a} ${unit[1]}一样重。${n} ${toy[2]}和几${unit[1]}一样重？`, solEn: `${n} × ${a} = ${a * n} ${unit[0]}`, solZh: `${n} × ${a} = ${a * n}` });
    }
    if (y === 3) {
      if (Math.random() < 0.5) { const g = 50 * R(10, 30); if (g === 1000) return null; const heavier = g > 1000; return mc({ topic: 'kmass', en: `Which is heavier: 1 kg or ${g} g?`, zh: `哪个更重：1 千克还是 ${g} 克？`, correct: heavier ? `${g} g` : '1 kg', wrong: [heavier ? '1 kg' : `${g} g`], solEn: `1 kg = 1000 g, and ${g} g is ${heavier ? 'more' : 'less'} than 1000 g.`, solZh: `1 千克 = 1000 克，${g} 克比 1000 克${heavier ? '多' : '少'}。` }); }
      const k = R(2, 9); return mk({ topic: 'kmass', value: k * 1000, unit: 'g', en: `How many grams are in ${k} kg?`, zh: `${k} 千克是多少克？`, solEn: `1 kg = 1000 g, so ${k} kg = ${k * 1000} g`, solZh: `1 千克 = 1000 克，所以 ${k} 千克 = ${k * 1000} 克` });
    }
    if (y === 4) {
      const lo = R(1, 8), step = pick([[2, 'halfway', '正中间', 500], [4, 'one quarter of the way', '四分之一处', 250], [4, 'three quarters of the way', '四分之三处', 750], [10, 'one tenth of the way', '十分之一处', 100]]);
      return mk({ topic: 'kmass', value: lo * 1000 + step[3], unit: 'g', en: `The needle on a kitchen scale is ${step[1]} from ${lo} kg to ${lo + 1} kg. What is the mass in grams?`, zh: `厨房秤的指针在 ${lo} 千克到 ${lo + 1} 千克之间的${step[2]}。质量是多少克？`, solEn: `Each kilogram is 1000 g; ${step[1]} across is ${step[3]} g, so ${lo * 1000} + ${step[3]} = ${lo * 1000 + step[3]} g`, solZh: `1 千克 = 1000 克，${step[2]}是 ${step[3]} 克：${lo * 1000} + ${step[3]} = ${lo * 1000 + step[3]} 克` });
    }
    const kg = R(11, 99) / (y === 5 ? 10 : 100 / (d >= 2 ? 1 : 10)), g = Math.round(kg * 1000), toG = y === 5 || Math.random() < 0.5;
    if (toG) return mk({ topic: 'kmass', value: g, unit: 'g', en: `Write ${kg} kg in grams.`, zh: `${kg} 千克 = ？克`, solEn: `× 1000: ${kg} × 1000 = ${g} g`, solZh: `乘 1000：${kg} × 1000 = ${g} 克` });
    return mk({ topic: 'kmass', value: kg, unit: 'kg', en: `Write ${g} g in kilograms.`, zh: `${g} 克 = ？千克`, solEn: `÷ 1000: ${g} ÷ 1000 = ${kg} kg`, solZh: `除以 1000：${g} ÷ 1000 = ${kg} 千克` });
  });

  /* ---------- time (K–1 and 4–6; Years 2–3 use time1) ---------- */
  const DAYS = [['Monday', '星期一'], ['Tuesday', '星期二'], ['Wednesday', '星期三'], ['Thursday', '星期四'], ['Friday', '星期五'], ['Saturday', '星期六'], ['Sunday', '星期日']];
  const MONTHS = [['January', '一月'], ['February', '二月'], ['March', '三月'], ['April', '四月'], ['May', '五月'], ['June', '六月'], ['July', '七月'], ['August', '八月'], ['September', '九月'], ['October', '十月'], ['November', '十一月'], ['December', '十二月']];
  const p2 = n => String(n).padStart(2, '0');
  const ampm = (h24, m) => { const h = h24 % 12 || 12; return `${h}:${p2(m)} ${h24 < 12 ? 'am' : 'pm'}`; };
  const ampmZh = (h24, m) => `${h24 < 12 ? '上午' : '下午'} ${h24 % 12 || 12}:${p2(m)}`;
  reg('ktime', 0, 6, (y, d) => {
    if (y <= 1) {
      if (Math.random() < 0.5) {
        const list = y === 0 ? DAYS : MONTHS, i = R(0, list.length - 1), after = Math.random() < 0.6, j = (i + (after ? 1 : list.length - 1)) % list.length;
        const wrong = shuffle(list.filter((_, x) => x !== j)).slice(0, 3);
        return mc({ topic: 'ktime', en: `Which ${y === 0 ? 'day' : 'month'} comes just ${after ? 'after' : 'before'} ${list[i][0]}?`, zh: `${list[i][1]}${after ? '后面' : '前面'}的一个${y === 0 ? '' : '月份'}是哪个？`,
          correct: { en: list[j][0], zh: list[j][1] }, wrong: wrong.map(w => ({ en: w[0], zh: w[1] })), solEn: `In order: … ${list[(j + list.length - 1) % list.length][0]}, ${list[j][0]}, ${list[(j + 1) % list.length][0]} …`, solZh: `按顺序：……${list[(j + list.length - 1) % list.length][1]}、${list[j][1]}、${list[(j + 1) % list.length][1]}……` });
      }
      const h = R(1, 12), m = y === 0 ? 0 : pick([0, 30]), say = mm => (mm === 0 ? { en: `${h} o'clock`, zh: `${h} 点` } : { en: `half past ${h}`, zh: `${h} 点半` });
      const q = mc({ topic: 'ktime', en: 'What time does the clock show?', zh: '钟面上是几点？', correct: say(m), wrong: [{ en: `${h % 12 + 1} o'clock`, zh: `${h % 12 + 1} 点` }, { en: `half past ${h % 12 + 1}`, zh: `${h % 12 + 1} 点半` }, { en: `${(h + 5) % 12 + 1} o'clock`, zh: `${(h + 5) % 12 + 1} 点` }, { en: `half past ${(h + 9) % 12 + 1}`, zh: `${(h + 9) % 12 + 1} 点半` }].filter(w => w.en !== say(m).en),
        solEn: m === 0 ? `The long hand points straight up to 12 and the short hand points to ${h}: ${h} o'clock.` : `The long hand points down to 6 (half way round) and the short hand is just past ${h}: half past ${h}.`, solZh: m === 0 ? `分针指向 12，时针指向 ${h}：${h} 点。` : `分针指向 6（转了半圈），时针刚过 ${h}：${h} 点半。` });
      if (q) q.fig = { type: 'clock', h, m };
      return q;
    }
    if (y === 4) {
      const h24 = R(1, 22), m = 5 * R(0, 11), k = pick(['ampm', 'later']);
      if (k === 'ampm') {
        const what = h24 < 12 ? pick([['eating breakfast', '吃早饭']]) : pick([['eating dinner', '吃晚饭'], ['coming home from school', '放学回家']]);
        if ((what[0] === 'eating breakfast' && (h24 < 6 || h24 > 9)) || (what[0] === 'eating dinner' && (h24 < 17 || h24 > 20)) || (what[0] === 'coming home from school' && (h24 < 15 || h24 > 16))) return null;
        return mc({ topic: 'ktime', en: `Ella is ${what[0]} at ${h24 % 12 || 12}:${p2(m)}. Is that am or pm?`, zh: `艾拉在 ${h24 % 12 || 12}:${p2(m)} ${what[1]}。这是上午（am）还是下午（pm）？`, correct: h24 < 12 ? { en: 'am', zh: '上午（am）' } : { en: 'pm', zh: '下午（pm）' }, wrong: [h24 < 12 ? { en: 'pm', zh: '下午（pm）' } : { en: 'am', zh: '上午（am）' }],
          solEn: 'am is from midnight to midday; pm is from midday to midnight.', solZh: 'am 是从午夜到中午，pm 是从中午到午夜。' });
      }
      const add = pick([15, 20, 30, 45, 50]), tot = (h24 * 60 + m + add) % 1440, H = Math.floor(tot / 60), M = tot % 60;
      return mc({ topic: 'ktime', en: `A digital clock shows ${ampm(h24, m)}. What time will it show ${add} minutes later?`, zh: `电子钟显示 ${ampmZh(h24, m)}。${add} 分钟后显示几点？`, correct: { en: ampm(H, M), zh: ampmZh(H, M) },
        wrong: [[H, (M + 10) % 60], [(H + 1) % 24, M], [h24, (m + add) % 60], [(H + 12) % 24, M]].map(([a, b]) => ({ en: ampm(a, b), zh: ampmZh(a, b) })), solEn: `Count on ${add} minutes from ${ampm(h24, m)}: ${ampm(H, M)}`, solZh: `从 ${ampmZh(h24, m)} 往后数 ${add} 分钟：${ampmZh(H, M)}` });
    }
    const h24 = R(0, 23), m = 5 * R(0, 11);
    if (y === 5 || Math.random() < 0.4) {
      const to24 = Math.random() < 0.5, val = `${p2(h24)}:${p2(m)}`;
      if (to24) return mc({ topic: 'ktime', en: `Write ${ampm(h24, m)} in 24-hour time.`, zh: `把 ${ampmZh(h24, m)} 写成 24 小时制。`, correct: val, wrong: [`${p2((h24 + 12) % 24)}:${p2(m)}`, `${p2(h24 % 12 || 12)}:${p2(m)}`, `${p2((h24 + 1) % 24)}:${p2(m)}`, `${p2(h24)}:${p2((m + 30) % 60)}`].filter(w => w !== val),
        solEn: h24 === 12 ? `12 pm is midday: the hour stays 12, so ${val}.` : h24 > 12 ? `pm times after midday: add 12 to the hour (${h24 - 12} + 12 = ${h24}), so ${val}.` : `am times keep the hour${h24 === 0 ? ', but 12 midnight is 00' : ''}: ${val}.`, solZh: h24 === 12 ? `中午 12 点，小时数还是 12：${val}。` : h24 > 12 ? `下午的时间，小时数加 12：${val}。` : `上午的时间，小时数不变${h24 === 0 ? '（午夜 12 点写作 00）' : ''}：${val}。` });
      return mc({ topic: 'ktime', en: `Write ${val} in 12-hour time.`, zh: `把 ${val} 写成 12 小时制。`, correct: { en: ampm(h24, m), zh: ampmZh(h24, m) }, wrong: [{ en: ampm((h24 + 12) % 24, m), zh: ampmZh((h24 + 12) % 24, m) }, { en: ampm((h24 + 2) % 24, m), zh: ampmZh((h24 + 2) % 24, m) }, { en: ampm((h24 + 14) % 24, m), zh: ampmZh((h24 + 14) % 24, m) }],
        solEn: h24 === 12 ? `12 is midday: the hour stays 12, and it is pm: ${ampm(h24, m)}.` : h24 > 12 ? `${p2(h24)} is after 12, so take away 12 (${h24} − 12 = ${h24 - 12}) and use pm: ${ampm(h24, m)}.` : h24 === 0 ? `00 is midnight: write it as 12, and it is am: ${ampm(h24, m)}.` : `${p2(h24)} is before 12, so it is am: ${ampm(h24, m)}.`,
        solZh: h24 === 12 ? `中午 12 点，小时数不变，是下午：${ampmZh(h24, m)}。` : h24 > 12 ? `${p2(h24)} 大于 12，减去 12（${h24} − 12 = ${h24 - 12}），是下午：${ampmZh(h24, m)}。` : h24 === 0 ? `00 点是午夜，写作 12，是上午：${ampmZh(h24, m)}。` : `${p2(h24)} 小于 12，是上午：${ampmZh(h24, m)}。` });
    }
    const s = R(6, 15) * 60 + 5 * R(0, 11), dur = 5 * R(7, d >= 2 ? 40 : 24), e = s + dur, fmt = v => `${p2(Math.floor(v / 60))}:${p2(v % 60)}`;
    return mk({ topic: 'ktime', value: dur, unit: 'min', en: `A train leaves at ${fmt(s)} and arrives at ${fmt(e)}. How many minutes is the trip?`, zh: `火车 ${fmt(s)} 出发，${fmt(e)} 到达。路上用了多少分钟？`,
      solEn: `From ${fmt(s)} to ${fmt(e)}: ${Math.floor(dur / 60)} h ${dur % 60} min = ${dur} minutes`, solZh: `从 ${fmt(s)} 到 ${fmt(e)}：${Math.floor(dur / 60)} 小时 ${dur % 60} 分 = ${dur} 分钟` });
  });

  /* ---------- chance (Years 1–6) ---------- */
  const SURE = [['The sun will rise tomorrow.', '明天太阳会升起。', 'will'], ['It will snow in Sydney in summer.', '悉尼夏天会下雪。', 'wont'], ['You will roll a 7 on a normal dice.', '用普通骰子掷出 7。', 'wont'], ['It will rain next week.', '下周会下雨。', 'might'], ['A tossed coin lands on heads.', '抛硬币，正面朝上。', 'might'], ['Tuesday comes after Monday.', '星期一后面是星期二。', 'will'], ['A cat will fly to school.', '一只猫会飞去上学。', 'wont'], ['Christmas Day is in December.', '圣诞节在十二月。', 'will'], ['You will see a bird today.', '你今天会看到一只鸟。', 'might'], ['A dice shows a number from 1 to 6.', '骰子掷出 1 到 6 中的一个数。', 'will'], ['A dog will grow wings.', '一只狗会长出翅膀。', 'wont'], ['Your friend will wear red tomorrow.', '你的朋友明天会穿红色的衣服。', 'might']];
  const SAY = { will: ['will happen', '一定会发生'], might: ['might happen', '可能会发生'], wont: ["won't happen", '不可能发生'] };
  reg('kchance', 1, 6, (y, d) => {
    if (y === 1 && Math.random() < 0.5) {
      const e = pick(SURE), ok = e[2] !== 'wont';
      return mc({ topic: 'kchance', en: `"${e[0]}" Is this possible or impossible?`, zh: `“${e[1]}”这件事可能发生，还是不可能发生？`, correct: ok ? { en: 'possible', zh: '可能发生' } : { en: 'impossible', zh: '不可能发生' }, wrong: [ok ? { en: 'impossible', zh: '不可能发生' } : { en: 'possible', zh: '可能发生' }],
        solEn: ok ? 'It can happen, so it is possible.' : 'It can never happen, so it is impossible.', solZh: ok ? '它能发生，所以是可能的。' : '它永远不会发生，所以是不可能的。' });
    }
    if (y === 1 || (y === 3 && Math.random() < 0.5)) {
      const it = pick([['a coin is tossed', '抛一枚硬币', 2, 'heads, tails', '正面、反面'], ['a normal dice is rolled', '掷一个普通骰子', 6, '1, 2, 3, 4, 5, 6', '1、2、3、4、5、6'], ['a spinner with 4 equal parts (red, blue, green, yellow) is spun', '转动一个平均分成 4 份（红、蓝、绿、黄）的转盘', 4, 'red, blue, green, yellow', '红、蓝、绿、黄'], ['a spinner with 3 parts (red, blue, green) is spun', '转动一个有 3 个部分（红、蓝、绿）的转盘', 3, 'red, blue, green', '红、蓝、绿'], ['you pick a day of the week at random', '随便选一星期中的某一天', 7, 'Monday to Sunday', '星期一到星期日'], ['one counter is taken from a bag of red, blue, green, yellow and white counters', '从装有红、蓝、绿、黄、白五种颜色筹码的袋子里摸一个', 5, 'red, blue, green, yellow, white', '红、蓝、绿、黄、白'], ['you pick a month of the year at random', '随便选一年中的某个月', 12, 'January to December', '一月到十二月'], ['a counter is taken from a bag of red and blue counters', '从装有红色和蓝色筹码的袋子里摸一个', 2, 'red, blue', '红、蓝'], ['a letter is picked from the word CAT', '从单词 CAT 里选一个字母', 3, 'C, A, T', 'C、A、T'], ['a number is picked from 1 to 10', '从 1 到 10 中选一个数', 10, '1, 2, 3, … 10', '1、2、3、……10']]);
      return mk({ topic: 'kchance', value: it[2], en: `When ${it[0]}, how many different outcomes are possible?`, zh: `${it[1]}，一共有几种可能的结果？`, solEn: `List them: ${it[3]}. That is ${it[2]}.`, solZh: `列出来：${it[4]}，一共 ${it[2]} 种。` });
    }
    if (y <= 3) {
      const e = pick(SURE);
      return mc({ topic: 'kchance', en: `"${e[0]}" Will it happen, might it happen, or won't it happen?`, zh: `“${e[1]}”这件事一定会发生、可能会发生，还是不可能发生？`, correct: { en: SAY[e[2]][0], zh: SAY[e[2]][1] }, wrong: Object.keys(SAY).filter(k => k !== e[2]).map(k => ({ en: SAY[k][0], zh: SAY[k][1] })),
        solEn: e[2] === 'will' ? 'It always happens, so it will happen.' : e[2] === 'wont' ? 'It is impossible, so it won\'t happen.' : 'It can go either way, so it might happen.', solZh: e[2] === 'will' ? '它每次都会发生，所以一定会发生。' : e[2] === 'wont' ? '这是不可能的，所以不可能发生。' : '可能发生也可能不发生，所以是可能会发生。' });
    }
    const r = R(1, 7), b = R(1, 7); if (r === b) return null;
    const tot = r + b, askRed = Math.random() < 0.5, mine = askRed ? r : b;
    if (y === 4) {
      return mc({ topic: 'kchance', en: `A bag has ${r} red and ${b} blue counters. You pick one without looking. Is picking ${askRed ? 'red' : 'blue'} likely or unlikely?`, zh: `袋子里有 ${r} 个红色和 ${b} 个蓝色的筹码。不看的情况下摸一个，摸到${askRed ? '红色' : '蓝色'}是很可能还是不太可能？`,
        correct: mine * 2 > tot ? { en: 'likely', zh: '很可能' } : { en: 'unlikely', zh: '不太可能' }, wrong: [mine * 2 > tot ? { en: 'unlikely', zh: '不太可能' } : { en: 'likely', zh: '很可能' }],
        solEn: `${mine} of the ${tot} counters are ${askRed ? 'red' : 'blue'}: ${mine * 2 > tot ? 'more than half, so likely' : 'less than half, so unlikely'}.`, solZh: `${tot} 个里有 ${mine} 个是${askRed ? '红色' : '蓝色'}：${mine * 2 > tot ? '超过一半，所以很可能' : '不到一半，所以不太可能'}。` });
    }
    if (y === 6 && Math.random() < 0.5) {
      const parts = pick([4, 5, 10]), red = R(1, parts - 1), spins = parts * R(4, 10);
      return mk({ topic: 'kchance', value: spins * red / parts, en: `A spinner has ${parts} equal parts and ${red} of them are red. It is spun ${spins} times. About how many times would you expect red?`, zh: `转盘平均分成 ${parts} 份，其中 ${red} 份是红色。转 ${spins} 次，预计大约有几次停在红色？`,
        solEn: `P(red) = ${red}/${parts}; ${red}/${parts} of ${spins} = ${spins * red / parts}`, solZh: `停在红色的可能性是 ${red}/${parts}；${spins} × ${red}/${parts} = ${spins * red / parts}` });
    }
    return mk({ topic: 'kchance', value: mine / tot, answer: G.fracStr(mine, tot), en: `A bag has ${r} red and ${b} blue counters. One is picked at random. What is the probability it is ${askRed ? 'red' : 'blue'}? (fraction)`, zh: `袋子里有 ${r} 个红色和 ${b} 个蓝色的筹码，随机摸一个。摸到${askRed ? '红色' : '蓝色'}的可能性是多少？（用分数表示）`,
      solEn: `${mine} ${askRed ? 'red' : 'blue'} out of ${tot} counters: ${G.fracStr(mine, tot)}`, solZh: `${tot} 个中有 ${mine} 个${askRed ? '红色' : '蓝色'}：${G.fracStr(mine, tot)}` });
  });

  /* ---------- turns, angles, symmetry and position (Years 2–6) ---------- */
  const SYM = [['square', '正方形', 4], ['rectangle', '长方形', 2], ['equilateral triangle', '等边三角形', 3], ['regular hexagon', '正六边形', 6], ['circle', '圆', 'many']];
  reg('kspace', 2, 6, (y, d) => {
    if (y <= 3) {
      if (Math.random() < 0.5) { const q = R(1, 3); return mk({ topic: 'kspace', value: q * 90, unit: '°', en: `How many degrees is ${q === 1 ? 'a quarter turn' : q === 2 ? 'a half turn' : 'three quarter turns'}? (A full turn is 360°.)`, zh: `${q === 1 ? '转四分之一圈' : q === 2 ? '转半圈' : '转四分之三圈'}是多少度？（转一整圈是 360°。）`, solEn: `360 ÷ 4 = 90 for each quarter: ${q} × 90 = ${q * 90}°`, solZh: `每四分之一圈是 360 ÷ 4 = 90°：${q} × 90 = ${q * 90}°` }); }
      const from = R(0, 3), turns = R(1, 3), dir = Math.random() < 0.5, F = [['north', '北'], ['east', '东'], ['south', '南'], ['west', '西']], to = (from + (dir ? turns : 4 - turns)) % 4;
      return mc({ topic: 'kspace', en: `Sam faces ${F[from][0]} and makes ${turns} quarter turn${turns > 1 ? 's' : ''} ${dir ? 'clockwise' : 'anticlockwise'}. Which way does Sam face now?`, zh: `小山面向${F[from][1]}，${dir ? '顺时针' : '逆时针'}转了 ${turns} 个四分之一圈。现在面向哪个方向？`, correct: { en: F[to][0], zh: F[to][1] }, wrong: F.filter((_, i) => i !== to).map(f => ({ en: f[0], zh: f[1] })),
        solEn: `Clockwise goes north → east → south → west. ${turns} step${turns > 1 ? 's' : ''} ${dir ? 'clockwise' : 'anticlockwise'} from ${F[from][0]}: ${F[to][0]}.`, solZh: `顺时针的顺序是 北 → 东 → 南 → 西。从${F[from][1]}${dir ? '顺时针' : '逆时针'}转 ${turns} 步：${F[to][1]}。` });
    }
    if (y === 4) {
      if (Math.random() < 0.5) { const s = pick(SYM.filter(x => x[2] !== 'many')); return mk({ topic: 'kspace', value: s[2], en: `How many lines of symmetry does a ${s[0]} have?`, zh: `${s[1]}有几条对称轴？`, solEn: `Fold it so the halves match: a ${s[0]} has ${s[2]}.`, solZh: `对折后两边能完全重合的折痕就是对称轴：${s[1]}有 ${s[2]} 条。` }); }
      const a = R(10, 170); if (a === 90) return null;
      return mc({ topic: 'kspace', en: `An angle is ${a}°. Is it smaller than, equal to, or bigger than a right angle?`, zh: `一个角是 ${a}°。它比直角小、等于直角，还是比直角大？`, correct: a < 90 ? { en: 'smaller than a right angle', zh: '比直角小' } : { en: 'bigger than a right angle', zh: '比直角大' }, wrong: [a < 90 ? { en: 'bigger than a right angle', zh: '比直角大' } : { en: 'smaller than a right angle', zh: '比直角小' }, { en: 'equal to a right angle', zh: '等于直角' }],
        solEn: `A right angle is 90°. ${a}° is ${a < 90 ? 'less' : 'more'} than 90°.`, solZh: `直角是 90°，${a}° ${a < 90 ? '小于' : '大于'} 90°。` });
    }
    if (y === 5 && Math.random() < 0.5) {
      const a = pick([R(5, 85), 90, R(95, 175), 180, R(185, 355)]), name = a < 90 ? ['acute', '锐角'] : a === 90 ? ['right', '直角'] : a < 180 ? ['obtuse', '钝角'] : a === 180 ? ['straight', '平角'] : ['reflex', '优角（大于平角的角）'];
      return mc({ topic: 'kspace', en: `What kind of angle is ${a}°?`, zh: `${a}° 是什么角？`, correct: { en: name[0], zh: name[1] }, wrong: [['acute', '锐角'], ['right', '直角'], ['obtuse', '钝角'], ['straight', '平角'], ['reflex', '优角（大于平角的角）']].filter(n => n[0] !== name[0]).map(n => ({ en: n[0], zh: n[1] })),
        solEn: 'acute < 90° = right < obtuse < 180° = straight < reflex < 360°', solZh: '锐角 < 90° = 直角 < 钝角 < 180° = 平角 < 优角 < 360°' });
    }
    const x = y === 6 ? R(-6, 6) : R(0, 8), yy = y === 6 ? R(-6, 6) : R(0, 8), ax = x >= 0 ? `${x} to the right` : `${-x} to the left`, ay = yy >= 0 ? `${yy} up` : `${-yy} down`;
    const right = `(${x}, ${yy})`;
    if (right === '(0, 0)') return null;
    return mc({ topic: 'kspace', en: `Start at the origin (0, 0). Move ${ax} and ${ay}. Which point are you at?`, zh: `从原点 (0, 0) 出发，${x >= 0 ? `向右 ${x}` : `向左 ${-x}`}，再${yy >= 0 ? `向上 ${yy}` : `向下 ${-yy}`}。到达哪个点？`, correct: right,
      wrong: [`(${yy}, ${x})`, `(${-x}, ${yy})`, `(${x}, ${-yy})`, `(${x + 1}, ${yy})`].filter(w => w !== right), solEn: `Across first (x = ${x}), then up or down (y = ${yy}): ${right}`, solZh: `先横（x = ${x}），后竖（y = ${yy}）：${right}` });
  });

  /* ---------- order of operations (Year 6) ---------- */
  reg('kops', 6, 6, (y, d) => {
    const a = R(2, 20), b = R(2, 9), c = R(2, 9), k = pick(d <= 1 ? ['mulfirst', 'bracket'] : ['mulfirst', 'bracket', 'divfirst', 'two']);
    if (k === 'mulfirst') return mk({ topic: 'kops', value: a + b * c, en: `${a} + ${b} × ${c} = ?`, zh: `${a} + ${b} × ${c} = ？`, solEn: `Multiply first: ${b} × ${c} = ${b * c}; then ${a} + ${b * c} = ${a + b * c}`, solZh: `先算乘法：${b} × ${c} = ${b * c}；再算 ${a} + ${b * c} = ${a + b * c}` });
    if (k === 'bracket') return mk({ topic: 'kops', value: (a + b) * c, en: `(${a} + ${b}) × ${c} = ?`, zh: `(${a} + ${b}) × ${c} = ？`, solEn: `Brackets first: ${a} + ${b} = ${a + b}; then × ${c} = ${(a + b) * c}`, solZh: `先算括号：${a} + ${b} = ${a + b}；再乘 ${c}，得 ${(a + b) * c}` });
    if (k === 'divfirst') { const t = b * c; return mk({ topic: 'kops', value: a * 2 - c, en: `${a * 2} − ${t} ÷ ${b} = ?`, zh: `${a * 2} − ${t} ÷ ${b} = ？`, solEn: `Divide first: ${t} ÷ ${b} = ${c}; then ${a * 2} − ${c} = ${a * 2 - c}`, solZh: `先算除法：${t} ÷ ${b} = ${c}；再算 ${a * 2} − ${c} = ${a * 2 - c}` }); }
    return mk({ topic: 'kops', value: a * b - c, en: `${a} × ${b} − ${c * 2} + ${c} = ?`, zh: `${a} × ${b} − ${c * 2} + ${c} = ？`, solEn: `× first: ${a * b}; then left to right: ${a * b} − ${c * 2} = ${a * b - c * 2}, + ${c} = ${a * b - c}`, solZh: `先算乘法得 ${a * b}，再从左往右：${a * b} − ${c * 2} = ${a * b - c * 2}，+ ${c} = ${a * b - c}` });
  });

  /* ---------- reading data (K and Years 5–6) ---------- */
  reg('kdata', 0, 6, (y, d) => {
    if (y === 0) {
      const a = pick(THINGS), b = pick(THINGS.filter(x => x !== a)), na = R(1, 6), nb = R(1, 6);
      return mk({ topic: 'kdata', value: na + nb, en: `Toys are sorted into two rows:  ${row(a[2], na)}   |   ${row(b[2], nb)}   How many toys altogether?`, zh: `把玩具分成两排：  ${row(a[2], na)}   |   ${row(b[2], nb)}   一共有几个？`, solEn: `${na} and ${nb}: ${na} + ${nb} = ${na + nb}`, solZh: `${na} 和 ${nb}：${na} + ${nb} = ${na + nb}` });
    }
    const it = y === 5 ? pick([['how the temperature changed over one day', '一天中气温是怎样变化的', 'line graph', '折线图'], ['how many children chose each favourite sport', '每种最喜欢的运动各有几个人选', 'column (bar) graph', '条形统计图'], ['the share of a class that walks, rides or drives to school, as parts of the whole class', '全班步行、骑车和坐车上学的人各占全班的多少', 'pie (sector) graph', '扇形统计图']])
      : pick([['A graph of sales starts its scale at 90 instead of 0, so a small rise looks huge.', '一张销量图的纵轴从 90 开始而不是从 0 开始，所以小小的增长看起来很大。', 'misleading', '有误导'], ['An online poll asked only 5 people, then said "Most Australians agree".', '一个网上调查只问了 5 个人，就说“大多数澳大利亚人都同意”。', 'misleading', '有误导'], ['A survey asked 500 randomly chosen students the same question and showed all the results.', '一个调查随机选了 500 名学生，问同一个问题，并公布了全部结果。', 'fair', '公平可信']]);
    if (y === 5) return mc({ topic: 'kdata', en: `Which graph is best for showing ${it[0]}?`, zh: `要表示${it[1]}，用哪种统计图最好？`, correct: { en: it[2], zh: it[3] }, wrong: [['line graph', '折线图'], ['column (bar) graph', '条形统计图'], ['pie (sector) graph', '扇形统计图']].filter(g => g[0] !== it[2]).map(g => ({ en: g[0], zh: g[1] })),
      solEn: 'Line graphs show change over time; column graphs compare separate groups; pie graphs show parts of a whole.', solZh: '折线图表示随时间的变化；条形图比较不同的类别；扇形图表示部分占整体的多少。' });
    return mc({ topic: 'kdata', en: `${it[0]} Is this a fair way to show data, or misleading?`, zh: `${it[1]}这样展示数据公平可信，还是有误导？`, correct: { en: it[2], zh: it[3] }, wrong: [it[2] === 'fair' ? { en: 'misleading', zh: '有误导' } : { en: 'fair', zh: '公平可信' }],
      solEn: it[2] === 'fair' ? 'Many people, chosen at random, with all the results shown: that is fair.' : 'A cut-off scale or a tiny sample can make data look like it says more than it does.', solZh: it[2] === 'fair' ? '人数多、随机选择、公布全部结果，这样是公平的。' : '截断的坐标轴或很小的样本，都会让数据看起来说明了更多。' });
  });
})(typeof window !== 'undefined' ? window : globalThis);
