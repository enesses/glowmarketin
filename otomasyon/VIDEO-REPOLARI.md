# Claude ile video üretimi — repo rehberi (Glow ekibi)

Kaynak video: "Claude ile Video Editlemek İçin En İyi GitHub Repoları" (YouTube, VXe-Bkku-rM).
Videodaki ana fikir: **tek bir repoyu birebir kurmak videoyu güzelleştirmez, herkes aynı videoyu yapar.**
Motor olarak HyperFrames kullan, üstüne Glow'un kendi fontlarını, renklerini, kurallarını ve kontrollerini koy;
diğer repolardan yalnızca işe yarayan parçaları al.

Skill'ler `.claude/skills/` altında (53 klasör). Her birinde `LICENSE` ve `KAYNAK.md` var.
Boyut için `examples/`, `assets/` ve büyük demo görselleri çıkarıldı; gerekirse kaynak repodan alın.

## Repo repo: ne yapıyor, videoda ne alındı, buradaki skill

| Repo | Ne yapıyor | Videoda alınan parça | Buradaki skill(ler) | Lisans |
|---|---|---|---|---|
| [latent-spaces/brag](https://github.com/latent-spaces/brag) | Proje klasöründe `/brag`: kodu okur, sahne planı yazar, müzikli kısa lansman videosu + kapak karesi + paylaşım metni üretir. Hazır ton, müzik, 260 ses efekti. | **İlk kare ölçümü**: ilk kare düz/siyahsa uyarı verir. Akışın kendisi alınmadı. | `brag`, `brag-slim` (brag'in müzik/ses `assets/` klasörü çıkarıldı) | MIT |
| [tuzhechen2005/opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills) | Videoyu anlatırsın; skill seçer, iskelet kurar, storyboard gösterir, sahneleri kurar, MP4 verir. Suluboya çizim, kodla müzik. | **Kinetik yazı sahnesi** (Reels için). Hareket yapısı alındı; font/renk değiştirilmedi. | `kinetic-reel`, `painted-animation` | MIT |
| [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics) | Tek iş yapan 6 ücretsiz skill; soru sorar, plan onaylatır, zamanlanmış grafik klibi üretir. | **Kinetik yazının ritmi** + **riskli 5 zaman damgası**: ajan sesi duyamadığı için ses grafiğine bakıp en riskli sahneleri insana dinletir. | `explainer-default`, `explainer-engaging`, `explainer-high-energy`, `motion-broll`, `object-separation`, `sound-effects` | MIT |
| [echris6/motion-video-kit](https://github.com/echris6/motion-video-kit) | İşletmeler için lansman tarzı kısa film. Brief (işletme, alıcı, ana eylem, kanıtlanabilir gerçekler) → storyboard → üretim → **ayrı eleştirmen ajan** incelemesi. 12 referans dosyası. | **Ayrı modelle inceleme** mantığı — ama ölçülü: aşırı tur 7 dk'lık videoyu 21 dk yapıyor, çok token yiyor. | `business-motion-film` | MIT |
| [AbubakrChan/product-launch-motion](https://github.com/AbubakrChan/product-launch-motion) | Site adresinden tanıtım filmi; renk/müzik sorar, render öncesi her sahneden kare çıkarıp bakar. | **Tek öğeyi kesmeden dönüştürme** (sahne devamlılığı). | `product-launch-motion` | MIT |
| [howseen-ai/claude-motion-design](https://github.com/howseen-ai/claude-motion-design) | Önce müziğin vuruş haritasını çıkarır, sahneleri sese oturtur. "Remake" modu: başka videoyu kare kare kendi markana uyarlar. | Hareket bulanıklığı fikri ilginç ama **alınmadı** — HyperFrames'in kendi bulanıklığı daha düzgün ve hızlı. | `motion-design` | MIT |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 99 film stili, her birinin kodla demo filmi; stil + konu yaz, sorular → 3 rehber → plan → üretim. | Henüz alınmadı, "daha detaylı inceleyeceğim". | **Kopyalanmadı** | Belgeler CC BY-NC 4.0 (ticari değil) |
| [feitangyuan/onetake](https://github.com/feitangyuan/onetake) | Kesmesiz ürün tanıtımı: her sahne öncekinin içinden çıkar; 3 konsept → akış planı. "Slayt gibi" görünümü çözüyor. | Ticari lisans gerektiği için gösterilmedi/alınmadı. | **Kopyalanmadı** | PolyForm Noncommercial — Glow'da ticari kullanım için lisans gerekir |
| [nateherkai/herk-edit-kit](https://github.com/nateherkai/herk-edit-kit) | HyperFrames üstünde kurgu kiti: kelime kelime transkript, sessizlikleri kısaltır, konuşma hatalarını önerir, onayla keser, grafik ekler. | Videocunun kendi motoruna en çok benzeyen; "inceleyin". | `cut-silences`, `cut-mistakes`, `edit-video`, `make-a-video`, `short-form-edit`, `short-form-video`, `video-storytelling`, `style-library`, `hyperframes-video-beats`, `motion-showreel`, `website-to-hyperframes`, `gsap` | MIT |
| [JuneYaooo/rea-video](https://github.com/JuneYaooo/rea-video) | Videoyu tersine mühendislikle çözer: sahnelere böler, ses/konuşma/efekti ayırır, ölçer, yeniden üretme planı çıkarır. | Fikir ilginç; **video gören bir model (ör. Gemini) eklenmezse** hata yapabiliyor (kodla yapılmış sahneye "3D render" dedi). | `rea-video` | Apache-2.0 |
| [veedstudio/open-edit](https://github.com/veedstudio/open-edit) | İsteği söylersin, MP4 verir; transkriptte kelime kelime zamanlama zorunlu. | **Ekrandaki rakamı doğrulatma**: videoda geçen sayıyı ajan doğrulamak zorunda (hatalı veriyi azaltır). | `open-edit` | Apache-2.0 |
| [tugrawork-creator/saas-motion-kit](https://github.com/tugrawork-creator/saas-motion-kit) | Yazılım ürünleri için film, HyperFrames üzerinde. | **Aynı geçiş arka arkaya tekrar ediyor mu** kontrolü. | `saas-motion-video` | MIT |
| [heygen-com/hyperframes-community-skills](https://github.com/heygen-com/hyperframes-community-skills) | HyperFrames için topluluk skill'leri (ör. Vox tarzı `vox-explainer`). | Başka kanalın tarzını kopyalamadığı için az kullanıyor. | `vox-explainer`, `duo`, `day-in-my-life`, `session-story`, `p5-paint-animation`, `prod-by-claude`, `camera-3d-captions`, `x-posting-license` | Apache-2.0 |
| [shadcn-labs/snapcn](https://github.com/shadcn-labs/snapcn) | Remotion için 60+ ücretsiz hazır animasyon/geçiş/sahne bileşeni (ürün demosu). | Remotion kullananlar için. | `snapcn`, `remotion-launch-video`, `remotion-product-demo`, `remotion-kinetic-typography`, `remotion-motion-graphics`, `remotion-explainer-video`, `remotion-logo-animation` | MIT |
| [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) | Ajana yerel FFmpeg ile video editörü verir: süre/FPS/çözünürlük/ses ölçer, plan yapar; 42 araç; Reels/Shorts/TikTok/YouTube şablonları + kontroller. | Ajana video editörü vermek. | `ffmpeg-skill` | MIT |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | **Motorun kendisi**: model HTML yazar, HTML → MP4 render. Hazır skill, bileşen, kütüphane. | **Her şeyin üstüne kurulduğu motor** (videonun kurgusu da bununla yapıldı). | `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`, `slideshow`, `style-sampling`, `reverse-any-video`, `remotion-to-hyperframes`, `figma` | Apache-2.0 |

## Glow için önerilen kullanım
1. **Motor:** `hyperframes` (+ `hyperframes-cli`). Glow'un font, renk ve marka kurallarını bunun üstüne yaz.
2. **Videodan alınan kontroller** (Glow'un kendi akışına eklenecek parçalar):
   - İlk kare düz/siyah mı? (brag)
   - Riskli 5 sahne zaman damgası → insan dinler (Barty-Bart)
   - Ayrı bir modelle tek tur eleştiri (motion-video-kit) — tur sayısını sınırla
   - Ekranda geçen rakamı doğrula (open-edit)
   - Aynı geçiş arka arkaya tekrar etmesin (saas-motion-kit)
   - Kesmeden dönüşen öğelerle devamlılık (product-launch-motion)
3. **İşletme tanıtımı / Reels:** `business-motion-film`, `product-launch-motion`, `kinetic-reel`, `short-form-edit`.
4. **Kurgu (konuşmalı video):** `cut-silences`, `cut-mistakes`, `ffmpeg-skill`.
5. **Ticari olmayan lisanslar:** onetake ve lemo-opuscar Glow'da (ticari ürün) lisans almadan kullanılmaz.
