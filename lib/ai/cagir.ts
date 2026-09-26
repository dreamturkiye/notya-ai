/**
 * NOTYA-MALIYET-01 + NOTYA-MODEL-LUNA-01 — tüm LLM çağrılarının tek kapısı.
 *
 * Model ve önerilen max_tokens görevden gelir (lib/ai/modeller.ts → modelSec); çağrı yeri model adı yazmaz.
 * Taşıma yolu lib/ai/saglayici.ts'te seçilir:
 *  - OPENROUTER_API_KEY varsa → OpenRouter (HIZLI = GPT-6 Luna, GÜÇLÜ = Sonnet 5); istek/yanıt Anthropic biçimine çevrilir.
 *  - yoksa → eski Anthropic yolu, birebir: `istemci` verilirse SDK istemcisi (SDK'yı mock'layan testler aynen çalışır),
 *    verilmezse doğrudan fetch ile /v1/messages. OpenAI modeli bu yolda gidemez → GÜÇLÜ (neden = transport).
 * HTTP hatasında AiCagriHatasi fırlatılır (durum + gövde); çağıran eskisi gibi kendi hata mesajını seçer.
 *
 * Güvenceler burada, çağrı yerinde değil:
 *  1. KALİTE kapısı (çağrıdan önce): GÜÇLÜ görev, görsel/PDF bloğu (GÖRSEL = GÜÇLÜ, Kaan 2026-09-19) ya da HIZLI
 *     görevde güvenlik sinyali → GÜÇLÜ. Luna boş/ret/düşük güven dönerse → GÜÇLÜ (low_conf).
 *  2. TAŞIMA kapısı (yalnız Luna): 5xx / zaman aşımı / boş gövde / 429 / ağ → 400 ms → Luna bir kez → GÜÇLÜ (transport).
 *  3. Prompt caching: system blok dizisi olarak verilirse `onbellek: true` bloklar cache_control alır (OpenRouter'da da).
 *  4. Ölçüm: her yanıtın usage sayaçları + kademe + neden ai_token_kullanim'a yazılır (yalnız sayaç — lib/ai/kullanim.ts).
 */
import type Anthropic from '@anthropic-ai/sdk'
import {
  dusukGuvenMi, gorevNedeni, gucluModel, guvenlikSinyaliVar, modelSec,
  type Gorev, type Kademe, type ModelSecimi, type YukseltmeNedeni,
} from './modeller'
import { kullanimKaydet, kullanimSatiri } from './kullanim'
import { AiCagriHatasi, dogrudanModelAdi, openRouterAkis, openRouterCagir, yolSec } from './saglayici'

export { AiCagriHatasi }

/** SDK'nın bu sürümünde (0.27) tiplenmemiş ama API'nin kabul ettiği içerik blokları (ör. PDF `document`) için geniş tip. */
export type AiMesaj = { role: 'user' | 'assistant'; content: string | unknown[] }

/** System promptun bir parçası. `onbellek: true` → cache_control (ephemeral). Sabit kısım önce, değişken kısım sonra. */
export type SistemBlogu = { metin: string; onbellek?: boolean }

export interface AiIstemci {
  messages: { create: (govde: never) => Promise<unknown> }
}

export interface AiCagriGirdisi {
  gorev: Gorev
  /** Düz metin (eski davranış, önbelleksiz) ya da sabit→değişken sıralı blok dizisi (önbellekli). */
  system?: string | SistemBlogu[]
  messages: AiMesaj[]
  /** modelSec önerisinin gerekçeli aşımı (ör. 16k satırlık e-Nabız çıkarımı). */
  maxTokens?: number
  temperature?: number
  istemci?: AiIstemci
  /** Ölçüm satırı için hekim/kullanıcı kimliği (UUID değilse null yazılır). Hasta kimliği ASLA verilmez. */
  doctorId?: string | null
  /**
   * NOTYA-EYLEM: Anthropic tool tanımları (core/eylemler/araclar.ts). Boş/verilmezse istek eskisiyle
   * birebir aynı kalır — araç kullanmayan çağrı yerleri hiç etkilenmez. Bir aracın çağrılması KAYIT
   * DEĞİLDİR: yanıttaki tool_use blokları yalnız hekime onay kartı hazırlar (docs/AYSE-EYLEM-MIMARISI.md §1).
   */
  araclar?: unknown[]
  /**
   * When the doctor says kaydet/yazıver, force a tool call (`any`) so the model cannot narrate
   * "veri girişi yapamam". Still a proposal only — commit is the tap.
   */
  toolChoice?: 'auto' | 'any' | { type: 'tool'; name: string }
}

/** Yanıttaki tüm metin bloklarını birleştirir. */
export function yanitMetni(yanit: { content?: unknown }, ayirici = ''): string {
  const bloklar = Array.isArray(yanit?.content) ? (yanit.content as { type?: string; text?: string }[]) : []
  return bloklar.filter((c) => c?.type === 'text').map((c) => String(c.text ?? '')).join(ayirici)
}

const GORSEL_BLOK = new Set(['image', 'document'])

function blokGorselMi(b: unknown): boolean {
  if (!b || typeof b !== 'object') return false
  const o = b as { type?: unknown; content?: unknown }
  if (typeof o.type === 'string' && GORSEL_BLOK.has(o.type)) return true
  // tool_result gibi iç içe içerik
  return Array.isArray(o.content) && o.content.some(blokGorselMi)
}

/** Mesajlarda görüntü (image) ya da PDF/belge (document) bloğu var mı — multimodal çağrı mı? */
export function gorselIcerirMi(mesajlar: AiMesaj[]): boolean {
  return (mesajlar || []).some((m) => Array.isArray(m?.content) && m.content.some(blokGorselMi))
}

/** Kullanıcı mesajlarının düz metni (güvenlik sinyali taraması için; system ve asistan metni taranmaz). */
function kullaniciMetni(mesajlar: AiMesaj[]): string {
  return (mesajlar || []).filter((m) => m?.role === 'user').map((m) => typeof m.content === 'string'
    ? m.content
    : (m.content as { type?: string; text?: string }[]).filter((b) => b?.type === 'text').map((b) => String(b.text ?? '')).join(' ')).join('\n')
}

/**
 * KALİTE kapısı — görevin politikası + GÖRSEL = GÜÇLÜ + güvenlik sinyali. Çağıran yanlış (HIZLI) görev verse bile
 * görselde / güvenlik sinyalinde GÜÇLÜ döner. `neden` ölçüm satırına gider (HIZLI kalırsa null).
 */
export function etkinSecim(g: Pick<AiCagriGirdisi, 'gorev' | 'messages'>): ModelSecimi & { yukseltildi: boolean; neden: YukseltmeNedeni | null } {
  const secim = modelSec(g.gorev)
  if (secim.kademe === 'guclu') return { ...secim, yukseltildi: false, neden: gorevNedeni(g.gorev) }
  if (gorselIcerirMi(g.messages)) return { ...secim, kademe: 'guclu', model: gucluModel(), yukseltildi: true, neden: 'vision' }
  if (guvenlikSinyaliVar(kullaniciMetni(g.messages))) return { ...secim, kademe: 'guclu', model: gucluModel(), yukseltildi: true, neden: 'safety' }
  return { ...secim, yukseltildi: false, neden: null }
}

/** API en fazla 4 cache_control kırılma noktası kabul eder. */
const AZAMI_ONBELLEK_NOKTASI = 4

/** System alanını API biçimine çevirir. Boş/yalnız boşluk bloklar atılır (API boş text bloğunu reddeder). */
export function sistemGovdesi(system: AiCagriGirdisi['system']): string | Record<string, unknown>[] | undefined {
  if (system === undefined) return undefined
  if (typeof system === 'string') return system || undefined
  let nokta = 0
  const bloklar = system
    .filter((b) => b && typeof b.metin === 'string' && b.metin.trim())
    .map((b) => {
      const blok: Record<string, unknown> = { type: 'text', text: b.metin }
      if (b.onbellek && nokta < AZAMI_ONBELLEK_NOKTASI) {
        blok.cache_control = { type: 'ephemeral' }
        nokta++
      }
      return blok
    })
  return bloklar.length ? bloklar : undefined
}

export function istekGovdesi(g: AiCagriGirdisi): Record<string, unknown> {
  const secim = etkinSecim(g)
  const govde: Record<string, unknown> = {
    model: secim.model,
    max_tokens: g.maxTokens ?? secim.maxTokens,
    messages: g.messages,
  }
  const system = sistemGovdesi(g.system)
  if (system) govde.system = system
  if (g.temperature !== undefined) govde.temperature = g.temperature
  if (g.araclar?.length) {
    govde.tools = g.araclar
    if (g.toolChoice === 'any') govde.tool_choice = { type: 'any' }
    else if (g.toolChoice === 'auto') govde.tool_choice = { type: 'auto' }
    else if (g.toolChoice && typeof g.toolChoice === 'object') govde.tool_choice = g.toolChoice
  }
  return govde
}

type Olcum = { kademe: Kademe; neden: YukseltmeNedeni | null }

async function olc(g: AiCagriGirdisi, govde: Record<string, unknown>, yanit: Anthropic.Message, o: Olcum): Promise<void> {
  const y = yanit as unknown as { model?: string; usage?: Record<string, number | null>; stop_reason?: string | null }
  await kullanimKaydet(kullanimSatiri({
    doctorId: g.doctorId ?? null,
    gorev: g.gorev,
    model: y?.model || String(govde.model),
    usage: y?.usage,
    stopReason: y?.stop_reason ?? null,
    kademe: o.kademe,
    neden: o.neden,
  }))
}

/** Luna'nın taşıma hatası: 5xx, 429, zaman aşımı (504), ağ (503), boş gövde (502). 4xx istek hatası değildir. */
export function tasimaHatasiMi(e: unknown): boolean {
  return e instanceof AiCagriHatasi && (e.durum >= 500 || e.durum === 429)
}

/** Luna cevabı kullanılamaz mı: metin + araç çağrısı yok, ret, ya da "daha fazla bilgi şart / emin değilim". */
export function dusukGuvenliYanit(y: Anthropic.Message | null | undefined): boolean {
  if (!y) return true
  const bloklar = Array.isArray(y.content) ? (y.content as { type?: string }[]) : []
  if (bloklar.some((b) => b?.type === 'tool_use')) return false
  const metin = yanitMetni(y).trim()
  return !metin || (y.stop_reason as string | null) === 'refusal' || dusukGuvenMi(metin)
}

/** Taşıma kapısında denemeler arası bekleme (testler kısaltır). */
export const TASIMA_BEKLEME = { ms: 400 }
/** Luna (HIZLI) çağrısının zaman aşımı — aşılırsa taşıma hatası sayılır. GÜÇLÜ çağrıda zaman aşımı yok (eskisi gibi). */
const LUNA_ZAMAN_ASIMI_MS = 25_000
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Hedef = { govde: Record<string, unknown>; kademe: Kademe; neden: YukseltmeNedeni | null }

/** Seçilen modeli bu ortamda gidebileceği bir modele çevirir: OpenAI modeli + OpenRouter yok → GÜÇLÜ (transport). */
function hedefBelirle(g: AiCagriGirdisi): Hedef {
  const secim = etkinSecim(g)
  const govde = istekGovdesi(g)
  if (yolSec(String(govde.model))) return { govde, kademe: secim.kademe, neden: secim.neden }
  const guclu = gucluModel()
  if (!yolSec(guclu)) throw new AiCagriHatasi(500, 'OPENROUTER_API_KEY tanımlı değil ve GÜÇLÜ model Anthropic değil')
  return { govde: { ...govde, model: guclu }, kademe: 'guclu', neden: 'transport' }
}

/** GÜÇLÜ modelle aynı istek (Luna kapısından düşüş). */
function gucluyeYukselt(h: Hedef, neden: YukseltmeNedeni): Hedef {
  return { govde: { ...h.govde, model: gucluModel() }, kademe: 'guclu', neden }
}

/** Luna kapısı yalnız HIZLI kademe OpenRouter'dan giderken çalışır; doğrudan Anthropic yolu eskisi gibi tek çağrıdır. */
function lunaKapisiMi(h: Hedef): boolean {
  return h.kademe === 'hizli' && yolSec(String(h.govde.model)) === 'openrouter'
}

async function tekCagri(g: AiCagriGirdisi, govde: Record<string, unknown>, zamanAsimiMs?: number): Promise<Anthropic.Message> {
  const model = String(govde.model)
  if (yolSec(model) === 'openrouter') return openRouterCagir(govde, zamanAsimiMs)
  const dogrudan = { ...govde, model: dogrudanModelAdi(model) }
  if (g.istemci) return (await g.istemci.messages.create(dogrudan as never)) as Anthropic.Message
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(dogrudan),
  })
  if (!r.ok) throw new AiCagriHatasi(r.status, await r.text().catch(() => ''))
  return (await r.json()) as Anthropic.Message
}

async function olcSessiz(g: AiCagriGirdisi, h: Hedef, yanit: Anthropic.Message): Promise<void> {
  try { await olc(g, h.govde, yanit, h) } catch { /* ölçüm çağrıyı asla düşürmez */ }
}

export async function aiCagir(g: AiCagriGirdisi): Promise<Anthropic.Message> {
  const h = hedefBelirle(g)
  if (!lunaKapisiMi(h)) {
    const yanit = await tekCagri(g, h.govde)
    await olcSessiz(g, h, yanit)
    return yanit
  }
  // TAŞIMA kapısı: Luna → 400 ms → Luna bir kez → GÜÇLÜ
  let yanit: Anthropic.Message | null = null
  for (let deneme = 0; deneme < 2 && !yanit; deneme++) {
    if (deneme) await bekle(TASIMA_BEKLEME.ms)
    try {
      yanit = await tekCagri(g, h.govde, LUNA_ZAMAN_ASIMI_MS)
    } catch (e) {
      if (!tasimaHatasiMi(e)) throw e
    }
  }
  if (!yanit) {
    const t = gucluyeYukselt(h, 'transport')
    const y = await tekCagri(g, t.govde)
    await olcSessiz(g, t, y)
    return y
  }
  await olcSessiz(g, h, yanit)
  // KALİTE kapısı (çağrı sonrası): boş / ret / düşük güven → GÜÇLÜ
  if (dusukGuvenliYanit(yanit)) {
    const t = gucluyeYukselt(h, 'low_conf')
    const y = await tekCagri(g, t.govde)
    await olcSessiz(g, t, y)
    return y
  }
  return yanit
}

type AkisOlayi = {
  type?: string
  index?: number
  message?: { model?: string; usage?: Record<string, number | null> }
  content_block?: { type?: string; id?: string; name?: string; text?: string }
  delta?: { type?: string; text?: string; partial_json?: string; stop_reason?: string | null }
  usage?: Record<string, number | null>
}

/** Doğrudan Anthropic yolunda akış — eski aiAkis gövdesi, birebir. */
async function anthropicAkis(g: AiCagriGirdisi & { istemci: AiIstemci }, h: Hedef, metinParcasi: (parca: string) => void): Promise<Anthropic.Message> {
  const govde: Record<string, unknown> = { ...h.govde, model: dogrudanModelAdi(String(h.govde.model)), stream: true }
  const ham = (await g.istemci.messages.create(govde as never)) as unknown
  // Akış yerine tam mesaj dönen istemci (test sahtesi, vekil) → metni tek parça ver, aynen işle.
  if (!ham || typeof (ham as AsyncIterable<unknown>)[Symbol.asyncIterator] !== 'function') {
    const tam = ham as Anthropic.Message
    const t = yanitMetni(tam)
    if (t) metinParcasi(t)
    try { await olc(g, govde, tam, h) } catch { /* ölçüm çağrıyı asla düşürmez */ }
    return tam
  }
  const akis = ham as AsyncIterable<AkisOlayi>
  const bloklar: Record<string, unknown>[] = []
  const jsonlar: string[] = []
  let model = String(govde.model)
  let usage: Record<string, number | null> = {}
  let stopReason: string | null = null
  for await (const o of akis) {
    if (o.type === 'message_start') {
      model = o.message?.model || model
      usage = { ...(o.message?.usage || {}) }
    } else if (o.type === 'content_block_start' && o.index !== undefined) {
      bloklar[o.index] = { ...(o.content_block || {}) }
      if (o.content_block?.type === 'tool_use') jsonlar[o.index] = ''
    } else if (o.type === 'content_block_delta' && o.index !== undefined) {
      const b = bloklar[o.index] || (bloklar[o.index] = { type: 'text', text: '' })
      if (o.delta?.type === 'text_delta' && o.delta.text) {
        b.text = String(b.text || '') + o.delta.text
        metinParcasi(o.delta.text)
      } else if (o.delta?.type === 'input_json_delta') {
        jsonlar[o.index] = (jsonlar[o.index] || '') + String(o.delta.partial_json || '')
      }
    } else if (o.type === 'message_delta') {
      stopReason = o.delta?.stop_reason ?? stopReason
      usage = { ...usage, ...(o.usage || {}) }
    }
  }
  jsonlar.forEach((j, i) => {
    if (!bloklar[i]) return
    try { bloklar[i].input = j ? JSON.parse(j) : {} } catch { bloklar[i].input = {} }
  })
  const yanit = { model, content: bloklar.filter(Boolean), stop_reason: stopReason, usage } as unknown as Anthropic.Message
  try { await olc(g, govde, yanit, h) } catch { /* ölçüm çağrıyı asla düşürmez */ }
  return yanit
}

/** OpenRouter yolunda akış; Luna ise taşıma kapısı yalnız henüz metin söylenmemişken devreye girer. */
async function openRouterAkisKapili(g: AiCagriGirdisi, h: Hedef, metinParcasi: (parca: string) => void): Promise<Anthropic.Message> {
  if (!lunaKapisiMi(h)) {
    const { yanit } = await openRouterAkis(h.govde, metinParcasi)
    await olcSessiz(g, h, yanit)
    return yanit
  }
  const guclu = async (neden: YukseltmeNedeni) => {
    const t = gucluyeYukselt(h, neden)
    const { yanit } = await openRouterAkis(t.govde, metinParcasi)
    await olcSessiz(g, t, yanit)
    return yanit
  }
  let sonuc: { yanit: Anthropic.Message; metinVerildi: boolean } | null = null
  for (let deneme = 0; deneme < 2 && !sonuc; deneme++) {
    if (deneme) await bekle(TASIMA_BEKLEME.ms)
    try {
      sonuc = await openRouterAkis(h.govde, metinParcasi, LUNA_ZAMAN_ASIMI_MS)
    } catch (e) {
      // Söylenmiş metin geri alınamaz — akış ortasında kopan Luna turu tekrarlanmaz, hata çağırana gider.
      if (!tasimaHatasiMi(e) || (e as { metinVerildi?: boolean }).metinVerildi) throw e
    }
  }
  if (!sonuc) return guclu('transport')
  await olcSessiz(g, h, sonuc.yanit)
  // Hiç metin söylenmediyse (boş / ret) GÜÇLÜ'ye yükselt; söylenmiş düşük güvenli metin sesli yolda geri alınamaz.
  if (!sonuc.metinVerildi && dusukGuvenliYanit(sonuc.yanit)) return guclu('low_conf')
  return sonuc.yanit
}

/**
 * NOTYA-TEK-BEYIN — aiCagir'in akışlı eşi (sesli Ayşe ilk sözü model yazarken söyler). İstek gövdesi, kademe,
 * GÖRSEL = GÜÇLÜ ve ölçüm aiCagir'le aynı; `metinParcasi` her metin parçasında çağrılır. Dönen mesaj akıştan
 * birleştirilir (text + tool_use blokları, stop_reason, usage) — çağıran onu aiCagir yanıtıyla aynı işler.
 * OpenRouter yolunda SSE chat.completions akışı aynı geri çağrıya bağlanır.
 */
export async function aiAkis(g: AiCagriGirdisi & { istemci: AiIstemci }, metinParcasi: (parca: string) => void): Promise<Anthropic.Message> {
  const h = hedefBelirle(g)
  if (yolSec(String(h.govde.model)) === 'openrouter') return openRouterAkisKapili(g, h, metinParcasi)
  return anthropicAkis(g, h, metinParcasi)
}
