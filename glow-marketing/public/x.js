/* Glow Marketing — X (Twitter) bağlantısı (tarayıcı tarafı).
   OAuth 2.0 PKCE: doğrulayıcı tarayıcıda üretilir, X giriş penceresi x-callback.html'e döner,
   kod sunucuya (/api/x/token) gönderilir. Anahtarlar yalnızca bu tarayıcıda (localStorage 'glowX') tutulur.
   index.html: GlowX.init({...}) çağırır, Bağlantılar'a GlowX.card() ekler, içerik modalında GlowX.publish() kullanır. */
(function(){
  'use strict';
  var KEY='glowX';
  var ctx={apiBase:function(){return '';},esc:function(t){return String(t==null?'':t);},ic:function(){return '';},toast:function(){},confirmAsk:function(){return Promise.resolve(true);},onChange:function(){}};
  var S={cfg:null,cfgErr:'',busy:''};

  function load(){ try{ var r=localStorage.getItem(KEY); return r?JSON.parse(r):null; }catch(e){ return null; } }
  function store(v){ try{ if(v) localStorage.setItem(KEY,JSON.stringify(v)); else localStorage.removeItem(KEY); }catch(e){} }
  var X=load();
  function connected(){ return !!(X&&X.accessToken&&X.user); }

  /* ---------- 280 karakter (X ağırlıklı sayım; sunucudaki x-api.js ile aynı kural) ---------- */
  var seg=(typeof Intl!=='undefined'&&Intl.Segmenter)?new Intl.Segmenter('tr',{granularity:'grapheme'}):null;
  var PICT; try{ PICT=new RegExp('\\p{Extended_Pictographic}|\\p{Regional_Indicator}','u'); }catch(e){ PICT=/[\uD83C-\uDBFF][\uDC00-\uDFFF]/; }
  function weightedLength(text){
    var n=0, t=String(text||'').normalize('NFC').replace(/https?:\/\/[^\s]+/gi,function(){ n+=23; return ''; });
    var parts=seg?Array.from(seg.segment(t),function(s){return s.segment;}):Array.from(t);
    for(var i=0;i<parts.length;i++){
      var g=parts[i];
      if(PICT.test(g)){ n+=2; continue; }
      for(var ch of g){ var cp=ch.codePointAt(0); if(cp===0xfe0f||cp===0x200d) continue; n+=(cp<=4351||(cp>=8192&&cp<=8205)||(cp>=8208&&cp<=8223)||(cp>=8242&&cp<=8247))?1:2; }
    }
    return n;
  }

  /* ---------- Sunucu çağrıları ---------- */
  async function api(path,body){
    var r;
    try{ r=await fetch(ctx.apiBase()+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}); }
    catch(e){ throw new Error('Sunucuya ulaşılamadı.'); }
    var j={}; try{ j=await r.json(); }catch(e){}
    if(!r.ok){ var er=new Error(j.error||('Sunucu hatası ('+r.status+').')); er.status=r.status; throw er; }
    return j;
  }
  async function config(force){
    if(S.cfg&&!force) return S.cfg;
    try{ S.cfg=await api('/api/x/config'); S.cfgErr=''; }
    catch(e){ S.cfg=null; S.cfgErr=e.status===404?'Sunucu X bağlantısını desteklemiyor (güncel değil).':e.message; }
    return S.cfg;
  }

  /* ---------- PKCE ---------- */
  function b64url(bytes){ var s=''; for(var i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function rand(n){ var a=new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); }
  async function challenge(v){
    if(crypto.subtle&&crypto.subtle.digest){ var h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)); return {c:b64url(new Uint8Array(h)),m:'S256'}; }
    return {c:v,m:'plain'};
  }
  function redirectUri(){ return location.origin+location.pathname.replace(/[^\/]*$/,'')+'x-callback.html'; }

  async function connect(){
    if(!/^https?:$/.test(location.protocol)) throw new Error('X girişi için uygulamanın bir web adresinden (https) açılması gerekiyor.');
    if(!window.crypto||!crypto.getRandomValues) throw new Error('Bu tarayıcı güvenli bağlantıyı desteklemiyor.');
    // Açılır pencereyi kullanıcı tıklamasıyla hemen aç (engellenmesin), adresi sonra ver.
    var w=window.open('about:blank','glowX','width=600,height=760');
    if(!w) throw new Error('X penceresi açılamadı. Açılır pencerelere izin verip tekrar dene.');
    try{
      var cfg=await config(true);
      if(!cfg) throw new Error(S.cfgErr||'Sunucuya ulaşılamadı.');
      if(!cfg.enabled) throw new Error('Sunucuda X_CLIENT_ID tanımlı değil. Yönetici .env dosyasına X uygulama kimliğini eklemeli.');
      var verifier=rand(48), state=rand(16), pk=await challenge(verifier), redirect=redirectUri();
      var q=new URLSearchParams({response_type:'code',client_id:cfg.clientId,redirect_uri:redirect,scope:(cfg.scopes||[]).join(' '),state:state,code_challenge:pk.c,code_challenge_method:pk.m});
      w.location.href='https://x.com/i/oauth2/authorize?'+q.toString();
    }catch(e){ try{ w.close(); }catch(_){} throw e; }
    var code=await new Promise(function(res,rej){
      var done=false;
      function finish(fn,v){ if(done) return; done=true; window.removeEventListener('message',onMsg); clearInterval(t); fn(v); }
      function onMsg(e){
        if(e.origin!==location.origin||!e.data||e.data.type!=='glow-x-auth') return;
        if(e.data.state!==state) return finish(rej,new Error('Güvenlik doğrulaması başarısız. Tekrar dene.'));
        if(e.data.error) return finish(rej,new Error(e.data.error==='access_denied'?'X izni verilmedi.':'X girişi tamamlanamadı: '+(e.data.error_description||e.data.error)));
        if(!e.data.code) return finish(rej,new Error('X’ten yetkilendirme kodu alınamadı.'));
        finish(res,e.data.code);
      }
      window.addEventListener('message',onMsg);
      var t=setInterval(function(){ if(w.closed) setTimeout(function(){ finish(rej,new Error('X penceresi kapatıldı.')); },600); },700);
    });
    var j=await api('/api/x/token',{code:code,code_verifier:verifier,redirect_uri:redirect});
    X={accessToken:j.access_token,refreshToken:j.refresh_token||'',expiresAt:Date.now()+(j.expires_in||7200)*1000,scope:j.scope||'',user:j.user,bagTarih:new Date().toISOString()};
    store(X);
    return X.user;
  }

  async function refresh(){
    if(!X||!X.refreshToken){ markExpired(); throw expiredErr(); }
    try{
      var j=await api('/api/x/refresh',{refresh_token:X.refreshToken});
      X.accessToken=j.access_token; if(j.refresh_token) X.refreshToken=j.refresh_token;
      X.expiresAt=Date.now()+(j.expires_in||7200)*1000; delete X.hata; store(X);
    }catch(e){ if(e.status===401){ markExpired(); throw expiredErr(); } throw e; }
  }
  function expiredErr(){ var e=new Error('X bağlantısının süresi doldu. Bağlantılar sayfasından yeniden bağlan.'); e.status=401; return e; }
  function markExpired(){ if(X){ X.hata='token'; store(X); ctx.onChange(); } }
  async function fresh(){ if(!connected()) throw new Error('X hesabı bağlı değil.'); if(!X.expiresAt||X.expiresAt-60000<Date.now()) await refresh(); }

  async function postText(text){
    await fresh();
    var body={access_token:X.accessToken,text:text,username:X.user.username};
    try{ return await api('/api/x/post',body); }
    catch(e){
      if(e.status!==401) throw e;
      await refresh(); body.access_token=X.accessToken;
      return await api('/api/x/post',body);
    }
  }

  async function disconnect(){
    var old=X; X=null; store(null);
    if(old){ try{ await api('/api/x/revoke',{token:old.refreshToken||old.accessToken,hint:old.refreshToken?'refresh_token':'access_token'}); }catch(e){} }
  }

  /* ---------- Arayüz ---------- */
  function rerender(){ var el=document.getElementById('xConnCard'); if(el) el.outerHTML=card(); ctx.onChange(); }
  function card(){
    var esc=ctx.esc, on=connected(), exp=on&&X.hata==='token', b;
    if(on){
      b='<div class="conn-loc"><strong>@'+esc(X.user.username)+'</strong><span>'+esc(X.user.name||'')+'</span></div>'+
        (exp?'<p class="warn-line">Bağlantının süresi dolmuş. Yeniden bağlan.</p>':'')+
        '<p class="hint">“X” platformundaki içeriklerini içerik penceresinden tek tıkla paylaşırsın. Gönderiler en fazla 280 karakter (bağlantılar 23, emoji 2 sayılır).</p>'+
        '<div class="actions">'+(exp?'<button class="btn btn-primary btn-sm" data-xaction="connect">Yeniden bağlan</button>':'')+
        '<button class="btn btn-quiet btn-sm" data-xaction="disconnect" style="color:var(--bad)">Bağlantıyı kes</button></div>';
    }else{
      var off=S.cfg&&!S.cfg.enabled;
      b='<p class="muted" style="font-size:14px">Bağladığında “X” platformundaki içeriklerini doğrudan X hesabında paylaşırsın.</p>'+
        (off?'<p class="warn-line">Sunucuda X uygulama kimliği (X_CLIENT_ID) tanımlı değil. Yönetici kurulumu aşağıda.</p>':'')+
        (S.cfgErr?'<p class="warn-line">'+esc(S.cfgErr)+'</p>':'')+
        '<div><button class="btn btn-primary'+(S.busy==='connect'?' loading':'')+'" data-xaction="connect"><span style="font-weight:800">𝕏</span>X ile bağlan</button></div>'+
        '<p class="hint">Yalnızca gönderi paylaşma ve hesap adını okuma izni istenir; özel mesajlarına erişilmez.</p>'+
        (off||S.cfgErr?'<details class="hint" style="margin-top:4px"><summary style="cursor:pointer;font-weight:700">X kurulumu (yönetici, bir kerelik)</summary><ol class="steps" style="margin-top:8px">'+
          '<li><span><a href="https://developer.x.com/en/portal/dashboard" target="_blank" rel="noopener" style="color:var(--accent-ink);font-weight:700">X Developer Portal</a>’da bir uygulama oluştur; <b>User authentication settings</b>’te OAuth 2.0’ı aç, izin: <b>Read and write</b>, tür: <b>Web App (confidential client)</b>.</span></li>'+
          '<li><span><b>Callback URI</b> olarak şunu ekle: <code>'+esc(/^https?:$/.test(location.protocol)?redirectUri():'https://alanadin.com/x-callback.html')+'</code></span></li>'+
          '<li><span>Sunucunun <code>.env</code> dosyasına <code>X_CLIENT_ID</code> ve <code>X_CLIENT_SECRET</code> yaz, sunucuyu yeniden başlat.</span></li>'+
          '<li><span>Gönderi paylaşmak için X API’de yazma hakkı olan bir paket (kredi/abonelik) gerekir.</span></li></ol></details>':'');
    }
    return '<div class="card conn-card" id="xConnCard">'+
      '<div class="conn-head"><div class="conn-logo x" style="background:var(--xx-soft);color:var(--xx)">𝕏</div><div><h3>X (Twitter)</h3><p>Gönderi paylaşma</p></div>'+
      '<span class="conn-status '+(on&&!exp?'on':'off')+'"><i class="ai-dot"></i>'+(on?(exp?'Yeniden bağlan':'Bağlı'):'Bağlı değil')+'</span></div>'+b+'</div>';
  }

  document.addEventListener('click',async function(e){
    var el=e.target.closest&&e.target.closest('[data-xaction]'); if(!el||S.busy) return;
    var a=el.dataset.xaction;
    if(a==='connect'){
      S.busy='connect'; el.classList.add('loading');
      try{ var u=await connect(); ctx.toast('X bağlandı: @'+u.username); }
      catch(err){ ctx.toast(err.message,true); }
      finally{ S.busy=''; rerender(); }
    }else if(a==='disconnect'){
      if(!await ctx.confirmAsk({title:'X bağlantısı kesilsin mi?',text:'Bu tarayıcıdaki X anahtarı silinir ve X’teki izin iptal edilir. Paylaşılmış gönderiler silinmez.',ok:'Bağlantıyı kes',danger:true})) return;
      S.busy='disconnect';
      try{ await disconnect(); ctx.toast('X bağlantısı kesildi.'); } finally{ S.busy=''; rerender(); }
    }
  });

  window.GlowX={
    init:function(o){ for(var k in o) if(o[k]) ctx[k]=o[k]; if(!connected()) config().then(function(){ var el=document.getElementById('xConnCard'); if(el) el.outerHTML=card(); }); },
    connected:function(){ return connected()&&X.hata!=='token'; },
    expired:function(){ return connected()&&X.hata==='token'; },
    username:function(){ return connected()?X.user.username:''; },
    card:card,
    weightedLength:weightedLength,
    MAX:280,
    publish:postText
  };
})();
