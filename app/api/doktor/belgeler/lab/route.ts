/**
 * NOTYA-LAB-01 — Lab pipeline API.
 * POST body.adim:
 *   'cikar'    { documentId }                       → EXTRACT (structural + vision, reconciled) → lab_paneller + lab_satirlar
 *   'satir'    { panelId, satirId, alan, deger }    → doctor cell edit (OCR fix) → recompute the row, doctor_corrected=true
 *   'takma_ad' { panelId, satirId, canonical_key }  → "bunu ALT say" alias; re-map + recompute the row
 *   'tablo_onayla' { panelId }                      → table confirmed
 *   'raporla'  { panelId }                          → INTERPRET (persona + branş emphasis) → belge_analizleri (modality 'lab')
 *   'kimlik_onayla' { panelId }                     → doctor confirms identity mismatch warning
 * GET ?documentId= → latest panel + rows + analysis
 * Onayla / Muayeneyi onayla reuse /api/doktor/belgeler/analiz/onayla (lab-aware block).
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { getDocumentMeta, downloadDocument } from '@/lib/vault/service'
import { decrypt } from '@/lib/security/encryption'
import { bransAnahtari, bransKurali } from '@/core/belgeler/router'
import { csvXlsxCoz, pdfMetinCoz, gorselCikar, type CikarimSonucu } from '@/core/lab/cikarim'
import { satirKur, uzlastir, panelOzeti, ozelHesaplar, type HamSatir, type LabSatir, type OncekiSatir } from '@/core/lab/trend'
import { KANONIK, normalizeAd, type KanonikAnahtar } from '@/core/lab/kanonik'
import { labRaporYaz, labRaporuDogrula } from '@/core/lab/yorum'
import { muhtemelNtpPanel, ntpBelgeSahibi, ntpKeyFromRaw, yorumNtp, NTP_DISCLAIMER } from '@/lib/clinical/yenidogan'

export const dynamic = 'force-dynamic'
export const maxDuration = 120
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never

async function oncekiler(sb: Sb, doctorId: string, patientId: string, oncePanelId?: string): Promise<OncekiSatir[]> {
  const { data } = await sb.from('lab_satirlar').select('canonical_key, kanonik_deger, flag, numune_tarihi, panel_id').eq('doctor_id', doctorId).eq('patient_id', patientId).eq('onayli', true).not('canonical_key', 'is', null).not('numune_tarihi', 'is', null).order('numune_tarihi', { ascending: false }).limit(600)
  return (data || []).filter((r) => r.panel_id !== oncePanelId).map((r) => ({ canonical_key: String(r.canonical_key), kanonik_deger: r.kanonik_deger == null ? null : Number(r.kanonik_deger), flag: r.flag as OncekiSatir['flag'], numune_tarihi: String(r.numune_tarihi) }))
}

async function aliaslar(sb: Sb, doctorId: string): Promise<Record<string, string>> {
  const { data } = await sb.from('lab_takma_adlar').select('raw_norm, canonical_key').eq('doctor_id', doctorId)
  return Object.fromEntries((data || []).map((r) => [r.raw_norm, r.canonical_key]))
}

function satirDb(s: LabSatir, panelId: string, patientId: string, doctorId: string, sira: number, numune: string | null) {
  return { panel_id: panelId, patient_id: patientId, doctor_id: doctorId, sira, raw_name: s.raw_name, canonical_key: s.canonical_key, loinc: s.loinc, value_num: s.value_num, value_text: s.value_text, unit: s.unit, kanonik_deger: s.kanonik_deger, kanonik_birim: s.kanonik_birim, ref_low: s.ref_low, ref_high: s.ref_high, flag: s.flag, kritik: s.kritik, kritik_neden: s.kritik_neden, prior_value: s.prior_value, prior_date: s.prior_date, delta: s.delta, delta_pct: s.delta_pct, trend: s.trend, page: s.page, dogrulanacak: s.dogrulanacak, dogrulama_notu: s.dogrulama_notu, doctor_corrected: s.doctor_corrected, numune_tarihi: numune }
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const body = (await req.json().catch(() => null)) as Record<string, string> | null
  if (!body?.adim) return NextResponse.json({ error: 'adim gerekli' }, { status: 400 })

  if (body.adim === 'cikar') {
    if (!body.documentId) return NextResponse.json({ error: 'documentId gerekli' }, { status: 400 })
    let meta; try { meta = await getDocumentMeta({ supabase: sb }, user.id, body.documentId) } catch { return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 }) }
    const { bytes } = await downloadDocument({ supabase: sb }, user.id, body.documentId)
    const ft = meta.fileType
    let yapi: CikarimSonucu | null = null, gorsel: CikarimSonucu | null = null
    try {
      if (/csv|excel|spreadsheet/.test(ft)) yapi = csvXlsxCoz(bytes, ft)
      else if (ft === 'application/pdf') { const p = await pdfMetinCoz(bytes); yapi = p.satirlar.length ? p : null; if (!p.metin.trim()) yapi = null }
    } catch (e) { yapi = null; console.error('lab yapi', e) }
    try {
      if (ft === 'application/pdf') gorsel = await gorselCikar(getAnthropic(), { tip: 'pdf', base64: bytes.toString('base64') })
      else if (ft.startsWith('image/')) gorsel = await gorselCikar(getAnthropic(), { tip: 'image', mime: ft, base64: bytes.toString('base64') })
    } catch (e) { gorsel = null; console.error('lab gorsel', e) }
    if (!yapi && !gorsel) return NextResponse.json({ error: 'Bu dosyadan tablo çıkarılamadı.' }, { status: 422 })

    let ham: HamSatir[]; let uyusmazlik: ReturnType<typeof uzlastir>['uyusmazlik'] = []
    if (yapi && gorsel) { const u = uzlastir(yapi.satirlar, gorsel.satirlar); ham = u.satirlar; uyusmazlik = u.uyusmazlik }
    else ham = (yapi || gorsel)!.satirlar
    const kaynaklar = [yapi ? 'yapi' : null, gorsel ? 'gorsel' : null].filter(Boolean) as string[]
    const numune = gorsel?.numune_tarihi || yapi?.numune_tarihi || null
    const [onc, al, hastaQ] = await Promise.all([oncekiler(sb, user.id, meta.patientId), aliaslar(sb, user.id), sb.from('patients').select('name_encrypted, dob_encrypted').eq('id', meta.patientId).eq('doctor_id', user.id).maybeSingle()])
    const satirlar = ham.map((h) => { const s = satirKur(h, onc, al); const dis = uyusmazlik.filter((u) => u.raw_name === h.raw_name); if (dis.length) { s.dogrulanacak = true; s.dogrulama_notu = dis.map((d) => `${d.alan}: yapı "${d.yapi ?? '—'}" / görsel "${d.gorsel ?? '—'}"`).join('; ') } if (kaynaklar.length === 1) s.dogrulama_notu = s.dogrulama_notu || 'tek çıkarım kaynağı'; return s })

    // Identity guard: printed name/DOB vs this patient (compared once, only a boolean + masked hint stored)
    let kimlikUyari: { eslesme: boolean | null; ipucu: string | null } = { eslesme: null, ipucu: null }
    if (gorsel?.kimlik && (gorsel.kimlik.ad || gorsel.kimlik.dogum)) {
      let ad = '', dob = ''
      try { ad = hastaQ.data?.name_encrypted ? ((JSON.parse(decrypt(String(hastaQ.data.name_encrypted))) as { ad?: string }).ad || '') : '' } catch { ad = '' }
      try { dob = hastaQ.data?.dob_encrypted ? decrypt(String(hastaQ.data.dob_encrypted)).slice(0, 10) : '' } catch { dob = '' }
      const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü ]/g, '').split(' ').filter(Boolean)
      const adOk = ad && gorsel.kimlik.ad ? norm(gorsel.kimlik.ad).some((p) => norm(ad).includes(p)) : null
      const dobOk = dob && gorsel.kimlik.dogum ? dob === gorsel.kimlik.dogum : null
      const eslesme = adOk === false || dobOk === false ? false : adOk === true || dobOk === true ? true : null
      kimlikUyari = { eslesme, ipucu: eslesme === false ? `Rapordaki kimlik (${gorsel.kimlik.ad ? gorsel.kimlik.ad.split(' ').map((p) => p[0] + '***').join(' ') : ''}${gorsel.kimlik.dogum ? ` · ${gorsel.kimlik.dogum}` : ''}) bu hastayla eşleşmiyor.` : null }
    }
    const oz = panelOzeti(satirlar)
    const kalite = satirlar.length === 0 ? 'dusuk' : oz.dogrulanacak > satirlar.length / 3 ? 'orta' : 'iyi'
    const ntpMi = muhtemelNtpPanel({ labAdi: gorsel?.lab_adi || yapi?.lab_adi || null, satirlar: satirlar.map((s) => ({ raw_name: s.raw_name, canonical_key: s.canonical_key })) })
    if (ntpMi) {
      const { data: bebekKart } = await sb.from('bebek_kartlari').select('bebek_patient_id, anne_patient_id').eq('bebek_patient_id', meta.patientId).maybeSingle()
      const { data: anneOlarak } = await sb.from('bebek_kartlari').select('id').eq('anne_patient_id', meta.patientId).limit(1).maybeSingle()
      const sahip = ntpBelgeSahibi({
        belgePatientId: meta.patientId,
        bebekPatientId: bebekKart?.bebek_patient_id || (anneOlarak ? null : meta.patientId),
        annePatientId: bebekKart?.anne_patient_id || meta.patientId,
      })
      if (anneOlarak && !bebekKart) {
        return NextResponse.json({ error: 'Yenidoğan tarama belgesi bebek kartına kaydedilir, anne belgelerine değil.' }, { status: 409 })
      }
      if (bebekKart && !sahip.ok) return NextResponse.json({ error: sahip.neden }, { status: 409 })
    }
    const { data: onceNtp } = ntpMi
      ? await sb.from('lab_paneller').select('sample_no').eq('patient_id', meta.patientId).eq('panel_type', 'yenidogan_tarama')
      : { data: [] as { sample_no: string | null }[] }
    const ad = String(gorsel?.lab_adi || yapi?.lab_adi || '').toLocaleLowerCase('tr-TR')
    const sampleNo = !ntpMi ? null : /tekrar/.test(ad) ? 'tekrar' : /ntp[\s-]*2|2\.?\s*(örnek|ornek|topuk)/.test(ad) ? '2' : (onceNtp || []).some((p) => p.sample_no === '1') ? '2' : '1'
    const ntpSatirlar: LabSatir[] = ntpMi
      ? satirlar.map((s) => {
        let k: KanonikAnahtar | null = s.canonical_key
        if (s.canonical_key === 'TSH') k = 'ntp_tsh'
        else if (!s.canonical_key || !String(s.canonical_key).startsWith('ntp_')) {
          const ntpK = ntpKeyFromRaw(s.raw_name)
          if (ntpK) k = ntpK
        }
        return k && k !== s.canonical_key ? { ...s, canonical_key: k } : s
      })
      : satirlar
    const { data: panel, error } = await sb.from('lab_paneller').insert({ belge_id: body.documentId, doctor_id: user.id, patient_id: meta.patientId, lab_adi: gorsel?.lab_adi || null, numune_tarihi: numune, rapor_tarihi: gorsel?.rapor_tarihi || yapi?.rapor_tarihi || null, kaynaklar, extract_json: { yapi: yapi ? { ...yapi, metin: undefined } : null, gorsel, uyusmazlik }, kalite, kimlik_uyari: kimlikUyari, durum: 'cikarildi', panel_type: ntpMi ? 'yenidogan_tarama' : 'genel', sample_no: sampleNo }).select('id').single()
    if (error || !panel) return NextResponse.json({ error: 'Panel kaydedilemedi' }, { status: 500 })
    if (ntpSatirlar.length) { const { error: e2 } = await sb.from('lab_satirlar').insert(ntpSatirlar.map((s, i) => satirDb(s, panel.id, meta.patientId, user.id, i, numune))); if (e2) return NextResponse.json({ error: 'Satırlar kaydedilemedi' }, { status: 500 }) }
    return NextResponse.json({ ok: true, panelId: panel.id, ozet: oz, kaynaklar, kimlikUyari, uyusmazlik: uyusmazlik.length, panel_type: ntpMi ? 'yenidogan_tarama' : 'genel' })
  }

  // ---- row-level operations
  const { data: panel } = body.panelId ? await sb.from('lab_paneller').select('*').eq('id', body.panelId).eq('doctor_id', user.id).maybeSingle() : { data: null }
  if (!panel) return NextResponse.json({ error: 'Panel bulunamadı' }, { status: 404 })
  if (panel.durum === 'muayene_onaylandi') return NextResponse.json({ error: 'Muayene onaylanmış; panel kilitli.' }, { status: 409 })

  if (body.adim === 'satir' || body.adim === 'takma_ad') {
    const { data: satir } = await sb.from('lab_satirlar').select('*').eq('id', body.satirId).eq('panel_id', panel.id).maybeSingle()
    if (!satir) return NextResponse.json({ error: 'Satır bulunamadı' }, { status: 404 })
    const al = await aliaslar(sb, user.id)
    if (body.adim === 'takma_ad') {
      const key = body.canonical_key as KanonikAnahtar
      if (!(key in KANONIK)) return NextResponse.json({ error: 'Geçersiz anahtar' }, { status: 400 })
      await sb.from('lab_takma_adlar').upsert({ doctor_id: user.id, raw_norm: normalizeAd(satir.raw_name), canonical_key: key }, { onConflict: 'doctor_id,raw_norm' })
      al[normalizeAd(satir.raw_name)] = key
    }
    const ham: HamSatir = { raw_name: satir.raw_name, value: body.adim === 'satir' && body.alan === 'value' ? body.deger : (satir.value_text ?? String(satir.value_num ?? '')), unit: body.adim === 'satir' && body.alan === 'unit' ? body.deger || null : satir.unit, ref_low: body.adim === 'satir' && body.alan === 'ref_low' ? body.deger || null : satir.ref_low == null ? null : String(satir.ref_low), ref_high: body.adim === 'satir' && body.alan === 'ref_high' ? body.deger || null : satir.ref_high == null ? null : String(satir.ref_high), flag_printed: null, page: satir.page }
    if (body.adim === 'satir' && body.alan === 'raw_name') ham.raw_name = body.deger || satir.raw_name
    const onc = await oncekiler(sb, user.id, panel.patient_id, panel.id)
    const yeni = satirKur(ham, onc, al); yeni.doctor_corrected = true; yeni.dogrulanacak = false; yeni.dogrulama_notu = 'hekim düzeltti'
    const { error } = await sb.from('lab_satirlar').update({ ...satirDb(yeni, panel.id, panel.patient_id, user.id, satir.sira, panel.numune_tarihi) }).eq('id', satir.id)
    if (error) return NextResponse.json({ error: 'Satır güncellenemedi' }, { status: 500 })
    await sb.from('lab_paneller').update({ updated_at: new Date().toISOString(), tablo_onayli: false }).eq('id', panel.id)
    return NextResponse.json({ ok: true })
  }

  if (body.adim === 'tablo_onayla') {
    await sb.from('lab_paneller').update({ tablo_onayli: true, durum: 'tablo_onayli', updated_at: new Date().toISOString() }).eq('id', panel.id)
    return NextResponse.json({ ok: true })
  }
  if (body.adim === 'kimlik_onayla') {
    await sb.from('lab_paneller').update({ kimlik_uyari: { ...(panel.kimlik_uyari || {}), eslesme: true, hekimOnayi: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq('id', panel.id)
    return NextResponse.json({ ok: true })
  }

  if (body.adim === 'raporla') {
    if (!panel.tablo_onayli) return NextResponse.json({ error: 'Önce tabloyu onaylayın (hücre düzeltmeleri bitince).' }, { status: 409 })
    if (panel.kimlik_uyari?.eslesme === false) return NextResponse.json({ error: 'Rapordaki kimlik bu hastayla eşleşmiyor — önce doğrulayın.' }, { status: 409 })
    const [{ data: rows }, { data: doktor }, { data: hasta }, { data: sonNot }] = await Promise.all([
      sb.from('lab_satirlar').select('*').eq('panel_id', panel.id).order('sira'),
      sb.from('users').select('specialty').eq('id', user.id).maybeSingle(),
      sb.from('patients').select('dob_encrypted, gender_encrypted').eq('id', panel.patient_id).maybeSingle(),
      sb.from('notes').select('id, content_plan, sessions!inner(patient_id)').eq('doctor_id', user.id).eq('sessions.patient_id', panel.patient_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    const satirlar: LabSatir[] = (rows || []).map((r) => ({ raw_name: r.raw_name, canonical_key: r.canonical_key, loinc: r.loinc, value_num: r.value_num == null ? null : Number(r.value_num), value_text: r.value_text, unit: r.unit, kanonik_deger: r.kanonik_deger == null ? null : Number(r.kanonik_deger), kanonik_birim: r.kanonik_birim, ref_low: r.ref_low == null ? null : Number(r.ref_low), ref_high: r.ref_high == null ? null : Number(r.ref_high), flag: r.flag, kritik: r.kritik, kritik_neden: r.kritik_neden, prior_value: r.prior_value == null ? null : Number(r.prior_value), prior_date: r.prior_date, prior_series: [], delta: r.delta == null ? null : Number(r.delta), delta_pct: r.delta_pct == null ? null : Number(r.delta_pct), trend: r.trend, page: r.page, dogrulanacak: r.dogrulanacak, dogrulama_notu: r.dogrulama_notu, doctor_corrected: r.doctor_corrected }))
    // prior series for sentences
    const onc = await oncekiler(sb, user.id, panel.patient_id, panel.id)
    for (const s of satirlar) if (s.canonical_key) s.prior_series = onc.filter((o) => o.canonical_key === s.canonical_key && o.kanonik_deger != null).slice(0, 10).map((o) => ({ tarih: o.numune_tarihi, deger: o.kanonik_deger as number })).reverse()
    let yasAy: number | null = null, cinsiyet: string | null = null
    try { if (hasta?.dob_encrypted) { const d = new Date(decrypt(String(hasta.dob_encrypted))); if (!isNaN(d.getTime())) { const n = new Date(); yasAy = Math.max(0, (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth())) } } } catch { yasAy = null }
    try { if (hasta?.gender_encrypted) cinsiyet = decrypt(String(hasta.gender_encrypted)) } catch { cinsiyet = null }
    const bransKey = bransAnahtari(doktor?.specialty); const kural = bransKurali(bransKey)
    const ilaclar = String(sonNot?.content_plan || '').split('\n').filter((l: string) => /mg|tablet|tb|damla|şurup|surup|kapsül|x\s*\d/i.test(l)).slice(0, 8).map((l: string) => l.trim())
    const oncekiVar = onc.length > 0
    const kritik = satirlar.filter((s) => s.kritik).map((s) => s.kritik_neden || s.raw_name)
    const ozelSatirlar = ozelHesaplar(satirlar, bransKey) // NOTYA-LAB-04
    const ntpMi = panel.panel_type === 'yenidogan_tarama' || muhtemelNtpPanel({ labAdi: panel.lab_adi, satirlar })
    const ntp = ntpMi ? yorumNtp({
      satirlar: satirlar.flatMap((s) => {
        const k = String(s.canonical_key || '').startsWith('ntp_') ? s.canonical_key : ntpKeyFromRaw(s.raw_name)
        if (!k) return []
        return [{ canonical_key: k as 'ntp_pku' | 'ntp_tsh' | 'ntp_biotinidaz' | 'ntp_irt' | 'ntp_17ohp' | 'ntp_sma', flag: s.flag, raw: String(s.value_text ?? s.value_num ?? '') }]
      }),
      sample_no: panel.sample_no,
    }) : null
    if (ntp) ozelSatirlar.unshift(`NTP yorum (kural): ${ntp.yorum}`, NTP_DISCLAIMER, ntp.sevk !== 'yok' ? `Sevk: ${ntp.sevk}` : 'Sevk yok', ...ntp.plan.map((p) => `Plan önerisi: ${p}`))
    let yazim
    try { yazim = await labRaporYaz(getAnthropic(), ntpMi ? 'ayse' : kural.persona, ntpMi ? 'pediatri' : bransKey, satirlar, { yasAy, cinsiyet, ilaclar, labAdi: panel.lab_adi, numuneTarihi: panel.numune_tarihi, kritik, oncekiVar, ozelSatirlar }) }
    catch (e) {
      console.error('lab yorum', e)
      if (!ntp) return NextResponse.json({ error: 'Taslak üretilemedi. Lütfen tekrar deneyin.' }, { status: 502 })
      yazim = { rapor: { ozet: ntp.yorum, kritik: [], yeni_bozulanlar: [], duzelenler: [], kronik: [], tanilar: [], klinik_iliski: NTP_DISCLAIMER, oneri: ntp.plan.join(' '), recete_ipucu: null, sinirlar: [NTP_DISCLAIMER], acil_bayrak: ntp.sevk !== 'yok' }, ham: ntp.yorum }
    }
    const { rapor, duzeltmeler } = labRaporuDogrula(yazim.rapor, satirlar, oncekiVar)
    if (ntp) {
      rapor.ozet = ntp.yorum
      rapor.tanilar = []
      rapor.oneri = [ntp.yorum, ...ntp.plan, NTP_DISCLAIMER].join('\n')
      rapor.recete_ipucu = null
      if (!rapor.sinirlar.includes(NTP_DISCLAIMER)) rapor.sinirlar = [NTP_DISCLAIMER, ...rapor.sinirlar]
      if (ntp.sevk !== 'yok') rapor.acil_bayrak = true
    }
    const sonuc = { modalite: 'lab', kalite: panel.kalite, ozet: rapor.ozet, bulgular: [...ozelSatirlar.map((k) => `Hesap: ${k}`), ...rapor.kritik.map((k) => `KRİTİK: ${k}`), ...rapor.yeni_bozulanlar.map((k) => `Yeni bozulan: ${k}`), ...rapor.duzelenler.map((k) => `Düzelen: ${k}`), ...rapor.kronik.map((k) => `Kronik: ${k}`)], tanilar: rapor.tanilar.map((t) => ({ ...t, karsi: [] })), acil_bayrak: rapor.acil_bayrak, oneri: [rapor.klinik_iliski, rapor.oneri, rapor.recete_ipucu ? `Reçete ipucu (öneri): ${rapor.recete_ipucu}` : ''].filter(Boolean).join('\n'), sinirlar: rapor.sinirlar, hekim_tanisi: [], engines_used: ntp ? ['lab-trend-engine', 'ntp-kural', 'claude-writer'] : ['lab-trend-engine', 'claude-writer'], lab: { ...rapor, ozel: ozelSatirlar, ntp: ntp || undefined } }
    const { data: analiz, error } = await sb.from('belge_analizleri').insert({ belge_id: panel.belge_id, doctor_id: user.id, patient_id: panel.patient_id, brans: ntpMi ? 'pediatri' : bransKey, modality_final: 'lab', yas_ay: yasAy, cinsiyet: cinsiyet ? cinsiyet[0]?.toUpperCase() : null, de_id_hash: `lab:${panel.id}`, engine_set: `lab-v1(${(panel.kaynaklar || []).join('+')}${ntp ? '+ntp' : ''})`, durum: 'taslak', sonuc, motor_ciktilari: [{ motor: 'lab-trend-engine', surum: '1', tier: 'A', dogrulanmis: true, labels: [] }], fusion: { capPct: oncekiVar ? 85 : 70, acilNedenler: kritik, duzeltmeler, ham: yazim.ham.slice(0, 4000) } }).select('id').single()
    if (error || !analiz) return NextResponse.json({ error: 'Rapor kaydedilemedi' }, { status: 500 })
    await sb.from('lab_paneller').update({ analiz_id: analiz.id, durum: 'raporlandi', updated_at: new Date().toISOString() }).eq('id', panel.id)
    return NextResponse.json({ ok: true, analizId: analiz.id, acil: rapor.acil_bayrak })
  }
  return NextResponse.json({ error: 'Geçersiz adim' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (patientId) { // NOTYA-LAB-03: per-document summaries for the Belgeler list card
    const { data: paneller } = await sb.from('lab_paneller').select('id, belge_id, lab_adi, numune_tarihi, durum, created_at, panel_type, sample_no').eq('doctor_id', user.id).eq('patient_id', patientId).order('created_at', { ascending: false }).limit(60)
    const ids = (paneller || []).map((p) => p.id)
    const { data: rows } = ids.length ? await sb.from('lab_satirlar').select('panel_id, raw_name, canonical_key, flag, kritik, delta_pct, trend').in('panel_id', ids) : { data: [] }
    const ozet: Record<string, unknown> = {}
    for (const p of paneller || []) {
      if (ozet[p.belge_id]) continue // latest panel per document
      const rs = (rows || []).filter((x) => x.panel_id === p.id)
      const onemli = rs.filter((x) => x.flag === 'critical' || x.flag === 'H' || x.flag === 'L' || x.flag === 'pozitif_suphe' || x.flag === 'sinir' || x.flag === 'yetersiz_ornek').sort((a, b) => Number(b.kritik) - Number(a.kritik) || Math.abs(Number(b.delta_pct) || 0) - Math.abs(Number(a.delta_pct) || 0)).slice(0, 3).map((x) => `${x.canonical_key ? KANONIK[x.canonical_key as KanonikAnahtar]?.tr?.split(' ')[0] || x.canonical_key : x.raw_name} ${x.flag === 'L' || x.flag === 'yetersiz_ornek' ? '↓' : '↑'}`)
      ozet[p.belge_id] = { toplam: rs.length, yuksek: rs.filter((x) => x.flag === 'H' || x.flag === 'pozitif_suphe').length, dusuk: rs.filter((x) => x.flag === 'L').length, kritik: rs.filter((x) => x.kritik).length, onemli, durum: p.durum, lab_adi: p.lab_adi, numune_tarihi: p.numune_tarihi, panel_type: (p as { panel_type?: string }).panel_type || 'genel', sample_no: (p as { sample_no?: string | null }).sample_no || null }
    }
    return NextResponse.json({ ozet })
  }
  const documentId = req.nextUrl.searchParams.get('documentId')
  if (!documentId) return NextResponse.json({ error: 'documentId gerekli' }, { status: 400 })
  const { data: panel } = await sb.from('lab_paneller').select('*').eq('doctor_id', user.id).eq('belge_id', documentId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!panel) return NextResponse.json({ panel: null })
  const [{ data: rows }, { data: analiz }] = await Promise.all([
    sb.from('lab_satirlar').select('*').eq('panel_id', panel.id).order('sira'),
    panel.analiz_id ? sb.from('belge_analizleri').select('id, durum, sonuc, fusion, hekim_tanisi, hekim_ozet, note_id, onaylandi_at').eq('id', panel.analiz_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return NextResponse.json({ panel: { ...panel, extract_json: undefined }, satirlar: rows || [], analiz: analiz || null, kanonik: Object.fromEntries(Object.entries(KANONIK).map(([k, v]) => [k, v.tr])) })
}
