# SPOR-MD-BETA — spor hekimliği saha haftası kontrol listesi

**Amaç:** Spor Hekimliği chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik testler yeşil. `uzman-dogrulandi` için **gerçek bir spor hekimliği uzmanının 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir.

**Ürün kapsamı:** ticari **ayaktan muayenehane / poliklinik**. Takım kadrosu HIS, doping panelleri (çekirdek ürün), tanı auto-lock ve uydurma doz kapsam dışıdır. Araçlar **ortopedi / FTR gridine sızmaz**.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz. Klinik karar her zaman hekimindir: tanı, ilaç, doz, spora dönüş kararı Notya'nın işi değildir. RTP basamağı ve sakatlık şiddet bandı karar desteğidir.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'spor-hekimligi'` → Araçlar'da 3 spor kartı (RTP · Sakatlık · Kohort); Ortopedi / FTR / Hedef Boy tile'ları **yok**.
- [ ] Migration 066 uygulandı: `hasta_spor`, `spor_rtp`, `spor_sakatlik`, `spor_gorevleri`, `spor_risk` + RLS.
- [ ] `npm run test:spor` ve `npm run test:brans-sizmasi` yeşil.
- [ ] 20 dk tur: hasta dosyası › Spor Hekimliği sekmesi, sticky şerit, Araçlar › Kohort, Sağlığım › Sporum.

## Gün 1 — RTP omurgası

- [ ] Basamak 0–5 seçilince özet "karar desteği" dilinde mi?
- [ ] Hiçbir yerde "dönüş tanısı" / ACL / konküzyon tanısı yazılmıyor mu?
- [ ] Kontrol görevi açılıyor mu?

## Gün 2 — Sakatlık günlüğü + yüklenme

- [ ] Bölge / mekanizma / şiddet bandı kaydı; tanı yazılmıyor mu?
- [ ] Yüksek acute:chronic oranında yüklenme uyarısı açılıyor mu?
- [ ] Portal'da şiddet bandı / doz görünmüyor mu?

## Gün 3 — kırmızı bayrak

- [ ] Intake acil kutuları → 112 yardım metni.
- [ ] Konküzyon / egzersiz göğüs / senkop / kırık+nöro / kompartman / boyun yakalanıyor mu?
- [ ] Açık "hemen" bayrağı varken hekim onayı olmadan risk kaydı yazılmıyor (409) — kabul?

## Gün 4 — kohort

- [ ] Geciken kontrol / RTP / aktif sakatlık / yüklenme / açık bayrak → 1-tap hatırlatma.
- [ ] Hatırlatma klinik bilgi taşımıyor mu (tanı, doz, doping yok)?
- [ ] Ortopedi / FTR hekimi bu kohortu görmüyor mu?

## Gün 5 — portal + SOAP

- [ ] Sağlığım › Sporum: kontrol + antrenmana dönüş planı — tanı/doz/doping yok.
- [ ] SOAP prompts lock: doz yok, tanı hekimde, kırmızı bayrak → 112, takım HIS / doping yok.
- [ ] 18 yaş altı veli dili yaşa göre; baş çevresi / Neyzi hiç yok.

## Çıkış kriteri (Boss)

- [ ] 5 gün notları + hekim onayı.
- [ ] CEO onayı → `olgunluk: 'uzman-dogrulandi'` (ayrı commit).

Kaynak: `public/spor-exceptional-audit.html`, `lib/specialties/spor-hekimligi.ts`, `specialties/spor-hekimligi/engines/`.
