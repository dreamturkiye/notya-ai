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
/**
 * Turkish mobile in the common written forms.
 *
 * NOTYA-PSEUDO-04: anchored with digit lookarounds. Without them the pattern matched INSIDE longer
 * numbers — a 14-digit barcode "98765432109876" became "9876[TEL_1]", and device serials and
 * protokol numbers would have been mangled the same way. Clinical records are full of long digit
 * strings, so an unanchored phone pattern is actively dangerous here.
 */
const PHONE = /(?<!\d)(?:\+90[\s-]?)?0?\s?\(?5\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)/g
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

  /**
   * NOTYA-PSEUDO-03: Turkish first names that are also everyday or clinical words. Redacting these
   * as standalone tokens destroys meaning: a patient named Kan turns "kan basıncı" into
   * "[HASTA_1] basıncı" and every "tam kan sayımı" with it, and the model then reasons over notes
   * with the clinical vocabulary removed.
   *
   * For these, only the FULL name is substituted — "Kan Yılmaz" is removed, the bare word "kan" is
   * left alone. That is the right trade: the full name is the identifying form, while a lone
   * common word identifies nobody, and a corrupted note is a patient-safety problem rather than a
   * privacy one. Surnames and distinctive given names are unaffected.
   */
  const AMBIGUOUS = new Set([
    'kan', 'can', 'ak', 'öz', 'su', 'ay', 'nur', 'ali', 'ege', 'deniz', 'baran', 'yaz',
    'bal', 'gül', 'çiçek', 'derya', 'ışık', 'umut', 'onur', 'sevgi', 'barış', 'göz',
  ])

  for (const name of names) {
    const full = name.trim()
    const parts = [
      full,
      // Individual tokens only when they cannot be mistaken for ordinary Turkish: long enough to
      // be distinctive, and not on the ambiguous list above.
      ...full.split(/\s+/).filter((p) => p.length >= 4 && !AMBIGUOUS.has(p.toLocaleLowerCase('tr'))),
    ]
    for (const part of parts) {
      const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // NOTYA-PSEUDO-02: match WHOLE WORDS only.
      //
      // Turkish given names are frequently ordinary words — Kan (blood), Can, Ali, Nur, Deniz, Su,
      // Ege — and a substring match rewrites the medicine itself. Verified before this fix: a
      // patient named Ali turned "kaliteli" into "k[HASTA_1]teli", Can turned "canlı" into
      // "[HASTA_1]lı", Nur turned "Nurofen" into "[HASTA_1]ofen", and Kan would have eaten every
      // "kan basıncı" and "tam kan sayımı" in the note. The model would then reason over mangled
      // clinical text, which is far worse than the leak this function prevents.
      //
      // \b is ASCII-only in JavaScript and treats ı, ş, ğ, ç, ö, ü as non-word characters, so it
      // breaks precisely on Turkish. Unicode letter/number lookarounds with the u flag are correct.
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu')
      if (!re.test(out)) continue
      re.lastIndex = 0
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
