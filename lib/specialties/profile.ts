/**
 * NOTYA-REGISTRY-01 (Kaan 2026-09-14) — Specialty capability registry ("chapters on one spine").
 *
 * The baseline (SOAP, İnceleme/onay, reçete/Medula, epikriz, randevu, portal, aşılar, intake,
 * Ayşe sesli+yazılı) is universal. Each specialty declares ONLY what it adds on top, in one
 * place, so the app reads the profile instead of hardcoding pediatri everywhere.
 *
 * Rules every profile must respect (lessons from 2026-09-14):
 *  - Calculators are deterministic and code-embedded, built only from validated PUBLIC
 *    instruments (Neyzi, M-CHAT-R/F, GİDR). Never LLM-scored. Never a proprietary test
 *    (Denver II lesson).
 *  - Turkish practice is the authority: Sağlık Bakanlığı protocols, TUK specialty societies,
 *    SUT/TİTCK. International sources are depth only.
 *  - Image review by Ayşe is DECISION SUPPORT, hekim onayına tabi — never "tanı".
 *  - `specialistReview` lists what a human specialist must verify. It is part of the build,
 *    not an afterthought: the specialist's scarce time goes to that 10-20%.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/** Vital/measurement keys the İnceleme, not sayfası and printed report render, in order. */
export type OlcumAnahtari =
  | 'ates' | 'tansiyon' | 'nabiz' | 'solunum' | 'spo2' | 'kilo' | 'boy' | 'basCevresi' | 'vki'
  | 'gormeKeskinligiSag' | 'gormeKeskinligiSol' | 'gozIciBasinciSag' | 'gozIciBasinciSol'
  | 'sonAdetTarihi' | 'fundusYuksekligi' | 'kanSekeri' | 'belCevresi'

export interface OlcumTanimi { anahtar: OlcumAnahtari; etiket: string; birim: string; /** only shown when the patient qualifies (e.g. pediatric growth) */ kosul?: 'pediatrik' | 'gebe' }

/** A validated, deterministic tool. `motor` points at the code module; the UI/tab uses `sekmeId`. */
export interface HesaplayiciTanimi {
  id: string
  ad: string
  kaynak: string           // public, verifiable source (name + year)
  motor: string            // module path, e.g. 'lib/clinical/mchatR'
  deterministik: true      // by contract — no LLM scoring
  yasAraligiAy?: [number, number]
}

/** Extra hasta dosyası tab contributed by the specialty. `bilesen` is the component name. */
export interface SekmeTanimi { id: string; etiket: string; bilesen: string; sira: number }

/** Which image modalities the specialty uses and what Ayşe may do with them. */
export interface GoruntuYetkinligi {
  modaliteler: Array<'foto' | 'dermatoskopi' | 'xray' | 'ekg' | 'eko' | 'us' | 'oct' | 'fundus' | 'mri' | 'bt'>
  /** before/after pairs, lesion timeline — shared building blocks a chapter switches on */
  zamanCizgisi: boolean
  /** hard guardrail text merged into Ayşe's prompt when she is shown an image */
  ayseSinir: string
}

export interface BelgeTanimi { id: string; ad: string; /** printed format family — reuses the real-data letterhead pattern */ format: 'recete' | 'rapor' | 'rx' | 'epikriz' }

export interface UzmanIncelemeMaddesi { konu: string; neden: string }

/**
 * SAGLIGIM-PORTAL-REGISTRY (Kaan 2026-09-17) — one Sağlığım shell, many chapter modules.
 * Core (PIN, mesajlar, ziyaretler, sonuçlar, ilaçlar, öykü, KVKK/112) is never declared here.
 * A chapter declares ONLY its patient-facing extras; lib/portal/moduller.ts decides per token
 * (doctor specialty × patient records × age) which modules attach. Contract:
 * .cursor/skills/specialty-hasta-portali/SKILL.md
 */
export type PortalModulId = 'buyume' | 'gebelik' | 'jinekoloji' | 'dahiliye' | 'gozlerim' | 'dermatoloji'
/** Typed PortalBundle slices a module may fill (null in the bundle when the module is not attached). */
export type PortalBundleAnahtari = 'buyume' | 'hedefBoy' | 'gebelik' | 'jinekoloji' | 'goz' | 'deri' | 'kronik'
export interface PortalNavOge { key: string; label: string; path: string }
export interface PortalModulu {
  id: PortalModulId
  /** extra nav beyond core — only shown when the module attaches */
  nav: PortalNavOge[]
  bundleKeys: PortalBundleAnahtari[]
  eligibility: 'doctor_specialty' | 'patient_active_record' | 'age_rule' | 'combined'
  /** patient-facing copy rules — reminders/trends/instructions, never diagnosis language */
  copyHints: string[]
  /** component ids mounted under Takip or a dedicated route */
  views: string[]
  /** honest audit depth of this slice (specialty-audit-report vocabulary) */
  derinlik: 'Strong' | 'Partial' | 'Thin' | 'Missing'
}

/**
 * BRANS-ALAN-SIZMASI (Kaan 2026-09-17) — pediatrik içerik (veli dili, baş çevresi, Neyzi persentili,
 * pediatrik prompt satırları) hangi branşta görünür? Her branş için AÇIKÇA yazılır (Record, varsayılan yok):
 *  - 'her-zaman'     — hasta kitlesi tanım gereği çocuk (pediatri, çocuk cerrahisi)
 *  - 'cocuk-hastada' — karma yaş pratiği (aile hekimliği; branşı bilinmeyen "genel"): YALNIZ hasta
 *                      doğum tarihine göre <18 ise. Yaş bilinmiyorsa pediatrik DEĞİL.
 *  - 'asla'          — diğer her branş; hasta çocuk olsa bile "hasta" dili (Kaan: veli yalnız pediatri).
 * Karar noktası: lib/specialties/kapsam.ts → pediatrikBaglamMi(). Kural: .cursor/skills/brans-alan-sizmasi.
 */
export type PediatrikBaglamKurali = 'her-zaman' | 'cocuk-hastada' | 'asla'

export const PEDIATRIK_BAGLAM: Record<SpecialtyKey, PediatrikBaglamKurali> = {
  pediatri: 'her-zaman',
  'cocuk-cerrahisi': 'her-zaman',
  'aile-hekimligi': 'cocuk-hastada',
  kardiyoloji: 'asla',
  noroloji: 'asla',
  dahiliye: 'asla',
  psikiyatri: 'asla',
  'genel-cerrahi': 'asla',
  ortopedi: 'asla',
  dermatoloji: 'asla',
  'kulak-burun-bogaz': 'asla',
  'goz-hastaliklari': 'asla',
  'kadin-hastaliklari-dogum': 'asla',
  uroloji: 'asla',
  radyoloji: 'asla',
  anestezi: 'asla',
  'acil-tip': 'asla',
  'fizik-tedavi': 'asla',
  'enfeksiyon-hastaliklari': 'asla',
  endokrinoloji: 'asla',
  gastroenteroloji: 'asla',
  nefroloji: 'asla',
  romatoloji: 'asla',
  onkoloji: 'asla',
  'gogus-hastaliklari': 'asla',
  'gogus-cerrahisi': 'asla',
  'plastik-cerrahi': 'asla',
  'beyin-cerrahisi': 'asla',
  'kalp-damar-cerrahisi': 'asla',
  'spor-hekimligi': 'asla',
}

/** Branşı bilinmeyen / "genel" (pratisyen) hekim: karma yaş pratiği gibi davranır. */
export const BRANSSIZ_PEDIATRIK_BAGLAM: PediatrikBaglamKurali = 'cocuk-hastada'

export interface SpecialtyProfile {
  key: SpecialtyKey
  /** BRANS-ALAN-SIZMASI — pediatrik içerik kuralı (bkz. PEDIATRIK_BAGLAM) */
  pediatrikBaglam: PediatrikBaglamKurali
  /** UI label (short) and formal TUK title used in signatures/epikriz */
  etiket: string
  resmiUnvan: string
  /** measurement set in display order — ateş first by standing rule */
  olcumler: OlcumTanimi[]
  hesaplayicilar: HesaplayiciTanimi[]
  sekmeler: SekmeTanimi[]
  goruntu: GoruntuYetkinligi | null
  belgeler: BelgeTanimi[]
  /** Turkish reference stack is pulled from TURKISH_REFS at runtime; listed here only when the
   *  chapter adds sources beyond the shared stack */
  ekKaynaklar: string[]
  /** short SOAP/persona overlay hints the prompt layer appends (full text lives in personaEngine) */
  promptNotlari: string[]
  /** what a human specialist must verify — becomes their review checklist */
  specialistReview: UzmanIncelemeMaddesi[]
  /** Sağlığım modules this chapter contributes (one chapter may own several, e.g. KD gebelik + jine) */
  portal?: PortalModulu[]
  /** build maturity: baseline-only, research-built (80-90%), or specialist-validated */
  /** beta-hazir = ürün derinliği tamam, sentetik smoke yeşil; uzman hekim saha onayı (MD beta) bekliyor — uzman-dogrulandi değildir. */
  olgunluk: 'baseline' | 'arastirma' | 'beta-hazir' | 'uzman-dogrulandi'
}

export const BASELINE_OLCUMLER: OlcumTanimi[] = [
  { anahtar: 'ates', etiket: 'Ateş', birim: '°C' },
  { anahtar: 'tansiyon', etiket: 'Tansiyon', birim: 'mmHg' },
  { anahtar: 'nabiz', etiket: 'Nabız', birim: '/dk' },
  { anahtar: 'solunum', etiket: 'Solunum Sayısı', birim: '/dk' },
  { anahtar: 'spo2', etiket: 'SpO₂', birim: '%' },
  { anahtar: 'kilo', etiket: 'Kilo', birim: 'kg' },
  { anahtar: 'boy', etiket: 'Boy', birim: 'cm' },
]

/**
 * Pediatriye özgü ölçümler — baseline'da YOK. Yalnız pediatrik bağlamda (pediatrikBaglamMi) forma girer.
 * Canlı hata (Kaan 2026-09-17): baş çevresi KD hekiminin Yaşamsal Bulgular formunda çıkıyordu.
 */
export const PEDIATRIK_OLCUMLER: OlcumTanimi[] = [
  { anahtar: 'basCevresi', etiket: 'Baş Çevresi', birim: 'cm', kosul: 'pediatrik' },
]

export const BASELINE_BELGELER: BelgeTanimi[] = [
  { id: 'recete', ad: 'Reçete', format: 'recete' },
  { id: 'muayene-raporu', ad: 'Muayene Raporu', format: 'rapor' },
  { id: 'epikriz', ad: 'Epikriz', format: 'epikriz' },
]

/** Baseline chapter — what every specialty gets when it has no profile of its own yet. */
export function baselineProfile(key: SpecialtyKey, etiket: string, resmiUnvan: string): SpecialtyProfile {
  const pediatrikBaglam = PEDIATRIK_BAGLAM[key] ?? BRANSSIZ_PEDIATRIK_BAGLAM
  return {
    key, etiket, resmiUnvan, pediatrikBaglam,
    // Pediatrik ölçüm yalnız çocuk gören branşın formuna girer; 'cocuk-hastada' için hasta yaşı ayrıca kapsam.ts'de süzülür.
    olcumler: pediatrikBaglam === 'asla' ? BASELINE_OLCUMLER : [...BASELINE_OLCUMLER, ...PEDIATRIK_OLCUMLER],
    hesaplayicilar: [], sekmeler: [], goruntu: null,
    belgeler: BASELINE_BELGELER,
    ekKaynaklar: [], promptNotlari: [], specialistReview: [],
    portal: [],
    olgunluk: 'baseline',
  }
}
