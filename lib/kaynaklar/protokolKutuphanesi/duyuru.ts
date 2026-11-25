/**
 * TR-PROTOKOL-KUTUPHANESI — "a new edition was published" → ONE Fısıltı per doctor of the affected branş.
 * Announcements exist only after the founder reviewed a flagged change (protokol_surum_duyurulari). A doctor sees each one
 * until they open it in the Kaynak kütüphanesi or press Gizle (protokol_duyuru_gorulen, scoped by doctor_id = the session).
 * Every query here is narrowed to the signed-in doctor; nothing takes a patient id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import type { FisiltiItem } from '@/lib/doktor/fisiltiOrtak'
import type { BransKodu } from './tipler'

/** Announcements older than this are not whispered any more (they stay listed in the library). */
export const DUYURU_PENCERESI_GUN = 90
export const KAYNAK_FISILTI_ONEKI = 'kaynak:'

export type SurumDuyurusu = { id: string; belge_id: string; baslik: string; branslar: string[]; surum: string | null; yil: number | null; url: string | null; yayin_at: string }

/** users.specialty → one of the 40 keys (Özel Branş slug first, then the 30 medical keys). */
export function bransKoduCoz(ham: string | null | undefined): BransKodu | null {
  return klinikSlugCoz(ham) || bransAnahtari(ham)
}

/** Pure: the doctor's unseen announcements of their branş, newest first, as Fısıltı items (no patient). */
export function duyuruFisiltileri(duyurular: SurumDuyurusu[], gorulen: ReadonlySet<string>, brans: BransKodu | null, simdi: Date): FisiltiItem[] {
  if (!brans) return []
  const esik = simdi.getTime() - DUYURU_PENCERESI_GUN * 86400_000
  return duyurular
    .filter((d) => d.branslar.includes(brans) && !gorulen.has(d.id) && new Date(d.yayin_at).getTime() >= esik)
    .sort((a, b) => b.yayin_at.localeCompare(a.yayin_at))
    .map((d) => ({
      id: `${KAYNAK_FISILTI_ONEKI}${d.id}`,
      brans,
      patientId: '',
      ad: 'Kaynak kütüphanesi',
      baslik: d.baslik,
      detay: [[d.surum, d.yil ? String(d.yil) : null].filter(Boolean).join(' · ') || 'Sürüm bilgisi kütüphanede'],
      enErkenTarih: d.yayin_at,
      hedefYol: `/dashboard/doktor/kaynaklar?duyuru=${d.id}`,
      toplamBekleyen: 0,
      kaynak: 'kaynak' as const,
      duyuruId: d.id,
    }))
}

/** Two small reads, both narrowed: announcements of the last DUYURU_PENCERESI_GUN days for the branş; this doctor's seen rows. */
export async function bekleyenDuyuruFisiltileri(sb: SupabaseClient, doktorId: string, brans: BransKodu | null, simdi = new Date()): Promise<FisiltiItem[]> {
  if (!brans) return []
  const esik = new Date(simdi.getTime() - DUYURU_PENCERESI_GUN * 86400_000).toISOString()
  const { data: duyurular, error } = await sb
    .from('protokol_surum_duyurulari')
    .select('id, belge_id, baslik, branslar, surum, yil, url, yayin_at')
    .contains('branslar', [brans])
    .gte('yayin_at', esik)
    .order('yayin_at', { ascending: false })
    .limit(20)
  if (error || !duyurular?.length) return []
  const { data: gorulen } = await sb.from('protokol_duyuru_gorulen').select('duyuru_id').eq('doctor_id', doktorId).in('duyuru_id', duyurular.map((d) => d.id))
  return duyuruFisiltileri(duyurular as SurumDuyurusu[], new Set((gorulen || []).map((g) => String(g.duyuru_id))), brans, simdi)
}

/** Mark one announcement seen for THIS doctor only (the session's id, never one from the request body). */
export async function duyuruGoruldu(sb: SupabaseClient, doktorId: string, duyuruId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(duyuruId)) return false
  const { error } = await sb.from('protokol_duyuru_gorulen').upsert({ doctor_id: doktorId, duyuru_id: duyuruId }, { onConflict: 'doctor_id,duyuru_id', ignoreDuplicates: true })
  return !error
}
