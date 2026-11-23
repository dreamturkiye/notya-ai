/**
 * ESNEK-MUAYENE-B7 — the time meter on the server: today and the last 7 days from the measured records (Phase A
 * dokumantasyon_sureleri), against the best honest baseline (shadow-mode measured → shadow-mode declared → the doctor's own).
 * HASTA-IZOLASYON: no patient id in; rows by doctor_id only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { donemOzeti, haftalikOzet, tabanSec, toplamOzet, type Taban, type ZamanOzeti } from '@/core/esnek/zamanOlcer'
import { gunAnahtari } from '@/core/esnek/metinAraclari'

export async function tabanYukle(sb: SupabaseClient, doktorId: string, hekimDk: number | null): Promise<Taban | null> {
  const kesim = gunAnahtari(new Date(Date.now() - 60 * 86400000))
  const { data } = await sb.from('golge_karsilastirmalari').select('sekreter_kaynagi, sekreter_sure_ms, sekreter_beyan_dk').eq('doctor_id', doktorId).gte('gun', kesim).limit(500)
  const satir = (data || []) as { sekreter_kaynagi: string; sekreter_sure_ms: number | null; sekreter_beyan_dk: number | null }[]
  return tabanSec({
    golgeOlculenMs: satir.filter((r) => r.sekreter_kaynagi === 'yazdi' && r.sekreter_sure_ms).map((r) => Number(r.sekreter_sure_ms)),
    golgeBeyanDk: satir.filter((r) => r.sekreter_beyan_dk).map((r) => Number(r.sekreter_beyan_dk)),
    hekimDk,
  })
}

export type ZamanYaniti = { gun: string; ozet: ZamanOzeti; hafta: ZamanOzeti; gunler: { gun: string; ozet: ZamanOzeti }[] }

export async function zamanYukle(sb: SupabaseClient, doktorId: string, hekimDk: number | null, simdi = new Date()): Promise<ZamanYaniti> {
  const gunler = Array.from({ length: 7 }, (_, i) => gunAnahtari(new Date(simdi.getTime() - (6 - i) * 86400000)))
  const [{ data }, taban] = await Promise.all([
    sb.from('dokumantasyon_sureleri').select('sure_ms, note_id, session_id, patient_id, gun').eq('doctor_id', doktorId).gte('gun', gunler[0]).limit(20000),
    tabanYukle(sb, doktorId, hekimDk),
  ])
  const kayit = ((data || []) as { sure_ms: number; note_id: string | null; session_id: string | null; patient_id: string | null; gun: string }[]).map((r) => ({ ...r, gun: String(r.gun) }))
  const gunluk = haftalikOzet(kayit, gunler, taban)
  const bugun = gunler[gunler.length - 1]
  return { gun: bugun, ozet: donemOzeti(kayit.filter((k) => k.gun === bugun), taban), hafta: toplamOzet(gunluk.map((g) => g.ozet), taban), gunler: gunluk }
}
