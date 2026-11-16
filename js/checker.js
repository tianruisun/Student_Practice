/* Answer checking.
   - ignores spaces, accepts full-width (Chinese keyboard) characters
   - accepts equivalent fractions (6/8 = 3/4), mixed numbers (1 1/2), "3分之2"
   - small tolerance for decimals (2/3 ≈ 0.67)
   - accepts units if present (12cm, 12 厘米), rejects the wrong unit (12 cm when cm² expected)
   - accepts "x = 5" style answers */
(function (root) {
  'use strict';

  /* canonical unit -> spellings (all compared lower-case, spaces removed) */
  const UNIT_ALIASES = {
    'mm': ['mm', '毫米', 'millimetre', 'millimetres', 'millimeter', 'millimeters'],
    'cm': ['cm', '厘米', '公分', 'centimetre', 'centimetres', 'centimeter', 'centimeters'],
    'm': ['m', '米', 'metre', 'metres', 'meter', 'meters'],
    'km': ['km', '千米', '公里', 'kilometre', 'kilometres', 'kilometer', 'kilometers'],
    'mm²': ['mm²', 'mm^2', 'mm2', 'sqmm', '平方毫米'],
    'cm²': ['cm²', 'cm^2', 'cm2', 'sqcm', '平方厘米', 'squarecentimetres', 'squarecentimeters'],
    'm²': ['m²', 'm^2', 'm2', 'sqm', '平方米', 'squaremetres', 'squaremeters'],
    'km²': ['km²', 'km^2', 'km2', '平方千米', '平方公里'],
    'cm³': ['cm³', 'cm^3', 'cm3', 'cc', '立方厘米', 'cubiccentimetres', 'cubiccentimeters'],
    'm³': ['m³', 'm^3', 'm3', '立方米', 'cubicmetres', 'cubicmeters'],
    'ml': ['ml', '毫升', 'millilitres', 'milliliters'],
    'l': ['l', '升', 'litre', 'litres', 'liter', 'liters'],
    'g': ['g', '克', 'grams', 'gram'],
    'kg': ['kg', '千克', '公斤', 'kilograms', 'kilogram'],
    's': ['s', 'sec', 'secs', 'second', 'seconds', '秒'],
    'min': ['min', 'mins', 'minute', 'minutes', '分钟', '分'],
    'h': ['h', 'hr', 'hrs', 'hour', 'hours', '小时', '时'],
    '°': ['°', 'deg', 'degree', 'degrees', '度'],
    '%': ['%', 'percent', 'per cent', 'percentage'],
    '$': ['$', 'dollars', 'dollar', '元', '¥', '￥', '£', 'pounds'],
    'km/h': ['km/h', 'kmh', 'kph', 'km/hr', '千米/小时', '公里/小时', '千米每小时', '公里每小时'],
    'm/s': ['m/s', '米/秒', '米每秒'],
    'items': ['个', '人', '只', '颗', '块', '本', '张', '名', '支', '件', '岁', '年', 'items', 'people', 'years']
  };
  const UNIT_LOOKUP = {};
  for (const canon in UNIT_ALIASES) {
    UNIT_ALIASES[canon].forEach(a => { UNIT_LOOKUP[a.replace(/\s+/g, '').toLowerCase()] = canon; });
  }
  function canonUnit(u) {
    if (u == null) return null;
    const k = String(u).normalize('NFKC').replace(/\s+/g, '').toLowerCase();
    if (k === '') return '';
    return UNIT_LOOKUP[k] || UNIT_LOOKUP[k.replace(/\.$/, '')] || null;
  }

  function normalise(raw) {
    return String(raw == null ? '' : raw)
      .normalize('NFKC')               // full-width digits, ／ ． ： etc.
      .replace(/[−–—﹣－]/g, '-') // minus signs and dashes
      .replace(/[，、]/g, ',')
      .replace(/。/g, '.')
      .replace(/÷/g, '/')
      .trim()
      .toLowerCase();
  }

  /* Parse a student's (or AI's) answer into {value, unit}. Returns null if no number found. */
  function parse(raw) {
    let s = normalise(raw);
    if (!s) return null;
    s = s.replace(/^(answer|ans|答案|答)\s*[:=]?\s*/, '');
    s = s.replace(/^[a-z]\s*=\s*/, '');        // x = 5
    s = s.replace(/[.。]$/, '');               // trailing full stop
    let prefixUnit = '';
    s = s.replace(/^[$¥£]\s*/, () => { prefixUnit = '$'; return ''; });

    let sign = 1;
    s = s.replace(/^([+-])\s*/, (m, g) => { if (g === '-') sign = -1; return ''; });

    let value, rest, m;
    // Chinese fraction: 3分之2 = 2/3 (also "三分之二" is not supported – digits only)
    if ((m = s.match(/^(\d+)\s*分之\s*(\d+)(.*)$/))) {
      if (+m[1] === 0) return null;
      value = +m[2] / +m[1]; rest = m[3];
    } else if ((m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)(.*)$/))) {   // mixed number 1 1/2
      if (+m[3] === 0) return null;
      value = +m[1] + (+m[2] / +m[3]); rest = m[4];
    } else {
      s = s.replace(/(\d)\s+(?=\d)/g, '$1');    // "1 000" -> "1000"
      if ((m = s.match(/^(\d*\.?\d+)\s*\/\s*(\d*\.?\d+)(.*)$/))) {     // fraction
        if (+m[2] === 0) return null;
        value = parseFloat(m[1]) / parseFloat(m[2]); rest = m[3];
      } else if ((m = s.match(/^(\d{1,3}(?:,\d{3})+(?:\.\d+)?)(?!\d)(.*)$/))) { // 1,000 or 12,345.6
        value = parseFloat(m[1].replace(/,/g, '')); rest = m[2];
      } else if ((m = s.match(/^(\d+),(\d{1,2})(?!\d)(.*)$/))) {      // 3,5 (comma decimal)
        value = parseFloat(m[1] + '.' + m[2]); rest = m[3];
      } else if ((m = s.match(/^(\d*\.?\d+)(?:e([+-]?\d+))?(.*)$/))) {
        value = parseFloat(m[1]) * (m[2] ? Math.pow(10, +m[2]) : 1); rest = m[3];
      } else {
        return null;
      }
    }
    if (!isFinite(value)) return null;
    rest = rest.replace(/\s+/g, '');
    if (prefixUnit && !rest) rest = prefixUnit;
    return { value: sign * value, unit: rest };
  }

  function defaultTolerance(expected) {
    if (Number.isInteger(expected)) return 1e-9;
    // decimals / recurring fractions: allow rounding to 2 decimal places, but stay relative for tiny values
    return Math.min(0.005, Math.abs(expected) * 0.01) + 1e-9;
  }

  /* q: {value: number, unit?: string, tol?: number}. Returns {ok, reason}
     reason: 'empty' | 'unreadable' | 'unit' | 'value' | null */
  function check(q, input) {
    if (!String(input == null ? '' : input).trim()) return { ok: false, reason: 'empty' };
    const p = parse(input);
    if (!p) return { ok: false, reason: 'unreadable' };

    const expectUnit = canonUnit(q.unit || '') || '';
    const given = p.unit;
    if (given) {
      const gu = canonUnit(given);
      if (gu === null) return { ok: false, reason: 'unreadable' };
      if (expectUnit && gu !== expectUnit) return { ok: false, reason: 'unit' };
      // no unit expected: a % or other unit typed on a plain-number answer is accepted
      // only if it doesn't change meaning (e.g. "35%" for a percentage answer handled by q.unit)
      if (!expectUnit && gu === '%') return { ok: false, reason: 'unit' };
    }
    const tol = typeof q.tol === 'number' && q.tol > 0 ? q.tol : defaultTolerance(q.value);
    const ok = Math.abs(p.value - q.value) <= tol;
    return { ok, reason: ok ? null : 'value' };
  }

  const api = { parse, check, canonUnit, normalise, UNIT_ALIASES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Checker = api;
})(typeof window !== 'undefined' ? window : globalThis);
