/* Browser flow tests: what a student and a parent actually do, past the home screen.
   Each flow runs in a fresh browser profile with made-up data only, so it is safe against Test and Production too. */
const { launch } = require('./smoke.js');

const SETTINGS = 'sp.settings.p1';
const PIN = '2468';

/* initScript: code run in the page before the app (e.g. to make storage fail).
   options.clock: install Playwright's fake clock before the app loads (page.clock.runFor moves time on).
   options.tour: leave the first-visit guided tour (v1.8.0) on. Otherwise it is marked as seen before the app runs, so
   it does not cover the screen in flows that test something else.
   options.news: leave What's new (v1.11.0) on. Otherwise it is marked as seen (a version above any release), because a
   seeded browser looks like one that used an earlier version and would get the pop-up. */
async function freshPage(browser, site, seed, initScript, options = {}) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, ...options.context });
  context.setDefaultTimeout(20000);   // no single step may wait longer than 20 s
  if (!options.tour) await context.addInitScript(() => { try { if (localStorage.getItem('sp.tour') === null) localStorage.setItem('sp.tour', '"done"'); } catch (e) { /* blocked */ } });
  if (!options.news) await context.addInitScript(() => { try { if (localStorage.getItem('sp.news') === null) localStorage.setItem('sp.news', '"999.0.0"'); } catch (e) { /* blocked */ } });
  if (initScript) await context.addInitScript(initScript);
  if (options.route) await context.route('**/*', options.route);   // e.g. answer one file with 404
  const page = await context.newPage();
  if (options.clock) await page.clock.install();   // v1.9.0: a fake clock, so a one-minute game runs in seconds
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());   // confirm() dialogs: finish with unanswered questions, reset PIN
  if (seed) {
    // seed before the app first runs, as an earlier version would have left it: open a plain file on the same site first
    await page.goto(site + 'version.js');
    await page.evaluate(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  }
  await page.goto(site, { waitUntil: 'load' });
  return { context, page, errors };
}

const settings = o => JSON.stringify(Object.assign({ subject: 'maths', year: 6, topic: 'mixed', diff: 2, count: 5, view: 'pages' }, o));
const visible = (page, sel) => page.locator(sel).first().isVisible();

async function typePin(page) {
  for (let k = 0; k < 2; k++) {               // create: PIN, then the same PIN again; enter: once (the second is skipped)
    if (!(await page.locator('#pinDialog').evaluate(d => d.open))) break;
    await page.fill('#pinInput', PIN);
    await page.click('#pinOk');
  }
}

/* v1.12.0 W4: Settings is a tab open to everyone. The parent part opens with the PIN (Unlock); when the parent is
   already unlocked it is open at once. The guided tour is a row in Settings. */
async function openParent(page) {
  await page.click('#navParent');
  if (await page.isVisible('#parentUnlock')) await page.click('#parentUnlock');
}
/* v1.12.0 W6: Home has four cards; a card opens a sheet with that mode's options and Start. openSheet opens the
   sheet for a mode (closing another first); startSet starts a set with the settings Home has now. */
const CARD = { study: '#cardStudy', practice: '#cardPractice', test: '#cardTest' };
const sheetOpen = page => page.locator('#setupDlg').evaluate(d => d.open);
async function openSheet(page, mode) {
  if (await sheetOpen(page)) { await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('#setupDlg').open); }
  await page.click(CARD[mode]);
}
async function startSet(page) {
  if (!(await sheetOpen(page))) await page.click(CARD[await page.getAttribute('#modeCards', 'data-mode')]);
  await page.click('#startBtn');
}
async function openTour(page) {
  await page.click('#navParent');
  await page.click('#tourBtn');
}

async function run(site) {
  let pass = 0, fail = 0;
  const check = (name, ok, detail) => { ok ? pass++ : fail++; if (!ok) console.log('FAIL flows:', name, detail === undefined ? '' : detail); };
  // one flow failing (e.g. a step timing out) is one failure; the other flows still run
  const only = process.env.FLOWS_ONLY;
  const flow = async (name, fn) => { if (only && !name.includes(only)) return; try { await fn(); } catch (e) { const at = /flows\.js:(\d+)/.exec(e.stack || ''); check(name + ': finished', false, e.message.split('\n')[0] + (at ? ' (flows.js line ' + at[1] + ')' : '')); } };
  const browser = await launch();
  try {
    // 1. Practice: start a set of 5, finish with nothing answered, results and review appear.
    //    F.8: a worked method asks for the parent PIN and stays closed when the student cancels.
    await flow('practice', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await startSet(page);
      check('practice: quiz screen opens', await visible(page, '#screen-quiz'));
      await page.click('#finishBtn');
      check('practice: results screen opens', await visible(page, '#screen-results'));
      check('practice: score is out of 5', /\b5\b/.test(await page.textContent('#resScore')), await page.textContent('#resScore'));
      check('practice: review lists 5 questions', (await page.locator('#resList > li').count()) === 5);
      await page.locator('#resList details.method summary').first().click();
      check('F.8 method asks for the parent PIN', await page.locator('#pinDialog').evaluate(d => d.open));
      await page.click('#pinCancel');
      check('F.8 method stays closed without the PIN', !(await page.locator('#resList details.method').first().evaluate(d => d.open)));
      await page.locator('#resList details.method summary').nth(1).click();
      await typePin(page);
      // R1.2: the method the parent tapped opens right after the PIN, without tapping again (second item: not just the first)
      check('R1.2 tapped method opens after the PIN', await page.locator('#resList details.method').nth(1).evaluate(d => d.open));
      check('R1.2 only that method opens', !(await page.locator('#resList details.method').first().evaluate(d => d.open)));
      check('practice: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // 2. Parent: create a PIN, open Parent settings; the old "students can open methods" switch is gone.
    await flow('parent', async () => {
      const { context, page } = await freshPage(browser, site);
      await openParent(page);
      await typePin(page);
      check('parent: PIN opens Parent settings', (await visible(page, '#parentArea')) && !(await visible(page, '#parentLocked')));
      check('F.8 no switch that opens methods for students', (await page.locator('#methodsToggle').count()) === 0);
      await context.close();
    });

    // 3. F.1: "Forgot PIN" erases this app's data (progress, PIN, key) and keeps the language.
    await flow('F.1 forgot PIN', async () => {
      const { context, page } = await freshPage(browser, site, {
        'sp.pin': JSON.stringify({ salt: 'x', hash: 'y' }), 'sp.history.p1': '[{"n":1,"correct":1}]',
        'sp.ai': '{"provider":"claude","key":"made-up-test-key"}', 'sp.lang': 'en', 'other-app.data': 'keep'
      });
      await openParent(page);
      check('F.1 Forgot PIN is offered', await visible(page, '#pinForgot'));
      await Promise.all([page.waitForEvent('load'), page.click('#pinForgot')]);
      const keys = await page.evaluate(() => Object.keys(localStorage).sort());
      check('F.1 reset erases progress, PIN and AI key', !keys.some(k => ['sp.pin', 'sp.history.p1', 'sp.ai'].includes(k)), keys.join(','));
      check('F.1 reset keeps the language and other apps\' keys', keys.includes('sp.lang') && keys.includes('other-app.data'), keys.join(','));      await context.close();
    });

    // 4. F.2: keys from v1.6.3 ("mp.") move to "sp." once; the saved language still applies.
    await flow('F.2 old keys', async () => {
      const { context, page } = await freshPage(browser, site, {
        'mp.lang': 'zh', 'mp.settings.p1': settings({ year: 3 }),
        'mp.history.p1': '[{"n":5,"correct":5,"old":true}]', 'sp.history.p1': '[{"n":5,"correct":1,"new":true}]',
        'mp.other-app': 'not ours'
      });
      const store = await page.evaluate(() => Object.assign({}, localStorage));
      check('F.2 settings and language moved to "sp."', store['sp.settings.p1'] && store['sp.lang'] === 'zh' && !store['mp.settings.p1'] && !store['mp.lang'], Object.keys(store).join(','));
      check('F.2 moved language applies (Chinese)', (await page.evaluate(() => document.documentElement.lang)) === 'zh-CN');
      check('F.6 bottom navigation is named in Chinese', (await page.getAttribute('nav.bottom-nav', 'aria-label')) === '主导航');
      check('R1.1 when both exist, both are kept', /"new"/.test(store['sp.history.p1']) && /"old"/.test(store['mp.history.p1'] || ''), Object.keys(store).join(','));
      check('R1.1 another app\'s "mp." key is left alone', store['mp.other-app'] === 'not ours');
      // R1.1: the move happens once; an old key written later (e.g. by a v1.6.3 tab still open) is not moved or deleted
      await page.evaluate(() => localStorage.setItem('mp.badges.p1', '["late"]'));
      await page.reload({ waitUntil: 'load' });
      const later = await page.evaluate(() => [localStorage.getItem('mp.badges.p1'), localStorage.getItem('sp.badges.p1')]);
      check('R1.1 the move runs once only', later[0] === '["late"]' && later[1] === null, JSON.stringify(later));
      await context.close();
    });

    // R1.3 (F.9): when the browser refuses every save, the app keeps working and says so once, not on every save.
    await flow('R1.3 storage full', async () => {
      const failing = () => { Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); }; };
      const toastText = () => page.evaluate(() => { const b = document.querySelector('#toast'); return b.hidden ? '' : b.textContent; });
      const { context, page, errors } = await freshPage(browser, site, null, failing);
      await page.waitForTimeout(300);
      // the first failed save happens while the app starts (the student profile), so the message is there at once
      check('R1.3 "not saving" message appears', /not saving progress/.test(await toastText()), await toastText());
      await page.evaluate(() => { const b = document.querySelector('#toast'); b.hidden = true; b.textContent = ''; });
      await startSet(page);
      await page.click('#finishBtn');                 // saving the session fails again
      check('R1.3 results still appear when saving fails', await visible(page, '#screen-results'));
      await page.waitForTimeout(300);
      check('R1.3 the message is not repeated on later saves', !/not saving progress/.test(await toastText()), await toastText());
      check('R1.3 no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // 5. Language switch keeps a typed answer (pages view shows 5 questions, so a typed one is almost always there).
    await flow('language switch', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings() });
      let typed = false;
      for (let k = 0; k < 4 && !typed; k++) {
        await (k ? page.click('#againBtn') : startSet(page)).catch(() => {});
        const box = page.locator('input.answer').first();
        if (await box.count()) {
          await box.fill('12.5');
          await page.click('#langBtn');
          check('language switch keeps the typed answer', (await page.locator('input.answer').first().inputValue()) === '12.5');
          typed = true;
        } else { await page.click('#finishBtn'); }
      }
      check('language switch: found a typed question', typed);
      await context.close();
    });

    // 6. F.13: the options of a multiple-choice question are one tab stop, and arrow keys move and choose.
    await flow('F.13 keyboard', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings({ subject: 'ga', year: 7, view: 'single' }) });
      await startSet(page);
      const group = page.locator('[role=radiogroup]').first();
      const stops = await group.locator('.choice').evaluateAll(bs => bs.map(b => b.tabIndex));
      check('F.13 one tab stop per option group', stops.filter(x => x === 0).length === 1, stops.join(','));
      await group.locator('.choice').first().focus();
      await page.keyboard.press('ArrowRight');
      const after = await page.locator('[role=radiogroup]').first().locator('.choice').evaluateAll(bs => bs.map(b => [b.getAttribute('aria-checked'), b === document.activeElement]));
      check('F.13 ArrowRight chooses and focuses the next option', after[1] && after[1][0] === 'true' && after[1][1], JSON.stringify(after));
      await context.close();
    });
    await flow('F.13 button size', async () => {
      const { context, page } = await freshPage(browser, site);
      // v1.12.0 W6: the four cards and the tabs (five from v2.0.0) are at least 44 px tall; so is Start in the sheet
      const h = await page.evaluate(() => [...document.querySelectorAll('#modeCards .mode-card, .bottom-nav .tab')].map(b => b.getBoundingClientRect().height));
      await page.click('#cardPractice');
      h.push(await page.evaluate(() => document.querySelector('#startBtn').getBoundingClientRect().height));
      check('F.13 the four cards, the five tabs and Start are at least 44 px tall', h.length === 10 && h.every(x => x >= 44), h);
      await context.close();
    });

    // v1.7.0: the answer hint sits behind an info icon: hidden until hover, focus or tap
    await flow('v1.7 info tip', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await startSet(page);
      const wrap = page.locator('#qList .info').first(), tip = wrap.locator('.tip');
      check('v1.7 hint is not shown as a line of text', !(await page.locator('#qList p').filter({ hasText: 'Fractions like' }).count()));
      check('v1.7 hint hidden until asked', !(await tip.isVisible())   /* R4.1: a hidden tip is display: none now */);
      await wrap.locator('.info-btn').hover();
      check('v1.7 hint shows on hover', (await tip.isVisible()));
      check('v1.7 hint text', /3\/4/.test(await tip.textContent()), await tip.textContent());
      await page.mouse.move(5, 5);
      await wrap.locator('.info-btn').click();
      check('v1.7 hint shows on tap', (await wrap.getAttribute('class')).includes('open') && (await tip.isVisible()));
      const box = await tip.boundingBox();
      check('v1.7 hint stays on a 375 px screen', box && box.x >= 0 && box.x + box.width <= 375, JSON.stringify(box));
      await context.close();
    });

    // v1.7.0: a fast, all-correct, first-try set earns Perfect, First try and Speed at its own level
    await flow('v1.7 badges earned', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 4, diff: 1 }) });
      await startSet(page);
      const answers = await page.evaluate(() => (window.__testAnswers ? window.__testAnswers() : null));
      if (!answers) { console.log('  (flows: badge flow skipped: no test hook on a Production host)'); await context.close(); return; }
      for (let i = 0; i < answers.length; i++) {
        const a = answers[i], card = page.locator('#qc' + i);
        if (a.type === 'mc') { await card.locator('.choice').nth(a.correct).click(); await page.locator('#qc' + i + ' button.btn.primary').click(); }
        else { await page.fill('#ans' + i, String(a.answer)); await page.press('#ans' + i, 'Enter'); }
      }
      await page.click('#finishBtn');
      const text = await page.textContent('#resBadgeText');
      check('v1.7 results show all three new badges', /Perfect/.test(text) && /First try/.test(text) && /Speed/.test(text), text);
      check('v1.7 results name the level', /Year 4/.test(text) && /Core/.test(text), text);
      await page.click('.tab[data-go="progress"]');
      const row = await page.locator('.badge-grid tr').nth(1).locator('td').evaluateAll(tds => tds.map(td => td.className));
      check('v1.7 Year 4 Core row has all three badges', row.join() === 'got,got,got', row.join());
      const other = await page.locator('.badge-grid tr').nth(2).locator('td.got').count();
      check('v1.7 other difficulties stay empty', other === 0, other);
      await context.close();
    });

    // v1.7.0: student details choose the year on Home
    await flow('v1.7 student details', async () => {
      const Rec = require('../js/records.js');
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 9 }) });
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      await page.selectOption('.profile-edit select', '5');
      await page.click('.profile-edit button[type=submit]');
      await page.click('#profileClose');
      check('v1.7 school year chooses the year on Home', (await page.inputValue('#yearSel')) === '5', await page.inputValue('#yearSel'));
      // a new student: the details open straight away; a birth month alone also chooses the year
      await page.click('#profileBtn');
      await page.fill('#profileNew', 'Kid');
      await page.click('#profileAddBtn');
      check('v1.7 details open for a new student', (await page.locator('.profile-edit').count()) === 1);
      await page.fill('.profile-edit input[type=month]', '2016-08');
      await page.click('.profile-edit button[type=submit]');
      await page.click('#profileClose');
      const want = String(Rec.suggestYear({ dob: '2016-08' }, new Date()));
      check('v1.7 birth month chooses the year on Home', (await page.inputValue('#yearSel')) === want, (await page.inputValue('#yearSel')) + ' want ' + want);
      await context.close();
    });

    // v1.7.0: export a student's progress to CSV, import it into another student; a wrong file is refused
    await flow('v1.7 CSV', async () => {
      const os = require('os'), fs = require('fs'), path = require('path');
      const t0 = Date.parse('2026-10-01T10:00:00Z');
      const { context, page } = await freshPage(browser, site, {
        'sp.profiles': JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 4, schoolYearSet: new Date().getFullYear(), dob: '2016-03' }], active: 'p1' }),
        'sp.history.p1': JSON.stringify([
          { date: t0, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 5, stars: 3, byTopic: { frac: [5, 5] }, wrong: [] },
          { date: t0 + 864e5, subject: 'maths', year: 4, topic: 'dec', diff: 2, n: 5, correct: 3, stars: 1, byTopic: { dec: [3, 5] }, wrong: [] }]),
        'sp.badges.p1': JSON.stringify([{ date: t0, kind: 'perfect', subject: 'maths', year: 4, diff: 2, n: 5 }, { date: t0, kind: 'firstTry', subject: 'maths', year: 4, diff: 2, n: 5 }])
      });
      await openParent(page);
      await typePin(page);
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csvExport')]);
      const file = path.join(os.tmpdir(), 'Student_Practice-tests', 'progress.csv');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await dl.saveAs(file);
      const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').trim().split(/\r\n/);
      check('v1.7 export: header, student, 2 sessions, 2 badges', lines.length === 6 && lines[0].startsWith('record,date,name') && lines.filter(l => l.startsWith('session,')).length === 2, lines.length);
      check('v1.7 export file name names the student', /^student-practice_Ann_\d{4}-\d{2}-\d{2}\.csv$/.test(dl.suggestedFilename()), dl.suggestedFilename());
      // a second student, then import Ann's file into it
      await page.click('#profileBtn');
      await page.fill('#profileNew', 'Copy');
      await page.click('#profileAddBtn');
      await page.locator('.profile-edit .btn.ghost').click();
      await page.click('#profileClose');
      await openParent(page);
      await page.setInputFiles('#csvImport', file);
      await page.waitForTimeout(300);
      const p2 = await page.evaluate(() => ({ h: JSON.parse(localStorage.getItem('sp.history.p2') || '[]').length, b: JSON.parse(localStorage.getItem('sp.badges.p2') || '[]').length, pr: JSON.parse(localStorage.getItem('sp.profiles')).list.find(x => x.id === 'p2') }));
      check('v1.7 import adds the sessions and badges', p2.h === 2 && p2.b === 2, JSON.stringify(p2));
      check('v1.7 import fills missing details, keeps the name', p2.pr.name === 'Copy' && p2.pr.schoolYear === 4 && p2.pr.dob === '2016-03', JSON.stringify(p2.pr));
      await page.setInputFiles('#csvImport', file);   // the same file again adds nothing
      await page.waitForTimeout(300);
      const again = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p2')).length);
      check('v1.7 importing twice adds no duplicates', again === 2, again);
      const bad = path.join(path.dirname(file), 'not-progress.csv');
      fs.writeFileSync(bad, 'name,score\nA,1\n');
      await page.setInputFiles('#csvImport', bad);
      await page.waitForTimeout(300);
      check('v1.7 a wrong file is refused with a message', /not a Student Practice progress file/.test(await page.textContent('#toast')), await page.textContent('#toast'));
      await context.close();
    });

    // R1.1 (v1.7.0): a crafted progress file cannot break Progress; a bad record already stored hides only its own part
    await flow('R1.1 bad records', async () => {
      const os = require('os'), fs = require('fs'), path = require('path'), Rec = require('../js/records.js');
      const t0 = Date.parse('2026-10-01T10:00:00Z');
      const crafted = { date: t0, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 4, stars: 99, byTopic: { frac: [4, 5] }, wrong: [{ q: null }, { type: 'input', q: { en: 'Kept 1/2?' }, answer: '1/2', given: [] }] };
      const file = path.join(os.tmpdir(), 'Student_Practice-tests', 'crafted.csv');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Rec.COLUMNS.join(',') + '\r\nsession,,,,,,,,,,,,,,"' + JSON.stringify(crafted).replace(/"/g, '""') + '"\r\n');
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await openParent(page);
      await typePin(page);
      await page.setInputFiles('#csvImport', file);
      await page.waitForTimeout(300);
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p1') || '[]'));
      check('R1.1 import stores stars in range and only showable questions', stored.length === 1 && stored[0].stars === undefined && stored[0].wrong.length === 1, JSON.stringify(stored));
      await page.click('.tab[data-go="progress"]');
      check('R1.1 imported file: Progress lists the session', (await page.locator('#progBody ul.plain li').count()) >= 1);
      check('R1.1 imported file: the question to review shows', (await page.locator('#progBody ol.review > li').count()) === 1);
      check('R1.1 imported file: no page errors', errors.length === 0, errors.join(' | '));
      // records stored as they were before this fix: the screen still opens and Clear progress is there
      await page.evaluate(c => localStorage.setItem('sp.history.p1', JSON.stringify([c])), crafted);
      const logged = [];
      page.on('console', m => { if (m.type() === 'error') logged.push(m.text()); });
      await page.click('.tab[data-go="home"]');
      await page.click('.tab[data-go="progress"]');
      check('R1.1 stored bad record: Clear progress is there', (await page.locator('#clearProgress').count()) === 1);
      check('R1.1 stored bad record: the other parts still show', (await page.locator('#progBody .stats').count()) === 1 && (await page.locator('#progBody .badge-shelf').count()) === 1);
      check('R1.1 stored bad record: no uncaught page errors', errors.length === 0, errors.join(' | '));
      await page.click('#clearProgress');
      check('R1.1 Clear progress recovers', (await page.evaluate(() => localStorage.getItem('sp.history.p1'))) === null);
      await context.close();
    });

    // R1.2 (v1.7.0): a year picked by hand is kept when a new school year moves the suggestion; one that was the suggestion moves on
    await flow('R1.2 hand-picked year', async () => {
      const y = new Date().getFullYear();
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 5, schoolYearSet: y - 1 }], active: 'p1' });   // Year 6 now
      let { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 8, suggested: 5 }) });
      check('R1.2 hand-picked Year 8 stays in a new school year', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      check('R1.2 the new suggestion is remembered', (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).suggested, SETTINGS)) === 6);
      await context.close();
      ({ context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 5, suggested: 5 }) }));
      check('R1.2 a year that was the suggestion moves up', (await page.inputValue('#yearSel')) === '6', await page.inputValue('#yearSel'));
      await context.close();
    });

    // R2.1 / R4.1 (v1.7.0): the student details only move the default year. A year picked by hand on Home is kept
    // whatever is edited (Terry's decision on R4.1); a Home year that was the suggestion follows the new one.
    await flow('R2.1 details save keeps a hand-picked year', async () => {
      const y = new Date().getFullYear();
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 5, schoolYearSet: y }], active: 'p1' });
      const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 8, suggested: 5 }) });
      const editYear = async v => {
        await page.click('#profileBtn');
        await page.locator('#profileList .icon-btn').first().click();
        await page.selectOption('.profile-edit select', v);
        await page.click('.profile-edit button[type=submit]');
        await page.click('#profileClose');
      };
      check('R2.1 Home starts on the hand-picked Year 8', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      await page.fill('.profile-edit input[type=text]', 'Anna');
      await page.click('.profile-edit button[type=submit]');
      await page.click('#profileClose');
      check('R2.1 a name edit keeps Year 8', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      await editYear('6');
      check('R4.1 a new school year keeps the hand-picked Year 8', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      check('R4.1 the new suggestion is remembered', (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).suggested, SETTINGS)) === 6);
      await context.close();
      {   // Home still on the suggestion: the default moves it
        const { context, page: p2 } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 5, suggested: 5 }) });
        await p2.click('#profileBtn');
        await p2.locator('#profileList .icon-btn').first().click();
        await p2.selectOption('.profile-edit select', '6');
        await p2.click('.profile-edit button[type=submit]');
        await p2.click('#profileClose');
        check('R4.1 a Home year that was the suggestion follows a new school year', (await p2.inputValue('#yearSel')) === '6', await p2.inputValue('#yearSel'));
        await context.close();
      }
    });

    // R3.1 / R4.1 (v1.7.0): a birth-month edit keeps a hand-picked year, even when it moves the suggestion
    await flow('R3.1 birth month and a hand-picked year', async () => {
      const Rec = require('../js/records.js'), y = new Date().getFullYear();
      const edit = async (page, month) => {
        await page.click('#profileBtn');
        await page.locator('#profileList .icon-btn').first().click();
        await page.fill('.profile-edit input[type=month]', month);
        await page.click('.profile-edit button[type=submit]');
        await page.click('#profileClose');
      };
      const stored = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)).suggested, SETTINGS);
      // Hermes's case: school year 8 entered this year (it wins over the birth month), Home picked by hand: Year 10
      {
        const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 8, schoolYearSet: y }], active: 'p1' });
        const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 10, suggested: 8 }) });
        check('R3.1 Home starts on the hand-picked Year 10', (await page.inputValue('#yearSel')) === '10', await page.inputValue('#yearSel'));
        await edit(page, '2015-03');
        check('R3.1 a birth month that does not move the suggestion keeps Year 10', (await page.inputValue('#yearSel')) === '10', await page.inputValue('#yearSel'));
        await context.close();
      }
      // no school year, so the suggestion comes from the birth month (R4.1, measured by Hermes)
      const from = Rec.suggestYear({ dob: '2016-03' }, new Date()), to = Rec.suggestYear({ dob: '2014-03' }, new Date());
      {
        const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ben', dob: '2016-03' }], active: 'p1' });
        const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 10, suggested: from }) });
        await edit(page, '2014-03');
        check('R4.1 a birth month that moves the suggestion keeps the hand-picked Year 10', (await page.inputValue('#yearSel')) === '10', await page.inputValue('#yearSel'));
        check('R4.1 and remembers the new suggestion', (await stored(page)) === to, String(await stored(page)) + ' want ' + to);
        await context.close();
      }
      {
        const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ben', dob: '2016-03' }], active: 'p1' });
        const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: from, suggested: from }) });
        await edit(page, '2014-03');
        check('R4.1 a Home year that was the suggestion follows the birth month', (await page.inputValue('#yearSel')) === String(to), (await page.inputValue('#yearSel')) + ' want ' + to);
        await context.close();
      }
    });

    // R4.1 (v1.7.0): the birth month, read against today's date, suggests a school year in the editor; the parent decides
    await flow('R4.1 school year hint from the birth month', async () => {
      const Rec = require('../js/records.js'), y = new Date().getFullYear();
      const byAge = Rec.suggestYear({ dob: '2014-03' }, new Date()), set = byAge === 3 ? 4 : 3;
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Cal', schoolYear: set, schoolYearSet: y, dob: '2014-03' }], active: 'p1' });
      const { context, page, errors } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: set, suggested: set }) });
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      const hint = page.locator('.profile-edit .profile-hint');
      check('R4.1 hint shows when the school year differs from the birth month', await hint.isVisible() && (await hint.textContent()).includes('Year ' + byAge), await hint.textContent());
      check('R4.1 the hint changes nothing by itself', (await page.inputValue('.profile-edit select')) === String(set));
      await hint.locator('button').click();
      check('R4.1 Use sets the school year field', (await page.inputValue('.profile-edit select')) === String(byAge), await page.inputValue('.profile-edit select'));
      check('R4.1 the hint hides once they match', !(await hint.isVisible()));
      await page.selectOption('.profile-edit select', String(set));
      check('R4.1 the parent can still choose another year', (await page.inputValue('.profile-edit select')) === String(set) && await hint.isVisible());
      await page.fill('.profile-edit input[type=month]', '');
      check('R4.1 no birth month, no hint', !(await hint.isVisible()));
      check('R4.1 hint: no page errors', !errors || errors.length === 0, (errors || []).join(' | '));
      await context.close();
    });

    // R6.3 / R6.4 (v1.7.0): the hint only for an age at school in Years 1-12, and as a plain "Year N"
    await flow('R6.3 R6.4 hint range and label', async () => {
      const y = new Date().getFullYear(), dobFor = n => (y - n - 5) + '-03';   // born in March: Year n this year
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Dee' }], active: 'p1' });
      const { context, page, errors } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings() });
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      const hint = page.locator('.profile-edit .profile-hint');
      await page.fill('.profile-edit input[type=month]', dobFor(11));
      const text = (await hint.isVisible()) ? await hint.textContent() : '';
      check('R6.4 Year 11 by age reads "Year 11", not a course name', /Year 11\./.test(text) && !/Advanced|Standard|Extension/.test(text), text);
      for (const n of [-1, -3]) {
        await page.fill('.profile-edit input[type=month]', dobFor(n));
        check(`R6.3 no hint for an age before Kindergarten (${n})`, !(await hint.isVisible()), dobFor(n));
      }
      await page.fill('.profile-edit input[type=month]', dobFor(0));
      check('R9.3 hint for Kindergarten, named Kindergarten', await hint.isVisible() && /Kindergarten\./.test(await hint.textContent()), await hint.textContent());
      check('R9.3 the school year list offers Kindergarten', (await page.locator('.profile-edit select option').evaluateAll(o => o.map(x => x.value))).includes('0'));
      await page.fill('.profile-edit input[type=month]', dobFor(1));
      check('R6.3 hint for Year 1', await hint.isVisible() && /Year 1\./.test(await hint.textContent()), await hint.textContent());
      await page.fill('.profile-edit input[type=month]', dobFor(0));
      await page.locator('.profile-hint button').click();
      check('R9.3 Use Kindergarten sets the school year to Kindergarten', (await page.locator('.profile-edit select').inputValue()) === '0');
      await page.locator('.profile-edit button[type=submit]').click();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.profiles')).list[0]);
      check('R9.3 Kindergarten is saved as school year 0 and shown in the list', saved.schoolYear === 0 && /Kindergarten/.test(await page.textContent('#profileList')), JSON.stringify(saved));
      check('R6.3 R6.4 no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // R6.1 (v1.7.0): a year picked on Home before any suggestion exists is kept when one appears
    await flow('R6.1 a year picked before any suggestion', async () => {
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Eve' }], active: 'p1' });
      const { context, page, errors } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings() });
      await page.click('#schoolSwitch [data-school="high"]');
      await openSheet(page, 'practice');
      await page.selectOption('#yearSel', '8');
      await page.keyboard.press('Escape');
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      await page.selectOption('.profile-edit select', '3');
      await page.click('.profile-edit button[type=submit]');
      await page.click('#profileClose');
      check('R6.1 Home keeps the Year 8 picked before the details', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      check('R6.1 the suggestion is remembered', (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).suggested, SETTINGS)) === 3);
      await page.reload({ waitUntil: 'load' });
      check('R6.1 still Year 8 after a reload', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      check('R6.1 no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
      {   // nothing picked by hand: the first suggestion still sets the year
        const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings() });
        await page.click('#profileBtn');
        await page.locator('#profileList .icon-btn').first().click();
        await page.selectOption('.profile-edit select', '3');
        await page.click('.profile-edit button[type=submit]');
        await page.click('#profileClose');
        check('R6.1 with no year picked, the first suggestion sets Year 3', (await page.inputValue('#yearSel')) === '3', await page.inputValue('#yearSel'));
        await context.close();
      }
    });

    await flow('R2 import and Progress', async () => {
      const os = require('os'), fs = require('fs'), path = require('path'), Rec = require('../js/records.js');
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await page.click('.tab[data-go="progress"]');
      check('R2.4 no Clear progress with nothing to clear', (await page.locator('#clearProgress').count()) === 0);
      const file = path.join(os.tmpdir(), 'Student_Practice-tests', 'typed.csv');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const badge = o => 'badge,,,,,,,,,,,,,,"' + JSON.stringify(o).replace(/"/g, '""') + '"';
      fs.writeFileSync(file, [Rec.COLUMNS.join(','),
        'session,2026-03-01T09:00:00Z,,,,maths,5,dec,3,5,5,,,,',        // blank stars: worked out from 5/5
        'session,2026-03-02T09:00:00Z,,,,maths,5,dec,3,5,,,,,',         // blank correct: skipped
        'session,2026-03-03T09:00:00Z,,,,zzz,5,zzz,3,5,4,,,,',          // unknown subject: skipped
        'session,2026-03-04T09:00:00Z,,,,maths,5,zzz,3,5,4,,,,',        // unknown topic: mixed
        badge({ date: Date.parse('2026-03-01T09:00:00Z'), kind: 'perfect', subject: 'sel', paper: 'x' })   // unknown paper: skipped
      ].join('\r\n') + '\r\n');
      await openParent(page);
      await typePin(page);
      page.once('dialog', d => { page.confirmText = d.message(); });   // freshPage's own handler accepts it
      await page.setInputFiles('#csvImport', file);
      await page.waitForTimeout(300);
      check('R2.5 the confirm says how many rows were left out', /3 row\(s\) could not be read/.test(page.confirmText || ''), page.confirmText);
      check('R2.5 the toast says it too', /Added 2 session\(s\).*3 row\(s\) could not be read/.test(await page.textContent('#toast')), await page.textContent('#toast'));
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p1') || '[]'));
      check('R2.2 blank stars not stored as 0', stored.length === 2 && !('stars' in stored[0]), JSON.stringify(stored));
      check('R2.3 unknown topic stored as mixed', stored[1] && stored[1].topic === 'mixed', JSON.stringify(stored[1]));
      await page.click('.tab[data-go="progress"]');
      const recent = await page.locator('#progBody ul.plain').first().textContent();
      check('R2.2 a 5/5 set shows three stars', /5\/5\s*★★★/.test(recent), recent);
      check('R2.3 no raw text keys on Progress', !/topic\.|subject\.|null/.test(await page.textContent('#progBody')), recent);
      check('R2.4 Clear progress shows once there is progress', (await page.locator('#clearProgress').count()) === 1);
      check('R2 no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // v1.8.0: the first visit opens a guided tour of Home; each step highlights its part; it is seen once, then on ? only.
    await flow('v1.8.0 guided tour', async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { tour: true });
      const tourOpen = () => page.evaluate(() => { const d = document.querySelector('#tourDlg'); return !!d && d.open; });
      await page.waitForTimeout(300);
      check('tour: opens on the first visit', await tourOpen());
      check('tour: starts at step 1 of 11', (await page.textContent('#tourStep')) === 'Step 1 of 11', await page.textContent('#tourStep'));
      check('tour: Back is hidden on step 1', !(await page.isVisible('#tourBack')));
      // walk every step: the highlight surrounds its part, the box stays on screen, nothing scrolls sideways, no raw keys
      const problems = [];
      for (let k = 1; k <= 11; k++) {   // v1.12.0 W7: 11 steps on a first visit (school, My plan, today's plan, the cards, Friends)
        await page.waitForTimeout(400);   // the highlight slides to its part in 0.25 s
        const r = await page.evaluate(() => {
          const sels = [null, '#profileBtn', '#langBtn', '#schoolSwitch', '#planBtn', '#todayPlan', '#modeCards', '#friendsBox', '.tab[data-go="progress"]', '#navGames', '#navParent'];
          const n = +/\d+/.exec(document.querySelector('#tourStep').textContent)[0], sel = sels[n - 1];
          const h = document.querySelector('.tour-hole').getBoundingClientRect(), p = document.querySelector('.tour-pop').getBoundingClientRect();
          const a = sel && document.querySelector(sel).getBoundingClientRect();
          return { n, sel, around: !a || (h.left <= a.left && h.top <= a.top && h.right >= a.right && h.bottom >= a.bottom && h.width > 0),
            onScreen: p.left >= 0 && p.top >= 0 && p.right <= innerWidth && p.bottom <= innerHeight,
            side: document.documentElement.scrollWidth > innerWidth, text: document.querySelector('#tourTitle').textContent + document.querySelector('#tourText').textContent };
        });
        if (r.n !== k) problems.push(`step ${k} shows ${r.n}`);
        if (!r.around) problems.push(`step ${k} highlight misses ${r.sel}`);
        if (!r.onScreen) problems.push(`step ${k} box off screen`);
        if (r.side) problems.push(`step ${k} scrolls sideways`);
        if (/tour\./.test(r.text) || r.text.length < 10) problems.push(`step ${k} text "${r.text}"`);
        if (k === 2) { await page.click('#tourBack'); if (!/^Step 1 /.test(await page.textContent('#tourStep'))) problems.push('Back does not go to step 1'); await page.click('#tourNext'); }
        if (k < 11) await page.click('#tourNext');
      }
      check('tour: every step highlights its part, on screen', problems.length === 0, problems.join('; '));
      check('tour: the last step says Done and has no Skip', (await page.textContent('#tourNext')) === 'Done' && !(await page.isVisible('#tourSkip')));
      await page.click('#tourNext');
      check('tour: Done closes it', !(await tourOpen()));
      check('tour: Done is remembered', (await page.evaluate(() => localStorage.getItem('sp.tour'))) === '"done"');
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(300);
      check('tour: not shown again on the next visit', !(await tourOpen()));
      // Settings > Guided tour opens it again; Escape closes it, back on Settings, with focus on the Guided tour row
      await openTour(page);
      check('tour: Guided tour in Settings opens it again at step 1', (await tourOpen()) && /^Step 1 /.test(await page.textContent('#tourStep')));
      await page.keyboard.press('ArrowRight');
      check('tour: the right arrow key goes to the next step', /^Step 2 /.test(await page.textContent('#tourStep')));
      await page.keyboard.press('Escape');
      check('tour: Escape closes it', !(await tourOpen()));
      check('tour: Escape goes back to Settings', await visible(page, '#screen-parent'));
      check('tour: focus goes back to the Guided tour row', (await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'tourBtn');
      check('tour: the row reads Guided tour', (await page.textContent('#tourBtn [data-i18n]')) === 'Guided tour', await page.textContent('#tourBtn'));
      // Chinese
      await page.click('#langBtn');
      await page.click('#tourBtn');
      check('tour: Chinese text in Chinese', (await page.textContent('#tourTitle')) === '欢迎！' && (await page.textContent('#tourNext')) === '下一步', await page.textContent('#tourTitle'));
      await page.click('#tourSkip');
      check('tour: Skip closes it', !(await tourOpen()));
      await page.click('#langBtn');
      // never during a set: the bottom bar (and so Settings and its guide) is hidden while a quiz is open, and back on Home
      await page.click('.tab[data-go="home"]');
      await startSet(page);
      check('tour: Settings cannot be opened during a set', !(await page.isVisible('#navParent')));
      await page.click('#quitBtn');
      check('tour: the Settings tab is back on Home', await page.isVisible('#navParent'));
      check('tour: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // v1.8.0: someone who used an earlier version (profiles already stored) is not shown the tour, and a reset keeps it so
    await flow('v1.8.0 tour and earlier users', async () => {
      const { context, page, errors } = await freshPage(browser, site, {
        'sp.profiles': JSON.stringify({ list: [{ id: 'p1', name: 'Ann' }], active: 'p1' }), [SETTINGS]: settings(),
        'sp.pin': JSON.stringify({ salt: 'x', hash: 'y' })
      }, null, { tour: true });
      const tourOpen = () => page.evaluate(() => !!document.querySelector('#tourDlg'));
      await page.waitForTimeout(300);
      check('tour: not shown to an earlier user', !(await tourOpen()));
      check('tour: stored as seen for an earlier user', (await page.evaluate(() => localStorage.getItem('sp.tour'))) === '"done"');
      await openParent(page);
      await Promise.all([page.waitForEvent('load'), page.click('#pinForgot')]);
      await page.waitForTimeout(300);
      check('tour: Forgot PIN reset keeps the tour as seen', (await page.evaluate(() => localStorage.getItem('sp.tour'))) === '"done"' && !(await tourOpen()));
      check('tour: earlier user, no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // v1.8.0 R1 findings: the steps follow the chosen subject (R1.1), a user from before profiles is an earlier user
    // (R1.2), a missing tour.js or showModal breaks nothing (R1.3), Tab stays on the tour's buttons (R1.4)
    await flow('v1.8.0 tour R1 fixes', async () => {
      const tourOpen = page => page.evaluate(() => { const d = document.querySelector('#tourDlg'); return !!d && d.open; });
      // walk the whole tour from ? and return each step's count, title and text
      const walk = async page => {
        await openTour(page);
        const out = [];
        for (let k = 0; k < 13 && (await tourOpen(page)); k++) {
          await page.waitForTimeout(300);   // v1.10.0: the highlight grows from 0 over 0.25 s; measured at once it read 0 on a busy machine (the same on v1.9.0)
          out.push({ step: await page.textContent('#tourStep'), title: await page.textContent('#tourTitle'), text: await page.textContent('#tourText'),
            hole: await page.evaluate(() => { const h = document.querySelector('.tour-hole'); return h.classList.contains('none') ? 0 : h.getBoundingClientRect().width; }) });
          await page.click('#tourNext');
        }
        return out;
      };
      // v1.12.0 W7: the steps follow Home: 11 with nothing done yet, 12 with Carry on; every step highlights its part
      const t0 = Date.now();
      const done = { 'sp.history.p1': JSON.stringify([{ date: t0, subject: 'maths', year: 5, topic: 'frac', diff: 1, n: 5, correct: 5, stars: 3, byTopic: { frac: [5, 5] }, wrong: [] }]),
        'sp.badges.p1': JSON.stringify([{ date: t0, kind: 'perfect', subject: 'maths', year: 5, diff: 1, n: 5 }]) };
      for (const [name, seed, total] of [['nothing done', {}, 11], ['a set and a badge', done, 12]]) {
        const { context, page, errors } = await freshPage(browser, site, Object.assign({ [SETTINGS]: settings({ subject: 'sel' }) }, seed));
        const steps = await walk(page);
        check(`R1.1 ${name}: ${total} steps`, steps.length === total && steps[0].step === `Step 1 of ${total}`, steps.length + ' / ' + (steps[0] || {}).step);
        check(`R1.1 ${name}: Carry on only when there is a set; no Badges step (Badges are in Progress)`, steps.some(x => x.title === 'Carry on') === (total === 12) && !steps.some(x => x.title === 'Badges'), steps.map(x => x.title).join(','));
        check(`R1.1 ${name}: no step about options or Start (they are in the sheet)`, !steps.some(x => /Set up|^Start$|^Subject$|^Print$/.test(x.title)), steps.map(x => x.title).join(','));
        check(`R1.1 ${name}: every step but the first highlights something`, steps.slice(1).every(x => x.hole > 0), steps.map(x => x.hole).join(','));
        if (total === 12) {
          await page.click('#langBtn');
          const zh = await walk(page);
          check('R1.1 Chinese steps', zh.some(x => x.title === '继续练习') && zh.some(x => x.title === '我的计划') && zh.some(x => x.title === '小学还是中学'), zh.map(x => x.title).join(','));
        }
        check(`R1.1 ${name}: no page errors`, errors.length === 0, errors.join(' | '));
        await context.close();
      }

      // R1.2: data from before student profiles (no sp.profiles) means an earlier user
      {
        const { context, page, errors } = await freshPage(browser, site, { 'sp.history': '[]', 'sp.settings': settings() }, null, { tour: true });
        await page.waitForTimeout(300);
        check('R1.2 user from before profiles: no tour', !(await page.evaluate(() => !!document.querySelector('#tourDlg'))));
        check('R1.2 user from before profiles: stored as seen', (await page.evaluate(() => localStorage.getItem('sp.tour'))) === '"done"');
        check('R1.2 no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }

      // R1.4: Tab and Shift+Tab move round the tour's own buttons only
      {
        const { context, page, errors } = await freshPage(browser, site, null, null, { tour: true });
        await page.waitForTimeout(300);
        await page.click('#tourNext');   // step 2: Skip, Back and Next are all shown; focus is on Next
        const seq = [];
        for (let k = 0; k < 4; k++) { await page.keyboard.press('Tab'); seq.push(await page.evaluate(() => document.activeElement.id || document.activeElement.tagName)); }
        check('R1.4 Tab goes Skip, Back, Next, Skip', seq.join(',') === 'tourSkip,tourBack,tourNext,tourSkip', seq.join(','));
        await page.keyboard.press('Shift+Tab');
        check('R1.4 Shift+Tab from Skip goes to Next', (await page.evaluate(() => document.activeElement.id)) === 'tourNext');
        check('R1.4 no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }

      // R1.3: tour.js missing (a partial deploy), and a browser without showModal: Home works, ? does nothing, no errors
      {
        const { context, page, errors } = await freshPage(browser, site, null, null, {
          tour: true, route: r => (r.request().url().endsWith('/js/tour.js') ? r.fulfill({ status: 404, body: '' }) : r.continue()) });
        await page.waitForTimeout(300);
        await openTour(page);
        await page.click('.tab[data-go="home"]');
        check('R1.3 no tour.js: Home still works', await visible(page, '#cardPractice'));
        check('R1.3 no tour.js: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
      {
        const { context, page, errors } = await freshPage(browser, site, null, () => { delete HTMLDialogElement.prototype.showModal; }, { tour: true });
        await page.waitForTimeout(300);
        await openTour(page);
        check('R1.3 no showModal: no tour dialog left behind', (await page.locator('#tourDlg').count()) === 0);
        await page.click('.tab[data-go="home"]');
        check('R1.3 no showModal: Home still works', await visible(page, '#cardPractice'));
        await page.click('#cardPractice');
        check('R2.1 no showModal: the Practice card still opens its sheet', await page.locator('#setupDlg').evaluate(d => d.open));
        await page.click('#startBtn');
        check('R2.1 no showModal: Start still starts a set', await visible(page, '#screen-quiz'));
        check('R1.3 no showModal: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
    });

    // v1.8.0 R2 findings: the tour goes back to the screen it was opened from, so Results is not lost (R2.1); the keys
    // that are not a student's data are one list, kept by a Forgot-PIN erase and ignored by the first-visit rule (R2.2)
    await flow('v1.8.0 tour R2 fixes', async () => {
      const tourOpen = page => page.evaluate(() => { const d = document.querySelector('#tourDlg'); return !!d && d.open; });
      {
        // v1.12.0: the guide opens from Settings (the only place it is), shows Home, and goes back to Settings
        const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
        await openTour(page);
        check('R2.1 guide from Settings: the tour shows Home', (await tourOpen(page)) && (await visible(page, '#screen-home')));
        await page.keyboard.press('Escape');
        check('R2.1 Escape: back on Settings', (await visible(page, '#screen-parent')) && !(await visible(page, '#screen-home')));
        await page.click('#tourBtn');
        for (let k = 0; k < 12 && (await tourOpen(page)); k++) await page.click('#tourNext');
        check('R2.1 Done: back on Settings', await visible(page, '#screen-parent'));
        await page.click('#tourBtn');
        await page.click('#tourSkip');
        check('R2.1 Skip: back on Settings', await visible(page, '#screen-parent'));
        check('R2.1 Settings: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
      {
        // only the keys every first visit writes: still a first visit
        const { context, page, errors } = await freshPage(browser, site, { 'sp.lang': '"en"', 'sp.moved': '1' }, null, { tour: true });
        await page.waitForTimeout(300);
        check('R2.2 only sp.lang and sp.moved: tour opens', await tourOpen(page));
        check('R2.2 first visit: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
      {
        // a Forgot-PIN erase removes the student's data and keeps the same three keys, and another app's keys
        const { context, page, errors } = await freshPage(browser, site, {
          'sp.profiles': JSON.stringify({ list: [{ id: 'p1', name: 'Ann' }], active: 'p1' }), [SETTINGS]: settings(),
          'sp.pin': JSON.stringify({ salt: 'x', hash: 'y' }), 'sp.lang': '"en"', 'chords-x': '1'
        }, null, { tour: true });
        await page.waitForTimeout(300);
        await openParent(page);
        await Promise.all([page.waitForEvent('load'), page.click('#pinForgot')]);
        await page.waitForTimeout(300);
        const ls = await page.evaluate(() => Object.fromEntries(['sp.lang', 'sp.moved', 'sp.tour', 'sp.pin', 'sp.settings.p1', 'chords-x'].map(k => [k, localStorage.getItem(k)])));
        check('R2.2 erase keeps sp.lang, sp.moved, sp.tour', ls['sp.lang'] === '"en"' && ls['sp.moved'] === '1' && ls['sp.tour'] === '"done"', JSON.stringify(ls));
        check('R2.2 erase removes the PIN and settings', ls['sp.pin'] === null && ls['sp.settings.p1'] === null, JSON.stringify(ls));
        check('R2.2 erase leaves another app\'s key', ls['chords-x'] === '1');
        check('R2.2 erase: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
    });
    // v1.9.0: mini games — the Games tab, then a full one-minute round of times-table balloons on a fake clock
    await flow('v1.9.0 mini game', async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true });
      /* the round as the page shows it, so this flow also runs on Production (v1.10.0: it used window.__testGame, which
         Production does not have); the hook only adds what the page cannot show (wrong answers, timers) where it exists */
      const hook = await page.evaluate(() => typeof window.__testGame === 'function');
      const game = async () => {
        const d = await page.evaluate(() => ({ score: Number(document.querySelector('#gameScore').textContent),
          balloons: document.querySelectorAll('#gameField .bl:not(.hit)').length, locked: !document.querySelector('#gameWarn').hidden }));
        if (hook) Object.assign(d, await page.evaluate(() => { const s = window.__testGame() || {}; return { wrong: s.wrong, timers: s.timers }; }));
        return d;
      };
      const shown = sel => page.isVisible(sel);
      const run = ms => page.clock.runFor(ms);
      const questions = () => page.evaluate(() => [...document.querySelectorAll('#gameField .bl:not(.pop) .bl-q')].map(e => e.textContent));
      const answerOf = q => q.split(' × ').map(Number).reduce((a, b) => a * b);
      const press = async keys => { for (const k of keys) await page.click(`#gamePad [data-k="${k}"]`); };
      await run(500);
      // v1.12.0 W4: the tab is Relax (Terry: "relax (replace games)"), after Progress; v2.0.0: Friends sits between them
      check('game: a Relax tab is in the bottom bar, after Progress and Friends', await page.evaluate(() => {
        const tabs = [...document.querySelectorAll('.bottom-nav > button')].map(b => b.id || b.dataset.go);
        return tabs.indexOf('navGames') === tabs.indexOf('navFriends') + 1 && tabs.indexOf('navFriends') === tabs.indexOf('progress') + 1;
      }));
      check('game: the tab reads and is named "Relax"', (await page.textContent('#navGames')).trim() === 'Relax' && (await page.getAttribute('#navGames', 'aria-label')) === 'Relax');
      await page.click('#navGames');
      check('game: the tab opens the list of mini games', (await shown('#screen-games')) && /Times-table balloons/.test(await page.textContent('#gameList')));
      check('game: the Relax tab is marked as the current page', (await page.getAttribute('#navGames', 'aria-current')) === 'page');
      await page.click('#play-balloons');
      check('game: Play shows the start card', (await shown('#gameIntro')) && (await shown('#gameGo')));
      check('game: no bottom bar during the game', !(await shown('.bottom-nav')));
      await page.click('#gameGo');
      await run(1000);
      const first = await game();
      check('game: one balloon at a time at the start', first.balloons === 1, JSON.stringify(first));
      const q1 = (await questions())[0] || '';
      check('game: the balloon carries a question from 1 × 1 to 9 × 9', /^[1-9] × [1-9]$/.test(q1), q1);
      check('game: the balloon is inside the field', await page.evaluate(() => {
        const f = document.querySelector('#gameField').getBoundingClientRect(), b = document.querySelector('#gameField .bl').getBoundingClientRect();
        return b.left >= f.left && b.right <= f.right;
      }));
      // a balloon rises: a moment later it is higher
      const y = () => page.evaluate(() => document.querySelector('#gameField .bl').getBoundingClientRect().top);
      const y0 = await y(); await run(500); const y1 = await y();
      check('game: the balloon rises', y1 < y0, `${y0} -> ${y1}`);
      // right answer on the keypad: an arrow, a point
      await press(String(answerOf(q1)).split(''));
      check('game: typed digits show', (await page.textContent('#gameTyped')).trim() === String(answerOf(q1)));
      await press(['fire']);
      await run(50);
      check('game: firing shows an arrow', (await page.locator('#gameField .bl-arrow').count()) === 1);
      await run(800);
      let st = await game();
      check('game: the right answer scores a point', st.score === 1 && (await page.textContent('#gameScore')) === '1', JSON.stringify(st));
      check('game: the hit balloon is gone', (await page.locator('#gameField .bl').count()) === st.balloons, JSON.stringify(st));
      check('game: a hit is announced for screen readers', /Hit! Points: 1/.test(await page.textContent('#gameStatus')));
      // wrong answer: no point, a warning, the bow locked for a short time
      await press(['0', 'fire']);
      await run(50);
      st = await game();
      check('game: a wrong answer scores nothing and locks the bow', st.score === 1 && st.locked && (!hook || st.wrong === 1), JSON.stringify(st));
      check('game: the warning shows', await shown('#gameWarn'));
      check('game: the keys are disabled while locked', await page.evaluate(() => [...document.querySelectorAll('#gamePad button')].every(b => b.disabled)));
      await page.keyboard.type('5'); await page.keyboard.press('Enter');
      check('game: nothing can be typed or fired while locked', (!hook || (await game()).wrong === 1) && (await game()).score === 1 && (await page.textContent('#gameTyped')).trim() === '');
      await run(1600);
      st = await game();
      check('game: the lock ends after a moment', !st.locked && !(await shown('#gameWarn')) && !(await page.isDisabled('#gamePad [data-k="1"]')), JSON.stringify(st));
      // a physical keyboard works too
      const q2 = (await questions())[0];
      if (q2) { await page.keyboard.type(String(answerOf(q2))); await page.keyboard.press('Enter'); await run(800); }
      check('game: a keyboard answer and Enter score too', !q2 || (await game()).score === 2, q2);
      // later in the round: more balloons at once
      let most = 0;
      for (let s = 0; s < 45; s++) { await run(1000); most = Math.max(most, (await game()).balloons); }
      check('game: more balloons at once later on', most >= 3, 'most ' + most);
      check('game: the clock counts down', Number(await page.textContent('#gameTime')) <= 12, await page.textContent('#gameTime'));
      // the header (profile, language) is hidden, so nothing there can end the round; the keypad is on screen
      check('game: the header is hidden during a round', !(await shown('#langBtn')) && !(await shown('#profileBtn')));
      check('game: the whole keypad is on screen', await page.evaluate(() => document.querySelector('#gamePad').getBoundingClientRect().bottom <= innerHeight));
      await run(15000);
      check('game: after one minute the round ends', (await shown('#gameOver')) && (await page.locator('#gameField .bl').count()) === 0);
      const score = (await game()).score;
      check('game: the end card gives the score', (await page.textContent('#gameFinal')) === `Balloons popped: ${score}`, await page.textContent('#gameFinal'));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.games.p1') || '{}'));
      check('game: the best score is saved for this student', saved.balloons && saved.balloons.best === score && saved.balloons.plays === 1, JSON.stringify(saved));
      await page.click('#gameBack');
      check('game: the list shows the best score', (await page.textContent('#gameList')).includes(`Best: ${score}`), await page.textContent('#gameList'));
      // R1.4: the start card after a round shows a fresh clock and no points
      await page.click('#play-balloons');
      check('R1.4 game: the start card after a round reads 60 s and 0 points', (await page.textContent('#gameTime')) === '60' && (await page.textContent('#gameScore')) === '0',
        (await page.textContent('#gameTime')) + ' / ' + (await page.textContent('#gameScore')));
      // stopping a round with ✕ keeps no score, and leaves no timer behind even with an arrow in flight
      await page.click('#gameGo'); await run(2000);
      const q3 = (await questions())[0];
      if (q3) { await press(String(answerOf(q3)).split('')); await press(['fire']); await run(50); }
      await page.click('#gameQuit');
      const after = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.games.p1')));
      check('game: ✕ goes back to the list and keeps no score', (await shown('#screen-games')) && after.balloons.plays === 1, JSON.stringify(after));
      const left = await game();
      check('game: ✕ with an arrow in flight leaves no timers', !!q3 && (!hook || left.timers === 0), JSON.stringify(left) + ' q ' + q3);   // timers: test hosts only
      check('game: the bottom bar is back', await shown('.bottom-nav'));
      // Chinese
      await page.click('#langBtn');
      check('game: Chinese tab and title', (await page.textContent('#navGames')).trim() === '放松' && /乘法气球/.test(await page.textContent('#gameList')));
      check('game: fits a 375 px screen', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      check('game: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.9.0 R1.1 / R1.3: small phones (320×568, 375×667). The start and end cards fit inside the field, in both languages,
    // and no bottom-bar label is cut short.
    for (const [W, H] of [[320, 568], [375, 667]]) await flow(`v1.9.0 R1.1 small phone ${W}×${H}`, async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true, context: { viewport: { width: W, height: H } } });
      const run = ms => page.clock.runFor(ms);
      // every line of the card is inside the field and nothing needs scrolling
      const fits = sel => page.evaluate(s => {
        const f = document.querySelector('#gameField').getBoundingClientRect(), o = document.querySelector(s);
        const out = [...o.querySelectorAll('p, button')].filter(n => { const r = n.getBoundingClientRect(); return r.top < f.top - 0.5 || r.bottom > f.bottom + 0.5 || r.left < f.left - 0.5 || r.right > f.right + 0.5; });
        return { ok: out.length === 0 && o.scrollHeight <= o.clientHeight + 1, field: Math.round(f.height), content: o.scrollHeight, out: out.map(n => n.id || n.className || n.textContent) };
      }, sel);
      const tabsWhole = () => page.evaluate(() => [...document.querySelectorAll('.bottom-nav .tl')].filter(n => n.scrollWidth > n.clientWidth + 0.5).map(n => n.textContent));
      await run(500);
      for (const lang of ['en', 'zh']) {
        if (lang === 'zh') await page.click('#langBtn');
        const cut = await tabsWhole();
        check(`R1.3 ${W}×${H} ${lang}: every bottom-bar label is whole`, cut.length === 0, cut.join(', '));
        await page.click('#navGames'); await page.click('#play-balloons');
        let m = await fits('#gameIntro');
        check(`R1.1 ${W}×${H} ${lang}: the start card fits the field`, m.ok, JSON.stringify(m));
        await page.click('#gameGo');
        for (let s = 0; s < 62; s++) await run(1000);
        check(`R1.1 ${W}×${H} ${lang}: the round ends`, await page.isVisible('#gameOver'));
        m = await fits('#gameOver');
        check(`R1.1 ${W}×${H} ${lang}: the end card fits the field`, m.ok, JSON.stringify(m));
        await page.click('#gameBack');
      }
      check(`R1.1 ${W}×${H}: no sideways scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      check(`R1.1 ${W}×${H}: no page errors`, errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.10.0: the three puzzle games. Each flow reads the page (not window.__testGame), so it also runs on Production.
    const pzSize = page => page.evaluate(() => {
      const pad = document.querySelector('#pzBody .pz-pad'), hud = document.querySelector('.pz-hud').getBoundingClientRect();
      return { padIn: !pad || pad.getBoundingClientRect().bottom <= innerHeight + 0.5, hudIn: hud.top >= -0.5,
        noScroll: document.documentElement.scrollHeight <= innerHeight + 1, noSideways: document.documentElement.scrollWidth <= innerWidth };
    });
    await flow('v1.10.0 Sudoku', async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true });
      const run = ms => page.clock.runFor(ms);
      const shown = sel => page.isVisible(sel);
      const grid = () => page.evaluate(() => [...document.querySelectorAll('.sd-cell')].map(c => Number(c.textContent) || 0));
      await run(300);
      await page.click('#navGames');
      const titles = await page.evaluate(() => [...document.querySelectorAll('#gameList h3')].map(h => h.textContent));
      check('sudoku: five games are listed', JSON.stringify(titles) === JSON.stringify(['Times-table balloons', 'Maths Sudoku', 'Money Master', 'Broken Calculator', 'Use all the numbers']), JSON.stringify(titles));
      await page.click('#play-sudoku');
      const levels = await page.evaluate(() => [...document.querySelectorAll('#pzLevels button')].map(b => b.id));
      check('sudoku: the start card offers easy, medium and hard', JSON.stringify(levels) === '["pzGo-easy","pzGo-medium","pzGo-hard"]', JSON.stringify(levels));
      check('sudoku: no bottom bar or header during the game', !(await shown('.bottom-nav')) && !(await shown('#profileBtn')));
      check('sudoku: the Relax tab stays current', (await page.getAttribute('#navGames', 'aria-current')) === 'page');
      await page.click('#pzGo-easy');
      let g = await grid();
      check('sudoku: easy is 4 × 4 with 8 squares to fill', g.length === 16 && g.filter(v => !v).length === 8 && (await page.textContent('#pzScore')) === '8', JSON.stringify(g));
      const answer = await page.evaluate(gr => SudokuRules.solve(gr, SudokuRules.LEVELS.easy), g);
      check('sudoku: the puzzle can be solved', Array.isArray(answer) && answer.length === 16);
      // a clash (R2.1): an empty square that shares a row, column or box with a given number, then that number.
      // Its row alone can be empty (about 1 easy puzzle in 27), so the peers are used, not just the row.
      const P = await page.evaluate(() => SudokuRules.peers(SudokuRules.LEVELS.easy));
      const i0 = g.findIndex((v, i) => !v && P[i].some(j => g[j])), clash = i0 >= 0 ? g[P[i0].find(j => g[j])] : 0;
      check('sudoku: an empty square has a given number next to it', i0 >= 0 && clash > 0, JSON.stringify(g));
      if (i0 < 0) throw new Error('sudoku: no clash square in ' + JSON.stringify(g));   // R3.1: stop here, not 20 s later
      await page.locator('.sd-cell').nth(i0).click();
      check('sudoku: tapping a square selects it', await page.locator('.sd-cell').nth(i0).evaluate(c => c.classList.contains('sel')));
      await page.click(`#pzBody .pz-pad [data-k="${clash}"]`);
      check('sudoku: a clash is marked red and announced', (await page.locator('.sd-cell.bad').count()) >= 2 && /already in this row/.test(await page.textContent('#pzStatus')));
      await page.click('#pzBody .pz-pad [data-k="back"]');
      check('sudoku: ⌫ clears the square', (await grid())[i0] === 0 && (await page.locator('.sd-cell.bad').count()) === 0);
      const given = g.findIndex(v => v);
      await page.locator('.sd-cell').nth(given).click(); await page.click(`#pzBody .pz-pad [data-k="${g[given] === 1 ? 2 : 1}"]`);
      check('sudoku: a given number cannot be changed', (await grid())[given] === g[given]);
      await run(5000);
      check('sudoku: the clock runs', (await page.textContent('#pzClock')) === '0:05', await page.textContent('#pzClock'));
      check('sudoku: board and keypad fit the screen', Object.values(await pzSize(page)).every(Boolean), JSON.stringify(await pzSize(page)));
      // fill every square: one by keyboard, the rest on the keypad
      const empty = g.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
      await page.locator('.sd-cell').nth(empty[0]).click(); await page.keyboard.press(String(answer[empty[0]]));
      for (const i of empty.slice(1)) { await page.locator('.sd-cell').nth(i).click(); await page.click(`#pzBody .pz-pad [data-k="${answer[i]}"]`); }
      check('sudoku: a full, correct grid ends the game', await shown('#pzOver'));
      const t1 = await page.textContent('#pzClock');
      check('sudoku: the end card gives the level and time', (await page.textContent('#pzFinal')) === 'Easy: ' + t1 && (await page.textContent('#pzBest')) === 'New best time!', await page.textContent('#pzFinal'));
      let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.games.p1') || '{}'));
      check('sudoku: the best time is saved per level for this student', saved.sudoku && saved.sudoku.easy && saved.sudoku.easy.best >= 5000 && saved.sudoku.easy.plays === 1 && !saved.sudoku.hard, JSON.stringify(saved));
      await run(3000);
      check('sudoku: the clock stops at the end', (await page.textContent('#pzClock')) === t1);
      await page.click('#pzBack');
      check('sudoku: the list shows the best time', (await page.textContent('#gameList')).includes('Best times: Easy ' + t1), await page.textContent('#gameList'));
      await page.click('#play-sudoku');
      check('sudoku: the start card shows the best time for easy only', (await page.textContent('#pzGo-easy')).includes('Best: ' + t1) && (await page.textContent('#pzGo-hard')).includes('No time yet'));
      await page.click('#pzGo-hard');
      g = await grid();
      check('sudoku: hard is 9 × 9 with 33 numbers given', g.length === 81 && g.filter(Boolean).length === 33);
      check('sudoku: hard fits the screen', Object.values(await pzSize(page)).every(Boolean), JSON.stringify(await pzSize(page)));
      await run(2000);
      await page.click('#pzQuit');
      saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.games.p1') || '{}'));
      check('sudoku: ✕ goes back to the list and keeps no time', (await shown('#screen-games')) && !saved.sudoku.hard && (await shown('.bottom-nav')), JSON.stringify(saved));
      await page.click('#langBtn');
      check('sudoku: Chinese title', /数独/.test(await page.textContent('#gameList')));
      check('sudoku: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    await flow('v1.10.0 Money Master', async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true });
      const run = ms => page.clock.runFor(ms);
      const shown = sel => page.isVisible(sel);
      const q = () => page.evaluate(() => {
        const items = [...document.querySelectorAll('.mm-item')].map(li => Number(li.dataset.cents)), note = document.querySelector('.mm-note');
        return { items, paid: Number(note.dataset.cents), colour: note.className, change: Number(note.dataset.cents) - items.reduce((s, c) => s + c, 0) };
      });
      const type = async cents => { for (const k of (cents / 100).toFixed(2)) await page.click(`#pzBody .pz-pad [data-k="${k}"]`); };
      await run(300);
      await page.click('#navGames'); await page.click('#play-money');
      check('money: the start card offers three levels', (await page.locator('#pzLevels button').count()) === 3);
      await page.click('#pzGo-medium');
      let a = await q();
      check('money: medium is one or two items, paid with $20 or $50', a.items.length >= 1 && a.items.length <= 2 && [2000, 5000].includes(a.paid) && a.change > 0, JSON.stringify(a));
      check('money: prices are in 5 cents and shown as $x.xx', a.items.every(c => c % 5 === 0) && (await page.locator('.mm-price').first().textContent()) === '$' + (a.items[0] / 100).toFixed(2));
      check('money: the note has its Australian colour', a.colour.includes(a.paid === 2000 ? 'mm-red' : 'mm-yellow'), a.colour);
      check('money: question 1 of 5', (await page.textContent('#pzScore')) === '1/5');
      await type(a.change + 5); await page.click('#pzBody .pz-pad [data-k="ok"]');
      check('money: a wrong answer says try again and stays on the question', /Not quite/.test(await page.textContent('.mm-msg')) && (await page.textContent('#pzScore')) === '1/5');
      check('money: the answer box is cleared for another try', (await page.textContent('.mm-typed')).trim() === '$');
      await run(4000);
      // right: typed on the keyboard, as dollars and cents
      await page.keyboard.type((a.change / 100).toFixed(2)); await page.keyboard.press('Enter');
      check('money: a right answer shows the notes and coins', /^Right! \$[\d.]+ = /.test(await page.textContent('.mm-msg')), await page.textContent('.mm-msg'));
      await run(1500);
      check('money: then the next question', (await page.textContent('#pzScore')) === '2/5');
      for (let k = 2; k <= 5; k++) { a = await q(); await type(a.change); await page.click('#pzBody .pz-pad [data-k="ok"]'); await run(1500); }
      check('money: five right answers end the round', await shown('#pzOver'));
      const t1 = await page.textContent('#pzClock');
      check('money: the end card gives the level and time', (await page.textContent('#pzFinal')) === 'Medium: ' + t1, await page.textContent('#pzFinal'));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.games.p1') || '{}'));
      check('money: the best time is saved for medium', saved.money && saved.money.medium && saved.money.medium.best >= 4000 && !saved.money.easy, JSON.stringify(saved));
      await page.click('#pzAgain');
      check('money: play again starts the same level', (await page.locator('.mm-item').count()) >= 1 && (await page.textContent('#pzScore')) === '1/5' && (await page.textContent('#pzClock')) === '0:00');
      check('money: fits the screen', Object.values(await pzSize(page)).every(Boolean), JSON.stringify(await pzSize(page)));
      await page.click('#pzQuit');
      check('money: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    await flow('v1.10.0 Broken Calculator', async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true });
      const run = ms => page.clock.runFor(ms);
      const shown = sel => page.isVisible(sel);
      const answer = () => page.evaluate(() => { const m = document.querySelector('.bc-lcd').dataset.masked; return { masked: m, ways: BrokenRules.solve(m) }; });
      const press = async keys => { for (const k of keys) await page.click(`#pzBody .pz-pad [data-k="${k}"]`); };
      await run(300);
      await page.click('#navGames'); await page.click('#play-broken');
      check('broken: one Start button (no levels) and a 3:00 clock', (await page.locator('#pzLevels button').count()) === 1 && (await page.textContent('#pzClock')) === '3:00');
      await page.click('#pzGo');
      let a = await answer();
      check('broken: the screen shows a sum with broken digits', /\?/.test(a.masked) && (await page.locator('.bc-hole').count()) === a.masked.split('?').length - 1, a.masked);
      check('broken: the broken digits have exactly one answer', a.ways.length === 1, JSON.stringify(a));
      // R1.2: = before every broken digit is typed says how many are still to type (it used to do nothing)
      await press(['ok']);
      const holes = a.ways[0].length;
      check('R1.2: = with no digits typed says how many are still to type', (await page.textContent('.bc-msg')) === 'Digits still to type: ' + holes &&
        (await page.textContent('#pzStatus')) === 'Digits still to type: ' + holes && (await page.locator('.bc-msg.warn').count()) === 1, await page.textContent('.bc-msg'));
      check('R1.2: and keeps the same sum and score', (await answer()).masked === a.masked && (await page.textContent('#pzScore')) === '0');
      if (holes > 1) {
        await press([a.ways[0][0], 'ok']);
        check('R1.2: with one digit typed it counts one fewer', (await page.textContent('.bc-msg')) === 'Digits still to type: ' + (holes - 1), await page.textContent('.bc-msg'));
        await press(['back']);
      }
      await press(['back']);
      check('R1.2: typing again brings back the normal message', (await page.textContent('.bc-msg')) === 'Missing digits to find: ' + holes && (await page.locator('.bc-msg.warn').count()) === 0, await page.textContent('.bc-msg'));
      await press(a.ways[0].split(''));
      check('broken: typed digits fill the broken places', (await page.locator('.bc-hole.filled').count()) === a.ways[0].length);
      await press(['ok']);
      check('broken: a right answer scores a point', (await page.textContent('#pzScore')) === '1');
      await run(600);
      a = await answer();
      const wrongDigits = a.ways[0].split('').map(d => String((Number(d) + 1) % 10));
      await page.keyboard.type(wrongDigits.join('')); await page.keyboard.press('Enter');
      check('broken: a wrong answer scores nothing and shows the right sum', (await page.textContent('#pzScore')) === '1' && (await page.locator('.bc-lcd.no').count()) === 1);
      await run(1600);
      check('broken: then a new sum', (await page.locator('.bc-lcd.no').count()) === 0);
      check('broken: the clock counts down', (await page.textContent('#pzClock')) < '3:00', await page.textContent('#pzClock'));
      check('broken: fits the screen', Object.values(await pzSize(page)).every(Boolean), JSON.stringify(await pzSize(page)));
      let score = 1;
      for (let k = 0; k < 8; k++) { a = await answer(); await press(a.ways[0].split('').concat('ok')); score++; await run(600); }
      check('broken: each right answer adds a point', score === Number(await page.textContent('#pzScore')), score + ' / ' + await page.textContent('#pzScore'));
      for (let s = 0; s < 18; s++) await run(10000);
      check('broken: after three minutes the round ends', await shown('#pzOver'));
      check('broken: the end card gives the number right', (await page.textContent('#pzFinal')) === 'Correct answers: ' + score, await page.textContent('#pzFinal'));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.games.p1') || '{}'));
      check('broken: the best score is saved', saved.broken && saved.broken.best === score && saved.broken.plays === 1, JSON.stringify(saved));
      await page.click('#pzBack');
      check('broken: the list shows the best score', (await page.locator('.game-card').nth(3).textContent()).includes('Best: ' + score));
      check('broken: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.10.0: every puzzle game fits small, short and sideways phones; R2.1 / R2.2 (v1.9.0) are checked here too
    for (const [W, H] of [[320, 568], [360, 640], [568, 320]]) await flow(`v1.10.0 games fit ${W}×${H}`, async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true, context: { viewport: { width: W, height: H } } });
      const run = ms => page.clock.runFor(ms);
      await run(300);
      if (W === 360) {
        const cut = await page.evaluate(() => [...document.querySelectorAll('.bottom-nav .tl')].filter(n => n.scrollWidth > n.clientWidth + 0.5).map(n => n.textContent));
        check('R2.1 360×640: every bottom-bar label is whole', cut.length === 0, cut.join(', '));
      }
      for (const [id, lv] of [['sudoku', 'hard'], ['sudoku', 'medium'], ['money', 'hard'], ['broken', ''], ['numbers', '']]) {
        await page.click('#navGames'); await page.click('#play-' + id); await page.click('#pzGo' + (lv ? '-' + lv : ''));
        await run(500);
        const m = await pzSize(page);
        check(`games ${W}×${H}: ${id} ${lv} fits`, Object.values(m).every(Boolean), JSON.stringify(m));
        // R1.4: the title breaks between words only; R1.5: each number in the top bar has a visible word
        const hud = await page.evaluate(() => {
          const h = document.querySelector('#pzH'), node = h.firstChild, split = [];
          let at = 0;
          for (const word of h.textContent.split(' ')) {
            const r = document.createRange(); r.setStart(node, at); r.setEnd(node, at + word.length);
            if (new Set([...r.getClientRects()].map(x => Math.round(x.top))).size > 1) split.push(word);
            at += word.length + 1;
          }
          const words = [...document.querySelectorAll('.pz-hud .pz-stat-l')].map(s => { const b = s.getBoundingClientRect(); return b.width > 0 && b.height >= 8 ? s.textContent : ''; });
          return { split, words, cut: h.scrollWidth > h.clientWidth + 0.5 };
        });
        check(`R1.4 ${W}×${H}: ${id} title breaks between words only`, !hud.split.length && !hud.cut, JSON.stringify(hud));
        const want = { sudoku: 'left', money: 'question', broken: 'points', numbers: 'round' }[id];
        check(`R1.5 ${W}×${H}: ${id} top bar reads "time" and "${want}"`, JSON.stringify(hud.words) === JSON.stringify(['time', want]), JSON.stringify(hud.words));
        if (id === 'sudoku' && lv === 'hard' && W > H) {
          const cell = await page.evaluate(() => document.querySelector('.sd-cell').getBoundingClientRect().width);
          check(`R1.3 ${W}×${H}: a 9 × 9 square is at least 30 px sideways (was 25)`, cell >= 30, String(cell));
        }
        await page.click('#pzQuit');
      }
      // R1.1: a solved hard Sudoku and its end card fit together, with no page scroll and the top bar still on screen
      await page.click('#navGames'); await page.click('#play-sudoku'); await page.click('#pzGo-hard');
      const g = await page.evaluate(() => [...document.querySelectorAll('.sd-cell')].map(c => Number(c.textContent) || 0));
      const ans = await page.evaluate(gr => SudokuRules.solve(gr, SudokuRules.LEVELS.hard), g);
      for (let i = 0; i < g.length; i++) if (!g[i]) { await page.locator('.sd-cell').nth(i).click(); await page.keyboard.press(String(ans[i])); }
      const end = await page.evaluate(() => {
        const d = document.documentElement, o = document.querySelector('#pzOver').getBoundingClientRect(), hud = document.querySelector('.pz-hud').getBoundingClientRect();
        return { over: !document.querySelector('#pzOver').hidden, scroll: d.scrollHeight - innerHeight, y: scrollY, cardIn: o.bottom <= innerHeight + 0.5, hudIn: hud.top >= -0.5,
          grid: document.querySelectorAll('.sd-cell').length, pad: !!document.querySelector('#pzBody .pz-pad') && document.querySelector('#pzBody .pz-pad').getBoundingClientRect().height > 0 };
      });
      check(`R1.1 ${W}×${H}: solved hard grid and end card fit with no page scroll`, end.over && end.scroll <= 1 && end.y === 0 && end.cardIn && end.hudIn && end.grid === 81 && !end.pad, JSON.stringify(end));
      await page.click('#pzAgain');
      check(`R1.1 ${W}×${H}: play again brings the keypad back`, await page.evaluate(() => document.querySelector('#pzBody .pz-pad').getBoundingClientRect().height > 0 && !document.querySelector('#screen-puzzle').classList.contains('pz-ended')));
      await page.click('#pzQuit');
      if (H <= 520) {
        await page.click('#navGames'); await page.click('#play-balloons'); await page.click('#gameGo'); await run(3000);
        const b = await page.evaluate(() => { const f = document.querySelector('#gameField').getBoundingClientRect(), p = document.querySelector('#gamePad').getBoundingClientRect(); return { field: Math.round(f.height), pad: p.bottom <= innerHeight + 0.5 }; });
        check(`R2.2 ${W}×${H}: balloon field and keypad both on screen`, b.field >= 120 && b.pad, JSON.stringify(b));
        await page.click('#gameQuit');
      }
      check(`games ${W}×${H}: no page errors`, errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.10.0 R4: Use all the numbers. Round 1 is solved from the cards on the page (so it runs on Production too);
    // round 2 needs the test hook for its answer and is skipped without it.
    await flow('v1.10.0 R4 Use all the numbers', async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true });
      const run = ms => page.clock.runFor(ms);
      const tray = () => page.evaluate(() => [...document.querySelectorAll('.un-tray .un-card')].map(b => b.dataset.c));
      const rows = () => page.evaluate(() => [...document.querySelectorAll('.un-row')].map(r => [...r.querySelectorAll('.un-card')].map(b => b.dataset.c).join('')));
      await run(300);
      await page.click('#navGames');
      check('numbers: listed fifth', (await page.locator('#gameList h3').nth(4).textContent()) === 'Use all the numbers');
      await page.click('#play-numbers');
      check('numbers: one Start button that says no round passed yet', (await page.locator('#pzLevels button').count()) === 1 && /No round passed yet/.test(await page.textContent('#pzGo')), await page.textContent('#pzGo'));
      await page.click('#pzGo');
      const cards = await tray();
      check('numbers: round 1 is one row with the cards of one equation', (await page.locator('.un-row').count()) === 1 && cards.filter(c => c === '=').length === 1 && (await page.textContent('#pzScore')) === '1', JSON.stringify(cards));
      check('numbers: the count of cards left is shown', (await page.textContent('.un-left')) === 'Cards left: ' + cards.length);
      // find a true order of round 1's cards in the page, with the app's own rules
      const order = await page.evaluate(cs => {
        const out = [], used = cs.map(() => false), cur = [];
        const go = () => {
          if (out.length) return;
          if (cur.length === cs.length) { if (NumbersRules.check(cur).ok) out.push(cur.slice()); return; }
          const seen = new Set();
          cs.forEach((c, i) => { if (used[i] || seen.has(c)) return; seen.add(c); used[i] = true; cur.push(c); go(); cur.pop(); used[i] = false; });
        };
        go();
        return out[0] || null;
      }, cards);
      check('numbers: round 1 can be solved', !!order, JSON.stringify(cards));
      if (!order) throw new Error('numbers: no order found for ' + JSON.stringify(cards));
      await page.locator('.un-tray .un-card').first().click();
      check('numbers: a tapped card moves into the row', (await rows())[0].length === 1 && (await tray()).length === cards.length - 1);
      await page.locator('.un-row .un-card').first().click();
      check('numbers: a tapped card in the row goes back', (await rows())[0] === '' && (await tray()).length === cards.length);
      for (const c of order) await page.locator(`.un-tray .un-card[data-c="${c}"]`).first().click();
      check('numbers: every card placed; the tray says so', (await tray()).length === 0 && (await page.textContent('.un-left')) === 'Cards left: 0' && (await rows())[0] === order.join(''));
      check('numbers: round 1 fits the screen', Object.values(await pzSize(page)).every(Boolean), JSON.stringify(await pzSize(page)));
      await page.click('.un-acts [data-k="ok"]');
      check('numbers: a true round passes', (await page.locator('.un-row.ok').count()) === 1 && /Round 1 passed/.test(await page.textContent('.un-msg')), await page.textContent('.un-msg'));
      await run(1300);
      check('numbers: round 2 has two rows and more cards', (await page.locator('.un-row').count()) === 2 && (await page.textContent('#pzScore')) === '2' && (await tray()).filter(c => c === '=').length === 2);
      let passed = 1;
      const st = await page.evaluate(() => (window.__testGame ? window.__testGame() : null));
      if (st && st.solution) {
        // keyboard: digits and signs move cards, the down arrow picks the next row, Backspace sends one back, Enter checks
        const keys = s => s.replace(/×/g, '*').replace(/÷/g, '/');
        await page.keyboard.type(keys(st.solution[0]));
        await page.keyboard.press('Backspace');
        check('numbers: Backspace sends the last card of the row back', (await rows())[0] === st.solution[0].slice(0, -1), JSON.stringify(await rows()));
        await page.keyboard.type(keys(st.solution[0].slice(-1)));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.type(keys(st.solution[1]));
        check('numbers: typed cards fill both rows', JSON.stringify(await rows()) === JSON.stringify(st.solution), JSON.stringify(await rows()));
        await page.keyboard.press('Enter');
        check('numbers: round 2 passes', /Round 2 passed/.test(await page.textContent('.un-msg')), await page.textContent('.un-msg'));
        await run(1300);
        passed = 2;
      } else console.log('  (flows: numbers round 2 skipped: no test hook on a Production host)');
      // Check with cards left over: the round fails and the game ends
      const left = (await tray()).length;
      await page.locator('.un-tray .un-card').first().click();
      await page.click('.un-acts [data-k="ok"]');
      const msg = await page.textContent('.un-msg');
      check('numbers: cards left over fail the round and end the game', (await page.isVisible('#pzOver')) && (await page.textContent('#pzDone')) === 'Game over' &&
        msg.startsWith('Not every card was used (' + (left - 1) + ' left). One way: '), msg);
      check('numbers: the end card gives the rounds passed', (await page.textContent('#pzFinal')) === 'Rounds passed: ' + passed && (await page.textContent('#pzBest')) === 'New best score!', await page.textContent('#pzFinal'));
      check('numbers: the rows stay; the tray goes', (await page.locator('.un-row').count()) === passed + 1 && !(await page.isVisible('.un-tray')));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.games.p1') || '{}'));
      check('numbers: the best round is saved', saved.numbers && saved.numbers.best === passed && saved.numbers.plays === 1, JSON.stringify(saved));
      await page.click('#pzBack');
      check('numbers: the list shows the best round', (await page.locator('.game-card').nth(4).textContent()).includes('Best: round ' + passed));
      await page.click('#play-numbers');
      check('numbers: the start button shows the best round', (await page.textContent('#pzGo')).includes('Best: round ' + passed), await page.textContent('#pzGo'));
      check('numbers: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // v1.10.0 R4: answer everything, then See results once. Unchecked answers are marked as first tries; a reminder names
    // questions with nothing chosen or typed, and Cancel goes back to the first one. One wrong Check costs the First try badge.
    await flow('v1.10.0 R4 submit all in one go', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 4, diff: 1, view: 'single' }) });
      await startSet(page);
      const answers = await page.evaluate(() => (window.__testAnswers ? window.__testAnswers() : null));
      if (!answers) { console.log('  (flows: submit-all flow skipped: no test hook on a Production host)'); await context.close(); return; }
      const wrongOf = x => { const s = String(x), w = s.replace(/\d+/, m => String(+m + 1)); return w === s ? s + '1' : w; };
      const fill = async (i, a, wrong) => {
        await page.locator('#palette .pal').nth(i).click();
        if (a.type === 'mc') await page.locator('#qc' + i + ' .choice').nth(wrong ? (a.correct + 1) % 2 : a.correct).click();
        // R4.3: a wrong answer the app can still read (58° → 59°, 44 cm → 45 cm), not an unreadable one such as 58°9
        else await page.fill('#ans' + i, wrong ? wrongOf(a.answer) : String(a.answer));
      };
      for (let i = 0; i < answers.length - 1; i++) await fill(i, answers[i]);
      check('R4: chosen or typed answers count as answered, unchecked', (await page.textContent('#answeredCount')) === '4 of 5 answered', await page.textContent('#answeredCount'));
      check('R4: no answer was checked yet', (await page.locator('.feedback.ok, .feedback.bad').count()) === 0);
      page.removeAllListeners('dialog');
      let asked = '';
      page.once('dialog', d => { asked = d.message(); d.dismiss(); });
      await page.click('#finishBtn');
      check('R4: See results reminds about the one unanswered question', /You still have 1 unanswered question/.test(asked), asked);
      check('R4: Cancel stays on the quiz, on the unanswered question', (await page.isVisible('#screen-quiz')) && /5/.test(await page.textContent('#qProgress')) && (await page.locator('#qc4').count()) === 1, await page.textContent('#qProgress'));
      await fill(4, answers[4]);
      asked = '';
      page.on('dialog', d => { asked = d.message(); d.accept(); });
      await page.click('#finishBtn');
      check('R4: with every question answered there is no reminder', asked === '', asked);
      check('R4: every unchecked answer is marked right', (await page.locator('#resList > li.ok').count()) === 5, await page.textContent('#resScore'));
      const text = await page.textContent('#resBadgeText');
      check('R4: unchecked answers count as first tries (Perfect and First try)', /Perfect/.test(text) && /First try/.test(text), text);
      // one wrong Check, then the right answer marked at See results: Perfect, but no First try
      await page.click('#againBtn');
      const again = await page.evaluate(() => window.__testAnswers());
      const k = again.findIndex(a => a.type !== 'mc');
      if (k >= 0) {
        for (let i = 0; i < again.length; i++) await fill(i, again[i], i === k);
        await page.locator('#palette .pal').nth(k).click();
        await page.click('#qc' + k + ' button[type="submit"]');
        check('R4: a wrong Check offers a second try', (await page.textContent('#qc' + k + ' .feedback')) === 'Not quite. Have another go.' && !(await page.locator('#ans' + k).isDisabled()), await page.textContent('#qc' + k + ' .feedback'));
        await page.fill('#ans' + k, String(again[k].answer));
        await page.click('#finishBtn');
        const text2 = (await page.isVisible('#resBadge')) ? await page.textContent('#resBadgeText') : '';
        check('R4: after one wrong Check the set is still Perfect but not First try', (await page.locator('#resList > li.ok').count()) === 5 && /Perfect/.test(text2) && !/First try/.test(text2), text2);
        // R4.4: a wrong Check left unchanged, then See results: the answer is shown once, not "777 → 777"
        await page.click('#againBtn');
        const third = await page.evaluate(() => window.__testAnswers());
        const j = third.findIndex(a => a.type !== 'mc');
        if (j >= 0) {
          for (let i = 0; i < third.length; i++) await fill(i, third[i], i === j);
          await page.locator('#palette .pal').nth(j).click();
          await page.click('#qc' + j + ' button[type="submit"]');
          await page.click('#finishBtn');
          const yours = await page.locator('#resList > li').nth(j).locator('.rv-yours').textContent();
          check('R4.4: an unchanged wrong answer is shown once in the review', !yours.includes('→') && yours.includes(wrongOf(third[j].answer)), yours);
        }
      } else console.log('  (flows: wrong-Check part skipped: the set had no typed-answer question)');
      check('R4 submit all: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // v1.10.0 R4: each badge kind tells how to earn it, on hover, keyboard focus or a tap
    await flow('v1.10.0 R4 badge tips', async () => {
      const { context, page, errors } = await freshPage(browser, site, {
        [SETTINGS]: settings({ year: 4 }),
        'sp.badges.p1': JSON.stringify([{ date: Date.now(), kind: 'firstTry', subject: 'maths', year: 4, diff: 2, n: 5 }])
      });
      await page.click('[data-go="progress"]');
      const heads = page.locator('.badge-grid th.kind .info-btn');
      check('R4: the three kind icons are buttons', (await heads.count()) === 3 && (await heads.allTextContents()).join('') === '🏅🎯⚡', (await heads.allTextContents()).join(''));
      await heads.nth(1).hover();
      const tip = page.locator('.badge-grid th.kind').nth(1).locator('.tip');
      check('R4: hovering 🎯 shows how to earn First try', (await tip.isVisible()) && /First try: get every question right/.test(await tip.textContent()) && /press Check and an answer is wrong/.test(await tip.textContent()), await tip.textContent());
      await page.mouse.move(1, 1);
      await heads.nth(2).click();
      const tip2 = page.locator('.badge-grid th.kind').nth(2).locator('.tip');
      check('R4: tapping ⚡ shows the Speed rule with the seconds', (await tip2.isVisible()) && /20 \/ 30 \/ 60 \/ 90 seconds/.test(await tip2.textContent()), await tip2.textContent());
      check('R4: the tip stays inside the screen', await tip2.evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
      check('R4: each badge square also has the rule as its hover text', /Perfect: get every question/.test(await page.locator('.badge-grid td').first().getAttribute('title')));
      check('R4 badge tips: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // v1.10.0 R4: a reviewed question can be removed from the review list, with Undo; it stays removed after a reload
    await flow('v1.10.0 R4 remove from review', async () => {
      const w = (en, a) => ({ topic: 'add', type: 'num', q: { en }, answer: a, given: ['0'], subject: 'maths', year: 4, diff: 2 });
      const { context, page, errors } = await freshPage(browser, site, {
        [SETTINGS]: settings({ year: 4 }),
        'sp.history.p1': JSON.stringify([{ date: 1700000000000, subject: 'maths', year: 4, topic: 'mixed', diff: 2, n: 5, correct: 3, byTopic: { add: [3, 5] }, wrong: [w('What is 2 + 2?', '4'), w('What is 3 + 3?', '6')], stars: 1 }])
      });
      await page.click('[data-go="progress"]');
      const items = () => page.locator('#progBody ol.review > li').count();
      check('R4: two questions to review, each with Done – remove', (await items()) === 2 && (await page.locator('#progBody .rv-remove').count()) === 2);
      await page.locator('#progBody .rv-remove').first().click();
      check('R4: Remove takes it off the list', (await items()) === 1 && /Removed from the review list/.test(await page.textContent('#toast')));
      const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p1'))[0].wrong.map(x => x.reviewed === true));
      check('R4: the question is kept in the history, marked reviewed', JSON.stringify(await stored()) === '[false,true]', JSON.stringify(await stored()));
      await page.click('#toast button');
      check('R4: Undo puts it back', (await items()) === 2 && JSON.stringify(await stored()) === '[false,false]', JSON.stringify(await stored()));
      await page.locator('#progBody .rv-remove').first().click();
      await page.reload(); await page.click('[data-go="progress"]');
      check('R4: still removed after a reload', (await items()) === 1);
      await page.locator('#progBody .rv-remove').first().click();
      check('R4: with every question removed the list says so', (await items()) === 0 && /Nothing to review/.test(await page.textContent('#progBody')));
      check('R4 remove from review: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.10.0 R5: answers to the R4 findings
    // R4.1: hidden tips no longer widen Progress, so it cannot pan sideways (before or after a tip is opened)
    // R5.1: also in phone mode (isMobile + hasTouch), where an open tip that sticks out widens the layout viewport, so the
    // screen is measured as visualViewport.width (what the phone shows), not innerWidth (which grows with the tip)
    for (const [W, H, phone] of [[320, 568, false], [375, 812, false], [320, 568, true], [375, 812, true]]) await flow(`R4.1 Progress does not pan sideways ${W}×${H}${phone ? ' phone' : ''}`, async () => {
      const { context, page, errors } = await freshPage(browser, site, {
        [SETTINGS]: settings({ year: 4 }),
        'sp.badges.p1': JSON.stringify([{ date: Date.now(), kind: 'perfect', subject: 'maths', year: 4, diff: 2, n: 5 }])
      }, null, { context: { viewport: { width: W, height: H }, ...(phone ? { isMobile: true, hasTouch: true } : {}) } });
      const tag = `${W}×${H}${phone ? ' phone' : ''}`;
      await page.click('[data-go="progress"]');
      const screenW = () => page.evaluate(() => (window.visualViewport ? visualViewport.width : innerWidth));
      const wide = () => page.evaluate(() => document.documentElement.scrollWidth - Math.min(innerWidth, window.visualViewport ? visualViewport.width : innerWidth));
      const inside = loc => loc.evaluate(e => { const r = e.getBoundingClientRect(), vw = window.visualViewport ? visualViewport.width : innerWidth; return { l: Math.round(r.left), r: Math.round(r.right), vw: Math.round(vw), ok: r.width > 0 && r.left >= 0 && r.right <= vw + 0.5 }; });
      check(`R4.1 ${tag}: the screen is ${W} px wide`, Math.round(await screenW()) === W, String(await screenW()));
      check(`R4.1 ${tag}: Progress is no wider than the screen`, (await wide()) <= 0, String(await wide()));
      for (let k = 0; k < 3; k++) {
        await page.locator('.badge-grid th.kind .info-btn').nth(k).click();
        const tip = page.locator('.badge-grid th.kind').nth(k).locator('.tip');
        const box = await inside(tip);
        check(`R4.1 ${tag}: tip ${k + 1} opens inside the screen`, (await tip.isVisible()) && box.ok, JSON.stringify(box));
        check(`R4.1 ${tag}: still no sideways pan with tip ${k + 1} open`, (await wide()) <= 0, String(await wide()));
      }
      if (phone) await page.locator('.badge-head .info-btn').click(); else await page.locator('.badge-head .info-btn').hover();
      const sec = await inside(page.locator('.badge-head .tip'));
      check(`R4.1 ${tag}: the badge-section tip opens inside the screen`, sec.ok, JSON.stringify(sec));
      check(`R4.1 ${tag}: no sideways pan with the badge-section tip open`, (await wide()) <= 0, String(await wide()));
      if (!phone) await page.mouse.move(1, 1);
      await page.click('#progH');
      check(`R4.1 ${tag}: no sideways pan after the tips close`, (await wide()) <= 0, String(await wide()));
      if (phone) {
        // the v1.7 answer hint in a practice set: the same tip, on a phone
        await page.click('[data-go="home"]'); await startSet(page);
        await page.locator('#qList .info-btn').first().click();
        const hint = await inside(page.locator('#qList .tip').first());
        check(`R5.1 ${tag}: the answer hint opens inside the screen`, hint.ok, JSON.stringify(hint));
        check(`R5.1 ${tag}: no sideways pan with the answer hint open`, (await wide()) <= 0, String(await wide()));
      }
      check(`R4.1 ${tag}: no page errors`, errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // R6.1: on a phone a long formula wraps inside its card instead of being cut off at the card edge, and the page does not
    // pan sideways. A planted long formula makes the check certain; real sets (Year 10, Advanced) cover what comes up.
    // R7.1: a planted 40-digit number is not split across lines; it scrolls inside its box, which stays inside the card.
    for (const W of [320, 375]) await flow(`R6.1 long formulas are readable on a phone ${W} px`, async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 10, diff: 3, count: 20 }) }, null,
        { context: { viewport: { width: W, height: 640 }, isMobile: true, hasTouch: true } });
      const wide = () => page.evaluate(() => document.documentElement.scrollWidth - Math.min(innerWidth, window.visualViewport ? visualViewport.width : innerWidth));
      // R8.1 (v1.10.0 R9): a formula passes if it fits, or if scrolling its box brings both its first and its last
      // character into view (overflow-x: hidden or clip would leave scrollLeft at 0 and fail)
      const reach = () => page.evaluate(() => {
        window.__reach = f => {
          const r = f.getBoundingClientRect(), l = r.left + f.clientLeft, rt = l + f.clientWidth;
          const texts = []; const w = document.createTreeWalker(f, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (w.currentNode.textContent.trim()) texts.push(w.currentNode);
          const charRect = (node, i) => { const rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1); return rg.getBoundingClientRect(); };
          const first = texts[0], last = texts[texts.length - 1], li = last.textContent.trimEnd().length - 1, fi = first.textContent.length - first.textContent.trimStart().length;
          const over = f.scrollWidth - f.clientWidth;
          f.scrollLeft = 0; const a = charRect(first, fi); const firstIn = a.left >= l - 1 && a.right <= rt + 1;
          f.scrollLeft = 1e9; const reach = over <= 1 || f.scrollLeft >= over - 1; const b = charRect(last, li); const lastIn = b.left >= l - 1 && b.right <= rt + 1;
          f.scrollLeft = 0;
          // R9.4: script can scroll an overflow-x: hidden box, a finger cannot; so the box must also be auto or scroll
          const ox = getComputedStyle(f).overflowX, swipe = ox === 'auto' || ox === 'scroll';
          return { over, reach, firstIn, lastIn, ox, swipe, ok: over <= 1 || (swipe && reach && firstIn && lastIn) };
        };
        return [...document.querySelectorAll('#qList .formula')].map(window.__reach).filter(x => !x.ok).length;
      });
      await startSet(page);
      for (let pg = 0; pg < 4; pg++) {
        const cut = await reach();
        check(`R6.1 ${W}: page ${pg + 1}: no formula is cut off (it fits, or its box scrolls to both ends)`, cut === 0, String(cut));
        check(`R6.1 ${W}: page ${pg + 1}: no sideways pan`, (await wide()) <= 0, String(await wide()));
        if (await page.locator('#nextPage').isEnabled()) await page.click('#nextPage'); else break;
      }
      const planted = await page.evaluate(() => {
        const f = document.createElement('div'); f.className = 'formula';
        f.textContent = '3x² + 12x − 7 = 5(x + 4)(x − 2) − 18x + 36 − 4x² + 9';
        document.querySelector('#qList .qcard').appendChild(f);
        const card = f.closest('.qcard').getBoundingClientRect(), r = f.getBoundingClientRect();
        return { cut: f.scrollWidth - f.clientWidth, lines: Math.round(f.clientHeight / parseFloat(getComputedStyle(f).lineHeight || 20)), inCard: r.right <= card.right + 0.5 };
      });
      check(`R6.1 ${W}: a planted long formula is not cut off`, planted.cut <= 1, JSON.stringify(planted));
      check(`R6.1 ${W}: the planted formula stays inside its card`, planted.inCard, JSON.stringify(planted));
      check(`R6.1 ${W}: no sideways pan with the planted formula`, (await wide()) <= 0, String(await wide()));
      const num = await page.evaluate(() => {
        const f = document.createElement('div'); f.className = 'formula'; f.textContent = '1234567890123456789012345678901234567890';
        document.querySelector('#qList .qcard').appendChild(f);
        const card = f.closest('.qcard').getBoundingClientRect(), r = f.getBoundingClientRect();
        const rg = document.createRange(); rg.selectNodeContents(f);
        return Object.assign({ lines: new Set([...rg.getClientRects()].map(x => Math.round(x.top))).size, scrolls: f.scrollWidth > f.clientWidth, inCard: r.left >= card.left - 0.5 && r.right <= card.right + 0.5 }, window.__reach(f));
      });
      check(`R7.1 ${W}: a planted 40-digit number stays on one line (not split into two numbers)`, num.lines === 1, JSON.stringify(num));
      check(`R7.1 ${W}: it scrolls inside its box, which stays inside the card`, num.scrolls && num.inCard, JSON.stringify(num));
      check(`R8.1 ${W}: scrolling the box brings the first and the last digit into view`, num.reach && num.firstIn && num.lastIn, JSON.stringify(num));
      check(`R9.4 ${W}: the box can be swiped (overflow-x auto or scroll, not hidden or clip)`, num.swipe, JSON.stringify(num));
      // R9.4: the same box set to hidden and to clip must fail the check
      const bad = await page.evaluate(() => ['hidden', 'clip'].map(v => { const f = [...document.querySelectorAll('#qList .formula')].find(e => e.scrollWidth > e.clientWidth + 1); const old = f.style.overflowX; f.style.overflowX = v; const r = window.__reach(f); f.style.overflowX = old; return r.ok; }));
      check(`R9.4 ${W}: the check fails when the box is set to hidden or clip`, bad.every(ok => ok === false), JSON.stringify(bad));
      check(`R7.1 ${W}: no sideways pan with the long number`, (await wide()) <= 0, String(await wide()));
      check(`R6.1 ${W}: no page errors`, errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // R4.2: in a long round the HUD, the chosen row, the cards, ⌫ and Check stay on screen, and the end card fits
    for (const [W, H] of [[320, 568], [568, 320]]) await flow(`R4.2 long rounds ${W}×${H}`, async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { clock: true, context: { viewport: { width: W, height: H } } });
      const run = ms => page.clock.runFor(ms);
      await run(300);
      await page.click('#navGames'); await page.click('#play-numbers'); await page.click('#pzGo');
      if (!(await page.evaluate(() => !!window.__testGame))) { console.log('  (flows: R4.2 long rounds skipped: no test hook on a Production host)'); await context.close(); return; }
      const keys = s => s.replace(/×/g, '*').replace(/÷/g, '/');
      const inView = sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5; }, sel);
      for (let r = 1; r <= 6; r++) {
        const st = await page.evaluate(() => window.__testGame());
        for (let k = 0; k < st.solution.length; k++) { if (k) await page.keyboard.press('ArrowDown'); await page.keyboard.type(keys(st.solution[k])); }
        await page.keyboard.press('Enter'); await run(1300);
      }
      const st7 = await page.evaluate(() => window.__testGame());
      check(`R4.2 ${W}×${H}: round 7 has seven rows`, st7.round === 7 && st7.rows.length === 7, JSON.stringify(st7.round));
      const m = await pzSize(page);
      check(`R4.2 ${W}×${H}: round 7 has no page scroll; top bar and Check on screen`, m.noScroll && m.hudIn && m.noSideways && (await inView('.un-acts [data-k="ok"]')), JSON.stringify(m));
      for (let k = 0; k < 6; k++) await page.keyboard.press('ArrowDown');
      check(`R4.2 ${W}×${H}: the chosen last row scrolls into view`, await page.evaluate(() => {
        const box = document.querySelector('.un-rows'), row = document.querySelector('.un-row.sel'), a = box.getBoundingClientRect(), b = row.getBoundingClientRect();
        return row.dataset.row === '6' && b.top >= a.top - 0.5 && b.bottom <= a.bottom + 0.5;
      }));
      await page.keyboard.type(keys(st7.solution[6]).slice(0, 1));
      check(`R4.2 ${W}×${H}: the card typed lands in the row on screen`, (await page.evaluate(() => window.__testGame().rows[6].length)) === 1 && (await inView('.un-row.sel')));
      await page.click('.un-acts [data-k="ok"]');
      const end = await page.evaluate(() => ({ over: !document.querySelector('#pzOver').hidden, scroll: document.documentElement.scrollHeight - innerHeight, y: scrollY }));
      check(`R4.2 ${W}×${H}: after a long round the end card fits with no page scroll`, end.over && end.scroll <= 1 && end.y === 0 && (await inView('#pzAgain')) && (await inView('.pz-hud')), JSON.stringify(end));
      check(`R4.2 ${W}×${H}: no page errors`, errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // R4.5: failing round 1 the first time does not say "Best: round 0"
    await flow('R4.5 first game lost at round 1', async () => {
      const { context, page, errors } = await freshPage(browser, site);
      await page.click('#navGames'); await page.click('#play-numbers'); await page.click('#pzGo');
      await page.click('.un-acts [data-k="ok"]');
      check('R4.5: Rounds passed: 0, and "No round passed yet" instead of "Best: round 0"', (await page.textContent('#pzFinal')) === 'Rounds passed: 0' && (await page.textContent('#pzBest')) === 'No round passed yet', await page.textContent('#pzBest'));
      check('R4.5: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // R3.3 (v1.7.0): a student with badges but no saved sessions (e.g. history cleared) still sees the badges on Progress
    await flow('R3.3 badges with no sessions', async () => {
      const t0 = Date.now();
      const { context, page, errors } = await freshPage(browser, site, {
        [SETTINGS]: settings({ year: 4 }),
        'sp.badges.p1': JSON.stringify([{ date: t0, kind: 'perfect', subject: 'maths', year: 4, diff: 2, n: 5 }])
      });
      await page.click('[data-go="progress"]');
      check('R3.3: Progress says there are no sessions', /No|no/.test(await page.textContent('#progBody')));
      check('R3.3: the badge shelf is shown anyway', (await page.locator('#progBody .badge-shelf').count()) === 1 && /1/.test(await page.textContent('#progBody .badge-shelf h3')), await page.textContent('#progBody'));
      check('R3.3: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.10.0 R9: K–6 study mode (Terry 2026-11-09): pick a year (Kindergarten too) and a topic, read the lesson, then practise it
    // v1.11.0 R2.1 (v1.10.1): the phone run starts in single view, so the view round trip below runs on every run (a third
    // run would add ~20 s to a suite with a 7-minute limit; the study screens do not depend on the view)
    for (const [W, H, phone, view] of [[375, 812, false, 'pages'], [320, 568, true, 'single']]) await flow(`R9 study mode ${W}×${H}${phone ? ' phone' : ''}`, async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 3, view }) },
        null, { context: { viewport: { width: W, height: H }, ...(phone ? { isMobile: true, hasTouch: true } : {}) } });
      const wide = () => page.evaluate(() => document.documentElement.scrollWidth - (window.visualViewport ? visualViewport.width : innerWidth));
      // v1.12.0 W4: Study is a tile on Home with its own year (Kindergarten to Year 6) and topic; Read the lesson opens it
      await openSheet(page, 'study');
      check(`R9 ${W}: Study on Home offers the student's year, Kindergarten to Year 6, and Read the lesson`, (await page.locator('#yearSel').inputValue()) === '3' && (await page.locator('#yearSel option').count()) === 7 && (await page.textContent('#startBtn')) === 'Read the lesson', await page.locator('#yearSel').inputValue());
      check(`R9 ${W}: Study hides the subject, school, difficulty, count and Print`, !(await page.isVisible('#subjectBox')) && !(await page.isVisible('#schoolField')) && !(await page.isVisible('#diffSel')) && !(await page.isVisible('#countSel')) && !(await page.isVisible('#printHome')));
      const homeTopic = await page.locator('#topicSel').inputValue();
      await startSet(page);
      check(`R9 ${W}: Read the lesson opens the topic chosen on Home`, (await page.locator('#studyLesson').isVisible()) && (await page.textContent('#lessonH')).includes(await page.evaluate(k => window.I18N.t('topic.' + k), homeTopic)), homeTopic + ' / ' + (await page.textContent('#lessonH')));
      await page.click('#studyLesson .study-back');
      check(`R9 ${W}: the study screen opens on the student's year with the list of topics`, (await page.locator('#screen-study').isVisible()) && (await page.locator('#studyYears input:checked').getAttribute('value')) === '3' && (await page.locator('.study-topic').count()) === 11, String(await page.locator('.study-topic').count()));
      check(`R9 ${W}: topics are grouped by strand`, (await page.locator('#studyTopics h4').count()) === 3);
      check(`R9 ${W}: the year chips include Kindergarten, named for screen readers`, (await page.locator('#studyYears input').count()) === 7 && (await page.locator('#studyYears input').first().getAttribute('aria-label')) === 'Kindergarten');
      check(`R9 ${W}: no sideways pan on the topic list`, (await wide()) <= 0, String(await wide()));
      await page.locator('#studyYears label').first().click();
      const kt = await page.locator('.study-topic').evaluateAll(bs => bs.map(b => b.dataset.topic));
      check(`R9 ${W}: Kindergarten lists 9 topics (no word problems, no chance)`, kt.length === 9 && !kt.includes('k6word') && !kt.includes('k6chance'), kt.join(','));
      await page.locator('.study-topic[data-topic="k6add"]').click();
      check(`R9 ${W}: the lesson opens with its heading focused`, (await page.locator('#studyLesson').isVisible()) && (await page.evaluate(() => document.activeElement.id)) === 'lessonH');
      check(`R9 ${W}: the lesson has key ideas, worked examples and a tip`, (await page.locator('#studyLesson li').count()) >= 3 && (await page.locator('#studyLesson .study-ex').count()) >= 1 && (await page.locator('#studyLesson .study-tip').count()) === 1);
      check(`R9 ${W}: no sideways pan on the lesson`, (await wide()) <= 0, String(await wide()));
      const first = await page.textContent('#lessonH');
      await page.click('#studyNext');
      check(`R9 ${W}: Next goes to the next topic's lesson`, (await page.textContent('#lessonH')) !== first && (await page.evaluate(() => document.activeElement.id)) === 'lessonH', await page.textContent('#lessonH'));
      await page.click('#studyLesson .study-back');
      check(`R9 ${W}: a read lesson is marked on the list`, (await page.locator('.study-topic[data-topic="k6add"]').textContent()).includes('✓'), await page.locator('.study-topic[data-topic="k6add"]').textContent());
      await page.locator('.study-topic[data-topic="k6add"]').click();
      await page.click('#studyPractise');
      await page.waitForSelector('#screen-quiz:not([hidden])');
      // v1.10.1: count the set from the screen (one palette button per question, in every view), so the check also runs on
      // Production, which has no window.__testAnswers; where the hook exists it must agree with the screen
      const shown = await page.locator('#palette button').count();
      const hooked = await page.evaluate(() => (window.__testAnswers ? window.__testAnswers().length : null));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.settings.p1')));
      // v1.10.1 R1.1: read the topic of every question, not only the saved setting: show all cards (page view), compare each
      // card's topic badge with the app's own name for k6add, then put the view back as the student had it
      const wasSingle = (await page.getAttribute('#viewSingle', 'aria-pressed')) === 'true';
      check(`R9 ${W}: the set opens in the student's view (${view})`, wasSingle === (view === 'single'), String(wasSingle));
      // v1.11.0 R2.2 (v1.10.1): in single view the student moves to question 2 first; Pages and back to single view must
      // land on question 2 again by itself (the app keeps the question while it is on the page shown). R2 (R1 R2.2): read
      // straight after the switch, before any tap, so the check fails on a build that goes back to question 1
      const curQ = () => page.locator('#palette button').evaluateAll(bs => bs.findIndex(b => b.getAttribute('aria-current') === 'true'));
      if (wasSingle) await page.locator('#palette button').nth(1).click();
      const at = wasSingle ? await curQ() : -1;
      if (wasSingle) await page.click('#viewPages');
      const want = await page.evaluate(() => window.I18N.t('topic.k6add'));
      // v1.11.0 R2.3 (v1.10.1): only the topic badge in each card's head, never a marks badge
      const topics = await page.locator('#qList .qcard .qhead .badge:not(.marks)').allTextContents();
      if (wasSingle) {
        await page.click('#viewSingle');
        check(`R9 ${W}: back in single view on the student's question (2)`, at === 1 && (await curQ()) === at, JSON.stringify({ at, now: await curQ() }));
      }
      const onTopic = topics.length === shown && topics.every(x => x.trim() === want);
      check(`R9 ${W}: Practise starts a Kindergarten set on that topic`, saved.year === 0 && saved.topic === 'k6add' && shown === 5 && (hooked === null || hooked === shown) && onTopic, JSON.stringify({ year: saved.year, topic: saved.topic, shown, hooked, topics }));
      await page.click('#quitBtn');
      await page.waitForSelector('#screen-home:not([hidden])');
      check(`R9 ${W}: Home is back in Practice with Kindergarten and the topic`, (await page.getAttribute('#modeCards', 'data-mode')) === 'practice' && (await page.locator('#yearSel').inputValue()) === '0' && (await page.locator('#topicSel').inputValue()) === 'k6add', await page.locator('#yearSel').inputValue());
      const opts = await page.locator('#topicSel option').evaluateAll(o => o.map(x => x.value));
      check(`R9 ${W}: Home lists the Kindergarten topics`, opts.includes('k6add') && opts.includes('k6shape') && !opts.includes('frac'), opts.join(','));
      await page.click('#langBtn');
      await openSheet(page, 'study');
      await page.selectOption('#topicSel', 'k6add');
      await startSet(page);
      check(`R9 ${W}: the lesson is in Chinese after switching language`, /[一-鿿]/.test(await page.textContent('#studyLesson')));
      check(`R9 ${W}: no page errors`, errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // R9: Kindergarten is offered for maths only; other subjects keep Year 1 as their first year, and hide the study card
    await flow('R9 Kindergarten is maths only', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 0, topic: 'k6add' }) });
      check('R9: Kindergarten is the first year for maths', (await page.locator('#yearSel option').first().getAttribute('value')) === '0');
      await openSheet(page, 'practice');
      await page.locator('label:has(input[name="subject"][value="ga"])').click();
      check('R9: General ability has no Kindergarten and moves to Year 1', !(await page.locator('#yearSel option').evaluateAll(o => o.map(x => x.value))).includes('0') && (await page.locator('#yearSel').inputValue()) === '1', await page.locator('#yearSel').inputValue());
      // v1.12.0 W4: Study has no subject choice (maths, Kindergarten to Year 6); Practice keeps General ability for later
      await openSheet(page, 'study');
      check('R9: Study has no subject tiles and starts at Kindergarten', !(await page.isVisible('#subjectBox')) && (await page.locator('#yearSel option').first().getAttribute('value')) === '0');
      await openSheet(page, 'practice');
      check('W4: back in Practice, General ability is still chosen', await page.locator('#subjectChips input[value="ga"]').isChecked());
      check('R9 maths only: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.11.0 W1a (Terry 2026-11-11): What's new pops up once per version for someone who used an earlier version, with
    // only what changed since the version they last saw; a first visit does not get it; "Show me" walks through the items
    const isOpen = page => page.locator('#newsDlg').evaluate(d => d.open);
    const appVersion = page => page.evaluate(() => self.APP_VERSION);
    await flow('v1.11 What\'s new after an update', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() }, null, { news: true });
      const v = await appVersion(page);
      check('v1.11 What\'s new: opens on its own for a browser that used an earlier version', await isOpen(page));
      check('v1.11 What\'s new: the title names this version', (await page.textContent('#newsTitle')).includes(v), await page.textContent('#newsTitle'));
      check('v1.11 What\'s new: only this version\'s items, without a version heading', (await page.locator('#newsBody .news-ver').count()) === 1 && (await page.locator('#newsBody h4').count()) === 0 && (await page.locator('#newsBody li').count()) === 4, await page.locator('#newsBody li').count());   // v2.0.0: four items
      const sizes = await page.evaluate(() => ['#newsShow', '#newsClose'].map(s => document.querySelector(s).getBoundingClientRect().height));
      check('v1.11 What\'s new: Show me and Got it are at least 44 px tall', sizes.every(h => h >= 44), sizes);
      check('v1.11 What\'s new: nothing is stored until it is closed', (await page.evaluate(() => localStorage.getItem('sp.news'))) === null);
      await page.click('#newsClose');
      check('v1.11 What\'s new: Got it closes it and remembers this version', !(await isOpen(page)) && (await page.evaluate(() => JSON.parse(localStorage.getItem('sp.news')))) === v);
      await page.reload({ waitUntil: 'load' });
      check('v1.11 What\'s new: not shown again for the same version', !(await isOpen(page)));
      check('v1.11 What\'s new: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    await flow('v1.11 What\'s new Show me', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() }, null, { news: true });
      await page.click('#newsShow');
      check('v1.11 Show me: the dialog closes and the guided tour opens', !(await isOpen(page)) && (await page.locator('#tourDlg').count()) === 1);
      const titles = [];
      for (let k = 0; k < 4 && (await page.locator('#tourDlg').count()); k++) { titles.push(await page.textContent('#tourTitle')); await page.click('#tourNext'); }
      const want = await page.evaluate(() => self.RELEASES[0].items.map(i => window.I18N.t('rel.' + self.APP_VERSION + '.' + i.id + 'T')));
      check('v1.11 Show me: one step per new item, in order', JSON.stringify(titles) === JSON.stringify(want), JSON.stringify(titles));
      check('v1.11 Show me: the tour ends on Home, and What\'s new is remembered', (await page.locator('#tourDlg').count()) === 0 && (await visible(page, '#screen-home')) && !!(await page.evaluate(() => localStorage.getItem('sp.news'))));
      check('v1.11 Show me: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    await flow('v1.11 What\'s new: first visit and skipped versions', async () => {
      let { context, page } = await freshPage(browser, site, null, null, { news: true });
      check('v1.11 first visit: no What\'s new', !(await isOpen(page)));
      check('v1.11 first visit: marked as up to date', (await page.evaluate(() => JSON.parse(localStorage.getItem('sp.news')))) === (await appVersion(page)));
      await context.close();
      // a browser that last saw v1.10.0 gets everything after it, each under its own version heading
      ({ context, page } = await freshPage(browser, site, { [SETTINGS]: settings(), 'sp.news': '"1.10.0"' }, null, { news: true }));
      const heads = await page.locator('#newsBody h4').allTextContents();
      check('v1.11 skipped versions: every version since the one last seen, newest first', (await isOpen(page)) && heads.length === 4 && heads[0].includes(await appVersion(page)) && heads[1].includes('1.12.0') && heads[2].includes('1.11.0') && heads[3].includes('1.10.1'), JSON.stringify(heads));
      // R1.2: one Show me only (the one at the bottom), never one per version as well
      check('v1.11 skipped versions: a single Show me', (await page.locator('#newsBody .news-show-v').count()) === 0 && (await page.locator('#newsShow').isVisible()), String(await page.locator('#newsBody .news-show-v').count()));
      // R1.6: Escape closes it and remembers this version, like Got it
      // R2.2 (v1.11.0): the dialog's close event stores the version a moment after the key; wait for it (up to 3 s)
      await page.keyboard.press('Escape');
      const vNow = await appVersion(page);
      const remembered = await page.waitForFunction(v => { try { return JSON.parse(localStorage.getItem('sp.news')) === v; } catch (e) { return false; } }, vNow, { timeout: 3000 }).then(() => true, () => false);
      check('v1.11 What\'s new: Escape closes it and remembers this version', !(await isOpen(page)) && remembered, await page.evaluate(() => localStorage.getItem('sp.news')));
      await page.reload({ waitUntil: 'load' });
      check('v1.11 What\'s new: not shown again after Escape', !(await isOpen(page)));
      await context.close();
      // R1.6: a browser that already saw a later version (Test, then Production) gets nothing, and keeps the later version
      ({ context, page } = await freshPage(browser, site, { [SETTINGS]: settings(), 'sp.news': '"99.0.0"' }, null, { news: true }));
      check('v1.11 later version seen: no What\'s new, and the stored version is not lowered', !(await isOpen(page)) && (await page.evaluate(() => localStorage.getItem('sp.news'))) === '"99.0.0"', await page.evaluate(() => localStorage.getItem('sp.news')));
      await context.close();
    });
    // v1.11.0 W1b: Release history is its own button, for anyone (a first visit too), every version from v1.10.0 on.
    // R2 (R1.1): the student's greeting is not cut off. v1.12.0 W4: the button is a row in Settings (open to everyone)
    for (const [W, H] of [[375, 812], [320, 568]]) await flow(`v1.11 Release history ${W}×${H}`, async () => {
      const { context, page, errors } = await freshPage(browser, site, null, null, { context: { viewport: { width: W, height: H } } });
      const wide = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const top = await page.evaluate(() => ['#profileBtn', '#langBtn'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.height)]; }));
      check(`v1.11 ${W}: the header fits its buttons, each at least 44 px tall`, top.every(([l, r, h]) => l >= 0 && r <= W && h >= 44) && (await wide()) <= 0, JSON.stringify(top));
      const hello = () => page.evaluate(() => { const h = document.querySelector('#helloText'); return { text: h.textContent, sw: h.scrollWidth, cw: h.clientWidth }; });
      let g = await hello();
      check(`v1.11 ${W}: the greeting is shown whole, not cut off`, /Student 1/.test(g.text) && g.sw <= g.cw + 1, JSON.stringify(g));
      check(`v1.11 ${W}: Release history is in Settings, not on Home or in the header`, (await page.locator('#screen-parent #newsBtn').count()) === 1 && (await page.locator('#screen-home #newsBtn, header #newsBtn').count()) === 0 && (await page.textContent('#newsBtn [data-i18n]')) === 'Release history');
      await page.click('#navParent');
      const nb = await page.locator('#newsBtn').boundingBox();
      check(`v1.11 ${W}: the Release history button is at least 44 px tall`, nb && nb.height >= 44, JSON.stringify(nb));
      await page.click('#newsBtn');
      const heads = await page.locator('#newsBody h4').allTextContents();
      check(`v1.11 ${W}: Release history opens with every version from 1.10.0, newest first`, (await isOpen(page)) && (await page.textContent('#newsTitle')) === 'Release history' && heads.length === 5 && heads[0].includes(await appVersion(page)) && heads[4].includes('1.10.0'), JSON.stringify(heads));
      check(`v1.11 ${W}: the newest version is marked as this version`, (await page.locator('#newsBody .news-ver').first().locator('.news-cur').count()) === 1);
      check(`v1.11 ${W}: history has no single Show me, but one per version that has something to show`, (await page.locator('#newsShow').isHidden()) && (await page.locator('#newsBody .news-show-v').count()) === 4);
      const box = await page.evaluate(() => { const r = document.querySelector('#newsDlg').getBoundingClientRect(); return [r.top, r.bottom, innerHeight]; });
      check(`v1.11 ${W}: the dialog fits the screen (its list scrolls)`, box[0] >= 0 && box[1] <= box[2], JSON.stringify(box));
      check(`v1.11 ${W}: Close is reachable`, await page.locator('#newsClose').isVisible());
      // Show me for v1.10.0, then back to the history
      await page.locator('#newsBody .news-ver').last().locator('.news-show-v').click();
      check(`v1.11 ${W}: Show me for v1.10.0 starts on its first item`, (await page.textContent('#tourTitle')) === (await page.evaluate(() => window.I18N.t('rel.1.10.0.studyT'))), await page.textContent('#tourTitle'));
      await page.click('#tourSkip');
      check(`v1.11 ${W}: after Show me the history opens again`, await isOpen(page));
      await page.click('#newsClose');
      check(`v1.11 ${W}: Close closes it`, !(await isOpen(page)));
      check(`v1.11 ${W}: opening history leaves the What's new state alone`, (await page.evaluate(() => localStorage.getItem('sp.news'))) === '"999.0.0"');
      await page.click('#langBtn');
      g = await hello();
      check(`v1.11 ${W}: the greeting is shown whole in Chinese`, /学生 1/.test(g.text) && g.sw <= g.cw + 1, JSON.stringify(g));
      await page.click('#navParent');
      await page.click('#newsBtn');
      check(`v1.11 ${W}: in Chinese`, (await page.textContent('#newsTitle')) === '版本历史' && /[一-鿿]/.test(await page.textContent('#newsBody')) && (await page.textContent('#newsClose')) === '关闭');
      check(`v1.11 ${W}: no page errors`, errors.length === 0, errors.join(' | '));
      await context.close();
    });
    // v1.11.0 W2 and W3: plain level names in the difficulty list; Home has no banner, starts from Start practice or ▶
    await flow('v1.11 levels and Home', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      check('v1.11 levels in English', JSON.stringify(await page.locator('#diffSel option').allTextContents()) === JSON.stringify(['Core', 'Elevated', 'Challenging', 'Competitive']), JSON.stringify(await page.locator('#diffSel option').allTextContents()));
      check('v1.11 the level note names no olympiad', !/olympiad|AMO/i.test(await page.textContent('#diffNote')), await page.textContent('#diffNote'));
      check('v1.11 Home: no banner and no Get started button', (await page.locator('.hero, #heroStart').count()) === 0);
      check('v1.11 Home: the screen keeps a heading for screen readers', (await page.textContent('#homeH')) === 'Home');
      await page.click('#langBtn');
      check('v1.11 levels in Chinese', JSON.stringify(await page.locator('#diffSel option').allTextContents()) === JSON.stringify(['基础', '进阶', '挑战', '竞赛']), JSON.stringify(await page.locator('#diffSel option').allTextContents()));
      await startSet(page);
      check('v1.11 Home: Start practice starts the set', await visible(page, '#screen-quiz'));
      check('v1.11 levels and Home: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // v1.11.0 R2.1 (carried): the greeting is whole at the widths where it was cut off, now that the header has one button
    await flow('R2.1 greeting widths', async () => {
      for (const W of [341, 344, 350, 356]) {
        const { context, page, errors } = await freshPage(browser, site, null, null, { context: { viewport: { width: W, height: 700 } } });
        const g = await page.evaluate(() => { const h = document.querySelector('#helloText'), w = document.querySelector('.hello-wave'), r = w && w.getBoundingClientRect(); return { text: h.textContent, sw: h.scrollWidth, cw: h.clientWidth, wave: !!r && r.width > 0, waveIn: !r || r.right <= innerWidth, side: document.documentElement.scrollWidth > innerWidth }; });
        check(`R2.1 ${W}: the greeting is shown whole, the wave fits, no sideways scroll`, /Student 1/.test(g.text) && g.sw <= g.cw + 1 && g.waveIn && !g.side, JSON.stringify(g));
        check(`R2.1 ${W}: no page errors`, errors.length === 0, errors.join(' | '));
        await context.close();
      }
    });

    // v1.12.0 W6 (Terry chose Option B, 2026-11-11): Home never changes; four cards; a card opens a sheet with that
    // mode's options and Start; white page; Settings open to everyone, the parent part behind the PIN (W4)
    await flow('v1.12 Home cards and sheet', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 5, topic: 'k6frac' }) });
      const on = sel => page.locator(sel).first().isVisible();
      const values = sel => page.locator(sel).evaluateAll(i => i.map(x => x.value).join());
      const tabs = () => page.locator('.bottom-nav > button .tl').allTextContents();
      const startInView = () => page.evaluate(async () => { await Promise.all(document.querySelector('#setupDlg').getAnimations().map(a => a.finished)); const r = document.querySelector('#startBtn').getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; });
      const homeLayout = () => page.evaluate(() => [...document.querySelectorAll('#screen-home > *')].filter(n => n.getClientRects().length).map(n => n.id + ':' + Math.round(n.getBoundingClientRect().top + scrollY) + ':' + Math.round(n.getBoundingClientRect().height)).join(' '));
      check('W6 five tabs (v2.0.0): Home, Progress, Friends, Relax, Settings', JSON.stringify(await tabs()) === JSON.stringify(['Home', 'Progress', 'Friends', 'Relax', 'Settings']), JSON.stringify(await tabs()));
      check('W6 header: only the language button beside the student', (await page.locator('.top-actions button').count()) === 1 && (await on('#langBtn')));
      check('W6 the page is white', (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(255, 255, 255)', await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
      const cards = await page.locator('#modeCards .mode-card').evaluateAll(bs => bs.map(b => {
        const r = b.getBoundingClientRect(), i = b.querySelector('.mc-ic svg').getBoundingClientRect();
        return { id: b.id, t: b.querySelector('.mc-t').textContent, s: b.querySelector('.mc-s').textContent, ic: Math.round(i.width), dx: Math.round(i.left - r.left), dy: Math.round(i.top - r.top),
          name: parseFloat(getComputedStyle(b.querySelector('.mc-t')).fontSize) };
      }));
      check('W6 four cards: Study, Practice, Test, Relax, each with a short line', cards.map(c => c.t).join() === 'Study,Practice,Test,Relax' && cards.every(c => c.s.length > 3), JSON.stringify(cards));
      check('W6 every card icon is the same size and in the same place, and bigger than its name', cards.every(c => c.ic === cards[0].ic && c.dx === cards[0].dx && c.dy === cards[0].dy) && cards[0].ic >= 56 && cards[0].ic > 3 * cards[0].name, JSON.stringify(cards));
      check('W7 a first visit: the owl says there is no plan yet, Make a plan; no Carry on', (await page.textContent('#todayText')) === 'No plan for today yet.' && (await page.textContent('#todayGo')) === 'Make a plan' && !(await on('#carryBox')));
      check('W7 the top row: Primary school chosen, then the calendar with today\'s date', (await page.getAttribute('#schoolSwitch [data-school="primary"]', 'aria-pressed')) === 'true' && (await page.textContent('#planDay')) === String(new Date().getDate()) && (await page.getAttribute('#planBtn', 'aria-label')) === 'My plan: open the calendar');
      const topRow = await page.evaluate(() => { const a = document.querySelector('#schoolSwitch').getBoundingClientRect(), b = document.querySelector('#planBtn').getBoundingClientRect(); return Math.abs(a.top - b.top) < 12; });
      check('W7 the switch and the calendar are on one row at 375 px', topRow);
      check('W7 the owl and today\'s plan sit under the switch and above the Study card', await page.evaluate(() => { const y = s => document.querySelector(s).getBoundingClientRect().top; return y('#schoolSwitch') < y('#todayPlan') && y('#todayPlan') < y('#cardStudy'); }));
      check('W8 Friends on Home: one line to sign in; no Badges on Home', (await page.textContent('#friendsCta')).endsWith('Sign in to practise with friends') && (await page.locator('#badgeBox, #homeBadges, #weekCard').count()) === 0);
      check('W6 Home shows no options or Start until a card is tapped', !(await on('#startBtn')) && !(await on('#diffSel')) && !(await sheetOpen(page)));
      check('W6 Home: no removed parts', (await page.locator('#modeTiles, #subjectNote, #sourceLine, #studyCard, #studyTopicBtn, #fabStart, #navStudents, #parentBtn, #schoolSel, #schoolField').count()) === 0);
      const layout = await homeLayout();
      // Practice
      await page.click('#cardPractice');
      check('W6 Practice: the sheet opens with its own name', (await sheetOpen(page)) && (await page.textContent('#setupTitle')) === 'Practice');
      check('W6 Practice: Maths and General Ability only, Maths chosen', (await values('#subjectChips input')) === 'maths,ga' && (await page.locator('#subjectChips input[value="maths"]').isChecked()));
      check('W6 Practice: year, topic, difficulty, count and Print; Start practice in view', (await on('#yearSel')) && (await on('#topicSel')) && (await on('#diffSel')) && (await on('#countSel')) && (await on('#printHome')) && (await page.textContent('#startBtn')) === 'Start practice' && (await startInView()));
      const opts = await page.locator('#topicSel option').allTextContents();
      check('W6 every topic in the list starts with a picture', opts.length > 3 && opts.every(o => /^[^\p{L}\p{N}\s]+ \S/u.test(o)), JSON.stringify(opts));
      check('R1.1 the Practice topic is the student\'s (Fractions)', (await page.inputValue('#topicSel')) === 'k6frac');
      // R2.5 (v1.12.0): choosing a subject with the keyboard keeps the focus on the subject
      await page.focus('#subjectChips input[value="ga"]');
      await page.keyboard.press('Space');
      check('R2.5 Space on General Ability chooses it and focus stays on it', (await page.locator('#subjectChips input[value="ga"]').isChecked()) && (await page.evaluate(() => document.activeElement.matches('#subjectChips input[value="ga"]'))), await page.evaluate(() => document.activeElement.outerHTML.slice(0, 60)));
      await page.focus('#subjectChips input[value="maths"]');
      await page.keyboard.press('Space');
      await page.selectOption('#topicSel', 'k6frac');
      await page.click('#setupClose');
      check('W6 ✕ closes the sheet, focus goes back to the card', !(await sheetOpen(page)) && (await page.evaluate(() => document.activeElement.id)) === 'cardPractice');
      check('W6 Home did not move or change', (await homeLayout()) === layout, layout + ' / ' + (await homeLayout()));
      // Test
      await page.click('#cardTest');
      check('W6 Test: Selective and Competition only, Selective chosen', (await page.textContent('#setupTitle')) === 'Test' && (await values('#subjectChips input')) === 'sel,comp' && (await page.locator('#subjectChips input[value="sel"]').isChecked()));
      check('W6 Test: no difficulty or count; Start test in view', !(await on('#diffSel')) && !(await on('#countSel')) && (await page.textContent('#startBtn')) === 'Start test' && (await startInView()));
      await page.click('#subjectChips .tile-comp');
      check('W6 Test: Competition, Start paper', (await page.textContent('#startBtn')) === 'Start paper' && (await on('#compPaperSel')));
      await page.keyboard.press('Escape');
      check('W6 Escape closes the sheet; Home did not move', !(await sheetOpen(page)) && (await homeLayout()) === layout);
      // R1.1 (v1.12.0): back in Practice the topic is still Fractions, and Test still remembers Competition
      await page.click('#cardPractice');
      check('R1.1 Practice after Test keeps Maths and Fractions', (await page.locator('#subjectChips input[value="maths"]').isChecked()) && (await page.inputValue('#topicSel')) === 'k6frac', await page.inputValue('#topicSel'));
      await page.mouse.click(30, 30);   // the dimmed part above the sheet
      check('W6 a tap outside closes the sheet', !(await sheetOpen(page)));
      await page.click('#cardTest');
      check('W6 Test remembers Competition', await page.locator('#subjectChips input[value="comp"]').isChecked());
      await page.keyboard.press('Escape');
      // Study
      await page.click('#cardStudy');
      check('W6 Study: no subject, says K to Year 6 once (R2.3), Read the lesson', (await page.textContent('#setupTitle')) === 'Study' && !(await on('#subjectBox')) && !(await on('#setupSub')) && (await on('#studyNote')) && (await page.textContent('#startBtn')) === 'Read the lesson' && (await startInView()));
      await page.keyboard.press('Escape');
      // Relax
      await page.click('#cardRelax');
      check('W6 the Relax card opens the games', await on('#screen-games'));
      await page.click('.tab[data-go="home"]');
      // 320 px: the sheet for each mode fits, with Start in view
      await page.setViewportSize({ width: 320, height: 568 });
      for (const m of ['study', 'practice', 'test']) {
        await openSheet(page, m);
        check(`W6 ${m} at 320×568: no sideways scroll, Start in view`, (await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('#setupDlg').scrollWidth <= document.querySelector('#setupDlg').clientWidth)) && (await startInView()));
      }
      await page.keyboard.press('Escape');
      check('W6 Home at 320 px: no sideways scroll', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      // R2.2 (v1.12.0): with bigger text (24 px) the card words stay in their cards and the page does not scroll sideways
      const big = await page.evaluate(() => {
        document.documentElement.style.fontSize = '24px';
        const out = [...document.querySelectorAll('#modeCards .mode-card')].map(b => { const r = b.getBoundingClientRect(); return [...b.querySelectorAll('.mc-t, .mc-s')].every(x => { const q = x.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1; }); });
        const side = document.documentElement.scrollWidth - innerWidth;
        document.documentElement.style.fontSize = '';
        return { inside: out.every(Boolean), side };
      });
      check('R2.2 24 px text at 320 px: card words inside the cards, no sideways scroll', big.inside && big.side <= 0, JSON.stringify(big));
      await page.setViewportSize({ width: 375, height: 812 });
      await openSheet(page, 'practice');
      await page.keyboard.press('Escape');
      await page.reload({ waitUntil: 'load' });
      check('W6 the mode is remembered after a reload', (await page.getAttribute('#modeCards', 'data-mode')) === 'practice');
      // Settings: open to everyone, the parent part behind the PIN (W4)
      await page.click('#navParent');
      check('v1.12 Settings opens without the PIN', await on('#screen-parent'));
      check('v1.12 Settings: Guided tour, Release history and Students for everyone', (await on('#tourBtn')) && (await on('#newsBtn')) && (await on('#studentsBtn')));
      check('v1.12 Settings: the parent part is locked', (await on('#parentLocked')) && !(await on('#parentArea')) && (await page.textContent('#parentIcon')) === '🔒');
      // R1.4 (v1.12.0): nothing in the locked parent part takes keyboard focus
      const reached = [];
      await page.focus('#tourBtn');
      for (let k = 0; k < 25; k++) { await page.keyboard.press('Tab'); reached.push(await page.evaluate(() => !!document.activeElement.closest('#parentArea'))); }
      check('R1.4 Tab never reaches the locked parent part', !reached.some(Boolean));
      await page.click('#studentsBtn');
      check('v1.12 Settings: Students opens the student list', await page.locator('#profileDlg').evaluate(d => d.open));
      await page.click('#profileClose');
      await page.click('#parentUnlock');
      await typePin(page);
      check('v1.12 Settings: the PIN opens the parent part', (await on('#parentArea')) && !(await on('#parentLocked')) && (await page.textContent('#parentIcon')) === '🔓');
      await page.click('#lockBtn');
      check('v1.12 Settings: Lock closes the parent part and stays in Settings', (await on('#screen-parent')) && (await on('#parentLocked')) && !(await on('#parentArea')));
      // Chinese
      await page.click('#langBtn');
      const zh = await page.evaluate(() => ['nav.home', 'nav.progress', 'nav.friends', 'nav.games', 'nav.settings'].map(k => window.I18N.t(k)));
      check('v1.12 tabs in Chinese, Relax is 放松, Friends is 好友', JSON.stringify(await tabs()) === JSON.stringify(zh) && zh[2] === '好友' && zh[3] === '放松', JSON.stringify(await tabs()));
      await page.click('.tab[data-go="home"]');
      check('W6 cards in Chinese', (await page.locator('#modeCards .mc-t').allTextContents()).join() === '学习,练习,考试,放松');
      check('W7 no English beside Chinese: the switch reads 小学 / 中学', (await page.locator('#schoolSwitch button').allTextContents()).join() === '小学,中学');
      await page.click('#cardPractice');
      check('W6 the sheet in Chinese', (await page.textContent('#setupTitle')) === '练习' && (await page.textContent('#startBtn')) === '开始练习');
      check('W6 Home cards and sheet: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // W7 (Terry 2026-11-12): My plan: the calendar, plans per day (once or every week), the owl's today's plan, a parent's
    // plan behind the PIN; Carry on (W6), now with the Competition paper (R2.4)
    await flow('v1.12 W7 My plan, today\'s plan and Carry on', async () => {
      const now = Date.now(), day = 864e5, today = new Date();
      const set = (date, topic, correct) => ({ date, subject: 'maths', year: 5, topic, diff: 1, n: 5, correct, stars: 1, byTopic: { [topic]: [correct, 5] }, wrong: [] });
      const { context, page, errors } = await freshPage(browser, site, {
        [SETTINGS]: settings({ year: 5, subject: 'sel' }),
        'sp.history.p1': JSON.stringify([set(now - 10 * day, 'k6frac', 2), set(now - 2 * day, 'k6frac', 4), set(now - day, 'k6frac', 4), set(now, 'k6time', 3)])
      });
      const on = sel => page.locator(sel).first().isVisible();
      check('W7 the calendar button shows the run: 3 days', (await page.textContent('#planStreak')) === '🔥 3');
      const carry = await page.textContent('#carryOn'), k6time = await page.evaluate(() => window.I18N.t('topic.k6time'));
      check('W6 Carry on: the last set, its year and score, a 60% bar', (await on('#carryBox')) && carry.includes(k6time) && carry.includes('Year 5') && carry.includes('Last time 3 out of 5') && (await page.locator('#carryOn .carry-bar i').evaluate(i => i.style.width)) === '60%', carry);
      await page.click('#carryOn');
      check('W6 Carry on opens Practice with Maths, Year 5 and that topic', (await sheetOpen(page)) && (await page.textContent('#setupTitle')) === 'Practice' && (await page.inputValue('#yearSel')) === '5' && (await page.inputValue('#topicSel')) === 'k6time');
      await page.keyboard.press('Escape');
      // My plan from the owl's Make a plan
      await page.click('#todayGo');
      check('W7 Make a plan opens My plan', await on('#screen-plan'));
      check('W7 My plan: the run, this month, today chosen and marked practised', (await page.textContent('#planRun')) === '🔥 3 days in a row' &&
        (await page.textContent('#calMonth')) === today.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) &&
        (await page.locator('#calGrid .cal-d.today.sel.done').count()) === 1 && (await page.locator('#calGrid .cal-d').count()) === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
      check('W7 My plan: the days start on Monday', (await page.locator('#calGrid .cal-dn').allTextContents()).join() === 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
      check('W7 My plan: nothing planned yet', await on('#dayEmpty'));
      await page.selectOption('#planWhat', 'maths');
      await page.selectOption('#planTopic', 'k6frac');
      await page.selectOption('#planCount', '5');
      await page.selectOption('#planRepeat', '7');
      await page.click('#planAdd');
      const items = await page.locator('#dayList li').allTextContents();
      check('W7 the plan for today: Fractions, 5 questions, every week', items.length === 1 && /Fractions · 5 questions/.test(items[0]) && /Every week/.test(items[0]), JSON.stringify(items));
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.plan.p1')));
      check('W7 the plan is kept for this student, by the student', stored.length === 1 && stored[0].every === 7 && stored[0].by === 'student' && stored[0].topic === 'k6frac' && stored[0].count === 5, JSON.stringify(stored));
      // every week: the same weekday next week is marked (moving to next month when needed)
      const next = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
      if (next.getMonth() !== today.getMonth()) await page.click('#calNext');
      const nextIso = next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0') + '-' + String(next.getDate()).padStart(2, '0');
      check('W7 every week: next week is planned too', (await page.getAttribute(`#calGrid [data-day="${nextIso}"]`, 'class')).includes('plan'));
      check('W7 a day button says its date and what it has', /1 planned/.test(await page.getAttribute(`#calGrid [data-day="${nextIso}"]`, 'aria-label')));
      // back on Home the owl shows today's plan; Start now opens Practice with that plan
      await page.click('#planBack');
      check('W7 the owl shows today\'s plan', (await page.textContent('#todayText')) === "Today's plan: 🍕 Fractions · 5 questions" && (await page.textContent('#todayGo')) === 'Start now', await page.textContent('#todayText'));
      await page.click('#todayGo');
      check('W7 Start now opens Practice with Maths, Year 5, Fractions and 5 questions', (await sheetOpen(page)) && (await page.textContent('#setupTitle')) === 'Practice' && (await page.inputValue('#yearSel')) === '5' && (await page.inputValue('#topicSel')) === 'k6frac' && (await page.inputValue('#countSel')) === '5');
      await page.click('#startBtn');
      await page.click('#finishBtn');
      await page.click('#homeBtn');
      check('W7 after the set, today\'s plan is done', (await page.textContent('#todayText')) === "Today's plan is done. Well done!" && (await page.textContent('#todayGo')) === 'See my plan', await page.textContent('#todayText'));
      // a parent's plan needs the PIN to remove
      await openParent(page);
      await typePin(page);
      await page.click('.tab[data-go="home"]');
      await page.click('#planBtn');
      check('W7 with Parent settings unlocked, My plan says the PIN protects what is added', await on('#planParentNote'));
      await page.selectOption('#planWhat', 'study');
      await page.click('#planAdd');
      check('W7 a parent\'s plan is marked', /Set by a parent/.test((await page.locator('#dayList li').allTextContents()).join('|')));
      await page.click('#navParent');
      await page.click('#lockBtn');
      await page.click('.tab[data-go="home"]');
      await page.click('#planBtn');
      const parentRow = page.locator('#dayList li', { hasText: 'Set by a parent' });
      await parentRow.locator('.pi-x').click();
      check('W7 removing a parent\'s plan asks for the PIN', await page.locator('#pinDialog').evaluate(d => d.open));
      await page.click('#pinCancel');
      check('W7 without the PIN the parent\'s plan stays', (await page.locator('#dayList li', { hasText: 'Set by a parent' }).count()) === 1);
      await page.locator('#dayList li', { hasText: 'Fractions' }).locator('.pi-x').click();
      check('W7 the student removes their own plan without the PIN', (await page.locator('#dayList li', { hasText: 'Fractions' }).count()) === 0 && !(await page.locator('#pinDialog').evaluate(d => d.open)));
      // Chinese
      await page.click('#langBtn');
      check('W7 My plan in Chinese', (await page.textContent('#planH')) === '我的计划' && (await page.textContent('#planAdd')) === '加入计划' && (await page.locator('#calGrid .cal-dn').first().textContent()) === '一');
      await page.click('#planBack');
      check('W7 the owl in Chinese', /^今天的计划/.test(await page.textContent('#todayText')) && (await page.getAttribute('#planBtn', 'aria-label')) === '我的计划：打开日历', await page.textContent('#todayText'));
      check('W7 My plan: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // R2.4 (v1.12.0): Carry on after a Competition set opens that set's paper
    await flow('R2.4 Carry on keeps the Competition paper', async () => {
      const { context, page, errors } = await freshPage(browser, site, {
        [SETTINGS]: settings({ year: 9, compPaper: 'aimo', compLen: 'short' }),
        'sp.history.p1': JSON.stringify([{ date: Date.now(), subject: 'comp', year: 9, topic: 'amc_i', diff: 2, n: 10, correct: 4, stars: 1, byTopic: {}, wrong: [] }])
      });
      await page.click('#carryOn');
      check('R2.4 Carry on opens Test with Competition and the AMC paper of that set', (await page.textContent('#setupTitle')) === 'Test' && (await page.locator('#subjectChips input[value="comp"]').isChecked()) && (await page.inputValue('#compPaperSel')) === 'amc_i', await page.inputValue('#compPaperSel'));
      check('R2.4: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // W7: Primary school or High school on Home; each keeps its own year; Study is K–6, so in High school it is coming
    await flow('v1.12 W7 school switch', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 5 }) });
      const pressed = () => page.locator('#schoolSwitch button[aria-pressed="true"]').getAttribute('data-school');
      check('W7 the switch reads Primary school / High school', (await page.locator('#schoolSwitch button').allTextContents()).join() === 'Primary school,High school');
      check('W7 a Year 5 student is in Primary school', (await pressed()) === 'primary');
      await page.click('#schoolSwitch [data-school="high"]');
      check('W7 High school: Year 7, the button is chosen, focus stays on it', (await pressed()) === 'high' && (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).year, SETTINGS)) === 7 && (await page.evaluate(() => document.activeElement.dataset.school)) === 'high');
      check('W7 High school: the Study card says Coming soon', (await page.textContent('#cardStudy .mc-s')) === 'Coming soon' && (await page.getAttribute('#cardStudy', 'aria-disabled')) === 'true');
      await page.click('#cardStudy', { force: true });   // aria-disabled: Playwright would wait for it; a finger does not
      check('W7 High school: tapping Study says the lessons are K–6, no sheet', !(await sheetOpen(page)) && /Primary school for the K–6 lessons/.test(await page.textContent('#toast')), await page.textContent('#toast'));
      await page.evaluate(() => { document.querySelector('#toast').hidden = true; });
      await openSheet(page, 'practice');
      const years = await page.locator('#yearSel option').evaluateAll(o => o.map(x => +x.value));
      check('W7 High school: the Practice years are Year 7 and up', years.length > 3 && years.every(y => y >= 7), JSON.stringify(years));
      await page.selectOption('#yearSel', '10');
      await page.keyboard.press('Escape');
      await page.click('#schoolSwitch [data-school="primary"]');
      check('W7 back to Primary school: Year 5 again, Study says K–6 lessons', (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).year, SETTINGS)) === 5 && (await page.textContent('#cardStudy .mc-s')) === 'K–6 lessons');
      await page.click('#schoolSwitch [data-school="high"]');
      check('W7 High school again: Year 10, as left', (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).year, SETTINGS)) === 10);
      check('W7 school switch: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // R1.3 (v1.12.0): a Year 7–12 student who opens Study is told that the lessons are Kindergarten to Year 6
    await flow('R1.3 Study for an older student', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 10 }) });
      check('R1.3 a Year 10 student: the Study card says Coming soon (W7: High school)', (await page.textContent('#cardStudy .mc-s')) === 'Coming soon');
      await page.click('#schoolSwitch [data-school="primary"]');
      check('R1.3 in Primary school the Study card says K–6 lessons', (await page.textContent('#cardStudy .mc-s')) === 'K–6 lessons');
      await page.click('#cardStudy');
      check('R1.3 the Study sheet says the lessons are for Kindergarten to Year 6', (await page.isVisible('#studyNote')) && (await page.textContent('#studyNote')) === 'Lessons are for Kindergarten to Year 6.');
      await page.keyboard.press('Escape');
      await page.click('#schoolSwitch [data-school="high"]');
      await page.click('#cardPractice');
      check('R1.3 Practice still has Year 10', (await page.inputValue('#yearSel')) === '10');
      check('R1.3: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
    /* ---------- v2.0.0 (W8, Terry chose Option B): accounts, friends, practising together ---------- */
    // Every account made here has a new random name and is deleted at the end, so the flows can run on the Test site
    // (its own database) as well as on this PC (an in-memory database in tests/local-api.js).
    const errShown = async (page, text) => page.waitForFunction(t => { const e = document.querySelector('#fErr'); return e && !e.hidden && e.textContent === t; }, text, { timeout: 5000 }).then(() => true, () => false);
    const tag = () => 't' + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6);
    const apiCall = async (method, route, body, token) => {
      const res = await fetch(site + 'api/' + route, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: body === undefined ? undefined : JSON.stringify(body) });
      let data = null; try { data = await res.json(); } catch (e) { /* not JSON */ }
      return { status: res.status, data };
    };
    /* an account straight through the server (the second student of a flow), with the test code */
    const makeAccount = async (name, password, avatar = 2) => {
      const c = await apiCall('POST', 'code', { email: name + '@example.com' });
      if (!c.data || !c.data.devCode) throw new Error('no test code from the server: ' + JSON.stringify(c.data));
      const r = await apiCall('POST', 'register', { email: name + '@example.com', code: c.data.devCode, username: name, password, avatar });
      if (r.status !== 200) throw new Error('register: ' + JSON.stringify(r.data));
      return r.data;
    };
    const dropAccount = (token, password) => apiCall('POST', 'account/delete', { password }, token).catch(() => null);
    /* a browser already signed in to an account (as after a sign-in on that device) */
    const signedInPage = (acc) => freshPage(browser, site, {
      'sp.profiles': JSON.stringify({ list: [{ id: 'p1', name: acc.me.username, account: acc.me.username }], active: 'p1' }),
      'sp.auth': JSON.stringify({ token: acc.token, me: acc.me, profile: 'p1' }),
      [SETTINGS]: settings({ year: 5 })
    });
    /* answer every question of the set on screen (Pages view); wrong: the question numbers (0-based) to get wrong */
    // R1.7 (v2.0.0): under load a click or a fill could be lost (the flows suite once gave A 2/5 instead of 4/5). Each
    // answer is now read back from the page and entered again until it is there, before Finish; a run that still cannot
    // enter it fails here, by name, instead of as a wrong score five checks later.
    const answerSet = async (page, wrong = []) => {
      if ((await page.getAttribute('#viewPages', 'aria-pressed')) !== 'true') await page.click('#viewPages');
      await page.waitForFunction(() => document.querySelectorAll('#qList .qcard').length > 1 || (window.__testAnswers() || []).length === 1);
      const answers = await page.evaluate(() => window.__testAnswers());
      const want = answers.map((a, i) => (a.type === 'mc' ? null : wrong.includes(i) ? '987654321' : String(a.answer)));
      const pick = async (i, a) => { const n = await page.locator('#qc' + i + ' .choice').count(); return wrong.includes(i) ? (a.correct + 1) % n : a.correct; };
      const isThere = async (i, a) => (a.type === 'mc'
        ? page.locator('#qc' + i + ' .choice').nth(await pick(i, a)).getAttribute('aria-checked').then(v => v === 'true')
        : page.inputValue('#ans' + i).then(v => v === want[i]));
      for (let p = 0; p * 5 < answers.length; p++) {
        if (p > 0) { await page.click('#nextPage'); await page.waitForSelector('#qc' + p * 5); }
        for (let i = p * 5; i < Math.min(answers.length, p * 5 + 5); i++) {
          const a = answers[i];
          for (let k = 0; k < 4 && !(await isThere(i, a)); k++) {
            if (k) console.log(`    (answerSet: question ${i + 1} entered again, try ${k + 1})`);
            if (a.type === 'mc') await page.locator('#qc' + i + ' .choice').nth(await pick(i, a)).click();
            else await page.fill('#ans' + i, want[i]);
          }
          if (!(await isThere(i, a))) throw new Error('answerSet: question ' + (i + 1) + ' could not be answered');
        }
      }
      await page.click('#finishBtn');
      return answers;
    };
    const health = await apiCall('GET', 'health').catch(e => ({ status: 0, data: { error: e.message } }));
    check('W8 the server answers on this site (/api/health)', health.status === 200 && health.data && health.data.ok, JSON.stringify(health));
    const testCodes = health.status === 200 && (await apiCall('POST', 'code', { email: tag() + '@example.com' })).data;
    check('W8 the server gives test codes on this site (DEV_CODES on Test and on this PC)', !!(testCodes && testCodes.devCode), JSON.stringify(testCodes));

    if (health.status === 200 && testCodes && testCodes.devCode) {
      await flow('v2.0 W8 sign up, move the records, sign out and sign in again', async () => {
        const name = tag(), pw = 'pass-' + name;
        const { context, page, errors } = await freshPage(browser, site, {
          [SETTINGS]: settings({ year: 5 }),
          'sp.history.p1': JSON.stringify([{ date: Date.now(), subject: 'maths', year: 5, topic: 'mixed', diff: 2, n: 5, correct: 4, stars: 2, byTopic: {}, wrong: [] }])
        });
        check('W8 Home: Friends is one line to sign in', (await page.textContent('#friendsCta')).endsWith('Sign in to practise with friends'));
        check('W8 five tabs: Home, Progress, Friends, Relax, Settings', (await page.locator('.bottom-nav .tab .tl').allTextContents()).join() === 'Home,Progress,Friends,Relax,Settings');
        const tabs = await page.evaluate(() => [...document.querySelectorAll('.bottom-nav .tab')].map(b => b.getBoundingClientRect()).map(r => [Math.round(r.width), Math.round(r.height)]));
        check('W8 the five tabs are the same size and at least 44 px tall at 375 px', tabs.every(s => s[0] === tabs[0][0] && s[1] >= 44), JSON.stringify(tabs));
        await page.click('#friendsCta');
        check('W8 signed out, the Friends tab shows Sign in and Create account', (await visible(page, '#fLogin')) && (await page.getAttribute('#fTabLogin', 'aria-pressed')) === 'true' && (await page.textContent('#fTabReg')) === 'Create account');
        await page.click('#fTabReg');
        await page.fill('#fEmail', 'not-an-email');
        await page.click('#fReg1Go');
        check('W8 a wrong email is refused in words', (await page.textContent('#fErr')) === 'That does not look like an email address.');
        await page.fill('#fEmail', name + '@example.com');
        await page.click('#fReg1Go');
        await page.waitForSelector('#fCode');
        const dev = await page.textContent('#fDevCode');
        check('W8 step 2: the code box, and on the Test site the code itself', /Your code is \d{6}\./.test(dev) && (await page.getAttribute('#fCode', 'inputmode')) === 'numeric', dev);
        check('W8 step 2: Send again waits a minute', (await page.isDisabled('#fAgain')) && /Send again in \d+ s/.test(await page.textContent('#fAgain')));
        await page.fill('#fCode', '000000' === dev.match(/\d{6}/)[0] ? '111111' : '000000');
        await page.click('#fReg2Go');
        check('W8 a wrong code is refused in words', await errShown(page, 'That code is not right. Check the email and try again.'), await page.textContent('#fErr'));
        await page.fill('#fCode', dev.match(/\d{6}/)[0]);
        await page.click('#fReg2Go');
        await page.waitForSelector('#fNewUser');
        check('W8 step 3: username, password and 12 pictures', (await page.locator('.f-pick input[type=radio]').count()) === 12 && (await page.getAttribute('#fNewPass', 'autocomplete')) === 'new-password');
        await page.fill('#fNewUser', name); await page.fill('#fNewPass', 'short');
        await page.click('#fReg3Go');
        check('W8 a short password is refused in words', (await page.textContent('#fErr')) === 'The password needs at least 8 characters.');
        check('W8 the username typed stays after the error', (await page.inputValue('#fNewUser')) === name);
        await page.fill('#fNewPass', pw);
        await page.locator('#fAv4').check({ force: true });
        await page.click('#fReg3Go');
        await page.waitForSelector('#fMoveYes');
        check('W8 a device with records asks before moving them into the new account', /Move Student 1’s records on this device into your account\?/.test(await page.textContent('#frBody')), await page.textContent('#frBody'));
        await page.click('#fMoveYes');
        await page.waitForSelector('#fSignOut');
        const auth = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.auth')));
        const prof = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.profiles')));
        check('W8 signed in: the same student is now the account, records kept', auth.profile === 'p1' && prof.list.length === 1 && prof.list[0].account === name && (await page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p1')).length)) === 1, JSON.stringify(prof));
        check('W8 signed in: name, picture and friend code', (await page.textContent('.f-me-t b')) === name && (await page.textContent('.f-me .f-av')) === '🐰' && /Friend code [A-Z2-9]{3}-[A-Z2-9]{3}/.test(await page.textContent('.f-me-t')));
        // the sign-in uploads the records once (later changes follow a few seconds after they happen)
        let saved = null;
        for (let i = 0; i < 20 && !(saved && saved.data && saved.data.data); i++) { saved = await apiCall('GET', 'progress', undefined, auth.token); if (!(saved.data && saved.data.data)) await page.waitForTimeout(250); }
        check('W8 the records are in the account', saved.data && saved.data.data && saved.data.data.keys.history.length === 1, JSON.stringify(saved.data).slice(0, 200));
        check('W8 the token is never in the address or the page', !page.url().includes(auth.token) && !(await page.content()).includes(auth.token));
        await page.click('#fSignOut');
        await page.waitForSelector('#fLogin');
        const out = await page.evaluate(() => ({ auth: localStorage.getItem('sp.auth'), prof: JSON.parse(localStorage.getItem('sp.profiles')), hist: localStorage.getItem('sp.history.p1') }));
        check('W8 sign out: the account and its records leave this device; a new empty student is left', out.auth === null && out.hist === null && out.prof.list.length === 1 && !out.prof.list[0].account && out.prof.list[0].id !== 'p1', JSON.stringify(out));
        check('W8 sign out: the old session no longer works', (await apiCall('GET', 'me', undefined, auth.token)).status === 401);
        check('W8 sign out: the toast says the records are saved', /Signed out\. Your records are saved/.test(await page.textContent('#toast')));
        await page.fill('#fUser', name); await page.fill('#fPass', 'wrong-password');
        await page.click('#fLoginGo');
        check('W8 a wrong password is refused in words', await errShown(page, 'Wrong username or password.'), await page.textContent('#fErr'));
        await page.fill('#fPass', pw);
        await page.click('#fLoginGo');
        await page.waitForSelector('#fSignOut');
        const back = await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('sp.profiles')); return { n: p.list.length, acc: p.list.find(x => x.id === p.active).account, hist: (JSON.parse(localStorage.getItem('sp.history.' + p.active)) || []).length }; });
        check('W8 sign in again: the records come back into the empty student', back.n === 1 && back.acc === name && back.hist === 1, JSON.stringify(back));
        await page.click('.tab[data-go="home"]');
        check('W8 Home greets the account by its username', (await page.textContent('#helloText')).startsWith('Hi ' + name));
        // Chinese: the Friends page has no English words besides the username and the friend code
        await page.click('#langBtn');
        await page.click('.tab[data-go="friends"]');
        const zhText = (await page.textContent('#frBody')).split(name).join('').replace(/[A-Z2-9]{3}-[A-Z2-9]{3}/, '').replace(/\S+@\S+/g, '');
        check('W8 in Chinese the Friends page is all Chinese', !/[A-Za-z]{2,}/.test(zhText) && /好友码/.test(zhText), zhText.slice(0, 200));
        await page.click('#langBtn');
        // the account's student cannot be deleted in Students while it is signed in
        check('W8: no page errors', errors.length === 0, errors.join(' | '));
        await dropAccount((await page.evaluate(() => JSON.parse(localStorage.getItem('sp.auth')).token)), pw);
        await context.close();
      });

      await flow('v2.0 W8 friends and practising together', async () => {
        const na = tag(), nb = tag();
        const A = await makeAccount(na, 'pass-' + na, 1), B = await makeAccount(nb, 'pass-' + nb, 2);
        const pa = await signedInPage(A), pb = await signedInPage(B);
        await pa.page.click('.tab[data-go="friends"]');
        await pa.page.waitForSelector('#fWho');
        await pa.page.fill('#fWho', B.me.friendCode.toLowerCase().slice(0, 3) + '-' + B.me.friendCode.slice(3));
        await pa.page.click('#fAddGo');
        await pa.page.waitForSelector('.f-wait');
        check('W8 a request by friend code waits for the friend', (await pa.page.textContent('#fMsg')) === `Request sent to ${nb}.` && (await pa.page.textContent('.f-wait')).includes(`Waiting for ${nb} to accept`));
        await pb.page.evaluate(() => window.Friends.refresh());
        await pb.page.waitForSelector('#friendsDot:not([hidden])');
        check('W8 the friend sees a red dot with 1 on the Friends tab, and its name says so', (await pb.page.textContent('#friendsDot')) === '1' && (await pb.page.getAttribute('#navFriends', 'aria-label')) === 'Friends: 1 new');
        check('W8 Home says 1 waiting', (await pb.page.textContent('#friendsCta')).includes('1 waiting for you'));
        await pb.page.click('.tab[data-go="friends"]');
        check('W8 the request: name, Accept and Not now', (await pb.page.textContent('#frBody')).includes(`${na} wants to be your friend`));
        await pb.page.getByRole('button', { name: 'Accept' }).click();
        await pb.page.waitForSelector('#fFriendList .f-li');
        check('W8 after Accept they are friends, and the dot is gone', (await pb.page.textContent('#fFriendList')).includes(na) && (await pb.page.isHidden('#friendsDot')));
        await pa.page.evaluate(() => window.Friends.refresh());
        await pa.page.waitForSelector('#fFriendList button');
        check('W8 the first student sees the friend too', (await pa.page.textContent('#fFriendList')).includes(nb));
        // A practises together with B: 5 questions, then the set goes to B
        await pa.page.getByRole('button', { name: 'Practise together' }).click();
        check('W8 the panel says how it works and starts with 10 questions', (await pa.page.textContent('.f-send')).includes(`Then ${nb} gets exactly the same questions`) && (await pa.page.getAttribute('#fCount10', 'aria-pressed')) === 'true');
        await pa.page.click('#fCount5');
        await pa.page.click('#fSendGo');
        await pa.page.waitForSelector('#screen-quiz:not([hidden])');
        const qa = await answerSet(pa.page, [1]);
        await pa.page.waitForFunction(() => /^Sent to/.test(document.querySelector('#resVs').textContent));
        check('W8 the results say the set went to the friend', (await pa.page.textContent('#resVs')) === `Sent to ${nb}. You both see both scores when ${nb} has done it.` && (await pa.page.textContent('#resScore')) === 'You got 4 out of 5');
        check('W8 the challenge set is in the history like any set', (await pa.page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p1')).length)) === 1);
        // B does the same questions
        await pb.page.evaluate(() => window.Friends.refresh());
        await pb.page.waitForSelector('#friendsDot:not([hidden])');
        await pb.page.click('#fTabCh');
        check('W8 Waiting for you: from the friend, with their score', (await pb.page.textContent('#frBody')).includes(`From ${na}`) && (await pb.page.textContent('#frBody')).includes('they got 4/5'));
        await pb.page.getByRole('button', { name: 'Do it' }).click();
        await pb.page.waitForSelector('#screen-quiz:not([hidden])');
        const qb = await pb.page.evaluate(() => window.__testAnswers());
        check('W8 the friend gets exactly the same questions', JSON.stringify(qa) === JSON.stringify(qb));
        await answerSet(pb.page, [1, 2]);
        await pb.page.waitForSelector('#resVs #fCompare');
        const cmp = await pb.page.textContent('#resVs');
        check('W8 the friend sees both scores at once', cmp.includes(`⭐ ${na} won this time`) && cmp.includes('3/5') && cmp.includes('4/5') && cmp.includes(`${na} got question 3 right, and you did not.`), cmp);
        const dots = await pb.page.locator('#resVs .f-dots').first().locator('span').evaluateAll(s => s.map(x => x.className).join());
        check('W8 each question right or wrong, in order', dots === 'y,n,n,y,y', dots);
        check('W8 the comparison has no answers or worked solutions', !/Answer:|Worked solution/.test(cmp));
        await pb.page.click('#fSendBack');
        check('W8 Send a set back opens the panel for that friend', (await pb.page.textContent('.f-send h3')) === `Practise together with ${na}`);
        await pb.page.click('#fSendClose');
        // A sees the result in Finished
        await pa.page.click('.tab[data-go="friends"]');
        await pa.page.evaluate(() => window.Friends.refresh());
        await pa.page.click('#fTabCh');
        await pa.page.waitForSelector('text=Finished');
        check('W8 Finished: me 4 : 3 friend, with a trophy', (await pa.page.textContent('#frBody')).includes(`Me 4 : 3 ${nb}`) && (await pa.page.textContent('#frBody')).includes('🏆'));
        await pa.page.getByRole('button', { name: 'See' }).click();
        check('W8 See shows the comparison: You won', (await pa.page.textContent('#fCompare h3')) === '🏆 You won!');
        const wrap = await pa.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        check('W8 the comparison fits a 375 px phone', wrap);
        await pa.page.click('#fCmpBack');
        // remove the friend: a second tap confirms
        await pa.page.click('#fTabFriends');
        await pa.page.getByRole('button', { name: 'Practise together' }).click();
        await pa.page.click('#fRemove');
        check('W8 Remove asks first', (await pa.page.textContent('.f-confirm')).includes(`Remove ${nb} from your friends?`));
        await pa.page.click('#fRemoveYes');
        await pa.page.waitForSelector('text=No friends yet');
        check('W8 after removing, the list is empty', (await pa.page.locator('#fFriendList .f-li').count()) === 0);
        check('W8 friends: no page errors', pa.errors.length === 0 && pb.errors.length === 0, pa.errors.concat(pb.errors).join(' | '));
        await dropAccount(A.token, 'pass-' + na); await dropAccount(B.token, 'pass-' + nb);
        await pa.context.close(); await pb.context.close();
      });

      await flow('v2.0 W8 forgot password', async () => {
        const name = tag();
        const A = await makeAccount(name, 'pass-' + name);
        const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
        await page.click('.tab[data-go="friends"]');
        await page.click('#fForgot');
        await page.fill('#fForgotUser', name);
        await page.click('#fForgotGo');
        await page.waitForSelector('#fResetPass');
        check('W8 on the Test site the new password is typed at once (no email)', (await page.textContent('#fMsg')) === 'Test site: no email is sent. Type a new password here.');
        await page.fill('#fResetPass', 'new-pass-' + name);
        await page.click('#fResetGo');
        await page.waitForSelector('#fLogin');
        check('W8 after a reset: back to Sign in, the old session ends', /Password changed/.test(await page.textContent('#toast')) && (await apiCall('GET', 'me', undefined, A.token)).status === 401);
        await page.fill('#fUser', name); await page.fill('#fPass', 'new-pass-' + name);
        await page.click('#fLoginGo');
        await page.waitForSelector('#fSignOut');
        check('W8 the new password signs in', (await page.textContent('.f-me-t b')) === name);
        // the reset link from an email opens the same form
        const r = await apiCall('POST', 'reset', { username: name });
        const p2 = await page.context().newPage();
        await p2.goto(site + '?reset=' + r.data.devToken);
        await p2.waitForSelector('#fResetPass');
        check('W8 a reset link opens Set a new password, and the token leaves the address', !p2.url().includes('reset='), p2.url());
        await p2.close();
        check('W8 forgot: no page errors', errors.length === 0, errors.join(' | '));
        await dropAccount(await page.evaluate(() => JSON.parse(localStorage.getItem('sp.auth')).token), 'new-pass-' + name);
        await context.close();
      });

      await flow('v2.0 W8 no connection', async () => {
        const name = tag();
        const A = await makeAccount(name, 'pass-' + name);
        const { context, page, errors } = await signedInPage(A);
        await page.click('.tab[data-go="friends"]');
        await page.waitForSelector('#fSignOut');
        await context.route('**/api/**', route => route.abort());
        await page.evaluate(() => { const h = JSON.parse(localStorage.getItem('sp.history.p1') || '[]'); h.push({ date: Date.now(), n: 1, correct: 1 }); localStorage.setItem('sp.history.p1', JSON.stringify(h)); });
        await page.evaluate(() => window.Friends.changed('sp.history.p1'));
        await page.click('#fSignOut');
        await page.waitForSelector('#fOutAnyway');
        check('W8 offline sign-out warns that the latest records would be lost, and stays signed in', (await page.textContent('.f-confirm')).includes('could not be saved') && !!(await page.evaluate(() => localStorage.getItem('sp.auth'))));
        await page.click('text=Stay signed in');
        await context.unroute('**/api/**');
        await page.click('#fSignOut');
        await page.waitForSelector('#fLogin');
        const saved = await apiCall('POST', 'login', { username: name, password: 'pass-' + name });
        const prog = await apiCall('GET', 'progress', undefined, saved.data.token);
        check('W8 back online, Sign out saves the records first', prog.data.data && prog.data.data.keys.history.length === 1, JSON.stringify(prog.data).slice(0, 120));
        check('W8 offline: no page errors', errors.length === 0, errors.join(' | '));
        await dropAccount(saved.data.token, 'pass-' + name);
        await context.close();
      });

      /* R1.1 (v2.0.0): one account on a phone and a tablet */
      const addSet = (page, date) => page.evaluate(d => {
        const h = JSON.parse(localStorage.getItem('sp.history.p1') || '[]');
        h.push({ date: d, subject: 'maths', year: 5, topic: 'mixed', diff: 2, n: 5, correct: 4, stars: 2, byTopic: {}, wrong: [] });
        localStorage.setItem('sp.history.p1', JSON.stringify(h)); window.Friends.changed('sp.history.p1');
      }, date);
      const localDates = page => page.evaluate(() => (JSON.parse(localStorage.getItem('sp.history.p1') || '[]')).map(h => h.date));
      const serverDates = async token => { const r = await apiCall('GET', 'progress', undefined, token); return ((r.data && r.data.data && r.data.data.keys.history) || []).map(h => h.date); };
      await flow('v2.0 R1.1 one account on two devices keeps the records of both', async () => {
        const name = tag(), pw = 'pass-' + name;
        const A = await makeAccount(name, pw), A2 = (await apiCall('POST', 'login', { username: name, password: pw })).data;
        const phone = await signedInPage(A), tablet = await signedInPage(A2);
        const t0 = Date.now() - 3 * 3600e3;
        await addSet(phone.page, t0); check('R1.1 the phone saves its set', await phone.page.evaluate(() => window.Friends.upload()));
        await addSet(tablet.page, t0 + 1000); check('R1.1 the tablet saves its own set on top (merged, not replaced)', await tablet.page.evaluate(() => window.Friends.upload()));
        check('R1.1 the server has both sets', JSON.stringify(await serverDates(A.token)) === JSON.stringify([t0, t0 + 1000]), JSON.stringify(await serverDates(A.token)));
        await addSet(phone.page, t0 + 2000); await phone.page.evaluate(() => window.Friends.upload());
        check('R1.1 the phone\'s next set adds to both, and the phone now has all three', JSON.stringify(await serverDates(A.token)) === JSON.stringify([t0, t0 + 1000, t0 + 2000]) && (await localDates(phone.page)).length === 3, JSON.stringify(await serverDates(A.token)));
        await tablet.page.evaluate(() => window.Friends.pull());
        check('R1.1 the tablet reads the phone\'s sets when it comes back to the screen', JSON.stringify(await localDates(tablet.page)) === JSON.stringify([t0, t0 + 1000, t0 + 2000]), JSON.stringify(await localDates(tablet.page)));
        // a set made on the tablet while its session had ended is merged at the next sign-in, not overwritten
        await tablet.page.evaluate(() => { const a = JSON.parse(localStorage.getItem('sp.auth')); a.token = null; localStorage.setItem('sp.auth', JSON.stringify(a)); });
        await tablet.page.reload(); await tablet.page.waitForSelector('#helloText');
        await addSet(tablet.page, t0 + 3000);
        await tablet.page.click('.tab[data-go="friends"]');
        await tablet.page.fill('#fUser', name); await tablet.page.fill('#fPass', pw); await tablet.page.click('#fLoginGo');
        await tablet.page.waitForSelector('#fSignOut');
        let after = [];
        for (let i = 0; i < 20 && after.length < 4; i++) { after = await serverDates(A.token); if (after.length < 4) await tablet.page.waitForTimeout(250); }
        check('R1.1 after signing in again, the set made meanwhile is added to the account', JSON.stringify(after) === JSON.stringify([t0, t0 + 1000, t0 + 2000, t0 + 3000]), JSON.stringify(after));
        check('R1.1: no page errors', phone.errors.length === 0 && tablet.errors.length === 0, phone.errors.concat(tablet.errors).join(' | '));
        await dropAccount(A.token, pw);
        await phone.context.close(); await tablet.context.close();
      });

      /* R1.8 (v2.0.0): a session that ends by itself on a shared computer */
      await flow('v2.0 R1.8 a session ended elsewhere takes the saved records off this device', async () => {
        const name = tag(), pw = 'pass-' + name;
        const A = await makeAccount(name, pw);
        const { context, page, errors } = await signedInPage(A);
        await addSet(page, Date.now() - 60e3); await page.evaluate(() => window.Friends.upload());
        const r = await apiCall('POST', 'reset', { username: name });   // a password reset ends every session
        await apiCall('POST', 'reset/finish', { token: r.data.devToken, password: pw + '2' });
        await page.click('.tab[data-go="friends"]');
        await page.evaluate(() => window.Friends.refresh());
        await page.waitForSelector('#fLogin');
        const left = await page.evaluate(() => ({ auth: localStorage.getItem('sp.auth'), prof: JSON.parse(localStorage.getItem('sp.profiles')), hist: localStorage.getItem('sp.history.p1') }));
        check('R1.8 everything was saved, so the account and its records leave this device', left.auth === null && left.hist === null && !left.prof.list.some(p => p.account), JSON.stringify(left));
        check('R1.8 the sign-in box is empty (no earlier username)', (await page.inputValue('#fUser')) === '');
        check('R1.8 it says to sign in again', await errShown(page, 'Please sign in again.'), await page.textContent('#fErr'));
        // unsaved records stay (they would be lost otherwise) until that account signs in again
        const B = await makeAccount(tag(), 'pass-b-' + name);
        const p2 = await signedInPage(B);
        await addSet(p2.page, Date.now() - 30e3);   // its save waits 4 s; the session ends before that
        await apiCall('POST', 'logout', {}, B.token);
        await p2.page.click('.tab[data-go="friends"]');
        await p2.page.evaluate(() => window.Friends.refresh());
        await p2.page.waitForSelector('#fLogin');
        const kept = await p2.page.evaluate(() => (JSON.parse(localStorage.getItem('sp.history.p1') || '[]')).length);
        check('R1.8 records not saved yet are kept on the device', kept === 1, String(kept));
        check('R1.8: no page errors', errors.length === 0 && p2.errors.length === 0, errors.concat(p2.errors).join(' | '));
        await dropAccount((await apiCall('POST', 'login', { username: name, password: pw + '2' })).data.token, pw + '2');
        await dropAccount((await apiCall('POST', 'login', { username: B.me.username, password: 'pass-b-' + name })).data.token, 'pass-b-' + name);
        await context.close(); await p2.context.close();
      });

      /* R1.2 (v2.0.0): a set the app cannot draw */
      await flow('v2.0 R1.2 a friend\'s set the app cannot draw is refused in words', async () => {
        const na = tag(), nb = tag();
        const A = await makeAccount(na, 'pass-' + na, 1), B = await makeAccount(nb, 'pass-' + nb, 2);
        await apiCall('POST', 'friends/add', { who: nb }, A.token);
        await apiCall('POST', 'friends/answer', { username: na, accept: true }, B.token);
        const good = [{ q: { en: '1 + 1 = ?', zh: '1 + 1 = ?' }, type: 'input', value: 2, answer: '2', topic: 'add' }];
        const sent = await apiCall('POST', 'challenges', { to: nb, settings: { subject: 'maths', year: 5, topic: 'mixed', diff: 2, count: 1 }, questions: good, score: { ok: [true] } }, A.token);
        const refused = await apiCall('POST', 'challenges', { to: nb, settings: { subject: 'maths', count: 1 }, questions: [{ type: 'input' }], score: { ok: [true] } }, A.token);
        check('R1.2 the server refuses a set with a question of the wrong shape', refused.status === 400 && refused.data.error === 'bad_set', JSON.stringify(refused));
        const pb = await signedInPage(B);
        // an older or broken client could still have stored one: the answer is changed on its way to the app
        await pb.page.route('**/api/challenges/' + sent.data.id, async route => {
          const res = await route.fetch(); const body = await res.json(); body.questions = [{ type: 'input' }];
          await route.fulfill({ response: res, json: body });
        });
        await pb.page.click('.tab[data-go="friends"]');
        await pb.page.waitForSelector('#fTabCh');
        await pb.page.click('#fTabCh');
        await pb.page.getByRole('button', { name: 'Do it' }).click();
        await pb.page.waitForFunction(() => /cannot be opened/.test(document.querySelector('#toast').textContent));
        const st = await pb.page.evaluate(() => ({ quiz: !document.querySelector('#screen-quiz').hidden, friends: !document.querySelector('#screen-friends').hidden, nav: document.querySelector('.bottom-nav').getBoundingClientRect().height }));
        check('R1.2 the friend stays on Friends with the bottom bar, and the toast says why', !st.quiz && st.friends && st.nav > 40 && (await pb.page.textContent('#toast')) === 'This set cannot be opened in this version of the app. Ask your friend to send a new one.', JSON.stringify(st));
        check('R1.2: no page errors', pb.errors.length === 0, pb.errors.join(' | '));
        await dropAccount(A.token, 'pass-' + na); await dropAccount(B.token, 'pass-' + nb);
        await pb.context.close();
      });
    }

    // R3.8 (v1.12.0): a browser with no <dialog> at all: the sheet opens, and ✕ and Escape close it
    await flow('R3.8 the sheet closes without the dialog API', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() }, () => {
        delete HTMLDialogElement.prototype.showModal; delete HTMLDialogElement.prototype.close;
        Object.defineProperty(HTMLDialogElement.prototype, 'open', { configurable: true, get() { return undefined; }, set() {} });
      });
      const shown = () => page.locator('#setupDlg').evaluate(d => d.hasAttribute('open'));
      await page.click('#cardPractice');
      check('R3.8 the card opens the sheet', await shown());
      await page.click('#setupClose');
      check('R3.8 ✕ closes it', !(await shown()));
      await page.click('#cardPractice');
      await page.keyboard.press('Escape');
      check('R3.8 Escape closes it', !(await shown()));
      await page.click('#cardPractice');
      await page.click('#startBtn');
      check('R3.8 Start starts a set and the sheet is gone', (await visible(page, '#screen-quiz')) && !(await shown()));
      check('R3.8: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // R3.6 (v1.12.0): Carry on with a Year 5 set keeps a Year 8 student's High school year
    await flow('R3.6 the other school keeps its year', async () => {
      const { context, page, errors } = await freshPage(browser, site, {
        [SETTINGS]: settings({ year: 8 }),
        'sp.history.p1': JSON.stringify([{ date: Date.now(), subject: 'maths', year: 5, topic: 'mixed', diff: 2, n: 5, correct: 4, stars: 2, byTopic: {}, wrong: [] }])
      });
      await page.click('#carryOn');
      await page.keyboard.press('Escape');
      const st = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), SETTINGS);
      check('R3.6 Carry on moves to Year 5 and remembers Year 8 for High school', (await st()).year === 5 && (await st()).highYear === 8, JSON.stringify(await st()));
      await page.click('#schoolSwitch [data-school="high"]');
      check('R3.6 High school brings back Year 8', (await st()).year === 8, JSON.stringify(await st()));
      check('R3.6: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
  } finally {
    await browser.close();
  }
  return { pass, fail };
}

module.exports = { run };
