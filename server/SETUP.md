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

## 3. Test codes on Test only

**Settings → Variables and Secrets**, environment **Preview** only:

| Name | Value |
|---|---|
| `DEV_CODES` | `1` |

With this, the Test site shows the 6-digit code and the reset link on screen instead of emailing them, so Test and
the automatic tests work without an email service. Do **not** add it to Production (the server ignores it on the
Production addresses anyway).

## 4. Email (needed before Production)

Production must email the sign-up code and the reset link. Pick one service and add, for **Production**:

| Name | Type | Value |
|---|---|---|
| `EMAIL_PROVIDER` | Text | `resend` or `brevo` |
| `EMAIL_FROM` | Text | for example `Maths Practice <no-reply@your-domain>` |
| `EMAIL_API_KEY` | **Secret** | the key from the service |

- **Resend**: free plan with a daily and monthly limit; it sends to anyone only from a domain you own and verify.
- **Brevo**: free plan with a daily limit; it can send from one verified address (for example a Gmail address),
  but such mail lands in spam more often than mail from your own domain.
- Cloudflare's own email sending to any address needs the paid Workers plan.

Check each service's current limits before choosing. Without these settings, sign-up on Production answers
"Emails cannot be sent right now" and nothing else breaks.

## 5. Deploy

Bindings and variables take effect on the next deploy (the next push to `test` or `main`). Check
`https://test.student-practice.pages.dev/api/health` answers `{"ok":true}`.

## Free plan limits that matter here

Workers (Pages Functions): 100,000 requests a day. D1: 5 million rows read and 100,000 rows written a day,
500 MB a database. A student's records are saved a few seconds after each change (one row write), and the Friends
tab refreshes every 30 seconds only while it is open.
