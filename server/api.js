/* Student_Practice server (v2.0.0): accounts, friends, challenges and the account's progress.
   Runs as a Cloudflare Pages Function (functions/api/[[path]].js) with a D1 database bound as DB. The same module runs in
   the local tests with a small D1 stand-in on node:sqlite (tests/local-api.js), so every route is tested on this PC.

   Settings (Cloudflare dashboard → Pages → Settings → Bindings): DB, a D1 database (Production and Preview each bind their own).
   No email service is used (W10, Terry 2026-11-15): an account is an email address (not checked, only one account per
   address), a display name (unique), a password and one security question with its answer. A forgotten password is reset
   with the email address and the answer; with neither the password nor the answer the account cannot be recovered.
   Stored per account: display name, email, password hash, security question number and answer hash, picture number, friend
   code, progress (the student's own app data), friends and the last 20 challenges of each student. No real names. */

const ORIGINS = [/^https:\/\/([a-z0-9-]+\.)?student-practice\.pages\.dev$/, /^https:\/\/tianruisun\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
export const AVATARS = ['🦊', '🐼', '🐯', '🐨', '🐰', '🐸', '🦁', '🐧', '🐙', '🦄', '🐵', '🐶'];
const USERNAME = /^[a-z0-9_]{3,20}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PW_MIN = 8, PW_MAX = 200;
export const PBKDF2_ITER = 20000;      // Workers allow at most 100000; the free plan's CPU time per request is small
const DAY = 86400e3, MIN = 60e3;
const SESSION_DAYS = 90;
const MAX_FRIENDS = 50;
const MAX_PROGRESS = 900000, MAX_SET = 200000;   // characters of JSON (a D1 row holds up to 2 MB)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // friend codes: no 0/O or 1/I
/* R1.3, R1.4, R1.9 (v2.0.0): per-address and per-account caps */
export const LOGIN_IP_FAIL = 60, LOGIN_IP_ALL = 600;    // per address in 15 minutes: wrong passwords / every sign-in
export const REG_IP = 150;                              // sign-ups per address in an hour (a class signing up together)
export const QUESTIONS = 8;                             // the security questions are numbered 0..7; their words are in js/i18n.js
export const ANS_MIN = 2, ANS_MAX = 60;                 // characters of a security answer, after cleaning
export const ANS_FAIL = 10;                             // wrong answers per email address in an hour, then the reset is locked until the hour ends
export const ANS_IP_FAIL = 300;                         // wrong answers per address in an hour (a school resetting together); stops one address trying many emails
export const PUT_DAY = 300;                             // saves of the records per account in a day (D1 writes are shared)
/* W9 (v2.0.0, Terry chose Option A): a challenge not accepted in 24 hours goes; after accepting, both have 24 hours to
   finish (a side that has not finished loses); each student keeps the last 20 challenges */
export const CH_ACCEPT_MS = DAY, CH_PLAY_MS = DAY, CH_KEEP = 20;
export const FRIEND_ADD_DAY = 60;                       // friends/add calls per account in a day, found or not

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, pw TEXT NOT NULL,
     qid INTEGER NOT NULL, ans TEXT NOT NULL, avatar INTEGER NOT NULL DEFAULT 0, code TEXT NOT NULL UNIQUE, created INTEGER NOT NULL, seen INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, n INTEGER NOT NULL, reset INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS progress (user_id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS friends (from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL,
     PRIMARY KEY (from_id, to_id))`,
  `CREATE INDEX IF NOT EXISTS friends_to ON friends(to_id)`,
  /* a = the sender (from_id), b = the friend (to_id). status: sent → accepted or declined. *_start: when that side first
     opened the set (the server counts the time from it); *_score: { c, n, ok[], time } once that side has finished */
  `CREATE TABLE IF NOT EXISTS duels (id INTEGER PRIMARY KEY, from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, created INTEGER NOT NULL,
     settings TEXT NOT NULL, questions TEXT NOT NULL, status TEXT NOT NULL, accepted INTEGER,
     a_start INTEGER, b_start INTEGER, a_score TEXT, b_score TEXT)`,
  `CREATE INDEX IF NOT EXISTS duels_from ON duels(from_id)`,
  `CREATE INDEX IF NOT EXISTS duels_to ON duels(to_id)`
];
/* W10 (Terry: "wipe the Test accounts"): the Test database was made when an account was an email code. A users table
   without the security question (qid) is that old kind: every table of accounts is dropped once and made again. A database
   that already has qid (every new one, and Production) is never touched. */
const OLD_TABLES = ['users', 'sessions', 'codes', 'resets', 'progress', 'friends', 'challenges', 'duels'];
async function migrate(db) {
  const cols = await db.prepare("SELECT name FROM pragma_table_info('users')").all();
  if (cols.results.length && !cols.results.some(c => c.name === 'qid')) await db.batch(OLD_TABLES.map(t => db.prepare('DROP TABLE IF EXISTS ' + t)));
}
let schemaReady = null;   // one pass per database per isolate
const ensureSchema = db => {
  if (!schemaReady || schemaReady.db !== db) schemaReady = { db, p: migrate(db).then(() => db.batch(SCHEMA.map(s => db.prepare(s)))).catch(e => { schemaReady = null; throw e; }) };
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

/* the security answer: capital letters, extra spaces and full-width characters do not matter */
const cleanAnswer = a => String(a || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
const okAnswer = a => { const c = cleanAnswer(a); return typeof a === 'string' && a.length <= 200 && c.length >= ANS_MIN && c.length <= ANS_MAX; };
const okQid = q => Number.isInteger(q) && q >= 0 && q < QUESTIONS;

/* ---------- routes ---------- */
const ROUTES = {
  'GET health': async () => ({ ok: true }),

  /* sign-up: email, display name, password, picture and one security question with its answer. The email is not checked
     (no message is sent); one address holds one account and a display name is used once. */
  'POST register': async ({ db, body, now, ip }) => {
    const email = normEmail(str(body.email, 260)), name = normName(str(body.username, 40)), pw = body.password;
    if (!EMAIL.test(email)) fail(400, 'bad_email');
    if (!USERNAME.test(name)) fail(400, 'bad_username');
    if (!okPassword(pw)) fail(400, 'bad_password');
    if (!okQid(body.qid)) fail(400, 'bad_question');
    if (!okAnswer(body.answer)) fail(400, 'bad_answer');
    const avatar = Number.isInteger(body.avatar) && body.avatar >= 0 && body.avatar < AVATARS.length ? body.avatar : 0;
    await limitOr429(db, 'regip:' + ip, REG_IP, 60 * MIN, now);
    if (await db.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) fail(409, 'email_taken');
    if (await db.prepare('SELECT 1 FROM users WHERE name = ?').bind(name).first()) fail(409, 'username_taken');
    let code;
    for (let i = 0; i < 5 && !code; i++) { const c = friendCode(); if (!(await db.prepare('SELECT 1 FROM users WHERE code = ?').bind(c).first())) code = c; }
    if (!code) fail(500, 'server');
    let r;
    try {
      r = await db.prepare('INSERT INTO users (name, email, pw, qid, ans, avatar, code, created, seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(name, email, await hashPassword(pw), body.qid, await hashPassword(cleanAnswer(body.answer)), avatar, code, now, now).run();
    } catch (e) {   // two sign-ups at the same moment with the same email or name: the UNIQUE columns decide
      if (/UNIQUE/i.test(String(e && e.message))) fail(409, /email/i.test(e.message) ? 'email_taken' : 'username_taken');
      throw e;
    }
    const id = r.meta.last_row_id;
    return { token: await newSession(db, id, now), me: meOf({ name, email, avatar, code }) };
  },
  /* R1.3: a school or a family shares one address, so the per-address guard counts only wrong passwords (60 in 15
     minutes); every sign-in from one address, right or wrong, has a much higher cap (600 in 15 minutes) */
  'POST login': async ({ db, body, now, ip }) => {
    const name = normEmail(str(body.email, 260)), pw = typeof body.password === 'string' ? body.password : '';
    await limitOr429(db, 'loginall:' + ip, LOGIN_IP_ALL, 15 * MIN, now);
    if (await full(db, 'loginip:' + ip, LOGIN_IP_FAIL, now)) fail(429, 'too_many');
    if (await full(db, 'login:' + name, 10, now)) fail(429, 'too_many');
    const u = EMAIL.test(name) ? await db.prepare('SELECT * FROM users WHERE email = ?').bind(name).first() : null;
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
  /* forgot password, step 1: the number of the security question. An address with no account says so (no_account):
     sign-up already tells whether an address is taken, as an address can be used once, so hiding it here would only
     leave a student guessing why the answer never works (R4.5). */
  'POST reset/question': async ({ db, body, now, ip }) => {
    const email = normEmail(str(body.email, 260));
    await limitOr429(db, 'qip:' + ip, 120, 60 * MIN, now);
    const u = EMAIL.test(email) ? await db.prepare('SELECT qid FROM users WHERE email = ?').bind(email).first() : null;
    if (!u) fail(404, 'no_account');
    return { qid: u.qid };
  },
  /* step 2: the email, the answer and a new password. Wrong answers count per address (10 an hour, then locked until the
     hour ends, even for the right answer) and per network address. */
  'POST reset': async ({ db, body, now, ip }) => {
    const email = normEmail(str(body.email, 260));
    if (!okPassword(body.password)) fail(400, 'bad_password');
    if (await full(db, 'ans:' + email, ANS_FAIL, now) || await full(db, 'ansip:' + ip, ANS_IP_FAIL, now)) fail(429, 'reset_locked');
    const u = EMAIL.test(email) ? await db.prepare('SELECT id, name, ans FROM users WHERE email = ?').bind(email).first() : null;
    const answer = typeof body.answer === 'string' && body.answer.length <= 200 ? cleanAnswer(body.answer) : '';
    if (!u || !answer || !(await checkPassword(answer, u.ans))) {
      await limit(db, 'ans:' + email, ANS_FAIL, 60 * MIN, now);
      await limit(db, 'ansip:' + ip, ANS_IP_FAIL, 60 * MIN, now);
      fail(400, 'wrong_answer');
    }
    await db.batch([
      db.prepare('UPDATE users SET pw = ? WHERE id = ?').bind(await hashPassword(body.password), u.id),
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),   // every device signs in again
      db.prepare('DELETE FROM limits WHERE key = ? OR key = ?').bind('login:' + email, 'ans:' + email)
    ]);
    return { ok: true };
  },
  'POST account/delete': async ({ db, me, body }) => {
    const u = await db.prepare('SELECT pw FROM users WHERE id = ?').bind(me.id).first();
    if (typeof body.password !== 'string' || !(await checkPassword(body.password, u.pw))) fail(401, 'wrong_login');
    await db.batch([
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(me.id),
      db.prepare('DELETE FROM progress WHERE user_id = ?').bind(me.id),
      db.prepare('DELETE FROM friends WHERE from_id = ? OR to_id = ?').bind(me.id, me.id),
      db.prepare('DELETE FROM duels WHERE from_id = ? OR to_id = ?').bind(me.id, me.id),
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

  /* W9 challenges: the sender chooses the set and sends it; both can start at once; the friend accepts or declines.
     The server keeps the time: from the first opening of the set (start) to the result. Higher accuracy wins, then the
     shorter time; a side that has not finished 24 hours after accepting loses. */
  'POST challenges': async ({ db, me, body, now }) => {
    const u = await db.prepare('SELECT id, name FROM users WHERE name = ?').bind(normName(str(body.to, 40))).first();
    if (!u) fail(404, 'no_user');
    if (!(await isFriend(db, me.id, u.id))) fail(403, 'not_friends');
    const settings = JSON.stringify(cleanSettings(body.settings));
    if (!Array.isArray(body.questions) || !body.questions.length || body.questions.length > 60) fail(400, 'bad_input');
    if (!body.questions.every(questionOk)) fail(400, 'bad_set');   // R1.2: only questions the app can draw
    const questions = JSON.stringify(body.questions);
    if (questions.length > MAX_SET) fail(413, 'too_big');
    await limitOr429(db, 'challenge:' + me.id, 30, DAY, now);
    const r = await db.prepare(`INSERT INTO duels (from_id, to_id, created, settings, questions, status) VALUES (?, ?, ?, ?, ?, 'sent')`)
      .bind(me.id, u.id, now, settings, questions).run();
    await keepLast(db, me.id); await keepLast(db, u.id);
    return { id: r.meta.last_row_id };
  },
  'GET challenges': async ({ db, me, now }) => {
    await dropUnanswered(db, me.id, now);
    const rows = (await db.prepare(`${DUEL_SELECT} WHERE c.from_id = ? OR c.to_id = ? ORDER BY c.id DESC LIMIT ${CH_KEEP}`).bind(me.id, me.id).all()).results;
    return { challenges: rows.map(r => challengeOut(r, me.id, now)), now };
  },
  'GET challenges/:id': async ({ db, me, id, now }) => {
    return challengeOut(await duelOf(db, me, id, now), me.id, now);   // no questions: those come with start, which starts the clock
  },
  'POST challenges/:id/answer': async ({ db, me, id, body, now }) => {
    const r = await duelOf(db, me, id, now);
    if (r.to_id !== me.id) fail(404, 'no_challenge');
    if (r.status !== 'sent') fail(409, r.status === 'declined' ? 'declined' : 'already_answered');
    if (body.accept === true) await db.prepare(`UPDATE duels SET status = 'accepted', accepted = ? WHERE id = ? AND status = 'sent'`).bind(now, id).run();
    else await db.prepare(`UPDATE duels SET status = 'declined' WHERE id = ? AND status = 'sent'`).bind(id).run();
    return challengeOut(await duelOf(db, me, id, now), me.id, now);
  },
  'POST challenges/:id/start': async ({ db, me, id, now }) => {
    const r = await duelOf(db, me, id, now), side = r.from_id === me.id ? 'a' : 'b';
    canPlay(r, side, now);
    if (r[side + '_start'] === null) await db.prepare(`UPDATE duels SET ${side}_start = ? WHERE id = ? AND ${side}_start IS NULL`).bind(now, id).run();
    const fresh = await duelOf(db, me, id, now);
    return Object.assign(challengeOut(fresh, me.id, now), { questions: JSON.parse(fresh.questions), started: fresh[side + '_start'], now });
  },
  'POST challenges/:id/result': async ({ db, me, id, body, now }) => {
    const r = await duelOf(db, me, id, now), side = r.from_id === me.id ? 'a' : 'b';
    canPlay(r, side, now);
    if (r[side + '_start'] === null) fail(409, 'not_started');
    const score = cleanScore(body.score, JSON.parse(r.questions).length);
    score.time = now - r[side + '_start'];   // the server's clock, not the app's
    const ch = await db.prepare(`UPDATE duels SET ${side}_score = ? WHERE id = ? AND ${side}_score IS NULL`).bind(JSON.stringify(score), id).run();
    if (!ch.meta.changes) fail(409, 'already_done');
    return challengeOut(await duelOf(db, me, id, now), me.id, now);
  }
};

const DUEL_SELECT = `SELECT c.*, a.name AS a_name, a.avatar AS a_av, b.name AS b_name, b.avatar AS b_av
  FROM duels c JOIN users a ON a.id = c.from_id JOIN users b ON b.id = c.to_id`;
/* one challenge of this student (404 for anyone else); one not accepted in 24 hours is gone */
async function duelOf(db, me, id, now) {
  await dropUnanswered(db, me.id, now);
  const r = await db.prepare(DUEL_SELECT + ' WHERE c.id = ?').bind(id).first();
  if (!r || (r.from_id !== me.id && r.to_id !== me.id)) fail(404, 'no_challenge');
  return r;
}
const dropUnanswered = (db, uid, now) => db.prepare(`DELETE FROM duels WHERE (from_id = ? OR to_id = ?) AND status = 'sent' AND created < ?`).bind(uid, uid, now - CH_ACCEPT_MS).run();
/* each student keeps the last 20: older ones go (for both sides) */
const keepLast = (db, uid) => db.prepare(`DELETE FROM duels WHERE (from_id = ? OR to_id = ?) AND id NOT IN
  (SELECT id FROM duels WHERE from_id = ? OR to_id = ? ORDER BY id DESC LIMIT ${CH_KEEP})`).bind(uid, uid, uid, uid).run();
/* the time by which this challenge must be done: 24 hours after accepting (before that, the 24 hours to accept) */
const deadlineOf = r => (r.status === 'accepted' ? r.accepted + CH_PLAY_MS : r.created + CH_ACCEPT_MS);
function canPlay(r, side, now) {
  if (r.status === 'declined') fail(409, 'declined');
  if (side === 'b' && r.status !== 'accepted') fail(409, 'not_accepted');
  if (r[side + '_score'] !== null) fail(409, 'already_done');
  if (now > deadlineOf(r)) fail(409, 'too_late');
}
/* who won: higher accuracy, then the shorter time; a side that did not finish loses. 'a' | 'b' | 'draw' | 'none' */
export function winnerOf(a, b) {
  if (!a && !b) return 'none';
  if (!a) return 'b';
  if (!b) return 'a';
  const pa = a.c / a.n, pb = b.c / b.n;
  if (pa !== pb) return pa > pb ? 'a' : 'b';
  const ta = Number.isFinite(a.time) ? a.time : Infinity, tb = Number.isFinite(b.time) ? b.time : Infinity;
  return ta === tb ? 'draw' : ta < tb ? 'a' : 'b';
}

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
/* a challenge as one student sees it: "me" and "them" instead of a and b. The friend's score shows only once this
   student has finished or the challenge is over (before that only that the friend has finished), so nobody aims at it. */
function challengeOut(r, me, now) {
  const mine = r.from_id === me;
  const a = r.a_score ? JSON.parse(r.a_score) : null, b = r.b_score ? JSON.parse(r.b_score) : null;
  const deadline = deadlineOf(r);
  const over = r.status === 'declined' || (!!a && !!b) || (r.status === 'accepted' && now > deadline);
  const w = over && r.status !== 'declined' ? winnerOf(a, b) : null;
  const my = mine ? a : b, their = mine ? b : a;
  return {
    id: r.id, created: r.created, mine, status: r.status, accepted: r.accepted || null, deadline, over,
    winner: w === null ? null : w === 'none' || w === 'draw' ? w : (w === 'a') === mine ? 'me' : 'them',
    from: { username: r.a_name, avatar: r.a_av }, to: { username: r.b_name, avatar: r.b_av },
    started: !!(mine ? r.a_start : r.b_start),
    settings: JSON.parse(r.settings),
    me: my, them: their && !over && !my ? { done: true } : their
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
    const ctx = {
      db, env, now, id, origin,
      ip: request.headers.get('CF-Connecting-IP') || 'local',
      body: request.method === 'POST' || request.method === 'PUT' ? await readBody(request) : {},
      me: null
    };
    const open = ['GET health', 'POST register', 'POST login', 'POST reset/question', 'POST reset'];
    if (!open.includes(request.method + ' ' + routePath)) ctx.me = await auth(db, request, now);
    return json(200, await route(ctx), origin);
  } catch (e) {
    if (e instanceof Fail) return json(e.status, Object.assign({ error: e.code }, e.extra || {}), origin);
    console.error(e);
    return json(500, { error: 'server' }, origin);
  }
}
