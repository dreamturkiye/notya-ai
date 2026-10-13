/**
 * NOTYA-ULKE-INTAKE-02 — United States: identifier, payer and consent acknowledgements, and the emergency sentence.
 * MACHINE-WRITTEN. AWAITS A US CLINICIAN. CONSENT TEXT PENDING A LAWYER. Not a signed privacy notice.
 * Questions are written in the set's base spelling; the pack applies American spelling. The emergency sentence is
 * already in American spelling, because it is substituted after that step.
 * No Social Security number is asked. The public-programme option does not use another country's programme name.
 */
import type { HamBolum } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { kisa, s, tek } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { rizaBolumu } from '../../_dil/en/klinik/hastaFormu/rizaBolumu'

const KIMLIK: HamBolum = {
  anahtar: 'id_payer',
  baslik: 'Cover and identifier',
  sorular: [
    tek('us_payment', 'How will this visit be paid for?', [
      s('self', 'I will pay myself'),
      s('plan', 'A private or employer health plan'),
      s('public', 'Medicaid or another public programme'),
      s('other', 'Another arrangement'),
      s('unsure', 'I am not sure'),
    ], { zorunlu: true, veliMetni: 'How will the child\'s visit be paid for?' }),
    kisa('us_carrier', 'Name of the health plan, if there is one', { veliMetni: 'Name of the child\'s health plan, if there is one' }),
    kisa('us_member', 'Member identifier on the card, if you have it', { veliMetni: 'Member identifier on the child\'s card, if you have it' }),
    kisa('us_group', 'Group identifier, if it is printed on the card'),
    kisa('us_bill_person', 'Who is responsible for the bill, if it is not you?', { kime: 'yetiskin' }),
  ],
}

export const US_CEKIRDEK_EK: readonly HamBolum[] = [
  KIMLIK,
  rizaBolumu('us', {
    metin: 'Do you accept responsibility for charges a health plan does not pay?',
    veliMetni: 'Do you accept responsibility for charges a health plan does not pay for the child?',
  }),
]

/** Substituted into red-flag help. American spelling. Includes 911. */
export const US_ACIL_CUMLE = 'If any of these is happening now, do not wait to finish this form. Call 911 or go to the nearest emergency department. This form does not replace emergency care.'
