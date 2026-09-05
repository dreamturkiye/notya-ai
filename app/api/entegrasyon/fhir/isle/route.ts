export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * NOTYA-FHIR-01 — Export worker (cron-safe). ZERO-TOUCH design: this route POLLS for
 * approved notes by kurum-linked doctors instead of hooking the approve endpoint —
 * the core Notya flow has no knowledge this module exists.
 *
 * Flow per active kurum: find approved notes by linked doctors not yet queued →
 * map (fhirMapper) → POST transaction Bundle to the kurum FHIR endpoint (OAuth2
 * client-credentials when configured; none for the HAPI sandbox) → record status +
 * audit. Idempotent via unique(note_id, kurum_id). Batch-capped per run.
 *
 * Auth: x-entegrasyon-anahtar header must equal ENTEGRASYON_CRON_SECRET (new env,
 * additive). KVKK: exports fire only for kurum rows with aktif=true — nothing is
 * active by default, and the HAPI sandbox profile is seeded aktif=false.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notuFhirBundleYap, type FhirNotGirdisi } from '@/lib/entegrasyon/fhirMapper'
import { decryptPII } from '@/lib/security/encryption'
import { kritikAlarm } from '@/lib/alarm'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PARTI_BOYU = 5

// P2 — onaylı notun kendi kendine yeten HTML belgesi (DocumentReference içeriği).
function htmlBelgeYap(b: { kurumAd: string; hastaAd: string; doktorAd: string; tarih: string; bolumler: [string, string][] }): string {
  const kacir = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')
  const govde = b.bolumler.filter(([, m]) => m && m.trim()).map(([baslik, metin]) =>
    `<h2 style="font:600 13px system-ui;color:#0F9B8E;border-bottom:1px solid #ddd;padding-bottom:4px;margin:18px 0 6px">${baslik}</h2><p style="font:12px/1.6 system-ui;color:#111;white-space:normal">${kacir(metin)}</p>`
  ).join('')
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Muayene Notu</title></head><body style="max-width:720px;margin:24px auto;padding:0 16px">` +
    `<div style="font:700 18px system-ui;color:#0A1628">MUAYENE NOTU</div>` +
    `<div style="font:11px system-ui;color:#555;margin:4px 0 14px">${kacir(b.hastaAd)} · ${kacir(b.doktorAd)} · ${new Date(b.tarih).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} (TRT) · ${kacir(b.kurumAd)}</div>` +
    govde +
    `<div style="font:10px system-ui;color:#888;margin-top:22px">Bu belge Notya™ tarafından üretilmiş, doktor tarafından incelenip onaylanmış muayene notudur.</div></body></html>`
}

async function oauthToken(tokenUrl: string, clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
    })
    const d = await r.json()
    return d.access_token || null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-entegrasyon-anahtar') !== process.env.ENTEGRASYON_CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  return calistir()
}

// P2 — Vercel cron girişi (evin deseni: x-vercel-cron ya da ?secret=CRON_SECRET).
export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret')
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }
  return calistir()
}

async function calistir() {
  const sb = getSupabase()
  const rapor: Record<string, unknown>[] = []

  const { data: kurumlar } = await sb.from('kurum_entegrasyonlari').select('*').eq('aktif', true)
  for (const kurum of kurumlar || []) {
    const { data: uyeler } = await sb.from('kurum_doktorlar').select('doctor_id').eq('kurum_id', kurum.id)
    const doktorIdler = (uyeler || []).map((u) => u.doctor_id)
    if (doktorIdler.length === 0) continue

    // Approved notes by linked doctors, not yet queued for this kurum
    const { data: notlar } = await sb
      .from('notes')
      .select('id, created_at, doctor_id, status, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_anamnez, content_fizik_muayene, content_tani, content_tedavi, icd10_codes, vitaller, basvuru_yakinmasi, recete_onerisi, sessions!inner(patient_id, context)')
      .in('doctor_id', doktorIdler)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(40)
    if (!notlar?.length) continue

    const { data: kuyruktakiler } = await sb.from('fhir_export_kuyruk').select('note_id').eq('kurum_id', kurum.id).in('note_id', notlar.map((n) => n.id))
    const kuyrukSeti = new Set((kuyruktakiler || []).map((k) => k.note_id))
    const adaylar = notlar.filter((n) => !kuyrukSeti.has(n.id)).slice(0, PARTI_BOYU)

    let token: string | null = null
    if (kurum.oauth_token_url && kurum.oauth_client_id) {
      token = await oauthToken(kurum.oauth_token_url, kurum.oauth_client_id, kurum.oauth_client_secret || '')
      if (!token) {
        await sb.from('fhir_audit').insert({ kurum_id: kurum.id, islem: 'oauth', sonuc: 'HATA', detay: 'token alınamadı' })
        continue
      }
    }

    for (const not of adaylar) {
      const seans = Array.isArray(not.sessions) ? not.sessions[0] : not.sessions
      const patientId = (seans as { patient_id?: string } | null)?.patient_id
      // KVKK gereği hasta alanları şifreli; TC kimlik yalnız HASH olarak durur ve tasarımı
      // gereği DİŞARI VERİLEMEZ — kimlik: çözülmüş ad + doğum tarihi + Notya UUID; kurum
      // MRN eşlemesi P3 onboarding'de yapılır (standart pratik).
      const coz = (x: string | null): string | null => { try { return x ? decryptPII(x) : null } catch { return null } }
      let hasta = { id: patientId || 'bilinmiyor', adSoyad: 'Bilinmiyor', tcKimlik: null as string | null, dogumTarihi: null as string | null, cinsiyet: null as string | null, mrn: null as string | null }
      if (patientId) {
        const { data: h } = await sb.from('patients').select('id, name_encrypted, dob_encrypted, gender_encrypted').eq('id', patientId).maybeSingle()
        if (h) hasta = { id: h.id, adSoyad: coz(h.name_encrypted) || 'Bilinmiyor', tcKimlik: null, dogumTarihi: coz(h.dob_encrypted), cinsiyet: coz(h.gender_encrypted), mrn: null }
      }
      const { data: dr } = await sb.from('users').select('id, full_name, specialty').eq('id', not.doctor_id).maybeSingle()

      const girdi: FhirNotGirdisi = {
        noteId: not.id, createdAt: not.created_at,
        basvuruYakinmasi: not.basvuru_yakinmasi,
        subjektif: not.content_subjektif, objektif: not.content_objektif,
        degerlendirme: not.content_degerlendirme, plan: not.content_plan,
        anamnez: not.content_anamnez, fizikMuayene: not.content_fizik_muayene,
        tani: not.content_tani, tedavi: not.content_tedavi,
        icd10: not.icd10_codes, vitaller: not.vitaller, receteOnerisi: not.recete_onerisi,
        hasta,
        doktor: { id: not.doctor_id, adSoyad: dr?.full_name || 'Doktor', brans: dr?.specialty },
        kurumAd: kurum.ad,
        belgeHtmlBase64: Buffer.from(htmlBelgeYap({
          kurumAd: kurum.ad, hastaAd: hasta.adSoyad, doktorAd: dr?.full_name || 'Doktor', tarih: not.created_at,
          bolumler: [
            ['Başvuru Yakınması', not.basvuru_yakinmasi || ''],
            ['Anamnez', not.content_anamnez || not.content_subjektif || ''],
            ['Fizik Muayene', not.content_fizik_muayene || not.content_objektif || ''],
            ['Tanı', not.content_tani || not.content_degerlendirme || ''],
            ['Tedavi', not.content_tedavi || not.content_plan || ''],
          ],
        }), 'utf8').toString('base64'),
      }
      const bundle = notuFhirBundleYap(girdi)

      const { data: kayit } = await sb.from('fhir_export_kuyruk')
        .insert({ note_id: not.id, kurum_id: kurum.id, durum: 'pending', fhir_bundle: bundle })
        .select('id').single()

      try {
        const r = await fetch(kurum.fhir_base_url.replace(/\/$/, ''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/fhir+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(bundle),
        })
        const yanit = (await r.text()).slice(0, 800)
        const basarili = r.status >= 200 && r.status < 300
        await sb.from('fhir_export_kuyruk').update({ durum: basarili ? 'sent' : 'failed', deneme: 1, yanit, sent_at: basarili ? new Date().toISOString() : null }).eq('id', kayit!.id)
        await sb.from('fhir_audit').insert({ note_id: not.id, kurum_id: kurum.id, islem: 'export', sonuc: basarili ? 'OK ' + r.status : 'HATA ' + r.status, detay: yanit.slice(0, 300) })
        rapor.push({ kurum: kurum.ad, note: not.id, durum: basarili ? 'sent' : 'failed', http: r.status })
        if (!basarili) await kritikAlarm('FHIR export hatasi', `${kurum.ad} / not ${not.id} / HTTP ${r.status}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await sb.from('fhir_export_kuyruk').update({ durum: 'failed', deneme: 1, yanit: msg.slice(0, 400) }).eq('id', kayit!.id)
        await sb.from('fhir_audit').insert({ note_id: not.id, kurum_id: kurum.id, islem: 'export', sonuc: 'HATA', detay: msg.slice(0, 300) })
        rapor.push({ kurum: kurum.ad, note: not.id, durum: 'failed', hata: msg.slice(0, 120) })
      }
    }
  }

  return NextResponse.json({ success: true, islenen: rapor.length, rapor })
}
