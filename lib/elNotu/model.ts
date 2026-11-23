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

export function elNotuModeli(o: { doctorId: string | null; istemci?: AiIstemci; butceMs?: number }): ModelKapisi {
  return {
    async gorselJson({ sistem, parcalar, azamiToken }) {
      const y = await aiCagir({
        gorev: 'goruntu-inceleme', istemci: o.istemci, doctorId: o.doctorId, maxTokens: azamiToken, jsonBekleniyor: true,
        system: [{ metin: sistem, onbellek: true }],
        messages: [{ role: 'user', content: bloklar(parcalar) }],
      })
      return jsonAl(metniAl(y))
    },
    async metinJson({ sistem, mesaj, azamiToken }) {
      const y = await aiCagir({
        gorev: 'klinik-analiz', istemci: o.istemci, doctorId: o.doctorId, maxTokens: azamiToken, jsonBekleniyor: true,
        system: [{ metin: sistem, onbellek: true }],
        messages: [{ role: 'user', content: mesaj }],
      })
      return jsonAl(metniAl(y))
    },
  }
}
