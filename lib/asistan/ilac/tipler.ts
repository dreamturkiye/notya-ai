/**
 * NOTYA-EYLEM-28/29/30 — the Turkish drug table's vocabulary. CLINICAL SAFETY DATA.
 *
 * Kaan, 2026-09-19: "drug table to 150". The table behind the ilaç card (`core/eylemler/ilacUyari.ts`)
 * held 18 molecules, so most of Turkish outpatient prescribing fell outside it and the card could
 * only say "etkileşim kontrolü yapılamadı". This file is the shape the bigger table needed before it
 * could be trusted with more entries; the entries themselves live in `veri/`.
 *
 * Three rules are encoded in the TYPES, not left to a reviewer:
 *
 *   1. **Every entry names its source.** `kaynak.belge` is a document name + section and
 *      `kaynak.dogrulama` says how it was verified. `kub_okundu` means the TİTCK KÜB PDF was
 *      actually fetched and read; `literatur` means a named source that was not the KÜB itself.
 *      `hekim_dogruladi` is reserved for entries a physician has signed off on the review sheet
 *      (`docs/beta/Ilac-Tablosu-Hekim-Inceleme.html`) — **no entry carries it today**.
 *
 *   2. **A pediatric dose carries its unit.** NOTYA-EYLEM-30 could not give an overdose verdict
 *      because `pediatricDose` was free text: some molecules meant mg/kg/DOZ, others mg/kg/GÜN, and
 *      the calculator printed both as "mg/gün". `PediatrikDoz.birim` makes that distinction a typed
 *      field, so a verdict is only ever computed from numbers that agree about what they mean.
 *      Every numeric field here is optional: an absent number is safe, an invented one is not.
 *
 *   3. **A class-level interaction must resolve.** NOTYA-EYLEM-29: the table wrote interactions as
 *      classes ("Antihipertansifler", "QT uzatan ilaçlar", "Aminoglikozidler") that matched no
 *      drug's `category`, so they silently never fired. `siniflar` is the full set of class labels a
 *      molecule answers to — and a test asserts that every class named in an interaction resolves to
 *      at least one molecule, so a new unmatched label fails CI instead of going quiet in production.
 */
import type { ReceteRengi } from '@/lib/doktor/receteRengi'

/**
 * How the entry's clinical numbers were verified.
 *  - `kub_okundu`      : the TİTCK KÜB was fetched and read; `kaynak.url` is that document.
 *  - `literatur`       : a named non-KÜB source (TEMD/TKD/TJOD/Türk Toraks uzlaşı, BNF, FDA label).
 *  - `hekim_dogruladi` : a physician signed the line off. Nothing carries this yet, by design.
 */
export type Dogrulama = 'kub_okundu' | 'literatur' | 'hekim_dogruladi'

export interface IlacKaynagi {
  /** Document name + the sections read, e.g. "TİTCK KÜB — AMLODİS 10 MG TABLET §4.2/4.3/4.5/4.6". */
  belge: string
  /** Set only when the document was actually fetched. */
  url?: string
  dogrulama: Dogrulama
}

export type UyariSiddeti = 'ciddi' | 'orta'

export interface Etkilesim {
  /** A molecule name OR a class label. Class labels must appear in some drug's `siniflar`. */
  ile: string
  siddet: UyariSiddeti
  /** One Turkish line: mechanism → what to do. Shown verbatim on the card. */
  not: string
}

/** Dose units are NOT interchangeable — this is the field NOTYA-EYLEM-30 was blocked on. */
export type DozBirimi = 'mg/kg/doz' | 'mg/kg/gün' | 'mikrogram/kg/gün' | 'IU/gün'

export interface PediatrikDoz {
  min?: number
  max?: number
  birim: DozBirimi
  /** Doses per day, when the KÜB states one. */
  gunlukBolum?: number
  /** Ceiling per day in mg/kg — the number an overdose verdict is measured against. */
  maxMgKgGun?: number
  /** Absolute daily ceiling in mg, regardless of weight. */
  mutlakMaxMgGun?: number
  /** Absolute ceiling for a single dose, mg. */
  mutlakMaxMgDoz?: number
  /** Minimum age the source allows, in months. */
  enAzAy?: number
  /** The source's own sentence — so the doctor can weigh the number against its wording. */
  metin: string
}

export interface GebelikBilgisi {
  /** KÜB 4.6 "Gebelik kategorisi", when the KÜB states one. */
  kategori?: 'A' | 'B' | 'C' | 'D' | 'X'
  /** One Turkish line from KÜB 4.6. */
  metin: string
}

export interface TürkishDrug {
  /** Etken madde, Turkish spelling. */
  name: string
  /** Common Turkish brand names. */
  brand: string[]
  /** Adult posology, one line. */
  dose: string
  /**
   * Back-compat free-text pediatric line. Derived from `pediatrik` where that exists; kept because
   * `/api/asistan/chat` and the doktor tools still read it.
   */
  pediatricDose?: string
  /** Structured pediatric dosing. Present ONLY when it came from a fetched KÜB or a named TR source. */
  pediatrik?: PediatrikDoz
  form: string
  sgkCovered: boolean
  sgkRestriction?: string
  /** Primary pharmacological class, normalised. */
  category: string
  /** EVERY class label this molecule answers to — this is what makes class-level interactions fire. */
  siniflar: readonly string[]
  /**
   * Allergy cross-reactivity groups: 'penisilin', 'sefalosporin', 'sulfonamid', 'nsaii', 'makrolid',
   * 'kinolon', 'aspirin'. A penicillin allergy has to reach ampisilin without anyone writing the
   * pair down twice.
   */
  alerjiSinifi?: readonly string[]
  contraindications: string[]
  /** Free-text, back-compat. Kept in sync with `etkilesimler` by a test. */
  interactions: string[]
  /** Structured interactions with severity and a Turkish mechanism line. */
  etkilesimler?: readonly Etkilesim[]
  /** Age below which the source says the drug is contraindicated, in months. */
  yasKontrendikasyonAy?: number
  gebelik?: GebelikBilgisi
  /** KÜB 4.6 laktasyon, one line. */
  emzirme?: string
  /** KÜB 4.2 "Böbrek yetmezliği" asks for a dose change or forbids use. */
  bobrekDozUyarisi?: boolean
  /** KÜB 4.2 "Karaciğer yetmezliği" asks for a dose change or forbids use. */
  karacigerDozUyarisi?: boolean
  /** Must equal `receteRengi(name)` — asserted by a test, so the two lists cannot drift. */
  renkliRecete?: ReceteRengi
  notes?: string
  kaynak: IlacKaynagi
}

/** Only these three states exist; `hekim_dogruladi` is unused until a physician signs the sheet. */
export const DOGRULAMA_DURUMLARI: readonly Dogrulama[] = ['kub_okundu', 'literatur', 'hekim_dogruladi']

export const DOGRULAMA_ETIKET: Record<Dogrulama, string> = {
  kub_okundu: 'KÜB okundu',
  literatur: 'Literatür',
  hekim_dogruladi: 'Hekim doğruladı',
}
