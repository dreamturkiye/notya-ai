/**
 * NOTYA-ULKE-MESAJ-01 — messages between a doctor and a patient: the kit's fixed numbers, names and shapes.
 * Client-safe: plain values and types, no imports. These are the KIT's (the same in every country): limits against
 * misuse, not local custom. What a country decides is in its pack.
 */

/** A message holds at most this many characters. */
export const MESAJ_AZAMI = 2000
/** One side writes at most this many messages to one patient's conversation in 24 hours. */
export const MESAJ_GUNLUK_AZAMI = 30
/** How many conversations of a patient are listed, newest first, and how many messages in all. */
export const YAZISMA_LISTE_AZAMI = 20
export const MESAJ_LISTE_AZAMI = 400
/** How many unread messages the home screen's list is built from. */
export const OKUNMAMIS_AZAMI = 500

/** The route a DOCTOR's session calls. Deliberately not under the portal's own routes. */
export const HEKIM_MESAJ_API = '/api/ulke/hasta-mesajlari'
/** The route a PATIENT's page calls: under the portal's routes, so that the portal cookie reaches it. */
export const PORTAL_MESAJ_API = '/api/ulke/portal/mesaj'

/** Who wrote a message. */
export type MesajGondereni = 'hekim' | 'hasta'

export type Mesaj = {
  id: string
  gonderen: MesajGondereni
  metin: string
  /** When it was written (ISO moment). */
  an: string
  /** When THE OTHER SIDE read it, or null. */
  okundu: string | null
}

export type Yazisma = {
  id: string
  olusturuldu: string
  /** When the doctor closed it, or null while it is open. */
  kapandi: string | null
  /** Oldest first. */
  mesajlar: Mesaj[]
}

/** What the doctor's card on a patient's file is answered with (GET ?hasta=). */
export type HekimMesajGorunumu = {
  /** Newest conversation first. */
  yazismalar: Yazisma[]
  /** Does the patient have a link that works? Without one they cannot read a message. */
  erisim: 'yok' | 'acik' | 'kilitli' | 'suresi-doldu'
}

/** One patient with unread messages, on the home screen (GET without an id). */
export type OkunmamisHasta = { hastaId: string; hastaAdi: string; adet: number; /** The newest unread message's moment. */ son: string }

/** What the patient's page is answered with. */
export type HastaMesajGorunumu = {
  /** Newest conversation first. */
  yazismalar: Yazisma[]
  /** true = a conversation is open: the patient may answer. */
  yazabilir: boolean
}

/** A message as it is kept: trimmed, line ends made one kind, no control character. '' = nothing to send. */
export function mesajMetniAl(ham: unknown): string {
  if (typeof ham !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return ham.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').replace(/\n{3,}/g, '\n\n').trim()
}
