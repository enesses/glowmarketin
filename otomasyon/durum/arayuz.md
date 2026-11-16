# Durum — arayuz

## 16 Kasım (2. gün)
1. dalga tamamlandı (07:30–07:40 İstanbul). Dal: `ajan/arayuz`. Her commit'te `node otomasyon/smoke-test.mjs` geçti.
Doğrulama: Playwright ile kaydedilmemiş değişiklik akışı (Vazgeç / Kaydetmeden çık / kaydettikten sonra / boş SSS satırı / sayfa yenileme `beforeunload`), CONFIG.sirket boş-kısmi-dolu üç senaryo, 320 px koyu + 1280 px açık temada tüm bölümler: JS hatası ve yatay taşma yok.

### Yapılanlar
- **Kaydedilmemiş değişiklik uyarısı** (İşletme bilgileri): form yüklenince anlık görüntü alınır (`isletmeSnap`), `isletmeDegisti()` karşılaştırır. Başka sayfaya geçerken `go()` onay sorar ("Kaydetmeden çık" / "Vazgeç" → kaydet düğmesine odak). Sekme kapatma/yenilemede `beforeunload` tarayıcı uyarısı. Boş eklenen SSS satırı ve baştaki/sondaki boşluklar değişiklik sayılmaz.
- **Azaltılmış hareket**: `scrollBeh()` eklendi; `go()`, video "tekrar" ve form hata kaydırmaları `prefers-reduced-motion: reduce` iken anında kayar.
- **Üretim sayacı**: Paket sayfasındaki "Üretilen taslak" → "Yapay zekâ üretimi" (alt satır: "Taslak, plan, yanıt ve video · toplam"); her başarılı yapay zekâ işlemi 1 sayılır. Video üretilemeyip kredi iade edilince sayaç da 1 geri alınır.
- **Yasal bilgiler tek yerden**: `CONFIG.sirket = {unvan, adres, mersis, vergi, kvkkEposta, kep, destekEposta, telefon, barindirma, odemeKurulusu}` (ya da `window.GLOW_CONFIG.sirket`). Dolu alan metindeki tüm `<mark class="ph">[…]</mark>` yer tutucularına yazılır (e-postalar `mailto:` bağlantısı olur); boş alan sarı yer tutucu olarak kalır. Eksik varsa Paket sayfasında "Yönetici notu · Yasal bilgiler eksik: …" kutusu ve konsolda uyarı çıkar. Değer uydurulmadı; hepsi boş.
- Yeni test: `otomasyon/testler/arayuz-sirket.mjs` (her yer tutucunun CONFIG.sirket ile eşlendiğini ve uyarı kodunun yerinde olduğunu denetler).

### Kalanlar
- Bugünkü 4 görevin hepsi bitti.
- (İsteğe bağlı) Kaydedilmemiş değişiklik onayında üçüncü seçenek "Kaydet ve çık" (şu an `confirmAsk` iki düğmeli).
- (İsteğe bağlı) Yönetici notu tüm kullanıcılara görünüyor; ileride bir yönetici rolü olursa yalnızca ona gösterilebilir.

### Kararlar
- Yer tutucular HTML'de etiketlenmedi; JS metinden (`[ŞİRKET UNVANI]` vb.) tanıyıp değiştiriyor. Böylece yasal metin HTML'ine dokunulmadı (meta-ads ajanının Gizlilik 5./6. bölüm düzenlemesiyle çakışma riski yok) ve diğer ajanların ekleyeceği aynı yer tutucular da otomatik dolar.
- Ek yer tutucular (`[DESTEK E-POSTASI]`, `[TELEFON]`, `[BARINDIRMA SAĞLAYICISI]`, `[ÖDEME KURULUŞU]`) de CONFIG.sirket'e alındı — metinde zaten vardılar.
- "Ayarlar" sayfası yok; eksik bilgi notu Paket sayfasına kondu (gizlenmez, yayın öncesi hatırlatma olarak; bilgiler doldurulunca kendiliğinden kaybolur).
- Sayaç alanının depolama adı (`toplamTaslak`) eski verilerle uyum için değiştirilmedi; yalnızca etiketi değişti.
- `go(id, zorla)`: `showApp()` ve onaydan sonraki geçiş `zorla=true` ile uyarıyı atlar; kurulum ekranına dönüşte (`showSetup`) anlık görüntü sıfırlanır (sıfırlama sonrası yanlış uyarı çıkmaz).
- Birleştirme notu: değişen bölgeler — `CONFIG` sonrası yeni `CONFIG.sirket` bloğu, `go()` başı, `loadIsletmeForm` çevresi, `renderPaket` sonu, `showSetup`/`showApp`, Paket bölümü HTML'i (`yasalEksikNot`, sayaç etiketi), CSS `.note-warn`, video iade satırları.

### Kullanıcının yapması gerekenler
- `glow-marketing/public/index.html` başındaki `CONFIG.sirket` alanlarını gerçek resmî bilgilerle doldur (unvan, adres, MERSİS, vergi dairesi/no, KVKK e-postası, KEP, destek e-postası, telefon, barındırma sağlayıcısı, ödeme kuruluşu). Tek yerden tüm yasal metinlere yansır; "yasal bilgiler eksik" notu o zaman kaybolur.
- Önceki listedeki diğer maddeler (CONFIG `googleClientId`/`metaAppId`, `.env` anahtarları, Google/Meta başvuruları) aşağıdaki 15 Kasım kaydında geçerli.

---
# 15 Kasım (1. gün) kaydı

1. dalga tamamlandı (15 Kasım 2026, 15:00–15:15 İstanbul). Dal: `ajan/arayuz`. Tüm commit'lerde `node otomasyon/smoke-test.mjs` geçti.
Doğrulama: Playwright ile 1280 / 360 / 320 px, açık ve koyu tema; tüm sayfalar, pencereler, bozuk localStorage, iki sekme, gece yarısı geçişi, sahte AI sunucusu senaryoları hatasız.

## Yapılanlar
- localStorage sağlamlığı: `sanitize()` eklendi; bozuk/eski veri (yanlış tür diziler, metin kredi, geçersiz paket, sayısal işletme adı, SSS metin vb.) artık uygulamayı çökertmiyor. Test: `otomasyon/testler/arayuz-depolama.mjs`.

- Mobil (360 px) yatay taşma giderildi: tek sütun düzenlerde `1fr` → `minmax(0,1fr)` (İşletme formu, Yorumlar).
- Türkçe ek hatası: paket düğmeleri "Go’e/Plus’e geç" → "Go’ya/Plus’a/Max’e geç". Mobilde yanlış yönlendiren "Soldan …" ifadeleri düzeltildi.
- Erişilebilirlik: pencerelerde odak tuzağı (Tab döngüsü), kapanınca odağı açan düğmeye geri verme; onay penceresinde Escape = Vazgeç (önceden alttaki pencereyi kapatıyordu); onayda odak Vazgeç/onay kutusuna gider; bildirim (toast) `role=status aria-live`; seçim düğmelerinde `aria-pressed`.
- Kredi güvenliği: `runAgent` önce sonucu uygular, sonra krediyi düşer; yapay zekâdan boş/bozuk yanıt gelirse kredi gitmez ("Kredi düşülmedi" mesajı artık doğru).
- localStorage yazılamazsa (kota/gizli sekme) kullanıcı bir kez uyarılır; çoklu sekme: `storage` olayıyla diğer sekmedeki değişiklik alınır (eski sekme yeni veriyi ezmez).
- Hata bildirimleri metin uzunluğuna göre daha uzun ekranda kalır (en az 4 sn).
- SSS satırlarındaki alanlara erişilebilir ad (aria-label) eklendi; Paket sayfasındaki kredi açıklaması gerçek maliyetlerle düzeltildi (haftalık plan 3, video 20–50).
- 320 px genişlikte Bağlantılar ve AI video sayfalarındaki taşma giderildi; 1280/360/320 px ve tüm pencereler Playwright ile tarandı, taşma kalmadı.
- Formlar Enter ile gönderilebiliyor (kaydet düğmeleri `type=submit`, çift tetikleme yok). `prefers-reduced-motion` desteği. Soluk metin rengi (`--ink-3`) WCAG AA kontrastına çekildi (açık #776C63, koyu #978C82).
- Gece yarısını geçen açık sayfada "bugün" vurgusu ve gün seçenekleri dakikada bir / sekmeye dönünce yenilenir. Aynı anda ikinci onay penceresi açılması engellendi (ilk onayın sözü askıda kalıyordu).
- AI video tanıtım metni sektöre göre (Restoranın / Salonun / Mağazan / İşletmen; "tabağının" yalnızca restoranda). Koyu tema ekran görüntüleriyle kontrol edildi.
- "Daha" menüsünden Çerez tercihleri açılınca menü kapanır, odak çerez penceresine gider (odak tuzağıyla çakışma önlendi). AI yolları (taslak, haftalık plan, müşteri yanıtı, bozuk yanıt) sahte sunucuyla denendi: boş yanıtta kredi düşmüyor.

## Kalanlar
- (İsteğe bağlı) İşletme bilgileri formunda kaydedilmemiş değişiklik varken sayfadan çıkınca uyarı.
- (İsteğe bağlı) `go()` içindeki `scrollTo({behavior:'smooth'})` azaltılmış hareket tercihinde de yumuşak kayıyor; JS tarafında da `matchMedia` kontrolü eklenebilir.
- (İsteğe bağlı) Haftalık plan / taslak için `spend()` `toplamTaslak` sayacını kredi tutarından bağımsız 1 artırıyor; "Üretilen taslak" etiketi buna göre adlandırılabilir.
- Birleştirme notu: X ve Meta Ads ajanları da `public/index.html` dosyasına dokunuyor. Bu dalın değiştirdiği bölgeler: depolama (`sanitize`, `save`), Modal bölümü (`openModal`/`closeModal`/klavye), `confirmAsk`, `runAgent`, `toast`, gün sabitleri (`TODAY`), sonda `storage` dinleyicisi, birkaç CSS satırı (mobil `minmax(0,1fr)`, `--ink-3`). Çakışma olursa iki tarafı da korumak yeterli; mantıkça çakışan değişiklik yok.

## Kararlar
- Bozuk veri silinmez, onarılır: yanlış türdeki alan varsayılana döner, işletme adı boşsa kurulum ekranı açılır.
- Kredi yalnızca sonuç başarıyla ekrana uygulandıktan sonra düşer (önce `apply`, sonra `spend`).
- Çoklu sekmede son yazan kazanır; diğer sekme `storage` olayıyla güncellenir, açık pencere varken yalnızca üst bilgi yenilenir (kullanıcının yazdığı silinmesin).
- `.post` kartına `role=button` eklenmedi (içinde Sil düğmesi var; iç içe etkileşimli öğe erişilebilirlik hatası olurdu).
- Kontrast için `--ink-3` koyulaştırıldı; tasarım dili korunarak AA seviyesine çekildi.
- Ek test: `otomasyon/testler/arayuz-depolama.mjs` (bağımlılıksız; index.html'den `sanitize`'ı çıkarıp bozuk girdilerle dener).

## Kullanıcının yapması gerekenler
- (16 Kasım'dan beri) Yasal yer tutucular `CONFIG.sirket` içinden tek yerden doldurulur.
- `public/index.html` içindeki `CONFIG` (ya da `window.GLOW_CONFIG`): `googleClientId` ve `metaAppId` yayında buraya yazılırsa müşteriler bu alanları görmez.
- Sunucu `.env`: `DEEPSEEK_API_KEY` (yapay zekâ), video için `FAL_KEY` veya `OPENROUTER_API_KEY` + internetten erişilebilir `PUBLIC_URL` (görsel/video yükleme için de gerekli).
- Google Cloud: Business Profile API erişim başvurusu, üç API'nin etkinleştirilmesi, "Yetkili JavaScript kaynakları"na site adresi.
- Meta for Developers: İşletme türü uygulama, OAuth yönlendirme URI'si (site adresi), App Review'da izinler, işletme doğrulaması. X ve Meta Ads ayarları kendi ajanlarının durum dosyalarında.
