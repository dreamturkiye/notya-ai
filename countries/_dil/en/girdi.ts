/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: EVERYTHING A COUNTRY STATES when it takes the set. One object,
 * written in the country's own folder (countries/<code>/ayarlar.ts), read by the two halves the set assembles for
 * it: what the shared screens show (./arayuz.ts) and the clinical half on the server (./klinik/index.ts).
 *
 * Types only. Nothing here is a default: a pack states every field, and marks in its own file which of them nobody
 * of the country has verified yet.
 */
import type { LabOlcusu } from '@/lib/ulke/araclar/tipler'
import type { AcilisFiyatlari } from '@/lib/ulke/arayuz/acilisTipleri'
import type { Birimler, KonusmaTanimaAyarlari } from '@/lib/ulke/tipler'
import type { araciBicimle } from './araclar/yardimci'
import type { EnRol } from './klinik/roller'
import type { EnUlkeSozleri } from './ulke'

export type EnUlkeGirdisi = {
  /** The country's own sentences and its form of English (./ulke.ts). */
  sozler: EnUlkeSozleri
  /** The country's name in English, for the sentences of the slots ("the register of medicines authorised in …"). */
  ulkeAdi: string
  /** The country's word for a senior doctor, inside "You are an experienced …" (consultant, attending physician, specialist). */
  kidemliHekim: string
  /** The names THIS COUNTRY uses for a role where they differ from the set's base name, in the country's own spelling. */
  rolAdlari: Readonly<Partial<Record<EnRol, string>>>
  /** Guardian age: a legal fact of the country. null = no such rule. The same value as the pack's `uygulama.veliYasi`. */
  veliYasi: number | null
  /** Units of measure: the same object as the pack's `uygulama.birimler`. */
  birimler: Birimler
  /** The stamp of this country's draft texts (consent wording, intake questions), e.g. "gb-draft-2026-10-09". */
  surum: string
  /** The country's own consent sentence for the intake form, where it brings one. Still a draft until a lawyer reads it. */
  formRizasi?: { metin: string; veliMetni: string }
  /** Speech recognition settings (the engine is the kit's). */
  konusma: KonusmaTanimaAyarlari
  /** Visits (recordings turned into notes) one account may make per day. */
  gunlukMuayeneLimiti: number
  araclar: {
    /** The unit this country's laboratories report each value in. UNVERIFIED until a local source confirms it. */
    labBirimleri: Readonly<Partial<Record<LabOlcusu, string>>>
    /** Tools of the set this country keeps as slots: kit key → what is missing, and who decides. */
    kapali: Readonly<Record<string, { eksik: string; kimden: string }>>
    /** Unit names this country writes differently. */
    birimAdlari?: Readonly<Record<string, string>>
    /** Words of a tool this country writes differently. */
    degisen?: Readonly<Record<string, NonNullable<Parameters<typeof araciBicimle>[2]>>>
  }
  acilis: {
    /** A phone number as people of the country write it: the example in the request form. */
    telefonOrnegi: string
    /** How a monthly amount is written here ('%' is the number). Not shown while every plan is by quote. */
    aylikTutarKalibi: string
    /** THE PRICE LIST: one entry per plan of the copy. Every amount null until the owner sets prices for this country. */
    fiyatlar: AcilisFiyatlari
  }
}
