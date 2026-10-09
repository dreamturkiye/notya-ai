/**
 * NOTYA-UZ-MUAYENE-01 — speech recognition for a visit recording (docs/COUNTRY-PACK-CHECKLIST.md E5).
 *
 * The engine is core; every choice in it is the active pack's (countries/active/klinik → `konusma`): the model, the
 * language codes, and what "low confidence" means. A country without a clinical half has no speech recognition.
 *
 * THE RULE (Kaan, 2026-10-08):
 *   1. FIRST PASS with no language: the provider predicts it. The predicted language and its probability are kept.
 *   2. Low confidence (probability of the language, or average word log-probability, below the pack's thresholds)
 *      → ONE second pass with the language forced to the doctor's note language.
 *      Whichever transcript has the higher average word log-probability is kept; a tie keeps the first.
 *   3. NEVER more than two passes for one recording — AZAMI_GECIS is a constant here, not a setting.
 *   4. The caller records that a second pass ran (it costs a second transcription), and whether confidence is
 *      still low after it, so the note screen can ask the doctor to check the note carefully.
 *
 * Provider: ElevenLabs Scribe (POST /v1/speech-to-text, multipart). The answer carries `language_code`,
 * `language_probability`, `text` and per-word `logprob`. Its error bodies are never read into an answer or a log:
 * they may quote the audio's content. No key configured = "not ready", never a guess and never another provider.
 */
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import type { DilKodu, KonusmaTanimaAyarlari } from '../tipler'

/** One recording is sent to the provider at most this many times. */
export const AZAMI_GECIS = 2
const ADRES = 'https://api.elevenlabs.io/v1/speech-to-text'
const ZAMAN_ASIMI_MS = 120_000

export type Gecis = {
  metin: string
  /** Language code as the provider gave it ('uzb', 'rus', …). */
  dilKodu: string
  /** 0–1; null when the provider did not say. */
  dilOlasiligi: number | null
  /** Mean of the words' log-probabilities (≤ 0); null when the answer carried none. */
  ortalamaLogOlasilik: number | null
  /** Length of the recording in seconds (end of the last word); null when unknown. */
  sureSn: number | null
}

export type TanimaSonucu =
  | { durum: 'hazir-degil' }
  | { durum: 'okunamadi' }
  | {
      durum: 'tamam'
      /** The pass that was kept. */
      secilen: Gecis
      secilenGecis: 1 | 2
      /** What the FIRST pass predicted, whichever pass was kept: this is "the language of the visit". */
      taninanDil: string
      dilOlasiligi: number | null
      ikinciGecis: boolean
      /** Language code the second pass was forced to; null when there was none. */
      ikinciGecisDili: string | null
      /** Confidence is still below the thresholds after everything that was tried. */
      dusukGuven: boolean
      gecisSayisi: number
      /**
       * NOTYA-ULKE-PORTAL-01 — for the usage record: the seconds of audio each ANSWERED pass reported (null = the
       * provider did not say). `ikinci` is undefined where no second pass ran or the provider did not answer it.
       */
      gecisSureleri: { ilk: number | null; ikinci?: number | null }
    }

type ScribeCevabi = { text?: unknown; language_code?: unknown; language_probability?: unknown; words?: unknown }

/** The provider's answer as the rule needs it. Pure: tests feed it. */
export function gecisOku(veri: ScribeCevabi): Gecis {
  const kelimeler = Array.isArray(veri.words) ? (veri.words as { type?: unknown; logprob?: unknown; end?: unknown }[]) : []
  const olasiliklar = kelimeler.filter((k) => (k?.type ?? 'word') === 'word' && typeof k.logprob === 'number' && Number.isFinite(k.logprob)).map((k) => k.logprob as number)
  const sonlar = kelimeler.map((k) => (typeof k?.end === 'number' ? k.end : 0))
  const p = veri.language_probability
  return {
    metin: typeof veri.text === 'string' ? veri.text.trim() : '',
    dilKodu: typeof veri.language_code === 'string' ? veri.language_code : '',
    dilOlasiligi: typeof p === 'number' && Number.isFinite(p) ? p : null,
    ortalamaLogOlasilik: olasiliklar.length ? olasiliklar.reduce((t, x) => t + x, 0) / olasiliklar.length : null,
    sureSn: sonlar.length ? Math.max(...sonlar) || null : null,
  }
}

/** Words are less certain than the pack accepts. An answer without word probabilities cannot be judged: not low. */
const kelimelerDusuk = (g: Gecis, a: KonusmaTanimaAyarlari) => g.ortalamaLogOlasilik !== null && g.ortalamaLogOlasilik < a.ortalamaLogOlasilikEsigi
/** The predicted language is less certain than the pack accepts. Only a pass that PREDICTED its language has one. */
const dilDusuk = (g: Gecis, a: KonusmaTanimaAyarlari) => g.dilOlasiligi !== null && g.dilOlasiligi < a.dilOlasiligiEsigi

/** Does the first pass call for a second one? Pure. */
export function ikinciGecisGerekliMi(ilk: Gecis, a: KonusmaTanimaAyarlari): boolean {
  return dilDusuk(ilk, a) || kelimelerDusuk(ilk, a)
}

/** Which of the two passes is kept: the higher average word log-probability; a tie, or nothing to compare, keeps the first. Pure. */
export function gecisSec(ilk: Gecis, ikinci: Gecis | null): 1 | 2 {
  if (!ikinci || !ikinci.metin) return 1
  if (!ilk.metin) return 2
  if (ilk.ortalamaLogOlasilik === null || ikinci.ortalamaLogOlasilik === null) return 1
  return ikinci.ortalamaLogOlasilik > ilk.ortalamaLogOlasilik ? 2 : 1
}

async function saglayiciyaGonder(ses: Blob, a: KonusmaTanimaAyarlari, anahtar: string, dilKodu: string | null): Promise<Gecis | null> {
  const form = new FormData()
  form.append('model_id', a.model)
  if (dilKodu) form.append('language_code', dilKodu)
  form.append('file', ses, 'recording')
  try {
    const r = await fetch(ADRES, { method: 'POST', headers: { 'xi-api-key': anahtar }, body: form, signal: AbortSignal.timeout(ZAMAN_ASIMI_MS) })
    if (!r.ok) { console.error(`[ulke/konusma] provider answered ${r.status} (pass ${dilKodu ? 2 : 1})`); return null }
    return gecisOku((await r.json()) as ScribeCevabi)
  } catch (e) {
    console.error(`[ulke/konusma] provider unreachable (pass ${dilKodu ? 2 : 1}): ${e instanceof Error ? e.name : typeof e}`)
    return null
  }
}

/** true = this deployment can transcribe: the country brings speech settings and a key is configured. */
export function konusmaTanimaHazir(): boolean {
  return Boolean(AKTIF_KLINIK?.konusma && process.env.ELEVENLABS_API_KEY?.trim())
}

export async function konusmayiTani(ses: Blob, notDili: DilKodu): Promise<TanimaSonucu> {
  const a = AKTIF_KLINIK?.konusma
  const anahtar = process.env.ELEVENLABS_API_KEY?.trim()
  if (!a || !anahtar) return { durum: 'hazir-degil' }

  let gecisSayisi = 1
  const ilk = await saglayiciyaGonder(ses, a, anahtar, null)
  if (!ilk) return { durum: 'okunamadi' }

  let ikinci: Gecis | null = null
  let ikinciGecisDili: string | null = null
  const zorlanacak = a.zorlamaDilKodlari[notDili] ?? null
  // The one and only second pass. `gecisSayisi < AZAMI_GECIS` is the guard that makes a third impossible.
  if (ikinciGecisGerekliMi(ilk, a) && zorlanacak && gecisSayisi < AZAMI_GECIS) {
    gecisSayisi += 1
    ikinciGecisDili = zorlanacak
    ikinci = await saglayiciyaGonder(ses, a, anahtar, zorlanacak)
  }

  const secilenGecis = gecisSec(ilk, ikinci)
  const secilen = secilenGecis === 2 && ikinci ? ikinci : ilk
  // Still low? The words of the kept transcript, always; and the language, when the kept transcript is the one
  // whose language was predicted (a forced pass has no prediction to doubt).
  const dusukGuven = kelimelerDusuk(secilen, a) || (secilenGecis === 1 && dilDusuk(ilk, a))
  return {
    durum: 'tamam', secilen, secilenGecis,
    taninanDil: ilk.dilKodu, dilOlasiligi: ilk.dilOlasiligi,
    ikinciGecis: gecisSayisi > 1, ikinciGecisDili, dusukGuven, gecisSayisi,
    gecisSureleri: { ilk: ilk.sureSn, ...(ikinci ? { ikinci: ikinci.sureSn } : {}) },
  }
}
