#!/usr/bin/env npx tsx
/**
 * NOTYA-AYSE-100 — the ~100 most common doctor questions, run against the tek-beyin brain IN-PROCESS
 * (lib/asistan/ayseCevapla) with a DRY-RUN Supabase client: every read is doctor-scoped and passes through,
 * every write is swallowed (asistan_sessions lives in memory so follow-ups keep their context).
 * Nothing is created or changed in production — the doctor's real charts can be read read-only.
 *
 *   npx tsx scripts/ayse-denetim/yuz.mts --doktor dr.gokhan@notya.ai [--etiket ayse-100] [--sadece 12,13,40]
 *     [--env .env.audit.local] [--tz America/New_York] [--kanal sohbet|ses] [--koruyucu acik]
 *
 * Output: .denetim-out/<etiket>.jsonl (gitignored) — one row per question: answer, source (deterministic/model),
 * LLM calls, latency, automatic verdict. The markdown report is written by hand from that file.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const ENV = arg('env') || '.env.audit.local'
for (const f of [ENV, '.env.local']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
const DOKTOR = arg('doktor') || 'kaanari@mac.com'
const ETIKET = (arg('etiket') || 'ayse-100').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
const TZ = arg('tz') || 'America/New_York'
const KANAL = (arg('kanal') || 'sohbet') as 'sohbet' | 'ses'
const SADECE = arg('sadece')?.split(',').map(Number)
const SORU_DOSYASI = arg('sorular') || path.join(process.cwd(), 'scripts', 'ayse-denetim', 'sorular-100.json')
// NOTYA-AYSE-100-LUNA: the audit grades the PRIMARY model only. Default: koruyucu (Sonnet) disabled — a fall is a
// FAIL logged as luna_fail:<neden>:<altKod>. `--koruyucu acik` restores production behaviour.
if (arg('koruyucu') !== 'acik') process.env.NOTYA_KORUYUCU_KAPALI = '1'

type Soru = {
  no: number; kat: string; oturum: string; soru: string
  hasta?: string | null            // patientId sent as the page patient (open chart), else null
  icerir?: string[]; icermez?: string[]  // regexes (i, u) on the screen answer
  not?: string
}
const SORULAR: Soru[] = JSON.parse(fs.readFileSync(SORU_DOSYASI, 'utf8'))

const { createClient } = await import('@supabase/supabase-js')
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!URL_ || !KEY) { console.error('Supabase env yok'); process.exit(2) }
const gercek = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
// lib/ai/kullanim.ts builds its own writer from the env — drop the key so no telemetry row is written either.
delete process.env.SUPABASE_SERVICE_ROLE_KEY

/* ---------- dry-run client ---------- */
type Satir = Record<string, unknown>
const oturumlar = new Map<string, Satir>()
const yutulanYazmalar: Record<string, number> = {}
function bosSonuc() {
  const p = Promise.resolve({ data: null, error: null, count: null })
  const b: Record<string, unknown> = {}
  for (const m of ['eq', 'neq', 'in', 'is', 'not', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'match', 'filter', 'select', 'single', 'maybeSingle', 'order', 'limit', 'range', 'returns', 'throwOnError', 'onConflict']) b[m] = () => b
  b.then = (r: unknown, j: unknown) => p.then(r as never, j as never)
  b.catch = (j: unknown) => p.catch(j as never)
  b.finally = (f: unknown) => p.finally(f as never)
  return b
}
function sahteOturumTablosu() {
  let op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  let yuk: Satir = {}
  const filtre: Record<string, unknown> = {}
  let tekil = false
  const b: Record<string, unknown> = {}
  b.select = () => b
  b.insert = (r: Satir) => { op = 'insert'; yuk = r; return b }
  b.update = (r: Satir) => { op = 'update'; yuk = r; return b }
  b.delete = () => { op = 'delete'; return b }
  b.eq = (k: string, v: unknown) => { filtre[k] = v; return b }
  b.order = () => b; b.limit = () => b; b.neq = () => b; b.in = () => b; b.is = () => b
  b.single = () => { tekil = true; return b }
  b.maybeSingle = () => { tekil = true; return b }
  const calistir = async () => {
    if (op === 'insert') {
      const satir: Satir = { id: randomUUID(), created_at: new Date().toISOString(), messages: [], active_context: {}, patient_id: null, ...yuk }
      oturumlar.set(String(satir.id), satir)
      return { data: tekil ? satir : [satir], error: null }
    }
    const eslesen = [...oturumlar.values()].filter((s) => Object.entries(filtre).every(([k, v]) => s[k] === v))
    if (op === 'update') { for (const s of eslesen) Object.assign(s, yuk); return { data: null, error: null } }
    if (op === 'delete') { for (const s of eslesen) oturumlar.delete(String(s.id)); return { data: null, error: null } }
    return tekil ? { data: eslesen[0] || null, error: eslesen[0] ? null : { code: 'PGRST116', message: 'no rows' } } : { data: eslesen, error: null }
  }
  b.then = (r: unknown, j: unknown) => calistir().then(r as never, j as never)
  b.catch = (j: unknown) => calistir().catch(j as never)
  return b
}
const YAZMA = new Set(['insert', 'update', 'upsert', 'delete'])
const supabase = new Proxy(gercek, {
  get(t, k) {
    if (k === 'from') return (tablo: string) => {
      if (tablo === 'asistan_sessions') return sahteOturumTablosu()
      const b = (t as unknown as { from: (t: string) => Record<string, unknown> }).from(tablo)
      return new Proxy(b, {
        get(bt, bk) {
          if (typeof bk === 'string' && YAZMA.has(bk)) { yutulanYazmalar[tablo] = (yutulanYazmalar[tablo] || 0) + 1; return () => bosSonuc() }
          const v = (bt as Record<string, unknown>)[bk as string]
          return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(bt) : v
        },
      })
    }
    if (k === 'rpc') return () => { yutulanYazmalar.rpc = (yutulanYazmalar.rpc || 0) + 1; return bosSonuc() }
    const v = (t as unknown as Record<string, unknown>)[k as string]
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v
  },
}) as typeof gercek

/* ---------- LLM call counter + per-call log (model, status, finish_reason, shape, latency) ---------- */
type Cagri = { model: string; durum: number; ms: number; bitis?: string; metin?: number; arac?: number; hata?: string; girdi?: number; cikti?: number; onbellek?: number; maliyet?: number }
const sayac = { cagri: 0, girdi: 0, cikti: 0, onbellek: 0, maliyet: 0, modeller: {} as Record<string, number> }
let cagriGunlugu: Cagri[] = []
let yedekSatirlari: string[] = []
const eskiWarn = console.warn
console.warn = (...a: unknown[]) => { const m = a.map(String).join(' '); if (/\[ai\/(yedek|akis)\]/.test(m)) yedekSatirlari.push(m); eskiWarn(...a) }
const gercekFetch = globalThis.fetch
globalThis.fetch = (async (u: RequestInfo | URL, o?: RequestInit) => {
  const url = typeof u === 'string' ? u : u instanceof URL ? u.href : u.url
  const llm = /openrouter\.ai|api\.anthropic\.com/.test(url)
  if (!llm) return gercekFetch(u, o)
  const t0 = Date.now()
  const govde = o?.body ? JSON.parse(String(o.body)) as { model?: string } : {}
  const kayit: Cagri = { model: String(govde.model || '?'), durum: 0, ms: 0 }
  sayac.cagri++
  sayac.modeller[kayit.model] = (sayac.modeller[kayit.model] || 0) + 1
  cagriGunlugu.push(kayit)
  let r: Response
  try { r = await gercekFetch(u, o) } catch (e) { kayit.ms = Date.now() - t0; kayit.hata = `ag:${String((e as Error)?.message || e).slice(0, 80)}`; throw e }
  kayit.durum = r.status
  try {
    const ct = r.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const j = await r.clone().json() as { usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number; cost?: number; prompt_tokens_details?: { cached_tokens?: number } }; error?: { message?: string }; choices?: { finish_reason?: string; message?: { content?: string | null; tool_calls?: unknown[]; refusal?: string } }[] }
      kayit.girdi = j.usage?.prompt_tokens ?? j.usage?.input_tokens ?? 0
      kayit.cikti = j.usage?.completion_tokens ?? j.usage?.output_tokens ?? 0
      kayit.onbellek = j.usage?.prompt_tokens_details?.cached_tokens ?? 0
      kayit.maliyet = Number(j.usage?.cost) || 0
      sayac.girdi += kayit.girdi; sayac.cikti += kayit.cikti; sayac.onbellek += kayit.onbellek; sayac.maliyet += kayit.maliyet
      if (j.error?.message) kayit.hata = `api:${String(j.error.message).slice(0, 120)}`
      const c = j.choices?.[0]
      if (c) { kayit.bitis = c.finish_reason; kayit.metin = (c.message?.content || '').length; kayit.arac = c.message?.tool_calls?.length || 0; if (c.message?.refusal) kayit.hata = `refusal:${String(c.message.refusal).slice(0, 80)}` }
    } else if (!r.ok) kayit.hata = `http:${(await r.clone().text().catch(() => '')).slice(0, 120)}`
  } catch { /* sayaç kritik değil */ }
  kayit.ms = Date.now() - t0
  return r
}) as typeof fetch

// The direct Anthropic path (koruyucu / NOTYA_MODEL_HIZLI=anthropic/…) goes through the SDK, not global fetch.
try {
  const sdk = await import('@anthropic-ai/sdk')
  const Messages = (sdk.default as unknown as { Messages?: { prototype: { create: (...a: unknown[]) => Promise<unknown> } } }).Messages
  if (Messages) {
    const orijinal = Messages.prototype.create
    Messages.prototype.create = function (this: unknown, ...a: unknown[]) {
      sayac.cagri++
      const model = String((a[0] as { model?: string })?.model || 'anthropic')
      sayac.modeller[model] = (sayac.modeller[model] || 0) + 1
      const p = orijinal.apply(this, a)
      return typeof (p as Promise<unknown>).then === 'function'
        ? (p as Promise<{ usage?: { input_tokens?: number; output_tokens?: number } }>).then((r) => { sayac.girdi += r?.usage?.input_tokens ?? 0; sayac.cikti += r?.usage?.output_tokens ?? 0; return r })
        : p
    }
  }
} catch { /* SDK yoksa sayaç yalnız fetch */ }

/* ---------- run ---------- */
const { ayseCevapla } = await import('../../lib/asistan/ayseCevapla')
const { data: doktor } = await gercek.from('users').select('id, email, specialty').eq('email', DOKTOR).maybeSingle()
if (!doktor) { console.error('Doktor yok:', DOKTOR); process.exit(2) }
const doktorId = String(doktor.id)
const specialty = String(doktor.specialty || 'pediatri')
const cikti = path.join(process.cwd(), '.denetim-out')
fs.mkdirSync(cikti, { recursive: true })
const jsonl = path.join(cikti, `${ETIKET}.jsonl`)
fs.writeFileSync(jsonl, '')

const oturumKimlikleri = new Map<string, string | null>()
const secilen = SORULAR.filter((s) => !SADECE || SADECE.includes(s.no))
let gecti = 0
for (const s of secilen) {
  const oncekiCagri = sayac.cagri
  cagriGunlugu = []; yedekSatirlari = []
  const t0 = Date.now()
  const oturumId = oturumKimlikleri.get(s.oturum) ?? null
  let ekran = ''
  let hata = ''
  let aktifHasta: string | null = null
  try {
    const r = await ayseCevapla({
      supabase, doktorId, oturumId, mesaj: s.soru, kanal: KANAL, specialty, patientId: s.hasta || null,
      personaId: 'aysekaya', saatDilimi: TZ,
      ...(KANAL === 'ses' ? { sozParcasi: () => { /* ses akışı ölçülmüyor */ } } : {}),
    })
    if (r.ok) { ekran = r.cevap.ekran; aktifHasta = r.cevap.aktifHasta; if (r.cevap.oturumId) oturumKimlikleri.set(s.oturum, r.cevap.oturumId) }
    else { ekran = r.soz; hata = `HTTP ${r.durum}: ${JSON.stringify(r.govde)}` }
  } catch (e) { hata = e instanceof Error ? e.message : String(e); ekran = '' }
  const ms = Date.now() - t0
  const cagri = sayac.cagri - oncekiCagri
  const eksik = (s.icerir || []).filter((re) => !new RegExp(re, 'iu').test(ekran))
  const fazla = (s.icermez || []).filter((re) => new RegExp(re, 'iu').test(ekran))
  const lunaFail = /luna_fail:[a-z_]+:[a-z_0-9]+/.exec(hata)?.[0] || ''
  const otomatik = !hata && eksik.length === 0 && fazla.length === 0
  if (otomatik) gecti++
  const satir = { no: s.no, kat: s.kat, oturum: s.oturum, soru: s.soru, hasta: s.hasta || null, cevap: ekran, aktifHasta, kaynak: cagri ? 'model' : 'deterministik', llm: cagri, ms, otomatik, eksik, fazla, hata, lunaFail, cagrilar: cagriGunlugu, yedek: yedekSatirlari, not: s.not || '' }
  fs.appendFileSync(jsonl, JSON.stringify(satir) + '\n')
  console.log(`${String(s.no).padStart(3)} ${otomatik ? 'OK ' : 'FAIL'} ${s.kat.padEnd(10)} ${cagri ? 'model' : 'determ'} ${(ms / 1000).toFixed(1)}s  ${s.soru.slice(0, 60)}${lunaFail ? '  ' + lunaFail : ''}`)
}
console.log(JSON.stringify({ toplam: secilen.length, gecti, kaldi: secilen.length - gecti, llm: sayac, yutulanYazmalar, dosya: path.relative(process.cwd(), jsonl) }))
