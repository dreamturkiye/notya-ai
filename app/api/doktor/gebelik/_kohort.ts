/**
 * Araçlar › KD kohort paneli — veri + hasta-güvenli hatırlatma (route.ts yalnız handler export edebilir).
 * Hasta kimlikleri YALNIZ doctor_id = hekim olan gebelikler / kadin_sagligi satırlarından türetilir; her ikincil sorgu
 * (patients, izlem, genetik, lohusa, seans, portal) yine doctor_id ile kapsanır. Ad ve doğum tarihi yalnız kimliği
 * doğrulanmış hekime şifre çözülerek döner (hasta-izolasyon).
 * Hatırlatma: mevcut Sağlığım mesaj kanalı (hasta_mesaj_konulari) + e-posta bildirimi (gövdesiz); 7 gün içinde tekrar yok.
 */
import type { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { doneWindowIdsFromClinic } from '@/specialties/kadin-dogum/engines/clinic-fit'
import { addDays } from '@/specialties/kadin-dogum/engines/dates'
import { kdKohortSatirlari, kdHatirlatmaMesaji, KD_HATIRLATMA_KONU, LOHUSA_GORUNUR_GUN, type KdKohortBayrak, type KdKohortGirdi } from '@/specialties/kadin-dogum/engines/kd-kohort'

export type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

type GebelikSatiri = {
  id: string; patient_id: string; sat: string | null; tdt: string | null; durum: string | null; rh_negatif: boolean | null
  dogum_tarihi: string | null; kan_grubu: string | null; lab_panel: unknown; destek_asi: unknown; anti_d_uygulamalari: unknown; created_at: string | null
}

const gun = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)

export async function kdKohortVerisi(sb: Sb, doctorId: string, bugun: string, sadece?: string[]) {
  let gQ = sb.from('gebelikler').select('id, patient_id, sat, tdt, durum, rh_negatif, dogum_tarihi, kan_grubu, lab_panel, destek_asi, anti_d_uygulamalari, created_at').eq('doctor_id', doctorId)
  let kQ = sb.from('kadin_sagligi').select('patient_id, son_serviks_tarama').eq('doctor_id', doctorId)
  if (sadece) { gQ = gQ.in('patient_id', sadece); kQ = kQ.in('patient_id', sadece) }
  const [{ data: gebHam }, { data: ksHam }] = await Promise.all([gQ.limit(3000), kQ.limit(3000)])
  const lohusaEsik = addDays(bugun, -LOHUSA_GORUNUR_GUN)
  // Hasta başına güncel bölüm: aktif gebelik önce, yoksa son 90 günde doğum yapmış gebelik.
  const gebelik = new Map<string, GebelikSatiri>()
  for (const g of ((gebHam || []) as GebelikSatiri[]).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))) {
    const pid = String(g.patient_id)
    const aktif = aktifGebelikDurumu(g.durum)
    const lohusa = !aktif && !!gun(g.dogum_tarihi) && gun(g.dogum_tarihi)! >= lohusaEsik
    if (!aktif && !lohusa) continue
    const var_ = gebelik.get(pid)
    if (!var_ || (aktif && !aktifGebelikDurumu(var_.durum))) gebelik.set(pid, g)
  }
  const serviks = new Map<string, string | null>()
  for (const k of ksHam || []) serviks.set(String(k.patient_id), gun(k.son_serviks_tarama))
  let ids = Array.from(new Set([...gebelik.keys(), ...serviks.keys()]))
  if (sadece) ids = ids.filter((x) => sadece.includes(x))
  ids = ids.slice(0, 500)
  if (!ids.length) return { satirlar: [], toplamHasta: 0 }
  const gebIds = ids.map((id) => gebelik.get(id)?.id).filter((x): x is string => !!x)
  const bos = { data: [] as Record<string, unknown>[] }
  const [pQ, izQ, genQ, lohQ, sQ, tQ] = await Promise.all([
    sb.from('patients').select('id, name_encrypted, dob_encrypted').eq('doctor_id', doctorId).in('id', ids),
    gebIds.length ? sb.from('gebelik_izlemleri').select('gebelik_id, hafta, usg, ogtt, gbs_kultur').eq('doctor_id', doctorId).in('gebelik_id', gebIds).limit(10000) : bos,
    gebIds.length ? sb.from('genetik_taramalar').select('gebelik_id, tur').eq('doctor_id', doctorId).in('gebelik_id', gebIds).limit(5000) : bos,
    gebIds.length ? sb.from('lohusa_izlemleri').select('gebelik_id, dogum_sonrasi_gun').eq('doctor_id', doctorId).in('gebelik_id', gebIds).limit(5000) : bos,
    sb.from('sessions').select('patient_id, created_at').eq('doctor_id', doctorId).in('patient_id', ids).order('created_at', { ascending: false }).limit(5000),
    sb.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doctorId).in('patient_id', ids).gt('expires_at', new Date().toISOString()),
  ])
  const coz = (v: unknown) => { try { return v ? decrypt(String(v)) : '' } catch { return '' } }
  const hasta = new Map<string, { ad: string; dob: string | null }>()
  for (const p of pQ.data || []) {
    let ad = 'Hasta'
    try { const j = JSON.parse(coz(p.name_encrypted)); ad = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ }
    hasta.set(String(p.id), { ad, dob: gun(coz(p.dob_encrypted)) })
  }
  const grup = (rows: Record<string, unknown>[] | null) => { const m = new Map<string, Record<string, unknown>[]>(); for (const r of rows || []) { const k = String(r.gebelik_id); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) } return m }
  const iz = grup(izQ.data as Record<string, unknown>[]), gen = grup(genQ.data as Record<string, unknown>[]), loh = grup(lohQ.data as Record<string, unknown>[])
  const sonVizit = new Map<string, string>()
  for (const s of sQ.data || []) if (!sonVizit.has(String(s.patient_id))) sonVizit.set(String(s.patient_id), String(s.created_at).slice(0, 10))
  const portal = new Set((tQ.data || []).map((r) => String(r.patient_id)))

  const girdi: KdKohortGirdi[] = ids.filter((id) => hasta.has(id)).map((id) => {
    const g = gebelik.get(id)
    let gb: KdKohortGirdi['gebelik'] = null
    if (g) {
      const izlemler = (iz.get(g.id) || []).map((r) => ({ hafta: Number(r.hafta), usg: (r.usg || null) as Record<string, string | number> | null, ogtt: r.ogtt, gbs_kultur: (r.gbs_kultur as string | null) ?? null }))
      gb = {
        durum: aktifGebelikDurumu(g.durum) ? 'aktif' : 'dogum_yapti',
        sat: gun(g.sat), tdt: gun(g.tdt), rhNegatif: !!g.rh_negatif, dogumTarihi: gun(g.dogum_tarihi),
        izlemHaftalari: izlemler.map((x) => x.hafta).filter((x) => Number.isFinite(x)),
        yapilanlar: doneWindowIdsFromClinic({
          labs: (g.lab_panel || null) as never, kanGrubu: g.kan_grubu, izlemler,
          genetik: (gen.get(g.id) || []).map((x) => ({ tur: String(x.tur) })),
          destekAsi: (g.destek_asi || null) as never,
          antiD: Array.isArray(g.anti_d_uygulamalari) ? g.anti_d_uygulamalari : [],
        }),
        lohusaGunleri: (loh.get(g.id) || []).map((x) => Number(x.dogum_sonrasi_gun)).filter((x) => Number.isFinite(x)),
      }
    }
    const h = hasta.get(id)!
    return {
      patientId: id, ad: h.ad, dogumIso: h.dob, gebelik: gb,
      serviks: serviks.has(id) || gb ? { sonTarama: serviks.get(id) ?? null } : null,
      sonVizit: sonVizit.get(id) || null, portalVar: portal.has(id),
    }
  })
  return { satirlar: kdKohortSatirlari(girdi, bugun), toplamHasta: girdi.length }
}

/** Tek hastaya hatırlatma. Çağıran, patientId'nin hekime ait olduğunu ÖNCE kdKohortVerisi(doctorId) ile doğrulamış olmalı. */
export async function kdHatirlatmaGonder(sb: Sb, doctorId: string, patientId: string, bayraklar: KdKohortBayrak[]): Promise<'gonderildi' | 'yakin' | 'hata'> {
  const { data: yakin } = await sb.from('hasta_mesaj_konulari').select('id').eq('doctor_id', doctorId).eq('patient_id', patientId).eq('konu', KD_HATIRLATMA_KONU).gte('son_mesaj_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(1)
  if (yakin?.length) return 'yakin'
  const m = kdHatirlatmaMesaji(bayraklar)
  const { data: konu, error } = await sb.from('hasta_mesaj_konulari').insert({ doctor_id: doctorId, patient_id: patientId, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: new Date().toISOString(), okundu_hasta: false, okundu_pratik: true }).select('id').single()
  if (error || !konu) return 'hata'
  await sb.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: doctorId, metin: m.metin })
  try { await notifyPatientNewPracticeMessage(sb, { doctorId, patientId }) } catch { /* e-posta hatası gönderimi bozmaz */ }
  return 'gonderildi'
}
