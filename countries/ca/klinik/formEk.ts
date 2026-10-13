/**
 * NOTYA-ULKE-INTAKE-02 — Canada: province or territory, health card number, and an optional version or code.
 * MACHINE-WRITTEN. AWAITS A CANADIAN CLINICIAN. CONSENT TEXT PENDING A LAWYER.
 * The card number is optional free text. No checksum is applied. Territories are listed with the provinces.
 * The emergency sentence names 911.
 */
import type { HamBolum } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { kisa, s, tek } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { rizaBolumu } from '../../_dil/en/klinik/hastaFormu/rizaBolumu'

const KIMLIK: HamBolum = {
  anahtar: 'id_payer',
  baslik: 'Health card',
  sorular: [
    tek('ca_province', 'Province or territory', [
      s('ab', 'Alberta'),
      s('bc', 'British Columbia'),
      s('mb', 'Manitoba'),
      s('nb', 'New Brunswick'),
      s('nl', 'Newfoundland and Labrador'),
      s('ns', 'Nova Scotia'),
      s('nt', 'Northwest Territories'),
      s('nu', 'Nunavut'),
      s('on', 'Ontario'),
      s('pe', 'Prince Edward Island'),
      s('qc', 'Quebec'),
      s('sk', 'Saskatchewan'),
      s('yt', 'Yukon'),
      s('rather_not', 'I would rather not say'),
    ], { veliMetni: 'The child\'s province or territory' }),
    kisa('ca_card', 'Health card number, if you have one', {
      veliMetni: 'The child\'s health card number, if you have one',
      yardim: 'Leave this blank if you do not have it with you. Nothing here is checked.',
    }),
    kisa('ca_version', 'Version or code printed on the card, if any'),
  ],
}

export const CA_CEKIRDEK_EK: readonly HamBolum[] = [
  KIMLIK,
  rizaBolumu('ca', {
    metin: 'Do you accept responsibility for charges a health plan does not pay?',
    veliMetni: 'Do you accept responsibility for charges a health plan does not pay for the child?',
  }),
]

export const CA_ACIL_CUMLE = 'If any of these is happening now, do not wait to finish this form. Call 911 or go to the nearest emergency department. This form does not replace emergency care.'
