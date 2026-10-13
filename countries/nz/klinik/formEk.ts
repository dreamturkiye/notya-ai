/**
 * NOTYA-ULKE-INTAKE-02 — New Zealand: NHI, ethnicity (Ministry level 1), and an ACC injury question.
 * MACHINE-WRITTEN. AWAITS A NEW ZEALAND CLINICIAN. CONSENT TEXT PENDING A LAWYER.
 * Ethnicity uses the level-1 groups, with Māori written with the macron, plus rather-not-say.
 * The emergency sentence names 111.
 */
import type { HamBolum } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { eh, kisa, s, tek } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { rizaBolumu } from '../../_dil/en/klinik/hastaFormu/rizaBolumu'

const KIMLIK: HamBolum = {
  anahtar: 'id_payer',
  baslik: 'NHI and background',
  sorular: [
    kisa('nz_nhi', 'NHI number, if you know it', {
      veliMetni: 'The child\'s NHI number, if you know it',
      yardim: 'Leave this blank if you do not know it. Nothing here is checked.',
    }),
    tek('nz_ethnicity', 'Ethnic group', [
      s('european', 'European'),
      s('maori', 'Māori'),
      s('pacific', 'Pacific peoples'),
      s('asian', 'Asian'),
      s('melaa', 'Middle Eastern, Latin American or African'),
      s('other', 'Other'),
      s('rather_not', 'I would rather not say'),
    ], { veliMetni: 'The child\'s ethnic group' }),
    eh('nz_acc', 'Is today\'s visit about an injury that may be covered by ACC?', 'What happened, in a few words', {
      veliMetni: 'Is today\'s visit about an injury to the child that may be covered by ACC?',
    }),
  ],
}

export const NZ_CEKIRDEK_EK: readonly HamBolum[] = [
  KIMLIK,
  rizaBolumu('nz', {
    metin: 'Do you accept responsibility for charges that are not covered?',
    veliMetni: 'Do you accept responsibility for charges that are not covered for the child?',
  }),
]

export const NZ_ACIL_CUMLE = 'If any of these is happening now, do not wait to finish this form. Call 111 or go to the nearest emergency department. This form does not replace emergency care.'
