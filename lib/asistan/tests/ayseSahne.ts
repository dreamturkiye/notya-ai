/**
 * NOTYA-CHECKPOINT-KARSILASTIRMA-01 — the Ayşe scene harness of today's main (lib/asistan/tests/ayseSahne.ts,
 * NOTYA-AYSE-GERI-00), adapted to the APIs of the 2026-09-27 checkpoint (commit ac947eef).
 *
 * Real route handlers run against an in-memory Supabase: /api/asistan/chat, /api/doktor/konsult and the ElevenLabs
 * Custom LLM endpoint /api/asistan/ses-llm/v1/chat/completions. Importing this module installs the mocks, so it must
 * be the FIRST import of a runner. Synthetic QA data only; nothing is read from or written to production.
 *
 * What differs from today's harness, and why:
 *   - no Fish voice route (/api/asistan/fish-tur does not exist here). The voice surface of this commit is the
 *     ElevenLabs Custom LLM endpoint: it is driven with the transcript as the last user message and a signed
 *     conversation token, exactly like lib/asistan/tekBeyin.test.ts does. ElevenLabs ASR / TTS / turn-taking are
 *     not exercised.
 *   - no route log. Today the brain logs `[asistan/chat] rota`; here it does not. The route is derived from what
 *     the turn did, with the product's own predicates (rotaCikar below).
 *   - no blind name index (patient_search_tokens): the resolver reads the doctor's patient names directly.
 *   - no guard switch (NOTYA_KORUYUCU_KAPALI). The guard is disabled HERE: a request for any model other than the
 *     primary is refused at the network boundary and recorded, so a sentence the primary cannot answer is a
 *     failure of that sentence, not a rescued answer — the same rule as today's run.
 *   - the chat route takes no `saatDilimi`; the product's day is bugunTRT().
 */
import { mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-ayse-sahne-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
const SES_SIRRI = 'qa-sentetik-ses-llm-sirri-0123456789abcdef'
process.env.NOTYA_SES_LLM_SECRET = SES_SIRRI
process.env.NOTYA_SES_JETON_SECRET = 'qa-sentetik-ses-jeton-anahtari-0123456789ab'
// No OpenRouter request may leave the process unless gercekModelAc() puts the key back.
const ortamdakiAnahtar = process.env.OPENROUTER_API_KEY || ''
delete process.env.OPENROUTER_API_KEY

/**
 * At this commit lib/security/encryption.ts derives the key with scrypt on EVERY encrypt / decrypt (today's main
 * caches it). A corpus session writes and reads a few hundred encrypted fields, so the run would take many hours.
 * The derivation is memoised here, in the harness — same key, same ciphertext; only the run time changes. Latency
 * of this run is therefore not a measurement of the old build.
 */
{
  const kripto = require('node:crypto') as typeof import('node:crypto')
  const gercek = kripto.scryptSync
  const bellek = new Map<string, Buffer>()
  kripto.scryptSync = ((parola: unknown, tuz: unknown, uzunluk: number, ...kalan: unknown[]) => {
    if (kalan.length || typeof parola !== 'string' || typeof tuz !== 'string') return (gercek as (...a: unknown[]) => Buffer)(parola, tuz, uzunluk, ...kalan)
    const anahtar = `${parola}\u0000${tuz}\u0000${uzunluk}`
    let v = bellek.get(anahtar)
    if (!v) { v = gercek(parola, tuz, uzunluk); bellek.set(anahtar, v) }
    return Buffer.from(v)
  }) as typeof kripto.scryptSync
}

export type SahteArac = { name: string; input: Record<string, unknown> }
export type SahteYanit = { metin: string; araclar?: SahteArac[] }
/** One recorded request to the SDK fake: the parsed Anthropic body. */
export type ModelIstegi = { stream: boolean; govde: Record<string, any> }

/** Mutable scene state. */
export const ortam: {
  db: SahteVeritabani
  /** Requests that reached the Anthropic SDK fake. In audit mode there must be none: every call goes through fetch. */
  modelIstekleri: ModelIstegi[]
  yanit: SahteYanit | ((istek: Record<string, any>) => SahteYanit)
  /** Every `[ai/yedek]` line: the primary failed a gate and the product asked for the guard. */
  dususler: { neden: string; alt: string }[]
  /** Queries the in-memory database could not run (a limit of the fake, not of the product). Must stay empty. */
  sahteHatalari: string[]
} = {
  db: new SahteVeritabani(),
  modelIstekleri: [],
  yanit: { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) },
  dususler: [],
  sahteHatalari: [],
}

// Product logs are kept out of the run's output; errors still print. The guard-fall line is the only one read.
console.info = () => {}
console.warn = (...a: unknown[]) => {
  const m = /^\[ai\/yedek\] .*\bneden=(\S+) alt=(\S+)/.exec(String(a[0] ?? ''))
  if (m) ortam.dususler.push({ neden: m[1], alt: m[2] })
}

const sahteHatasiMi = (e: unknown) => e instanceof Error && e.message.startsWith('[sahteSupabase]')
const sahteHatasiYaz = (e: unknown) => { if (sahteHatasiMi(e)) ortam.sahteHatalari.push((e as Error).message) }
/**
 * The product swallows chart-read errors ("dosya bağlamı kritik değil"), so a query the fake cannot run would
 * quietly empty a chart and look like a wrong answer. Every such error is recorded before it is rethrown.
 */
function izle<T extends object>(sorgu: T): T {
  return new Proxy(sorgu, {
    get(hedef, ozellik) {
      let v: unknown
      try { v = Reflect.get(hedef, ozellik) } catch (e) { sahteHatasiYaz(e); throw e }
      if (typeof v !== 'function') return v
      if (ozellik === 'then') {
        return (coz: (x: unknown) => unknown, red?: (e: unknown) => unknown) =>
          (v as (c: (x: unknown) => unknown, r: (e: unknown) => unknown) => unknown).call(hedef, coz, (e: unknown) => { sahteHatasiYaz(e); if (red) return red(e); throw e })
      }
      return (...arg: unknown[]) => {
        let r: unknown
        try { r = (v as (...x: unknown[]) => unknown).apply(hedef, arg) } catch (e) { sahteHatasiYaz(e); throw e }
        return r && typeof r === 'object' && typeof (r as { then?: unknown }).then === 'function' && !(r instanceof Promise) ? izle(r as object) : r
      }
    },
  })
}

function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => ortam.db.istemci(opts)
  return {
    from: (t: string) => izle(c().from(t)),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}

/** A package's directory and manifest, found by walking up from its resolved entry (works without an exported package.json). */
function paket(ad: string): { kok: string; pkg: Record<string, any> } {
  let d = dirname(require.resolve(ad))
  for (;;) {
    const yol = join(d, 'package.json')
    if (existsSync(yol)) {
      const pkg = JSON.parse(readFileSync(yol, 'utf8')) as Record<string, any>
      if (pkg.name === ad) return { kok: d, pkg }
    }
    const ust = dirname(d)
    if (ust === d) throw new Error(`paket bulunamadı: ${ad}`)
    d = ust
  }
}
/** Mock the entry FILES of a package (CJS and ESM), not the bare specifier. */
function paketiSahtele(ad: string, sahte: { namedExports?: Record<string, unknown>; defaultExport?: unknown }): void {
  const { kok, pkg } = paket(ad)
  const nokta = pkg.exports?.['.'] ?? pkg.exports
  const adaylar = [nokta?.require?.default, nokta?.require, nokta?.import?.default, nokta?.import, nokta?.default, pkg.main, pkg.module]
  for (const g of new Set(adaylar.filter((x): x is string => typeof x === 'string').map((x) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, sahte)
  }
}

paketiSahtele('@supabase/supabase-js', { namedExports: { createClient: sahteCreateClient } })

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
paketiSahtele('@anthropic-ai/sdk', { defaultExport: SahteAnthropic })
mock.module(pathToFileURL(join(__dirname, '../../doktor/hizLimiti.ts')).href, { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })

/**
 * The voice endpoint closes its stream at the spoken cap (or the 22 s guard timer) and lets the screen answer finish
 * in the background through waitUntil(). The run has to read that screen answer, so the background work is kept here
 * and awaited after the stream ends.
 */
let arkaPlan: Promise<unknown>[] = []
paketiSahtele('@vercel/functions', { namedExports: { waitUntil: (p: Promise<unknown>) => { arkaPlan.push(Promise.resolve(p).catch(() => {})) } } })
export async function arkaPlanBitsin(): Promise<void> {
  while (arkaPlan.length) { const b = arkaPlan; arkaPlan = []; await Promise.all(b) }
}

/** One recorded model call (audit mode): what was asked for and what the model did. No prompt text is kept. */
export type AgCagrisi = {
  model: string; akis: boolean
  /** tool_choice as sent: 'required', a tool name, or null when nothing was forced. */
  zorlanan: string | null
  sunulanArac: number
  durum: number; ms: number
  bitis: string | null; metin: number
  /** Names of the tools the model called, in order. */
  araclar: string[]
  girdi: number; cikti: number; maliyet: number
  hata: string | null
  /** The request asked for a model other than the primary (the guard) and was refused here. */
  koruyucu: boolean
  /** The chart the brain put into the prompt ("=== AKTİF HASTA DOSYASI: <ad> ==="): the patient the turn was answered from. */
  dosyaAdi: string | null
}
const gercekFetch = globalThis.fetch
let ag: ((url: string, init?: RequestInit) => Promise<Response>) | null = null
export const agCagrilari: AgCagrisi[] = []
let bekleyenOkumalar: Promise<void>[] = []
let birincilModel: (() => string) | null = null

/**
 * Audit mode: the model is the REAL primary through the provider (or `vekil`, a stand-in that speaks the same wire
 * format). Everything else stays the scene. Returns false when there is neither a key nor a stand-in.
 */
export function gercekModelAc(vekil?: (govde: Record<string, any>) => Response): boolean {
  if (!vekil && !ortamdakiAnahtar) return false
  process.env.OPENROUTER_API_KEY = vekil ? 'sk-or-vekil' : ortamdakiAnahtar
  ag = vekil ? async (_u, o) => vekil(JSON.parse(String(o?.body || '{}'))) : (u, o) => gercekFetch(u, o)
  return true
}
/** Wait until every streamed answer of the turn has been read into `agCagrilari`. */
export async function agOkumalariBitsin(): Promise<void> {
  const b = bekleyenOkumalar
  bekleyenOkumalar = []
  await Promise.all(b)
}
function yanitiIsle(k: AgCagrisi, ham: string, akisli: boolean): void {
  type Secim = { finish_reason?: string | null; message?: { content?: string | null; tool_calls?: { function?: { name?: string } }[] }; delta?: { content?: string | null; tool_calls?: { index?: number; function?: { name?: string } }[] } }
  type Govde = { choices?: Secim[]; usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number }; error?: { message?: string } }
  /** A streamed tool name may arrive in pieces — joined per call index, like lib/ai/saglayici.ts does. */
  const akisAdlari: string[] = []
  const isle = (j: Govde) => {
    if (j.error?.message) k.hata = String(j.error.message).slice(0, 120)
    if (j.usage) { k.girdi = j.usage.prompt_tokens ?? k.girdi; k.cikti = j.usage.completion_tokens ?? k.cikti; k.maliyet = Number(j.usage.cost) || k.maliyet }
    const c = j.choices?.[0]
    if (!c) return
    if (c.finish_reason) k.bitis = c.finish_reason
    k.metin += (c.message?.content || c.delta?.content || '').length
    for (const t of c.message?.tool_calls || []) if (t.function?.name) k.araclar.push(t.function.name)
    for (const t of c.delta?.tool_calls || []) {
      const i = Number(t.index ?? akisAdlari.length)
      akisAdlari[i] = (akisAdlari[i] || '') + (t.function?.name || '')
    }
  }
  try {
    if (!akisli) { isle(JSON.parse(ham) as Govde); return }
    for (const satir of ham.split('\n')) {
      const m = satir.trim()
      if (!m.startsWith('data:') || m.includes('[DONE]')) continue
      try { isle(JSON.parse(m.slice(5)) as Govde) } catch { /* partial line */ }
    }
    k.araclar.push(...akisAdlari.filter(Boolean))
  } catch { k.hata = k.hata || 'yanıt okunamadı' }
}
globalThis.fetch = (async (g: unknown, o?: RequestInit) => {
  const url = typeof g === 'string' ? g : g instanceof URL ? g.href : String((g as { url?: string })?.url || g)
  // The only request allowed out is the provider's chat-completions call: it is the one that carries the key.
  const yetki = String((o?.headers as Record<string, string> | undefined)?.Authorization || '')
  if (!ag || !url.endsWith('/chat/completions') || yetki !== `Bearer ${process.env.OPENROUTER_API_KEY}`) throw new Error(`Ayşe sahne koşusu ağ erişimi yapamaz: ${url}`)
  const ham = String(o?.body || '{}')
  const govde = JSON.parse(ham) as Record<string, any>
  const secim = govde.tool_choice
  const k: AgCagrisi = {
    model: String(govde.model || '?'), akis: govde.stream === true,
    zorlanan: secim === 'required' ? 'required' : secim && typeof secim === 'object' ? String(secim.function?.name || '?') : null,
    sunulanArac: Array.isArray(govde.tools) ? govde.tools.length : 0,
    durum: 0, ms: 0, bitis: null, metin: 0, araclar: [], girdi: 0, cikti: 0, maliyet: 0, hata: null,
    koruyucu: Boolean(birincilModel && String(govde.model) !== birincilModel()),
    dosyaAdi: /=== AKTİF HASTA DOSYASI: ([^=\\]+?) ===/.exec(ham)?.[1] ?? null,
  }
  agCagrilari.push(k)
  if (k.koruyucu) {
    k.durum = 403
    k.hata = 'koruyucu kapalı (denetim): birincil model cevap veremedi'
    return new Response(JSON.stringify({ error: { code: 403, message: k.hata } }), { status: 403, headers: { 'content-type': 'application/json' } })
  }
  const t0 = Date.now()
  let r: Response
  try { r = await ag(url, o) } catch (e) { k.ms = Date.now() - t0; k.hata = `ağ: ${String((e as Error)?.message || e).slice(0, 80)}`; throw e }
  k.durum = r.status
  bekleyenOkumalar.push(r.clone().text().then((metin) => { k.ms = Date.now() - t0; yanitiIsle(k, metin, k.akis) }).catch(() => { k.ms = Date.now() - t0 }))
  return r
}) as typeof fetch

export type Kullanici = { id: string; token: string }
export type Sahne = { doktor: Kullanici; diger: Kullanici; oturum: string }

let sifrele: ((s: string) => string) | null = null
let NextRequestSinifi: typeof import('next/server').NextRequest
type Rota = { POST: (r: any) => Promise<Response> }
let rotalar: { chat: Rota; sesLlm: Rota; konsult: Rota; oturumHasta: Rota; sesEkran: { GET: (r: any) => Promise<Response> } } | null = null
let jetonImzala: typeof import('../sesJetonu').sesJetonuImzala
let kimlikSorusu: typeof import('../../doktor/kimlikSorusu').kimlikSorusu
let kayitNiyetiMi: typeof import('../../../core/eylemler/oneri').kayitNiyetiMi

/** Load the encryption helper, the real route handlers and the predicates (after the mocks above are installed). */
export async function sahneHazirla(): Promise<void> {
  sifrele = (await import('../../security/encryption')).encrypt
  NextRequestSinifi = (await import('next/server')).NextRequest
  rotalar = {
    chat: await import('../../../app/api/asistan/chat/route'),
    sesLlm: await import('../../../app/api/asistan/ses-llm/v1/chat/completions/route'),
    konsult: await import('../../../app/api/doktor/konsult/route'),
    oturumHasta: await import('../../../app/api/asistan/oturum-hasta/route'),
    sesEkran: await import('../../../app/api/asistan/ses-ekran/route'),
  }
  jetonImzala = (await import('../sesJetonu')).sesJetonuImzala
  kimlikSorusu = (await import('../../doktor/kimlikSorusu')).kimlikSorusu
  kayitNiyetiMi = (await import('../../../core/eylemler/oneri')).kayitNiyetiMi
  birincilModel = (await import('../../ai/modeller')).hizliModel
}

/** The primary model of this build (lib/ai/modeller.ts; NOTYA_MODEL_HIZLI overrides it). */
export function birincilModelAdi(): string {
  if (!birincilModel) throw new Error('sahneHazirla() çağrılmadı')
  return birincilModel()
}

export function encrypt(s: string): string {
  if (!sifrele) throw new Error('sahneHazirla() çağrılmadı')
  return sifrele(s)
}

/** Fresh database, two doctors, one Ayşe session for the first doctor. */
export function sahneKur(brans = 'pediatri'): Sahne {
  ortam.db = new SahteVeritabani()
  ortam.modelIstekleri.length = 0
  ortam.dususler.length = 0
  ortam.yanit = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
  const kullanici = (): Kullanici => { const id = randomUUID(); const token = `qa-${id}`; ortam.db.kullanicilar.set(token, { id }); return { id, token } }
  const doktor = kullanici()
  const diger = kullanici()
  ortam.db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', specialty: brans })
  ortam.db.ekle('users', { id: diger.id, full_name: 'QA Hekim 2', specialty: brans })
  const oturum = ortam.db.ekle('asistan_sessions', { doctor_id: doktor.id, persona_id: 'aysekaya', messages: [], active_context: { specialty: brans } }).id as string
  return { doktor, diger, oturum }
}

/** New Ayşe session for the doctor; `acikHasta` makes that patient the session's open chart. */
export function oturumAc(s: Sahne, acikHasta?: { id: string; ad: string } | null, brans = 'pediatri'): string {
  return ortam.db.ekle('asistan_sessions', {
    doctor_id: s.doktor.id, persona_id: 'aysekaya', messages: [], patient_id: acikHasta?.id ?? null,
    active_context: { specialty: brans, ...(acikHasta ? { currentPatientId: acikHasta.id, patientName: acikHasta.ad, odakKaynak: 'soz' } : {}) },
  }).id as string
}

export function oturumBaglami(oturumId: string): Record<string, any> {
  const r = ortam.db.tablo('asistan_sessions').find((x) => x.id === oturumId)
  return (r?.active_context || {}) as Record<string, any>
}

type SaklananMesaj = { role: string; content: string; kimlik?: boolean; hastaId?: string | null }
export function oturumMesajlari(oturumId: string): SaklananMesaj[] {
  return ((ortam.db.tablo('asistan_sessions').find((x) => x.id === oturumId)?.messages || []) as SaklananMesaj[])
}

/**
 * The assistant's last stored message of a session. This is what today's runner grades as the "screen" of a voice
 * turn, so it is what this runner grades too. For an identity answer it is NOT what the doctor sees: the stored text
 * carries no value, and the page's poll rebuilds the screen text on the server (sesEkrani below).
 */
export function sonAsistanMesaji(oturumId: string): string {
  const m = oturumMesajlari(oturumId).filter((x) => x.role === 'assistant')
  return m.length ? String(m[m.length - 1].content) : ''
}

/** What the /asistan page shows for the last voice turn: the real /api/asistan/ses-ekran route. */
export async function sesEkrani(s: Sahne, oturumId: string): Promise<string> {
  if (!rotalar) throw new Error('sahneHazirla() çağrılmadı')
  const y = await rotalar.sesEkran.GET(new NextRequestSinifi(`http://localhost/api/asistan/ses-ekran?oturum=${oturumId}`, {
    headers: { authorization: `Bearer ${s.doktor.token}` },
  } as ConstructorParameters<typeof NextRequestSinifi>[1]))
  if (y.status !== 200) throw new Error(`ses-ekran HTTP ${y.status}`)
  const turlar = ((await y.json()) as { turlar?: { metin?: string }[] }).turlar || []
  return String(turlar[turlar.length - 1]?.metin || '')
}

/** The sentence the voice channel stores when it read the screen answer aloud (lib/asistan/ayseCevapla.ts). */
const OKU_NOTU = 'Ekrandaki cevabı sesli okudum Hocam.'
/** The quick card's sentence shape (lib/doktor/hastaDosyaKart.ts dosyaSoruCevap / adliDosyaCevabi). */
const HIZLI_KART = /(?:^|— )[Dd]osyada [^:\n]{2,40}: /

/**
 * Which step of this commit's pipeline answered the turn — the same names today's brain logs. Derived, because this
 * commit logs nothing:
 *   model       a model request left the brain during the turn;
 *   kimlik      the product's identity classifier matches the sentence and it is not a record command — in that case
 *               ayseCevapla returns the identity answer before anything else;
 *   oku         voice only: the stored screen line is the read-aloud note;
 *   hizli-kart  a model-free answer in the quick card's sentence shape;
 *   arama       any other model-free answer: the resolver's own sentence (count template, candidate list).
 * The routes kapsam, takvim, gurultu, dosya-ac and kayit do not exist at this commit.
 */
export function rotaCikar(g: { mesaj: string; modelCagrisi: boolean; ekran: string; ses: boolean }): string | null {
  if (g.modelCagrisi) return 'model'
  if (!g.ekran) return null
  if (kimlikSorusu(g.mesaj).length > 0 && !kayitNiyetiMi(g.mesaj)) return 'kimlik'
  if (g.ses && g.ekran === OKU_NOTU) return 'oku'
  return HIZLI_KART.test(g.ekran) ? 'hizli-kart' : 'arama'
}

function istek(yol: string, token: string, govde: unknown): InstanceType<typeof NextRequestSinifi> {
  return new NextRequestSinifi(`http://localhost${yol}`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(govde),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}

export type YaziCevabi = {
  speech: string; asistanSessionId: string; aktifHasta: string | null
  eylemOnerileri: { id: string; eylem_anahtar: string; veri: Record<string, unknown>; eksik_alanlar: string[]; uyarilar: string[] }[]
  eylemHastasi: { ad: string } | null
}

/** One written turn through the real /api/asistan/chat handler. */
export async function yazi(s: Sahne, message: string, o: { oturum?: string; token?: string; patientId?: string; brans?: string } = {}): Promise<YaziCevabi> {
  if (!rotalar) throw new Error('sahneHazirla() çağrılmadı')
  const y = await rotalar.chat.POST(istek('/api/asistan/chat', o.token || s.doktor.token, {
    message, specialty: o.brans || 'pediatri', asistanSessionId: o.oturum || s.oturum, ...(o.patientId ? { patientId: o.patientId } : {}),
  }))
  const j = await y.json()
  assert.equal(y.status, 200, JSON.stringify(j))
  return j.data as YaziCevabi
}

export type SesTuru = {
  status: number
  /** Everything handed to ElevenLabs to be spoken this turn. */
  soz: string
  /** finish_reason of the stream ('stop', or 'tool_calls' when the call was ended). */
  bitis: string | null
  aracCagrilari: string[]
  hata: string | null
}

/**
 * One spoken turn through the real ElevenLabs Custom LLM endpoint, with the transcript given as the last user
 * message. The stream is read to its end and the background screen answer is awaited.
 */
export async function sesLlm(s: Sahne, mesaj: string, o: { oturum?: string; patientId?: string | null; brans?: string } = {}): Promise<SesTuru> {
  if (!rotalar) throw new Error('sahneHazirla() çağrılmadı')
  const jeton = jetonImzala({ d: s.doktor.id, o: o.oturum || s.oturum, s: o.brans || 'pediatri', p: o.patientId ?? null, pe: 'aysekaya' })
  const y = await rotalar.sesLlm.POST(istek('/api/asistan/ses-llm/v1/chat/completions', SES_SIRRI, {
    model: 'notya-ayse', stream: true, temperature: 0,
    messages: [{ role: 'system', content: 'ElevenLabs ajan promptu' }, { role: 'user', content: mesaj }],
    elevenlabs_extra_body: { notya_jeton: jeton },
  }))
  const ham = await y.text()
  await arkaPlanBitsin()
  const parcalar: string[] = []
  const aracCagrilari: string[] = []
  let bitis: string | null = null
  if (y.status === 200) {
    for (const satir of ham.split('\n')) {
      if (!satir.startsWith('data: ') || satir === 'data: [DONE]') continue
      const c = JSON.parse(satir.slice(6)).choices?.[0]
      if (typeof c?.delta?.content === 'string') parcalar.push(c.delta.content)
      for (const t of c?.delta?.tool_calls || []) if (t?.function?.name) aracCagrilari.push(String(t.function.name))
      if (c?.finish_reason) bitis = c.finish_reason
    }
  }
  return { status: y.status, soz: parcalar.join('').replace(/\s+/g, ' ').trim(), bitis, aracCagrilari, hata: y.status === 200 ? null : `HTTP ${y.status}` }
}

export type PanelCevabi = {
  status: number
  cevap: string
  oneriler: { eylem_anahtar?: string; eksik_alanlar?: string[] }[]
  hata: string | null
}

/**
 * One turn through the real /api/doktor/konsult handler — the "Ayşe'ye Danış" panel of the patient file. The route
 * is stateless: the caller sends the whole conversation (`mesajlar`) and the patient id.
 */
export async function panel(s: Sahne, patientId: string, mesajlar: { rol: 'doktor' | 'asistan'; icerik: string }[], o: { token?: string } = {}): Promise<PanelCevabi> {
  if (!rotalar) throw new Error('sahneHazirla() çağrılmadı')
  const y = await rotalar.konsult.POST(istek('/api/doktor/konsult', o.token || s.doktor.token, { patientId, mesajlar }))
  const j = await y.json().catch(() => ({})) as Record<string, any>
  return { status: y.status, cevap: String(j.cevap || ''), oneriler: Array.isArray(j.oneriler) ? j.oneriler : [], hata: y.status === 200 ? null : String(j.error || `HTTP ${y.status}`) }
}

/** The doctor opens a patient's page while a shared session exists: the browser calls this route once. */
export async function sayfayaGec(s: Sahne, oturum: string, patientId: string): Promise<void> {
  if (!rotalar) throw new Error('sahneHazirla() çağrılmadı')
  await rotalar.oturumHasta.POST(istek('/api/asistan/oturum-hasta', s.doktor.token, { asistanSessionId: oturum, patientId }))
}

/**
 * Stand-in for the provider (dry run): speaks the wire format, calls the forced tool with empty arguments when one
 * is forced, answers in plain text otherwise. It is NOT a model — it proves the plumbing. Copied from today's
 * lib/asistan/tests/eylemDenetimi.ts (the only part of that file the corpus runner needs).
 */
export function vekilOpenRouter(govde: Record<string, any>): Response {
  const secim = govde.tool_choice
  const ad = secim && typeof secim === 'object' ? String(secim.function?.name || '') : secim === 'required' ? String(govde.tools?.[0]?.function?.name || '') : ''
  const metin = ad ? '' : JSON.stringify({ speech: 'Vekil yanıt Hocam.' })
  const usage = { prompt_tokens: 100, completion_tokens: 10, cost: 0 }
  if (govde.stream !== true) {
    const message = { role: 'assistant', content: metin || null, ...(ad ? { tool_calls: [{ id: 'call_vekil', type: 'function', function: { name: ad, arguments: '{}' } }] } : {}) }
    return new Response(JSON.stringify({ id: 'vekil', model: govde.model, choices: [{ message, finish_reason: ad ? 'tool_calls' : 'stop' }], usage }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const olay = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`
  const parcalar = [
    ad
      // the name split in two, the way a real stream may deliver it
      ? olay({ id: 'vekil', model: govde.model, choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_vekil', function: { name: ad.slice(0, 4), arguments: '' } }] } }] })
        + olay({ choices: [{ delta: { tool_calls: [{ index: 0, function: { name: ad.slice(4), arguments: '{}' } }] } }] })
      : olay({ id: 'vekil', model: govde.model, choices: [{ delta: { content: metin } }] }),
    olay({ choices: [{ delta: {}, finish_reason: ad ? 'tool_calls' : 'stop' }], usage }),
    'data: [DONE]\n\n',
  ]
  const kod = new TextEncoder()
  return new Response(new ReadableStream({ start(k) { for (const p of parcalar) k.enqueue(kod.encode(p)); k.close() } }), { status: 200, headers: { 'content-type': 'text/event-stream' } })
}
