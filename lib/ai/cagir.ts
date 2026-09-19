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
