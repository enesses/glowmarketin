// Glow Marketing — hızlı duman testi. Çalıştır: node otomasyon/smoke-test.mjs
// Sunucuyu anahtarsız başlatır, temel uçları dener, index.html içindeki betiklerin sözdizimini denetler.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'glow-marketing');
let fail = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { fail++; console.log('  ✗ ' + m); };

// 1) server.js sözdizimi
try { execFileSync(process.execPath, ['--check', path.join(root, 'server.js')]); ok('server.js sözdizimi'); }
catch (e) { bad('server.js sözdizimi: ' + e.stderr?.toString().split('\n').slice(0, 4).join(' ')); }

// 2) index.html içindeki satır içi betikler
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
scripts.forEach((s, i) => {
  try { new vm.Script(s, { filename: `index.html#script${i}` }); ok(`index.html betik ${i} sözdizimi`); }
  catch (e) { bad(`index.html betik ${i}: ${e.message}`); }
});

// 3) Sunucu uçları (anahtarsız)
const PORT = 3999;
const env = { ...process.env, PORT: String(PORT), DEEPSEEK_API_KEY: '', PUBLIC_URL: '', FAL_KEY: '', OPENROUTER_API_KEY: '' };
const srv = spawn(process.execPath, [path.join(root, 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40 && !log.includes('localhost'); i++) await wait(100);
const base = `http://127.0.0.1:${PORT}`;
async function check(name, fn) { try { const r = await fn(); r === true ? ok(name) : bad(`${name}: ${r}`); } catch (e) { bad(`${name}: ${e.message}`); } }
await check('GET /api/health', async () => { const r = await fetch(base + '/api/health'); const j = await r.json(); return r.ok && j.ok === true || `durum ${r.status}`; });
await check('GET / (index.html)', async () => { const r = await fetch(base + '/'); return r.ok && (await r.text()).includes('<html') || `durum ${r.status}`; });
await check('Yol geçişi engelli', async () => { const r = await fetch(base + '/..%2fserver.js'); return r.status !== 200 || 'server.js dışarı sızdı'; });
await check('Bilinmeyen ajan 400', async () => { const r = await fetch(base + '/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"agent":"yok"}' }); return r.status === 400 || `durum ${r.status}`; });
await check('Anahtarsız ajan 503', async () => { const r = await fetch(base + '/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"agent":"icerik"}' }); return r.status === 503 || `durum ${r.status}`; });
await check('Bozuk JSON 400', async () => { const r = await fetch(base + '/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }); return r.status === 400 || `durum ${r.status}`; });

// Ajanların eklediği ek testler: otomasyon/testler/*.mjs (her biri default export async (base, ok, bad) => {})
const tdir = path.join(path.dirname(root), 'otomasyon', 'testler');
if (fs.existsSync(tdir)) for (const f of fs.readdirSync(tdir).filter((f) => f.endsWith('.mjs')).sort()) {
  try { const m = await import(path.join(tdir, f)); await m.default(base, ok, bad); }
  catch (e) { bad(`${f}: ${e.message}`); }
}

srv.kill();
console.log(fail ? `\n${fail} test BAŞARISIZ` : '\nTüm testler geçti');
process.exit(fail ? 1 : 0);
