/**
 * NOTYA-BELGE-01 — "Asistana raporla" (Tier A + Tier B results).
 *
 * POST  body: { documentId, modalityFinal, klinikNot?, deid: { mime, base64, hash } | null, sesMetrikleri?, tierB?: MotorCiktisi[],
 *               fitzpatrickBilinmiyor?, tekAlanFundus? }
 *       The client sends the DE-IDENTIFIED derivative (EXIF stripped, downscaled, doctor confirmed no burned-in
 *       identity) — the original never leaves the vault. Audio arrives as a spectrogram PNG + metrics.
 * GET   ?documentId= → latest analysis for that document
 * PATCH body: { analizId, alan: 'ozet'|'hekim_tanisi'|'tanilar', sonraki } → doctor edit + revision log
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { getDocumentMeta } from '@/lib/vault/service'
import { decrypt } from '@/lib/security/encryption'
import { bransAnahtari, bransKurali, etkinModalite, SES_MODALITELERI } from '@/core/belgeler/router'
import { tierAYazVeFuzyonla } from '@/core/belgeler/tierA'
import { MODALITE_TR, type Modalite } from '@/core/belgeler/ontoloji'
import type { MotorCiktisi } from '@/core/belgeler/types'
import type { ClaudeGorselGirdi } from '@/core/belgeler/yazar'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function yasAyHesapla(dobIso: string | null): number | null {
  if (!dobIso) return null
  const d = new Date(dobIso); if (isNaN(d.getTime())) return null
  const now = new Date()
  return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = (await req.json().catch(() => null)) as {
    documentId?: string; modalityFinal?: Modalite; klinikNot?: string
    deid?: { mime: string; base64: string; hash: string } | null
    sesMetrikleri?: Record<string, number | string> | null
    tierB?: MotorCiktisi[]
    fitzpatrickBilinmiyor?: boolean; tekAlanFundus?: boolean
  } | null
  if (!body?.documentId || !body.modalityFinal) return NextResponse.json({ error: 'documentId ve modalityFinal gerekli' }, { status: 400 })

  // Document + patient ownership (vault enforces doctor scope)
  let meta
  try { meta = await getDocumentMeta({ supabase }, user.id, body.documentId) } catch { return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 }) }

  const [{ data: doktor }, { data: hasta }] = await Promise.all([
    supabase.from('users').select('specialty').eq('id', user.id).maybeSingle(),
    supabase.from('patients').select('dob_encrypted, gender_encrypted').eq('id', meta.patientId).eq('doctor_id', user.id).maybeSingle(),
  ])
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  const bransKey = bransAnahtari(doktor?.specialty)
  const kural = bransKurali(bransKey)
  if (kural.engelli) return NextResponse.json({ error: 'Bu branşta belge analizi kapalıdır (psikiyatri: tanısal ses/görüntü analizi yapılmaz).' }, { status: 403 })

  let dobIso: string | null = null, cinsiyet: 'K' | 'E' | null = null
  try { if (hasta.dob_encrypted) dobIso = decrypt(String(hasta.dob_encrypted)) } catch { dobIso = null }
  try { if (hasta.gender_encrypted) { const g = decrypt(String(hasta.gender_encrypted)).toLocaleLowerCase('tr-TR'); cinsiyet = g.startsWith('k') || g.startsWith('f') ? 'K' : g.startsWith('e') || g.startsWith('m') ? 'E' : null } } catch { cinsiyet = null }
  const yasAy = yasAyHesapla(dobIso)

  const { modalite, serbest } = etkinModalite(bransKey, body.modalityFinal)
  const sesMi = SES_MODALITELERI.includes(modalite)
  const pdfMi = meta.fileType === 'application/pdf'

  // What the writer sees: de-identified image / spectrogram PNG / PDF bytes. PDF goes as-is (vault-decrypted, doctor-scoped).
  let gorsel: ClaudeGorselGirdi | null = null
  let deIdHash = ''
  if (pdfMi) {
    const { downloadDocument } = await import('@/lib/vault/service')
    const { bytes } = await downloadDocument({ supabase }, user.id, body.documentId)
    gorsel = { tip: 'pdf', base64: bytes.toString('base64') }
    deIdHash = createHash('sha256').update(bytes).digest('hex')
  } else if (body.deid?.base64) {
    const mime = (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(body.deid.mime) ? body.deid.mime : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    gorsel = { tip: 'image', mime, base64: body.deid.base64 }
    deIdHash = body.deid.hash || createHash('sha256').update(body.deid.base64).digest('hex')
  } else {
    return NextResponse.json({ error: 'Kimliksizleştirilmiş görüntü (deid) gerekli' }, { status: 400 })
  }

  const tierB: MotorCiktisi[] = Array.isArray(body.tierB) ? body.tierB.filter((m) => m && typeof m.motor === 'string' && Array.isArray(m.labels)).map((m) => ({ ...m, tier: 'B' as const })) : []
  // Only registry-active engines count as validated, whatever the client claims.
  const { data: aktifMotorlar } = await supabase.from('motor_kayit').select('motor, aktif, ticari_kullanim').eq('tier', 'B')
  const aktifSet = new Set((aktifMotorlar || []).filter((m) => m.aktif && m.ticari_kullanim).map((m) => m.motor))
  for (const m of tierB) m.dogrulanmis = aktifSet.has(m.motor)

  const girdi = { brans: kural.ad, modality_final: modalite, yasAy, cinsiyet, klinikNot: body.klinikNot || null }

  // Tier A: one shared path (core/belgeler/tierA) — also used by Göz › Görüntü › Asistana raporla.
  let sonucA
  try {
    sonucA = await tierAYazVeFuzyonla({ anthropic: getAnthropic(), persona: kural.persona, girdi, gorsel, tierB, modalite, yasAy, fitzpatrickBilinmiyor: body.fitzpatrickBilinmiyor, tekAlanFundus: body.tekAlanFundus, serbest, sesMetrikleri: sesMi ? body.sesMetrikleri || null : null, doctorId: user.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'yazar hatası'
    await supabase.from('belge_analizleri').insert({ belge_id: body.documentId, doctor_id: user.id, patient_id: meta.patientId, brans: bransKey, modality_final: modalite, yas_ay: yasAy, cinsiyet, de_id_hash: deIdHash, engine_set: 'tierA-v1', durum: 'hata', motor_ciktilari: tierB, sonuc: { hata: msg.slice(0, 300) } })
    return NextResponse.json({ error: 'Taslak üretilemedi. Lütfen tekrar deneyin.' }, { status: 502 })
  }
  const { rapor, fusion, motorlar, duzeltmeler } = sonucA
  const yazim = { ham: sonucA.ham }

  // Modality mismatch: the writer saw something else than the doctor chose
  const secilenTr = MODALITE_TR[modalite] || modalite
  const uyusmazlik = !serbest && rapor.modalite && !rapor.modalite.toLocaleLowerCase('tr-TR').includes(secilenTr.toLocaleLowerCase('tr-TR').split(' ')[0]) && !secilenTr.toLocaleLowerCase('tr-TR').includes(rapor.modalite.toLocaleLowerCase('tr-TR').split(' ')[0])
  const durum = rapor.kalite === 'dusuk' ? 'kalite_dusuk' : uyusmazlik ? 'modalite_uyusmazlik' : 'taslak'
  const engineSet = tierB.length ? `tierA+${tierB.map((m) => m.motor).join('+')}-v1` : 'tierA-v1'

  const { data: kayit, error } = await supabase.from('belge_analizleri').insert({
    belge_id: body.documentId, doctor_id: user.id, patient_id: meta.patientId, brans: bransKey, modality_final: modalite, yas_ay: yasAy, cinsiyet,
    de_id_hash: deIdHash, engine_set: engineSet, durum, sonuc: rapor, motor_ciktilari: motorlar,
    fusion: { fused: fusion.fused, capPct: fusion.capPct, acilNedenler: fusion.acilNedenler, sinirlar: fusion.sinirlar, duzeltmeler, ham: yazim.ham.slice(0, 4000) },
  }).select('id, durum, sonuc, fusion, motor_ciktilari, olusturuldu').single()
  if (error) return NextResponse.json({ error: 'Analiz kaydedilemedi' }, { status: 500 })
  return NextResponse.json({ analiz: kayit, brans: kural.ad, persona: kural.persona, yasAy, uyusmazlik, secilenModalite: secilenTr })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const documentId = req.nextUrl.searchParams.get('documentId')
  const patientId = req.nextUrl.searchParams.get('patientId')
  const { data: doktor } = await supabase.from('users').select('specialty').eq('id', user.id).maybeSingle()
  const bransKey = bransAnahtari(doktor?.specialty)
  if (patientId && !documentId) {
    const { data } = await supabase.from('belge_analizleri').select('id, durum, sonuc, fusion, motor_ciktilari, hekim_tanisi, hekim_ozet, note_id, onaylandi_at, olusturuldu, brans, modality_final, yas_ay, belge_id').eq('doctor_id', user.id).eq('patient_id', patientId).order('olusturuldu', { ascending: false }).limit(20)
    return NextResponse.json({ analizler: data || [], bransKey })
  }
  if (!documentId) return NextResponse.json({ error: 'documentId gerekli' }, { status: 400 })
  const { data } = await supabase.from('belge_analizleri').select('id, durum, sonuc, fusion, motor_ciktilari, hekim_tanisi, hekim_ozet, note_id, onaylandi_at, olusturuldu, brans, modality_final, yas_ay').eq('doctor_id', user.id).eq('belge_id', documentId).order('olusturuldu', { ascending: false }).limit(1).maybeSingle()
  return NextResponse.json({ analiz: data || null, bransKey })
}

export async function PATCH(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = (await req.json().catch(() => null)) as { analizId?: string; alan?: string; sonraki?: unknown } | null
  if (!body?.analizId || !body.alan) return NextResponse.json({ error: 'analizId ve alan gerekli' }, { status: 400 })
  const { data: a } = await supabase.from('belge_analizleri').select('id, sonuc, hekim_tanisi, hekim_ozet, durum').eq('id', body.analizId).eq('doctor_id', user.id).maybeSingle()
  if (!a) return NextResponse.json({ error: 'Analiz bulunamadı' }, { status: 404 })
  if (a.durum === 'muayene_onaylandi') return NextResponse.json({ error: 'Muayene onaylanmış; rapor kilitli.' }, { status: 409 })
  const guncelleme: Record<string, unknown> = { durum: 'hekim_duzenledi', guncellendi: new Date().toISOString() }
  let onceki: unknown = null
  if (body.alan === 'ozet') { onceki = a.hekim_ozet ?? (a.sonuc as { ozet?: string })?.ozet; guncelleme.hekim_ozet = String(body.sonraki || '').slice(0, 4000) }
  else if (body.alan === 'hekim_tanisi') {
    onceki = a.hekim_tanisi
    const liste = Array.isArray(body.sonraki) ? body.sonraki.filter((x: unknown) => x && typeof (x as { ad?: unknown }).ad === 'string').map((x: { ad: string; icd10?: string | null }) => ({ ad: x.ad.slice(0, 200), icd10: x.icd10 ? String(x.icd10).slice(0, 12) : null })) : []
    guncelleme.hekim_tanisi = liste
  } else return NextResponse.json({ error: 'Geçersiz alan' }, { status: 400 })
  const { error } = await supabase.from('belge_analizleri').update(guncelleme).eq('id', a.id)
  if (error) return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  await supabase.from('belge_revizyonlar').insert({ analiz_id: a.id, doctor_id: user.id, alan: body.alan, onceki: onceki == null ? null : onceki, sonraki: body.sonraki == null ? null : (body.sonraki as object) })
  return NextResponse.json({ ok: true })
}
