/* AI question generation with Claude (Anthropic) or DeepSeek, called directly from the browser
   with the parent's own API key. Every AI question is validated; bad ones are dropped and topped
   up from the built-in generator, so a quiz always has the full number of questions. */
(function (root) {
  'use strict';

  const PROVIDERS = {
    claude: {
      name: 'Claude',
      models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
      defaultModel: 'claude-opus-5-5'
    },
    deepseek: {
      name: 'DeepSeek',
      models: ['deepseek-chat', 'deepseek-reasoner'],
      defaultModel: 'deepseek-chat'
    }
  };

  const UNITS = ['', 'mm', 'cm', 'm', 'km', 'mm²', 'cm²', 'm²', 'km²', 'cm³', 'm³', 'ml', 'l', 'g', 'kg', 's', 'min', 'h', '°', '%', '$', 'km/h', 'm/s'];

  const str = { type: 'string' };
  const MATHS_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['questions'],
    properties: { questions: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['topic', 'question_en', 'question_zh', 'answer', 'unit', 'solution_en', 'solution_zh'],
      properties: { topic: str, question_en: str, question_zh: str, answer: str, unit: { type: 'string', enum: UNITS }, solution_en: str, solution_zh: str }
    } } }
  };
  const GA_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['questions'],
    properties: { questions: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['topic', 'question_en', 'question_zh', 'choices_en', 'choices_zh', 'correct_index', 'solution_en', 'solution_zh'],
      properties: {
        topic: str, question_en: str, question_zh: str,
        choices_en: { type: 'array', items: str }, choices_zh: { type: 'array', items: str },
        correct_index: { type: 'integer' }, solution_en: str, solution_zh: str
      }
    } } }
  };

  const DIFF_WORDS = {
    1: 'Core – the standard textbook level for this year (China 人教版 / Singapore MOE), one or two steps',
    2: 'Elevated – typical school exam questions for this year in China / Singapore, usually two or three steps',
    3: 'Challenging – TUTORING-CENTRE EXTENSION level (培优班 / selective & scholarship coaching): clearly harder than any school exam, multi-step and non-routine, combining ideas; do NOT keep to the school syllabus difficulty',
    4: 'Competitive – OLYMPIAD level, as hard as the Australian Mathematical Olympiad (AMO) / AIMO and the hardest AMC questions (奥数/数学竞赛): far beyond school standards. Adapt AMO-style problems (find all n such that …, functional equations, Diophantine equations, tilings and counting, games and invariants, extremal problems, sequences) into questions with ONE exact whole-number answer, e.g. "find the sum of all n …" or "how many …". Each must need a genuine insight, not a routine method'
  };
  /* Kindergarten (maths year 0) has its own scale: every level stays one step and within 20 (R10.1) */
  const DIFF_WORDS_K = {
    1: 'Core – Kindergarten level: counting, comparing and adding or taking away within 10, one step',
    2: 'Elevated – Kindergarten level: counting, comparing and adding or taking away within 20, one step',
    3: 'Challenging – the top of Kindergarten: within 20 and one step, with a small twist such as a missing number or ordering three numbers',
    4: 'Competitive – a Kindergarten puzzle: within 20 and still one step, but needing a little thinking, such as a missing number or what comes next in a pattern'
  };

  /* Years 1–12; 13 = Year 12 Extension 1 (3U); 14 = Year 12 Extension 2 (4U) */
  function yearText(year) {
    if (year === 0) return 'a Kindergarten student (NSW Early Stage 1, age about 5)';
    if (year <= 10) return `a Year ${year} student (age about ${year + 5})`;
    if (year <= 12) return `a Year ${year} student studying NSW HSC Mathematics Advanced`;
    if (year === 13) return 'a Year 12 student studying NSW HSC Mathematics Extension 1 (3 Unit)';
    return 'a Year 12 student studying NSW HSC Mathematics Extension 2 (4 Unit)';
  }

  /* ---------- editable prompt templates ----------
     Parents can edit these in Parent settings. {placeholders} are filled in automatically.
     The answer-format rules (FIXED_RULES) are always appended so the app can read the reply. */
  const TEMPLATES = {
    maths: [
      'Write {count} maths questions for {student}.',
      '{topics}',
      'Difficulty: {difficulty}.',
      '{levelNote}',
      '{wordProblems}',
      'Make each question descriptive: 2–4 sentences with a realistic context (people, places, objects, money, sport, science) where it suits the topic, rather than a bare calculation. Questions may be longer when that makes the problem clearer.',
      'Make the questions varied. Solve every question yourself and check the answer before writing it.'
    ].join('\n'),
    ga: [
      'Write {count} General Ability (reasoning) multiple-choice questions for {student}, at the level of selective-school / gifted entrance tests (Singapore GEP, Australian OC/selective, Chinese 思维训练).',
      '{topics}',
      'Difficulty: {difficulty}.',
      '{levelNote}',
      'Use reasoning that survives translation: number and letter series, codes, logical deduction, ordering, truth-tellers, symbol equations, patterns (emoji shapes allowed), directions, calendar, counting and spatial reasoning. Do NOT use synonyms, rhymes, spelling or other language-specific wordplay.',
      'Describe each situation clearly in 2–4 sentences. Solve every question yourself before writing it.'
    ].join('\n'),
    sel: [
      'Write {count} multiple-choice questions for a practice NSW Selective High School Placement Test – Mathematical Reasoning (Year 6 students applying for Year 7).',
      'The real paper has 35 questions in 40 minutes, no calculator, five options A–E, and gets harder towards the end. Write {band}',
      'Each question should take about 1 minute for a strong Year 6 student. Use realistic Australian contexts (dollars, metric units, 24-hour time) and describe each situation clearly. Use names, not "he/she".',
      'For "which statements are correct" questions, number the statements 1, 2, 3 in the question and use options like "statement 1 only", "statements 1 and 3 only", "none of them".',
      'Solve every question yourself and double-check the answer.'
    ].join('\n')
  };

  const FIXED_RULES = {
    common: [
      '- question_en in clear English; question_zh is the SAME question in natural Simplified Chinese.',
      '- solution_en / solution_zh: a short worked solution in each language.',
      '- "topic" must be one of the topic keys given.',
      '- Plain text only: × ÷ − ² ³ √ π ∫ Σ, fractions as a/b, mixed numbers as "2 1/3", powers as x^2. No LaTeX, no markdown.',
      '- Never reveal the answer in the question.'
    ],
    maths: [
      '- Every answer must be a single number: integer, decimal, or fraction like 3/4 (negative allowed). No words, lists, coordinates, surds or expressions. If a problem has several unknowns, ask for just one. If the exact answer is irrational, ask for it to 2 decimal places.',
      '- Put the number ONLY in "answer" and the unit ONLY in "unit" (from the allowed list, "" if none). "$" for money (元 in Chinese), "%" for percentages, "°" for angles.',
      '- For equation problems, show the equation in the solution (e.g. "Let x = …; 3x + 5 = 2x + 12; x = 7").'
    ],
    ga: ['- Exactly 4 options in choices_en and the same 4 options, in the same order, in choices_zh. correct_index is 0–3. Exactly one option is correct; the others are plausible. Letters A–Z may be used in both languages.'],
    sel: [
      '- Exactly 5 options in choices_en and the same 5 options, in the same order, in choices_zh. correct_index is 0–4. Exactly one is correct; the other four come from common mistakes.',
      '- If the options are numbers or measurements, list them in increasing order. No diagrams: everything must be in the text (small tables written as text lines are fine). Numbers must be workable without a calculator.',
      '- "topic" must be one of: snum, smeas, sspace, sstat, slogic.'
    ]
  };
  const defaultTemplate = subject => TEMPLATES[subject];
  const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)).replace(/\n{2,}/g, '\n').trim();

  function buildPrompt(subject, year, topic, diff, n, topicNames, custom) {
    const topics = topic === 'mixed'
      ? `Mix these topics: ${topicNames.filter(([k]) => k !== 'olymp').map(([k, name]) => `${k} (${name})`).join(', ')}.`
      : `Topic: ${topic} (${(topicNames.find(([k]) => k === topic) || [])[1] || topic}).`;
    const tiny = subject === 'maths' && year === 0;   // Kindergarten (R9.2, R10.1)
    const vars = {
      count: n, student: yearText(year), topics, difficulty: (tiny ? DIFF_WORDS_K : DIFF_WORDS)[diff],
      levelNote: tiny ? 'Kindergarten: every number within 20, short sentences a 5-year-old can follow; no multi-step problems, no algebra, no competition problems.' : diff >= 3 ? `The difficulty must be obviously higher than ordinary school work for ${yearText(year)}${diff === 4 ? ' – think competition finalists' : ''}.` : (subject === 'maths' ? 'Use the level of the same grade in mainland China (人教版) and Singapore (MOE), which is harder than Australian/UK expectations.' : ''),
      wordProblems: subject !== 'maths' || tiny ? '' : topic === 'mixed' || topic === 'word'
        ? (year >= 11 ? 'Include some applied (word) problems that need a model or equation.' : `At least ${topic === 'word' ? 'all' : 'a third'} of the questions must be word problems (应用题): a situation the student must turn into a calculation or an equation (方程) and solve.`)
        : 'Include some word problems where they fit the topic.'
    };
    const body = fill(custom && custom.trim() ? custom : TEMPLATES[subject], vars);
    return `${body}\n\nRules (always follow):\n${[...FIXED_RULES.common, ...FIXED_RULES[subject]].join('\n')}`;
  }

  async function fetchWithTimeout(url, opts, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
    catch (e) { throw new Error(e.name === 'AbortError' ? 'timed out' : 'network error'); }
    finally { clearTimeout(timer); }
  }

  async function errorText(res) {
    try { const j = await res.json(); return (j.error && (j.error.message || j.error.type)) || res.status; }
    catch (e) { return 'HTTP ' + res.status; }
  }

  const SYSTEM = 'You write accurate, age-appropriate school practice questions (maths and reasoning) with bilingual English and Simplified Chinese text. Respond only with the requested JSON.';

  async function callClaude(cfg, prompt, schema, diff) {
    const model = cfg.model || PROVIDERS.claude.defaultModel;
    const headers = {
      'content-type': 'application/json',
      'x-api-key': cfg.key,
      'anthropic-version': '2026-10-21',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    const body = {
      model,
      max_tokens: 16000,
      // harder sets get more thinking so the answers are checked properly
      output_config: { effort: diff >= 4 ? 'high' : diff >= 3 ? 'medium' : 'low', format: { type: 'json_schema', schema } },
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }]
    };
    // if a safety classifier declines, let the API retry on its recommended fallback model
    if (!/haiku/.test(model)) { headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; body.fallbacks = 'default'; }
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) }, 180000);
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();
    if (data.stop_reason === 'refusal') throw new Error('request declined');
    if (data.stop_reason === 'max_tokens') throw new Error('response too long');
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(text);
  }

  async function callDeepSeek(cfg, prompt, subject) {
    const shape = subject === 'ga'
      ? '{"questions":[{"topic":"...","question_en":"...","question_zh":"...","choices_en":["...","...","...","..."],"choices_zh":["...","...","...","..."],"correct_index":0,"solution_en":"...","solution_zh":"..."}]}'
      : '{"questions":[{"topic":"...","question_en":"...","question_zh":"...","answer":"...","unit":"...","solution_en":"...","solution_zh":"..."}]}. Allowed units: ' + UNITS.map(u => JSON.stringify(u)).join(', ');
    const res = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify({
        model: cfg.model || PROVIDERS.deepseek.defaultModel,
        max_tokens: 8000,
        // JSON mode is supported by deepseek-chat; the reasoner model ignores/rejects it
        ...(/reasoner/.test(cfg.model || '') ? {} : { response_format: { type: 'json_object' } }),
        messages: [
          { role: 'system', content: SYSTEM + ' Reply with JSON only, in exactly this shape: ' + shape + '.' },
          { role: 'user', content: prompt }
        ]
      })
    }, 180000);
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) throw new Error('empty response');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no JSON in response');
    return JSON.parse(m[0]);
  }

  const clean = v => (typeof v === 'string' ? v.trim() : '');
  function pickTopic(item, allowedTopics, requestedTopic) {
    const tp = clean(item.topic);
    if (requestedTopic !== 'mixed') return requestedTopic;
    return allowedTopics.includes(tp) ? tp : allowedTopics[0];
  }

  /* Turn one raw AI maths item into an app question, or null if it fails validation. */
  function toQuestion(item, year, diff, allowedTopics, requestedTopic) {
    if (!item || typeof item !== 'object') return null;
    const en = clean(item.question_en), zh = clean(item.question_zh), ansRaw = clean(item.answer);
    if (!en || !zh || !ansRaw || en.length > 900 || zh.length > 900) return null;
    const parsed = root.Checker.parse(ansRaw);
    if (!parsed || parsed.unit) return null;              // answer must be a bare number/fraction
    let unit = clean(item.unit);
    if (!UNITS.includes(unit)) unit = root.Checker.canonUnit(unit) || '';
    const show = unit === '$' ? '$' + ansRaw : unit === '%' || unit === '°' ? ansRaw + unit : ansRaw + (unit ? ' ' + unit : '');
    return {
      subject: 'maths', type: 'input', topic: pickTopic(item, allowedTopics, requestedTopic), year, diff, q: { en, zh },
      value: parsed.value, answer: show, unit,
      sol: { en: clean(item.solution_en), zh: clean(item.solution_zh) || clean(item.solution_en) }, source: 'ai'
    };
  }

  /* Turn one raw AI General-ability item into a multiple-choice question, or null. */
  function toMcQuestion(item, year, diff, allowedTopics, requestedTopic) {
    if (!item || typeof item !== 'object') return null;
    const en = clean(item.question_en), zh = clean(item.question_zh);
    const ce = Array.isArray(item.choices_en) ? item.choices_en.map(clean) : [], cz = Array.isArray(item.choices_zh) ? item.choices_zh.map(clean) : [];
    const ci = item.correct_index;
    if (!en || !zh || en.length > 900 || zh.length > 900) return null;
    if (ce.length < 3 || ce.length > 5 || cz.length !== ce.length || ce.some(c => !c || c.length > 120) || cz.some(c => !c)) return null;
    if (!Number.isInteger(ci) || ci < 0 || ci >= ce.length) return null;
    if (new Set(ce).size !== ce.length) return null;
    return {
      subject: 'ga', type: 'mc', topic: pickTopic(item, allowedTopics, requestedTopic), year, diff, q: { en, zh },
      choices: ce.map((c, i) => ({ en: c, zh: cz[i] })), correct: ci,
      sol: { en: clean(item.solution_en), zh: clean(item.solution_zh) || clean(item.solution_en) }, source: 'ai'
    };
  }

  async function oneBatch(cfg, subject, year, topic, diff, n, topicNames) {
    const allowed = topicNames.map(([k]) => k);
    const prompt = buildPrompt(subject, year, topic, diff, n, topicNames, cfg.prompts && cfg.prompts[subject]);
    const raw = cfg.provider === 'deepseek'
      ? await callDeepSeek(cfg, prompt, subject)
      : await callClaude(cfg, prompt, subject === 'ga' ? GA_SCHEMA : MATHS_SCHEMA, diff);
    const items = Array.isArray(raw) ? raw : raw && raw.questions;
    if (!Array.isArray(items)) throw new Error('unexpected response');
    const conv = subject === 'ga' ? toMcQuestion : toQuestion;
    return items.map(item => conv(item, year, diff, allowed, topic)).filter(Boolean);
  }

  /* large sets are written in parallel batches of up to 12 */
  async function generateSet(cfg, subject, year, topic, diff, n, topicNames) {
    const sizes = []; for (let left = n; left > 0; left -= 12) sizes.push(Math.min(12, left));
    const res = await Promise.allSettled(sizes.map(k => oneBatch(cfg, subject, year, topic, diff, k, topicNames)));
    const seen = new Set(), out = [];
    res.filter(r => r.status === 'fulfilled').flatMap(r => r.value).forEach(q => { if (!seen.has(q.q.en) && out.length < n) { seen.add(q.q.en); out.push(q); } });
    if (!out.length) { const err = res.find(r => r.status === 'rejected'); throw (err ? err.reason : new Error('no usable questions')); }
    return out;
  }

  /* ---------- Selective test (NSW Selective High School Placement Test – Mathematical Reasoning style) ---------- */
  const SEL_TOPICS = [['snum', 'Number & algebra'], ['smeas', 'Measurement & time'], ['sspace', 'Space & geometry'], ['sstat', 'Statistics & probability'], ['slogic', 'Problem solving']];
  const SEL_TIER = {
    1: 'EASIER questions, like questions 1–12 of the real paper: one or two steps (24-hour time, place value, simple measurement and capacity, multiples, simple symbol equations, number sentences, rounding).',
    2: 'MEDIUM questions, like questions 13–25: two or three steps (probability from ratios, working backwards with money, "which statements are correct" about fractions or data, unit conversions, pairs of weights, LCM problems, Venn-style overlaps, fractions of a remainder).',
    3: 'HARDER questions, like questions 26–35: non-routine reasoning (magic squares, time zones with flights, sequences defined by a rule, two-condition counting such as "multiples of 3 but not of 8", best-value buying, clock angles, quarter-turn directions, digit reversal, parity "which cannot be correct", HCF/LCM pairs, hidden cubes, timetables).'
  };
  function buildSelectivePrompt(tier, n, custom) {
    const body = fill(custom && custom.trim() ? custom : TEMPLATES.sel, { count: n, band: SEL_TIER[tier], topics: '', difficulty: '', student: 'a Year 6 student' });
    return `${body}\nUse topic keys: ${SEL_TOPICS.map(([k, v]) => `${k} (${v})`).join(', ')}; spread them out.\n\nRules (always follow):\n${[...FIXED_RULES.common, ...FIXED_RULES.sel].join('\n')}`;
  }

  async function generateSelective(cfg, len) {
    const counts = len === 'short' ? [6, 7, 5] : [12, 13, 10];
    const allowed = SEL_TOPICS.map(([k]) => k);
    const batches = await Promise.allSettled([1, 2, 3].map(async (tier, k) => {
      const prompt = buildSelectivePrompt(tier, counts[k], cfg.prompts && cfg.prompts.sel);
      const raw = cfg.provider === 'deepseek' ? await callDeepSeek(cfg, prompt, 'ga') : await callClaude(cfg, prompt, GA_SCHEMA, tier + 1);
      const items = Array.isArray(raw) ? raw : raw && raw.questions;
      if (!Array.isArray(items)) throw new Error('unexpected response');
      const out = [], seen = new Set();
      for (const item of items) {
        const q = toMcQuestion(item, 6, tier, allowed, 'mixed');
        if (!q || q.choices.length !== 5 || seen.has(q.q.en)) continue;
        seen.add(q.q.en); q.subject = 'sel'; q.tier = tier; out.push(q);
        if (out.length >= counts[k]) break;
      }
      return out;
    }));
    const qs = batches.filter(b => b.status === 'fulfilled').flatMap(b => b.value);
    if (!qs.length) { const err = batches.find(b => b.status === 'rejected'); throw (err ? err.reason : new Error('no usable questions')); }
    return qs;
  }

  const api = { PROVIDERS, generateSet, generateSelective, toQuestion, toMcQuestion, buildPrompt, buildSelectivePrompt, defaultTemplate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AI = api;
})(typeof window !== 'undefined' ? window : globalThis);
