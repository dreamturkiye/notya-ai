/**
 * Text to speech for a country pack. The LISTENER is konusmaTanima.ts (a visit recording). This is the SPEAKER:
 * wherever a country build speaks, it speaks through `sesSentezle`, with that pack's own voices
 * (countries/<cc>/ses.ts → the clinical half's `ses`). A pack with no `ses` does not speak.
 *
 * The delivery is fixed the same way the assistant's spoken answers are fixed: speed exactly 1, no style, and
 * (for every country but one) Flash v2.5. The one exception is Uzbekistan (NOTYA-UZ-ASISTAN-SES-01, 2026-10-19,
 * Kaan): Flash v2.5 has no Uzbek support at all, so that pack alone is allowed `eleven_v4`, which does list
 * Uzbek — a cross-lingual attempt he accepted ships now, with real-speaker quality confirmation still pending.
 * Every request carries the PACK'S OWN model (`ses.model`), never a fixed constant, so this stays a one-country
 * exception and not a silent default change for everyone else (`SES_GECERLI_MODELLER` below is the full list).
 * The language code is the pack's ISO 639-1 code (`en` for an English pack). The accent is the voice.
 * Nothing here names a Turkish voice or reads a Turkish file.
 *
 * The provider's error body is never read: it may quote the text. No key, or a pack with no voices, never
 * guesses and never calls another provider.
 */
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import type { UlkeSesCikisi } from '../tipler'

/** Models a pack may name in `UlkeSesCikisi.model`. Must keep matching that type's own union (lib/ulke/tipler.ts). */
export const SES_GECERLI_MODELLER = ['eleven_flash_v2_5', 'eleven_v4'] as const
export type SesModeli = (typeof SES_GECERLI_MODELLER)[number]
/** @deprecated kept only so nothing importing the old single-model name breaks; every country's default. */
export const SES_MODEL_ID = 'eleven_flash_v2_5' as const
/** Spoken answers stay at one speed. A higher style is the "acting" a clinical voice does not do. */
export const SES_SES_AYARLARI = {
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0,
  speed: 1,
  use_speaker_boost: true,
} as const
const ADRES = 'https://api.elevenlabs.io/v1/text-to-speech'
const ZAMAN_MS = 30_000
/** A cautious ceiling of our own. One spoken answer, not a document. */
export const SES_AZAMI_KARAKTER = 3_000

export type SesCinsiyeti = 'erkek' | 'kadin'

export type SesIstegi =
  | { tamam: false; kod: 'BOS' | 'UZUN' | 'MODEL' | 'DIL' | 'SES' }
  | { tamam: true; adres: string; govde: { text: string; model_id: SesModeli; language_code: string; apply_text_normalization: 'on'; voice_settings: typeof SES_SES_AYARLARI } }

/** The request a spoken answer would send. Pure: tests feed it a pack's voices. */
export function sesIstegi(ses: UlkeSesCikisi | null | undefined, metin: string, cinsiyet: SesCinsiyeti): SesIstegi {
  if (!ses?.sesler) return { tamam: false, kod: 'SES' }
  if (!(SES_GECERLI_MODELLER as readonly string[]).includes(ses.model)) return { tamam: false, kod: 'MODEL' }
  if (!/^[a-z]{2}$/.test(ses.dilKodu)) return { tamam: false, kod: 'DIL' }
  const sesId = ses.sesler[cinsiyet]?.id
  if (!/^[A-Za-z0-9]{20}$/.test(sesId ?? '')) return { tamam: false, kod: 'SES' }
  const text = metin.trim()
  if (!text) return { tamam: false, kod: 'BOS' }
  if (text.length > SES_AZAMI_KARAKTER) return { tamam: false, kod: 'UZUN' }
  return {
    tamam: true,
    adres: `${ADRES}/${sesId}`,
    govde: {
      text,
      // The pack's OWN model (never a fixed constant) — see this file's header for why Uzbekistan differs.
      model_id: ses.model,
      language_code: ses.dilKodu,
      apply_text_normalization: 'on',
      voice_settings: SES_SES_AYARLARI,
    },
  }
}

export type SesSonuc =
  | { durum: 'yok' }
  | { durum: 'hazir-degil' }
  | { durum: 'red'; kod: 'BOS' | 'UZUN' | 'MODEL' | 'DIL' | 'SES' }
  | { durum: 'okunamadi' }
  | { durum: 'tamam'; ses: ArrayBuffer; cinsiyet: SesCinsiyeti }

export type SesBaglanti = {
  /** The pack's voices. Omit to read the active pack. null = this country does not speak. */
  ses?: UlkeSesCikisi | null
  anahtar?: string | null
  fetchFn?: typeof fetch
}

/** Speak `metin` in the pack's male or female voice. A country with no `ses` returns `yok` and calls no one. */
export async function sesSentezle(metin: string, cinsiyet: SesCinsiyeti, baglanti: SesBaglanti = {}): Promise<SesSonuc> {
  const ses = baglanti.ses === undefined ? AKTIF_KLINIK?.ses : baglanti.ses
  if (!ses) return { durum: 'yok' }
  const istek = sesIstegi(ses, metin, cinsiyet)
  if (!istek.tamam) return { durum: 'red', kod: istek.kod }
  const anahtar = (baglanti.anahtar === undefined ? process.env.ELEVENLABS_API_KEY : baglanti.anahtar)?.trim()
  if (!anahtar) return { durum: 'hazir-degil' }
  const fetchFn = baglanti.fetchFn ?? fetch
  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_MS)
  try {
    const r = await fetchFn(istek.adres, {
      method: 'POST',
      headers: { 'xi-api-key': anahtar, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(istek.govde),
      signal: kontrol.signal,
    })
    if (!r.ok) {
      console.error(`[ulke/ses] provider answered ${r.status}`)
      return { durum: 'okunamadi' }
    }
    return { durum: 'tamam', ses: await r.arrayBuffer(), cinsiyet }
  } catch (e) {
    console.error(`[ulke/ses] provider unreachable: ${e instanceof Error ? e.name : typeof e}`)
    return { durum: 'okunamadi' }
  } finally {
    clearTimeout(zaman)
  }
}
