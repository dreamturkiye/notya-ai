import type { BankaKaynagi } from '../banka'

/** AKKS — Kalp ve Damar Cerrahisi. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'kalp-damar-cerrahisi',
  onek: 'KVC',
  metin: String.raw`
#1 kirmizi 3 - | akut tip A diseksiyon
S: BT'de çıkan aortu tutan akut diseksiyon. Yaklaşım?
+ Stanford tip A — acil cerrahi ; KB ve kalp hızı kontrolü (beta bloker) ; perikard tamponadı, aort yetmezliği, malperfüzyon değerlendirmesi ; perikardiyosentez tek başına önerilmez (cerrahi gecikmemeli)
- medikal tedaviyle izlem ; trombolitik
#2 kilavuz 2 - | tip B diseksiyon
S: Komplike olmayan akut tip B aort diseksiyonunda tedavi?
+ medikal tedavi: KB (SKB 100–120) ve kalp hızı (<60) kontrolü ; ağrı kontrolü ; malperfüzyon, rüptür, dirençli ağrı / HT gibi komplikasyonda TEVAR ; seçilmiş komplike olmayanda TEVAR tartışılır ; ömür boyu görüntüleme izlemi
- tüm tip B'lere acil açık cerrahi ; izlem gereksiz
#3 kilavuz 2 - | AAA tarama
S: Abdominal aort anevrizması taraması ve cerrahi eşik?
+ 65 yaş üstü sigara içmiş erkeklerde USG taraması ; erkekte ≥5,5 cm, kadında ≥5,0 cm veya hızlı büyüme (>1 cm/yıl) / semptomda onarım ; EVAR veya açık ; küçük anevrizmada izlem ve risk faktörleri
- 3 cm her anevrizmada cerrahi ; izlem gereksiz
#4 kirmizi 3 - | akut ekstremite iskemisi
S: AF'li hastada ani soğuk, solgun, ağrılı bacak ve nabız yokluğu. Yaklaşım?
+ akut arteriyel emboli ; hemen IV heparin ; Rutherford sınıflaması (duyu / motor kaybı) ; acil revaskülarizasyon (embolektomi / kateter tromboliz) ; reperfüzyon sonrası kompartman sendromu
- elevasyon ve sıcak uygulama ; ertesi gün Doppler
#5 yaygin 2 - | periferik arter hastalığı
S: Aralıklı kladikasyosu olan hastada ilk tedavi?
+ ABI ile tanı ; sigara bırakma ; denetimli egzersiz programı ; antiplatelet ve yüksek yoğunluklu statin ; silostazol semptomatik ; yaşam kalitesini bozan / kritik iskemide revaskülarizasyon
- ilk tedavi bypass ; egzersiz zararlı
#6 kirmizi 2 - | kritik iskemi
S: İstirahat ağrısı ve iyileşmeyen ayak ülseri olan PAH hastası. Yaklaşım?
+ kronik ekstremiteyi tehdit eden iskemi ; görüntüleme (Doppler, BT / MR / DSA) ; revaskülarizasyon (endovasküler / cerrahi) ; yara bakımı, enfeksiyon kontrolü ; amputasyon riski
- yalnız yara pansumanı ; egzersiz ile tedavi
#7 kilavuz 3 - | karotis darlığı
S: Semptomatik %80 karotis darlığında tedavi?
+ karotis endarterektomi (CEA) önerilir, tercihen semptomdan sonra 2 hafta içinde ; seçilmiş hastada stent ; optimal medikal tedavi (antiplatelet, statin, KB) ; asemptomatik darlıkta bireysel karar
- semptomatik darlıkta 6 ay bekleme ; medikal tedavi gereksiz
#8 kilavuz 2 - | CABG vs PKG
S: Sol ana koroner ve üç damar hastalığı olan diyabetik hastada revaskülarizasyon tercihi?
+ kalp takımı kararı ; diyabetik çok damar hastalığında CABG sağkalım avantajı ; SYNTAX skoru ; cerrahi risk (EuroSCORE II / STS)
- tüm hastalara PKG ; kalp takımı gereksiz
#9 ilac 2 - | CABG sonrası
S: CABG sonrası hastada sekonder korunma ilaçları?
+ aspirin (ömür boyu) ; yüksek yoğunluklu statin ; beta bloker (MI / düşük EF) ; ACEİ / ARB (endikasyonda) ; AKS sonrası CABG'de DAPT değerlendirmesi ; kardiyak rehabilitasyon
- CABG sonrası aspirin kesilir ; statin gereksiz
#10 kirmizi 2 - | postop AF
S: Kalp cerrahisi sonrası 2. günde AF gelişti. Yaklaşım?
+ postoperatif AF sık ; hız / ritim kontrolü (beta bloker, amiodaron) ; elektrolit (K, Mg) düzeltme ; 48 saati aşanda / risk faktörlerinde antikoagülasyon değerlendirmesi ; profilakside beta bloker
- tedavi gereksiz, kendiliğinden geçer ; elektrolit önemsiz
#11 kirmizi 3 - | kardiyak tamponad postop
S: Kalp cerrahisi sonrası hipotansiyon, CVP artışı ve göğüs tüpü drenajında ani azalma. Ne düşünürsün?
+ kardiyak tamponad ; acil ekokardiyografi ; acil re-eksplorasyon (sternotomi) ; sıvı ile köprü
- drenaj azaldı, iyileşme işareti ; diüretik
#12 yaygin 2 - | varis
S: Semptomatik büyük safen ven reflüsü olan variste tedavi seçenekleri?
+ dupleks USG ile reflü değerlendirmesi ; kompresyon (semptomatik) ; endovenöz termal ablasyon (lazer / RF) birinci basamak girişim ; köpük skleroterapi ; açık stripping
- dupleks gereksiz ; tüm variste açık cerrahi ilk seçenek
#13 kirmizi 2 - | DVT
S: Proksimal DVT'de tedavi ve süre?
+ antikoagülasyon (NOAK tercih, kanserde LMWH / NOAK) ; provoke DVT 3 ay ; provoke edilmemiş / tekrarlayanda uzun süreli değerlendirme ; rutin kava filtresi önerilmez
- tüm DVT'lere tromboliz ; 2 hafta antikoagülasyon
#14 kilavuz 2 - | AV fistül
S: Hemodiyaliz için AV fistül planlaması?
+ eGFR <15–20 civarında erken planlama (diyalizden aylar önce) ; tercih edilen damar yolu (kateterden üstün) ; ön kolda radiosefalik öncelikli ; damar haritalama USG ; aday kolda venipunktür / IV kateterden kaçınma
- fistül diyaliz başladıktan sonra ; kateter tercih edilir
#15 kirmizi 2 - | aort anevrizma rüptür
S: Bilinen AAA'lı hastada ani karın-bel ağrısı ve hipotansiyon. Yaklaşım?
+ rüptür ; permisif hipotansiyon ; acil EVAR / açık onarım ; kan ürünleri ; stabilse BT anjiyo
- normotansiyona kadar agresif sıvı ; BT için beklenir instabilde
#16 ilac 3 - | heparin HİT
S: Heparin başlandıktan 7 gün sonra trombositlerde %50 düşüş ve yeni tromboz. Ne düşünürsün?
+ heparin ilişkili trombositopeni ; 4T skoru, anti-PF4 testi ; tüm heparinlerin (LMWH dahil) kesilmesi ; non-heparin antikoagülan (argatroban, fondaparinuks, NOAK) ; trombosit transfüzyonundan kaçınma
- LMWH'ye geçilir ; warfarin hemen başlanır
#17 kilavuz 2 dernek-tkd | kapak hastalığı
S: Ağır semptomatik mitral yetmezliğinde (primer) tedavi?
+ cerrahi mitral onarım (replasmana tercih) ; ekokardiyografi ile mekanizma ; EF ve LV boyutları cerrahi zamanlamada ; yüksek cerrahi riskte transkateter edge-to-edge onarım
- yalnız medikal tedavi ; onarım yerine her zaman replasman
#18 kirmizi 2 - | protez kapak tromboz
S: Mekanik kapaklı hastada INR düşükken nefes darlığı ve kapak seslerinde azalma. Ne yaparsın?
+ protez kapak trombozu ; acil ekokardiyografi / floroskopi ; obstrüktif trombozda cerrahi veya tromboliz (merkeze göre) ; antikoagülasyon optimizasyonu
- NOAK'a geçiş ; ayaktan izlem
#19 yaygin 2 - | lenfödem
S: Meme kanseri sonrası kol lenfödemi. Tedavi?
+ kompleks dekonjestif terapi (manuel lenfatik drenaj, kompresyon bandajı, egzersiz, cilt bakımı) ; kompresyon giysisi ; enfeksiyon (selülit) önleme ; seçilmiş vakada cerrahi (lenfovenöz anastomoz)
- diüretik ilk seçenek ; kolda tansiyon ölçülmesi sorun değil
#20 sgk 2 sgk-sut | SUT kalp-damar cerrahi (güncel madde doğrulanacak)
S: Stent-greft (EVAR / TEVAR) ve kapak işlemlerinde SGK geri ödemesinin genel çerçevesi?
+ SUT'ta tanımlı endikasyon ve malzeme koşulları ; konsey / sağlık kurulu raporu (TAVİ gibi) ; yetkili merkez ; fark ücreti sınırları ; güncel SUT'tan doğrulanmalı
- tüm işlemler raporsuz ; merkez yetkisi gerekmez
#21 tuzak 2 - | DVT yatak istirahati
S: DVT tanısı konan hastaya emboli riski nedeniyle katı yatak istirahati önerilmeli mi?
+ antikoagülasyon başlandıktan sonra erken mobilizasyon önerilir ; yatak istirahati PE riskini azaltmaz ; kompresyon semptom için
- 2 hafta tam yatak istirahati ; mobilizasyon emboli yapar
#22 kirmizi 2 - | mediastinit
S: Sternotomi sonrası 10. günde ateş, sternal akıntı ve instabilite. Ne düşünürsün?
+ derin sternal yara enfeksiyonu / mediastinit ; BT, kültürler ; cerrahi debridman, NPWT ; uzun süreli antibiyotik ; flep rekonstrüksiyonu
- yüzeyel enfeksiyon, oral antibiyotik ; debridman gereksiz
#23 ilac 2 - | antikoagülan köprüleme
S: Mekanik mitral kapaklı hastada elektif cerrahi öncesi antikoagülan yönetimi?
+ warfarinin kesilmesi (5 gün) ; yüksek tromboembolik riskte (mekanik mitral) LMWH / UFH ile köprüleme ; cerrahi sonrası kanama kontrolü sağlanınca yeniden başlama ; NOAK mekanik kapakta kullanılmaz
- köprüleme gereksiz ; NOAK ile köprüleme
#24 kilavuz 2 - | TAVİ endikasyonu
S: Ağır aort darlığında TAVİ ve cerrahi AVR seçimi?
+ kalp takımı kararı ; yaş (genellikle ≥75 TAVİ lehine), cerrahi risk, anatomi ; yaşam beklentisi ve kapak dayanıklılığı ; transfemoral uygunluk
- tüm genç hastalara TAVİ ; kalp takımı gereksiz
#25 kirmizi 2 - | pulmoner emboli cerrahi
S: Yüksek riskli PE'de tromboliz kontrendike. Seçenek?
+ cerrahi pulmoner embolektomi ; kateter yönlendirmeli tedavi ; ECMO desteği ; deneyimli merkez
- tromboliz kontrendikasyona rağmen verilir ; yalnız oral antikoagülan
#26 yaygin 2 - | torasik çıkış sendromu
S: Kol kaldırmakla artan el uyuşması, soğukluk ve ağrı. Ne düşünürsün?
+ torasik çıkış sendromu (nörojenik / venöz / arteriyel) ; provokasyon testleri, görüntüleme ; fizyoterapi nörojenik formda ; venöz / arteriyel formda cerrahi (kot rezeksiyonu)
- karpal tünel kesin ; görüntüleme gereksiz
#27 tuzak 2 - | aspirin PAH tek başına
S: Asemptomatik düşük ABI'si olan hastada rutin aspirin + klopidogrel ikili tedavi gerekli mi?
+ asemptomatik PAH'ta antiplatelet tartışmalı / bireysel ; semptomatik PAH'ta tek antiplatelet ; seçilmiş yüksek riskte düşük doz rivaroksaban + aspirin ; rutin DAPT önerilmez (revaskülarizasyon sonrası hariç)
- tüm PAH'larda ömür boyu DAPT ; statin gereksiz
#28 kirmizi 2 - | mezenter iskemi
S: Akut mezenter iskemide cerrahi ilkeler?
+ acil revaskülarizasyon (embolektomi / endovasküler) ; nekrotik barsak rezeksiyonu ; ikinci bakış laparotomisi ; antikoagülasyon
- konservatif izlem ; görüntüleme sonrası günler sonra cerrahi
#29 kilavuz 2 - | kompresyon tedavisi
S: Venöz ülserde kompresyon öncesi neden ABI ölçülmeli?
+ arteriyel hastalıkta kompresyon iskemi yapabilir ; ABI <0,5'te güçlü kompresyon kontrendike ; 0,5–0,8'de düşük basınç ; venöz ülser tedavisinin temeli kompresyon
- ABI gereksiz ; tüm ülserlerde yüksek basınç kompresyon
#30 ilac 2 - | statin perioperatif
S: Vasküler cerrahi öncesi statin tedavisi?
+ vasküler cerrahi hastalarında statin sürdürülmeli / başlanmalı ; perioperatif kardiyovasküler olayları azaltır ; ameliyat günü kesilmez
- cerrahi öncesi kesilir ; vasküler hastalıkta statin gereksiz
`,
} satisfies BankaKaynagi
