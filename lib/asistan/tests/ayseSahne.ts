/**
 * NOTYA-AYSE-GERI-00 — shared harness for the Ayşe route-level tests (routing table, Fish voice turn, commands).
 *
 * Real route handlers (/api/asistan/chat, /api/asistan/fish-tur) run against an in-memory Supabase and a fake
 * model that records every request. Importing this module installs the mocks, so it must be the FIRST import of a
 * test file. Synthetic QA data only.
 *
 * The Fish route is driven with a text body (`mesaj`, no audio): Fish ASR / TTS are not called, everything after
 * the transcript is the production path.
 */
import { mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '../../doktor/hastaAramaIndeksi'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-ayse-sahne-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
// The fake model stands in for the direct SDK client; no OpenRouter request may leave a test.
delete process.env.OPENROUTER_API_KEY

export type SahteArac = { name: string; input: Record<string, unknown> }
export type SahteYanit = { metin: string; araclar?: SahteArac[] }
/** One recorded model request: the parsed Anthropic body. */
export type ModelIstegi = { stream: boolean; govde: Record<string, any> }

/** Mutable test state. `yanit` may be a function of the request, so a test can answer a forced tool call. */
export const ortam: {
  db: SahteVeritabani
  modelIstekleri: ModelIstegi[]
  yanit: SahteYanit | ((istek: Record<string, any>) => SahteYanit)
  /** Every `[asistan/chat] rota` log line — the route each turn took, on both channels. */
  rotalar: { rota: string; kanal: string }[]
} = {
  db: new SahteVeritabani(),
  modelIstekleri: [],
  yanit: { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) },
  rotalar: [],
}

// The route log is the only place a voice turn reports its route (the SSE carries speech, not routing).
// Product logs are kept out of the test output; errors still print.
console.info = (...a: unknown[]) => {
  if (a[0] === '[asistan/chat] rota' && a[1] && typeof a[1] === 'object') ortam.rotalar.push(a[1] as { rota: string; kanal: string })
}
console.warn = () => {}

function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => ortam.db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

function yanitSec(istek: Record<string, any>): SahteYanit {
  return typeof ortam.yanit === 'function' ? ortam.yanit(istek) : ortam.yanit
}
function mesajKur(y: SahteYanit) {
  const content: Record<string, unknown>[] = y.metin ? [{ type: 'text', text: y.metin }] : []
  for (const [i, a] of (y.araclar || []).entries()) content.push({ type: 'tool_use', id: `toolu_${i}`, name: a.name, input: a.input })
  return { model: 'sahte', content, stop_reason: y.araclar?.length ? 'tool_use' : 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
}
async function* akis(y: SahteYanit) {
  const m = mesajKur(y)
  yield { type: 'message_start', message: { model: 'sahte', usage: { input_tokens: 1 } } }
  let sira = 0
  if (y.metin) {
    yield { type: 'content_block_start', index: sira, content_block: { type: 'text', text: '' } }
    for (let i = 0; i < y.metin.length; i += 7) yield { type: 'content_block_delta', index: sira, delta: { type: 'text_delta', text: y.metin.slice(i, i + 7) } }
    yield { type: 'content_block_stop', index: sira }
    sira++
  }
  for (const [i, a] of (y.araclar || []).entries()) {
    yield { type: 'content_block_start', index: sira + i, content_block: { type: 'tool_use', id: `toolu_${i}`, name: a.name, input: {} } }
    const j = JSON.stringify(a.input)
    yield { type: 'content_block_delta', index: sira + i, delta: { type: 'input_json_delta', partial_json: j.slice(0, 10) } }
    yield { type: 'content_block_delta', index: sira + i, delta: { type: 'input_json_delta', partial_json: j.slice(10) } }
    yield { type: 'content_block_stop', index: sira + i }
  }
  yield { type: 'message_delta', delta: { stop_reason: m.stop_reason }, usage: { output_tokens: 1 } }
  yield { type: 'message_stop' }
}
class SahteAnthropic {
  messages = {
    create: async (istek: Record<string, unknown>) => {
      const govde = JSON.parse(JSON.stringify(istek)) as Record<string, any>
      ortam.modelIstekleri.push({ stream: istek.stream === true, govde })
      const y = yanitSec(govde)
      return istek.stream === true ? akis(y) : mesajKur(y)
    },
  }
}
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
mock.module(pathToFileURL(join(__dirname, '../../doktor/hizLimiti.ts')).href, { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
globalThis.fetch = (async (g: unknown) => { throw new Error(`Ayşe sahne testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

export type Kullanici = { id: string; token: string }
export type Sahne = { doktor: Kullanici; diger: Kullanici; oturum: string }

let sifrele: ((s: string) => string) | null = null
let NextRequestSinifi: typeof import('next/server').NextRequest
let rotalar: { chat: { POST: (r: any) => Promise<Response> }; fishTur: { POST: (r: any) => Promise<Response> } } | null = null

/** Load the encryption helper and the real route handlers (after the mocks above are installed). Call in `before`. */
export async function sahneHazirla(): Promise<void> {
  sifrele = (await import('../../security/encryption')).encrypt
  NextRequestSinifi = (await import('next/server')).NextRequest
  rotalar = {
    chat: await import('../../../app/api/asistan/chat/route'),
    fishTur: await import('../../../app/api/asistan/fish-tur/route'),
  }
}

export function encrypt(s: string): string {
  if (!sifrele) throw new Error('sahneHazirla() çağrılmadı')
  return sifrele(s)
}

/** Fresh database, two doctors (pediatri), one Ayşe session for the first doctor. */
export function sahneKur(brans = 'pediatri'): Sahne {
  ortam.db = new SahteVeritabani()
  ortam.modelIstekleri.length = 0
  ortam.rotalar.length = 0
  ortam.yanit = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
  const kullanici = (): Kullanici => { const id = randomUUID(); const token = `qa-${id}`; ortam.db.kullanicilar.set(token, { id }); return { id, token } }
  const doktor = kullanici()
  const diger = kullanici()
  ortam.db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', specialty: brans })
  ortam.db.ekle('users', { id: diger.id, full_name: 'QA Hekim 2', specialty: brans })
  const oturum = ortam.db.ekle('asistan_sessions', { doctor_id: doktor.id, persona_id: 'aysekaya', messages: [], active_context: { specialty: brans } }).id as string
  return { doktor, diger, oturum }
}

/** A patient row with its name-index rows (the resolver reads the index first). `indeks: false` = a patient with no index rows. */
export function hastaEkle(doktorId: string, ad: string, ek: { dogum?: string; cinsiyet?: string; notlar?: Record<string, unknown>; indeks?: boolean } = {}): string {
  const id = ortam.db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad })),
    dob_encrypted: ek.dogum ? encrypt(ek.dogum) : null,
    gender_encrypted: ek.cinsiyet ? encrypt(ek.cinsiyet) : null,
    phone_encrypted: null, email_encrypted: null,
    notes_encrypted: encrypt(JSON.stringify(ek.notlar || {})),
  }).id as string
  if (ek.indeks !== false) adIndeksle(doktorId, id, ad)
  return id
}

export function adIndeksle(doktorId: string, hastaId: string, ad: string): void {
  for (const parca of adIndeksParcalari(ad)) ortam.db.ekle('patient_search_tokens', { patient_id: hastaId, doctor_id: doktorId, token_hash: tokenOzeti(parca) })
}

/** New Ayşe session for the doctor; `acikHasta` makes that patient the session's open chart. */
export function oturumAc(s: Sahne, acikHasta?: { id: string; ad: string } | null): string {
  return ortam.db.ekle('asistan_sessions', {
    doctor_id: s.doktor.id, persona_id: 'aysekaya', messages: [], patient_id: acikHasta?.id ?? null,
    active_context: { specialty: 'pediatri', ...(acikHasta ? { currentPatientId: acikHasta.id, patientName: acikHasta.ad, odakKaynak: 'soz' } : {}) },
  }).id as string
}

export function oturumBaglami(oturumId: string): Record<string, any> {
  const r = ortam.db.tablo('asistan_sessions').find((x) => x.id === oturumId)
  return (r?.active_context || {}) as Record<string, any>
}

export type YaziCevabi = {
  speech: string; rota: string; asistanSessionId: string; aktifHasta: string | null
  eylemOnerileri: { id: string; eylem_anahtar: string; veri: Record<string, unknown>; eksik_alanlar: string[]; uyarilar: string[] }[]
  eylemHastasi: { ad: string } | null
}

/** One written turn through the real /api/asistan/chat handler. */
export async function yazi(s: Sahne, message: string, o: { oturum?: string; token?: string; patientId?: string; saatDilimi?: string } = {}): Promise<YaziCevabi> {
  if (!rotalar) throw new Error('sahneHazirla() çağrılmadı')
  const istek = new NextRequestSinifi('http://localhost/api/asistan/chat', {
    method: 'POST', headers: { authorization: `Bearer ${o.token || s.doktor.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ message, specialty: 'pediatri', asistanSessionId: o.oturum || s.oturum, ...(o.patientId ? { patientId: o.patientId } : {}), ...(o.saatDilimi ? { saatDilimi: o.saatDilimi } : {}) }),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
  const y = await rotalar.chat.POST(istek)
  const j = await y.json()
  assert.equal(y.status, 200, JSON.stringify(j))
  return j.data as YaziCevabi
}

export type FishTuru = {
  status: number
  olaylar: Record<string, any>[]
  /** Everything Ayşe said this turn (`soz` events joined). */
  soz: string
  stt: string | null
  hata: string | null
  /** Event type names in order. */
  sira: string[]
}

/** One spoken turn through the real /api/asistan/fish-tur handler, with the transcript given as text. */
export async function fishTur(s: Sahne, mesaj: string, o: { oturum?: string; token?: string; patientId?: string; saatDilimi?: string; govde?: Record<string, unknown> } = {}): Promise<FishTuru> {
  if (!rotalar) throw new Error('sahneHazirla() çağrılmadı')
  const istek = new NextRequestSinifi('http://localhost/api/asistan/fish-tur', {
    method: 'POST', headers: { authorization: `Bearer ${o.token || s.doktor.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ mesaj, asistanSessionId: o.oturum || s.oturum, specialty: 'pediatri', personaId: 'aysekaya', ...(o.patientId ? { patientId: o.patientId } : {}), ...(o.saatDilimi ? { saatDilimi: o.saatDilimi } : {}), ...(o.govde || {}) }),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
  const y = await rotalar.fishTur.POST(istek)
  const ham = await y.text()
  const olaylar: Record<string, any>[] = []
  if (y.status === 200) {
    for (const satir of ham.split('\n')) if (satir.startsWith('data: ')) olaylar.push(JSON.parse(satir.slice(6)))
  }
  return {
    status: y.status,
    olaylar,
    soz: olaylar.filter((e) => e.t === 'soz').map((e) => String(e.m)).join('').replace(/\s+/g, ' ').trim(),
    stt: (olaylar.find((e) => e.t === 'stt')?.m as string | undefined) ?? null,
    hata: (olaylar.find((e) => e.t === 'hata')?.m as string | undefined) ?? null,
    sira: olaylar.map((e) => String(e.t)),
  }
}

/** Route of the last turn (either channel), or null. */
export function sonRota(): string | null {
  return ortam.rotalar[ortam.rotalar.length - 1]?.rota ?? null
}

/** The last model request of the scene, or null when no model was called. */
export function sonModelIstegi(): ModelIstegi | null {
  return ortam.modelIstekleri[ortam.modelIstekleri.length - 1] ?? null
}

/** Tool the request forces: a tool name, 'any', or null (auto / no tools). */
export function zorlananArac(istek: ModelIstegi | null): string | null {
  const tc = istek?.govde?.tool_choice as { type?: string; name?: string } | undefined
  if (!tc) return null
  if (tc.type === 'tool') return String(tc.name || '')
  return tc.type === 'any' ? 'any' : null
}

export function sunulanAraclar(istek: ModelIstegi | null): string[] {
  return ((istek?.govde?.tools as { name?: string }[] | undefined) || []).map((a) => String(a.name || ''))
}

/** The assistant's last stored message of a session (what the screen poll shows for a voice turn). */
export function sonAsistanMesaji(oturumId: string): string {
  const r = ortam.db.tablo('asistan_sessions').find((x) => x.id === oturumId)
  const m = ((r?.messages || []) as { role: string; content: string }[]).filter((x) => x.role === 'assistant')
  return m.length ? String(m[m.length - 1].content) : ''
}
