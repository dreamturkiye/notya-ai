/**
 * AU-CANLI-01 — the agent's delivery and VOICE are re-read and, if they have drifted, written back before every call
 * (Türkiye's lib/asistan/sesMotoru.ts, NOTYA-SES-KILIT-01, for a country). Two things are held:
 *
 *   1. the delivery — Flash v2.5, fixed speed 1, no expressive mode (a dashboard change cannot stick), and
 *   2. the VOICE — the agent's voice must be the pack's voice for that agent's gender. This is how "exactly two
 *      voices, never a third" is kept true in the provider's account and not only in this repository.
 *
 * A failed read or write never blocks the call (the call then starts as the agent is) but is logged by kind, never with
 * a body: the provider's error text may quote the prompt.
 */
import { SES_MODEL_ID, SES_SES_AYARLARI } from '../uygulama/sesSentez'

export type MotorGorunen = {
  model_id?: string
  voice_id?: string
  expressive_mode?: boolean
  speed?: number | null
  stability?: number | null
  similarity_boost?: number | null
  suggested_audio_tags?: unknown[] | null
  agent_output_audio_format?: string
}

const yakin = (a: unknown, b: number): boolean => typeof a === 'number' && Math.abs(a - b) < 0.001

/** true = the agent is not the known-good delivery with the pack's voice. */
export function motorKilidiGerekli(tts: MotorGorunen | null | undefined, sesId: string): boolean {
  if (!tts) return true
  if (tts.model_id !== SES_MODEL_ID) return true
  if (tts.voice_id !== sesId) return true
  if (tts.expressive_mode === true) return true
  if (!yakin(tts.speed ?? 1, SES_SES_AYARLARI.speed)) return true
  if (!yakin(tts.stability, SES_SES_AYARLARI.stability)) return true
  if (!yakin(tts.similarity_boost, SES_SES_AYARLARI.similarity_boost)) return true
  if (Array.isArray(tts.suggested_audio_tags) && tts.suggested_audio_tags.length > 0) return true
  return false
}

/** The fields this code owns, and no others (spreading the whole object has been refused by the provider). */
export function motorKilidiGovdesi(sesId: string, gorunen?: MotorGorunen | null) {
  return {
    conversation_config: {
      tts: {
        model_id: SES_MODEL_ID,
        voice_id: sesId,
        expressive_mode: false,
        speed: SES_SES_AYARLARI.speed,
        stability: SES_SES_AYARLARI.stability,
        similarity_boost: SES_SES_AYARLARI.similarity_boost,
        suggested_audio_tags: [] as [],
        ...(gorunen?.agent_output_audio_format ? { agent_output_audio_format: gorunen.agent_output_audio_format } : {}),
      },
    },
  }
}

/** The smallest write that holds the pack's voice and the fixed model (fallback when the full delivery write is refused). */
export const motorKilidiSesGovdesi = (sesId: string) => ({ conversation_config: { tts: { model_id: SES_MODEL_ID, voice_id: sesId } } })

const ADRES = 'https://api.elevenlabs.io/v1/convai/agents'
const ZAMAN_MS = 4_000
const ONBELLEK_MS = 60_000
const onbellek = new Map<string, number>()

export function motorOnbelleginiSil(): void {
  onbellek.clear()
}

/**
 * The per-call values the screen sends (the greeting, the language, the voice) are accepted by the provider ONLY if the agent
 * allows them to be overridden. A new agent does not: the call then closed at once and the microphone button looked dead.
 * These are the three switches the call needs.
 */
export type GecersizKilmaGorunen = {
  overrides?: {
    conversation_config_override?: { agent?: { first_message?: boolean; language?: boolean }; tts?: { voice_id?: boolean } }
    custom_llm_extra_body?: boolean
  }
}

/**
 * true = the agent refuses at least one of the per-call values. `custom_llm_extra_body` (a sibling of the config overrides in the
 * provider's schema, default false) is the call token the screen sends: with it off, a call with a token can be refused at once.
 */
export function gecersizKilmaGerekli(platform: GecersizKilmaGorunen | null | undefined): boolean {
  const o = platform?.overrides?.conversation_config_override
  return !(o?.agent?.first_message === true && o?.agent?.language === true && o?.tts?.voice_id === true && platform?.overrides?.custom_llm_extra_body === true)
}

export const gecersizKilmaGovdesi = () => ({
  platform_settings: {
    overrides: {
      conversation_config_override: { agent: { first_message: true, language: true }, tts: { voice_id: true } },
      custom_llm_extra_body: true,
    },
  },
})

/**
 * What the provider refused, by KIND only: the field paths and error types of a 4xx answer (never the input values or the message,
 * which may quote the prompt). Lets the log say WHICH field a 400 was about.
 */
export async function reddedilenAlanlar(r: Response): Promise<string> {
  try {
    const v = (await r.clone().json()) as { detail?: unknown }
    const d = v?.detail
    if (Array.isArray(d)) {
      return d.slice(0, 6).map((e) => {
        const x = e as { loc?: unknown; type?: unknown }
        const yol = Array.isArray(x.loc) ? x.loc.filter((k) => typeof k === 'string' || typeof k === 'number').join('.') : ''
        return `${yol || '?'}${typeof x.type === 'string' ? `(${x.type})` : ''}`
      }).join(', ').slice(0, 300)
    }
    const st = (d as { status?: unknown } | undefined)?.status
    return typeof st === 'string' ? st.slice(0, 60) : ''
  } catch { return '' }
}

export type MotorSonuc = { durum: 'tamam' | 'onbellek' | 'okunamadi' | 'yazilamadi' | 'yok'; degisti: boolean }

export async function motoruSabitle(ajan: string, sesId: string, anahtar: string, fetchFn: typeof fetch = fetch): Promise<MotorSonuc> {
  if (!ajan || !sesId || !anahtar) return { durum: 'yok', degisti: false }
  const simdi = Date.now()
  const son = onbellek.get(`${ajan}:${sesId}`)
  if (son && simdi - son < ONBELLEK_MS) return { durum: 'onbellek', degisti: false }
  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_MS)
  const baslik = { 'xi-api-key': anahtar, 'content-type': 'application/json' }
  try {
    const getir = await fetchFn(`${ADRES}/${ajan}`, { headers: baslik, cache: 'no-store', signal: kontrol.signal })
    if (!getir.ok) { console.error(`[ulke/asistan] agent read answered ${getir.status}`); return { durum: 'okunamadi', degisti: false } }
    const veri = (await getir.json()) as { conversation_config?: { tts?: MotorGorunen }; platform_settings?: GecersizKilmaGorunen }
    const tts = veri?.conversation_config?.tts
    let degisti = false
    // Allowing the three per-call values is a separate, best-effort write: a refusal of it never blocks the voice lock or the call.
    if (gecersizKilmaGerekli(veri?.platform_settings)) {
      console.error('[ulke/asistan] agent does not allow the per-call greeting, language and voice; allowing them')
      const izin = await fetchFn(`${ADRES}/${ajan}`, { method: 'PATCH', headers: baslik, body: JSON.stringify(gecersizKilmaGovdesi()), signal: kontrol.signal })
      if (izin.ok) degisti = true
      else console.error(`[ulke/asistan] agent override write answered ${izin.status} ${await reddedilenAlanlar(izin)}`.trim())
    }
    if (!motorKilidiGerekli(tts, sesId)) { onbellek.set(`${ajan}:${sesId}`, simdi); return { durum: 'tamam', degisti } }
    console.error('[ulke/asistan] agent drifted from the pack voice or delivery; writing it back')
    let yama = await fetchFn(`${ADRES}/${ajan}`, { method: 'PATCH', headers: baslik, body: JSON.stringify(motorKilidiGovdesi(sesId, tts)), signal: kontrol.signal })
    if (!yama.ok) {
      console.error(`[ulke/asistan] agent write answered ${yama.status} ${await reddedilenAlanlar(yama)}`.trim())
      // The provider refused the full delivery write (it has refused fields of this object before). The VOICE is the part the
      // pack must hold: write that alone, so one refused delivery field never leaves the voice unlocked.
      if (yama.status === 400 || yama.status === 422) {
        yama = await fetchFn(`${ADRES}/${ajan}`, { method: 'PATCH', headers: baslik, body: JSON.stringify(motorKilidiSesGovdesi(sesId)), signal: kontrol.signal })
        if (!yama.ok) console.error(`[ulke/asistan] agent voice-only write answered ${yama.status} ${await reddedilenAlanlar(yama)}`.trim())
      }
      if (!yama.ok) return { durum: 'yazilamadi', degisti }
    }
    onbellek.set(`${ajan}:${sesId}`, simdi)
    return { durum: 'tamam', degisti: true }
  } catch (e) {
    console.error(`[ulke/asistan] agent lock: ${e instanceof Error ? e.name : typeof e}`)
    return { durum: 'okunamadi', degisti: false }
  } finally {
    clearTimeout(zaman)
  }
}

/** The one-time WebSocket address of a call. null = the provider did not give one. */
export async function imzaliAdresAl(ajan: string, anahtar: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
  try {
    const r = await fetchFn(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(ajan)}`, {
      headers: { 'xi-api-key': anahtar }, cache: 'no-store', signal: AbortSignal.timeout(8_000),
    })
    if (!r.ok) { console.error(`[ulke/asistan] signed url answered ${r.status}`); return null }
    const v = (await r.json()) as { signed_url?: unknown }
    return typeof v.signed_url === 'string' && v.signed_url.startsWith('wss://') ? v.signed_url : null
  } catch (e) {
    console.error(`[ulke/asistan] signed url: ${e instanceof Error ? e.name : typeof e}`)
    return null
  }
}
