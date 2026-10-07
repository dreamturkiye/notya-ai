/**
 * NOTYA-AYSE-GURULTU-01 (Kaan, 2026-10-07) — speech gate for Ayşe's ElevenLabs voice path.
 *
 * A smoke-alarm chirp cut Ayşe off mid-sentence: on ElevenLabs the interruption is decided by the service from
 * whatever microphone audio we send. While the agent is speaking, the audio we send stays muted (SDK
 * `setMicMuted`) unless a local detector says the doctor is really speaking: Silero speech probability above the
 * enter threshold AND microphone RMS above a floor, for about 200 ms. It stays open while speech continues and
 * closes a short hangover after speech ends. When the agent is not speaking the gate is always open, so normal
 * turn-taking is unchanged. Unknown (Silero missing / stale) is always open — fail open, never fail mute.
 *
 * Pure state machine, one step per Silero frame or watchdog tick. Browser glue: lib/asistan/elevenKapi.ts.
 *
 * NOTYA-SES-PROFILI-01: with a doctor voice profile the gate also weighs the segment's profile verdict — a strong
 * preference, never a hard lock (see `kapiAdimi`). Without a profile (`profil` null) nothing changes.
 */
import { FISH_SILERO_CIKIS_ESIK, FISH_SILERO_ESIK } from '@/lib/asistan/fishVad'
import { SES_PROFILI_AYAR, type ProfilKarari } from '@/lib/asistan/sesProfili/ayar'

/** Speech (Silero ≥ enter AND RMS ≥ floor) needed before the gate opens while Ayşe speaks. */
export const KAPI_ACMA_MS = 200
/** Hangover: the gate stays open this long after the doctor's speech ends, if Ayşe is still speaking. */
export const KAPI_KUYRUK_MS = 600
/**
 * RMS floor on the same (echo-cancelled) microphone track. Silero hears Ayşe's own speaker leak as speech;
 * the leak is quieter than a doctor at the microphone. Between FISH_KONUSMA_ESIK (0.02) and FISH_BARGE_ESIK (0.12).
 */
export const KAPI_RMS_TABAN = 0.03
/** One step never adds more than this (a stalled tab must not "accumulate" 2 s of speech in one frame). */
export const KAPI_ADIM_AZAMI_MS = 120

export type KapiNedeni = 'ajan_susuyor' | 'bilinmiyor' | 'konusma' | 'kuyruk' | 'kapali' | 'profil_red' | 'profil_bekle'

export type KapiDurumu = {
  acik: boolean
  /** Hysteresis state of the speech detector (Silero enter/exit + RMS floor). */
  konusuyor: boolean
  /** Speech accumulated while the gate is closed. */
  konusmaMs: number
  /** Silence since the last speech frame (Infinity at start: an agent turn starting in silence closes at once). */
  sessizMs: number
  /** Speech in the current segment (a segment ends after KAPI_KUYRUK_MS of silence) — the voice-profile clock. */
  bolumMs: number
  /** The profile rejected this segment: closed until the segment ends. */
  bolumRed: boolean
  /** Last rejection time (ms clock); 0 = never. */
  sonRed: number
  sonT: number
  neden: KapiNedeni
}

export type KapiGirdi = {
  t: number
  ajanKonusuyor: boolean
  /** Fresh Silero speech probability, or null when unknown (not loaded, stalled, failed). */
  p: number | null
  rms: number
  /**
   * NOTYA-SES-PROFILI-01: null = no usable profile (no profile, model not loaded, engine failed).
   * Otherwise the current segment's verdict, null while not scored yet.
   */
  profil?: { karar: ProfilKarari | null } | null
}

export function kapiBaslat(): KapiDurumu {
  return { acik: true, konusuyor: false, konusmaMs: 0, sessizMs: Number.POSITIVE_INFINITY, bolumMs: 0, bolumRed: false, sonRed: 0, sonT: 0, neden: 'ajan_susuyor' }
}

/** Speech detector frame decision: Silero hysteresis AND the RMS floor. */
export function kapiKonusmaMi(p: number, rms: number, onceki: boolean): boolean {
  if (!(p >= 0) || !(rms >= KAPI_RMS_TABAN)) return false
  return onceki ? p >= FISH_SILERO_CIKIS_ESIK : p >= FISH_SILERO_ESIK
}

/**
 * One step. While Ayşe speaks:
 * - closed: speech accumulates; at KAPI_ACMA_MS the gate opens; a non-speech frame resets the count;
 * - open: speech keeps it open; KAPI_KUYRUK_MS of silence closes it.
 * With a voice profile (NOTYA-SES-PROFILI-01) — a strong preference, never a hard lock:
 * - 'red' (clearly not the doctor) closes the gate for the rest of that speech segment;
 * - 'kabul' opens it as usual;
 * - short words (dur, evet) end before any verdict exists, so they follow the speech-only rule above;
 * - only right after a rejection (SES_PROFILI_AYAR.redSonrasiMs — a crying child cries again) does a new segment
 *   wait for its verdict instead of opening at KAPI_ACMA_MS, and never longer than dogrulaAzamiMs of speech.
 */
export function kapiAdimi(d: KapiDurumu, g: KapiGirdi): KapiDurumu {
  const dt = d.sonT > 0 ? Math.min(Math.max(0, g.t - d.sonT), KAPI_ADIM_AZAMI_MS) : 0
  const bilinmiyor = g.p === null || !Number.isFinite(g.p)
  const konusuyor = bilinmiyor ? false : kapiKonusmaMi(g.p as number, g.rms, d.konusuyor)
  const sessizMs = konusuyor ? 0 : d.sessizMs + dt
  const bolumBitti = sessizMs >= KAPI_KUYRUK_MS
  const bolumMs = konusuyor ? d.bolumMs + dt : (bolumBitti ? 0 : d.bolumMs)
  const profil = g.profil ?? null
  const karar = profil?.karar ?? null
  let bolumRed = bolumBitti || !profil ? false : d.bolumRed
  let sonRed = d.sonRed
  if (karar === 'red' && !bolumBitti && !bolumRed) { bolumRed = true; sonRed = g.t }
  const ortak = { konusuyor, sessizMs, bolumMs, bolumRed, sonRed, sonT: g.t }

  if (!g.ajanKonusuyor) return { ...ortak, acik: true, konusmaMs: 0, neden: 'ajan_susuyor' }
  if (bilinmiyor) return { ...ortak, acik: true, konusmaMs: 0, neden: 'bilinmiyor' }
  if (bolumRed) return { ...ortak, acik: false, konusmaMs: 0, neden: 'profil_red' }

  if (d.acik) {
    if (konusuyor) return { ...ortak, acik: true, konusmaMs: 0, neden: 'konusma' }
    if (bolumBitti) return { ...ortak, acik: false, konusmaMs: 0, neden: 'kapali' }
    return { ...ortak, acik: true, konusmaMs: 0, neden: 'kuyruk' }
  }

  if (!konusuyor) return { ...ortak, acik: false, konusmaMs: 0, neden: 'kapali' }
  const konusmaMs = d.konusmaMs + dt
  if (konusmaMs < KAPI_ACMA_MS) return { ...ortak, acik: false, konusmaMs, neden: 'kapali' }
  const redYeni = profil !== null && karar !== 'kabul' && sonRed > 0 && g.t - sonRed < SES_PROFILI_AYAR.redSonrasiMs
  if (redYeni && bolumMs < SES_PROFILI_AYAR.dogrulaAzamiMs) return { ...ortak, acik: false, konusmaMs, neden: 'profil_bekle' }
  return { ...ortak, acik: true, konusmaMs: 0, neden: 'konusma' }
}

/* ---- Kill switch: one flag per browser, default ON, no deploy needed. ---- */

export const KAPI_ANAHTAR = 'notya.sesKapisi'
export const KAPI_SORGU = 'sesKapisi'

/** `localStorage[notya.sesKapisi]` = 'kapali' (or off / 0 / false) turns the gate off in this browser. */
export function kapiAyariAcikMi(deger: string | null | undefined): boolean {
  const v = String(deger ?? '').trim().toLocaleLowerCase('tr-TR')
  return !(v === 'kapali' || v === 'kapalı' || v === 'off' || v === '0' || v === 'false')
}

/**
 * Reads the flag; `?sesKapisi=kapali` / `?sesKapisi=acik` in the page URL writes it first (so support can send
 * one link). Any storage error → ON (the default).
 */
export function kapiTarayicidaAcikMi(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const sorgu = new URLSearchParams(window.location.search).get(KAPI_SORGU)
    if (sorgu !== null) {
      if (kapiAyariAcikMi(sorgu)) window.localStorage.removeItem(KAPI_ANAHTAR)
      else window.localStorage.setItem(KAPI_ANAHTAR, 'kapali')
    }
    return kapiAyariAcikMi(window.localStorage.getItem(KAPI_ANAHTAR))
  } catch {
    return true
  }
}
