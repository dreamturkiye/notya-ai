import type { BankaKaynagi } from '../banka'

/** AKKS — Aile Hekimliği. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'aile-hekimligi',
  onek: 'AHE',
  metin: String.raw`
#1 kilavuz 2 hsgm-hyp-ht-kilavuzu-2025 | HYP HT Tarama ve İzlem Kılavuzu 2025
S: Hastalık Yönetim Platformu'nda (HYP) hipertansiyon taraması kimlere ve ne sıklıkla yapılır?
+ erişkinlerde düzenli KB taraması (yaş ve risk gruplarına göre aralık) ; doğru ölçüm tekniği ; yüksek değerde tekrar ve ev ölçümü ile doğrulama ; HYP izlem modülüne kayıt ve risk değerlendirmesi
- tarama yalnız semptomlu hastada ; tek ölçümle tanı
#2 kilavuz 2 hsgm-hyp-kvr-kilavuzu-2025 | HYP KV Risk Kılavuzu 2025
S: Birinci basamakta KV risk değerlendirmesi ve statin kararı?
+ SCORE2 / SCORE2-OP (Türkiye yüksek risk bölgesi) ; risk düzeyine göre LDL hedefi ; yaşam tarzı ; yüksek riskte statin ; diyabet, KBH, ailesel hiperkolesterolemide doğrudan yüksek risk
- risk hesaplamadan herkese statin ; Türkiye düşük risk tablosu
#3 kilavuz 2 sb-asi-takvimi | erişkin aşılama
S: Aile hekimliğinde erişkin Td aşısı nasıl planlanır?
+ tamamlanmış primer seri sonrası 10 yılda bir Td ; gebelerde programa göre Td ; yaralanmada tetanoz profilaksisi algoritması ; aşı kaydı (e-Nabız / aşı modülü)
- erişkinde tetanoz aşısı gerekmez ; her yaralanmada TIG
#4 kilavuz 2 sb-kanser-tarama-standartlari | Ulusal Kanser Tarama Standartları
S: Aile hekiminin uyguladığı kanser taramaları?
+ serviks: 30–65 yaş HPV-DNA, 5 yılda bir ; meme: 40–69 yaş mamografi 2 yılda bir (KETEM) ; kolorektal: 50–70 yaş FIT 2 yılda bir ; pozitiflerin sevki
- tüm erkeklere PSA ulusal program ; serviks 18 yaşında
#5 yaygin 2 - | üst solunum yolu enfeksiyonu
S: Soğuk algınlığında hastaya önerilecek tedavi?
+ semptomatik (parasetamol / ibuprofen, burun yıkama) ; antibiyotik gereksiz ; komplikasyon / kırmızı bayrak bilgilendirmesi ; 1 yaş üstü çocukta bal öksürükte
- antibiyotik reçete edilir ; 2 yaş altına öksürük şurubu
#6 yaygin 2 - | akut tonsillofarenjit
S: Boğaz ağrısında antibiyotik kararı?
+ Centor / McIsaac ; hızlı antijen testi ; GAS'ta penisilin / amoksisilin 10 gün ; viral olasılıkta semptomatik ; kırmızı bayrak (abse, stridor)
- tüm boğaz ağrılarına antibiyotik ; azitromisin ilk seçenek
#7 kilavuz 2 sb-kp-diyabet | SB Diyabet KP 2019
S: Diyabetli hastanın yıllık izleminde neler yapılır?
+ HbA1c (yılda 2–4) ; KB, lipid, böbrek (eGFR, idrar albümin/kreatinin) ; göz dibi ; ayak muayenesi (monofilaman) ; aşılar, sigara, kilo
- yalnız açlık şekeri ; ayak muayenesi gereksiz
#8 yaygin 2 - | depresyon taraması
S: Birinci basamakta depresyon taraması ve ilk yaklaşım?
+ PHQ-2 / PHQ-9 ; intihar riski sorgulaması ; hafif depresyonda psikososyal destek, orta-ağırda SSRİ / psikoterapi ; izlem (4–6 hafta) ; sevk ölçütleri
- intihar sorgulanmaz ; benzodiazepin ilk seçenek
#9 kirmizi 2 - | göğüs ağrısı birinci basamak
S: Aile hekimliği biriminde göğüs ağrılı hasta. İlk yaklaşım?
+ EKG (varsa) ve vital bulgular ; AKS şüphesinde aspirin çiğnetme (kontrendikasyon yoksa) ve 112 ile sevk ; kendi aracıyla gönderilmemesi ; risk değerlendirmesi
- hasta kendi aracıyla hastaneye ; EKG normalse AKS dışlanır
#10 ilac 2 - | polifarmasi yaşlı
S: Çok ilaç kullanan yaşlı hastada ilaç gözden geçirmesi?
+ tüm ilaçların listelenmesi ; Beers / STOPP-START kriterleri ; endikasyon, etkileşim, doz (böbrek) ; gereksiz ilaçların azaltılması (deprescribing)
- ilaç sayısı önemsiz ; yeni şikâyete yeni ilaç ekle
#11 kilavuz 2 sb-asi-takvimi | çocukluk aşı takibi
S: Aşı reddi yapan aileye aile hekimi nasıl yaklaşır?
+ empatik iletişim ve kanıta dayalı bilgilendirme ; aşılamamanın riskleri ; ret durumunun kayıt altına alınması (aşı ret formu) ; tekrar görüşme fırsatı
- aileyi listeden çıkarma ; tartışmadan geçme
#12 yaygin 2 - | bel ağrısı birinci basamak
S: Akut bel ağrısında görüntüleme ve sevk kararı?
+ kırmızı bayrak yoksa görüntüleme gerekmez ; aktif kalma, NSAİİ ; 6 haftada düzelme yoksa yeniden değerlendirme ; kırmızı bayrakta (kauda ekuina, kanser, enfeksiyon) acil sevk
- her bel ağrısına MR ; yatak istirahati
#13 kilavuz 2 - | obezite birinci basamak
S: Obez hastada birinci basamak yaklaşım?
+ VKİ ve bel çevresi ; komorbidite taraması (glukoz, lipid, KB, karaciğer) ; motivasyonel görüşme, diyet ve fiziksel aktivite ; %5–10 kilo kaybı hedefi ; gerektiğinde farmakoterapi / cerrahi sevk
- tüm obezlere ilaç ; komorbidite taraması gereksiz
#14 yaygin 2 - | sigara bırakma
S: Sigara içen hastaya kısa müdahale nasıl yapılır?
+ 5A (Sor, Öner, Değerlendir, Yardım et, İzle) ; farmakoterapi (vareniklin, NRT, bupropion) ; ALO 171 ve sigara bırakma poliklinikleri ; nüks normaldir, yeniden deneme
- hasta istemezse hiç konuşulmaz ; ilaç kanıtsız
#15 kirmizi 2 - | ateşli çocuk birinci basamak
S: 2 aylık ateşli bebek aile hekimine getirildi. Yaklaşım?
+ 3 ay altı ateşli bebek yüksek risk ; hastaneye acil sevk (tam değerlendirme) ; ateş düşürücü ile evde izlem önerilmez
- parasetamol verip eve ; 3 gün izle
#16 kilavuz 2 - | gebe izlem birinci basamak
S: Aile hekimliğinde gebe izleminde yapılanlar?
+ en az 4 izlem (SB DÖBYR) ; folik asit, demir ve D vitamini desteği programı ; tarama testleri ve sevk ; risk saptanan gebede ikinci basamak sevki ; Td aşısı
- gebe izlemi yalnız hastanede ; demir desteği gereksiz
#17 ilac 2 - | antibiyotik reçete denetimi
S: Akılcı antibiyotik kullanımında aile hekiminin rolü?
+ viral enfeksiyonlarda antibiyotik yazmama ; doğru süre ve dar spektrum ; hasta eğitimi ; SB Akılcı İlaç Kullanımı ve reçete göstergeleri
- hasta memnuniyeti için antibiyotik ; geniş spektrum her zaman daha iyi
#18 yaygin 2 - | idrar yolu enfeksiyonu kadın
S: Gebe olmayan kadında basit sistitte tedavi?
+ fosfomisin tek doz veya nitrofurantoin 5 gün ; kültür gerekmez (tekrarlayan / komplike hariç) ; kinolon ilk seçenek değil ; kırmızı bayrak (ateş, yan ağrısı)
- kinolon 14 gün ; her vakaya USG
#19 sgk 2 sgk-sut | SUT; aile hekimi reçete / rapor (güncel madde doğrulanacak)
S: Aile hekimi uzman raporuna dayalı ilaçları reçete edebilir mi?
+ SUT'a göre uzman hekim raporuna dayanarak aile hekimince reçete yazılabilen ilaçlar ; raporun geçerlilik süresi ve doz bilgisi ; e-rapor / e-reçete ; güncel SUT'tan doğrulanmalı
- aile hekimi hiçbir raporlu ilacı yazamaz ; rapor gerekmez
#20 kilavuz 2 sb-dogum-sonu-bakim | Doğum Sonu Bakım Yönetim Rehberi
S: Aile hekiminin lohusa izleminde kontrol ettikleri?
+ kanama, enfeksiyon, KB, meme sorunları ; emzirme desteği ; doğum sonu depresyon taraması ; kontrasepsiyon danışmanlığı ; bebeğin izlemi ve topuk kanı / işitme taraması
- lohusa izlemi gereksiz ; depresyon sorgulanmaz
#21 yaygin 2 - | baş dönmesi yaşlı
S: Yaşlı hastada baş dönmesi yakınmasında değerlendirme?
+ vertigo / presenkop / dengesizlik ayrımı ; ortostatik KB ; ilaçlar ; nörolojik bulgularda acil sevk ; BPPV'de Dix-Hallpike ve Epley
- tüm hastalara betahistin ; ortostatik ölçüm gereksiz
#22 tuzak 2 - | rutin check-up
S: Asemptomatik sağlıklı erişkine her yıl kapsamlı "check-up" (tümör belirteçleri, tüm vücut görüntüleme) önerilir mi?
+ kanıta dayalı yaşa / riske uygun tarama ; tümör belirteçleri ve tüm vücut görüntüleme taramada önerilmez ; yanlış pozitif ve gereksiz girişim ; KB, lipid, glukoz, kanser taramaları programa göre
- herkese yıllık tümör belirteçleri ; tüm vücut MR
#23 kirmizi 2 - | inme belirtileri
S: Aile hekimliği biriminde ani yüz kayması ve kol güçsüzlüğü olan hasta. Ne yaparsın?
+ inme şüphesi (FAST) ; semptom başlangıç zamanının kaydı ; 112 ile inme merkezine acil sevk ; kan şekeri ; oral alım verme, KB'yi agresif düşürme
- birkaç saat izle ; dil altı nifedipin
#24 kilavuz 2 sb-kp-astim | SB Astım KP
S: Birinci basamakta astım izleminde neler değerlendirilir?
+ semptom kontrolü (son 4 hafta) ; atak öyküsü ; inhaler tekniği ve uyum ; basamak tedavi ayarı ; sevk ölçütleri (kontrolsüz, ağır atak)
- inhaler tekniği kontrolü gereksiz ; yalnız salbutamol yeterli
#25 yaygin 2 - | demir eksikliği kadın
S: Doğurganlık çağındaki kadında demir eksikliği anemisi; yaklaşım?
+ menstrüel kayıp sorgulanması ; oral demir ; diyet ; GİS semptomu / yanıtsızlıkta ileri tetkik ; çölyak
- yalnız diyet yeterli ; neden sorgulanmaz
#26 ilac 2 - | NSAİİ birinci basamak
S: NSAİİ reçete ederken risk değerlendirmesi?
+ GİS kanama riski (yaş, öykü, antikoagülan) ; böbrek fonksiyonu ; KV risk ; en düşük doz kısa süre ; gerekirse PPI
- tüm hastalara uzun süreli ; risk değerlendirmesi gereksiz
#27 kirmizi 2 - | çocuk istismarı birinci basamak
S: Aile hekimi çocukta istismar şüphesinde ne yapar?
+ ayrıntılı kayıt ve muayene ; yasal bildirim yükümlülüğü ; Çocuk İzlem Merkezi / sosyal hizmet ; çocuğun güvenliği ; aileyi suçlayıcı olmayan iletişim
- aileye sorup eve gönder ; bildirim isteğe bağlı
#28 yaygin 2 - | KOAH birinci basamak
S: Sigara içen öksürüklü hastada KOAH şüphesinde birinci basamak?
+ spirometri (bronkodilatör sonrası FEV1/FVC <0,7) ; sigara bırakma ; aşılar ; inhaler tedavi başlangıcı ve sevk ölçütleri
- spirometri gereksiz ; antibiyotik tedavisi
#29 kilavuz 2 hsgm-fiziksel-aktivite-2022 | HSGM Fiziksel Aktivite Raporu 2022
S: Fiziksel aktivite reçetesi nasıl yazılır?
+ haftada 150–300 dk orta veya 75–150 dk yüksek şiddette aerobik ; haftada ≥2 gün kas güçlendirme ; kademeli başlama ; kronik hastalığa göre uyarlama
- egzersiz kronik hastalıkta yasak ; haftada 10 dk yeterli
#30 tuzak 2 - | ishal antibiyotik
S: Akut sulu ishali olan erişkinde rutin antibiyotik verilmeli mi?
+ çoğu akut ishal kendini sınırlar, rutin antibiyotik önerilmez ; ORS / sıvı ; kanlı ishal, yüksek ateş, immünsüpresyon gibi durumlarda değerlendirme ; STEC şüphesinde antibiyotikten kaçınma
- tüm ishallere siprofloksasin ; loperamid kanlı ishalde
`,
} satisfies BankaKaynagi
