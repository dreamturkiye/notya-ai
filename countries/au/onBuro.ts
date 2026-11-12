/**
 * WHATSAPP-ONBURO-01 — Australia: the front-desk language pack = the English language set in en-AU, with this country's
 * emergency number (the pack's own setting, `uygulama.portal.acilNumara`) and its everyday payer words.
 * MACHINE-WRITTEN, not read by a native editor or a clinician. Not wired to a channel yet (see ../_dil/en/onBuro.ts).
 */
import { enOnBuro } from '../_dil/en/onBuro'
import { AU_PAKETI } from './index'

export const AU_ON_BURO = enOnBuro({
  bicim: 'en-AU',
  acilNumara: String(AU_PAKETI.uygulama?.portal?.acilNumara || ''),
  ucretSozleri: ['bulk bill\\w*', 'gap', 'gap fee', 'gap payment'],
  sigortaSozleri: ['medicare', 'dva', 'concession', 'health care card'],
})
