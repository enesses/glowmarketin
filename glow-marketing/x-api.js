// Glow Marketing — X (Twitter) bağlantısı. server.js bu modülü /api/x/* istekleri için çağırır.
// OAuth 2.0 Authorization Code + PKCE (https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
// X'in token ucu tarayıcıdan (CORS) çağrılamadığı için kod değişimi, yenileme, iptal ve gönderi burada yapılır.
// Erişim anahtarları sunucuda SAKLANMAZ; tarayıcı kendi anahtarını her istekte gönderir.
// .env: X_CLIENT_ID (zorunlu), X_CLIENT_SECRET (yalnızca "confidential client" ise),
//       X_REDIRECT_URIS (isteğe bağlı, virgülle; boşsa PUBLIC_URL / ALLOWED_ORIGINS / localhost altındaki x-callback.html kabul edilir)

const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
const MAX_WEIGHT = 280;

function cfg() {
  const strip = (s) => String(s || '').trim().replace(/\/+$/, '');
  return {
    id: String(process.env.X_CLIENT_ID || '').trim(),
    secret: String(process.env.X_CLIENT_SECRET || '').trim(),
    api: strip(process.env.X_API_BASE || 'https://api.x.com'),
    redirects: String(process.env.X_REDIRECT_URIS || '').split(',').map((s) => s.trim()).filter(Boolean),
    origins: [process.env.PUBLIC_URL, ...String(process.env.ALLOWED_ORIGINS || '').split(',')].map(strip).filter(Boolean),
  };
}

function err(status, message) { const e = new Error(message); e.status = status; return e; }

/* ---------- 280 karakter denetimi (X'in ağırlıklı sayımı, twitter-text v3'e yakın) ----------
   Bağlantılar (http/https) her zaman 23 sayılır. Latin, Yunan, Kiril, Türkçe vb. 1; CJK ve emoji 2. */
const URL_RE = /https?:\/\/[^\s]+/gi;
function weight(cp) {
  return (cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247)) ? 1 : 2;
}
function weightedLength(text) {
  let t = String(text || '').normalize('NFC');
  let n = 0;
  t = t.replace(URL_RE, () => { n += 23; return ''; });
  // Emoji dizileri (ZWJ, ten rengi, bayrak) tek emoji = 2 sayılır
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('tr', { granularity: 'grapheme' }) : null;
  const parts = seg ? Array.from(seg.segment(t), (s) => s.segment) : Array.from(t);
  for (const g of parts) {
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g)) { n += 2; continue; }
    for (const ch of g) { const cp = ch.codePointAt(0); if (cp === 0xfe0f || cp === 0x200d) continue; n += weight(cp); }
  }
  return n;
}

function redirectOk(uri, c) {
  let u; try { u = new URL(uri); } catch (_) { return false; }
  if (u.hash || u.search) return false;
  if (c.redirects.length) return c.redirects.includes(uri);
  const local = u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname);
  if (u.protocol !== 'https:' && !local) return false;
  if (!/\/x-callback\.html$/.test(u.pathname)) return false;
  return local || c.origins.includes(u.origin);
}

async function xFetch(url, opts = {}) {
  let r;
  try { r = await fetch(url, { ...opts, signal: AbortSignal.timeout(15000) }); }
  catch (e) { throw err(502, e.name === 'TimeoutError' ? 'X yanıt vermedi. Biraz sonra tekrar dene.' : 'X’e ulaşılamadı.'); }
  let j = {}; try { j = await r.json(); } catch (_) {}
  return { r, j };
}

function xError(r, j, ctx) {
  const detail = j.error_description || j.detail || j.errors?.[0]?.message || j.title || j.error || '';
  if (ctx === 'token') {
    if (j.error === 'invalid_request' || j.error === 'invalid_grant') return err(400, 'X yetkilendirme kodu geçersiz ya da süresi doldu (30 sn). Tekrar bağlan.');
    if (r.status === 401 || j.error === 'unauthorized_client' || j.error === 'invalid_client') return err(502, 'X uygulama kimliği/sırrı hatalı. Sunucudaki X_CLIENT_ID ve X_CLIENT_SECRET değerlerini kontrol et.');
    return err(502, 'X bağlantısı kurulamadı' + (detail ? ': ' + detail : '.'));
  }
  if (r.status === 401) return err(401, 'X bağlantısının süresi doldu ya da izin kaldırıldı. Bağlantılar sayfasından yeniden bağlan.');
  if (r.status === 429) return err(429, 'X istek sınırına ulaşıldı. Biraz sonra tekrar dene.');
  if (r.status === 403) {
    if (/duplicate/i.test(detail)) return err(409, 'Bu metin X’te zaten paylaşılmış. Metni biraz değiştirip tekrar dene.');
    return err(403, 'X bu gönderiye izin vermedi' + (detail ? ': ' + detail : '.') + ' (Uygulamanın yazma izni ve API paketi açık mı?)');
  }
  if (r.status === 400) return err(400, 'X isteği reddetti' + (detail ? ': ' + detail : '.'));
  return err(502, 'X hatası (' + r.status + ')' + (detail ? ': ' + detail : ''));
}

async function tokenCall(c, params) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (c.secret) headers.Authorization = 'Basic ' + Buffer.from(`${c.id}:${c.secret}`).toString('base64');
  else params.client_id = c.id;
  const { r, j } = await xFetch(c.api + '/2/oauth2/token', { method: 'POST', headers, body: new URLSearchParams(params).toString() });
  if (!r.ok || !j.access_token) throw xError(r, j, 'token');
  return { access_token: j.access_token, refresh_token: j.refresh_token || '', expires_in: Number(j.expires_in) || 7200, scope: j.scope || '' };
}

async function me(c, token) {
  const { r, j } = await xFetch(c.api + '/2/users/me?user.fields=profile_image_url', { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok || !j.data) throw xError(r, j, 'api');
  return { id: j.data.id, username: j.data.username, name: j.data.name, avatar: j.data.profile_image_url || '' };
}

const str = (v, max) => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : '');

async function handle(req, res, url, { send, readBody, limited, ip }) {
  const c = cfg();
  const p = url.pathname;
  if (p === '/api/x/config') {
    if (req.method !== 'GET') return send(res, 405, { error: 'Yalnızca GET.' });
    return send(res, 200, { enabled: Boolean(c.id), clientId: c.id, scopes: SCOPES, maxLength: MAX_WEIGHT });
  }
  const routes = ['/api/x/token', '/api/x/refresh', '/api/x/revoke', '/api/x/post', '/api/x/me'];
  if (!routes.includes(p)) return send(res, 404, { error: 'Bulunamadı.' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Yalnızca POST.' });
  if (limited(ip)) return send(res, 429, { error: 'Çok fazla istek. Bir dakika sonra tekrar dene.' });
  const b = await readBody(req, 16 * 1024);
  if (!c.id) return send(res, 503, { error: 'Sunucuda X_CLIENT_ID tanımlı değil; X bağlantısı kapalı.' });

  if (p === '/api/x/token') {
    const code = str(b.code, 2048), verifier = str(b.code_verifier, 128), redirect = str(b.redirect_uri, 512);
    if (!code || !redirect) return send(res, 400, { error: 'Eksik yetkilendirme kodu.' });
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return send(res, 400, { error: 'Geçersiz PKCE doğrulayıcısı.' });
    if (!redirectOk(redirect, c)) return send(res, 400, { error: 'Bu yönlendirme adresine izin verilmiyor.' });
    const t = await tokenCall(c, { code, grant_type: 'authorization_code', redirect_uri: redirect, code_verifier: verifier });
    const user = await me(c, t.access_token);
    console.log(`[x] bağlandı @${user.username}`);
    return send(res, 200, { ...t, user });
  }
  if (p === '/api/x/refresh') {
    const rt = str(b.refresh_token, 2048);
    if (!rt) return send(res, 400, { error: 'Yenileme anahtarı yok.' });
    try { return send(res, 200, await tokenCall(c, { refresh_token: rt, grant_type: 'refresh_token' })); }
    catch (e) { if (e.status === 400) throw err(401, 'X bağlantısının süresi doldu. Bağlantılar sayfasından yeniden bağlan.'); throw e; }
  }
  if (p === '/api/x/revoke') {
    const tok = str(b.token, 2048);
    if (!tok) return send(res, 400, { error: 'Anahtar yok.' });
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const params = { token: tok, token_type_hint: b.hint === 'refresh_token' ? 'refresh_token' : 'access_token' };
    if (c.secret) headers.Authorization = 'Basic ' + Buffer.from(`${c.id}:${c.secret}`).toString('base64'); else params.client_id = c.id;
    const { r } = await xFetch(c.api + '/2/oauth2/revoke', { method: 'POST', headers, body: new URLSearchParams(params).toString() });
    return send(res, 200, { ok: r.ok });
  }
  const token = str(b.access_token, 2048);
  if (!token) return send(res, 401, { error: 'X bağlı değil.' });
  if (p === '/api/x/me') return send(res, 200, { user: await me(c, token) });

  // /api/x/post → POST https://api.x.com/2/tweets
  const text = typeof b.text === 'string' ? b.text.trim() : '';
  if (!text) return send(res, 400, { error: 'Gönderi metni boş.' });
  const w = weightedLength(text);
  if (w > MAX_WEIGHT) return send(res, 400, { error: `X gönderisi en fazla ${MAX_WEIGHT} karakter olabilir (şu an ${w}).`, length: w });
  const body = { text };
  if (b.reply_to != null) {
    if (!/^\d{1,20}$/.test(String(b.reply_to))) return send(res, 400, { error: 'Geçersiz yanıt kimliği.' });
    body.reply = { in_reply_to_tweet_id: String(b.reply_to) };
  }
  const { r, j } = await xFetch(c.api + '/2/tweets', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok || !j.data?.id) throw xError(r, j, 'api');
  const user = str(b.username, 15).replace(/[^A-Za-z0-9_]/g, '');
  console.log(`[x] gönderi ${j.data.id}`);
  return send(res, 200, { id: j.data.id, text: j.data.text, url: user ? `https://x.com/${user}/status/${j.data.id}` : `https://x.com/i/web/status/${j.data.id}` });
}

module.exports = { handle, weightedLength, redirectOk, SCOPES, MAX_WEIGHT };
