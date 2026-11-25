import type { BankaKaynagi } from '../banka'

/** AKKS — Kardiyoloji. 30 draft items (Claude, 2026-11-24); 70 more in OPEN-COMMITMENTS AKKS-BANKA-100. Needs clinician review. */
export default {
  brans: 'kardiyoloji',
  onek: 'KAR',
  metin: String.raw`
#1 kirmizi 3 sb-kp-kah-2025 | SB KAH KP (Revizyon 2025); ESC/TKD AKS
S: 58 yaşında erkek 40 dakikadır süren göğüs ağrısıyla geldi, EKG'de V1–V4'te ST elevasyonu var. Yaklaşım?
+ akut anterior STEMI ; birincil PKG hedefi ilk tıbbi temastan itibaren ≤120 dk (PKG merkezinde ≤60–90 dk) ; zamanında PKG yapılamıyorsa kontrendikasyon yoksa fibrinolitik ; aspirin + P2Y12 inhibitörü yükleme, antikoagülan ; PKG merkezine acil transfer
- troponin sonucu beklenerek karar verilir ; rutin oksijen satürasyondan bağımsız verilir
#2 kilavuz 2 dernek-tkd | ESC/TKD 2023 AKS
S: NSTE-AKS'de invaziv strateji zamanlaması nasıl belirlenir?
+ çok yüksek risk (hemodinamik instabilite, dirençli ağrı, mekanik komplikasyon, aritmi) → acil (<2 saat) ; yüksek risk (NSTEMI tanısı, dinamik ST-T, GRACE >140) → erken (<24 saat) ; düşük riskte seçici invaziv yaklaşım ; troponin algoritmaları (0/1 saat)
- tüm NSTE-AKS hastalarına fibrinolitik ; invaziv değerlendirme taburculuktan sonra
#3 ilac 2 - | DAPT süresi
S: Stabil hastada ilaç salınımlı stent sonrası standart ikili antiplatelet tedavi süresi?
+ AKS sonrası standart 12 ay DAPT ; kronik koroner sendromda elektif PKG sonrası genellikle 6 ay ; yüksek kanama riskinde kısaltma (1–3 ay) ; kanama / iskemi riskine göre bireyselleştirme
- DAPT 1 hafta yeterli ; tüm hastalarda ömür boyu DAPT
#4 kilavuz 2 dernek-tkd | ESC/TKD 2024 AF
S: Atriyal fibrilasyonlu hastada antikoagülasyon kararı nasıl verilir?
+ CHA2DS2-VA(Sc) skoru ; erkekte ≥2, kadında ≥3 (VASc) veya güncel CHA2DS2-VA ≥2'de OAK önerilir, 1'de düşünülür ; NOAK'lar (mekanik kapak / orta-ağır mitral darlık hariç) warfarine tercih edilir ; kanama riski değerlendirilir ama OAK'ı tek başına engellemez ; aspirin inme korunmasında önerilmez
- inme korunmasında aspirin yeterli ; HAS-BLED yüksekse OAK verilmez
#5 ilac 3 - | NOAK doz
S: AF'li 80 yaşında, 58 kg, kreatinin 1,6 mg/dL hastada apiksaban dozu?
+ apiksaban doz azaltma kriterleri: yaş ≥80, ağırlık ≤60 kg, kreatinin ≥1,5 mg/dL — ikisi varsa 2,5 mg x2 ; bu hastada üç kriter var → 2,5 mg günde iki kez ; böbrek fonksiyonunun periyodik izlemi ; gereksiz düşük doz inme riskini artırır
- standart 5 mg x2 ; tek kriter varsa doz azaltılır
#6 kilavuz 2 dernek-tkd | ESC 2021 KY + 2023 güncelleme
S: HFrEF tanılı hastada kılavuz temelli tedavinin dört temel ilaç sınıfı nedir?
+ ARNİ (sakubitril/valsartan) veya ACEİ/ARB ; kanıtlı beta bloker ; MRA ; SGLT2 inhibitörü (dapagliflozin / empagliflozin) ; hızlı titrasyon, konjesyonda diüretik
- yalnız diüretik yeterli ; SGLT2 inhibitörü yalnız diyabetlilerde
#7 kirmizi 3 - | aort diseksiyonu
S: Ani yırtılır tarzda sırta yayılan göğüs ağrısı, kollar arasında KB farkı. Ne yaparsın?
+ akut aort diseksiyonu şüphesi ; acil BT anjiyografi (instabilde TEE) ; KB ve kalp hızı kontrolü (IV beta bloker önce, hedef SKB 100–120) ; tip A → acil cerrahi, tip B → çoğunlukla medikal / TEVAR ; antitrombotik / trombolitik verilmez
- AKS gibi fibrinolitik ; vazodilatör beta blokerden önce
#8 kilavuz 2 dernek-turk-hipertansiyon-uzlasi-2025 | Türk HT Uzlaşı 2025; ESC 2024
S: Evre 1 hipertansiyonda ilaç tedavisine ne zaman başlanır ve ilk tercih?
+ yüksek KV riskte veya organ hasarında hemen ilaç ; düşük-orta riskte yaşam tarzı ile 3–6 ay ; başlangıçta çoğu hastada tek hapta ikili kombinasyon (ACEİ/ARB + KKB veya tiyazid) ; ev / ambulatuvar KB ölçümü
- 160/100 altında hiç ilaç gerekmez ; ACEİ + ARB kombinasyonu önerilir
#9 tuzak 2 - | ACEİ + ARB
S: Proteinürisi olan hipertansif hastada ACEİ ve ARB'yi birlikte kullanmak uygun mu?
+ ACEİ + ARB kombinasyonu önerilmez ; hiperkalemi, böbrek hasarı ve hipotansiyon riski, ek yarar yok ; tek RAS blokeri maksimum doz + gerekirse SGLT2i / finerenon (uygun hastada) ; potasyum ve kreatinin izlemi
- çift RAS blokajı böbreği daha iyi korur ; aliskiren de eklenmeli
#10 ilac 2 - | statin hedefi
S: Çok yüksek riskli hastada LDL-K hedefi ve tedavi basamakları?
+ LDL-K <55 mg/dL ve başlangıçtan ≥%50 azalma ; yüksek yoğunluklu statin ; hedefe ulaşılmazsa ezetimib ; sonra PCSK9 inhibitörü ; uyum ve yan etkilerin izlemi
- çok yüksek riskte LDL <130 yeterli ; statin yan etkisinde tüm lipid tedavisi bırakılır
#11 kirmizi 2 - | senkop
S: Egzersiz sırasında senkop geçiren 25 yaşında hastada hangi değerlendirme yapılır?
+ yapısal kalp hastalığı / aritmi şüphesi ; EKG (uzun QT, Brugada, preeksitasyon, HCM) ; ekokardiyografi ; efor testi, ritim holter / loop ; tanı konana kadar spor kısıtlaması
- vazovagal, değerlendirme gereksiz ; sporuna hemen dönebilir
#12 kirmizi 3 - | hiperkalemi EKG
S: Diyaliz hastasında K 7,2 mmol/L ve EKG'de sivri T, geniş QRS. İlk tedavi?
+ IV kalsiyum (glukonat / klorür) membran stabilizasyonu ; insülin + glukoz, salbutamol nebül ile hücre içine kaydırma ; potasyum uzaklaştırma: diyaliz, bağlayıcılar ; monitörizasyon
- yalnız potasyum bağlayıcı ve ertesi gün kontrol ; kalsiyum kontrendike
#13 yaygin 2 - | stabil angina
S: Tipik efor anginası olan hastada ilk değerlendirme ve tedavi?
+ klinik ön test olasılığı ; non-invaziv test: koroner BT anjiyo veya fonksiyonel görüntüleme ; antiangina: beta bloker veya KKB, kısa etkili nitrat ; aspirin ve statin ile sekonder korunma ; yaşam tarzı
- tüm hastalara doğrudan PKG ; nitrat ile PDE5 inhibitörü birlikte güvenli
#14 ilac 3 - | nitrat PDE5
S: Sildenafil kullanan hasta göğüs ağrısıyla geldi. Dil altı nitrat verilir mi?
+ PDE5 inhibitörü sonrası nitrat kontrendike (sildenafil/vardenafil 24 saat, tadalafil 48 saat) ; ağır hipotansiyon riski ; alternatif antiiskemik tedavi ; ilaç öyküsü sorgulanmalı
- nitrat güvenle verilir ; doz yarıya indirilerek verilebilir
#15 kirmizi 2 - | perikardit / tamponad
S: Viral enfeksiyon sonrası göğüs ağrısı, oturmakla azalıyor, yaygın ST elevasyonu ve PR çökmesi. Tedavi?
+ akut perikardit ; yüksek doz NSAİİ / aspirin + kolşisin (3 ay) ; ekokardiyografi ile efüzyon / tamponad ; yüksek riskli özelliklerde (ateş >38, büyük efüzyon, antikoagülan) yatış ; kortikosteroid ilk seçenek değil
- STEMI, fibrinolitik ; steroid ilk tercih
#16 kilavuz 2 dernek-tkd | infektif endokardit profilaksisi
S: Diş çekimi öncesi infektif endokardit profilaksisi kimlere verilir?
+ yüksek risk: protez kapak / kapak tamiri materyali, önceki endokardit, siyanotik doğumsal kalp hastalığı (tamir edilmemiş veya şant) ; yalnız diş eti manipülasyonu / periapikal işlemlerde ; amoksisilin 2 g tek doz işlemden 30–60 dk önce ; ağız hijyeni
- tüm üfürümlü hastalara profilaksi ; mitral kapak prolapsusunda rutin profilaksi
#17 yaygin 2 - | AF hız kontrolü
S: Hemodinamik stabil, hızlı ventrikül yanıtlı AF'de akut hız kontrolü?
+ beta bloker veya non-dihidropiridin KKB (EF korunmuşsa) ; düşük EF'de beta bloker / digoksin / amiodaron ; instabilde elektriksel kardiyoversiyon ; 48 saatten uzun / bilinmeyen sürede kardiyoversiyon öncesi antikoagülasyon veya TEE
- düşük EF'de verapamil ; 48 saat üstü AF'de antikoagülasyonsuz kardiyoversiyon
#18 kirmizi 3 - | VT
S: Nabızlı, hipotansif, bilinci bulanık geniş QRS'li taşikardi. Ne yaparsın?
+ instabil geniş QRS taşikardi ; senkronize elektriksel kardiyoversiyon (sedasyon ile) ; ALS algoritması ; sonrasında amiodaron ; nabızsızsa defibrilasyon ve KPR
- önce adenozin denenir ; verapamil verilir
#19 ilac 2 - | QT uzatan
S: Uzun QT'si olan hastada kaçınılması gereken başlıca ilaçlar?
+ makrolidler, florokinolonlar ; antipsikotikler (haloperidol), bazı antidepresanlar (sitalopram) ; antiaritmikler (sotalol, amiodaron), ondansetron ; elektrolitler (K, Mg) ; güncel QT listeleri ile kontrol
- QT uzatan ilaç yoktur ; hipokalemi QT'yi etkilemez
#20 kilavuz 2 hsgm-hyp-kvr-kilavuzu-2025 | HYP KV Risk Değerlendirmesi Kılavuzu 2025
S: Birinci basamakta asemptomatik erişkinde kardiyovasküler risk nasıl değerlendirilir?
+ SCORE2 / SCORE2-OP gibi risk tabloları (Türkiye yüksek risk bölgesi) ; KB, lipid, sigara, diyabet, yaş ; risk düzeyine göre yaşam tarzı ve ilaç kararı ; HYP izlem aralıkları
- risk değerlendirmesi yalnız 70 yaş sonrası ; Türkiye düşük risk ülkesi tablosu kullanılır
#21 tuzak 2 - | aspirin primer korunma
S: KVH öyküsü olmayan 65 yaşında sağlıklı kişiye primer korunma için rutin aspirin önerir misin?
+ primer korunmada rutin aspirin önerilmez ; kanama riski yararı dengeler ; çok yüksek riskli seçilmiş hastada bireysel karar ; sekonder korunmada aspirin endikedir
- herkes 50 yaşından sonra aspirin almalı ; aspirin kanama riski taşımaz
#22 yaygin 2 - | akut KY
S: Akut dekompanse kalp yetmezliği ile gelen konjesyonlu hastada ilk tedavi?
+ IV loop diüretik (evde kullandığı dozun 1–2,5 katı) ; oksijen yalnız hipoksemide ; KB yüksekse vazodilatör ; tetikleyicilerin araştırılması (AKS, aritmi, enfeksiyon, uyumsuzluk) ; GDMT'nin mümkünse sürdürülmesi
- beta bloker her durumda kesilir ; rutin morfin
#23 sgk 2 sgk-sut | SUT kardiyoloji ilaç (güncel madde doğrulanacak)
S: SGK'da sakubitril/valsartan ve PCSK9 inhibitörleri için genel geri ödeme çerçevesi nedir?
+ belirli endikasyon kriterleri (EF eşiği, önceki tedavi, LDL düzeyi ve maksimum statin / ezetimib sonrası) ; kardiyoloji uzmanı raporu / sağlık kurulu ; tedaviye yanıtın belgelenmesi ; ayrıntılar güncel SUT'tan doğrulanmalı
- herkese raporsuz ödenir ; pratisyen hekim raporu yeterli
#24 kirmizi 2 - | pulmoner emboli
S: Ani nefes darlığı, taşikardi, hipotansiyon olan postop hastada PE şüphesi. Yaklaşım?
+ yüksek riskli (masif) PE ; acil BT pulmoner anjiyografi veya instabilde yatak başı ekokardiyografi (RV disfonksiyonu) ; kontrendikasyon yoksa sistemik tromboliz ; antikoagülasyon (UFH) ; tromboliz kontrendikeyse cerrahi / kateter tedavi
- D-dimer sonucu beklenir ; instabil hastada yalnız oral antikoagülan
#25 ilac 2 - | amiodaron izlem
S: Uzun süreli amiodaron kullanan hastada hangi izlemler yapılır?
+ tiroid fonksiyonları (hipo / hiper) ; karaciğer enzimleri ; akciğer toksisitesi (grafi, DLCO, semptom) ; göz (kornea birikimi, optik nöropati), fotosensitivite ; warfarin / digoksin etkileşimi
- izlem gerekmez ; warfarinle etkileşim yoktur
#26 yaygin 2 - | aort darlığı
S: Ağır semptomatik aort darlığı olan 78 yaşında hastada tedavi?
+ semptomatik ağır AS'de kapak replasmanı (medikal tedavi prognozu değiştirmez) ; TAVİ veya cerrahi AVR — kalp takımı kararı, yaş ve cerrahi riske göre ; ekokardiyografi ile ciddiyet ; koroner değerlendirme
- medikal tedavi yeterli ; vazodilatörler ilk seçenek
#27 kirmizi 2 - | miyokardit
S: Viral hastalık sonrası göğüs ağrısı, troponin yüksekliği, koroner anjiyografi normal olan genç hasta. Ne düşünürsün?
+ miyokardit ; kardiyak MR ; aritmi ve kalp yetmezliği izlemi ; 3–6 ay yarışmacı spordan uzak durma ; fulminan formda mekanik destek merkezi
- hemen spora dönebilir ; tanı için MR gereksiz
#28 tuzak 2 - | rutin oksijen MI
S: SpO2 %97 olan akut MI hastasına rutin oksijen verilmeli mi?
+ SpO2 ≥%90 olan hastada rutin oksijen önerilmez ; hipoksemide (SpO2 <%90) oksijen ; yararı kanıtlanmamış, hiperoksi zararlı olabilir
- tüm MI hastalarına yüksek akım oksijen ; oksijen infarkt alanını küçültür
#29 kilavuz 2 sb-kp-hipertansiyon | SB HT KP (2020) — güncel baskı doğrulanacak
S: Dirençli hipertansiyon tanısı ve değerlendirmesi nasıl yapılır?
+ diüretik dahil üç ilaç maksimum dozda hedef dışı ; yalancı direnç dışlanır (uyum, ölçüm tekniği, beyaz önlük — ABPM) ; sekonder nedenler: primer aldosteronizm, OSAS, renal arter darlığı, ilaçlar (NSAİİ) ; dördüncü ilaç spironolakton
- ilaç sayısını artırmadan önce uyum sorgulanmaz ; sekonder neden araştırılmaz
#30 ilac 2 - | warfarin INR
S: Mekanik mitral kapaklı hastada INR hedefi ve NOAK kullanımı?
+ mekanik kapakta warfarin (NOAK kontrendike) ; mekanik mitral kapakta INR hedefi genellikle 3,0 (2,5–3,5) ; ek risk faktörlerine göre ; düzenli INR izlemi, ilaç-besin etkileşimleri
- mekanik kapakta NOAK tercih edilir ; INR hedefi 1,5
`,
} satisfies BankaKaynagi
