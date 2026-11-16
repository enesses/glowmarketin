// [sunucu] 16 Kasım: video indirmesi akışla diske (.tmp → rename), sahte fal.ai sağlayıcısıyla.
// Kendi sunucusunu ayrı portta, geçici UPLOADS_DIR ile başlatır; ana test sunucusunu etkilemez.
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export default async function (_base, ok, bad) {
  const t = async (name, fn) => { try { const r = await fn(); r === true ? ok(name) : bad(`${name}: ${r}`); } catch (e) { bad(`${name}: ${e.message}`); } };
  const MOCK = 3997, PORT = 3996;
  const video = Buffer.alloc(300 * 1024, 7);
  const mock = http.createServer((req, res) => {
    const m = req.url.match(/^\/bytedance\/seedance-2\.5\/requests\/([a-z]+)(\/status)?$/);
    if (m && m[2]) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"status":"COMPLETED"}'); }
    if (m) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ video: { url: `http://127.0.0.1:${MOCK}/${m[1]}.mp4` } })); }
    if (req.url === '/iyi.mp4') { res.writeHead(200, { 'Content-Type': 'video/mp4' }); // parça parça (chunked) gönder
      let i = 0; const step = () => { if (i >= video.length) return res.end(); res.write(video.subarray(i, i += 64 * 1024)); setImmediate(step); }; return step(); }
    if (req.url === '/kucuk.mp4') { res.writeHead(200, { 'Content-Type': 'video/mp4' }); return res.end('abc'); }
    if (req.url === '/kopuk.mp4') { res.writeHead(200, { 'Content-Type': 'video/mp4' }); res.write(video.subarray(0, 50000)); return setTimeout(() => res.destroy(), 50); }
    res.writeHead(404); res.end();
  });
  await new Promise((r) => mock.listen(MOCK, '127.0.0.1', r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'glow-video-'));
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'glow-marketing');
  const env = { ...process.env, PORT: String(PORT), DEEPSEEK_API_KEY: '', OPENROUTER_API_KEY: '', FAL_KEY: 'test-fal-gizli', FAL_QUEUE_BASE: `http://127.0.0.1:${MOCK}`, PUBLIC_URL: `http://127.0.0.1:${PORT}`, UPLOADS_DIR: dir, VIDEO_MODEL: 'seedance-2.5' };
  const srv = spawn(process.execPath, [path.join(root, 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 40 && !log.includes('localhost'); i++) await new Promise((r) => setTimeout(r, 100));
  const base = `http://127.0.0.1:${PORT}`;
  const H = { 'X-Forwarded-For': '10.77.1.1' };
  const tmps = () => fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'));
  try {
    await t('[sunucu] video akışla diske kaydedildi', async () => {
      const r = await fetch(base + '/api/video/gv_fal_seedance-2.5_t2v_iyi', { headers: H });
      const j = await r.json();
      if (j.status !== 'SUCCEEDED') return `durum ${r.status} ${JSON.stringify(j)}`;
      const name = j.url.split('/').pop();
      const st = fs.statSync(path.join(dir, name));
      if (st.size !== video.length) return `boyut ${st.size}`;
      if (tmps().length) return '.tmp dosyası kaldı';
      const m = await fetch(j.url, { headers: { ...H, Range: 'bytes=0-9' } });
      return m.status === 206 || `mp4 sunumu ${m.status}`;
    });
    await t('[sunucu] çok küçük video 502, .tmp silindi', async () => {
      const r = await fetch(base + '/api/video/gv_fal_seedance-2.5_t2v_kucuk', { headers: H });
      const j = await r.json();
      if (r.status !== 502 || !/geçersiz/.test(j.error || '')) return `durum ${r.status} ${JSON.stringify(j)}`;
      return !tmps().length || '.tmp dosyası kaldı';
    });
    await t('[sunucu] kopan indirme 502, yarım dosya yok', async () => {
      const r = await fetch(base + '/api/video/gv_fal_seedance-2.5_t2v_kopuk', { headers: H });
      if (r.status !== 502) return `durum ${r.status}`;
      const mp4 = fs.readdirSync(dir).filter((f) => f.endsWith('.mp4'));
      return (!tmps().length && mp4.length === 1) || `dosyalar: ${fs.readdirSync(dir).join(',')}`;
    });
    await t('[sunucu] loglarda sağlayıcı anahtarı yok', async () => !log.includes('test-fal-gizli') || 'FAL_KEY logda göründü');
  } finally {
    srv.kill(); mock.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
