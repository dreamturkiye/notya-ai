/**
 * BRANS-PAKETI Phase 2 batch (b) — internal-medicine family: kardiyoloji, dahiliye, endokrinoloji, aile hekimliği,
 * nefroloji, gastroenteroloji, romatoloji, enfeksiyon hastalıkları, onkoloji, göğüs hastalıkları.
 * Builds ON the Bugün measurements (BP, glucose, weight, pulse, SpO₂, fever — resolved per patient by HASTA-MODULLERI):
 * a diary here never re-asks a number Bugün already takes; it points there. Condition modules switch on from the
 * diagnosis / ICD-10 / APPROVED medicine list on file (conservative patterns; the doctor's off wins). Physician-accepted
 * templates; no diagnosis, no dose; 112 on every acil line. Sources: docs/kaynak/TIBBI-BRANS-PAKETI-ARASTIRMA.md.
 */
import type { PaketAlan, PaketBayrak, PaketModulTanimi } from '../bransPaketi'
import { ACIL_112, ANAFILAKSI_ALANI, ANAFILAKSI_BAYRAGI } from './ortak'
import { ILAC_DESENLERI } from '@/specialties/diyetisyen/engines/ilacBesin'

const ANTIKOAGULAN = /warfarin|coumadin|rivaroksaban|rivaroxaban|xarelto|apiksaban|apixaban|eliquis|dabigatran|pradaxa|edoksaban|edoxaban|lixiana/i
const HIPO_ILAC = /ins[uü]lin|lantus|levemir|tresiba|toujeo|abasaglar|novorapid|humalog|apidra|fiasp|lyumjev|humulin|mixtard|novomix|ryzodeg|glimepirid|amaryl|gliklazid|diamicron|glibenklamid|gliben|glipizid|repaglinid|novonorm/i
const DIYABET = { tani: /diyabet|diabet|şeker hastal/i, icd: /^E1[0-4]/ }
const IMMUNSUPRESAN = /metotreksat|methotrexate|leflunomid|arava|sulfasalazin|salazopyrin|hidroksiklorokin|plaquenil|azatioprin|imuran|mikofenolat|cellcept|siklosporin|takrolimus|adalimumab|humira|hyrimoz|amgevita|infliksimab|infliximab|remicade|remsima|etanersept|etanercept|enbrel|golimumab|simponi|sertolizumab|cimzia|tosilizumab|tocilizumab|actemra|abatasept|abatacept|orencia|rituksimab|rituximab|mabthera|sekukinumab|secukinumab|cosentyx|iksekizumab|ixekizumab|taltz|tofasitinib|tofacitinib|xeljanz|baricitinib|olumiant|upadasitinib|upadacitinib|rinvoq|vedolizumab|entyvio|ustekinumab|stelara/i

/** Infection vigilance under immunosuppressive / biologic treatment — the same lines in every branş that uses it. */
function tedaviIzlemi(kod: string, brans: PaketModulTanimi['brans'], kaynaklar: string[]): PaketModulTanimi {
  return {
    kod, brans, tur: 'hatirlatma', durum: { ilac: IMMUNSUPRESAN }, baslik: 'Tedavi izlem hatırlatmalarım',
    aciklama: 'Hekiminizin bağışıklığı etkileyen tedaviniz için planladığı izlem. Uygulama saatleriniz İlaç takvimi bölümündedir.',
    varsayilan: {
      maddeler: [
        'Hekiminizin istediği kan tahlillerini ve kontrolleri planlanan tarihlerde yaptırın.',
        'Ateş, geçmeyen öksürük, idrarda yanma ya da iyileşmeyen yara gibi enfeksiyon belirtilerinde hekiminize yazın.',
        'Herhangi bir aşı olmadan önce hekiminize danışın.',
        'Ameliyat, diş çekimi ya da gebelik planı varsa tedavinizi hekiminizle konuşun.',
      ],
      alanlar: [{ id: 'enfeksiyon', etiket: 'Ateş ya da enfeksiyon belirtisi', tur: 'evet' }, ANAFILAKSI_ALANI],
      bayraklar: [
        ANAFILAKSI_BAYRAGI,
        { id: 'enfeksiyon', kosullar: [{ alan: 'enfeksiyon', evet: true }], duzey: 'hekime_bildir', hasta: 'Enfeksiyon belirtisini hekiminize ilettik. Bir sonraki uygulamanız yaklaşıyorsa önce hekiminize danışın.', hekim: 'Tedavi izlemi: ateş / enfeksiyon belirtisi (immünsüpresif / biyolojik tedavi).' },
      ],
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel izlem satırları (ör. "Kan tahlili — 15 Ocak"; doz yazılmaz)', tur: 'satirlar' }],
    kaynaklar,
  }
}

const HIPO_ALANLAR: PaketAlan[] = [
  { id: 'belirti', etiket: 'Titreme, terleme, çarpıntı ya da ani açlık hissi', tur: 'evet' },
  { id: 'gece', etiket: 'Gece terleyerek ya da kâbusla uyandım', tur: 'evet' },
  { id: 'duzeldi', etiket: 'Hızlı şeker aldım ve düzeldim', tur: 'evet' },
  { id: 'bilinc', etiket: 'Bilinç bulanıklığı, konuşma bozukluğu ya da nöbet (yakınınız işaretleyebilir)', tur: 'evet' },
]
const HIPO_BAYRAKLAR: PaketBayrak[] = [
  { id: 'bilinc', kosullar: [{ alan: 'bilinc', evet: true }], duzey: 'acil', hasta: 'Bilinci bulanık bir kişiye ağızdan bir şey vermeyin; yan yatırın ve hemen 112’yi arayın.', hekim: 'Hipoglisemi günlüğü: bilinç bulanıklığı / nöbet (ağır hipoglisemi).' },
  { id: 'belirti', kosullar: [{ alan: 'belirti', evet: true }], duzey: 'hekime_bildir', hasta: 'Şekerinizi ölçüp Bugün sayfasına girin. Düşükse hekiminizin öğrettiği şekilde hızlı şeker alın ve 15 dakika sonra yeniden ölçün. Hekiminize ilettik.', hekim: 'Hipoglisemi günlüğü: otonom hipoglisemi belirtileri.' },
  { id: 'gece', kosullar: [{ alan: 'gece', evet: true }], duzey: 'hekime_bildir', hasta: 'Gece şeker düşmesi olabilir. Hekiminize ilettik; ilaç saatleriniz gözden geçirilebilir.', hekim: 'Hipoglisemi günlüğü: gece hipoglisemisi şüphesi.' },
]

// ─── Kardiyoloji ────────────────────────────────────────────────────────────────────────────────────────────────────
export const KARDIYOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'kar-ky', brans: 'kardiyoloji', tur: 'gunluk', durum: { tani: /kalp yetmezli|kalp yetersizli/i, icd: /^I50/ }, baslik: 'Kalp yetmezliği günlüğüm',
    aciklama: 'Her gün aynı saatte nefesinizi ve şişliği kaydedin. Kötüleşmeyi erken fark etmek hastaneye yatışı önleyebilir.',
    varsayilan: {
      alanlar: [
        { id: 'nefes', etiket: 'Nefes darlığı', tur: 'olcek' },
        { id: 'sislik', etiket: 'Ayak bileklerimde şişlik arttı', tur: 'evet' },
        { id: 'yastik', etiket: 'Yatınca nefesim daralıyor, fazladan yastıkla uyuyorum', tur: 'evet' },
        { id: 'gece', etiket: 'Gece nefes darlığıyla uyandım', tur: 'evet' },
        { id: 'gogus', etiket: 'Dinlenirken geçmeyen göğüs ağrısı ya da baskı', tur: 'evet' },
        { id: 'bayilma', etiket: 'Bayıldım ya da bayılacak gibi oldum', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'gogus', kosullar: [{ alan: 'gogus', evet: true }], duzey: 'acil', hasta: `Dinlenirken geçmeyen göğüs ağrısı acildir: hemen ${ACIL_112} Kendiniz araç kullanmayın.`, hekim: 'KY günlüğü: istirahatte göğüs ağrısı.' },
        { id: 'bayilma', kosullar: [{ alan: 'bayilma', evet: true }], duzey: 'acil', hasta: `Bayılma ya da bayılma hissi acil değerlendirilmelidir: ${ACIL_112}`, hekim: 'KY günlüğü: senkop / presenkop.' },
        { id: 'gece', kosullar: [{ alan: 'gece', evet: true }], duzey: 'hekime_bildir', hasta: 'Gece nefes darlığını hekiminize ilettik; bugün ulaşın. Konuşamayacak kadar nefes darlığında 112’yi arayın.', hekim: 'KY günlüğü: paroksismal noktürnal dispne.' },
        { id: 'yastik', kosullar: [{ alan: 'yastik', evet: true }], duzey: 'hekime_bildir', hasta: 'Yatınca artan nefes darlığını hekiminize ilettik.', hekim: 'KY günlüğü: ortopne.' },
        { id: 'sislik', kosullar: [{ alan: 'sislik', evet: true }], duzey: 'hekime_bildir', hasta: 'Artan şişliği hekiminize ilettik. Kilonuzu bu sabah Bugün sayfasından girdiniz mi?', hekim: 'KY günlüğü: periferik ödemde artış.' },
      ],
      not: 'Kilonuzu her sabah tuvaletten sonra, kahvaltıdan önce Bugün sayfasından girin; üç günde 2 kg artış hekiminize otomatik bildirilir.',
    },
    kaynaklar: ['ESC-KY-2026', 'TKD-ESC'],
  },
  {
    kod: 'kar-antikoag', brans: 'kardiyoloji', tur: 'gunluk', durum: { ilac: ANTIKOAGULAN }, baslik: 'Kanama işaretleri günlüğüm',
    aciklama: 'Kan sulandırıcı kullanırken dikkat edilecek işaretler. Bir şey fark ettiğinizde kaydedin; ne yapacağınızı hemen gösterir.',
    varsayilan: {
      alanlar: [
        { id: 'aldim', etiket: 'Kan sulandırıcımı bugün aldım', tur: 'evet' },
        { id: 'morluk', etiket: 'Nedensiz morluklar', tur: 'evet' },
        { id: 'dis', etiket: 'On dakikada durmayan diş eti ya da burun kanaması', tur: 'evet' },
        { id: 'idrar', etiket: 'İdrarda kan ya da kırmızı-kahverengi idrar', tur: 'evet' },
        { id: 'diski', etiket: 'Siyah, katran gibi dışkı ya da dışkıda kan', tur: 'evet' },
        { id: 'kusma', etiket: 'Kanlı ya da kahve telvesi gibi kusma', tur: 'evet' },
        { id: 'basagri', etiket: 'Ani, şiddetli baş ağrısı', tur: 'evet' },
        { id: 'dusme', etiket: 'Düştüm ya da başımı çarptım', tur: 'evet' },
        { id: 'inr', etiket: 'INR (ölçtüyseniz)', tur: 'sayi', min: 0.5, max: 10 },
      ],
      bayraklar: [
        { id: 'diski', kosullar: [{ alan: 'diski', evet: true }], duzey: 'acil', hasta: `Siyah dışkı ya da dışkıda kan iç kanama belirtisi olabilir: ${ACIL_112}`, hekim: 'Antikoagülan günlüğü: melena / hematokezya.' },
        { id: 'kusma', kosullar: [{ alan: 'kusma', evet: true }], duzey: 'acil', hasta: `Kanlı kusma acildir: hemen ${ACIL_112}`, hekim: 'Antikoagülan günlüğü: hematemez.' },
        { id: 'basagri', kosullar: [{ alan: 'basagri', evet: true }], duzey: 'acil', hasta: `Kan sulandırıcı kullanırken ani şiddetli baş ağrısı acildir: ${ACIL_112}`, hekim: 'Antikoagülan günlüğü: ani şiddetli baş ağrısı (intrakraniyal kanama?).' },
        { id: 'dusme', kosullar: [{ alan: 'dusme', evet: true }], duzey: 'acil', hasta: `Kan sulandırıcı kullanırken başınızı çarptıysanız şikâyetiniz olmasa da bugün acil servise başvurun; kusma, uyku hali ya da baş ağrısı varsa ${ACIL_112}`, hekim: 'Antikoagülan günlüğü: düşme / kafa travması.' },
        { id: 'dis', kosullar: [{ alan: 'dis', evet: true }], duzey: 'hekime_bildir', hasta: 'Uzun süren kanamayı hekiminize ilettik. Kanama durmuyorsa acile başvurun.', hekim: 'Antikoagülan günlüğü: uzamış mukozal kanama.' },
        { id: 'idrar', kosullar: [{ alan: 'idrar', evet: true }], duzey: 'hekime_bildir', hasta: 'İdrardaki kanı hekiminize ilettik; bugün değerlendirilmesi önerilir.', hekim: 'Antikoagülan günlüğü: hematüri.' },
        { id: 'morluk', kosullar: [{ alan: 'morluk', evet: true }], duzey: 'dikkat', hasta: 'Nedensiz morlukları bir sonraki kontrolde hekiminize gösterin; çoğalırsa yazın.', hekim: 'Antikoagülan günlüğü: nedensiz ekimoz.' },
      ],
      not: 'İlacınızı kendiniz kesmeyin. Yeni bir ilaç, bitkisel ürün ya da diş işlemi öncesi hekiminize kan sulandırıcı kullandığınızı söyleyin.',
    },
    kaynaklar: ['EHRA-NOAC-2021', 'TKD-ESC'],
  },
  {
    kod: 'kar-gogus-plani', brans: 'kardiyoloji', tur: 'liste', durum: { tani: /koroner|miyokard|enfarkt|anjina|stent|bypass/i, icd: /^I2[0-5]/ }, baslik: 'Göğüs ağrısı eylem planım',
    aciklama: 'Göğüs ağrısında ne yapacağınızı önceden bilin. Bu planı evdekilerle de paylaşın.',
    varsayilan: {
      maddeler: [
        'Dinlenirken beş dakikadan uzun süren göğüs ağrısı, baskı ya da sıkışma: 112’yi arayın.',
        'Ağrı kola, çeneye, sırta yayılıyor; terleme, bulantı ya da nefes darlığı eşlik ediyorsa: 112.',
        'Hekiminiz dil altı ilaç önerdiyse onun tarif ettiği şekilde kullanın.',
        'Hastaneye kendiniz araç kullanarak gitmeyin.',
        'Egzersizle gelen, dinlenince geçen yeni ya da artan ağrıyı hekiminize aynı gün yazın.',
      ],
    },
    kaynaklar: ['ESC-AKS-2023', 'ESC-KKS-2024', 'TKD-ESC'],
  },
  {
    kod: 'kar-rehab', brans: 'kardiyoloji', tur: 'program', varsayilanKapali: true, baslik: 'Kalp rehabilitasyonu ev programım',
    aciklama: 'Hekiminizin önerdiği ev egzersizleri. Konuşabileceğiniz tempoda başlayın, yaptıkça işaretleyin.',
    varsayilan: {
      maddeler: [
        'Isınma: birkaç dakika yavaş yürüyüş',
        'Hekiminizin önerdiği tempo ve sürede yürüyüş',
        'Soğuma: yavaş yürüyüş ve esneme',
        'Hafif direnç egzersizi (hekiminiz önerdiyse)',
      ],
      not: 'Göğüs ağrısı, baş dönmesi, düzensiz çarpıntı ya da aşırı nefes darlığında egzersizi bırakın; geçmezse 112’yi arayın.',
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel egzersiz satırları (süre ve tempo; doz yazılmaz)', tur: 'satirlar' }],
    kaynaklar: ['EAPC-REHAB-2021', 'ESC-KKS-2024'],
  },
]

// ─── Dahiliye ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const DAHILIYE_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'dah-hipo', brans: 'dahiliye', tur: 'gunluk', durum: { ilac: HIPO_ILAC }, baslik: 'Şeker düşmesi belirti günlüğüm',
    aciklama: 'İnsülin ya da bazı şeker ilaçlarıyla şeker düşebilir. Belirtileri kaydedin; ne yapacağınızı hemen gösterir.',
    varsayilan: { alanlar: HIPO_ALANLAR, bayraklar: HIPO_BAYRAKLAR, not: 'Şeker ölçümünüzü Bugün sayfasından girin; değerleriniz orada izlenir.' },
    kaynaklar: ['TEMD-DM', 'ADA-SOC'],
  },
  {
    kod: 'dah-ayak', brans: 'dahiliye', tur: 'program', durum: DIYABET, baslik: 'Günlük ayak bakımım',
    aciklama: 'Diyabette ayakları her gün kontrol etmek yaraları erken yakalar. Yaptıkça işaretleyin.',
    varsayilan: {
      maddeler: [
        'Ayaklarıma baktım (yara, kızarıklık, nasır, renk değişikliği)',
        'Ilık suyla yıkayıp parmak aralarını iyice kuruladım',
        'Ayakkabımın içini giymeden kontrol ettim, çıplak ayakla yürümedim',
      ],
      not: 'Ayağınızda yara, renk değişikliği ya da şişlik görürseniz aynı gün hekiminize yazın; ateşle birlikteyse acile başvurun. Nasırları kendiniz kesmeyin.',
    },
    kaynaklar: ['IWGDF-2023', 'TEMD-DM'],
  },
  {
    kod: 'dah-hasta-gun', brans: 'dahiliye', tur: 'liste', durum: { ...DIYABET, ilac: HIPO_ILAC }, baslik: 'Hasta gün kurallarım',
    aciklama: 'Ateş, kusma ya da ishal olduğunda diyabetinizi güvende tutmak için.',
    varsayilan: {
      maddeler: [
        'Şekerinizi her zamankinden daha sık ölçün ve Bugün sayfasına girin.',
        'Az az ve sık sıvı almaya devam edin.',
        'Kusma ya da ishal sürüyorsa bazı şeker ilaçlarına ara vermek gerekebilir; bunu hekiminize sorun.',
        'İnsülininizi hekiminiz söylemeden kesmeyin.',
        'Kusma durmuyorsa, nefesiniz hızlandıysa ya da bilinç bulanıklaştıysa 112’yi arayın.',
      ],
    },
    kaynaklar: ['TEMD-DM', 'ADA-SOC'],
  },
]

// ─── Endokrinoloji ──────────────────────────────────────────────────────────────────────────────────────────────────
export const ENDOKRINOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'end-tiroid', brans: 'endokrinoloji', tur: 'ilac-saati', baslik: 'Tiroid ilacım ve kahvaltı',
    aciklama: 'İlacınızı aldığınız saate göre kahvaltı, kahve ve kalsiyum / demir için en erken saatler.',
    durum: { ilac: ILAC_DESENLERI.levotiroksin },
    varsayilan: {
      alanlar: [{ id: 'saat', etiket: 'Bugün ilacımı aldığım saat', tur: 'saat' }],
      not: 'Onaylı ürün bilgisine göre: aç karnına, kahvaltıdan en az yarım saat önce; kalsiyum ve demirle en az iki saat ara. Doz ve ilaç değişikliği hekiminizindir.',
    },
    kaynaklar: ['TITCK-KUB-LT4', 'TEMD-TIROID-2025'],
    ayarlar: [{ id: 'ilacSaati', etiket: 'Hastanın her gün ilacı aldığı saat (SS:DD)', tur: 'saat' }],
  },
  {
    kod: 'end-hipo', brans: 'endokrinoloji', tur: 'gunluk', durum: { ilac: HIPO_ILAC }, baslik: 'Şeker düşmesi belirti günlüğüm',
    aciklama: 'İnsülin ya da bazı şeker ilaçlarıyla şeker düşebilir. Belirtileri kaydedin; ne yapacağınızı hemen gösterir.',
    varsayilan: { alanlar: HIPO_ALANLAR, bayraklar: HIPO_BAYRAKLAR, not: 'Şeker ölçümünüzü Bugün sayfasından girin; değerleriniz orada izlenir.' },
    kaynaklar: ['TEMD-DM', 'ADA-SOC'],
  },
  {
    kod: 'end-insulin', brans: 'endokrinoloji', tur: 'liste', isaretlenir: true, durum: { ilac: /ins[uü]lin|lantus|levemir|tresiba|toujeo|abasaglar|novorapid|humalog|apidra|fiasp|lyumjev|humulin|mixtard|novomix|ryzodeg/i },
    baslik: 'İnsülin kalemi kontrol listem', aciklama: 'Doğru teknik, insülinin her seferinde aynı etkiyi göstermesini sağlar. Bildiklerinizi işaretleyin.',
    varsayilan: {
      maddeler: [
        'Kullanmadan önce son kullanma tarihine ve insülinin görünümüne bakıyorum',
        'Her uygulamada yeni iğne ucu takıyorum',
        'Uygulama yerlerini sırayla değiştiriyorum (karın, uyluk, kol)',
        'İğneyi deriden çıkarmadan önce hekimimin söylediği süre kadar bekliyorum',
        'Açılmış kalemi oda sıcaklığında, yedeklerini buzdolabında saklıyorum',
        'Kullanılmış iğneleri kapaklı, sert bir kapta biriktiriyorum',
      ],
      not: 'Emin olmadığınız bir adımı bir sonraki kontrolde hekiminize ya da diyabet hemşirenize gösterin.',
    },
    kaynaklar: ['FITTER-2016', 'TEMD-DM'],
  },
  {
    kod: 'end-steroid', brans: 'endokrinoloji', tur: 'liste', durum: { tani: /adrenal yetmezli|addison|hipopit/i, icd: /^(E27\.[1-4]|E23\.0)/ }, baslik: 'Hasta gün steroid kurallarım',
    aciklama: 'Böbrek üstü bezi yetmezliğinde hastalık günlerinde dikkat edilecekler.',
    varsayilan: {
      maddeler: [
        'Ateşli hastalık, ameliyat ya da ağır stres günlerinde hekiminizin yazılı hasta gün planını uygulayın.',
        'Kusma nedeniyle ilacınızı alamıyorsanız beklemeden acile başvurun; halsizlik ve bilinç değişikliği varsa 112.',
        'Steroid kartınızı ya da bilekliğinizi yanınızda taşıyın.',
        'Size acil iğne verildiyse yakınlarınıza nasıl kullanılacağını gösterin.',
      ],
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastanın yazılı hasta gün planı satırları (doz yazılmaz — doz reçetede ve İlaç takviminde)', tur: 'satirlar' }],
    kaynaklar: ['TEMD-ADRENAL-2025', 'ES-ADRENAL-2016'],
  },
]

// ─── Aile hekimliği ─────────────────────────────────────────────────────────────────────────────────────────────────
export const AILE_HEKIMLIGI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'aile-tarama', brans: 'aile-hekimligi', tur: 'liste', yas: 'eriskin', baslik: 'Yaşıma uygun taramalar',
    aciklama: 'Ulusal tarama programındaki muayene ve testler. Hangilerinin size uygun olduğunu hekiminizle konuşun.',
    varsayilan: {
      maddeler: [
        'Kadınlar, 30–65 yaş: rahim ağzı kanseri taraması (HPV / smear) — beş yılda bir',
        'Kadınlar, 40–69 yaş: mamografi — iki yılda bir',
        'Herkes, 50–70 yaş: kalın bağırsak kanseri taraması (gaitada gizli kan) — iki yılda bir',
        'Herkes: tansiyon ölçümü — yılda en az bir kez',
        'Risk durumunuza göre: kan şekeri ve kolesterol',
      ],
      not: 'Tarama ücretsizdir ve aile hekiminiz ya da KETEM’de yapılır. Ailenizde kanser öyküsü varsa daha erken başlamak gerekebilir.',
    },
    kaynaklar: ['SB-KETEM-TARAMA', 'SB-PERIYODIK-MUAYENE'],
  },
  {
    kod: 'aile-sigara-zaman', brans: 'aile-hekimligi', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Bırakma günü', baslik: 'Sigarasız günlerim',
    aciklama: 'Bıraktığınız günden itibaren vücudunuzda olan iyileşme ve zor günlerde ne yapacağınız.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'Bırakma günü', ayrinti: 'Evdeki sigara, çakmak ve küllükleri kaldırın. Çevrenize bıraktığınızı söyleyin.' },
        { gun: 2, baslik: 'Yoksunluğun en yoğun günleri', ayrinti: 'Huzursuzluk ve sigara isteği bu günlerde en güçlüdür; istek dalgaları genelde birkaç dakikada geçer. Su için, yürüyün, ellerinizi meşgul edin.' },
        { gun: 7, baslik: 'Bir hafta', ayrinti: 'Tat ve koku duyunuz düzelmeye başlar. Tetikleyici anları (çay, yemek sonrası) önceden planlayın.' },
        { gun: 14, baslik: 'İki hafta', ayrinti: 'Dolaşım ve nefes almak kolaylaşmaya başlar.' },
        { gun: 30, baslik: 'Bir ay', ayrinti: 'Öksürük ve nefes darlığı azalır. Bir sigara bile yeniden başlatabilir; “bir taneden bir şey olmaz” düşüncesine karşı hazırlıklı olun.' },
        { gun: 90, baslik: 'Üç ay', ayrinti: 'Akciğer fonksiyonları düzelmeye devam eder.' },
        { gun: 365, baslik: 'Bir yıl', ayrinti: 'Kalp hastalığı riskiniz belirgin şekilde azalmıştır.' },
      ],
      not: 'ALO 171 Sigara Bırakma Danışma Hattı’ndan ücretsiz destek alabilirsiniz.',
    },
    kaynaklar: ['WHO-BIRAKMA-FAYDA', 'SB-ALO171'],
  },
  {
    kod: 'aile-sigara', brans: 'aile-hekimligi', tur: 'gunluk', baslangicModulu: 'aile-sigara-zaman', baslangicGerekli: true, sonGun: 365, baslik: 'Sigara bırakma günlüğüm',
    aciklama: 'Her gün bir dakika: içmediğiniz günleri ve isteğin gücünü kaydedin.',
    varsayilan: {
      alanlar: [
        { id: 'icmedim', etiket: 'Bugün hiç sigara içmedim', tur: 'evet' },
        { id: 'sayi', etiket: 'İçtiğim sigara sayısı', tur: 'sayi', min: 0, max: 80 },
        { id: 'istek', etiket: 'Sigara isteği', tur: 'olcek' },
        { id: 'tetik', etiket: 'İsteği tetikleyen an', tur: 'metin' },
      ],
    },
    kaynaklar: ['SB-ALO171'],
  },
]

// ─── Nefroloji ──────────────────────────────────────────────────────────────────────────────────────────────────────
export const NEFROLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'nef-sivi', brans: 'nefroloji', tur: 'gunluk', varsayilanKapali: true, baslik: 'Sıvı ve şişlik günlüğüm',
    aciklama: 'Hekiminiz sıvı sınırı verdiyse içtiğinizi ve şişliği kaydedin.',
    varsayilan: {
      alanlar: [
        { id: 'sivi', etiket: 'İçtiğim sıvı', tur: 'sayi', min: 0, max: 30, birim: 'bardak' },
        { id: 'idrar', etiket: 'İdrarım belirgin azaldı', tur: 'evet' },
        { id: 'sislik', etiket: 'Bacaklarımda ya da göz çevremde şişlik arttı', tur: 'evet' },
        { id: 'nefes', etiket: 'Nefes darlığı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: `Böbrek hastalığında nefes darlığı vücutta sıvı birikmesi olabilir: ${ACIL_112}`, hekim: 'Sıvı günlüğü: nefes darlığı (volüm yükü?).' },
        { id: 'idrar', kosullar: [{ alan: 'idrar', evet: true }], duzey: 'hekime_bildir', hasta: 'İdrar azalmasını hekiminize ilettik; bugün ulaşın.', hekim: 'Sıvı günlüğü: idrar miktarında belirgin azalma.' },
        { id: 'sislik', kosullar: [{ alan: 'sislik', evet: true }], duzey: 'hekime_bildir', hasta: 'Artan şişliği hekiminize ilettik. Kilonuzu Bugün sayfasından girin.', hekim: 'Sıvı günlüğü: ödemde artış.' },
      ],
    },
    ayarlar: [{ id: 'siviSiniri', etiket: 'Günlük sıvı sınırı (bardak)', tur: 'sayi' }],
    kaynaklar: ['KDIGO-KBH-2024', 'TND'],
  },
  {
    kod: 'nef-fistul', brans: 'nefroloji', tur: 'gunluk', varsayilanKapali: true, baslik: 'Fistül kontrolüm',
    aciklama: 'Diyaliz fistülünüz yaşam hattınızdır. Her gün titreşimi (tril) kontrol edin.',
    varsayilan: {
      alanlar: [
        { id: 'tril', etiket: 'Titreşimi (tril) her zamanki gibi hissettim', tur: 'evet' },
        { id: 'yok', etiket: 'Titreşimi hissetmiyorum ya da çok zayıf', tur: 'evet' },
        { id: 'kanama', etiket: 'Fistülden durmayan kanama', tur: 'evet' },
        { id: 'kizariklik', etiket: 'Fistül çevresinde kızarıklık, sıcaklık ya da akıntı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'kanama', kosullar: [{ alan: 'kanama', evet: true }], duzey: 'acil', hasta: `Fistül kanamasında temiz bir bezle bastırın ve ${ACIL_112}`, hekim: 'Fistül günlüğü: durmayan kanama.' },
        { id: 'yok', kosullar: [{ alan: 'yok', evet: true }], duzey: 'hekime_bildir', hasta: 'Titreşimin kaybolması fistülün tıkandığını gösterebilir. Bugün beklemeden diyaliz merkezinize ya da hekiminize ulaşın.', hekim: 'Fistül günlüğü: tril alınamıyor (tromboz?).' },
        { id: 'kizariklik', kosullar: [{ alan: 'kizariklik', evet: true }], duzey: 'hekime_bildir', hasta: 'Fistüldeki değişikliği hekiminize ilettik.', hekim: 'Fistül günlüğü: enfeksiyon bulgusu.' },
      ],
      not: 'Fistül kolunuza tansiyon ölçtürmeyin, kan aldırmayın; sıkı saat, bilezik ya da çanta taşımayın.',
    },
    kaynaklar: ['KDIGO-KBH-2024', 'TND'],
  },
  {
    kod: 'nef-besin', brans: 'nefroloji', tur: 'liste', varsayilanKapali: true, baslik: 'Potasyum ve fosfor rehberim',
    aciklama: 'Hekiminiz ya da diyetisyeniniz kısıtlama önerdiyse günlük seçimler için.',
    varsayilan: {
      maddeler: [
        'Potasyumu yüksek besinler: muz, kuru meyveler, patates, domates, portakal — miktarı hekiminize sorun.',
        'Sebzeleri doğrayıp suda bekletmek ve haşlama suyunu dökmek potasyumu azaltır.',
        'Fosforu yüksek: işlenmiş et, hazır gıdalar, kola, eritme peynir — etiketlerde “fosfat” arayın.',
        'Tuz yerine baharat ve limon kullanın; “az sodyumlu” tuzlar potasyum içerebilir.',
      ],
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel besin satırları', tur: 'satirlar' }],
    kaynaklar: ['KDIGO-KBH-2024', 'TND'],
  },
]

// ─── Gastroenteroloji ───────────────────────────────────────────────────────────────────────────────────────────────
export const GASTROENTEROLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'gas-gunluk', brans: 'gastroenteroloji', tur: 'gunluk', baslik: 'Sindirim günlüğüm',
    aciklama: 'Şikâyetlerinizi ve sizi etkileyen yiyecekleri kaydedin. Kontrolde örüntüyü hekiminizle birlikte görürsünüz.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Karın ağrısı', tur: 'olcek' },
        { id: 'siskinlik', etiket: 'Şişkinlik', tur: 'olcek' },
        { id: 'diski', etiket: 'Dışkılama sayısı', tur: 'sayi', min: 0, max: 30 },
        { id: 'bristol', etiket: 'Dışkı kıvamı (Bristol: 1 sert — 7 sulu)', tur: 'sayi', min: 1, max: 7 },
        { id: 'tetik', etiket: 'Şikâyeti artıran yiyecek', tur: 'metin' },
        { id: 'siyah', etiket: 'Siyah, katran gibi dışkı ya da kanlı kusma', tur: 'evet' },
        { id: 'kan', etiket: 'Dışkıda kırmızı kan', tur: 'evet' },
        { id: 'gece', etiket: 'Gece uykudan uyandıran ishal ya da ağrı', tur: 'evet' },
        { id: 'kilo', etiket: 'İstemeden kilo kaybı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'siyah', kosullar: [{ alan: 'siyah', evet: true }], duzey: 'acil', hasta: `Siyah dışkı ya da kanlı kusma sindirim kanaması olabilir: ${ACIL_112}`, hekim: 'Sindirim günlüğü: melena / hematemez.' },
        { id: 'kan', kosullar: [{ alan: 'kan', evet: true }], duzey: 'hekime_bildir', hasta: 'Dışkıdaki kanı hekiminize ilettik; değerlendirilmesi gerekir. Baş dönmesi ya da bol kanama olursa acile gidin.', hekim: 'Sindirim günlüğü: hematokezya.' },
        { id: 'gece', kosullar: [{ alan: 'gece', evet: true }], duzey: 'hekime_bildir', hasta: 'Gece uyandıran şikâyetleri hekiminize ilettik.', hekim: 'Sindirim günlüğü: noktürnal semptom (alarm bulgusu).' },
        { id: 'kilo', kosullar: [{ alan: 'kilo', evet: true }], duzey: 'hekime_bildir', hasta: 'İstemsiz kilo kaybını hekiminize ilettik.', hekim: 'Sindirim günlüğü: istemsiz kilo kaybı (alarm bulgusu).' },
      ],
    },
    kaynaklar: ['ROMA-IV', 'TGD'],
  },
  {
    kod: 'gas-kolonoskopi', brans: 'gastroenteroloji', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'İşlem günü', baslik: 'Kolonoskopi hazırlığım',
    aciklama: 'İşlem gününe kadar gün gün hazırlık. İyi bir bağırsak temizliği işlemin başarısını belirler.',
    varsayilan: {
      adimlar: [
        { gun: -7, baslik: 'Bir hafta önce', ayrinti: 'Kan sulandırıcı, demir ya da şeker ilacı kullanıyorsanız ne yapacağınızı hekiminize sorun.' },
        { gun: -3, baslik: 'Lifli besinlere ara', ayrinti: 'Çekirdekli meyve, tam tahıl, kuru baklagil ve çiğ sebzeye hekiminizin listesine göre ara verin.' },
        { gun: -1, baslik: 'Berrak sıvılar ve temizlik', ayrinti: 'Berrak sıvılarla beslenin; bağırsak temizleme ilacını hekiminizin tarif ettiği saatlerde için.' },
        { gun: 0, baslik: 'İşlem günü', ayrinti: 'Hekiminizin söylediği saatten sonra bir şey yemeyin, içmeyin. Sedasyon yapılacaksa sizi eve götürecek bir yakınınız olsun.' },
        { gun: 1, baslik: 'İşlem sonrası', ayrinti: 'Hafif gaz ve şişkinlik olağandır. Şiddetli karın ağrısı, ateş ya da bol kanama olursa 112’yi arayın ya da acile gidin.' },
      ],
    },
    kaynaklar: ['ESGE-HAZIRLIK-2019', 'TGD'],
  },
  tedaviIzlemi('gas-tedavi', 'gastroenteroloji', ['TGD', 'REPO-BIYOLOJIK-GUVENLIK']),
]

// ─── Romatoloji ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const ROMATOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'rom-gunluk', brans: 'romatoloji', tur: 'gunluk', baslik: 'Eklem günlüğüm',
    aciklama: 'Ağrı, sabah tutukluğu ve yorgunluğu kaydedin. Alevlenmeleri ve tedavinin etkisini birlikte görürsünüz.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Eklem ağrısı', tur: 'olcek' },
        { id: 'tutukluk', etiket: 'Sabah tutukluğu', tur: 'sayi', min: 0, max: 600, birim: 'dakika' },
        { id: 'sis', etiket: 'Şiş eklem sayısı', tur: 'sayi', min: 0, max: 28 },
        { id: 'yorgunluk', etiket: 'Yorgunluk', tur: 'olcek' },
        { id: 'genel', etiket: 'Genel durumum (0 çok iyi – 10 çok kötü)', tur: 'olcek' },
        { id: 'gorme', etiket: 'Ani görme kaybı ya da şakak ağrısıyla çiğnerken çene ağrısı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'gorme', kosullar: [{ alan: 'gorme', evet: true }], duzey: 'acil', hasta: `Ani görme kaybı acildir: hemen ${ACIL_112}`, hekim: 'Eklem günlüğü: ani görme kaybı / çene klodikasyonu (dev hücreli arterit?).' },
        { id: 'alevlenme', kosullar: [{ alan: 'agri', enAz: 8 }, { alan: 'genel', enAz: 8 }], duzey: 'hekime_bildir', hasta: 'Alevlenme belirtilerini hekiminize ilettik.', hekim: 'Eklem günlüğü: ağrı ve genel durum ≥ 8/10 (alevlenme?).' },
      ],
    },
    kaynaklar: ['EULAR-RA-2022', 'TRD-ROMATOLOJI'],
  },
  tedaviIzlemi('rom-tedavi', 'romatoloji', ['TRD-ROMATOLOJI', 'REPO-BIYOLOJIK-GUVENLIK']),
]

// ─── Enfeksiyon hastalıkları ────────────────────────────────────────────────────────────────────────────────────────
export const ENFEKSIYON_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'enf-tedavi', brans: 'enfeksiyon-hastaliklari', tur: 'gunluk', baslik: 'Tedavi günlüğüm',
    aciklama: 'Tedavinizi aldığınız günleri ve yan etkileri kaydedin. Ateşinizi Bugün sayfasından girin.',
    varsayilan: {
      alanlar: [
        { id: 'aldim', etiket: 'İlacımı bugün planlandığı gibi aldım', tur: 'evet' },
        { id: 'iyilesme', etiket: 'Kendimi dünden iyi hissediyorum', tur: 'evet' },
        { id: 'kotulesme', etiket: 'Tedaviye rağmen kötüleştim ya da üç günde düzelme yok', tur: 'evet' },
        { id: 'ishal', etiket: 'Günde üçten fazla sulu ishal', tur: 'evet' },
        { id: 'dokuntu', etiket: 'Yeni döküntü', tur: 'evet' },
        { id: 'sarilik', etiket: 'Gözlerde ya da ciltte sararma, koyu idrar', tur: 'evet' },
        ANAFILAKSI_ALANI,
      ],
      bayraklar: [
        ANAFILAKSI_BAYRAGI,
        { id: 'kotulesme', kosullar: [{ alan: 'kotulesme', evet: true }], duzey: 'hekime_bildir', hasta: 'Kötüleşmeyi hekiminize ilettik; bugün ulaşın. Nefes darlığı ya da bilinç değişikliği olursa 112’yi arayın.', hekim: 'Tedavi günlüğü: kötüleşme / 72 saatte yanıtsızlık.' },
        { id: 'ishal', kosullar: [{ alan: 'ishal', evet: true }], duzey: 'hekime_bildir', hasta: 'İshali hekiminize ilettik; bol sıvı alın. Kanlı ishal ya da yüksek ateş olursa acile gidin.', hekim: 'Tedavi günlüğü: antibiyotikle ilişkili ishal (C. difficile?).' },
        { id: 'dokuntu', kosullar: [{ alan: 'dokuntu', evet: true }], duzey: 'hekime_bildir', hasta: 'Döküntüyü hekiminize ilettik; ilacınızla ilgili yanıtını bekleyin.', hekim: 'Tedavi günlüğü: yeni döküntü (ilaç reaksiyonu?).' },
        { id: 'sarilik', kosullar: [{ alan: 'sarilik', evet: true }], duzey: 'hekime_bildir', hasta: 'Sararmayı hekiminize ilettik; bugün değerlendirilmesi gerekir.', hekim: 'Tedavi günlüğü: sarılık / koyu idrar (hepatotoksisite?).' },
      ],
      not: 'Antibiyotiğinizi hekiminizin söylediği süre boyunca kullanın; kendinizi iyi hissetseniz de erken bırakmayın.',
    },
    kaynaklar: ['SB-AKILCI-ANTIBIYOTIK', 'KLIMIK'],
  },
  {
    kod: 'enf-tb', brans: 'enfeksiyon-hastaliklari', tur: 'hatirlatma', durum: { ilac: /izoniazid|rifampisin|rifampin|rifadin|etambutol|pirazinamid|rimstar|rifinah/i }, baslik: 'Tüberküloz tedavi hatırlatmalarım',
    aciklama: 'Uzun süren bu tedavide her doz önemlidir. İlaç saatleriniz İlaç takvimi bölümündedir.',
    varsayilan: {
      maddeler: [
        'İlaçlarınızı her gün aynı saatte, hekiminizin tarif ettiği şekilde alın.',
        'Doğrudan gözetimli tedavi görüşmelerinizi kaçırmayın.',
        'İdrar, gözyaşı ve terin turuncu renk alması bu tedavide beklenir.',
        'Gözlerde sararma, bulantı-kusma, karın ağrısı, iştahsızlık ya da görmede / renkleri ayırt etmede değişiklik olursa hekiminize hemen yazın.',
      ],
      alanlar: [
        { id: 'sarilik', etiket: 'Gözlerde sararma, bulantı, kusma, karın ağrısı ya da belirgin iştahsızlık', tur: 'evet' },
        { id: 'gorme', etiket: 'Görmede bulanıklık ya da renkleri ayırt etmede zorluk', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'sarilik', kosullar: [{ alan: 'sarilik', evet: true }], duzey: 'hekime_bildir', hasta: 'Bu belirtileri hekiminize ilettik; ilaçlarınızla ilgili yanıtını bugün bekleyin.', hekim: 'TB tedavisi: sarılık / bulantı-kusma / karın ağrısı / iştahsızlık (hepatotoksisite?).' },
        { id: 'gorme', kosullar: [{ alan: 'gorme', evet: true }], duzey: 'hekime_bildir', hasta: 'Görme değişikliğini hekiminize ilettik.', hekim: 'TB tedavisi: görme / renk görme değişikliği (etambutol?).' },
      ],
    },
    kaynaklar: ['SB-TB-REHBERI'],
  },
]

// ─── Onkoloji ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const ONKOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'onk-dongu', brans: 'onkoloji', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Kür günü', baslik: 'Kür takvimim',
    aciklama: 'Bu kürün günleri ve her dönemde nelere dikkat edeceğiniz. Kür aralığınızı hekiminiz belirler.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'Tedavi günü', ayrinti: 'Rahat giysiler, su ve atıştırmalık yanınızda olsun. Size verilen bulantı ilaçlarını öğrenin.' },
        { gun: 1, baslik: 'İlk günler', ayrinti: 'Bulantı ve yorgunluk olabilir. Bulantı ilaçlarınızı hekiminizin önerdiği şekilde kullanın; az az ve sık yiyin.' },
        { gun: 7, baslik: 'Kan değerlerinin düştüğü dönem', ayrinti: 'Bu dönemde enfeksiyona karşı daha savunmasızsınız. Ateşinizi her gün ölçüp Bugün sayfasına girin.' },
        { gun: 10, baslik: 'Enfeksiyondan korunma', ayrinti: 'Ellerinizi sık yıkayın, kalabalıktan ve hasta kişilerden uzak durun, yiyecekleri iyi pişirin.' },
        { gun: 14, baslik: 'Toparlanma', ayrinti: 'Enerjiniz yavaş yavaş artar. Hafif yürüyüşler iyi gelir.' },
        { gun: 18, baslik: 'Kontrol tahlili', ayrinti: 'Hekiminiz istediyse bir sonraki kürden önceki kan tahlili.' },
        { gun: 21, baslik: 'Sonraki kür', ayrinti: 'Bir sonraki kür tarihinizi kontrol edin; hekiminiz tarihi değiştirebilir.' },
      ],
      not: 'Hekiminiz kür aralığınıza göre bu takvimi düzenler.',
    },
    kaynaklar: ['ESMO-FN-2016', 'TTOD'],
  },
  {
    kod: 'onk-yanetki', brans: 'onkoloji', tur: 'gunluk', baslik: 'Yan etki günlüğüm',
    aciklama: 'Her gün bir dakika. Tehlike işaretlerinden birini seçerseniz ne yapacağınızı hemen gösterir.',
    varsayilan: {
      alanlar: [
        { id: 'bulanti', etiket: 'Bulantı', tur: 'olcek' },
        { id: 'kusma', etiket: 'Kusma sayısı (24 saat)', tur: 'sayi', min: 0, max: 30 },
        { id: 'ishal', etiket: 'Sulu dışkı sayısı (24 saat)', tur: 'sayi', min: 0, max: 30 },
        { id: 'agiz', etiket: 'Ağız yarası ya da ağrısı', tur: 'olcek' },
        { id: 'yorgunluk', etiket: 'Yorgunluk', tur: 'olcek' },
        { id: 'ates', etiket: '38 °C ve üzeri ateş ya da titreme', tur: 'evet' },
        { id: 'kanama', etiket: 'Durmayan kanama ya da yaygın morluk', tur: 'evet' },
        { id: 'nefes', etiket: 'Nefes darlığı ya da göğüs ağrısı', tur: 'evet' },
        { id: 'sivi', etiket: '24 saattir sıvı alamıyorum', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'acil', hasta: `Kemoterapi alırken ateş ya da titreme acildir; beklemeyin: tedavi aldığınız merkezi arayın ya da ${ACIL_112}`, hekim: 'Yan etki günlüğü: ≥ 38 °C ateş / titreme (febril nötropeni?).' },
        { id: 'kanama', kosullar: [{ alan: 'kanama', evet: true }], duzey: 'acil', hasta: `Durmayan kanama acildir: ${ACIL_112}`, hekim: 'Yan etki günlüğü: kanama / yaygın ekimoz.' },
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: `Nefes darlığı ya da göğüs ağrısı acildir: ${ACIL_112}`, hekim: 'Yan etki günlüğü: nefes darlığı / göğüs ağrısı.' },
        { id: 'sivi', kosullar: [{ alan: 'sivi', evet: true }], duzey: 'hekime_bildir', hasta: 'Sıvı alamadığınızı hekiminize ilettik; bugün ulaşın. Baş dönmesi ya da idrar azalması varsa acile gidin.', hekim: 'Yan etki günlüğü: 24 saat oral alım yok.' },
        { id: 'kusma', kosullar: [{ alan: 'kusma', enAz: 6 }], duzey: 'hekime_bildir', hasta: 'Sık kusmayı hekiminize ilettik.', hekim: 'Yan etki günlüğü: ≥ 6 kusma / 24 saat.' },
        { id: 'ishal', kosullar: [{ alan: 'ishal', enAz: 7 }], duzey: 'hekime_bildir', hasta: 'Sık ishali hekiminize ilettik; bol sıvı alın.', hekim: 'Yan etki günlüğü: ≥ 7 sulu dışkı / 24 saat (CTCAE derece 3).' },
      ],
    },
    kaynaklar: ['NCI-CTCAE-5', 'ESMO-FN-2016', 'TTOD'],
  },
  {
    kod: 'onk-agiz', brans: 'onkoloji', tur: 'program', baslik: 'Ağız bakımım',
    aciklama: 'Tedavi sırasında ağız yaralarını önlemek için günlük adımlar.',
    varsayilan: {
      maddeler: [
        'Yumuşak diş fırçasıyla sabah ve akşam fırçaladım',
        'Hekimimin önerdiği gargarayı yaptım',
        'Gün boyu yeterli sıvı aldım',
        'Çok sıcak, acı ve asitli yiyeceklerden kaçındım',
      ],
    },
    kaynaklar: ['MASCC-ISOO-2020'],
  },
]

// ─── Göğüs hastalıkları ─────────────────────────────────────────────────────────────────────────────────────────────
const SOLUNUM = { tani: /ast[ıi]m|koah|kronik obstr[uü]ktif|amfizem|bron[sş]it/i, icd: /^J4[4-6]/ }
export const GOGUS_HASTALIKLARI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'gog-eylem', brans: 'gogus-hastaliklari', tur: 'liste', durum: SOLUNUM, baslik: 'Eylem planım',
    aciklama: 'Nefesiniz kötüleştiğinde ne yapacağınız. Hekiminiz planı size göre yazar.',
    varsayilan: {
      maddeler: [
        'Yeşil — nefesim rahat: koruyucu ilacımı her gün hekimimin dediği gibi kullanıyorum.',
        'Sarı — öksürük, hırıltı ya da gece uyanma arttı, rahatlatıcı ilaca daha sık ihtiyaç duyuyorum: hekimimin yazılı planındaki adımı uygularım ve hekimime yazarım.',
        'Kırmızı — konuşamayacak kadar nefes darlığı, dudaklarda morarma ya da rahatlatıcı ilaç işe yaramıyor: 112.',
      ],
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastanın kişisel eylem planı satırları (ilaç adı yazılabilir; doz reçetede ve İlaç takviminde)', tur: 'satirlar' }],
    kaynaklar: ['GINA', 'GOLD', 'TTD'],
  },
  {
    kod: 'gog-semptom', brans: 'gogus-hastaliklari', tur: 'gunluk', durum: SOLUNUM, baslik: 'Nefes günlüğüm',
    aciklama: 'Nefesinizi ve rahatlatıcı ilaç ihtiyacınızı kaydedin; kötüleşmeyi erken fark etmenizi sağlar. Oksijen değerinizi Bugün sayfasından girin.',
    varsayilan: {
      alanlar: [
        { id: 'nefes', etiket: 'Nefes darlığı', tur: 'olcek' },
        { id: 'oksuruk', etiket: 'Öksürük', tur: 'olcek' },
        { id: 'rahatlatici', etiket: 'Rahatlatıcı inhaleri kullanma sayısı', tur: 'sayi', min: 0, max: 30 },
        { id: 'pef', etiket: 'Zirve akım (PEF)', tur: 'sayi', min: 60, max: 900, birim: 'L/dk' },
        { id: 'balgam', etiket: 'Balgamın rengi ya da miktarı değişti', tur: 'evet' },
        { id: 'gece', etiket: 'Gece nefes darlığıyla uyandım', tur: 'evet' },
        { id: 'kirmizi', etiket: 'Konuşamayacak kadar nefes darlığı ya da dudaklarda morarma', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'kirmizi', kosullar: [{ alan: 'kirmizi', evet: true }], duzey: 'acil', hasta: `Bu ağır bir atak belirtisidir: eylem planınızdaki rahatlatıcı ilacı kullanın ve hemen ${ACIL_112}`, hekim: 'Nefes günlüğü: ağır atak bulguları (konuşamama / siyanoz).' },
        { id: 'rahatlatici', kosullar: [{ alan: 'rahatlatici', enAz: 4 }], duzey: 'hekime_bildir', hasta: 'Rahatlatıcı ilaca ihtiyacınız arttı. Eylem planınızın sarı adımını uygulayın; hekiminize ilettik.', hekim: 'Nefes günlüğü: günde ≥ 4 kez rahatlatıcı kullanımı (kontrolsüz?).' },
        { id: 'alevlenme', kosullar: [{ alan: 'balgam', evet: true }, { alan: 'gece', evet: true }], duzey: 'hekime_bildir', hasta: 'Balgam değişikliği ve gece nefes darlığını hekiminize ilettik; bugün ulaşın.', hekim: 'Nefes günlüğü: balgam değişikliği + noktürnal semptom (alevlenme?).' },
      ],
    },
    kaynaklar: ['GINA', 'GOLD', 'TTD'],
  },
  {
    kod: 'gog-inhaler', brans: 'gogus-hastaliklari', tur: 'liste', isaretlenir: true, durum: SOLUNUM, baslik: 'İnhaler tekniğim',
    aciklama: 'İlacın akciğere ulaşması tekniğe bağlıdır. Her adımı bir kez işaretleyin.',
    varsayilan: {
      maddeler: [
        'Kapağı açtım ve cihazı salladım',
        'Nefesimi cihazdan uzağa doğru tamamen verdim',
        'Dudaklarımı ağızlığın çevresine sıkıca kapattım',
        'Yavaş ve derin nefes alırken cihaza bastım',
        'Nefesimi yaklaşık on saniye tuttum',
        'Kortizon içeren ilaçtan sonra ağzımı çalkaladım',
      ],
      not: 'Bu adımlar ölçülü doz inhaler içindir. Toz inhaler kullanıyorsanız hekiminiz listeyi cihazınıza göre düzenler.',
    },
    kaynaklar: ['GINA', 'TTD'],
  },
]
