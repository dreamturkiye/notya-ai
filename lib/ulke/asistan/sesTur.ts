/**
 * SES-OMURGA-V2 for a COUNTRY build (Kaan, 2026-10-29 — Türkiye's lib/asistan/sesLlm.ts, docs/SES-MIMARI-V2.md, applied
 * to the country mouth lib/ulke/asistan/sunucu.ts). The country brain is stateless (ElevenLabs' history is the
 * conversation, nothing is stored), so the Turkish database registry does not apply; the rest does:
 *
 *   A. one utterance → one brain, latest wins — the call (`c` in the call token) + the turn POSITION in ElevenLabs'
 *      history; an exact duplicate is served from the first request's stream; a grown / corrected transcript aborts the
 *      in-flight model call and the newest request answers (lib/asistan/sesTurYoneticisi.ts, shared with Türkiye).
 *   C. pauses, fillers, scraps and the assistant's own echo never reach the model — ElevenLabs' `skip_turn`.
 *      Never a whitespace-only reply: skip_turn, or the documented buffer chunk "... ".
 *   G. the agent's conversation settings pinned in code in the pack's language (lib/asistan/sesMotoru.ts) — the country
 *      keeps its own voice / delivery lock (motorKilidi.ts).
 *   H. one `[ulke/asistan/tur]` log line per turn (no text, no ids but the call key).
 * Pure helpers; the route wiring is in sunucu.ts. Covered by the founder lock (.cursor/rules/ses-omurga-kilidi.mdc).
 */
import { sesOnKapisi } from '@/lib/asistan/sesTurKapisi'
import { elSonAsistan, elTurNo, sesTuruKarsila, type SesTurKarsilama } from '@/lib/asistan/sesTurYoneticisi'

/** ElevenLabs' documented buffer chunk (ellipsis + trailing space): the only content of a turn with nothing to say. */
export const SES_TAMPON = '... '

/** English hesitation sounds and backchannel noise (folded, lower case). */
export const DOLGU_EN: ReadonlySet<string> = new Set(['um', 'umm', 'uh', 'uhh', 'er', 'erm', 'hm', 'hmm', 'hmmm', 'mm', 'mmm', 'ah', 'oh', 'eh', 'huh', 'ugh', 'uhm', 'ehm'])
/** English short words that ARE a turn. */
export const KISA_EN: ReadonlySet<string> = new Set(['yes', 'no', 'yeah', 'nope', 'stop', 'ok', 'okay', 'sure', 'thanks', 'thank', 'hi', 'hello', 'hey', 'bye', 'read', 'repeat', 'go', 'wait', 'cancel', 'right', 'correct'])
/** Uzbek (Latin) hesitation sounds. */
export const DOLGU_UZ: ReadonlySet<string> = new Set(['e', 'ee', 'eee', 'hm', 'hmm', 'mm', 'mmm', 'a', 'aa', 'ha', 'xo', 'xm', 'uh', 'um'])
/** Uzbek (Latin) short words that ARE a turn. */
export const KISA_UZ: ReadonlySet<string> = new Set(['ha', 'yoq', 'xa', 'mayli', 'rahmat', 'salom', 'toxta', 'ok', 'okay', 'tushunarli', 'davom', 'oqing'])

/** The pack's language → its filler / short-turn sets. */
export function dilKumeleri(dil: string): { dolgu: ReadonlySet<string>; kisa: ReadonlySet<string> } {
  return /^uz/i.test(dil) ? { dolgu: DOLGU_UZ, kisa: KISA_UZ } : { dolgu: DOLGU_EN, kisa: KISA_EN }
}

/** The soft-timeout filler in the pack's language — no time promise ("one second"). */
export function dolguSozu(dil: string): { mesaj: string; ek: string[] } {
  return /^uz/i.test(dil) ? { mesaj: 'Hmm...', ek: ['Xo‘sh...'] } : { mesaj: 'Hmm, let me see...', ek: ['Right...'] }
}

/** C: a turn that never reaches the model. Null = a real turn. */
export function ulkeOnKapi(mesaj: string, elMesajlari: unknown, dil: string): string | null {
  const k = sesOnKapisi(mesaj, elSonAsistan(elMesajlari), dilKumeleri(dil))
  return k ? k.neden : null
}

/** A: register this request in the call's turn registry. `cagri` = the call token's call id. */
export function ulkeTurKarsila(cagri: string, elMesajlari: unknown, mesaj: string): SesTurKarsilama & { turNo: number } {
  const turNo = elTurNo(elMesajlari)
  return { ...sesTuruKarsila({ cagri, turNo, mesaj }), turNo }
}

/** The skip_turn tool call delta (ElevenLabs system tool). */
export function atlaCagrisi(neden: string, id: string): Record<string, unknown> {
  return { tool_calls: [{ index: 0, id, type: 'function', function: { name: 'skip_turn', arguments: JSON.stringify({ reason: neden }) } }] }
}

/** H: the turn's timing line. */
export function turOlcumuYaz(g: { cagri: string; turNo: number; karar: string; rota: string; ilkBayt: number | null; ilkSoz: number | null; toplam: number }): void {
  console.log('[ulke/asistan/tur]', JSON.stringify({ ...g, cagri: g.cagri.slice(0, 64), bolge: process.env.VERCEL_REGION || null }))
}
