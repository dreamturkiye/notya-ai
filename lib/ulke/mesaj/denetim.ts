/**
 * NOTYA-ULKE-MESAJ-01 — THE PACK CHECK FOR MESSAGES BETWEEN A DOCTOR AND A PATIENT. Called by the pack check
 * (lib/ulke/paketDenetimi.ts); answers with a list, like every other rule there, and a country's build fails on any
 * line of it. Pure.
 *
 *   - messages live in the patient portal: the feature needs `hastaPortali`;
 *   - THE OUTBOUND CHANNEL IS A SLOT: the pack states `uygulama.mesaj.disBildirim`, switched off, with no provider,
 *     saying what is missing and who decides. The kit has no outbound channel, so a pack cannot switch one on;
 *   - the catalogue is there in every language form, every sentence that carries a value holds its placeholder;
 *   - THE EMERGENCY NOTICE holds no digit: the ambulance number is the pack's setting, never a sentence's.
 */
import type { UlkeArayuzu } from '../arayuz/tipler'
import { eksikAyarMi, eksikMetinMi } from '../eksik'
import type { DilKodu, UlkePaketi } from '../tipler'

export type MesajSorunu = { yer: string; sorun: string }

const TESLIM = 'to be supplied'
const dolu = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

/** Sentences of the messages' catalogue that carry a value: path → the placeholders they must hold. */
export const MESAJ_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [
  ['hekim.cokUzun', ['%']], ['hekim.kapali', ['%']], ['hekim.okunmamisAdet', ['%']],
  ['hasta.acilNumara', ['%']], ['hasta.kapandi', ['%']], ['hasta.cokUzun', ['%']], ['hasta.okunmamis', ['%']],
]

/** A slot for an outbound channel: off, no provider, explained. The same rule wherever a pack states one. */
export function disBildirimSorunlari(yer: string, y: unknown): MesajSorunu[] {
  if (eksikAyarMi(y)) return [{ yer, sorun: `${TESLIM}: ${y.__eksikAyar}` }]
  const s = y as { acik?: unknown; saglayici?: unknown; eksik?: unknown; kimden?: unknown } | null | undefined
  if (!s || typeof s !== 'object') return [{ yer, sorun: 'the pack does not state the outbound channel: it is a slot ({ acik: false, saglayici: null, eksik, kimden }) until a provider is contracted' }]
  const cikti: MesajSorunu[] = []
  if (s.acik !== false || s.saglayici !== null) cikti.push({ yer, sorun: 'the kit has NO outbound channel to a patient (no SMS, no e-mail, no messenger): the slot is switched off with no provider (acik: false, saglayici: null)' })
  for (const k of ['eksik', 'kimden'] as const) {
    if (eksikAyarMi(s[k])) cikti.push({ yer: `${yer}.${k}`, sorun: `${TESLIM}: ${(s[k] as { __eksikAyar: string }).__eksikAyar}` })
    else if (!dolu(s[k])) cikti.push({ yer: `${yer}.${k}`, sorun: 'a slot says what is missing and who decides' })
    else if (eksikMetinMi(s[k])) cikti.push({ yer: `${yer}.${k}`, sorun: TESLIM })
  }
  return cikti
}

export function mesajSorunlari(paket: UlkePaketi, arayuz: UlkeArayuzu | null, diller: readonly DilKodu[], metinleriGez: (deger: unknown, yer: string, sorunlar: MesajSorunu[]) => void): MesajSorunu[] {
  const s: MesajSorunu[] = []
  const ekle = (yer: string, sorun: string) => s.push({ yer, sorun })
  if (!paket.ozellikler.hastaMesajlari) return s
  if (!paket.ozellikler.hastaPortali) ekle('ozellikler.hastaMesajlari', 'messages between a doctor and a patient need the patient portal (hastaPortali): a patient reads and answers on their own page')
  const u = paket.uygulama
  if (!u || !arayuz) return s
  if (!u.mesaj) ekle('uygulama.mesaj', 'messages are switched on and the pack has no settings for them (the outbound channel\'s slot)')
  else if (eksikAyarMi(u.mesaj)) ekle('uygulama.mesaj', `${TESLIM}: ${u.mesaj.__eksikAyar}`)
  else s.push(...disBildirimSorunlari('uygulama.mesaj.disBildirim', u.mesaj.disBildirim))
  for (const d of diller) {
    const mm = arayuz.mesajMetinleri?.[d]
    const yer = `arayuz.mesajMetinleri[${d}]`
    if (!mm) { ekle(yer, 'messages are on and this form has no catalogue for them'); continue }
    metinleriGez(mm, yer, s)
    // THE NUMBER IS THE PACK'S SETTING, NEVER TEXT: a number written into the sentence would be shown even where the
    // setting is null, and would not be the value a local source confirmed.
    for (const k of ['acil', 'acilNumara'] as const) { const t = mm.hasta?.[k]; if (typeof t === 'string' && !eksikMetinMi(t) && /\d/.test(t)) ekle(`${yer}.hasta.${k}`, 'carries a digit: the ambulance number belongs in uygulama.portal.acilNumara, and the sentence holds "%" where it is written') }
    for (const [yol, yerler] of MESAJ_YER_TUTUCULARI) {
      const metin = yol.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), mm)
      if (typeof metin !== 'string' || eksikMetinMi(metin) || !metin.trim()) continue
      for (const y of yerler) if (!(y === '%' ? /%(?!\d)/ : new RegExp(`${y}(?!\\d)`)).test(metin)) ekle(`${yer}.${yol}`, `must hold "${y}" where the value is written`)
    }
  }
  return s
}
