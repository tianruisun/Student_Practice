# Maths & Reasoning · 数学与思维 (Kindergarten–Year 12, Extension 1 & 2)

A mobile-first, installable maths and reasoning practice web app (PWA) for students in Years 1 to 12, including NSW HSC Extension 1 and 2.
Plain HTML/CSS/JS – no frameworks, no build step, relative paths only – so it runs on GitHub Pages as-is.

## Features

- **Study first (v1.10.0):** a 📖 Study card on Home (maths) opens lessons that follow the **NSW K–6 scope and sequence**. Pick Kindergarten or Year 1–6, then a topic grouped by strand (Number and algebra; Measurement and space; Statistics and probability). Each lesson says what is new this year and has an introduction, key ideas, worked examples and a tip, in English and Chinese; a read lesson is marked ✓. **Practise this topic** starts a set on that topic at the student's difficulty and length, and **Next topic** opens the next lesson. Home also offers "Study this topic first" for a K–6 topic. Kindergarten to Year 6 maths now lists the 11 K–6 topics (Kindergarten has 9: no word problems or chance), plus Competition problems from Year 1. Lessons are in `js/lessons-k2.js` and `js/lessons-36.js`, the topic map in `js/scope-k6.js`, and Kindergarten and other new question types in `js/gen-k6.js`.
- **Mini games (Games tab):** the bottom bar has a **Games** tab next to Students, with a list of mini games. The first is **Times-table balloons** (1×1 to 9×9): balloons with a gift hanging below rise from the bottom and fly away off the top, each with a question. Type the answer on the big number pad (or a keyboard) and tap 🏹 to shoot it for a point; a wrong answer locks the bow for 1.5 seconds with a warning. One minute a round; balloons start slow and one at a time and end fast with up to five at once. Each student's best score is kept on this device (`js/game-balloons.js`).
  - **Maths Sudoku** (`js/game-sudoku.js`): Easy 4×4, Medium 6×6, Hard 9×9. Every puzzle has exactly one answer. Tap a square, then a number; clashes in a row, column or box show in red. The best finishing time is kept for each level.
  - **Money Master** (`js/game-money.js`): work out the change in Australian dollars, five questions a round. Easy: one item in whole dollars paid with $10 or $20; Medium: one or two items to the 5 cents paid with $20 or $50; Hard: two or three items paid with $50 or $100. Notes show in their colours; there are no 1c or 2c coins, so every amount is a multiple of 5c. A right answer shows the change as notes and coins. The best time is kept for each level.
  - **Broken Calculator** (`js/game-broken.js`): a calculator screen shows a sum with broken digits (■); type the missing digits and press =. Each sum has exactly one answer and they get harder as the score goes up. Three minutes; the best number right is kept.
  - **Use all the numbers** (`js/game-numbers.js`): fifteen kinds of card, the digits 0–9 and + − × ÷ =. Round 1 deals the cards of one true equation, mixed up (e.g. 4, +, 5, =, 9); each round adds the cards of one more. Tap a row, then cards, to build the equations; digits side by side make one number (1 then 2 is 12). Every row must be true and every card used. The first round that is not right ends the game and shows one way to do it; the best is the most rounds passed (ten rounds in all).
  The four share one screen and `js/game-kit.js` (clock, keypad).
- **Guided tour (first visit):** the first time a browser opens the app, a short tour dims the page and highlights each part of Home in turn (students, language, parent lock, subjects, practice options when the subject has them, Start, Print, Progress, Settings) with one line on what it is for. Next / Back / Skip, arrow keys and Escape work; it is shown once (earlier users who already have data are not shown it), and the **?** button in the header replays it at any time (`js/tour.js`).
- **Two subjects** (toggle on Home):
  - **Maths** – typed answers. Levels follow **China (人教版) and Singapore (MOE)** expectations for each year, which are noticeably harder than Australian/UK ones. 22 topics, including 简便计算 (clever calculation), 数论 (number theory), 找规律 (sequences), equations, simultaneous equations, quadratics, π = 3.14 circle/cylinder/cone work, and trigonometry.
  - **应用题 word problems**: classic types (和差, 和倍, 差倍, 鸡兔同笼, 植树, 年龄, 相遇/追及, 火车过桥, 工程, 盈亏, 浓度, 利润折扣, Singapore before/after fractions and transfer problems, equation and simultaneous-equation problems, quadratic area problems). About 1 in 3 questions in a Mixed maths set is a word problem; the worked solution shows the equation.
  - **General ability (综合能力)** – multiple choice: number series, letter series, codes, logical reasoning (ordering, calendars, truth-tellers, knights and knaves), symbol puzzles, visual patterns, spatial reasoning and counting. Puzzles avoid wordplay so both languages ask exactly the same question.
- **Stars and badges:** results show 3 stars for 100% (plus a **Good job badge** added to the student's profile), 2 stars for 80–99% (aim for 100% next time), 1 star for 60–79% (aim higher next time) and none below 60% (learn the methods first, then try again). Badges show on the avatar and in Progress; recent sessions show their stars.
- **Badges to collect:** 🏅 Perfect (100%), 🎯 First try (100% with no second tries) and ⚡ Speed (100% within 20 / 30 / 60 / 90 seconds a question for Core / Standard / Advanced / Challenge); First try and Speed need 5 or more questions. Every subject, year and difficulty has its own set, shown as a grid in Progress (`js/records.js`). Hovering over or tapping 🏅, 🎯 or ⚡ in the grid explains how to earn that badge.
- **Review with worked methods:** after a session (and under Progress → Review), every question has a **Show method** panel with the worked solution set out step by step. A worked method usually shows the answer, so students need a parent to type the PIN before it opens. Under Progress, **Done – remove** takes a reviewed question off the list (with Undo); it is kept in the history.
- **Submit in one go:** **Check answer** on each question is optional. **See results** marks every answer chosen or typed but not checked (as a first try), and reminds the student about any question still blank (Cancel goes back to it). One wrong **Check** costs the 🎯 First try badge for that set.
- **Practise similar questions:** tick ✓ any question answered incorrectly, choose how many similar questions to make for each one (1, 2, 3, 5 or 10), and start a reinforcement set. Each question remembers where it came from, so similar questions use the same problem type with new numbers: the same competition or Selective template, or the same topic generator, keeping the candidates that read most like the original. Sets are capped at 50 questions.
- **New look:** greeting header with the student's avatar, a hero banner, subject tiles with icons, a bottom navigation bar with a centre Start button, and a soft lavender and violet theme (Poppins font, dark mode included).
  - **Competition (数学竞赛)** – timed papers in the style of the Australian Mathematics Competition, one per division: Middle Primary (Years 3–4), Upper Primary (5–6), Junior (7–8), Intermediate (9–10), Senior (11–12). Each has **30 questions**: Q1–25 multiple choice A–E, Q26–30 whole-number answers 0–999. Primary papers take 60 minutes and secondary papers 75. Marks are 3/4/5 and then 6–10, for 135 in total. There is also an **AIMO-style olympiad paper**: 10 questions, whole-number answers, 4 hours, 35 marks. Half papers are available. Results show marks as well as the number correct.
  - **Selective test (选拔考试模拟)** – a timed practice paper in the style of the NSW Selective High School Placement Test – Mathematical Reasoning, modelled on the published practice tests: **35 questions in 40 minutes** (or a half test, 18 questions in 20 minutes), five options A–E, no calculator, easier → harder. Countdown timer, a grid to jump between questions, the ability to change answers, and automatic marking when time runs out. Results show the score, time used, time per question and a breakdown by area (number, measurement, space, statistics, problem solving). About 60 question types, randomised every time; questions that need a diagram in the real papers (nets, rotations, folding) are not included.
- **Charts and diagrams:** Selective-test questions include column graphs, line graphs, pictographs, scale dials, measuring jugs, clocks, spinners, labelled shapes, square-grid shapes and magic-square tables, drawn as crisp SVG with labels in both languages (`js/figures.js`).
- **Two views:** answer **one question at a time**, or switch to **Pages** to see five questions per screen (works for practice sets and the timed test).
- **Print on A4:** a Print button (on Home, in a quiz and on Results) lays the questions out as an A4 worksheet with name/date/score fields, figures and A–E options or answer lines. Optionally adds an **answer key with worked solutions on a separate page** (needs the parent PIN). Use the browser's print window to print or “Save as PDF”.
- **Modern look** with automatic dark mode.
- **Years 1–12, Extension 1 (3U) and Extension 2 (4U)**, chosen with two combo boxes: **School** (Primary / High school) and **Year**. Years 1–3 have counting, adding, times tables, shapes, telling the time (clock faces), money, simple fractions and picture graphs; Years 11–12 have functions, exponentials and logs, trigonometry, calculus, series and probability; 3U adds combinatorics, polynomials, vectors and inverse trig; 4U adds complex numbers, integration and mechanics.
- **Wide difficulty spread:** Core and Standard follow the school level (China/Singapore standards); **Advanced** is tutoring-centre extension level and **Challenge** is olympiad level: in high school most Challenge problems come from an AMO-style bank. These adapt Australian Mathematical Olympiad problems (n! + c = 2ᵏ, f(f(n)) = 3n, a³ + b³ = 2ᶜ, tiling counts, take-away games and more) so that each has a single whole-number answer that can be marked automatically. Advanced/Challenge sets draw on a bank of competition problems for every school band (`js/gen-olympiad.js`) whose answers are computed by brute force, so they are always correct. AI questions are asked for the same levels.
- **More charts:** Graphs & data and Geometry diagrams topics (Years 4–10), clock and picture-graph questions (Years 1–3), coordinate-grid and triangle diagrams (senior), and pie charts, coordinate grids and travel graphs in the Selective test.
- **Clear progress** button on the Progress screen (protected by the parent PIN).
- **Progress file:** Parent settings → Export CSV saves the chosen student's sessions, badges and details; Import CSV adds such a file to the chosen student (no duplicates, nothing deleted). The file opens in a spreadsheet; its last column holds each record in full so an import restores it exactly.
- **Up to 3 student profiles** per device (👤 button in the header): each has its own progress and settings; deleting a profile needs the parent PIN. Each student can have a school year and a birth month (✎ in the Students list); they set the default year on Home. The school year moves up by itself each new year; with only a birth month, the NSW school-start rule is used. A year picked by hand on Home is always kept; the default only moves Home while Home still shows it. When the birth month gives a different school year from the one entered, the details form says so and offers a "Use Year N" button (only for ages in Years 1–12); nothing changes until Save.
- **Move freely between questions** in both views (Previous / Next / question grid); finish at any time — unanswered questions count as wrong.
- **Formulas look like maths:** stacked fractions, superscript powers, and the expression of “Work out / Solve / Evaluate” questions in a large formula box (on screen, in reviews and in print).
- **Number of questions:** 1, 5, 10, 15, 20 or a custom number (1–50).
- **Editable AI prompt:** Parent settings show the built-in prompt for Maths, General ability and the Selective test; parents can edit it (with {placeholders}) or reset it. Answer-format rules are always added so the app can read the reply. The default prompt asks for descriptive, real-world questions.
- **Four difficulty levels:** Core 基础 · Standard 提高 · Advanced 拓展（培优）· Challenge 挑战（奥赛）.
- **Screens:** Home (subject, year, topic or Mixed, difficulty, number of questions) → Quiz → Results, plus Progress and Parent settings.
- **Bilingual:** English and Simplified Chinese. All interface text is in `js/i18n.js`. The 中文/EN button switches instantly, without reloading or losing the current question, the typed answer or the selected option. The choice is remembered.
- **Answer checking** (`js/checker.js`): ignores spaces; accepts equivalent fractions (6/8 = 3/4), mixed numbers (1 1/2), `3分之2`, full-width (Chinese keyboard) digits, `x = 5`; allows a small tolerance for decimals (2/3 ≈ 0.67); accepts units if present (`24 cm²`, `24平方厘米`, `$12.50`, `72°`) but rejects the wrong unit.
- **Tries:** two tries for typed answers, one for multiple choice. The student only sees right/wrong.
- **Answers stay hidden from students.** Correct answers and worked solutions show only in parent mode (4-digit PIN, created the first time 🔒 Parent is tapped). The PIN is a child lock, not strong security.
- **Questions:** built-in offline generators, or **Claude** / **DeepSeek** with your own API key (Parent settings). The AI is told to use China/Singapore levels, to include word problems, and (for General ability) to write 4-option questions that translate faithfully. Every AI question is validated; if the AI fails or is offline, the built-in generator is used automatically.
- **Progress:** sessions, accuracy, accuracy by topic, recent sessions, and questions to review. Stored only in this browser.
- **PWA:** manifest, icons (incl. maskable and Apple touch icon), and a service worker with a cache version, so it works offline.

## Publish
The app is hosted on Cloudflare Pages: `main` is Production (https://student-practice.pages.dev) and `test` is the Test app (https://test.student-practice.pages.dev, with a red TEST badge). Changes reach them only through the release process; nobody pushes by hand.

On a phone, open the address and use **Add to Home Screen** / **Install app**. The version lives in `version.js`, which also names the offline cache, so installed copies update when it changes. The app shows "A new version is ready – Reload" when an update arrives.

## AI keys
- Claude: create a key at console.anthropic.com. Default model `claude-opus-5-5`; `claude-sonnet-5-5` and `claude-haiku-5-5` are cheaper/faster options in settings.
- DeepSeek: create a key at platform.deepseek.com (`deepseek-chat`).
- The key is saved only in this browser's local storage and sent only to the chosen provider. Anyone using this device's browser could find it, so use a key with a spending limit, ideally only on a family device.

## Files
| File | Purpose |
|---|---|
| `index.html` | Page shell and screens |
| `css/style.css` | Mobile-first, high-contrast styles, CJK-friendly font stack |
| `js/i18n.js` | All interface text (English + Simplified Chinese) |
| `js/checker.js` | Answer parsing and checking |
| `js/gen-core.js` | Shared helpers, topic registry, question sets |
| `js/gen-maths.js` | Maths topics (China/Singapore levels) |
| `js/gen-word.js` | 应用题 word problems |
| `js/gen-junior.js` | Years 1–3 |
| `js/gen-senior.js` | Years 11–12, Extension 1 and 2 |
| `js/gen-charts.js` | Graphs & data, geometry diagrams |
| `js/gen-olympiad.js` | Competition / tutoring-centre problems (Advanced & Challenge) |
| `js/gen-ga.js` | General ability (multiple choice) |
| `js/figures.js` | Charts and diagrams (SVG/HTML) for questions |
| `js/gen-amo.js` | AMO-level problems (find-all / counting / functional equations / tilings / games) with brute-force answers |
| `js/similar.js` | Similar questions for the review (same template or topic, new numbers) |
| `js/gen-comp.js` | Competition papers (AMC divisions and AIMO) |
| `js/gen-selective.js` | Selective test (35 questions / 40 minutes, 5 options) |
| `js/ai.js` | Claude / DeepSeek question generation (maths and general ability) and validation |
| `js/app.js` | Screens, state, parent mode, progress |
| `js/game-balloons.js` | Mini game: times-table balloons (the rules, testable without a page, and the game itself) |
| `js/game-kit.js` | Shared parts of the puzzle games: a clock that pauses while the page is hidden, m:ss, the keypad |
| `js/game-sudoku.js` | Mini game: Sudoku (puzzle maker with a unique-answer check, and the board) |
| `js/game-money.js` | Mini game: Money Master (change in Australian dollars) |
| `js/game-broken.js` | Mini game: Broken Calculator (sums with missing digits, one answer each) |
| `js/game-numbers.js` | Mini game: Use all the numbers (build true equations from every card) |
| `js/tour.js` | First-visit guided tour: highlight one part at a time with a short explanation |
| `version.js` | App version (also names the offline cache) and the Production host names |
| `js/test-badge.js` | TEST badge on every host that is not Production |
| `sw.js` | Service worker; cache named after `version.js` |
| `tests/` | `npm test` runs every suite; see `tests/README.md` |
