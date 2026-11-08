/**
 * NOTYA-ULKE-EN-01 — United Kingdom: the clinical half of the pack. How a visit is listened to and what a note may be
 * built from. Reached only through countries/active/klinik, and only on the server.
 *
 * Nothing is written here: the English language set (countries/_dil/en/klinik/) assembles the instructions to the
 * model, the note templates and the intake questions in British spelling from what this country states in
 * ../ayarlar.ts. NOTHING HAS BEEN MEASURED OR REVIEWED IN THE UNITED KINGDOM (see that file).
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import { enKlinik } from '../../_dil/en/klinik'
import { GB_GIRDI } from '../ayarlar'
import { GB_SES } from '../ses'
import { GB_CANLI_ASISTAN } from '../canli'
import { GB_ACIL_CUMLE, GB_CEKIRDEK_EK } from './formEk'
import { enEkRolIcerigi } from '../../_dil/en/klinik/ekRoller'
import { GB_EK_ROL_ONEKLERI, GB_EK_ROL_TURLERI, GB_ROLLER } from '../roller'

export const GB_KLINIK: UlkeKlinigi = {
  // ULKE-BRANS-DERINLIK-2026-11: the same own note fields as the screens, and each such role's own intake questions.
  ...enKlinik({ ...GB_GIRDI, roller: enEkRolIcerigi(GB_ROLLER, 'en-GB', GB_EK_ROL_TURLERI, GB_EK_ROL_ONEKLERI, { form: true }), cekirdekEk: GB_CEKIRDEK_EK, acilCumle: GB_ACIL_CUMLE }),
  ses: GB_SES,
  // Live spoken assistant: fails closed until the agents and secrets exist (lib/ulke/asistan/ajan.ts).
  canliAsistan: GB_CANLI_ASISTAN,
}
