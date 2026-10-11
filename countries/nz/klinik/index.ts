/**
 * NOTYA-ULKE-EN-01 — New Zealand: the clinical half of the pack. How a visit is listened to and what a note may be
 * built from. Reached only through countries/active/klinik, and only on the server.
 *
 * Nothing is written here: the English language set (countries/_dil/en/klinik/) assembles the instructions to the
 * model, the note templates and the intake questions in New Zealand spelling (en-NZ) from what this country states in
 * ../ayarlar.ts. NOTHING HAS BEEN MEASURED OR REVIEWED IN NEW ZEALAND (see that file).
 *
 * NOTYA-ULKE-UYGULA-NZ: the role list is handed over WITH the question sets of the roles that ask under a heading of
 * their own (./hastaFormu.ts) — here and not in ../ayarlar.ts, because intake questions belong to the server half.
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import { enKlinik } from '../../_dil/en/klinik'
import { NZ_GIRDI } from '../ayarlar'
import { NZ_ROLLER_FORMLU } from './hastaFormu'

export const NZ_KLINIK: UlkeKlinigi = enKlinik({ ...NZ_GIRDI, roller: NZ_ROLLER_FORMLU })
