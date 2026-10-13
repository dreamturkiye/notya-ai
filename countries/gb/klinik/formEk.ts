/**
 * NOTYA-ULKE-INTAKE-02 — United Kingdom: NHS number, previous GP, ethnicity, and consent acknowledgements.
 * MACHINE-WRITTEN. AWAITS A UK CLINICIAN. CONSENT TEXT PENDING A LAWYER.
 * Ethnicity options are the high-level groups of the 2021 census, plus rather-not-say. The NHS number is optional
 * free text and is not checked. The emergency sentence names 999 only. NHS 111 is not in the kit.
 */
import type { HamBolum } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { kisa, s, tek } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { rizaBolumu } from '../../_dil/en/klinik/hastaFormu/rizaBolumu'

const KIMLIK: HamBolum = {
  anahtar: 'id_payer',
  baslik: 'NHS number and background',
  sorular: [
    kisa('gb_nhs', 'NHS number, if you know it', {
      veliMetni: 'The child\'s NHS number, if you know it',
      yardim: 'Leave this blank if you do not know it. Nothing here is checked against a register.',
    }),
    kisa('gb_prev_gp', 'Previous GP or clinic, if there is one', { veliMetni: 'The child\'s previous GP or clinic, if there is one' }),
    tek('gb_ethnicity', 'Ethnic group', [
      s('asian', 'Asian or Asian British'),
      s('black', 'Black, Black British, Caribbean or African'),
      s('mixed', 'Mixed or multiple ethnic groups'),
      s('white', 'White'),
      s('other', 'Other ethnic group'),
      s('rather_not', 'I would rather not say'),
    ], { veliMetni: 'The child\'s ethnic group' }),
  ],
}

export const GB_CEKIRDEK_EK: readonly HamBolum[] = [
  KIMLIK,
  rizaBolumu('gb', {
    metin: 'Do you acknowledge that you may be asked to pay if the NHS does not cover this visit?',
    veliMetni: 'Do you acknowledge that you may be asked to pay if the NHS does not cover this visit for the child?',
  }),
]

export const GB_ACIL_CUMLE = 'If any of these is happening now, do not wait to finish this form. Call 999. This form does not replace emergency care.'
