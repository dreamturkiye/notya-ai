/**
 * The phone rule of the ACTIVE pack, on top of the one validator (lib/telefon/dogrula.ts): the same calls answer a
 * form field in the browser and the API route behind it. `telefonHatasi` gives the sentence of the country (the
 * pack's `girdi` words, with the country's own example number); `ulkeTelefonu` gives the stored value.
 */
import { telefonCoz, telefonUlkesi, type TelefonNedeni, type TelefonSecenegi, type TelefonSonuc } from '@/lib/telefon/dogrula'
import { ulkePaketi } from '../ulke'
import type { GirdiMetni } from './metinTipleri'
import { yerine } from './yerTutucu'

export function ulkeTelefonu(ham: string | null | undefined, secenek?: TelefonSecenegi): TelefonSonuc {
  const u = telefonUlkesi(ulkePaketi().kod)
  // A build whose country the validator does not know keeps the old behaviour: any text up to the field's limit.
  return u ? telefonCoz(u, ham, secenek) : { tamam: true, e164: (ham ?? '').trim(), ulusal: (ham ?? '').trim() }
}

export function telefonNedeniMetni(g: GirdiMetni, neden: TelefonNedeni): string {
  const ornek = ulkePaketi().telefon.ornek
  return neden === 'bos' ? g.telefonGerekli : neden === 'harf' ? g.telefonHarf : neden === 'kisa' ? yerine(g.telefonKisa, ornek) : neden === 'uzun' ? yerine(g.telefonUzun, ornek) : yerine(g.telefonGecersiz, ornek)
}

/** null = the number is acceptable (or an optional field is empty); otherwise the country's own sentence. */
export function telefonHatasi(g: GirdiMetni, ham: string | null | undefined, secenek: TelefonSecenegi = {}): string | null {
  if (!(ham ?? '').trim() && !secenek.zorunlu) return null
  const r = ulkeTelefonu(ham, secenek)
  return r.tamam ? null : telefonNedeniMetni(g, r.neden)
}

/** What is stored for a phone typed on a form: the E.164 number, or '' for an empty field. Call after `telefonHatasi` said null. */
export function telefonKaydi(ham: string | null | undefined, secenek?: TelefonSecenegi): string {
  if (!(ham ?? '').trim()) return ''
  const r = ulkeTelefonu(ham, secenek)
  return r.tamam ? r.e164 : ''
}
