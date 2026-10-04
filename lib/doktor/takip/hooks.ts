/**
 * NOTYA-TAKIP-01 — write-side hooks called from note approve / randevu / konsültasyon routes.
 * Never throws into the caller — follow-up must not break clinical save paths.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { kontrolVadesiBul } from './vade'
import { takipAc, takipKapatHasta, takipKapatSevk } from './yaz'

type Sb = SupabaseClient

/** After note approval: open a kontrol case when the plan names a follow-up window. */
export async function takipNotOnayinda(
  sb: Sb,
  g: { doktorId: string; patientId: string; notId: string; plan: string | null | undefined; notTarihi?: string | null },
): Promise<string | null> {
  try {
    const bugun = g.notTarihi?.slice(0, 10) || bugunTrIso()
    const k = kontrolVadesiBul(g.plan, bugun)
    if (!k) return null

    // If they already have a future appointment, nothing to track.
    const { data: gelecek } = await sb.from('randevular').select('id')
      .eq('doktor_id', g.doktorId).eq('patient_id', g.patientId)
      .not('durum', 'in', '("iptal","gelmedi","tamamlandi","talep")')
      .gt('baslangic', new Date().toISOString()).limit(1)
    if (gelecek?.length) return null

    const ozet = k.kosullu
      ? `Koşullu kontrol ${k.vade} — "${k.cumle.slice(0, 120)}"`
      : `Kontrol ${k.vade} — "${k.cumle.slice(0, 120)}"`

    return await takipAc(sb, {
      doktorId: g.doktorId,
      patientId: g.patientId,
      tur: 'kontrol',
      vade: k.vade,
      kosullu: k.kosullu,
      kaynakNotId: g.notId,
      ozet,
      alinti: k.cumle,
    })
  } catch (e) {
    console.error('[takip] notOnay', e)
    return null
  }
}

/** When an appointment becomes gelmedi — open a multi-day callback case. */
export async function takipGelmedi(
  sb: Sb,
  g: { doktorId: string; patientId: string | null | undefined; randevuId: string },
): Promise<string | null> {
  try {
    if (!g.patientId) return null
    return await takipAc(sb, {
      doktorId: g.doktorId,
      patientId: g.patientId,
      tur: 'gelmedi',
      vade: bugunTrIso(),
      kaynakRandevuId: g.randevuId,
      ozet: 'Randevuya gelmedi — aranıp yeni saat önerilecek.',
    })
  } catch (e) {
    console.error('[takip] gelmedi', e)
    return null
  }
}

/** New / reactivated future appointment clears open kontrol + gelmedi for that patient. */
export async function takipRandevuAcildi(
  sb: Sb,
  g: { doktorId: string; patientId: string | null | undefined },
): Promise<number> {
  try {
    if (!g.patientId) return 0
    return await takipKapatHasta(sb, g.doktorId, g.patientId, ['kontrol', 'gelmedi'], 'randevu')
  } catch {
    return 0
  }
}

/** New konsültasyon / sevk → open case. Vade = hekimin yazdığı beklenen gün (yoksa istem günü). */
export async function takipKonsultasyonAcildi(
  sb: Sb,
  g: {
    doktorId: string
    patientId: string
    sevkId: string
    hedef?: string | null
    istemTarihi?: string | null
    beklenenGun?: string | null
  },
): Promise<string | null> {
  try {
    const hedef = String(g.hedef || 'konsültasyon')
    const vade = (g.beklenenGun || g.istemTarihi || bugunTrIso()).slice(0, 10)
    return await takipAc(sb, {
      doktorId: g.doktorId,
      patientId: g.patientId,
      tur: 'konsultasyon',
      vade,
      kaynakSevkId: g.sevkId,
      ozet: `Konsültasyon yanıt bekliyor (${hedef}).`,
    })
  } catch (e) {
    console.error('[takip] konsultAc', e)
    return null
  }
}

/** Answered / closed konsültasyon → close case. */
export async function takipKonsultasyonKapandi(
  sb: Sb,
  g: { doktorId: string; sevkId: string; neden?: 'yanit' | 'iptal' },
): Promise<boolean> {
  try {
    return await takipKapatSevk(sb, g.doktorId, g.sevkId, g.neden || 'yanit')
  } catch {
    return false
  }
}
