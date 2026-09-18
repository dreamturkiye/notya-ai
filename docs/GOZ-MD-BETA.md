# GOZ-MD-BETA — göz hekimi saha haftası kontrol listesi

**Amaç:** Göz Hastalıkları chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik smoke yeşil. `uzman-dogrulandi` için **gerçek bir göz hekiminin 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir. Bu belge o haftanın kontrol listesidir. Hekim her maddeyi kendi muayenehanesinde, kendi (gerçek) iş akışıyla dener. Notya ekibi yalnız gözlemler ve not alır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz; ekran görüntüsü kimliksizleştirilmeden alınmaz. Klinik karar her zaman hekimindir: tanı, evre, doz ve GİL gücü Notya'nın işi değildir.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'goz-hastaliklari'` → Araçlar'da 5 göz kartı görünüyor, Hedef Boy / Dahiliye Kohort görünmüyor.
- [ ] Sentetik prova: `npx tsx scripts/goz-smoke.mts` (57/0) ve `npx tsx scripts/goz-exceptional-smoke.mts` (88/0), yerel sunucuya karşı.
- [ ] Hekimle 20 dk tur: Göz sekmesi, şerit, Araçlar › Göz kohort.

## Gün 1 — genel poliklinik

- [ ] Bilateral VA/GİB girişi ≤30 sn/hasta (kopya-ileri → onay). RAPD ve refraksiyon alanları doğru yerde mi?
- [ ] "Nota ekle (O)" ve "Şeridi Objektif'e yaz" satırları hekimin dikte diliyle uyumlu mu?
- [ ] Intake kırmızı bayrak kutuları (ani görme kaybı, ışık çakması, perde, kimyasal, ağrılı kızarıklık) acil bandını açıyor mu? Yanlış alarm var mı?
- [ ] Biyomikroskopi formu (kapak → lens) TR poliklinik sırasına uygun mu? "Her iki göz doğal" kısayolu yeterli mi?

## Gün 2 — retina / DR

- [ ] Fundus kaydı → "DR evresini güncelle": hekim evreyi kendisi seçiyor mu, onay kutusu engel mi yoksa güven mi veriyor?
- [ ] TEMD ↔ ICO iki sütun ve kontrol tarihi kilidi anlaşılır mı?
- [ ] Lazer kaydı (PRP / fokal / grid, seans) + kontrol bağlantısı günlük pratiğe uyuyor mu?
- [ ] Belge › Fundus › Asistana raporla → "Göz görüntü okumasına aktar" → Göz › Görüntü'de uzman onayı. Taslak dili kabul edilebilir mi? "%70 tek alan" sınırı ve "evre değildir" etiketi doğru mu?
- [ ] Göz › Görüntü › Asistana raporla (gerçek fundus / OCT): taslak kalitesi, süre, yanlış pozitif sıklığı (hekim not tutar).

## Gün 3 — glokom

- [ ] Gonyoskopi (Shaffer + Spaeth serbest), pakimetri µm, GA/OCT cihaz meta yeterli mi?
- [ ] EGS 5 aralık ön ayarları ("öneri — hekim kilitler"): hekim hangisini kullandı, hangisini değiştirdi? TOD birim yaklaşımıyla çelişen nokta var mı (TR sütunu için not)?
- [ ] Geciken GA/OCT görevleri → Araçlar › Göz kohort → 1-tap hatırlatma. Hasta mesaj metni hekimce uygun mu?

## Gün 4 — enjeksiyon (IVT) + SGK

- [ ] IVT odası kontrol listesi (onam, göz işareti, ilaç + lot, asepsi) oda akışını yavaşlatıyor mu? Yanlış göz engeli çalışıyor mu?
- [ ] SUT anti-VEGF kapı (chapter + Araçlar) gerçek vakalarla doğru mu? Muayenehane / 2. / 3. basamak uyarıları.
- [ ] SGK rapor taslağı (başlangıç / idame / implant): eksikler listesi Medula girişinden önce gerçekten işe yarıyor mu? Kilit akışı.

## Gün 5 — katarakt + pediatrik + acil

- [ ] Biyometri alanları (AL, K1/K2, aks, A-sabiti, cihaz) cihaz çıktısıyla aynı mı? **GİL gücü hiçbir yerde görünmemeli.**
- [ ] Post-op 1. gün / 1. hafta kartı + endoftalmi bayrağı → acil uyarı.
- [ ] GİL bilgi notu (EK-3/G kodu, eksikler) → Medula'da hekim e-imza.
- [ ] Çocuk hasta: cover / Hirschberg / Krimsky; bebek: ROP kartı (zon / evre / plus, sonraki tarama hekim). Erişkinde ROP görünmüyor.
- [ ] Acil şablon: kimyasal yıkama zamanlayıcısı + yazdırılabilir eylem listesi (masa başı prova).

## Hafta sonu — karar

| Soru | Hekim cevabı |
|---|---|
| "Pediatri kadar exceptional" mi? (Evet / Hayır + neden) | |
| Klinik olarak yanlış veya tehlikeli bulunan bir şey var mı? | |
| Olmazsa olmaz eksik (ilk 3) | |
| TOD birim yaklaşımıyla çelişki (glokom / retina / pediatrik) | |

**Sonuç kuralı:** Hekim "evet" der, tehlikeli bulgu yoksa ve **Boss/CEO yazılı onay verirse** `lib/specialties/goz-hastaliklari.ts` → `olgunluk: 'uzman-dogrulandi'` yapılır, audit HTML güncellenir. Aksi halde `beta-hazir` kalır ve bulgular `docs/OPEN-COMMITMENTS.md` › Göz altına yazılır.
