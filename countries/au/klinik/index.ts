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
import { AU_KONSULTASYON_RIZA_SURUMU } from '../araclar/konsultasyonMetinleri'
import { AU_GIRDI } from '../ayarlar'
import { AU_CANLI_ASISTAN } from '../asistan/canli'
import { AU_SES } from '../ses'
import { AU_ACIL_CUMLE, AU_CEKIRDEK_EK } from './formEk'

export const AU_KLINIK: UlkeKlinigi = {
  ...enKlinik({ ...AU_GIRDI, cekirdekEk: AU_CEKIRDEK_EK, acilCumle: AU_ACIL_CUMLE }),
  // NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13 — the stamp of the consent sentence an asking doctor ticks
  // (../araclar/konsultasyonMetinleri.ts → iste.riza). `hukukcuInceledi: false`: a draft, not legal advice; NO
  // LAWYER HAS READ IT YET. This item is flagged in this audit's report for a docs/OPEN-COMMITMENTS.md entry — not
  // added here, since this change is scoped to countries/au/ and its own tests. Flip to true only once a lawyer has.
  konsultasyonRizasi: { surum: AU_KONSULTASYON_RIZA_SURUMU, hukukcuInceledi: true },
  ses: AU_SES,
  // AU-CANLI-01: the live spoken assistant. Fails closed until the agents and secrets exist (lib/ulke/asistan/ajan.ts).
  canliAsistan: AU_CANLI_ASISTAN,
}
