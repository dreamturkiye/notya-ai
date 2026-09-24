/**
 * GOZ-EXCEPTIONAL-01 — göz kohort verisi + hasta-güvenli hatırlatma gönderimi (route.ts yalnız handler export edebilir).
 * Hasta kimlikleri yalnız doctor_id = hekim olan goz_* satırlarından türetilir; ad yalnız kimliği doğrulanmış hekime şifre çözülerek döner.
 * Hatırlatma: mevcut Sağlığım mesaj kanalı (hasta_mesaj_konulari) + e-posta bildirimi (gövdesiz) + göz görevi (dönüş takibi).
 */
import type { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { gozKohortSatirlari, type GozKohortGirdi } from '@/specialties/goz-hastaliklari/engines/kohort'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'

export type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

const KAYNAK_TABLOLARI = ['goz_muayeneler', 'goz_glokom', 'goz_dr', 'goz_enjeksiyonlar', 'goz_kontroller', 'goz_gorevler'] as const

export async function gozKohortVerisi(sb: Sb, doctorId: string, bugun: string, sadece?: string[]) {
  // `sadece` verildiyse kaynak sorguları o kimliklerle daraltılır (tek hasta: hasta dosyası GET / hatırlatma) — yine doctor_id kapsamlı.
  const kumeler = await Promise.all(KAYNAK_TABLOLARI.map(async (t) => {
    let q = sb.from(t).select('patient_id').eq('doctor_id', doctorId)
    if (sadece) q = q.in('patient_id', sadece)
    const { data } = await q.limit(3000)
    return (data || []).map((r) => String(r.patient_id))
  }))
  let ids = Array.from(new Set(kumeler.flat()))
  if (sadece) ids = ids.filter((x) => sadece.includes(x))
  ids = ids.slice(0, 500)
  if (!ids.length) return { satirlar: [], toplamHasta: 0 }
  const [pQ, gQ, eQ, dQ, kQ, sQ, tQ] = await Promise.all([
    sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).in('id', ids),
    sb.from('goz_gorevler').select('patient_id, kod, due').eq('doctor_id', doctorId).eq('durum', 'acik').in('patient_id', ids).limit(5000),
    sb.from('goz_enjeksiyonlar').select('patient_id, tarih, goz').eq('doctor_id', doctorId).eq('durum', 'planli').in('patient_id', ids).limit(5000),
    sb.from('goz_dr').select('patient_id, sonraki_kontrol').eq('doctor_id', doctorId).in('patient_id', ids),
    sb.from('goz_kontroller').select('patient_id, tarih, neden').eq('doctor_id', doctorId).eq('durum', 'planli').in('patient_id', ids).limit(5000),
    arsivsizSeanslar(sb, 'patient_id, created_at').eq('doctor_id', doctorId).in('patient_id', ids).order('created_at', { ascending: false }).limit(5000),
    sb.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doctorId).in('patient_id', ids).gt('expires_at', new Date().toISOString()),
  ])
  const ad = new Map<string, string>()
  for (const p of pQ.data || []) { let n = 'Hasta'; try { const j = JSON.parse(decrypt(String(p.name_encrypted))); n = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ } ad.set(String(p.id), n) }
  const grup = <T extends { patient_id: unknown }>(rows: T[] | null) => { const m = new Map<string, T[]>(); for (const r of rows || []) { const k = String(r.patient_id); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) } return m }
  const gor = grup(gQ.data), enj = grup(eQ.data), dr = grup(dQ.data), kon = grup(kQ.data)
  const sonVizit = new Map<string, string>()
  for (const s of sQ.data || []) if (!sonVizit.has(String(s.patient_id))) sonVizit.set(String(s.patient_id), String(s.created_at).slice(0, 10))
  const portal = new Set((tQ.data || []).map((r) => String(r.patient_id)))
  const girdi: GozKohortGirdi[] = ids.filter((id) => ad.has(id)).map((id) => ({
    patientId: id, ad: ad.get(id)!,
    gorevler: (gor.get(id) || []).map((g) => ({ kod: String(g.kod), due: g.due ? String(g.due) : null })),
    planliIvt: (enj.get(id) || []).map((e) => ({ tarih: String(e.tarih), goz: e.goz === 'sol' ? 'sol' as const : 'sag' as const })),
    drSonrakiKontrol: dr.get(id)?.[0]?.sonraki_kontrol ? String(dr.get(id)![0].sonraki_kontrol) : null,
    planliKontroller: (kon.get(id) || []).map((k) => ({ tarih: String(k.tarih), neden: String(k.neden || 'Göz kontrolü') })),
    sonVizit: sonVizit.get(id) || null,
    portalVar: portal.has(id),
  }))
  return { satirlar: gozKohortSatirlari(girdi, bugun), toplamHasta: girdi.length }
}
