/** ESNEK-MUAYENE-A — the Türkiye build's wiring for the shared El Notu components (fetch with the doctor's token, routes, words). */
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { EL_NOTU_TR } from '@/core/elNotu/metinTr'
import { muayeneFormuYolu } from '@/lib/doktor/muayeneFormuYolu'
import type { Getirici } from './ElNotuYakala'

export const TR_API = '/api/doktor/el-notu'
export const trGetir: Getirici = (url, init) => doktorFetch(url, init || {})
export const TR_METIN = EL_NOTU_TR
export const trNotFormu = muayeneFormuYolu
/** The roster (names only; the clinical search is not used here). Filtering by name happens on the device. */
export const trHastaUcu = () => '/api/doktor/hastalar'
export function trHastaCevir(j: unknown): { id: string; ad: string }[] {
  const liste = (j as { patients?: unknown[] })?.patients || (Array.isArray(j) ? j : [])
  return (liste as Record<string, unknown>[]).map((h) => ({ id: String(h.id), ad: String(h.ad || h.name || h.ad_soyad || '') })).filter((h) => h.id && h.ad)
}
export async function trBugununRandevulari(): Promise<{ patientId: string; hastaAdi: string; baslangic: string }[]> {
  const bas = new Date(); bas.setHours(0, 0, 0, 0)
  const bit = new Date(bas.getTime() + 86400000)
  const r = await doktorFetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(bas.toISOString())}&bitis=${encodeURIComponent(bit.toISOString())}`, {})
  if (!r.ok) return []
  const j = await r.json()
  const liste = (j?.randevular || j?.data || []) as { patientId?: string; hastaAdi?: string; baslangic?: string; durum?: string }[]
  return liste.filter((x) => x.patientId && x.durum !== 'iptal').map((x) => ({ patientId: String(x.patientId), hastaAdi: String(x.hastaAdi || ''), baslangic: String(x.baslangic || '') }))
}
