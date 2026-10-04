/**
 * NOTYA-TAKIP-01 — open / close takip cases. Soft-fails before migration 121.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import type { TakipAcGirdi, TakipKapanis, TakipTuru } from './tipler'

type Sb = SupabaseClient

function satir(g: TakipAcGirdi) {
  return {
    doktor_id: g.doktorId,
    patient_id: g.patientId,
    tur: g.tur,
    durum: 'acik',
    vade: g.vade || null,
    kosullu: !!g.kosullu,
    kaynak_not_id: g.kaynakNotId || null,
    kaynak_randevu_id: g.kaynakRandevuId || null,
    kaynak_sevk_id: g.kaynakSevkId || null,
    ozet: String(g.ozet || '').slice(0, 500),
    alinti: g.alinti ? String(g.alinti).slice(0, 500) : null,
    updated_at: new Date().toISOString(),
  }
}

/** Open a case. Returns id, or null if table missing / duplicate open / error. */
export async function takipAc(sb: Sb, g: TakipAcGirdi): Promise<string | null> {
  try {
    if (!g.doktorId || !g.patientId || !g.tur) return null
    const { data, error } = await sb.from('takip_isleri').insert(satir(g)).select('id').maybeSingle()
    if (error) {
      if (tabloYokMu(error)) return null
      // unique open case — already tracked
      if (String(error.code) === '23505') return null
      console.error('[takip] aç', error.message)
      return null
    }
    return data?.id ? String(data.id) : null
  } catch (e) {
    console.error('[takip] aç', e)
    return null
  }
}

/** Close one case by id (scoped by doktor). */
export async function takipKapatId(
  sb: Sb,
  doktorId: string,
  id: string,
  neden: TakipKapanis,
): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    const { error, count } = await sb.from('takip_isleri')
      .update({ durum: 'kapandi', kapandi_at: now, kapandi_neden: neden, updated_at: now }, { count: 'exact' })
      .eq('id', id)
      .eq('doktor_id', doktorId)
      .eq('durum', 'acik')
    if (error) {
      if (tabloYokMu(error)) return false
      console.error('[takip] kapat', error.message)
      return false
    }
    return (count || 0) > 0
  } catch {
    return false
  }
}

/** Close all open cases of given tür(s) for a patient (e.g. new future appointment clears kontrol+gelmedi). */
export async function takipKapatHasta(
  sb: Sb,
  doktorId: string,
  patientId: string,
  turler: TakipTuru[],
  neden: TakipKapanis,
): Promise<number> {
  try {
    if (!turler.length) return 0
    const now = new Date().toISOString()
    const { error, count } = await sb.from('takip_isleri')
      .update({ durum: 'kapandi', kapandi_at: now, kapandi_neden: neden, updated_at: now }, { count: 'exact' })
      .eq('doktor_id', doktorId)
      .eq('patient_id', patientId)
      .eq('durum', 'acik')
      .in('tur', turler)
    if (error) {
      if (tabloYokMu(error)) return 0
      console.error('[takip] kapatHasta', error.message)
      return 0
    }
    return count || 0
  } catch {
    return 0
  }
}

/** Close open konsültasyon case for a sevk id. */
export async function takipKapatSevk(
  sb: Sb,
  doktorId: string,
  sevkId: string,
  neden: TakipKapanis = 'yanit',
): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    const { error, count } = await sb.from('takip_isleri')
      .update({ durum: 'kapandi', kapandi_at: now, kapandi_neden: neden, updated_at: now }, { count: 'exact' })
      .eq('doktor_id', doktorId)
      .eq('kaynak_sevk_id', sevkId)
      .eq('tur', 'konsultasyon')
      .eq('durum', 'acik')
    if (error) {
      if (tabloYokMu(error)) return false
      return false
    }
    return (count || 0) > 0
  } catch {
    return false
  }
}
