/**
 * Ayşe-standard Turkish reference stacks for every medical specialty.
 *
 * Pattern (same as Pediatri / Prof. Dr. Ayşe Kaya):
 *  1) Named T.C. Sağlık Bakanlığı document / protocol (when exists)
 *  2) Primary Turkish specialty society guideline(s)
 *  3) Sister society / focused TR clinical protocol
 *  4) Additional TR practice source (SB klinik protokol, konsensus)
 *  5) SGK / reçete-rapor rules for that branş
 *
 * Practice authority = these TR sources.
 * International textbooks are secondary depth only.
 */

export type SpecialtyKey =
  | 'pediatri'
  | 'kardiyoloji'
  | 'noroloji'
  | 'dahiliye'
  | 'psikiyatri'
  | 'genel-cerrahi'
  | 'ortopedi'
  | 'dermatoloji'
  | 'kulak-burun-bogaz'
  | 'goz-hastaliklari'
  | 'kadin-hastaliklari-dogum'
  | 'uroloji'
  | 'radyoloji'
  | 'anestezi'
  | 'acil-tip'
  | 'fizik-tedavi'
  | 'enfeksiyon-hastaliklari'
  | 'endokrinoloji'
  | 'gastroenteroloji'
  | 'nefroloji'
  | 'romatoloji'
  | 'onkoloji'
  | 'gogus-hastaliklari'
  | 'gogus-cerrahisi'
  | 'plastik-cerrahi'
  | 'beyin-cerrahisi'
  | 'kalp-damar-cerrahisi'
  | 'cocuk-cerrahisi'
  | 'aile-hekimligi'
  | 'spor-hekimligi'

export const TURKISH_REFS: Record<SpecialtyKey, string[]> = {
  pediatri: [
    'T.C. SB Ulusal Çocukluk Dönemi Aşılama Takvimi (GBP) — 2025',
    'Türk Pediatri Kurumu (TPK) klinik kılavuzları (AGE, ISPA, enürezis vb.)',
    'Türk Çocuk Acil Tıp ve Yoğun Bakım Derneği (ÇAYD) protokolleri',
    'SB Çocuk YBÜ kabul/taburculuk protokolü; Türk Toraks Derneği çocuk pnömoni/bronşiyolit',
    'SGK pediatrik reçete-rapor kuralları',
  ],
  kardiyoloji: [
    'Türk Kardiyoloji Derneği (TKD) — ESC kılavuzlarının resmi TR yayını/yorumu (tkd.org.tr)',
    'ESC/TKD 2023 Akut Koroner Sendrom (AKS) Kılavuzu',
    'ESC/TKD 2024 Atriyal Fibrilasyon; ESC 2021 KY + 2024 Odak Güncelleme',
    'ESC/TKD 2024 Hipertansiyon; ESC/TKD 2025 Dislipidemi; ESC 2023 Diyabet ve KVH',
    'T.C. SB göğüs ağrısı/AKS acil protokolleri; SGK kardiyak ilaç-stent-rapor',
  ],
  noroloji: [
    'T.C. SB + Türk Nöroloji Derneği (TND) + Türk Beyin Damar Hastalıkları Derneği — Akut İskemik İnmede Tanı ve Tedavi Rehberi',
    'TND Epilepsi Tanı ve Tedavi Rehberi (2021)',
    'TND Migren Klinik Protokolü; TND Hareket Bozuklukları Rehberi (2023)',
    'TND Nöromusküler Rehber (2024); SB Klinik Protokolleri: İnme, Alzheimer/Demans, Epilepsi',
    'SGK nöroloji ilaç ve rapor kısıtları',
  ],
  dahiliye: [
    'İliçin İç Hastalıkları — Türk İç Hastalıkları Uzmanlık Derneği (TİHUD) yayını',
    'TİHUD klinik uygulama kaynakları ve eğitim materyalleri',
    'TEMD Diyabetes Mellitus Tanı-Tedavi-İzlem Kılavuzu (2024/2026)',
    'TEMD Hipertansiyon (2022); TEMD Dislipidemi / Obezite kılavuzları',
    'T.C. SB kronik hastalık klinik protokolleri; SGK dahiliye rapor/yeşil reçete',
  ],
  psikiyatri: [
    'Türkiye Psikiyatri Derneği (TPD) tedavi kılavuzları ve çalışma birimi önerileri',
    'T.C. SB Ruh Sağlığı Eylem Planı / ruh sağlığı klinik protokolleri',
    'TPD depresyon, bipolar, şizofreni ve anksiyete tanı-tedavi yaklaşımları (TR)',
    'SB zorunlu yatış / kriz müdahale çerçevesi; bağımlılık tedavi protokolleri',
    'SGK psikotrop ilaç, yeşil-turuncu reçete ve rapor kuralları',
  ],
  'genel-cerrahi': [
    'Türk Cerrahi Derneği (TCD) klinik kılavuz ve konsensusları',
    'T.C. SB ameliyathane güvenliği / cerrahi klinik protokolleri',
    'Türk Kolon ve Rektum Cerrahisi Derneği (TKRCD) ilgili rehberler',
    'Ulusal Travma ve Acil Cerrahi Derneği (UTACD) travma yaklaşımları (TR)',
    'SGK cerrahi paket, ameliyat ve rapor kuralları',
  ],
  ortopedi: [
    'Türk Ortopedi ve Travmatoloji Birliği Derneği (TOTBİD) klinik rehberleri',
    'T.C. SB travma / kırık / acil ortopedi klinik protokolleri',
    'TOTBİD alt grup konsensusları (diz, omuz, omurga, travma)',
    'AO prensiplerinin TOTBİD eğitimleri üzerinden TR uygulaması',
    'SGK protez, implant ve ortopedik malzeme rapor kuralları',
  ],
  dermatoloji: [
    'Türk Dermatoloji Derneği (TDD) klinik kılavuzları',
    'T.C. SB deri kanseri / psoriazis klinik protokolleri',
    'TDD akne, ürtiker, atopik dermatit ve ilaç reaksiyonu konsensusları',
    'Türk Dermatoveneroloji / fototerapi çalışma grubu önerileri (TR)',
    'SGK biyolojik ve dermatolojik ilaç rapor kuralları',
  ],
  'kulak-burun-bogaz': [
    'Türk Kulak Burun Boğaz ve Baş Boyun Cerrahisi Derneği klinik kılavuzları',
    'T.C. SB otitis media, tonsillit, sinüzit klinik protokolleri',
    'Türk Rinoloji Derneği sinüzit / rinoplasti konsensusları',
    'Türk Odyoloji / vestibüler çalışma grubu önerileri (TR KBB pratiği)',
    'SGK işitme cihazı, koklear implant ve KBB cerrahi raporları',
  ],
  'goz-hastaliklari': [
    'Türk Oftalmoloji Derneği (TOD) kılavuz, bülten ve çalışma grubu önerileri',
    'T.C. SB diyabetik retinopati tarama ve glokom klinik protokolleri',
    'TOD Retina, Kornea, Glokom birimleri klinik protokolleri',
    'TOD pediatrik oftalmoloji / şaşılık yaklaşımları (TR)',
    'SGK göz içi lens, anti-VEGF enjeksiyon ve rapor kuralları',
  ],
  'kadin-hastaliklari-dogum': [
    'Türk Jinekoloji ve Obstetrik Derneği (TJOD) klinik kılavuzları',
    'T.C. SB Doğum ve Sezaryen Yönetim Rehberi',
    'SB anne ölümü / obstetrik acil protokolleri; prenatal bakım rehberleri',
    'TJOD jinekolojik onkoloji, üreme endokrinolojisi ve ürojinekoloji konsensusları',
    'SGK gebelik, IVF ve jinekoloji rapor kuralları',
  ],
  uroloji: [
    'Türk Üroloji Derneği (TÜD) klinik kılavuzları',
    'TÜD — EAU kılavuzlarının Türkiye pratiğine uyarlanmış yorumları',
    'T.C. SB üriner sistem enfeksiyonu ve prostat klinik protokolleri',
    'Türk Pediatrik Üroloji / endoüroloji çalışma grubu önerileri',
    'SGK ürolojik ilaç, ESWL, protez ve işlem raporları',
  ],
  radyoloji: [
    'Türk Radyoloji Derneği (TRD) standartları ve kalite önerileri',
    'T.C. SB / TAEK radyasyon güvenliği mevzuatı ve doz sınırları',
    'TRD kontrast madde güvenliği ve gebelikte görüntüleme protokolleri',
    'TRD meme, toraks, nöro ve acil radyoloji çalışma grubu önerileri',
    'SGK görüntüleme tetkik endikasyon ve rapor kuralları',
  ],
  anestezi: [
    'Türk Anesteziyoloji ve Reanimasyon Derneği (TARD) klinik kılavuzları',
    'T.C. SB ameliyathane, sedasyon ve anestezi güvenlik protokolleri',
    'TARD zor havayolu ve obstetrik anestezi önerileri',
    'TARD perioperatif ağrı / ERAS uyumlu TR uygulamaları',
    'SGK anestezi işlem kodları ve rapor kuralları',
  ],
  'acil-tip': [
    'Türkiye Acil Tıp Derneği (TATD) klinik protokolleri ve algoritmaları',
    'T.C. SB Acil Servis klinik protokolleri ve triaj standartları',
    'SB kritik hasta yönlendirme / 112 entegrasyon protokolleri',
    'ATLS Türkiye uygulamaları; ERC resusitasyon eğitiminin TR acil pratiği',
    'SGK acil işlem ve raporlama kuralları',
  ],
  'fizik-tedavi': [
    'Türkiye Fiziksel Tıp ve Rehabilitasyon Derneği klinik kılavuzları',
    'T.C. SB rehabilitasyon ve engellilik değerlendirme protokolleri',
    'Türk Osteoporoz Derneği / TEMD ile örtüşen kemik sağlığı önerileri',
    'FTR ağrı, enjeksiyon ve nörorehabilitasyon çalışma grubu önerileri (TR)',
    'SGK fizik tedavi seans sayısı, ortez ve rapor kuralları',
  ],
  'enfeksiyon-hastaliklari': [
    'KLİMİK (Türk Klinik Mikrobiyoloji ve İnfeksiyon Hastalıkları Derneği) kılavuzları',
    'T.C. SB Akılcı Antibiyotik Kullanımı rehberleri',
    'SB hastane enfeksiyon kontrolü, izolasyon ve sürveyans protokolleri',
    'SB HIV, tüberküloz, viral hepatit tanı-tedavi klinik protokolleri',
    'SGK antibiyotik, antiviral ve enfeksiyon ilaç kısıtları',
  ],
  endokrinoloji: [
    'TEMD Diyabetes Mellitus Tanı, Tedavi ve İzlem Kılavuzu (2024/2026)',
    'TEMD Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu (2025)',
    'TEMD Osteoporoz ve Metabolik Kemik Hastalıkları Kılavuzu (2025)',
    'TEMD Adrenal-Gonadal (2025); Hipertansiyon (2022); Obezite / Dislipidemi',
    'SGK endokrin ilaç, insülin, GLP-1/SGLT2i ve rapor kuralları',
  ],
  gastroenteroloji: [
    'Türk Gastroenteroloji Derneği (TGD) klinik kılavuzları',
    'T.C. SB hepatit B/C, siroz ve GI kanama klinik protokolleri',
    'TGD IBD, H. pylori eradikasyonu ve karaciğer hastalıkları konsensusları',
    'Türk Karaciğer Araştırmaları Derneği (TKAD) ile ortak hepatoloji yaklaşımları',
    'SGK biyolojik, antiviral ve endoskopi rapor kuralları',
  ],
  nefroloji: [
    'Türk Nefroloji Derneği klinik kılavuzları ve konsensusları',
    'T.C. SB kronik böbrek hastalığı ve diyaliz klinik protokolleri',
    'Türk Hipertansiyon ve Böbrek Hastalıkları Derneği ilgili öneriler',
    'KDIGO ilkelerinin Türk Nefroloji Derneği pratiğindeki uyarlamaları',
    'SGK diyaliz, eritropoietin, fosfat bağlayıcı ve rapor kuralları',
  ],
  romatoloji: [
    'Türkiye Romatoloji Derneği klinik kılavuzları',
    'T.C. SB romatoid artrit / SLE klinik protokolleri',
    'Türkiye Romatoloji Derneği biyolojik ajan güvenlik önerileri (TB/HBV tarama)',
    'EULAR/ACR kriterlerinin TR romatoloji pratiğindeki yorumu',
    'SGK biyolojik DMARD ve romatoloji rapor kuralları',
  ],
  onkoloji: [
    'Türk Tıbbi Onkoloji Derneği (TTOD) klinik kılavuzları',
    'T.C. SB ulusal kanser tarama ve tedavi protokolleri',
    'Türk Radyasyon Onkolojisi / Hematoloji dernekleriyle ortak TR yaklaşımlar',
    'NCCN/ESMO’nun TTOD üzerinden Türkiye ilaç erişimine uyarlanmış uygulaması',
    'SGK onkoloji ilaçları, yeşil reçete ve tedavi rapor kuralları',
  ],
  'gogus-hastaliklari': [
    'Türk Toraks Derneği (TTD) astım, KOAH, pnömoni kılavuzları',
    'GINA/GOLD’un TTD tarafından Türkiye’ye uyarlanmış önerileri',
    'T.C. SB tüberküloz tanı-tedavi ve pnömoni klinik protokolleri',
    'TTD pulmoner emboli / uyku bozuklukları çalışma grubu önerileri',
    'SGK inhaler, uzun süreli oksijen, NIV ve rapor kuralları',
  ],
  'gogus-cerrahisi': [
    'Türk Göğüs Cerrahisi Derneği klinik kılavuzları',
    'T.C. SB toraks travması ve tüp torakostomi protokolleri',
    'TTD + Türk Göğüs Cerrahisi Derneği akciğer kanseri cerrahi yaklaşımları',
    'Türk Toraks Derneği / göğüs cerrahisi VATS-minimal invaziv konsensusları',
    'SGK torasik cerrahi paket ve rapor kuralları',
  ],
  'plastik-cerrahi': [
    'Türk Plastik Rekonstrüktif ve Estetik Cerrahi Derneği (TPRECD) kılavuzları',
    'T.C. SB yanık merkezi ve yara bakımı klinik protokolleri',
    'TPRECD etik, hasta güvenliği ve estetik cerrahi önerileri',
    'Türk El ve Üst Ekstremite Cerrahisi Derneği ortak yaklaşımlar (TR)',
    'SGK rekonstrüktif işlem ve rapor kuralları',
  ],
  'beyin-cerrahisi': [
    'Türk Nöroşirürji Derneği klinik kılavuzları',
    'T.C. SB kafa travması ve spinal travma klinik protokolleri',
    'Türk Nöroşirürji Derneği tümör / vasküler / spinal çalışma grubu önerileri',
    'TND (nöroloji) + TBDHD ile ortak inme/trombektomi cerrahi köprüsü',
    'SGK nöroşirürji işlem ve rapor kuralları',
  ],
  'kalp-damar-cerrahisi': [
    'Türk Kalp ve Damar Cerrahisi Derneği klinik kılavuzları',
    'TKD + Türk Kalp Damar Cerrahisi Derneği ortak kapak/CABG/aort yaklaşımları',
    'T.C. SB kardiyak cerrahi ve perioperatif klinik protokolleri',
    'Türk Damar Cerrahisi / periferik arter hastalıkları konsensusları',
    'SGK kalp-damar cerrahi paket, kapak ve stent-graft raporları',
  ],
  'cocuk-cerrahisi': [
    'Türk Çocuk Cerrahisi Derneği klinik kılavuzları',
    'T.C. SB yenidoğan ve çocuk cerrahi acil protokolleri',
    'ÇAYD + Türk Çocuk Cerrahisi Derneği ortak çocuk acil cerrahi yaklaşımlar',
    'SB çocuk yoğun bakım / cerrahi sevk protokolleri',
    'SGK çocuk cerrahi işlem ve rapor kuralları',
  ],
  'aile-hekimligi': [
    'Türkiye Aile Hekimleri Uzmanlık Derneği (TAHUD) klinik kaynakları',
    'T.C. SB Aile Hekimliği uygulama yönetmeliği ve kronik hastalık protokolleri',
    'SB Ulusal Aşılama Takvimi (çocuk + erişkin bağışıklama)',
    'SB birinci basamak tarama, sevk ve koruyucu hekimlik rehberleri',
    'SGK aile hekimliği performans, reçete ve rapor kuralları',
  ],
  'spor-hekimligi': [
    'Türkiye Spor Hekimliği Derneği klinik kılavuzları',
    'T.C. SB sporcu sağlık kurulu mevzuatı ve muayene standartları',
    'TOTBİD + Spor Hekimliği Derneği spor yaralanması ortak yaklaşımları',
    'Türkiye Anti-Doping mevzuatı farkındalığı (hekim sorumluluğu)',
    'SGK spor hekimliği işlem / rapor çerçevesi (ilgili branş kodları)',
  ],
}

/** Secondary international texts — depth only; never override TURKISH_REFS. */
export const SECONDARY_TEXTBOOKS: Record<SpecialtyKey, string[]> = {
  pediatri: [
    'Nelson Textbook of Pediatrics (TR asistanlıkta uluslararası destek metin)',
    'Harriet Lane Handbook (pediatrik doz cep referansı)',
    "Oski's / Rudolph's Pediatrics (ayırıcı tanı derinliği)",
  ],
  kardiyoloji: [
    "Braunwald's Heart Disease (uluslararası destek — çakışmada TKD/ESC öncelikli)",
    "Hurst's The Heart (pratik kardiyoloji derinliği)",
    'ESC textbook / ESC Pocket Guidelines (TKD TR yayını ile birlikte)',
  ],
  noroloji: [
    "Adams & Victor's Principles of Neurology (uluslararası destek — çakışmada TND/SB öncelikli)",
    "Bradley and Daroff's Neurology in Clinical Practice",
    "Merritt's Neurology",
  ],
  dahiliye: [
    "Harrison's Principles of Internal Medicine (uluslararası destek — çakışmada İliçin/TEMD/TİHUD öncelikli)",
    'Goldman-Cecil Medicine',
    'Washington Manual of Medical Therapeutics (cep)',
  ],
  psikiyatri: [
    "Kaplan & Sadock (uluslararası destek — çakışmada TPD/SB öncelikli)",
    'DSM-5-TR (TR pratiğinde tanı standardı olarak kullanılır)',
    "Stahl's Essential Psychopharmacology",
  ],
  'genel-cerrahi': [
    "Schwartz's Principles of Surgery (uluslararası destek — çakışmada TCD/SB öncelikli)",
    'Sabiston Textbook of Surgery',
    'ATLS (TR travma eğitimi ile birlikte)',
  ],
  ortopedi: [
    "Rockwood and Green's Fractures (uluslararası destek — çakışmada TOTBİD/SB öncelikli)",
    "Campbell's Operative Orthopaedics",
    'AO Trauma principles (TOTBİD eğitimi ile)',
  ],
  dermatoloji: [
    "Fitzpatrick's Dermatology (uluslararası destek — çakışmada TDD/SB öncelikli)",
    'Bolognia Dermatology',
    "Andrews' Diseases of the Skin",
  ],
  'kulak-burun-bogaz': [
    'Cummings Otolaryngology (uluslararası destek — çakışmada Türk KBB Derneği/SB öncelikli)',
    "Bailey's Head and Neck Surgery",
    'KBB acil cep protokolleri',
  ],
  'goz-hastaliklari': [
    "Kanski's Clinical Ophthalmology (uluslararası destek — çakışmada TOD/SB öncelikli)",
    'Vaughan & Asbury General Ophthalmology',
    'AAO BCSC (ikincil eğitim serisi)',
  ],
  'kadin-hastaliklari-dogum': [
    'Williams Obstetrics (uluslararası destek — çakışmada TJOD/SB öncelikli)',
    'Berek & Novak Gynecology',
    'ACOG bulletins (yalnızca TJOD/SB ile çelişmezse)',
  ],
  uroloji: [
    'Campbell-Walsh-Wein Urology (uluslararası destek — çakışmada TÜD öncelikli)',
    'EAU Guidelines (TÜD TR yorumu ile)',
    'Smith & Tanagho General Urology',
  ],
  radyoloji: [
    'Grainger & Allison (uluslararası destek — çakışmada TRD/SB/TAEK öncelikli)',
    'Brant & Helms Fundamentals of Diagnostic Radiology',
    'ACR Appropriateness Criteria (ikincil)',
  ],
  anestezi: [
    "Miller's Anesthesia (uluslararası destek — çakışmada TARD/SB öncelikli)",
    'Morgan & Mikhail Clinical Anesthesiology',
    'ESA/ASA guidelines (yalnızca TARD ile uyumluysa)',
  ],
  'acil-tip': [
    "Tintinalli's Emergency Medicine (uluslararası destek — çakışmada TATD/SB öncelikli)",
    "Rosen's Emergency Medicine",
    'ATLS / ACLS / PALS (TR eğitim versiyonları ile)',
  ],
  'fizik-tedavi': [
    "Braddom's PM&R (uluslararası destek — çakışmada Türkiye FTR Derneği/SB öncelikli)",
    "DeLisa's Physical Medicine & Rehabilitation",
    'PM&R board review (ikincil)',
  ],
  'enfeksiyon-hastaliklari': [
    'Mandell Principles of Infectious Diseases (uluslararası destek — çakışmada KLİMİK/SB öncelikli)',
    'Sanford Guide (cep)',
    'IDSA guidelines (yalnızca KLİMİK/SB ile çelişmezse)',
  ],
  endokrinoloji: [
    'Williams Textbook of Endocrinology (uluslararası destek — çakışmada TEMD öncelikli)',
    "Greenspan's Basic & Clinical Endocrinology",
    'Endocrine Society guidelines (ikincil)',
  ],
  gastroenteroloji: [
    'Sleisenger and Fordtran (uluslararası destek — çakışmada TGD/SB öncelikli)',
    "Yamada's Textbook of Gastroenterology",
    'ASGE/ACG guidelines (ikincil)',
  ],
  nefroloji: [
    "Brenner & Rector's The Kidney (uluslararası destek — çakışmada Türk Nefroloji Derneği/SB öncelikli)",
    'Comprehensive Clinical Nephrology',
    'KDIGO (Türk Nefroloji Derneği uyarlaması ile)',
  ],
  romatoloji: [
    "Kelley and Firestein's Rheumatology (uluslararası destek — çakışmada Türkiye Romatoloji Derneği/SB öncelikli)",
    'Oxford Textbook of Rheumatology',
    'ACR/EULAR criteria (TR yorumu ile)',
  ],
  onkoloji: [
    'DeVita Cancer (uluslararası destek — çakışmada TTOD/SB öncelikli)',
    'NCCN Guidelines (TTOD/SGK erişimi çerçevesinde)',
    'ESMO Clinical Practice Guidelines (ikincil)',
  ],
  'gogus-hastaliklari': [
    "Murray & Nadel's Respiratory Medicine (uluslararası destek — çakışmada TTD/SB öncelikli)",
    "Fishman's Pulmonary Diseases",
    'GINA / GOLD (TTD TR uyarlaması ile)',
  ],
  'gogus-cerrahisi': [
    "Shields' General Thoracic Surgery (uluslararası destek — çakışmada Türk Göğüs Cerrahisi Derneği öncelikli)",
    "Pearson's Thoracic & Esophageal Surgery",
    'ESTS guidelines (ikincil)',
  ],
  'plastik-cerrahi': [
    "Grabb and Smith's Plastic Surgery (uluslararası destek — çakışmada TPRECD/SB öncelikli)",
    'Plastic Surgery (Neligan)',
    'ASPS guidelines (ikincil)',
  ],
  'beyin-cerrahisi': [
    'Youmans and Winn (uluslararası destek — çakışmada Türk Nöroşirürji Derneği/SB öncelikli)',
    'Handbook of Neurosurgery (Greenberg)',
    'AANS/CNS guidelines (ikincil)',
  ],
  'kalp-damar-cerrahisi': [
    'Kirklin/Barratt-Boyes (uluslararası destek — çakışmada Türk Kalp Damar Cerrahisi Derneği/TKD öncelikli)',
    'Cardiac Surgery in the Adult (Cohn)',
    'EACTS/AATS guidelines (ikincil)',
  ],
  'cocuk-cerrahisi': [
    "Ashcraft's Pediatric Surgery (uluslararası destek — çakışmada Türk Çocuk Cerrahisi Derneği/SB öncelikli)",
    'Pediatric Surgery (Coran)',
    'APSA guidelines (ikincil)',
  ],
  'aile-hekimligi': [
    'Rakel Textbook of Family Medicine (uluslararası destek — çakışmada TAHUD/SB öncelikli)',
    'Current Medical Diagnosis & Treatment',
    'ICPC-2 (birinci basamak kodlama)',
  ],
  'spor-hekimligi': [
    "Brukner & Khan's Clinical Sports Medicine (uluslararası destek — çakışmada Türkiye Spor Hekimliği Derneği öncelikli)",
    'ACSM Sports Medicine',
    'IOC consensus (TR anti-doping/SB çerçevesinde)',
  ],
}
