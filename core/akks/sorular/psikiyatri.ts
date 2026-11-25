import type { BankaKaynagi } from '../banka'

/** AKKS — Psikiyatri. 30 draft items (Claude, 2026-11-24). Needs clinician review. */
export default {
  brans: 'psikiyatri',
  onek: 'PSI',
  metin: String.raw`
#1 kirmizi 3 - | intihar riski
S: Depresyonlu hasta intihar planı olduğunu ve elinde ilaç biriktirdiğini söylüyor. Yaklaşım?
+ yüksek akut intihar riski ; güvenliğin sağlanması, yalnız bırakmama ; acil psikiyatrik değerlendirme ve gerektiğinde yatış ; araç-yöntem kısıtlaması (ilaçların uzaklaştırılması) ; aile / yakınların bilgilendirilmesi
- intihar sorgulamak riski artırır, konuşulmaz ; reçeteyle eve gönderilir
#2 kilavuz 2 dernek-tpd | depresyon tedavisi
S: Orta şiddette majör depresyonda ilk basamak tedavi?
+ SSRİ (ör. sertralin, essitalopram) ilk seçenek ; psikoterapi (BDT) tek başına veya kombine ; yanıt için 4–6 hafta, remisyon sonrası en az 6–12 ay idame ; gençlerde ilk haftalarda intihar düşüncesi izlemi
- 1 hafta yanıt yoksa ilaç değiştirilir ; düzelince hemen kesilir
#3 kirmizi 3 - | serotonin sendromu
S: SSRİ kullanan hastaya tramadol eklendikten sonra ajitasyon, hipertermi, klonus. Ne düşünürsün?
+ serotonin sendromu ; serotonerjik ilaçların kesilmesi ; destek tedavisi, soğutma, benzodiazepin ; ağır vakada siproheptadin, yoğun bakım ; MAOİ, triptan, linezolid etkileşimleri
- SSRİ dozu artırılır ; nöroleptik malign sendrom gibi haloperidol
#4 ilac 3 - | lityum
S: Lityum tedavisinde hangi izlemler yapılır?
+ serum düzeyi (idame ~0,6–0,8 mmol/L), 12 saatlik ; böbrek fonksiyonu ve tiroid ; NSAİİ, ACEİ, tiyazid etkileşimi (düzey artışı) ; toksisite bulguları (tremor, ataksi, konfüzyon) ; dehidratasyonda dikkat
- lityum düzeyi izlenmez ; NSAİİ ile güvenle kombine
#5 kilavuz 2 dernek-tpd | bipolar mani
S: Akut mani tedavisinde ilk seçenekler?
+ lityum, valproat veya atipik antipsikotik ; antidepresan monoterapisi kontrendike (mani tetikler) ; uyku ve güvenlik ; ağırda kombinasyon / yatış
- antidepresan ile başlanır ; benzodiazepin tek başına idame
#6 kirmizi 2 - | deliryum
S: Postop yaşlı hastada akut başlangıçlı, dalgalı bilinç ve dikkat bozukluğu. Yaklaşım?
+ deliryum ; altta yatan nedenin araştırılması (enfeksiyon, ilaç, metabolik, ağrı, retansiyon) ; non-farmakolojik önlemler (oryantasyon, uyku, gözlük / işitme cihazı) ; ilaç gerekirse düşük doz antipsikotik kısa süre ; benzodiazepinden kaçınma (alkol yoksunluğu hariç)
- benzodiazepin ilk seçenek ; demans, tetkik gereksiz
#7 kirmizi 3 - | alkol yoksunluğu
S: Ağır alkol kullanan hastada 2. günde tremor, terleme, taşikardi ve halüsinasyon. Tedavi?
+ alkol yoksunluk sendromu (CIWA-Ar) ; benzodiazepin (semptom tetiklemeli veya sabit doz) ; glukozdan önce tiamin ; deliryum tremens riski, sıvı-elektrolit ; nöbet profilaksisi benzodiazepinle
- haloperidol tek başına ; tiamin glukozdan sonra
#8 ilac 2 - | antipsikotik metabolik
S: Atipik antipsikotik başlayan hastada metabolik izlem?
+ başlangıçta kilo / bel çevresi, KB, açlık glukozu / HbA1c, lipid ; ilk 3 ay sık, sonra yıllık ; olanzapin / klozapin yüksek risk ; yaşam tarzı ve gerekirse metformin
- metabolik izlem gerekmez ; tüm antipsikotikler eşit riskli
#9 ilac 3 - | klozapin
S: Klozapin kullanan hastada en önemli güvenlik izlemi?
+ agranülositoz riski: düzenli mutlak nötrofil sayısı izlemi (başta haftalık) ; miyokardit (ilk haftalar) ; nöbet, konstipasyon / ileus ; sigara bırakma düzeyi artırır ; Türkiye'de raporlu kullanım
- hemogram izlemi gerekmez ; ilk seçenek antipsikotik
#10 yaygin 2 - | yaygın anksiyete
S: Yaygın anksiyete bozukluğunda tedavi?
+ SSRİ / SNRİ ilk seçenek ; BDT ; benzodiazepin yalnız kısa süreli, bağımlılık riski ; pregabalin seçenek ; uyku hijyeni, kafein azaltma
- uzun süreli benzodiazepin ilk seçenek ; psikoterapi etkisiz
#11 kilavuz 2 sb-kp-anksiyete | SB Anksiyete Bozuklukları KP
S: Panik bozukluğunda farmakolojik ve psikoterapötik tedavi?
+ SSRİ (düşük dozla başlama, ilk hafta aktivasyon) ; BDT birinci basamak ; benzodiazepin kısa süreli köprü ; organik nedenlerin (tiroid, aritmi) dışlanması
- ömür boyu benzodiazepin ; organik değerlendirme gereksiz
#12 tuzak 2 - | benzodiazepin yaşlı
S: Uykusuzluğu olan 80 yaşında hastaya uzun etkili benzodiazepin başlamak uygun mu?
+ yaşlıda benzodiazepinler düşme, kırık, bilişsel bozulma, deliryum riski (Beers) ; uykusuzlukta BDT-İ birinci basamak ; uyku hijyeni ; gerekirse kısa süreli ve daha güvenli alternatifler
- diazepam yaşlıda ilk seçenek ; süresiz kullanım güvenli
#13 kirmizi 2 - | psikoz ilk atak
S: 22 yaşında ilk kez halüsinasyon ve sanrıları olan hastada değerlendirme?
+ organik nedenler: madde kullanımı, tiroid, nörolojik (MR / gerekirse EEG), metabolik ; düşük doz atipik antipsikotik ; güvenlik ve intihar riski ; erken müdahale programı / aile psikoeğitimi
- tetkik gerekmez, yüksek doz tipik antipsikotik ; madde sorgulanmaz
#14 ilac 2 - | antidepresan kesme
S: Paroksetini aniden bırakan hastada baş dönmesi, elektrik çarpması hissi ve irritabilite. Ne düşünürsün?
+ antidepresan kesilme sendromu ; ilacın yeniden başlanıp yavaş azaltılması ; kısa yarı ömürlü ajanlarda (paroksetin, venlafaksin) risk yüksek ; hasta eğitimi
- depresyon nüksü, doz iki katına ; ani kesmek güvenli
#15 kilavuz 2 sb-alkol-madde-protokolu | SB Alkol ve Madde KP (baskı doğrulanacak)
S: Opioid kullanım bozukluğunda kanıta dayalı farmakoterapi?
+ opioid agonist tedavisi (buprenorfin-nalokson, metadon) ; AMATEM / yetkili merkezler ; nalokson ile doz aşımı önleme ; psikososyal destek ; HCV / HIV taraması
- yalnız detoks tedavidir ; agonist tedavi bağımlılığı artırır, önerilmez
#16 yaygin 2 - | DEHB erişkin
S: Erişkin DEHB tanısı ve tedavisi?
+ çocukluktan başlayan belirtilerin öyküsü ve birden fazla alanda bozulma ; metilfenidat / atomoksetin ; kardiyovasküler değerlendirme ; Türkiye'de raporla reçete ; eşlik eden durumlar (madde, depresyon)
- çocukluk öyküsü gerekmez ; uyarıcılar kardiyak değerlendirmesiz
#17 kirmizi 2 - | anoreksiya yatış
S: Anoreksiya nervozalı hastada hangi bulgular tıbbi yatış gerektirir?
+ belirgin bradikardi (<40–50), hipotansiyon, ortostaz ; elektrolit bozukluğu (hipokalemi, hipofosfatemi) ; VKİ çok düşük / hızlı kilo kaybı ; senkop, aritmi, yeniden beslenme riski ; intihar riski
- yatış gerekmez, diyet önerisi yeterli ; bradikardi sporcularda normal, önemsiz
#18 ilac 3 - | gebelikte psikotrop
S: Depresyon nedeniyle sertralin kullanan kadın gebe kaldı. Ne önerirsin?
+ ani kesme önerilmez (nüks riski) ; sertralin gebelikte en çok veri olanlardan ; risk-yarar paylaşımlı karar ; valproat (bipolar) kaçınılır ; yenidoğan uyum sendromu farkındalığı
- gebelik saptanınca tüm psikotroplar hemen kesilir ; valproat gebelikte güvenli
#19 sgk 2 sgk-sut | SUT psikiyatri ilaç raporları (güncel madde doğrulanacak)
S: Uzun etkili enjektabl antipsikotikler ve uyarıcılar SGK'da nasıl reçete edilir?
+ psikiyatri uzmanı raporu ; uyarıcılar kırmızı / turuncu reçete ve rapor koşulları ; tedavi süresi ve doz bilgisinin raporda yer alması ; güncel SUT ve reçete mevzuatından doğrulanmalı
- herhangi bir hekim beyaz reçeteyle metilfenidat yazar ; rapor gerekmez
#20 tuzak 2 - | tipik antipsikotik yaşlı demans
S: Demansa bağlı ajitasyonda antipsikotikler rutin ve uzun süreli verilmeli mi?
+ önce non-farmakolojik yaklaşım ve tetikleyiciler (ağrı, enfeksiyon) ; antipsikotikler demanslı yaşlıda inme ve mortalite riskini artırır ; gerekiyorsa en düşük doz, kısa süre, düzenli gözden geçirme
- tüm demans hastalarına haloperidol idame ; risk yoktur
#21 yaygin 2 - | OKB
S: Obsesif kompulsif bozuklukta tedavi?
+ SSRİ (depresyondan daha yüksek dozlar, yanıt daha geç) ; maruz bırakma ve tepki önleme (ERP) BDT ; klomipramin seçenek ; dirençte antipsikotik augmentasyonu
- benzodiazepin ilk seçenek ; düşük doz SSRİ 2 hafta yeterli
#22 kirmizi 3 - | lityum toksisitesi
S: Lityum kullanan hastada ishal-kusma sonrası kaba tremor, ataksi ve konfüzyon. Ne yaparsın?
+ lityum toksisitesi ; lityumu kesme, serum düzeyi, böbrek fonksiyonu ; hidrasyon ; ağır vakada hemodiyaliz ; yoğun izlem
- doz artırılır ; aktif kömür lityumu bağlar
#23 yaygin 2 - | TSSB
S: Travma sonrası stres bozukluğunda ilk basamak tedavi?
+ travma odaklı psikoterapi (TF-BDT, EMDR) ; SSRİ / venlafaksin seçenek ; benzodiazepinlerden kaçınma ; kâbuslar için prazosin seçilmiş hastada
- benzodiazepin ilk seçenek ; erken zorunlu psikolojik debriefing herkese
#24 kilavuz 2 - | zorunlu yatış
S: Kendine / başkasına zarar verme riski olan ve tedaviyi reddeden psikotik hastada yasal çerçeve?
+ Türk Medeni Kanunu ve ilgili mevzuat çerçevesinde zorunlu yatış / koruma ; acil durumda geçici yatış ve sonra yasal süreç (mahkeme) ; hastanın hakları ve kayıt ; güvenlik
- hekim süresiz zorunlu yatış kararı verir ; yasal süreç gerekmez
#25 ilac 2 - | QT antipsikotik
S: QT'si uzun hastada hangi antipsikotikler daha risklidir?
+ haloperidol IV, ziprasidon, tiyoridazin, ketiapin daha riskli ; aripiprazol daha düşük risk ; EKG ve elektrolit izlemi ; diğer QT uzatan ilaçlarla kombinasyondan kaçınma
- antipsikotiklerin QT etkisi yoktur ; EKG gereksiz
#26 yaygin 2 - | postpartum depresyon
S: Doğum sonrası 6. haftada depresif belirtiler; emziren annede tedavi?
+ Edinburgh ölçeği ile tarama ; psikoterapi ; sertralin emzirmede tercih edilebilir ; intihar ve bebeğe zarar riski sorgulanır ; destek sistemleri
- doğum hüznü, tedavi gerekmez ; emziren annede tüm antidepresanlar kontrendike
#27 kirmizi 2 - | katatoni
S: Hareketsiz, konuşmayan, katalepsi gösteren hastada ilk tedavi?
+ katatoni ; lorazepam deneme / tedavi ; organik nedenler ve NMS ayırıcı tanısı ; yanıtsızlıkta EKT ; antipsikotiklerden başlangıçta kaçınma
- yüksek doz haloperidol ; tedavi gerekmez
#28 tuzak 3 - | SSRİ ergen
S: Ergende depresyon tedavisinde SSRİ kullanımı tamamen yasak mı?
+ SSRİ (fluoksetin, essitalopram) ergende kullanılabilir ; ilk haftalarda intihar düşüncesi açısından yakın izlem (kutu uyarısı) ; psikoterapi ile birlikte ; risk-yarar değerlendirmesi
- ergenlerde antidepresan kesin kontrendike ; izlem gerekmez
#29 yaygin 2 - | uykusuzluk
S: Kronik insomnide birinci basamak tedavi?
+ insomni için bilişsel davranışçı terapi (BDT-İ) ; uyku hijyeni ; eşlik eden durumların (depresyon, OSAS, ağrı) tedavisi ; ilaç kısa süreli, en düşük doz
- uzun süreli benzodiazepin ilk seçenek ; alkol uyku için önerilir
#30 kirmizi 2 - | ajitasyon acil
S: Acil serviste ajite, saldırgan hastada yaklaşım?
+ önce sözel de-eskalasyon ve güvenli ortam ; organik nedenlerin (hipoglisemi, hipoksi, intoksikasyon) dışlanması ; gerekirse oral → IM ilaç (benzodiazepin / antipsikotik) ; fiziksel tespit son çare, mevzuata uygun ve izlemle
- ilk adım fiziksel tespit ; organik değerlendirme gereksiz
`,
} satisfies BankaKaynagi
