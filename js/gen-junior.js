/* Years 1–3 maths (with pictures and charts where they help). d = 1..4.
   Challenging/Competitive also draw on the olympiad bank (gen-olympiad.js). */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, shuffle, mk, mc, nearNums } = G;
  const reg = (topic, minYear, maxYear, fn) => G.register('maths', topic, minYear, fn, { maxYear });
  const NAMES = [['Lily', '小莉'], ['Noah', '小诺'], ['Mia', '小米'], ['Leo', '小乐'], ['Ava', '小艾'], ['Sam', '小山']];
  const lim = y => (y <= 1 ? 20 : y === 2 ? 100 : 1000);

  /* ---------- numbers & place value ---------- */
  reg('count', 1, 3, (y, d) => {
    const k = pick(y === 1 ? ['tensOnes', 'next', 'skip'] : ['tensOnes', 'skip', 'between', 'order']);
    if (k === 'tensOnes') {
      if (y >= 3) { const h = R(1, 9), t = R(0, 9), o = R(0, 9), v = h * 100 + t * 10 + o; return mk({ topic: 'count', value: v, en: `What number has ${h} hundreds, ${t} tens and ${o} ones?`, zh: `${h} 个百、${t} 个十和 ${o} 个一组成的数是多少？`, solEn: `${h * 100} + ${t * 10} + ${o} = ${v}`, solZh: `${h * 100} + ${t * 10} + ${o} = ${v}` }); }
      const t = R(1, y === 1 ? 2 : 9), o = R(0, 9), v = t * 10 + o;
      return mk({ topic: 'count', value: v, en: `What number is ${t} tens and ${o} ones?`, zh: `${t} 个十和 ${o} 个一组成的数是多少？`, solEn: `${t * 10} + ${o} = ${v}`, solZh: `${t * 10} + ${o} = ${v}` });
    }
    if (k === 'next') { const n = R(5, 19); return mk({ topic: 'count', value: n + 1, en: `What number comes just after ${n}?`, zh: `${n} 后面的一个数是几？`, solEn: `${n} + 1 = ${n + 1}`, solZh: `${n} + 1 = ${n + 1}` }); }
    if (k === 'skip') {
      const step = pick(y === 1 ? [2, 5, 10] : y === 2 ? [2, 3, 5, 10] : [3, 4, 25, 50, 100]), s = step * R(0, 5) + (d >= 2 ? R(1, step - 1 || 1) : 0), seq = [0, 1, 2, 3].map(i => s + i * step);
      return mk({ topic: 'count', value: s + 4 * step, en: `Count on: ${seq.join(', ')}, ? What comes next?`, zh: `接着数：${seq.join('，')}，？下一个数是多少？`, solEn: `Add ${step} each time: ${s + 4 * step}`, solZh: `每次加 ${step}：${s + 4 * step}` });
    }
    if (k === 'between') { const a = R(10, lim(y) - 20), b = a + 2 * R(1, 9); return mk({ topic: 'count', value: (a + b) / 2, en: `What number is exactly halfway between ${a} and ${b}?`, zh: `${a} 和 ${b} 正中间的数是多少？`, solEn: `(${a} + ${b}) ÷ 2 = ${(a + b) / 2}`, solZh: `(${a} + ${b}) ÷ 2 = ${(a + b) / 2}` }); }
    const ds = shuffle([R(1, 9), R(0, 9), R(1, 9)]); if (new Set(ds).size < 3) return null;
    const big = Number([...ds].sort((a, b) => b - a).join(''));
    const sorted = [...ds].sort((a, b) => a - b); if (sorted[0] === 0) [sorted[0], sorted[1]] = [sorted[1], sorted[0]];
    const smallest = Number(sorted.join(''));
    const askBig = Math.random() < 0.5;
    return mk({ topic: 'count', value: askBig ? big : smallest, en: `Use the digits ${ds.join(', ')} once each to make the ${askBig ? 'largest' : 'smallest'} 3-digit number.`, zh: `用数字 ${ds.join('、')} 各一次组成${askBig ? '最大' : '最小'}的三位数。`,
      solEn: `Put the ${askBig ? 'biggest' : 'smallest non-zero'} digit in the hundreds place: ${askBig ? big : smallest}`, solZh: `${askBig ? '最大' : '最小的非零'}数字放在百位：${askBig ? big : smallest}` });
  });

  /* ---------- addition & subtraction ---------- */
  reg('add1', 1, 3, (y, d) => {
    const L = lim(y), k = pick(d === 1 ? ['add', 'sub'] : ['add', 'sub', 'missing', 'word']);
    const a = R(Math.floor(L / 10), Math.floor(L * 0.6)), b = R(1, Math.floor(L * 0.35));
    if (k === 'add') return mk({ topic: 'add1', value: a + b, en: `${a} + ${b} = ?`, zh: `${a} + ${b} = ？`, solEn: `${a} + ${b} = ${a + b}`, solZh: `${a} + ${b} = ${a + b}` });
    if (k === 'sub') return mk({ topic: 'add1', value: a - Math.min(a, b), en: `${a} − ${Math.min(a, b)} = ?`, zh: `${a} − ${Math.min(a, b)} = ？`, solEn: `${a} − ${Math.min(a, b)} = ${a - Math.min(a, b)}`, solZh: `${a} − ${Math.min(a, b)} = ${a - Math.min(a, b)}` });
    if (k === 'missing') return mk({ topic: 'add1', value: b, en: `${a} + □ = ${a + b}. What number goes in the box?`, zh: `${a} + □ = ${a + b}，方框里填几？`, solEn: `${a + b} − ${a} = ${b}`, solZh: `${a + b} − ${a} = ${b}` });
    const [P] = [pick(NAMES)], gave = Math.min(a - 1, b);
    return mk({ topic: 'add1', value: a - gave, en: `${P[0]} had ${a} stickers and gave away ${gave}. How many stickers are left?`, zh: `${P[1]}有 ${a} 张贴纸，送出 ${gave} 张，还剩几张？`, solEn: `${a} − ${gave} = ${a - gave}`, solZh: `${a} − ${gave} = ${a - gave}` });
  });

  /* ---------- multiplication & division ---------- */
  reg('mult1', 2, 3, (y, d) => {
    const tables = y === 2 ? [2, 5, 10] : [2, 3, 4, 5, 6, 8, 10], t = pick(tables), n = R(2, d >= 2 ? 12 : 10), k = pick(['times', 'groups', 'share']);
    if (k === 'times') return mk({ topic: 'mult1', value: t * n, en: `${n} × ${t} = ?`, zh: `${n} × ${t} = ？`, solEn: `${n} groups of ${t} = ${t * n}`, solZh: `${n} 个 ${t} 是 ${t * n}` });
    if (k === 'groups') return mk({ topic: 'mult1', value: t * n, en: `There are ${n} bags with ${t} apples in each bag. How many apples are there altogether?`, zh: `有 ${n} 袋苹果，每袋 ${t} 个。一共有多少个苹果？`, solEn: `${n} × ${t} = ${t * n}`, solZh: `${n} × ${t} = ${t * n}` });
    return mk({ topic: 'mult1', value: n, en: `${t * n} lollies are shared equally between ${t} children. How many does each child get?`, zh: `把 ${t * n} 颗糖平均分给 ${t} 个小朋友，每人分到几颗？`, solEn: `${t * n} ÷ ${t} = ${n}`, solZh: `${t * n} ÷ ${t} = ${n}` });
  });

  /* ---------- shapes ---------- */
  const SHAPES2 = [['triangle', '三角形', 3], ['square', '正方形', 4], ['rectangle', '长方形', 4], ['pentagon', '五边形', 5], ['hexagon', '六边形', 6], ['octagon', '八边形', 8]];
  const SOLIDS = [['cube', '正方体', 6, 12, 8], ['rectangular prism', '长方体', 6, 12, 8], ['square pyramid', '四棱锥', 5, 8, 5], ['triangular prism', '三棱柱', 5, 9, 6]];
  reg('shape1', 1, 3, (y, d) => {
    if (y >= 2 && Math.random() < 0.5) {
      const s = pick(SOLIDS), w = pick([['faces', '面', 2], ['edges', '棱', 3], ['vertices (corners)', '顶点', 4]]);
      return mk({ topic: 'shape1', value: s[w[2]], en: `How many ${w[0]} does a ${s[0]} have?`, zh: `一个${s[1]}有几个${w[1]}？`, solEn: `A ${s[0]} has ${s[2]} faces, ${s[3]} edges and ${s[4]} vertices.`, solZh: `${s[1]}有 ${s[2]} 个面、${s[3]} 条棱、${s[4]} 个顶点。` });
    }
    const a = pick(SHAPES2), b = pick(SHAPES2.filter(x => x !== a)), tot = a[2] + (d >= 2 ? b[2] : 0);
    if (Math.random() < 0.4) {   // corners
      const m = d >= 2 ? R(2, 4) : 1;
      return mk({ topic: 'shape1', value: a[2] * m, en: m > 1 ? `How many corners do ${m} ${a[0]}s have altogether?` : `How many corners does a ${a[0]} have?`, zh: m > 1 ? `${m} 个${a[1]}一共有几个角？` : `${a[1]}有几个角？`,
        solEn: m > 1 ? `${m} × ${a[2]} = ${a[2] * m}` : `A ${a[0]} has ${a[2]} corners.`, solZh: m > 1 ? `${m} × ${a[2]} = ${a[2] * m}` : `${a[1]}有 ${a[2]} 个角。` });
    }
    return mk({ topic: 'shape1', value: tot, en: d >= 2 ? `How many sides do a ${a[0]} and a ${b[0]} have altogether?` : `How many sides does a ${a[0]} have?`, zh: d >= 2 ? `一个${a[1]}和一个${b[1]}一共有几条边？` : `${a[1]}有几条边？`,
      solEn: d >= 2 ? `${a[2]} + ${b[2]} = ${tot}` : `${tot} sides`, solZh: d >= 2 ? `${a[2]} + ${b[2]} = ${tot}` : `${tot} 条边` });
  });

  /* ---------- time (clock face, multiple choice) ---------- */
  const tStr = (h, m) => ({ en: m === 0 ? `${h} o'clock` : m === 30 ? `half past ${h}` : m === 15 ? `quarter past ${h}` : m === 45 ? `quarter to ${h % 12 + 1}` : `${h}:${String(m).padStart(2, '0')}`, zh: `${h}:${String(m).padStart(2, '0')}` });
  reg('time1', 1, 3, (y, d) => {
    const step = y === 1 ? 30 : y === 2 ? 15 : 5, h = R(1, 12), m = step * R(0, 60 / step - 1);
    if (y >= 2 && d >= 2 && Math.random() < 0.4) {
      const add = pick([15, 30, 45, 60, 90]), tot = h * 60 + m + add, h2 = ((Math.floor(tot / 60) - 1) % 12) + 1, m2 = tot % 60;
      const q = mc({ topic: 'time1', en: `The clock shows the time now. What time will it be in ${add} minutes?`, zh: `钟面显示现在的时间。${add} 分钟后是几点？`,
        correct: tStr(h2, m2), wrong: [tStr(h, m), tStr((h2 % 12) + 1, m2), tStr(h2, (m2 + 15) % 60), tStr(((h2 + 10) % 12) + 1, m2)],
        solEn: `Count on ${add} minutes from ${tStr(h, m).zh}: ${tStr(h2, m2).en}`, solZh: `从 ${tStr(h, m).zh} 往后数 ${add} 分钟：${tStr(h2, m2).zh}` });
      if (q) q.fig = { type: 'clock', h, m };
      return q;
    }
    const q = mc({ topic: 'time1', en: 'What time does the clock show?', zh: '钟面上是几点？', correct: tStr(h, m),
      wrong: [tStr((h % 12) + 1, m), tStr(h, (m + step) % 60), tStr(m === 0 ? 12 : (m / 5) % 12 || 12, h * 5 % 60), tStr(((h + 10) % 12) + 1, m)],
      solEn: `The short hand points to ${m >= 30 && m > 0 ? 'just past ' : ''}${h}, the long hand to ${m} minutes: ${tStr(h, m).en}`, solZh: `时针指向 ${h}${m ? ' 过一点' : ''}，分针表示 ${m} 分：${tStr(h, m).zh}` });
    if (q) q.fig = { type: 'clock', h, m };
    return q;
  });

  /* ---------- money ---------- */
  reg('money1', 1, 3, (y, d) => {
    const coins = y === 1 ? [1, 2] : [5, 10, 20, 50], n = R(3, y === 1 ? 5 : 7), set = Array.from({ length: n }, () => pick(coins)), tot = set.reduce((a, b) => a + b, 0);
    if (y >= 2 && d >= 2 && Math.random() < 0.5) {
      const price = 5 * R(3, 19), paid = price <= 50 ? 100 : 200;
      return mk({ topic: 'money1', value: paid - price, unit: '', en: `A toy costs ${price}c. You pay with $${paid / 100}. How many cents change do you get?`, zh: `一个玩具 ${price} 分，你付了 ${paid / 100} 元，应找回多少分？`, solEn: `$${paid / 100} = ${paid}c; ${paid} − ${price} = ${paid - price}c`, solZh: `${paid / 100} 元 = ${paid} 分；${paid} − ${price} = ${paid - price} 分` });
    }
    const unit = y === 1 ? ['$', '元'] : ['c', '分'];
    return mk({ topic: 'money1', value: tot, en: `How much money is this altogether? ${set.map(c => (y === 1 ? '$' + c : c + 'c')).join(' + ')}  (${y === 1 ? 'dollars' : 'cents'})`,
      zh: `一共是多少钱？${set.map(c => c + unit[1]).join(' + ')}（单位：${unit[1]}）`, solEn: `${set.join(' + ')} = ${tot}`, solZh: `${set.join(' + ')} = ${tot}` });
  });

  /* ---------- simple fractions (with a pie picture) ---------- */
  reg('frac1', 1, 3, (y, d) => {
    const den = pick(y === 1 ? [2] : y === 2 ? [2, 4] : [2, 3, 4, 5, 8, 10]), num = y === 3 && d >= 2 ? R(1, den - 1) : 1, m = R(2, 10), amt = den * m;
    if (Math.random() < 0.5) {
      const shaded = R(1, den - 1);
      const q = mc({ topic: 'frac1', en: `What fraction of the circle is coloured blue?`, zh: '圆的几分之几涂成了蓝色？', correct: `${shaded}/${den}`,
        wrong: [`${den - shaded}/${den}`, `${shaded}/${den + 1}`, `1/${shaded + 1}`, `${shaded + 1}/${den}`].filter(s => s !== `${shaded}/${den}`), solEn: `${shaded} of ${den} equal parts: ${shaded}/${den}`, solZh: `平均分成 ${den} 份，蓝色 ${shaded} 份：${shaded}/${den}` });
      if (!q) return null;
      q.fig = { type: 'pie', values: Array(den).fill(1), labels: [], shade: shaded };
      return q;
    }
    const v = amt / den * num;
    return mk({ topic: 'frac1', value: v, en: `What is ${num === 1 ? (den === 2 ? 'half' : `one ${den === 4 ? 'quarter' : den === 3 ? 'third' : `1/${den}`}`) : `${num}/${den}`} of ${amt}?`, zh: `${amt} 的 ${num}/${den} 是多少？`, solEn: `${amt} ÷ ${den}${num > 1 ? ` × ${num}` : ''} = ${v}`, solZh: `${amt} ÷ ${den}${num > 1 ? ` × ${num}` : ''} = ${v}` });
  });

  /* ---------- reading graphs ---------- */
  const FRUIT = [['apple', '苹果'], ['banana', '香蕉'], ['grape', '葡萄'], ['orange', '橙子'], ['pear', '梨']];
  reg('graph1', 1, 3, (y, d) => {
    const cats = shuffle(FRUIT).slice(0, 4), vals = cats.map(() => R(1, y === 1 ? 6 : 9)), i = R(0, 3); let j = R(0, 3); if (j === i) j = (i + 1) % 4;
    if (y >= 2 && Math.random() < 0.5) {
      const k = pick([2, 5, 10]), v2 = vals.map(v => v * k), ask = pick(['one', 'diff', 'total']);
      const value = ask === 'one' ? v2[i] : ask === 'diff' ? Math.abs(v2[i] - v2[j]) : v2.reduce((a, b) => a + b, 0);
      return mk({ topic: 'graph1', value, fig: { type: 'bar', max: 10 * k, step: k, values: v2, cats: cats.map(c => ({ en: c[0], zh: c[1] })), yLabel: { en: 'votes', zh: '票数' } },
        en: ask === 'one' ? `The graph shows children's favourite fruit. How many children chose ${cats[i][0]}?` : ask === 'diff' ? `How many more votes did ${v2[i] >= v2[j] ? cats[i][0] : cats[j][0]} get than ${v2[i] >= v2[j] ? cats[j][0] : cats[i][0]}?` : 'How many children voted altogether?',
        zh: ask === 'one' ? `统计图表示小朋友最喜欢的水果。选${cats[i][1]}的有多少人？` : ask === 'diff' ? `${v2[i] >= v2[j] ? cats[i][1] : cats[j][1]}比${v2[i] >= v2[j] ? cats[j][1] : cats[i][1]}多多少票？` : '一共有多少人投票？',
        solEn: `Read each bar: ${cats.map((c, x) => `${c[0]} ${v2[x]}`).join(', ')}`, solZh: `读出每个直条：${cats.map((c, x) => `${c[1]} ${v2[x]}`).join('，')}` });
    }
    const ask = d >= 2 ? 'diff' : 'one', value = ask === 'one' ? vals[i] : Math.abs(vals[i] - vals[j]);
    return mk({ topic: 'graph1', value, fig: { type: 'picto', icon: '🍎', rows: cats.map((c, x) => ({ label: { en: c[0], zh: c[1] }, count: vals[x] })), key: { en: '🍎 = 1 child', zh: '🍎 = 1 人' } },
      en: ask === 'one' ? `The picture graph shows favourite fruit. How many children chose ${cats[i][0]}?` : `How many more children chose ${vals[i] >= vals[j] ? cats[i][0] : cats[j][0]} than ${vals[i] >= vals[j] ? cats[j][0] : cats[i][0]}?`,
      zh: ask === 'one' ? `象形图表示小朋友最喜欢的水果。选${cats[i][1]}的有几人？` : `选${vals[i] >= vals[j] ? cats[i][1] : cats[j][1]}的比选${vals[i] >= vals[j] ? cats[j][1] : cats[i][1]}的多几人？`,
      solEn: `Count the pictures: ${cats.map((c, x) => `${c[0]} ${vals[x]}`).join(', ')}`, solZh: `数一数：${cats.map((c, x) => `${c[1]} ${vals[x]}`).join('，')}` });
  });
})(typeof window !== 'undefined' ? window : globalThis);
