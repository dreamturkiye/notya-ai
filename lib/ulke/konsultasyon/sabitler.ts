/**
 * NOTYA-ULKE-MESAJ-01 — consultation between doctors: the kit's fixed numbers, names and shapes. Client-safe: plain
 * values and types, no imports. The same in every country. What a country decides is in its pack: both periods
 * (`uygulama.konsultasyon`) and the consent wording with its stamp.
 */

/** The question and the answer hold at most this many characters. */
export const SORU_AZAMI = 4000
export const CEVAP_AZAMI = 6000
/** One doctor asks at most this many consultations in 24 hours. */
export const KONSULTASYON_GUNLUK_AZAMI = 20
/** How many consultations a list holds, newest first. */
export const KONSULTASYON_LISTE_AZAMI = 100

/**
 * THE CONSULTATION CODE: this many characters of an alphabet without the look-alikes (no I, L, O, 0, 1). 31^10 codes:
 * a colleague is found by typing one exactly, and guessing one is not a way to find anybody.
 */
export const KOD_UZUNLUGU = 10
export const KOD_ALFABESI = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
/** What the doctor typed → the code as it is compared: upper case, without spaces and hyphens. null = not a code. */
export function koduDuzelt(ham: unknown): string | null {
  if (typeof ham !== 'string') return null
  const k = ham.replace(/[\s-]+/g, '').toUpperCase()
  return k.length === KOD_UZUNLUGU && [...k].every((h) => KOD_ALFABESI.includes(h)) ? k : null
}
/** The code as it is shown: in two halves, easier to read out. */
export const koduYaz = (kod: string): string => `${kod.slice(0, KOD_UZUNLUGU / 2)}-${kod.slice(KOD_UZUNLUGU / 2)}`

/** The route of the consultations (a doctor's session only). */
export const KONSULTASYON_API = '/api/ulke/konsultasyon'
/** The key of the tile in the tools area. */
export const KONSULTASYON_ARACI = 'konsultasyonlar'

/** What is shared beside the question: nothing, a copy of one approved note, a copy of its summary for the patient. */
export const PAYLASIM_TURLERI = ['yok', 'not', 'ozet'] as const
export type PaylasimTuru = (typeof PAYLASIM_TURLERI)[number]
export const paylasimTuruMu = (ham: unknown): ham is PaylasimTuru => typeof ham === 'string' && (PAYLASIM_TURLERI as readonly string[]).includes(ham)

/**
 * THE COPY that was shared, as it was on the day the consultation was asked. It names no patient: no name, no birth
 * date, no id. `sablon` and `dil` say with which template and in which language form the note was written, so that
 * the reader's screen can name its sections and fields.
 */
export type PaylasilanKopya =
  | { tur: 'not'; /** The day of the visit, 'YYYY-MM-DD'. */ muayeneGunu: string; dil: string; sablon: string; s: string; o: string; a: string; p: string; alanlar: Readonly<Record<string, string>> }
  | { tur: 'ozet'; muayeneGunu: string; dil: string; metin: string }

export type Meslektas = { ad: string; /** The role as the pack names it in the reader's form; '' where the account has none. */ rol: string }

/** One consultation as THE ASKING DOCTOR sees it: their own patient, the colleague, everything that happened. */
export type GidenKonsultasyon = {
  id: string
  hastaId: string
  hastaAdi: string
  meslektas: Meslektas
  soru: string
  paylasimTuru: PaylasimTuru
  kopya: PaylasilanKopya | null
  /** The stamp of the consent sentence that was ticked. */
  rizaSurumu: string
  olusturuldu: string
  /** When the colleague first opened it, or null. */
  okundu: string | null
  cevap: string | null
  cevapAni: string | null
  kapandi: string | null
  /** While open: the colleague reads it until this moment at the latest. */
  sonGecerlilik: string
  /** After closing: the colleague reads it until this moment. */
  erisimBitis: string | null
  /** true = open, and the period is over: the colleague can no longer read or answer it. */
  suresiDoldu: boolean
}

/**
 * One consultation as THE CONSULTED DOCTOR sees it. NO PATIENT: no id, no name, nothing of the file — only who asked,
 * the question and the copy that was shared.
 */
export type GelenKonsultasyon = {
  id: string
  isteyen: Meslektas
  soru: string
  paylasimTuru: PaylasimTuru
  kopya: PaylasilanKopya | null
  olusturuldu: string
  okundu: string | null
  cevap: string | null
  cevapAni: string | null
  kapandi: string | null
  /** Until when this doctor may read it: the open period's end, or — once closed — the end set at closing. */
  okunabilir: string
}

/** An approved note of a patient that can be shared, as the asking doctor's form lists it. */
export type PaylasilabilirNot = { notId: string; /** The day of the visit. */ gun: string; /** true = the note has a summary for the patient. */ ozetVar: boolean }

/** A question or an answer as it is kept: one kind of line end, no control character, trimmed. */
export function konsultasyonMetniAl(ham: unknown): string {
  // eslint-disable-next-line no-control-regex
  return typeof ham === 'string' ? ham.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim() : ''
}
