# KD-MD-BETA — Kadın Hastalıkları ve Doğum saha haftası kontrol listesi

**Amaç:** Kadın Hastalıkları ve Doğum chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir KD uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir. Bu belge o haftanın kontrol listesidir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Canlı e-Nabız / e-Doğum HTTP yazımı, IVF laboratuvarı, ameliyathane HIS ve FMF/Astraia aneuploidi risk hesabı kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz; ekran görüntüsü kimliksizleştirilmeden alınmaz. Klinik karar her zaman hekimindir: tanı, sezaryen endikasyonu, doz, Anti-D uygulama kararı ve SGK e-imza Notya'nın işi değildir.

**İsim:** Hekim hesabı `users.specialty = 'kadin-dogum'` veya `'kadin-hastaliklari-dogum'` / "Kadın Hastalıkları ve Doğum" — ikisi aynı branştır. UI'da asla ham slug veya "Kadın Doğum" kısaltması gösterilmez.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı KD specialty → Araçlar'da **5** KD kartı (Gebelik takvimi · Doğum/analık raporu · MEC · Obstetrik risk · Kohort); Hedef Boy / Göz / Derm / Dahiliye / Psik tile'ları **yok**.
- [ ] `npm run test:kd` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Kadın Sağlığı & Gebelik, sticky şerit, Araçlar › Kohort, Sağlığım › Gebeliğim.

## Gün 1 — gebelik omurgası

- [ ] SAT → gebelik haftası / TDT sunucuda mı hesaplanıyor? Hekim elle "uydurma hafta" yazmıyor değil mi?
- [ ] Çift takvim: DÖBYR asgari ile ACOG önerisi ayrı sütunlarda; conflict satırı birleştirilmiyor mu?
- [ ] Tarama pencereleri (NT / ayrıntılı USG / OGTT / Anti-D / GBS) şeritte ve Araçlar › Gebelik takviminde doğru mu?

## Gün 2 — tehlike / intake / portal

- [ ] Intake kırmızı bayrak kutuları (`acilBelirtilerKd`) → 112 / doğumhane yardım metni. Form acil başvurunun yerine geçmiyor dili yeterli mi?
- [ ] Sağlığım › Gebeliğim: hafta/TDT/takvim — tanı/yorum yok; tehlike alt notu var mı?
- [ ] Jine hatırlatmaları (Pap/HPV/RİA) yalnız KD (veya KD kaydı olan baseline) hastada mı?

## Gün 3 — jinekoloji ofis

- [ ] CYBH ön tanı + tedavi taslağı: tanı kilidi hekimde mi?
- [ ] Araçlar › MEC: yöntem başına WHO 1–4; doz / reçete yazılmıyor değil mi?
- [ ] Menoraji / AUB basamağı poliklinik dilinde doğru mu?

## Gün 4 — doğum / lohusa / bebek + kohort

- [ ] Doğum spine → taburcu paketi → lohusa izlem; canlı doğumda bebek kartı açılıyor mu?
- [ ] Araçlar › Doğum/analık raporu: TDT → istirahat tarihleri; T.C. yazılmıyor; Medula canlı yok — kabul?
- [ ] Kohort: lohusa 1./6. hafta · kapanan pencere · geciken izlem → 1-tap hatırlatma (klinik bilgi sızmıyor mu?)

## Gün 5 — USG / SOAP / branş sızıntısı

- [ ] USG galeri + asistan taslağı: uzman onayı olmadan kilitlenmiyor; "ölçüm/tarama desteği, tanı değildir".
- [ ] SOAP prompts: kaynak kilidi, SAT payload'da, pediatrik Baş Çevresi / Neyzi yok.
- [ ] Yetişkin hastada "veli" dili yok; 18 yaş altı hastada veli dili yaşa göre açılıyor.
- [ ] Kardiyoloji / göz / dahiliye hesabında KD Araçları ve Hedef Boy karışık görünmüyor.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim "ürün poliklinikte işime yarıyor" onayı.
- [ ] DÖBYR / ACOG conflict dili ve Anti-D / tarama pencereleri uzman teyidi (`specialistReview`).
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/kd-exceptional-audit.html`, `lib/specialties/kadin-dogum.ts`, `specialties/kadin-dogum/`, `public/kd-jine-presprint-audit.html` / `kd-jine-post-sprint-audit.html`.
