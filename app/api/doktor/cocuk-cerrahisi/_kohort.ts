/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — kohort verisi + hasta-güvenli hatırlatma.
 */
import type { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import {
  ccKohortSatirlari, ccRecallMesaji, type CcKohortBayrak, type CcKohortGirdi,
} from '@/specialties/cocuk-cerrahisi/engines/kohort'
import { prepostMaddeler } from '@/specialties/cocuk-cerrahisi/engines/prepost'
import { onamMaddeleri } from '@/specialties/cocuk-cerrahisi/engines/onam'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'

export type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

const KAYNAK_TABLOLARI = ['hasta_cocuk_cerrahisi', 'cc_prepost', 'cc_yara_dren', 'cc_onam', 'cc_acil', 'cc_gorevleri'] as const

export async function ccKohortVerisi(sb: Sb, doctorId: string, bugun: string, sadece?: string[]) {
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

  const [pQ, bQ, rQ, gQ, sQ, tQ] = await Promise.all([
    sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).in('id', ids),
    sb.from('hasta_cocuk_cerrahisi').select('patient_id, next_kontrol, prepost, onam').eq('doctor_id', doctorId).in('patient_id', ids),
    sb.from('cc_acil').select('patient_id, bayraklar, hekim_onay, tarih').eq('doctor_id', doctorId).in('patient_id', ids).order('tarih', { ascending: false }).limit(3000),
    sb.from('cc_gorevleri').select('patient_id, kod, due').eq('doctor_id', doctorId).eq('durum', 'acik').in('patient_id', ids).limit(5000),
    arsivsizSeanslar(sb, 'patient_id, created_at').eq('doctor_id', doctorId).in('patient_id', ids).order('created_at', { ascending: false }).limit(5000),
    sb.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doctorId).in('patient_id', ids).gt('expires_at', new Date().toISOString()),
  ])

  const ad = new Map<string, string>()
  for (const p of pQ.data || []) {
    let n = 'Hasta'
    try { const j = JSON.parse(decrypt(String(p.name_encrypted))); n = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* */ }
    ad.set(String(p.id), n)
  }
  const ilk = <T extends { patient_id: unknown }>(rows: T[] | null) => {
    const m = new Map<string, T>()
    for (const r of rows || []) { const k = String(r.patient_id); if (!m.has(k)) m.set(k, r) }
    return m
  }
  const grup = <T extends { patient_id: unknown }>(rows: T[] | null) => {
    const m = new Map<string, T[]>()
    for (const r of rows || []) { const k = String(r.patient_id); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) }
    return m
  }
  const bolum = ilk(bQ.data), sonVizit = ilk(sQ.data)
  const risk = grup(rQ.data), gorev = grup(gQ.data)
  const portal = new Set((tQ.data || []).map((r) => String(r.patient_id)))

  const girdi: CcKohortGirdi[] = ids.filter((id) => ad.has(id)).map((id) => {
    const b = bolum.get(id)
    const prepost = (b?.prepost && typeof b.prepost === 'object' ? b.prepost : null) as { tip?: string; tamamlanan?: string[]; ameliyatTarihi?: string } | null
    const onam = (b?.onam && typeof b.onam === 'object' ? b.onam : null) as { secilen?: string[]; yasYil?: number | null } | null
    const tip = prepost?.tip === 'postop' ? 'postop' as const : 'preop' as const
    const tamam = Array.isArray(prepost?.tamamlanan) ? prepost!.tamamlanan!.length : 0
    const onamTamam = Array.isArray(onam?.secilen) ? onam!.secilen!.length : 0
    const onamToplam = onamMaddeleri(onam?.yasYil ?? null).length
    return {
      patientId: id,
      ad: ad.get(id)!,
      acikRiskBayraklari: (risk.get(id) || []).filter((r) => !r.hekim_onay).flatMap((r) => ((r.bayraklar as string[] | null) || []).map(String)),
      sonrakiKontrol: b?.next_kontrol ? String(b.next_kontrol) : null,
      ameliyatTarihi: prepost?.ameliyatTarihi || null,
      preopEksik: !!prepost && tamam < prepostMaddeler(tip).length,
      onamEksik: !!onam && onamTamam < onamToplam,
      gorevler: (gorev.get(id) || []).map((g) => ({ kod: String(g.kod), due: g.due ? String(g.due) : null })),
      sonVizit: sonVizit.get(id)?.created_at ? String(sonVizit.get(id)!.created_at).slice(0, 10) : null,
      portalVar: portal.has(id),
    }
  })
  return { satirlar: ccKohortSatirlari(girdi, bugun), toplamHasta: girdi.length }
}

export async function ccHatirlatmaGonder(
  sb: Sb, doctorId: string, patientId: string, bayraklar: CcKohortBayrak[], bugun: string,
): Promise<'gonderildi' | 'yakin' | 'hata'> {
  const m = ccRecallMesaji(bayraklar)
  const { data: yakin } = await sb.from('hasta_mesaj_konulari').select('id')
    .eq('doctor_id', doctorId).eq('patient_id', patientId).eq('konu', m.konu)
    .gte('son_mesaj_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(1)
  if (yakin?.length) return 'yakin'
  const simdi = new Date().toISOString()
  const { data: konu, error } = await sb.from('hasta_mesaj_konulari')
    .insert({ doctor_id: doctorId, patient_id: patientId, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: simdi, okundu_hasta: false, okundu_pratik: true })
    .select('id').single()
  if (error || !konu) return 'hata'
  await sb.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: doctorId, metin: m.metin })
  try { await notifyPatientNewPracticeMessage(sb, { doctorId, patientId }) } catch { /* */ }
  const due = new Date(Date.parse(`${bugun}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10)
  const { data: acik } = await sb.from('cc_gorevleri').select('id')
    .eq('doctor_id', doctorId).eq('patient_id', patientId).eq('kod', 'hatirlatma_takip').eq('durum', 'acik').maybeSingle()
  if (!acik) await sb.from('cc_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: 'hatirlatma_takip', ad: 'Hatırlatma gönderildi — randevu dönüşünü takip edin', due, kaynak: 'hatirlatma' })
  return 'gonderildi'
}
