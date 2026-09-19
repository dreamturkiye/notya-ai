# ORTO-MD-BETA — ortopedi saha haftası kontrol listesi

**Amaç:** Ortopedi chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir ortopedi uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Ameliyathane planlaması, OR scheduling, cerrahi HIS ve canlı Medula e-imza kapsam dışıdır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz. Klinik karar her zaman hekimindir: tanı, ilaç, doz, "risk kapandı" kararı Notya'nın işi değildir. VAS/fonksiyon bantları karar desteğidir — artroz / kaynama tanısı yazılmaz.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'ortopedi'` → Araçlar'da 4 ortopedi kartı (Kırık/alçı · VAS · Op-sonrası · Kohort); Hedef Boy / FTR tile'ları **yok**.
- [ ] Migration 064 uygulandı: `hasta_ortopedi`, `orto_kirik_alci`, `orto_vas`, `orto_gorevleri`, `orto_risk` + RLS.
- [ ] `npm run test:orto` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Ortopedi sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Eklemlerim.

## Gün 1 — VAS / fonksiyon

- [ ] VAS 0–10 + 4 madde: eksik bırakınca bant yorumlanmıyor mu?
- [ ] Şiddet bandı "KARAR DESTEĞİ" — hiçbir yerde "artroz tanısı" yazmıyor değil mi?

## Gün 2 — kırık / alçı-ortez

- [ ] Alçı alma / yük verme tarihleri görev açıyor mu?
- [ ] NV tehdit uyarısı görünüyor mu?
- [ ] Portal'da VAS sayı / skor görünmüyor mu?

## Gün 3 — kırmızı bayrak

- [ ] Intake acil kutuları → 112 yardım metni.
- [ ] Kompartman / NV / açık kırık / septik / kauda / çıkık+NV yakalanıyor mu?
- [ ] Açık "hemen" bayrağı varken hekim onayı olmadan risk kaydı yazılmıyor (409) — kabul?

## Gün 4 — kohort + op-sonrası

- [ ] Geciken kontrol / alçı / yüksek VAS / açık bayrak → 1-tap hatırlatma.
- [ ] Op-sonrası protokol OR scheduling / HIS vaadi taşımıyor mu?

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Eklemlerim: kontrol + hatırlatma — VAS sayı yok.
- [ ] SOAP prompts lock: doz yok, tanı hekimde, kompartman/NV → 112, OR scheduling yok.
- [ ] 18 yaş altı veli dili yaşa göre; baş çevresi / Neyzi hiç yok.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim onayı.
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/orto-exceptional-audit.html`, `lib/specialties/ortopedi.ts`, `specialties/ortopedi/engines/`.
