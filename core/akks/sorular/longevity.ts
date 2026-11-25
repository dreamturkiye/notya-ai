import type { BankaKaynagi } from '../banka'

/** AKKS — Longevity & Wellness (Özel Branşlar). 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'longevity',
  onek: 'LNG',
  metin: String.raw`
#1 tuzak 2 - | kanıt düzeyi
S: Sağlıklı yaşlanma için kanıtı en güçlü müdahaleler hangileridir?
+ düzenli fiziksel aktivite (aerobik + kuvvet) ; sigara bırakma ; dengeli beslenme (Akdeniz tipi), sağlıklı kilo ; uyku ve sosyal bağlantı ; KB, lipid, glukoz kontrolü ve kanıta dayalı taramalar
- pahalı takviyeler egzersizden üstün ; NAD+ infüzyonu kanıtlı yaşam uzatıcı
#2 tuzak 2 - | metformin anti-aging
S: Diyabeti olmayan sağlıklı kişiye yaşlanmayı yavaşlatmak için metformin önerilir mi?
+ diyabetsiz bireyde yaşam uzatma kanıtı yok (çalışmalar sürüyor) ; endikasyon dışı kullanım ; B12 eksikliği, GİS yan etkileri, egzersiz adaptasyonunu azaltabilir ; etik bilgilendirme
- metformin herkese yaşlanmayı durdurur ; yan etkisi yok
#3 kilavuz 2 sb-kp-alzheimer-2025 | SB Alzheimer ve Demans KP Rev. 01 (2025), Bölüm 6 Korunma
S: Demans riskini azaltmak için kanıta dayalı öneriler?
+ değiştirilebilir risk faktörleri: hipertansiyon, işitme kaybı, sigara, fiziksel inaktivite, diyabet, depresyon, sosyal izolasyon, aşırı alkol ; işitme cihazı kullanımı ; bilişsel ve sosyal aktivite ; protokolün korunma bölümü
- ginkgo kesin demans önler ; işitme kaybı ile ilişkisiz
#4 ilac 2 - | takviyeler etkileşim
S: Çok sayıda takviye kullanan danışanda nelere dikkat edilir?
+ ilaç etkileşimleri (sarı kantaron, ginkgo, yüksek doz balık yağı — kanama) ; karaciğer toksisitesi (yeşil çay ekstresi vb.) ; doz aşımı (A, D vitamini) ; ürün kalitesi / kontaminasyon ; hekime bildirim
- takviyeler doğal olduğu için zararsız ; sınırsız D vitamini
#5 kirmizi 2 - | D vitamini toksisitesi
S: Yüksek doz D vitamini kullanan danışanda bulantı, poliüri ve konfüzyon. Ne düşünürsün?
+ D vitamini intoksikasyonu / hiperkalsemi ; kalsiyum ve 25-OH D düzeyi ; takviyenin kesilmesi, hidrasyon ; hekime acil yönlendirme
- normal, dozu artır ; hiperkalsemi olmaz
#6 kilavuz 2 hsgm-fiziksel-aktivite-2022 | HSGM Fiziksel Aktivite Raporu 2022
S: Sağlıklı yaşlanma için egzersiz reçetesi?
+ haftada 150–300 dk orta şiddette aerobik ; haftada ≥2 gün kas güçlendirme ; yaşlıda denge egzersizleri ; kademeli artış ; VO2maks ve kas gücü uzun ömür göstergeleri
- yaşlıda kuvvet egzersizi zararlı ; haftada 30 dk yeterli
#7 tuzak 2 - | hormon replasmanı rutin
S: Sağlıklı orta yaşlı erkeğe "anti-aging" amacıyla rutin testosteron önerilir mi?
+ yalnız semptomatik ve biyokimyasal olarak doğrulanmış hipogonadizmde ; rutin önerilmez ; hematokrit, prostat, KV, fertilite riskleri ; endokrinoloji değerlendirmesi
- herkese testosteron ; izlem gereksiz
#8 tuzak 2 - | büyüme hormonu
S: Yaşlanmayı geciktirmek için büyüme hormonu kullanımı uygun mu?
+ sağlıklı yaşlılarda GH kullanımı önerilmez ; yan etkiler (ödem, insülin direnci, karpal tünel, malignite endişesi) ; endikasyon dışı ve etik / yasal sorunlar
- GH yaşlanmayı geri döndürür ; güvenli
#9 yaygin 2 - | uyku
S: Uyku kalitesi kötü danışana öneriler?
+ uyku hijyeni (düzenli saat, ekran, kafein, alkol) ; insomnide BDT-İ ; OSAS taraması (horlama, gündüz uykululuğu) ; melatonin sınırlı endikasyon ; benzodiazepin uzun süreli önerilmez
- alkol uykuyu iyileştirir ; OSAS sorgulanmaz
#10 kilavuz 2 hsgm-hyp-kvr-kilavuzu-2025 | HYP KV Risk Kılavuzu 2025
S: Longevity değerlendirmesinde KV risk nasıl değerlendirilir?
+ SCORE2 / SCORE2-OP ; LDL, KB, glukoz, sigara ; risk düzeyine göre yaşam tarzı ve ilaç ; ApoB / Lp(a) seçilmiş ; kanıta dayalı hedefler
- KV risk değerlendirmesi gereksiz ; yalnız takviye ile risk azaltma
#11 tuzak 2 - | tüm vücut MR
S: Asemptomatik danışana "erken tanı" için rutin tüm vücut MR önerilir mi?
+ rutin tüm vücut MR taramasının yarar kanıtı yok ; insidentaloma, yanlış pozitif, gereksiz girişim ; kanıta dayalı taramalar (kanser, KV) ; paylaşılan karar
- tüm vücut MR herkese yıllık ; insidentalomalar zararsız
#12 tuzak 2 - | tümör belirteçleri
S: Sağlıklı bireyde tarama amaçlı tümör belirteçleri (CEA, CA 19-9, CA-125) istenir mi?
+ taramada önerilmez (düşük duyarlılık / özgüllük) ; yanlış pozitif ve kaygı ; ulusal kanser tarama programları ; belirteçler tanı konmuş kanserin izleminde
- yıllık tümör belirteç paneli herkese ; normal belirteç kanseri dışlar
#13 yaygin 2 - | beslenme protein yaşlı
S: Yaşlanan bireyde kas kaybını önlemede beslenme?
+ yeterli protein (yaklaşık 1,0–1,2 g/kg/gün), öğünlere dağıtım ; direnç egzersizi ile birlikte ; D vitamini yeterliliği ; böbrek fonksiyonu
- yaşlıda protein kısıtlanmalı ; egzersiz gereksiz
#14 kirmizi 2 - | IV vitamin terapisi
S: IV vitamin / "drip" terapileri konusunda tıbbi riskler nelerdir?
+ kanıtı sınırlı ; enfeksiyon, flebit, sıvı yüklenmesi (KY, böbrek), alerji ; ürün kaynağı / steril hazırlama ; ruhsatlı sağlık kuruluşu ve hekim sorumluluğu
- risksiz ; güzellik salonunda uygulanabilir
#15 yaygin 2 - | biyolojik yaş testleri
S: Epigenetik "biyolojik yaş" testlerinin klinik değeri?
+ araştırma aracı, klinik karar için doğrulanmamış ; test-tekrar test tutarlılığı ve laboratuvarlar arası farklar ; yaşam tarzı önerileri testten bağımsız ; danışanın gerçekçi bilgilendirilmesi
- klinik tanı koydurur ; tedavi kararlarını belirler
#16 kilavuz 2 sb-kanser-tarama-standartlari | Ulusal Kanser Tarama Standartları
S: Longevity danışanında kanser taraması nasıl planlanır?
+ ulusal programlara uygun (serviks, meme, kolorektal) ; aile öyküsü ve genetik risk değerlendirmesi ; yüksek riskte özel tarama ; kanıtsız taramalardan kaçınma
- ulusal programlar yetersiz, herkese PET-BT ; aile öyküsü önemsiz
#17 ilac 2 - | rapamisin
S: Danışan yaşam uzatma amacıyla rapamisin kullanmak istiyor. Ne söylersin?
+ insanlarda yaşam uzatma kanıtı yok, deneyseldir ; immünsüpresyon, enfeksiyon, metabolik yan etkiler ; ilaç etkileşimleri ; endikasyon dışı kullanımın etik / yasal boyutu
- rapamisin kanıtlı yaşam uzatıcı ; yan etkisi yok
#18 kirmizi 2 - | aşırı oruç
S: Uzun süreli (günlerce) su orucu yapmak isteyen diyabetli danışana ne önerirsin?
+ diyabette (özellikle insülin / sülfonilüre, SGLT2i) hipoglisemi / ketoasidoz riski ; hekim değerlendirmesi olmadan önerilmez ; yeniden beslenme sendromu riski ; elektrolit
- diyabetliler için ideal ; ilaç ayarı gereksiz
#19 yaygin 2 - | stres yönetimi
S: Kronik stresin sağlığa etkisi ve yönetimi?
+ KV risk, uyku, ruh sağlığı üzerine etkiler ; egzersiz, farkındalık (mindfulness), BDT ; sosyal destek ; depresyon / anksiyete taraması ve gerekirse yönlendirme
- stres sağlığı etkilemez ; sakinleştirici ilaç ilk seçenek
#20 tuzak 2 - | detoks
S: "Detoks kürleri" uzun ömre katkı sağlar mı?
+ bilimsel kanıt yok ; karaciğer / böbrek detoksifikasyonu yapar ; bazı kürler elektrolit bozukluğu / yetersizlik riski ; sürdürülebilir beslenme
- detoks toksinleri atar ; haftalık meyve suyu kürü
#21 kilavuz 2 dernek-geriatri | Türk Geriatri Derneği önerileri
S: Yaşlıda kırılganlık nasıl değerlendirilir ve önlenir?
+ Fried kriterleri / klinik kırılganlık ölçeği ; kas gücü, yürüme hızı, kilo kaybı ; egzersiz (kuvvet + denge), beslenme, polifarmasi gözden geçirme ; düşme önleme
- kırılganlık yaşlılığın kaçınılmaz sonucu ; müdahale gereksiz
#22 ilac 2 - | aspirin
S: KVH'si olmayan sağlıklı 60 yaşındaki danışana "longevity" için aspirin önerilir mi?
+ primer korunmada rutin aspirin önerilmez ; kanama riski ; bireysel yüksek risk değerlendirmesi hekimle
- herkese düşük doz aspirin ; kanama riski yok
#23 yaygin 2 - | alkol
S: "Az miktarda alkol uzun yaşatır" bilgisi için ne dersin?
+ güncel veriler güvenli alkol düzeyi olmadığını gösterir ; kanser riski düşük dozda da artar ; içmeyenlere başlamaları önerilmez
- günde 2 kadeh herkese önerilir ; alkol kanser riskini azaltır
#24 kirmizi 2 - | hipertansiyon taraması
S: Wellness danışmanlığında KB 165/105 saptandı. Ne yaparsın?
+ ölçümün doğru teknikle tekrarı ; ev / ambulatuvar ölçüm ; hekime yönlendirme ve organ hasarı değerlendirmesi ; yaşam tarzı ; ilaç kararı hekim
- takviyeyle tedavi ; önemsiz
#25 tuzak 2 - | kök hücre
S: "Kök hücre tedavisi ile gençleşme" vaat eden uygulamalar hakkında ne söylersin?
+ onaylı endikasyonlar dışında kanıtsız ; enfeksiyon, tümör, embolizm riskleri ; Türkiye'de mevzuat ve izin ; etik / yasal sorunlar
- güvenli ve kanıtlı ; herkese önerilir
#26 yaygin 2 - | işitme ve görme
S: Yaşlanan bireyde işitme ve görme taramasının önemi?
+ işitme kaybı demans ve sosyal izolasyon risk faktörü ; işitme cihazı ; görme (katarakt, glokom, YBMD) ; düşme riski ; düzenli tarama
- işitme kaybı önemsiz ; tarama gereksiz
#27 ilac 2 - | omega-3
S: Sağlıklı bireyde rutin yüksek doz omega-3 takviyesi önerilir mi?
+ sağlıklı bireyde KV olay azaltma kanıtı sınırlı ; yüksek dozda AF riski artışı ; balık tüketimi tercih ; yüksek trigliseridde seçilmiş ürünler hekimle
- herkese yüksek doz ; AF riski yok
#28 kirmizi 2 - | kilo kaybı açıklanamayan
S: Wellness programındaki danışanda istemsiz kilo kaybı ve gece terlemesi. Ne yaparsın?
+ alarm bulguları ; hekime yönlendirme ; malignite, enfeksiyon (TB), endokrin (hipertiroidi, diyabet) araştırması ; programın beklemeye alınması
- programın başarısı, devam ; önemsiz
#29 yaygin 2 - | sigara
S: Longevity açısından sigarayı bırakmanın yaşa göre yararı?
+ her yaşta bırakmanın yararı var ; KV risk hızla azalır ; kanser riski yıllar içinde azalır ; vareniklin / NRT, ALO 171
- 60 yaştan sonra bırakmanın yararı yok ; e-sigara güvenli alternatif
#30 tuzak 2 - | NAD+
S: NAD+ öncülleri (NMN / NR) insanlarda yaşamı uzatır mı?
+ insan çalışmaları kısa ve sınırlı, yaşam uzatma kanıtı yok ; güvenlik verisi uzun dönemde yetersiz ; ürün kalitesi ; kanıta dayalı yaşam tarzı öncelikli
- kanıtlı yaşam uzatıcı ; yan etkisi yok
`,
} satisfies BankaKaynagi
