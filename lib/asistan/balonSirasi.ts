/**
 * NOTYA-SES-SIRA-01 — the doctor's line belongs before the answer it caused.
 *
 * ElevenLabs can deliver the agent text (and the screen poll can paint it) before
 * the user transcript of the same turn. The question must be inserted in front of
 * that answer, never in front of the opening greeting, and never twice.
 */

export type Balon = { role: 'user' | 'ai'; text: string; olay?: number }

function olayYeri<T extends Balon>(prev: T[], olay: number | undefined): number {
  if (olay == null) return prev.length
  for (let i = 0; i < prev.length; i++) {
    const e = prev[i].olay
    if (typeof e === 'number' && e > olay) return i
  }
  return prev.length
}

/** A late user transcript slots in before the reply, not after it and not before the greeting. */
export function kullaniciEkle<T extends Balon>(
  prev: T[],
  text: string,
  olay: number | undefined,
  ekle: (role: 'user' | 'ai', text: string, olay?: number) => T,
): T[] {
  const t = String(text || '').trim()
  if (!t) return prev
  const ayni = prev.findIndex((m) => m.role === 'user' && m.text === t && (olay == null || m.olay == null || m.olay === olay))
  if (ayni !== -1) {
    if (olay == null) return prev
    let hedef = ayni
    for (let i = 0; i < ayni; i++) {
      const e = prev[i].olay
      if (typeof e === 'number' && e > olay) { hedef = i; break }
    }
    const damga = prev[ayni].olay ?? olay
    if (hedef === ayni && prev[ayni].olay === damga) return prev
    const msg = { ...prev[ayni], olay: damga }
    const rest = prev.filter((_, i) => i !== ayni)
    const at = hedef === ayni ? ayni : hedef
    return [...rest.slice(0, at), msg, ...rest.slice(at)]
  }
  const msg = ekle('user', t, olay)
  const at = olayYeri(prev, olay)
  return [...prev.slice(0, at), msg, ...prev.slice(at)]
}

/**
 * Screen answer from the session poll. `soru` is the doctor line stored just
 * before it. If the answer is already on screen and the question is missing or
 * sitting after it, the question moves in front.
 */
export function cevapEkle<T extends Balon>(
  prev: T[],
  soru: string | null,
  cevap: string,
  ekle: (role: 'user' | 'ai', text: string) => T,
): T[] {
  const c = String(cevap || '').trim()
  if (!c) return prev
  const s = String(soru || '').trim()
  let next = prev.slice()
  const cevapIndeksi = () => {
    for (let i = next.length - 1; i >= 0; i--) if (next[i].role === 'ai' && next[i].text === c) return i
    return -1
  }
  if (s) {
    let ci = cevapIndeksi()
    const ui = next.findIndex((m) => m.role === 'user' && m.text === s)
    if (ci >= 0 && ui > ci) {
      const [u] = next.splice(ui, 1)
      ci = cevapIndeksi()
      next.splice(ci, 0, u)
    } else if (ui === -1) {
      const u = ekle('user', s)
      ci = cevapIndeksi()
      if (ci >= 0) next.splice(ci, 0, u)
      else next.push(u)
    }
  }
  if (cevapIndeksi() === -1) next.push(ekle('ai', c))
  return next
}
