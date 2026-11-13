/**
 * PREMATUR-ULKE-01 (Kaan, 2026-11-13) — THE ENGLISH LANGUAGE SET: ROLE TOOLS, ninth part. The prematurity module's three tiles
 * (lib/ulke/prematur/, screens components/ulke/uygulama/PrematurPaneli.tsx and ErkenDogumPaneli.tsx): the preterm baby's follow-up
 * plan and the doctor's list of such babies (paediatrics only), and the early-birth record (obstetrics and gynaecology only).
 *
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY. Written in en-GB spelling. Switched on where a country states
 * `prematur` (its follow-up table with sources, its early-birth thresholds): the tools carry no number and no source of their own,
 * the screens' words are in ../prematurMetni.ts. No dose anywhere.
 */
import type { HamArac } from './yardimci'

const PEDI = ['paediatrics'] as const
const KD = ['obstetrics-gynaecology'] as const
const NOT = 'A checklist the doctor confirms: nothing is ordered, referred, prescribed or sent, and there is no dose.'

export const EN_ARACLAR_9: readonly HamArac[] = [
  {
    anahtar: 'prematur-takip', roller: PEDI,
    ad: 'Preterm follow-up plan',
    aciklama: 'From the gestation and the birth weight of a preterm or very low birth weight baby: the follow-up items of this country\'s source (eyes, brain, hearing, lungs, blood, bones, infection), each with its criterion, its source and how the source was read; corrected age beside the age in months.',
    not: NOT,
  },
  {
    anahtar: 'prematur-kohort', roller: PEDI,
    ad: 'Preterm babies list',
    aciklama: 'Your own preterm and very low birth weight patients, the most urgent first: overdue and due items at a glance.',
    not: NOT,
  },
  {
    anahtar: 'erken-dogum', roller: KD,
    ad: 'Early-birth record',
    aciklama: 'A pregnancy\'s cervical length log and trend, earlier preterm birth, multiple pregnancy, ruptured membranes and the antenatal steroid and magnesium facts you enter, against the thresholds of this country\'s source.',
    not: 'A record and decision support: nothing is ordered, prescribed or sent, and there is no dose, procedure or cerclage proposed.',
  },
]
