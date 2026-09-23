/**
 * DERM-EXCEPTIONAL-01 — derm kohort verisi + hasta-güvenli hatırlatma gönderimi (route.ts yalnız handler export edebilir).
 * Hasta kimlikleri yalnız doctor_id = hekim olan hasta_derm / derm_gorevleri / derm_ilac_guvenlik satırlarından türetilir;
 * hasta_derm_id ile bağlı çocuk tablolar (yama, fototerapi, lezyon) yalnız o epizot kimlikleriyle okunur.
 * Ad, yalnız kimliği doğrulanmış hekime şifre çözülerek döner.
 * Hatırlatma: mevcut Sağlığım mesaj kanalı (hasta_mesaj_konulari) + e-posta bildirimi (gövdesiz) + derm görevi (dönüş takibi).
 */
import type { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { dermKohortSatirlari, type DermKohortGirdi } from '@/specialties/dermatoloji/engines/kohort'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'

export type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

const TBSE_TAKIP_UNITELERI = ['nevus-tumor', 'fototerapi']

export async function dermKohortVerisi(sb: Sb, doctorId: string, bugun: string, sadece?: string[]) {
  // `sadece` verildiyse kaynak sorguları o kimliklerle daraltılır (tek hasta: hatırlatma) — yine doctor_id kapsamlı.
  const epQ = (() => {
    let q = sb.from('hasta_derm').select('id, patient_id, unit, last_tbse_iso, tb_screen, hbv_screen, ugly_duckling').eq('doctor_id', doctorId)
    if (sadece) q = q.in('patient_id', sadece)
    return q.limit(2000)
  })()
  const gorevQ = (() => {
    let q = sb.from('derm_gorevleri').select('patient_id, kod, ad, due, kaynak').eq('doctor_id', doctorId).eq('durum', 'acik')
    if (sadece) q = q.in('patient_id', sadece)
    return q.limit(5000)
  })()
  const ilacQ = (() => {
    let q = sb.from('derm_ilac_guvenlik').select('patient_id, ilac, aylik_due').eq('doctor_id', doctorId).eq('aktif', true)
    if (sadece) q = q.in('patient_id', sadece)
    return q.limit(5000)
  })()
  const [ep, gorevler, ilaclar] = await Promise.all([epQ, gorevQ, ilacQ])

  const epizotlar = (ep.data || []).map((r) => ({
    id: String(r.id),
    patientId: String(r.patient_id),
    unit: String(r.unit || 'genel'),
    sonTbse: r.last_tbse_iso ? String(r.last_tbse_iso).slice(0, 10) : null,
    tb: r.tb_screen === true,
    hbv: r.hbv_screen === true,
    cirkinOrdek: r.ugly_duckling === true,
  }))
  let ids = Array.from(new Set([
    ...epizotlar.map((e) => e.patientId),
    ...(gorevler.data || []).map((r) => String(r.patient_id)),
    ...(ilaclar.data || []).map((r) => String(r.patient_id)),
  ]))
  if (sadece) ids = ids.filter((x) => sadece.includes(x))
  ids = ids.slice(0, 500)
  if (!ids.length) return { satirlar: [], toplamHasta: 0 }

  const epIds = epizotlar.filter((e) => ids.includes(e.patientId)).map((e) => e.id)
  const [pQ, yamaQ, fotoQ, lezyonQ, sQ, tQ] = await Promise.all([
    sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).in('id', ids),
    epIds.length ? sb.from('derm_yama_kurslari').select('hasta_derm_id, applied_at, read_d2, read_d4').in('hasta_derm_id', epIds).limit(5000) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    epIds.length ? sb.from('derm_fototerapi_seanslari').select('hasta_derm_id, seans_tarihi, burn').in('hasta_derm_id', epIds).limit(5000) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    epIds.length ? sb.from('derm_lezyonlar').select('hasta_derm_id, dermoskop_uyari, acil').in('hasta_derm_id', epIds).limit(5000) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    arsivsizSeanslar(sb, 'patient_id, created_at').eq('doctor_id', doctorId).in('patient_id', ids).order('created_at', { ascending: false }).limit(5000),
    sb.from('hasta_portal_tokens').select('patient_id').eq('doctor_id', doctorId).in('patient_id', ids).gt('expires_at', new Date().toISOString()),
  ])

  const ad = new Map<string, string>()
  for (const p of pQ.data || []) { let n = 'Hasta'; try { const j = JSON.parse(decrypt(String(p.name_encrypted))); n = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ } ad.set(String(p.id), n) }
  const epizotHastasi = new Map(epizotlar.map((e) => [e.id, e.patientId]))
  const hastayaGore = <T>(rows: Record<string, unknown>[] | null, esle: (r: Record<string, unknown>) => T) => {
    const m = new Map<string, T[]>()
    for (const r of rows || []) {
      const pid = epizotHastasi.get(String(r.hasta_derm_id))
      if (!pid) continue
      if (!m.has(pid)) m.set(pid, [])
      m.get(pid)!.push(esle(r))
    }
    return m
  }
  const yama = hastayaGore(yamaQ.data as Record<string, unknown>[] | null, (r) => ({ appliedAt: String(r.applied_at).slice(0, 10), readD2: r.read_d2 ? String(r.read_d2).slice(0, 10) : null, readD4: r.read_d4 ? String(r.read_d4).slice(0, 10) : null }))
  const foto = hastayaGore(fotoQ.data as Record<string, unknown>[] | null, (r) => ({ tarih: String(r.seans_tarihi).slice(0, 10), yanik: r.burn === true }))
  const lezyon = hastayaGore(lezyonQ.data as Record<string, unknown>[] | null, (r) => ({ uyari: r.dermoskop_uyari === true || r.acil === true }))

  const grup = <T extends { patient_id: unknown }>(rows: T[] | null) => { const m = new Map<string, T[]>(); for (const r of rows || []) { const k = String(r.patient_id); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) } return m }
  const gor = grup(gorevler.data), ilac = grup(ilaclar.data)
  const epHasta = new Map(epizotlar.map((e) => [e.patientId, e]))
  const sonVizit = new Map<string, string>()
  for (const s of sQ.data || []) if (!sonVizit.has(String(s.patient_id))) sonVizit.set(String(s.patient_id), String(s.created_at).slice(0, 10))
  const portal = new Set((tQ.data || []).map((r) => String(r.patient_id)))

  const girdi: DermKohortGirdi[] = ids.filter((id) => ad.has(id)).map((id) => {
    const e = epHasta.get(id)
    return {
      patientId: id,
      ad: ad.get(id)!,
      sonTbse: e?.sonTbse ?? null,
      tbseTakipte: !!e && (e.cirkinOrdek || TBSE_TAKIP_UNITELERI.includes(e.unit) || (lezyon.get(id) || []).some((l) => l.uyari)),
      yamaKurslari: yama.get(id) || [],
      fototerapi: foto.get(id) || [],
      ilacTakip: (ilac.get(id) || []).map((r) => ({ ilac: String(r.ilac || ''), aylikDue: r.aylik_due ? String(r.aylik_due).slice(0, 10) : null })),
      tbTarama: e ? e.tb : true,
      hbvTarama: e ? e.hbv : true,
      gorevler: (gor.get(id) || []).map((g) => ({ kod: String(g.kod), ad: String(g.ad || 'Derm görevi'), due: g.due ? String(g.due).slice(0, 10) : null, kaynak: g.kaynak ? String(g.kaynak) : null })),
      sonVizit: sonVizit.get(id) || null,
      portalVar: portal.has(id),
    }
  })
  return { satirlar: dermKohortSatirlari(girdi, bugun), toplamHasta: girdi.length }
}
