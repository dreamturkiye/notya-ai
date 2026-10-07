/**
 * NOTYA-SES-PROFILI-01 — when to score a speech segment against the doctor's profile, and what the segment's verdict
 * is. Pure state machine fed once per detector frame (same speech signal and hangover as the speech gate).
 *
 * A segment starts at the first speech frame and ends after KAPI_KUYRUK_MS of silence. It is first scored once it
 * holds SES_PROFILI_AYAR.dogrulaMinMs of speech, then every yenidenPuanMs while it grows (up to azamiPuanMs), until
 * a final verdict ('kabul' / 'red') sticks for the rest of the segment. A segment that ends before its first score is
 * "short" (dur, evet): it never had a verdict and follows the speech-only rule.
 */
import { KAPI_KUYRUK_MS, KAPI_ADIM_AZAMI_MS } from '@/lib/asistan/konusmaKapisi'
import { SES_PROFILI_AYAR, profilKarari, type ProfilKarari } from '@/lib/asistan/sesProfili/ayar'

export type DogrulamaDurumu = {
  /** Segment counter: a score for an older segment is ignored. */
  bolum: number
  /** Wall-clock start of the current segment (first speech frame), 0 = no segment. */
  bolumBas: number
  sesliMs: number
  sessizMs: number
  /** sesliMs at the last score request; -1 = never scored. */
  sonPuan: number
  bekliyor: boolean
  karar: ProfilKarari | null
  sonT: number
}

/** Anonymous tuning counters: verdict counts only — no audio, no text, no doctor id. */
export type ProfilSayac = { kabul: number; red: number; belirsiz: number; kisa: number }

export function sayacBaslat(): ProfilSayac {
  return { kabul: 0, red: 0, belirsiz: 0, kisa: 0 }
}

export function dogrulamaBaslat(): DogrulamaDurumu {
  return { bolum: 0, bolumBas: 0, sesliMs: 0, sessizMs: Number.POSITIVE_INFINITY, sonPuan: -1, bekliyor: false, karar: null, sonT: 0 }
}

export type DogrulamaAdimi = {
  durum: DogrulamaDurumu
  /** Score the audio of the current segment now (from `bolumBas`), tagged with `bolum`. */
  puanla: boolean
  /** A segment just ended with this outcome (counter key), or null. */
  bitti: keyof ProfilSayac | null
}

export function dogrulamaAdimi(d: DogrulamaDurumu, g: { t: number; sesli: boolean }, ayar = SES_PROFILI_AYAR): DogrulamaAdimi {
  const dt = d.sonT > 0 ? Math.min(Math.max(0, g.t - d.sonT), KAPI_ADIM_AZAMI_MS) : 0
  let n: DogrulamaDurumu = { ...d, sonT: g.t }
  let bitti: DogrulamaAdimi['bitti'] = null
  if (g.sesli) {
    if (!n.bolumBas) n = { ...n, bolum: n.bolum + 1, bolumBas: g.t, sesliMs: 0, sonPuan: -1, bekliyor: false, karar: null }
    n.sesliMs += dt
    n.sessizMs = 0
  } else {
    n.sessizMs = d.sessizMs + dt
    if (n.bolumBas && n.sessizMs >= KAPI_KUYRUK_MS) {
      bitti = n.karar ?? (n.sonPuan < 0 ? 'kisa' : 'belirsiz')
      n = { ...n, bolumBas: 0, sesliMs: 0, sonPuan: -1, bekliyor: false, karar: null }
    }
  }
  const sonKarar = n.karar === 'kabul' || n.karar === 'red'
  const zamani = n.sonPuan < 0 ? n.sesliMs >= ayar.dogrulaMinMs : n.sesliMs - n.sonPuan >= ayar.yenidenPuanMs
  const puanla = Boolean(n.bolumBas) && g.sesli && !n.bekliyor && !sonKarar && zamani && n.sesliMs <= ayar.azamiPuanMs + ayar.yenidenPuanMs
  if (puanla) n = { ...n, bekliyor: true, sonPuan: n.sesliMs }
  return { durum: n, puanla, bitti }
}

/** A score came back for segment `bolum`. Null score (engine failed) = no verdict. */
export function puanGeldi(d: DogrulamaDurumu, g: { bolum: number; skor: number | null }, ayar = SES_PROFILI_AYAR): DogrulamaDurumu {
  if (g.bolum !== d.bolum || !d.bolumBas) return d
  const karar = g.skor === null ? d.karar : profilKarari(g.skor, ayar)
  return { ...d, bekliyor: false, karar }
}

export function sayacEkle(s: ProfilSayac, k: keyof ProfilSayac | null): ProfilSayac {
  return k ? { ...s, [k]: s[k] + 1 } : s
}

/* ---- The audio of the current segment, from 16 kHz detector frames ---- */

export type KareTamponu = { kareler: { t: number; pcm: Float32Array }[]; azamiMs: number }

export function tamponBaslat(azamiMs = 2500): KareTamponu {
  return { kareler: [], azamiMs }
}

/** Keep the last `azamiMs` of frames (mutates; frames are copied by the caller). */
export function tamponEkle(b: KareTamponu, t: number, pcm: Float32Array): void {
  b.kareler.push({ t, pcm })
  while (b.kareler.length > 1 && t - b.kareler[0].t > b.azamiMs) b.kareler.shift()
}

/** Audio of the segment that started at `bas` (minus the pre-roll), at most `azamiMs`, newest frames kept. */
export function bolumSesi(b: KareTamponu, bas: number, ayar = SES_PROFILI_AYAR, hz = 16000): Float32Array {
  const secili = b.kareler.filter((k) => k.t >= bas - ayar.onTamponMs)
  let n = 0
  for (const k of secili) n += k.pcm.length
  const azami = Math.floor((ayar.azamiPuanMs / 1000) * hz)
  const out = new Float32Array(Math.min(n, azami))
  let o = out.length
  for (let i = secili.length - 1; i >= 0 && o > 0; i--) {
    const p = secili[i].pcm
    const al = Math.min(p.length, o)
    out.set(p.subarray(p.length - al), o - al)
    o -= al
  }
  return out
}
