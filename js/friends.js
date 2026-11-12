/* v2.0.0 (W8, Terry chose Option B): accounts, friends and practising together.
   - An account: sign up with an email (a 6-digit code), then a username, a password and a picture; sign in with the
     username and password. One email holds up to 5 accounts (brothers and sisters).
   - The account's records (history, settings, badges, games, plan) are kept on the server, so they follow the student.
     On this device they live in one student profile linked to the account. Signing out saves them, then removes that
     profile from this device, so the next person on a shared computer cannot see or change them.
   - Friends: a request waits until the other student accepts. Add by username or friend code.
   - Practise together (type B): do a set, it goes to a friend, the friend gets exactly the same questions, and then
     both see both scores. Worked solutions stay behind the parent PIN as everywhere else.
   app.js calls Friends.init(bridge) once, and Friends.render() for the Friends screen. */
(function () {
  'use strict';

  const AVATARS = ['🦊', '🐼', '🐯', '🐨', '🐰', '🐸', '🦁', '🐧', '🐙', '🦄', '🐵', '🐶'];
  const AUTH = 'sp.auth';
  const POLL_MS = 30000, SYNC_MS = 4000;
  let A = null;   // the bridge from app.js
  let t, el, $;

  /* where the server is: the same site on Cloudflare (Test or Production) and on this PC; the GitHub Pages address
     (Production, no server of its own) uses the Production one */
  const API = location.hostname.endsWith('github.io') ? 'https://student-practice.pages.dev/api/' : location.origin + '/api/';

  /* ---------- state ---------- */
  const F = {
    auth: null,            // { token, me: { username, avatar, friendCode, email }, profile: 'p2' }
    view: 'login',         // signed out: 'login' | 'reg1' | 'reg2' | 'reg3' | 'forgot' | 'reset' | 'move'
    tab: 'friends',        // signed in: 'friends' | 'challenges'
    reg: { email: '', code: '', sentAt: 0 },
    resetToken: '',
    err: '', msg: '', busy: false,
    friends: null,         // { friends, incoming, outgoing } from the server
    challenges: null,      // [ ... ] from the server
    send: null,            // { to, subject, topic, count } while the "practise together" panel is open
    compare: null,         // a finished challenge shown in full
    confirmRemove: '', confirmOut: false, delOpen: false,
    moveFrom: null,        // the local profile whose records may move into a new account
    syncTimer: 0, lastSync: 0, syncFailed: false, pollTimer: 0
  };
  const signedIn = () => !!(F.auth && F.auth.token);

  /* ---------- server calls ---------- */
  class ApiError extends Error { constructor(code, status, data) { super(code); this.code = code; this.status = status; this.data = data; } }
  async function api(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (F.auth && F.auth.token) headers.Authorization = 'Bearer ' + F.auth.token;
    let res;
    try {
      res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(Object.assign({ lang: A.lang() }, body)), cache: 'no-store' });
    } catch (e) { throw new ApiError('offline', 0); }
    let data = null;
    try { data = await res.json(); } catch (e) { /* not JSON: the site has no server yet */ }
    if (!res.ok || !data) {
      const code = (data && data.error) || (res.status === 404 || res.status === 405 ? 'not_set_up' : 'server');
      if (code === 'signed_out' && signedIn()) sessionEnded();
      throw new ApiError(code, res.status, data);
    }
    return data;
  }
  /* the message for an error code, in the current language */
  const errText = e => {
    const code = e && e.code ? e.code : 'server';
    const key = 'acc.err.' + code;
    return t(key) === key ? t('acc.err.server') : t(key);
  };

  /* ---------- the account's records ---------- */
  const keysOf = id => ({ history: A.K.history + '.' + id, settings: A.K.settings + '.' + id, badges: A.K.badges + '.' + id, games: A.K.games + '.' + id, plan: A.K.plan + '.' + id });
  const PROFILE_FIELDS = ['schoolYear', 'schoolYearSet', 'dob'];
  /* this device's records of a profile, as they are */
  function read(id) {
    const keys = keysOf(id), data = { v: 1, keys: {}, profile: {} };
    for (const [name, k] of Object.entries(keys)) { const v = A.store.get(k, null); if (v !== null) data.keys[name] = v; }
    const pr = A.Profiles.list.find(x => x.id === id) || {};
    PROFILE_FIELDS.forEach(f => { if (pr[f] !== undefined) data.profile[f] = pr[f]; });
    return data;
  }
  /* the copy sent to the server */
  function collect(id) {
    const data = read(id);
    // keep within the server's limit: drop the stored wrong questions of the oldest sets first (the scores stay)
    let text = JSON.stringify(data);
    const h = data.keys.history;
    for (let i = 0; Array.isArray(h) && text.length > 850000 && i < h.length; i++) { if (h[i].wrong && h[i].wrong.length) { h[i].wrong = []; text = JSON.stringify(data); } }
    return data;
  }
  function restore(id, data) {
    const keys = keysOf(id);
    for (const [name, k] of Object.entries(keys)) {
      if (data && data.keys && data.keys[name] !== undefined) A.store.set(k, data.keys[name], true); else A.store.del(k);
    }
    const fields = {};
    PROFILE_FIELDS.forEach(f => { if (data && data.profile && data.profile[f] !== undefined) fields[f] = data.profile[f]; });
    A.Profiles.update(id, fields);
  }
  // records worth moving: sets, badges, games and the plan (settings alone are only choices, so they do not count)
  const hasRecords = id => Object.entries(keysOf(id)).filter(([name]) => name !== 'settings').map(([, k]) => k).some(k => { const v = A.store.get(k, null); return v !== null && !(Array.isArray(v) && !v.length); });

  /* R1.1 (v2.0.0): one account on two devices. Each save names the server copy it was made from (F.auth.synced, the
     server's `updated`); when another device has saved since, the server answers 'stale' with its copy, this device
     merges it into its own records (Records.mergeAccount, with F.auth.base = the records both last agreed on, so a
     removal on either side stays removed) and saves again. The app also reads the server copy when it comes back to the
     screen (pull), so a phone and a tablet see each other's sets. */
  let queue = Promise.resolve(), uploading = 0;
  function upload() {   // one save at a time; a change made during a save is saved after it
    uploading++;
    const p = queue.then(doUpload).catch(() => false).finally(() => { uploading--; });
    queue = p;
    return p;
  }
  async function doUpload() {
    clearTimeout(F.syncTimer); F.syncTimer = 0;
    if (!signedIn() || !F.auth.profile) return true;
    // never send an empty copy over the account's records: the profile must still be on this device
    if (!A.Profiles.list.some(x => x.id === F.auth.profile)) return false;
    for (let i = 0; i < 3; i++) {
      const id = F.auth.profile, data = collect(id);
      try {
        const r = await api('PUT', 'progress', { data, base: F.auth.synced || 0 });
        if (!F.auth || F.auth.profile !== id) return false;
        // still unsaved when a change came in during this save (its own save is waiting on the timer)
        F.auth.synced = r.updated; F.auth.base = window.Records.baseOf(data); F.auth.dirty = !!F.syncTimer; saveAuth();
        F.lastSync = Date.now(); F.syncFailed = false;
        return true;
      } catch (e) {
        if (e.code === 'stale' && e.data && F.auth && F.auth.profile === id) { absorb(e.data.data, e.data.updated); continue; }
        F.syncFailed = true; return false;
      }
    }
    F.syncFailed = true; return false;
  }
  /* the server copy into this device's records: merged, never simply replaced. Returns true when this device has
     records the server copy does not (so they still need saving). */
  function absorb(server, updated) {
    const id = F.auth.profile, local = read(id);
    const merged = server ? window.Records.mergeAccount(local, server, F.auth.base || null) : local;
    restore(id, merged);
    F.auth.synced = updated || 0; F.auth.base = window.Records.baseOf(server); saveAuth();
    if (A.S.screen !== 'quiz' && A.S.screen !== 'loading') A.reload();
    return JSON.stringify(merged.keys) !== JSON.stringify((server && server.keys) || {});
  }
  /* read the server copy (when the app comes back to the screen); merge and save when another device has saved */
  async function pull() {
    if (!signedIn() || !F.auth.profile || uploading) return;
    try {
      const r = await api('GET', 'progress');
      if (!signedIn() || !F.auth.profile || uploading) return;
      if ((r.updated || 0) === (F.auth.synced || 0)) return;
      if (absorb(r.data, r.updated) || F.auth.dirty) upload();
    } catch (e) { /* offline: the next save merges */ }
  }
  /* app.js calls this after every store.set: the account's own keys are saved to the server a few seconds later */
  function changed(key) {
    if (!F.auth || !F.auth.profile || !key.endsWith('.' + F.auth.profile)) return;
    if (!F.auth.dirty) { F.auth.dirty = true; saveAuth(); }   // R1.8: unsaved records on this device
    if (!signedIn()) return;
    clearTimeout(F.syncTimer);
    F.syncTimer = setTimeout(upload, SYNC_MS);
  }

  function saveAuth() { if (F.auth) A.store.set(AUTH, F.auth, true); else A.store.del(AUTH); }

  /* after sign-in or sign-up: link a profile on this device to the account and fill it from the server */
  async function linkAccount(token, me, isNew) {
    // the same account signed in here before (its session ended by itself): what both copies agreed on then
    const before = F.auth && F.auth.me && F.auth.me.username === me.username ? F.auth.base || null : null;
    F.auth = { token, me, profile: null, synced: 0, base: null };
    saveAuth();
    let server = null, updated = 0;
    try { if (!isNew) { const r = await api('GET', 'progress'); server = r.data; updated = r.updated || 0; } } catch (e) { server = null; }
    const P = A.Profiles;
    let pr = P.list.find(x => x.account === me.username);
    if (server) {
      // an empty student on this device (for example the one left after the last sign-out) becomes the account's
      if (!pr) { const cur = P.active; pr = !cur.account && !hasRecords(cur.id) ? cur : P.addAccount(me.username); restore(pr.id, server); }
      // R1.1: records this device still holds for the account (made after its session ended) are merged, not replaced
      else restore(pr.id, window.Records.mergeAccount(read(pr.id), server, before));
      F.auth.synced = updated; F.auth.base = window.Records.baseOf(server);
    } else if (!pr) {
      const cur = P.active;
      // the records on this device may move into the new account: ask first (Terry 2026-11-12)
      if (!cur.account && hasRecords(cur.id)) { F.moveFrom = cur.id; F.auth.profile = null; saveAuth(); F.view = 'move'; return; }
      pr = !cur.account && !hasRecords(cur.id) ? cur : P.addAccount(me.username);
      P.update(pr.id, { account: me.username, name: me.username });
    }
    finishLink(pr.id);
  }
  function finishLink(id) {
    A.Profiles.update(id, { account: F.auth.me.username, name: F.auth.me.username });
    A.Profiles.select(id);
    F.auth.profile = id; saveAuth();
    A.reload();
    upload();
    F.view = 'login'; F.tab = 'friends';
    refresh();
  }
  /* the move question: yes moves the profile's records into the account, no starts the account empty */
  function answerMove(move) {
    const P = A.Profiles, from = F.moveFrom; F.moveFrom = null;
    let id;
    if (move && P.list.some(x => x.id === from)) id = from;
    else id = P.addAccount(F.auth.me.username).id;
    finishLink(id);
  }

  /* sign out: save the records, end the session, and take the account's profile off this device */
  async function signOut(force) {
    if (!signedIn()) return;
    F.busy = true; F.err = ''; A.render();
    const saved = await upload();
    if (!saved && !force) { F.busy = false; F.confirmOut = true; F.err = t('acc.out.notSaved'); A.render(); return; }
    try { await api('POST', 'logout', {}); } catch (e) { /* the session ends on its own after 90 days */ }
    dropLocal();
    F.busy = false; F.confirmOut = false; F.err = ''; F.view = 'login';
    A.toast(t('acc.out.done'));
    A.reload();
  }
  /* the account's profile leaves this device (sign out, account deleted, or the session ended on another device) */
  function dropLocal() {
    const P = A.Profiles, id = F.auth && F.auth.profile;
    F.auth = null; F.friends = null; F.challenges = null; F.send = null; F.compare = null;
    clearTimeout(F.syncTimer); F.syncTimer = 0;
    saveAuth();
    if (id && P.list.some(x => x.id === id)) {
      if (P.list.length <= 1) P.addLocal();
      P.remove(id);
    }
    updateDot();
  }
  /* the server no longer knows this session (a password reset, signed out elsewhere, or 90 days).
     R1.8: on a shared computer the next student must not see these records. When everything is saved on the server, the
     account's profile leaves this device as with Sign out. Only records that are not saved yet (or a set in progress) keep
     it here, so they are not lost: the next sign-in to that account merges them in. The username is never pre-filled. */
  function sessionEnded() {
    if (!F.auth) return;
    const busy = A.S.screen === 'quiz' || A.S.screen === 'loading';
    if (!F.auth.dirty && !F.syncTimer && !busy) {
      dropLocal();
      setTimeout(() => A.reload(), 0);
    } else { F.auth.token = null; saveAuth(); }
    F.view = 'login'; F.err = t('acc.err.signed_out');
    updateDot();
  }

  /* ---------- friends and challenges ---------- */
  async function refresh() {
    if (!signedIn()) return;
    try {
      const [fr, ch] = await Promise.all([api('GET', 'friends'), api('GET', 'challenges')]);
      F.friends = fr; F.challenges = ch.challenges;
    } catch (e) { if (e.code !== 'signed_out') F.netErr = errText(e); }
    updateDot();
    if (A.S.screen === 'friends' || A.S.screen === 'home') A.render();
  }
  const waitingForMe = () => (F.challenges || []).filter(c => !c.mine && !c.b);
  function updateDot() {
    const n = signedIn() ? (F.friends ? F.friends.incoming.length : 0) + waitingForMe().length : 0;
    const dot = $('#friendsDot');
    if (dot) { dot.hidden = !n; dot.textContent = n > 9 ? '9+' : String(n); }
    const tab = $('#navFriends');
    if (tab) tab.setAttribute('aria-label', n ? t('fr.navN', { n }) : t('nav.friends'));
  }
  function startPolling() {
    clearInterval(F.pollTimer);
    F.pollTimer = setInterval(() => { if (document.visibilityState === 'visible' && A.S.screen === 'friends') refresh(); }, POLL_MS);
  }

  async function addFriend(who) {
    F.err = ''; F.msg = '';
    try {
      const r = await api('POST', 'friends/add', { who });
      F.msg = r.status === 'friends' ? t('fr.nowFriends', { name: r.username }) : t('fr.sent', { name: r.username });
      await refresh();
      return true;
    } catch (e) { F.err = errText(e); A.render(); return false; }
  }
  async function answerFriend(username, accept) {
    try { await api('POST', 'friends/answer', { username, accept }); } catch (e) { A.toast(errText(e)); }
    await refresh();
  }
  async function removeFriend(username) {
    try { await api('POST', 'friends/remove', { username }); F.send = null; F.confirmRemove = ''; A.toast(t('fr.removed', { name: username })); } catch (e) { A.toast(errText(e)); }
    await refresh();
  }

  /* a challenge set: started from the "practise together" panel, sent when the set is finished */
  function startSend() {
    const s = F.send, st = A.S.settings;
    const settings = Object.assign({}, st, { subject: s.subject, topic: s.topic, count: s.count });
    F.send = null;
    A.startQuiz(Object.assign(settings, { challenge: { mode: 'send', to: s.to } }));
  }
  async function playChallenge(id) {
    try {
      const ch = await api('GET', 'challenges/' + id);
      if (ch.b) { F.compare = ch; A.render(); return; }
      A.startChallenge(ch.questions, ch.settings, { mode: 'answer', id: ch.id, from: ch.from.username, ch });
    } catch (e) { A.toast(errText(e)); }
  }
  /* app.js calls this when a challenge set is finished (after it is saved in the history) */
  async function finished(Q) {
    const c = Q.challenge; if (!c) return;
    const score = { ok: Q.questions.map((_, i) => !!(Q.results[i] && Q.results[i].ok)), time: Date.now() - Q.started };
    c.state = 'sending'; c.score = score;
    try {
      if (c.mode === 'send') {
        const settings = { subject: Q.settings.subject, year: Q.settings.year, topic: Q.settings.topic, diff: Q.settings.diff, count: Q.questions.length };
        const r = await api('POST', 'challenges', { to: c.to, settings, questions: Q.questions, score });
        c.id = r.id;
      } else {
        await api('POST', 'challenges/' + c.id + '/result', { score });
        c.ch = Object.assign({}, c.ch, { b: { c: score.ok.filter(Boolean).length, n: score.ok.length, ok: score.ok, time: score.time } });
      }
      c.state = 'sent';
    } catch (e) { c.state = 'failed'; c.err = errText(e); }
    if (A.S.screen === 'results') A.render();
    refresh();
  }

  /* ---------- drawing helpers ---------- */
  const av = (i, cls) => { const s = el('span', 'f-av' + (cls ? ' ' + cls : ''), AVATARS[i] || AVATARS[0]); s.setAttribute('aria-hidden', 'true'); return s; };
  const fmtCode = c => (c ? c.slice(0, 3) + '-' + c.slice(3) : '');
  const mmss = ms => { if (!ms && ms !== 0) return ''; const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function btn(text, cls, onClick, id) {
    const b = el('button', 'btn ' + (cls || ''), text); b.type = 'button';
    if (id) b.id = id;
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function field(id, labelKey, type, opts = {}) {
    const wrap = el('div', 'f-field');
    const lab = el('label', '', t(labelKey)); lab.htmlFor = id;
    const inp = el('input'); inp.id = id; inp.type = type || 'text';
    Object.assign(inp, opts);
    if (opts.autocomplete) inp.setAttribute('autocomplete', opts.autocomplete);
    if (opts.inputMode) inp.setAttribute('inputmode', opts.inputMode);
    wrap.append(lab, inp);
    if (opts.hint) { const h = el('p', 'f-hint', t(opts.hint, opts.hintVars)); h.id = id + 'Hint'; inp.setAttribute('aria-describedby', h.id); wrap.append(h); }
    return wrap;
  }
  function errLine() {
    const p = el('p', 'f-err', F.err); p.id = 'fErr'; p.setAttribute('role', 'alert'); p.hidden = !F.err; return p;
  }
  function msgLine() {
    const p = el('p', 'f-msg', F.msg); p.id = 'fMsg'; p.setAttribute('role', 'status'); p.hidden = !F.msg; return p;
  }
  function form(id, onSubmit, ...kids) {
    const f = el('form', 'f-form'); f.id = id; f.noValidate = true;
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (F.busy) return;
      F.busy = true; F.err = ''; F.msg = '';
      f.querySelectorAll('button[type=submit]').forEach(b => { b.disabled = true; });
      try { await onSubmit(f); } catch (err) { F.err = errText(err); }
      F.busy = false;
      A.render();
    });
    f.append(...kids);
    return f;
  }
  const submit = (key, id) => { const b = el('button', 'btn primary', t(key)); b.type = 'submit'; if (id) b.id = id; return b; };
  const val = id => String(($('#' + id) || {}).value || '').trim();
  const focusLater = sel => setTimeout(() => { const x = $(sel); if (x) x.focus(); }, 30);

  /* ---------- the Friends screen ---------- */
  function render() {
    const box = $('#frBody'); if (!box) return;
    // what the student has typed stays when the page is drawn again (after a wrong code, a short password, a language switch)
    const typed = {};
    box.querySelectorAll('input[id]:not([type=radio]), select[id]').forEach(i => { if (i.value) typed[i.id] = i.value; });
    const focused = document.activeElement && box.contains(document.activeElement) ? document.activeElement.id : '';
    draw(box);
    for (const [id, v] of Object.entries(typed)) { const i = document.getElementById(id); if (i && box.contains(i) && !i.value) i.value = v; }
    if (focused) { const f = document.getElementById(focused); if (f && box.contains(f)) f.focus({ preventScroll: true }); }
  }
  function draw(box) {
    box.innerHTML = '';
    if (F.compare) return box.append(compareView(F.compare, true));
    if (F.view === 'reset' || (!signedIn() && F.view !== 'move')) return box.append(accountPanel());
    if (F.view === 'move') return box.append(movePanel());
    if (F.send) return box.append(sendPanel());
    box.append(meCard(), tabsRow(), F.tab === 'friends' ? friendsPart() : challengesPart(), accountPart());
  }

  function accountPanel() {
    const wrap = el('div', 'f-acc');
    const owl = el('div', 'f-owl', '🦉'); owl.setAttribute('aria-hidden', 'true');
    wrap.append(owl);
    if (F.view === 'login' || F.view === 'reg1') {
      const seg = el('div', 'seg f-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', t('acc.choose'));
      [['login', 'acc.signIn', 'fTabLogin'], ['reg1', 'acc.signUp', 'fTabReg']].forEach(([v, key, id]) => {
        const b = btn(t(key), 'seg-btn', () => { F.view = v; F.err = ''; A.render(); focusLater(v === 'login' ? '#fUser' : '#fEmail'); }, id);
        b.className = 'seg-btn'; b.setAttribute('aria-pressed', String(F.view === v));
        seg.append(b);
      });
      wrap.append(seg);
    }
    const v = F.view;
    if (v === 'login') {
      wrap.append(form('fLogin', async () => {
        const username = val('fUser'), password = ($('#fPass') || {}).value || '';
        if (!username || !password) { F.err = t('acc.err.fill'); return; }
        const r = await api('POST', 'login', { username, password });
        await linkAccount(r.token, r.me, false);
      },
      field('fUser', 'acc.username', 'text', { autocomplete: 'username', autocapitalize: 'none', spellcheck: false, maxLength: 20 }),
      field('fPass', 'acc.password', 'password', { autocomplete: 'current-password', maxLength: 200 }),
      errLine(), submit('acc.signIn', 'fLoginGo')));
      wrap.append(btn(t('acc.forgot'), 'ghost small', () => { F.view = 'forgot'; F.err = ''; F.msg = ''; A.render(); focusLater('#fForgotUser'); }, 'fForgot'));
    } else if (v === 'reg1') {
      wrap.append(stepDots(1), form('fReg1', async () => {
        const email = val('fEmail');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { F.err = t('acc.err.bad_email'); return; }
        const r = await api('POST', 'code', { email });
        F.reg = { email, code: '', sentAt: Date.now(), dev: r.devCode || '' };
        F.view = 'reg2'; focusLater('#fCode');
      },
      field('fEmail', 'acc.email', 'email', { autocomplete: 'email', value: F.reg.email, maxLength: 254, hint: 'acc.emailHint' }),
      errLine(), submit('acc.sendCode', 'fReg1Go')));
    } else if (v === 'reg2') {
      const left = Math.max(0, 60 - Math.round((Date.now() - F.reg.sentAt) / 1000));
      const again = btn(left ? t('acc.againIn', { s: left }) : t('acc.again'), 'ghost small', async () => {
        F.err = '';
        try { const r = await api('POST', 'code', { email: F.reg.email }); F.reg.sentAt = Date.now(); F.reg.dev = r.devCode || ''; F.msg = t('acc.codeSent'); }
        catch (e) { F.err = errText(e); }
        A.render();
      }, 'fAgain');
      again.disabled = !!left;
      if (left) setTimeout(() => { if (F.view === 'reg2' && A.S.screen === 'friends') { const b = $('#fAgain'); if (b) { const l = Math.max(0, 60 - Math.round((Date.now() - F.reg.sentAt) / 1000)); b.textContent = l ? t('acc.againIn', { s: l }) : t('acc.again'); b.disabled = !!l; } } }, 1000 * Math.min(left, 5));
      wrap.append(stepDots(2), form('fReg2', async () => {
        const code = val('fCode');
        if (!/^\d{6}$/.test(code)) { F.err = t('acc.err.code_wrong'); return; }
        await api('POST', 'code/check', { email: F.reg.email, code });
        F.reg.code = code; F.view = 'reg3'; focusLater('#fNewUser');
      },
      field('fCode', 'acc.code', 'text', { autocomplete: 'one-time-code', inputMode: 'numeric', maxLength: 6, pattern: '[0-9]*', hint: 'acc.codeHint', hintVars: { email: F.reg.email } }),
      devLine(F.reg.dev), errLine(), msgLine(), submit('acc.next', 'fReg2Go')), again,
      btn(t('acc.otherEmail'), 'ghost small', () => { F.view = 'reg1'; F.err = ''; A.render(); }));
    } else if (v === 'reg3') {
      const pick = el('fieldset', 'f-pick'); const lg = el('legend', '', t('acc.picture')); pick.append(lg);
      const chosen = F.reg.avatar || 0;
      AVATARS.forEach((a, i) => {
        const lab = el('label', 'f-pick-i');
        const r = el('input'); r.type = 'radio'; r.name = 'fAvatar'; r.value = String(i); r.checked = i === chosen; r.id = 'fAv' + i;
        r.addEventListener('change', () => { F.reg.avatar = i; });
        r.setAttribute('aria-label', t('acc.pictureN', { n: i + 1 }));
        lab.append(r, el('span', '', a));
        pick.append(lab);
      });
      wrap.append(stepDots(3), form('fReg3', async () => {
        const username = val('fNewUser').toLowerCase(), password = ($('#fNewPass') || {}).value || '';
        if (!/^[a-z0-9_]{3,20}$/.test(username)) { F.err = t('acc.err.bad_username'); return; }
        if (password.length < 8) { F.err = t('acc.err.bad_password'); return; }
        const avatar = +((document.querySelector('input[name=fAvatar]:checked') || {}).value || 0);
        const r = await api('POST', 'register', { email: F.reg.email, code: F.reg.code, username, password, avatar });
        F.reg = { email: '', code: '', sentAt: 0 };
        await linkAccount(r.token, r.me, true);
        A.toast(t('acc.welcome', { name: r.me.username }));
      },
      field('fNewUser', 'acc.username', 'text', { autocomplete: 'username', autocapitalize: 'none', spellcheck: false, maxLength: 20, hint: 'acc.usernameHint' }),
      field('fNewPass', 'acc.password', 'password', { autocomplete: 'new-password', maxLength: 200, hint: 'acc.passwordHint' }),
      pick, errLine(), submit('acc.create', 'fReg3Go')));
    } else if (v === 'forgot') {
      wrap.append(el('h3', 'f-h', t('acc.forgotH')), form('fForgotForm', async () => {
        const username = val('fForgotUser');
        if (!username) { F.err = t('acc.err.fill'); return; }
        const r = await api('POST', 'reset', { username });
        if (r.devToken) { F.resetToken = r.devToken; F.view = 'reset'; F.msg = t('acc.devReset'); return; }
        F.msg = t('acc.linkSent');
      },
      field('fForgotUser', 'acc.username', 'text', { autocomplete: 'username', autocapitalize: 'none', spellcheck: false, maxLength: 20, hint: 'acc.forgotHint' }),
      errLine(), msgLine(), submit('acc.sendLink', 'fForgotGo')),
      btn(t('acc.back'), 'ghost small', () => { F.view = 'login'; F.err = ''; F.msg = ''; A.render(); }, 'fBackLogin'));
    } else if (v === 'reset') {
      wrap.append(el('h3', 'f-h', t('acc.resetH')), form('fResetForm', async () => {
        const password = ($('#fResetPass') || {}).value || '';
        if (password.length < 8) { F.err = t('acc.err.bad_password'); return; }
        await api('POST', 'reset/finish', { token: F.resetToken, password });
        if (signedIn()) sessionEnded();   // the server has ended every session of that account
        F.resetToken = ''; F.view = 'login'; F.msg = ''; A.toast(t('acc.resetDone'), 6000); focusLater('#fUser');
      },
      field('fResetPass', 'acc.newPassword', 'password', { autocomplete: 'new-password', maxLength: 200, hint: 'acc.passwordHint' }),
      msgLine(), errLine(), submit('acc.saveNew', 'fResetGo')));
    }
    return wrap;
  }
  /* on the Test site and on this PC the code comes back in the answer instead of by email */
  function devLine(code) {
    const p = el('p', 'f-dev', code ? t('acc.devCode', { code }) : ''); p.id = 'fDevCode'; p.hidden = !code; return p;
  }
  function stepDots(n) {
    const d = el('div', 'f-steps'); d.setAttribute('role', 'img'); d.setAttribute('aria-label', t('acc.step', { n, m: 3 }));
    for (let i = 1; i <= 3; i++) d.append(el('i', i <= n ? 'on' : ''));
    return d;
  }

  function movePanel() {
    const P = A.Profiles, pr = P.list.find(x => x.id === F.moveFrom);
    const w = el('div', 'f-acc f-move');
    w.append(el('h3', 'f-h', t('acc.moveH')), el('p', '', t('acc.move', { name: pr ? P.name(pr) : '' })),
      btn(t('acc.moveYes'), 'primary', () => answerMove(true), 'fMoveYes'),
      btn(t('acc.moveNo'), 'secondary', () => answerMove(false), 'fMoveNo'));
    return w;
  }

  function meCard() {
    const me = F.auth.me, c = el('div', 'f-me');
    const who = el('div', 'f-me-t');
    who.append(el('b', '', me.username), el('span', 'f-hint', t('fr.myCode', { code: fmtCode(me.friendCode) })));
    const out = btn(t('acc.signOut'), 'ghost small', () => signOut(false), 'fSignOut');
    c.append(av(me.avatar, 'big'), who, out);
    const box = el('div', 'f-mewrap'); box.append(c);
    if (F.confirmOut) {
      const q = el('div', 'f-confirm'); q.setAttribute('role', 'alert');
      q.append(el('p', '', F.err), btn(t('acc.out.anyway'), 'secondary small', () => signOut(true), 'fOutAnyway'), btn(t('acc.out.stay'), 'ghost small', () => { F.confirmOut = false; F.err = ''; A.render(); }));
      box.append(q);
    }
    return box;
  }
  function tabsRow() {
    const fr = F.friends || { friends: [], incoming: [] }, waiting = waitingForMe().length;
    const seg = el('div', 'seg f-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', t('fr.show'));
    const b1 = btn(t('fr.tabFriends', { n: fr.friends.length }), '', () => { F.tab = 'friends'; F.msg = ''; F.err = ''; A.render(); }, 'fTabFriends');
    const b2 = btn(t('fr.tabChallenges'), '', () => { F.tab = 'challenges'; F.msg = ''; F.err = ''; A.render(); }, 'fTabCh');
    [b1, b2].forEach((b, i) => { b.className = 'seg-btn'; b.setAttribute('aria-pressed', String(F.tab === (i ? 'challenges' : 'friends'))); });
    if (fr.incoming.length) { const d = el('span', 'f-dot', String(fr.incoming.length)); d.setAttribute('aria-label', t('fr.newN', { n: fr.incoming.length })); b1.append(' ', d); }
    if (waiting) { const d = el('span', 'f-dot', String(waiting)); d.setAttribute('aria-label', t('fr.newN', { n: waiting })); b2.append(' ', d); }
    seg.append(b1, b2);
    return seg;
  }
  function friendsPart() {
    const w = el('div', 'f-part'), fr = F.friends;
    w.append(form('fAdd', async f => {
      const who = val('fWho');
      if (!who) { F.err = t('acc.err.fill'); return; }
      if (await addFriend(who)) f.reset();
    }, field('fWho', 'fr.addLabel', 'text', { autocapitalize: 'none', spellcheck: false, maxLength: 24, hint: 'fr.addHint' }), errLine(), msgLine(), submit('fr.add', 'fAddGo')));
    if (!fr) { w.append(el('p', 'f-hint', F.netErr || t('fr.loading'))); return w; }
    if (fr.incoming.length) {
      w.append(el('h3', 'f-sec', t('fr.requests')));
      const ul = el('ul', 'f-list');
      fr.incoming.forEach(u => {
        const li = el('li', 'f-li');
        li.append(av(u.avatar), el('span', 'f-name', t('fr.wants', { name: u.username })),
          btn(t('fr.accept'), 'primary small', () => answerFriend(u.username, true)), btn(t('fr.notNow'), 'ghost small', () => answerFriend(u.username, false)));
        ul.append(li);
      });
      w.append(ul);
    }
    w.append(el('h3', 'f-sec', t('fr.mine')));
    if (!fr.friends.length) w.append(el('p', 'f-hint', t('fr.none')));
    const ul = el('ul', 'f-list'); ul.id = 'fFriendList';
    fr.friends.forEach(u => {
      const li = el('li', 'f-li');
      const name = el('span', 'f-name'); name.append(el('b', '', u.username), el('small', '', seenText(u.seen)));
      li.append(av(u.avatar), name, btn(t('fr.together'), 'primary small', () => openSend(u.username)));
      ul.append(li);
    });
    fr.outgoing.forEach(u => {
      const li = el('li', 'f-li f-wait');
      li.append(av(u.avatar), el('span', 'f-name', t('fr.waitingFor', { name: u.username })));
      ul.append(li);
    });
    w.append(ul);
    return w;
  }
  function seenText(ms) {
    if (!ms) return '';
    const d = Date.now() - ms;
    if (d < 15 * 60e3) return t('fr.seenNow');
    if (d < 864e5) return t('fr.seenToday');
    return t('fr.seenDays', { n: Math.max(1, Math.floor(d / 864e5)) });
  }
  function openSend(to) {
    const st = A.S.settings;
    F.send = { to, subject: st.subject === 'ga' ? 'ga' : 'maths', topic: 'mixed', count: 10 };
    F.err = ''; A.render(); window.scrollTo(0, 0);
  }
  function sendPanel() {
    const s = F.send, st = A.S.settings, w = el('div', 'f-part f-send');
    const year = s.subject === 'ga' && st.year === 0 ? 1 : st.year;
    const top = el('div', 'f-send-h');
    top.append(el('h3', 'f-h', t('fr.togetherWith', { name: s.to })), btn('✕', 'ghost small', () => { F.send = null; F.confirmRemove = ''; A.render(); }, 'fSendClose'));
    top.lastChild.setAttribute('aria-label', t('sheet.close'));
    w.append(top);
    w.append(el('p', 'f-hint', t('fr.howItWorks', { name: s.to })));
    // subject
    const subj = el('div', 'seg'); subj.setAttribute('role', 'group'); subj.setAttribute('aria-label', t('fr.subject'));
    ['maths', 'ga'].forEach(k => {
      const b = btn(t('subject.' + k), '', () => { s.subject = k; s.topic = 'mixed'; A.render(); }, 'fSub-' + k);
      b.className = 'seg-btn'; b.setAttribute('aria-pressed', String(s.subject === k)); subj.append(b);
    });
    w.append(el('p', 'f-sec', t('fr.subject')), subj);
    // topic
    const tw = el('div', 'f-field'), tl = el('label', '', t('fr.topic')); tl.htmlFor = 'fTopic';
    const sel = el('select'); sel.id = 'fTopic';
    A.topicOptions(s.subject, year).forEach(([k, label]) => { const o = el('option', '', label); o.value = k; o.selected = k === s.topic; sel.append(o); });
    sel.addEventListener('change', () => { s.topic = sel.value; });
    tw.append(tl, sel);
    w.append(tw, el('p', 'f-hint', t('fr.year', { year: A.yearLabel(year) })));
    // count
    const cnt = el('div', 'seg'); cnt.setAttribute('role', 'group'); cnt.setAttribute('aria-label', t('fr.count'));
    [5, 10, 20].forEach(n => {
      const b = btn(String(n), '', () => { s.count = n; A.render(); }, 'fCount' + n);
      b.className = 'seg-btn'; b.setAttribute('aria-pressed', String(s.count === n)); cnt.append(b);
    });
    w.append(el('p', 'f-sec', t('fr.count')), cnt);
    w.append(btn(t('fr.startSend', { name: s.to }), 'primary', () => { s.year = year; startSend(); }, 'fSendGo'));
    // remove this friend, with a second tap to confirm
    if (F.confirmRemove === s.to) {
      const q = el('div', 'f-confirm'); q.setAttribute('role', 'alert');
      q.append(el('p', '', t('fr.removeQ', { name: s.to })), btn(t('fr.removeYes'), 'secondary small', () => removeFriend(s.to), 'fRemoveYes'), btn(t('acc.back'), 'ghost small', () => { F.confirmRemove = ''; A.render(); }));
      w.append(q);
    } else w.append(btn(t('fr.remove', { name: s.to }), 'ghost small f-danger', () => { F.confirmRemove = s.to; A.render(); }, 'fRemove'));
    return w;
  }
  function chTitle(c) {
    const s = c.settings || {};
    const topic = s.topic && s.topic !== 'mixed' ? t('topic.' + s.topic) : t('subject.' + (s.subject || 'maths'));
    return t('fr.chTitle', { topic, n: s.count || (c.a && c.a.n) || '' });
  }
  function challengesPart() {
    const w = el('div', 'f-part'), list = F.challenges;
    if (!list) { w.append(el('p', 'f-hint', F.netErr || t('fr.loading'))); return w; }
    const forMe = list.filter(c => !c.mine && !c.b), forThem = list.filter(c => c.mine && !c.b), done = list.filter(c => c.b);
    const section = (key, items, make) => {
      if (!items.length) return;
      w.append(el('h3', 'f-sec', t(key)));
      const ul = el('ul', 'f-list'); items.forEach(c => ul.append(make(c))); w.append(ul);
    };
    if (!list.length) w.append(el('p', 'f-hint', t('fr.noChallenges')));
    section('fr.forYou', forMe, c => {
      const li = el('li', 'f-li');
      const name = el('span', 'f-name'); name.append(el('b', '', t('fr.fromName', { name: c.from.username })), el('small', '', chTitle(c) + ' · ' + t('fr.theirScore', { c: c.a.c, n: c.a.n })));
      li.append(av(c.from.avatar), name, btn(t('fr.doIt'), 'primary small', () => playChallenge(c.id)));
      return li;
    });
    section('fr.forThem', forThem, c => {
      const li = el('li', 'f-li f-wait');
      const name = el('span', 'f-name'); name.append(el('b', '', c.to.username), el('small', '', chTitle(c) + ' · ' + t('fr.myScore', { c: c.a.c, n: c.a.n })));
      li.append(av(c.to.avatar), name, el('span', 'f-ic', '⏳'));
      return li;
    });
    section('fr.done', done, c => {
      const li = el('li', 'f-li');
      const other = c.mine ? c.to : c.from, mine = c.mine ? c.a : c.b, theirs = c.mine ? c.b : c.a;
      const name = el('span', 'f-name'); name.append(el('b', '', t('fr.vs', { a: mine.c, b: theirs.c, name: other.username })), el('small', '', chTitle(c)));
      const icon = mine.c > theirs.c ? '🏆' : mine.c === theirs.c ? '🤝' : '⭐';
      li.append(av(other.avatar), name, btn(t('fr.see'), 'ghost small', async () => {
        try { F.compare = await api('GET', 'challenges/' + c.id); A.render(); window.scrollTo(0, 0); } catch (e) { A.toast(errText(e)); }
      }), el('span', 'f-ic', icon));
      return li;
    });
    return w;
  }
  function accountPart() {
    const d = el('details', 'f-more'); d.open = F.delOpen;
    d.addEventListener('toggle', () => { F.delOpen = d.open; });
    d.append(el('summary', '', t('acc.more')));
    const me = F.auth.me;
    d.append(el('p', 'f-hint', t('acc.emailIs', { email: me.email })));
    // picture
    const row = el('div', 'f-avrow'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', t('acc.picture'));
    AVATARS.forEach((a, i) => {
      const b = el('button', 'f-avbtn', a); b.type = 'button'; b.setAttribute('aria-pressed', String(me.avatar === i)); b.setAttribute('aria-label', t('acc.pictureN', { n: i + 1 }));
      b.addEventListener('click', async () => {
        try { await api('POST', 'me/avatar', { avatar: i }); me.avatar = i; saveAuth(); A.render(); } catch (e) { A.toast(errText(e)); }
      });
      row.append(b);
    });
    d.append(el('p', 'f-sec', t('acc.picture')), row);
    // delete the account: needs the password
    d.append(el('p', 'f-sec', t('acc.delH')), el('p', 'f-hint', t('acc.delNote')), form('fDel', async () => {
      const password = ($('#fDelPass') || {}).value || '';
      if (!password) { F.err = t('acc.err.fill'); return; }
      await api('POST', 'account/delete', { password });
      dropLocal(); F.delOpen = false; A.toast(t('acc.deleted')); A.reload();
    }, field('fDelPass', 'acc.password', 'password', { autocomplete: 'current-password', maxLength: 200 }), submit('acc.delGo', 'fDelGo')));
    return d;
  }

  /* both scores side by side, and each question right or wrong */
  function compareView(c, withBack) {
    const w = el('div', 'f-cmp'); w.id = 'fCompare';
    const me = c.mine ? c.a : c.b, them = c.mine ? c.b : c.a, other = c.mine ? c.to : c.from, my = F.auth ? F.auth.me : { avatar: 0 };
    const head = me.c > them.c ? t('fr.won') : me.c === them.c ? t('fr.draw') : t('fr.lost', { name: other.username });
    w.append(el('h3', 'f-h', head), el('p', 'f-hint', chTitle(c)));
    const sc = el('div', 'f-score');
    const side = (avatar, name, s, win) => {
      const d = el('div', 'f-side' + (win ? ' win' : ''));
      d.append(av(avatar), el('span', '', name), el('b', '', t('fr.cOfN', { c: s.c, n: s.n })), el('small', '', s.time ? mmss(s.time) : ''));
      return d;
    };
    sc.append(side(my.avatar, t('fr.me'), me, me.c > them.c), side(other.avatar, other.username, them, them.c > me.c));
    w.append(sc);
    const rows = el('div', 'f-qs');
    [[t('fr.me'), me], [other.username, them]].forEach(([name, s]) => {
      const r = el('div', 'f-qrow'); r.append(el('span', 'f-qn', name));
      const dots = el('span', 'f-dots');
      s.ok.forEach((ok, i) => { const q = el('span', ok ? 'y' : 'n', String(i + 1)); q.setAttribute('aria-label', t(ok ? 'fr.qRight' : 'fr.qWrong', { n: i + 1 })); dots.append(q); });
      r.append(dots); rows.append(r);
    });
    w.append(rows);
    const gotThey = me.ok.map((ok, i) => (!ok && them.ok[i] ? i + 1 : 0)).filter(Boolean);
    if (gotThey.length) w.append(el('p', 'f-hint', t('fr.theyGot', { list: gotThey.join(', '), name: other.username })));
    const both = me.ok.filter((ok, i) => ok && them.ok[i]).length;
    w.append(el('p', 'f-hint', t('fr.both', { n: both })));
    w.append(btn(t('fr.sendBack', { name: other.username }), 'primary', () => { F.compare = null; A.go('friends'); openSend(other.username); }, 'fSendBack'));
    if (withBack) w.append(btn(t('fr.backFriends'), 'ghost', () => { F.compare = null; A.render(); }, 'fCmpBack'));
    return w;
  }

  /* the card on the results screen after a challenge set */
  function results(Q) {
    const box = $('#resVs'); if (!box) return;
    box.innerHTML = '';
    const c = Q && Q.challenge;
    box.hidden = !c;
    if (!c) return;
    if (c.state === 'failed') {
      box.append(el('p', 'f-err', c.err), btn(t('fr.tryAgain'), 'secondary small', () => finished(Q), 'fRetry'));
      return;
    }
    if (c.mode === 'send') {
      box.append(el('p', '', c.state === 'sent' ? t('fr.sentSet', { name: c.to }) : t('fr.sending', { name: c.to })));
      return;
    }
    if (c.state !== 'sent' || !c.ch || !c.ch.b) { box.append(el('p', '', t('fr.sending', { name: c.from }))); return; }
    box.append(compareView(c.ch, false));
  }

  /* the Friends part of Home: sign in, or the friends and what is waiting */
  function homeBox() {
    const box = $('#friendsInner'); if (!box) return;
    box.innerHTML = '';
    if (!signedIn()) {
      const b = el('button', 'fr-cta'); b.type = 'button'; b.id = 'friendsCta';
      b.append(el('span', 'fr-cta-ic', '🤝'), el('span', '', t('fr.homeSignIn')));
      b.firstChild.setAttribute('aria-hidden', 'true');
      b.addEventListener('click', () => A.go('friends'));
      box.append(b);
      return;
    }
    const fr = F.friends ? F.friends.friends : [], waiting = waitingForMe().length + (F.friends ? F.friends.incoming.length : 0);
    const b = el('button', 'fr-cta'); b.type = 'button'; b.id = 'friendsCta';
    const faces = el('span', 'fr-faces'); faces.setAttribute('aria-hidden', 'true');
    fr.slice(0, 4).forEach(u => faces.append(av(u.avatar)));
    if (!fr.length) faces.append(el('span', 'f-av', '＋'));
    b.append(faces, el('span', '', waiting ? t('fr.homeWaiting', { n: waiting }) : fr.length ? t('fr.homeN', { n: fr.length }) : t('fr.homeAdd')));
    b.addEventListener('click', () => A.go('friends'));
    box.append(b);
  }

  /* ---------- start ---------- */
  function init(bridge) {
    A = bridge; t = A.t; el = A.el; $ = A.$;
    F.auth = A.store.get(AUTH, null);
    if (F.auth && (!F.auth.me || !F.auth.me.username)) F.auth = null;
    // the account's profile was removed from this device (Parent settings): the account stays signed in, with a new profile
    if (F.auth && F.auth.profile && !A.Profiles.list.some(x => x.id === F.auth.profile)) F.auth.profile = null;
    if (F.auth && F.auth.token && !F.auth.profile) F.auth.profile = A.Profiles.addAccount(F.auth.me.username).id;
    saveAuth();
    // a reset link from the email: ?reset=<token>
    const m = /[?&]reset=([A-Za-z0-9_-]{20,100})/.exec(location.search);
    if (m) {
      F.resetToken = m[1]; F.view = 'reset';
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
      setTimeout(() => A.go('friends'), 0);
    }
    if (signedIn()) { refresh(); pull(); }
    startPolling();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') { refresh(); pull(); }   // R1.1: the other device's sets come in
      else if (F.syncTimer) upload();   // the app may be closed next: save now
    });
    window.addEventListener('pagehide', () => { if (F.syncTimer) upload(); });
    updateDot();
  }

  window.Friends = {
    init, render, results, homeBox, changed, finished, updateDot, refresh, pull, upload,
    get signedIn() { return signedIn(); },
    get account() { return F.auth && F.auth.me ? F.auth.me.username : ''; },
    accountProfile: () => (F.auth ? F.auth.profile : null),
    _state: F
  };
})();
