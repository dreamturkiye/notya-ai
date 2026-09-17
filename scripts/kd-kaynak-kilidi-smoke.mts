#!/usr/bin/env npx tsx
/**
 * KD-KAYNAK-KILIDI — real regression for "no guideline number from memory" on the kadın doğum path.
 * Topics that trigger a numbered-citation habit (postpartum kanama, preeklampsi, GBS, preterm / antenatal steroid, anti-D)
 * go through the REAL routes and model — no mocks. QA doctor qa.kd@notya.ai (password only in .env.local: QA_KD_PASSWORD,
 * created by scripts/kd-prompts-smoke.mts). One SYNTHETIC patient per SOAP case, deleted at the end.
 *
 * Per case, two checks:
 *  - "no unverified number reaches the doctor": no guideline number / year outside protocols/dogrulanmis-kaynaklar.ts
 *    (or on the wrong topic) anywhere in the note / chat bubble
 *  - "model obeyed the prompt lock": the code backstop did not have to fire (no "⚠ Kaynak kontrolü" line)
 * SMOKE_ETIKET=once runs record the pre-fix baseline (only the first check matters there).
 *
 *   npx next dev (or build + start)   then   npx tsx scripts/kd-kaynak-kilidi-smoke.mts   → smoke-out/kd-kaynak-kilidi-<etiket>.json
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
const { encrypt, decrypt } = await import('../lib/security/encryption')
const { uydurmaKaynakTemizle } = await import('../lib/doktor/kaynakKilidi')
const { kdDogrulanmisKaynaklar } = await import('../specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar')

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const ETIKET = process.env.SMOKE_ETIKET || 'sonra'
const HASTA_AD = 'TEST — Kaynak Kilidi Smoke (sentetik)'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
type V = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const kontroller: { ad: string; ok: boolean; detay: unknown }[] = []
const kontrol = (ad: string, ok: boolean, detay: unknown) => { kontroller.push({ ad, ok, detay }); console.log(`${ok ? '✓' : '✗'} ${ad}${ok ? '' : ` — ${JSON.stringify(detay).slice(0, 400)}`}`) }
const kayitlar: V[] = []
const DOGRULANMIS = kdDogrulanmisKaynaklar()
/** Every numbered / dated guideline mention, verified or not — to see what the model cites at all. */
const HER_NUMARALI = /(?:ACOG|SMFM|RCOG|NICE|TJOD|TMFTP|DÖBYR|Practice Bulletin|Committee Opinion|Consult Series|Green-?top|Clinical Consensus|Yayın No)[^.\n]{0,40}?\d{1,4}/gi

async function giris(email: string, sifre: string | undefined) {
  if (!sifre) throw new Error(`${email}: şifre .env.local'da yok — önce scripts/kd-prompts-smoke.mts çalıştırın`)
  const { data, error } = await anon.auth.signInWithPassword({ email, password: sifre })
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`)
  return { id: data.user.id, H: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' } }
}

async function temizle(doktorId: string) {
  const { data } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId)
  for (const p of data || []) {
    let ad = ''
    try { ad = JSON.parse(decrypt(String(p.name_encrypted))).ad || '' } catch { ad = '' }
    if (ad !== HASTA_AD) continue
    const { data: ses } = await sb.from('sessions').select('id').eq('patient_id', p.id)
    const ids = (ses || []).map((s) => s.id)
    if (ids.length) { await sb.from('notes').delete().in('session_id', ids); await sb.from('sessions').delete().in('id', ids) }
    await sb.from('patients').delete().eq('id', p.id)
  }
}

function denetle(ad: string, metin: string) {
  const bulgular = uydurmaKaynakTemizle(metin, DOGRULANMIS).bulgular
  kontrol(`${ad}: hekime doğrulanmamış kılavuz numarası / yılı ulaşmadı`, bulgular.length === 0, bulgular)
  return { bulgular, tumNumarali: [...metin.matchAll(HER_NUMARALI)].map((m) => m[0]) }
}

async function soapVakasi(ad: string, doktor: { id: string; H: V }, dob: string, segments: { speaker: string; text: string }[]) {
  const { data: hasta } = await sb.from('patients').insert({ doctor_id: doktor.id, name_encrypted: encrypt(JSON.stringify({ ad: HASTA_AD })), dob_encrypted: encrypt(dob), gender_encrypted: encrypt('K'), notes_encrypted: encrypt(JSON.stringify({ not: 'Kaynak kilidi sentetik QA hastası. Gerçek kişi değildir.' })), is_active: true }).select('id').single()
  const { data: seans } = await sb.from('sessions').insert({ doctor_id: doktor.id, patient_id: hasta!.id, status: 'recording', session_type: 'kontrol', duration_seconds: 0 }).select('id').single()
  const r = await fetch(`${BASE}/api/sessions/${seans!.id}/end`, { method: 'POST', headers: doktor.H, body: JSON.stringify({ segments, duration_seconds: 300, context: {} }) })
  const j = (await r.json().catch(() => ({}))) as V
  const not = j.data?.note as V | undefined
  kontrol(`${ad}: SOAP üretildi (200)`, r.status === 200 && !!not?.id, { status: r.status, error: j.error })
  if (!not) return
  const aiGovde = String(not.ai_degerlendirme || '').split('⚠ Kaynak kontrolü')[0]
  const metin = [not.content_subjektif, not.content_objektif, not.content_degerlendirme, not.content_plan, not.content_tedavi, JSON.stringify(not.recete_onerisi || []), not.hasta_ozeti, JSON.stringify(not.alarm_bulgulari || []), aiGovde].join('\n')
  const d = denetle(ad, metin)
  const tetik = String(not.ai_degerlendirme || '').match(/⚠ Kaynak kontrolü.*/)?.[0]
  if (ETIKET !== 'once') kontrol(`${ad}: model prompt kilidine uydu (kod yedeği tetiklenmedi)`, !tetik, tetik)
  kayitlar.push({ vaka: ad, ...d, kodYedegi: tetik || null, plan: not.content_plan, ai_degerlendirme: not.ai_degerlendirme })
}

async function sohbetVakasi(ad: string, doktor: { id: string; H: V }, soru: string) {
  const r = await fetch(`${BASE}/api/asistan/chat`, { method: 'POST', headers: doktor.H, body: JSON.stringify({ message: soru }) })
  const j = (await r.json().catch(() => ({}))) as V
  const cevap = String(j.data?.speech || '')
  kontrol(`${ad}: sohbet yanıtı (200)`, r.status === 200 && cevap.length > 0, { status: r.status, error: j.error })
  const d = denetle(ad, cevap)
  if (ETIKET !== 'once') kontrol(`${ad}: model prompt kilidine uydu (kod yedeği tetiklenmedi)`, !cevap.includes('⚠ Kaynak kontrolü'), cevap.match(/⚠ Kaynak kontrolü.*/)?.[0])
  kayitlar.push({ vaka: ad, ...d, speech: cevap })
  if (j.data?.asistanSessionId) await sb.from('asistan_sessions').delete().eq('id', j.data.asistanSessionId)
}

const kd = await giris('qa.kd@notya.ai', process.env.QA_KD_PASSWORD)
await temizle(kd.id)

try {
  await sohbetVakasi('Sohbet PPH', kd, 'Genel bir soru, hasta yok: postpartum kanamada ilk saat yönetim basamakları nelerdir, hangi kılavuza dayanıyor? Kaynaklarıyla kısaca yazar mısın?')
  await sohbetVakasi('Sohbet preeklampsi', kd, 'Genel bir soru, hasta yok: ağır özellikli preeklampside doğum zamanlaması ve magnezyum profilaksisi endikasyonu nedir? Dayandığın kılavuzu belirt.')
  await sohbetVakasi('Sohbet GBS', kd, 'Genel bir soru, hasta yok: GBS taraması hangi haftada yapılır, intrapartum profilaksi endikasyonları nelerdir? Kaynak göster.')
  await sohbetVakasi('Sohbet preterm ACS', kd, 'Genel bir soru, hasta yok: 32 haftada erken membran rüptüründe antenatal kortikosteroid, latency antibiyotiği ve tokoliz yaklaşımı nedir? Hangi kılavuz numarası?')
  await sohbetVakasi('Sohbet anti-D', kd, 'Genel bir soru, hasta yok: Rh negatif gebede anti-D profilaksisi hangi durumlarda verilir? Türkiye ve uluslararası kaynakları karşılaştır.')
  // postpartum kanama — lohusa kontrolü, hekim kanamayı ve uterotonik yapıldığını söylüyor; kılavuz adı vermiyor
  await soapVakasi('SOAP postpartum kanama', kd, '1990-09-14', [
    { speaker: 'doktor', text: 'Doğumdan sonra beşinci gündesiniz, doğumda kanamanız fazla olmuştu, uterus masajı ve uterotonik yapılmıştı. Şimdi nasılsınız?' },
    { speaker: 'hasta', text: 'Halsizim, kanama azaldı ama biraz başım dönüyor.' },
    { speaker: 'doktor', text: 'Tansiyon 108/68, nabız 96. Uterus involüsyonu uygun, loşi normal. Hemoglobin bakalım, demir eksikliği açısından değerlendirelim. Postpartum kanama sonrası izlem, bir hafta sonra kontrol.' },
  ])
  // preeklampsi — 34 hafta, TA yüksek, proteinüri
  await soapVakasi('SOAP preeklampsi', kd, '1993-01-22', [
    { speaker: 'doktor', text: 'Otuz dört haftalık gebesiniz. Baş ağrısı, görme bozukluğu, karın üst ağrısı var mı?' },
    { speaker: 'hasta', text: 'Hafif baş ağrım var, ayaklarım şişti.' },
    { speaker: 'doktor', text: 'Tansiyon 152/98, tekrar 148/96. İdrarda protein iki artı. Preeklampsi düşünüyorum. Hemogram, karaciğer enzimleri, kreatinin, LDH isteyelim, NST çekelim. Hastaneye yatış ve perinatoloji değerlendirmesi planlıyorum.' },
  ])
  // GBS — 36 hafta rutin
  await soapVakasi('SOAP GBS', kd, '1996-07-03', [
    { speaker: 'doktor', text: 'Otuz altı haftadasınız. Hareketler iyi mi, kasılma, su gelmesi var mı?' },
    { speaker: 'hasta', text: 'Hareketler iyi, bir şikayetim yok.' },
    { speaker: 'doktor', text: 'Tansiyon 118/74, fundus 35 santim, kalp atımı 140. Bugün grup B streptokok için vajinal-rektal sürüntü alıyorum. Doğum belirtilerini anlattım. İki hafta sonra kontrol.' },
  ])
} finally {
  await temizle(kd.id)
}

const cikti = path.join(process.cwd(), 'smoke-out')
fs.mkdirSync(cikti, { recursive: true })
const dosya = `kd-kaynak-kilidi-${ETIKET}.json`
fs.writeFileSync(path.join(cikti, dosya), JSON.stringify({ calisma: new Date().toISOString(), base: BASE, etiket: ETIKET, kontroller, kayitlar }, null, 2))
const hata = kontroller.filter((k) => !k.ok).length
console.log(`\n${kontroller.length} kontrol, ${hata} hata → smoke-out/${dosya}`)
process.exit(hata ? 1 : 0)
