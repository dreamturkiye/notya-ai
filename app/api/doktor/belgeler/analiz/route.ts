/**
 * NOTYA-BELGE-01 — "Asistana raporla" (Tier A + Tier B results).
 *
 * POST  body: { documentId, modalityFinal, klinikNot?, deid: { mime, base64, hash, ekSayfalar? } (masked copy; PDF = masked pages), sesMetrikleri?, tierB?: MotorCiktisi[],
 *               fitzpatrickBilinmiyor?, tekAlanFundus? }
 *       The client sends the DE-IDENTIFIED derivative (EXIF stripped, downscaled, doctor confirmed no burned-in
 *       identity) — the original never leaves the vault. Audio arrives as a spectrogram PNG + metrics.
 * GET   ?documentId= → latest analysis for that document
 * PATCH body: { analizId, alan: 'ozet'|'hekim_tanisi'|'tanilar', sonraki } → doctor edit + revision log
 */
import { deidCoz, deidMime } from '@/lib/doktor/muayeneEk/icerik'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { getDocumentMeta } from '@/lib/vault/service'
import { decrypt } from '@/lib/security/encryption'
import { modaliteMetindenKod } from '@/core/belgeler/modaliteTespit'
import { bransAnahtari, bransKurali, etkinModalite, SES_MODALITELERI } from '@/core/belgeler/router'
import { tierAYazVeFuzyonla } from '@/core/belgeler/tierA'
import { fusionYap } from '@/core/belgeler/fusion'
import { MODALITE_TR, type Modalite } from '@/core/belgeler/ontoloji'
import { ekoAseDegerlendir, ekoDogrulamayiUygula, ekoMetniMi, ekoMotorRaporu, ekoRaporunuZenginlestir, EKO_ASE_MOTOR } from '@/core/belgeler/ekoAse'
import type { BelgeRaporu, FusionSonuc, MotorCiktisi } from '@/core/belgeler/types'
import type { ClaudeGorselGirdi } from '@/core/belgeler/yazar'
import { cinsiyetKodu } from '@/lib/utils/cinsiyet'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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
    documentId?: string; modalityFinal?: Modalite | 'auto'; klinikNot?: string
    deid?: unknown
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
  try { if (hasta.gender_encrypted) cinsiyet = cinsiyetKodu(decrypt(String(hasta.gender_encrypted))) } catch { cinsiyet = null }
  const yasAy = yasAyHesapla(dobIso)

  // NOTYA-BELGE-TUR-01 (2026-11-20): 'auto' = unclassified upload in the automatic flow. No branch default is imposed any more
  // (pediatri's default "akciğer grafisi" labelled a hip ultrasound as a chest X-ray): the writer determines the document type and
  // the final modality is resolved from what it detected (modaliteCoz below), falling back to 'serbest' (describe only).
  const otomatik = body.modalityFinal === 'auto'
  let { modalite, serbest } = otomatik ? { modalite: 'serbest' as Modalite, serbest: false } : etkinModalite(bransKey, body.modalityFinal as Modalite)
  const sesMi = SES_MODALITELERI.includes(modalite)
  const pdfMi = meta.fileType === 'application/pdf'

  // What the writer sees: the masked copy made on the device — one masked image / spectrogram PNG, or a PDF's masked page pictures
  // (NOTYA-BELGE-DEID-03: the PDF itself is never sent; its text layer is only parsed here, locally, for the eko measurements).
  let gorsel: ClaudeGorselGirdi | null = null
  let deIdHash = ''
  let pdfBytes: Buffer | null = null
  const deid = deidCoz(body.deid)
  if (!deid) return NextResponse.json({ error: 'Kimliksizleştirilmiş görüntü (deid) gerekli' }, { status: 400 })
  gorsel = { tip: 'image', mime: deidMime(deid), base64: deid.base64, ...(deid.ekSayfalar ? { ekSayfalar: deid.ekSayfalar } : {}) }
  deIdHash = deid.hash || createHash('sha256').update(deid.base64).digest('hex')
  if (pdfMi) {
    const { downloadDocument } = await import('@/lib/vault/service')
    pdfBytes = (await downloadDocument({ supabase }, user.id, body.documentId)).bytes
  }

  const tierB: MotorCiktisi[] = Array.isArray(body.tierB) ? body.tierB.filter((m) => m && typeof m.motor === 'string' && m.motor !== EKO_ASE_MOTOR && Array.isArray(m.labels)).map((m) => ({ ...m, tier: 'B' as const })) : []
  // Only registry-active engines count as validated, whatever the client claims.
  const { data: aktifMotorlar } = await supabase.from('motor_kayit').select('motor, aktif, ticari_kullanim').eq('tier', 'B')
  const aktifSet = new Set((aktifMotorlar || []).filter((m) => m.aktif && m.ticari_kullanim).map((m) => m.motor))
  for (const m of tierB) m.dogrulanmis = aktifSet.has(m.motor)

  // Eko: metin katmanı varsa ölç. Dosya adı “rapor.pdf” olsa bile kardiyoloji / kalp damar
  // metni ekokardiyografi ise modalite eko olur. Göz ve diğer branşlarda eko listede olmadığı
  // için etkinModalite serbest kalır; erişkin bant oraya sızmaz.
  let ekoMetin: string | null = null
  if (pdfBytes && kural.modaliteler.includes('eko') && (modalite === 'eko' || modalite === 'pdf_rapor')) {
    try {
      const { pdfMetinCoz } = await import('@/core/lab/cikarim')
      ekoMetin = (await pdfMetinCoz(pdfBytes)).metin
    } catch { ekoMetin = '' }
    if (modalite === 'pdf_rapor' && ekoMetniMi(ekoMetin)) {
      modalite = 'eko'
      serbest = false
    }
  }
  if (modalite === 'eko') {
    const ekoMotor = ekoAseDegerlendir({ metin: ekoMetin, yasAy, cinsiyet, girdi: pdfMi ? 'pdf' : 'goruntu' })
    ekoDogrulamayiUygula(ekoMotor)
    tierB.push(ekoMotor)
  }

  const girdi = { brans: kural.ad, modality_final: modalite, yasAy, cinsiyet, klinikNot: body.klinikNot || null, modaliteOtomatik: otomatik }

  // Tier A: one shared path (core/belgeler/tierA) — also used by Göz › Görüntü › Asistana raporla.
  let sonucA: { rapor: BelgeRaporu; fusion: FusionSonuc; motorlar: MotorCiktisi[]; duzeltmeler: string[]; ham: string; modalite?: Modalite }
  try {
    sonucA = await tierAYazVeFuzyonla({ persona: kural.persona, girdi, gorsel, tierB, modalite, yasAy, fitzpatrickBilinmiyor: body.fitzpatrickBilinmiyor, tekAlanFundus: body.tekAlanFundus, serbest, sesMetrikleri: sesMi ? body.sesMetrikleri || null : null, doctorId: user.id,
      ...(otomatik ? { modaliteCoz: (r: BelgeRaporu) => { const k = modaliteMetindenKod(r.modalite); return k ? etkinModalite(bransKey, k) : { modalite: 'serbest' as Modalite, serbest: true } } } : {}) })
  } catch (e) {
    const ekoMotor = tierB.find((m) => m.motor === EKO_ASE_MOTOR)
    const olcum = Number(ekoMotor?.metrikler?.olcumSayisi || 0)
    if (ekoMotor && (olcum > 0 || ekoMotor.labels.length > 0)) {
      const fusion = fusionYap([ekoMotor], { modalite, yasAy, kalite: 'orta' })
      const rapor = ekoMotorRaporu(ekoMotor, fusion.capPct)
      rapor.acil_bayrak = rapor.acil_bayrak || fusion.acilBayrak
      sonucA = { rapor, fusion, motorlar: [ekoMotor], duzeltmeler: ['Yazar yanıt vermedi; ölçüm dökümü kaydedildi'], ham: '' }
    } else {
      const msg = e instanceof Error ? e.message : 'yazar hatası'
      await supabase.from('belge_analizleri').insert({ belge_id: body.documentId, doctor_id: user.id, patient_id: meta.patientId, brans: bransKey, modality_final: modalite, yas_ay: yasAy, cinsiyet, de_id_hash: deIdHash, engine_set: 'tierA-v1', durum: 'hata', motor_ciktilari: tierB, sonuc: { hata: msg.slice(0, 300) } })
      return NextResponse.json({ error: 'Taslak üretilemedi. Lütfen tekrar deneyin.' }, { status: 502 })
    }
  }
  let { rapor, fusion, motorlar, duzeltmeler } = sonucA
  if (otomatik && sonucA.modalite) { modalite = sonucA.modalite; serbest = modalite === 'serbest' }
  const ekoKaydi = motorlar.find((m) => m.motor === EKO_ASE_MOTOR)
  if (ekoKaydi) {
    const once = rapor.kalite
    rapor = ekoRaporunuZenginlestir(rapor, ekoKaydi, yasAy)
    if (once === 'dusuk' && rapor.kalite !== 'dusuk') duzeltmeler = [...duzeltmeler, 'Ölçüm varken düşük kalite tanıları silinmedi']
  }
  const yazim = { ham: sonucA.ham }

  // Modality mismatch: the writer saw something else than the doctor chose
  const secilenTr = MODALITE_TR[modalite] || modalite
  const uyusmazlik = !otomatik && !serbest && rapor.modalite && !rapor.modalite.toLocaleLowerCase('tr-TR').includes(secilenTr.toLocaleLowerCase('tr-TR').split(' ')[0]) && !secilenTr.toLocaleLowerCase('tr-TR').includes(rapor.modalite.toLocaleLowerCase('tr-TR').split(' ')[0])
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
    const { data } = await supabase.from('belge_analizleri').select('id, durum, sonuc, fusion, motor_ciktilari, hekim_tanisi, hekim_ozet, note_id, onaylandi_at, olusturuldu, brans, modality_final, yas_ay, belge_id').eq('doctor_id', user.id).eq('patient_id', patientId).order('olusturuldu', { ascending: false }).limit(80)
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
