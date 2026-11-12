/**
 * WHATSAPP-ONBURO-01 — Canada: the front-desk language pack = the English language set in en-CA, with this country's
 * emergency number (the pack's own setting, `uygulama.portal.acilNumara`) and its everyday payer words.
 * MACHINE-WRITTEN, not read by a native editor or a clinician. Not wired to a channel yet (see ../_dil/en/onBuro.ts).
 */
import { enOnBuro } from '../_dil/en/onBuro'
import { CA_PAKETI } from './index'

export const CA_ON_BURO = enOnBuro({
  bicim: 'en-CA',
  acilNumara: String(CA_PAKETI.uygulama?.portal?.acilNumara || ''),
  sigortaSozleri: ['ohip', 'msp', 'ramq', 'health card', 'provincial plan', 'extended health', 'benefits'],
})
