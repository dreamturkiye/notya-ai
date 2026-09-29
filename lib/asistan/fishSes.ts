/**
 * NOTYA-FISH-AYSE-01 — Ayşe Kaya (pediatri) speaks with Fish, not ElevenLabs.
 *
 * Locked with Kaan, 2026-09-28: haber sunucusu, speed 1.0, no emotion,
 * a short [break] between sentences. Model is the free developer tier
 * (s2.1-pro-free) through 30 Nov 2026. Other specialists stay on ElevenLabs.
 */

export const FISH_HABER_SES_ID = '27d0d61d7dc8479da8dfd991ae3ad66b'
export const FISH_MODEL = 's2.1-pro-free'
export const FISH_HIZ = 1
export const FISH_ORNEK_HZ = 24000

const ETIKET = /\[[^\]]{0,120}\]/g

/** Strip any bracket cue, then put one short pause between sentences. */
export function fishMetni(ham: string): string {
  const duz = String(ham || '').replace(ETIKET, ' ').replace(/\s+/g, ' ').trim()
  if (!duz) return ''
  const cumleler = duz.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean)
  return cumleler.join(' [break] ')
}

export function fishIstegi(metin: string): { model: string; govde: Record<string, unknown> } | null {
  const text = fishMetni(metin)
  if (!text) return null
  return {
    model: FISH_MODEL,
    govde: {
      text,
      reference_id: FISH_HABER_SES_ID,
      format: 'pcm',
      sample_rate: 24000,
      temperature: 0.7,
      top_p: 0.7,
      normalize: true,
      latency: 'balanced',
      chunk_length: 300,
      prosody: { speed: FISH_HIZ, volume: 0, normalize_loudness: true },
    },
  }
}

/**
 * NOTYA-SES-FISH-SADECE-01: Ayşe Kaya'nın sesli yolu uçtan uca Fish — dinleme (/v1/asr) ve konuşma (/v1/tts) aynı
 * FISH_API_KEY ile. Başka satıcı yok. Yalnız aysekaya; anahtar yoksa yol kapalıdır ve Ayşe'nin sesli görüşmesi
 * görünür hatayla açılmaz (ElevenLabs'e düşülmez) — başka persona bu yola hiç girmez.
 */
export function fishUctanUcaAcik(personaId: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  return personaId === 'aysekaya' && Boolean(env.FISH_API_KEY?.trim())
}

/**
 * Fish ASR — docs.fish.audio/features/speech-to-text + api-reference/endpoint/openapi-v1/speech-to-text
 * (2026-09-28'de bakıldı): POST https://api.fish.audio/v1/asr, `Authorization: Bearer`, multipart/form-data
 * `audio` (dosya baytı; wav/mp3/opus…), `language` (isteğe bağlı İPUCU — belgeye göre otomatik algılama yine koşar ve
 * baskındır), `ignore_timestamps` (varsayılan true); model `model` BAŞLIĞIYLA: `transcribe-1` (varsayılan) ya da
 * `transcribe-1-pro`. Yanıt: `{ text, duration, segments[{text,start,end}], language_code, language }`. İstek başına
 * 20 MB / 60 dk (fish.audio/stt). Türkçe: "80+ dil" deniyor, ayrıca listelenmiyor; en çok sınanan diller İngilizce,
 * Mandarin, Kantonca, Japonca, Korece — Türkçe tıbbi konuşma kalitesi DOĞRULANMADI (insan testi gerekli).
 */
export const FISH_ASR_URL = 'https://api.fish.audio/v1/asr'
export const FISH_ASR_MODEL = 'transcribe-1'
export const FISH_ASR_DIL = 'tr'

export function fishAsrFormu(wav: ArrayBuffer | Uint8Array<ArrayBuffer>): FormData {
  const form = new FormData()
  form.append('audio', new Blob([wav], { type: 'audio/wav' }), 'soz.wav')
  form.append('language', FISH_ASR_DIL)
  form.append('ignore_timestamps', 'true')
  return form
}

export type FishAsrSonucu = { metin: string; sureSn: number; dil: string | null }

/** Fish /v1/asr JSON yanıtı → metin + faturalanan süre. Beklenmeyen biçim null (tur açılmaz). */
export function fishAsrCevabi(j: unknown): FishAsrSonucu | null {
  if (!j || typeof j !== 'object') return null
  const r = j as { text?: unknown; duration?: unknown; language_code?: unknown }
  if (typeof r.text !== 'string') return null
  const sure = Number(r.duration)
  return {
    metin: r.text.replace(/\s+/g, ' ').trim(),
    sureSn: Number.isFinite(sure) && sure > 0 ? sure : 0,
    dil: typeof r.language_code === 'string' ? r.language_code : null,
  }
}

/** Fish UTF-8 bayt başına ücretlendirir (docs.fish.audio pricing) — kullanım bu sayıyla yazılır. */
export function fishFaturaBayti(metin: string): number {
  return new TextEncoder().encode(String(metin || '')).length
}
