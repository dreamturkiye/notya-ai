#!/usr/bin/env npx tsx
/**
 * KD-PROMPTS-LOCK — runtime proof that specialties/kadin-dogum/prompts is loaded on the real call paths,
 * and that the shared SOAP rules no longer bleed pediatric growth-percentile / veli wording (DAH-PROMPTS-FU).
 * Dedicated QA doctor qa.kd@notya.ai (users.specialty = 'kadin-dogum', the value real KD profiles carry; password only
 * in .env.local as QA_KD_PASSWORD, generated on first run). One SYNTHETIC patient, deleted at the end.
 *
 *  1. GET  /api/doktor/hafiza       → sesBlogu carries the compact KD lock read from system.md (deterministic)
 *  2. POST /api/sessions/[id]/end   → real SOAP generation without context.specialty (users.specialty fallback);
 *                                     no Neyzi / büyüme persentili / veli wording anywhere in the note
 *  3. POST /api/asistan/chat        → high-risk ikili tarama question; answer should say screen ≠ diagnosis and
 *                                     point to NIPT / invasive test consent (model output — recorded, checked loosely)
 *
 *   npx next build && npx next start   then   npx tsx scripts/kd-prompts-smoke.mts   → smoke-out/kd-prompts-smoke.json
 */
import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const envPath = path.join(process.cwd(), '.env.local')
for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
const { encrypt, decrypt } = await import('../lib/security/encryption')

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const QA_EMAIL = 'qa.kd@notya.ai'
const QA_AD = 'QA Kadın Doğum (TEST hesabı)'
const HASTA_AD = 'TEST — KD Prompt Kilidi Smoke (sentetik)'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
type V = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

async function qaDoktor(): Promise<{ id: string; token: string }> {
  let sifre = process.env.QA_KD_PASSWORD || ''
  const yeniSifre = () => { sifre = `Qa-${randomBytes(18).toString('base64url')}`; fs.appendFileSync(envPath, `\n# KD-PROMPTS-LOCK QA doktor (qa.kd@notya.ai) — yalnız yerel, commit edilmez\nQA_KD_PASSWORD=${sifre}\n`) }
  let id: string | null = null
  for (let page = 1; page <= 20 && !id; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    id = data.users.find((u) => u.email === QA_EMAIL)?.id || null
    if (data.users.length < 200) break
  }
  if (!id) {
    if (!sifre) yeniSifre()
    const { data, error } = await sb.auth.admin.createUser({ email: QA_EMAIL, password: sifre, email_confirm: true, user_metadata: { full_name: QA_AD, specialty: 'kadin-dogum', qa: true } })
    if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
    id = data.user.id
    console.log(`QA doktor oluşturuldu: ${QA_EMAIL}`)
  } else if (!sifre) {
    yeniSifre()
    const { error } = await sb.auth.admin.updateUserById(id, { password: sifre })
    if (error) throw new Error(`updateUser: ${error.message}`)
  }
  const { error: uErr } = await sb.from('users').upsert({ id, email: QA_EMAIL, full_name: QA_AD, specialty: 'kadin-dogum', updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (uErr) throw new Error(`users upsert: ${uErr.message}`)
  const { data: s, error: sErr } = await anon.auth.signInWithPassword({ email: QA_EMAIL, password: sifre })
  if (sErr || !s.session) throw new Error(`signIn: ${sErr?.message}`)
  return { id, token: s.session.access_token }
}

const kontroller: { ad: string; ok: boolean; detay: unknown }[] = []
const kontrol = (ad: string, ok: boolean, detay: unknown) => { kontroller.push({ ad, ok, detay }); console.log(`${ok ? '✓' : '✗'} ${ad}${ok ? '' : ` — ${JSON.stringify(detay).slice(0, 300)}`}`) }

const { id: doktorId, token } = await qaDoktor()
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function temizle() {
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

await temizle()
const { data: hasta } = await sb.from('patients').insert({ doctor_id: doktorId, name_encrypted: encrypt(JSON.stringify({ ad: HASTA_AD })), dob_encrypted: encrypt('1994-06-11'), gender_encrypted: encrypt('K'), notes_encrypted: encrypt(JSON.stringify({ not: 'KD-PROMPTS-LOCK sentetik QA hastası. Gerçek kişi değildir.' })), is_active: true }).select('id').single()
const { data: seans } = await sb.from('sessions').insert({ doctor_id: doktorId, patient_id: hasta!.id, status: 'recording', session_type: 'kontrol', duration_seconds: 0 }).select('id').single()

// 1. hafıza / voice
const hafiza = (await (await fetch(`${BASE}/api/doktor/hafiza`, { headers: H })).json()) as V
kontrol('hafıza sesBlogu: KD system.md kısa kilidi yüklendi', /KADIN HASTALIKLARI VE DOĞUM KİLİDİ/.test(hafiza.sesBlogu) && /locked to Kadın Hastalıkları ve Doğum/.test(hafiza.sesBlogu) && /uzman onay/.test(hafiza.sesBlogu) && !/DAHİLİYE/.test(hafiza.sesBlogu), String(hafiza.sesBlogu || '').slice(0, 200))

// 2. SOAP (context.specialty yok → users.specialty)
const segments = [
  { speaker: 'doktor', text: 'Merhaba, gebelik kontrolüne geldiniz. Son adet tarihiniz 12 Mart, bugün 27 hafta 2 gün. Bebek hareketleri nasıl?' },
  { speaker: 'hasta', text: 'Hareketler iyi. Kanama ya da su gelmesi yok. Arada başım ağrıyor ama geçiyor. Demir hapını bazen unutuyorum.' },
  { speaker: 'doktor', text: 'Tansiyonunuz 128/82, kilonuz 71 kilo, boyunuz 164. Fundus 27 santim, bebeğin kalp atımı 145. Ödem yok. Kan grubunuz A Rh negatif, indirekt Coombs negatifti; 28. haftada anti-D yapacağız. 50 gram yükleme testi yapılmadı, bugün isteyelim. Dört hafta sonra kontrol.' },
]
const t0 = Date.now()
const endR = await fetch(`${BASE}/api/sessions/${seans!.id}/end`, { method: 'POST', headers: H, body: JSON.stringify({ segments, duration_seconds: 300, context: {} }) })
const endJ = (await endR.json().catch(() => ({}))) as V
const not = endJ.data?.note as V | undefined
kontrol('SOAP üretimi (KD kilidi yüklü, 200)', endR.status === 200 && !!not?.id, { status: endR.status, error: endJ.error })
const notMetni = JSON.stringify([not?.content_subjektif, not?.content_objektif, not?.content_degerlendirme, not?.content_plan, not?.ai_degerlendirme, not?.hasta_ozeti, not?.alarm_bulgulari])
kontrol('SOAP: pediatrik büyüme persentili / Neyzi / veli dili yok (erişkin gebe notu)', !!not && !/persentil|Neyzi|büyüme|veli/i.test(notMetni), notMetni.match(/.{0,60}(persentil|Neyzi|büyüme|veli).{0,60}/i)?.[0])

// 3. chat
const chatR = await fetch(`${BASE}/api/asistan/chat`, { method: 'POST', headers: H, body: JSON.stringify({ message: 'Genel bir soru, hasta yok: 12 haftalık gebede ikili tarama yüksek risk çıktı. Bu down sendromu tanısı mı, ne yapalım?' }) })
const chatJ = (await chatR.json().catch(() => ({}))) as V
const cevap = String(chatJ.data?.speech || '')
kontrol('Chat: tarama ≠ tanı, NIPT / invaziv test onam yolu', chatR.status === 200 && /tanı değil|tanı koymaz|tanısal değil|tarama testi/i.test(cevap) && /NIPT|amniyosentez|CVS|koryon/i.test(cevap), cevap)
if (chatJ.data?.asistanSessionId) await sb.from('asistan_sessions').delete().eq('id', chatJ.data.asistanSessionId)

const cikti = path.join(process.cwd(), 'smoke-out')
fs.mkdirSync(cikti, { recursive: true })
fs.writeFileSync(path.join(cikti, 'kd-prompts-smoke.json'), JSON.stringify({ calisma: new Date().toISOString(), base: BASE, kontroller, sesBlogu: hafiza.sesBlogu, soap: not && { specialty: not.specialty, subjektif: not.content_subjektif, objektif: not.content_objektif, degerlendirme: not.content_degerlendirme, plan: not.content_plan, ai_degerlendirme: not.ai_degerlendirme, recete_onerisi: not.recete_onerisi, hasta_ozeti: not.hasta_ozeti }, soapMs: Date.now() - t0, chat: { persona: chatJ.data?.personaName, speech: cevap } }, null, 2))
await temizle()
const hata = kontroller.filter((k) => !k.ok).length
console.log(`\n${kontroller.length} kontrol, ${hata} hata → smoke-out/kd-prompts-smoke.json`)
process.exit(hata ? 1 : 0)
