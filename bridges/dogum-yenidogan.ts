/**
 * Birth-note → newborn draft. Pediatrics consumes this object.
 * No public newborn contract existed under specialties/pediatri (frozen, not modified),
 * so this file exports NewbornHandoff and stops.
 */
export type NewbornHandoff = {
  source: 'dogum-yenidogan'
  mother_patient_id: string
  episode_id: string
  birth_iso: string
  live_birth: boolean
  apgar1: number | null
  apgar5: number | null
  weight_g: number | null
  gbs: 'positive' | 'negative' | 'unknown' | 'not_tested'
  hep_b_planned: boolean
  vit_k_planned: boolean
  heel_stick_tsh_pku_reminder: boolean
  breastfeeding_initiated: boolean | null
  anti_d_logistics: {
    mother_rh_negative: boolean
    neonate_rh_positive: boolean | null
    anti_d_indicated: boolean
  }
}

export function draftNewbornHandoff(input: {
  mother_patient_id: string
  episode_id: string
  birth_iso: string
  live_birth: boolean
  apgar1?: number | null
  apgar5?: number | null
  weight_g?: number | null
  gbs?: NewbornHandoff['gbs']
  breastfeeding_initiated?: boolean | null
  mother_rh_negative: boolean
  neonate_rh_positive?: boolean | null
}): NewbornHandoff {
  const neonateRh = input.neonate_rh_positive ?? null
  return {
    source: 'dogum-yenidogan',
    mother_patient_id: input.mother_patient_id,
    episode_id: input.episode_id,
    birth_iso: input.birth_iso,
    live_birth: input.live_birth,
    apgar1: input.apgar1 ?? null,
    apgar5: input.apgar5 ?? null,
    weight_g: input.weight_g ?? null,
    gbs: input.gbs ?? 'unknown',
    hep_b_planned: true,
    vit_k_planned: true,
    heel_stick_tsh_pku_reminder: true,
    breastfeeding_initiated: input.breastfeeding_initiated ?? null,
    anti_d_logistics: {
      mother_rh_negative: input.mother_rh_negative,
      neonate_rh_positive: neonateRh,
      anti_d_indicated: input.mother_rh_negative && neonateRh === true,
    },
  }
}
