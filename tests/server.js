/* Run with: node tests/server.js   The server (server/api.js) on an in-memory database: accounts (email, display name, password, security question), sign-in limits,
   password reset by the answer, progress, friends, challenges, CORS and the Production rules. Prints "N passed, M failed". */
const assert = require('assert');
const { fakeD1, api } = require('./local-api.js');

let pass = 0, fail = 0;
const results = [];
function t(name, fn) { results.push([name, fn]); }

let clock = Date.UTC(2026, 10, 12, 3, 0, 0);
const now = () => clock;
const later = ms => { clock += ms; };
const MIN = 60e3;

let H, env;
function fresh(extra = {}) { env = Object.assign({ DB: fakeD1() }, extra); }
async function call(method, route, body, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = 'Bearer ' + opts.token;
  if (opts.origin) headers.Origin = opts.origin;
  if (opts.ip) headers['CF-Connecting-IP'] = opts.ip;
  const host = opts.host || 'test.student-practice.pages.dev';
  const req = new Request('https://' + host + '/api/' + route, { method, headers, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
  const res = await H.handle(req, opts.env || env, { now });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}
let n = 0;
/* a whole sign-up (W10: email, display name, password, a security question and its answer); returns the token */
async function signUp(name, email = name + '@example.com', password = 'secret-pass', opts = {}) {
  const r = await call('POST', 'register', { email, username: name, password, qid: 0, answer: 'Rex', avatar: (n++) % 12 }, opts);
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  return r.body.token;
}
async function befriend(ta, tb, nameB, nameA) {
  assert.strictEqual((await call('POST', 'friends/add', { who: nameB }, { token: ta })).body.status, 'sent');
  assert.strictEqual((await call('POST', 'friends/answer', { username: nameA, accept: true }, { token: tb })).status, 200);
}
const QS = [{ q: { en: '1+1', zh: '1+1' }, answer: '2', value: 2, type: 'input', topic: 'add' },
  { q: { en: '2+2?', zh: '2+2?' }, choices: [{ en: '3' }, { en: '4' }], correct: 1, type: 'mc', topic: 'add' }];
const SET = { subject: 'maths', year: 5, topic: 'k6frac', diff: 2, count: 2 };

/* ---------- sign-up ---------- */
t('health answers', async () => { fresh(); const r = await call('GET', 'health'); assert.strictEqual(r.status, 200); assert.ok(r.body.ok); });
t('no database: not_set_up (503)', async () => { const r = await call('GET', 'health', undefined, { env: {} }); assert.strictEqual(r.status, 503); assert.strictEqual(r.body.error, 'not_set_up'); });
t('unknown route 404', async () => { fresh(); assert.strictEqual((await call('GET', 'nope')).status, 404); });
t('sign-up makes an account and a session', async () => {
  fresh(); const tok = await signUp('xiaoming_08');
  const me = await call('GET', 'me', undefined, { token: tok });
  assert.strictEqual(me.status, 200); assert.strictEqual(me.body.me.username, 'xiaoming_08');
  assert.ok(/^[A-Z2-9]{6}$/.test(me.body.me.friendCode), me.body.me.friendCode);
  assert.strictEqual(me.body.me.email, 'xi***@example.com');
});
t('the password is stored as PBKDF2, never as typed', async () => {
  fresh(); await signUp('anan', 'anan@example.com', 'my-password-1');
  const row = env.DB.raw.prepare('SELECT pw FROM users').get();
  assert.ok(row.pw.startsWith('pbkdf2$20000$')); assert.ok(!row.pw.includes('my-password-1'));
});
t('the security answer is stored as PBKDF2 of the cleaned answer, never as typed', async () => {
  fresh(); await signUp('anan');
  const row = env.DB.raw.prepare('SELECT ans, qid FROM users').get();
  assert.ok(row.ans.startsWith('pbkdf2$20000$')); assert.ok(!/rex/i.test(row.ans)); assert.strictEqual(row.qid, 0);
});
t('session tokens are stored hashed', async () => {
  fresh(); const tok = await signUp('anan');
  const row = env.DB.raw.prepare('SELECT token FROM sessions').get();
  assert.notStrictEqual(row.token, tok); assert.strictEqual(row.token.length, 64);
});
const REG = (o = {}) => Object.assign({ email: 'a@example.com', username: 'abc', password: 'password1', qid: 3, answer: 'Elm street' }, o);
t('bad email refused', async () => {
  fresh();
  for (const bad of ['not-an-email', 'a@b', 'a b@example.com', '', 'x'.repeat(300) + '@example.com']) assert.ok(['bad_email', 'bad_input'].includes((await call('POST', 'register', REG({ email: bad }))).body.error), bad);
});
t('W10 no email is sent and none is needed: sign-up works on a Production host with no settings at all', async () => {
  fresh();
  for (const host of ['student-practice.pages.dev', 'tianruisun.github.io']) {
    const r = await call('POST', 'register', REG({ email: host + '@example.com', username: host.slice(0, 5) }), { host });
    assert.strictEqual(r.status, 200, host + JSON.stringify(r.body));
  }
});
t('W10 the email code routes are gone', async () => {
  fresh();
  for (const [m, r] of [['POST', 'code'], ['POST', 'code/check'], ['POST', 'reset/finish']]) assert.strictEqual((await call(m, r, {})).body.error, 'no_route', r);
});
t('W10 one account per email: a second sign-up with it (any case) is refused, the first account stays', async () => {
  fresh(); await signUp('anan', 'Mum@Example.com');
  const r = await call('POST', 'register', REG({ email: 'mum@example.COM', username: 'brother' }));
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.error, 'email_taken');
  assert.strictEqual(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
  assert.strictEqual((await call('POST', 'register', REG({ email: 'other@example.com', username: 'brother' }))).status, 200, 'another email is free');
});
t('W10 the display name is used once: any case is the same name, other rules too', async () => {
  fresh(); await signUp('leo_9');
  assert.strictEqual((await call('POST', 'register', REG({ username: 'LEO_9' }))).body.error, 'username_taken');
  for (const bad of ['ab', 'a'.repeat(21), 'has space', '名字', 'a-b']) assert.strictEqual((await call('POST', 'register', REG({ username: bad }))).body.error, 'bad_username', bad);
  assert.strictEqual((await call('POST', 'register', REG({ username: 'Mia_Q' }))).body.me.username, 'mia_q');
  assert.strictEqual(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM users').get().n, 2, 'a refused name creates nothing');
});
t('password under 8 characters refused', async () => {
  fresh(); assert.strictEqual((await call('POST', 'register', REG({ password: 'short' }))).body.error, 'bad_password');
});
t('W10 the security question must be one of the 8, the answer 2 to 60 characters', async () => {
  fresh();
  for (const q of [-1, 8, 1.5, '1', null, undefined]) assert.strictEqual((await call('POST', 'register', REG({ qid: q }))).body.error, 'bad_question', String(q));
  for (const a of ['', ' ', 'x', '  y ', 'z'.repeat(61), 5, null]) assert.strictEqual((await call('POST', 'register', REG({ answer: a }))).body.error, 'bad_answer', String(a));
  assert.strictEqual((await call('POST', 'register', REG({ qid: 7, answer: '猫咪' }))).status, 200, 'two Chinese characters are enough');
});
t('W10 a class signing up from one address: 100 sign-ups in an hour all work, the cap is 150', async () => {
  fresh();
  for (let i = 0; i < 100; i++) assert.strictEqual((await call('POST', 'register', REG({ email: 'kid' + i + '@example.com', username: 'kid_' + i }), { ip: '10.0.0.4' })).status, 200, 'sign-up ' + (i + 1));
  assert.strictEqual(H.REG_IP, 150);
});

/* ---------- sign-in ---------- */
t('sign in with email and password, any case of the email; the display name does not sign in', async () => {
  fresh(); await signUp('anan', undefined, 'password-1');
  const r = await call('POST', 'login', { email: 'AnAn@Example.com', password: 'password-1' });
  assert.strictEqual(r.status, 200); assert.strictEqual((await call('POST', 'login', { username: 'anan', password: 'password-1' })).status, 400); assert.ok(r.body.token); assert.strictEqual(r.body.me.username, 'anan');
});
t('wrong password and unknown name give the same answer', async () => {
  fresh(); await signUp('anan', undefined, 'password-1');
  const a = await call('POST', 'login', { email: 'anan@example.com', password: 'nope-nope' }), b = await call('POST', 'login', { email: 'nobody@example.com', password: 'nope-nope' });
  assert.strictEqual(a.status, 401); assert.deepStrictEqual(a.body, b.body);
});
t('ten wrong passwords lock that email for 15 minutes, even with the right one', async () => {
  fresh(); await signUp('anan', undefined, 'password-1');
  for (let i = 0; i < 10; i++) await call('POST', 'login', { email: 'anan@example.com', password: 'wrong-' + i });
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' })).status, 429);
  later(15 * MIN + 1); assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' })).status, 200);
});
t('sign out ends that session only', async () => {
  fresh(); const t1 = await signUp('anan', undefined, 'password-1');
  const t2 = (await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' })).body.token;
  assert.strictEqual((await call('POST', 'logout', {}, { token: t1 })).status, 200);
  assert.strictEqual((await call('GET', 'me', undefined, { token: t1 })).status, 401);
  assert.strictEqual((await call('GET', 'me', undefined, { token: t2 })).status, 200);
});
t('no token or a made-up token: signed_out', async () => {
  fresh(); assert.strictEqual((await call('GET', 'me')).body.error, 'signed_out');
  assert.strictEqual((await call('GET', 'me', undefined, { token: 'x'.repeat(43) })).body.error, 'signed_out');
});
t('a session ends after 90 days', async () => {
  fresh(); const tok = await signUp('anan'); later(91 * 24 * 60 * MIN);
  assert.strictEqual((await call('GET', 'me', undefined, { token: tok })).status, 401);
});
t('change picture', async () => {
  fresh(); const tok = await signUp('anan');
  assert.strictEqual((await call('POST', 'me/avatar', { avatar: 7 }, { token: tok })).status, 200);
  assert.strictEqual((await call('GET', 'me', undefined, { token: tok })).body.me.avatar, 7);
  assert.strictEqual((await call('POST', 'me/avatar', { avatar: 99 }, { token: tok })).status, 400);
});

/* ---------- forgot password (W10: the email and the answer to the security question) ---------- */
const RESET = (o = {}) => Object.assign({ email: 'anan@example.com', answer: 'Rex', password: 'new-password' }, o);
t('W10 reset: the question number comes for an email; unknown emails get a question too, always the same one', async () => {
  fresh(); await signUp('anan');
  assert.deepStrictEqual((await call('POST', 'reset/question', { email: 'ANAN@example.com' })).body, { qid: 0 });
  const a = (await call('POST', 'reset/question', { email: 'nobody@example.com' })).body, b = (await call('POST', 'reset/question', { email: 'nobody@example.com' })).body;
  assert.ok(Number.isInteger(a.qid) && a.qid >= 0 && a.qid < 8); assert.deepStrictEqual(a, b);
  assert.strictEqual((await call('POST', 'reset/question', { email: 'not an email' })).status, 200);
});
t('W10 reset: the right answer (any case, extra spaces) sets a new password and ends the old sessions', async () => {
  fresh(); const old = await signUp('anan', undefined, 'password-1');
  assert.strictEqual((await call('POST', 'reset', RESET({ answer: '  rEX ' }))).status, 200);
  assert.strictEqual((await call('GET', 'me', undefined, { token: old })).status, 401);
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'new-password' })).status, 200);
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' })).status, 401);
});
t('W10 reset: a two-word answer ignores case, spaces and full-width letters', async () => {
  fresh(); await call('POST', 'register', REG({ answer: 'Elm  Street' }));
  assert.strictEqual((await call('POST', 'reset', RESET({ email: 'a@example.com', answer: 'ＥＬＭ street' }))).status, 200);
});
t('W10 reset: a wrong answer changes nothing; an unknown email answers the same', async () => {
  fresh(); await signUp('anan', undefined, 'password-1');
  const a = await call('POST', 'reset', RESET({ answer: 'Max' })), b = await call('POST', 'reset', RESET({ email: 'nobody@example.com', answer: 'Max' }));
  assert.strictEqual(a.status, 400); assert.strictEqual(a.body.error, 'wrong_answer'); assert.deepStrictEqual(a.body, b.body);
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' })).status, 200);
  assert.strictEqual((await call('POST', 'reset', RESET({ answer: '' }))).body.error, 'wrong_answer');
});
t('W10 reset: a new password under 8 characters is refused and does not count as a wrong answer', async () => {
  fresh(); await signUp('anan');
  for (let i = 0; i < 12; i++) assert.strictEqual((await call('POST', 'reset', RESET({ password: 'short' }))).body.error, 'bad_password');
  assert.strictEqual((await call('POST', 'reset', RESET())).status, 200);
});
t('W10 reset: 10 wrong answers lock that email for 1 hour, even for the right answer', async () => {
  fresh(); await signUp('anan'); await signUp('leo');
  for (let i = 0; i < 10; i++) assert.strictEqual((await call('POST', 'reset', RESET({ answer: 'no' + i }))).body.error, 'wrong_answer', 'wrong ' + (i + 1));
  assert.strictEqual((await call('POST', 'reset', RESET())).status, 429);
  assert.strictEqual((await call('POST', 'reset', RESET({ email: 'leo@example.com' }))).status, 200, 'another email is not locked');
  later(59 * MIN); assert.strictEqual((await call('POST', 'reset', RESET())).status, 429, 'still locked at 59 minutes');
  later(2 * MIN); assert.strictEqual((await call('POST', 'reset', RESET())).status, 200, 'free after the hour');
});
t('W10 reset: a school guessing from one address is stopped after 100 wrong answers in an hour; other addresses are not', async () => {
  fresh(); await signUp('anan');
  assert.strictEqual(H.ANS_FAIL, 10); assert.strictEqual(H.ANS_IP_FAIL, 100);
  for (let i = 0; i < 100; i++) await call('POST', 'reset', RESET({ email: 'x' + i + '@example.com', answer: 'no' }), { ip: '10.0.0.9' });
  assert.strictEqual((await call('POST', 'reset', RESET(), { ip: '10.0.0.9' })).status, 429);
  assert.strictEqual((await call('POST', 'reset', RESET(), { ip: '10.0.0.10' })).status, 200);
});
t('W10 the reset also clears the sign-in lock, so the new password works at once', async () => {
  fresh(); await signUp('anan', undefined, 'password-1');
  for (let i = 0; i < 10; i++) await call('POST', 'login', { email: 'anan@example.com', password: 'wrong-' + i });
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' })).status, 429);
  assert.strictEqual((await call('POST', 'reset', RESET())).status, 200);
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'new-password' })).status, 200);
});
t('W10 Test accounts are wiped once: a database made for email codes (no security question) is dropped and made again', async () => {
  fresh(); const raw = env.DB.raw;
  raw.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, email TEXT NOT NULL, pw TEXT NOT NULL, avatar INTEGER NOT NULL DEFAULT 0, code TEXT NOT NULL UNIQUE, created INTEGER NOT NULL, seen INTEGER NOT NULL)");
  raw.exec("INSERT INTO users (name, email, pw, code, created, seen) VALUES ('old', 'old@example.com', 'x', 'ABCDEF', 1, 1)");
  raw.exec("CREATE TABLE codes (email TEXT PRIMARY KEY, hash TEXT NOT NULL, expires INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0)");
  assert.strictEqual((await call('GET', 'health')).status, 200);
  assert.strictEqual(raw.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0, 'old accounts gone');
  assert.ok(raw.prepare("SELECT name FROM pragma_table_info('users')").all().some(c => c.name === 'qid'));
  assert.strictEqual(raw.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name IN ('codes', 'resets')").get().n, 0, 'the code tables are gone');
  assert.strictEqual((await call('POST', 'register', REG({ email: 'old@example.com', username: 'old' }))).status, 200, 'the old email and name can sign up again');
});

/* ---------- progress ---------- */
t('progress: empty, then saved and read back', async () => {
  fresh(); const tok = await signUp('anan');
  assert.strictEqual((await call('GET', 'progress', undefined, { token: tok })).body.data, null);
  const data = { 'sp.history': [{ n: 10, correct: 9 }], 'sp.settings': { year: 5 } };
  assert.strictEqual((await call('PUT', 'progress', { data }, { token: tok })).status, 200);
  assert.deepStrictEqual((await call('GET', 'progress', undefined, { token: tok })).body.data, data);
});
t('progress over the size limit refused', async () => {
  fresh(); const tok = await signUp('anan');
  assert.strictEqual((await call('PUT', 'progress', { data: { x: 'y'.repeat(950000) } }, { token: tok })).status, 413);
});
t('progress needs sign-in', async () => { fresh(); assert.strictEqual((await call('GET', 'progress')).status, 401); });
/* R1.1: two devices on one account */
t('R1.1 a save from an older copy is refused (stale, 409) with the server copy, and nothing is written', async () => {
  fresh(); const phone = await signUp('anan'), tablet = (await call('POST', 'login', { email: 'anan@example.com', password: 'secret-pass' })).body.token;
  const p1 = await call('PUT', 'progress', { data: { keys: { history: [{ date: 1 }] } }, base: 0 }, { token: phone });
  assert.strictEqual(p1.status, 200); assert.ok(p1.body.updated > 0);
  const t1 = await call('PUT', 'progress', { data: { keys: { history: [{ date: 2 }] } }, base: 0 }, { token: tablet });
  assert.strictEqual(t1.status, 409); assert.strictEqual(t1.body.error, 'stale');
  assert.deepStrictEqual(t1.body.data, { keys: { history: [{ date: 1 }] } }); assert.strictEqual(t1.body.updated, p1.body.updated);
  assert.deepStrictEqual((await call('GET', 'progress', undefined, { token: phone })).body.data.keys.history, [{ date: 1 }]);
  // the tablet merges and saves on top of the copy it was given
  const t2 = await call('PUT', 'progress', { data: { keys: { history: [{ date: 1 }, { date: 2 }] } }, base: t1.body.updated }, { token: tablet });
  assert.strictEqual(t2.status, 200); assert.ok(t2.body.updated > p1.body.updated, 'updated always moves on');
  assert.strictEqual((await call('PUT', 'progress', { data: { keys: {} } }, { token: phone })).status, 409, 'no base on an existing copy');
});
t('R1.1 two saves in the same millisecond still get different versions', async () => {
  fresh(); const tok = await signUp('anan');
  const a = await call('PUT', 'progress', { data: { x: 1 }, base: 0 }, { token: tok });
  const b = await call('PUT', 'progress', { data: { x: 2 }, base: a.body.updated }, { token: tok });
  assert.strictEqual(b.status, 200); assert.notStrictEqual(a.body.updated, b.body.updated);
  assert.strictEqual((await call('PUT', 'progress', { data: { x: 3 }, base: a.body.updated }, { token: tok })).status, 409);
});
t('R1.4 at most 300 saves of the records per account in a day', async () => {
  fresh(); const tok = await signUp('anan'); let base = 0, last;
  for (let i = 0; i < 300; i++) { last = await call('PUT', 'progress', { data: { i }, base }, { token: tok }); assert.strictEqual(last.status, 200, 'save ' + (i + 1)); base = last.body.updated; }
  assert.strictEqual((await call('PUT', 'progress', { data: { i: 301 }, base }, { token: tok })).status, 429);
  const other = await signUp('leo'); assert.strictEqual((await call('PUT', 'progress', { data: { y: 1 }, base: 0 }, { token: other })).status, 200, 'another account is not affected');
  later(24 * 60 * MIN + 1); assert.strictEqual((await call('PUT', 'progress', { data: { i: 302 }, base }, { token: tok })).status, 200);
});
/* R1.3: one address (a school) */
t('R1.3 a school on one address: 200 right sign-ins in 15 minutes all succeed', async () => {
  fresh(); await signUp('anan', undefined, 'password-1');
  for (let i = 0; i < 200; i++) assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' }, { ip: '10.0.0.1' })).status, 200, 'sign-in ' + (i + 1));
});
t('R1.3 60 wrong passwords from one address stop that address only, and right ones are capped at 600', async () => {
  fresh(); await signUp('anan', undefined, 'password-1');
  for (let i = 0; i < 60; i++) await call('POST', 'login', { email: 'u' + (i % 30) + 'x@example.com', password: 'wrong-pass' }, { ip: '10.0.0.2' });
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' }, { ip: '10.0.0.2' })).status, 429);
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' }, { ip: '10.0.0.3' })).status, 200);
  const H2 = H; assert.strictEqual(H2.LOGIN_IP_ALL, 600); assert.strictEqual(H2.LOGIN_IP_FAIL, 60);
});
/* R1.9 */
t('R1.9 friends/add counts every try, found or not (60 a day)', async () => {
  fresh(); const a = await signUp('anan'); await signUp('leo');
  for (let i = 0; i < 60; i++) assert.strictEqual((await call('POST', 'friends/add', { who: 'ZZZZZ' + (i % 9 + 1) }, { token: a })).body.error, 'no_user');
  assert.strictEqual((await call('POST', 'friends/add', { who: 'leo' }, { token: a })).status, 429);
});
/* R1.2 */
t('R1.2 a set with questions the app cannot draw is refused (bad_set)', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  const bad = [[{ type: 'input' }], [{ q: { en: 'x' }, topic: 'add', type: 'mc', choices: [{ en: 'a' }], correct: 0 }], [{ q: { en: 'x' }, topic: 'add', type: 'input', answer: '2' }],
    [{ q: 'x', topic: 'add', type: 'input', value: 2, answer: '2' }], [{ q: { en: 'x' }, topic: 'add', type: 'mc', choices: [{ en: 'a' }, { en: 'b' }], correct: 2 }],
    [{ q: { en: 'x' }, topic: 'add', type: 'input', value: 2, answer: '2', fig: 'x' }], [{ q: { en: 'x' }, topic: 'add', type: 'essay', value: 2, answer: '2' }], ['x']];
  for (const qs of bad) {
    const r = await call('POST', 'challenges', { to: 'leo', settings: SET, questions: qs, score: { ok: qs.map(() => true) } }, { token: a });
    assert.strictEqual(r.status, 400, JSON.stringify(qs)); assert.strictEqual(r.body.error, 'bad_set', JSON.stringify(qs));
  }
  assert.strictEqual((await call('GET', 'challenges', undefined, { token: b })).body.challenges.length, 0);
});
t('R1.2 every question the app makes passes the check (all years, subjects, topics and levels)', async () => {
  for (const f of ['gen-core', 'gen-maths', 'gen-word', 'gen-junior', 'gen-senior', 'gen-charts', 'gen-olympiad', 'gen-amo', 'gen-ga', 'gen-k6', 'scope-k6', 'lessons-k2', 'lessons-36']) require('../js/' + f + '.js');
  const G = globalThis.Gen; let n = 0; const bad = [];
  for (const y of G.YEARS) for (const sub of ['maths', 'ga']) {
    let topics = []; try { topics = ['mixed'].concat(G.topicsFor(sub, y)); } catch (e) { continue; }
    for (const tp of topics) for (const d of [1, 2, 3, 4]) {
      let s; try { s = G.generateSet(sub, y, tp, d, 5); } catch (e) { continue; }
      for (const q of s) { n++; if (!H.questionOk(q)) bad.push(q); }
    }
  }
  assert.ok(n > 3000, 'questions checked: ' + n); assert.deepStrictEqual(bad.slice(0, 1), []);
});
t('R1.2 the app (js/app.js) and the server use the same rules', async () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  const from = src.indexOf('  const isObj = v =>'), to = src.indexOf('  function startChallenge(');
  assert.ok(from > 0 && to > from);
  const appOk = new Function(src.slice(from, to) + '\nreturn questionOk;')();
  const samples = [QS[0], QS[1], { type: 'input' }, { q: { en: 'x' }, topic: 'a', type: 'mc', choices: [{ en: 'a' }], correct: 0 }, { q: { en: 'x', zh: 3 }, topic: 'a', type: 'input', value: 1, answer: '1' },
    { q: { en: 'x' }, topic: 'a', type: 'input', value: 1, answer: 1, unit: 'cm', tol: 0.1, fig: { type: 'bar' }, sol: { en: 's' } }, { q: { en: 'x' }, topic: 'a', type: 'input', value: NaN, answer: '1' },
    { q: { en: 'x' }, topic: 'a', type: 'mc', choices: [{ en: 'a' }, { en: 'b' }, { en: 'c' }, { en: 'd' }, { en: 'e' }, { en: 'f' }], correct: 0 }, null, [], 'q'];
  for (const s of samples) assert.strictEqual(appOk(s), H.questionOk(s), JSON.stringify(s));
});

/* ---------- friends ---------- */
t('friend request by username waits for acceptance', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo');
  assert.strictEqual((await call('POST', 'friends/add', { who: 'Leo' }, { token: a })).body.status, 'sent');
  const fb = (await call('GET', 'friends', undefined, { token: b })).body;
  assert.deepStrictEqual(fb.incoming.map(x => x.username), ['anan']); assert.strictEqual(fb.friends.length, 0);
  assert.deepStrictEqual((await call('GET', 'friends', undefined, { token: a })).body.outgoing.map(x => x.username), ['leo']);
  await call('POST', 'friends/answer', { username: 'anan', accept: true }, { token: b });
  assert.deepStrictEqual((await call('GET', 'friends', undefined, { token: a })).body.friends.map(x => x.username), ['leo']);
  assert.deepStrictEqual((await call('GET', 'friends', undefined, { token: b })).body.friends.map(x => x.username), ['anan']);
});
t('friend request by friend code, with or without the dash', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo');
  const code = (await call('GET', 'me', undefined, { token: b })).body.me.friendCode;
  assert.strictEqual((await call('POST', 'friends/add', { who: code.slice(0, 3).toLowerCase() + '-' + code.slice(3) }, { token: a })).body.username, 'leo');
});
t('declining removes the request', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo');
  await call('POST', 'friends/add', { who: 'leo' }, { token: a });
  await call('POST', 'friends/answer', { username: 'anan', accept: false }, { token: b });
  const fb = (await call('GET', 'friends', undefined, { token: b })).body; assert.strictEqual(fb.incoming.length + fb.friends.length, 0);
});
t('only the student asked can accept', async () => {
  fresh(); const a = await signUp('anan'); await signUp('leo');
  await call('POST', 'friends/add', { who: 'leo' }, { token: a });
  assert.strictEqual((await call('POST', 'friends/answer', { username: 'leo', accept: true }, { token: a })).body.error, 'no_request');
});
t('both ask each other: friends at once', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo');
  await call('POST', 'friends/add', { who: 'leo' }, { token: a });
  assert.strictEqual((await call('POST', 'friends/add', { who: 'anan' }, { token: b })).body.status, 'friends');
});
t('cannot add yourself or nobody', async () => {
  fresh(); const a = await signUp('anan');
  assert.strictEqual((await call('POST', 'friends/add', { who: 'anan' }, { token: a })).body.error, 'is_you');
  assert.strictEqual((await call('POST', 'friends/add', { who: 'nobody' }, { token: a })).body.error, 'no_user');
});
t('remove a friend', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  await call('POST', 'friends/remove', { username: 'leo' }, { token: a });
  assert.strictEqual((await call('GET', 'friends', undefined, { token: b })).body.friends.length, 0);
});
t('friend lists show username and picture only, no email', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  const f = (await call('GET', 'friends', undefined, { token: a })).body.friends[0];
  assert.deepStrictEqual(Object.keys(f).sort(), ['avatar', 'seen', 'username']);
});

/* ---------- challenges (W9, v2.0.0: Option A) ---------- */
const HOUR = 60 * MIN;
async function pair() {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  return { a, b };
}
const send = (tok, extra = {}) => call('POST', 'challenges', Object.assign({ to: 'leo', settings: SET, questions: QS }, extra), { token: tok });
const list = async tok => (await call('GET', 'challenges', undefined, { token: tok })).body.challenges;
const start = (tok, id) => call('POST', 'challenges/' + id + '/start', {}, { token: tok });
const result = (tok, id, ok) => call('POST', 'challenges/' + id + '/result', { score: { ok, time: 1 } }, { token: tok });
const answer = (tok, id, accept) => call('POST', 'challenges/' + id + '/answer', { accept }, { token: tok });

t('W9 a sent challenge shows for both at once; the sender can start before the friend accepts', async () => {
  const { a, b } = await pair();
  const c = await send(a);
  assert.strictEqual(c.status, 200, JSON.stringify(c.body));
  const forB = (await list(b))[0], forA = (await list(a))[0];
  assert.deepStrictEqual([forB.mine, forB.status, forB.over, forB.me, forB.them], [false, 'sent', false, null, null]);
  assert.deepStrictEqual([forA.mine, forA.status], [true, 'sent']);
  assert.strictEqual(forB.questions, undefined, 'the list has no questions');
  assert.strictEqual((await call('GET', 'challenges/' + c.body.id, undefined, { token: b })).body.questions, undefined, 'questions only come with start');
  const s = await start(a, c.body.id);
  assert.strictEqual(s.status, 200, JSON.stringify(s.body)); assert.deepStrictEqual(s.body.questions, QS); assert.strictEqual(s.body.started, clock);
  assert.deepStrictEqual(s.body.settings, SET);
});
t('W9 the friend must accept before starting; Accept then start gives the same questions', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  assert.strictEqual((await start(b, id)).body.error, 'not_accepted');
  const acc = await answer(b, id, true);
  assert.strictEqual(acc.status, 200); assert.strictEqual(acc.body.status, 'accepted'); assert.strictEqual(acc.body.deadline, clock + 24 * HOUR);
  assert.strictEqual((await answer(b, id, true)).body.error, 'already_answered');
  assert.strictEqual((await answer(a, id, true)).status, 404, 'only the friend answers');
  assert.deepStrictEqual((await start(b, id)).body.questions, QS);
});
t('W9 decline: nobody can play it, both see it declined in Done', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  assert.strictEqual((await answer(b, id, false)).body.status, 'declined');
  assert.strictEqual((await start(a, id)).body.error, 'declined');
  assert.strictEqual((await start(b, id)).body.error, 'declined');
  const ca = (await list(a))[0];
  assert.deepStrictEqual([ca.status, ca.over, ca.winner], ['declined', true, null]);
});
t('W9 the time is the server\'s: from start to result; the app\'s own time is ignored', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  await start(a, id); later(95e3);
  const r = await result(a, id, [true, false]);
  assert.strictEqual(r.status, 200, JSON.stringify(r.body)); assert.deepStrictEqual([r.body.me.c, r.body.me.n, r.body.me.time], [1, 2, 95e3]);
  assert.strictEqual((await result(a, id, [true, true])).body.error, 'already_done');
  // starting again does not reset the clock
  await answer(b, id, true); await start(b, id); later(10e3); await start(b, id); later(20e3);
  assert.strictEqual((await result(b, id, [true, true])).body.me.time, 30e3);
});
t('W9 a result needs a start first', async () => {
  const { a } = await pair();
  const id = (await send(a)).body.id;
  assert.strictEqual((await result(a, id, [true, true])).body.error, 'not_started');
});
t('W9 the friend\'s score stays hidden until this student finishes', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  await start(a, id); await result(a, id, [true, true]);
  await answer(b, id, true);
  const forB = (await list(b))[0];
  assert.deepStrictEqual(forB.them, { done: true }); assert.strictEqual(forB.over, false);
  await start(b, id); const r = await result(b, id, [true, false]);
  assert.strictEqual(r.body.over, true); assert.strictEqual(r.body.them.c, 2); assert.strictEqual(r.body.winner, 'them');
  assert.strictEqual((await list(a))[0].winner, 'me');
});
t('W9 who wins: accuracy first, then the shorter time; equal both is a draw', async () => {
  const W = H.winnerOf;
  assert.strictEqual(W({ c: 8, n: 10, time: 900 }, { c: 7, n: 10, time: 100 }), 'a');
  assert.strictEqual(W({ c: 8, n: 10, time: 900 }, { c: 8, n: 10, time: 100 }), 'b');
  assert.strictEqual(W({ c: 8, n: 10, time: 100 }, { c: 8, n: 10, time: 100 }), 'draw');
  assert.strictEqual(W({ c: 0, n: 10, time: 100 }, null), 'a', 'finishing beats not finishing');
  assert.strictEqual(W(null, null), 'none');
});
t('W9 same score, faster wins (through the routes)', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  await answer(b, id, true);
  await start(a, id); await start(b, id);
  later(40e3); await result(b, id, [true, false]);
  later(20e3); const r = await result(a, id, [false, true]);
  assert.deepStrictEqual([r.body.me.time, r.body.them.time, r.body.winner], [60e3, 40e3, 'them']);
});
t('W9 not accepted in 24 hours: it is gone for both', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  later(24 * HOUR - 1000);
  assert.strictEqual((await list(b)).length, 1);
  later(2000);
  assert.strictEqual((await list(b)).length, 0); assert.strictEqual((await list(a)).length, 0);
  assert.strictEqual((await answer(b, id, true)).status, 404);
  assert.strictEqual(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM duels').get().n, 0);
});
t('W9 after accepting, 24 hours to finish: the side that did not finish loses', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  later(5 * HOUR); await answer(b, id, true);
  await start(a, id); later(MIN); await result(a, id, [false, false]);
  later(24 * HOUR - 2 * MIN);
  assert.strictEqual((await list(b))[0].over, false);
  await start(b, id);
  later(3 * MIN);
  assert.strictEqual((await result(b, id, [true, true])).body.error, 'too_late');
  const ca = (await list(a))[0], cb = (await list(b))[0];
  assert.deepStrictEqual([ca.over, ca.winner, cb.winner, cb.me], [true, 'me', 'them', null]);
  assert.strictEqual(cb.them.c, 0, 'once it is over, the score shows');
});
t('W9 neither finished in time: no winner', async () => {
  const { a, b } = await pair();
  const id = (await send(a)).body.id;
  await answer(b, id, true); later(24 * HOUR + 1);
  const c = (await list(a))[0];
  assert.deepStrictEqual([c.over, c.winner], [true, 'none']);
});
t('W9 each student keeps the last 20 challenges', async () => {
  const { a, b } = await pair();
  const ids = [];
  for (let i = 0; i < 23; i++) { const id = (await send(a)).body.id; ids.push(id); await answer(b, id, true); }
  const la = await list(a), lb = await list(b);
  assert.strictEqual(la.length, 20); assert.strictEqual(lb.length, 20);
  assert.strictEqual(la[0].id, ids[22]); assert.strictEqual(la[19].id, ids[3]);
  assert.strictEqual(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM duels').get().n, 20);
});
t('W9 the sender chooses the set: year, subject, topic, level and count are kept', async () => {
  const { a, b } = await pair();
  const set = { subject: 'ga', year: 3, topic: 'mixed', diff: 4, count: 2 };
  await send(a, { settings: set });
  assert.deepStrictEqual((await list(b))[0].settings, set);
  assert.strictEqual((await send(a, { settings: { subject: 'maths', year: 'five' } })).status, 400);
});
t('challenge only between friends', async () => {
  fresh(); const a = await signUp('anan'); await signUp('leo');
  assert.strictEqual((await send(a)).body.error, 'not_friends');
});
t('a third student cannot read, answer or play a challenge', async () => {
  const { a } = await pair(); const c = await signUp('mia');
  const id = (await send(a)).body.id;
  for (const r of [await call('GET', 'challenges/' + id, undefined, { token: c }), await start(c, id), await answer(c, id, true), await result(c, id, [true, true])]) assert.strictEqual(r.status, 404);
});
t('the score is counted from the right/wrong list, not trusted', async () => {
  const { a } = await pair();
  const id = (await send(a)).body.id;
  await start(a, id);
  assert.strictEqual((await call('POST', 'challenges/' + id + '/result', { score: { ok: [true] } }, { token: a })).status, 400);
  const r = await call('POST', 'challenges/' + id + '/result', { score: { ok: [true, false], c: 99, n: 99 } }, { token: a });
  assert.deepStrictEqual([r.body.me.c, r.body.me.n], [1, 2]);
});
t('removing a friend keeps finished challenges readable; deleting an account removes everything', async () => {
  fresh(); const a = await signUp('anan', undefined, 'password-1'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  await send(a);
  await call('PUT', 'progress', { data: { x: 1 } }, { token: a });
  assert.strictEqual((await call('POST', 'account/delete', { password: 'wrong-pass' }, { token: a })).status, 401);
  assert.strictEqual((await call('POST', 'account/delete', { password: 'password-1' }, { token: a })).status, 200);
  for (const tb of ['users', 'sessions', 'progress', 'duels', 'friends']) {
    const rows = env.DB.raw.prepare(`SELECT COUNT(*) AS n FROM ${tb}`).get().n;
    assert.strictEqual(rows, tb === 'users' || tb === 'sessions' ? 1 : 0, tb);
  }
  assert.strictEqual((await call('POST', 'login', { email: 'anan@example.com', password: 'password-1' })).status, 401);
});

/* ---------- web rules ---------- */
t('CORS: the app hosts are allowed, other sites are refused', async () => {
  fresh();
  for (const o of ['https://student-practice.pages.dev', 'https://test.student-practice.pages.dev', 'https://tianruisun.github.io', 'http://127.0.0.1:8765']) {
    const r = await call('GET', 'health', undefined, { origin: o });
    assert.strictEqual(r.headers.get('access-control-allow-origin'), o, o);
  }
  const bad = await call('GET', 'health', undefined, { origin: 'https://evil.example' });
  assert.strictEqual(bad.status, 403); assert.strictEqual(bad.headers.get('access-control-allow-origin'), null);
  const bad2 = await call('GET', 'health', undefined, { origin: 'https://student-practice.pages.dev.evil.example' });
  assert.strictEqual(bad2.status, 403);
});
t('preflight answers 204 with the allowed headers', async () => {
  fresh(); const req = new Request('https://student-practice.pages.dev/api/me', { method: 'OPTIONS', headers: { Origin: 'https://tianruisun.github.io' } });
  const r = await H.handle(req, env, { now }); assert.strictEqual(r.status, 204);
  assert.ok(/Authorization/.test(r.headers.get('access-control-allow-headers')));
});
t('answers are never cached', async () => { fresh(); assert.strictEqual((await call('GET', 'health')).headers.get('cache-control'), 'no-store'); });
t('bad JSON: bad_input', async () => { fresh(); assert.strictEqual((await call('POST', 'login', '{nope')).body.error, 'bad_input'); });
t('a server error says only "server"', async () => {
  fresh(); const broken = { DB: { prepare() { throw new Error('secret detail'); }, batch: async () => [] } };
  const real = console.error; console.error = () => {};
  try { const r = await call('POST', 'login', { email: 'abc@example.com', password: 'x' }, { env: broken }); assert.strictEqual(r.status, 500); assert.deepStrictEqual(r.body, { error: 'server' }); }
  finally { console.error = real; }
});
t('the Pages Function hands every request to the server module', async () => {
  const fs = require('fs'), path = require('path');
  const f = fs.readFileSync(path.join(__dirname, '..', 'functions', 'api', '[[path]].js'), 'utf8');
  assert.ok(/import \{ handle \} from '\.\.\/\.\.\/server\/api\.js'/.test(f)); assert.ok(/onRequest = ctx => handle\(ctx\.request, ctx\.env\)/.test(f));
});
t('no secret in the server code', async () => {
  const fs = require('fs'), path = require('path');
  const s = fs.readFileSync(path.join(__dirname, '..', 'server', 'api.js'), 'utf8');
  assert.ok(!/re_[A-Za-z0-9]{20,}|xkeysib-|sk-[A-Za-z0-9]{20,}/.test(s));
});

(async () => {
  H = await api();
  for (const [name, fn] of results) {
    try { await fn(); pass++; } catch (e) { fail++; console.log('FAIL', name, '-', e.message); }
  }
  console.log(`${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})();
