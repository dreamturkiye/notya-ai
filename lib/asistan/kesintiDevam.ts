/**
 * NOTYA-AYSE-GURULTU-02 (Kaan, 2026-10-07) — resume after a false stop, both voice paths.
 *
 * If Ayşe is interrupted and no doctor words arrive within KESINTI_BEKLE_MS (no transcript / ASR result, and no
 * sustained local speech), she continues from the start of the sentence that was cut. Doctor words inside the
 * window cancel the resume. At most one resume per answer, and a resumed answer that is cut again is never
 * resumed (no loop). Never resume into a new doctor turn.
 *
 * Pure state machine. ElevenLabs: AsistanOturumContext sends a hidden user message (`kesintiDevamMesaji`), the
 * Custom LLM route speaks the remainder without a model call (lib/asistan/sesLlm.ts). Fish: the page speaks the
 * remainder it already holds.
 */

export const KESINTI_BEKLE_MS = 1500
/** Local voiced time after the cut that counts as "the doctor is talking" before any transcript arrives. */
export const KESINTI_SES_KANIT_MS = 250
/** The remainder is spoken from this many characters at most (one hidden turn, never a monologue). */
export const KESINTI_KALAN_AZAMI = 1500

export type KesintiBekleyen = { cevap: string; kesildi: number; kalan: string | null; sesliMs: number; sonSes: number }

export type KesintiDurumu = {
  bekleyen: KesintiBekleyen | null
  /** Answers already resumed (or cancelled by the doctor): never resumed again. */
  bitenler: string[]
  /** A resume was sent and the doctor has not spoken since: the next cut is not resumed (no loop). */
  zincir: boolean
}

export function kesintiBaslat(): KesintiDurumu {
  return { bekleyen: null, bitenler: [], zincir: false }
}

const BITEN_AZAMI = 32

function bitir(d: KesintiDurumu, cevap: string): string[] {
  return d.bitenler.includes(cevap) ? d.bitenler : [...d.bitenler, cevap].slice(-BITEN_AZAMI)
}

/** Ayşe was cut. `cevap` identifies the answer (ElevenLabs event id / Fish answer counter). */
export function kesildi(d: KesintiDurumu, g: { cevap: string; t: number; kalan?: string | null }): KesintiDurumu {
  if (!g.cevap || d.zincir || d.bitenler.includes(g.cevap)) return { ...d, bekleyen: null }
  const kalan = kalanTemizle(g.kalan)
  return { ...d, bekleyen: { cevap: g.cevap, kesildi: g.t, kalan, sesliMs: 0, sonSes: 0 } }
}

/** The remainder became known after the cut (ElevenLabs sends the correction a moment later). */
export function kalanGeldi(d: KesintiDurumu, g: { cevap: string; kalan: string | null }): KesintiDurumu {
  const b = d.bekleyen
  // The two events may carry different ids for the same answer; an unknown remainder takes the first one offered.
  if (!b || (b.cevap !== g.cevap && b.kalan !== null)) return d
  return { ...d, bekleyen: { ...b, kalan: kalanTemizle(g.kalan) } }
}

/** A doctor transcript / ASR result arrived: any pending resume is cancelled and the chain is broken. */
export function doktorKonustu(d: KesintiDurumu): KesintiDurumu {
  const b = d.bekleyen
  return { bekleyen: null, bitenler: b ? bitir(d, b.cevap) : d.bitenler, zincir: false }
}

/** Local speech evidence after the cut (Silero / VAD). Sustained voice means the doctor is talking: cancel. */
export function sesKaresi(d: KesintiDurumu, g: { t: number; sesli: boolean }): KesintiDurumu {
  const b = d.bekleyen
  if (!b || !g.sesli || g.t < b.kesildi) return d
  const dt = b.sonSes > 0 ? Math.min(Math.max(0, g.t - b.sonSes), 120) : 0
  const sesliMs = b.sesliMs + dt
  if (sesliMs >= KESINTI_SES_KANIT_MS) return doktorKonustu(d)
  return { ...d, bekleyen: { ...b, sesliMs, sonSes: g.t } }
}

/** Clock tick. Returns the text to continue with exactly once, when the window passed in silence. */
export function kesintiTik(d: KesintiDurumu, t: number): { durum: KesintiDurumu; devam: string | null } {
  const b = d.bekleyen
  if (!b || t - b.kesildi < KESINTI_BEKLE_MS) return { durum: d, devam: null }
  const bitenler = bitir(d, b.cevap)
  if (!b.kalan) return { durum: { ...d, bekleyen: null, bitenler }, devam: null }
  return { durum: { bekleyen: null, bitenler, zincir: true }, devam: b.kalan }
}

function kalanTemizle(k: string | null | undefined): string | null {
  const t = String(k ?? '').replace(/\s+/g, ' ').trim()
  if (!t || !/[\p{L}\p{N}]/u.test(t)) return null
  return t.length > KESINTI_KALAN_AZAMI ? t.slice(0, KESINTI_KALAN_AZAMI) : t
}

/* ---- Where to continue from ---- */

const CUMLE_SONU = /[.!?…:;]["'”’)\]]*\s+|\n+/gu

/** Start of the sentence that contains character `kesim` of `tam` (the cut sentence is said again from its start). */
export function cumleBasi(tam: string, kesim: number): number {
  const sinir = Math.max(0, Math.min(tam.length, Math.floor(kesim)))
  let bas = 0
  CUMLE_SONU.lastIndex = 0
  for (let m = CUMLE_SONU.exec(tam); m; m = CUMLE_SONU.exec(tam)) {
    // The punctuation was already said (it sits before the cut): the next sentence starts after the gap.
    if (m.index >= sinir) break
    bas = m.index + m[0].length
  }
  return bas
}

/** Remainder of `tam` from the start of the sentence containing `kesim`; null when nothing is left. */
export function devamMetni(tam: string, kesim: number): string | null {
  const t = String(tam || '')
  if (!t.trim() || kesim >= t.trimEnd().length) return null
  return kalanTemizle(t.slice(cumleBasi(t, kesim)))
}

/**
 * ElevenLabs `agent_response_correction`: `original` is the full answer text, `corrected` what was actually played
 * before the interruption. The cut point is the end of the played prefix.
 */
export function elevenKalan(original: string, corrected: string): string | null {
  const o = String(original || '')
  const c = String(corrected || '').trim()
  if (!o.trim()) return null
  if (!c) return devamMetni(o, 0)
  if (o.startsWith(c)) return devamMetni(o, c.length)
  // Whitespace may differ between the two strings: match on normalised text, map back by word count.
  const kelimeler = c.split(/\s+/).filter(Boolean).length
  const re = /\S+/g
  let n = 0
  let son = -1
  for (let m = re.exec(o); m; m = re.exec(o)) {
    n += 1
    if (n === kelimeler) { son = m.index + m[0].length; break }
  }
  if (son < 0) return null
  const oNorm = o.slice(0, son).replace(/\s+/g, ' ').trim()
  if (oNorm !== c.replace(/\s+/g, ' ')) return null
  return devamMetni(o, son)
}

/** Fish TTS speed estimate (characters per second of audio) — only used when a PCM stream hides the sentence. */
export const FISH_KARAKTER_SN = 14

/**
 * Fish: `tam` is the answer text the page holds; `kesim` what the player was playing (sentence text for REST jobs,
 * or only the seconds played of a PCM stream → position estimated at FISH_KARAKTER_SN).
 */
export function fishKalan(tam: string, kesim: { metin: string | null; sn: number } | null): string | null {
  const t = String(tam || '')
  if (!kesim || !t.trim()) return null
  if (kesim.metin) {
    const i = t.indexOf(kesim.metin.trim())
    return i < 0 ? null : devamMetni(t, i)
  }
  return devamMetni(t, Math.max(0, kesim.sn) * FISH_KARAKTER_SN)
}

/* ---- The hidden nudge (ElevenLabs) ---- */

export const KESINTI_ISARETI = '[kesinti-devam]'

/**
 * The hidden Turkish instruction sent as a user message. The Custom LLM route (single brain) reads the quoted
 * remainder and speaks it with no model call; an agent on ElevenLabs' own LLM follows the instruction. It is never
 * shown (AsistanOturumContext filters it) and never stored (the route does not write the session).
 */
export function kesintiDevamMesaji(kalan: string): string {
  const k = kalanTemizle(kalan) || ''
  return `${KESINTI_ISARETI} Sözün yanlışlıkla kesildi, doktor konuşmadı. Baştan başlama, özür dileme, açıklama yapma; yalnız şu kısmı aynen söyleyerek devam et: «${k}»`
}

export function kesintiMesajiMi(m: string | null | undefined): boolean {
  return String(m ?? '').trim().startsWith(KESINTI_ISARETI)
}

/** The quoted remainder inside a nudge, or null. */
export function kesintiKalani(m: string | null | undefined): string | null {
  const t = String(m ?? '').trim()
  if (!t.startsWith(KESINTI_ISARETI)) return null
  const a = t.indexOf('«')
  const b = t.lastIndexOf('»')
  if (a < 0 || b <= a) return null
  return kalanTemizle(t.slice(a + 1, b))
}
