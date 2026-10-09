/**
 * NOTYA-ULKE-INTAKE-01 — THE INTAKE FORM: the form a patient fills in before a visit. TYPES ONLY, client-safe.
 *
 * WHO OWNS WHAT.
 *   The KIT owns the QUESTION TYPES (below), the rules that decide which questions a form carries
 *   (./sorular.ts), the screens and the storage. It holds no question of any country.
 *   A COUNTRY PACK owns the QUESTIONS: a core set every patient gets, and one set per role (a doctor's specialty or a
 *   clinic role). They are CLINICAL CONTENT: each set says who wrote it and which clinician read it
 *   (`FormIncelemesi`), and the kit shows and documents that status; it never hides it.
 *
 * A QUESTION IS CONTENT, NEVER REFERENCE CONTENT. A question may ask "which medicines do you take?" as free text.
 * The types below have no place for a drug list, a vaccination schedule or a screening interval, and a pack must not
 * smuggle one into the options of a choice.
 *
 * LEAK RULE (.cursor/skills/brans-alan-sizmasi/SKILL.md). A question belongs to the set that lists it: a role's
 * question is never sent, drawn, stored or shown for another role. One decision point: ./sorular.ts → formBolumleri.
 *
 * GUARDIAN FORM. For a patient below the country's guardian age (the pack's `uygulama.veliYasi`, the kit's existing
 * age rule) the form is addressed to a parent or guardian: it asks who is filling it in, and each question may carry
 * its own wording for that reader (`veliMetni`). Some questions exist only on one of the two forms (`kime`).
 */
import type { BicimliMetin } from '../arayuz/tipler'
import type { DilKodu } from '../tipler'

/**
 * THE QUESTION TYPES. The kit's; a pack chooses among them and cannot add one.
 *   tek-secim    one of the options
 *   cok-secim    any of the options; an option marked `tek` ("none of these") stands alone
 *   kisa-metin   one line of free text
 *   uzun-metin   several lines of free text
 *   evet-hayir   yes or no; after "yes", an optional line of detail (`ayrinti` is its label)
 *   tarih        a calendar day
 *   sayi         a number with its unit: a measure of the pack's units (height, weight, temperature), or a unit of
 *                the question's own ("weeks")
 */
export const SORU_TURLERI = ['tek-secim', 'cok-secim', 'kisa-metin', 'uzun-metin', 'evet-hayir', 'tarih', 'sayi'] as const
export type SoruTuru = (typeof SORU_TURLERI)[number]

/** The three measures whose unit is a setting of the pack (`uygulama.birimler`). */
export const OLCULER = ['boy', 'agirlik', 'sicaklik'] as const
export type Olcu = (typeof OLCULER)[number]
/** Every unit code a pack can choose for a measure. Their names, as a patient reads them, are the pack's text. */
export type BirimKodu = 'cm' | 'in' | 'kg' | 'lb' | 'C' | 'F'

export type Secenek = {
  /** Internal key, never shown: what is stored. Lower-case letters, digits and underscores. */
  anahtar: string
  ad: BicimliMetin
  /** true = this option excludes the others ("none", "I do not know"). Read by `cok-secim` only. */
  tek?: boolean
}

type SoruOrtak = {
  /** Internal key, never shown: the key of the stored answer. Unique in the whole form. Lower-case letters, digits, underscores. */
  anahtar: string
  /** The question, as it is put to the patient. */
  metin: BicimliMetin
  /** The same question as it is put to a parent or guardian about their child, where the wording differs. */
  veliMetni?: BicimliMetin
  /** One line under the question. */
  yardim?: BicimliMetin
  /** true = the form cannot be submitted without an answer. */
  zorunlu?: boolean
  /** Asked only of an adult patient ('yetiskin') or only on the guardian form ('cocuk'). Absent = on both. */
  kime?: 'yetiskin' | 'cocuk'
  /** Asked only where the patient's recorded sex is this one — and where no sex is recorded. Absent = of everybody. */
  cinsiyet?: 'female' | 'male'
}

export type Soru =
  | (SoruOrtak & { tur: 'tek-secim' | 'cok-secim'; secenekler: readonly Secenek[] })
  | (SoruOrtak & { tur: 'kisa-metin' | 'uzun-metin' })
  | (SoruOrtak & { tur: 'evet-hayir'; /** Label of the line asked after "yes". Absent = no detail is asked. */ ayrinti?: BicimliMetin })
  | (SoruOrtak & { tur: 'tarih' })
  | (SoruOrtak & { tur: 'sayi'; /** A measure of the pack's units. */ olcu: Olcu })
  | (SoruOrtak & { tur: 'sayi'; olcu?: undefined; /** The question's own unit, as text ("weeks"), with the range that makes sense. */ birim: BicimliMetin; enAz: number; enCok: number; ondalik?: boolean })

/** Who wrote a set of questions, and which clinician has read it. Shown in the documents; a set is not "reviewed" until `klinisyen` names somebody. */
export type FormIncelemesi = {
  /** true = written by a machine. */
  makineYazimi: boolean
  /** The local clinician who read and signed the set. null = nobody yet. */
  klinisyen: string | null
}

export type FormBolumu = {
  /** Internal key, never shown. */
  anahtar: string
  baslik: BicimliMetin
  /** The heading on the guardian form, where it differs. */
  veliBasligi?: BicimliMetin
  /** The whole section belongs to one of the two forms. Absent = to both. */
  kime?: 'yetiskin' | 'cocuk'
  sorular: readonly Soru[]
}

/** The questions of one role: one section, shown after the core sections. */
export type RolSorulari = {
  baslik: BicimliMetin
  veliBasligi?: BicimliMetin
  sorular: readonly Soru[]
  inceleme: FormIncelemesi
}

/**
 * WHAT A PACK BRINGS FOR THE INTAKE FORM. Part of the pack's clinical half (server only: a role's questions are sent
 * to a browser only inside a form of that role).
 */
export type HastaFormuIcerigi = {
  /** Stamp of this question set, stored with every form: answers are always read against the set they were given for. */
  surum: string
  /**
   * The consent sentence shown before the first question. The pack's text, with its stamp — stored with the form the
   * patient accepted it on. `hukukcuInceledi` false = not read by a lawyer; the form says so to nobody but the record.
   */
  riza: { surum: string; hukukcuInceledi: boolean; metin: BicimliMetin; veliMetni: BicimliMetin }
  /** The questions every patient gets, in sections, in order. */
  cekirdek: { bolumler: readonly FormBolumu[]; inceleme: FormIncelemesi }
  /** Role key → that role's questions. A role that is not listed has none: its patients get the core questions only. */
  roller: Readonly<Record<string, RolSorulari>>
}

// ───────────────────────── answers ─────────────────────────

/**
 * One stored answer, by question type:
 *   tek-secim → the option's key · cok-secim → the options' keys · kisa-metin / uzun-metin → the text
 *   evet-hayir → { e, a? } · tarih → 'YYYY-MM-DD' · sayi → { n, b } (the number, and the unit code it was typed in;
 *   '' for a question with a unit of its own)
 */
export type Cevap = string | string[] | { e: boolean; a?: string } | { n: number; b: string }
export type Cevaplar = Record<string, Cevap>

// ───────────────────────── what the screens are given ─────────────────────────

export type FormDurumu = 'bekliyor' | 'taslak' | 'gonderildi' | 'iptal'

/** A question as a screen draws it: in ONE language form, with the unit and range already decided. */
export type FormSorusu = {
  anahtar: string
  tur: SoruTuru
  metin: string
  yardim: string | null
  zorunlu: boolean
  secenekler: { anahtar: string; ad: string; tek: boolean }[] | null
  /** evet-hayir: label of the detail line, or null where none is asked. */
  ayrinti: string | null
  /** sayi: the unit as text, its code where it is one of the pack's ('' otherwise), and the range. */
  birim: { kod: string; ad: string; enAz: number; enCok: number; ondalik: boolean } | null
}
export type FormBolumGorunumu = { anahtar: string; baslik: string; sorular: FormSorusu[] }

/** The patient's form, as the patient's page is given it (GET /api/ulke/portal/form). */
export type HastaFormuGorunumu = {
  id: string
  durum: 'bekliyor' | 'taslak' | 'gonderildi'
  /** true = addressed to a parent or guardian. */
  veli: boolean
  dil: DilKodu
  riza: { metin: string; /** true = already accepted on this form */ kabul: boolean }
  bolumler: FormBolumGorunumu[]
  cevaplar: Cevaplar
  gonderildi: string | null
}

/** One answered question as the doctor reads it: the question in the DOCTOR's form, the answer as text. */
export type CevapSatiri = { soru: string; cevap: string }
/** A form on the patient's file and on the visit screen (GET /api/ulke/hasta-formu). */
export type HekimFormu = {
  id: string
  durum: FormDurumu
  veli: boolean
  /** The role whose questions the form carries, as the pack names it in the doctor's form; '' = core questions only. */
  rolAdi: string
  randevuId: string | null
  olusturuldu: string
  gonderildi: string | null
  yenidenAcildi: string | null
  /** Present for a SUBMITTED form only: an open form is the patient's working copy and is not shown to anybody. */
  bolumler: { baslik: string; satirlar: CevapSatiri[] }[] | null
}

/** What asking for a form answers (POST /api/ulke/hasta-formu). */
export type FormIstegiSonucu = {
  formId: string
  /** false = the patient already had an open form, which was kept. */
  yeniForm: boolean
  /** 'yeni' = a link and a PIN were made in this step and are in this answer, once. 'var' = the patient has a link that works; it cannot be shown again. */
  erisim: 'yeni' | 'var'
  /** With 'yeni': a route of this build with the token in its fragment, and the PIN. */
  yol?: string
  pin?: string
  /** The language form the invitation is written in: the patient's. */
  davetDili: DilKodu
}
