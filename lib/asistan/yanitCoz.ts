/**
 * KD-DERM-SAFETY-FINDINGS F3 — parse the asistan chat model output ({ speech, action, proactiveWarning }) so that a doctor
 * never sees raw JSON. A long KD answer hit max_tokens mid-JSON; JSON.parse failed and the route showed the whole raw text
 * (```json fence + truncated tail) as speech.
 *
 * - complete JSON (with or without ``` fence / preamble) → fields as-is
 * - truncated JSON → the "speech" string salvaged up to the cut, action dropped (a half-written action never runs),
 *   and a clear Turkish "yanıt kesildi" line appended
 * - plain text (model ignored the JSON format) → the text itself
 * Pure; shared by the route and the chat UI (guard for legacy stored messages).
 */

export interface AsistanYaniti {
  speech: string
  action: Record<string, unknown> | null
  proactiveWarning: string | null
  kesildi: boolean
}

export const KESIK_YANIT_NOTU = '— Yanıt uzunluk sınırında kesildi. Devamı için "devam et" yazın ya da soruyu daraltarak tekrar sorun.'

/** JSON string body starting right after the opening quote; returns the decoded text and whether the closing quote was found. */
function jsonStringOku(metin: string, bas: number): { deger: string; tamam: boolean } {
  let i = bas
  let esc = false
  for (; i < metin.length; i++) {
    const ch = metin[i]
    if (esc) { esc = false; continue }
    if (ch === '\\') { esc = true; continue }
    if (ch === '"') break
  }
  const tamam = i < metin.length
  // A cut can land inside an escape ("\", "\u00") — drop the incomplete tail before decoding.
  const ham = metin.slice(bas, i).replace(/\\u[0-9a-fA-F]{0,3}$/, '').replace(/(?<!\\)(\\\\)*\\$/, '$1')
  try { return { deger: JSON.parse(`"${ham}"`) as string, tamam } } catch { return { deger: ham.replace(/\\n/g, '\n').replace(/\\"/g, '"'), tamam } }
}

function alanOku(govde: string, alan: string): { deger: string; tamam: boolean } | null {
  const m = new RegExp(`"${alan}"\\s*:\\s*"`).exec(govde)
  return m ? jsonStringOku(govde, m.index + m[0].length) : null
}

/** Index of the "}" closing the object that starts at metin[0] ("{"), or -1 if the object never closes. */
function nesneSonu(metin: string): number {
  let derinlik = 0, str = false, esc = false
  for (let i = 0; i < metin.length; i++) {
    const ch = metin[i]
    if (esc) { esc = false; continue }
    if (ch === '\\') { esc = true; continue }
    if (ch === '"') { str = !str; continue }
    if (str) continue
    if (ch === '{') derinlik++
    else if (ch === '}' && --derinlik === 0) return i
  }
  return -1
}

/**
 * NOTYA-TEK-BEYIN — akış sırasında (model henüz yazarken) "speech" alanının o ana kadarki çözülmüş metni.
 * JSON biçimi → alanın açılan tırnağından sonrası; düz metin cevap → metnin kendisi; henüz belli değilse ''.
 */
export function speechOneki(ham: string): string {
  const metin = String(ham || '').replace(/```[a-z]*/gi, '').trimStart()
  if (!metin || metin.startsWith('`')) return ''
  if (!metin.startsWith('{')) return metin.search(/\{\s*"/) === -1 ? metin : ''
  const s = alanOku(metin, 'speech')
  return s ? s.deger : ''
}

export function asistanYanitiCoz(ham: string, stopReason?: string | null): AsistanYaniti {
  const metin = String(ham || '').replace(/```[a-z]*/gi, '').trim()
  const tavan = stopReason === 'max_tokens'
  const anahtar = metin.search(/\{\s*"(?:speech|action|proactiveWarning)"/)
  const bas = anahtar !== -1 ? anahtar : metin.startsWith('{') ? 0 : -1
  const kesikNot = (t: string) => `${t.trimEnd()}…\n\n${KESIK_YANIT_NOTU}`
  if (bas !== -1) {
    const govde = metin.slice(bas)
    const son = nesneSonu(govde)
    if (son !== -1) {
      try {
        const v = JSON.parse(govde.slice(0, son + 1)) as Record<string, unknown>
        if (typeof v.speech === 'string') {
          // Long answers: the model often writes a short JSON wrapper ("aşağıda derledim") and the real content as markdown
          // AFTER the object — keep that content (it is what the doctor asked for), and it is what max_tokens cuts.
          const ek = govde.slice(son + 1).replace(/^\s*(?:-{3,}\s*)*/, '').trim()
          const speech = ek ? `${v.speech}\n\n${ek}` : v.speech
          const kesildi = tavan && (!!ek || !v.speech)
          return {
            speech: kesildi ? kesikNot(speech) : speech,
            action: kesildi ? null : v.action && typeof v.action === 'object' ? (v.action as Record<string, unknown>) : null,
            proactiveWarning: typeof v.proactiveWarning === 'string' && v.proactiveWarning ? v.proactiveWarning : null,
            kesildi,
          }
        }
      } catch { /* malformed — salvage below */ }
    }
    const speech = alanOku(govde, 'speech')
    if (speech) {
      const uyari = alanOku(govde, 'proactiveWarning')
      return {
        speech: kesikNot(speech.deger),
        action: null,
        proactiveWarning: uyari?.tamam && uyari.deger ? uyari.deger : null,
        kesildi: true,
      }
    }
    if (bas === 0) {
      // JSON-shaped but no readable speech (cut before it) — never show the raw object.
      return { speech: `Yanıt tamamlanamadı.\n\n${KESIK_YANIT_NOTU}`, action: null, proactiveWarning: null, kesildi: true }
    }
  }
  // Plain text answer (or prose before a broken object): show the prose only.
  const duz = (bas > 0 ? metin.slice(0, bas) : metin).trim()
  return { speech: tavan ? kesikNot(duz) : duz, action: null, proactiveWarning: null, kesildi: tavan }
}
