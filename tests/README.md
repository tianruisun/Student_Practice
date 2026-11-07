# Tests

One-time setup: `npm install`. The smoke suite uses the installed Google Chrome (or run `npx playwright install chromium` on a PC without Chrome).

| Command | What it runs |
|---|---|
| `npm test` | every suite against a local copy of this folder |
| `npm test -- --site=https://test.student-practice.pages.dev` | the smoke suite against the Test site (unit suite still runs on the local code) |
| `npm test -- --site=https://student-practice.pages.dev` | the same against Production |

Each run prints a count per suite and exits non-zero if anything failed.

| Suite | File | Covers |
|---|---|---|
| unit | `run.js` | answer checker; every generated question accepts its own answer; AI parsing; competition papers |
| kit | `kit.js` | the test kit: `serve.js` finds files with the folder written five ways, `../` cannot leave the folder, a folder with no `index.html` is refused |
| smoke | `smoke.js` | page loads with no console errors; fits a 375px phone; TEST badge shows `TEST v<version>` off Production and is absent on Production; offline cache is named after `version.js` |
| flows | `flows.js` | a practice set to results; worked method needs the parent PIN and opens right after it; parent PIN opens Parent settings; "Forgot PIN" erases the app's data; old `mp.` keys move to `sp.` once, only this app's names, never deleting the only copy; a refused save shows one message and the app keeps working; language switch keeps a typed answer; arrow keys in multiple choice; 44 px Get started; v1.7: answer hint behind an info icon (hover, tap, stays on screen); a fast first-try perfect set earns three badges at its own level; school year and birth month set the default year on Home, and a year picked by hand on Home (even before any details) is kept; the details form offers the year a birth month gives (Years 1–12 only, plain "Year N"); CSV export, import into another student, no duplicates, wrong file refused; v1.8: the guided tour opens on a first visit only, every step highlights its part on a 375 px screen, Back / Skip / Done / arrow keys / Escape, ? replays it, Chinese text, hidden during a set, not shown to earlier users, kept through a Forgot PIN reset. Other flows start with the tour marked as seen |

Screenshots go to `<system temp>/Student_Practice-tests/`, never into the repo.
`serve.js` is a tiny static server for local runs. It accepts a folder written any way (`D:/x`, `D:\x`, relative) and stops at once
if the folder has no `index.html`. `config.js` holds what differs between repos.

Time limits: unit 5 min, smoke 3 min, flows 4 min, any single browser step 20 s. A run that hits one reports `timed out` as a failure;
it never hangs. Scripts of your own that reuse `serve.js` or Playwright should set the same kind of limits.
