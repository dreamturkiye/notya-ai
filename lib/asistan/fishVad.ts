/** Energy + silence for one spoken turn. No ElevenLabs VAD. */
import { SES_PROFILI_AYAR, type ProfilKarari } from '@/lib/asistan/sesProfili/ayar'

export const FISH_KONUSMA_ESIK = 0.02
/** Speaker leak of Haberci is quieter than the doctor at the mic. Barge-in must not fire on her own playback. */
export const FISH_BARGE_ESIK = 0.12
export const FISH_BARGE_MS = 300
/**
 * NOTYA-VAD-TAIL-01 (Kaan/Gokhan, 2026-10-01): was dropped 600 -> 300 ms for greeting
 * cadence (feat/ayse-100), but that cuts off a doctor speaking slowly and deliberately
 * with natural mid-sentence pauses -- the root cause of the "interrupting / not
 * listening" complaint. Raised to 500 ms; confirm final value by ear.
 *
 * NOTYA-SES-YARIM-01 (Kaan, 2026-10-01): 500 ms still closed the turn between a first name
 * and the surname ("Ayşe lütfen bana Umutcan [pause] Türkoğlu..."). Raised to 700 ms: +200 ms
 * on every reply, the cost of surviving a name-surname pause. Longer pauses are not bought with
 * more tail -- the server holds an unfinished sentence (lib/asistan/yarimSoz.ts) and the next
 * clip is merged into it (fishTurSirasi `yarim`).
 */
export const FISH_SES_SIZLIGI_MS = 700
export const FISH_MIN_KONUSMA_MS = 500
export const FISH_AZAMI_TUR_MS = 16_000
/** Audio kept from before the first voiced frame (word onsets), everything older is dropped. */
export const FISH_ON_TAMPON_MS = 300
/** Client-side junk gate: a clip needs this much VOICED audio and this much total length. */
export const FISH_KLIP_MIN_SESLI_MS = 200
export const FISH_KLIP_MIN_TOPLAM_MS = 600

/**
 * A single click / cough used to pass: the old rule measured "time since first voiced
 * frame", which the 800 ms silence tail alone satisfied. Now the clip must carry real
 * voiced time and a minimum total length, or it never leaves the browser.
 */
export function klipGonderilirMi(g: { toplamMs: number; sesliMs: number }): { gonder: boolean; neden: string | null } {
  if (g.sesliMs < FISH_KLIP_MIN_SESLI_MS) return { gonder: false, neden: 'sesli_kisa' }
  if (g.toplamMs < FISH_KLIP_MIN_TOPLAM_MS) return { gonder: false, neden: 'toplam_kisa' }
  return { gonder: true, neden: null }
}

/**
 * Before speech starts the mic buffer must not grow forever: a doctor who listens for
 * 40 s and then speaks would send 40 s of silence (3 MB WAV → 413 and a lost turn).
 * Keep only the last `tamponMs` of pre-roll.
 */
export function onTamponuKirp(parcalar: Float32Array[], hz: number, tamponMs = FISH_ON_TAMPON_MS): void {
  const azami = Math.max(1, Math.ceil((tamponMs / 1000) * hz))
  let toplam = 0
  for (const p of parcalar) toplam += p.length
  while (parcalar.length > 1 && toplam - parcalar[0].length >= azami) {
    toplam -= parcalar[0].length
    parcalar.shift()
  }
}

/**
 * Barge-in counter. RMS ≥ FISH_BARGE_ESIK protects against Ayşe's own speaker leak (Silero hears the leak as
 * speech). NOTYA-AYSE-GURULTU-01: when a fresh Silero probability exists (`sileroP` not null) it must ALSO say
 * speech (≥ FISH_SILERO_ESIK) — a smoke-alarm chirp or a clap is loud but not speech. Without Silero: today's rule.
 */
export function bargeSayaci(
  oncekiMs: number,
  ajanKonusuyor: boolean,
  rms: number,
  tikMs = 50,
  sileroP: number | null = null,
  profil: { karar: ProfilKarari | null; redYeni: boolean } | null = null,
): { ms: number; kes: boolean } {
  if (!ajanKonusuyor || rms < FISH_BARGE_ESIK) return { ms: 0, kes: false }
  if (sileroP !== null && !(sileroP >= FISH_SILERO_ESIK)) return { ms: 0, kes: false }
  // NOTYA-SES-PROFILI-01 (same preference as the ElevenLabs gate): a voice the profile rejected never cuts her;
  // right after a rejection a new voice waits for its verdict, at most dogrulaAzamiMs. Short words: speech-only rule.
  if (profil?.karar === 'red') return { ms: 0, kes: false }
  const ms = oncekiMs + tikMs
  if (ms < FISH_BARGE_MS) return { ms, kes: false }
  if (profil && profil.redYeni && profil.karar !== 'kabul' && ms < SES_PROFILI_AYAR.dogrulaAzamiMs) return { ms, kes: false }
  return { ms, kes: true }
}

/** The Silero probability to hand to `bargeSayaci`: only a fresh one counts, a stale one is "no Silero". */
export function tazeSileroP(s: SileroOlasilik, simdi: number): number | null {
  return s && simdi - s.zaman <= FISH_SILERO_TAZELIK_MS ? s.p : null
}

export function rmsHesapla(ornek: ArrayLike<number>): number {
  const n = ornek.length
  if (!n) return 0
  let s = 0
  for (let i = 0; i < n; i++) {
    const v = ornek[i]
    s += v * v
  }
  return Math.sqrt(s / n)
}

export function konusuyorMu(rms: number, esik = FISH_KONUSMA_ESIK): boolean {
  return rms >= esik
}

/* ---- NOTYA-SILERO-01: Silero VAD (in-browser, @ricky0123/vad-web) replaces the RMS gate when it loads. ---- */

/**
 * End-of-turn silence tail with Silero: speech probability does not flicker on breaths
 * like RMS did. Raised alongside FISH_SES_SIZLIGI_MS (NOTYA-VAD-TAIL-01) for the same
 * reason -- 350 ms was still cutting off deliberate speech. 500 -> 700 ms with NOTYA-SES-YARIM-01.
 */
export const FISH_SES_SIZLIGI_SILERO_MS = 700
/** Silero speech probability thresholds (hysteresis: enter above, leave below). */
export const FISH_SILERO_ESIK = 0.5
export const FISH_SILERO_CIKIS_ESIK = 0.35
/** A probability older than this (worklet stalled) is not trusted; the frame falls back to RMS. */
export const FISH_SILERO_TAZELIK_MS = 250

export type SileroOlasilik = { p: number; zaman: number } | null

/** Hysteresis gate on Silero's speech probability. `onceki` is last frame's decision. */
export function sileroKonusuyorMu(p: number, onceki: boolean, esik = FISH_SILERO_ESIK, cikis = FISH_SILERO_CIKIS_ESIK): boolean {
  if (!(p >= 0)) return false
  return onceki ? p >= cikis : p >= esik
}

/**
 * Per-frame speech decision: Silero when a fresh probability exists, RMS otherwise.
 * Barge-in stays on RMS on purpose — Silero hears Ayşe's own speaker leak as speech.
 */
export function kareKonusmasi(g: { rms: number; silero: SileroOlasilik; onceki: boolean; simdi: number }): { ses: boolean; kaynak: 'silero' | 'rms' } {
  const s = g.silero
  if (s && g.simdi - s.zaman <= FISH_SILERO_TAZELIK_MS) return { ses: sileroKonusuyorMu(s.p, g.onceki), kaynak: 'silero' }
  return { ses: konusuyorMu(g.rms), kaynak: 'rms' }
}

export function sessizlikKuyrugu(kaynak: 'silero' | 'rms'): number {
  return kaynak === 'silero' ? FISH_SES_SIZLIGI_SILERO_MS : FISH_SES_SIZLIGI_MS
}

/* ---- Turn state machine — one pure step per captured frame, shared by the PCM and MediaRecorder paths. ---- */

export type TurDurumu = {
  duydu: boolean
  konusmaBas: number
  sessizBas: number
  /** Voiced time actually heard this turn (wall-clock, see `turAdimi`). */
  sesliMs: number
  sonKare: number
  kaynak: 'silero' | 'rms'
}

export function turBaslat(): TurDurumu {
  return { duydu: false, konusmaBas: 0, sessizBas: 0, sesliMs: 0, sonKare: 0, kaynak: 'rms' }
}

/** A frame that arrives later than this many nominal frames is a stall, not speech: cap what one frame may add. */
export const FISH_KARE_AZAMI_KAT = 4

/**
 * One captured frame outside Ayşe's playback. Voiced time is the wall-clock gap since the previous
 * frame (floor: nominal frame length, cap: FISH_KARE_AZAMI_KAT × frame). The ScriptProcessor /
 * setTimeout tick and Silero's ORT inference share the main thread, so under load frames arrive
 * late and bunched; counting the nominal frame length per voiced frame undercounts what the doctor
 * said and the junk gate drops a real sentence as `sesli_kisa` while the tail still closes the turn
 * on wall-clock silence. The tail is measured on wall-clock too, so both sides agree.
 */
export function turAdimi(
  d: TurDurumu,
  g: { ses: boolean; kaynak: 'silero' | 'rms'; simdi: number; kareMs: number },
): { durum: TurDurumu; bitir: 'sessizlik' | 'azami' | null } {
  const gecen = d.sonKare > 0 ? Math.min(Math.max(g.simdi - d.sonKare, g.kareMs), FISH_KARE_AZAMI_KAT * g.kareMs) : g.kareMs
  const n: TurDurumu = { ...d, sonKare: g.simdi, kaynak: g.kaynak }
  if (g.ses) {
    if (!n.duydu) { n.duydu = true; n.konusmaBas = g.simdi }
    n.sesliMs += gecen
    n.sessizBas = 0
  } else if (n.duydu) {
    if (!n.sessizBas) n.sessizBas = g.simdi
    const konusmaMs = g.simdi - n.konusmaBas
    if (konusmaMs >= FISH_MIN_KONUSMA_MS && g.simdi - n.sessizBas >= sessizlikKuyrugu(n.kaynak)) return { durum: n, bitir: 'sessizlik' }
  }
  if (n.duydu && g.simdi - n.konusmaBas > FISH_AZAMI_TUR_MS) return { durum: n, bitir: 'azami' }
  return { durum: n, bitir: null }
}
