/**
 * NOTYA-RANDEVU-V2 — external busy blocks that feed the slot engine (start/end only, no titles).
 * PR2: Google Takvim events imported into randevu_dis_mesgul (lib/randevu/v2/google/senk.ts). Fail-soft: before
 * migration 112, or for a doctor who never connected, there are none.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Aralik } from './slot'

export async function disMesgulBloklari(sb: SupabaseClient, doktorId: string, bas: number, son: number): Promise<Aralik[]> {
  const { data, error } = await sb.from('randevu_dis_mesgul').select('baslangic, bitis').eq('doktor_id', doktorId)
    .lt('baslangic', new Date(son).toISOString()).gt('bitis', new Date(bas).toISOString()).limit(5000)
  if (error || !data) return []
  return data.map((x) => ({ bas: Date.parse(String(x.baslangic)), son: Date.parse(String(x.bitis)) }))
}
