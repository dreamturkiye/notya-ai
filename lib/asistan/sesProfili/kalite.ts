/**
 * NOTYA-SES-PROFILI-01 — enrolment quality per read sentence (too short / too quiet / too noisy) and the silence
 * trim applied before embedding (stands in for resemblyzer's webrtcvad `trim_long_silences`). Pure, 16 kHz.
 */
import { KAYIT_KALITE, type KayitSorunu } from '@/lib/asistan/sesProfili/ayar'

const PENCERE = 480 // 30 ms at 16 kHz

function pencereRms(wav: Float32Array): Float32Array {
  const n = Math.floor(wav.length / PENCERE)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = i * PENCERE; j < (i + 1) * PENCERE; j++) s += wav[j] * wav[j]
    out[i] = Math.sqrt(s / PENCERE)
  }
  return out
}

function yuzdelik(a: Float32Array, q: number): number {
  if (!a.length) return 0
  const s = Array.from(a).sort((x, y) => x - y)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * (s.length - 1))))]
}

/** Voiced windows: louder than both the background estimate ×3 and 10 % of the loud end. */
function sesliPencereler(r: Float32Array): { maske: boolean[]; arka: number; konusma: number; tepe: number } {
  const arka = Math.max(yuzdelik(r, 0.1), 1e-5)
  const tepe = yuzdelik(r, 0.95)
  const esik = Math.max(arka * 3, tepe * 0.1)
  const maske = Array.from(r, (x) => x >= esik)
  const sesli = Array.from(r).filter((_, i) => maske[i])
  let s = 0
  for (const x of sesli) s += x * x
  return { maske, arka, tepe, konusma: sesli.length ? Math.sqrt(s / sesli.length) : 0 }
}

export type KayitKalitesi = { tamam: boolean; sorun: KayitSorunu | null; sesliMs: number; snrDb: number; seviye: number }

export function kayitKalitesi(wav16: Float32Array, kalite = KAYIT_KALITE): KayitKalitesi {
  const r = pencereRms(wav16)
  const { maske, arka, konusma, tepe } = sesliPencereler(r)
  const sesliMs = maske.filter(Boolean).length * 30
  // Loud end over background: speech that drowns in steady noise leaves no voiced windows at all.
  const snrDb = 20 * Math.log10(Math.max(konusma, tepe, 1e-5) / arka)
  const sonuc = { sesliMs, snrDb, seviye: konusma }
  if (snrDb < kalite.minSnrDb) return { ...sonuc, tamam: false, sorun: r.length && tepe < kalite.minSesRms ? 'sessiz' : 'gurultulu' }
  if (sesliMs < kalite.minSesliMs) return { ...sonuc, tamam: false, sorun: 'kisa' }
  if (konusma < kalite.minSesRms) return { ...sonuc, tamam: false, sorun: 'sessiz' }
  return { ...sonuc, tamam: true, sorun: null }
}

/** Drop long silences: keep voiced windows dilated by 6 windows (≈180 ms) each side, like resemblyzer. */
export function sessizlikKirp(wav16: Float32Array): Float32Array {
  const r = pencereRms(wav16)
  if (!r.length) return wav16
  const { maske } = sesliPencereler(r)
  const tut = maske.map((_, i) => {
    for (let k = Math.max(0, i - 6); k <= Math.min(maske.length - 1, i + 6); k++) if (maske[k]) return true
    return false
  })
  let n = 0
  for (const x of tut) if (x) n += PENCERE
  if (!n) return wav16
  const out = new Float32Array(n)
  let o = 0
  for (let i = 0; i < tut.length; i++) {
    if (!tut[i]) continue
    out.set(wav16.subarray(i * PENCERE, (i + 1) * PENCERE), o)
    o += PENCERE
  }
  return out
}
