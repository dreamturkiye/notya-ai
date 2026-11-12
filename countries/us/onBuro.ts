/**
 * WHATSAPP-ONBURO-01 — United States: the front-desk language pack = the English language set in en-US, with this country's
 * emergency number (the pack's own setting, `uygulama.portal.acilNumara`) and its everyday payer words.
 * MACHINE-WRITTEN, not read by a native editor or a clinician. Not wired to a channel yet (see ../_dil/en/onBuro.ts).
 */
import { enOnBuro } from '../_dil/en/onBuro'
import { US_PAKETI } from './index'

export const US_ON_BURO = enOnBuro({
  bicim: 'en-US',
  acilNumara: String(US_PAKETI.uygulama?.portal?.acilNumara || ''),
  ayOnce: true,
  ucretSozleri: ['copay', 'co pay', 'deductible', 'self pay'],
  sigortaSozleri: ['medicare', 'medicaid', 'in network', 'out of network', 'accept my insurance', 'hsa', 'fsa'],
})
