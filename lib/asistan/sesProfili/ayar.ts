/**
 * NOTYA-SES-PROFILI-01 (Kaan, 2026-10-07) — doctor voice profile: ONE config for every threshold.
 *
 * A strong preference, never a hard lock, and NOT authentication: never used for sign-in or described as security.
 * Model: Resemblyzer GE2E speaker encoder (Apache-2.0), converted by scripts/ses-profili/ge2e-donustur.py.
 * Scores are cosine similarities between L2-normalised 256-d embeddings.
 *
 * Starting values come from public test recordings (pocketsphinx test data: one LibriVox reader, one "cards"
 * speaker, several others), not from real clinic audio — at 0.8 s of speech the same speaker scored 0.68–0.87 and
 * other speakers ≤ 0.70; at 1.2 s ≥ 0.76 vs ≤ 0.72. Tune with Dr. Gökhan (OPEN-COMMITMENTS NOTYA-SES-PROFILI-b).
 */

export const SES_PROFILI_MODEL_SURUMU = 'ge2e-v1'
export const SES_PROFILI_MODEL_YOLU = '/ses-profili/ge2e-v1.bin'
export const SES_PROFILI_BOYUT = 256

export type ProfilKarari = 'kabul' | 'red' | 'belirsiz'

export const SES_PROFILI_AYAR = {
  /** First verdict once the current speech segment holds this much speech. Shorter words → speech-only rule. */
  dogrulaMinMs: 800,
  /** Re-score at most this often while the segment grows (each score is one LSTM pass in the worker). */
  yenidenPuanMs: 300,
  /** Score ≥ this: the doctor. */
  kabulEsik: 0.72,
  /** Score < this: clearly someone/something else — the gate closes for the rest of that segment. */
  redEsik: 0.6,
  /** After a rejection, a new segment waits for a verdict instead of opening at 200 ms — but never longer than this. */
  dogrulaAzamiMs: 1500,
  /** How long a rejection keeps raising the bar for new segments (a crying child cries again). */
  redSonrasiMs: 4000,
  /** Audio kept before the detector said "speech" (word onsets). */
  onTamponMs: 150,
  /** Longest audio scored (GE2E partial = 1.6 s). */
  azamiPuanMs: 1600,
} as const

/** A stored profile must be exactly SES_PROFILI_BOYUT finite numbers of sane magnitude (an L2-normalised embedding). */
export function profilGecerliMi(p: unknown): p is number[] {
  return Array.isArray(p) && p.length === SES_PROFILI_BOYUT && p.every((x) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 1.5)
}

/** Verdict for one score. */
export function profilKarari(skor: number | null | undefined, ayar = SES_PROFILI_AYAR): ProfilKarari {
  if (typeof skor !== 'number' || !Number.isFinite(skor)) return 'belirsiz'
  if (skor >= ayar.kabulEsik) return 'kabul'
  if (skor < ayar.redEsik) return 'red'
  return 'belirsiz'
}

/* ---- Enrolment ---- */

/** Four short, phonetically varied Turkish sentences (~30 s together). Shown on screen; the doctor reads them. */
export const KAYIT_CUMLELERI = [
  'Bugün polikliniğe gelen çocuğun ateşi üç gündür sürüyor ve öksürüğü geceleri artıyor.',
  'Şırınga, çikolata ve ağrı kesici şurup ayrı rafta, göz damlasının yanında duruyor.',
  'Yoğun bakım ünitesinde yatan hastanın böbrek fonksiyonlarını ve elektrolitlerini yeniden kontrol edelim.',
  'Hafif öksürük, burun akıntısı ve iştahsızlık şikâyetiyle gelen genç kızın muayenesi normaldi.',
] as const

export const KAYIT_KALITE = {
  /** Voiced speech needed per sentence. */
  minSesliMs: 2000,
  /** Speech level (RMS of voiced frames) below this is "too quiet". */
  minSesRms: 0.012,
  /** Speech-to-background ratio below this (dB) is "too noisy". */
  minSnrDb: 12,
  /** A sentence longer than this is cut (someone forgot to stop). */
  azamiMs: 15_000,
} as const

export type KayitSorunu = 'kisa' | 'sessiz' | 'gurultulu'

/** Turkish UI copy for a failed sentence (the doctor repeats only that one). */
export const KAYIT_SORUN_METNI: Record<KayitSorunu, string> = {
  kisa: 'Kayıt çok kısa oldu. Cümlenin tamamını okuyarak tekrar deneyin.',
  sessiz: 'Sesiniz çok kısık geldi. Mikrofona biraz yaklaşıp tekrar deneyin.',
  gurultulu: 'Ortam çok gürültülü. Daha sessiz bir yerde tekrar deneyin.',
}
