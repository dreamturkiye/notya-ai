/**
 * NOTYA-RANDEVU-V2 — external busy blocks that feed the slot engine (start/end only, no titles).
 * PR1: no external calendar yet → none. PR2 (Google Takvim) reads randevu_dis_mesgul here.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Aralik } from './slot'

export async function disMesgulBloklari(_sb: SupabaseClient, _doktorId: string, _bas: number, _son: number): Promise<Aralik[]> {
  return []
}
