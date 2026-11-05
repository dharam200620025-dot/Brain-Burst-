'use strict';
// BrainBurst backend: Node 18+, no npm packages. Run: node server.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public'), DIR = path.join(__dirname, 'data');
const DBF = path.join(DIR, 'db.json'), SEED = path.join(DIR, 'seed.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain' };

/* ---- password hashing (scrypt) ---- */
const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
const check = (pw, h) => { const [s, x] = h.split(':'), y = hash(pw, s).split(':')[1]; return crypto.timingSafeEqual(Buffer.from(x, 'hex'), Buffer.from(y, 'hex')); };

/* ---- JSON "database" ---- */
let db;
const seed = () => JSON.parse(fs.readFileSync(SEED, 'utf8'));
const save = () => { fs.writeFileSync(DBF + '.tmp', JSON.stringify(db)); fs.renameSync(DBF + '.tmp', DBF); };
try { db = JSON.parse(fs.readFileSync(DBF, 'utf8')); }
catch { db = seed(); db.cfg.user = process.env.ADMIN_USER || 'admin'; db.cfg.hash = hash(process.env.ADMIN_PASSWORD || 'admin123'); save(); }

/* ---- helpers ---- */
const sess = new Map(), tries = new Map();
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const body = req => new Promise((ok, no) => {
  let d = '';
  req.on('data', c => { d += c; if (d.length > 2e6) { no(new Error('Too large')); req.destroy(); } });
  req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch { no(new Error('Bad JSON')); } });
});
const pubCfg = () => { const { ads, pub, slot, timer, sec } = db.cfg; return { ads, pub, slot, timer, sec }; };
const pub = () => ({ cats: db.cats, quizzes: db.quizzes, cfg: pubCfg() });

/* ---- API ---- */
async function api(req, res, m, p) {
  if (m === 'GET' && p === '/api/bootstrap') return send(res, 200, pub());

  if (m === 'POST' && p === '/api/track') {            // public analytics
    const b = await body(req), s = db.stats, z = db.quizzes.find(x => x.id === b.quizId);
    if (b.type === 'view') s.views++;
    else if (b.type === 'play' && z) { s.plays++; z.plays++; }
    else if (b.type === 'done' && z) { s.done++; s.score += Math.min(100, Math.max(0, +b.score || 0)); z.done++; }
    else if (b.type === 'share') s.shares++;
    save(); return send(res, 200, { ok: 1 });
  }

  if (m === 'POST' && p === '/api/login') {            // admin login with brute-force limit
    const ip = req.socket.remoteAddress, t = tries.get(ip) || { n: 0, t: Date.now() };
    if (Date.now() - t.t > 9e5) { t.n = 0; t.t = Date.now(); }
    if (t.n >= 5) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const b = await body(req);
    if (!(String(b.user) === db.cfg.user && check(String(b.password || ''), db.cfg.hash))) { t.n++; tries.set(ip, t); return send(res, 401, { error: 'Wrong username or password' }); }
    tries.delete(ip);
    const tok = crypto.randomBytes(32).toString('hex'); sess.set(tok, Date.now() + 432e5);
    return send(res, 200, { token: tok });
  }

  /* everything below needs a valid admin token */
  const tok = (req.headers.authorization || '').slice(7);
  if (!(sess.get(tok) > Date.now())) { sess.delete(tok); return send(res, 401, { error: 'Please log in again' }); }

  if (m === 'GET' && p === '/api/admin/data') return send(res, 200, { ...pub(), stats: db.stats, cfg: { ...pubCfg(), user: db.cfg.user } });

  if (m === 'PUT' && p === '/api/admin/data') {        // save quizzes, categories, ad & timer settings
    const b = await body(req);
    if (!Array.isArray(b.quizzes) || !Array.isArray(b.cats)) return send(res, 400, { error: 'Bad data' });
    const old = Object.fromEntries(db.quizzes.map(z => [z.id, z])), c = b.cfg || {}, a = c.ads || {};
    db.cats = b.cats.map(String).slice(0, 50);
    db.quizzes = b.quizzes.slice(0, 500).map(z => ({
      id: String(z.id), t: String(z.t).slice(0, 80), c: String(z.c),
      d: ['Easy', 'Medium', 'Hard'].includes(z.d) ? z.d : 'Easy',
      plays: old[z.id]?.plays || 0, done: old[z.id]?.done || 0,   // counters are server-owned
      q: (z.q || []).slice(0, 200).map(k => ({ q: String(k.q), o: (k.o || []).slice(0, 6).map(String), a: +k.a }))
    }));
    db.cfg = { ...db.cfg, ads: { on: !!a.on, head: !!a.head, mid: !!a.mid, end: !!a.end }, pub: String(c.pub || '').slice(0, 60), slot: String(c.slot || '').slice(0, 30), timer: !!c.timer, sec: [10, 15, 20, 30].includes(+c.sec) ? +c.sec : 15 };
    save(); return send(res, 200, { ok: 1 });
  }

  if (m === 'POST' && p === '/api/admin/password') {
    const b = await body(req), u = String(b.user || '').trim(), pw = String(b.password || '');
    if (!u) return send(res, 400, { error: 'Username required' });
    if (pw && pw.length < 8) return send(res, 400, { error: 'Password needs 8+ characters' });
    db.cfg.user = u; if (pw) db.cfg.hash = hash(pw);
    save(); return send(res, 200, { ok: 1 });
  }

  if (m === 'POST' && p === '/api/admin/reset') {      // restore demo quizzes, zero the stats
    const s = seed(); db.cats = s.cats; db.quizzes = s.quizzes; db.stats = s.stats;
    save(); return send(res, 200, { ok: 1 });
  }
  return send(res, 404, { error: 'Not found' });
}

/* ---- server: API + static files ---- */
http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.startsWith('/api/')) return await api(req, res, req.method, p);
    const f = path.normalize(path.join(ROOT, p === '/' ? '/index.html' : p));
    if (!f.startsWith(ROOT)) return send(res, 403, { error: 'Forbidden' });
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(d);
    });
  } catch (e) {
    const known = ['Bad JSON', 'Too large'].includes(e.message);
    send(res, known ? 400 : 500, { error: known ? e.message : 'Server error' });
  }
}).listen(PORT, () => console.log('BrainBurst running on http://localhost:' + PORT));
