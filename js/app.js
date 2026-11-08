/* Screens: home → (loading) → quiz → results; progress; parent settings.
   All visible text comes from I18N.t(); render functions can be re-run at any time
   (e.g. after a language switch) without touching what the student has typed. */
(function () {
  'use strict';

  const { t } = window.I18N;
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const lang = () => window.I18N.lang;

  /* ---------- storage (every access guarded: private mode etc.) ---------- */
  /* Keys start with "sp." (Student_Practice). The GitHub Pages address shares its origin, and so its localStorage, with
     other apps, so the prefix is the app's own name. Up to v1.6.3 the prefix was "mp.": move those keys once. */
  // Only the names this app used: another app on the same origin may have its own "mp." keys.
  const OLD_KEY = /^mp\.(?:(?:settings|history|badges)(?:\.p\d+)?|pin|ai|profiles|methods|lang)$/;
  (function moveOldKeys() {
    try {
      if (localStorage.getItem('sp.moved') !== null) return;   // once per browser, not on every load
      // list the keys first: removing one while walking by index can reorder the rest and skip a key
      for (const k of Object.keys(localStorage)) {
        if (!OLD_KEY.test(k)) continue;
        const nk = 'sp.' + k.slice(3);
        if (localStorage.getItem(nk) !== null) continue;      // both exist: keep both, never delete the only copy of either
        localStorage.setItem(nk, localStorage.getItem(k));
        localStorage.removeItem(k);
      }
      localStorage.setItem('sp.moved', '1');
    } catch (e) { /* storage blocked: nothing to move */ }
  })();
  try { localStorage.removeItem('sp.methods'); } catch (e) { /* ignore */ }
  let warnedFull = false;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); return true; }
      catch (e) {
        // storage full or blocked (private mode): say so once, instead of losing progress silently
        if (!warnedFull) { warnedFull = true; setTimeout(() => toast(t('store.failed'), 8000), 0); }
        return false;
      }
    },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  const K = { settings: 'sp.settings', history: 'sp.history', pin: 'sp.pin', ai: 'sp.ai', profiles: 'sp.profiles', badges: 'sp.badges', tour: 'sp.tour', games: 'sp.games' };
  /* This app's keys that are not a student's data: the language, the "moved" flag and the tour flag. They do not make a
     browser look used (below), and a Forgot-PIN erase keeps them (eraseAll). One list, so the two cannot drift apart. */
  const NOT_USER_DATA = ['sp.lang', 'sp.moved', K.tour];
  const isUserData = k => k.startsWith('sp.') && !NOT_USER_DATA.includes(k);
  /* Guided tour (v1.8.0): "new" from a browser's first visit until the tour is finished or skipped, then "done".
     Read before the student profiles are created: a browser that already holds any of this app's data (profiles, or
     progress, settings or a PIN from before profiles existed) is not a first visit, so people who used an earlier
     version are not shown it (they can open it with the ? button). sp.lang and sp.moved are written on every first
     visit, so they do not count. */
  const usedBefore = (() => {
    try { return Object.keys(localStorage).some(isUserData); }
    catch (e) { return false; }
  })();
  const tourState = store.get(K.tour, null) || (usedBefore ? 'done' : 'new');
  if (store.get(K.tour, null) === null) store.set(K.tour, tourState);   // stored, so a later reset of progress does not undo it

  /* ---------- student profiles: up to 3 per browser, each with its own progress and settings ---------- */
  const MAX_PROFILES = 3;
  const Profiles = (() => {
    let P = store.get(K.profiles, null);
    if (!P || !Array.isArray(P.list) || !P.list.length) {
      P = { list: [{ id: 'p1', name: '' }], active: 'p1' };
      // move progress and settings from before profiles existed into the first student
      const oldH = store.get(K.history, null), oldS = store.get(K.settings, null);
      if (oldH && !store.get(K.history + '.p1', null)) store.set(K.history + '.p1', oldH);
      if (oldS && !store.get(K.settings + '.p1', null)) store.set(K.settings + '.p1', oldS);
      store.set(K.profiles, P);
    }
    if (!P.list.some(x => x.id === P.active)) P.active = P.list[0].id;
    return {
      get list() { return P.list; },
      get active() { return P.list.find(x => x.id === P.active); },
      name(pr) { return pr.name || t('profile.default', { n: P.list.indexOf(pr) + 1 }); },
      histKey() { return K.history + '.' + P.active; },
      setKey() { return K.settings + '.' + P.active; },
      badgeKey() { return K.badges + '.' + P.active; },
      gameKey() { return K.games + '.' + P.active; },
      select(id) { P.active = id; store.set(K.profiles, P); },
      add(name) { if (P.list.length >= MAX_PROFILES) return null; let n = 1; while (P.list.some(x => x.id === 'p' + n)) n++; const pr = { id: 'p' + n, name }; P.list.push(pr); P.active = pr.id; store.set(K.profiles, P); return pr; },
      // fields: name, schoolYear (1–12), schoolYearSet (calendar year it was entered), dob ('YYYY-MM')
      update(id, fields) { const pr = P.list.find(x => x.id === id); if (pr) { Object.assign(pr, fields); store.set(K.profiles, P); } },
      remove(id) { if (P.list.length <= 1) return false; P.list = P.list.filter(x => x.id !== id); store.del(K.history + '.' + id); store.del(K.settings + '.' + id); store.del(K.badges + '.' + id); store.del(K.games + '.' + id); if (P.active === id) P.active = P.list[0].id; store.set(K.profiles, P); return true; }
    };
  })();
  const histKey = () => Profiles.histKey();

  /* ---------- state ---------- */
  const YEARS = Gen.YEARS;   // 1–12, 13 = Year 12 Extension 1 (3U), 14 = Year 12 Extension 2 (4U)
  const yearLabel = y => (y >= 11 ? t('year.' + y) : t('home.yearN', { n: y }));
  const schoolOf = y => (y <= 6 ? 'primary' : 'high');
  const COUNTS = [1, 5, 10, 15, 20];
  const defaults = { subject: 'maths', year: 6, topic: 'mixed', diff: 2, count: 10, selLen: 'full', view: 'single' };
  const SUBJECTS = ['maths', 'ga', 'sel', 'comp'];
  const AI_SUBJECTS = ['maths', 'ga', 'sel'];
  const isTimed = sub => sub === 'sel' || sub === 'comp';
  const S = {
    screen: 'home',
    settings: Object.assign({}, defaults, store.get(Profiles.setKey(), {})),
    quiz: null,              // { questions, i, results:[{given:[], ok, tries}], tries, status, fbKey }
    parent: false,           // unlocked for this page session only
    loadingName: '',
    lastQuizSettings: null
  };

  /* ---------- navigation ---------- */
  function go(screen) {
    if (screen === 'parent' && !S.parent) return;
    if (S.screen === 'game' && screen !== 'game' && game) game.stop();   // leaving a round ends it, with no score kept
    if (S.screen === 'puzzle' && screen !== 'puzzle' && puzzle) puzzle.stop();   // the same for the puzzle games
    S.screen = screen;
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + screen; });
    document.querySelectorAll('.tab').forEach(b => {
      const cur = b.dataset.go === screen || (b.dataset.go === 'home' && ['quiz', 'results', 'loading'].includes(screen)) ||
        (b.dataset.go === 'games' && (screen === 'game' || screen === 'puzzle'));
      if (cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    window.I18N.applyStatic();
    const pb = $('#parentBtn');
    pb.setAttribute('aria-pressed', String(S.parent));
    $('#parentLabel').textContent = t(S.parent ? 'nav.parentOn' : 'nav.parent');
    $('#parentIcon').textContent = S.parent ? '🔓' : '🔒';
    const who = Profiles.name(Profiles.active);
    $('#profileName').textContent = who;
    $('#helloText').textContent = t('home.hello', { name: who });
    $('#profileAvatar').textContent = (who.trim()[0] || 'S').toUpperCase();
    const nb = badgeCount(), ab = $('#avatarBadge');
    ab.hidden = !nb; ab.textContent = '🏅' + nb;
    const inGame = S.screen === 'game' || S.screen === 'puzzle';
    document.body.classList.toggle('no-nav', S.screen === 'quiz' || S.screen === 'loading' || inGame);
    document.body.classList.toggle('in-game', inGame);   // the header too: a round needs the whole screen on a small phone
    $('#tourBtn').hidden = S.screen === 'quiz' || S.screen === 'loading' || inGame;   // the tour shows Home; never leave a set for it
    ({ home: renderHome, loading: renderLoading, quiz: renderQuiz, results: renderResults, progress: renderProgress, parent: renderParent, games: renderGames, game: renderGame, puzzle: renderPuzzle })[S.screen]();
  }

  /* ---------- HOME ---------- */
  function chips(container, name, options, value, onChange) {
    container.innerHTML = '';
    options.forEach(([v, label]) => {
      const lab = el('label', 'chip');
      const inp = el('input'); inp.type = 'radio'; inp.name = name; inp.value = String(v);
      inp.checked = String(v) === String(value);
      inp.addEventListener('change', () => onChange(v));
      lab.append(inp, el('span', '', label));
      container.append(lab);
    });
  }

  /* subject tiles: big cards with an icon (radio buttons underneath, so they work with keyboards and screen readers) */
  /* drawn icons (not emoji) so every tile looks the same size on every device */
  const SVG = d => `<svg viewBox="0 0 32 32" aria-hidden="true">${d}</svg>`;
  const SUBJECT_ICON = {
    maths: SVG('<rect x="3" y="3" width="26" height="26" rx="7" fill="#7c4dff"/><path d="M9.5 11h6M12.5 8v6M18 11h5M9.5 21.5l5-5M14.5 21.5l-5-5M18 19h5M18 23h5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'),
    ga: SVG('<path d="M16 3.5a9 9 0 0 0-5.2 16.3c.9.7 1.4 1.6 1.4 2.7V24h7.6v-1.5c0-1.1.5-2 1.4-2.7A9 9 0 0 0 16 3.5z" fill="#38bdf8"/><path d="M12.6 26.5h6.8M13.6 29h4.8" stroke="#0369a1" stroke-width="2.2" stroke-linecap="round"/><path d="M12.5 13.5l2.5 2.5 4.5-5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    sel: SVG('<rect x="6" y="5" width="20" height="24" rx="4" fill="#f59e0b"/><rect x="11" y="2.5" width="10" height="5.5" rx="2" fill="#b45309"/><path d="M10.5 14h11M10.5 19h11M10.5 24h6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'),
    comp: SVG('<path d="M10 4h12v8a6 6 0 0 1-12 0z" fill="#f43f5e"/><path d="M10 6.5H5.5a4.5 4.5 0 0 0 4.8 5.5M22 6.5h4.5a4.5 4.5 0 0 1-4.8 5.5" stroke="#f43f5e" stroke-width="2.2" fill="none"/><path d="M16 18v5" stroke="#be123c" stroke-width="2.6"/><rect x="10" y="23.5" width="12" height="5" rx="1.8" fill="#be123c"/><path d="M16 7.5l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="#fde68a"/>')
  };
  function tiles(container, options, value, onChange) {
    container.innerHTML = '';
    options.forEach(([v, label, icon, sub], k) => {
      const lab = el('label', 'tile t' + k);
      const inp = el('input'); inp.type = 'radio'; inp.name = 'subject'; inp.value = String(v);
      inp.checked = String(v) === String(value);
      inp.addEventListener('change', () => onChange(v));
      const box = el('span', 'tile-box');
      const ic = el('span', 'tile-icon'); ic.innerHTML = icon;
      box.append(ic, el('span', 'tile-label', label), el('span', 'tile-sub', sub));
      lab.append(inp, box); container.append(lab);
    });
  }

  /* fill a <select> (combo box) and keep the current value */
  function combo(sel, options, value, onChange) {
    sel.innerHTML = '';
    options.forEach(([v, label]) => { const o = el('option', '', label); o.value = String(v); sel.append(o); });
    sel.value = String(value);
    if (sel.value !== String(value) && options.length) sel.value = String(options[0][0]);
    sel.onchange = () => onChange(sel.value);
  }

  function appendFig(parent, q) {
    if (!q.fig || !window.Fig) return;
    const f = el('div', 'figwrap small-fig'); f.innerHTML = Fig.render(q.fig, lang()); parent.append(f);
  }

  function topicOptions(subject, year) {
    return [['mixed', t('topic.mixed')], ...Gen.topicsFor(subject, year).map(k => [k, t('topic.' + k)])];
  }

  /* text of the correct answer / of what the student gave, in the current language */
  function answerText(q) {
    if (q.type === 'mc') { const c = q.choices[q.correct]; return 'ABCDE'[q.correct] + '. ' + (c[lang()] || c.en); }
    return q.answer;
  }
  function givenText(q, given) {
    if (!given || !given.length) return t('res.blank');
    if (q.type === 'mc') return given.map(i => { const c = q.choices[i]; return c ? 'ABCDE'[i] + '. ' + (c[lang()] || c.en) : ''; }).join(' → ');
    return given.join(' → ');
  }

  function saveSettings() { store.set(Profiles.setKey(), S.settings); }

  function renderHome() {
    const st = S.settings;
    if (!SUBJECTS.includes(st.subject)) st.subject = 'maths';
    if (![1, 2, 3, 4].includes(st.diff)) st.diff = 2;
    if (!YEARS.includes(st.year)) st.year = 6;
    if (st.topic !== 'mixed' && !Gen.topicsFor(st.subject, st.year).includes(st.topic)) st.topic = 'mixed';
    tiles($('#subjectChips'), SUBJECTS.map(s => [s, t('subject.' + s), SUBJECT_ICON[s], t('subject.sub.' + s)]), st.subject, v => { st.subject = v; st.topic = 'mixed'; saveSettings(); renderHome(); });
    $('#subjectNote').textContent = t(st.subject === 'ga' ? 'home.gaNote' : st.subject === 'sel' ? 'home.selNote' : st.subject === 'comp' ? 'home.compNote' : 'home.levelNote');
    const isSel = st.subject === 'sel', isComp = st.subject === 'comp';
    $('#practiceOptions').hidden = isSel || isComp;
    $('#selOptions').hidden = !isSel;
    $('#compOptions').hidden = !isComp;
    if (isComp) renderCompOptions();
    if (!['full', 'short'].includes(st.selLen)) st.selLen = 'full';
    combo($('#selLenSel'), ['full', 'short'].map(k => [k, t('sel.len.' + k)]), st.selLen, v => { st.selLen = v; saveSettings(); });
    $('#startBtn').textContent = t(isSel ? 'sel.start' : isComp ? 'comp.start' : 'home.start');
    if (!YEARS.includes(st.year)) st.year = 6;
    const school = schoolOf(st.year);
    // A year chosen here is the student's or parent's own choice: remembered, so a suggestion that appears later
    // (student details, an imported file) does not replace it (R6.1, v1.7.0).
    combo($('#schoolSel'), ['primary', 'high'].map(k => [k, t('school.' + k)]), school, v => {
      st.year = v === 'primary' ? Math.min(st.year, 6) : Math.max(st.year, 7); st.yearPicked = true; saveSettings(); renderHome();
    });
    combo($('#yearSel'), (school === 'primary' ? Gen.PRIMARY : Gen.HIGH).map(y => [y, yearLabel(y)]), st.year, v => { st.year = +v; st.yearPicked = true; saveSettings(); renderHome(); });
    combo($('#topicSel'), topicOptions(st.subject, st.year), st.topic, v => { st.topic = v; saveSettings(); });
    combo($('#diffSel'), [1, 2, 3, 4].map(d => [d, t('diff.' + d)]), st.diff, v => { st.diff = +v; saveSettings(); });
    const isCustom = !COUNTS.includes(st.count);
    combo($('#countSel'), [...COUNTS.map(n => [n, String(n)]), ['custom', t('home.countCustom')]], isCustom ? 'custom' : st.count, v => {
      if (v === 'custom') { const c = $('#countCustom'); c.hidden = false; if (!c.value) c.value = st.count; c.focus(); c.select(); st.count = Math.max(1, Math.min(50, +c.value || st.count)); }
      else { st.count = +v; $('#countCustom').hidden = true; }
      saveSettings();
    });
    $('#countCustom').hidden = !isCustom;
    if (isCustom) $('#countCustom').value = st.count;
    $('#heroSummary').textContent = isSel ? t('subject.sel') + ' · ' + t(st.selLen === 'short' ? 'sel.len.short' : 'sel.len.full')
      : isComp ? t('topic.' + compPaper(st))
      : [t('subject.' + st.subject), yearLabel(st.year), t('topic.' + st.topic), t('diff.short.' + st.diff)].join(' · ');
    $('#optionsTitle').hidden = isSel || isComp;
    const ai = aiConfig();
    $('#sourceLine').textContent = ai ? t('home.source.ai', { name: AI.PROVIDERS[ai.provider].name }) : t('home.source.local');
  }

  /* ---------- competition paper options (AMC divisions / AIMO) ---------- */
  const compPaper = st => (Competition.PAPERS[st.compPaper] ? st.compPaper : Competition.paperForYear(st.year));
  const compLen = st => (st.compLen === 'short' ? 'short' : 'full');
  function compRules(paper, len) {
    const lay = Competition.layout(paper, len), n = lay.length, m = Competition.minutes(paper, len);
    const mc = lay.filter(x => x[0][0] !== 'N').length, total = lay.reduce((a, x) => a + x[1], 0), groups = [];
    lay.forEach(([, mk], i) => { const g = groups[groups.length - 1]; if (g && g.mk === mk) g.b = i + 1; else groups.push({ a: i + 1, b: i + 1, mk }); });
    const marks = groups.map(g => (g.a === g.b ? 'Q' + g.a : `Q${g.a}–${g.b}`) + ': ' + g.mk).join(', ');
    return [
      t('comp.rule.time', { n, m: m >= 120 ? t('comp.hours', { h: m / 60 }) : t('comp.minutes', { m }) }),
      mc ? t('comp.rule.mixed', { a: mc, b: mc + 1, n }) : t('comp.rule.int'),
      t('comp.rule.marks', { marks, total }),
      t(Competition.PAPERS[paper].kind === 'aimo' ? 'comp.rule.aimo' : 'comp.rule.amc'),
      t('comp.rule.note')
    ];
  }
  function renderCompOptions() {
    const st = S.settings, paper = compPaper(st), len = compLen(st);
    combo($('#compPaperSel'), Object.keys(Competition.PAPERS).map(k => [k, t('topic.' + k)]), paper, v => { st.compPaper = v; saveSettings(); renderHome(); });
    combo($('#compLenSel'), ['full', 'short'].map(k => [k, t('comp.len.' + k)]), len, v => { st.compLen = v; saveSettings(); renderHome(); });
    const ul = $('#compRules'); ul.innerHTML = '';
    compRules(paper, len).forEach(r => ul.append(el('li', '', r)));
  }

  /* ---------- starting a quiz ---------- */
  function aiConfig() {
    const c = store.get(K.ai, null);
    return c && c.provider && c.provider !== 'local' && c.key ? c : null;
  }
  function topicNames(subject, year) { return Gen.topicsFor(subject, year).map(k => [k, window.I18N.STRINGS.en['topic.' + k]]); }

  async function startQuiz(settings) {
    if (isTimed(settings.subject)) return startTest(settings);
    if (settings.similar) return startSimilar(settings.similar, settings.perQ);
    S.loadingKey = 'loading.ai';
    const { year, topic, diff, count } = settings, subject = settings.subject || 'maths';
    S.lastQuizSettings = Object.assign({}, settings);
    let questions = null;
    const ai = aiConfig();
    if (ai) {
      if (navigator.onLine === false) {
        toast(t('offline'));
      } else {
        S.loadingName = AI.PROVIDERS[ai.provider].name;
        go('loading');
        try {
          questions = await AI.generateSet(ai, subject, year, topic, diff, count, topicNames(subject, year));
          if (questions.length < count) {
            questions = questions.concat(Gen.generateSet(subject, year, topic, diff, count - questions.length));
          }
        } catch (e) {
          console.warn('AI generation failed:', e);
          toast(t('loading.fallback', { err: e.message || String(e) }), 7000);
          questions = null;
        }
        if (S.screen !== 'loading') return; // user navigated away while waiting
      }
    }
    if (!questions) questions = Gen.generateSet(subject, year, topic, diff, count);
    const fromTopic = questions.filter(q => q.topic === topic).length;
    if (topic !== 'mixed' && fromTopic < questions.length) {
      toast(t('quiz.toppedUp', { n: fromTopic, topic: t('topic.' + topic) }), 7000);
    }
    S.quiz = {
      exam: false, questions, i: 0, page: 0, results: [], started: Date.now(),
      st: questions.map(() => ({ status: 'answering', tries: 0, given: [], sel: null, fbKey: '', draft: '' })),
      settings: Object.assign({ subject }, settings)
    };
    go('quiz');
    focusCardInput(0);
  }

  /* reinforcement: n similar questions for each ticked review item */
  function startSimilar(items, perQ) {
    const questions = Similar.makeSet(items, perQ, 50);
    if (!questions.length) return toast(t('rev.none'));
    const first = items[0], fb = first.fb || {};
    const settings = { subject: 'review', topic: 'similar', year: first.q.year || fb.year || S.settings.year, diff: first.q.diff || fb.diff || S.settings.diff, count: questions.length };
    S.lastQuizSettings = { similar: items, perQ };
    S.quiz = {
      exam: false, questions, i: 0, page: 0, results: [], started: Date.now(),
      st: questions.map(() => ({ status: 'answering', tries: 0, given: [], sel: null, fbKey: '', draft: '' })),
      settings
    };
    go('quiz');
    focusCardInput(0);
  }

  function renderLoading() {
    $('#loadingText').textContent = t(S.loadingKey || 'loading.ai', { name: S.loadingName });
  }

  /* ---------- QUIZ: question cards, one at a time or in pages ---------- */
  const PAGE = 5;
  const view = () => (S.settings.view === 'pages' ? 'pages' : 'single');
  const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, k) => a + k);
  const qText = q => q.q[lang()] || q.q.en;
  const doneCount = Q => (Q.exam ? Q.answers.filter(a => a !== null).length : Q.st.filter(x => x.status === 'done').length);

  function focusCardInput(i) {
    setTimeout(() => { const inp = document.querySelector(`#qc${i} input.answer`); if (inp && !inp.disabled) inp.focus({ preventScroll: true }); }, 60);
  }
  function scrollToCard(i) {
    const c = $('#qc' + i);
    if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); else window.scrollTo(0, 0);
  }

  function renderQuiz() {
    const Q = S.quiz; if (!Q) return go('home');
    const n = Q.questions.length, pages = Math.ceil(n / PAGE), v = view();
    if (Q.page >= pages) Q.page = pages - 1;
    const list = $('#qList'); list.innerHTML = '';
    const idx = v === 'single' ? [Q.i] : range(Q.page * PAGE, Math.min(n, (Q.page + 1) * PAGE));
    idx.forEach(i => list.append(cardEl(i)));
    renderChrome();
  }

  /* header, progress, navigation — everything except the cards themselves */
  function renderChrome() {
    const Q = S.quiz, n = Q.questions.length, pages = Math.ceil(n / PAGE), v = view(), done = doneCount(Q);
    $('#qProgress').textContent = v === 'single' ? t('quiz.progress', { i: Q.i + 1, n }) : t('view.pageOf', { p: Q.page + 1, n: pages });
    $('#qBar').style.width = (100 * done / n) + '%';
    $('#viewSingle').setAttribute('aria-pressed', String(v === 'single'));
    $('#viewPages').setAttribute('aria-pressed', String(v === 'pages'));
    $('#timer').hidden = !Q.exam;
    $('#pageNav').hidden = v !== 'pages';
    $('#prevPage').disabled = Q.page === 0;
    $('#nextPage').disabled = Q.page >= pages - 1;
    // practice and the timed test share the same navigation: move freely, finish at any time
    $('#examNav').hidden = false;
    $('#finishBtn').textContent = t(Q.exam ? 'sel.finish' : 'quiz.finish');
    {
      $('#examSingleNav').hidden = v !== 'single';
      $('#prevQ').disabled = Q.i === 0;
      $('#nextQ').disabled = Q.i === n - 1;
      $('#answeredCount').textContent = t('sel.answered', { a: done, n });
      const pal = $('#palette'); pal.innerHTML = '';
      const onScreen = v === 'single' ? [Q.i] : range(Q.page * PAGE, (Q.page + 1) * PAGE);
      Q.questions.forEach((_, k) => {
        const state = Q.exam ? (Q.answers[k] !== null ? ' done' : '') : Q.st[k].status === 'done' ? (Q.results[k] && Q.results[k].ok ? ' done good' : ' done wrong') : '';
        const b = el('button', 'pal' + state + (onScreen.includes(k) ? ' current' : ''), String(k + 1));
        b.type = 'button';
        if (k === Q.i && v === 'single') b.setAttribute('aria-current', 'true');
        b.addEventListener('click', () => goToQuestion(k));
        pal.append(b);
      });
      if (Q.exam) tickTimer();
    }
  }

  function goToQuestion(k) {
    const Q = S.quiz;
    Q.i = k;
    if (view() === 'pages') { const p = Math.floor(k / PAGE); if (p !== Q.page) { Q.page = p; renderQuiz(); } scrollToCard(k); }
    else { renderQuiz(); window.scrollTo(0, 0); }
  }

  function refreshCard(i) {
    const old = $('#qc' + i);
    if (old) old.replaceWith(cardEl(i));
    renderChrome();
  }

  /* one question card */
  function cardEl(i) {
    const Q = S.quiz, q = Q.questions[i], st = Q.exam ? null : Q.st[i], v = view();
    const done = !Q.exam && st.status === 'done';
    const card = el('article', 'qcard' + (done ? (Q.results[i] && Q.results[i].ok ? ' is-ok' : ' is-bad') : ''));
    card.id = 'qc' + i;
    card.setAttribute('aria-labelledby', 'qt' + i);
    const head = el('div', 'qhead');
    head.append(el('span', 'qnum', String(i + 1)), el('span', 'badge', t('topic.' + q.topic)));
    if (q.marks) head.append(el('span', 'badge marks', t('comp.marks', { m: q.marks })));
    const text = el('div', 'question'); text.innerHTML = Fig.questionHTML(qText(q)); text.id = 'qt' + i;
    card.append(head, text);
    if (q.fig && window.Fig) { const f = el('div', 'figwrap'); f.innerHTML = Fig.render(q.fig, lang()); card.append(f); }
    if (!Q.exam && q.topic === 'word') card.append(el('p', 'tip small', t('quiz.wordTip')));

    if (q.type === 'mc') {
      const box = el('div', 'choices'); box.setAttribute('role', 'radiogroup'); box.setAttribute('aria-labelledby', 'qt' + i);
      const selected = Q.exam ? Q.answers[i] : st.sel;
      const choose = k => {
        if (Q.exam) { if (Q.finished) return; Q.answers[i] = k; refreshCard(i); return; }
        if (st.status === 'done') return;
        st.sel = k; st.fbKey = ''; refreshCard(i);
      };
      // A radio group is one tab stop: Tab reaches the chosen option (or the first), arrow keys move and choose.
      const tabStop = selected === null || selected === undefined ? 0 : selected;
      q.choices.forEach((c, k) => {
        const b = el('button', 'choice'); b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(selected === k));
        b.tabIndex = k === tabStop ? 0 : -1;
        b.disabled = done || (Q.exam && Q.finished);
        if (done && S.parent && k === q.correct) b.classList.add('is-correct');
        const ct = el('span', 'ctext'); ct.innerHTML = Fig.math(c[lang()] || c.en);
        b.append(el('span', 'letter', 'ABCDE'[k]), ct);
        b.addEventListener('click', () => choose(k));
        box.append(b);
      });
      box.addEventListener('keydown', e => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const n = q.choices.length, cur = [...box.children].indexOf(document.activeElement);
        const k = ((cur < 0 ? tabStop : cur) + step + n) % n;
        choose(k);
        const again = $('#qc' + i) && $('#qc' + i).querySelectorAll('.choice')[k];
        if (again) again.focus();
      });
      card.append(box);
      if (!Q.exam && !done) {
        const chk = el('button', 'btn primary', t('quiz.check')); chk.type = 'button';
        chk.addEventListener('click', () => submitCard(i));
        card.append(chk);
      }
    } else {
      const form = el('form', 'answer-form'); form.noValidate = true; form.autocomplete = 'off';
      const lab = el('label', 'label', t('quiz.label')); lab.htmlFor = 'ans' + i;
      lab.append(infoTip(t(Q.exam && q.intAnswer ? 'comp.intHint' : 'quiz.hint'), t('quiz.hintLabel')));
      const inp = el('input', 'answer'); inp.id = 'ans' + i; inp.type = 'text';
      Object.assign(inp, {
        inputMode: q.intAnswer ? 'numeric' : 'text', autocomplete: 'off', spellcheck: false, placeholder: t(q.intAnswer ? 'comp.placeholder' : 'quiz.placeholder'),
        value: Q.exam ? (Q.answers[i] === null ? '' : Q.answers[i]) : st.draft, disabled: done || (Q.exam && Q.finished)
      });
      inp.setAttribute('autocorrect', 'off'); inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('enterkeyhint', Q.exam ? 'next' : 'done');
      inp.addEventListener('input', () => {
        if (!Q.exam) { st.draft = inp.value; return; }
        if (Q.finished) return;
        Q.answers[i] = inp.value.trim() ? inp.value.trim() : null;   // exam: saved as typed, marked when the paper is finished
        renderChrome();
      });
      form.append(lab, inp);
      if (!Q.exam && !done) {
        const chk = el('button', 'btn primary', t('quiz.check')); chk.type = 'submit';
        form.append(chk);
      }
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (!Q.exam) return submitCard(i);
        if (view() === 'single' && Q.i < Q.questions.length - 1) { goToQuestion(Q.i + 1); focusCardInput(Q.i); }
      });
      card.append(form);
    }

    if (!Q.exam) {
      const fb = el('p', 'feedback' + (st.fbKey ? (done && Q.results[i] && Q.results[i].ok ? ' ok' : ' bad') : ''), st.fbKey ? t(st.fbKey) : '');
      fb.setAttribute('role', 'status');
      card.append(fb);
      if (done && S.parent) card.append(el('p', 'parent-box', t('quiz.parentAnswer', { a: answerText(q) })));
      if (done && v === 'single') {
        const last = Q.st.every(x => x.status === 'done') || (Q.i === Q.questions.length - 1 && Q.st.slice(0, -1).every(x => x.status === 'done'));
        const nx = el('button', 'btn primary next', t(last ? 'quiz.finish' : 'quiz.next')); nx.type = 'button';
        nx.addEventListener('click', nextSingle);
        card.append(nx);
      }
    }
    return card;
  }

  function submitCard(i) {
    const Q = S.quiz, q = Q.questions[i], st = Q.st[i];
    if (!Q || Q.exam || st.status === 'done') return;
    if (q.type === 'mc') {   // one try for multiple choice
      if (st.sel === null) { st.fbKey = 'quiz.pickFirst'; refreshCard(i); return; }
      const ok = st.sel === q.correct;
      Q.results[i] = { given: [st.sel], ok, tries: 1 };
      st.status = 'done'; st.fbKey = ok ? 'quiz.correct' : 'quiz.wrong';
    } else {
      const input = st.draft;
      const res = Checker.check(q, input);
      if (res.reason === 'empty' || res.reason === 'unreadable') {
        st.fbKey = res.reason === 'empty' ? 'quiz.empty' : 'quiz.unread';
        refreshCard(i); focusCardInput(i); return;
      }
      st.tries += 1;
      st.given = st.given.concat(input.trim());
      if (res.ok || st.tries >= 2) {
        Q.results[i] = { given: st.given, ok: res.ok, tries: st.tries };
        st.status = 'done';
        st.fbKey = res.ok ? (st.tries === 1 ? 'quiz.correct' : 'quiz.correct2') : 'quiz.wrong';
      } else {
        st.status = 'retry'; st.fbKey = 'quiz.retry';
        refreshCard(i);
        const inp = document.querySelector(`#qc${i} input.answer`); if (inp) { inp.focus(); inp.select(); }
        return;
      }
    }
    refreshCard(i);
    if (view() === 'single') { const nx = document.querySelector(`#qc${i} .next`); if (nx) nx.focus(); }
  }

  /* single view: go to the next unanswered question, or finish */
  function nextSingle() {
    const Q = S.quiz, n = Q.questions.length;
    for (let k = 1; k <= n; k++) {
      const j = (Q.i + k) % n;
      if (Q.st[j].status !== 'done') { Q.i = j; renderQuiz(); window.scrollTo(0, 0); focusCardInput(j); return; }
    }
    finishPractice(true);
  }
  /* finish a practice set at any time; unanswered questions count as wrong */
  function finishPractice(confirmed) {
    const Q = S.quiz; if (!Q || Q.exam) return;
    const left = Q.st.filter(x => x.status !== 'done').length;
    if (left && !confirmed && !confirm(t('quiz.finishConfirm', { n: left }))) return;
    Q.st.forEach((x, i) => { if (x.status !== 'done') Q.results[i] = { given: x.given, ok: false, tries: x.tries }; });
    saveSession(); go('results');
  }

  function setView(v) {
    const Q = S.quiz, cur = view();
    if (v === cur) return;
    if (Q) { if (v === 'pages') Q.page = Math.floor(Q.i / PAGE); else Q.i = Q.page * PAGE; }
    S.settings.view = v; saveSettings();
    if (Q) { renderQuiz(); window.scrollTo(0, 0); }
  }

  function insertKey(a, k) {
    if (!a || a.disabled) return;
    const s = a.selectionStart ?? a.value.length, e = a.selectionEnd ?? a.value.length;
    if (k === 'back') {
      const from = s === e ? Math.max(0, s - 1) : s;
      a.value = a.value.slice(0, from) + a.value.slice(e);
      a.setSelectionRange(from, from);
    } else {
      a.value = a.value.slice(0, s) + k + a.value.slice(e);
      a.setSelectionRange(s + k.length, s + k.length);
    }
    a.focus();
  }

  /* ---------- SELECTIVE TEST (timed exam: 35 questions / 40 min, or 18 / 20) ---------- */
  let timerId = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  const mmss = ms => { const sec = Math.max(0, Math.round(ms / 1000)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };

  function beginExam(questions, minutes, settings) {
    S.quiz = {
      exam: true, questions, i: 0, page: 0, answers: Array(questions.length).fill(null), results: [], finished: false,
      startedAt: Date.now(), limitMs: minutes * 60000, settings
    };
    go('quiz');
    timerId = setInterval(tickTimer, 1000);
    tickTimer();
  }

  async function startTest(settings) {
    if (settings.subject === 'comp') {   // competition papers come from the built-in banks (answers verified by brute force)
      const paper = compPaper(settings), len = compLen(settings);
      S.lastQuizSettings = Object.assign({}, settings);
      return beginExam(Competition.buildPaper(paper, len), Competition.minutes(paper, len),
        Object.assign({}, settings, { subject: 'comp', topic: paper, compPaper: paper, compLen: len }));
    }
    const len = settings.selLen === 'short' ? 'short' : 'full', spec = len === 'short' ? Selective.SHORT : Selective.FULL;
    S.lastQuizSettings = Object.assign({}, settings);
    let questions = null;
    const ai = aiConfig();
    if (ai && navigator.onLine !== false) {
      S.loadingName = AI.PROVIDERS[ai.provider].name; S.loadingKey = 'loading.sel';
      go('loading');
      try { questions = await AI.generateSelective(ai, len); }
      catch (e) { console.warn('AI test failed:', e); toast(t('loading.fallback', { err: e.message || String(e) }), 7000); questions = null; }
      if (S.screen !== 'loading') return;
    } else if (ai) toast(t('offline'));
    // keep the paper's shape: easy → medium → hard, topping up any tier the AI fell short on
    const mix = Selective.MIX[spec.n], local = Selective.generateTest(len), out = [];
    [1, 2, 3].forEach((tier, k) => {
      const fromAi = (questions || []).filter(q => q.tier === tier).slice(0, mix[k]);
      out.push(...fromAi, ...local.filter(q => q.tier === tier).slice(0, mix[k] - fromAi.length));
    });
    beginExam(out, spec.minutes, Object.assign({}, settings, { subject: 'sel', topic: len === 'short' ? 'selshort' : 'selfull' }));
  }

  function tickTimer() {
    const Q = S.quiz; if (!Q || !Q.exam || Q.finished) return stopTimer();
    const left = Q.limitMs - (Date.now() - Q.startedAt), tm = $('#timer');
    tm.textContent = '⏱ ' + mmss(left);
    tm.setAttribute('aria-label', t('sel.timer') + ' ' + mmss(left));
    tm.classList.toggle('low', left < 5 * 60000);
    if (left <= 0) finishTest(true);
  }

  function finishTest(timeUp) {
    const Q = S.quiz; if (!Q || !Q.exam || Q.finished) return;
    Q.finished = true; stopTimer();
    Q.timeUsed = Math.min(Date.now() - Q.startedAt, Q.limitMs);
    Q.results = Q.questions.map((q, i) => {
      const a = Q.answers[i];
      const ok = a !== null && (q.type === 'mc' ? a === q.correct : Checker.check(q, a).ok);
      return { given: a === null ? [] : [a], ok, tries: 1 };
    });
    Q.marks = Q.questions.reduce((m, q, i) => m + (Q.results[i].ok ? q.marks || 0 : 0), 0);
    Q.maxMarks = Q.questions.reduce((m, q) => m + (q.marks || 0), 0);
    saveSession();
    go('results');
    if (timeUp) toast(t('sel.timeUp'), 6000);
  }

  /* ---------- PRINT (A4 worksheet, optional answer key on a separate page) ---------- */
  function printMeta(settings, questions) {
    const n = questions.length;
    if (settings.subject === 'sel') {
      const short = settings.selLen === 'short' || settings.topic === 'selshort', spec = short ? Selective.SHORT : Selective.FULL;
      return { title: `${t('sel.heading')} – ${t(short ? 'topic.selshort' : 'topic.selfull')}`, info: t('print.infoSel', { n, m: spec.minutes }) };
    }
    if (settings.subject === 'comp') {
      const paper = compPaper(settings), len = compLen(settings);
      return { title: `${t('subject.comp')} – ${t('topic.' + paper)}`, info: compRules(paper, len).slice(0, 3).join(' · ') };
    }
    const subject = settings.subject || 'maths';
    if (subject === 'review') return { title: t('topic.similar'), info: t('print.infoSimilar', { n }) };
    return {
      title: `${t('subject.' + subject)} – ${t('topic.' + (settings.topic || 'mixed'))}`,
      info: t('print.infoPractice', { n, subject: t('subject.' + subject), y: yearLabel(settings.year), diff: t('diff.' + settings.diff) })
    };
  }

  function openPrint(questions, settings) {
    S.printJob = { questions, settings };
    $('#printAnswers').checked = false;
    window.I18N.applyStatic($('#printDlg'));
    $('#printDlg').showModal();
  }

  function buildPrint(job, withAnswers, withWorking) {
    const E = s => Fig.esc(s), lines = s => E(s).replace(/\n/g, '<br>');
    const { questions, settings } = job, meta = printMeta(settings, questions), n = questions.length;
    let h = `<header class="p-head"><div><p class="p-app">${E(t('app.title'))}</p><h1>${E(meta.title)}</h1></div>
      <div class="p-fields"><span>${E(t('print.name'))}: <i></i></span><span>${E(t('print.date'))}: <i class="short"></i></span><span>${E(t('print.score'))}: <i class="short"></i> / ${n}</span></div></header>
      <p class="p-info">${E(meta.info)}</p><ol class="p-qs">`;
    questions.forEach(q => {
      h += `<li class="p-q"><div class="p-text">${Fig.questionHTML(qText(q))}</div>`;
      if (q.fig) h += Fig.render(q.fig, lang());
      if (q.type === 'mc') {
        const longOpt = q.choices.some(c => (c[lang()] || c.en).length > 18);
        h += `<ol class="p-opts${longOpt ? ' one-col' : ''}">${q.choices.map((c, k) => `<li><b>${'ABCDE'[k]}</b> ${Fig.math(c[lang()] || c.en)}</li>`).join('')}</ol>`;
      } else {
        h += `<p class="p-line">${E(t('print.answerLine'))}: <i></i></p>`;
      }
      h += '</li>';
    });
    h += '</ol>';
    if (withAnswers) {
      h += `<section class="p-key"><h2>${E(t('print.key'))} – ${E(meta.title)}</h2><p class="p-note">${E(t('print.forParents'))}</p>
        <table><thead><tr><th>${E(t('print.keyQ'))}</th><th>${E(t('print.keyA'))}</th>${withWorking ? `<th>${E(t('print.keyW'))}</th>` : ''}</tr></thead><tbody>`;
      questions.forEach((q, k) => {
        const sol = q.sol ? (q.sol[lang()] || q.sol.en) : '';
        h += `<tr><td>${k + 1}</td><td>${E(answerText(q))}</td>${withWorking ? `<td>${E(sol)}</td>` : ''}</tr>`;
      });
      h += '</tbody></table></section>';
    }
    $('#printArea').innerHTML = h;
  }

  async function doPrint(e) {
    e.preventDefault();
    const job = S.printJob; if (!job) return;
    const withAnswers = $('#printAnswers').checked, withWorking = $('#printWorking').checked;
    $('#printDlg').close();
    if (withAnswers && !S.parent && !(await unlockParent())) return;   // answers stay hidden from students
    buildPrint(job, withAnswers, withWorking);
    setTimeout(() => window.print(), 150);
  }

  function printFromHome() {
    const st = S.settings;
    if (st.subject === 'sel') {
      const len = st.selLen === 'short' ? 'short' : 'full';
      openPrint(Selective.generateTest(len), Object.assign({}, st, { topic: len === 'short' ? 'selshort' : 'selfull' }));
    } else if (st.subject === 'comp') {
      const paper = compPaper(st), len = compLen(st);
      openPrint(Competition.buildPaper(paper, len), Object.assign({}, st, { topic: paper, compPaper: paper, compLen: len }));
    } else {
      openPrint(Gen.generateSet(st.subject, st.year, st.topic, st.diff, st.count), Object.assign({}, st));
    }
  }

  /* One row of "score by topic": label, count (and percent), and a bar coloured below 50 % / below 80 % / above. */
  function topicBar(topic, got, total, showPercent) {
    const p = Math.round(100 * got / total), row = el('div', 'tbar'), lbl = el('div', 'lbl');
    lbl.append(el('span', '', t('topic.' + topic)), el('span', '', showPercent ? `${p}% (${got}/${total})` : `${got}/${total}`));
    const track = el('div', 'track'), fill = el('div', 'fill ' + (p < 50 ? 'low' : p < 80 ? 'mid' : 'high'));
    fill.style.width = p + '%'; track.append(fill); row.append(lbl, track);
    return row;
  }

  function renderExamSummary(Q) {
    const rt = $('#resTime'), rc = $('#resCats');
    if (!Q.exam) { rt.hidden = true; rc.hidden = true; return; }
    const n = Q.questions.length;
    rt.hidden = false;
    rt.textContent = t('res.time', { used: mmss(Q.timeUsed), limit: mmss(Q.limitMs), per: Math.round(Q.timeUsed / 1000 / n), target: Math.round(Q.limitMs / 1000 / n) });
    const by = {};
    Q.questions.forEach((q, i) => { const b = by[q.topic] = by[q.topic] || [0, 0]; b[1]++; if (Q.results[i].ok) b[0]++; });
    rc.innerHTML = ''; rc.hidden = false;
    rc.append(el('h3', '', t('res.byCat')));
    Object.keys(by).forEach(k => rc.append(topicBar(k, by[k][0], by[k][1], false)));
  }

  /* ---------- stars and badges ----------
     100% → 3 stars + a "Good job" badge on the profile; 80–99% → 2; 60–79% → 1; under 60% → none */
  const starsFor = (c, n) => { const p = n ? c / n : 0; return p >= 1 ? 3 : p >= 0.8 ? 2 : p >= 0.6 ? 1 : 0; };
  const badgeCount = () => (store.get(Profiles.badgeKey(), []) || []).length;
  function starRow(k, big) {
    const row = el('div', 'stars' + (big ? ' big' : ''));
    row.setAttribute('role', 'img'); row.setAttribute('aria-label', t('stars.label', { k }));
    for (let i = 0; i < 3; i++) {
      const sp = el('span', 'star s' + i + (i < k ? ' on' : ''));
      sp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z"/></svg>';
      row.append(sp);
    }
    return row;
  }

  /* What a finished set means for badges: its level, score, first-try answers and time. */
  function sessionFacts(Q) {
    const st = Q.settings, R = Q.results;
    return {
      subject: st.subject, year: st.year, diff: st.diff, n: Q.questions.length,
      paper: Q.exam ? (st.subject === 'comp' ? 'comp:' + compPaper(st) + ':' + compLen(st) : 'sel:' + (st.selLen || 'full')) : undefined,
      correct: R.filter(r => r && r.ok).length,
      firstTry: R.filter(r => r && r.ok && r.tries === 1).length,
      seconds: Q.exam ? (Q.timeUsed || 0) / 1000 : (Date.now() - (Q.started || Date.now())) / 1000
    };
  }
  const KIND_ICON = { perfect: '🏅', firstTry: '🎯', speed: '⚡' };
  const kindLabel = k => KIND_ICON[k] + ' ' + t('badge.kind.' + k);
  function levelLabel(lv) {
    if (lv === 'earlier') return t('badge.earlier');
    const p = lv.split(':');
    if (p[0] === 'paper') return p[1] === 'comp' ? t('topic.' + p[2]) + ' · ' + t('comp.len.' + p[3]) : t('subject.sel') + ' · ' + t('sel.len.' + p[2]);
    return [t('subject.' + p[0]), yearLabel(+p[1]), t('diff.short.' + p[2])].join(' · ');
  }

  /* ---------- history ---------- */
  function saveSession() {
    const Q = S.quiz;
    Q.stars = starsFor(Q.results.filter(r => r && r.ok).length, Q.questions.length);
    if (!Q.badgeGiven) {
      const f = sessionFacts(Q), date = Date.now();
      Q.awards = Records.awardsFor(f);
      Q.awardLevel = Records.levelOf(f);
      if (Q.awards.length) {
        const b = store.get(Profiles.badgeKey(), []) || [];
        Q.awards.forEach(kind => b.push({ date, kind, subject: f.subject, year: f.year, diff: f.diff, paper: f.paper, topic: Q.settings.topic, n: f.n }));
        store.set(Profiles.badgeKey(), b.slice(-500));
      }
      Q.badgeGiven = true;
    }
    const byTopic = {};
    Q.questions.forEach((q, i) => {
      const b = byTopic[q.topic] = byTopic[q.topic] || [0, 0];
      b[1] += 1; if (Q.results[i] && Q.results[i].ok) b[0] += 1;
    });
    const wrong = Q.questions.map((q, i) => (Q.results[i] && Q.results[i].ok ? null : {
      topic: q.topic, type: q.type, q: q.q, fig: q.fig, answer: q.answer, choices: q.choices, correct: q.correct, sol: q.sol, given: (Q.results[i] && Q.results[i].given) || [],
      ref: q.ref, subject: q.subject, year: q.year, diff: q.diff
    })).filter(Boolean);
    const h = store.get(histKey(), []);
    h.push({
      date: Date.now(), subject: Q.settings.subject, year: Q.settings.year, topic: Q.settings.topic, diff: Q.settings.diff,
      n: Q.questions.length, correct: Q.results.filter(r => r && r.ok).length, byTopic, wrong, time: Q.timeUsed || null, stars: Q.stars,
      ...(Q.maxMarks ? { marks: Q.marks, maxMarks: Q.maxMarks } : {})
    });
    store.set(histKey(), h.slice(-100));
  }

  /* ---------- RESULTS ---------- */
  function renderResults() {
    const Q = S.quiz; if (!Q) return go('home');
    const n = Q.questions.length, c = Q.results.filter(r => r && r.ok).length, pct = c / n;
    $('#resScore').textContent = t('res.score', { c, n });
    const k = starsFor(c, n), sb = $('#resStars');
    sb.innerHTML = ''; sb.append(starRow(k, true));
    $('#resMsg').textContent = (Q.maxMarks ? t('comp.marksScore', { m: Q.marks, total: Q.maxMarks }) + ' ' : '') + t('stars.msg' + k);
    const awards = Q.awards || [], badge = $('#resBadge');
    badge.hidden = !awards.length;
    if (awards.length) {
      $('#resBadgeIcons').textContent = awards.map(k => KIND_ICON[k]).join('');
      $('#resBadgeText').textContent = t('badge.added', { name: Profiles.name(Profiles.active), list: awards.map(k => t('badge.kind.' + k)).join(' · '), level: levelLabel(Q.awardLevel) });
    }
    renderExamSummary(Q);
    $('#resLocked').hidden = S.parent;
    $('#unlockBtn').hidden = S.parent;
    const list = $('#resList'); list.innerHTML = '';
    const fb = { subject: Q.settings.subject, year: Q.settings.year, diff: Q.settings.diff };
    const picker = makePicker($('#resSimilar'), Q.questions.map((q, i) => (Q.results[i] && Q.results[i].ok ? null : { q, fb })));
    Q.questions.forEach((q, i) => {
      const r = Q.results[i] || { given: [], ok: false, tries: 0 };
      list.append(reviewItem(q, r.given, r.ok, i + 1, r.ok && r.tries === 2 ? ' ' + t('res.second') : '', picker, i));
    });
  }

  /* ---------- review: one item, its worked method, and the "practise similar" picker ---------- */
  // A worked method usually shows the answer, so it opens only in parent mode (Terry, v1.6.4).
  const methodsOpen = () => S.parent;
  function solSteps(sol) {
    const parts = String(sol).split(/(?<=[.;!?])\s+(?=[A-Z(√−0-9])|(?<=[。；])/).map(x => x.trim()).filter(Boolean);
    return parts.length ? parts : [String(sol)];
  }
  function methodBlock(q) {
    const sol = q.sol && (q.sol[lang()] || q.sol.en);
    const d = el('details', 'method');
    const sum = el('summary', '', t('rev.method'));
    sum.addEventListener('click', async e => {
      if (d.open || methodsOpen()) return;
      e.preventDefault();                       // students need the parent PIN to open a method
      // unlocking re-renders the review, so remember which method this was and open its new copy
      const pos = [...document.querySelectorAll('details.method')].indexOf(d);
      if (await unlockParent()) {
        const again = document.querySelectorAll('details.method')[pos];
        if (again) again.open = true;
        toast(t('rev.methodUnlocked'));
      }
    });
    d.append(sum);
    if (!sol) d.append(el('p', 'muted small', t('rev.noMethod')));
    else {
      const steps = solSteps(sol), ol = el('ol', 'steps' + (steps.length === 1 ? ' one' : ''));
      steps.forEach(x => { const li = el('li'); li.innerHTML = Fig.math(x); ol.append(li); });
      d.append(ol);
    }
    return d;
  }
  function reviewItem(q, given, ok, num, extra, picker, idx) {
    const li = el('li', ok ? 'ok' : 'bad');
    const top = el('div', 'rv-top');
    top.append(el('span', 'rv-mark ' + (ok ? 'ok' : 'bad'), ok ? '✓' : '✗'));
    if (num) top.append(el('span', 'rv-num', t('rev.qnum', { n: num })));
    top.append(el('span', 'badge', t('topic.' + q.topic)));
    if (!ok && picker) top.append(picker.tick(idx));
    li.append(top);
    const qt = el('div', 'q'); qt.innerHTML = Fig.questionHTML(q.q[lang()] || q.q.en); li.append(qt);
    appendFig(li, q);
    li.append(el('p', 'rv-yours', t('res.yours', { a: givenText(q, given) }) + (extra || '')));
    if (S.parent) { const p = el('p'); p.append(el('span', 'ans', t('res.answer', { a: answerText(q) }))); li.append(p); }
    li.append(methodBlock(q));
    return li;
  }
  /* items: one entry per review item, null for correct ones; returns tick(idx) for each wrong item */
  function makePicker(host, items) {
    host.innerHTML = '';
    const picked = new Set(), ticks = new Map(), wrongIdx = items.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
    const bar = el('div', 'similar-bar');
    if (!wrongIdx.length) { host.append(bar); bar.hidden = true; return { tick: () => el('span') }; }
    const head = el('div', 'sb-head');
    const title = el('p', 'sb-title', t('rev.similarTitle'));
    const all = el('button', 'link', t('rev.selectAll')); all.type = 'button';
    const info = el('p', 'muted small sb-info');
    head.append(title, info, all);
    const row = el('div', 'sb-row');
    const sel = el('select', 'combo sb-count'); sel.setAttribute('aria-label', t('rev.howMany'));
    [1, 2, 3, 5, 10].forEach(n => { const o = el('option', '', t('rev.perQ', { n })); o.value = n; sel.append(o); });
    sel.value = String(S.settings.simN || 3);
    const goBtn = el('button', 'btn primary sb-go'); goBtn.type = 'button';
    row.append(sel, goBtn);
    bar.append(head, row);
    host.append(bar);
    const update = () => {
      const k = picked.size, n = Math.min(50, k * +sel.value);
      info.textContent = k ? t('rev.selected', { k }) : t('rev.pickSome');
      goBtn.disabled = !k; goBtn.textContent = k ? t('rev.practise', { n }) : t('rev.practise0');
      all.textContent = t(picked.size === wrongIdx.length ? 'rev.selectNone' : 'rev.selectAll');
      bar.classList.toggle('floating', k > 0);
      title.hidden = k > 0;           // keep the button in reach while scrolling the list
      host.style.paddingBottom = k > 0 ? (bar.offsetHeight + 24) + 'px' : '';
      ticks.forEach((b, i) => { b.setAttribute('aria-pressed', String(picked.has(i))); b.closest('li') && b.closest('li').classList.toggle('picked', picked.has(i)); });
    };
    sel.addEventListener('change', () => { S.settings.simN = +sel.value; saveSettings(); update(); });
    all.addEventListener('click', () => { if (picked.size === wrongIdx.length) picked.clear(); else wrongIdx.forEach(i => picked.add(i)); update(); });
    goBtn.addEventListener('click', () => startSimilar([...picked].sort((a, b) => a - b).map(i => items[i]), +sel.value));
    setTimeout(update, 0);
    return {
      tick(i) {
        const b = el('button', 'tick'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', t('rev.tickLabel')); b.title = t('rev.tickLabel');
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
        b.addEventListener('click', () => { if (picked.has(i)) picked.delete(i); else picked.add(i); update(); });
        ticks.set(i, b);
        return b;
      }
    };
  }

  /* ---------- PROGRESS ---------- */
  /* ---------- MINI GAMES (v1.9.0 balloons; v1.10.0 Sudoku, Money Master, Broken Calculator) ---------- */
  let game = null;   // the balloon game, made the first time it is played
  let puzzle = null, puzzleId = '', puzzleLevel = '';   // the puzzle game on the puzzle screen, made each time one is opened
  const LEVELS = ['easy', 'medium', 'hard'];
  /* kind 'score': most points in a timed round is best. kind 'time': fastest finish, kept per level */
  const GAMES = [
    { id: 'balloons', icon: '🎈', title: 'game.balloons', sub: 'game.balloonsSub', kind: 'score' },
    { id: 'sudoku', icon: '🔢', title: 'sudoku.title', sub: 'sudoku.sub', kind: 'time', make: 'SudokuGame', scoreIcon: '✏️', scoreLabel: 'sudoku.left' },
    { id: 'money', icon: '💵', title: 'money.title', sub: 'money.sub', kind: 'time', make: 'MoneyGame', scoreIcon: '🧾', scoreLabel: 'money.question' },
    { id: 'broken', icon: '🧮', title: 'broken.title', sub: 'broken.sub', kind: 'score', make: 'BrokenGame', scoreIcon: '⭐', scoreLabel: 'game.points' }
  ];
  const fmtMs = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const gameRec = id => (store.get(Profiles.gameKey(), {}) || {})[id] || {};
  const gameBest = id => gameRec(id).best || 0;
  const levelBest = (id, lv) => (gameRec(id)[lv] || {}).best || 0;   // fastest finish in ms; 0 = not finished yet
  const gameBusy = () => (S.screen === 'game' && !!game && game.running) || (S.screen === 'puzzle' && !!puzzle && puzzle.running);

  function renderGames() {
    const box = $('#gameList'); box.innerHTML = '';
    for (const g of GAMES) {
      const card = el('div', 'card game-card');
      const icon = el('span', 'game-icon', g.icon); icon.setAttribute('aria-hidden', 'true');
      const text = el('div', 'game-text');
      text.append(el('h3', '', t(g.title)), el('p', 'muted small', t(g.sub)));
      if (g.kind === 'time') {
        const times = LEVELS.filter(lv => levelBest(g.id, lv)).map(lv => t('lv.' + lv) + ' ' + fmtMs(levelBest(g.id, lv)));
        if (times.length) text.append(el('p', 'small game-best', t('game.bestTimes', { list: times.join(' · ') })));
      } else {
        const best = gameBest(g.id);
        if (best) text.append(el('p', 'small game-best', t('game.best', { n: best })));
      }
      const play = el('button', 'btn primary', t('game.play')); play.type = 'button'; play.id = 'play-' + g.id;
      play.setAttribute('aria-label', t('game.play') + ' – ' + t(g.title));
      play.addEventListener('click', () => openGame(g.id));
      card.append(icon, text, play);
      box.append(card);
    }
  }

  function renderGame() { /* the round draws itself; static text is filled by applyStatic */ }
  function renderPuzzle() { /* the same: the puzzle game draws its own board */ }

  /* R1.5 (v1.9.0): the game id travels from its card to the record it writes */
  let gameId = 'balloons';
  function openGame(id) {
    if (id !== 'balloons') return openPuzzle(id);
    gameId = id;
    go('game');
    $('#gameOver').hidden = true; $('#gameIntro').hidden = false;
    // R1.4: the start card shows a fresh round, not the last one's clock and points
    $('#gameTime').textContent = window.BalloonRules ? window.BalloonRules.SECONDS : 60;
    $('#gameScore').textContent = '0';
    $('#gameGo').focus();
  }

  function playGame() {
    if (!window.BalloonGame) return toast(t('game.missing'));
    if (!game) {
      game = window.BalloonGame.create($('#gameField'), {
        time: $('#gameTime'), score: $('#gameScore'), typed: $('#gameTyped'), status: $('#gameStatus'),
        warn: $('#gameWarn'), pad: $('#gamePad')
      }, { t, onEnd: res => endGame(gameId, res) });
    }
    $('#gameIntro').hidden = true; $('#gameOver').hidden = true;
    game.start();
  }

  function endGame(id, res) {
    const all = store.get(Profiles.gameKey(), {}) || {}, g = all[id] || { best: 0, plays: 0 };
    const isBest = res.score > (g.best || 0);
    all[id] = { best: Math.max(g.best || 0, res.score), plays: (g.plays || 0) + 1, last: res.score, date: Date.now() };
    store.set(Profiles.gameKey(), all);
    $('#gameFinal').textContent = t('game.final', { n: res.score });
    $('#gameBest').textContent = isBest && res.score > 0 ? t('game.newBest') : t('game.best', { n: all[id].best });
    $('#gameOver').hidden = false;
    $('#gameAgain').focus();
  }

  /* v1.10.0: Sudoku, Money Master and Broken Calculator share the puzzle screen */
  function openPuzzle(id) {
    const g = GAMES.find(x => x.id === id);
    if (!g || !window[g.make] || !window.GameKit) return toast(t('game.missing'));
    if (puzzle) puzzle.stop();
    puzzleId = id;
    puzzle = window[g.make].create($('#pzBody'), { clock: $('#pzClock'), score: $('#pzScore'), status: $('#pzStatus') },
      { t, onEnd: res => endPuzzle(id, res) });
    go('puzzle');
    puzzleIntro();
  }

  function puzzleIntro() {
    const g = GAMES.find(x => x.id === puzzleId);
    $('#pzH').textContent = t(g.title);
    $('#pzScoreIcon').textContent = g.scoreIcon;
    $('#pzScoreLabel').textContent = t(g.scoreLabel);
    $('#pzClock').textContent = fmtMs(g.id === 'broken' && window.BrokenRules ? window.BrokenRules.SECONDS * 1000 : 0);
    $('#pzScore').textContent = g.id === 'money' && window.MoneyRules ? '1/' + window.MoneyRules.ROUNDS : g.id === 'sudoku' ? '–' : '0';
    $('#pzBody').innerHTML = '';
    $('#pzOver').hidden = true; $('#pzIntro').hidden = false;
    $('#pzHow').textContent = t(g.id + '.how');
    const box = $('#pzLevels'); box.innerHTML = '';
    for (const lv of g.kind === 'time' ? LEVELS : ['']) {
      const b = el('button', 'btn primary pz-level', lv ? t(g.id + '.lv.' + lv) : t('game.go'));
      b.type = 'button'; b.id = 'pzGo' + (lv ? '-' + lv : '');
      if (lv) {
        const best = levelBest(g.id, lv);
        b.append(el('span', 'pz-lvbest', best ? t('game.bestTime', { v: fmtMs(best) }) : t('game.noTime')));
      } else b.classList.add('big');
      b.addEventListener('click', () => playPuzzle(lv));
      box.append(b);
    }
    box.querySelector('button').focus();
  }

  function playPuzzle(lv) {
    if (!puzzle) return;
    puzzleLevel = lv;
    $('#pzIntro').hidden = true; $('#pzOver').hidden = true;
    $('#pzStatus').textContent = '';
    puzzle.start(lv);
  }

  function endPuzzle(id, res) {
    const all = store.get(Profiles.gameKey(), {}) || {};
    if (id === 'broken') {
      const g = all[id] || { best: 0, plays: 0 }, isBest = res.score > (g.best || 0);
      all[id] = { best: Math.max(g.best || 0, res.score), plays: (g.plays || 0) + 1, last: res.score, date: Date.now() };
      $('#pzDone').textContent = t('game.timeUp');
      $('#pzFinal').textContent = t('broken.final', { n: res.score });
      $('#pzBest').textContent = isBest && res.score > 0 ? t('game.newBest') : t('game.best', { n: all[id].best });
    } else {
      const r = all[id] || {}, old = r[res.level] || {}, ms = Math.round(res.ms), isBest = !old.best || ms < old.best;
      r[res.level] = { best: isBest ? ms : old.best, plays: (old.plays || 0) + 1, last: ms, date: Date.now() };
      all[id] = r;
      $('#pzDone').textContent = t(id + '.done');
      $('#pzFinal').textContent = t('pz.finalTime', { lv: t('lv.' + res.level), v: fmtMs(ms) });
      $('#pzBest').textContent = isBest ? t('pz.newBestTime') : t('game.bestTime', { v: fmtMs(old.best) });
    }
    store.set(Profiles.gameKey(), all);
    if (id !== 'sudoku') $('#pzBody').innerHTML = '';   // the finished Sudoku grid stays above the card; the others clear
    $('#pzOver').hidden = false;
    $('#pzAgain').focus();
  }

  function renderProgress() {
    const box = $('#progBody'); box.innerHTML = '';
    $('#progH').textContent = t('prog.headingFor', { name: Profiles.name(Profiles.active) });
    // Each section is drawn on its own, so a record the screen cannot read hides only its own part, and
    // "Clear progress" is always there to recover (R1.1, v1.7.0).
    try { progressSections(box); } catch (e) { console.error('progress', e); }
    // shown only when there is something to clear (R2.4, v1.7.0)
    const has = k => { const v = store.get(k, []); return Array.isArray(v) && v.length > 0; };
    if (has(histKey()) || has(Profiles.badgeKey())) appendClearButton(box);
  }
  function progressSections(box) {
    const part = fn => { try { fn(); } catch (e) { console.error('progress section', e); } };
    const h = (store.get(histKey(), []) || []).filter(x => x && typeof x === 'object');
    // badges can exist with no sessions (an import whose session rows were all refused): show them anyway (R3.3, v1.7.0)
    if (!h.length) { box.append(el('p', 'muted', t('prog.none'))); part(() => renderBadges(box)); return; }
    part(() => progressTop(box, h));
    part(() => renderBadges(box));
    part(() => progressTopics(box, h));
    part(() => progressRecent(box, h));
    part(() => progressReview(box, h));
    if (!S.parent) box.append(el('p', 'muted small', t('prog.parentOnly')));
  }
  function progressTop(box, h) {
    const total = h.reduce((s, x) => s + x.n, 0), correct = h.reduce((s, x) => s + x.correct, 0);
    const stats = el('div', 'stats');
    [[h.length, 'prog.sessions'], [total, 'prog.questions'], [Math.round(100 * correct / total) + '%', 'prog.accuracy']].forEach(([v, k]) => {
      const d = el('div', 'stat'); d.append(el('b', '', String(v)), el('span', '', t(k))); stats.append(d);
    });
    box.append(stats);
  }
  function progressTopics(box, h) {
    const by = {};
    h.forEach(x => { for (const k in x.byTopic) { const b = by[k] = by[k] || [0, 0]; b[0] += x.byTopic[k][0]; b[1] += x.byTopic[k][1]; } });
    box.append(el('h3', '', t('prog.byTopic')));
    Object.keys(by).sort((a, b) => by[a][0] / by[a][1] - by[b][0] / by[b][1]).forEach(k => box.append(topicBar(k, by[k][0], by[k][1], true)));
  }
  function progressRecent(box, h) {
    box.append(el('h3', '', t('prog.recent')));
    const ul = el('ul', 'plain');
    const fmtDate = d => new Date(d).toLocaleDateString(lang() === 'zh' ? 'zh-CN' : 'en-AU', { day: 'numeric', month: 'short' });
    h.slice(-8).reverse().forEach(x => ul.append(el('li', '', t('prog.row', {
      date: fmtDate(x.date), year: isTimed(x.subject) ? '⏱ ' + mmss(x.time || 0) : yearLabel(x.year), topic: t('subject.' + (x.subject || 'maths')) + ' – ' + t('topic.' + x.topic), c: x.correct, n: x.n
    }) + (x.maxMarks ? ' · ' + t('comp.marksShort', { m: x.marks, total: x.maxMarks }) : '') + ' ' + starText(x))));
    box.append(ul);
  }
  const starText = x => { const k = [0, 1, 2, 3].includes(x.stars) ? x.stars : starsFor(x.correct, x.n); return '★'.repeat(k) + '☆'.repeat(3 - k); };
  function progressReview(box, h) {
    box.append(el('h3', '', t('prog.review')));
    // only questions the review can show (text in English at least)
    const shown = w => w && w.q && typeof w.q.en === 'string' && (w.type !== 'mc' || Array.isArray(w.choices));
    const wrong = h.flatMap(x => (Array.isArray(x.wrong) ? x.wrong : []).filter(shown).map(w => ({ q: w, fb: { subject: x.subject, year: x.year, diff: x.diff } }))).slice(-15).reverse();
    if (!wrong.length) box.append(el('p', 'muted', t('prog.reviewNone')));
    else {
      box.append(el('p', 'muted small', t('rev.tip')));
      const ol = el('ol', 'review'), host = el('div');
      const picker = makePicker(host, wrong);
      wrong.forEach((w, i) => ol.append(reviewItem(w.q, w.q.given, false, 0, '', picker, i)));
      box.append(ol, host);
    }
  }

  /* Clear progress: visible whenever there is progress, protected by the parent PIN */
  function appendClearButton(box) {
    const wrap = el('div', 'clear-row');
    const btn = el('button', 'btn secondary danger', '🗑 ' + t('prog.clear')); btn.type = 'button'; btn.id = 'clearProgress';
    btn.addEventListener('click', async () => {
      if (!S.parent && !(await unlockParent())) return;
      if (confirm(t('prog.resetConfirm'))) { store.del(histKey()); store.del(Profiles.badgeKey()); toast(t('prog.clear') + ' ✓'); renderProgress(); }
    });
    wrap.append(btn);
    if (!S.parent) wrap.append(el('p', 'muted small center', t('prog.clearNote')));
    box.append(wrap);
  }

  /* Badges: a grid for the year being practised (difficulty × kind), then every other level collected. */
  function renderBadges(box) {
    const list = store.get(Profiles.badgeKey(), []) || [], col = Records.collection(list);
    const shelf = el('section', 'badge-shelf');
    const head = el('div', 'badge-head');
    head.append(el('h3', '', t('badge.title', { n: list.length })),
      infoTip(t('badge.how', { s1: Records.SPEED_SECONDS[1], s2: Records.SPEED_SECONDS[2], s3: Records.SPEED_SECONDS[3], s4: Records.SPEED_SECONDS[4], n: Records.MIN_QUESTIONS }), t('badge.howLabel')));
    shelf.append(head);
    const subject = S.settings.subject === 'ga' ? 'ga' : 'maths', year = S.settings.year;
    const table = el('table', 'badge-grid');
    table.append(el('caption', '', t('subject.' + subject) + ' · ' + yearLabel(year)));
    const hr = el('tr'); hr.append(el('th', 'corner'));
    Records.KINDS.forEach(k => { const th = el('th', '', KIND_ICON[k]); th.scope = 'col'; th.title = t('badge.kind.' + k); th.setAttribute('aria-label', t('badge.kind.' + k)); hr.append(th); });
    table.append(hr);
    const shown = new Set();
    [1, 2, 3, 4].forEach(d => {
      const lv = [subject, year, d].join(':'), got = col[lv] || {}, tr = el('tr');
      shown.add(lv);
      const th = el('th', '', t('diff.short.' + d)); th.scope = 'row'; tr.append(th);
      Records.KINDS.forEach(k => {
        const n = got[k] || 0, td = el('td', n ? 'got' : 'empty', n ? KIND_ICON[k] + (n > 1 ? '×' + n : '') : KIND_ICON[k]);
        td.setAttribute('aria-label', t('badge.kind.' + k) + ': ' + n);
        tr.append(td);
      });
      table.append(tr);
    });
    shelf.append(table);
    const others = Object.keys(col).filter(lv => !shown.has(lv)).sort();
    if (others.length) {
      shelf.append(el('h4', '', t('badge.other')));
      const ul = el('ul', 'plain badge-others');
      others.forEach(lv => ul.append(el('li', '', levelLabel(lv) + '  ' + Records.KINDS.filter(k => col[lv][k]).map(k => KIND_ICON[k] + '×' + col[lv][k]).join(' '))));
      shelf.append(ul);
    }
    box.append(shelf);
  }

  /* An info icon whose text shows on hover, on keyboard focus, or when tapped (phones have no hover). */
  let tipSeq = 0;
  function infoTip(text, label) {
    const wrap = el('span', 'info'), id = 'tip' + (++tipSeq);
    const btn = el('button', 'info-btn'); btn.type = 'button';
    btn.setAttribute('aria-label', label); btn.setAttribute('aria-describedby', id); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 10.8v6.2M12 7.3v.2"/></svg>';
    const tip = el('span', 'tip', text); tip.id = id; tip.setAttribute('role', 'tooltip');
    const place = () => {
      tip.style.left = '';
      const r = tip.getBoundingClientRect(), pad = 8;
      let dx = 0;
      if (r.right > innerWidth - pad) dx = innerWidth - pad - r.right;
      if (r.left + dx < pad) dx = pad - r.left;
      if (dx) tip.style.left = (parseFloat(getComputedStyle(tip).left) + dx) + 'px';
    };
    const show = on => { if (on) place(); wrap.classList.toggle('open', on); btn.setAttribute('aria-expanded', String(on)); };
    wrap.addEventListener('mouseenter', place);
    btn.addEventListener('focus', place);
    // inside a <label>, a click would also move focus to the input: keep the click to the icon
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); show(!wrap.classList.contains('open')); });
    btn.addEventListener('keydown', e => { if (e.key === 'Escape') show(false); });
    btn.addEventListener('blur', () => show(false));
    wrap.append(btn, tip);
    return wrap;
  }

  /* ---------- PARENT: PIN ---------- */
  async function hashPin(pin, salt) {
    const data = salt + ':' + pin;
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261; for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'f' + (h >>> 0).toString(16);
  }

  /* mode: 'unlock' (create if none) | 'change'. Resolves true when unlocked/changed. */
  function pinDialog(mode) {
    return new Promise(resolve => {
      const dlg = $('#pinDialog'), input = $('#pinInput'), msg = $('#pinMsg');
      let saved = store.get(K.pin, null);
      let step = !saved || mode === 'change' ? 'create' : 'enter';
      let first = '';
      const setStep = s => { step = s; $('#pinTitle').textContent = t(s === 'create' ? 'pin.create' : s === 'confirm' ? 'pin.confirm' : 'pin.enter'); input.value = ''; $('#pinForgot').hidden = s !== 'enter'; };
      const finish = v => { cleanup(); if (dlg.open) dlg.close(); resolve(v); };
      const onSubmit = async ev => {
        ev.preventDefault();
        const v = input.value.trim();
        if (!/^\d{4}$/.test(v)) { msg.textContent = t('pin.short'); return; }
        msg.textContent = '';
        if (step === 'enter') {
          if (await hashPin(v, saved.salt) === saved.hash) finish(true);
          else { msg.textContent = t('pin.bad'); input.value = ''; }
        } else if (step === 'create') { first = v; setStep('confirm'); }
        else if (v === first) {
          const salt = Math.random().toString(36).slice(2);
          store.set(K.pin, { salt, hash: await hashPin(v, salt) });
          finish(true);
        } else { msg.textContent = t('pin.mismatch'); first = ''; setStep('create'); }
        input.focus();
      };
      const onCancel = () => finish(false);
      /* A forgotten PIN can only be reset by erasing everything the PIN protects, so a student cannot use the reset
         to get into parent mode quietly: all progress and badges go with it. */
      const onForgot = () => {
        if (!confirm(t('pin.forgotConfirm'))) return;
        finish(false);
        eraseAll();
        location.reload();
      };
      const onClose = () => finish(false);
      function cleanup() {
        $('#pinForm').removeEventListener('submit', onSubmit);
        $('#pinCancel').removeEventListener('click', onCancel);
        $('#pinForgot').removeEventListener('click', onForgot);
        dlg.removeEventListener('close', onClose);
      }
      $('#pinForm').addEventListener('submit', onSubmit);
      $('#pinCancel').addEventListener('click', onCancel);
      $('#pinForgot').addEventListener('click', onForgot);
      dlg.addEventListener('close', onClose);
      msg.textContent = '';
      setStep(step);
      window.I18N.applyStatic(dlg);
      dlg.showModal();
      input.focus();
    });
  }

  /* Every key this app stores, old "mp." names included, except the language choice, the "moved" flag (without it a later
     load would move leftover old keys back in) and the tour flag (the same person has already seen the tour). */
  function eraseAll() {
    try {
      for (const k of Object.keys(localStorage)) {
        if (isUserData(k) || OLD_KEY.test(k)) localStorage.removeItem(k);
      }
    } catch (e) { /* storage blocked: nothing stored */ }
  }

  async function unlockParent() {
    if (S.parent) return true;
    if (await pinDialog('unlock')) { S.parent = true; render(); return true; }
    return false;
  }

  /* ---------- PARENT: settings ---------- */
  let draftProvider = null;
  function renderParent() {
    $('#csvInfo').replaceChildren(infoTip(t('csv.note'), t('csv.heading')));
    renderPrompt();
    const cfg = store.get(K.ai, { provider: 'local', key: '', model: '' });
    if (draftProvider === null) draftProvider = cfg.provider || 'local';
    chips($('#providerChips'), 'provider', ['local', 'claude', 'deepseek'].map(p => [p, t('parent.provider.' + p)]), draftProvider, v => {
      draftProvider = v; $('#aiMsg').textContent = ''; renderParent();
    });
    const isAI = draftProvider !== 'local';
    $('#aiFields').hidden = !isAI;
    if (isAI) {
      const P = AI.PROVIDERS[draftProvider];
      const sel = $('#aiModel'); const keep = cfg.provider === draftProvider ? cfg.model : '';
      sel.innerHTML = '';
      P.models.forEach(m => { const o = el('option', '', m); o.value = m; sel.append(o); });
      sel.value = P.models.includes(keep) ? keep : P.defaultModel;
      if (!$('#aiKey').dataset.touched) $('#aiKey').value = cfg.provider === draftProvider ? (cfg.key || '') : '';
    }
  }
  function currentDraft() {
    return { provider: draftProvider, key: $('#aiKey').value.trim(), model: $('#aiModel').value };
  }

  /* AI prompt editor: pre-filled with the built-in template for each subject */
  let promptSubject = 'maths';
  function renderPrompt() {
    const cfg = store.get(K.ai, {}) || {}, custom = cfg.prompts && cfg.prompts[promptSubject];
    combo($('#promptSubject'), AI_SUBJECTS.map(x => [x, t('subject.' + x)]), promptSubject, v => { promptSubject = v; renderPrompt(); });
    $('#promptText').value = custom || AI.defaultTemplate(promptSubject);
    $('#promptState').textContent = t(custom ? 'parent.promptCustom' : 'parent.promptDefault');
  }
  function savePrompt(text) {
    const cfg = store.get(K.ai, { provider: 'local', key: '', model: '' }) || {};
    cfg.prompts = Object.assign({}, cfg.prompts);
    if (text && text.trim() && text.trim() !== AI.defaultTemplate(promptSubject).trim()) cfg.prompts[promptSubject] = text; else delete cfg.prompts[promptSubject];
    store.set(K.ai, cfg);
    renderPrompt();
  }

  /* ---------- student profiles dialog ---------- */
  let editingProfile = null;
  /* Name, school year and birth month. The school year moves up by itself each calendar year. */
  function profileEditor(pr) {
    const f = el('form', 'profile-edit'), now = new Date(), thisYear = now.getFullYear();
    const field = (key, input) => { const l = el('label', 'field'); l.append(el('span', '', t(key)), input); f.append(l); return input; };
    const name = field('profile.name', el('input')); name.type = 'text'; name.maxLength = 20; name.value = pr.name || ''; name.placeholder = Profiles.name(pr); name.autocomplete = 'off';
    const yr = field('profile.schoolYear', el('select'));
    yr.append(new Option(t('profile.yearUnset'), ''));
    for (let y = 1; y <= 12; y++) yr.append(new Option(yearLabel(y), String(y)));
    yr.value = pr.schoolYear ? String(Records.suggestYear({ schoolYear: pr.schoolYear, schoolYearSet: pr.schoolYearSet }, now)) : '';
    const dob = field('profile.dob', el('input')); dob.type = 'month'; dob.value = pr.dob || '';
    dob.min = (thisYear - 25) + '-01'; dob.max = thisYear + '-' + String(now.getMonth() + 1).padStart(2, '0');
    // The birth month, read against today's date, gives the usual school year. When it differs from the school year
    // chosen above, say so and offer it; the parent decides (Terry, R4.1, v1.7.0). Nothing changes until Save.
    const hint = el('p', 'profile-hint muted small'); hint.setAttribute('aria-live', 'polite'); f.append(hint);
    const showHint = () => {
      hint.innerHTML = '';
      // Only for an age that is at school in Years 1-12 (R6.3); the plain "Year N", not a course name (R6.4).
      const byAge = Records.yearByAge(dob.value, new Date());
      if (byAge === null || byAge < 1 || byAge > 12 || yr.value === String(byAge)) { hint.hidden = true; return; }
      const label = t('home.yearN', { n: byAge });
      const use = el('button', 'btn ghost small', t('profile.useYear', { year: label })); use.type = 'button';
      use.addEventListener('click', () => { yr.value = String(byAge); showHint(); yr.focus(); });
      hint.append(el('span', '', t('profile.ageHint', { year: label }) + ' '), use);
      hint.hidden = false;
    };
    yr.addEventListener('change', showHint); dob.addEventListener('input', showHint); dob.addEventListener('change', showHint);
    showHint();
    const row = el('div', 'row');
    const cancel = el('button', 'btn ghost', t('pin.cancel')); cancel.type = 'button';
    cancel.addEventListener('click', () => { editingProfile = null; renderProfiles(); });
    const save = el('button', 'btn primary', t('profile.save')); save.type = 'submit';
    row.append(cancel, save); f.append(row);
    f.addEventListener('submit', e => {
      e.preventDefault();
      const y = +yr.value || null, d = /^\d{4}-\d{2}$/.test(dob.value) ? dob.value : '';
      // The details only move the default year on Home. A year the student or parent picked by hand on Home is
      // kept, whatever is edited here (Terry, R4.1, v1.7.0); applySuggestedYear remembers the new suggestion.
      Profiles.update(pr.id, { name: name.value.trim().slice(0, 20), schoolYear: y, schoolYearSet: y ? thisYear : null, dob: d });
      editingProfile = null;
      if (pr === Profiles.active) applySuggestedYear();
      renderProfiles(); render();
      toast(t('parent.saved'));
    });
    return f;
  }
  /* The suggested year is only the default on Home. It is applied the first time a suggestion exists, and when the
     suggestion moves on (details saved, a new calendar year) while Home still shows the old suggestion. A year picked
     by hand on Home (one that is not the last suggestion) is always kept; the new suggestion is only remembered
     (R1.2; Terry's decision on R4.1, v1.7.0). */
  function applySuggestedYear() {
    const y = Records.suggestYear(Profiles.active, new Date()), st = S.settings;
    if (!y || st.suggested === y) return;
    // With a suggestion stored, a year that differs from it was picked by hand. Before any suggestion exists, only the
    // flag set on Home says so (R6.1).
    const handPicked = st.suggested == null ? st.yearPicked === true : st.year !== st.suggested;
    if (!handPicked) st.year = y;
    st.suggested = y; saveSettings();
  }
  function renderProfiles() {
    const ul = $('#profileList'); ul.innerHTML = '';
    Profiles.list.forEach(pr => {
      const li = el('li'), cur = pr === Profiles.active;
      const pick = el('button', 'profile-pick', (cur ? '✓ ' : '') + Profiles.name(pr)); pick.type = 'button';
      if (cur) pick.setAttribute('aria-current', 'true');
      pick.addEventListener('click', () => switchProfile(pr.id));
      const sug = Records.suggestYear(pr, new Date());
      if (sug) pick.append(el('span', 'muted small', ' · ' + yearLabel(sug)));
      const ren = el('button', 'icon-btn', '✎'); ren.type = 'button'; ren.setAttribute('aria-label', t('profile.edit'));
      ren.setAttribute('aria-expanded', String(editingProfile === pr.id));
      ren.addEventListener('click', () => { editingProfile = editingProfile === pr.id ? null : pr.id; renderProfiles(); });
      const del = el('button', 'icon-btn', '🗑'); del.type = 'button'; del.setAttribute('aria-label', t('profile.delete'));
      del.addEventListener('click', async () => {
        if (Profiles.list.length <= 1) return toast(t('profile.lastOne'));
        if (!S.parent && !(await unlockParent())) return;
        if (!confirm(t('profile.deleteConfirm', { name: Profiles.name(pr) }))) return;
        const wasActive = pr === Profiles.active;
        Profiles.remove(pr.id);
        if (wasActive) loadProfileSettings();
        renderProfiles(); render();
        if (!$('#profileDlg').open) $('#profileDlg').showModal();
      });
      li.append(pick, ren, del);
      if (editingProfile === pr.id) li.append(profileEditor(pr));
      ul.append(li);
    });
    const full = Profiles.list.length >= MAX_PROFILES;
    $('#profileNew').disabled = full; $('#profileAddBtn').disabled = full;
    $('#profileNew').placeholder = full ? t('profile.full') : t('profile.namePh');
  }
  function loadProfileSettings() {
    S.settings = Object.assign({}, defaults, store.get(Profiles.setKey(), {}));
    applySuggestedYear();
  }
  function switchProfile(id) {
    if (S.screen === 'quiz' || S.screen === 'loading' || gameBusy()) return toast(t('profile.busy'));
    Profiles.select(id); loadProfileSettings();
    renderProfiles(); render();
    toast(t('profile.switched', { name: Profiles.name(Profiles.active) }));
  }

  /* ---------- toast & SW updates ---------- */
  let toastTimer;
  function toast(text, ms = 4500, action) {
    const box = $('#toast'); box.innerHTML = '';
    box.append(el('span', '', text));
    if (action) { const b = el('button', '', action.label); b.type = 'button'; b.addEventListener('click', action.run); box.append(b); }
    box.hidden = false;
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(() => { box.hidden = true; }, ms);
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw && nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              toast(t('update.ready'), 0, { label: t('update.reload'), run: () => location.reload() });
            }
          });
        });
      }).catch(e => console.warn('SW registration failed', e));
    });
  }

  /* ---------- guided tour (v1.8.0): what each part of Home is for ---------- */
  const TOUR = [
    { target: null, title: 'tour.welcomeT', text: 'tour.welcome' },
    { target: '#profileBtn', title: 'tour.profileT', text: 'tour.profile' },
    { target: '#langBtn', title: 'tour.langT', text: 'tour.lang' },
    { target: '#parentBtn', title: 'tour.parentT', text: 'tour.parent' },
    { target: '#subjectChips', title: 'tour.subjectT', text: 'tour.subject' },
    { target: '#practiceOptions', title: 'tour.optionsT', text: 'tour.options' },
    { target: '#startBtn', title: 'tour.startT', text: 'tour.start' },
    { target: '#printHome', title: 'tour.printT', text: 'tour.print' },
    { target: '.tab[data-go="progress"]', title: 'tour.progressT', text: 'tour.progress' },
    { target: '#navGames', title: 'tour.gamesT', text: 'tour.games' },
    { target: '#navParent', title: 'tour.settingsT', text: 'tour.settings' },
    { target: '#tourBtn', title: 'tour.againT', text: 'tour.again' }
  ];
  function startTour() {
    if (!window.Tour || S.screen === 'quiz' || S.screen === 'loading' || window.Tour.running) return;   // tour.js failed to load: no tour
    document.querySelectorAll('dialog[open]').forEach(d => d.close());   // a student dialog left open would sit on top
    // the tour shows Home; afterwards go back to where the user was (Results cannot be reopened any other way)
    const from = S.screen;
    if (from !== 'home') go('home');
    const back = () => { if (from !== 'home' && S.screen === 'home') go(from); else window.scrollTo(0, 0); };
    /* the steps describe the Home screen as it is now: a Selective Test or Competition paper has no practice options,
       and its Start button has its own name */
    const steps = TOUR.filter(s => !(s.target === '#practiceOptions' && $('#practiceOptions').hidden))
      .map(s => (s.target === '#startBtn' ? Object.assign({}, s, { vars: { btn: $('#startBtn').textContent } }) : s));
    if (!window.Tour.run(steps, { t, onEnd: () => { store.set(K.tour, 'done'); back(); } })) back();
  }

  /* ---------- wire up ---------- */
  $('#tourBtn').addEventListener('click', startTour);
  document.querySelectorAll('.tab[data-go]').forEach(b => b.addEventListener('click', async () => {
    if (S.screen === 'quiz' && !confirm(t(S.quiz && S.quiz.exam ? 'sel.quitConfirm' : 'quiz.quitConfirm'))) return;
    if (S.screen === 'quiz') { stopTimer(); S.quiz = null; }
    if (b.dataset.go === 'parent') { if (await unlockParent()) { draftProvider = null; delete $('#aiKey').dataset.touched; go('parent'); } return; }
    go(b.dataset.go);
  }));
  const startOrHome = () => (S.screen === 'home' ? startQuiz(S.settings) : go('home'));
  $('#fabStart').addEventListener('click', startOrHome);
  $('#heroStart').addEventListener('click', () => startQuiz(S.settings));
  $('#navStudents').addEventListener('click', () => $('#profileBtn').click());
  $('#langBtn').addEventListener('click', () => {
    window.I18N.setLang(lang() === 'zh' ? 'en' : 'zh');
    render();   // instant: re-renders text only, the typed answer and quiz state are untouched
  });
  $('#parentBtn').addEventListener('click', async () => {
    if (S.screen === 'quiz' || gameBusy()) { await unlockParent(); return; }
    if (await unlockParent()) { draftProvider = null; delete $('#aiKey').dataset.touched; go('parent'); }
  });
  $('#startBtn').addEventListener('click', () => startQuiz(S.settings));
  $('#quitBtn').addEventListener('click', () => {
    if (confirm(t(S.quiz && S.quiz.exam ? 'sel.quitConfirm' : 'quiz.quitConfirm'))) { stopTimer(); S.quiz = null; go('home'); }
  });
  $('#prevQ').addEventListener('click', () => { const Q = S.quiz; if (Q && Q.i > 0) goToQuestion(Q.i - 1); });
  $('#nextQ').addEventListener('click', () => { const Q = S.quiz; if (Q && Q.i < Q.questions.length - 1) goToQuestion(Q.i + 1); });
  $('#prevPage').addEventListener('click', () => { const Q = S.quiz; if (Q && Q.page > 0) { Q.page -= 1; renderQuiz(); window.scrollTo(0, 0); } });
  $('#nextPage').addEventListener('click', () => { const Q = S.quiz; if (Q && (Q.page + 1) * PAGE < Q.questions.length) { Q.page += 1; renderQuiz(); window.scrollTo(0, 0); } });
  $('#viewSingle').addEventListener('click', () => setView('single'));
  $('#viewPages').addEventListener('click', () => setView('pages'));
  $('#printQuiz').addEventListener('click', () => { const Q = S.quiz; if (Q) openPrint(Q.questions, Q.settings); });
  $('#printHome').addEventListener('click', printFromHome);
  $('#printResults').addEventListener('click', () => { const Q = S.quiz; if (Q) openPrint(Q.questions, Q.settings); });
  $('#printForm').addEventListener('submit', doPrint);
  $('#printCancel').addEventListener('click', () => $('#printDlg').close());
  $('#finishBtn').addEventListener('click', () => {
    const Q = S.quiz; if (!Q) return;
    if (!Q.exam) return finishPractice(false);
    const left = Q.answers.filter(a => a === null).length;
    if (confirm(left ? t('sel.finishConfirm', { n: left }) : t('sel.finishConfirm0'))) finishTest(false);
  });
  $('#unlockBtn').addEventListener('click', unlockParent);
  $('#againBtn').addEventListener('click', () => startQuiz(S.lastQuizSettings || S.settings));
  $('#homeBtn').addEventListener('click', () => go('home'));
  $('#lockBtn').addEventListener('click', () => { S.parent = false; go('home'); });
  $('#csvExport').addEventListener('click', () => {
    const pr = Profiles.active, name = Profiles.name(pr);
    const text = Records.toCSV({ name: pr.name || name, schoolYear: pr.schoolYear, schoolYearSet: pr.schoolYearSet, dob: pr.dob },
      store.get(histKey(), []), store.get(Profiles.badgeKey(), []));
    const a = el('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = 'student-practice_' + name.replace(/[^\p{L}\p{N}_-]+/gu, '_') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(t('csv.exported', { name }));
  });
  $('#csvImportBtn').addEventListener('click', () => $('#csvImport').click());
  $('#csvImport').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    let data;
    // only names the app knows: a text key that exists, a figure that draws (R2.3, v1.7.0)
    const known = { key: k => Object.prototype.hasOwnProperty.call(window.I18N.STRINGS.en, k), fig: f => !window.Fig || Fig.draws(f) };
    try { data = Records.fromCSV(await file.text(), known); }
    catch (err) { return toast(t(err.message === 'size' ? 'csv.tooBig' : 'csv.bad'), 7000); }
    const pr = Profiles.active, name = Profiles.name(pr);
    // rows the import refused are said, so a typo is not mistaken for "already imported" (R2.5, v1.7.0)
    const skipped = data.skipped ? ' ' + t('csv.skipped', { n: data.skipped }) : '';
    if (!confirm(t('csv.importConfirm', { name, s: data.history.length, b: data.badges.length }) + skipped)) return;
    const h = Records.merge(store.get(histKey(), []), data.history, Records.sessionKey, 100);
    const b = Records.merge(store.get(Profiles.badgeKey(), []), data.badges, Records.badgeKey, 500);
    store.set(histKey(), h.list); store.set(Profiles.badgeKey(), b.list);
    const st = data.student;
    if (st) {   // details fill gaps only: what was entered on this device wins
      Profiles.update(pr.id, { name: pr.name || st.name, schoolYear: pr.schoolYear || st.schoolYear,
        schoolYearSet: pr.schoolYear ? pr.schoolYearSet : st.schoolYearSet, dob: pr.dob || st.dob });
      applySuggestedYear();
    }
    render();
    toast(t('csv.imported', { s: h.added, b: b.added }) + skipped, 7000);
  });
  $('#changePin').addEventListener('click', async () => { if (await pinDialog('change')) toast(t('parent.saved')); });
  $('#aiKey').addEventListener('input', () => { $('#aiKey').dataset.touched = '1'; });
  $('#aiSave').addEventListener('click', () => {
    const d = currentDraft(), prompts = (store.get(K.ai, {}) || {}).prompts;   // keep any customised prompts
    store.set(K.ai, Object.assign(d.provider === 'local' ? { provider: 'local', key: '', model: '' } : d, prompts ? { prompts } : {}));
    $('#aiMsg').className = 'small ok';
    $('#aiMsg').textContent = t('parent.saved');
  });
  $('#promptSave').addEventListener('click', () => { savePrompt($('#promptText').value); toast(t('parent.saved')); });
  $('#promptReset').addEventListener('click', () => { savePrompt(''); toast(t('parent.promptDefault')); });
  $('#profileBtn').addEventListener('click', () => { renderProfiles(); window.I18N.applyStatic($('#profileDlg')); $('#profileDlg').showModal(); });
  $('#profileClose').addEventListener('click', () => $('#profileDlg').close());
  $('#gameGo').addEventListener('click', playGame);
  $('#gameAgain').addEventListener('click', playGame);
  $('#gameBack').addEventListener('click', () => go('games'));
  $('#gameQuit').addEventListener('click', () => go('games'));
  $('#gamePad').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b && game) game.key(b.dataset.k); });
  $('#pzAgain').addEventListener('click', () => playPuzzle(puzzleLevel));
  $('#pzBack').addEventListener('click', () => go('games'));
  $('#pzQuit').addEventListener('click', () => go('games'));
  $('#profileAdd').addEventListener('submit', e => {
    e.preventDefault();
    if (S.screen === 'quiz' || S.screen === 'loading' || gameBusy()) return toast(t('profile.busy'));
    const name = $('#profileNew').value.trim().slice(0, 20);
    const pr = Profiles.add(name);
    if (!pr) return toast(t('profile.full'));
    $('#profileNew').value = '';
    editingProfile = pr.id;                     // a new student: ask for the details straight away
    loadProfileSettings(); renderProfiles(); render();
    toast(t('profile.switched', { name: Profiles.name(pr) }));
  });
  $('#countCustom').addEventListener('input', () => {
    const v = Math.round(+$('#countCustom').value);
    if (v >= 1 && v <= 50) { S.settings.count = v; saveSettings(); }
  });
  $('#countCustom').addEventListener('change', () => {
    const v = Math.max(1, Math.min(50, Math.round(+$('#countCustom').value) || 10));
    $('#countCustom').value = v; S.settings.count = v; saveSettings();
  });
  $('#aiTest').addEventListener('click', async () => {
    const d = currentDraft(), msg = $('#aiMsg'), btn = $('#aiTest');
    msg.className = 'small'; msg.textContent = t('parent.testing'); btn.disabled = true;
    try {
      const qs = await AI.generateSet(d, 'maths', 6, 'word', 2, 1, topicNames('maths', 6));
      msg.className = 'small ok';
      msg.textContent = t('parent.testOk') + ' “' + (qs[0].q[lang()] || qs[0].q.en) + '”';
    } catch (e) {
      msg.className = 'small bad';
      msg.textContent = t('parent.testBad', { err: e.message || String(e) });
    } finally { btn.disabled = false; }
  });
  window.addEventListener('beforeunload', e => {
    if (S.screen === 'quiz' && S.quiz && (S.quiz.exam ? !S.quiz.finished : S.quiz.st.some(x => x.status !== 'answering'))) { e.preventDefault(); e.returnValue = ''; }
  });

  /* Test hook: lets tests/flows.js answer a set correctly to check that badges are earned. Read-only, and never on a
     Production host, so students there cannot use it to see answers. */
  if (!(self.PRODUCTION_HOSTS || []).includes(location.hostname)) {
    window.__testAnswers = () => (S.quiz ? S.quiz.questions.map(q => ({ type: q.type, answer: q.answer, correct: q.correct })) : null);
    window.__testGame = () => (S.screen === 'puzzle' && puzzle ? puzzle.state : game ? game.state : null);   // v1.9.0 balloons; v1.10.0 the puzzle game on screen
  }

  registerSW();
  applySuggestedYear();
  go('home');
  if (tourState === 'new') requestAnimationFrame(startTour);   // first visit in this browser
})();
