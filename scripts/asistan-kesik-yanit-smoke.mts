#!/usr/bin/env npx tsx
/**
 * KD-DERM-SAFETY-FINDINGS F3 — a truncated / long asistan chat answer never reaches the doctor as raw JSON.
 *  1. REAL model cut: the real KD chat system prompt (persona + KD lock) with a long KD question at a small max_tokens,
 *     so the answer really stops mid-JSON (stop_reason max_tokens) → asistanYanitiCoz: salvaged Türkçe text + "kesildi" note.
 *  2. REAL route: the same long question through POST /api/asistan/chat as qa.kd@notya.ai (password only in .env.local)
 *     → 200, speech has no ```json / {"speech" / "action": text.
 * No patient, no PHI.
 *
 *   npx next build && npx next start   then   npx tsx scripts/asistan-kesik-yanit-smoke.mts   → smoke-out/asistan-kesik-yanit-smoke.json
 */
import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
const { asistanYanitiCoz, KESIK_YANIT_NOTU } = await import('../lib/asistan/yanitCoz')
const { PERSONAS, buildSystemPrompt, varsayilanPersonaId } = await import('../lib/asistan/personaEngine')
const { kadinDogumKilidi } = await import('../specialties/kadin-dogum/prompts')

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const HAM_JSON = /```|\{\s*"speech"|"speech"\s*:|"action"\s*:|"proactiveWarning"\s*:/
const SORU = 'Genel bir soru, hasta yok: Rh negatif gebenin antenatal ve postpartum yönetimini baştan sona, sensitizasyon riski yaratan tüm olaylar, Kleihauer-Betke, indirekt Coombs takibi ve SB ile ACOG farklarıyla birlikte ayrıntılı, madde madde anlatır mısın?'

const kontroller: { ad: string; ok: boolean; detay: unknown }[] = []
const kontrol = (ad: string, ok: boolean, detay: unknown) => { kontroller.push({ ad, ok, detay }); console.log(`${ok ? '✓' : '✗'} ${ad}${ok ? '' : ` — ${JSON.stringify(detay).slice(0, 400)}`}`) }

// 1. real model, forced cut
const persona = PERSONAS[varsayilanPersonaId('genel', 'kadin-dogum')]
const sistem = buildSystemPrompt(persona, null, null, { firstName: 'QA' } as never, '') + kadinDogumKilidi('asistan')
const r1 = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }).messages.create({ model: 'claude-sonnet-4-6', max_tokens: 300, system: sistem, messages: [{ role: 'user', content: SORU }] })
const ham = r1.content[0]?.type === 'text' ? r1.content[0].text : ''
const eski = ham // the pre-fix route showed this raw text when JSON.parse failed
let eskiParse = true
try { JSON.parse(ham.replace(/```[a-z]*/g, '').replace(/```/g, '').trim()) } catch { eskiParse = false }
const c1 = asistanYanitiCoz(ham, r1.stop_reason)
kontrol('gerçek model: max_tokens ile JSON ortasında kesildi (eski rota ham metni gösterirdi)', r1.stop_reason === 'max_tokens' && !eskiParse && HAM_JSON.test(eski), { stop_reason: r1.stop_reason, eskiParse, bas: eski.slice(0, 80) })
kontrol('kesik yanıt: ham JSON yok, kurtarılan Türkçe metin + "yanıt kesildi" notu, eylem yok', !HAM_JSON.test(c1.speech) && c1.kesildi && c1.speech.endsWith(KESIK_YANIT_NOTU) && c1.speech.length > KESIK_YANIT_NOTU.length + 40 && c1.action === null, c1.speech)

// 2. real route, long answer
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const { data: s, error } = await anon.auth.signInWithPassword({ email: 'qa.kd@notya.ai', password: process.env.QA_KD_PASSWORD || '' })
if (error || !s.session) throw new Error(`signIn: ${error?.message}`)
const r2 = await fetch(`${BASE}/api/asistan/chat`, { method: 'POST', headers: { Authorization: `Bearer ${s.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: SORU }) })
const j2 = (await r2.json().catch(() => ({}))) as { data?: { speech?: string; asistanSessionId?: string; personaName?: string }; error?: string }
const speech = String(j2.data?.speech || '')
kontrol('rota: uzun KD yanıtı 200, doktora ham JSON gitmedi', r2.status === 200 && speech.length > 200 && !HAM_JSON.test(speech), { status: r2.status, error: j2.error, bas: speech.slice(0, 200) })
if (j2.data?.asistanSessionId) await sb.from('asistan_sessions').delete().eq('id', j2.data.asistanSessionId)

fs.mkdirSync(path.join(process.cwd(), 'smoke-out'), { recursive: true })
fs.writeFileSync(path.join(process.cwd(), 'smoke-out', 'asistan-kesik-yanit-smoke.json'), JSON.stringify({ calisma: new Date().toISOString(), base: BASE, kontroller, gercekKesik: { stop_reason: r1.stop_reason, ham, gosterilen: c1.speech }, rota: { persona: j2.data?.personaName, uzunluk: speech.length, kesildi: speech.endsWith(KESIK_YANIT_NOTU), speech } }, null, 2))
const hata = kontroller.filter((k) => !k.ok).length
console.log(`\n${kontroller.length} kontrol, ${hata} hata → smoke-out/asistan-kesik-yanit-smoke.json`)
process.exit(hata ? 1 : 0)
