/**
 * ESNEK-MUAYENE-A — the reader's model path. ai-model-politikasi: no model name here; every call goes through
 * lib/ai/cagir.ts with an existing task of the central policy (lib/ai/modeller.ts — LOCKED, untouched):
 *   - line / drawing reading (images, masked only) → 'goruntu-inceleme' (structured JSON);
 *   - clinical normalisation (text)                 → 'klinik-analiz' with jsonBekleniyor.
 * Images are ONLY the device's masked crops (core/elNotu/sayfaPaketi.ts); this module never sees the vault original.
 */
import { aiCagir, type AiIstemci } from '@/lib/ai/cagir'
import { jsonOnarDetay } from '@/lib/ai/jsonOnar'
import type { IstemParcasi, ModelKapisi } from '@/core/elNotu/okuyucu'

const MIME = ['image/jpeg', 'image/png', 'image/webp']

function metniAl(y: Awaited<ReturnType<typeof aiCagir>>): string {
  return (y.content || []).map((b) => (b.type === 'text' ? b.text : '')).join('')
}

function jsonAl(ham: string): unknown {
  const r = jsonOnarDetay(ham.replace(/```json\n?|\n?```/g, '').trim())
  if (r.neden !== 'ok') throw new Error(`el-notu json ${r.neden}`)
  return r.deger
}

function bloklar(parcalar: IstemParcasi[]): unknown[] {
  return parcalar.map((p) =>
    p.tur === 'metin'
      ? { type: 'text', text: p.metin }
      : { type: 'image', source: { type: 'base64', media_type: MIME.includes(p.gorsel.mime) ? p.gorsel.mime : 'image/jpeg', data: p.gorsel.base64 } },
  )
}

/**
 * `kademe` (evaluation only): the existing per-call tier override of the central policy (modelSec) — 'derin' is the
 * policy's own tier for 'goruntu-inceleme'; 'hizli' asks the primary tier, for a comparison. No model name here.
 */
/** One model call's usage as the provider reported it (evaluation route: tokens + cost per page; nothing stored). */
export type ElNotuOlcum = { gorev: 'goruntu-inceleme' | 'klinik-analiz'; model: string; usage: Record<string, number | null>; durma: string | null; ms: number }

export function elNotuModeli(o: { doctorId: string | null; istemci?: AiIstemci; butceMs?: number; kademe?: 'hizli' | 'derin'; olcum?: (x: ElNotuOlcum) => void }): ModelKapisi {
  const olc = (gorev: ElNotuOlcum['gorev'], y: Awaited<ReturnType<typeof aiCagir>>, t0: number) => {
    if (!o.olcum) return
    const m = y as unknown as { model?: string; usage?: Record<string, number | null>; stop_reason?: string | null }
    o.olcum({ gorev, model: String(m.model || ''), usage: { ...(m.usage || {}) }, durma: m.stop_reason ?? null, ms: Date.now() - t0 })
  }
  return {
    async gorselJson({ sistem, parcalar, azamiToken }) {
      const t0 = Date.now()
      const y = await aiCagir({
        gorev: 'goruntu-inceleme', istemci: o.istemci, doctorId: o.doctorId, maxTokens: azamiToken, jsonBekleniyor: true, ...(o.kademe ? { kademe: o.kademe } : {}),
        system: [{ metin: sistem, onbellek: true }],
        messages: [{ role: 'user', content: bloklar(parcalar) }],
      })
      olc('goruntu-inceleme', y, t0)
      return jsonAl(metniAl(y))
    },
    async metinJson({ sistem, mesaj, azamiToken }) {
      const t0 = Date.now()
      const y = await aiCagir({
        gorev: 'klinik-analiz', istemci: o.istemci, doctorId: o.doctorId, maxTokens: azamiToken, jsonBekleniyor: true,
        system: [{ metin: sistem, onbellek: true }],
        messages: [{ role: 'user', content: mesaj }],
      })
      olc('klinik-analiz', y, t0)
      return jsonAl(metniAl(y))
    },
  }
}
