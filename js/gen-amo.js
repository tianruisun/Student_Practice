/* AMO-level problems (Australian Mathematical Olympiad / AIMO / AMOC style).
   Real olympiad problems ask for proofs, which cannot be marked automatically, so each problem
   here is a "find all … and give the sum / count / value" adaptation with ONE whole-number answer
   (0–999). The answer is always found by brute force (enumeration, exact search or simulation),
   so it is correct by construction; the proof idea is given in the worked solution.
   These templates have minD 5: used heavily at Competitive (4) and for the hard end of competition papers. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const O = root.Olympiad || require('./gen-olympiad.js');
  const { R, pick, gcd } = G;

  const add = (bands, tags, fn) => O.T.push({ bands, minD: 5, tags, fn, amo: true });
  const Q = o => (Number.isInteger(o.value) && o.value >= 0 && o.value <= 999 ? G.mk(Object.assign({ topic: 'olymp' }, o)) : null);
  const ndiv = n => { let c = 0; for (let i = 1; i * i <= n; i++) if (n % i === 0) c += i * i === n ? 1 : 2; return c; };
  const isSq = n => n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;
  const isPow2 = n => n > 0 && (n & (n - 1)) === 0;
  const sub = n => String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('');

  /* exact count of tilings of an h × w board by the given pieces (each piece = list of [row, col] cells) */
  function orientations(cells) {
    const out = new Map();
    let cur = cells;
    for (let f = 0; f < 2; f++) {
      for (let r = 0; r < 4; r++) {
        cur = cur.map(([a, b]) => [b, -a]);
        const s = cur.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]), [a0, b0] = s[0];
        const norm = s.map(([a, b]) => [a - a0, b - b0]);
        out.set(JSON.stringify(norm), norm);
      }
      cur = cur.map(([a, b]) => [a, -b]);
    }
    return [...out.values()];
  }
  function tilings(h, w, pieces) {
    const shapes = pieces.flatMap(orientations), board = new Uint8Array(h * w);
    let count = 0;
    (function fill(start) {
      let i = start; while (i < h * w && board[i]) i++;
      if (i === h * w) { count++; return; }
      const r = Math.floor(i / w), c = i % w;
      for (const sh of shapes) {
        if (sh.every(([a, b]) => r + a < h && c + b >= 0 && c + b < w && !board[(r + a) * w + c + b])) {
          sh.forEach(([a, b]) => { board[(r + a) * w + c + b] = 1; });
          fill(i + 1);
          sh.forEach(([a, b]) => { board[(r + a) * w + c + b] = 0; });
        }
      }
    })(0);
    return count;
  }
  const DOMINO = [[0, 0], [0, 1]], SQUARE = [[0, 0], [0, 1], [1, 0], [1, 1]], BAR3 = [[0, 0], [0, 1], [0, 2]], ELL = [[0, 0], [1, 0], [1, 1]];

  function* perms(a) {
    if (a.length <= 1) { yield a; return; }
    for (let i = 0; i < a.length; i++) for (const p of perms(a.slice(0, i).concat(a.slice(i + 1)))) yield [a[i], ...p];
  }

  /* ---------------- number theory ---------------- */
  add('HS', ['numth', 'index'], () => {   // n! + c = 2^k   (AMO 2016 style)
    for (let t = 0; t < 40; t++) {
      const c = 2 * R(1, 100), ns = [];
      let f = 1n;
      for (let n = 1; n <= 30; n++) { f *= BigInt(n); const x = f + BigInt(c); if ((x & (x - 1n)) === 0n) ns.push(n); }
      if (!ns.length) continue;
      const v = ns.reduce((a, b) => a + b, 0);
      return Q({ value: v, en: `Find the sum of all positive integers n for which n! + ${c} is a power of 2.`, zh: `求所有使 n! + ${c} 为 2 的幂的正整数 n 之和。`,
        solEn: `For large n, n! contains more factors of 2 than ${c}, so n! + ${c} has exactly as many factors of 2 as ${c} and cannot be a power of 2 bigger than ${c}. Checking the small cases leaves n = ${ns.join(', ')}; sum = ${v}.`,
        solZh: `n 较大时，n! 中 2 的因子比 ${c} 多，于是 n! + ${c} 中 2 的因子个数与 ${c} 相同，不可能是大于 ${c} 的 2 的幂。检验较小的 n，只有 n = ${ns.join('、')}，和为 ${v}。` });
    }
    return null;
  });
  add('HS', ['numth', 'frac'], () => {   // 1/x + 1/y = 1/N
    const N = pick([6, 10, 12, 15, 18, 20, 24, 28, 30, 36, 40, 45, 48, 60, 72, 84, 90]);
    let c = 0; for (let x = N + 1; x <= N + N * N; x++) if ((N * x) % (x - N) === 0) c++;
    return Q({ value: c, en: `How many ordered pairs (x, y) of positive integers satisfy 1/x + 1/y = 1/${N}?`, zh: `满足 1/x + 1/y = 1/${N} 的正整数有序对 (x, y) 有多少个？`,
      solEn: `Clear fractions: xy − ${N}x − ${N}y = 0, so (x − ${N})(y − ${N}) = ${N * N}. Both factors must be positive, so the answer is the number of divisors of ${N * N}: ${c}.`,
      solZh: `去分母得 xy − ${N}x − ${N}y = 0，即 (x − ${N})(y − ${N}) = ${N * N}。两个因数都为正，所以答案是 ${N * N} 的约数个数：${c}。` });
  });
  add('HS', ['numth', 'alg'], () => {   // f(f(n)) = 3n, f increasing
    const f = n => { let p = 1; while (3 * p <= n) p *= 3; return n <= 2 * p ? n + p : 3 * n - 3 * p; };
    for (let n = 1; n <= 400; n++) if (f(f(n)) !== 3 * n || f(n + 1) <= f(n)) return null;   // sanity: f really works
    const N = R(10, 300), v = f(N);
    return Q({ value: v, en: `A function f from the positive integers to the positive integers is strictly increasing and satisfies f(f(n)) = 3n for every n. Find f(${N}).`,
      zh: `函数 f 把正整数映射到正整数，严格递增，并且对所有 n 都有 f(f(n)) = 3n。求 f(${N})。`,
      solEn: `f(1) = 1 is impossible, so f(1) = 2, f(2) = 3, f(3) = 6, f(6) = 9, … Between 3ᵏ and 2·3ᵏ, f(n) = n + 3ᵏ; between 2·3ᵏ and 3ᵏ⁺¹, f(n) = 3n − 3ᵏ⁺¹. So f(${N}) = ${v}.`,
      solZh: `f(1) = 1 不可能，故 f(1) = 2，f(2) = 3，f(3) = 6，f(6) = 9，……在 3ᵏ 与 2·3ᵏ 之间 f(n) = n + 3ᵏ；在 2·3ᵏ 与 3ᵏ⁺¹ 之间 f(n) = 3n − 3ᵏ⁺¹。所以 f(${N}) = ${v}。` });
  });
  add('HS', ['numth', 'index'], () => {   // a^3 + b^3 a power of 2  (AMO 2018 style)
    const N = R(20, 200); let c = 0;
    for (let a = 1; a <= N; a++) for (let b = 1; b <= N; b++) if (isPow2(a * a * a + b * b * b)) c++;
    return Q({ value: c, en: `How many ordered pairs (a, b) of integers with 1 ≤ a, b ≤ ${N} make a³ + b³ a power of 2?`, zh: `满足 1 ≤ a, b ≤ ${N} 且 a³ + b³ 为 2 的幂的整数有序对 (a, b) 有多少个？`,
      solEn: `If a³ + b³ = 2ᶜ, then dividing out common factors of 2 and factorising (a + b)(a² − ab + b²) shows a = b = 2ᵏ. Powers of 2 up to ${N}: ${c} of them, giving ${c} pairs.`,
      solZh: `若 a³ + b³ = 2ᶜ，约去公共的 2 因子，再用 (a + b)(a² − ab + b²) 分解，可证 a = b = 2ᵏ。不超过 ${N} 的 2 的幂有 ${c} 个，所以有 ${c} 对。` });
  });
  add('HS', ['numth'], () => {   // smallest number with exactly K divisors
    const K = pick([10, 12, 14, 16, 18, 20, 24, 28, 30, 32]);
    let n = 1; while (ndiv(n) !== K) n++;
    return Q({ value: n, en: `What is the smallest positive integer that has exactly ${K} positive divisors?`, zh: `恰好有 ${K} 个正约数的最小正整数是多少？`,
      solEn: `If n = p^a·q^b·…, it has (a + 1)(b + 1)… divisors. Try every way to write ${K} as such a product, put the largest exponents on the smallest primes, and compare: ${n}.`,
      solZh: `若 n = p^a·q^b·…，则约数个数为 (a + 1)(b + 1)…。把 ${K} 写成这样的乘积的各种方式都试一遍，把大的指数放在小的质数上，比较得 ${n}。` });
  });
  add('HS', ['numth', 'alg'], () => {   // n + b divides n^2 + a
    const a = R(2, 40), b = R(1, 9), M = b * b + a;
    const c = Array.from({ length: M }, (_, i) => i + 1).filter(n => (n * n + a) % (n + b) === 0).length;
    return Q({ value: c, en: `For how many positive integers n is n² + ${a} divisible by n + ${b}?`, zh: `有多少个正整数 n 使 n² + ${a} 能被 n + ${b} 整除？`,
      solEn: `n² + ${a} = (n + ${b})(n − ${b}) + ${M}, so n + ${b} must divide ${M}. Count the divisors of ${M} that are greater than ${b}: ${c}.`,
      solZh: `n² + ${a} = (n + ${b})(n − ${b}) + ${M}，所以 n + ${b} 必须整除 ${M}。数一数 ${M} 中大于 ${b} 的约数：${c} 个。` });
  });
  add('PHS', ['numth', 'pattern'], () => {   // sums of consecutive positive integers
    const N = R(60, 999); let c = 0;
    for (let k = 2; k * (k + 1) / 2 <= N; k++) if ((N - k * (k - 1) / 2) % k === 0) c++;
    return Q({ value: c, en: `In how many ways can ${N} be written as a sum of two or more consecutive positive integers?`, zh: `${N} 有多少种方法写成两个或更多个连续正整数之和？`,
      solEn: `A sum of k consecutive integers starting at m is k(2m + k − 1)/2. The ways correspond to the odd divisors of ${N} other than 1: ${c}.`,
      solZh: `从 m 开始的 k 个连续整数之和为 k(2m + k − 1)/2。方法数等于 ${N} 除 1 以外的奇约数个数：${c}。` });
  });
  add('HS', ['numth'], () => {   // ordered triples abc = N
    const N = pick([60, 72, 90, 96, 100, 120, 144, 180, 200, 210, 240, 252, 300, 360]);
    let c = 0; for (let a = 1; a <= N; a++) if (N % a === 0) for (let b = 1; b <= N / a; b++) if ((N / a) % b === 0) c++;
    return Q({ value: c, en: `How many ordered triples (a, b, c) of positive integers satisfy abc = ${N}?`, zh: `满足 abc = ${N} 的正整数有序三元组 (a, b, c) 有多少个？`,
      solEn: `Share out each prime power pᵉ of ${N} among a, b, c: C(e + 2, 2) ways. Multiplying over the primes gives ${c}.`,
      solZh: `把 ${N} 的每个质因数幂 pᵉ 分给 a、b、c：有 C(e + 2, 2) 种。各质数相乘得 ${c}。` });
  });
  add('HS', ['numth', 'quad'], () => {   // x^2 + xy + y^2 = N
    for (let t = 0; t < 30; t++) {
      const N = R(7, 300), L = Math.ceil(Math.sqrt(4 * N / 3)) + 1; let c = 0;
      for (let x = -L; x <= L; x++) for (let y = -L; y <= L; y++) if (x * x + x * y + y * y === N) c++;
      if (!c) continue;
      return Q({ value: c, en: `How many ordered pairs (x, y) of integers (positive, negative or zero) satisfy x² + xy + y² = ${N}?`, zh: `满足 x² + xy + y² = ${N} 的整数有序对 (x, y)（可正、可负、可为零）有多少个？`,
        solEn: `4N = (2x + y)² + 3y², which bounds |y| ≤ ${Math.floor(Math.sqrt(4 * N / 3))}. Checking each y leaves ${c} pairs (they come in groups of 6 by symmetry).`,
        solZh: `4N = (2x + y)² + 3y²，所以 |y| ≤ ${Math.floor(Math.sqrt(4 * N / 3))}。逐个检验 y，共 ${c} 对（由对称性，6 个一组）。` });
    }
    return null;
  });
  add('PHS', ['numth', 'word'], () => {   // largest amount not payable with three coin values
    for (let t = 0; t < 30; t++) {
      const v = [R(4, 12), R(5, 15), R(9, 25)].sort((a, b) => a - b);
      if (v[0] === v[1] || v[1] === v[2] || gcd(gcd(v[0], v[1]), v[2]) !== 1 || gcd(v[0], v[1]) === 1) continue;
      const ok = new Uint8Array(1200); ok[0] = 1;
      for (let n = 1; n < 1200; n++) ok[n] = v.some(x => n >= x && ok[n - x]) ? 1 : 0;
      let big = -1; for (let n = 0; n < 1200; n++) if (!ok[n]) big = n;
      if (big < 20 || big > 999) continue;
      return Q({ value: big, en: `Boxes hold ${v[0]}, ${v[1]} or ${v[2]} chocolates. What is the largest number of chocolates that CANNOT be bought exactly using these boxes?`,
        zh: `巧克力每盒装 ${v[0]}、${v[1]} 或 ${v[2]} 块。用这些盒子不能恰好买到的最大块数是多少？`,
        solEn: `Work out which totals are possible (n is possible if n − ${v[0]}, n − ${v[1]} or n − ${v[2]} is). Once ${v[0]} totals in a row are possible, every larger one is too. The last impossible total is ${big}.`,
        solZh: `逐个判断哪些数能买到（若 n − ${v[0]}、n − ${v[1]} 或 n − ${v[2]} 能买到，则 n 能买到）。一旦连续 ${v[0]} 个数都能买到，之后所有数都能买到。最后一个买不到的是 ${big}。` });
    }
    return null;
  });
  add('HS', ['numth', 'pattern'], () => {   // distinct values of floor(k^2 / N)
    const N = R(30, 400), s = new Set(); for (let k = 1; k <= N; k++) s.add(Math.floor(k * k / N));
    return Q({ value: s.size, en: `How many different numbers appear in the list ⌊1²/${N}⌋, ⌊2²/${N}⌋, ⌊3²/${N}⌋, …, ⌊${N}²/${N}⌋? (⌊x⌋ is the greatest integer not exceeding x.)`,
      zh: `数列 ⌊1²/${N}⌋，⌊2²/${N}⌋，⌊3²/${N}⌋，…，⌊${N}²/${N}⌋ 中共有多少个不同的数？（⌊x⌋ 表示不超过 x 的最大整数）`,
      solEn: `While (k + 1)² − k² = 2k + 1 < ${N}, consecutive terms differ by 0 or 1, so every value up to there appears; after that every term is new. Counting both parts gives ${s.size}.`,
      solZh: `当 (k + 1)² − k² = 2k + 1 < ${N} 时，相邻两项相差 0 或 1，所以这之前的每个值都出现；之后每一项都是新值。两部分相加得 ${s.size}。` });
  });
  add('HS', ['numth', 'pattern'], () => {   // n and n+1 both with digit sum divisible by m
    const m = pick([4, 5, 6, 7]), N = pick([999, 500, 800]), ds = n => String(n).split('').reduce((a, b) => a + +b, 0);
    let c = 0; for (let n = 1; n <= N; n++) if (ds(n) % m === 0 && ds(n + 1) % m === 0) c++;
    if (!c) return null;
    return Q({ value: c, en: `How many integers n with 1 ≤ n ≤ ${N} have the property that the digit sums of n and of n + 1 are both divisible by ${m}?`,
      zh: `满足 1 ≤ n ≤ ${N}，并且 n 与 n + 1 的各位数字之和都能被 ${m} 整除的整数 n 有多少个？`,
      solEn: `If n does not end in 9, the digit sum goes up by exactly 1, so both cannot be multiples of ${m}. If n ends in exactly j nines, the digit sum changes by 1 − 9j. Count the n ending in 9s where this works: ${c}.`,
      solZh: `若 n 末位不是 9，数字和恰好加 1，不可能都是 ${m} 的倍数。若 n 末尾恰有 j 个 9，数字和变化 1 − 9j。数出满足条件的末尾为 9 的 n：${c} 个。` });
  });

  /* ---------------- combinatorics ---------------- */
  add('PHS', ['pattern', 'prob'], () => {   // tilings
    const opts = [
      () => { const k = R(2, 5); return [3, 2 * k, [DOMINO], `1 × 2 dominoes`, `1 × 2 的多米诺骨牌`]; },
      () => { const n = R(5, 10); return [2, n, [DOMINO, SQUARE], `1 × 2 dominoes and 2 × 2 squares`, `1 × 2 的骨牌和 2 × 2 的正方形`]; },
      () => { const n = R(4, 7); return [4, n, [DOMINO], `1 × 2 dominoes`, `1 × 2 的多米诺骨牌`]; },
      () => { const n = R(6, 12); return [3, n, [BAR3], `1 × 3 strips`, `1 × 3 的长条`]; },
      () => { const n = 3 * R(1, 3); return [3, n, [ELL], `L-shaped trominoes (three squares in an L)`, `L 形三格骨牌`]; },
      () => { const n = R(4, 8); return [2, n, [DOMINO, ELL], `1 × 2 dominoes and L-shaped trominoes`, `1 × 2 骨牌和 L 形三格骨牌`]; }
    ];
    const [h, w, pcs, en, zh] = pick(opts)(), v = tilings(h, w, pcs);
    return Q({ value: v, en: `In how many ways can a ${h} × ${w} rectangle be tiled completely by ${en}? (Pieces may be turned over or rotated; tilings that are reflections of each other count as different.)`,
      zh: `用${zh}把 ${h} × ${w} 的长方形完全铺满，有多少种不同的铺法？（骨牌可旋转、翻转；互为镜像的铺法算不同的铺法。）`,
      solEn: `Look at how the leftmost column can be covered and set up a recurrence for the number of tilings of shorter boards. Working it through gives ${v}.`,
      solZh: `考虑最左边一列的覆盖方式，建立较短长方形铺法数的递推关系，逐步计算得 ${v}。` });
  });
  add('PHS', ['pattern', 'prob'], () => {   // take-away game
    const S = pick([[1, 3, 4], [1, 4], [2, 3], [1, 2, 6], [1, 5, 6], [1, 3, 7], [2, 5]]), N = R(30, 120);
    const win = [false]; for (let n = 1; n <= N; n++) win[n] = S.some(s => s <= n && !win[n - s]);
    const c = count1(N, n => !win[n]);
    return Q({ value: c, en: `A pile has n counters. Two players take turns; on each turn a player removes ${S.join(', ').replace(/, (\d+)$/, ' or $1')} counters. A player who cannot move loses. For how many values of n from 1 to ${N} can the SECOND player always win?`,
      zh: `一堆有 n 枚棋子，两人轮流取，每次取 ${S.join('、').replace(/、(\d+)$/, '或$1')} 枚，轮到时无法取的人输。n 从 1 到 ${N} 中，有多少个值能保证后手必胜？`,
      solEn: `Work up from n = 0: a position is losing if every move leads to a winning position. The losing positions repeat in a cycle; there are ${c} of them up to ${N}.`,
      solZh: `从 n = 0 往上推：如果每一种走法都走到必胜局面，这个局面就是必败局面。必败局面呈周期出现，到 ${N} 为止共 ${c} 个。` });
  });
  const count1 = (N, f) => { let c = 0; for (let n = 1; n <= N; n++) if (f(n)) c++; return c; };
  add('PHS', ['prob', 'numth'], () => {   // subsets with sum divisible by m
    const n = R(6, 10), m = pick([3, 4, 5, 7]); let c = 0;
    for (let s = 1; s < 1 << n; s++) { let t = 0; for (let i = 0; i < n; i++) if (s >> i & 1) t += i + 1; if (t % m === 0) c++; }
    return Q({ value: c, en: `How many non-empty subsets of {1, 2, 3, …, ${n}} have a sum that is divisible by ${m}?`, zh: `集合 {1, 2, 3, …, ${n}} 有多少个非空子集，其元素之和能被 ${m} 整除？`,
      solEn: `Build up one element at a time, keeping track of how many subsets give each remainder mod ${m}. At the end there are ${c + 1} subsets with remainder 0, including the empty set, so ${c}.`,
      solZh: `逐个加入元素，记录模 ${m} 每个余数各有多少个子集。最后余数为 0 的有 ${c + 1} 个（含空集），所以答案是 ${c}。` });
  });
  add('HS', ['prob', 'pattern'], () => {   // special permutations
    const n = R(5, 8), kind = R(0, 1), a = Array.from({ length: n }, (_, i) => i + 1); let c = 0;
    for (const p of perms(a)) {
      let ok = true;
      for (let i = 1; i < n && ok; i++) {
        const before = p.slice(0, i);
        ok = kind ? before.some(x => Math.abs(x - p[i]) === 1) : (p[i] > Math.max(...before) || p[i] < Math.min(...before));
      }
      if (ok) c++;
    }
    const en = kind ? `every number after the first differs by 1 from at least one number placed before it` : `every number after the first is either bigger than all the numbers before it or smaller than all of them`;
    const zh = kind ? `第一个数之后的每个数，都与它前面至少一个数相差 1` : `第一个数之后的每个数，要么比前面所有数都大，要么比前面所有数都小`;
    return Q({ value: c, en: `The numbers 1, 2, …, ${n} are written in a row so that ${en}. How many such rows are possible?`, zh: `把 1，2，…，${n} 排成一行，使得${zh}。这样的排法有多少种？`,
      solEn: `Read the row backwards: the last number must be 1 or ${n}, and each earlier choice is again one of two ends of the remaining block. So there are 2^${n - 1} = ${c} rows.`,
      solZh: `倒过来看：最后一个数只能是 1 或 ${n}，前面每一步也只能取剩下数段的两端之一。所以共有 2^${n - 1} = ${c} 种。` });
  });
  add('HS', ['prob', 'pattern'], () => {   // proper colourings of a ring
    const n = R(5, 8), k = pick([3, 3, 4]);
    if (k === 4 && n > 5) return null;
    let c = 0; const col = Array(n).fill(0);
    (function go(i) { if (i === n) { if (col[n - 1] !== col[0]) c++; return; } for (let x = 0; x < k; x++) if (i === 0 || x !== col[i - 1]) { col[i] = x; go(i + 1); } })(0);
    return Q({ value: c, en: `${n} chairs stand in a circle and are numbered 1 to ${n}. Each is painted one of ${k} colours so that neighbouring chairs have different colours. How many colourings are possible?`,
      zh: `${n} 把椅子围成一圈，编号 1 到 ${n}。每把椅子涂 ${k} 种颜色之一，相邻椅子颜色不同。共有多少种涂法？`,
      solEn: `Colour the chairs in a line: ${k}·${k - 1}^${n - 1} ways. Remove those where chair ${n} matches chair 1 (these are colourings of a smaller circle) and repeat. This gives (${k - 1})^${n} + (−1)^${n}·${k - 1} = ${c}.`,
      solZh: `先排成一行涂色：${k}·${k - 1}^${n - 1} 种；减去第 ${n} 把与第 1 把同色的情况（相当于更小的圆圈），反复进行，得 (${k - 1})^${n} + (−1)^${n}·${k - 1} = ${c}。` });
  });
  add('PHS', ['series', 'alg'], () => {   // Fibonacci-type sequences reaching N
    for (let t = 0; t < 30; t++) {
      const k = R(6, 9), N = R(100, 999); let c = 0;
      for (let a = 1; a <= N; a++) for (let b = 1; b <= N; b++) { let x = a, y = b; for (let i = 3; i <= k; i++) { const z = x + y; x = y; y = z; if (y > N) break; } if (y === N) c++; }
      if (!c) continue;
      return Q({ value: c, en: `A sequence of positive integers a₁, a₂, a₃, … satisfies aₙ₊₂ = aₙ₊₁ + aₙ for all n. If a${sub(k)} = ${N}, how many possibilities are there for the pair (a₁, a₂)?`,
        zh: `正整数数列 a₁，a₂，a₃，…满足 aₙ₊₂ = aₙ₊₁ + aₙ。若 a${sub(k)} = ${N}，(a₁, a₂) 有多少种可能？`,
        solEn: `Write a${sub(k)} = F·a₁ + F′·a₂ using Fibonacci numbers, then count the positive solutions of that linear equation: ${c}.`,
        solZh: `用斐波那契数写出 a${sub(k)} = F·a₁ + F′·a₂，再数这个一次方程的正整数解：${c} 组。` });
    }
    return null;
  });

  /* ---------------- geometry ---------------- */
  add('HS', ['linear', 'geofig'], () => {   // lattice points inside a right triangle (Pick)
    const a = R(6, 40), b = R(6, 40); let c = 0;
    for (let x = 1; x < a; x++) for (let y = 1; y < b; y++) if (b * x + a * y < a * b) c++;
    return Q({ value: c, en: `How many points with integer coordinates lie strictly inside the triangle with vertices (0, 0), (${a}, 0) and (0, ${b})?`,
      zh: `顶点为 (0, 0)、(${a}, 0)、(0, ${b}) 的三角形内部（不含边界）有多少个整点？`,
      solEn: `Pick's theorem: area = I + B/2 − 1. Area = ${a * b / 2}; boundary points B = ${a} + ${b} + gcd(${a}, ${b}) = ${a + b + gcd(a, b)}. So I = ${c}.`,
      solZh: `皮克定理：面积 = I + B/2 − 1。面积 = ${a * b / 2}；边界整点 B = ${a} + ${b} + gcd(${a}, ${b}) = ${a + b + gcd(a, b)}。所以 I = ${c}。` });
  });
  add('HS', ['pyth', 'numth'], () => {   // right triangles with a given leg
    const N = pick([12, 15, 16, 20, 24, 28, 30, 32, 36, 40, 45, 48, 60]); let c = 0;
    for (let b = 1; b <= N * N; b++) if (isSq(N * N + b * b)) c++;
    return Q({ value: c, en: `How many right-angled triangles with whole-number side lengths have one of the two shorter sides equal to ${N}?`, zh: `有多少个三边都是整数的直角三角形，它的一条直角边等于 ${N}？`,
      solEn: `If the other leg is b and the hypotenuse c, then (c − b)(c + b) = ${N * N}. Count the factor pairs of ${N * N} with the same parity and c − b < c + b: ${c}.`,
      solZh: `设另一直角边为 b，斜边为 c，则 (c − b)(c + b) = ${N * N}。数出 ${N * N} 的同奇偶、且 c − b < c + b 的因数对：${c} 个。` });
  });
  add('HS', ['geofig', 'pattern'], () => {   // integer triangles with given perimeter
    const P = R(20, 90); let c = 0;
    for (let a = 1; a <= P; a++) for (let b = a; b <= P; b++) { const z = P - a - b; if (z >= b && a + b > z) c++; }
    return Q({ value: c, en: `How many different triangles have whole-number side lengths and perimeter ${P}? (Triangles that are congruent count once.)`, zh: `周长为 ${P}、三边都是整数的三角形有多少个？（全等的算同一个。）`,
      solEn: `Let a ≤ b ≤ c with a + b + c = ${P}. The triangle inequality forces c < ${P / 2}. Count for each c: ${c}.`,
      solZh: `设 a ≤ b ≤ c，a + b + c = ${P}。由三角形不等式 c < ${P / 2}。对每个 c 计数：共 ${c} 个。` });
  });

  O.tilings = tilings;
})(typeof window !== 'undefined' ? window : globalThis);
