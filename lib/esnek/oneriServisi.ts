/**
 * ESNEK-MUAYENE-B5 — the doctor's suggestion profile on the server: feedback events (esnek_olaylar, kind 'oneri', written at
 * approval) aggregated over his last 90 days, plus his own choices (oneri_profili_kararlari). Safety never quiets.
 * HASTA-IZOLASYON: no patient id; every row by doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ONERI_TURLERI, turDurumu, type HekimKarari, type OneriProfili, type OneriTuru, type TurSayimi, type ProfilDurumu } from '@/core/esnek/oneriProfili'

export type OneriProfilOzeti = { profil: OneriProfili; turler: (TurSayimi & { durum: ProfilDurumu; karar: HekimKarari })[] }

export async function oneriProfiliYukle(sb: SupabaseClient, doktorId: string): Promise<OneriProfilOzeti> {
  const kesim = new Date(Date.now() - 90 * 86400000).toISOString()
  const [{ data: olay }, { data: karar }] = await Promise.all([
    sb.from('esnek_olaylar').select('anahtar, deger').eq('doctor_id', doktorId).eq('tur', 'oneri').gte('created_at', kesim).limit(5000),
    sb.from('oneri_profili_kararlari').select('tur, karar').eq('doctor_id', doktorId),
  ])
  const sayim = new Map<OneriTuru, TurSayimi>()
  for (const o of (olay || []) as { anahtar: string; deger: { kabul?: boolean } | null }[]) {
    if (!(ONERI_TURLERI as string[]).includes(o.anahtar)) continue
    const t = o.anahtar as OneriTuru
    const s = sayim.get(t) || { tur: t, kabul: 0, red: 0 }
    if (o.deger?.kabul) s.kabul++; else s.red++
    sayim.set(t, s)
  }
  const kararlar = new Map(((karar || []) as { tur: string; karar: string }[]).map((k) => [k.tur, (k.karar === 'sessiz' || k.karar === 'goster' ? k.karar : null) as HekimKarari]))
  const profil: OneriProfili = {}
  const turler: OneriProfilOzeti['turler'] = []
  for (const t of ONERI_TURLERI) {
    const s = sayim.get(t) || { tur: t, kabul: 0, red: 0 }
    const k = kararlar.get(t) ?? null
    const d = turDurumu(s, k)
    profil[t] = d
    if (s.kabul + s.red > 0 || k) turler.push({ ...s, durum: d, karar: k })
  }
  return { profil, turler }
}

/** The doctor's own choice for a type: 'sessiz' | 'goster' | null (back to learned). Safety can never be quieted. */
export async function oneriKarariYaz(sb: SupabaseClient, doktorId: string, tur: unknown, karar: unknown): Promise<boolean> {
  if (typeof tur !== 'string' || !(ONERI_TURLERI as string[]).includes(tur)) return false
  if (tur === 'guvenlik' && karar === 'sessiz') return false
  if (karar === null) { const { error } = await sb.from('oneri_profili_kararlari').delete().eq('doctor_id', doktorId).eq('tur', tur); return !error }
  if (karar !== 'sessiz' && karar !== 'goster') return false
  const { error } = await sb.from('oneri_profili_kararlari').upsert({ doctor_id: doktorId, tur, karar, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id,tur' })
  return !error
}
