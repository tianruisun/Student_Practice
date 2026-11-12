/* Student_Practice server (v2.0.0): accounts, friends, "practise together" challenges and the account's progress.
   Runs as a Cloudflare Pages Function (functions/api/[[path]].js) with a D1 database bound as DB. The same module runs in
   the local tests with a small D1 stand-in on node:sqlite (tests/local-api.js), so every route is tested on this PC.

   Settings (Cloudflare dashboard → Pages → Settings → Variables and Secrets / Bindings):
     DB              D1 database (Production and Preview each bind their own database)
     EMAIL_PROVIDER  'resend' or 'brevo'   EMAIL_API_KEY (secret)   EMAIL_FROM ('Maths Practice <no-reply@…>')
     DEV_CODES       '1' on the Test site only: the verification code and the reset token come back in the answer,
                     so Test works without an email service. Never honoured on a Production host.
   Stored per account: username, email, password hash, picture number, friend code, progress (the student's own app data),
   friends and challenges. No real names. */

export const PROD_HOSTS = ['student-practice.pages.dev', 'tianruisun.github.io'];
const ORIGINS = [/^https:\/\/([a-z0-9-]+\.)?student-practice\.pages\.dev$/, /^https:\/\/tianruisun\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
export const AVATARS = ['🦊', '🐼', '🐯', '🐨', '🐰', '🐸', '🦁', '🐧', '🐙', '🦄', '🐵', '🐶'];
const USERNAME = /^[a-z0-9_]{3,20}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PW_MIN = 8, PW_MAX = 200;
export const PBKDF2_ITER = 20000;      // Workers allow at most 100000; the free plan's CPU time per request is small
const DAY = 86400e3, MIN = 60e3;
const SESSION_DAYS = 90;
const MAX_ACCOUNTS_PER_EMAIL = 5, MAX_FRIENDS = 50;
const MAX_PROGRESS = 900000, MAX_SET = 200000;   // characters of JSON (a D1 row holds up to 2 MB)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // friend codes: no 0/O or 1/I
/* R1.3, R1.4, R1.9 (v2.0.0): per-address and per-account caps */
export const LOGIN_IP_FAIL = 60, LOGIN_IP_ALL = 600;    // per address in 15 minutes: wrong passwords / every sign-in
export const CODE_IP = 150;                             // sign-up codes per address in an hour (a class signing up together)
export const PUT_DAY = 300;                             // saves of the records per account in a day (D1 writes are shared)
export const FRIEND_ADD_DAY = 60;                       // friends/add calls per account in a day, found or not

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, email TEXT NOT NULL, pw TEXT NOT NULL,
     avatar INTEGER NOT NULL DEFAULT 0, code TEXT NOT NULL UNIQUE, created INTEGER NOT NULL, seen INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS users_email ON users(email)`,
  `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS codes (email TEXT PRIMARY KEY, hash TEXT NOT NULL, expires INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS resets (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, n INTEGER NOT NULL, reset INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS progress (user_id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS friends (from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL,
     PRIMARY KEY (from_id, to_id))`,
  `CREATE INDEX IF NOT EXISTS friends_to ON friends(to_id)`,
  `CREATE TABLE IF NOT EXISTS challenges (id INTEGER PRIMARY KEY, from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, created INTEGER NOT NULL,
     settings TEXT NOT NULL, questions TEXT NOT NULL, a_score TEXT NOT NULL, b_score TEXT, done INTEGER)`,
  `CREATE INDEX IF NOT EXISTS ch_from ON challenges(from_id)`,
  `CREATE INDEX IF NOT EXISTS ch_to ON challenges(to_id)`
];
let schemaReady = null;   // one CREATE pass per database per isolate
const ensureSchema = db => {
  if (!schemaReady || schemaReady.db !== db) schemaReady = { db, p: db.batch(SCHEMA.map(s => db.prepare(s))).catch(e => { schemaReady = null; throw e; }) };
  return schemaReady.p;
};

/* ---------- small helpers ---------- */
class Fail extends Error { constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra; } }
const fail = (status, code, extra) => { throw new Fail(status, code, extra); };
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomBytes = n => crypto.getRandomValues(new Uint8Array(n));
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const newToken = () => b64u(randomBytes(32));
const randomCode6 = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
const friendCode = () => [...randomBytes(6)].map(b => CODE_CHARS[b % CODE_CHARS.length]).join('');
/* constant-time compare of two hex strings of equal length */
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

export async function hashPassword(pw, iter = PBKDF2_ITER, saltHex) {
  const salt = saltHex ? new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16))) : randomBytes(16);
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
  return `pbkdf2$${iter}$${hex(salt)}$${hex(bits)}`;
}
async function checkPassword(pw, stored) {
  const [kind, iter, salt, h] = String(stored).split('$');
  if (kind !== 'pbkdf2') return false;
  const again = await hashPassword(pw, +iter, salt);
  return same(again.split('$')[3], h);
}

const normEmail = e => String(e || '').trim().toLowerCase();
const normName = n => String(n || '').trim().toLowerCase();
export const maskEmail = e => { const [u, d] = String(e).split('@'); return (u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '***') + '@' + d; };
const str = (v, max) => (typeof v === 'string' && v.length <= max ? v : fail(400, 'bad_input'));
const okPassword = pw => typeof pw === 'string' && pw.length >= PW_MIN && pw.length <= PW_MAX;

/* fixed-window counter: false when key has been used max times in the window */
async function limit(db, key, max, windowMs, now) {
  const row = await db.prepare('SELECT n, reset FROM limits WHERE key = ?').bind(key).first();
  if (!row || row.reset <= now) { await db.prepare('INSERT OR REPLACE INTO limits (key, n, reset) VALUES (?, 1, ?)').bind(key, now + windowMs).run(); return true; }
  if (row.n >= max) return false;
  await db.prepare('UPDATE limits SET n = n + 1 WHERE key = ?').bind(key).run();
  return true;
}
const limitOr429 = async (db, key, max, windowMs, now) => { if (!(await limit(db, key, max, windowMs, now))) fail(429, 'too_many'); };
/* true when key has already been used max times in its window (reads only, counts nothing) */
async function full(db, key, max, now) {
  const row = await db.prepare('SELECT n, reset FROM limits WHERE key = ?').bind(key).first();
  return !!row && row.reset > now && row.n >= max;
}

/* ---------- email ---------- */
const MAIL = {
  en: {
    codeSub: 'Your Maths Practice code', code: c => `Your code is ${c}.\n\nType it in the app within 10 minutes. If you did not ask for it, you can ignore this email.`,
    resetSub: 'Set a new Maths Practice password', reset: (n, l) => `Someone asked to set a new password for the account "${n}".\n\nOpen this link within 1 hour:\n${l}\n\nIf it was not you, ignore this email: the password stays the same.`
  },
  zh: {
    codeSub: '你的数学练习验证码', code: c => `你的验证码是 ${c}。\n\n请在 10 分钟内在应用里输入。如果不是你要的，请不用理会这封邮件。`,
    resetSub: '设置新的数学练习密码', reset: (n, l) => `有人要为账号“${n}”设置新密码。\n\n请在 1 小时内打开这个链接：\n${l}\n\n如果不是你，请不用理会这封邮件，密码不会改变。`
  }
};
async function sendEmail(env, to, subject, text) {
  const p = env.EMAIL_PROVIDER, key = env.EMAIL_API_KEY, from = env.EMAIL_FROM;
  if (!p || !key || !from) return false;
  let res;
  if (p === 'resend') {
    res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject, text }) });
  } else if (p === 'brevo') {
    const m = /^(.*)<([^>]+)>\s*$/.exec(from), sender = m ? { name: m[1].trim(), email: m[2] } : { email: from };
    res = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ sender, to: [{ email: to }], subject, textContent: text }) });
  } else return false;
  return res.ok;
}

/* ---------- request plumbing ---------- */
const allowedOrigin = o => !!o && ORIGINS.some(r => r.test(o));
function cors(origin) {
  return allowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : {};
}
const json = (status, body, origin) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(origin) } });

async function readBody(request) {
  const text = await request.text();
  if (text.length > MAX_PROGRESS + 10000) fail(413, 'too_big');
  if (!text) return {};
  try { const b = JSON.parse(text); return b && typeof b === 'object' && !Array.isArray(b) ? b : fail(400, 'bad_input'); }
  catch (e) { if (e instanceof Fail) throw e; fail(400, 'bad_input'); }
}

async function auth(db, request, now) {
  const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(request.headers.get('Authorization') || '');
  if (!m) fail(401, 'signed_out');
  const s = await db.prepare('SELECT s.user_id, s.expires, u.name, u.email, u.avatar, u.code, u.seen FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').bind(await sha256(m[1])).first();
  if (!s || s.expires <= now) fail(401, 'signed_out');
  if (now - s.seen > 10 * MIN) await db.prepare('UPDATE users SET seen = ? WHERE id = ?').bind(now, s.user_id).run();
  return { id: s.user_id, name: s.name, email: s.email, avatar: s.avatar, code: s.code, tokenHash: await sha256(m[1]) };
}
async function newSession(db, userId, now) {
  const token = newToken();
  await db.prepare('INSERT INTO sessions (token, user_id, created, expires) VALUES (?, ?, ?, ?)').bind(await sha256(token), userId, now, now + SESSION_DAYS * DAY).run();
  return token;
}
const meOf = u => ({ username: u.name, avatar: u.avatar, friendCode: u.code, email: maskEmail(u.email) });

/* ---------- routes ---------- */
async function verifyCode(db, email, code, now, consume) {
  const row = await db.prepare('SELECT hash, expires, tries FROM codes WHERE email = ?').bind(email).first();
  if (!row || row.expires <= now) fail(400, 'code_expired');
  if (row.tries >= 5) fail(400, 'code_tries');
  if (!/^\d{6}$/.test(String(code || '')) || !same(await sha256(email + ':' + code), row.hash)) {
    await db.prepare('UPDATE codes SET tries = tries + 1 WHERE email = ?').bind(email).run();
    fail(400, row.tries + 1 >= 5 ? 'code_tries' : 'code_wrong');
  }
  if (consume) await db.prepare('DELETE FROM codes WHERE email = ?').bind(email).run();
}

const ROUTES = {
  'GET health': async () => ({ ok: true }),

  /* step 1 of sign-up: a 6-digit code to the email */
  'POST code': async ({ db, env, body, now, ip, dev, lang }) => {
    const email = normEmail(str(body.email, 260));
    if (!EMAIL.test(email)) fail(400, 'bad_email');
    const n = await db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').bind(email).first();
    if (n.n >= MAX_ACCOUNTS_PER_EMAIL) fail(400, 'email_full');
    await limitOr429(db, 'code:' + email, 1, MIN, now);
    await limitOr429(db, 'codeday:' + email, 10, DAY, now);
    await limitOr429(db, 'codeip:' + ip, CODE_IP, 60 * MIN, now);
    const code = randomCode6();
    await db.prepare('INSERT OR REPLACE INTO codes (email, hash, expires, tries) VALUES (?, ?, ?, 0)').bind(email, await sha256(email + ':' + code), now + 10 * MIN).run();
    if (dev) return { ok: true, devCode: code };
    if (!(await sendEmail(env, email, MAIL[lang].codeSub, MAIL[lang].code(code)))) fail(503, 'email_off');
    return { ok: true };
  },
  /* step 2: check the code without using it up (wrong tries count) */
  'POST code/check': async ({ db, body, now }) => {
    await verifyCode(db, normEmail(str(body.email, 260)), body.code, now, false);
    return { ok: true };
  },
  /* step 3: username, password and picture; the code is used up here */
  'POST register': async ({ db, body, now }) => {
    const email = normEmail(str(body.email, 260)), name = normName(str(body.username, 40)), pw = body.password;
    if (!USERNAME.test(name)) fail(400, 'bad_username');
    if (!okPassword(pw)) fail(400, 'bad_password');
    const avatar = Number.isInteger(body.avatar) && body.avatar >= 0 && body.avatar < AVATARS.length ? body.avatar : 0;
    if (await db.prepare('SELECT 1 FROM users WHERE name = ?').bind(name).first()) fail(409, 'username_taken');
    await verifyCode(db, email, body.code, now, true);
    const n = await db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').bind(email).first();
    if (n.n >= MAX_ACCOUNTS_PER_EMAIL) fail(400, 'email_full');
    let code;
    for (let i = 0; i < 5 && !code; i++) { const c = friendCode(); if (!(await db.prepare('SELECT 1 FROM users WHERE code = ?').bind(c).first())) code = c; }
    if (!code) fail(500, 'server');
    const r = await db.prepare('INSERT INTO users (name, email, pw, avatar, code, created, seen) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(name, email, await hashPassword(pw), avatar, code, now, now).run();
    const id = r.meta.last_row_id;
    return { token: await newSession(db, id, now), me: meOf({ name, email, avatar, code }) };
  },
  /* R1.3: a school or a family shares one address, so the per-address guard counts only wrong passwords (60 in 15
     minutes); every sign-in from one address, right or wrong, has a much higher cap (600 in 15 minutes) */
  'POST login': async ({ db, body, now, ip }) => {
    const name = normName(str(body.username, 40)), pw = typeof body.password === 'string' ? body.password : '';
    await limitOr429(db, 'loginall:' + ip, LOGIN_IP_ALL, 15 * MIN, now);
    if (await full(db, 'loginip:' + ip, LOGIN_IP_FAIL, now)) fail(429, 'too_many');
    if (await full(db, 'login:' + name, 10, now)) fail(429, 'too_many');
    const u = USERNAME.test(name) ? await db.prepare('SELECT * FROM users WHERE name = ?').bind(name).first() : null;
    if (!u || pw.length > PW_MAX || !(await checkPassword(pw, u.pw))) {
      await limit(db, 'login:' + name, 10, 15 * MIN, now);   // only failures count
      await limit(db, 'loginip:' + ip, LOGIN_IP_FAIL, 15 * MIN, now);
      fail(401, 'wrong_login');
    }
    await db.prepare('DELETE FROM sessions WHERE user_id = ? AND expires <= ?').bind(u.id, now).run();
    return { token: await newSession(db, u.id, now), me: meOf(u) };
  },
  'POST logout': async ({ db, me }) => {
    await db.prepare('DELETE FROM sessions WHERE token = ?').bind(me.tokenHash).run();
    return { ok: true };
  },
  'GET me': async ({ me }) => ({ me: meOf(me) }),
  'POST me/avatar': async ({ db, me, body }) => {
    const a = body.avatar;
    if (!Number.isInteger(a) || a < 0 || a >= AVATARS.length) fail(400, 'bad_input');
    await db.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(a, me.id).run();
    return { ok: true };
  },
  /* forgot password: a link to the account's email. The answer is the same whether the name exists or not. */
  'POST reset': async ({ db, env, body, now, ip, dev, lang, origin }) => {
    const name = normName(str(body.username, 40));
    await limitOr429(db, 'resetip:' + ip, 20, 60 * MIN, now);
    const u = USERNAME.test(name) ? await db.prepare('SELECT id, name, email FROM users WHERE name = ?').bind(name).first() : null;
    if (!u || !(await limit(db, 'reset:' + name, 3, 60 * MIN, now))) return { ok: true };
    const token = newToken();
    await db.prepare('INSERT INTO resets (token, user_id, expires) VALUES (?, ?, ?)').bind(await sha256(token), u.id, now + 60 * MIN).run();
    if (dev) return { ok: true, devToken: token };
    const base = allowedOrigin(origin) ? origin + (origin.endsWith('github.io') ? '/Student_Practice/' : '/') : 'https://student-practice.pages.dev/';
    if (!(await sendEmail(env, u.email, MAIL[lang].resetSub, MAIL[lang].reset(u.name, base + '?reset=' + token)))) fail(503, 'email_off');
    return { ok: true };
  },
  'POST reset/finish': async ({ db, body, now }) => {
    const token = str(body.token, 100);
    if (!okPassword(body.password)) fail(400, 'bad_password');
    const h = await sha256(token);
    const r = await db.prepare('SELECT user_id, expires FROM resets WHERE token = ?').bind(h).first();
    if (!r || r.expires <= now) fail(400, 'reset_expired');
    await db.batch([
      db.prepare('UPDATE users SET pw = ? WHERE id = ?').bind(await hashPassword(body.password), r.user_id),
      db.prepare('DELETE FROM resets WHERE user_id = ?').bind(r.user_id),
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(r.user_id),   // every device signs in again
      db.prepare('DELETE FROM limits WHERE key = ?').bind('login:' + (await db.prepare('SELECT name FROM users WHERE id = ?').bind(r.user_id).first()).name)
    ]);
    return { ok: true };
  },
  'POST account/delete': async ({ db, me, body }) => {
    const u = await db.prepare('SELECT pw FROM users WHERE id = ?').bind(me.id).first();
    if (typeof body.password !== 'string' || !(await checkPassword(body.password, u.pw))) fail(401, 'wrong_login');
    await db.batch([
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(me.id),
      db.prepare('DELETE FROM resets WHERE user_id = ?').bind(me.id),
      db.prepare('DELETE FROM progress WHERE user_id = ?').bind(me.id),
      db.prepare('DELETE FROM friends WHERE from_id = ? OR to_id = ?').bind(me.id, me.id),
      db.prepare('DELETE FROM challenges WHERE from_id = ? OR to_id = ?').bind(me.id, me.id),
      db.prepare('DELETE FROM users WHERE id = ?').bind(me.id)
    ]);
    return { ok: true };
  },

  /* the student's own app data (history, settings, badges, plan, games), saved as one JSON text */
  'GET progress': async ({ db, me }) => {
    const r = await db.prepare('SELECT data, updated FROM progress WHERE user_id = ?').bind(me.id).first();
    return r ? { data: JSON.parse(r.data), updated: r.updated } : { data: null, updated: 0 };
  },
  /* R1.1: two devices on one account must not overwrite each other. A save says which copy it was made from
     (base = the `updated` the device last had). When the server copy has changed since, nothing is written: the answer is
     409 'stale' with the server copy, the device merges it into its own records and saves again. */
  'PUT progress': async ({ db, me, body, now }) => {
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) fail(400, 'bad_input');
    const text = JSON.stringify(body.data);
    if (text.length > MAX_PROGRESS) fail(413, 'too_big');
    const base = Number.isInteger(body.base) && body.base >= 0 ? body.base : 0;
    await limitOr429(db, 'put:' + me.id, PUT_DAY, DAY, now);
    const stale = async () => {
      const r = await db.prepare('SELECT data, updated FROM progress WHERE user_id = ?').bind(me.id).first();
      fail(409, 'stale', r ? { data: JSON.parse(r.data), updated: r.updated } : { data: null, updated: 0 });
    };
    const cur = await db.prepare('SELECT updated FROM progress WHERE user_id = ?').bind(me.id).first();
    if (cur && cur.updated !== base) await stale();
    const updated = cur ? Math.max(now, cur.updated + 1) : now;   // always moves on, even within one millisecond
    const r = cur
      ? await db.prepare('UPDATE progress SET data = ?, updated = ? WHERE user_id = ? AND updated = ?').bind(text, updated, me.id, base).run()
      : await db.prepare('INSERT OR IGNORE INTO progress (user_id, data, updated) VALUES (?, ?, ?)').bind(me.id, text, updated).run();
    if (!r.meta.changes) await stale();   // another device saved in between
    return { ok: true, updated };
  },

  /* friends: a request waits until the other student accepts */
  'GET friends': async ({ db, me }) => {
    const rows = (await db.prepare(`SELECT f.from_id, f.to_id, f.status, f.created, u.name, u.avatar, u.seen FROM friends f
      JOIN users u ON u.id = CASE WHEN f.from_id = ? THEN f.to_id ELSE f.from_id END WHERE f.from_id = ? OR f.to_id = ? ORDER BY u.name`).bind(me.id, me.id, me.id).all()).results;
    const pick = r => ({ username: r.name, avatar: r.avatar, seen: r.seen });
    return {
      friends: rows.filter(r => r.status === 'ok').map(pick),
      incoming: rows.filter(r => r.status === 'pending' && r.to_id === me.id).map(pick),
      outgoing: rows.filter(r => r.status === 'pending' && r.from_id === me.id).map(pick)
    };
  },
  'POST friends/add': async ({ db, me, body, now }) => {
    const raw = str(body.who, 40).trim(), code = raw.toUpperCase().replace(/[-\s]/g, '');
    await limitOr429(db, 'friendadd:' + me.id, FRIEND_ADD_DAY, DAY, now);   // R1.9: every try counts, found or not
    const u = (/^[A-Z2-9]{6}$/.test(code) ? await db.prepare('SELECT id, name FROM users WHERE code = ?').bind(code).first() : null) ||
      (USERNAME.test(normName(raw)) ? await db.prepare('SELECT id, name FROM users WHERE name = ?').bind(normName(raw)).first() : null);
    if (!u) fail(404, 'no_user');
    if (u.id === me.id) fail(400, 'is_you');
    const cnt = await db.prepare(`SELECT COUNT(*) AS n FROM friends WHERE (from_id = ? OR to_id = ?) AND status = 'ok'`).bind(me.id, me.id).first();
    const there = await db.prepare('SELECT from_id, status FROM friends WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)').bind(me.id, u.id, u.id, me.id).first();
    if (there && there.status === 'ok') return { status: 'friends', username: u.name };
    if (there && there.from_id === me.id) return { status: 'sent', username: u.name };
    if (cnt.n >= MAX_FRIENDS) fail(400, 'friends_full');
    if (there) {   // they asked first: adding them back accepts
      await db.prepare(`UPDATE friends SET status = 'ok' WHERE from_id = ? AND to_id = ?`).bind(u.id, me.id).run();
      return { status: 'friends', username: u.name };
    }
    await limitOr429(db, 'friendreq:' + me.id, 20, DAY, now);
    await db.prepare(`INSERT INTO friends (from_id, to_id, status, created) VALUES (?, ?, 'pending', ?)`).bind(me.id, u.id, now).run();
    return { status: 'sent', username: u.name };
  },
  'POST friends/answer': async ({ db, me, body }) => {
    const u = await db.prepare('SELECT id FROM users WHERE name = ?').bind(normName(str(body.username, 40))).first();
    if (!u) fail(404, 'no_user');
    const q = body.accept === true
      ? db.prepare(`UPDATE friends SET status = 'ok' WHERE from_id = ? AND to_id = ? AND status = 'pending'`)
      : db.prepare(`DELETE FROM friends WHERE from_id = ? AND to_id = ? AND status = 'pending'`);
    const r = await q.bind(u.id, me.id).run();
    if (!r.meta.changes) fail(404, 'no_request');
    return { ok: true };
  },
  'POST friends/remove': async ({ db, me, body }) => {
    const u = await db.prepare('SELECT id FROM users WHERE name = ?').bind(normName(str(body.username, 40))).first();
    if (!u) fail(404, 'no_user');
    await db.prepare('DELETE FROM friends WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)').bind(me.id, u.id, u.id, me.id).run();
    return { ok: true };
  },

  /* practise together (type B): the sender finishes a set, the friend gets the same questions, then both see both scores */
  'POST challenges': async ({ db, me, body, now }) => {
    const u = await db.prepare('SELECT id, name FROM users WHERE name = ?').bind(normName(str(body.to, 40))).first();
    if (!u) fail(404, 'no_user');
    if (!(await isFriend(db, me.id, u.id))) fail(403, 'not_friends');
    const settings = JSON.stringify(cleanSettings(body.settings));
    if (!Array.isArray(body.questions) || !body.questions.length || body.questions.length > 60) fail(400, 'bad_input');
    if (!body.questions.every(questionOk)) fail(400, 'bad_set');   // R1.2: only questions the app can draw
    const questions = JSON.stringify(body.questions);
    if (questions.length > MAX_SET) fail(413, 'too_big');
    const score = JSON.stringify(cleanScore(body.score, body.questions.length));
    await limitOr429(db, 'challenge:' + me.id, 30, DAY, now);
    await db.prepare('DELETE FROM challenges WHERE (from_id = ? OR to_id = ?) AND created < ?').bind(me.id, me.id, now - 60 * DAY).run();
    const r = await db.prepare('INSERT INTO challenges (from_id, to_id, created, settings, questions, a_score) VALUES (?, ?, ?, ?, ?, ?)').bind(me.id, u.id, now, settings, questions, score).run();
    return { id: r.meta.last_row_id };
  },
  'GET challenges': async ({ db, me }) => {
    const rows = (await db.prepare(`SELECT c.id, c.from_id, c.to_id, c.created, c.settings, c.a_score, c.b_score, c.done,
        a.name AS a_name, a.avatar AS a_av, b.name AS b_name, b.avatar AS b_av
      FROM challenges c JOIN users a ON a.id = c.from_id JOIN users b ON b.id = c.to_id
      WHERE c.from_id = ? OR c.to_id = ? ORDER BY c.created DESC LIMIT 60`).bind(me.id, me.id).all()).results;
    return { challenges: rows.map(r => challengeOut(r, me.id)) };
  },
  'GET challenges/:id': async ({ db, me, id }) => {
    const r = await db.prepare(`SELECT c.*, a.name AS a_name, a.avatar AS a_av, b.name AS b_name, b.avatar AS b_av
      FROM challenges c JOIN users a ON a.id = c.from_id JOIN users b ON b.id = c.to_id WHERE c.id = ?`).bind(id).first();
    if (!r || (r.from_id !== me.id && r.to_id !== me.id)) fail(404, 'no_challenge');
    return Object.assign(challengeOut(r, me.id), { questions: JSON.parse(r.questions) });
  },
  'POST challenges/:id/result': async ({ db, me, id, body, now }) => {
    const r = await db.prepare('SELECT to_id, questions, done FROM challenges WHERE id = ?').bind(id).first();
    if (!r || r.to_id !== me.id) fail(404, 'no_challenge');
    if (r.done) fail(409, 'already_done');
    const score = JSON.stringify(cleanScore(body.score, JSON.parse(r.questions).length));
    await db.prepare('UPDATE challenges SET b_score = ?, done = ? WHERE id = ? AND done IS NULL').bind(score, now, id).run();
    return { ok: true };
  }
};

async function isFriend(db, a, b) {
  return !!(await db.prepare(`SELECT 1 FROM friends WHERE status = 'ok' AND ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))`).bind(a, b, b, a).first());
}
function cleanSettings(s) {
  if (!s || typeof s !== 'object') fail(400, 'bad_input');
  const out = {};
  for (const k of ['subject', 'topic', 'paper', 'selLen', 'compLen']) if (s[k] !== undefined) out[k] = typeof s[k] === 'string' && s[k].length <= 40 ? s[k] : fail(400, 'bad_input');
  for (const k of ['year', 'diff', 'count']) if (s[k] !== undefined) out[k] = Number.isInteger(s[k]) && s[k] >= 0 && s[k] <= 100 ? s[k] : fail(400, 'bad_input');
  if (!out.subject) fail(400, 'bad_input');
  return out;
}
/* R1.2: a question of the shape the quiz screen draws (js/app.js cardEl, answerText, the review screens). The app checks
   the same rules before it starts a friend's set (js/app.js questionOk), so a set from an older or broken client cannot
   leave the friend on an empty quiz screen. */
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const text2 = (v, max) => isObj(v) && typeof v.en === 'string' && v.en.length <= max && (v.zh === undefined || (typeof v.zh === 'string' && v.zh.length <= max));
export function questionOk(q) {
  if (!isObj(q) || !text2(q.q, 4000) || typeof q.topic !== 'string' || q.topic.length > 40) return false;
  if (q.fig !== undefined && q.fig !== null && !(isObj(q.fig) && typeof q.fig.type === 'string')) return false;
  if (q.sol !== undefined && q.sol !== null && !text2(q.sol, 8000)) return false;
  if (q.type === 'mc') {
    return Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.length <= 5 && q.choices.every(c => text2(c, 1000)) &&
      Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.choices.length;
  }
  if (q.type === 'input') {
    return Number.isFinite(q.value) && (typeof q.answer === 'string' || Number.isFinite(q.answer)) &&
      (q.unit === undefined || q.unit === null || typeof q.unit === 'string') && (q.tol === undefined || q.tol === null || Number.isFinite(q.tol));
  }
  return false;
}
function cleanScore(s, n) {
  if (!s || typeof s !== 'object') fail(400, 'bad_input');
  const ok = Array.isArray(s.ok) && s.ok.length === n && s.ok.every(x => x === true || x === false) ? s.ok : fail(400, 'bad_input');
  const time = Number.isFinite(s.time) && s.time >= 0 && s.time < 864e5 ? Math.round(s.time) : null;
  return { c: ok.filter(Boolean).length, n, ok, time };
}
function challengeOut(r, me) {
  const mine = r.from_id === me;
  return {
    id: r.id, created: r.created, mine, done: r.done || null,
    from: { username: r.a_name, avatar: r.a_av }, to: { username: r.b_name, avatar: r.b_av },
    settings: JSON.parse(r.settings), a: JSON.parse(r.a_score), b: r.b_score ? JSON.parse(r.b_score) : null
  };
}

/* the router: /api/<route>; ids in the path become :id */
export async function handle(request, env, opts = {}) {
  const url = new URL(request.url), origin = request.headers.get('Origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (origin && !allowedOrigin(origin)) return json(403, { error: 'bad_origin' }, '');
  const now = opts.now ? opts.now() : Date.now();
  try {
    const path = url.pathname.replace(/^.*?\/api\/?/, '').replace(/\/+$/, '');
    let id = null;
    const routePath = path.replace(/\/(\d{1,12})(?=\/|$)/, (m, d) => { id = +d; return '/:id'; });
    const route = ROUTES[request.method + ' ' + routePath];
    if (!route) fail(404, 'no_route');
    const db = env.DB;
    if (!db) fail(503, 'not_set_up');
    await ensureSchema(db);
    const prodHost = PROD_HOSTS.includes(url.hostname) || (origin && PROD_HOSTS.some(h => origin === 'https://' + h));
    const ctx = {
      db, env, now, id, origin,
      ip: request.headers.get('CF-Connecting-IP') || 'local',
      dev: env.DEV_CODES === '1' && !prodHost,
      body: request.method === 'POST' || request.method === 'PUT' ? await readBody(request) : {},
      me: null
    };
    ctx.lang = ctx.body.lang === 'zh' ? 'zh' : 'en';
    const open = ['GET health', 'POST code', 'POST code/check', 'POST register', 'POST login', 'POST reset', 'POST reset/finish'];
    if (!open.includes(request.method + ' ' + routePath)) ctx.me = await auth(db, request, now);
    return json(200, await route(ctx), origin);
  } catch (e) {
    if (e instanceof Fail) return json(e.status, Object.assign({ error: e.code }, e.extra || {}), origin);
    console.error(e);
    return json(500, { error: 'server' }, origin);
  }
}
