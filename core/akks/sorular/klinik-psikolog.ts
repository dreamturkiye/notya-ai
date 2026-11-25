import type { BankaKaynagi } from '../banka'

/** AKKS — Klinik Psikoloji (Özel Branşlar, allied). 30 draft items (Claude, 2026-11-24). Scope: clinical psychologist's
 *  legal role — no prescribing, risk → physician / psychiatry. Needs clinician review. */
export default {
  brans: 'klinik-psikolog',
  onek: 'KPS',
  metin: String.raw`
#1 kirmizi 3 - | intihar riski
S: Danışan seansta intihar planı olduğunu söylüyor. Ne yaparsın?
+ doğrudan ve açık risk değerlendirmesi (plan, araç, niyet, zaman) ; yüksek riskte güvenliğin sağlanması ve acil psikiyatri / 112 ; güvenlik planı ; gizlilik istisnası (yaşam tehlikesi) ; kayıt
- intihar sorgulamak riski artırır ; gizlilik nedeniyle kimseye bildirilmez
#2 kilavuz 2 yonetmelik-is-ve-gorev-tanimlari | İş ve Görev Tanımları Yönetmeliği
S: Klinik psikoloğun görev ve yetki sınırları?
+ psikolojik değerlendirme ve psikoterapi ; ilaç reçete edemez ; tıbbi / psikiyatrik ilaç kararları psikiyatriste ; gerektiğinde yönlendirme ve ekip çalışması
- psikolog antidepresan önerebilir ; tanı ve ilaç kararını tek başına verir
#3 yaygin 2 - | depresyon BDT
S: Hafif-orta depresyonda kanıta dayalı psikoterapiler?
+ bilişsel davranışçı terapi ; davranışsal aktivasyon ; kişilerarası terapi ; ölçme araçlarıyla izlem (PHQ-9, BDI) ; orta-ağırda psikiyatri ile kombine tedavi değerlendirmesi
- psikoterapi depresyonda etkisiz ; ağır depresyonda yalnız psikoterapi her zaman yeterli
#4 kirmizi 2 - | psikotik belirti
S: Danışanda yeni başlayan işitsel halüsinasyon ve şüphecilik. Ne yaparsın?
+ psikiyatriye yönlendirme (ilk atak psikoz) ; organik / madde nedenlerinin dışlanması için hekim değerlendirmesi ; güvenlik ve risk ; aile psikoeğitimi
- yalnız psikoterapiyle izlem ; organik değerlendirme gereksiz
#5 yaygin 2 - | panik bozukluk
S: Panik bozuklukta psikoterapi?
+ BDT (psikoeğitim, interoseptif maruz bırakma, bilişsel yeniden yapılandırma) ; organik nedenlerin hekimce dışlanması ; kaçınma davranışlarının ele alınması
- organik değerlendirme gereksiz ; kaçınma önerilir
#6 yaygin 2 - | OKB
S: OKB'de kanıta dayalı psikoterapi?
+ maruz bırakma ve tepki önleme (ERP) ; BDT ; ağır vakalarda psikiyatri ile ilaç kombinasyonu ; aile katılımı
- güvence vermek kompulsiyonu tedavi eder ; ERP zararlı
#7 kirmizi 2 - | çocuk istismarı bildirim
S: Çocuk danışan istismara uğradığını anlatıyor. Yükümlülük?
+ yasal bildirim yükümlülüğü ; çocuğun güvenliği ; Çocuk İzlem Merkezi / sosyal hizmet / adli makamlar ; çocuğa tekrar tekrar sorgulama yapmama ; kayıt
- gizlilik nedeniyle bildirim yapılmaz ; aileyle yüzleştirme
#8 yaygin 2 - | TSSB
S: TSSB'de kanıta dayalı terapiler?
+ travma odaklı BDT ; EMDR ; uzun süreli maruz bırakma ; bilişsel işleme terapisi ; erken zorunlu debriefing önerilmez
- herkese erken zorunlu debriefing ; maruz bırakma zararlı
#9 kirmizi 2 - | yeme bozukluğu tıbbi risk
S: Anoreksiya nervozalı danışanda bayılma ve çok düşük kilo. Ne yaparsın?
+ tıbbi aciliyet ; hekime / acile yönlendirme (bradikardi, elektrolit) ; multidisipliner tedavi ; psikoterapiye tıbbi stabilite sonrası devam
- yalnız psikoterapi ; tıbbi değerlendirme gereksiz
#10 yaygin 2 - | insomni BDT-İ
S: Kronik insomnide psikolojik tedavi?
+ BDT-İ birinci basamak ; uyaran kontrolü, uyku kısıtlama, bilişsel teknikler, uyku hijyeni ; OSAS şüphesinde hekime yönlendirme
- ilk seçenek ilaç ; uyku günlüğü gereksiz
#11 tuzak 2 - | psikolojik test
S: Tek bir projektif test sonucuna dayanarak kesin tanı konulabilir mi?
+ tanı klinik görüşme, öykü ve standartlaştırılmış araçlarla bütüncül ; tek test kesin tanı koydurmaz ; testlerin geçerlik / güvenirliği ; kültürel uygunluk
- tek test yeterli ; görüşme gereksiz
#12 kirmizi 2 - | şiddet riski
S: Danışan belirli bir kişiye zarar vereceğini söylüyor. Ne yaparsın?
+ risk değerlendirmesi ; üçüncü kişiyi koruma yükümlülüğü ve gizlilik istisnası ; acil durumda yetkili makamlar ; danışmanlık / süpervizyon ; kayıt
- gizlilik nedeniyle hiçbir şey yapılmaz ; danışanla tartışıp bırakma
#13 yaygin 2 - | yaygın anksiyete
S: Yaygın anksiyete bozukluğunda psikoterapi?
+ BDT (endişe maruziyeti, problem çözme) ; gevşeme ve farkındalık ; uyku ve kafein ; orta-ağırda psikiyatri ile birlikte
- benzodiazepin önerisi ; psikoterapi etkisiz
#14 kilavuz 2 dernek-psikologlar | Türk Psikologlar Derneği Etik Yönetmeliği
S: Psikoterapide gizlilik ilkesinin istisnaları?
+ danışanın veya başkasının yaşamı için ciddi tehlike ; çocuk / korunmaya muhtaç istismarı ; yasal zorunluluk (mahkeme kararı) ; danışanın yazılı onayı ; danışana başta açıklanması
- gizlilik mutlaktır, istisna yok ; aileye her şey anlatılır
#15 yaygin 2 - | DEHB çocuk
S: DEHB'li çocukta psikososyal müdahaleler?
+ ebeveyn eğitimi (davranış yönetimi) ; okul iş birliği ; çocuk psikiyatrisi ile ilaç değerlendirmesi ; eşlik eden durumlar
- ilaç kararını psikolog verir ; ebeveyn eğitimi etkisiz
#16 kirmizi 2 - | bipolar mani
S: Danışanda azalmış uyku ihtiyacı, büyüklük düşünceleri ve riskli davranışlar. Ne yaparsın?
+ olası manik atak ; psikiyatriye acil yönlendirme ; güvenlik ve risk ; aile bilgilendirmesi (onay / risk çerçevesinde)
- yalnız psikoterapi ; normal enerji artışı
#17 yaygin 2 - | yas
S: Normal yas ile uzamış yas bozukluğu ayrımı?
+ normal yas zamanla azalır, işlevsellik korunur ; uzamış yas: 12 ay (çocukta 6) sonra yoğun özlem / meşguliyet ve işlev kaybı ; yas odaklı terapi ; intihar riski değerlendirmesi
- her yas patolojiktir ; yasta antidepresan şart
#18 tuzak 2 - | dönüştürme terapisi
S: Cinsel yönelimi "değiştirme" amaçlı terapi uygulanabilir mi?
+ meslek örgütleri tarafından etik dışı ve zararlı kabul edilir ; bilimsel geçerliliği yok ; danışan merkezli, yargısız destek ; ruh sağlığı sorunlarına odaklanma
- etkili ve önerilir ; aile isterse uygulanır
#19 kirmizi 2 - | madde kullanımı
S: Alkol bağımlılığı olan danışan aniden içmeyi bırakmak istiyor. Ne önerirsin?
+ ağır kullanımda ani bırakma tehlikeli yoksunluk (nöbet, deliryum) riski ; hekim / AMATEM gözetiminde detoks ; motivasyonel görüşme ; nüks önleme
- evde aniden bırakması güvenli ; tıbbi destek gereksiz
#20 yaygin 2 - | otizm
S: Otizmli çocukta erken müdahale yaklaşımları?
+ erken yoğun davranışsal / gelişimsel müdahaleler ; ebeveyn aracılı programlar ; dil-konuşma ve ergoterapi ile multidisipliner ; bireyselleştirilmiş eğitim
- kanıtsız diyet / şelasyon tedavileri ; müdahale okul çağında başlar
#21 kilavuz 2 - | çocuk ve ergen onam
S: Ergen danışanla çalışırken onam ve gizlilik?
+ yasal temsilcinin onamı (yaşa göre mevzuat) ; ergenin de bilgilendirilmesi ve katılımı ; gizliliğin sınırlarının başta açıklanması ; risk durumunda aileye bilgi
- yasal temsilci onamı gereksiz ; ergenin söylediği her şey aileye aktarılır
#22 yaygin 2 - | kronik ağrı psikolojik
S: Kronik ağrıda psikolojik müdahaleler?
+ BDT ve kabul-kararlılık terapisi (ACT) ; ağrı nörobilimi eğitimi ; aktivite düzenleme ; multidisipliner ekip
- ağrı tamamen psikolojiktir ; psikolojik müdahale etkisiz
#23 kirmizi 2 - | postpartum
S: Doğum sonrası anne bebeğine zarar verme düşünceleri ve konfüzyon yaşıyor. Ne yaparsın?
+ postpartum psikoz olasılığı (psikiyatrik acil) ; anne-bebek güvenliği ; acil psikiyatri ; doğum sonrası depresyon / obsesif düşüncelerden ayırım
- doğum hüznü ; anne bebekle yalnız bırakılır
#24 sgk 1 - | psikoterapi SGK
S: Serbest çalışan klinik psikolog seanslarının SGK kapsamı?
+ serbest psikoterapi seansları genellikle SGK kapsamında değildir ; hastanelerde verilen hizmetler kurum işlemi ; şeffaf ücret bilgilendirmesi ; güncel mevzuattan doğrulanmalı
- tüm seanslar SGK'ca ödenir ; psikolog e-reçete yazar
#25 yaygin 2 - | ölçüm temelli bakım
S: Psikoterapide ölçüm temelli bakımın yararı?
+ düzenli standart ölçeklerle (PHQ-9, GAD-7) izlem ; kötüleşmenin erken fark edilmesi ; tedavi planının ayarlanması ; danışanla paylaşım
- ölçek kullanımı gereksiz ; yalnız izlenim
#26 tuzak 2 - | travma hatıra geri getirme
S: Hipnozla "bastırılmış travma anılarını" ortaya çıkarmak güvenilir mi?
+ sahte anı oluşturma riski ; bilimsel dayanak zayıf ; travma odaklı kanıtlı terapiler tercih ; etik dikkat
- hipnozla çıkarılan anılar kesin doğrudur ; tüm danışanlara uygulanmalı
#27 kirmizi 2 - | kendine zarar
S: Ergende kendine zarar verme (kesme) davranışı. Yaklaşım?
+ yargısız iletişim ve risk değerlendirmesi (intihar düşüncesi) ; yara için tıbbi değerlendirme ; DBT temelli beceriler ; aile ve psikiyatri iş birliği
- dikkat çekme davranışı, görmezden gel ; aileye bilgi verilmez
#28 yaygin 2 - | süpervizyon
S: Karmaşık vakalarda süpervizyon / konsültasyonun önemi?
+ danışan güvenliği ve tedavi kalitesi ; yetkinlik sınırlarının farkındalığı ; etik ikilemler ; gizlilik korunarak vaka tartışması
- deneyimli psikolog süpervizyona ihtiyaç duymaz ; vaka kimlik bilgileriyle paylaşılır
#29 yaygin 2 - | yaşlı bilişsel
S: Unutkanlık yakınması olan yaşlı danışanda yaklaşım?
+ bilişsel tarama (MoCA vb.) ; depresyon ayırıcı tanısı ; geri dönüşümlü tıbbi nedenler için hekime yönlendirme ; bakım veren desteği
- yaşlılıkta unutkanlık normal, değerlendirme gereksiz ; ilaç önerisi
#30 tuzak 2 - | online terapi
S: Online psikoterapi yüz yüze terapi kadar etkili olabilir mi?
+ birçok durumda (depresyon, anksiyete) benzer etkinlik kanıtı ; gizlilik ve veri güvenliği ; acil durum planı ve danışanın konumu ; uygun olmayan durumlar (akut risk)
- online terapi hiçbir zaman etkili değildir ; acil plan gereksiz
`,
} satisfies BankaKaynagi
