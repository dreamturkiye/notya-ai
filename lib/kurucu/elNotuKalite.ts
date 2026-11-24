/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — the founder's El Notu quality dashboard data (GET /api/kurucu/el-notu-kalite).
 * Numbers only: per doctor × week counts aggregated IN SQL (el_notu_kalite_haftalik — no reading text, no patient field
 * leaves the database), the doctor's display name and branş, the regression set's weekly trend and size, the branş
 * lexicon proposals (abbreviation + meaning + how many doctors), and how many doctors consented to the set.
 * Founder / test accounts are not counted (the same rule as the founder console).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { kaliteTablosu, satirTemizle, type KaliteTablosu } from './elNotuKaliteHesap'
import { KAAN_TEST_EPOSTASI, kurucuEpostalari } from './denemeBildirimi'
import { sonHaftalar } from '@/core/elNotu/regresyonSeti'
import { regresyonOzeti, type RegresyonOzeti } from '@/lib/elNotu/regresyon'
import { bransOnerileriListe, type BransOneriSatiri } from '@/lib/elNotu/bransSozluk'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { KLINIK_ETIKET } from '@/lib/specialties/klinikDikey'

export const KALITE_HAFTA = 12

export type ElNotuKaliteVerisi = KaliteTablosu & {
  regresyon: RegresyonOzeti
  oneriler: (BransOneriSatiri & { bransEtiketi: string })[]
  onayliDoktor: number
  haricHesap: number
  uretildi: string
}

export function bransEtiketi(brans: string | null | undefined): string {
  if (!brans || brans === '—') return 'No specialty'
  return SPECIALTIES.find((s) => s.key === brans)?.label || (KLINIK_ETIKET as Record<string, string>)[brans] || brans
}

export async function elNotuKaliteVerisi(sb: SupabaseClient, simdi = new Date()): Promise<ElNotuKaliteVerisi> {
  const haftalar = sonHaftalar(KALITE_HAFTA, simdi)
  const [{ data: ham, error }, regresyon, oneriler, onay] = await Promise.all([
    sb.rpc('el_notu_kalite_haftalik', { p_hafta: KALITE_HAFTA }),
    regresyonOzeti(sb, KALITE_HAFTA),
    bransOnerileriListe(sb),
    sb.from('esnek_muayene_ayarlari').select('doctor_id', { count: 'exact', head: true }).eq('gelistirme_onayi', true),
  ])
  const satirlar = error ? [] : ((ham || []) as Record<string, unknown>[]).map(satirTemizle)
  const ids = [...new Set(satirlar.map((s) => s.doctor_id))]
  const haric = new Set([KAAN_TEST_EPOSTASI, ...kurucuEpostalari()].map((e) => e.toLowerCase()))
  const doktorlar = new Map<string, { ad: string; brans: string | null }>()
  const hekimDk = new Map<string, number | null>()
  let haricHesap = 0
  for (let i = 0; i < ids.length; i += 500) {
    const parca = ids.slice(i, i + 500)
    const [{ data: u }, { data: a }] = await Promise.all([
      sb.from('users').select('id, full_name, specialty, email').in('id', parca),
      sb.from('esnek_muayene_ayarlari').select('doctor_id, taban_dakika_not').in('doctor_id', parca),
    ])
    for (const x of (u || []) as { id: string; full_name: string | null; specialty: string | null; email: string | null }[]) {
      if (x.email && haric.has(String(x.email).toLowerCase())) { haricHesap++; continue }
      doktorlar.set(String(x.id), { ad: String(x.full_name || '').trim() || 'Unnamed doctor', brans: x.specialty ? String(x.specialty) : null })
    }
    for (const x of (a || []) as { doctor_id: string; taban_dakika_not: number | null }[]) hekimDk.set(String(x.doctor_id), x.taban_dakika_not != null ? Number(x.taban_dakika_not) : null)
  }
  // the honest baseline per doctor (shadow measured → shadow declared → his own), as the time meter uses it
  const { tabanYukle } = await import('@/lib/esnek/zaman')
  const tabanlar = new Map<string, number | null>()
  await Promise.all([...doktorlar.keys()].map(async (id) => { const t = await tabanYukle(sb, id, hekimDk.get(id) ?? null).catch(() => null); tabanlar.set(id, t?.dk ?? null) }))
  const tablo = kaliteTablosu({ satirlar, haftalar, doktorlar, tabanlar, bransEtiketi })
  return {
    ...tablo, regresyon, oneriler: oneriler.map((o) => ({ ...o, bransEtiketi: bransEtiketi(o.brans) })),
    onayliDoktor: onay.count || 0, haricHesap, uretildi: simdi.toISOString(),
  }
}
