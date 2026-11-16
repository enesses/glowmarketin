// X ajanı (16 Kasım): x.js tarayıcı mantığı — izin (scope) eskiyse "yeniden bağlan", reset() glowX'i temizler, Capacitor uyarısı.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'glow-marketing');
const src = fs.readFileSync(path.join(root, 'public', 'x.js'), 'utf8');

function sandbox({ scope, protocol = 'https:', capacitor = null }) {
  const store = new Map();
  if (scope != null) store.set('glowX', JSON.stringify({ accessToken: 'A', refreshToken: 'R', expiresAt: Date.now() + 3e6, scope, user: { username: 'u', name: 'U' } }));
  const calls = [];
  const win = {
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    location: { protocol, origin: 'https://alanadin.com', pathname: '/' },
    document: { addEventListener() {}, getElementById: () => null },
    fetch: async (u, o) => { calls.push({ u, o }); return { ok: true, status: 200, json: async () => ({ enabled: true, clientId: 'cid', scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access', 'media.write'] }) }; },
    Intl, TextEncoder, URLSearchParams, Promise, setInterval, clearInterval, setTimeout, Date, JSON, Array, String, RegExp, Error, Uint8Array, btoa,
  };
  if (capacitor) win.Capacitor = capacitor;
  win.window = win;
  vm.runInNewContext(src, win);
  return { GX: win.GlowX, store, calls };
}

export default async (base, ok, bad) => {
  const t = async (name, fn) => { try { const r = await fn(); r === true ? ok(name) : bad(`${name}: ${r}`); } catch (e) { bad(`${name}: ${e.message}`); } };
  await t('X arayüz: eski izin → yeniden bağlan', async () => { const { GX } = sandbox({ scope: 'tweet.read tweet.write users.read offline.access' }); return GX.scopeOld() === true && GX.canMedia() === false && GX.connected() === true || 'yanlış'; });
  await t('X arayüz: media.write varsa görsel serbest', async () => { const { GX } = sandbox({ scope: 'tweet.read tweet.write users.read offline.access media.write' }); return GX.scopeOld() === false && GX.canMedia() === true || 'yanlış'; });
  await t('X arayüz: eski izinle görselli paylaşım engellenir', async () => {
    const { GX, calls } = sandbox({ scope: 'tweet.read tweet.write' });
    try { await GX.publish('a', { media: 'x' }); return 'engellenmedi'; } catch (e) { return e.scope === true && !calls.some((c) => String(c.u).includes('/api/x/post')) || e.message; }
  });
  await t('X arayüz: reset glowX siler', async () => { const { GX, store } = sandbox({ scope: 'tweet.read' }); GX.reset(); return !store.has('glowX') && GX.connected() === false || 'silinmedi'; });
  await t('X arayüz: Capacitor uyarısı', async () => {
    const a = sandbox({ scope: null, protocol: 'capacitor:' }), b = sandbox({ scope: null, capacitor: { isNativePlatform: () => true } }), c = sandbox({ scope: null });
    return a.GX.native() && b.GX.native() && !c.GX.native() && /web sürümünden/.test(a.GX.nativeMsg) || 'yanlış';
  });
  await t('index.html resetAll X’i temizliyor', async () => /async function resetAll\(\)[\s\S]{0,600}GX\.reset\(\)/.test(fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8')) || 'GX.reset yok');
};
