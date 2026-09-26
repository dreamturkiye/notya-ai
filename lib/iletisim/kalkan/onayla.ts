/**
 * NOTYA-KALKAN-01 — Fısıltı Onayla / Düzelt.
 * Onayla'dan önce hasta_ilaclar değişmez. İlaç seçilemiyorsa 409, kart durur.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { hastaAdiCoz } from '@/lib/iletisim/sunucu'
import { taslakSatiri, type KalkanEylem, type KalkanKapsam } from './niyet'

type Sb = SupabaseClient

export type KalkanSonuc = { durum: 'onaylandi' | 'duzeltildi' | 'yok' | 'belirsiz' }

function kapsamMi(v: unknown): v is KalkanKapsam {
  return v === 'bu_gece' || v === 'kalan_kur'
}

async function taslakOku(sb: Sb, doktorId: string, taslakId: string) {
  const { data, error } = await sb.from('wa_taslak').select('id, doctor_id, patient_id, ilac_id, eylem, kapsam, emin, metin, durum, zaman').eq('id', taslakId).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data || data.durum !== 'bekliyor') return null
  return data
}

async function ilacOku(sb: Sb, doktorId: string, patientId: string, ilacId: string) {
  const { data } = await sb.from('hasta_ilaclar').select('id, ilac_adi, aktif, notlar').eq('id', ilacId).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  return data
}

export async function kalkanOnayla(sb: Sb, g: { doktorId: string; taslakId: string; kapsam?: unknown; ilacId?: unknown }): Promise<KalkanSonuc> {
  const t = await taslakOku(sb, g.doktorId, g.taslakId)
  if (!t) return { durum: 'yok' }
  const eylem = String(t.eylem) as KalkanEylem
  const kapsam = kapsamMi(g.kapsam) ? g.kapsam : (kapsamMi(t.kapsam) ? t.kapsam : null)
  const ilacId = String(g.ilacId || t.ilac_id || '')
  const ilacEylemi = eylem === 'ilac_durdur' || eylem === 'son_doz'
  if (ilacEylemi && (!ilacId || (eylem === 'ilac_durdur' && !kapsam))) return { durum: 'belirsiz' }

  if (ilacEylemi) {
    const ilac = await ilacOku(sb, g.doktorId, String(t.patient_id), ilacId)
    if (!ilac) return { durum: 'belirsiz' }
    if (eylem === 'ilac_durdur') {
      const not = `WhatsApp taslağında sonlandırıldı (${kapsam === 'bu_gece' ? 'bu gece' : 'kalan kür'}). ${String(t.metin || '').split('\n')[2] || ''}`.trim()
      const { error } = await sb.from('hasta_ilaclar').update({ aktif: false, bitis_tarihi: bugunTrIso(), notlar: not }).eq('id', ilacId).eq('doctor_id', g.doktorId).eq('patient_id', t.patient_id)
      if (error) throw error
    } else {
      const not = `Son doz: yarın sabah. ${String(ilac.notlar || '')}`.trim()
      const { error } = await sb.from('hasta_ilaclar').update({ notlar: not }).eq('id', ilacId).eq('doctor_id', g.doktorId).eq('patient_id', t.patient_id)
      if (error) throw error
    }
    await sb.from('audit_logs').insert({ user_id: g.doktorId, action: 'update', resource_type: 'hasta_ilaclar', resource_id: ilacId, new_values: { kalkan: eylem, kapsam, taslak_id: t.id, patient_id: t.patient_id } })
    try {
      const { paketKalkanIsle } = await import('@/lib/seansPaketi/doldur')
      const paketEylem = eylem === 'ilac_durdur' ? 'durdur' as const : 'son_doz' as const
      await paketKalkanIsle(sb, { doktorId: g.doktorId, patientId: String(t.patient_id), taslakDurum: 'onaylandi', taslakId: String(t.id), ilacAd: String(ilac.ilac_adi || ''), eylem: paketEylem })
    } catch (e) { console.error('[seans-paketi] kalkan', e) }
  } else {
    await sb.from('audit_logs').insert({ user_id: g.doktorId, action: 'update', resource_type: 'wa_taslak', resource_id: t.id, new_values: { kalkan: eylem, patient_id: t.patient_id } })
  }

  const { error: kapat } = await sb.from('wa_taslak').update({ durum: 'onaylandi', kapsam, ilac_id: ilacId || t.ilac_id, emin: true }).eq('id', t.id).eq('doctor_id', g.doktorId)
  if (kapat) throw kapat
  return { durum: 'onaylandi' }
}

export async function kalkanDuzelt(sb: Sb, g: { doktorId: string; taslakId: string; kapsam?: unknown; ilacId?: unknown }): Promise<KalkanSonuc> {
  const t = await taslakOku(sb, g.doktorId, g.taslakId)
  if (!t) return { durum: 'yok' }
  const eylem = String(t.eylem) as KalkanEylem
  const kapsam = kapsamMi(g.kapsam) ? g.kapsam : (kapsamMi(t.kapsam) ? t.kapsam : null)
  let ilacId = String(t.ilac_id || '')
  let ilacAd: string | null = null
  if (g.ilacId) {
    const ilac = await ilacOku(sb, g.doktorId, String(t.patient_id), String(g.ilacId))
    if (!ilac) return { durum: 'belirsiz' }
    ilacId = String(ilac.id)
    ilacAd = String(ilac.ilac_adi || '')
  } else if (ilacId) {
    const ilac = await ilacOku(sb, g.doktorId, String(t.patient_id), ilacId)
    ilacAd = ilac ? String(ilac.ilac_adi || '') : null
  }
  const { data: hasta } = await sb.from('patients').select('name_encrypted').eq('id', t.patient_id).eq('doctor_id', g.doktorId).maybeSingle()
  const ad = hastaAdiCoz(hasta?.name_encrypted) || String(t.metin || '').split('\n')[0] || 'Hasta'
  const emin = eylem === 'ilac_durdur' ? Boolean(ilacId && kapsam) : eylem === 'son_doz' ? Boolean(ilacId) : true
  const metin = taslakSatiri({ hastaAd: ad, ilacAd, eylem, kapsam, zamanIso: String(t.zaman) })
  const { error } = await sb.from('wa_taslak').update({ kapsam, ilac_id: ilacId || null, emin, metin }).eq('id', t.id).eq('doctor_id', g.doktorId).eq('patient_id', t.patient_id)
  if (error) throw error
  return { durum: 'duzeltildi' }
}
