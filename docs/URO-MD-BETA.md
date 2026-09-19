# URO-MD-BETA — üroloji saha haftası kontrol listesi

**Amaç:** Üroloji chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir üroloji uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Ameliyathane planlaması, cerrahi HIS ve canlı Medula e-imza kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz. Klinik karar her zaman hekimindir: tanı, ilaç, doz, "risk kapandı" kararı Notya'nın işi değildir. IPSS/PSA bantları karar desteğidir — BPH / prostat kanseri tanısı yazılmaz.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'uroloji'` → Araçlar'da 4 üroloji kartı (IPSS · PSA · Acil · Kohort); Hedef Boy / KBB / Göz tile'ları **yok**.
- [ ] Migration 060 uygulandı: `hasta_uro`, `uro_ipss`, `uro_psa`, `uro_gorevleri`, `uro_risk` + RLS.
- [ ] `npm run test:uro` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Üroloji sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Ürolojimm.

## Gün 1 — IPSS omurgası

- [ ] 7 madde 0–5: eksik madde bırakınca toplam yorumlanmıyor mu?
- [ ] Şiddet bandı "KARAR DESTEĞİ" — hiçbir yerde "BPH tanısı" yazmıyor değil mi?
- [ ] QoL 0–6 ayrı tutuluyor mu?

## Gün 2 — PSA izlem

- [ ] PSA ng/mL + hız (2+ nokta): kanser tanısı yazılmıyor mu?
- [ ] Kısa aralıkta hız notu dikkat dili taşıyor mu?
- [ ] Portal'da PSA sayı / IPSS skor görünmüyor mu?

## Gün 3 — kırmızı bayrak

- [ ] Intake acil kutuları → 112 yardım metni.
- [ ] Hematuri / retansiyon / flank+ateş / torsiyon / priapizm / travma yakalanıyor mu?
- [ ] Açık "hemen" bayrağı varken hekim onayı olmadan risk kaydı yazılmıyor (409) — kabul?

## Gün 4 — kohort

- [ ] Geciken kontrol / PSA / yüksek IPSS / açık bayrak → 1-tap hatırlatma.
- [ ] Hatırlatma klinik bilgi taşımıyor mu (tanı, PSA sayı, IPSS skor, doz yok)?

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Ürolojimm: kontrol + hatırlatma — PSA/IPSS sayı yok.
- [ ] SOAP prompts lock: doz yok, tanı hekimde, hematüri/retansiyon/torsiyon → 112, OR scheduling yok.
- [ ] 18 yaş altı veli dili yaşa göre; baş çevresi / Neyzi hiç yok.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim onayı.
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/uroloji-exceptional-audit.html`, `lib/specialties/uroloji.ts`, `specialties/uroloji/engines/`.
