/**
 * NOTYA-ULKE-EN-01 — Australia: the clinical half of the pack. How a visit is listened to and what a note may be
 * built from. Reached only through countries/active/klinik, and only on the server.
 *
 * Nothing is written here: the English language set (countries/_dil/en/klinik/) assembles the instructions to the
 * model, the note templates and the intake questions in Australian spelling (en-AU) from what this country states in
 * ../ayarlar.ts. NOTHING HAS BEEN MEASURED OR REVIEWED IN AUSTRALIA (see that file).
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import { enKlinik } from '../../_dil/en/klinik'
import { AU_GIRDI } from '../ayarlar'

export const AU_KLINIK: UlkeKlinigi = enKlinik(AU_GIRDI)
