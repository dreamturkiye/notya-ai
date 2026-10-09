/**
 * NOTYA-ULKE-ARACLAR-01 — the active pack's units, as the tools need them. One function for the screens and for
 * the server, so the two read a typed number the same way.
 */
import { ulkePaketi } from '../ulke'
import type { BirimOrtami } from './birimler'
import type { UlkeAraclari } from './tipler'

export function birimOrtami(icerik: UlkeAraclari): BirimOrtami {
  const u = ulkePaketi().uygulama
  if (!u) throw new Error('[ulke/araclar] the pack has no application settings')
  return { birimler: u.birimler, lab: icerik.labBirimleri }
}
