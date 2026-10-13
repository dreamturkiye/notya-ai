/**
 * NOTYA-ULKE-INTAKE-02 — Australia: Medicare, DVA, private fund, and origin.
 * MACHINE-WRITTEN. AWAITS AN AUSTRALIAN CLINICIAN. CONSENT TEXT PENDING A LAWYER.
 * The origin question follows the usual ABS / AIHW wording and includes a decline option.
 * An interpreter is already asked in the shared core. The emergency sentence names 000.
 */
import type { HamBolum } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { kisa, s, tek } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { rizaBolumu } from '../../_dil/en/klinik/hastaFormu/rizaBolumu'

const KIMLIK: HamBolum = {
  anahtar: 'id_payer',
  baslik: 'Medicare, DVA or a private fund',
  sorular: [
    tek('au_cover', 'How is this visit covered?', [
      s('medicare', 'Medicare'),
      s('dva', 'DVA'),
      s('private', 'A private health fund'),
      s('self', 'I will pay myself'),
      s('unsure', 'I am not sure'),
    ], { zorunlu: true, veliMetni: 'How is the child\'s visit covered?' }),
    kisa('au_medicare', 'Medicare card number, if you have one', { veliMetni: 'The child\'s Medicare card number, if you have one' }),
    kisa('au_dva', 'DVA file number, if you have one', { veliMetni: 'The child\'s DVA file number, if you have one' }),
    kisa('au_fund', 'Name of the private health fund, if any'),
    tek('au_origin', 'Are you of Aboriginal or Torres Strait Islander origin?', [
      s('no', 'No'),
      s('aboriginal', 'Yes, Aboriginal'),
      s('tsi', 'Yes, Torres Strait Islander'),
      s('both', 'Yes, both'),
      s('decline', 'I do not want to answer'),
    ], { veliMetni: 'Is the child of Aboriginal or Torres Strait Islander origin?' }),
  ],
}

export const AU_CEKIRDEK_EK: readonly HamBolum[] = [
  KIMLIK,
  rizaBolumu('au', {
    metin: 'Do you accept responsibility for charges a health fund does not pay?',
    veliMetni: 'Do you accept responsibility for charges a health fund does not pay for the child?',
  }),
]

export const AU_ACIL_CUMLE = 'If any of these is happening now, do not wait to finish this form. Call 000 or go to the nearest emergency department. This form does not replace emergency care.'
