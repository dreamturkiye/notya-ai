/**
 * GOGUS-EXCEPTIONAL-01 — Göğüs kohort verisi + hasta-güvenli hatırlatma.
 */
import type { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import {
  gogusKohortSatirlari,
  gogusRecallMesaji,
  type GogusKohortBayrak,
  type GogusKohortGirdi,
} from '@/specialties/gogus-hastaliklari/engines/kohort'

export type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

const KAYNAK_TABLOLARI = ['hasta_gogus', 'gogus_skor', 'gogus_risk', 'gogus_gorevleri'] as const

export async function gogusKohortVerisi(sb: Sb, doctorId: string, bugun: string, sadece?: string[]) {
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

  const [pQ, bQ, rQ, gQ, seansQ, tQ] = await Promise.all([
    sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).in('id', ids),
    sb.from('hasta_gogus').select('patient_id, next_kontrol, notes').eq('doctor_id', doctorId).in('patient_id', ids),
    sb.from('gogus_risk').select('patient_id, bayraklar, hekim_onay, tarih').eq('doctor_id', doctorId).in('patient_id', ids).order('tarih', { ascending: false }).limit(3000),
    sb.from('gogus_gorevleri').select('patient_id, kod, due').eq('doctor_id', doctorId).eq('durum', 'acik').in('patient_id', ids).limit(5000),
    sb.from('sessions').select('patient_id, created_at').eq('doctor_id', doctorId).in('patient_id', ids).order('created_at', { ascending: false }).limit(5000),
    sb.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doctorId).in('patient_id', ids).gt('expires_at', new Date().toISOString()),
  ])

  const ad = new Map<string, string>()
  for (const p of pQ.data || []) {
    let n = 'Hasta'
    try { const j = JSON.parse(decrypt(String(p.name_encrypted))); n = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ }
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
  const bolum = ilk(bQ.data), sonVizit = ilk(seansQ.data)
  const risk = grup(rQ.data), gorev = grup(gQ.data)
  const portal = new Set((tQ.data || []).map((r) => String(r.patient_id)))

  const girdi: GogusKohortGirdi[] = ids.filter((id) => ad.has(id)).map((id) => {
    const notes = (bolum.get(id) as { notes?: { sonSpiro?: string } | null } | undefined)?.notes
    return {
      patientId: id,
      ad: ad.get(id)!,
      sonSpiroTarihi: notes?.sonSpiro || null,
      acikRiskBayraklari: (risk.get(id) || []).filter((r) => !r.hekim_onay).flatMap((r) => ((r.bayraklar as string[] | null) || []).map(String)),
      sonrakiKontrol: bolum.get(id)?.next_kontrol ? String(bolum.get(id)!.next_kontrol) : null,
      gorevler: (gorev.get(id) || []).map((g) => ({ kod: String(g.kod), due: g.due ? String(g.due) : null })),
      sonVizit: sonVizit.get(id)?.created_at ? String(sonVizit.get(id)!.created_at).slice(0, 10) : null,
      portalVar: portal.has(id),
    }
  })
  return { satirlar: gogusKohortSatirlari(girdi, bugun), toplamHasta: girdi.length }
}

export async function gogusHatirlatmaGonder(
  sb: Sb,
  doctorId: string,
  patientId: string,
  bayraklar: GogusKohortBayrak[],
  bugun: string,
): Promise<'gonderildi' | 'yakin' | 'hata'> {
  const m = gogusRecallMesaji(bayraklar)
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
  try { await notifyPatientNewPracticeMessage(sb, { doctorId, patientId }) } catch { /* e-posta hatası gönderimi bozmaz */ }
  const due = new Date(Date.parse(`${bugun}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10)
  const { data: acik } = await sb.from('gogus_gorevleri').select('id')
    .eq('doctor_id', doctorId).eq('patient_id', patientId).eq('kod', 'hatirlatma_takip').eq('durum', 'acik').maybeSingle()
  if (!acik) await sb.from('gogus_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: 'hatirlatma_takip', ad: 'Hatırlatma gönderildi — randevu dönüşünü takip edin', due, kaynak: 'hatirlatma' })
  return 'gonderildi'
}
