/**
 * NOTYA-IKI-BEYIN-BIRDE (Kaan, 2026-10-03) — full power of two brains in one.
 *
 * Goal: restore the mature QoS of the pre–2026-09-25 dual-brain setup without bringing back its two failures:
 *   1. Cost of two LLM hosts (ElevenLabs-hosted brain + chat brain)
 *   2. ElevenLabs speech degradation (slur / rush / crawl) from a fat ConvAI agent prompt + long spoken dumps
 *
 * Architecture ("thin mouth, strong brain"):
 *   - ElevenLabs: mic, turn-taking, TTS only. Short agent prompt. Flash v2.5 locked (NOTYA-SES-KILIT-01).
 *     Spoken beats capped (NOTYA-SES-SLUR-01). No clinical brain and no growing client-tool set on the agent.
 *   - Server brain (`ayseCevapla`): all search, chart Q&A, calendar, write cards — via model-free FAST PATH
 *     when confidence is high, else Luna + read tools (`hasta_bul`, `randevu_takvim`, …) the old voice brain had.
 *
 * This module is the confidence gate for the search / practice-answer sentence. High-confidence router answers
 * stay free and fast (no model call). Weak or empty search answers that are NOT an explicit count/list question
 * fall through to the model with its read tools — the old 2-brain lookup power — instead of ending as
 * "Kayıtlarda 0 hasta" / "bilemedim".
 *
 * Kill switch: `AYSE_IKI_BEYIN_BIRDE_KAPALI=1` restores pre-gate behaviour (router answers always stick).
 */
import { kohortSorusuMu, ziyaretleTarifMi } from '@/lib/asistan/aktifHasta'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export function ikiBeyinBirdeKapali(): boolean {
  return String(process.env.AYSE_IKI_BEYIN_BIRDE_KAPALI || '').trim() === '1'
}

/** Explicit practice count / list / who-over-the-panel — the search sentence is the product answer. */
export function acikSayimVeyaListeMi(mesaj: string): boolean {
  return kohortSorusuMu(mesaj) || ziyaretleTarifMi(mesaj)
}

/**
 * Empty / zero practice-search sentence. These are fine answers to "kaç hastam var?" with an empty panel,
 * but fatal when a clinical or named question was misrouted into the search template.
 */
const BOS_ARAMA = /(?:kayitlarda|kayıtlarda|son\s+\d+\s+g[uü]n|bug[uü]n|d[uü]n)\s+0\s+hasta|0\s+hasta\s*\.\s*filtre|hi[cç]\s+hasta\s+bulamad[iı]m|kayitlarda\s+0\b/i

export function bosAramaCumlesiMi(cevap: string): boolean {
  const n = trAramaNormalize(String(cevap || ''))
  return BOS_ARAMA.test(n) || BOS_ARAMA.test(String(cevap || ''))
}

export type AramaGuvenGirdi = {
  mesaj: string
  /** The sentence `cozumKonus` would return (count / list / who / not-found). */
  aramaCevabi: string | null | undefined
  /** Resolver shape — multi-match and "which surname?" are always trusted. */
  cozumTur: 'tek' | 'coklu' | 'yok' | null | undefined
  cokAday?: boolean
  /** Deterministic "X dosyası açık" / named who-answer — always trusted. */
  dosyaAcma?: boolean
  cevapliTek?: boolean
  /** "Bu isimde bir hasta bulamadım" after a chart-open ask — always trusted (no model). */
  isimBulunamadi?: boolean
}

/**
 * Should the model-free search sentence end the turn?
 *
 * Trusted (fast, no model — keeps the app snappy):
 *   - multi-match / "which patient?" clarification
 *   - deterministic chart-open
 *   - named who-answer with a real patient
 *   - name-not-found after a chart-open ask
 *   - explicit count / list / visit-described cohort — even when the answer is "0 hasta"
 *
 * Not trusted (fall through → Luna + `hasta_bul`, old 2-brain power):
 *   - empty / "0 hasta · Filtre: …" when the doctor did NOT ask an explicit count/list
 *   - any other search sentence that is not an explicit practice question (safety net)
 */
export function aramaCevabiGuvenilirMi(g: AramaGuvenGirdi): boolean {
  if (ikiBeyinBirdeKapali()) return true
  const cevap = String(g.aramaCevabi || '').trim()
  if (!cevap) return false
  if (g.cozumTur === 'coklu' || g.cokAday) return true
  if (g.dosyaAcma) return true
  if (g.isimBulunamadi) return true
  if (g.cevapliTek) return true
  const acik = acikSayimVeyaListeMi(g.mesaj)
  if (acik) return true
  // Non-explicit question that landed on an empty search template — never end the turn here.
  if (bosAramaCumlesiMi(cevap)) return false
  // A search sentence without an explicit count/list intent is a router overreach — give the model the tools.
  return false
}

/**
 * Identity fast path: if the sentence names a person who is not the open chart, do not answer from the open chart.
 * Fall through to the model + `hasta_bul` (same power the old voice brain had for "X'in annesinin adı ne?").
 * Only applies when a chart is open AND the identity answer is that open patient — with no open chart the identity
 * router's own resolve is trusted (named "Umutcan'ın annesi" still answers modelsiz).
 */
export function kimlikAcikDosyayaDusmesinMi(mesaj: string, kimlikHastaAdi: string | null | undefined, acikHastaAdi: string | null | undefined, anilanBaska: string | null | undefined): boolean {
  if (ikiBeyinBirdeKapali()) return false
  if (!anilanBaska) return false
  const kimlikAd = String(kimlikHastaAdi || '').trim()
  const acikAd = String(acikHastaAdi || '').trim()
  if (!acikAd || !kimlikAd) return false
  return trAramaNormalize(kimlikAd) === trAramaNormalize(acikAd)
}
