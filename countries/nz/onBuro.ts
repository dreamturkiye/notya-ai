/**
 * WHATSAPP-ONBURO-01 — New Zealand: the front-desk language pack = the English language set in en-NZ, with this country's
 * emergency number (the pack's own setting, `uygulama.portal.acilNumara`) and its everyday payer words.
 * MACHINE-WRITTEN, not read by a native editor or a clinician. Not wired to a channel yet (see ../_dil/en/onBuro.ts).
 */
import { enOnBuro } from '../_dil/en/onBuro'
import { NZ_PAKETI } from './index'

export const NZ_ON_BURO = enOnBuro({
  bicim: 'en-NZ',
  acilNumara: String(NZ_PAKETI.uygulama?.portal?.acilNumara || ''),
  sigortaSozleri: ['acc', 'community services card', 'csc', 'enrolled'],
})
