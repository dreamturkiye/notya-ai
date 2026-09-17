#!/usr/bin/env npx tsx
/**
 * KASA-BELGE-SMOKE — Dr. Gökhan'ın canlı bildirimi ("Kasa'daki belge açılmıyor") için
 * gerçek yükleme yolu: QA doktoru (qa.dahiliye@notya.ai, sentetik) + sentetik hasta +
 * sentetik lab PDF'i. Türkçe karakterli (NFD) dosya adı bilerek kullanılır.
 *
 *   npm run dev -- -p 3100
 *   npx --yes tsx scripts/kasa-belge-smoke.mts
 *
 * smoke-out/kasa-belge.json yazar; hata varsa çıkış kodu 1.
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}

const { encrypt, decrypt } = await import('../lib/security/encryption')
const { sentetikLabPdf } = await import('../core/lab/fixtures/sentetikLabPdf')

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3100').replace(/\/$/, '')
const QA_EMAIL = 'qa.dahiliye@notya.ai'
const HASTA_AD = 'TEST — Kasa Belge Smoke (sentetik)'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })

const kontroller: { ad: string; ok: boolean; not?: string }[] = []
const kontrol = (ad: string, ok: boolean, not?: string) => { kontroller.push({ ad, ok, not }); console.log(`${ok ? '✓' : '✗'} ${ad}${not ? ` — ${not}` : ''}`) }

// ── QA doktoru (sentetik) ────────────────────────────────────────────────────
const sifre = process.env.QA_DAHILIYE_PASSWORD
if (!sifre) throw new Error('QA_DAHILIYE_PASSWORD .env.local içinde yok')
const { data: s, error: sErr } = await anon.auth.signInWithPassword({ email: QA_EMAIL, password: sifre })
if (sErr || !s.session) throw new Error(`signIn: ${sErr?.message}`)
const token = s.session.access_token
const doctorId = s.session.user.id

// ── Sentetik hasta (önce temizle) ────────────────────────────────────────────
const { data: mevcut } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId)
for (const p of mevcut || []) {
  let ad = ''
  try { ad = JSON.parse(decrypt(String(p.name_encrypted))).ad || '' } catch { ad = '' }
  if (ad !== HASTA_AD) continue
  await sb.from('medical_documents').delete().eq('patient_id', p.id)
  await sb.from('patients').delete().eq('id', p.id)
}
const { data: hasta, error: hErr } = await sb.from('patients').insert({
  doctor_id: doctorId,
  name_encrypted: encrypt(JSON.stringify({ ad: HASTA_AD })),
  dob_encrypted: encrypt('1970-01-01'),
  gender_encrypted: encrypt('K'),
  notes_encrypted: encrypt(JSON.stringify({ not: 'KASA-BELGE-SMOKE sentetik QA hastası. Gerçek kişi değildir.' })),
  is_active: true,
}).select('id').single()
if (hErr || !hasta) throw new Error(`patients: ${hErr?.message}`)
const patientId = String(hasta.id)

// ── Yükleme: Dr. Gökhan'ınkiyle aynı biçimde Türkçe karakterli ad ───────────
// macOS dosya adlarını NFD (ayrışmış) verir: "İ" = "I" + U+0307, "ç" = "c" + U+0327.
const AD_NFC = 'Hasta İki laboratuvar sonuçları.pdf'
const AD_NFD = AD_NFC.normalize('NFD')
const pdf = sentetikLabPdf('2026-09-10', '2026-09-11', 'TEST Sentetik Hasta')

const form = new FormData()
form.append('file', new File([new Uint8Array(pdf)], AD_NFD, { type: 'application/pdf' }))
form.append('patientId', patientId)
form.append('category', 'Lab Sonucu')
const up = await fetch(`${BASE}/api/doktor/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
const upJson = await up.json().catch(() => ({}))
kontrol('Kasaya yükleme 201', up.status === 201, `HTTP ${up.status} ${upJson.error || ''}`)
const belgeId = upJson?.document?.id
if (!belgeId) throw new Error('documentId yok')

// ── 1. Dosya adı Türkçe karakterleri korudu mu? ──────────────────────────────
const kayitliAd: string = upJson.document.fileName
kontrol('Dosya adı Türkçe karakterleri koruyor (altçizgi yok)', kayitliAd.normalize('NFC') === AD_NFC, `kayıtlı: "${kayitliAd}"`)

// ── 2. Liste aynı adı gösteriyor mu? ────────────────────────────────────────
const liste = await fetch(`${BASE}/api/doktor/documents?patientId=${patientId}`, { headers: { Authorization: `Bearer ${token}` } })
const listeJson = await liste.json()
const listeAd = (listeJson.documents || []).find((d: { id: string }) => d.id === belgeId)?.fileName
kontrol('Kasa listesindeki ad doğru', String(listeAd).normalize('NFC') === AD_NFC, `liste: "${listeAd}"`)

// ── 3. İndirme (bayt + başlık) ───────────────────────────────────────────────
const dl = await fetch(`${BASE}/api/doktor/documents/${belgeId}/download`, { headers: { Authorization: `Bearer ${token}` } })
const gelen = Buffer.from(await dl.arrayBuffer())
kontrol('İndirme 200', dl.ok, `HTTP ${dl.status}`)
kontrol('İndirilen bayt yüklenenle aynı', gelen.length === pdf.length && gelen.equals(pdf), `${gelen.length} / ${pdf.length} bayt`)
kontrol('Content-Type application/pdf', dl.headers.get('content-type') === 'application/pdf', String(dl.headers.get('content-type')))
const cd = dl.headers.get('content-disposition') || ''
kontrol('Content-Disposition inline', cd.startsWith('inline'), cd)
kontrol('Content-Disposition Türkçe adı bozmuyor (RFC 5987)', /filename\*=UTF-8''/.test(cd), cd)

// ── 4. CSP: blob: iframe + PDF eklentisi ────────────────────────────────────
const sayfa = await fetch(`${BASE}/dashboard/doktor/belgeler`)
const csp = sayfa.headers.get('content-security-policy') || ''
const direktif = (ad: string) => (csp.split(';').map((x) => x.trim()).find((x) => x.startsWith(ad + ' ')) || '')
kontrol('CSP frame-src blob: içeriyor', direktif('frame-src').includes('blob:'), direktif('frame-src') || '(yok)')

// ── 5. Kasa → "Asistana raporla" → Onayla → muayene formu (gerçek boru hattı) ─
// Dr. Gökhan'ın ikinci sorusu: kasadaki lab PDF'i AI değerlendirmesine ve muayeneye gidiyor mu?
const labApi = async (body: Record<string, unknown>) => {
  const r = await fetch(`${BASE}/api/doktor/belgeler/lab`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${body.adim}: HTTP ${r.status} ${j.error || ''}`)
  return j
}
let panelId = ''
let analizId = ''
let notMetni = ''
if (process.env.KASA_SMOKE_AI === '0') {
  console.log('… AI adımları atlandı (KASA_SMOKE_AI=0)')
} else {
  const cikar = await labApi({ adim: 'cikar', documentId: belgeId })
  const labGet = await fetch(`${BASE}/api/doktor/belgeler/lab?documentId=${belgeId}`, { headers: { Authorization: `Bearer ${token}` } })
  const labJson = await labGet.json()
  panelId = labJson?.panel?.id || ''
  kontrol('Kasa belgesinden lab tablosu çıkarıldı', (cikar?.ozet?.toplam || 0) > 0 && !!panelId, `${cikar?.ozet?.toplam} satır`)
  await labApi({ adim: 'tablo_onayla', panelId })
  await labApi({ adim: 'raporla', panelId })
  const a1 = await (await fetch(`${BASE}/api/doktor/belgeler/analiz?documentId=${belgeId}`, { headers: { Authorization: `Bearer ${token}` } })).json()
  analizId = a1?.analiz?.id || ''
  kontrol('Asistan taslak değerlendirme yazdı', !!a1?.analiz?.sonuc?.lab?.ozet, String(a1?.analiz?.sonuc?.lab?.ozet || '').slice(0, 90))

  // Onayla, hekim tanısı kilitlenmeden reddedilmeli (hekim kapısı)
  const erken = await fetch(`${BASE}/api/doktor/belgeler/analiz/onayla`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId, adim: 'onayla' }) })
  kontrol('Hekim tanısı kilitlenmeden Onayla reddediliyor', erken.status === 400, `HTTP ${erken.status}`)

  await fetch(`${BASE}/api/doktor/belgeler/analiz`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId, alan: 'hekim_tanisi', sonraki: [{ ad: 'Tip 2 diabetes mellitus', icd10: 'E11.9' }] }) })
  const onay = await fetch(`${BASE}/api/doktor/belgeler/analiz/onayla`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId, adim: 'onayla' }) })
  kontrol('Onayla → muayeneye eklendi', onay.ok, `HTTP ${onay.status}`)

  const { data: an } = await sb.from('belge_analizleri').select('note_id, durum').eq('id', analizId).maybeSingle()
  const { data: not } = await sb.from('notes').select('content_objektif').eq('id', an?.note_id).maybeSingle()
  notMetni = String(not?.content_objektif || '')
  kontrol('Muayene Objektif bölümünde lab bloğu var', notMetni.includes('[Lab]') && notMetni.includes('E11.9'), notMetni.split('\n')[0]?.slice(0, 90))
}

const cikti = path.join(process.cwd(), 'smoke-out')
fs.mkdirSync(cikti, { recursive: true })
fs.writeFileSync(path.join(cikti, 'kasa-belge.json'), JSON.stringify({ patientId, belgeId, kayitliAd, panelId, analizId, csp, notMetni, kontroller, auth: { access_token: token } }, null, 2))
const hata = kontroller.filter((k) => !k.ok).length
console.log(`\n${kontroller.length} kontrol, ${hata} hata → smoke-out/kasa-belge.json`)
process.exit(hata ? 1 : 0)
