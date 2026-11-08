# Student_Practice

Maths and reasoning practice PWA (Years 1–12, Extension 1 and 2) for students, in English and Simplified Chinese.

## Environments
- Production: https://student-practice.pages.dev   (branch main)
- Production, second address: https://tianruisun.github.io/Student_Practice/   (GitHub Pages, branch main; kept by Terry's decision 2026-11-06)
- Test:       https://test.student-practice.pages.dev   (branch test)
- The GitHub Pages address shares its origin, and so its Cache Storage and localStorage, with other apps under tianruisun.github.io.
  Only touch keys and caches that belong to this app (cache prefix `maths-`).

## Tech
- Plain HTML/CSS/JS, no build step. Cloudflare build settings: preset None, no build command, output `/`.
- Version lives in: `version.js` (also names the offline cache `maths-<version>`, and lists the Production hosts)
- `sw.js` has `BUILD = '<version>+<n>'`. Change it in every release and before every push to Test that changes an app file,
  or phones keep the old files (a browser only updates its service worker when `sw.js` itself changes). `npm test` checks it.

## Tests
- Run all: `npm test`
- Run against Test site: `npm test -- --site=https://test.student-practice.pages.dev`
- `window.__testAnswers` exists on every host except Production, so `tests/flows.js` can answer a set correctly. Never rely on it in app code.
- Every run ends within its time limits (unit 5 min, smoke 3 min, flows 7 min, any single browser step 20 s) and reports a failure instead of hanging.

## Project rules (override the master rules)
- Languages: English + Simplified Chinese. All interface text lives in `js/i18n.js`.
- Audience: school students, used on phones; parents use the PIN-protected Parent settings.
- Answers and worked solutions stay hidden from students: a parent types the PIN to show them (no setting turns this off).
- Stored keys start with `sp.` (this app's own prefix on the shared GitHub Pages origin).
