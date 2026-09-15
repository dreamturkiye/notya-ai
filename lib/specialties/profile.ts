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

export interface SpecialtyProfile {
  key: SpecialtyKey
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
  /** build maturity: baseline-only, research-built (80-90%), or specialist-validated */
  olgunluk: 'baseline' | 'arastirma' | 'uzman-dogrulandi'
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

export const BASELINE_BELGELER: BelgeTanimi[] = [
  { id: 'recete', ad: 'Reçete', format: 'recete' },
  { id: 'muayene-raporu', ad: 'Muayene Raporu', format: 'rapor' },
  { id: 'epikriz', ad: 'Epikriz', format: 'epikriz' },
]

/** Baseline chapter — what every specialty gets when it has no profile of its own yet. */
export function baselineProfile(key: SpecialtyKey, etiket: string, resmiUnvan: string): SpecialtyProfile {
  return {
    key, etiket, resmiUnvan,
    olcumler: BASELINE_OLCUMLER,
    hesaplayicilar: [], sekmeler: [], goruntu: null,
    belgeler: BASELINE_BELGELER,
    ekKaynaklar: [], promptNotlari: [], specialistReview: [],
    olgunluk: 'baseline',
  }
}
