/**
 * NOTYA-ULKE-MESAJ-01 — "my templates": the kit's fixed numbers, names and shapes. Client-safe: plain values and
 * types, no imports. The same in every country.
 */

/** A template's title and text hold at most this many characters. */
export const SABLON_AD_AZAMI = 80
export const SABLON_METIN_AZAMI = 4000
/** An account keeps at most this many templates in use. */
export const SABLON_ADET_AZAMI = 200

/** The route of the templates (a doctor's session only). */
export const SABLON_API = '/api/ulke/sablonlar'
/** The key of the tile in the tools area, where the templates are kept. */
export const SABLON_ARACI = 'sablonlarim'

/** Where a template is offered: a section of a visit note, a message to a patient, or both. */
export const SABLON_KAPSAMLARI = ['not', 'mesaj', 'hepsi'] as const
export type SablonKapsami = (typeof SABLON_KAPSAMLARI)[number]
/** Where a picker stands: in a note or in a message. */
export type SablonYeri = 'not' | 'mesaj'
export const kapsamMi = (ham: unknown): ham is SablonKapsami => typeof ham === 'string' && (SABLON_KAPSAMLARI as readonly string[]).includes(ham)
export const yerMi = (ham: unknown): ham is SablonYeri => ham === 'not' || ham === 'mesaj'

export type Sablon = {
  id: string
  ad: string
  metin: string
  kapsam: SablonKapsami
  /** When it was last saved (ISO moment). */
  guncellendi: string
}

/** A title as it is kept: one line, trimmed. */
export function sablonAdiAl(ham: unknown): string {
  // eslint-disable-next-line no-control-regex
  return typeof ham === 'string' ? ham.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim() : ''
}
/** A text as it is kept: one kind of line end, no control character, trimmed. */
export function sablonMetniAl(ham: unknown): string {
  // eslint-disable-next-line no-control-regex
  return typeof ham === 'string' ? ham.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim() : ''
}

/** A text put at the end of what is already written: on a line of its own, nothing replaced, never past `azami`. */
export function sonaEkle(eski: string, eklenen: string, azami?: number): string {
  const yeni = eski.trim() ? `${eski.replace(/\s+$/, '')}\n${eklenen}` : eklenen
  return typeof azami === 'number' ? yeni.slice(0, azami) : yeni
}
