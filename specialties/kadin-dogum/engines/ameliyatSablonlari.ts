/**
 * AMELIYAT-NOTU-01 — KD (Kadın Hastalıkları ve Doğum) OPERATION-NOTE TEMPLATES. Chapter content: only a KD doctor ever
 * receives them (the server picks them by the doctor's own branch — lib/doktor/ameliyatNotuSunucu.ts); the shell they fill
 * is core (lib/doktor/ameliyatNotu.ts).
 *
 * WHAT A TEMPLATE IS: the standard, EDITABLE steps of an operation, written as a generic sequence the surgeon corrects
 * to what was actually done. It writes NO dose, NO pressure, NO size, NO count — every number is the surgeon's own and is
 * left as a blank ("__") in the text. It writes no finding: findings are blank. Each template names the published
 * references its sequence follows; none is a reproduction of a guideline's text.
 *
 * WHICH OPERATIONS (Kaan, 2026-11-05, benchmark: a Turkish private-practice "Op. Dr." KD surgeon's public site). The
 * benchmark lists: ultrason, laparoskopi, RİA, kolposkopi, NRP; gebelik sonlandırma (vakum aspirasyon); gebelik takibi;
 * genital estetik (labioplasti, vajinoplasti, himenoplasti). The brief adds the core operations of every KD surgeon
 * (sezaryen, histerektomi routes, myomektomi, laparoskopi for cyst / endometriosis, histeroskopi, D&C).
 *   - From the benchmark site: vakum_aspirasyon, kolposkopi_biyopsi_leep, ria_takilmasi, labioplasti,
 *     perineoplasti_kolporafi (vajinoplasti), and the laparoscopy group.
 *   - GENITAL-ESTETIK-01 (2026-11-06): labioplasti_klitoral (clitoral-hood variant, ACOG CO 795 lists the procedure) and
 *     vajinoplasti_kolpoperineorafi (dedicated vaginal-tightening template). Every "Genital estetik" template requires the
 *     cosmetic / medically-indicated field; a cosmetic one is refused under 18 (lib/clinical/genitalEstetik.ts).
 *   - NOT templated: himenoplasti — WHO / OHCHR / UN Women ("Eliminating virginity testing", 2018) call for an end to
 *     virginity-related procedures and the United Kingdom made hymenoplasty an offence (Health and Care Act 2022, s.149);
 *     offering it is the owner's decision (docs/OPEN-COMMITMENTS.md, AMELIYAT-NOTU-HIMENOPLASTI-01). vNOTES is not on
 *     the benchmark site; the vaginal hysterectomy template covers the vaginal route.
 */
import type { AmeliyatSablonu } from '@/lib/doktor/ameliyatNotu'

const ADIM = (satirlar: string[]) => satirlar.map((s, i) => `${i + 1}. ${s}`).join('\n')

const LAP_GIRIS = [
  'Genel anestezi altında, litotomi pozisyonunda; cilt antisepsisi, steril örtüm, mesane sondası.',
  'Gerekirse uterin manipülatör yerleştirildi.',
  'Giriş: __ (Veress / açık Hasson / optik trokar), noktası __; pnömoperitoneum oluşturuldu; primer trokar yerleştirildi.',
  'Ek trokarlar görüş altında yerleştirildi: __.',
  'Batın ve pelvis eksplorasyonu (üst batın, karaciğer yüzeyi, apendiks, uterus, adneksler, Douglas, periton yüzeyleri): bulgular yukarıda.',
]
const LAP_KAPANIS = 'Hemostaz düşük batın içi basınçta kontrol edildi; irrigasyon-aspirasyon. Gazlı bez ve alet sayımları doğru. Trokarlar görüş altında çıkarıldı, gaz boşaltıldı. ≥10 mm trokar yerlerinde fasya kapatıldı (hekim belirler); cilt __ ile kapatıldı.'
const POSTOP_GENEL = 'Vital bulgu, ağrı ve kanama takibi. Erken mobilizasyon. Oral alım: hekim belirler. Tromboprofilaksi: risk değerlendirmesine göre. Sonda çıkarılma zamanı: __. Taburculuk ve kontrol: __.'

export const KD_AMELIYAT_SABLONLARI: readonly AmeliyatSablonu[] = [
  // ── Obstetrik ──
  {
    kod: 'sezaryen', ad: 'Sezaryen (alt segment transvers)', grup: 'Obstetrik',
    kaynak: 'NICE NG192 Caesarean birth (2021); WHO Recommendations for prevention and treatment of maternal peripartum infections (2015); T.C. Sağlık Bakanlığı Sezaryen Klinik Protokolü (endikasyon listesi, Notya doğum paneli).',
    veri: {
      islem: 'Sezaryen (alt segment transvers histerotomi)',
      teknik: ADIM([
        'Hasta supin, sol lateral tilt; cilt antisepsisi, steril örtüm, mesane sondası.',
        'Profilaktik antibiyotik cilt insizyonundan önce uygulandı (ajan ve zaman: aşağıda).',
        'Cilt insizyonu: __ (Pfannenstiel / Joel-Cohen).',
        'Cilt altı ve fasya açıldı, rektus kasları ayrıldı, periton açıldı.',
        'Vezikouterin plika (gerekirse) açıldı, mesane korundu.',
        'Alt segment transvers uterus insizyonu, künt genişletme.',
        'Bebek __ prezentasyonla doğurtuldu (saat __, cinsiyet __, ağırlık __ g, Apgar __/__). Kordon klempajı: __.',
        'Plasenta kontrollü kordon traksiyonu ile çıkarıldı, bütünlüğü kontrol edildi; kavite kontrol edildi.',
        'Uterotonik: hekim yazar (ajan / doz Notya tarafından yazılmaz).',
        'Histerotomi __ kat kapatıldı; hemostaz kontrolü.',
        'Adneksler kontrol edildi: __.',
        'Gazlı bez ve alet sayımları doğru.',
      ]),
      kapanis: 'Fasya __ ile kapatıldı; cilt altı __; cilt __ ile kapatıldı.',
      postopOrderlar: 'Vital bulgu, uterus tonusu ve vajinal kanama takibi. Erken emzirme ve ten tene temas desteği. Erken mobilizasyon. Tromboprofilaksi: risk değerlendirmesine göre. Sonda çıkarılma zamanı: __. Lohusa izlemi ve taburculuk: __.',
    },
  },
  {
    kod: 'vakum_aspirasyon', ad: 'Vakum aspirasyon (uterus boşaltılması)', grup: 'Obstetrik',
    kaynak: 'WHO Abortion care guideline (2022); NICE NG140 Abortion care (2019); ACOG Practice Bulletin No. 200 Early Pregnancy Loss (2018). Türkiye: 2827 sayılı Nüfus Planlaması Hakkında Kanun ve Rahim Tahliyesi ve Sterilizasyon Hizmetlerinin Yürütülmesi ve Denetlenmesine İlişkin Tüzük — yasal koşullar ve onam hekim tarafından doğrulanır.',
    veri: {
      islem: 'Vakum aspirasyon ile uterus boşaltılması',
      endikasyon: '__ (missed abortus / inkomplet abortus / yasal sınır içinde istemli gebelik sonlandırma). Gebelik haftası USG ile doğrulandı: __. Yasal onam alındı.',
      teknik: ADIM([
        'Litotomi pozisyonu; antisepsi, steril örtüm.',
        'Bimanuel muayene: uterus boyutu ve pozisyonu __.',
        'Spekulum yerleştirildi; serviks tenakulum ile tutuldu.',
        'Servikal hazırlık / dilatasyon: __ (hekim belirler).',
        'Uygun boyutta kanül ile __ (manuel / elektrikli) vakum aspirasyon yapıldı.',
        'Kavite boşaldığı (grittiness, uterusun kontraksiyonu) kontrol edildi.',
        'Aspirat incelendi: gebelik dokusu __ (görüldü / görülmedi).',
        'Kanama kontrolü yapıldı; aletler çıkarıldı.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Aspirasyon materyali',
      kapanis: 'Kanama kontrolü sonrası işlem sonlandırıldı.',
      postopOrderlar: 'Vital bulgu ve kanama takibi. Rh(-) ise anti-D: hekim değerlendirir. Kontrasepsiyon danışmanlığı yapıldı (işlem sonrası hemen başlanabilecek yöntemler). Kontrol: __. Ateş, şiddetli ağrı, yoğun kanama veya kötü kokulu akıntıda başvuru anlatıldı.',
    },
  },
  // ── Histerektomi ──
  {
    kod: 'tlh', ad: 'Total laparoskopik histerektomi (TLH)', grup: 'Histerektomi',
    kaynak: 'ACOG Committee Opinion No. 701, Choosing the Route of Hysterectomy for Benign Disease (2017); AAGL Practice Report: Practice Guidelines on the Prevention of Apical Prolapse at the Time of Benign Hysterectomy (2014); RCOG Green-top Guideline No. 49, Preventing Entry-Related Gynaecological Laparoscopic Injuries.',
    veri: {
      islem: 'Total laparoskopik histerektomi ± __ (bilateral salpenjektomi / bilateral salpingo-ooferektomi)',
      teknik: ADIM([
        ...LAP_GIRIS,
        'Her iki üreterin pelvik seyri izlendi.',
        'Round ligamentler koagüle edilip kesildi; geniş ligament ön ve arka yaprakları açıldı.',
        'Adneks: __ (overler korundu: utero-ovaryan ligament ve tuba / BSO: infundibulopelvik ligament) koagüle edilip kesildi.',
        'Vezikouterin periton açıldı, mesane serviks ve vajen önünden aşağı disseke edildi.',
        'Uterin damarlar iskeletize edildi, koagüle edilip kesildi.',
        'Kolpotomi manipülatör kapağı üzerinde yapıldı; uterus vajinal yoldan çıkarıldı (morselasyon: __ — yapılmadı / kapalı torba içinde).',
        'Vajinal kaf __ (laparoskopik / vajinal) sütüre edildi; uterosakral ligament desteği: __.',
        'Sistoskopi: __ (yapıldı / yapılmadı).',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Uterus ± serviks ± adneksler',
      kapanis: LAP_KAPANIS,
      postopOrderlar: POSTOP_GENEL + ' Vajinal yoldan ilişki ve ağır kaldırma kısıtlaması: hekim belirler.',
    },
  },
  {
    kod: 'tah', ad: 'Total abdominal histerektomi (TAH)', grup: 'Histerektomi',
    kaynak: 'ACOG Committee Opinion No. 701 (2017); RCOG Consent Advice: Abdominal hysterectomy for benign conditions.',
    veri: {
      islem: 'Total abdominal histerektomi ± __ (bilateral salpenjektomi / bilateral salpingo-ooferektomi)',
      teknik: ADIM([
        'Genel / rejyonel anestezi altında supin pozisyon; antisepsi, steril örtüm, mesane sondası.',
        'Cilt insizyonu: __ (Pfannenstiel / göbek altı orta hat).',
        'Fasya açıldı, rektus kasları ayrıldı, periton açıldı; ekartör yerleştirildi, barsaklar tamponlandı.',
        'Batın ve pelvis eksplorasyonu: bulgular yukarıda.',
        'Round ligamentler klemplenip kesildi ve bağlandı; geniş ligament yaprakları açıldı.',
        'Adneks pedikülleri: __ (utero-ovaryan / infundibulopelvik) klemplenip kesildi, çift bağlandı.',
        'Vezikouterin periton açıldı, mesane aşağı itildi; üreterlerin seyri korundu.',
        'Uterin damarlar iskeletize edilip klemplendi, kesildi ve bağlandı.',
        'Kardinal ve uterosakral ligamentler klemplenip kesildi, bağlandı.',
        'Vajen açıldı, uterus serviksle birlikte çıkarıldı; vajinal kaf __ ile kapatıldı, köşeler uterosakrallere asıldı.',
        'Hemostaz kontrolü; batın yıkandı. Gazlı bez ve alet sayımları doğru.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Uterus + serviks ± adneksler',
      kapanis: 'Periton __; fasya __ ile kapatıldı; cilt altı __; cilt __ ile kapatıldı.',
      postopOrderlar: POSTOP_GENEL,
    },
  },
  {
    kod: 'vajinal_histerektomi', ad: 'Vajinal histerektomi', grup: 'Histerektomi',
    kaynak: 'ACOG Committee Opinion No. 701 (2017: vaginal route preferred where feasible); AAGL apical support practice report (2014).',
    veri: {
      islem: 'Vajinal histerektomi ± __ (salpenjektomi / ooferektomi / ön-arka onarım)',
      teknik: ADIM([
        'Rejyonel / genel anestezi altında litotomi pozisyonu; antisepsi, steril örtüm, mesane sondası.',
        'Serviks tenakulum ile tutuldu; servikovajinal bileşkede sirkumferansiyel insizyon.',
        'Posterior kolpotomi ile Douglas, anterior kolpotomi ile vezikouterin boşluğa girildi; mesane yukarı itildi.',
        'Uterosakral ve kardinal ligamentler klemplenip kesildi, bağlandı (uterosakraller işaretlendi).',
        'Uterin damarlar klemplenip kesildi ve bağlandı.',
        'Uterus fundusu doğurtuldu; utero-ovaryan pediküller klemplenip kesildi, çift bağlandı. Adneks: __.',
        'Hemostaz kontrolü; periton __.',
        'Apikal destek: uterosakral ligamentler kafa tespit edildi (McCall / __).',
        'Vajinal kaf __ ile kapatıldı.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Uterus + serviks ± adneksler',
      kapanis: 'Vajinal kaf kapatıldı; vajinal tampon: __ (konuldu, çıkarılma zamanı __ / konulmadı).',
      postopOrderlar: POSTOP_GENEL,
    },
  },
  // ── Myomektomi ──
  {
    kod: 'lap_myomektomi', ad: 'Laparoskopik myomektomi', grup: 'Myomektomi',
    kaynak: 'ACOG Practice Bulletin No. 228, Management of Symptomatic Uterine Leiomyomas (2021); US FDA safety communication on laparoscopic power morcellation (2014, updated 2020).',
    veri: {
      islem: 'Laparoskopik myomektomi',
      teknik: ADIM([
        ...LAP_GIRIS,
        'Myom(lar): sayı __, yerleşim __ (FIGO tipi __), boyut __.',
        'Vazokonstriktör infiltrasyonu: __ (hekim belirler).',
        'Seroza üzerinden insizyon; myom kapsül planından enükle edildi.',
        'Kaviteye açılma: __ (oldu / olmadı).',
        'Myometrium __ kat sütüre edildi (barbed / klasik sütür), ölü boşluk bırakılmadı.',
        'Myom(lar) çıkarılması: __ (kapalı torba içinde morselasyon / mini-laparotomi / kolpotomi).',
        'Adezyon bariyeri: __.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Myom(lar)',
      kapanis: LAP_KAPANIS,
      postopOrderlar: POSTOP_GENEL + ' Sonraki gebelikte doğum şekli ve aralık danışmanlığı: hekim belirler (kaviteye açılma notu yukarıda).',
    },
  },
  {
    kod: 'abdominal_myomektomi', ad: 'Abdominal myomektomi', grup: 'Myomektomi',
    kaynak: 'ACOG Practice Bulletin No. 228 (2021).',
    veri: {
      islem: 'Abdominal (açık) myomektomi',
      teknik: ADIM([
        'Genel / rejyonel anestezi altında supin pozisyon; antisepsi, steril örtüm, mesane sondası.',
        'Cilt insizyonu: __; fasya ve periton açıldı.',
        'Uterus batın dışına alındı / yerinde değerlendirildi; myom(lar): sayı __, yerleşim __ (FIGO tipi __), boyut __.',
        'Kan kaybını azaltma: __ (vazokonstriktör / turnike — hekim belirler).',
        'Seroza insizyonu; myom(lar) kapsül planından enükle edildi.',
        'Kaviteye açılma: __ (oldu / olmadı).',
        'Myometrium __ kat sütüre edildi; seroza kapatıldı.',
        'Adezyon bariyeri: __. Hemostaz kontrolü; sayımlar doğru.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Myom(lar)',
      kapanis: 'Periton __; fasya __; cilt altı __; cilt __ ile kapatıldı.',
      postopOrderlar: POSTOP_GENEL + ' Sonraki gebelikte doğum şekli ve aralık danışmanlığı: hekim belirler.',
    },
  },
  // ── Laparoskopi ──
  {
    kod: 'tanisal_laparoskopi', ad: 'Tanısal laparoskopi', grup: 'Laparoskopi',
    kaynak: 'RCOG Consent Advice: Diagnostic Laparoscopy; RCOG Green-top Guideline No. 49 (entry-related injuries).',
    veri: {
      islem: 'Tanısal laparoskopi ± __ (kromopertübasyon / biyopsi)',
      teknik: ADIM([
        ...LAP_GIRIS,
        'Tubal geçiş testi (kromopertübasyon): __ (yapıldı: sağ __ / sol __ ; yapılmadı).',
        'Biyopsi: __.',
      ]),
      kapanis: LAP_KAPANIS,
      postopOrderlar: POSTOP_GENEL,
    },
  },
  {
    kod: 'lap_over_kistektomi', ad: 'Laparoskopik over kistektomisi', grup: 'Laparoskopi',
    kaynak: 'RCOG Green-top Guideline No. 62, Management of Suspected Ovarian Masses in Premenopausal Women (2011); ESHRE Endometriosis guideline (2022) for endometrioma.',
    veri: {
      islem: 'Laparoskopik __ (sağ / sol / bilateral) over kistektomisi',
      teknik: ADIM([
        ...LAP_GIRIS,
        'Kist: taraf __, boyut __, görünüm __ (yüzey düzgün / papiller yapı yok, asit yok — hekim doğrular). Peritoneal yıkama: __.',
        'Over korteksinde insizyon; kist duvarı stripping tekniği ile sağlam over dokusundan ayrıldı (rüptür: __).',
        'Kist endoskopik torba içinde çıkarıldı.',
        'Over yatağında hemostaz: __ (sütür / hemostatik ajan; bipolar kullanımı overi korumak için en aza indirildi).',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Kist duvarı ± peritoneal yıkama sıvısı',
      kapanis: LAP_KAPANIS,
      postopOrderlar: POSTOP_GENEL + ' Patoloji sonucu ile kontrol: __.',
    },
  },
  {
    kod: 'lap_endometriozis', ad: 'Laparoskopik endometriozis cerrahisi', grup: 'Laparoskopi',
    kaynak: 'ESHRE Guideline: Endometriosis (2022); rASRM / #Enzian sınıflaması (hekim kaydeder).',
    veri: {
      islem: 'Laparoskopik endometriozis eksizyonu / ablasyonu ± __ (endometrioma kistektomisi / adezyolizis)',
      teknik: ADIM([
        ...LAP_GIRIS,
        'Endometriozis haritası: periton __, overler __, uterosakraller __, Douglas obliterasyonu __, barsak / mesane tutulumu __. Evre (rASRM / #Enzian): __.',
        'Üreterlerin seyri izlendi; gerekli alanlarda retroperiton açıldı.',
        'Lezyonlar __ (eksizyon / ablasyon) ile çıkarıldı.',
        'Endometrioma: __ (stripping kistektomi, torba içinde çıkarım).',
        'Adezyolizis: __.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Eksize lezyonlar ± kist duvarı',
      kapanis: LAP_KAPANIS,
      postopOrderlar: POSTOP_GENEL + ' Postoperatif hormonal tedavi planı: hekim belirler.',
    },
  },
  // ── Histeroskopi / küretaj ──
  {
    kod: 'histeroskopi', ad: 'Histeroskopi (tanısal / operatif)', grup: 'Histeroskopi',
    kaynak: 'RCOG / BSGE Green-top Guideline No. 59, Best Practice in Outpatient Hysteroscopy (2011); AAGL / ESGE guidance on fluid management in hysteroscopy.',
    veri: {
      islem: '__ (tanısal / operatif) histeroskopi ± __ (polipektomi / myomektomi / septum rezeksiyonu / adezyolizis / endometrial biyopsi)',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm.',
        'Serviks gerekirse dilate edildi; histeroskop görüş altında kaviteye ilerletildi.',
        'Distansiyon sıvısı: __; sıvı açığı takip edildi (hekim kaydeder: __).',
        'Kavite: şekil __, endometrium __, tubal ostiumlar __ (sağ / sol izlendi).',
        'Operatif işlem: __ (cihaz: __).',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Endometrial örnek / polip / myom parçaları',
      kapanis: 'Kavite son kontrol edildi, aletler çıkarıldı; kanama kontrolü.',
      postopOrderlar: 'Vital bulgu ve kanama takibi. Ağrı kontrolü. Patoloji sonucu ile kontrol: __.',
    },
  },
  {
    kod: 'dc_kuretaj', ad: 'D&C / fraksiyone küretaj', grup: 'Histeroskopi',
    kaynak: 'ACOG Practice Bulletin No. 200 (2018) for early pregnancy loss; WHO Abortion care guideline (2022) recommends vacuum aspiration over sharp curettage in pregnancy.',
    veri: {
      islem: '__ (dilatasyon ve küretaj / fraksiyone küretaj)',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm.',
        'Bimanuel muayene: uterus boyutu ve pozisyonu __.',
        'Spekulum, tenakulum; histerometri: __.',
        'Fraksiyone ise önce endoservikal küretaj yapıldı, materyal ayrı gönderildi.',
        'Serviks __ numaraya kadar dilate edildi.',
        'Kavite sistematik olarak küretlendi.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Endoservikal ve endometrial küretaj materyali (ayrı kaplarda)',
      kapanis: 'Kanama kontrolü sonrası aletler çıkarıldı.',
      postopOrderlar: 'Vital bulgu ve kanama takibi. Patoloji sonucu ile kontrol: __.',
    },
  },
  // ── Ofis işlemleri (benchmark site) ──
  {
    kod: 'kolposkopi_biyopsi_leep', ad: 'Kolposkopi ± biyopsi / LEEP', grup: 'Serviks',
    kaynak: 'ASCCP Risk-Based Management Consensus Guidelines (2019); IFCPC kolposkopi terminolojisi (2011).',
    veri: {
      islem: 'Kolposkopi ± __ (yönlendirilmiş biyopsi / ECC / LEEP-LLETZ konizasyon)',
      endikasyon: '__ (sitoloji / HPV sonucu ve tarihi).',
      teknik: ADIM([
        'Litotomi pozisyonu; spekulum yerleştirildi.',
        'Asetik asit uygulandı; skuamokolumnar bileşke __ (tam / kısmen / görülmedi), transformasyon zonu tipi __.',
        'Lugol: __.',
        'Bulgular (IFCPC): __.',
        'Biyopsi: __ (saat __ hizasından) / ECC: __.',
        'LEEP / LLETZ: lokal anestezi; uygun boyutta loop ile eksizyon tek / __ parça; derinlik __; sınırlar işaretlendi.',
        'Hemostaz: __.',
      ]),
      patoloji: 'gonderildi',
      patolojiMateryal: 'Servikal biyopsi(ler) / ECC / konizasyon materyali (yönü işaretli)',
      kapanis: 'Kanama kontrolü yapıldı.',
      postopOrderlar: 'Kanama ve akıntı hakkında bilgilendirildi. Cinsel ilişki ve tampon kısıtlaması: hekim belirler. Patoloji sonucu ile kontrol: __.',
    },
  },
  {
    kod: 'ria_takilmasi', ad: 'RİA (rahim içi araç) takılması', grup: 'Serviks',
    kaynak: 'WHO Medical eligibility criteria for contraceptive use (5th ed., 2015); WHO Family Planning: A Global Handbook for Providers (2022); FSRH Clinical Guideline: Intrauterine Contraception (2023).',
    veri: {
      islem: 'RİA takılması (__: bakırlı / LNG-RİA, marka __, lot __)',
      endikasyon: 'Kontrasepsiyon ± __. WHO MEC kategorisi değerlendirildi: __. Gebelik dışlandı: __.',
      teknik: ADIM([
        'Bilgilendirilmiş onam alındı.',
        'Bimanuel muayene: uterus pozisyonu __.',
        'Spekulum; serviks antisepsisi; tenakulum.',
        'Histerometri: __ cm.',
        'RİA üretici talimatına uygun olarak fundusa yerleştirildi.',
        'İpler __ cm bırakılarak kesildi.',
        'Yerleşim kontrolü: __ (USG ile / klinik).',
      ]),
      implantlar: 'RİA: tür __, marka __, lot / seri no __, son kullanma __.',
      kapanis: 'Aletler çıkarıldı; kanama kontrolü.',
      postopOrderlar: 'İp kontrolü öğretildi. Kontrol: __ (ilk menstruasyon sonrası). Şiddetli karın ağrısı, ateş, kötü kokulu akıntı, ipin hissedilmemesi veya gebelik şüphesinde başvuru anlatıldı. Değiştirme tarihi: __.',
    },
  },
  {
    kod: 'labioplasti', ad: 'Labioplasti (labia minora redüksiyonu)', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'ACOG Committee Opinion No. 795, Elective Female Genital Cosmetic Surgery (Obstet Gynecol 2020;135:e36–e42): danışmanlık, beden algısı değerlendirmesi, beklenti ve kanıt düzeyi ayrıca belgelenmelidir.',
    veri: {
      islem: 'Labioplasti (__: kenar rezeksiyonu / kama rezeksiyonu / deepitelizasyon)',
      endikasyon: '__ (fonksiyonel yakınma / estetik talep). Danışmanlık, beden algısı taraması (araç ve sonuç: __) ve beklenti değerlendirmesi yapıldı; bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm.',
        'Rezeksiyon sınırları her iki tarafta simetrik olarak işaretlendi.',
        'Lokal infiltrasyon: __ (hekim belirler).',
        'İşaretli doku __ tekniği ile çıkarıldı; klitoral başlık ve frenulum korundu.',
        'Hemostaz __.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Mukoza kenarları emilebilir sütürle __ kapatıldı.',
      postopOrderlar: 'Soğuk uygulama ve hijyen önerileri. Cinsel ilişki ve tampon kısıtlaması: hekim belirler. Kontrol: __. Artan şişlik, kanama, ateş veya akıntıda başvuru anlatıldı.',
    },
  },
  {
    kod: 'labioplasti_klitoral', ad: 'Labioplasti + klitoral başlık redüksiyonu', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'ACOG Committee Opinion No. 795 (2020): klitoral başlık redüksiyonu kadın genital kozmetik işlemler arasında sayılır; etkinlik ve güvenlik için yüksek kaliteli veri yoktur. Klitoris gövdesine ve glansa dokunulmaz.',
    veri: {
      islem: 'Labioplasti (__: kenar / kama / deepitelizasyon) + klitoral başlık redüksiyonu (__: lateral başlık fazlası eksizyonu)',
      endikasyon: '__ (fonksiyonel yakınma / estetik talep). Danışmanlık, beden algısı taraması (araç ve sonuç: __) ve beklenti değerlendirmesi yapıldı; bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm.',
        'İç dudak rezeksiyon sınırları ve başlık fazlası ayakta ve litotomide simetrik işaretlendi; glans korunacak şekilde başlığın orta hattı bırakıldı.',
        'Lokal infiltrasyon: __ (hekim belirler).',
        'İç dudak dokusu __ tekniği ile çıkarıldı; frenulum korundu.',
        'Başlığın lateral fazlası __ ile eksize edildi; klitoris gövdesi, glans ve dorsal sinir bölgesine dokunulmadı.',
        'Hemostaz __; glans açıklığı ve simetri kontrol edildi.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Mukoza ve başlık kenarları emilebilir sütürle __ kapatıldı.',
      postopOrderlar: 'Soğuk uygulama ve hijyen önerileri verildi; hasta talimat sayfası verildi. Cinsel ilişki ve tampon kısıtlaması: __ hafta. Kontrol: __. Artan şişlik, kanama, ateş veya akıntıda başvuru anlatıldı.',
    },
  },
  {
    kod: 'vajinoplasti_kolpoperineorafi', ad: 'Vajinoplasti / kolpoperineorafi (vajinal daraltma)', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'ACOG Committee Opinion No. 795 (2020): kozmetik vajinoplasti tıbbi endikasyonsuzdur, güvenlik ve etkinliği belirlenmemiştir; NICE NG123 (2019) sarkma onarımında. Kozmetik amaçla yapılıyorsa ayrıca danışmanlık ve beden algısı taraması belgelenir.',
    veri: {
      islem: 'Vajinoplasti / kolpoperineorafi (__: posterior kolporafi + perineorafi / levator plikasyonu)',
      endikasyon: '__ (vajinal laksite yakınması / POP-Q evresi __ / doğum hasarı). Pelvik taban kas egzersizleri: __. Danışmanlık ve beklenti değerlendirmesi yapıldı; bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm, mesane sondası.',
        'Hedef introitus genişliği ilişki işlevi gözetilerek belirlendi (ölçüm: __ parmak / __ cm).',
        'Arka vajen duvarında ve perinede __ şeklinde (üçgen / elmas) mukoza işaretlendi ve insize edildi.',
        'Rektovajinal fasya disseke edildi; rektum korundu.',
        'Rektovajinal fasya / levator kenarları __ ile orta hatta plike edildi (aşırı daraltmadan kaçınıldı).',
        'Fazla mukoza eksize edildi; perineal cisim kasları (bulbokavernöz, transvers perineal) yeniden yaklaştırıldı.',
        'Rektal tuşe: sütür rektuma geçmedi: __. Son introitus genişliği: __.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Vajinal mukoza ve perine cildi emilebilir sütürle kapatıldı; vajinal tampon: __.',
      postopOrderlar: POSTOP_GENEL + ' Kabızlıktan kaçınma; ağır kaldırma ve cinsel ilişki kısıtlaması: __ hafta. Hasta talimat sayfası verildi.',
    },
  },
  {
    kod: 'perineoplasti_kolporafi', ad: 'Perineoplasti / kolporafi (sarkma ve doğum hasarı onarımı)', grup: 'Genital estetik', endikasyonSinifiGerekli: true,
    kaynak: 'NICE NG123 Urinary incontinence and pelvic organ prolapse in women: management (2019); ACOG Committee Opinion No. 795 (2020) for cosmetic indications.',
    veri: {
      islem: '__ (posterior kolporafi + perineoplasti / anterior kolporafi)',
      endikasyon: '__ (POP-Q evresi __ / vajinal laksite yakınması). Bilgilendirilmiş onam alındı.',
      teknik: ADIM([
        'Anestezi __; litotomi pozisyonu; antisepsi, steril örtüm, mesane sondası.',
        'Perineal / vajinal mukozada __ insizyon; mukoza alttaki fasyadan disseke edildi.',
        'Rektovajinal / vezikovajinal fasya plikasyonu __ ile yapıldı (rektal / mesane bütünlüğü korundu; rektal tuşe: __).',
        'Fazla mukoza eksize edildi.',
        'Perineal cisim kasları (bulbokavernöz, transvers perineal) __ ile yeniden yaklaştırıldı.',
      ]),
      patoloji: 'gonderilmedi',
      kapanis: 'Vajinal mukoza ve perine cildi emilebilir sütürle kapatıldı; vajinal tampon: __.',
      postopOrderlar: POSTOP_GENEL + ' Kabızlıktan kaçınma; ağır kaldırma ve cinsel ilişki kısıtlaması: hekim belirler.',
    },
  },
]

/** The templates whose operations the benchmark private-practice profile lists on its own site (for the report). */
export const BENCHMARK_SITE_SABLONLARI: readonly string[] = ['vakum_aspirasyon', 'kolposkopi_biyopsi_leep', 'ria_takilmasi', 'labioplasti', 'perineoplasti_kolporafi', 'tanisal_laparoskopi', 'lap_over_kistektomi', 'lap_endometriozis']
