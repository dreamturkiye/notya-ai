/**
 * NOTYA-ULKE-ARACLAR-01 — what the tool-records route answers. A leaf: types and one address, read by the screens
 * and by the server.
 */
import type { AracGirdisi, AracSonucu } from './tipler'

/** The route of the tool records (a doctor's session only). */
export const ARAC_KAYDI_API = '/api/ulke/arac-kaydi'
/** How many records of a patient the file lists, newest first. */
export const KAYIT_LISTE_AZAMI = 30
/** How many open follow-ups the panel lists, earliest first. */
export const TAKIP_LISTE_AZAMI = 200
/** A follow-up day is today or later, and not further away than this many days (a mistyped year is refused). */
export const TAKIP_EN_UZAK_GUN = 3660

/** One kept result of one patient, as the doctor's screens read it. */
export type AracKaydi = {
  id: string
  /** The tool's key. The screen finds its words in the pack. */
  arac: string
  /** When it was kept (ISO moment), and the day it was worked out on, in the account's time zone. */
  olusturuldu: string
  gun: string
  /** The follow-up day the doctor entered, or null; and when the doctor marked it done, or null. */
  takipTarihi: string | null
  kapandi: string | null
  /** What was entered (as the doctor typed it) and what came out. null = the stored value could not be read. */
  girdiler: AracGirdisi | null
  sonuc: AracSonucu | null
}

/** One open follow-up on the panel. */
export type TakipSatiri = { id: string; hastaId: string; hastaAdi: string; arac: string; takipTarihi: string; gecikti: boolean }
