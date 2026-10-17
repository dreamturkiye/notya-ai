/**
 * FOTO-AI-01 — one structured model call with a validate -> repair -> give-up loop.
 *
 * All model traffic goes through lib/ai/cagir.ts `aiCagir` (ai-model-politikasi: model routing, G1-G4 fallback,
 * token logging). This file never names a model. The retry/repair policy:
 *   1. call (the gate itself already retries transport errors and falls back on a bad answer once);
 *   2. parse WITHOUT guessing (jsonCikar: no closing of cut-off strings — a clinical value must never be completed);
 *   3. validate against the schema; if parse or validation fails, ONE text-only repair call that shows the model its own
 *      answer and the precise errors (no image is re-sent: cheaper, and it cannot add new findings);
 *   4. still invalid -> give up: the caller reports "could not be evaluated". Nothing is invented.
 * `cagir` is injectable so unit tests and the evaluation harness run with scripted answers and no network.
 */
import { aiCagir, yanitMetni, type AiCagriGirdisi } from '@/lib/ai/cagir'
import { jsonCikar } from '@/lib/ai/jsonOnar'
import { onarimMetni } from './istem'

export type CagriFonksiyonu = (g: AiCagriGirdisi) => Promise<{ content?: unknown; stop_reason?: string | null; model?: string }>

export interface YapilandirilmisGirdi<T> {
  doctorId: string
  system: string
  /** content blocks of the first user turn (image + text) */
  icerik: unknown[]
  dogrula: (ham: unknown) => { deger?: T; hatalar: string[] }
  maxTokens: number
  butceMs?: number
  cagir?: CagriFonksiyonu
}

export interface YapilandirilmisSonuc<T> {
  deger: T | null
  hatalar: string[]
  model: string | null
  onarimDenendi: boolean
  onarildi: boolean
  /** model calls made (1 or 2) */
  cagriSayisi: number
}

const modelAdi = (y: { model?: unknown }): string | null => (typeof y.model === 'string' && y.model ? y.model.slice(0, 80) : null)

export async function yapilandirilmisCagri<T>(g: YapilandirilmisGirdi<T>): Promise<YapilandirilmisSonuc<T>> {
  const cagir: CagriFonksiyonu = g.cagir ?? ((x) => aiCagir(x) as unknown as ReturnType<CagriFonksiyonu>)
  const temel: Omit<AiCagriGirdisi, 'messages'> = {
    gorev: 'goruntu-inceleme', system: [{ metin: g.system, onbellek: true }], temperature: 0, jsonBekleniyor: true,
    maxTokens: g.maxTokens, doctorId: g.doctorId, ...(g.butceMs ? { butceMs: g.butceMs } : {}),
  }
  const ilk = await cagir({ ...temel, messages: [{ role: 'user', content: g.icerik }] })
  const model = modelAdi(ilk)
  const ham1 = yanitMetni(ilk as { content?: unknown }, '\n')
  const kesildi = ilk.stop_reason === 'max_tokens'

  let hatalar: string[] = []
  const j1 = jsonCikar(ham1)
  if (!j1) hatalar = [kesildi ? 'Cevap token sınırında kesildi; JSON tamamlanmadı.' : 'Cevap geçerli bir JSON nesnesi değil.']
  else {
    const d = g.dogrula(j1)
    if (d.deger) return { deger: d.deger, hatalar: [], model, onarimDenendi: false, onarildi: false, cagriSayisi: 1 }
    hatalar = d.hatalar
  }

  // one repair attempt, text only
  const onar = await cagir({
    ...temel,
    messages: [
      { role: 'user', content: g.icerik.filter((b) => (b as { type?: string })?.type === 'text') },
      { role: 'assistant', content: ham1.slice(0, 6000) || '{}' },
      { role: 'user', content: onarimMetni(hatalar) },
    ],
  })
  const j2 = jsonCikar(yanitMetni(onar as { content?: unknown }, '\n'))
  if (j2) {
    const d2 = g.dogrula(j2)
    if (d2.deger) return { deger: d2.deger, hatalar: [], model: modelAdi(onar) ?? model, onarimDenendi: true, onarildi: true, cagriSayisi: 2 }
    hatalar = d2.hatalar
  } else hatalar = ['Onarım cevabı da geçerli bir JSON nesnesi değil.']
  return { deger: null, hatalar, model: modelAdi(onar) ?? model, onarimDenendi: true, onarildi: false, cagriSayisi: 2 }
}
