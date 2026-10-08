/**
 * NOTYA-UZ-MUAYENE-01 — the ONE place a country's visit code talks to the language model.
 *
 * MODEL POLICY (.cursor/skills/ai-model-politikasi/SKILL.md), followed as written:
 *   - no model name here or anywhere on this side: the call names a TASK ('soap' for the note, 'not-uretimi' for the
 *     rewrite) and the shared gateway (lib/ai/cagir.ts → aiCagir) picks the model, the fallback gates, the time
 *     budget and the usage row. Whatever the policy says tomorrow applies here without an edit;
 *   - both tasks are "structured" by the gateway's own defaults, so an answer that is not JSON falls to the guard
 *     model once, as for every other caller;
 *   - the instruction (the pack's, fixed per language and template) is the cached system block; nothing about a
 *     doctor or a patient is in it. The transcript is the user message;
 *   - `doctorId` is given for the usage row. A patient id is never given.
 *
 * BOUNDARY. The gateway reports failures in Turkish (its own engineers' language). Nothing it throws leaves this
 * file: the caller gets null, the route answers with a code, the screen shows the pack's wording. The log line
 * carries the kind of error and, for a provider error, its HTTP status — never the message.
 *
 * No instruction text lives here: it comes from the active pack (countries/active/klinik).
 */
import { aiCagir, AiCagriHatasi, yanitMetni } from '@/lib/ai/cagir'
import { jsonOnarDetay } from '@/lib/ai/jsonOnar'
import { modelSec } from '@/lib/ai/modeller'
import type { NotIcerigi } from '../tipler'

export type NotGorevi = 'soap' | 'not-uretimi'

/** Longest section the application keeps. */
export const BOLUM_AZAMI = 20_000

const bolum = (ham: unknown): string => {
  const t = Array.isArray(ham) ? ham.map((x) => String(x ?? '')).join('\n') : typeof ham === 'string' ? ham : ham == null ? '' : String(ham)
  return t.trim().slice(0, BOLUM_AZAMI)
}

/** The model's answer as a note, or null when it is not one (no object, or all four sections empty). Pure. */
export function notIceriginiOku(metin: string): NotIcerigi | null {
  const r = jsonOnarDetay(metin)
  if (r.deger === null || typeof r.deger !== 'object' || Array.isArray(r.deger)) return null
  const o = r.deger as Record<string, unknown>
  const icerik = { s: bolum(o.s), o: bolum(o.o), a: bolum(o.a), p: bolum(o.p) }
  return icerik.s || icerik.o || icerik.a || icerik.p ? icerik : null
}

/** The label stored with a note for "which model wrote this": the policy's model for the note task, never a literal. */
export const notModelEtiketi = (): string => modelSec('soap').model

export async function modeldenNot(g: { gorev: NotGorevi; talimat: string; girdi: string; doktorId: string; butceMs?: number }): Promise<NotIcerigi | null> {
  try {
    const yanit = await aiCagir({
      gorev: g.gorev,
      system: [{ metin: g.talimat, onbellek: true }],
      messages: [{ role: 'user', content: g.girdi }],
      doctorId: g.doktorId,
      ...(g.butceMs ? { butceMs: g.butceMs } : {}),
    })
    return notIceriginiOku(yanitMetni(yanit))
  } catch (e) {
    console.error(`[ulke/not] ${g.gorev}: ${e instanceof AiCagriHatasi ? `gateway ${e.durum}` : e instanceof Error ? e.name : typeof e}`)
    return null
  }
}
