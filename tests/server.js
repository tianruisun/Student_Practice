/* Run with: node tests/server.js   The server (server/api.js) on an in-memory database: accounts, codes, sign-in limits,
   password reset, progress, friends, challenges, CORS and the Production rules. Prints "N passed, M failed". */
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
function fresh(extra = {}) { env = Object.assign({ DB: fakeD1(), DEV_CODES: '1' }, extra); }
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
/* a whole sign-up: code, check, register; returns the token */
async function signUp(name, email = name + '@example.com', password = 'secret-pass', opts = {}) {
  const c = await call('POST', 'code', { email }, opts);
  assert.strictEqual(c.status, 200, JSON.stringify(c.body));
  const r = await call('POST', 'register', { email, code: c.body.devCode, username: name, password, avatar: (n++) % 12 }, opts);
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  later(MIN + 1);   // the next code for any email may come
  return r.body.token;
}
async function befriend(ta, tb, nameB, nameA) {
  assert.strictEqual((await call('POST', 'friends/add', { who: nameB }, { token: ta })).body.status, 'sent');
  assert.strictEqual((await call('POST', 'friends/answer', { username: nameA, accept: true }, { token: tb })).status, 200);
}
const QS = [{ q: { en: '1+1', zh: '1+1' }, answer: '2', type: 'num', topic: 'add' }, { q: { en: '2+2', zh: '2+2' }, answer: '4', type: 'num', topic: 'add' }];
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
t('the code is stored hashed, never as typed', async () => {
  fresh(); const c = await call('POST', 'code', { email: 'a@example.com' });
  const row = env.DB.raw.prepare('SELECT hash FROM codes').get();
  assert.ok(!row.hash.includes(c.body.devCode)); assert.strictEqual(row.hash.length, 64);
});
t('the password is stored as PBKDF2, never as typed', async () => {
  fresh(); await signUp('anan', 'anan@example.com', 'my-password-1');
  const row = env.DB.raw.prepare('SELECT pw FROM users').get();
  assert.ok(row.pw.startsWith('pbkdf2$20000$')); assert.ok(!row.pw.includes('my-password-1'));
});
t('session tokens are stored hashed', async () => {
  fresh(); const tok = await signUp('anan');
  const row = env.DB.raw.prepare('SELECT token FROM sessions').get();
  assert.notStrictEqual(row.token, tok); assert.strictEqual(row.token.length, 64);
});
t('bad email refused', async () => { fresh(); assert.strictEqual((await call('POST', 'code', { email: 'not-an-email' })).body.error, 'bad_email'); });
t('a second code within a minute: too_many', async () => {
  fresh(); await call('POST', 'code', { email: 'a@example.com' });
  assert.strictEqual((await call('POST', 'code', { email: 'a@example.com' })).status, 429);
  later(MIN + 1); assert.strictEqual((await call('POST', 'code', { email: 'a@example.com' })).status, 200);
});
t('code/check: right code ok and not used up', async () => {
  fresh(); const c = await call('POST', 'code', { email: 'a@example.com' });
  assert.strictEqual((await call('POST', 'code/check', { email: 'a@example.com', code: c.body.devCode })).status, 200);
  assert.strictEqual((await call('POST', 'register', { email: 'a@example.com', code: c.body.devCode, username: 'abc', password: 'password1' })).status, 200);
});
t('wrong code: code_wrong, five wrong: code_tries even with the right code', async () => {
  fresh(); const c = await call('POST', 'code', { email: 'a@example.com' });
  const wrong = c.body.devCode === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) assert.strictEqual((await call('POST', 'code/check', { email: 'a@example.com', code: wrong })).body.error, 'code_wrong');
  assert.strictEqual((await call('POST', 'code/check', { email: 'a@example.com', code: wrong })).body.error, 'code_tries');
  assert.strictEqual((await call('POST', 'code/check', { email: 'a@example.com', code: c.body.devCode })).body.error, 'code_tries');
});
t('code expires after 10 minutes', async () => {
  fresh(); const c = await call('POST', 'code', { email: 'a@example.com' }); later(10 * MIN + 1);
  assert.strictEqual((await call('POST', 'code/check', { email: 'a@example.com', code: c.body.devCode })).body.error, 'code_expired');
});
t('a code works once', async () => {
  fresh(); const c = await call('POST', 'code', { email: 'a@example.com' });
  assert.strictEqual((await call('POST', 'register', { email: 'a@example.com', code: c.body.devCode, username: 'one', password: 'password1' })).status, 200);
  assert.strictEqual((await call('POST', 'register', { email: 'a@example.com', code: c.body.devCode, username: 'two', password: 'password1' })).body.error, 'code_expired');
});
t('username rules: 3-20 of a-z 0-9 _, any case is the same name', async () => {
  fresh(); const c = await call('POST', 'code', { email: 'a@example.com' });
  for (const bad of ['ab', 'a'.repeat(21), 'has space', '名字', 'a-b']) assert.strictEqual((await call('POST', 'register', { email: 'a@example.com', code: c.body.devCode, username: bad, password: 'password1' })).body.error, 'bad_username', bad);
  assert.strictEqual((await call('POST', 'register', { email: 'a@example.com', code: c.body.devCode, username: 'Leo_9', password: 'password1' })).body.me.username, 'leo_9');
  later(MIN + 1); const c2 = await call('POST', 'code', { email: 'b@example.com' });
  assert.strictEqual((await call('POST', 'register', { email: 'b@example.com', code: c2.body.devCode, username: 'LEO_9', password: 'password1' })).body.error, 'username_taken');
});
t('a taken name does not use up the code', async () => {
  fresh(); await signUp('leo'); const c = await call('POST', 'code', { email: 'b@example.com' });
  assert.strictEqual((await call('POST', 'register', { email: 'b@example.com', code: c.body.devCode, username: 'leo', password: 'password1' })).body.error, 'username_taken');
  assert.strictEqual((await call('POST', 'register', { email: 'b@example.com', code: c.body.devCode, username: 'leo2', password: 'password1' })).status, 200);
});
t('password under 8 characters refused', async () => {
  fresh(); const c = await call('POST', 'code', { email: 'a@example.com' });
  assert.strictEqual((await call('POST', 'register', { email: 'a@example.com', code: c.body.devCode, username: 'abc', password: 'short' })).body.error, 'bad_password');
});
t('one email holds up to 5 accounts (a parent with several children)', async () => {
  fresh(); for (let i = 1; i <= 5; i++) await signUp('kid' + i, 'mum@example.com');
  assert.strictEqual((await call('POST', 'code', { email: 'MUM@example.com' })).body.error, 'email_full');
});
t('no email service on a host without DEV_CODES: email_off (503), no code in the answer', async () => {
  fresh({ DEV_CODES: '0' }); const r = await call('POST', 'code', { email: 'a@example.com' });
  assert.strictEqual(r.status, 503); assert.strictEqual(r.body.error, 'email_off'); assert.strictEqual(r.body.devCode, undefined);
});
t('DEV_CODES is ignored on Production hosts', async () => {
  fresh();
  for (const host of ['student-practice.pages.dev', 'tianruisun.github.io']) {
    const r = await call('POST', 'code', { email: host + '@example.com' }, { host });
    assert.strictEqual(r.body.devCode, undefined, host); assert.strictEqual(r.body.error, 'email_off');
  }
  const r2 = await call('POST', 'code', { email: 'x@example.com' }, { host: 'x.example', origin: 'https://tianruisun.github.io' });
  assert.strictEqual(r2.body.devCode, undefined, 'origin github.io');
});
t('the email goes through the chosen service, in the chosen language', async () => {
  const sent = []; const real = global.fetch;
  global.fetch = async (url, o) => { sent.push({ url, o }); return new Response('{}', { status: 200 }); };
  try {
    fresh({ DEV_CODES: '0', EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'k', EMAIL_FROM: 'Maths <no-reply@example.com>' });
    const r = await call('POST', 'code', { email: 'a@example.com', lang: 'zh' });
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.devCode, undefined);
    assert.strictEqual(sent[0].url, 'https://api.resend.com/emails');
    const b = JSON.parse(sent[0].o.body); assert.deepStrictEqual(b.to, ['a@example.com']); assert.ok(/验证码/.test(b.subject)); assert.ok(/\d{6}/.test(b.text));
    fresh({ DEV_CODES: '0', EMAIL_PROVIDER: 'brevo', EMAIL_API_KEY: 'k', EMAIL_FROM: 'Maths <no-reply@example.com>' });
    await call('POST', 'code', { email: 'b@example.com' });
    const b2 = JSON.parse(sent[1].o.body); assert.strictEqual(sent[1].url, 'https://api.brevo.com/v3/smtp/email');
    assert.deepStrictEqual(b2.sender, { name: 'Maths', email: 'no-reply@example.com' }); assert.ok(/code/.test(b2.subject));
  } finally { global.fetch = real; }
});

/* ---------- sign-in ---------- */
t('sign in with username and password, any case', async () => {
  fresh(); await signUp('anan', 'a@example.com', 'password-1');
  const r = await call('POST', 'login', { username: 'AnAn', password: 'password-1' });
  assert.strictEqual(r.status, 200); assert.ok(r.body.token); assert.strictEqual(r.body.me.username, 'anan');
});
t('wrong password and unknown name give the same answer', async () => {
  fresh(); await signUp('anan', 'a@example.com', 'password-1');
  const a = await call('POST', 'login', { username: 'anan', password: 'nope-nope' }), b = await call('POST', 'login', { username: 'nobody', password: 'nope-nope' });
  assert.strictEqual(a.status, 401); assert.deepStrictEqual(a.body, b.body);
});
t('ten wrong passwords lock that name for 15 minutes, even with the right one', async () => {
  fresh(); await signUp('anan', 'a@example.com', 'password-1');
  for (let i = 0; i < 10; i++) await call('POST', 'login', { username: 'anan', password: 'wrong-' + i });
  assert.strictEqual((await call('POST', 'login', { username: 'anan', password: 'password-1' })).status, 429);
  later(15 * MIN + 1); assert.strictEqual((await call('POST', 'login', { username: 'anan', password: 'password-1' })).status, 200);
});
t('sign out ends that session only', async () => {
  fresh(); const t1 = await signUp('anan', 'a@example.com', 'password-1');
  const t2 = (await call('POST', 'login', { username: 'anan', password: 'password-1' })).body.token;
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

/* ---------- forgot password ---------- */
t('reset: a link token, new password works, old sessions end', async () => {
  fresh(); const old = await signUp('anan', 'a@example.com', 'password-1');
  const r = await call('POST', 'reset', { username: 'anan' }); assert.ok(r.body.devToken);
  assert.strictEqual((await call('POST', 'reset/finish', { token: r.body.devToken, password: 'new-password' })).status, 200);
  assert.strictEqual((await call('GET', 'me', undefined, { token: old })).status, 401);
  assert.strictEqual((await call('POST', 'login', { username: 'anan', password: 'new-password' })).status, 200);
  assert.strictEqual((await call('POST', 'login', { username: 'anan', password: 'password-1' })).status, 401);
  assert.strictEqual((await call('POST', 'reset/finish', { token: r.body.devToken, password: 'again-again' })).body.error, 'reset_expired');
});
t('reset: unknown name answers the same as a known one (no token)', async () => {
  fresh(); const r = await call('POST', 'reset', { username: 'nobody' });
  assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body, { ok: true });
});
t('reset link ends after an hour', async () => {
  fresh(); await signUp('anan'); const r = await call('POST', 'reset', { username: 'anan' }); later(61 * MIN);
  assert.strictEqual((await call('POST', 'reset/finish', { token: r.body.devToken, password: 'new-password' })).body.error, 'reset_expired');
});
t('reset email has a link to the app it was asked from', async () => {
  const sent = []; const real = global.fetch;
  global.fetch = async (url, o) => { sent.push(JSON.parse(o.body)); return new Response('{}', { status: 200 }); };
  try {
    fresh(); await signUp('anan', 'a@example.com');
    env.DEV_CODES = '0'; env.EMAIL_PROVIDER = 'resend'; env.EMAIL_API_KEY = 'k'; env.EMAIL_FROM = 'm@example.com';
    await call('POST', 'reset', { username: 'anan' }, { origin: 'https://tianruisun.github.io' });
    assert.ok(/https:\/\/tianruisun\.github\.io\/Student_Practice\/\?reset=[A-Za-z0-9_-]{43}/.test(sent[0].text), sent[0].text);
    assert.deepStrictEqual(sent[0].to, ['a@example.com']);
  } finally { global.fetch = real; }
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

/* ---------- challenges ---------- */
t('challenge: the friend gets the same questions, then both scores show', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  const c = await call('POST', 'challenges', { to: 'leo', settings: SET, questions: QS, score: { ok: [true, false], time: 61000 } }, { token: a });
  assert.strictEqual(c.status, 200, JSON.stringify(c.body));
  const list = (await call('GET', 'challenges', undefined, { token: b })).body.challenges;
  assert.strictEqual(list.length, 1); assert.strictEqual(list[0].mine, false); assert.strictEqual(list[0].b, null);
  assert.strictEqual(list[0].questions, undefined, 'the list has no questions');
  const one = (await call('GET', 'challenges/' + c.body.id, undefined, { token: b })).body;
  assert.deepStrictEqual(one.questions, QS); assert.deepStrictEqual(one.settings, SET); assert.strictEqual(one.a.c, 1);
  assert.strictEqual((await call('POST', 'challenges/' + c.body.id + '/result', { score: { ok: [true, true], time: 50000 } }, { token: b })).status, 200);
  const mine = (await call('GET', 'challenges', undefined, { token: a })).body.challenges[0];
  assert.strictEqual(mine.mine, true); assert.deepStrictEqual([mine.a.c, mine.b.c], [1, 2]); assert.ok(mine.done);
});
t('challenge result only once, only by the friend asked', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  const id = (await call('POST', 'challenges', { to: 'leo', settings: SET, questions: QS, score: { ok: [true, true] } }, { token: a })).body.id;
  assert.strictEqual((await call('POST', `challenges/${id}/result`, { score: { ok: [true, true] } }, { token: a })).status, 404);
  await call('POST', `challenges/${id}/result`, { score: { ok: [false, true] } }, { token: b });
  assert.strictEqual((await call('POST', `challenges/${id}/result`, { score: { ok: [true, true] } }, { token: b })).body.error, 'already_done');
});
t('challenge only between friends', async () => {
  fresh(); const a = await signUp('anan'); await signUp('leo');
  assert.strictEqual((await call('POST', 'challenges', { to: 'leo', settings: SET, questions: QS, score: { ok: [true, true] } }, { token: a })).body.error, 'not_friends');
});
t('a third student cannot read a challenge', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'), c = await signUp('mia'); await befriend(a, b, 'leo', 'anan');
  const id = (await call('POST', 'challenges', { to: 'leo', settings: SET, questions: QS, score: { ok: [true, true] } }, { token: a })).body.id;
  assert.strictEqual((await call('GET', 'challenges/' + id, undefined, { token: c })).status, 404);
});
t('the score is counted from the right/wrong list, not trusted', async () => {
  fresh(); const a = await signUp('anan'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  await call('POST', 'challenges', { to: 'leo', settings: SET, questions: QS, score: { ok: [true, false], c: 99, n: 99 } }, { token: a });
  const ch = (await call('GET', 'challenges', undefined, { token: b })).body.challenges[0];
  assert.deepStrictEqual([ch.a.c, ch.a.n], [1, 2]);
  assert.strictEqual((await call('POST', 'challenges', { to: 'leo', settings: SET, questions: QS, score: { ok: [true] } }, { token: a })).status, 400);
});
t('removing a friend keeps finished challenges readable; deleting an account removes everything', async () => {
  fresh(); const a = await signUp('anan', 'a@example.com', 'password-1'), b = await signUp('leo'); await befriend(a, b, 'leo', 'anan');
  await call('POST', 'challenges', { to: 'leo', settings: SET, questions: QS, score: { ok: [true, true] } }, { token: a });
  await call('PUT', 'progress', { data: { x: 1 } }, { token: a });
  assert.strictEqual((await call('POST', 'account/delete', { password: 'wrong-pass' }, { token: a })).status, 401);
  assert.strictEqual((await call('POST', 'account/delete', { password: 'password-1' }, { token: a })).status, 200);
  for (const tb of ['users', 'sessions', 'progress', 'challenges', 'friends']) {
    const rows = env.DB.raw.prepare(`SELECT COUNT(*) AS n FROM ${tb}`).get().n;
    assert.strictEqual(rows, tb === 'users' || tb === 'sessions' ? 1 : 0, tb);
  }
  assert.strictEqual((await call('POST', 'login', { username: 'anan', password: 'password-1' })).status, 401);
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
  fresh(); const broken = { DB: { prepare() { throw new Error('secret detail'); }, batch: async () => [] }, DEV_CODES: '1' };
  const real = console.error; console.error = () => {};
  try { const r = await call('POST', 'login', { username: 'abc', password: 'x' }, { env: broken }); assert.strictEqual(r.status, 500); assert.deepStrictEqual(r.body, { error: 'server' }); }
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
