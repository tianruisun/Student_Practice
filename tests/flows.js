/* Browser flow tests: what a student and a parent actually do, past the home screen.
   Each flow runs in a fresh browser profile with made-up data only, so it is safe against Test and Production too. */
const { launch } = require('./smoke.js');

const SETTINGS = 'sp.settings.p1';
const PIN = '2468';

/* initScript: code run in the page before the app (e.g. to make storage fail).
   options.tour: leave the first-visit guided tour (v1.8.0) on. Otherwise it is marked as seen before the app runs, so
   it does not cover the screen in flows that test something else. */
async function freshPage(browser, site, seed, initScript, options = {}) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, ...options.context });
  context.setDefaultTimeout(20000);   // no single step may wait longer than 20 s
  if (!options.tour) await context.addInitScript(() => { try { if (localStorage.getItem('sp.tour') === null) localStorage.setItem('sp.tour', '"done"'); } catch (e) { /* blocked */ } });
  if (initScript) await context.addInitScript(initScript);
  if (options.route) await context.route('**/*', options.route);   // e.g. answer one file with 404
  const page = await context.newPage();
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

async function run(site) {
  let pass = 0, fail = 0;
  const check = (name, ok, detail) => { ok ? pass++ : fail++; if (!ok) console.log('FAIL flows:', name, detail === undefined ? '' : detail); };
  // one flow failing (e.g. a step timing out) is one failure; the other flows still run
  const flow = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': finished', false, e.message.split('\n')[0]); } };
  const browser = await launch();
  try {
    // 1. Practice: start a set of 5, finish with nothing answered, results and review appear.
    //    F.8: a worked method asks for the parent PIN and stays closed when the student cancels.
    await flow('practice', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await page.click('#startBtn');
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
      await page.click('#parentBtn');
      await typePin(page);
      check('parent: PIN opens Parent settings', await visible(page, '#screen-parent'));
      check('F.8 no switch that opens methods for students', (await page.locator('#methodsToggle').count()) === 0);
      await context.close();
    });

    // 3. F.1: "Forgot PIN" erases this app's data (progress, PIN, key) and keeps the language.
    await flow('F.1 forgot PIN', async () => {
      const { context, page } = await freshPage(browser, site, {
        'sp.pin': JSON.stringify({ salt: 'x', hash: 'y' }), 'sp.history.p1': '[{"n":1,"correct":1}]',
        'sp.ai': '{"provider":"claude","key":"made-up-test-key"}', 'sp.lang': 'en', 'other-app.data': 'keep'
      });
      await page.click('#parentBtn');
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
      await page.click('#startBtn');
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
        await page.click(k ? '#againBtn' : '#startBtn').catch(() => {});
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
      await page.click('#startBtn');
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
      const h = await page.evaluate(() => document.querySelector('#heroStart').getBoundingClientRect().height);
      check('F.13 Get started button is at least 44 px tall', h >= 44, h);
      await context.close();
    });

    // v1.7.0: the answer hint sits behind an info icon: hidden until hover, focus or tap
    await flow('v1.7 info tip', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await page.click('#startBtn');
      const wrap = page.locator('#qList .info').first(), tip = wrap.locator('.tip');
      check('v1.7 hint is not shown as a line of text', !(await page.locator('#qList p').filter({ hasText: 'Fractions like' }).count()));
      check('v1.7 hint hidden until asked', (await tip.evaluate(e => getComputedStyle(e).visibility)) === 'hidden');
      await wrap.locator('.info-btn').hover();
      check('v1.7 hint shows on hover', (await tip.evaluate(e => getComputedStyle(e).visibility)) === 'visible');
      check('v1.7 hint text', /3\/4/.test(await tip.textContent()), await tip.textContent());
      await page.mouse.move(5, 5);
      await wrap.locator('.info-btn').click();
      check('v1.7 hint shows on tap', (await wrap.getAttribute('class')).includes('open') && (await tip.evaluate(e => getComputedStyle(e).visibility)) === 'visible');
      const box = await tip.boundingBox();
      check('v1.7 hint stays on a 375 px screen', box && box.x >= 0 && box.x + box.width <= 375, JSON.stringify(box));
      await context.close();
    });

    // v1.7.0: a fast, all-correct, first-try set earns Perfect, First try and Speed at its own level
    await flow('v1.7 badges earned', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 4, diff: 1 }) });
      await page.click('#startBtn');
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
      await page.click('#parentBtn');
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
      await page.click('#parentBtn');
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
      await page.click('#parentBtn');
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
      for (const n of [0, -1, -3]) {
        await page.fill('.profile-edit input[type=month]', dobFor(n));
        check(`R6.3 no hint for an age before Year 1 (${n})`, !(await hint.isVisible()), dobFor(n));
      }
      await page.fill('.profile-edit input[type=month]', dobFor(1));
      check('R6.3 hint for Year 1', await hint.isVisible() && /Year 1\./.test(await hint.textContent()), await hint.textContent());
      check('R6.3 R6.4 no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // R6.1 (v1.7.0): a year picked on Home before any suggestion exists is kept when one appears
    await flow('R6.1 a year picked before any suggestion', async () => {
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Eve' }], active: 'p1' });
      const { context, page, errors } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings() });
      await page.selectOption('#schoolSel', 'high');
      await page.selectOption('#yearSel', '8');
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
      await page.click('#parentBtn');
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
      for (let k = 1; k <= 11; k++) {
        await page.waitForTimeout(400);   // the highlight slides to its part in 0.25 s
        const r = await page.evaluate(() => {
          const sels = [null, '#profileBtn', '#langBtn', '#parentBtn', '#subjectChips', '#practiceOptions', '#startBtn', '#printHome', '.tab[data-go="progress"]', '#navParent', '#tourBtn'];
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
      // the ? button opens it again; Escape closes it and gives focus back to ?
      await page.click('#tourBtn');
      check('tour: ? opens it again at step 1', (await tourOpen()) && /^Step 1 /.test(await page.textContent('#tourStep')));
      await page.keyboard.press('ArrowRight');
      check('tour: the right arrow key goes to the next step', /^Step 2 /.test(await page.textContent('#tourStep')));
      await page.keyboard.press('Escape');
      check('tour: Escape closes it', !(await tourOpen()));
      check('tour: focus goes back to ?', (await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'tourBtn');
      check('tour: ? has a name for screen readers', (await page.getAttribute('#tourBtn', 'aria-label')) === 'Show the guide');
      // Chinese
      await page.click('#langBtn');
      await page.click('#tourBtn');
      check('tour: Chinese text in Chinese', (await page.textContent('#tourTitle')) === '欢迎！' && (await page.textContent('#tourNext')) === '下一步', await page.textContent('#tourTitle'));
      await page.click('#tourSkip');
      check('tour: Skip closes it', !(await tourOpen()));
      await page.click('#langBtn');
      // never during a set: ? is hidden while a quiz is open, and back on Home
      await page.click('#startBtn');
      check('tour: ? is hidden during a set', !(await page.isVisible('#tourBtn')));
      await page.click('#quitBtn');
      check('tour: ? is back on Home', await page.isVisible('#tourBtn'));
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
      await page.click('#parentBtn');
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
        await page.click('#tourBtn');
        const out = [];
        for (let k = 0; k < 12 && (await tourOpen(page)); k++) {
          out.push({ step: await page.textContent('#tourStep'), title: await page.textContent('#tourTitle'), text: await page.textContent('#tourText'),
            hole: await page.evaluate(() => { const h = document.querySelector('.tour-hole'); return h.classList.contains('none') ? 0 : h.getBoundingClientRect().width; }) });
          await page.click('#tourNext');
        }
        return out;
      };
      for (const [subject, btn, total] of [['maths', 'Start practice', 11], ['sel', 'Start test', 10], ['comp', 'Start paper', 10]]) {
        const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings({ subject }) });
        const steps = await walk(page);
        const start = steps.find(s => s.title === 'Start') || {};
        check(`R1.1 ${subject}: ${total} steps`, steps.length === total && steps[0].step === `Step 1 of ${total}`, steps.length + ' / ' + (steps[0] || {}).step);
        check(`R1.1 ${subject}: practice options step only when shown`, steps.some(s => s.title === 'Set up your practice') === (subject === 'maths'));
        check(`R1.1 ${subject}: Start step names the button "${btn}"`, (start.text || '').startsWith(`Tap ${btn} to begin`) && (await page.textContent('#startBtn')) === btn, start.text);
        check(`R1.1 ${subject}: every step but the first highlights something`, steps.slice(1).every(s => s.hole > 0), steps.map(s => s.hole).join(','));
        if (subject === 'sel') {
          await page.click('#langBtn');
          const zh = (await walk(page)).find(s => s.title === '开始') || {};
          check('R1.1 sel: Chinese Start step names 开始考试', (zh.text || '').startsWith('点“开始考试”'), zh.text);
        }
        check(`R1.1 ${subject}: no page errors`, errors.length === 0, errors.join(' | '));
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
        await page.click('#tourBtn');
        check('R1.3 no tour.js: Home still works', await visible(page, '#startBtn'));
        check('R1.3 no tour.js: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
      {
        const { context, page, errors } = await freshPage(browser, site, null, () => { delete HTMLDialogElement.prototype.showModal; }, { tour: true });
        await page.waitForTimeout(300);
        await page.click('#tourBtn');
        check('R1.3 no showModal: no tour dialog left behind', (await page.locator('#tourDlg').count()) === 0);
        check('R1.3 no showModal: Home still works', await visible(page, '#startBtn'));
        check('R1.3 no showModal: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
    });

    // v1.8.0 R2 findings: the tour goes back to the screen it was opened from, so Results is not lost (R2.1); the keys
    // that are not a student's data are one list, kept by a Forgot-PIN erase and ignored by the first-visit rule (R2.2)
    await flow('v1.8.0 tour R2 fixes', async () => {
      const tourOpen = page => page.evaluate(() => { const d = document.querySelector('#tourDlg'); return !!d && d.open; });
      {
        const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
        await page.click('#startBtn');
        await page.click('#finishBtn');
        const score = await page.textContent('#resScore');
        await page.click('#tourBtn');
        check('R2.1 ? on Results: the tour shows Home', (await tourOpen(page)) && (await visible(page, '#screen-home')));
        await page.keyboard.press('Escape');
        check('R2.1 Escape: back on Results', (await visible(page, '#screen-results')) && !(await visible(page, '#screen-home')));
        check('R2.1 Escape: same score and review', (await page.textContent('#resScore')) === score && (await page.locator('#resList > li').count()) === 5, score);
        await page.click('#tourBtn');
        for (let k = 0; k < 12 && (await tourOpen(page)); k++) await page.click('#tourNext');
        check('R2.1 Done: back on Results', (await visible(page, '#screen-results')) && (await page.textContent('#resScore')) === score);
        check('R2.1 Results: no page errors', errors.length === 0, errors.join(' | '));
        await context.close();
      }
      {
        const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
        await page.click('.tab[data-go="progress"]');
        await page.click('#tourBtn');
        await page.click('#tourSkip');
        check('R2.1 ? on Progress: Skip goes back to Progress', await visible(page, '#screen-progress'));
        await page.click('.tab[data-go="home"]');
        await page.click('#tourBtn');
        await page.click('#tourSkip');
        check('R2.1 ? on Home: stays on Home', await visible(page, '#screen-home'));
        check('R2.1 Progress: no page errors', errors.length === 0, errors.join(' | '));
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
        await page.click('#parentBtn');
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
  } finally {
    await browser.close();
  }
  return { pass, fail };
}

module.exports = { run };
