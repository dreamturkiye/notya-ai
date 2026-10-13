/**
 * NOTYA-ULKE-ARACLAR-01 — the active pack's units and number rules, as the tools need them. One function for the
 * screens and for the server, so the two read a typed number the same way.
 */
import { ulkePaketi } from '../ulke'
import type { BirimOrtami } from './birimler'
import type { UlkeAraclari } from './tipler'

export function birimOrtami(icerik: UlkeAraclari): BirimOrtami {
  const u = ulkePaketi().uygulama
  if (!u) throw new Error('[ulke/araclar] the pack has no application settings')
  const { ondalikAyraci, binlikAyraci } = ulkePaketi().bicim
  // `olculer`: the quantities the pack's own tools read (NOTYA-ULKE-OZEL-01); a pack that has none adds nothing.
  return { birimler: u.birimler, lab: icerik.labBirimleri, sayi: { ondalikAyraci, binlikAyraci }, ...(icerik.olculer ? { olculer: icerik.olculer } : {}) }
}
