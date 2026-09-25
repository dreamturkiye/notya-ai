/**
 * NOTYA-MALIYET-01 — tüm Claude çağrılarının tek kapısı.
 *
 * Model ve önerilen max_tokens görevden gelir (lib/ai/modeller.ts → modelSec); çağrı yeri model adı yazmaz.
 * İki taşıma yolu, çağrı yerinin mevcut davranışını birebir korumak için:
 *  - `istemci` verilirse (Anthropic SDK istemcisi) istek onunla gider — SDK'yı mock'layan testler aynen çalışır.
 *  - verilmezse doğrudan fetch ile /v1/messages — eski fetch çağrı yerleri ve onları yakalayan testler korunur.
 * HTTP hatasında AiCagriHatasi fırlatılır (durum + gövde); çağıran eskisi gibi kendi hata mesajını seçer.
 *
 * Üç güvence burada, çağrı yerinde değil:
 *  1. GÖRSEL = GÜÇLÜ (Kaan, 2026-09-19): mesajlarda image/document bloğu varsa görev ne olursa olsun GÜÇLÜ model.
 *  2. Prompt caching: system blok dizisi olarak verilirse `onbellek: true` bloklar cache_control alır.
 *  3. Ölçüm: her yanıtın usage sayaçları ai_token_kullanim'a yazılır (yalnız sayaç — lib/ai/kullanim.ts).
 */
import type Anthropic from '@anthropic-ai/sdk'
import { gucluModel, modelSec, type Gorev, type ModelSecimi } from './modeller'
import { kullanimKaydet, kullanimSatiri } from './kullanim'

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

export class AiCagriHatasi extends Error {
  constructor(public durum: number, public govde: string) {
    super(`Anthropic API ${durum}: ${govde.slice(0, 200)}`)
    this.name = 'AiCagriHatasi'
  }
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

/** Görevin politikası + GÖRSEL = GÜÇLÜ güvencesi. Çağıran yanlış (HIZLI) görev verse bile görselde GÜÇLÜ döner. */
export function etkinSecim(g: Pick<AiCagriGirdisi, 'gorev' | 'messages'>): ModelSecimi & { yukseltildi: boolean } {
  const secim = modelSec(g.gorev)
  if (secim.kademe === 'guclu' || !gorselIcerirMi(g.messages)) return { ...secim, yukseltildi: false }
  return { ...secim, kademe: 'guclu', model: gucluModel(), yukseltildi: true }
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

async function olc(g: AiCagriGirdisi, govde: Record<string, unknown>, yanit: Anthropic.Message): Promise<void> {
  const y = yanit as unknown as { model?: string; usage?: Record<string, number | null>; stop_reason?: string | null }
  await kullanimKaydet(kullanimSatiri({
    doctorId: g.doctorId ?? null,
    gorev: g.gorev,
    model: y?.model || String(govde.model),
    usage: y?.usage,
    stopReason: y?.stop_reason ?? null,
  }))
}

export async function aiCagir(g: AiCagriGirdisi): Promise<Anthropic.Message> {
  const govde = istekGovdesi(g)
  let yanit: Anthropic.Message
  if (g.istemci) {
    yanit = (await g.istemci.messages.create(govde as never)) as Anthropic.Message
  } else {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(govde),
    })
    if (!r.ok) throw new AiCagriHatasi(r.status, await r.text().catch(() => ''))
    yanit = (await r.json()) as Anthropic.Message
  }
  try { await olc(g, govde, yanit) } catch { /* ölçüm çağrıyı asla düşürmez */ }
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

/**
 * NOTYA-TEK-BEYIN — aiCagir'in akışlı eşi (sesli Ayşe ilk sözü model yazarken söyler). İstek gövdesi, kademe,
 * GÖRSEL = GÜÇLÜ ve ölçüm aiCagir'le aynı; `metinParcasi` her text_delta'da çağrılır. Dönen mesaj akıştan
 * birleştirilir (text + tool_use blokları, stop_reason, usage) — çağıran onu aiCagir yanıtıyla aynı işler.
 */
export async function aiAkis(g: AiCagriGirdisi & { istemci: AiIstemci }, metinParcasi: (parca: string) => void): Promise<Anthropic.Message> {
  const govde: Record<string, unknown> = { ...istekGovdesi(g), stream: true }
  const ham = (await g.istemci.messages.create(govde as never)) as unknown
  // Akış yerine tam mesaj dönen istemci (test sahtesi, vekil) → metni tek parça ver, aynen işle.
  if (!ham || typeof (ham as AsyncIterable<unknown>)[Symbol.asyncIterator] !== 'function') {
    const tam = ham as Anthropic.Message
    const t = yanitMetni(tam)
    if (t) metinParcasi(t)
    try { await olc(g, govde, tam) } catch { /* ölçüm çağrıyı asla düşürmez */ }
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
  try { await olc(g, govde, yanit) } catch { /* ölçüm çağrıyı asla düşürmez */ }
  return yanit
}
