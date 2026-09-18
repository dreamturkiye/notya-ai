# DERM-MD-BETA — dermatolog saha haftası kontrol listesi

**Amaç:** Dermatoloji (Deri ve Zührevi Hastalıklar) chapter'ı `olgunluk: 'beta-hazir'` durumunda. Ürün derinliği tamam ve sentetik smoke yeşil. `uzman-dogrulandi` için **gerçek bir dermatoloğun 5 poliklinik günü** ve **Boss/CEO'nun açık onayı** gerekir. Bu belge o haftanın kontrol listesidir. Hekim her maddeyi kendi muayenehanesinde / EAH polikliniğinde, kendi (gerçek) iş akışıyla dener. Notya ekibi yalnız gözlemler ve not alır.

**Kurallar:** Gerçek hasta verisi Notya ekibiyle paylaşılmaz; ekran görüntüsü kimliksizleştirilmeden alınmaz — deri fotoğrafında dövme, yüz, genital bölge ve takı da tanımlayıcıdır. Klinik karar her zaman hekimindir: tanı, morfoloji, skor yorumu, izotretinoin / biyolojik / fototerapi dozu Notya'nın işi değildir.

## Hazırlık (ekip, 1 gün önce)

- [ ] Hekim hesabı `users.specialty = 'dermatoloji'` → Araçlar'da 5 derm kartı görünüyor, Hedef Boy / Göz kohort / Dahiliye kohort görünmüyor.
- [ ] Migration 054 (`lib/db/migrations/054_derm_exceptional.sql`) uygulandı — Belge → dual-sign köprüsü alanları.
- [ ] Sentetik prova yerel sunucuya karşı: `npx tsx scripts/derm-prompts-smoke.mts` ve `npx tsx scripts/derm-exceptional-smoke.mts`.
- [ ] `npm run test:derm` ve `npm run test:brans-sizmasi` yeşil.
- [ ] Hekimle 20 dk tur: Deri & Lezyon sekmesi, sticky şerit, Araçlar › Derm kohort, Sağlığım › Derim.

## Gün 1 — genel poliklinik + lezyon

- [ ] Ünite seçimi (genel / psoriasis / fototerapi / kontakt-yama / nevüs-tümör …) günün gerçek akışına oturuyor mu? Yanlış ünitede fazla alan var mı?
- [ ] Lezyon kaydı ≤30 sn/hasta: bölge + morfoloji + vücut haritası düğümü. Morfoloji sözlüğü Andrews/Bolognia TR karşılıklarıyla uyumlu mu?
- [ ] ABCDE + çirkin ördek yavrusu + dermoskopi uyarısı → melanom acil görevi: yanlış alarm sıklığı? Hekim "tanı histopatoloji ile" dilini kabul ediyor mu?
- [ ] Resmî tanı yalnız katalogdan seçiliyor (serbest metin reddediliyor) — liste yetersiz kaldığı vaka oldu mu?
- [ ] Sticky şerit çipleri (Fitzpatrick / ünite / skor / GÖP / yama / foto) hekimin bakmak istediği sıra mı?

## Gün 2 — görüntü, dermoskopi ve dual-sign

- [ ] Klinik + dermoskopik fotoğraf çekim protokolü (ölçek, mesafe, polarize/immersiyon) pratikte uygulanabiliyor mu?
- [ ] Genital / 18 yaş altı görüntü onam kilidi iş akışını yavaşlatıyor mu, yoksa koruyor mu?
- [ ] **Belge › Dermatoskopi › Asistana raporla → Deri › "Görüntü okumasına aktar"** → uzman onayı. Taslak dili kabul edilebilir mi? "Fitzpatrick bilinmiyor → %70" sınırı ve "tanı değildir — resmî tanıyı hekim lezyon kartında kilitler" etiketi doğru mu?
- [ ] Bölge zorunluluğu ("tüm vücut tek okumaya aktarılmaz") gerçek hastada mantıklı mı?
- [ ] Deri › Görüntü › Asistana raporla (gerçek dermoskopi / klinik foto): taslak kalitesi, süre, yanlış pozitif sıklığı (hekim not tutar).
- [ ] Ay-0 / ay-3 foto serisi ve önce-sonra karşılaştırması: aynı lezyon_id eşleşmesi tutuyor mu?

## Gün 3 — skorlar, psoriasis, atopi

- [ ] Bölge PASI / EASI (ve SCORAD) worksheet'i: hekim elle hesapladığından hızlı mı? Toplam ve bant doğru mu?
- [ ] DLQI / UAS7 / SALT girişleri doğru üniteye bağlı mı? Görünmemesi gereken skor görünüyor mu?
- [ ] PSOKİD 2025 tedavi merdiveni kartı: basamağı hekim kilitliyor, Notya doz yazmıyor — doğrulandı mı?
- [ ] PsA / eklem triyaj kutusu ve sevk ipucu: romatolojiye giden hasta sayısı ve doğruluğu.
- [ ] TDD 2018 atopi basamak kartı: erişkin ve pediatrik hastada aynı ekran karışıklık yaratıyor mu?

## Gün 4 — fototerapi ünitesi, yama, sistemik tedavi

- [ ] Fototerapi defteri hemşire tarafından kullanılabiliyor mu? MED, doz-adımı, yanık bayrağı, kümülatif J/cm² — cihaz kayıt defteriyle aynı mı?
- [ ] Solaryum yasağı (2018) cihaz listesinde gerçekten engel mi?
- [ ] Kontakt yama: Avrupa baz serisi grid + D2/D4 okuma + foto türleri (yama_d2 / yama_d4). Oda takvimi pratikte tutuyor mu?
- [ ] İzotretinoin GÖP kapısı: son 30 gün negatif β-hCG + çift korunma onamı. Gerçek hastada engel doğru zamanda mı çıktı? Aylık görev ve kadın-doğum tarafına düşen teratojen görevi yerinde mi?
- [ ] Biyolojik lab kapısı (IGRA/PPD, HBsAg, Anti-HBc, Anti-HCV, HIV, hemogram, ALT) ve SUT rapor taslağı: eksikler listesi Medula girişinden önce gerçekten işe yarıyor mu?
- [ ] **Hiçbir yerde uydurulmuş doz görülmemeli** (izotretinoin mg/kg, kümülatif mg/kg, biyolojik doz, J/cm²). Görülürse ekran görüntüsü + vaka notu.

## Gün 5 — işlem odası, acil, bildirim, portal

- [ ] İşlem odası (punch / shave / eksizyon / kriyo / koter / tırnak / küretaj): onam, işlem notu alanları, numune etiketi, yara bakımı metni.
- [ ] Yara / dikiş / patoloji görevleri doğru günlerde açılıyor mu? Patoloji sonucu aynı lezyona bağlanıyor mu?
- [ ] Acil bandı: SJS/TEN, eritrodermi, anjioödem (hava yolu), nekrotizan fasiit şüphesi, yaygın bül — intake kutularından açılıyor mu? Yanlış alarm var mı?
- [ ] Behçet / büllöz kartları ve BZBH Form 014 **yazdırılabilir taslağı**: Form 014 bir bildirim formudur, onam formu değildir — metin bunu doğru söylüyor mu?
- [ ] Saç-tırnak: SALT worksheet + trikoskopi not alanlarının fotoğrafa bağlanması.
- [ ] Sağlığım › **Derim**: hasta ekranını hekim kendi telefonunda açsın. β-hCG vadesi, fototerapi seansı, yama D2/D4, yara kontrolü, TBSE hatırlatmaları hasta diliyle mi? **Tanı, morfoloji, skor, ilaç adı ve doz görünmemeli.** Hastanın "bu ne demek?" diyeceği bir satır var mı?

## Hafta sonu — karar

| Soru | Hekim cevabı |
|---|---|
| "Pediatri kadar exceptional" mı? (Evet / Hayır + neden) | |
| Klinik olarak yanlış veya tehlikeli bulunan bir şey var mı? | |
| Olmazsa olmaz eksik (ilk 3) | |
| TDD / PSOKİD yaklaşımıyla çelişki (psoriasis / atopi / akne / kontakt) | |
| Derim'de hastaya gitmemesi gereken bir satır gördünüz mü? | |

**Sonuç kuralı:** Hekim "evet" der, tehlikeli bulgu yoksa ve **Boss/CEO yazılı onay verirse** `lib/specialties/dermatoloji.ts` → `olgunluk: 'uzman-dogrulandi'` yapılır, `public/derm-exceptional-audit.html` güncellenir. Aksi halde `beta-hazir` kalır ve bulgular `docs/OPEN-COMMITMENTS.md` › Dermatoloji altına yazılır.
