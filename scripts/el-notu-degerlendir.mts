/**
 * ESNEK-MUAYENE-A — El Notu Okuyucu evaluation harness.
 *
 *   npx tsx scripts/el-notu-degerlendir.mts --klasor <dir> [--sablon <file>] [--serbest] [--model canli|karma|kayit|yok] [--sayfa id,id]
 *                                           [--kayit <dir>] [--cikti <dir>] [--okuma 1-3] [--butce n]
 *                                           [--uzak https://<host>/api/kurucu/el-notu-degerlendir [--kademe hizli|derin]]
 *                                           [--anthropic-model <id> [--anthropic-effort low|medium|high|xhigh|max] [--normal-model <id>]]
 *
 * --anthropic-model (model comparison, TEST ONLY): the image reads go straight to that Anthropic model (Messages API,
 * ANTHROPIC_API_KEY from the environment, never printed), bypassing the central policy — production routing is not
 * touched. Reports real usage: tokens, list-price cost per page, reading wall time per page, and the reading ceiling
 * (facts present anywhere in the model's output). Use a separate --cikti per model (replay keys do not carry the model).
 *
 * --uzak (ESNEK-READER-2): the PRODUCTION model path without handling its key — the masked package of each page (built
 * here by the on-device masker) goes to the admin evaluation route, which runs the reader server-side and returns metrics
 * and the de-identified reading only (it refuses a page whose masking it cannot prove, and stores nothing). The route's
 * authorization is read from the environment variable EL_NOTU_DEGERLENDIR_YETKI (a founder session token or the cron
 * secret) and is never printed or written.
 *
 * --uzak … --cagri (ESNEK-A-EVAL, 2026-11-24): the reader orchestration runs HERE (so it can be tuned without a deploy per
 * change) and only each model call goes to the route's single-call mode; pictures travel as references into the page's
 * masked package (re-proven by the route on every call). Answers are recorded under --kayit / <cikti>/kayit like a canli
 * run, so --model kayit / karma replay them locally. Usage (tokens → US$ at the Luna list price) and wall time per page.
 * Authorization: EL_NOTU_DEGERLENDIR_ANAHTARI (a short-lived evaluation pass, header x-degerlendirme-anahtari) or
 * EL_NOTU_DEGERLENDIR_YETKI (Bearer); neither is ever printed or written.
 *
 * <dir> holds page images (jpg / png / pdf pages as images) and `dogruluk.json` (clinical ground truth only — see
 * /home/claude/esnek-eval/dogruluk.json for the format). Real patient pages NEVER go into this repo: keep the folder
 * outside it. The harness runs the SAME device pipeline as the browser (core/elNotu/sayfaPaketi.ts, Node canvas + the
 * same self-hosted tesseract language data), then — when a model is available — the same reader (core/elNotu/okuyucu.ts)
 * through the production model path (lib/ai/cagir.ts, needs OPENROUTER_API_KEY or ANTHROPIC_API_KEY in the environment).
 *
 * Reports (numbers only; no identity is ever printed or written):
 *  - privacy: page verdict, masking reason, identity leak check (OCR of every outbound picture: identity labels, ≥ 9-digit
 *    runs, e-mail addresses must be absent), lines found;
 *  - reading (model runs only): clinical-fact accuracy (found / asked-to-confirm / missed), invented facts (output content
 *    words traceable to neither the page's ground truth nor the lexicon — must be 0), Doğrula questions per page,
 *    per-word accuracy when the ground truth carries a word transcription.
 * --model kayit replays recorded model answers from --kayit (written by a previous canli run) for deterministic re-runs.
 *
 * --ogren <page,page,…> (ESNEK-KBB2, 2026-11-25): the DOCTOR'S LEARNING LOOP, end to end through the production code —
 * before the measured pages are read, each learning page is read and its Doğrula questions are answered the way the doctor
 * answers them in the app: the reading is stored as a source, the answers go through lib/elNotu/dogrulaServisi.ts
 * cevaplariUygula (abbreviation → his lexicon, word / line → his handwriting memory with the masked crop and its shape
 * descriptor, exactly as DogrulaPaneli sends them), and the page's note is approved (his vocabulary). The measured pages
 * are then read with the context built the way lib/elNotu/okumaServisi.ts builds it (lexicon, memory + crops from the
 * vault, vocabulary, asked abbreviations, learned outline). Everything lives in an in-memory database
 * (lib/security/testing/sahteSupabase.ts) and is dropped at exit; nothing is written anywhere. The answers come from the
 * folder's ground truth: `metin` (clinical transcription of the page, identity never written, "?" = unreadable — never
 * answered) and `kisaltmalar.json` (the doctor's own expansions, the answer he types to an abbreviation question).
 * A question the transcription cannot answer is skipped (the doctor's "okunamadı"), never guessed.
 * --kayitsiz: without the build's registry forms (the "before" of ESNEK-KBB2).
 * --ogrenme-kaydet <file> / --ogrenme-yukle <file>: share one learning pass between processes (file outside the repo).
 */
import fs from 'node:fs'
import path from 'node:path'
import jpeg from 'jpeg-js'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createWorker, type Worker } from 'tesseract.js'
import { sayfaPaketiHazirla, type TuvalAdaptoru } from '../core/elNotu/sayfaPaketi'
import { parmakIzi } from '../core/elNotu/sablon'
import { sayfayiHazirla } from '../core/elNotu/onisleme'
import { sayfayiOku, kaynakMetni, type ModelKapisi } from '../core/elNotu/okuyucu'
import { sayfaPuanla, toplamPuan, icerir, type SayfaPuani } from '../core/elNotu/degerlendirme'
import { kayitAnahtari, gorselGirdi } from '../core/elNotu/regresyonBekcisi'
import { anahatOgren } from '../core/elNotu/anahat'
import { sozlukKur } from '../core/elNotu/sozluk'
import { tohumlarTr, anahatTr, kayitliSablonlarTr } from '../core/elNotu/tohum'
import { EL_NOTU_TR } from '../core/elNotu/metinTr'
import { kelimeAnahtari, satirBenzerligi, benzerlik } from '../core/elNotu/uzlastir'
import type { OcrSatir } from '../core/belgeler/kimlikMaske'
import type { Rgba, Sablon } from '../core/elNotu/tipler'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const bayrak = (ad: string) => process.argv.includes(`--${ad}`)
const klasor = arg('klasor')
if (!klasor || !fs.existsSync(klasor)) { console.error('--klasor <dir> gerekli'); process.exit(2) }
const KOK = path.resolve(new URL('.', import.meta.url).pathname, '..')
if (path.resolve(klasor).startsWith(KOK)) { console.error('Gerçek sayfalar repo içinde tutulamaz: klasörü repo dışına taşıyın.'); process.exit(2) }
const cikti = arg('cikti')
const modelTuru = (arg('model') || (process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || (process.argv.includes('--uzak') && process.argv.includes('--cagri')) ? 'canli' : 'yok')) as 'canli' | 'karma' | 'kayit' | 'yok'
const kayitKlasoru = arg('kayit') || (cikti ? path.join(cikti, 'kayit') : undefined)
const okumaSayisi = arg('okuma') ? Number(arg('okuma')) : undefined
const butce = arg('butce') ? Number(arg('butce')) : undefined
const uzak = arg('uzak')
const kademe = arg('kademe') as 'hizli' | 'derin' | undefined
const uzakCagri = !!uzak && bayrak('cagri')
/** Route authorization (never printed): the evaluation pass if set, else the Bearer secret. */
function uzakBasliklari(): Record<string, string> {
  const anahtar = process.env.EL_NOTU_DEGERLENDIR_ANAHTARI, yetki = process.env.EL_NOTU_DEGERLENDIR_YETKI
  if (anahtar) return { 'content-type': 'application/json', 'x-degerlendirme-anahtari': anahtar }
  if (yetki) return { 'content-type': 'application/json', authorization: `Bearer ${yetki}` }
  throw new Error('EL_NOTU_DEGERLENDIR_ANAHTARI / EL_NOTU_DEGERLENDIR_YETKI is not set')
}
// model comparison (test only, never production): image reads (page reads + drawing read) go straight to this Anthropic
// model id; the clinical normalisation goes to --normal-model (default: the same id). Needs ANTHROPIC_API_KEY; run Node
// with NODE_USE_ENV_PROXY=1 behind a proxy. --anthropic-effort sets output_config.effort on the image reads only.
const dogrudanModel = arg('anthropic-model')
const dogrudanCaba = arg('anthropic-effort')
const normalModeli = arg('normal-model') || dogrudanModel

type Gercek = { id: string; metin: string; anahtarlar: string[][]; korumali?: boolean; belirsiz?: boolean }
type Dogruluk = { sayfalar: Record<string, { tur: 'anlati' | 'form'; kimlik: boolean; gercekler: Gercek[]; kelimeler?: string; metin?: string }> }
const dogruluk = JSON.parse(fs.readFileSync(path.join(klasor, 'dogruluk.json'), 'utf8')) as Dogruluk

const tuval: TuvalAdaptoru = {
  async jpeg(r, kalite) { const c = createCanvas(r.w, r.h); const ctx = c.getContext('2d'); const id = ctx.createImageData(r.w, r.h); id.data.set(r.d); ctx.putImageData(id, 0, 0); return (await c.encode('jpeg', Math.round(kalite * 100))).toString('base64') },
}
let isci: Worker | null = null
async function ocr(r: Rgba): Promise<OcrSatir[] | null> {
  try {
    if (!isci) isci = await createWorker('tur+eng', 1, { langPath: path.join(KOK, 'public/tesseract/lang'), gzip: true, cachePath: path.join(process.env.TMPDIR || '/tmp', 'el-notu-tess') })
    const c = createCanvas(r.w, r.h); const ctx = c.getContext('2d'); const id = ctx.createImageData(r.w, r.h); id.data.set(r.d); ctx.putImageData(id, 0, 0)
    const { data } = await isci.recognize(c.toBuffer('image/png'), {}, { blocks: true })
    const satirlar = ((data as unknown as { blocks?: { paragraphs?: { lines?: { words?: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[] }[] }[] }[] }).blocks || []).flatMap((b) => (b.paragraphs || []).flatMap((p) => p.lines || []))
    return satirlar.map((l) => ({ kelimeler: (l.words || []).filter((w) => w.text.trim()).map((w) => ({ text: w.text, x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1, conf: w.confidence })) }))
  } catch { return null }
}

async function raster(dosya: string): Promise<Rgba> {
  if (/\.jpe?g$/i.test(dosya)) { const im = jpeg.decode(fs.readFileSync(dosya), { useTArray: true, maxMemoryUsageInMB: 1024 }); return { w: im.width, h: im.height, d: new Uint8ClampedArray(im.data.buffer) } }
  const img = await loadImage(fs.readFileSync(dosya)); const c = createCanvas(img.width, img.height); const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
  return { w: img.width, h: img.height, d: new Uint8ClampedArray(ctx.getImageData(0, 0, img.width, img.height).data) }
}

/** Leak check of one outbound picture: identity labels, long digit runs or e-mails visible to OCR = leak. */
const ETIKET_SIZINTI = /\b(t\.?\s?c\.?\s?kimlik|ad[iı][\s-]*soyad|kimlik\s*no|passport|name\s*\/?\s*surname|date\s*of\s*birth|do[gğ]um\s*tarih|gsm|e-?posta|e-?mail|ev\s*adres|address|mobile\s*phone)/i
async function sizintiVarMi(b64: string): Promise<boolean> {
  const img = await loadImage(Buffer.from(b64, 'base64'))
  const c = createCanvas(img.width, img.height); const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
  const r: Rgba = { w: img.width, h: img.height, d: new Uint8ClampedArray(ctx.getImageData(0, 0, img.width, img.height).data) }
  const o = await ocr(r)
  if (!o) return false
  const metin = o.map((l) => l.kelimeler.filter((w) => w.conf >= 55).map((w) => w.text).join(' ')).join('\n')
  return ETIKET_SIZINTI.test(metin) || /\d[\d\s.\-/]{8,}\d/.test(metin) || /\S+@\S+\.\S+/.test(metin)
}

/** Token estimate of one live call (images: Anthropic's w·h/750 after the ≤1568 px / 1.15 MP resize; text: chars/3.5). */
const jeton = { girdi: 0, cikti: 0, cagri: 0 }
async function gorselJetonu(b64: string): Promise<number> {
  const img = await loadImage(Buffer.from(b64, 'base64'))
  let w = img.width, h = img.height
  const o = Math.min(1, 1568 / Math.max(w, h), Math.sqrt(1_150_000 / (w * h)))
  w *= o; h *= o
  return Math.ceil((w * h) / 750)
}
async function jetonSay(sistem: string, parcalar: { tur: string; metin?: string; gorsel?: { base64: string } }[] | string, y: unknown) {
  let g = sistem.length / 3.5
  if (typeof parcalar === 'string') g += parcalar.length / 3.5
  else for (const p of parcalar) g += p.tur === 'metin' ? (p.metin || '').length / 3.5 : await gorselJetonu(p.gorsel!.base64)
  jeton.girdi += Math.ceil(g); jeton.cikti += Math.ceil(JSON.stringify(y ?? '').length / 3); jeton.cagri++
}

/**
 * Direct Anthropic Messages call (model comparison only). Streams (long adaptive-thinking reads), keeps only text blocks,
 * records the real usage (tokens, cost at list price, wall time). Output room: thinking counts toward max_tokens on the
 * adaptive-thinking models, so the reader's own budget gets +24k headroom (the same for every model compared).
 */
const FIYAT: [RegExp, number, number][] = [[/gpt-6-luna/, 0.1, 0.5], [/fable-5-2|mythos-5-2/, 8, 40], [/fable|mythos/, 10, 50], [/opus-5-5/, 4, 20], [/opus/, 5, 25], [/sonnet-4/, 3, 15], [/sonnet/, 2, 10], [/haiku-5-5/, 0.1, 0.5], [/haiku/, 1, 5]]
type Kullanim = { cagri: number; ms: number; girdi: number; cikti: number; onbellekYaz: number; onbellekOku: number; usd: number; kesik: number }
const bosKullanim = (): Kullanim => ({ cagri: 0, ms: 0, girdi: 0, cikti: 0, onbellekYaz: 0, onbellekOku: 0, usd: 0, kesik: 0 })
const kullanim: Record<'gorsel' | 'normal', Kullanim> = { gorsel: bosKullanim(), normal: bosKullanim() }
let sayfaKullanimi = bosKullanim()
/** Usage reported by the route (provider tokens) → the same accumulators, priced by model. */
type UzakKullanim = { cagri: number; girdi: number; cikti: number; onbellekOku: number; onbellekYaz: number; kesik: number; modeller: string[]; ms: number }
const uzakModeller = new Set<string>()
function uzakKullanimEkle(u: UzakKullanim | undefined, tur: 'gorsel' | 'normal') {
  if (!u) return
  u.modeller.forEach((m) => uzakModeller.add(m))
  const m = u.modeller[0] || ''
  const f = FIYAT.find(([r]) => r.test(m)) || [/x/, 0, 0]
  const usd = ((u.girdi + u.onbellekYaz) * f[1] + u.onbellekOku * f[1] + u.cikti * f[2]) / 1e6
  for (const k of [kullanim[tur], sayfaKullanimi]) { k.cagri += u.cagri; k.ms += u.ms; k.girdi += u.girdi; k.cikti += u.cikti; k.onbellekYaz += u.onbellekYaz; k.onbellekOku += u.onbellekOku; k.usd += usd; k.kesik += u.kesik }
}

function dogrudanBloklar(parcalar: Parameters<ModelKapisi['gorselJson']>[0]['parcalar']): unknown[] {
  return parcalar.map((p) => (p.tur === 'metin' ? { type: 'text', text: p.metin } : { type: 'image', source: { type: 'base64', media_type: /^image\/(jpeg|png|webp)$/.test(p.gorsel.mime) ? p.gorsel.mime : 'image/jpeg', data: p.gorsel.base64 } }))
}
async function dogrudanCagir(model: string, sistem: string, icerik: unknown, azami: number, caba: string | undefined, tur: 'gorsel' | 'normal'): Promise<unknown> {
  const anahtar = process.env.ANTHROPIC_API_KEY
  if (!anahtar) throw new Error('ANTHROPIC_API_KEY is not set')
  const t0 = Date.now()
  const y = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': anahtar, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: azami + 24000, stream: true, system: [{ type: 'text', text: sistem, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: icerik }], ...(caba ? { output_config: { effort: caba } } : {}) }),
  })
  if (!y.ok || !y.body) throw new Error(`anthropic ${y.status} ${(await y.text()).slice(0, 200)}`)
  let metin = '', tampon = '', durma = ''
  const u = { girdi: 0, cikti: 0, yaz: 0, oku: 0 }
  const blokTuru = new Map<number, string>()
  const coz = new TextDecoder()
  for await (const parca of y.body as unknown as AsyncIterable<Uint8Array>) {
    tampon += coz.decode(parca, { stream: true })
    let i: number
    while ((i = tampon.indexOf('\n')) >= 0) {
      const satir = tampon.slice(0, i).trim(); tampon = tampon.slice(i + 1)
      if (!satir.startsWith('data:')) continue
      const o = JSON.parse(satir.slice(5)) as Record<string, any>
      if (o.type === 'message_start') { const m = o.message.usage || {}; u.girdi = m.input_tokens || 0; u.yaz = m.cache_creation_input_tokens || 0; u.oku = m.cache_read_input_tokens || 0; u.cikti = m.output_tokens || 0 }
      else if (o.type === 'content_block_start') blokTuru.set(o.index, o.content_block?.type)
      else if (o.type === 'content_block_delta' && o.delta?.type === 'text_delta' && blokTuru.get(o.index) === 'text') metin += o.delta.text
      else if (o.type === 'message_delta') { if (o.usage?.output_tokens != null) u.cikti = o.usage.output_tokens; if (o.delta?.stop_reason) durma = o.delta.stop_reason }
      else if (o.type === 'error') throw new Error(`anthropic stream ${o.error?.type || 'error'}`)
    }
  }
  const f = FIYAT.find(([r]) => r.test(model)) || [/x/, 0, 0]
  const usd = (u.girdi * f[1] + u.yaz * f[1] * 1.25 + u.oku * f[1] * 0.1 + u.cikti * f[2]) / 1e6
  for (const k of [kullanim[tur], sayfaKullanimi]) { k.cagri++; k.ms += Date.now() - t0; k.girdi += u.girdi; k.cikti += u.cikti; k.onbellekYaz += u.yaz; k.onbellekOku += u.oku; k.usd += usd; if (durma === 'max_tokens') k.kesik++ }
  const { jsonOnarDetay } = await import('../lib/ai/jsonOnar')
  const r = jsonOnarDetay(metin)
  if (r.neden !== 'ok') throw new Error(`el-notu json ${r.neden}${durma === 'max_tokens' ? ' (max_tokens)' : ''}`)
  return r.deger
}

let disariOrnek = 0
type SayfaKaynagi = { paket: import('../core/elNotu/okuyucu').SayfaPaketi; maskeliSayfa: import('../core/elNotu/okuyucu').GorselBlok }
/** A picture of a call → its reference into the masked package (the route resolves it after re-proving the mask). */
function uzakParcalar(parcalar_: Parameters<ModelKapisi['gorselJson']>[0]['parcalar'], k: SayfaKaynagi): unknown[] {
  // the doctor's confirmed crops (in-context examples, --ogren) are masked crops from earlier pages, but the route can only
  // re-prove THIS page's package: they are left out of the remote call (with their "= text" line and the heading), and
  // counted — the handwriting-memory examples are measured only on a local model path
  const parcalar: typeof parcalar_ = []
  const icinde = (b64: string) => b64 === k.maskeliSayfa.base64 || (k.paket.parcalar || []).some((t) => t.gorsel.base64 === b64) || k.paket.bolgeler.some((b) => b.gorsel?.base64 === b64)
  for (let i = 0; i < parcalar_.length; i++) {
    const p = parcalar_[i]
    if (p.tur === 'gorsel' && !icinde(p.gorsel.base64)) { disariOrnek++; if (parcalar_[i + 1]?.tur === 'metin' && /^= "/.test((parcalar_[i + 1] as { metin: string }).metin)) i++; continue }
    parcalar.push(p)
  }
  const ornekVar = parcalar.some((p, i) => p.tur === 'metin' && /^= "/.test(p.metin) && parcalar[i - 1]?.tur === 'gorsel')
  return parcalar.filter((p) => ornekVar || !(p.tur === 'metin' && p.metin.startsWith('Confirmed examples of THIS physician'))).map((p) => {
    if (p.tur === 'metin') return p
    if (p.gorsel.base64 === k.maskeliSayfa.base64) return { tur: 'ref', ref: 'sayfa' }
    const i = (k.paket.parcalar || []).findIndex((t) => t.gorsel.base64 === p.gorsel.base64)
    if (i >= 0) return { tur: 'ref', ref: `parca:${i}` }
    const b = k.paket.bolgeler.find((x) => x.gorsel?.base64 === p.gorsel.base64)
    if (b) return { tur: 'ref', ref: `bolge:${b.id}` }
    throw new Error('a picture outside the masked package cannot be sent')
  })
}
async function uzakCagir(k: SayfaKaynagi, cagri: Record<string, unknown>, tur: 'gorsel' | 'normal'): Promise<unknown> {
  for (let deneme = 0; ; deneme++) {
    const y = await fetch(uzak!, { method: 'POST', headers: uzakBasliklari(), body: JSON.stringify({ paket: k.paket, maskeliSayfa: k.maskeliSayfa, cagri, secenek: { kademe: tur === 'gorsel' ? kademe : undefined } }) })
    const j = await y.json().catch(() => ({})) as { cevap?: unknown; kullanim?: UzakKullanim; error?: string }
    uzakKullanimEkle(j.kullanim, tur)
    if (y.ok && j.cevap !== undefined) return j.cevap
    // transport trouble (5xx / timeout) once more; a refusal (4xx) is final
    if (y.status < 500 || deneme >= 1) throw new Error(`route ${y.status} ${j.error || ''}`)
  }
}

function modelKapisi(sayfaAdi: string, kaynak?: SayfaKaynagi): ModelKapisi | null {
  // the replay key covers the system prompt and every input (images by their first bytes), so a prompt change re-asks
  // the same replay key as the weekly regression run and the regression guard (core/elNotu/regresyonBekcisi.ts)
  const anahtar = (etiket: string, sistem: string, girdi: unknown) => kayitAnahtari(sayfaAdi, etiket, sistem, girdi)
  const kayittan = (f: string) => (kayitKlasoru && fs.existsSync(path.join(kayitKlasoru, f)) ? JSON.parse(fs.readFileSync(path.join(kayitKlasoru, f), 'utf8')) : undefined)
  const kaydet = (f: string, y: unknown) => { if (kayitKlasoru) { fs.mkdirSync(kayitKlasoru, { recursive: true }); fs.writeFileSync(path.join(kayitKlasoru, f), JSON.stringify(y)) } }
  if (modelTuru === 'kayit') {
    if (!kayitKlasoru) return null
    const oku = (f: string) => { const y = kayittan(f); if (y === undefined) throw new Error('kayıt yok'); return y }
    return { async gorselJson(o) { return oku(anahtar(o.etiket, o.sistem, gorselGirdi(o))) }, async metinJson(o) { return oku(anahtar(o.etiket, o.sistem, o.mesaj)) } }
  }
  if (modelTuru !== 'canli' && modelTuru !== 'karma') return null
  // the production path (lib/ai/cagir.ts → central model policy); answers recorded for replay. karma = replay what was
  // already asked with the same prompt and input, ask the model only for the rest (cheap re-runs while iterating)
  const sor = async (etiket: string, f: string, cagir: () => Promise<unknown>, say: (y: unknown) => Promise<void>) => {
    if (modelTuru === 'karma') { const y = kayittan(f); if (y !== undefined) return y }
    let y: unknown
    try { y = await cagir() } catch (e) { console.error(`[el-notu] ${sayfaAdi} ${etiket} call failed: ${e instanceof Error ? e.message.slice(0, 160) : 'error'}`); throw e }
    await say(y)
    kaydet(f, y)
    return y
  }
  if (uzakCagri && kaynak) {
    return {
      async gorselJson(o) {
        return sor(o.etiket, anahtar(o.etiket, o.sistem, gorselGirdi(o)), () => uzakCagir(kaynak, { tur: 'gorsel', etiket: o.etiket, sistem: o.sistem, parcalar: uzakParcalar(o.parcalar, kaynak), azamiToken: o.azamiToken }, 'gorsel'), async () => {})
      },
      async metinJson(o) {
        return sor(o.etiket, anahtar(o.etiket, o.sistem, o.mesaj), () => uzakCagir(kaynak, { tur: 'metin', etiket: o.etiket, sistem: o.sistem, mesaj: o.mesaj, azamiToken: o.azamiToken }, 'normal'), async () => {})
      },
    }
  }
  if (dogrudanModel) {
    return {
      async gorselJson(o) {
        return sor(o.etiket, anahtar(o.etiket, o.sistem, gorselGirdi(o)), () => dogrudanCagir(dogrudanModel, o.sistem, dogrudanBloklar(o.parcalar), o.azamiToken, dogrudanCaba, 'gorsel'), (y) => jetonSay(o.sistem, o.parcalar as never, y))
      },
      async metinJson(o) {
        return sor(o.etiket, anahtar(o.etiket, o.sistem, o.mesaj), () => dogrudanCagir(normalModeli!, o.sistem, o.mesaj, o.azamiToken, undefined, 'normal'), (y) => jetonSay(o.sistem, o.mesaj, y))
      },
    }
  }
  return {
    async gorselJson(o) {
      const { elNotuModeli } = await import('../lib/elNotu/model')
      return sor(o.etiket, anahtar(o.etiket, o.sistem, gorselGirdi(o)), () => elNotuModeli({ doctorId: null }).gorselJson(o), (y) => jetonSay(o.sistem, o.parcalar as never, y))
    },
    async metinJson(o) {
      const { elNotuModeli } = await import('../lib/elNotu/model')
      return sor(o.etiket, anahtar(o.etiket, o.sistem, o.mesaj), () => elNotuModeli({ doctorId: null }).metinJson(o), (y) => jetonSay(o.sistem, o.mesaj, y))
    },
  }
}

// ---- ESNEK-KBB2: the doctor's learning loop through the production learning path (in-memory database) ----
type OgrenmeDurumu = { sb: import('@supabase/supabase-js').SupabaseClient; db: import('../lib/security/testing/sahteSupabase').SahteVeritabani; doktorId: string; hastaId: string; kisaltmalar: Record<string, string>; sayac: { soru: number; cevap: number; kisaltma: number; hafiza: number; atlandi: number } }
let ogrenme: OgrenmeDurumu | null = null
async function ogrenmeKur(): Promise<OgrenmeDurumu> {
  // a local key for the in-memory vault only (crops are encrypted like in production, then dropped at exit)
  process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || `harness-yerel-${Date.now()}`
  const { SahteVeritabani } = await import('../lib/security/testing/sahteSupabase')
  const { randomUUID } = await import('node:crypto')
  const db = new SahteVeritabani()
  const doktorId = randomUUID()
  db.ekle('users', { id: doktorId, specialty: 'kulak-burun-bogaz' })
  const hastaId = db.ekle('patients', { doctor_id: doktorId, is_active: true }).id as string
  const kf = path.join(klasor!, 'kisaltmalar.json')
  const kisaltmalar = fs.existsSync(kf) ? JSON.parse(fs.readFileSync(kf, 'utf8')) as Record<string, string> : {}
  return { sb: db.istemci() as never, db, doktorId, hastaId, kisaltmalar: Object.fromEntries(Object.entries(kisaltmalar).map(([k, v]) => [kelimeAnahtari(k), v])), sayac: { soru: 0, cevap: 0, kisaltma: 0, hafiza: 0, atlandi: 0 } }
}

/**
 * --ogrenme-kaydet <file> / --ogrenme-yukle <file>: the learned in-memory database written to / read from a local file
 * OUTSIDE the repo, so several measuring processes can share one learning pass (masked crops + clinical words only; the
 * caller deletes the file when the run ends).
 */
function ogrenmeKaydet(dosya: string) {
  const o = ogrenme!
  const kodla = (v: unknown): unknown => (v instanceof Uint8Array ? { __b64: Buffer.from(v).toString('base64') } : v)
  const veri = { doktorId: o.doktorId, hastaId: o.hastaId, anahtar: process.env.ENCRYPTION_MASTER_KEY, tablolar: Object.fromEntries(o.db.tablolar), bloblar: Object.fromEntries(o.db.bloblar), depolama: Object.fromEntries([...o.db.depolama].map(([k, m]) => [k, Object.fromEntries([...m].map(([y, v]) => [y, kodla(v)]))])) }
  if (path.resolve(dosya).startsWith(KOK)) throw new Error('the learning file stays outside the repo')
  fs.writeFileSync(dosya, JSON.stringify(veri), { mode: 0o600 })
}
async function ogrenmeYukle(dosya: string) {
  const veri = JSON.parse(fs.readFileSync(dosya, 'utf8')) as { doktorId: string; hastaId: string; anahtar: string; tablolar: Record<string, Record<string, unknown>[]>; bloblar?: Record<string, string>; depolama: Record<string, Record<string, unknown>> }
  process.env.ENCRYPTION_MASTER_KEY = veri.anahtar
  ogrenme = await ogrenmeKur()
  ogrenme.doktorId = veri.doktorId; ogrenme.hastaId = veri.hastaId
  ogrenme.db.tablolar = new Map(Object.entries(veri.tablolar))
  ogrenme.db.bloblar = new Map(Object.entries(veri.bloblar || {}))
  const coz = (v: unknown) => (v && typeof v === 'object' && '__b64' in (v as object) ? Buffer.from((v as { __b64: string }).__b64, 'base64') : v)
  ogrenme.db.depolama = new Map(Object.entries(veri.depolama).map(([k, m]) => [k, new Map(Object.entries(m).map(([y, v]) => [y, coz(v)]))]))
  ogrenme.sb = ogrenme.db.istemci() as never
}

/** The reading context — from the learning database exactly as okumaServisi.ts builds it, or the empty first-day doctor. */
async function okumaBaglami(paket: import('../core/elNotu/okuyucu').SayfaPaketi, sayfaGorseli: import('../core/elNotu/okuyucu').GorselBlok) {
  const ilac = (await import('../lib/elNotu/ilac')).ilacEslesmesi
  const tohum = tohumlarTr('kulak-burun-bogaz')
  if (!ogrenme) {
    const sozluk = sozlukKur([], tohum.brans, tohum.genel)
    const anlam = new Set(sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari))
    return { bransAdi: 'Kulak Burun Boğaz', dil: EL_NOTU_TR.dil, sozluk, hafiza: [], dagarcik: new Map<string, number>(), sorulmusKisaltmalar: new Set<string>(), ilac, sozcukMu: (t: string) => anlam.has(kelimeAnahtari(t)), sayfaGorseli, anahat: anahatOgren([], anahatTr('kulak-burun-bogaz')), okumaSayisi, dogrulaButcesi: butce }
  }
  const S = await import('../lib/elNotu/sunucu')
  const { benzerOrnekler } = await import('../core/elNotu/hafiza')
  const { sb, doktorId } = ogrenme
  const [hekimSozluk, hafiza, { dagarcik, sozcukler: hekimSozcukleri }, sorulmus, metinler] = await Promise.all([S.sozlukYukle(sb, doktorId), S.hafizaYukle(sb, doktorId), S.yaziDagarcigi(sb, doktorId), S.sorulmusKisaltmalar(sb, doktorId), S.anahatMetinleri(sb, doktorId)])
  const sozluk = sozlukKur(hekimSozluk, tohum.brans, tohum.genel)
  const tanimlar = paket.satirlar.flatMap((x) => x.tanimlar.filter(Boolean) as { v: number[]; enBoy: number }[])
  const secilen = await S.ornekGorselleri(sb, doktorId, benzerOrnekler(tanimlar, hafiza, 12))
  const secilenId = new Set(secilen.map((o) => o.id))
  const anlam = new Set(sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari))
  return { bransAdi: 'Kulak Burun Boğaz', dil: EL_NOTU_TR.dil, sozluk, hafiza: [...secilen, ...hafiza.filter((o) => !secilenId.has(o.id))], dagarcik, hekimSozcukleri, sorulmusKisaltmalar: sorulmus, ilac, sozcukMu: (t: string) => (dagarcik.get(kelimeAnahtari(t)) || 0) >= 2 || anlam.has(kelimeAnahtari(t)), sayfaGorseli, anahat: anahatOgren(metinler, anahatTr('kulak-burun-bogaz')), okumaSayisi, dogrulaButcesi: butce }
}

const sozcukler = (t: string) => t.split(/\s+/).map((w) => w.replace(/^[^\p{L}\p{N}Ø]+|[^\p{L}\p{N}Ø%]+$/gu, '')).filter(Boolean)
/** The doctor's answer to one Doğrula question, from the page's clinical transcription. Null = he skips it. */
function dogruCevap(d: import('../core/elNotu/tipler').DogrulaSorusu, metin: string): string | null {
  if (!ogrenme) return null
  if (d.sinif === 'kisaltma') return ogrenme.kisaltmalar[kelimeAnahtari(d.okunan.replace(/[,;:]+$/, ''))] ?? null
  if (d.sinif === 'cizim' || d.sinif === 'celiski') return null
  const satirlar = metin.split('\n').map((l) => l.trim()).filter(Boolean)
  const baglam = sozcukler(d.baglam.replace(/⟦[^|⟧]*\|([^⟧]*)\?⟧/g, '$1'))
  let en = -1, skor = 0
  satirlar.forEach((l, i) => { const v = satirBenzerligi(baglam, sozcukler(l)); if (v > skor) { skor = v; en = i } })
  if (en < 0 || skor < 0.3) return null
  const satir = sozcukler(satirlar[en])
  if (!/-w\d+$/.test(d.anahtar)) {
    // a line question: the line as he wrote it (an unreadable word stays out — never guessed)
    const t = satir.filter((w) => w !== '?').join(' ')
    return t.length >= 2 ? t : null
  }
  const adaylar = [d.okunan, ...d.adaylar].filter((a) => a && a !== '?')
  let kelime: string | null = null, k = 0
  for (const w of satir) for (const a of adaylar) { const v = benzerlik(w, a); if (v > k) { k = v; kelime = w } }
  return kelime && k >= 0.5 && kelime !== '?' ? kelime : null
}

/** The masked crop + its shape descriptor, as core/elNotu/tarayici.ts ogrenmeKirpintisi gives it to the Doğrula answer. */
async function ogrenmeKirpintisi(maskeli: { base64: string }, kutu: import('../core/elNotu/tipler').Kutu) {
  const img = await loadImage(Buffer.from(maskeli.base64, 'base64'))
  const x0 = Math.max(0, Math.floor(kutu.x0 * img.width)), y0 = Math.max(0, Math.floor(kutu.y0 * img.height))
  const w = Math.min(img.width - x0, Math.ceil((kutu.x1 - kutu.x0) * img.width)), h = Math.min(img.height - y0, Math.ceil((kutu.y1 - kutu.y0) * img.height))
  if (w < 4 || h < 4) return null
  const c = createCanvas(w, h); const ctx = c.getContext('2d'); ctx.drawImage(img, x0, y0, w, h, 0, 0, w, h)
  const r: Rgba = { w, h, d: new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data) }
  const { griyeCevir, kontrastNormalize } = await import('../core/elNotu/onisleme')
  const { tanimlayici } = await import('../core/elNotu/hafiza')
  const t = tanimlayici(kontrastNormalize(griyeCevir(r)), { x0: 0, y0: 0, x1: 1, y1: 1 })
  if (!t) return null
  return { tanimlayici: t.v, enBoy: t.enBoy, kirpinti: { mime: 'image/jpeg', base64: (await c.encode('jpeg', 85)).toString('base64') } }
}

/** One learning page: read → store as a source with its questions → the doctor answers (production service) → approves. */
async function ogrenmeSayfasi(ad: string, s: import('../core/elNotu/okuyucu').SayfaSonucu, maskeli: { base64: string }, metin: string) {
  const o = ogrenme!
  const { cevaplariUygula } = await import('../lib/elNotu/dogrulaServisi')
  const simdi = new Date().toISOString()
  const sessionId = o.db.ekle('sessions', { doctor_id: o.doktorId, patient_id: o.hastaId, specialty: 'kulak-burun-bogaz', archived_at: null }).id as string
  const kaynakMetni_ = kaynakMetni([s], EL_NOTU_TR.dil, (id) => id)
  const kaynak = o.db.ekle('muayene_kaynaklari', { doctor_id: o.doktorId, patient_id: o.hastaId, session_id: sessionId, note_id: null, tur: 'el_notu', kanal: 'harness', durum: s.dogrula.length ? 'dogrulama' : 'okundu', sayfa_sayisi: 1, maskeli_belge_ids: [], orijinal_belge_ids: [], okuma: { surum: 1, sayfalar: [s], metin: kaynakMetni_ }, metin: kaynakMetni_, acik_dogrula: s.dogrula.length, korumali_acik: 0, isleme_anahtari: ad, ziyaret_tarihi: null, ekleyen_user_id: o.doktorId, ekleyen_rol: 'doktor', updated_at: simdi, sablon_id: s.sablonId })
  for (const d of s.dogrula) o.db.ekle('okuma_dogrulamalari', { doctor_id: o.doktorId, patient_id: o.hastaId, kaynak_id: kaynak.id, soru_anahtari: d.anahtar, sinif: d.sinif, korumali_tur: d.korumaliTur ?? null, okunan: d.okunan, adaylar: d.adaylar, sayfa: d.sayfa, kutu: d.kutu, durum: 'acik' })
  const cevaplar = []
  for (const d of s.dogrula) {
    o.sayac.soru++
    const cevap = dogruCevap(d, metin)
    if (cevap === null) { o.sayac.atlandi++; cevaplar.push({ anahtar: d.anahtar, cevap: null }); continue }
    o.sayac.cevap++
    if (d.sinif === 'kisaltma') o.sayac.kisaltma++
    const ogren = (d.sinif === 'kelime' || d.sinif === 'korumali') && d.kutu ? await ogrenmeKirpintisi(maskeli, d.kutu) : null
    if (ogren) o.sayac.hafiza++
    cevaplar.push({ anahtar: d.anahtar, cevap, ogrenme: ogren })
  }
  await cevaplariUygula(o.sb, { doktorId: o.doktorId, kaynak: kaynak as never, cevaplar, aktor: { userId: o.doktorId, rol: 'doktor' }, brans: 'kulak-burun-bogaz', okunamadiMetni: 'okunamadı' })
  // the visit's note, approved by the doctor: his vocabulary (dagarcik) learns from approved notes
  o.db.ekle('notes', { doctor_id: o.doktorId, patient_id: o.hastaId, session_id: sessionId, approved_at: simdi, content_subjektif: metin, content_objektif: '', content_degerlendirme: '', content_plan: '' })
}

async function ana() {
  const yalniz = arg('sayfa')?.split(',')
  const dosyalar = fs.readdirSync(klasor!).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()
  const sablonDosyasi = arg('sablon')
  const sablonlar: Sablon[] = []
  if (sablonDosyasi) {
    const s = JSON.parse(fs.readFileSync(sablonDosyasi, 'utf8')) as { sablonKaynagi: string; sablon: Sablon }
    const kaynak = dosyalar.find((f) => f.startsWith(s.sablonKaynagi))
    if (kaynak) {
      // the doctor marks the form once: its fingerprint comes from that first page
      const on = sayfayiHazirla(await raster(path.join(klasor!, kaynak)), { enBoy: s.sablon.enBoy })
      sablonlar.push({ ...s.sablon, parmakIzi: parmakIzi(on.normal, on.renkli) })
    }
  }
  if (bayrak('serbest')) sablonlar.push({ id: 'serbest', ad: 'Düz kağıt', tur: 'serbest', brans: null, enBoy: 0.707, baslikBolgeleri: [], cizimBolgeleri: [], parmakIzi: null })
  // the build's registry forms of the branş, as the device gets them from GET /sablon (placed by printed labels)
  if (!bayrak('kayitsiz')) sablonlar.push(...kayitliSablonlarTr('kulak-burun-bogaz'))
  const tohum = tohumlarTr('kulak-burun-bogaz')
  const sozluk = sozlukKur([], tohum.brans, tohum.genel)
  // same "is this a word, not an abbreviation" test as production (lib/elNotu/okumaServisi.ts) with an empty vocabulary
  const anlamSozcukleri = new Set(sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari))
  const satirlar: Record<string, unknown>[] = []
  const puanlar: SayfaPuani[] = []
  let herhangiToplam = 0
  const gizlilikToplam = { sayfa: 0, gonderilen: 0, sizinti: 0, resim: 0 }
  const izinliTaban = [...sozluk.girdiler.flatMap((x) => [x.kisaltma, x.anlam]), ...EL_NOTU_TR.dil.bagSozcukleri, EL_NOTU_TR.dil.cizimBasligi, ...Object.values(EL_NOTU_TR.dil.taraf)]
  // --ogren: the learning pages first (in the given order), then the measured pages
  const ogrenListe = arg('ogren')?.split(',').filter(Boolean)
  if (ogrenListe?.length) {
    ogrenme = await ogrenmeKur()
    // --hekim-girdileri: the doctor also types his own abbreviations once into "Notya sizi böyle tanıyor" (the same
    // lexicon, source 'elle') — only those that occur on the learning pages
    if (bayrak('hekim-girdileri')) {
      const S = await import('../lib/elNotu/sunucu')
      const ogrenMetni = ogrenListe.map((y) => Object.entries(dogruluk.sayfalar).find(([k]) => k.startsWith(y))?.[1].metin || '').join('\n')
      const jetonlar = new Set(ogrenMetni.split(/\s+/).map((w) => kelimeAnahtari(w.replace(/[,;:()]+$/g, '').replace(/^[(]+/, ''))))
      const ham = JSON.parse(fs.readFileSync(path.join(klasor!, 'kisaltmalar.json'), 'utf8')) as Record<string, string>
      for (const [k, v] of Object.entries(ham)) if (jetonlar.has(kelimeAnahtari(k)) && kelimeAnahtari(k) !== kelimeAnahtari(v)) await S.sozlugeEkle(ogrenme.sb, ogrenme.doktorId, k, v, 'elle', 'kulak-burun-bogaz')
    }
  }
  else if (arg('ogrenme-yukle')) await ogrenmeYukle(arg('ogrenme-yukle')!)
  const ogrenDosyalari = (ogrenListe || []).map((y) => dosyalar.find((f) => f.startsWith(y))).filter((f): f is string => !!f)
  const olculen = dosyalar.filter((f) => !yalniz || yalniz.some((y) => f.startsWith(y)))
  const sira = [...ogrenDosyalari.map((f) => ({ f, ogren: true })), ...olculen.map((f) => ({ f, ogren: false }))]
  const ogrenmePuanlari: SayfaPuani[] = []
  for (const { f, ogren } of sira) {
    const ad = f.replace(/-image\.(jpe?g|png)$/i, '').replace(/\.(jpe?g|png)$/i, '')
    const gt = dogruluk.sayfalar[ad]
    const t0 = Date.now()
    const sonuc = await sayfaPaketiHazirla({ foto: await raster(path.join(klasor!, f)), sayfa: 1, sablonlar, serbestBeyan: bayrak('serbest'), tuval, ocr })
    gizlilikToplam.sayfa++
    const satir: Record<string, unknown> = { sayfa: ad, tur: gt?.tur ?? '?', durum: sonuc.durum, ms: Date.now() - t0 }
    if (sonuc.durum === 'hazir') {
      gizlilikToplam.gonderilen++
      // every picture that would leave the device: the masked page, its tiles, the drawing regions
      const resimler = [sonuc.maskeliSayfa.base64, ...(sonuc.paket.parcalar || []).map((t) => t.gorsel.base64), ...sonuc.paket.bolgeler.map((b) => b.gorsel?.base64 || '').filter(Boolean)]
      let sizinti = 0
      for (const r of resimler) if (await sizintiVarMi(r)) sizinti++
      gizlilikToplam.sizinti += sizinti; gizlilikToplam.resim += resimler.length
      Object.assign(satir, { gizlilik: sonuc.gizlilik.neden, kutu: sonuc.gizlilik.kutular.length, sablon: Math.round(sonuc.sablonSkoru * 100) / 100, satir: sonuc.paket.satirlar.length, parca: sonuc.paket.parcalar?.length || 0, yerlesim: sonuc.yontem, sablonId: sonuc.sablon?.id ?? null, sablonYontemi: sonuc.sablonYontemi, bolge: sonuc.paket.bolgeler.filter((b) => b.murekkep >= 0.0004).length, resim: resimler.length, sizinti })
      if (cikti) { fs.mkdirSync(cikti, { recursive: true }); fs.writeFileSync(path.join(cikti, `${ad}-maskeli.jpg`), Buffer.from(sonuc.maskeliSayfa.base64, 'base64')) }
      if (gt && uzak && !uzakCagri && sizinti === 0) {
        // production model path through the admin route (the key never leaves the host)
        try {
          sayfaKullanimi = bosKullanim()
          const y = await fetch(uzak, { method: 'POST', headers: uzakBasliklari(), body: JSON.stringify({ ad, paket: sonuc.paket, maskeliSayfa: sonuc.maskeliSayfa, gercekler: gt.gercekler, brans: 'kulak-burun-bogaz', secenek: { kademe, okumaSayisi, butce } }) })
          const j = await y.json() as { puan?: SayfaPuani; metin?: string; okumaSayisi?: number; butceDisi?: number; okunamadi?: number; ms?: number; error?: string; kullanim?: UzakKullanim; herhangiOkumada?: number }
          if (!y.ok || !j.puan) throw new Error(`route ${y.status} ${j.error || ''}`)
          puanlar.push(j.puan)
          uzakKullanimEkle(j.kullanim, 'gorsel')
          herhangiToplam += j.herhangiOkumada || 0
          Object.assign(satir, ozetSatiri(j.puan), { okumaCagrisi: j.okumaSayisi, butceDisi: j.butceDisi, okunamadi: j.okunamadi, sunucuMs: j.ms, herhangiOkumada: j.herhangiOkumada, usd: Math.round(sayfaKullanimi.usd * 10000) / 10000, kesik: sayfaKullanimi.kesik })
          if (cikti && j.metin) fs.writeFileSync(path.join(cikti, `${ad}-okuma.txt`), j.metin)
        } catch (e) { satir.okumaHatasi = e instanceof Error ? e.message.slice(0, 160) : 'hata' }
      }
      const model = uzak && !uzakCagri ? null : modelKapisi(ad, { paket: sonuc.paket, maskeliSayfa: sonuc.maskeliSayfa })
      if (model && gt) {
        try {
          sayfaKullanimi = bosKullanim()
          const tOku = Date.now()
          const baglam = await okumaBaglami(sonuc.paket, sonuc.maskeliSayfa)
          const s = await sayfayiOku(sonuc.paket, baglam, model)
          satir.hafizaOrnegi = s.hafizaOrnegi
          if (ogrenme) satir.hekimSozlugu = baglam.sozluk.girdiler.filter((x) => x.kaynak === 'hekim').length
          const metin = kaynakMetni([s], EL_NOTU_TR.dil, (id) => sonuc.sablon?.cizimBolgeleri.find((b) => b.id === id)?.etiket || id)
          const puan = sayfaPuanla({ metin, dogrula: s.dogrula, gercekler: gt.gercekler, hamKelimeler: s.satirlar.flatMap((l) => l.kelimeler.flatMap((k) => [k.metin, ...k.adaylar])), izinli: [...izinliTaban, ...baglam.sozluk.girdiler.flatMap((x) => [x.kisaltma, x.anlam]), ...(sonuc.sablon?.cizimBolgeleri || []).map((b) => b.etiket)], okunamadi: EL_NOTU_TR.dil.okunamadi })
          if (ogren) { ogrenmePuanlari.push(puan); satir.ogrenme = true } else puanlar.push(puan)
          // reading ceiling: facts whose keys appear anywhere in the model's output (every raw read, every alternative,
          // the drawing findings in the text) — what no orchestration can exceed
          const hamMetin = `${s.satirlar.flatMap((l) => l.kelimeler.flatMap((k) => [k.metin, ...k.adaylar])).join(' ')}\n${metin}\n${s.dogrula.flatMap((d) => [d.okunan, ...d.adaylar]).join(' ')}`
          const herhangiOkumada = gt.gercekler.filter((g) => g.anahtarlar.every((grup) => grup.some((a) => icerir(hamMetin, a)))).length
          herhangiToplam += herhangiOkumada
          Object.assign(satir, ozetSatiri(puan), { okumaCagrisi: s.okumaSayisi, butceDisi: s.butceDisi, okunamadi: s.okunamadi, herhangiOkumada, okumaMs: Date.now() - tOku, ...(dogrudanModel || uzak ? { usd: Math.round(sayfaKullanimi.usd * 10000) / 10000, kesik: sayfaKullanimi.kesik } : {}) })
          if (cikti) { fs.writeFileSync(path.join(cikti, `${ad}-okuma.txt`), metin); fs.writeFileSync(path.join(cikti, `${ad}-puan.json`), JSON.stringify({ ...puan, herhangiOkumada, dogrulaSorulari: s.dogrula.map((d) => ({ sinif: d.sinif, korumaliTur: d.korumaliTur ?? null, okunan: d.okunan, adaylar: d.adaylar })) })) }
          // the doctor answers this learning page's questions and approves its note (production learning path)
          if (ogren && ogrenme) await ogrenmeSayfasi(ad, s, sonuc.maskeliSayfa, gt.metin || '')
        } catch (e) { satir.okumaHatasi = e instanceof Error ? e.message : 'hata' }
      }
    } else if (sonuc.durum === 'baslik_gerekli' || sonuc.durum === 'gizlenemedi') satir.gizlilik = sonuc.gizlilik.durum
    else if (sonuc.durum === 'tekrar') satir.kalite = sonuc.kalite.nedenler.join(',')
    satirlar.push(satir)
    console.log(JSON.stringify(satir))
  }
  if (ogrenme && arg('ogrenme-kaydet')) ogrenmeKaydet(arg('ogrenme-kaydet')!)
  const rapor = {
    tarih: new Date().toISOString(), model: uzak ? `uzak${uzakCagri ? '-cagri' : ''}:${kademe || 'politika'}` : modelTuru,
    ...(uzak ? { uzakKullanim: { kullanim, modeller: [...uzakModeller], usdSayfaBasina: Math.round(((kullanim.gorsel.usd + kullanim.normal.usd) / Math.max(1, puanlar.length)) * 10000) / 10000, okumaMsOrt: Math.round(satirlar.reduce((a, x) => a + (Number(x.okumaMs ?? x.sunucuMs) || 0), 0) / Math.max(1, puanlar.length)), fiyat: 'Luna family list price US$ 0.10 / 1M prompt, 0.50 / 1M completion (docs/ARCH-MODEL-TIERING.md); cache reads priced as prompt' } } : {}), ...(ogrenme ? { ogrenme: { sayfa: ogrenDosyalari.length, ...ogrenme.sayac, hekimSozlugu: (ogrenme.db.tablolar.get('hekim_el_sozlugu') || []).length, hafiza: (ogrenme.db.tablolar.get('hekim_el_yazisi_hafizasi') || []).length, okuma: ogrenmePuanlari.length ? toplamPuan(ogrenmePuanlari) : null } } : {}), disariOrnek, sablon: sablonlar.map((s) => s.id), okumaSayisi: okumaSayisi ?? 3, butce: butce ?? 5,
    gizlilik: gizlilikToplam,
    ...(dogrudanModel ? { dogrudan: { model: dogrudanModel, caba: dogrudanCaba || 'default', normalModel: normalModeli, kullanim, herhangiOkumada: herhangiToplam, okumaMsOrt: Math.round(satirlar.reduce((a, x) => a + (Number(x.okumaMs) || 0), 0) / Math.max(1, puanlar.length)), usdSayfaBasina: Math.round(((kullanim.gorsel.usd + kullanim.normal.usd) / Math.max(1, puanlar.length)) * 10000) / 10000 } } : {}),
    okuma: puanlar.length ? toplamPuan(puanlar) :'ölçülmedi — model yok (--uzak, ANTHROPIC_API_KEY / OPENROUTER_API_KEY, ya da --model kayit için kayıt gerekli)',
    sayfalar: satirlar,
    ...(jeton.cagri ? { jetonTahmini: { ...jeton, not: 'estimate: images w·h/750 after resize, text chars/3.5, output JSON chars/3; prompt caching and hidden reasoning ignored' } } : {}),
  }
  console.log(JSON.stringify({ ozet: { gizlilik: rapor.gizlilik, okuma: rapor.okuma, ogrenme: (rapor as { ogrenme?: unknown }).ogrenme, herhangiOkumada: herhangiToplam, dogrudan: (rapor as { dogrudan?: unknown }).dogrudan, uzak: (rapor as { uzakKullanim?: unknown }).uzakKullanim, jeton: jeton.cagri ? jeton : undefined } }, null, 2))
  if (cikti) fs.writeFileSync(path.join(cikti, 'rapor.json'), JSON.stringify(rapor, null, 2))
  if (isci) await isci.terminate()
  if (gizlilikToplam.sizinti > 0) process.exitCode = 1
}

/** One page's numbers for the console (fact ids and stages only, never text). */
function ozetSatiri(p: SayfaPuani) {
  return { gercek: p.gercek, kesin: p.kesin, dogrulamada: p.dogrulamada, adayda: p.adayda, isaretli: p.isaretli, kacan: p.kacan, dogrula: p.dogrula, korumaliSoru: p.korumaliSoru, uydurmaAday: p.uydurma.length, kacanlar: p.gercekler.filter((g) => g.asama === 'kacan' || g.asama === 'isaretli').map((g) => `${g.id}:${g.asama}`).join(',') }
}

void ana()
