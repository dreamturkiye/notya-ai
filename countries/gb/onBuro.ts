/**
 * WHATSAPP-ONBURO-01 — United Kingdom: the front-desk language pack = the English language set in en-GB, with this country's
 * emergency number (the pack's own setting, `uygulama.portal.acilNumara`) and its everyday payer words.
 * MACHINE-WRITTEN, not read by a native editor or a clinician. Not wired to a channel yet (see ../_dil/en/onBuro.ts).
 */
import { enOnBuro } from '../_dil/en/onBuro'
import { GB_PAKETI } from './index'

export const GB_ON_BURO = enOnBuro({
  bicim: 'en-GB',
  acilNumara: String(GB_PAKETI.uygulama?.portal?.acilNumara || ''),
  sigortaSozleri: ['nhs', 'private patient', 'self pay', 'self funding'],
})
