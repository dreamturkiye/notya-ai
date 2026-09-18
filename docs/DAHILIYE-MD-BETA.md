# DAHILIYE-MD-BETA — iç hastalıkları saha haftası kontrol listesi

**Amaç:** Dahiliye (İç Hastalıkları) chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik smoke yeşil. `uzman-dogrulandi` için **gerçek bir internistin 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir. Bu belge o haftanın kontrol listesidir.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz; ekran görüntüsü kimliksizleştirilmeden alınmaz. Klinik karar her zaman hekimindir: tanı, evre, SCORE2 kova kilidi, doz, SGK e-imza Notya'nın işi değildir.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'dahiliye'` → Araçlar'da 6 dahiliye kartı (Kohort · SCORE2 · CKD · SGK · Polifarmasi · CHA₂DS₂/HAS-BLED); Hedef Boy / Göz / Derm / KD tile'ları yok.
- [ ] Sentetik: `npx tsx scripts/dahiliye-smoke.mts` ve `npx tsx scripts/dahiliye-prompts-smoke.mts`.
- [ ] `npm run test:dahiliye` (veya `npx tsx --test specialties/dahiliye/tests/*.test.ts lib/portal/takibim.test.ts`) ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: Dahiliye sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Takibim + Ön anket.

## Gün 1 — HT / DM / lipid omurgası

- [ ] Ofis KB → evre taslak → hekim kilidi. Hedef KB hasta yüzünde (Takibim) tanı dili olmadan görünüyor mu?
- [ ] HbA1c onaylı lab → DM döngü + göz sevk ipucu. Asistan doz yazmıyor mu?
- [ ] LDL hedefi + statin yoğunluk açığı: kova kilidi olmadan nota yazılmıyor mu?

## Gün 2 — SCORE2 / CKD / lab köprüsü

- [ ] Araçlar › SCORE2: 40–69 yaş örnek; kova TASLAK etiketi doğru mu?
- [ ] Araçlar › KDIGO: eGFR × UACR; nefro sevk paketi kopyalanabilir mi?
- [ ] Belgeler › lab onay → şerit çipleri aynı vizitte mi düşüyor?

## Gün 3 — SGK / antikoagülan / polifarmasi

- [ ] Araçlar › SGK ilaç raporu: HT/DM/statin/DOAK taslak; T.C. yazılmıyor; Medula canlı yok — kabul?
- [ ] Araçlar › CHA₂DS₂-VASc worksheet + HAS-BLED **kontrol listesi** (skor iddiası yok) — dil doğru mu?
- [ ] Araçlar › Polifarmasi ≥65: engelleyici öneride override gerekçesi zorunlu mu?

## Gün 4 — kohort + portal

- [ ] Kohort: HbA1c>9 / KB dışı / eGFR<45 / gecikmiş görev → 1-tap hatırlatma.
- [ ] Sağlığım › Takibim: hatırlatma başlıkları hasta-güvenli mi (tanı/ICD yok)?
- [ ] Ön anket: ev KB/glukoz → dahiliye_ev_kayitlari; alarmda 112 metni.

## Gün 5 — intake acil + SOAP

- [ ] Intake kırmızı bayrak kutuları (göğüs / nefes / nöro / bayılma / kanama / hipo) → 112 yardımı.
- [ ] SOAP prompts lock: doz kilidi, branş sızması yok.
- [ ] Hiçbir yerde uydurulmuş doz / kesin SCORE2 kovası / Medula e-imza iddiası yok.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim “ürün poliklinikte işime yarıyor” onayı.
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `docs/DAHILIYE-BETA-REHBERI.md` (ilk oturum), `public/dahiliye-exceptional-audit.html`.
