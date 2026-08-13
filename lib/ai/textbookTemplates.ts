// ============================================================
// NOTYA AI - Textbook-Grounded Medical Specialty Templates
// Every specialty references its gold-standard textbooks
// AI reasoning is anchored in what doctors actually trust
// ============================================================

import type { MedicalSpecialty } from "@/types/notya"

export interface SpecialtyTemplate {
  name: string
  goldStandardTextbooks: TextbookReference[]
  clinicalGuidelines: string[]
  systemPrompt: string
  criticalKeywords: string[]
  icd10Focus: string[]
}

export interface TextbookReference {
  title: string
  authors: string
  edition: string
  publisher: string
  why: string // Why this book is trusted
}

const TEXTBOOK_LIBRARY: Record<string, TextbookReference[]> = {

  // ── PEDIATRICS (TR practice: SB/TPK/ÇAYD first, Nelson/Harriet Lane support) ──
  pediatri: [
    {
      title: "T.C. Sağlık Bakanlığı Ulusal Çocukluk Dönemi Aşılama Takvimi (GBP)",
      authors: "Halk Sağlığı Genel Müdürlüğü",
      edition: "2025",
      publisher: "T.C. Sağlık Bakanlığı",
      why: "Türkiye'de aşı uygulamasının resmi kaynağı; klinik konuşmada bağlayıcıdır."
    },
    {
      title: "Türk Pediatri Kurumu Klinik Kılavuzları",
      authors: "Türk Pediatri Kurumu (TPK)",
      edition: "Güncel",
      publisher: "TPK",
      why: "AGE, inek sütü proteini alerjisi, enürezis vb. ulusal pediatri kılavuzları."
    },
    {
      title: "ÇAYD / SB Çocuk Acil ve Yoğun Bakım Protokolleri",
      authors: "Türk Çocuk Acil Tıp ve Yoğun Bakım Derneği",
      edition: "Güncel + SB 2025 YBÜ protokolü",
      publisher: "ÇAYD / Sağlık Bakanlığı",
      why: "Çocuk acil red-flag, YBÜ kabul-taburculuk ve acil yaklaşım standardı."
    },
    {
      title: "Nelson Textbook of Pediatrics + Harriet Lane Handbook",
      authors: "Kliegman et al. / Johns Hopkins",
      edition: "Güncel baskılar",
      publisher: "Elsevier",
      why: "TR asistanlıkta hâlâ kullanılan uluslararası metin + mg/kg doz cep kitabı."
    }
  ],

  // ── KARDİYOLOJİ (TR practice: TKD publishes/adopts ESC) ──
  kardiyoloji: [
    {
      title: "TKD / ESC Akut Koroner Sendrom Kılavuzu",
      authors: "Türk Kardiyoloji Derneği / ESC",
      edition: "2023",
      publisher: "TKD",
      why: "Türkiye'de AKS pratiğinin birincil kılavuzu (TKD üzerinden ESC)."
    },
    {
      title: "TKD / ESC Atriyal Fibrilasyon Kılavuzu",
      authors: "Türk Kardiyoloji Derneği / ESC",
      edition: "2024",
      publisher: "TKD",
      why: "AF risk skorları, antikoagülan ve ritim/hız kontrolü için TR standardı."
    },
    {
      title: "ESC Kalp Yetersizliği + 2024 Odak Güncelleme (TKD)",
      authors: "ESC / TKD yorumu",
      edition: "2021 + 2024 focused update",
      publisher: "ESC / TKD",
      why: "HFrEF dört ilaçlı tedavi, SGLT2i, HFpEF/HFmrEF güncellemeleri."
    },
    {
      title: "Braunwald's Heart Disease",
      authors: "Libby, Bonow, Mann et al.",
      edition: "12th Edition",
      publisher: "Elsevier",
      why: "Patofizyoloji ve derin referans; ulusal kılavuzla çakışmada TKD/ESC öncelikli."
    }
  ],

  // ── NÖROLOJİ (TR: TND + SB klinik protokolleri) ──
  noroloji: [
    {
      title: "Akut İskemik İnmede Tanı ve Tedavi Rehberi",
      authors: "T.C. SB + TND + Türk Beyin Damar Hastalıkları Derneği",
      edition: "Güncel SB yayını",
      publisher: "Sağlık Bakanlığı",
      why: "Türkiye'de tPA/trombektomi ve inme zinciri için resmi ulusal rehber."
    },
    {
      title: "TND Epilepsi Tanı ve Tedavi Rehberi",
      authors: "Türk Nöroloji Derneği",
      edition: "2021",
      publisher: "TND",
      why: "Epilepsi sınıflama ve antiepileptik seçiminde ulusal rehber."
    },
    {
      title: "TND Migren Klinik Protokolü / Hareket Bozuklukları Rehberi",
      authors: "Türk Nöroloji Derneği",
      edition: "Migren protokolü + 2023 hareket bozuklukları",
      publisher: "TND",
      why: "Başağrısı ve Parkinson/hareket bozuklukları için TR klinik protokoller."
    },
    {
      title: "Adams and Victor's Principles of Neurology",
      authors: "Ropper, Samuels, Klein, Prasad",
      edition: "12th Edition",
      publisher: "McGraw-Hill",
      why: "Nöroloji muayene ve mekanizma derinliği; ulusal rehberle çakışmada TND/SB öncelikli."
    }
  ],

  // ── PSİKİYATRİ ──────────────────────────────────────────────
  psikiyatri: [
    {
      title: "Kaplan & Sadock's Comprehensive Textbook of Psychiatry",
      authors: "Sadock, Sadock, Ruiz",
      edition: "11th Edition, 2024",
      publisher: "Lippincott Williams & Wilkins",
      why: "Psikiyatrinin en kapsamlı referansı. DSM-5-TR kriterlerini tam entegre eder."
    },
    {
      title: "DSM-5-TR: Diagnostic and Statistical Manual of Mental Disorders",
      authors: "American Psychiatric Association",
      edition: "Text Revision, 2022",
      publisher: "APA",
      why: "Psikiyatrik tanı için zorunlu standart. Her tanı için kesin kriterler."
    },
    {
      title: "Stahl's Essential Psychopharmacology",
      authors: "Stahl, Stephen M.",
      edition: "5th Edition, 2021",
      publisher: "Cambridge University Press",
      why: "Psikiyatrik ilaçların mekanizması ve klinik kullanımı için en görsel ve açıklayıcı kaynak."
    },
    {
      title: "Massachusetts General Hospital Handbook of General Hospital Psychiatry",
      authors: "Stern, Beach, Freudenreich",
      edition: "8th Edition, 2024",
      publisher: "Elsevier",
      why: "Konsültasyon psikiyatrisi için altın standart. 40+ yıllık güvenilir başvuru."
    }
  ],

  // ── DAHİLİYE (TR: İliçin/TİHUD + TEMD hastalık kılavuzları) ──
  dahiliye: [
    {
      title: "İliçin İç Hastalıkları",
      authors: "İliçin, Biberoğlu, Süleymanlar, Ünal et al.",
      edition: "Güncel baskı",
      publisher: "Türk İç Hastalıkları Uzmanlık Derneği (TİHUD)",
      why: "Türkiye'de en çok okunan Türkçe iç hastalıkları kitabı; TİHUD yayını."
    },
    {
      title: "TEMD Diyabetes Mellitus Tanı, Tedavi ve İzlem Kılavuzu",
      authors: "Türkiye Endokrinoloji ve Metabolizma Derneği",
      edition: "2024 / 2026 çevrim içi",
      publisher: "TEMD",
      why: "TR'de DM yönetimi için birincil ulusal kılavuz (hedefler, ilaç basamakları)."
    },
    {
      title: "TEMD Hipertansiyon Tanı ve Tedavi Kılavuzu",
      authors: "TEMD Obezite-Dislipidemi-HT Çalışma Grubu",
      edition: "2022",
      publisher: "TEMD",
      why: "Dahiliye pratiğinde HT eşik/hedef ve özel durumlar için ulusal kılavuz."
    },
    {
      title: "Harrison's Principles of Internal Medicine",
      authors: "Jameson, Fauci, Kasper et al.",
      edition: "22nd Edition",
      publisher: "McGraw-Hill",
      why: "Patofizyoloji desteği; ulusal TEMD/TİHUD ile çakışmada TR kılavuz öncelikli."
    }
  ],

  // ── ORTOPEDİ ────────────────────────────────────────────────
  ortopedi: [
    {
      title: "Campbell's Operative Orthopaedics",
      authors: "Azar, Beaty, Canale",
      edition: "14th Edition, 2021",
      publisher: "Elsevier",
      why: "Ortopedik cerrahinin bütün tekniklerini kapsayan mutlak referans. 4 cilt."
    },
    {
      title: "Rockwood and Green's Fractures in Adults",
      authors: "Tornetta, Court-Brown, Ricci, Ostrum, McQueen",
      edition: "9th Edition",
      publisher: "Lippincott",
      why: "Kırık sınıflaması ve tedavisi için altın standart. AO/OTA sınıflamasının referansı."
    },
    {
      title: "Miller's Review of Orthopaedics",
      authors: "Miller, Thompson",
      edition: "8th Edition, 2020",
      publisher: "Elsevier",
      why: "Kapsamlı ortopedi özeti. Board sınavları ve günlük pratik için vazgeçilmez."
    }
  ],

  // ── KADIN HASTALIKLARI ───────────────────────────────────────
  kadin_hastaliklari: [
    {
      title: "Williams Obstetrics",
      authors: "Cunningham, Leveno, Bloom, Spong, Dashe, Hoffman",
      edition: "26th Edition, 2022",
      publisher: "McGraw-Hill",
      why: "Obstetrik'in kutsal kitabı. Gebelik, doğum ve komplikasyon yönetimi standardı."
    },
    {
      title: "Berek & Novak's Gynecology",
      authors: "Berek, Jonathan S.",
      edition: "16th Edition, 2020",
      publisher: "Lippincott",
      why: "Jinekoloji'nin en kapsamlı referansı. Onkoloji dahil tüm jinekolojik hastalıklar."
    },
    {
      title: "ACOG Practice Bulletins",
      authors: "American College of Obstetricians and Gynecologists",
      edition: "2024 Current",
      publisher: "ACOG",
      why: "Kadın doğum pratiği için güncel kılavuzlar. Preeklampsi, GDM, doğum protokolleri."
    }
  ],

  // ── GENEL CERRAHİ ────────────────────────────────────────────
  genel_cerrahi: [
    {
      title: "Sabiston Textbook of Surgery",
      authors: "Townsend, Beauchamp, Evers, Mattox",
      edition: "21st Edition, 2022",
      publisher: "Elsevier",
      why: "Genel cerrahinin kutsal kitabı. Her cerrahi hastalık için kapsamlı referans."
    },
    {
      title: "Schwartz's Principles of Surgery",
      authors: "Brunicardi, Andersen, Billiar, Dunn, Hunter, Matthews",
      edition: "11th Edition, 2019",
      publisher: "McGraw-Hill",
      why: "Cerrahi fizyoloji ve teknik için temel referans. Laparoskopik prosedürler dahil."
    },
    {
      title: "Fischer's Mastery of Surgery",
      authors: "Fischer, Jones, Pomposelli, Upchurch",
      edition: "7th Edition",
      publisher: "Lippincott",
      why: "Cerrahi teknik atlası. Her prosedür için adım adım görsel rehber."
    }
  ],

  // ── DERMATOLOJ ──────────────────────────────────────────────
  dermatoloji: [
    {
      title: "Dermatology (Bologna)",
      authors: "Bollonia, Schaffer, Cerroni",
      edition: "5th Edition, 2024",
      publisher: "Elsevier",
      why: "Dermatolojinin standart referansı. Dermoskopi dahil kapsamlı görsel atlas."
    },
    {
      title: "Fitzpatrick's Dermatology",
      authors: "Kang, Amagai, Bruckner, Enk, Margolis, McMichael, Orringer",
      edition: "9th Edition, 2019",
      publisher: "McGraw-Hill",
      why: "Fitzpatrick'in renk atlası. Tanısal dermatoloji için altın standart görsel referans."
    },
    {
      title: "Andrews' Diseases of the Skin",
      authors: "Elston, Ferringer, Ko, Peckham, High, DiCaudo",
      edition: "13th Edition, 2019",
      publisher: "Elsevier",
      why: "Klinik dermatoloji için pratik referans. Tedavi protokolleri odaklı."
    }
  ],

  // ── UROLOJİ ─────────────────────────────────────────────────
  uroloji: [
    {
      title: "Campbell-Walsh-Wein Urology",
      authors: "Partin, Dmochowski, Kavoussi, Peters",
      edition: "12th Edition, 2021",
      publisher: "Elsevier",
      why: "Üroloji'nin altın standardı. 4 cilt, her ürolojik hastalık için kapsamlı referans."
    },
    {
      title: "EAU Guidelines on Urological Infections",
      authors: "European Association of Urology",
      edition: "2024 Current",
      publisher: "EAU",
      why: "Taş hastalığı, mesane kanseri, prostat için güncel Avrupa kılavuzları."
    }
  ],

  // ── ONKOLOJİ ────────────────────────────────────────────────
  onkoloji: [
    {
      title: "DeVita, Hellman, and Rosenberg's Cancer: Principles & Practice of Oncology",
      authors: "DeVita, Lawrence, Rosenberg",
      edition: "12th Edition, 2023",
      publisher: "Lippincott",
      why: "Onkolojinin kutsal kitabı. Kanser biyolojisi ve tedavi protokolleri."
    },
    {
      title: "NCCN Clinical Practice Guidelines in Oncology",
      authors: "National Comprehensive Cancer Network",
      edition: "2024 Current",
      publisher: "NCCN",
      why: "Kanser tedavisinde güncel protokoller. Kemoterapi rejimleri için standart referans."
    },
    {
      title: "ESMO Clinical Practice Guidelines",
      authors: "European Society for Medical Oncology",
      edition: "2024 Current",
      publisher: "ESMO",
      why: "Avrupa onkoloji kılavuzları. Türk onkologların tercih ettiği Avrupa standardı."
    }
  ],

  // ── ACİL TIP ────────────────────────────────────────────────
  acil: [
    {
      title: "Tintinalli's Emergency Medicine",
      authors: "Tintinalli, Ma, Yealy, Meckler, Stapczynski",
      edition: "9th Edition, 2020",
      publisher: "McGraw-Hill",
      why: "Acil tıbbın mutlak referansı. Her acil durum için protokol ve karar ağaçları."
    },
    {
      title: "Rosen's Emergency Medicine",
      authors: "Walls, Hockberger, Gausche-Hill",
      edition: "9th Edition",
      publisher: "Elsevier",
      why: "Rosen's: Acil hekimlerin ikinci kutsal kitabı. Kapsamlı ve kanıta dayalı."
    },
    {
      title: "Roberts and Hedges' Clinical Procedures in Emergency Medicine",
      authors: "Roberts, Custalow, Thomsen",
      edition: "7th Edition",
      publisher: "Elsevier",
      why: "Acil prosedürler için atlası. Her girişimsel işlem için görsel rehber."
    }
  ],

  // ── KBB ─────────────────────────────────────────────────────
  kulak_burun_bogaz: [
    {
      title: "Cummings Otolaryngology: Head and Neck Surgery",
      authors: "Flint, Haughey, Francis, Lesperance, Lund, Thomas",
      edition: "7th Edition, 2021",
      publisher: "Elsevier",
      why: "KBB cerrahisinin altın standardı. Baş boyun cerrahisi dahil kapsamlı referans."
    },
    {
      title: "EPOS Guidelines (European Position Paper on Rhinosinusitis)",
      authors: "Fokkens et al.",
      edition: "EPOS 2020",
      publisher: "Rhinology",
      why: "Sinüzit tanı ve tedavisi için Avrupa kılavuzu. Türk KBB hekimlerinin standardı."
    }
  ],

  // ── GÖZ HASTALIKLARI ─────────────────────────────────────────
  goz: [
    {
      title: "Vaughan & Asbury's General Ophthalmology",
      authors: "Riordan-Eva, Augsburger",
      edition: "20th Edition, 2022",
      publisher: "McGraw-Hill",
      why: "Genel oftalmoloji için kapsamlı giriş referansı."
    },
    {
      title: "American Academy of Ophthalmology - Basic and Clinical Science Course",
      authors: "AAO",
      edition: "2024-2025",
      publisher: "AAO",
      why: "AAO'nun 13 ciltlik eğitim serisi. Oftalmoloji uzmanlaşması için standart müfredat."
    }
  ],

  // ── GENEL PRATİSYEN / AİLE ───────────────────────────────────
  genel: [
    {
      title: "T.C. SB Aile Hekimliği / TAHUD kaynakları",
      authors: "Sağlık Bakanlığı / TAHUD",
      edition: "Güncel",
      publisher: "T.C. Sağlık Bakanlığı",
      why: "Birinci basamak TR protokolleri, aşı ve kronik hastalık izlemi."
    },
    {
      title: "Harrison's Principles of Internal Medicine",
      authors: "Jameson et al.",
      edition: "22nd Edition",
      publisher: "McGraw-Hill",
      why: "Genel hekimlik için temel referans."
    },
    {
      title: "Oxford Handbook of Clinical Medicine",
      authors: "Longmore et al.",
      edition: "10th Edition",
      publisher: "Oxford",
      why: "Hızlı klinik başvuru."
    }
  ],

  // Hyphen-key aliases matching lib/doktor/specialties.ts (30 branş)
  "genel-cerrahi": [
    { title: "Türk Cerrahi Derneği (TCD) kılavuzları", authors: "TCD", edition: "Güncel", publisher: "TCD", why: "TR genel cerrahi pratik standardı." },
    { title: "Schwartz's Principles of Surgery", authors: "Brunicardi et al.", edition: "11e", publisher: "McGraw-Hill", why: "Uluslararası cerrahi metin." },
  ],
  "acil-tip": [
    { title: "Türkiye Acil Tıp Derneği (TATD) protokolleri", authors: "TATD", edition: "Güncel", publisher: "TATD", why: "TR acil tıp protokolleri." },
    { title: "Tintinalli's Emergency Medicine", authors: "Tintinalli et al.", edition: "9e", publisher: "McGraw-Hill", why: "Acil tıp uluslararası metin." },
  ],
  "kulak-burun-bogaz": [
    { title: "Türk KBB-BBC Derneği kılavuzları", authors: "Türk KBB Derneği", edition: "Güncel", publisher: "KBB Derneği", why: "TR KBB standardı." },
    { title: "Cummings Otolaryngology", authors: "Flint et al.", edition: "7e", publisher: "Elsevier", why: "KBB uluslararası metin." },
  ],
  "goz-hastaliklari": [
    { title: "Türk Oftalmoloji Derneği (TOD) kılavuzları", authors: "TOD", edition: "Güncel", publisher: "TOD", why: "TR göz hastalıkları standardı." },
    { title: "Kanski's Clinical Ophthalmology", authors: "Salmon", edition: "9e", publisher: "Elsevier", why: "Oftalmoloji klinik metin." },
  ],
  "kadin-hastaliklari-dogum": [
    { title: "TJOD kılavuzları + SB Doğum Yönetim Rehberi", authors: "TJOD / SB", edition: "Güncel", publisher: "TJOD / SB", why: "TR obstetri-jinekoloji standardı." },
    { title: "Williams Obstetrics", authors: "Cunningham et al.", edition: "26e", publisher: "McGraw-Hill", why: "Obstetri uluslararası metin." },
  ],
  "fizik-tedavi": [
    { title: "Türkiye FTR Derneği kılavuzları", authors: "TFTRD", edition: "Güncel", publisher: "TFTRD", why: "TR FTR standardı." },
    { title: "Braddom's Physical Medicine", authors: "Cifu", edition: "5e", publisher: "Elsevier", why: "PM&R uluslararası metin." },
  ],
  "enfeksiyon-hastaliklari": [
    { title: "KLİMİK kılavuzları + SB akılcı antibiyotik", authors: "KLİMİK / SB", edition: "Güncel", publisher: "KLİMİK", why: "TR enfeksiyon hastalıkları standardı." },
    { title: "Mandell Principles of Infectious Diseases", authors: "Bennett et al.", edition: "9e", publisher: "Elsevier", why: "Enfeksiyon uluslararası metin." },
  ],
  endokrinoloji: [
    { title: "TEMD DM / Tiroid / Osteoporoz kılavuzları", authors: "TEMD", edition: "2024–2026", publisher: "TEMD", why: "TR endokrinoloji birincil kılavuzları." },
    { title: "Williams Textbook of Endocrinology", authors: "Melmed et al.", edition: "14e", publisher: "Elsevier", why: "Endokrinoloji uluslararası metin." },
  ],
  gastroenteroloji: [
    { title: "Türk Gastroenteroloji Derneği (TGD) kılavuzları", authors: "TGD", edition: "Güncel", publisher: "TGD", why: "TR gastroenteroloji standardı." },
    { title: "Sleisenger and Fordtran", authors: "Feldman et al.", edition: "11e", publisher: "Elsevier", why: "GI uluslararası metin." },
  ],
  nefroloji: [
    { title: "Türk Nefroloji Derneği kılavuzları + SB diyaliz", authors: "TND / SB", edition: "Güncel", publisher: "Türk Nefroloji Derneği", why: "TR nefroloji standardı." },
    { title: "Brenner & Rector's The Kidney", authors: "Yu et al.", edition: "11e", publisher: "Elsevier", why: "Nefroloji uluslararası metin." },
  ],
  romatoloji: [
    { title: "Türkiye Romatoloji Derneği kılavuzları", authors: "TRD", edition: "Güncel", publisher: "TRD", why: "TR romatoloji standardı." },
    { title: "Kelley & Firestein's Rheumatology", authors: "Firestein et al.", edition: "10e", publisher: "Elsevier", why: "Romatoloji uluslararası metin." },
  ],
  "gogus-hastaliklari": [
    { title: "Türk Toraks Derneği (TTD) + GINA/GOLD uyarlaması", authors: "TTD", edition: "Güncel", publisher: "TTD", why: "TR göğüs hastalıkları standardı." },
    { title: "Murray & Nadel's Textbook of Respiratory Medicine", authors: "Broaddus et al.", edition: "7e", publisher: "Elsevier", why: "Solunum uluslararası metin." },
  ],
  "gogus-cerrahisi": [
    { title: "Türk Göğüs Cerrahisi Derneği kılavuzları", authors: "TGCD", edition: "Güncel", publisher: "TGCD", why: "TR göğüs cerrahisi standardı." },
    { title: "Shields' General Thoracic Surgery", authors: "LoCicero et al.", edition: "8e", publisher: "Wolters Kluwer", why: "Torasik cerrahi uluslararası metin." },
  ],
  "plastik-cerrahi": [
    { title: "TPRECD kılavuzları + SB yanık protokolleri", authors: "TPRECD / SB", edition: "Güncel", publisher: "TPRECD", why: "TR plastik cerrahi standardı." },
    { title: "Grabb and Smith's Plastic Surgery", authors: "Chung et al.", edition: "8e", publisher: "Wolters Kluwer", why: "Plastik cerrahi uluslararası metin." },
  ],
  "beyin-cerrahisi": [
    { title: "Türk Nöroşirürji Derneği kılavuzları", authors: "TND", edition: "Güncel", publisher: "Türk Nöroşirürji Derneği", why: "TR beyin cerrahisi standardı." },
    { title: "Youmans and Winn Neurological Surgery", authors: "Winn", edition: "8e", publisher: "Elsevier", why: "Nöroşirürji uluslararası metin." },
  ],
  "kalp-damar-cerrahisi": [
    { title: "Türk Kalp ve Damar Cerrahisi Derneği + TKD", authors: "TKDCD / TKD", edition: "Güncel", publisher: "TKDCD", why: "TR KVC standardı." },
    { title: "Kirklin/Barratt-Boyes Cardiac Surgery", authors: "Kouchoukos et al.", edition: "4e", publisher: "Elsevier", why: "Kardiyak cerrahi uluslararası metin." },
  ],
  "cocuk-cerrahisi": [
    { title: "Türk Çocuk Cerrahisi Derneği + ÇAYD", authors: "TÇCD / ÇAYD", edition: "Güncel", publisher: "TÇCD", why: "TR çocuk cerrahisi standardı." },
    { title: "Ashcraft's Pediatric Surgery", authors: "Holcomb et al.", edition: "6e", publisher: "Elsevier", why: "Pediatrik cerrahi uluslararası metin." },
  ],
  "aile-hekimligi": [
    { title: "TAHUD + SB Aile Hekimliği protokolleri", authors: "TAHUD / SB", edition: "Güncel", publisher: "SB", why: "TR birinci basamak standardı." },
    { title: "Current Medical Diagnosis & Treatment", authors: "Papadakis et al.", edition: "2024", publisher: "McGraw-Hill", why: "Aile hekimliği başvuru metni." },
  ],
  "spor-hekimligi": [
    { title: "Türkiye Spor Hekimliği Derneği kılavuzları", authors: "TSHD", edition: "Güncel", publisher: "TSHD", why: "TR spor hekimliği standardı." },
    { title: "Brukner & Khan's Clinical Sports Medicine", authors: "Brukner, Khan", edition: "5e", publisher: "McGraw-Hill", why: "Spor hekimliği uluslararası metin." },
  ],
  radyoloji: [
    { title: "Türk Radyoloji Derneği (TRD) + SB/TAEK radyasyon güvenliği", authors: "TRD / SB", edition: "Güncel", publisher: "TRD", why: "TR radyoloji standardı." },
    { title: "Grainger & Allison Diagnostic Radiology", authors: "Adam et al.", edition: "7e", publisher: "Elsevier", why: "Radyoloji uluslararası metin." },
  ],
  anestezi: [
    { title: "TARD kılavuzları + SB ameliyathane protokolleri", authors: "TARD / SB", edition: "Güncel", publisher: "TARD", why: "TR anestezi standardı." },
    { title: "Miller's Anesthesia", authors: "Gropper et al.", edition: "9e", publisher: "Elsevier", why: "Anesteziyoloji uluslararası metin." },
  ],
}

// ============================================================
// TEXTBOOK-GROUNDED SPECIALTY TEMPLATES
// Each specialty's AI prompt is explicitly anchored in its
// gold-standard textbooks
// ============================================================

export function getSpecialtyTemplate(specialty: MedicalSpecialty | string = "genel"): SpecialtyTemplate {
  const key = String(specialty)
  const books = TEXTBOOK_LIBRARY[key] || TEXTBOOK_LIBRARY[key.replace(/_/g, "-")] || TEXTBOOK_LIBRARY["genel"]
  const bookList = books.map((b, i) => `${i+1}. ${b.title} (${b.authors}, ${b.edition}) — ${b.why}`).join("\n")

  const basePrompt = `Sen Notya AI'sın — Türkiye'nin en güvenilir klinik not asistanı.
Klinik akıl yürütmen şu altın standart tıp kitaplarına dayalıdır:

${bookList}

Bu kaynaklara dayalı olarak:
- Tanı yaklaşımında bu kitaplardaki ayırıcı tanı kriterlerini kullan
- Tedavi planında güncel kılavuzları (AHA, ESC, NCCN, EAU vb.) referans al
- ICD-10 TR kodlarını Sağlık Bakanlığı listesinden seç
- Reçetede SGK kısıtlamalarına dikkat et
- Kritik bulguları ve kırmızı bayrakları erkenden tespit et`

  const specialtyPrompts: Partial<Record<MedicalSpecialty, string>> = {
    pediatri: `${basePrompt}

PEDİATRİK ÖZEL KURALLAR (Nelson + Harriet Lane):
- Tüm ilaç dozlarını KG başına hesapla
- Büyüme-gelişim persentillerini değerlendir
- Yaşa göre Denver II kilometre taşlarını kontrol et
- Ateşli çocukta: <3 ay = acil, <3 yaş dehydration skorla
- Aşı takvimi eksikliklerini not et
- Ebeveyn eğitim notunu her zaman ekle
- Pnömoni, otit, boğaz: amoksisilin dozu KG x 45mg/gün`,

    kardiyoloji: `${basePrompt}

KARDİYOLOJİ ÖZEL KURALLAR (Braunwald + ESC Kılavuzları):
- EKG'yi sistematik oku: hız-ritm-aks-PR-QRS-QTc-ST-T
- AKS şüphesi: ilk 10 dk EKG, troponin 0-2h protokolü
- Kalp yetmezliğinde NYHA sınıfla, BNP/NT-proBNP değerlendir
- AF: CHA₂DS₂-VASc ve HAS-BLED skoru hesapla
- İlaç seçiminde ACC/AHA + ESC 2024 kılavuzlarını uygula
- Statin, ACEi/ARB, beta bloker, diüretik: endikasyon/kontrendikasyon`,

    nöroloji: `${basePrompt}

NÖROLOJİ ÖZEL KURALLAR (Adams & Victor + ESO İnme Kılavuzu):
- İnme şüphesi: FAST-BE-FAST ve NIHSS skoru uygula
- tPA penceresi: 4.5 saat, kontrendikasyonları kontrol et
- Epilepsi: nöbet tipi (ILAE 2017), antiepileptik seçimi
- MS: McDonald kriterleri 2017, EDSS skoru
- Baş ağrısı: ICHD-3 kriterleri, kırmızı bayraklar
- Parkinson: MDS-UPDRS, H&Y evreleme
- Demans: MMSE, MoCA, CDR`,

    psikiyatri: `${basePrompt}

PSİKİYATRİ ÖZEL KURALLAR (Kaplan & Sadock + DSM-5-TR):
- Her seansta: MSE (Mental Durum Muayenesi) tam yapılmalı
- İntihar riski: C-SSRS skoru — YÜKSEK RİSKTE ZORUNLU YATIRIŞ
- Tanı: DSM-5-TR kriterlerini tam karşılıyor mu?
- Stahl'ın farmakolojisini uygula: mekanizma → seçim
- Psikoterapide: BDT, DBT, ACT — endikasyona göre yönlendir
- KVKK: psikiyatri notlarında ekstra gizlilik
- Antipsikotik: metabolik takip, EPS, tardif diskinezi`,

    dahiliye: `${basePrompt}

DAHİLİYE ÖZEL KURALLAR (Harrison's + Goldman-Cecil):
- Sistemik hastalıklarda Harrison's ayırıcı tanı yaklaşımı
- DM: HbA1c, komplikasyon taraması, ilaç algoritması
- HT: JNC-8 ve ESH/ESC 2023 kılavuzu hedefleri
- Böbrek: eGFR bazlı ilaç doz ayarı (Cockroft-Gault)
- Karaciğer: Child-Pugh skoru, ilaç metabolizması
- Tiroid: TSH algoritması, Bethesda sistemi
- SGK: reçete kısıtlamaları ve ön rapor gereksinimleri`,

    ortopedi: `${basePrompt}

ORTOPEDİ ÖZEL KURALLAR (Campbell's + Rockwood):
- Kırık sınıflaması: AO/OTA kodu
- ROM ölçümü: goniometre değerleri
- Kompartman sendromu: acil — 6 saat kuralı
- VAS ağrı skoru 0-10
- Konservatif vs cerrahi: endikasyon kriterleri
- Osteoporoz: DEXA T-skoru, FRAX hesabı
- Pediatrik kırık: çocuk istismarı kırmızı bayrakları`,
  }

  return {
    name: specialty,
    goldStandardTextbooks: books,
    clinicalGuidelines: [],
    systemPrompt: specialtyPrompts[specialty] || basePrompt,
    criticalKeywords: [],
    icd10Focus: []
  }
}

export { TEXTBOOK_LIBRARY }
