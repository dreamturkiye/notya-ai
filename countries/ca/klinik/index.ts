/**
 * NOTYA-ULKE-EN-01 — Canada: the clinical half of the pack. How a visit is listened to and what a note may be
 * built from. Reached only through countries/active/klinik, and only on the server.
 *
 * Nothing is written here: the English language set (countries/_dil/en/klinik/) assembles the instructions to the
 * model, the note templates and the intake questions in Canadian spelling (en-CA) from what this country states in
 * ../ayarlar.ts. NOTHING HAS BEEN MEASURED OR REVIEWED IN CANADA (see that file).
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import { enKlinik } from '../../_dil/en/klinik'
import { CA_GIRDI } from '../ayarlar'
import { CA_SES } from '../ses'
import { CA_CANLI_ASISTAN } from '../canli'
import { CA_ACIL_CUMLE, CA_CEKIRDEK_EK } from './formEk'
import { enEkRolIcerigi } from '../../_dil/en/klinik/ekRoller'
import { CA_EK_ROL_ONEKLERI, CA_EK_ROL_TURLERI, CA_ROLLER } from '../roller'

export const CA_KLINIK: UlkeKlinigi = {
  // ULKE-BRANS-DERINLIK-2026-11: the same own note fields as the screens, and each such role's own intake questions.
  ...enKlinik({ ...CA_GIRDI, roller: enEkRolIcerigi(CA_ROLLER, 'en-CA', CA_EK_ROL_TURLERI, CA_EK_ROL_ONEKLERI, { form: true }), cekirdekEk: CA_CEKIRDEK_EK, acilCumle: CA_ACIL_CUMLE }),
  ses: CA_SES,
  // Live spoken assistant: fails closed until the agents and secrets exist (lib/ulke/asistan/ajan.ts).
  canliAsistan: CA_CANLI_ASISTAN,
}
