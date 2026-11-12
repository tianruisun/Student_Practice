/* The server (server/api.js) on this PC for the tests: a D1 stand-in on node:sqlite (in memory) and an adapter from
   Node's http requests to the Fetch Request/Response the Pages Function uses. DEV_CODES is on, as on the Test site,
   so codes and reset tokens come back in the answer instead of by email. */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { pathToFileURL } = require('url');

class Stmt {
  constructor(db, sql, params = []) { this.db = db; this.sql = sql; this.params = params; }
  bind(...p) { return new Stmt(this.db, this.sql, p); }
  async first() { const r = this.db.prepare(this.sql).get(...this.params); return r ? Object.assign({}, r) : null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.params).map(r => Object.assign({}, r)) }; }
  async run() { return this.runNow(); }
  runNow() { const r = this.db.prepare(this.sql).run(...this.params); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
}
/* the part of the D1 API the server uses: prepare/bind/first/all/run and batch (one transaction) */
function fakeD1() {
  const db = new DatabaseSync(':memory:');
  return {
    raw: db,
    prepare: sql => new Stmt(db, sql),
    async batch(list) {
      db.exec('BEGIN');
      try { const out = list.map(s => s.runNow()); db.exec('COMMIT'); return out; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    }
  };
}

let mod = null;
const api = () => mod || (mod = import(pathToFileURL(path.join(__dirname, '..', 'server', 'api.js')).href));

/* a handler for tests/serve.js: answers /api/* from one in-memory database per server */
function localApi(env = {}) {
  const fullEnv = Object.assign({ DB: fakeD1(), DEV_CODES: '1' }, env);
  return async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    const request = new Request('http://' + (req.headers.host || '127.0.0.1') + req.url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
    const out = await (await api()).handle(request, fullEnv);
    const h = {}; out.headers.forEach((v, k) => { h[k] = v; });
    res.writeHead(out.status, h);
    res.end(Buffer.from(await out.arrayBuffer()));
  };
}

module.exports = { fakeD1, localApi, api };
