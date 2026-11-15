# Server setup (v2.0.0)

Accounts, friends and challenges need a small server: a Cloudflare Pages Function
(`functions/api/[[path]].js` → `server/api.js`) and a D1 database. Everything here is done in the Cloudflare
dashboard by Terry; nothing needs `wrangler login`, and no key goes into the repo. The tables are created by the
server itself on its first request.

## 1. Two databases (free plan)

Cloudflare dashboard → **Storage & Databases → D1 SQL Database → Create**:

- `student-practice-prod` (Production)
- `student-practice-test` (Test)

## 2. Bind them to the Pages project

**Workers & Pages → student-practice → Settings → Bindings → Add → D1 database**

| Variable name | Production | Preview (Test) |
|---|---|---|
| `DB` | `student-practice-prod` | `student-practice-test` |

## 3. No email service (W10)

From W10 (Terry, 2026-11-15) the app sends no email at all: an account is an email address (not checked), a display name, a
password and one security question with its answer, and a forgotten password is reset with the email and the answer. So
there are **no** `EMAIL_*` or `DEV_CODES` settings to add on Test or on Production; the only setting is the `DB` binding
above. A password cannot be recovered without the answer. If email is wanted again later (to check addresses), it is a
new change.

## 4. The Test database

A Test database made for the old email codes (a `users` table without the security question) is wiped once, by the
server itself, the first time it is used after this version is deployed: accounts, friends and challenges on Test go.
A database made by this version is never wiped.

## 5. Deploy

Bindings and variables take effect on the next deploy (the next push to `test` or `main`). Check
`https://test.student-practice.pages.dev/api/health` answers `{"ok":true}`.

## Free plan limits that matter here

Workers (Pages Functions): 100,000 requests a day. D1: 5 million rows read and 100,000 rows written a day,
500 MB a database. A student's records are saved a few seconds after each change (one row write), and the Friends
tab refreshes every 30 seconds only while it is open.
