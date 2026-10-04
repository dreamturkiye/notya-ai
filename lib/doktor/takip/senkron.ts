/**
 * NOTYA-TAKIP-01 — keep takip_isleri aligned with live sources without a heavy backfill.
 *
 * On each desk/doctor read we:
 *   1. Materialize open sevkler / recent gelmedi that have no open case yet
 *   2. Auto-close kontrol/gelmedi when the patient already has a future appointment
 *   3. Auto-close konsultasyon when the sevk is answered / closed
 *
 * Soft-fails before migration 121. Bounded (limits) so a busy practice stays fast.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { takipAc, takipKapatHasta, takipKapatSevk } from './yaz'

type Sb = SupabaseClient

const GELMEDI_GERI_GUN = 14

export async function takipSenkronize(sb: Sb, doktorId: string): Promise<{ acilan: number; kapanan: number }> {
  let acilan = 0
  let kapanan = 0
  try {
    // ── Close: patients with a future active appointment clear kontrol + gelmedi ──
    const { data: gelecek, error: ge } = await sb.from('randevular')
      .select('patient_id')
      .eq('doktor_id', doktorId)
      .not('patient_id', 'is', null)
      .not('durum', 'in', '("iptal","gelmedi","tamamlandi","talep")')
      .gt('baslangic', new Date().toISOString())
      .limit(500)
    if (ge && tabloYokMu(ge)) return { acilan: 0, kapanan: 0 }
    const gelecekHastalar = [...new Set((gelecek || []).map((r) => String(r.patient_id)).filter(Boolean))]
    for (const pid of gelecekHastalar.slice(0, 80)) {
      kapanan += await takipKapatHasta(sb, doktorId, pid, ['kontrol', 'gelmedi'], 'randevu')
    }

    // ── Open: recent gelmedi without an open case ──
    const geri = new Date(Date.now() - GELMEDI_GERI_GUN * 86400e3).toISOString()
    const { data: gelmediler } = await sb.from('randevular')
      .select('id, patient_id, baslangic')
      .eq('doktor_id', doktorId)
      .eq('durum', 'gelmedi')
      .not('patient_id', 'is', null)
      .gte('baslangic', geri)
      .order('baslangic', { ascending: false })
      .limit(40)
    for (const r of gelmediler || []) {
      const id = await takipAc(sb, {
        doktorId,
        patientId: String(r.patient_id),
        tur: 'gelmedi',
        vade: bugunTrIso(),
        kaynakRandevuId: String(r.id),
        ozet: 'Randevuya gelmedi — aranıp yeni saat önerilecek.',
      })
      if (id) acilan++
    }

    // ── Open: waiting konsültasyonlar ──
    const { data: sevkler, error: se } = await sb.from('sevkler')
      .select('id, patient_id, hedef, hedef_brans, istem_tarihi, durum')
      .eq('doctor_id', doktorId)
      .in('durum', ['acik', 'yanit_bekleniyor'])
      .order('istem_tarihi', { ascending: true })
      .limit(40)
    if (!se && sevkler) {
      for (const s of sevkler) {
        const hedef = String(s.hedef_brans || s.hedef || 'konsültasyon')
        const id = await takipAc(sb, {
          doktorId,
          patientId: String(s.patient_id),
          tur: 'konsultasyon',
          vade: s.istem_tarihi ? String(s.istem_tarihi).slice(0, 10) : bugunTrIso(),
          kaynakSevkId: String(s.id),
          ozet: `Konsültasyon yanıt bekliyor (${hedef}).`,
        })
        if (id) acilan++
      }
    }

    // ── Close: answered / closed sevkler still open in takip ──
    const { data: acikKonsult } = await sb.from('takip_isleri')
      .select('id, kaynak_sevk_id')
      .eq('doktor_id', doktorId)
      .eq('tur', 'konsultasyon')
      .eq('durum', 'acik')
      .not('kaynak_sevk_id', 'is', null)
      .limit(80)
    if (acikKonsult?.length) {
      const sevkIds = acikKonsult.map((t) => String(t.kaynak_sevk_id))
      const { data: durumlar } = await sb.from('sevkler')
        .select('id, durum')
        .eq('doctor_id', doktorId)
        .in('id', sevkIds)
      for (const s of durumlar || []) {
        const d = String(s.durum || '')
        if (d === 'yanitlandi' || d.startsWith('kapandi')) {
          if (await takipKapatSevk(sb, doktorId, String(s.id), d === 'yanitlandi' ? 'yanit' : 'iptal')) kapanan++
        }
      }
    }
  } catch (e) {
    console.error('[takip] senkron', e)
  }
  return { acilan, kapanan }
}
