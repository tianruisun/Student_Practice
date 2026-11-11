/* Competition / tutoring-centre problems (奥数 · Australian Maths Competition · AMC/AIME-lite).
   Used for difficulty 3 (Challenging) and 4 (Competitive). Every answer is computed by brute force
   (enumeration, simulation or exact arithmetic) so it is correct by construction.
   Bands: J = Years 1–3, P = Years 4–6, H = Years 7–10, S = Years 11–12 (incl. Extension 1 & 2). */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, gcd, lcm, MINUS, fracStr, mk } = G;

  const band = y => (y <= 3 ? 'J' : y <= 6 ? 'P' : y <= 10 ? 'H' : 'S');
  const digits = n => String(Math.abs(n)).split('').map(Number);
  const dsum = n => digits(n).reduce((a, b) => a + b, 0);
  const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const modpow = (b, e, m) => { let r = 1n, x = BigInt(b) % BigInt(m), k = BigInt(e); const M = BigInt(m); while (k > 0n) { if (k & 1n) r = r * x % M; x = x * x % M; k >>= 1n; } return Number(r); };
  const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const count = (a, b, f) => { let c = 0; for (let i = a; i <= b; i++) if (f(i)) c++; return c; };
  const NAMES = [['Tom', '小汤'], ['Ann', '小安'], ['Max', '小马'], ['Ivy', '小薇'], ['Sam', '小山'], ['Zoe', '小佐']];
  const two = () => { const a = pick(NAMES); let b = pick(NAMES); while (b === a) b = pick(NAMES); return [a, b]; };
  const ord = n => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');

  const T = [];
  /* bands, minD (3 = Challenging, 4 = Competitive), tags = related practice topics */
  const add = (bands, minD, tags, fn) => T.push({ bands, minD, tags, fn });
  const Q = o => mk(Object.assign({ topic: 'olymp' }, o));

  /* ====================== J: Years 1–3 ====================== */
  add('J', 3, ['add1', 'word'], () => {   // ages
    const [A, B] = two(), b = R(3, 9), gap = R(1, 5), yrs = R(1, 4), sum = (b + gap + yrs) + (b + yrs);
    return Q({ value: b, en: `${A[0]} is ${gap} years older than ${B[0]}. In ${yrs} years their ages will add up to ${sum}. How old is ${B[0]} now?`,
      zh: `${A[1]}比${B[1]}大 ${gap} 岁。${yrs} 年后两人年龄之和是 ${sum} 岁。${B[1]}现在几岁？`,
      solEn: `Now their ages add to ${sum} − 2 × ${yrs} = ${sum - 2 * yrs}; ${B[0]} = (${sum - 2 * yrs} − ${gap}) ÷ 2 = ${b}`, solZh: `现在年龄和 ${sum} − 2 × ${yrs} = ${sum - 2 * yrs}；${B[1]} = (${sum - 2 * yrs} − ${gap}) ÷ 2 = ${b}` });
  });
  add('J', 3, ['add1', 'word'], () => {   // legs puzzle
    const c = R(1, 6), d = R(1, 6), heads = c + d, legs = 2 * c + 4 * d;
    return Q({ value: d, en: `In a yard there are hens and dogs. There are ${heads} heads and ${legs} legs. How many dogs are there?`, zh: `院子里有鸡和狗，一共 ${heads} 个头，${legs} 条腿。有几只狗？`,
      solEn: `If all were hens: ${2 * heads} legs. Each dog adds 2 more: (${legs} − ${2 * heads}) ÷ 2 = ${d}`, solZh: `假设全是鸡：${2 * heads} 条腿；每只狗多 2 条：(${legs} − ${2 * heads}) ÷ 2 = ${d}` });
  });
  add('J', 3, ['count', 'pattern'], () => {   // two-digit numbers with digit sum
    const S = R(4, 12), v = count(10, 99, n => dsum(n) === S);
    return Q({ value: v, en: `How many two-digit numbers have digits that add up to ${S}?`, zh: `有多少个两位数的各位数字之和是 ${S}？`,
      solEn: `List them: ${Array.from({ length: 90 }, (_, i) => i + 10).filter(n => dsum(n) === S).join(', ')} → ${v}`, solZh: `一一列出：${Array.from({ length: 90 }, (_, i) => i + 10).filter(n => dsum(n) === S).join('、')}，共 ${v} 个` });
  });
  add('J', 4, ['word', 'add1'], () => {   // snail in a well
    const up = R(3, 5), down = R(1, up - 1), h = R(up + 4, 20); let pos = 0, day = 0;
    while (true) { day++; pos += up; if (pos >= h) break; pos -= down; }
    return Q({ value: day, en: `A snail is at the bottom of a well ${h} m deep. Each day it climbs ${up} m, and each night it slides back ${down} m. On which day does it reach the top?`,
      zh: `一只蜗牛在 ${h} 米深的井底，白天向上爬 ${up} 米，晚上滑下 ${down} 米。第几天它能爬到井口？`,
      solEn: `Each full day it gains ${up - down} m, but on the last day it does not slide back. It reaches ${h} m on day ${day}.`, solZh: `每天净升 ${up - down} 米，但最后一天爬到井口就不再下滑。第 ${day} 天到达。` });
  });
  add('J', 4, ['count', 'pattern'], () => {   // 1,2,2,3,3,3,...
    const n = R(12, 40); let k = 1, c = 0; while (c + k < n) { c += k; k++; }
    return Q({ value: k, en: `In the pattern 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, … each number n is written n times. What is the ${ord(n)} number?`, zh: `数列 1，2，2，3，3，3，4，4，4，4，……中，每个数 n 写 n 次。第 ${n} 个数是几？`,
      solEn: `1 + 2 + … + ${k - 1} = ${c} numbers come before the ${k}s, so number ${n} is ${k}`, solZh: `前面的 1 到 ${k - 1} 共 ${c} 个数，所以第 ${n} 个数是 ${k}` });
  });
  add('J', 4, ['money1', 'add1'], () => {   // ways to pay with coins
    const N = 5 * R(4, 10); let w = 0; for (let a = 0; a * 5 <= N; a++) for (let b = 0; a * 5 + b * 10 <= N; b++) if ((N - a * 5 - b * 10) % 20 === 0) w++;
    return Q({ value: w, en: `How many different ways can you make ${N} cents using only 5c, 10c and 20c coins?`, zh: `只用 5 分、10 分、20 分的硬币凑出 ${N} 分，有多少种不同的方法？`,
      solEn: `Count by the number of 20c coins, then 10c coins: ${w} ways`, solZh: `按 20 分硬币的个数分类，再数 10 分硬币的个数：共 ${w} 种` });
  });
  add('J', 3, ['add1', 'pattern'], () => {   // handshakes
    const n = R(4, 8), v = n * (n - 1) / 2;
    return Q({ value: v, en: `${n} children each shake hands once with every other child. How many handshakes are there?`, zh: `${n} 个小朋友每两人都握一次手，一共握手多少次？`,
      solEn: `${n - 1} + ${n - 2} + … + 1 = ${v}`, solZh: `${n - 1} + ${n - 2} + … + 1 = ${v}` });
  });

  /* ====================== P: Years 4–6 ====================== */
  add('PJ', 3, ['numth', 'pattern'], () => {   // digits to number pages
    const N = R(40, 400); let c = 0; for (let i = 1; i <= N; i++) c += String(i).length;
    return Q({ value: c, en: `How many digits are needed to number the pages of a book from 1 to ${N}?`, zh: `给一本书从第 1 页编到第 ${N} 页，一共要用多少个数字？`,
      solEn: `Pages 1–9: 9; 10–99: 180${N >= 100 ? `; 100–${N}: ${(N - 99) * 3}` : ''} → ${c}`, solZh: `1–9 页 9 个；10–99 页 180 个${N >= 100 ? `；100–${N} 页 ${(N - 99) * 3} 个` : ''}，共 ${c} 个` });
  });
  add('P', 3, ['numth', 'pattern'], () => {   // how many times digit d appears
    const d = R(1, 9), N = R(50, 300); let c = 0; for (let i = 1; i <= N; i++) c += digits(i).filter(x => x === d).length;
    return Q({ value: c, en: `When all the whole numbers from 1 to ${N} are written down, how many times is the digit ${d} written?`, zh: `把 1 到 ${N} 的所有整数都写出来，数字 ${d} 一共出现多少次？`,
      solEn: `Count the ${d}s in the ones place, tens place and hundreds place separately → ${c}`, solZh: `分别数个位、十位、百位上的 ${d} → 共 ${c} 次` });
  });
  add('PH', 3, ['numth', 'index'], () => {   // units digit of a power
    const a = pick([2, 3, 7, 8, 13, 17, 19, 23]), n = R(20, 2025), v = modpow(a, n, 10);
    return Q({ value: v, en: `What is the units (ones) digit of ${a}^${n}?`, zh: `${a}^${n} 的个位数字是几？`,
      solEn: `Units digits of powers of ${a} repeat in a cycle of ${[1, 2, 3, 4].find(k => modpow(a, k, 10) === 1 && k > 0) || 4}; ${n} gives ${v}`, solZh: `${a} 的幂的个位数字按周期循环，第 ${n} 次方的个位是 ${v}` });
  });
  add('PH', 4, ['numth', 'mental'], () => {   // trailing zeros of n!
    const n = R(25, 250); let z = 0; for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p);
    return Q({ value: z, en: `How many zeros are at the end of ${n}! = 1 × 2 × 3 × … × ${n}?`, zh: `${n}! = 1 × 2 × 3 × … × ${n} 的末尾有多少个连续的 0？`,
      solEn: `Count factors of 5: ⌊${n}/5⌋ + ⌊${n}/25⌋${n >= 125 ? ` + ⌊${n}/125⌋` : ''} = ${z}`, solZh: `数因数 5 的个数：⌊${n}/5⌋ + ⌊${n}/25⌋${n >= 125 ? ` + ⌊${n}/125⌋` : ''} = ${z}` });
  });
  add('PH', 4, ['numth'], () => {   // smallest number with three different remainders
    const [a, b, c] = pick([[3, 4, 5], [3, 5, 7], [4, 5, 6], [5, 7, 9], [3, 7, 8], [4, 7, 9]]), ra = R(1, a - 1), rb = R(1, b - 1), rc = R(1, c - 1);
    const L = lcm(lcm(a, b), c); let n = 1; while (n <= L && !(n % a === ra && n % b === rb && n % c === rc)) n++;
    if (n > L || n > 600) return null;   // no solution (moduli share a factor) or too large
    return Q({ value: n, en: `What is the smallest whole number that leaves remainder ${ra} when divided by ${a}, remainder ${rb} when divided by ${b}, and remainder ${rc} when divided by ${c}?`,
      zh: `一个数除以 ${a} 余 ${ra}，除以 ${b} 余 ${rb}，除以 ${c} 余 ${rc}。这个数最小是多少？`,
      solEn: `List numbers with remainder ${rc} mod ${c} and test the other two conditions: ${n}`, solZh: `从除以 ${c} 余 ${rc} 的数中逐个检验另外两个条件：${n}` });
  });
  add('P', 3, ['numth', 'mental'], () => {   // sum of 2-digit multiples of a but not b
    const a = pick([3, 4, 6, 7]), b = pick([2, 5, 9].filter(x => x !== a)); let s = 0; for (let n = 10; n <= 99; n++) if (n % a === 0 && n % b !== 0) s += n;
    return Q({ value: s, en: `Find the sum of all two-digit numbers that are multiples of ${a} but not multiples of ${b}.`, zh: `求所有是 ${a} 的倍数但不是 ${b} 的倍数的两位数之和。`,
      solEn: `(sum of two-digit multiples of ${a}) − (sum of two-digit multiples of ${lcm(a, b)}) = ${s}`, solZh: `（${a} 的倍数之和）−（${lcm(a, b)} 的倍数之和）= ${s}` });
  });
  add('PJ', 3, ['prob', 'word'], () => {   // pigeonhole socks
    const k = R(3, 6), m = R(2, 4), v = k * (m - 1) + 1;
    return Q({ value: v, en: `A drawer has many socks in ${k} different colours. In the dark, what is the smallest number of socks you must take to be sure of getting ${m} socks of the same colour?`,
      zh: `抽屉里有 ${k} 种颜色的袜子各很多只。摸黑取袜子，至少要取几只才能保证有 ${m} 只同色？`,
      solEn: `Worst case: ${m - 1} of each colour = ${k * (m - 1)}; one more guarantees it → ${v}`, solZh: `最坏情况每种颜色各取 ${m - 1} 只，共 ${k * (m - 1)} 只，再取 1 只即可：${v}` });
  });
  add('P', 4, ['numth', 'word'], () => {   // 2-digit numbers equal to k × digit sum
    const k = pick([3, 4, 5, 6, 7, 8]), list = []; for (let n = 10; n <= 99; n++) if (n === k * dsum(n)) list.push(n);
    if (!list.length) return null;
    return Q({ value: list.reduce((a, b) => a + b, 0), en: `Find the sum of all two-digit numbers that are exactly ${k} times the sum of their digits.`, zh: `求所有恰好等于其各位数字之和 ${k} 倍的两位数的和。`,
      solEn: `10a + b = ${k}(a + b) → ${10 - k}a = ${k - 1}b: ${list.join(', ')}`, solZh: `10a + b = ${k}(a + b)，即 ${10 - k}a = ${k - 1}b：${list.join('、')}` });
  });
  add('PH', 3, ['numth', 'prob'], () => {   // divisible by a or b
    const a = pick([3, 4, 6]), b = pick([5, 7, 10]), N = R(100, 500), v = count(1, N, n => n % a === 0 || n % b === 0);
    return Q({ value: v, en: `How many whole numbers from 1 to ${N} are divisible by ${a} or by ${b} (or both)?`, zh: `1 到 ${N} 中，能被 ${a} 或 ${b} 整除的整数有多少个？`,
      solEn: `⌊${N}/${a}⌋ + ⌊${N}/${b}⌋ − ⌊${N}/${lcm(a, b)}⌋ = ${Math.floor(N / a)} + ${Math.floor(N / b)} − ${Math.floor(N / lcm(a, b))} = ${v}`, solZh: `容斥原理：${Math.floor(N / a)} + ${Math.floor(N / b)} − ${Math.floor(N / lcm(a, b))} = ${v}` });
  });
  add('P', 4, ['word', 'ratio'], () => {   // two trains passing
    const L1 = R(10, 30) * 10, L2 = R(10, 30) * 10, v1 = R(10, 25), v2 = R(10, 25), t = (L1 + L2) / (v1 + v2);
    if (!Number.isInteger(t)) return null;
    return Q({ value: t, unit: 's', en: `A train ${L1} m long travelling at ${v1} m/s meets a train ${L2} m long travelling at ${v2} m/s in the opposite direction. How many seconds does it take from when their fronts meet until their backs pass each other?`,
      zh: `一列长 ${L1} 米、速度每秒 ${v1} 米的火车与一列长 ${L2} 米、速度每秒 ${v2} 米的火车相向而行。从两车车头相遇到车尾离开需要多少秒？`,
      solEn: `Distance = ${L1} + ${L2} = ${L1 + L2} m at combined speed ${v1 + v2} m/s → ${t} s`, solZh: `路程和 = ${L1} + ${L2} = ${L1 + L2} 米，速度和 ${v1 + v2} 米/秒 → ${t} 秒` });
  });
  add('PH', 4, ['numth', 'pattern'], () => {   // digit 1 on a 24-hour clock
    const d = R(1, 5); let c = 0; for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m++) if ((String(h).padStart(2, '0') + String(m).padStart(2, '0')).includes(String(d))) c++;
    return Q({ value: c, en: `A digital clock shows times from 00:00 to 23:59. For how many minutes in a day does the display show at least one digit ${d}?`, zh: `电子钟显示 00:00 到 23:59。一天中有多少分钟，显示屏上至少出现一个数字 ${d}？`,
      solEn: `Count the times with no ${d} and subtract from 1440: ${c}`, solZh: `先数不含 ${d} 的时刻，再用 1440 减去：${c}` });
  });
  add('P', 4, ['alg', 'word'], () => {   // three ages
    const [A, B] = two(), a = R(6, 15), b = R(6, 15), dad = R(35, 48), s1 = a + b; let y = 0; while (a + b + 2 * y !== dad + y && y < 60) y++;
    if (y >= 60 || y === 0) return null;
    return Q({ value: y, en: `${A[0]} is ${a} and ${B[0]} is ${b}. Their father is ${dad}. In how many years will the two children's ages add up to their father's age?`,
      zh: `${A[1]} ${a} 岁，${B[1]} ${b} 岁，爸爸 ${dad} 岁。几年后两个孩子的年龄和等于爸爸的年龄？`,
      solEn: `Each year the children's total grows by 2 and Dad's by 1, so the gap ${dad} − ${s1} = ${dad - s1} closes by 1 a year → ${y}`, solZh: `每过一年孩子年龄和增加 2，爸爸增加 1，差距 ${dad - s1} 每年缩小 1 → ${y} 年` });
  });

  /* ====================== H: Years 7–10 ====================== */
  add('HS', 3, ['numth', 'index'], () => {   // last two digits
    const a = pick([3, 7, 13, 17, 21, 99, 11]), n = R(50, 2025), v = modpow(a, n, 100);
    return Q({ value: v, en: `What number is formed by the last two digits of ${a}^${n}? (e.g. 07 → 7)`, zh: `${a}^${n} 的最后两位数字组成的数是多少？（如 07 写 7）`,
      solEn: `Work mod 100: the powers of ${a} repeat; ${a}^${n} ≡ ${v} (mod 100)`, solZh: `模 100 计算，${a} 的幂循环出现；${a}^${n} ≡ ${v} (mod 100)` });
  });
  add('HS', 3, ['alg', 'pattern'], () => {   // positive integer solutions of x + y + z = n
    const n = R(8, 20), pos = Math.random() < 0.5; let c = 0;
    for (let x = pos ? 1 : 0; x <= n; x++) for (let y = pos ? 1 : 0; x + y <= n; y++) { const z = n - x - y; if (z >= (pos ? 1 : 0)) c++; }
    return Q({ value: c, en: `How many ordered triples of ${pos ? 'positive' : 'non-negative'} integers (x, y, z) satisfy x + y + z = ${n}?`, zh: `满足 x + y + z = ${n} 的${pos ? '正' : '非负'}整数有序解 (x, y, z) 共有多少组？`,
      solEn: `Stars and bars: C(${pos ? n - 1 : n + 2}, 2) = ${c}`, solZh: `隔板法：C(${pos ? n - 1 : n + 2}, 2) = ${c}` });
  });
  add('HS', 4, ['prob', 'pattern'], () => {   // grid paths avoiding a point
    const m = R(4, 6), n = R(4, 6), bx = R(1, m - 1), by = R(1, n - 1), W = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) { if (i === bx && j === by) { W[i][j] = 0; continue; } W[i][j] = i === 0 && j === 0 ? 1 : (i ? W[i - 1][j] : 0) + (j ? W[i][j - 1] : 0); }
    return Q({ value: W[m][n], en: `On a grid you walk from (0, 0) to (${m}, ${n}) taking unit steps right or up only. The point (${bx}, ${by}) is blocked. How many different paths are there?`,
      zh: `在方格中从 (0, 0) 走到 (${m}, ${n})，每次只能向右或向上走一格，点 (${bx}, ${by}) 不能经过。共有多少条路线？`,
      solEn: `All paths C(${m + n}, ${m}) = ${C(m + n, m)} minus paths through (${bx}, ${by}): ${C(bx + by, bx)} × ${C(m - bx + n - by, m - bx)} → ${W[m][n]}`, solZh: `总数 C(${m + n}, ${m}) = ${C(m + n, m)}，减去经过 (${bx}, ${by}) 的 ${C(bx + by, bx)} × ${C(m - bx + n - by, m - bx)} 条 → ${W[m][n]}` });
  });
  add('HS', 4, ['quad', 'numth'], () => {   // n^2 + an + b a perfect square
    const a = R(1, 12), b = R(5, 60), list = [];
    for (let n = 1; n <= 2000; n++) { const v = n * n + a * n + b, r = Math.round(Math.sqrt(v)); if (r * r === v) list.push(n); }
    if (!list.length || list.length > 4) return null;
    return Q({ value: list.reduce((x, y) => x + y, 0), en: `Find the sum of all positive integers n for which n² + ${a}n + ${b} is a perfect square.`, zh: `求所有使 n² + ${a}n + ${b} 为完全平方数的正整数 n 之和。`,
      solEn: `Squeeze between consecutive squares (or factorise 4·(expression) as a difference of squares): n = ${list.join(', ')}`, solZh: `夹在相邻平方数之间（或配方后用平方差分解）：n = ${list.join('、')}` });
  });
  add('HS', 4, ['numth'], () => {   // divisors of N^2 below N that don't divide N
    const N = pick([12, 18, 20, 24, 30, 36, 40, 60, 72]); let c = 0;
    for (let d = 1; d < N; d++) if ((N * N) % d === 0 && N % d !== 0) c++;
    return Q({ value: c, en: `How many positive divisors of ${N}² are less than ${N} but do not divide ${N}?`, zh: `${N}² 的正因数中，有多少个小于 ${N} 但不是 ${N} 的因数？`,
      solEn: `Divisors of ${N}² pair up around ${N}; count those below ${N} and remove the divisors of ${N}: ${c}`, solZh: `${N}² 的因数关于 ${N} 成对出现；数出小于 ${N} 的，再去掉 ${N} 的因数：${c}` });
  });
  add('HS', 4, ['prob', 'pattern'], () => {   // subsets with no two consecutive
    const n = R(7, 12), k = R(2, 4); let c = 0;
    const rec = (start, left) => { if (left === 0) { c++; return; } for (let i = start; i <= n; i++) rec(i + 2, left - 1); };
    rec(1, k);
    return Q({ value: c, en: `In how many ways can ${k} numbers be chosen from 1, 2, …, ${n} so that no two chosen numbers are consecutive?`, zh: `从 1，2，……，${n} 中选 ${k} 个数，使任意两个都不相邻，有多少种选法？`,
      solEn: `Shift the chosen numbers to remove the gaps: C(${n - k + 1}, ${k}) = ${c}`, solZh: `把选出的数依次减去 0, 1, 2, …，化为无限制选取：C(${n - k + 1}, ${k}) = ${c}` });
  });
  add('H', 3, ['alg', 'quad'], () => {   // difference of squares
    const x = R(10, 60), y = R(1, x - 1), A = x * x - y * y, B = x - y;
    return Q({ value: x, en: `Positive integers x and y satisfy x² − y² = ${A} and x − y = ${B}. Find x.`, zh: `正整数 x、y 满足 x² − y² = ${A}，x − y = ${B}。求 x。`,
      solEn: `x + y = ${A} ÷ ${B} = ${x + y}; x = (${x + y} + ${B}) ÷ 2 = ${x}`, solZh: `x + y = ${A} ÷ ${B} = ${x + y}；x = (${x + y} + ${B}) ÷ 2 = ${x}` });
  });
  add('HS', 4, ['numth', 'pattern'], () => {   // sum of floor(N/k)
    const N = R(10, 30); let s = 0; for (let k = 1; k <= N; k++) s += Math.floor(N / k);
    return Q({ value: s, en: `Find ⌊${N}/1⌋ + ⌊${N}/2⌋ + ⌊${N}/3⌋ + … + ⌊${N}/${N}⌋, where ⌊x⌋ is the largest whole number not greater than x.`, zh: `求 ⌊${N}/1⌋ + ⌊${N}/2⌋ + ⌊${N}/3⌋ + … + ⌊${N}/${N}⌋ 的值（⌊x⌋ 表示不超过 x 的最大整数）。`,
      solEn: `This equals the total number of divisors of 1, 2, …, ${N}: ${s}`, solZh: `它等于 1 到 ${N} 各数的因数个数之和：${s}` });
  });
  add('HS', 3, ['prob', 'numth'], () => {   // digits strictly increasing / digit sum
    const len = R(3, 4), S = len === 3 ? R(10, 20) : R(14, 26); let c = 0;
    for (let n = 10 ** (len - 1); n < 10 ** len; n++) { const d = digits(n); if (d.every((x, i) => i === 0 || x > d[i - 1]) && dsum(n) === S) c++; }
    if (!c) return null;
    return Q({ value: c, en: `How many ${len}-digit numbers have digits that strictly increase from left to right and add up to ${S}?`, zh: `有多少个${len === 3 ? '三' : '四'}位数，各位数字从左到右严格递增，且各位数字之和为 ${S}？`,
      solEn: `Choose ${len} different digits from 1–9 with sum ${S} (each choice gives exactly one number): ${c}`, solZh: `从 1–9 中选 ${len} 个不同数字使和为 ${S}，每种选法恰好对应一个数：${c}` });
  });
  add('HS', 3, ['alg', 'numth'], () => {   // ax + by = n positive solutions
    const a = R(2, 7), b = R(3, 9), n = R(60, 200); let c = 0;
    for (let x = 1; a * x < n; x++) if ((n - a * x) % b === 0 && n - a * x > 0) c++;
    if (!c) return null;
    return Q({ value: c, en: `How many pairs of positive integers (x, y) satisfy ${a}x + ${b}y = ${n}?`, zh: `满足 ${a}x + ${b}y = ${n} 的正整数对 (x, y) 有多少组？`,
      solEn: `Find one solution, then x changes by ${b / gcd(a, b)} and y by ${a / gcd(a, b)} each time: ${c}`, solZh: `先找一组解，之后 x 每次变化 ${b / gcd(a, b)}，y 每次变化 ${a / gcd(a, b)}：共 ${c} 组` });
  });
  add('PH', 4, ['numth', 'alg'], () => {   // max product with fixed sum
    const n = R(10, 25), best = [1, 1, 2, 3, 4]; for (let i = 5; i <= n; i++) { let m = 0; for (let k = 1; k < i; k++) m = Math.max(m, k * Math.max(i - k, best[i - k])); best[i] = m; }
    return Q({ value: best[n], en: `Some positive whole numbers add up to ${n}. What is the largest possible product of these numbers?`, zh: `若干个正整数的和是 ${n}，它们的积最大是多少？`,
      solEn: `Use as many 3s as possible (and 2s instead of a 1): ${best[n]}`, solZh: `尽量多拆成 3（余数用 2 而不用 1）：${best[n]}` });
  });
  add('HS', 3, ['pattern', 'frac'], () => {   // telescoping product
    const n = R(5, 40), N = n + 1, D = 2 * n;
    return Q({ value: N / D, answer: fracStr(N, D), en: `Find the value of (1 − 1/2²)(1 − 1/3²)(1 − 1/4²) … (1 − 1/${n}²) as a fraction.`, zh: `求 (1 − 1/2²)(1 − 1/3²)(1 − 1/4²) … (1 − 1/${n}²) 的值（用分数表示）。`,
      solEn: `1 − 1/k² = (k − 1)(k + 1)/k²; the product telescopes to (${n} + 1)/(2 × ${n}) = ${fracStr(N, D)}`, solZh: `1 − 1/k² = (k − 1)(k + 1)/k²，连乘相消得 (${n} + 1)/(2 × ${n}) = ${fracStr(N, D)}` });
  });
  add('HS', 3, ['numth'], () => {   // factorial sum mod m
    const n = R(10, 50), m = pick([7, 9, 11, 12, 13, 15]); let s = 0, f = 1; for (let k = 1; k <= n; k++) { f = f * k % m; s = (s + f) % m; }
    return Q({ value: s, en: `What is the remainder when 1! + 2! + 3! + … + ${n}! is divided by ${m}?`, zh: `1! + 2! + 3! + … + ${n}! 除以 ${m} 的余数是多少？`,
      solEn: `From some point on every k! is a multiple of ${m}, so only the first few terms matter: remainder ${s}`, solZh: `从某项起 k! 都是 ${m} 的倍数，只需计算前几项：余数为 ${s}` });
  });
  add('HS', 3, ['prob'], () => {   // dice probability by enumeration
    const kind = pick(['prime', 'sq', 'mult']), dice = pick([2, 3]); let fav = 0, tot = 0;
    const ok = s => (kind === 'prime' ? isPrime(s) : kind === 'sq' ? Number.isInteger(Math.sqrt(s)) : s % 4 === 0);
    if (dice === 2) { for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { tot++; if (ok(a + b)) fav++; } }
    else { for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) { tot++; if (ok(a + b + c)) fav++; } }
    const w = { prime: ['a prime number', '质数'], sq: ['a perfect square', '完全平方数'], mult: ['a multiple of 4', '4 的倍数'] }[kind];
    return Q({ value: fav / tot, answer: fracStr(fav, tot), en: `${dice} fair dice are rolled. What is the probability that the total is ${w[0]}? (fraction)`, zh: `掷 ${dice} 个均匀骰子，点数和为${w[1]}的概率是多少？（用分数表示）`,
      solEn: `${fav} of the ${tot} equally likely outcomes work: ${fracStr(fav, tot)}`, solZh: `${tot} 种等可能结果中有 ${fav} 种符合：${fracStr(fav, tot)}` });
  });
  add('HS', 4, ['numth'], () => {   // twin primes
    const N = R(100, 400), c = count(2, N - 2, p => isPrime(p) && isPrime(p + 2));
    return Q({ value: c, en: `Twin primes are pairs of primes that differ by 2, such as (3, 5) and (11, 13). How many twin-prime pairs have both primes less than ${N}?`, zh: `相差 2 的一对质数叫孪生质数，如 (3, 5)、(11, 13)。两个质数都小于 ${N} 的孪生质数共有多少对？`,
      solEn: `Apart from (3, 5), twin primes have the form (6k − 1, 6k + 1); checking gives ${c}`, solZh: `除 (3, 5) 外，孪生质数形如 (6k − 1, 6k + 1)，逐一检验得 ${c} 对` });
  });
  add('HS', 3, ['numth', 'index'], () => {   // perfect-square divisors
    const N = pick([360, 720, 1800, 3600, 5400, 10800, 2160]); let c = 0; for (let d = 1; d * d <= N; d++) if (N % (d * d) === 0) c++;
    return Q({ value: c, en: `How many perfect squares (1, 4, 9, …) are factors of ${N}?`, zh: `${N} 的因数中有多少个是完全平方数（1, 4, 9, …）？`,
      solEn: `Write ${N} as a product of primes and choose even powers of each: ${c}`, solZh: `把 ${N} 分解质因数，每个质因数取偶数次幂：${c} 个` });
  });
  add('HS', 4, ['numth'], () => {   // smallest n with n! divisible by M
    const M = pick([1000, 2 ** 10, 3 ** 6, 7 ** 3, 10 ** 6, 12 ** 4]); let n = 1, f = 1n; while (f % BigInt(M) !== 0n) { n++; f *= BigInt(n); }
    return Q({ value: n, en: `What is the smallest positive integer n such that n! is divisible by ${M}?`, zh: `使 n! 能被 ${M} 整除的最小正整数 n 是多少？`,
      solEn: `Factorise ${M} into primes and count how many of each prime n! contains: n = ${n}`, solZh: `把 ${M} 分解质因数，再数 n! 中各质因数的个数：n = ${n}` });
  });

  /* ====================== S: Years 11–12, Extension 1 & 2 ====================== */
  add('S', 3, ['poly', 'quad', 'calc'], () => {   // Vieta: sum of squares of roots of a cubic
    const r = [R(-6, 6), R(-6, 6), R(-6, 6)], p = -(r[0] + r[1] + r[2]), q = r[0] * r[1] + r[1] * r[2] + r[0] * r[2], s = -(r[0] * r[1] * r[2]);
    const v = r[0] ** 2 + r[1] ** 2 + r[2] ** 2, t = (c, x) => (c ? `${c < 0 ? ` ${MINUS} ` : ' + '}${Math.abs(c) === 1 && x ? '' : Math.abs(c)}${x}` : '');
    return Q({ value: v, en: `The roots of x³${t(p, 'x²')}${t(q, 'x')}${t(s, '')} = 0 are α, β and γ. Find α² + β² + γ².`, zh: `方程 x³${t(p, 'x²')}${t(q, 'x')}${t(s, '')} = 0 的三个根为 α、β、γ。求 α² + β² + γ²。`,
      solEn: `α + β + γ = ${-p}, αβ + βγ + γα = ${q}; α² + β² + γ² = (${-p})² − 2(${q}) = ${v}`, solZh: `α + β + γ = ${-p}，αβ + βγ + γα = ${q}；α² + β² + γ² = (${-p})² − 2(${q}) = ${v}` });
  });
  add('S', 3, ['comb', 'series'], () => {   // binomial identities
    const n = R(5, 12), k = pick(['k', 'sq']), v = k === 'k' ? n * 2 ** (n - 1) : C(2 * n, n);
    return Q({ value: v, en: k === 'k' ? `Evaluate Σ k·C(${n}, k) for k = 0 to ${n}.` : `Evaluate Σ C(${n}, k)² for k = 0 to ${n}.`, zh: k === 'k' ? `求 Σ k·C(${n}, k)（k 从 0 到 ${n}）。` : `求 Σ C(${n}, k)²（k 从 0 到 ${n}）。`,
      solEn: k === 'k' ? `Differentiate (1 + x)^${n} and put x = 1: ${n} × 2^${n - 1} = ${v}` : `Compare coefficients of x^${n} in (1 + x)^${n}(1 + x)^${n}: C(${2 * n}, ${n}) = ${v}`, solZh: k === 'k' ? `对 (1 + x)^${n} 求导后令 x = 1：${n} × 2^${n - 1} = ${v}` : `比较 (1 + x)^${n}(1 + x)^${n} 中 x^${n} 的系数：C(${2 * n}, ${n}) = ${v}` });
  });
  add('S', 3, ['comb', 'poly'], () => {   // coefficient in a binomial expansion
    const a = R(1, 3), b = R(1, 4) * (Math.random() < 0.5 ? -1 : 1), n = R(5, 9), k = R(2, n - 2), v = C(n, k) * a ** k * b ** (n - k);
    return Q({ value: v, en: `Find the coefficient of x^${k} in the expansion of (${a === 1 ? '' : a}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)})^${n}.`, zh: `求 (${a === 1 ? '' : a}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)})^${n} 展开式中 x^${k} 的系数。`,
      solEn: `C(${n}, ${k}) × ${a}^${k} × (${b})^${n - k} = ${v}`, solZh: `C(${n}, ${k}) × ${a}^${k} × (${b})^${n - k} = ${v}` });
  });
  add('S', 4, ['trig', 'invtrig'], () => {   // number of solutions in an interval
    const k = R(2, 6), c = pick(['1/2', '√3/2', '−1/2']), fn = pick(['sin', 'cos']), turns = R(1, 2), v = 2 * k * turns;
    return Q({ value: v, en: `How many solutions does ${fn}(${k}x) = ${c} have for 0 ≤ x < ${turns === 1 ? '2π' : '4π'}?`,
      zh: `方程 ${fn}(${k}x) = ${c} 在 0 ≤ x < ${turns === 1 ? '2π' : '4π'} 内有多少个解？`,
      solEn: `${fn}(${k}x) completes ${k * turns} periods on the interval and hits ${c} twice per period: ${v}`, solZh: `${fn}(${k}x) 在区间内完成 ${k * turns} 个周期，每个周期取到 ${c} 两次：${v} 个` });
  });
  add('S', 4, ['series', 'calc'], () => {   // Σ n x^n
    const [p, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), x = p / q, v = x / (1 - x) ** 2, N = p * q, D = (q - p) ** 2;
    return Q({ value: v, answer: fracStr(N, D), en: `Find the sum to infinity 1·(${p}/${q}) + 2·(${p}/${q})² + 3·(${p}/${q})³ + … (fraction)`, zh: `求无穷级数 1·(${p}/${q}) + 2·(${p}/${q})² + 3·(${p}/${q})³ + … 的和（用分数表示）。`,
      solEn: `Σ n xⁿ = x/(1 − x)² with x = ${p}/${q}: ${fracStr(N, D)}`, solZh: `Σ n xⁿ = x/(1 − x)²，x = ${p}/${q}：${fracStr(N, D)}` });
  });
  add('S', 4, ['complex'], () => {   // real part of (a + bi)^n
    const a = R(1, 2), b = R(1, 2), n = R(4, 10); let re = 1, im = 0; for (let k = 0; k < n; k++) [re, im] = [re * a - im * b, re * b + im * a];
    const z = `(${a} + ${b === 1 ? '' : b}i)^${n}`;
    return Q({ value: re, en: `Find the real part of ${z}.`, zh: `求 ${z} 的实部。`,
      solEn: `Use modulus–argument form or expand step by step: real part = ${re}`, solZh: `用模–辐角形式或逐步展开：实部 = ${re}` });
  });
  add('SH', 4, ['circle', 'numth'], () => {   // lattice points in a circle
    const r = R(3, 9); let c = 0; for (let x = -r; x <= r; x++) for (let y = -r; y <= r; y++) if (x * x + y * y <= r * r) c++;
    return Q({ value: c, en: `How many points (x, y) with integer coordinates satisfy x² + y² ≤ ${r * r}?`, zh: `满足 x² + y² ≤ ${r * r} 的整点 (x, y) 有多少个？`,
      solEn: `For each x from −${r} to ${r}, count integer y with y² ≤ ${r * r} − x²: ${c}`, solZh: `对 x = −${r} 到 ${r}，数满足 y² ≤ ${r * r} − x² 的整数 y：共 ${c} 个` });
  });
  add('SH', 3, ['series', 'pattern'], () => {   // linear recurrence value
    const a0 = R(1, 3), a1 = R(1, 4), p = R(1, 3), q = R(1, 2), n = R(8, 12), s = [a0, a1]; for (let i = 2; i <= n; i++) s.push(p * s[i - 1] + q * s[i - 2]);
    return Q({ value: s[n], en: `A sequence has a₀ = ${a0}, a₁ = ${a1} and aₙ = ${p === 1 ? '' : p}aₙ₋₁ + ${q === 1 ? '' : q}aₙ₋₂. Find a${String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('')}.`,
      zh: `数列满足 a₀ = ${a0}，a₁ = ${a1}，aₙ = ${p === 1 ? '' : p}aₙ₋₁ + ${q === 1 ? '' : q}aₙ₋₂。求 a${String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('')}。`,
      solEn: `Build the terms: ${s.join(', ')}`, solZh: `逐项计算：${s.join('、')}` });
  });
  add('SH', 4, ['numth'], () => {   // Euler phi
    const N = pick([36, 60, 84, 90, 100, 120, 126, 150, 180, 210]), c = count(1, N, n => gcd(n, N) === 1);
    return Q({ value: c, en: `How many integers from 1 to ${N} have no common factor with ${N} other than 1?`, zh: `1 到 ${N} 中，有多少个整数与 ${N} 互质？`,
      solEn: `φ(${N}) = ${N} × Π(1 − 1/p) over the primes p dividing ${N} = ${c}`, solZh: `φ(${N}) = ${N} × Π(1 − 1/p)（p 为 ${N} 的质因数）= ${c}` });
  });
  add('S', 3, ['calc', 'integ'], () => {   // integral of floor
    const n = R(3, 12), v = n * (n - 1) / 2;
    return Q({ value: v, en: `Evaluate ∫ from 0 to ${n} of ⌊x⌋ dx, where ⌊x⌋ is the greatest integer not exceeding x.`, zh: `求 ∫₀^${n} ⌊x⌋ dx（⌊x⌋ 表示不超过 x 的最大整数）。`,
      solEn: `On [k, k + 1) the integrand is k, so the integral is 0 + 1 + … + ${n - 1} = ${v}`, solZh: `在 [k, k + 1) 上被积函数为 k，积分 = 0 + 1 + … + ${n - 1} = ${v}` });
  });
  add('S', 4, ['calc', 'quad'], () => {   // minimum of a sum of distances squared / AM-GM style
    const a = R(1, 6), b = a * R(1, 5) ** 2 * (Math.random() < 0.5 ? 1 : 1), k = a * b;   // a·b is a perfect square
    return Q({ value: 2 * Math.sqrt(k), en: `For x > 0, find the minimum value of ${a}x + ${b}/x.`, zh: `当 x > 0 时，求 ${a}x + ${b}/x 的最小值。`,
      solEn: `By AM–GM, ${a}x + ${b}/x ≥ 2√(${a * b}) = ${2 * Math.sqrt(k)}`, solZh: `由均值不等式，${a}x + ${b}/x ≥ 2√(${a * b}) = ${2 * Math.sqrt(k)}` });
  });

  /* ---------- picking ---------- */
  function generate(year, diff, tag) {
    // 3 = Challenging, 4 = Competitive, 5 = AMO level only (hard end of competition papers)
    const b = band(year), d = Math.max(3, Math.min(5, diff));
    let pool = T.filter(t => t.bands.includes(b) && t.minD <= (d === 3 ? 3 : 5) && (!tag || t.tags.includes(tag)));
    if (!pool.length) return null;
    // Challenging keeps to the gentler templates; Competitive leans on the hardest ones, mostly AMO-level
    const hard = pool.filter(t => t.minD >= 4), amo = pool.filter(t => t.minD === 5);
    if (d === 5 && amo.length) pool = amo;
    else if (d === 4 && amo.length && Math.random() < 0.6) pool = amo;
    else if (d === 4 && hard.length && Math.random() < 0.85) pool = hard;
    else if (d === 3) { const pref = pool.filter(t => t.minD === 3); if (pref.length && Math.random() < 0.7) pool = pref; }
    // avoid repeating a problem type used in the last few competition questions
    const fresh = pool.filter(t => !recent.includes(t));
    if (fresh.length) pool = fresh;
    for (let i = 0; i < 12; i++) {
      const tpl = pick(pool), q = tpl.fn();
      if (q && q.value !== null && Number.isFinite(q.value)) {
        recent.push(tpl); if (recent.length > 8) recent.shift();
        q.ref = { oly: T.indexOf(tpl), year, diff: d, subject: 'maths' };
        if (tag) q.topic = tag; q.olympiad = true; return q;
      }
    }
    return null;
  }
  const recent = [];

  G.register('maths', 'olymp', 1, (y, d) => generate(y, Math.max(3, d)), { maxYear: 14, olympiadOnly: true });
  const api = { generate, T, band };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Olympiad = api;
})(typeof window !== 'undefined' ? window : globalThis);
