// X ajanı testleri: /api/x/* uçları (anahtarsız + sahte X sunucusuyla tam akış), 280 sayacı, arayüz dosyaları.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'glow-marketing');
const require = createRequire(import.meta.url);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (b, p, body) => fetch(b + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export default async (base, ok, bad) => {
  const t = async (name, fn) => { try { const r = await fn(); r === true ? ok(name) : bad(`${name}: ${r}`); } catch (e) { bad(`${name}: ${e.message}`); } };

  // 1) Anahtarsız sunucu
  await t('X config (anahtarsız) kapalı', async () => { const r = await fetch(base + '/api/x/config'); const j = await r.json(); return r.ok && j.enabled === false || `durum ${r.status}`; });
  await t('X post anahtarsız 503', async () => (await post(base, '/api/x/post', { text: 'a', access_token: 'x' })).status === 503 || 'beklenmedik');
  await t('X GET post 405', async () => (await fetch(base + '/api/x/post')).status === 405 || 'beklenmedik');
  await t('X bilinmeyen uç 404', async () => (await post(base, '/api/x/yok', {})).status === 404 || 'beklenmedik');

  // 2) Sayaç ve yönlendirme denetimi
  const X = require(path.join(root, 'x-api.js'));
  await t('X sayaç: düz metin', async () => X.weightedLength('Merhaba dünya ğüşıöç') === 20 || X.weightedLength('Merhaba dünya ğüşıöç'));
  await t('X sayaç: bağlantı 23', async () => X.weightedLength('bak https://ornek.com/cok/uzun/bir/yol?x=1') === 27 || X.weightedLength('bak https://ornek.com/cok/uzun/bir/yol?x=1'));
  await t('X sayaç: emoji 2', async () => X.weightedLength('👍🏽☕') === 4 || X.weightedLength('👍🏽☕'));
  await t('X sayaç: CJK 2', async () => X.weightedLength('日本') === 4 || 'yanlış');
  const c = { redirects: [], origins: ['https://alanadin.com'] };
  await t('X yönlendirme denetimi', async () => X.redirectOk('https://alanadin.com/x-callback.html', c) && X.redirectOk('http://localhost:3000/x-callback.html', c)
    && !X.redirectOk('https://kotu.com/x-callback.html', c) && !X.redirectOk('https://alanadin.com/index.html', c) && !X.redirectOk('http://alanadin.com/x-callback.html', c) || 'yanlış');

  // 3) Arayüz dosyaları
  await t('public/x.js sözdizimi', async () => { new vm.Script(fs.readFileSync(path.join(root, 'public', 'x.js'), 'utf8')); return true; });
  await t('x-callback.html betik sözdizimi', async () => {
    const h = fs.readFileSync(path.join(root, 'public', 'x-callback.html'), 'utf8');
    const s = [...h.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    if (!s.length) return 'betik yok'; s.forEach((x) => new vm.Script(x)); return true;
  });
  await t('GET /x.js sunuluyor', async () => { const r = await fetch(base + '/x.js'); return r.ok && (await r.text()).includes('GlowX') || `durum ${r.status}`; });
  await t('index.html x.js yüklüyor', async () => fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8').includes('src="x.js"') || 'eksik');

  // 4) Sahte X API ile tam akış
  const seen = [];
  const mock = http.createServer((req, res) => {
    let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => {
      seen.push({ url: req.url, auth: req.headers.authorization || '', body: d });
      const j = (s, o) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (req.url === '/2/oauth2/token') {
        const q = new URLSearchParams(d);
        if (q.get('grant_type') === 'authorization_code') return q.get('code') === 'iyi' ? j(200, { access_token: 'AT1', refresh_token: 'RT1', expires_in: 7200, scope: 'tweet.read tweet.write users.read offline.access' }) : j(400, { error: 'invalid_request' });
        if (q.get('grant_type') === 'refresh_token') return q.get('refresh_token') === 'RT1' ? j(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 7200 }) : j(400, { error: 'invalid_request' });
      }
      if (req.url.startsWith('/2/users/me')) return req.headers.authorization === 'Bearer AT1' ? j(200, { data: { id: '42', username: 'glowtest', name: 'Glow' } }) : j(401, { title: 'Unauthorized' });
      if (req.url === '/2/tweets') {
        if (req.headers.authorization !== 'Bearer AT2') return j(401, { title: 'Unauthorized' });
        const b = JSON.parse(d); if (b.media && JSON.stringify(b.media.media_ids) !== '["777"]') return j(400, { detail: 'bad media id' });
        if (b.text === 'tekrar') return j(403, { detail: 'You are not allowed to create a Tweet with duplicate content.' });
        return j(201, { data: { id: '1999', text: b.text } });
      }
      if (req.url === '/2/media/upload') {
        if (req.headers.authorization === 'Bearer ESKIIZIN') return j(403, { title: 'Forbidden', detail: 'missing scope media.write' });
        if (req.headers.authorization !== 'Bearer AT2') return j(401, { title: 'Unauthorized' });
        const b = JSON.parse(d);
        if (b.media_category !== 'tweet_image' || !Buffer.from(b.media, 'base64').subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return j(400, { detail: 'bad media' });
        return j(200, { data: { id: '777', media_key: '3_777', size: 200 } });
      }
      if (req.url === '/2/oauth2/revoke') return j(200, { revoked: true });
      j(404, {});
    });
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  const PORT = 3998;
  const up = fs.mkdtempSync(path.join(require('os').tmpdir(), 'glowx-'));
  const IMG = 'ab'.repeat(16) + '.jpg';
  fs.writeFileSync(path.join(up, IMG), Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200)]));
  const env = { ...process.env, UPLOADS_DIR: up, PORT: String(PORT), DEEPSEEK_API_KEY: '', PUBLIC_URL: 'https://alanadin.com', X_CLIENT_ID: 'cid', X_CLIENT_SECRET: 'sec', X_API_BASE: `http://127.0.0.1:${mock.address().port}`, X_REDIRECT_URIS: '' };
  const srv = spawn(process.execPath, [path.join(root, 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 40 && !log.includes('localhost'); i++) await wait(100);
  const b2 = `http://127.0.0.1:${PORT}`;
  const V = 'a'.repeat(43), R = 'https://alanadin.com/x-callback.html';
  try {
    await t('X config açık', async () => { const j = await (await fetch(b2 + '/api/x/config')).json(); return j.enabled === true && j.clientId === 'cid' && j.scopes.includes('offline.access') || JSON.stringify(j); });
    await t('X token: kötü yönlendirme 400', async () => (await post(b2, '/api/x/token', { code: 'iyi', code_verifier: V, redirect_uri: 'https://kotu.com/x-callback.html' })).status === 400 || 'beklenmedik');
    await t('X token: kısa doğrulayıcı 400', async () => (await post(b2, '/api/x/token', { code: 'iyi', code_verifier: 'kisa', redirect_uri: R })).status === 400 || 'beklenmedik');
    await t('X token: geçersiz kod 400', async () => (await post(b2, '/api/x/token', { code: 'kotu', code_verifier: V, redirect_uri: R })).status === 400 || 'beklenmedik');
    await t('X token değişimi + kullanıcı', async () => {
      const r = await post(b2, '/api/x/token', { code: 'iyi', code_verifier: V, redirect_uri: R }); const j = await r.json();
      const tk = seen.find((s) => s.url === '/2/oauth2/token' && s.body.includes('code=iyi'));
      const basic = 'Basic ' + Buffer.from('cid:sec').toString('base64');
      return r.ok && j.access_token === 'AT1' && j.refresh_token === 'RT1' && j.user?.username === 'glowtest' && tk.auth === basic && tk.body.includes('code_verifier=' + V) || JSON.stringify(j);
    });
    await t('X yenileme', async () => { const j = await (await post(b2, '/api/x/refresh', { refresh_token: 'RT1' })).json(); return j.access_token === 'AT2' && j.refresh_token === 'RT2' || JSON.stringify(j); });
    await t('X yenileme reddi 401', async () => (await post(b2, '/api/x/refresh', { refresh_token: 'yok' })).status === 401 || 'beklenmedik');
    await t('X gönderi', async () => { const j = await (await post(b2, '/api/x/post', { access_token: 'AT2', text: 'Merhaba X', username: 'glowtest' })).json(); return j.id === '1999' && j.url === 'https://x.com/glowtest/status/1999' || JSON.stringify(j); });
    await t('X config media.write istiyor', async () => (await (await fetch(b2 + '/api/x/config')).json()).scopes.includes('media.write') || 'eksik');
    await t('X görselli gönderi', async () => {
      const j = await (await post(b2, '/api/x/post', { access_token: 'AT2', text: 'Görselli', media: 'https://alanadin.com/media/' + IMG })).json();
      const up1 = seen.find((s) => s.url === '/2/media/upload'), tw = seen.filter((s) => s.url === '/2/tweets').pop();
      return j.id === '1999' && j.media === true && up1?.auth === 'Bearer AT2' && JSON.parse(tw.body).media?.media_ids?.[0] === '777' || JSON.stringify(j);
    });
    await t('X yalnızca görsel (metinsiz)', async () => { const r = await post(b2, '/api/x/post', { access_token: 'AT2', text: '', media: IMG }); return r.ok || `durum ${r.status}`; });
    await t('X metin gönderisinde media yok', async () => { await post(b2, '/api/x/post', { access_token: 'AT2', text: 'Sadece metin' }); return !JSON.parse(seen.filter((s) => s.url === '/2/tweets').pop().body).media || 'media eklendi'; });
    await t('X dış görsel adresi 400', async () => (await post(b2, '/api/x/post', { access_token: 'AT2', text: 'a', media: 'https://kotu.com/resim.png' })).status === 400 || 'beklenmedik');
    await t('X olmayan görsel 400', async () => (await post(b2, '/api/x/post', { access_token: 'AT2', text: 'a', media: 'cd'.repeat(16) + '.jpg' })).status === 400 || 'beklenmedik');
    await t('X görsel izni yok 403', async () => { const r = await post(b2, '/api/x/post', { access_token: 'ESKIIZIN', text: 'a', media: IMG }); const j = await r.json(); return r.status === 403 && /yeniden bağlan/.test(j.error) || `${r.status} ${j.error}`; });
    await t('X gönderi 281 karakter 400', async () => (await post(b2, '/api/x/post', { access_token: 'AT2', text: 'a'.repeat(281) })).status === 400 || 'beklenmedik');
    await t('X gönderi süresi dolmuş 401', async () => (await post(b2, '/api/x/post', { access_token: 'ESKI', text: 'a' })).status === 401 || 'beklenmedik');
    await t('X gönderi tekrar 409', async () => (await post(b2, '/api/x/post', { access_token: 'AT2', text: 'tekrar' })).status === 409 || 'beklenmedik');
    await t('X iptal', async () => (await (await post(b2, '/api/x/revoke', { token: 'RT2', hint: 'refresh_token' })).json()).ok === true || 'beklenmedik');
  } finally { srv.kill(); mock.close(); fs.rmSync(up, { recursive: true, force: true }); }
};
