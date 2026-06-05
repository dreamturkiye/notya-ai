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

  // ── PEDIATRICS ──────────────────────────────────────────────
  pediatri: [
    {
      title: "Nelson Textbook of Pediatrics",
      authors: "Kliegman, St. Geme, Blum, Shah, Tasker, Wilson",
      edition: "22nd Edition, 2025",
      publisher: "Elsevier",
      why: "Dünya çapında pediatristlerin birincil başvuru kaynağı. Her pediatrik hastalık için kapsamlı tanı ve tedavi protokolleri."
    },
    {
      title: "Oski's Pediatrics: Principles & Practice",
      authors: "McMillan, DeAngelis, Feigin, Warshaw",
      edition: "4th Edition",
      publisher: "Lippincott Williams & Wilkins",
      why: "Pratik klinik yaklaşım ve pediatrik fizik muayene için vazgeçilmez başvuru."
    },
    {
      title: "The Harriet Lane Handbook",
      authors: "Johns Hopkins Hospital",
      edition: "23rd Edition, 2024",
      publisher: "Elsevier",
      why: "Pediatrik doz hesaplamaları ve acil protokoller için altın standart el kitabı."
    },
    {
      title: "Rudolph's Pediatrics",
      authors: "Rudolph, Lister, First, Gershon",
      edition: "23rd Edition",
      publisher: "McGraw-Hill",
      why: "Pediatrik hastalıkların patofizyolojisi ve ayırıcı tanısı için derin referans."
    }
  ],

  // ── KARDİYOLOJİ ─────────────────────────────────────────────
  kardiyoloji: [
    {
      title: "Braunwald's Heart Disease: A Textbook of Cardiovascular Medicine",
      authors: "Libby, Bonow, Mann, Tomaselli, Bhatt, Solomon",
      edition: "12th Edition, 2022",
      publisher: "Elsevier",
      why: "Kardiyolojinin mutlak altın standardı. AHA, ACC ve ESC kılavuzlarını entegre eder."
    },
    {
      title: "Hurst's The Heart",
      authors: "Fuster, Harrington, Narula, Eapen",
      edition: "14th Edition",
      publisher: "McGraw-Hill",
      why: "Kardiyolojinin en uzun süreli yayınlanan referans kitabı. Pratik hasta bakımı odaklı."
    },
    {
      title: "ESC Textbook of Cardiovascular Medicine",
      authors: "Camm, Lüscher, Maurer, Serruys",
      edition: "3rd Edition",
      publisher: "Oxford University Press",
      why: "Avrupa Kardiyoloji Derneği'nin resmi referans kitabı. Türk kardiyologların tercih ettiği Avrupa kılavuzları."
    },
    {
      title: "ACC/AHA Clinical Practice Guidelines",
      authors: "American College of Cardiology / American Heart Association",
      edition: "2024 Current",
      publisher: "ACC/AHA",
      why: "KAH, KY, AF, hipertansiyon için güncel klinik karar destek kılavuzları."
    }
  ],

  // ── NÖROLOJİ ────────────────────────────────────────────────
  noroloji: [
    {
      title: "Adams and Victor's Principles of Neurology",
      authors: "Ropper, Samuels, Klein, Prasad",
      edition: "12th Edition, 2023",
      publisher: "McGraw-Hill",
      why: "Nörolojinin İncil'i. Klinik nöroloji muayenesi ve hastalık mekanizmaları için birincil kaynak."
    },
    {
      title: "Bradley and Daroff's Neurology in Clinical Practice",
      authors: "Daroff, Jankovic, Mazziotta, Pomeroy",
      edition: "8th Edition",
      publisher: "Elsevier",
      why: "Pratik klinik nöroloji için kapsamlı referans. İnme, epilepsi, MS protokolleri."
    },
    {
      title: "Merritt's Neurology",
      authors: "Bhatt, Caplan",
      edition: "14th Edition",
      publisher: "Lippincott Williams & Wilkins",
      why: "Nörolog başucu kitabı. Özlü ve klinisyen odaklı yaklaşım."
    },
    {
      title: "ESO Stroke Guidelines",
      authors: "European Stroke Organisation",
      edition: "2024 Current",
      publisher: "ESO",
      why: "İnme tanı ve tedavisinde güncel Avrupa kılavuzları."
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

  // ── DAHİLİYE ────────────────────────────────────────────────
  dahiliye: [
    {
      title: "Harrison's Principles of Internal Medicine",
      authors: "Jameson, Fauci, Kasper, Hauser, Longo, Loscalzo",
      edition: "22nd Edition, 2025",
      publisher: "McGraw-Hill",
      why: "Dahiliyenin kutsal kitabı. Tüm iç hastalıkları için patofizyoloji ve klinik yaklaşım standardı."
    },
    {
      title: "Goldman-Cecil Medicine",
      authors: "Goldman, Schafer",
      edition: "27th Edition, 2024",
      publisher: "Elsevier",
      why: "Cecil'in mirası. Kanıta dayalı tedavi protokolleri ve hastalık yönetimi."
    },
    {
      title: "Washington Manual of Medical Therapeutics",
      authors: "Washington University",
      edition: "37th Edition, 2024",
      publisher: "Lippincott",
      why: "Pratik tedavi kararları için hızlı başvuru. İntern ve asistanların el kitabı."
    },
    {
      title: "UpToDate Clinical Decision Support",
      authors: "Wolters Kluwer",
      edition: "Continuously Updated",
      publisher: "Wolters Kluwer",
      why: "Güncel kanıta dayalı klinik karar desteği. Türk hekimlerinin en çok kullandığı dijital kaynak."
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

  // ── GENEL PRATİSYEN ─────────────────────────────────────────
  genel: [
    {
      title: "Harrison's Principles of Internal Medicine",
      authors: "Jameson et al.",
      edition: "22nd Edition, 2025",
      publisher: "McGraw-Hill",
      why: "Genel hekimlik için temel referans."
    },
    {
      title: "Oxford Handbook of Clinical Medicine",
      authors: "Longmore, Wilkinson, Baldwin, Wallin",
      edition: "10th Edition, 2021",
      publisher: "Oxford University Press",
      why: "Klinik pratikte hızlı başvuru için vazgeçilmez cep rehberi."
    },
    {
      title: "Türkiye Halk Sağlığı Genel Müdürlüğü Kılavuzları",
      authors: "T.C. Sağlık Bakanlığı",
      edition: "2024 Güncel",
      publisher: "Sağlık Bakanlığı",
      why: "Türkiye'ye özgü birinci basamak protokolleri, aşı takvimleri ve sevk kriterleri."
    }
  ]
}

// ============================================================
// TEXTBOOK-GROUNDED SPECIALTY TEMPLATES
// Each specialty's AI prompt is explicitly anchored in its
// gold-standard textbooks
// ============================================================

export function getSpecialtyTemplate(specialty: MedicalSpecialty = "genel"): SpecialtyTemplate {
  const books = TEXTBOOK_LIBRARY[specialty] || TEXTBOOK_LIBRARY["genel"]
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
