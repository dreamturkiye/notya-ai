/**
 * NOTYA-TAKIP-01 — list open takip cases for a practice or patient.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaAdiCoz, tabloYokMu } from '@/lib/iletisim/sunucu'
import type { TakipIsi, TakipTuru } from './tipler'
import { takipTuruMu } from './tipler'

type Sb = SupabaseClient

type Satir = {
  id: string
  doktor_id: string
  patient_id: string
  tur: string
  durum: string
  vade: string | null
  kosullu: boolean
  kaynak_not_id: string | null
  kaynak_randevu_id: string | null
  kaynak_sevk_id: string | null
  ozet: string | null
  alinti: string | null
  kapandi_at: string | null
  kapandi_neden: string | null
  created_at: string
}

function mapSatir(s: Satir, ad?: string): TakipIsi | null {
  if (!takipTuruMu(s.tur)) return null
  return {
    id: String(s.id),
    doktorId: String(s.doktor_id),
    patientId: String(s.patient_id),
    tur: s.tur,
    durum: s.durum === 'kapandi' ? 'kapandi' : 'acik',
    vade: s.vade ? String(s.vade).slice(0, 10) : null,
    kosullu: !!s.kosullu,
    kaynakNotId: s.kaynak_not_id ? String(s.kaynak_not_id) : null,
    kaynakRandevuId: s.kaynak_randevu_id ? String(s.kaynak_randevu_id) : null,
    kaynakSevkId: s.kaynak_sevk_id ? String(s.kaynak_sevk_id) : null,
    ozet: String(s.ozet || ''),
    alinti: s.alinti ? String(s.alinti) : null,
    kapandiAt: s.kapandi_at ? String(s.kapandi_at) : null,
    kapandiNeden: (s.kapandi_neden as TakipIsi['kapandiNeden']) || null,
    createdAt: String(s.created_at),
    hastaAdi: ad,
  }
}

/** Urgency: overdue first, then soonest vade, then oldest created. */
export function takipSirala(liste: TakipIsi[], bugunIso: string): TakipIsi[] {
  const skor = (t: TakipIsi): [number, string, string] => {
    if (t.tur === 'gelmedi') return [0, '0000-00-00', t.createdAt]
    if (!t.vade) return [2, '9999', t.createdAt]
    if (t.vade < bugunIso) return [0, t.vade, t.createdAt]
    if (t.vade === bugunIso) return [1, t.vade, t.createdAt]
    return [2, t.vade, t.createdAt]
  }
  return [...liste].sort((a, b) => {
    const sa = skor(a)
    const sb = skor(b)
    return sa[0] - sb[0] || sa[1].localeCompare(sb[1]) || sa[2].localeCompare(sb[2])
  })
}

export async function takipAcikListe(
  sb: Sb,
  doktorId: string,
  opts: { patientId?: string; turler?: TakipTuru[]; limit?: number; isimlerle?: boolean } = {},
): Promise<TakipIsi[]> {
  try {
    let q = sb.from('takip_isleri')
      .select('id, doktor_id, patient_id, tur, durum, vade, kosullu, kaynak_not_id, kaynak_randevu_id, kaynak_sevk_id, ozet, alinti, kapandi_at, kapandi_neden, created_at')
      .eq('doktor_id', doktorId)
      .eq('durum', 'acik')
      .order('vade', { ascending: true, nullsFirst: true })
      .limit(opts.limit ?? 100)
    if (opts.patientId) q = q.eq('patient_id', opts.patientId)
    if (opts.turler?.length) q = q.in('tur', opts.turler)
    const { data, error } = await q
    if (error) {
      if (tabloYokMu(error)) return []
      console.error('[takip] liste', error.message)
      return []
    }
    const satirlar = (data || []) as Satir[]
    const adlar = new Map<string, string>()
    if (opts.isimlerle !== false && satirlar.length) {
      const ids = [...new Set(satirlar.map((s) => String(s.patient_id)))]
      const { data: hastalar } = await sb.from('patients')
        .select('id, name_encrypted')
        .eq('doctor_id', doktorId)
        .in('id', ids)
      for (const h of hastalar || []) {
        const ad = hastaAdiCoz(h.name_encrypted)
        if (ad) adlar.set(String(h.id), ad)
      }
    }
    return satirlar
      .map((s) => mapSatir(s, adlar.get(String(s.patient_id)) || 'Hasta'))
      .filter((x): x is TakipIsi => !!x)
  } catch {
    return []
  }
}

export function takipBaslik(t: TakipIsi, bugunIso: string): string {
  if (t.tur === 'gelmedi') return 'gelmedi — aranacak'
  if (t.tur === 'konsultasyon') return 'konsültasyon yanıt bekliyor'
  if (t.kosullu) {
    if (t.vade && t.vade < bugunIso) return 'koşullu kontrol penceresi doldu'
    if (t.vade && t.vade === bugunIso) return 'koşullu kontrol — bugün'
    return 'koşullu kontrol planlandı'
  }
  if (t.vade && t.vade < bugunIso) return 'kontrol penceresi doldu — randevu yok'
  if (t.vade && t.vade === bugunIso) return 'kontrol bugün — randevu yok'
  return 'kontrol planlandı — randevu yok'
}
