/**
 * ZIYARET-SAYACI-01 — the visit counter's three database functions (migration 194), called with the SERVICE role only.
 * The SAME file on main and on every release branch. Every call passes this build's country (`ulke`): 'tr' on main,
 * the build's own code in a country build, against that build's own database.
 *
 * Why this is not behind lib/ulke/uygulama/tablolar.ts (the country builds' one door): that door is for doctor and
 * patient data — every table behind it carries a doctor key and the country's row rules. The counter's tables hold no
 * doctor, no patient and nothing a signed-in user wrote: only per-day page counts. They are reached through these three
 * functions and nothing else (row-level security on, no browser privilege, execute granted to service_role only).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ZiyaretDeposu } from './ziyaret'
import { ziyaretOzetiTemizle, type ZiyaretOzeti } from './tipler'

export function ziyaretDeposu(supabase: () => SupabaseClient): ZiyaretDeposu {
  return {
    async tuzAl(ulke, gun) {
      const { data, error } = await supabase().rpc('site_visit_salt', { p_ulke: ulke, p_day: gun })
      if (error) throw new Error('salt unavailable')
      return typeof data === 'string' ? data : null
    },
    async kaydet(k) {
      const { error } = await supabase().rpc('site_visit_record', {
        p_ulke: k.ulke, p_day: k.gun, p_hash: k.ozet, p_path: k.yol, p_referrer_host: k.ref, p_device: k.cihaz,
      })
      if (error) throw new Error('record failed')
    },
  }
}

/** This build's summary for the founder console, aggregated in SQL; null when the counter is not installed or fails. */
export async function ziyaretOzetiOku(supabase: SupabaseClient, ulke: string, simdi: number = Date.now()): Promise<ZiyaretOzeti | null> {
  try {
    const { data, error } = await supabase.rpc('site_visit_stats', { p_ulke: ulke, p_today: new Date(simdi).toISOString().slice(0, 10) })
    if (error) return null
    return ziyaretOzetiTemizle(data)
  } catch {
    return null
  }
}
