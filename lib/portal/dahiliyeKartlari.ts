/** Dahiliye cards on a patient (shared by the portal bundle's module eligibility and the ön anket API). */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnketKart } from '@/specialties/dahiliye/engines/anket'

const TABLOLAR: [string, AnketKart][] = [['dahiliye_ht', 'ht'], ['dahiliye_dm', 'dm'], ['dahiliye_lipid', 'lipid'], ['dahiliye_tiroid', 'tiroid'], ['dahiliye_ckd', 'ckd'], ['dahiliye_hf', 'hf'], ['dahiliye_antikoagulan', 'antikoagulan'], ['dahiliye_pulm', 'pulm'], ['dahiliye_gi', 'gi']]

/** HASTA-IZOLASYON-01: scoped to the portal token's doctor — the portal shows only its linked doctor's data. */
export async function dahiliyeKartlari(client: SupabaseClient, patientId: string, doctorId: string): Promise<AnketKart[]> {
  const sonuc = await Promise.all(TABLOLAR.map(async ([t, k]) => { const { data } = await client.from(t).select('id').eq('patient_id', patientId).eq('doctor_id', doctorId).limit(1); return data?.length ? k : null }))
  return sonuc.filter((x): x is AnketKart => !!x)
}
