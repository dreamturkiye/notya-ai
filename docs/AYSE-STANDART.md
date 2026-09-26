# Ayşe klinik dosya sorgulama standardı (NOTYA-AYSE-STANDART-01)

Kaynak: Dr. Gökhan Mamur (pediatri), 2026-09-26. Mimari: Kaan (çekirdek + branş bölümü). Bu belge sözleşmedir; kod
`lib/asistan/dosyaSorgu/`, `lib/doktor/{dosyaOlaylari,planIfadesi,planTakibi,acikIsler}.ts`, `lib/klinik/sikayetEsanlam.ts`
ve `specialties/pediatri/sorgu.ts` içindedir.

## 1. Amaç

Ayşe, çocuk hekimine hastanın kaydını **anlamlandırmada** yardım eder. Kelime bulmak, kayıt sıralamak ya da bilgiyi
tekrarlamak değildir. Farklı tarihlere ait notlar, anamnez, fizik muayene, vital, büyüme, gelişim, lab, aşı, ilaç,
alerji, konsültasyon, epikriz ve belgeler birlikte değerlendirilir. Cevap kısa, doğru, klinik olarak anlamlı ve
eyleme dönük olur.

Hedef: hekim üç saniyede üç cevabı görür. Durum nedir? Hangi veriye dayanarak? Şimdi yapmam gereken var mı?

## 2. Genel kurallar (hepsi uygulanır)

1. Kayıtlar gerektiği ölçüde kronolojik değerlendirilir. Güncel bilgi eskisinden ayrılır. Aynı olayın belgeleri birleştirilir.
2. Çelişen kayıt gizlenmez, hekime belirtilir.
3. Planlandı / önerildi / istendi / reçete edildi / uygulanacak ile uygulandı / yapıldı **aynı değildir**.
4. Dosyada olmayan üretilmez. Emin olunmayan ya da kaydı yetersiz konu açıkça söylenir.
5. Kayıt yoksa "yapılmadı" denmez. "Yapıldığına / uygulandığına / sonuçlandığına dair kayıt bulamadım" denir.
6. Kronolojik yaş (gerekirse düzeltilmiş yaş), cinsiyet ve kilo dikkate alınır.
7. Lab yaşa ve cinsiyete uygun pediatrik referansla yorumlanır. Laboratuvarın H/L işaretine güvenilmez.
8. İlaç dozunda reçete tarihindeki kilo ile güncel kilo karıştırılmaz.
9. Planlanan aşı ile uygulandığı belgelenmiş aşı kesin olarak ayrılır.
10. Planlanmış tarama testi yapılmış ya da normal sayılmaz.
11. Hasta güvenliği problemi, sorulmasa da cevabın **sonunda** belirgin bildirilir. Gereksiz alarm üretilmez.

## 3. Cevap standardı

1. Önce doğrudan cevap. İlk cümle sorunun cevabıdır ve hastanın adıyla başlar (NOTYA-HASTA-ODAK-01). Seste ilk
   duyulan cümle budur, çünkü `konusma.ts` en çok 5 cümle okur.
2. **Dayanak:** en önemli hasta verileri ve tarihleri. Dosya baştan tekrar edilmez.
3. Varsa **Dikkat / Eksik kayıt / Takip** başlığı.
4. Kaynak veri ("Kayıt:") ile klinik yorum ("Yorum:") ayrılır.
5. Belirsizlik gizlenmez. "Normaldir / yapılmıştır / uygulanmıştır" yalnız kayıt destekliyorsa söylenir.

## 4. Çekirdek, parametre, branş

| # | Soru | Tür | Nerede |
|---|------|-----|--------|
| 1 | Bu hastayı bana kısaca özetler misin? | Çekirdek | `kanit.ts` `ozetBolumu` |
| 2 | Son muayeneden bu yana neler değişmiş? | Çekirdek | `degisimBolumu` + `planTakibi.ts` |
| 3 | Büyümesi nasıl gidiyor? | Çekirdek + **parametre** (ölçüm eğilimi) | `BransSorguParametreleri.buyume` |
| 4 | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | Çekirdek + **parametre** (takvim) | `BransSorguParametreleri.asi` |
| 5 | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | Çekirdek | `labBolumu` |
| 6 | Şu anda kullandığı ilaçlar neler ve dozları nedir? | Çekirdek | `ilacBolumleri` + `ilacDurumu` |
| 7 | Daha önce aynı şikayetle geldi mi? | Çekirdek | `benzerBolumu` + `sikayetEsanlam.ts` |
| 8 | Gelişimi yaşına uygun mu? | **Branş** (pediatri bölümü) | `BransSorguParametreleri.gelisim` |
| 9 | Bugün yapmam veya takip etmem gereken bir şey var mı? | Çekirdek | `acikIsleriBul` |
| 10 | Gözümden kaçabilecek önemli bir şey var mı? | Çekirdek | `acikIsleriBul`, gruplu |

Parametre seçimi (`parametreler.ts` `parametreSec`): önce branşın kendi parametresi. Yoksa hasta çocuksa ve branş
pediatrik bağlamı kabul ediyorsa (`pediatrikBaglamMi`: aile hekimi evet, göz hekimi hayır) pediatri. Yoksa TEMEL.
TEMEL'de ölçüm trendi vardır (kilo, boy, VKİ, TA). Aşı takviminde dürüst cümle kullanılır: "erişkin aşı takvimi
parametreleri henüz tanımlı değil". Soru 8 yalnız `gelisim` tanımlayan branşta cevaplanır; diğerlerinde kanıt bloğu
bunu açıkça söyler (BRANS-ALAN-SIZMASI).

## 5. Akış (yazı ve ses aynı)

```
hekim mesajı ─► ayseCevapla.ts
                 ├─ kimlik sorusu → modelsiz (değişmedi)
                 ├─ hasta çözümü (NOTYA-SES-HASTA-01 / NOTYA-AKTIF-HASTA-01)
                 └─ açık hasta var ve soruTuruBul(mesaj) ∈ 10 soru?
                      evet ─► HIZLI KART atlanır
                              dosyaSorguVerisiDerle (olay dizini, doktora kapsanmış) ∥ hastaDosyaPaketiniDerle
                              dosyaEk = AKTİF HASTA DOSYASI + dosyaSorguKuralBlogu(ad) + kanitBlogu(tür, olaylar, hasta)
                              model (GÜÇLÜ) düzyazıyı kanıttan kurar → doz/kaynak kilitleri → konusma.ts (5 cümle)
                      hayır ─► tek bilgilik soru: HIZLI KART (kan grubu, alerji, son vizit, telefon/kimlik) — değişmedi
```

Model hiçbir değeri hesaplamaz. Durumlar, tarihler, persentiller, eksik dozlar, açık işler deterministiktir.
Model yalnız cümleyi kurar. Kanıt bloğunda hastanın adı yoktur (KVKK); ad yalnız kurallar bloğunda, ilk cümle için
geçer.

## 6. Olay dizini ve durumlar

`DosyaOlayi = { tarih, kaynak, tur, durum, metin, deger?, birim?, kilo?, kaynakId, guven? … }`

| Kaynak | Durum eşlemesi |
|---|---|
| `asilar` | uygulandi (guven: kayit) |
| `hasta_ilaclar` | okuma anında `ilacDurumu`: aktif / tamamlandi (süre doldu) / kesildi / belirsiz (akut ilaç, 14 günden eski, süresiz) |
| not `content_ilaclar` | recete (+ reçete tarihindeki kilo) |
| `lab_satirlar` (onaylı) | sonuclandi (+ laboratuvar referansı, yaşa uygunluğu doğrulanmadı) |
| `sevkler` | istendi / sonuclandi / tamamlandi / belirsiz |
| `randevular` | randevu (gelecek) / tamamlandi / belirsiz |
| `mchat_testleri`, `gelisim_taramalari`, `pedi_taramalar` | sonuclandi (tarama) |
| not vitalleri, `cihaz_olcumleri` | olcum (kilo, boy, baş çevresi, ateş, TA …) |
| onaylı not metni (plan, değerlendirme, öykü) | `planIfadeleriniCikar`: planlandi / onerildi / istendi / randevu / recete / uygulandi / sonuclandi / kesildi / belirsiz (guven: metin) |
| ilk kayıt formu + hasta kartı | alerji, kronik, perinatal, anne/baba boyu |

Bir planın karşılığı yalnız **sonraki** kayıttır (`planKarsiligi`): aşı satırı, lab sonucu, konsültasyon yanıtı,
sonraki vizit, tarama kaydı. Sonraki notta yalnız "yapıldı" yazıyorsa bu `guven: metin` karşılıktır. Aşı tablosunda
satır yoksa açık iş olarak kalır.

Okuma kuralları: HASTA-IZOLASYON-01 (hasta satırı `doctor_id` ile, her çocuk okuma hasta + doktor kolonuyla),
NOTYA-ARSIV-01/02 (arşivli muayene, notu, ilacı ve aşısı görünmez), yalnız onaylı notlar. Migration yok; durum okuma
anında hesaplanır.

## 7. Sorgu planı (soru başına)

1. **Özet:** perinatal, alerji (boşsa "alan boş, alerjisi yok anlamına gelmez"), kronik, aktif ilaç, tanılar tekrar
   sayısıyla, tekrarlayan patern, demir eksikliği izi, son büyüme satırı + kaymalar, gelişim tarama durumu, aşı
   sayısı + eksikler + planlanmış-kaydı-olmayanlar, önemli lab, konsültasyon, takip gerektirenler (bugün + yakında).
2. **Değişim:** son iki vizit, ölçüm farkı, büyüme bayrakları, **önceki vizitin planları → sonraki kayıttaki karşılık**,
   aradaki lab / aşı / konsültasyon / belge, reçete karşılaştırması, kesilen / tamamlanan ilaç, yeni alerji.
3. **Büyüme:** pediatri: Neyzi persentil / Z tablosu (tarih, yaş), kayma (≥ 2 majör çizgi, tarih aralığıyla), büyüme
   hızı (kısa aralık uyarısıyla), kilo-boy orantısı, hedef boy (anne-baba boyu varsa). TEMEL: kilo / boy / VKİ / TA trendi.
4. **Aşı:** takvim + kesin yaş. Ayrı bölümler: uygulandığı belgelenmiş (tablo) · not metninde plan / öneri / randevu
   (karşılığıyla) · belirsiz (notta yapıldı, tabloda yok) · eksik / zamanı geçmiş (telafi) · yaklaşan · eşleşmeyen ·
   risk bazlı / takvim dışı · çelişen kayıt ("aşıları tam" beyanı vs tablo).
5. **Lab:** demir paneli birlikte (Hb, Hct, MCV, MCH, MCHC, RDW, ferritin, demir, TDBK; eksik kalemler adıyla), diğer
   kalemler son 4 değer + yön, laboratuvar referansı (yaşa uygunluk doğrulanmadı), istenen tetkikler → "sonuç yok" ya
   da sonuç tarihi, ilgili ilaç ve tanı.
6. **İlaç:** aktif · süresi dolmuş (aktif sayılmadı) · kesilmiş · belirsiz · son 90 günün reçeteleri (reçete tarihindeki
   kilo, planlanan bitiş) · güncel kilo · alerji · alerji-ilaç çatışması (`core/eylemler/ilacUyari` `alerjiUyarilari`).
7. **Benzer şikayet:** şikayet mesajdan, yoksa son vizitten. Eşanlam grupları (28 grup), eşleşen terimle birlikte
   kronolojik vizitler + o vizitin reçetesi, toplam, tekrarlayan patern.
8. **Gelişim (pediatri):** kronolojik / düzeltilmiş yaş, GİDR basamağı, kayıtlı tarama sonuçları, planlanmış taramalar →
   "tamamlanmış sonuç dosyada görünmüyor", SB izlem pencerelerine göre GİDR / otizm durumu (`vizitPlani`), ebeveyn
   kaygısı ifadeleri, regresyon (yüksek öncelik).
9. **Takip:** `acikIsleriBul` → 1) Bugün 2) Yakın zamanda 3) Rutin.
10. **Gözden kaçan:** aynı liste gruplu (güvenlik, çelişki, aşı, takipsiz test, büyüme/gelişim, tekrarlayan patern,
    bekleyen konsültasyon/kontrol). Liste boşsa standardın cümlesi.

Açık iş kuralları (`acikIsler.ts`): istendi-sonuç yok (bugün) · planlanmış aşı-kayıt yok (bugün) · takvime göre eksik
aşı (bugün; planlıysa tekrar yazılmaz) · son vizitteki kontrol, vadesi geçmiş (bugün) / yaklaşan / randevulu (rutin) ·
konsültasyon-yanıt yok · görüntüleme-sonuç yok · tarama planlı-sonuç yok · laboratuvar referansı dışındaki son değer,
tekrarı yok · büyüme kayması · gelişim penceresi / regresyon · son 12 ayda aynı enfeksiyon grubunda ≥ 3 vizit ·
alerji-ilaç çatışması (güvenlik) · "aşıları tam" beyanı ile tablo çelişkisi.

## 8. Denetim

**Deterministik (her `npm test`):** `lib/asistan/dosyaSorgu/denetim.test.ts`, 4 sentetik dosya
(`denetim/fikstur.ts`) × soru altın beklentileri (içermeli / içermemeli):

- (a) 26 ay: "bugün Hep B 2. dozunu yapacağız" ama aşı satırı yok → `Hepatit B 2. doz — planlandı`, asla
  `— uygulandı`. Ferritin istendi, sonuç yok. Amoksisilin 10 gün önce, 10 günlük kür, aktif sayılmaz. Kilo p53 → p10.
  M-CHAT planlandı ama sonucu yok. 3 otit farklı yazımla bulunur.
- (b) 8 ay sağlıklı: yalnız açık kontrol.
- (c) 4 yaş: penisilin alerjisi + amoksisilin → güvenlik. Hb 10,2 → 12,1 düzelme.
- (d) "aşıları tam" notu ile KKK'sı olmayan tablo → çelişen kayıt.

Ayrıca router paraphrase'ları, `planIfadesi` durumları, `ilacDurumu`, eşanlam, erişkin / göz / kardiyoloji parametre
seçimi, kurallar bloğu, `ayseCevapla` bağlantısı. İzolasyon: `lib/doktor/dosyaOlaylari.test.ts` (sahte veritabanı,
A→B null, B'nin kirli satırları A'ya sızmaz, arşivli ve onaysız not girmez).

**Canlı (elle, yalnız QA hesabı ve QA hasta):**

```
AYSE_DENETIM_TOKEN=<QA doktor JWT> npx tsx scripts/ayse-denetim/canli.mts --hasta <patientId> --etiket qa-cocuk-a \
  [--url http://localhost:3199] [--ad "QA Çocuk A"] [--sorular 1,4,9]
```

10 soruyu aynı oturumda sorar. Her cevabı `denetim/puanla.ts` kurallarıyla puanlar: boş değil; "uydurdum" yok;
"yapılmadı" yerine "kayıt bulamadım"; doğrudan cevap önde / adla; plan anılınca kayıt cümlesi; açık iş sorusunda
Dikkat/Takip; aşıda plan-belge ayrımı; ilaçta aktif-geçmiş ayrımı. Sonucu `docs/denetim/YYYY-MM-DD-<etiket>.md`
dosyasına yazar. E-postası gerçek hekim desenine uyan jetonla durur. **Dr. Gökhan'ın hesabına koşulmaz.** Kural
puanı klinik doğruluğu ölçmez; onu hekim okur.

## 9. Yeni branş nasıl eklenir

1. `specialties/<branş>/sorgu.ts` içinde bir `BransSorguParametreleri` yazılır: `buyume` (ör. dahiliye: kilo / VKİ / TA
   / bel çevresi trendi), `asi` (erişkin takvimi: tetanoz-difteri, grip, pnömokok, zona, Hep B; gebelik: Tdap, grip).
   Takvim yoksa `null` döner ve `asiTakvimiYok` cümlesi yazılır. İsteğe bağlı `gelisim` yerine branşın bölüm sorusu
   (ör. KD: gebelik haftası / tarama durumu) eklenir, `yasaGoreIsler` de eklenebilir.
2. `lib/asistan/dosyaSorgu/parametreler.ts` `BRANS_PARAMETRELERI` haritasına tek satır eklenir.
3. Bölüm soruları için `soruTuru.ts`'e kalıp, `kurallar.ts`'e şablon, `kanit.ts`'e dal eklenir. Çekirdek dosyalar
   yalnız bu noktalarda değişir.
4. `denetim/fikstur.ts`'e o branşın sentetik dosyası ve `denetim.test.ts`'e altın beklentileri eklenir.
5. Klinik sayı (takvim, eşik) yalnız doğrulanmış TR kaynağından alınır. Doğrulanamayan değer "öneri — hekim
   kilitler" diye işaretlenir.

## 10. 100 soru yol haritası

- **~40 çekirdek:** bu 10 + ör. "son reçetesi ne, ne kadar kullanacak", "hangi tetkik bekliyor", "son konsültasyon
  ne dedi", "bu ilaç alerjisiyle çelişiyor mu", "kilo/doz uyumu", "son 3 vizitte ne değişti", "kronik hastalığın
  kontrolü belgelenmiş mi", "belgelerde ne var", "randevusu ne zaman / geldi mi", "tekrar eden ateş paterni" …
  Hepsi aynı olay dizini ve açık iş motorunu kullanır.
- **~60 branş başına:** pediatri (beslenme, profilaksi D vit / demir, işitme-görme taraması, ergen), KD (gebelik
  haftası, tarama testleri, Rh, OGTT), dahiliye (HbA1c hedefi, lipid, böbrek), kardiyoloji, göz, KBB …
- Her soru bir `SoruTuru` + kalıp + kanıt dalı + şablon + fikstür beklentisi demektir. Denetim yeşil olmadan canlıya
  alınmaz.

## 11. Ertelenenler

Bkz. `docs/OPEN-COMMITMENTS.md` § NOTYA-AYSE-STANDART: pgvector anlamsal arama, erişkin aşı takvimi parametreleri,
29 branşın bölüm soruları, 100 soru genişlemesi, gerçek dosyada canlı puanlama (Dr. Gökhan'ın onayını bekliyor).
