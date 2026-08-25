/**
 * NOTYA-PSEUDO-01 — identifier stripping at the LLM boundary.
 *
 * KVKK m.9 governs sending personal data abroad, and the doctor tools send clinical text to
 * Anthropic, OpenAI, Groq, Deepgram and ElevenLabs — all outside Türkiye. Paperwork (standart
 * sözleşme + Kurul notification) makes that transfer lawful; NOT SENDING THE IDENTIFIERS makes it
 * defensible, and it is the stronger control because it does not depend on a counterparty
 * honouring a contract.
 *
 * The audit on 2026-08-25 found sgk-rapor decrypting the patient's real name and interpolating it
 * into the prompt — and then discarding the model's echo of it, re-inserting the local name after
 * the call. The identifier crossed the border for no purpose at all. That is the shape of this
 * whole problem: names are sent out of habit, not need.
 *
 * Approach: replace identifiers with stable placeholders before the call, restore them after. The
 * model reasons over [HASTA_1] and the doctor still reads the real name, because substitution is
 * reversed locally. Nothing identifying leaves the database.
 */

export interface PseudonymMap {
  [placeholder: string]: string
}

export interface Pseudonymized {
  text: string
  map: PseudonymMap
}

/** T.C. Kimlik: exactly 11 digits, not part of a longer number. */
const TC_KIMLIK = /(?<!\d)([1-9]\d{10})(?!\d)/g
/** Turkish mobile/landline in the common written forms. */
const PHONE = /(?:\+90[\s-]?)?0?\s?\(?5\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g

/**
 * Strip identifiers from free text.
 *
 * `knownNames` are supplied by the caller because a person's name cannot be found reliably by
 * pattern alone in Turkish free text — and guessing would either miss real names or redact clinical
 * terms. The caller already holds the decrypted name, so it can say precisely what to remove.
 */
export function pseudonymize(text: string, knownNames: string[] = []): Pseudonymized {
  const map: PseudonymMap = {}
  let out = String(text || '')
  let n = 0

  // Longest first, so "Ahmet Yılmaz" is replaced before "Ahmet" leaves a dangling surname.
  const names = [...knownNames]
    .filter((x) => x && x.trim().length > 2)
    .sort((a, b) => b.length - a.length)

  for (const name of names) {
    const full = name.trim()
    const parts = [full, ...full.split(/\s+/).filter((p) => p.length > 2)]
    for (const part of parts) {
      const re = new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      if (!re.test(out)) continue
      const ph = `[HASTA_${++n}]`
      map[ph] = part
      out = out.replace(re, ph)
    }
  }

  out = out.replace(TC_KIMLIK, (m) => {
    const ph = `[TCKN_${++n}]`
    map[ph] = m
    return ph
  })
  out = out.replace(PHONE, (m) => {
    const ph = `[TEL_${++n}]`
    map[ph] = m
    return ph
  })
  out = out.replace(EMAIL, (m) => {
    const ph = `[EPOSTA_${++n}]`
    map[ph] = m
    return ph
  })

  return { text: out, map }
}

/** Put the real values back, once the response is home. */
export function restore(text: string, map: PseudonymMap): string {
  let out = String(text || '')
  for (const [ph, real] of Object.entries(map)) {
    out = out.split(ph).join(real)
  }
  return out
}

/** Restore across a whole response object, so callers do not have to walk it themselves. */
export function restoreDeep<T>(value: T, map: PseudonymMap): T {
  if (typeof value === 'string') return restore(value, map) as unknown as T
  if (Array.isArray(value)) return value.map((v) => restoreDeep(v, map)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = restoreDeep(v, map)
    }
    return out as unknown as T
  }
  return value
}

/**
 * Belt and braces: refuse to ship a prompt that still contains an 11-digit national ID.
 * A silent leak is worse than a failed request, and this is the one identifier that is both
 * unambiguous to detect and most damaging to leak.
 */
export function assertNoTckn(prompt: string, where: string): void {
  TC_KIMLIK.lastIndex = 0
  if (TC_KIMLIK.test(prompt)) {
    throw new Error(`NOTYA-PSEUDO-01: ${where} — T.C. kimlik numarası tespit edildi, istek gönderilmedi.`)
  }
}
