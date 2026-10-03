/**
 * NOTYA-SES-SIRA-01 — the doctor's line belongs before the answer it caused.
 *
 * ElevenLabs can deliver the agent text (and the screen poll can paint it) before
 * the user transcript of the same turn. The question must be inserted in front of
 * that answer, never in front of the opening greeting, and never twice.
 *
 * NOTYA-SES-SIRA-02 (Kaan, 2026-10-03): on tek-beyin ElevenLabs the screen poll paints
 * the answer with no `olay`, and the user transcript arrives later — `olayYeri` then
 * appended the question AFTER the reply (screenshot: "iyiyim…" above "nasılsınız?").
 * When event ids cannot order the turn, a trailing AI block that is not preceded by a
 * user line is treated as an orphan reply and the question slots in front of it.
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

/**
 * Start index of a trailing AI reply that arrived before its user transcript.
 * Keeps the opening greeting; does not pull a new question in front of a finished turn.
 */
export function yetimCevapYeri<T extends Balon>(prev: T[]): number | null {
  let i = prev.length - 1
  if (i < 0 || prev[i].role !== 'ai') return null
  let bas = i
  while (bas > 0 && prev[bas - 1].role === 'ai') bas--
  if (bas === 0) return prev.length >= 2 ? 1 : null
  if (prev[bas - 1].role === 'user') return null
  return bas
}

/** Two model generations of the same isolation (or a cut + replay) start the same way. */
export function benzerCevapMi(a: string, b: string): boolean {
  const n = (s: string) => String(s || '').replace(/\s+/g, ' ').trim()
  const x = n(a)
  const y = n(b)
  if (!x || !y) return false
  if (x === y) return true
  const kisa = x.length <= y.length ? x : y
  const uzun = x.length <= y.length ? y : x
  if (kisa.length < 48) return false
  if (uzun.startsWith(kisa.slice(0, Math.min(72, kisa.length)))) return true
  // Aynı büyüme cevabı: kilo/boy/baş çevresi sayıları örtüşüyorsa ikinci balon açma.
  const sayilar = (s: string) => (s.match(/\d+[.,]?\d*/g) || []).slice(0, 8).join('|')
  const sx = sayilar(x)
  const sy = sayilar(y)
  if (sx && sx === sy && sx.split('|').length >= 3 && kisa.length >= 80) return true
  return false
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
    let hedef = ayni
    if (olay != null) {
      for (let i = 0; i < ayni; i++) {
        const e = prev[i].olay
        if (typeof e === 'number' && e > olay) { hedef = i; break }
      }
    }
    const rest = prev.filter((_, i) => i !== ayni)
    if (hedef === ayni) {
      const yetim = yetimCevapYeri(rest)
      if (yetim != null) hedef = yetim
    }
    const damga = prev[ayni].olay ?? olay
    if (hedef === ayni && prev[ayni].olay === damga) return prev
    const msg = { ...prev[ayni], olay: damga }
    return [...rest.slice(0, hedef), msg, ...rest.slice(hedef)]
  }
  const msg = ekle('user', t, olay)
  let at = olayYeri(prev, olay)
  // NOTYA-SES-SIRA-02: no usable event order (poll AI has no olay) → still put the question before the orphan reply.
  if (at >= prev.length) {
    const yetim = yetimCevapYeri(prev)
    if (yetim != null) at = yetim
  }
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
  if (cevapIndeksi() === -1) {
    // NOTYA-BUYUME-KISA-01 / multi-reply: aynı klinik cevabın 2.–3. modeli (araya kullanıcı
    // satırı girse bile) yeni balon açmasın — son birkaç AI'ya bak.
    const sonAilar = next.filter((m) => m.role === 'ai').slice(-4)
    if (!sonAilar.some((m) => benzerCevapMi(m.text, c))) next.push(ekle('ai', c))
  }
  return next
}
