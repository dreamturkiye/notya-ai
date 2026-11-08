/**
 * NOTYA-ULKE-EN-01 — United States: the clinical half of the pack. How a visit is listened to and what a note may be
 * built from. Reached only through countries/active/klinik, and only on the server.
 *
 * Nothing is written here: the English language set (countries/_dil/en/klinik/) assembles the instructions to the
 * model, the note templates and the intake questions in American spelling (en-US) from what this country states in
 * ../ayarlar.ts. NOTHING HAS BEEN MEASURED OR REVIEWED IN THE UNITED STATES (see that file).
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import { enKlinik } from '../../_dil/en/klinik'
import { US_GIRDI } from '../ayarlar'
import { US_SES } from '../ses'
import { US_ACIL_CUMLE, US_CEKIRDEK_EK } from './formEk'
import { enEkRolIcerigi } from '../../_dil/en/klinik/ekRoller'
import { US_EK_ROL_ONEKLERI, US_EK_ROL_TURLERI, US_ROLLER } from '../roller'

export const US_KLINIK: UlkeKlinigi = {
  // ULKE-BRANS-DERINLIK-2026-11: the same own note fields as the screens, and each such role's own intake questions.
  ...enKlinik({ ...US_GIRDI, roller: enEkRolIcerigi(US_ROLLER, 'en-US', US_EK_ROL_TURLERI, US_EK_ROL_ONEKLERI, { form: true }), cekirdekEk: US_CEKIRDEK_EK, acilCumle: US_ACIL_CUMLE }),
  ses: US_SES,
}
