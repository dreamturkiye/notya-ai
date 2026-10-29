/**
 * NOTYA-SES-KILIT-01 (Kaan / Dr. Gökhan, 2026-09-27).
 *
 * The slur and the "slows right down, then rushes to catch up" came back because the
 * ConvAI agent — not the REST helper in lib/dr-ayse/tts.ts — is what the doctor hears.
 * Eleven v3 Conversational (expressive mode, on by default for that model) changes
 * speed and stability on its own: [slow], rushes, collapsed Turkish endings. Flash v2.5
 * at a fixed speed is the setting that already stopped this once. optimize_streaming_latency
 * is now a no-op on ElevenLabs' side, so it can no longer be the fix.
 *
 * Every signed-url mint re-reads the agent and, if it has drifted, patches it back
 * before the call starts. A dashboard change cannot stick.
 */
import { AYSE_TTS_SETTINGS } from '@/lib/dr-ayse/tts'

export const SES_MODEL_ID = 'eleven_flash_v2_5' as const

/** Fixed delivery. Speed is exactly 1 — v3's "acting" is not allowed on a clinical voice. */
export const SES_TTS_KILIT = {
  model_id: SES_MODEL_ID,
  expressive_mode: false,
  speed: 1,
  stability: AYSE_TTS_SETTINGS.stability,
  similarity_boost: AYSE_TTS_SETTINGS.similarity_boost,
  optimize_streaming_latency: AYSE_TTS_SETTINGS.optimize_streaming_latency,
  suggested_audio_tags: [] as [],
}

export type SesTtsGorunen = {
  model_id?: string
  voice_id?: string
  agent_output_audio_format?: string
  expressive_mode?: boolean
  speed?: number | null
  stability?: number | null
  similarity_boost?: number | null
  suggested_audio_tags?: unknown[] | null
}

const ONBELLEK_MS = 60_000
const ZAMAN_MS = 2_500
const onbellek = new Map<string, number>()

function yakin(a: unknown, b: number): boolean {
  return typeof a === 'number' && Math.abs(a - b) < 0.001
}

/** True when the live agent is not the known-good Flash delivery. */
export function ttsKilitGerekli(tts: SesTtsGorunen | null | undefined): boolean {
  if (!tts) return true
  if (tts.model_id !== SES_MODEL_ID) return true
  if (tts.expressive_mode === true) return true
  if (!yakin(tts.speed ?? 1, SES_TTS_KILIT.speed)) return true
  if (!yakin(tts.stability, SES_TTS_KILIT.stability)) return true
  if (!yakin(tts.similarity_boost, SES_TTS_KILIT.similarity_boost)) return true
  if (Array.isArray(tts.suggested_audio_tags) && tts.suggested_audio_tags.length > 0) return true
  return false
}

/** Test-only: the in-memory "already locked" window. */
export function sesMotoruOnbelleginiSil(): void {
  onbellek.clear()
}

export type SesGrupDurumu = 'tamam' | 'uygulandi' | 'reddedildi' | 'tutmadi'
export type SesMotorSonuc = { once: string; degisti: boolean; gruplar?: Record<string, SesGrupDurumu>; yedekLlm?: string }

/**
 * SES-OMURGA-V2 (G, Kaan 2026-10-29) — the conversation settings of the TEK BEYİN (Custom LLM) agent, pinned in code like
 * the TTS lock above. Field names from the ElevenLabs agent API (conversation_config.turn / .asr / .agent.prompt,
 * platform_settings.overrides); every PATCH result is re-read and logged per group, so a field the API ignores or
 * refuses is visible (`tutmadi` / `reddedildi`) instead of silently assumed.
 *
 *   turn   turn_v3, eagerness normal, turn_timeout 15 s (a doctor thinking is not a turn — the old 7 s default sent a
 *          "..." pause turn every few seconds), soft timeout 3 s with a Turkish filler that promises nothing
 *          ("Hmm, Hocam..." — no "bir saniye": ElevenLabs advises against time promises). This IS the holding phrase of
 *          the v2 contract (ses-omurga-kilidi.mdc #3); the server-side NOTYA_SES_DOLGU_MS filler stays off.
 *   asr    scribe_realtime (language comes from agent.language = tr), base keywords; per-session keywords via override.
 *   agent  language; cascade_timeout_seconds 10 (our endpoint sends its first chunk at once and a holding sentence by
 *          ~7 s, so a working stream is never retried); the skip_turn system tool (noise / echo / pause turns).
 *   overrides  asr.keywords may be overridden per conversation (the open patient's name, drugs, diagnoses).
 * A hosted BACKUP LLM is never enabled — it would answer clinically without our brain; its current state is only logged.
 */
export type SesKonusmaSecenegi = {
  dil: string
  anahtarKelimeler?: string[]
  ozelLlm?: boolean
  /** false: the caller holds the TTS itself (country builds pin their own voice and delivery — lib/ulke/asistan/motorKilidi.ts). */
  tts?: boolean
  /** The soft-timeout filler in the agent's language (default: Turkish). Never a time promise. */
  dolgu?: { mesaj: string; ek: string[] }
}

export const SES_TUR_AYARI = {
  turn_model: 'turn_v3',
  turn_eagerness: 'normal',
  turn_timeout: 15,
  soft_timeout_config: {
    timeout_seconds: 3,
    message: 'Hmm, Hocam...',
    use_llm_generated_message: false,
    additional_soft_timeout_messages: ['Şöyle Hocam...'],
    max_soft_timeouts_per_generation: 2,
  },
} as const
export const SES_KADEMELI_ZAMAN_ASIMI_SN = 10
export const SES_TEMEL_ANAHTARLAR_TR = ['Ayşe', 'Ayşe Hocam', 'Hocam', 'Notya']

type AjanGorunen = {
  conversation_config?: {
    tts?: SesTtsGorunen
    turn?: { turn_model?: string; turn_eagerness?: string; turn_timeout?: number; soft_timeout_config?: { timeout_seconds?: number; message?: string } }
    asr?: { provider?: string; quality?: string; keywords?: string[] }
    agent?: { language?: string; prompt?: { cascade_timeout_seconds?: number; built_in_tools?: Record<string, unknown> | null; backup_llm_config?: unknown } }
  }
  platform_settings?: { overrides?: Record<string, unknown> & { conversation_config_override?: Record<string, unknown> } }
}

const SKIP_TURN_ARACI = { name: 'skip_turn', description: 'Stay silent and keep listening when the turn needs no answer (noise, a pause, the agent\'s own echo).', response_timeout_secs: 20, type: 'system', params: { system_tool_type: 'skip_turn' } }

/** Which conversation groups of the live agent differ from the pinned settings. */
/** The turn settings for one language (the soft-timeout filler is the only language-specific part). */
export function turAyari(g: Pick<SesKonusmaSecenegi, 'dolgu'>) {
  return g.dolgu
    ? { ...SES_TUR_AYARI, soft_timeout_config: { ...SES_TUR_AYARI.soft_timeout_config, message: g.dolgu.mesaj, additional_soft_timeout_messages: g.dolgu.ek } }
    : SES_TUR_AYARI
}

export function konusmaSapmalari(ajan: AjanGorunen | null | undefined, g: SesKonusmaSecenegi): string[] {
  const c = ajan?.conversation_config || {}
  const out: string[] = []
  const t = c.turn || {}
  const ist = turAyari(g)
  if (t.turn_model !== ist.turn_model || t.turn_eagerness !== ist.turn_eagerness || !yakin(t.turn_timeout, ist.turn_timeout)
    || !yakin(t.soft_timeout_config?.timeout_seconds, ist.soft_timeout_config.timeout_seconds) || t.soft_timeout_config?.message !== ist.soft_timeout_config.message) out.push('turn')
  const kelimeler = g.anahtarKelimeler || []
  if (c.asr?.provider !== 'scribe_realtime' || kelimeler.some((k) => !(c.asr?.keywords || []).includes(k))) out.push('asr')
  const ozel = g.ozelLlm !== false
  if (c.agent?.language !== g.dil || (ozel && (!yakin(c.agent?.prompt?.cascade_timeout_seconds, SES_KADEMELI_ZAMAN_ASIMI_SN) || !c.agent?.prompt?.built_in_tools?.skip_turn))) out.push('agent')
  const cco = (ajan?.platform_settings?.overrides?.conversation_config_override || {}) as { asr?: { keywords?: unknown } }
  if (cco.asr?.keywords !== true) out.push('overrides')
  return out
}

function konusmaGovdesi(grup: string, ajan: AjanGorunen | null, g: SesKonusmaSecenegi): Record<string, unknown> {
  const c = ajan?.conversation_config || {}
  if (grup === 'turn') return { conversation_config: { turn: turAyari(g) } }
  if (grup === 'asr') return { conversation_config: { asr: { provider: 'scribe_realtime', quality: 'high', keywords: [...new Set([...(c.asr?.keywords || []), ...(g.anahtarKelimeler || [])])].slice(0, 50) } } }
  if (grup === 'agent') {
    const ozel = g.ozelLlm !== false
    return {
      conversation_config: {
        agent: {
          language: g.dil,
          ...(ozel ? { prompt: { cascade_timeout_seconds: SES_KADEMELI_ZAMAN_ASIMI_SN, built_in_tools: { ...(c.agent?.prompt?.built_in_tools || {}), skip_turn: SKIP_TURN_ARACI } } } : {}),
        },
      },
    }
  }
  const ov = ajan?.platform_settings?.overrides || {}
  const cco = (ov.conversation_config_override || {}) as Record<string, unknown>
  return { platform_settings: { overrides: { ...ov, conversation_config_override: { ...cco, asr: { ...((cco.asr as Record<string, unknown>) || {}), keywords: true } } } } }
}

function derinBirlestir(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = { ...a }
  for (const [k, v] of Object.entries(b)) {
    o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])
      ? derinBirlestir(o[k] as Record<string, unknown>, v as Record<string, unknown>)
      : v
  }
  return o
}

function yedekLlmDurumu(ajan: AjanGorunen | null): string {
  const b = ajan?.conversation_config?.agent?.prompt?.backup_llm_config as { preference?: string } | string | null | undefined
  if (b == null) return 'bilinmiyor'
  return typeof b === 'string' ? b : String(b.preference || 'bilinmiyor')
}

/**
 * Read the agent. If TTS has drifted off Flash / fixed speed, PATCH it back.
 * Failure never blocks the call — the player fix and the speech gate still apply —
 * but the drift is logged so it cannot pass silently.
 */
export async function sesMotorunuSabitle(agentId: string, apiKey: string, fetchFn: typeof fetch = fetch, konusma?: SesKonusmaSecenegi): Promise<SesMotorSonuc> {
  if (konusma) return sesAjaniniSabitle(agentId, apiKey, konusma, fetchFn)
  if (!agentId || !apiKey) return { once: 'yok', degisti: false }
  const simdi = Date.now()
  const son = onbellek.get(agentId)
  if (son && simdi - son < ONBELLEK_MS) return { once: 'onbellek', degisti: false }

  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_MS)
  const baslik = { 'xi-api-key': apiKey, 'content-type': 'application/json' }
  try {
    const getir = await fetchFn(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: baslik, cache: 'no-store', signal: kontrol.signal,
    })
    if (!getir.ok) {
      console.error('[ses-motoru] okunamadı', agentId, getir.status)
      return { once: 'okunamadi', degisti: false }
    }
    const ajan = await getir.json() as { conversation_config?: { tts?: SesTtsGorunen } }
    const tts = ajan?.conversation_config?.tts
    const once = `model=${tts?.model_id || '-'} expressive=${tts?.expressive_mode === true} speed=${tts?.speed ?? '-'} stability=${tts?.stability ?? '-'}`
    if (!ttsKilitGerekli(tts)) {
      onbellek.set(agentId, simdi)
      return { once, degisti: false }
    }
    console.error('[ses-motoru] sapma, Flash kilidine alınıyor', agentId, once)
    // Only the fields we own. Spreading the whole TTS object has been rejected
    // (read-only keys); voice_id is kept on both attempts so a failed first write
    // cannot reset the persona's voice.
    const kilit = {
      ...SES_TTS_KILIT,
      ...(tts?.voice_id ? { voice_id: tts.voice_id } : {}),
      ...(tts?.agent_output_audio_format ? { agent_output_audio_format: tts.agent_output_audio_format } : {}),
    }
    const govde = (formatla: boolean) => JSON.stringify({
      conversation_config: {
        tts: formatla ? kilit : { ...SES_TTS_KILIT, ...(tts?.voice_id ? { voice_id: tts.voice_id } : {}) },
      },
    })
    let yama = await fetchFn(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH', headers: baslik, body: govde(true), signal: kontrol.signal,
    })
    if (!yama.ok) {
      const hata = await yama.text().catch(() => '')
      console.error('[ses-motoru] tam yama reddedildi, dar yama', agentId, yama.status, hata.slice(0, 240))
      yama = await fetchFn(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH', headers: baslik, body: govde(false), signal: kontrol.signal,
      })
    }
    if (!yama.ok) {
      const hata = await yama.text().catch(() => '')
      console.error('[ses-motoru] kilit yazılamadı', agentId, yama.status, hata.slice(0, 240))
      return { once, degisti: false }
    }
    onbellek.set(agentId, simdi)
    return { once, degisti: true }
  } catch (e) {
    console.error('[ses-motoru]', e instanceof Error ? e.name : 'hata')
    return { once: 'hata', degisti: false }
  } finally {
    clearTimeout(zaman)
  }
}

const ajanOnbellek = new Map<string, { zaman: number; sonuc: SesMotorSonuc }>()
/** A group the API refused is not retried on every call start (it is logged once an hour). */
const RED_ONBELLEK_MS = 60 * 60 * 1000

/**
 * SES-OMURGA-V2 (G): TTS lock + the conversation settings, in one GET and (when anything drifted) one PATCH; a refused
 * PATCH is retried group by group so one unknown field cannot block the others. Every result is re-read from the
 * PATCH response. Never blocks the call; 2.5 s budget.
 */
export async function sesAjaniniSabitle(agentId: string, apiKey: string, g: SesKonusmaSecenegi, fetchFn: typeof fetch = fetch): Promise<SesMotorSonuc> {
  if (!agentId || !apiKey) return { once: 'yok', degisti: false }
  const simdi = Date.now()
  const anahtar = `${agentId}:${g.dil}`
  const son = ajanOnbellek.get(anahtar)
  if (son && simdi - son.zaman < (Object.values(son.sonuc.gruplar || {}).some((d) => d === 'reddedildi' || d === 'tutmadi') ? RED_ONBELLEK_MS : ONBELLEK_MS)) return { ...son.sonuc, once: 'onbellek', degisti: false }
  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_MS)
  const baslik = { 'xi-api-key': apiKey, 'content-type': 'application/json' }
  const adres = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`
  try {
    const getir = await fetchFn(adres, { headers: baslik, cache: 'no-store', signal: kontrol.signal })
    if (!getir.ok) {
      console.error('[ses-motoru] okunamadı', agentId, getir.status)
      return { once: 'okunamadi', degisti: false }
    }
    const ajan = await getir.json() as AjanGorunen
    const tts = ajan?.conversation_config?.tts
    const once = `model=${tts?.model_id || '-'} turn=${ajan?.conversation_config?.turn?.turn_model || '-'} asr=${ajan?.conversation_config?.asr?.provider || '-'} dil=${ajan?.conversation_config?.agent?.language || '-'}`
    const gruplar: Record<string, SesGrupDurumu> = {}
    const ttsDahil = g.tts !== false
    const sapan = [...(ttsDahil && ttsKilitGerekli(tts) ? ['tts'] : []), ...konusmaSapmalari(ajan, g)]
    for (const k of [...(ttsDahil ? ['tts'] : []), 'turn', 'asr', 'agent', 'overrides']) gruplar[k] = sapan.includes(k) ? 'reddedildi' : 'tamam'
    const ttsGovde = () => ({ conversation_config: { tts: { ...SES_TTS_KILIT, ...(tts?.voice_id ? { voice_id: tts.voice_id } : {}), ...(tts?.agent_output_audio_format ? { agent_output_audio_format: tts.agent_output_audio_format } : {}) } } })
    const grupGovdesi = (k: string) => (k === 'tts' ? ttsGovde() : konusmaGovdesi(k, ajan, g))
    let degisti = false
    const uygula = async (govde: Record<string, unknown>): Promise<AjanGorunen | null> => {
      const r = await fetchFn(adres, { method: 'PATCH', headers: baslik, body: JSON.stringify(govde), signal: kontrol.signal })
      if (!r.ok) { console.error('[ses-motoru] yama reddedildi', agentId, r.status, (await r.text().catch(() => '')).slice(0, 200)); return null }
      degisti = true
      return (await r.json().catch(() => null)) as AjanGorunen | null
    }
    const sonucuIsle = (yeni: AjanGorunen | null, denenen: string[]) => {
      if (!yeni) return
      const kalan = [...(ttsDahil && ttsKilitGerekli(yeni?.conversation_config?.tts) ? ['tts'] : []), ...konusmaSapmalari(yeni, g)]
      // An empty PATCH response (some API versions answer {}) cannot prove anything: counted as applied.
      const kanit = Boolean(yeni?.conversation_config)
      for (const k of denenen) gruplar[k] = !kanit || !kalan.includes(k) ? 'uygulandi' : 'tutmadi'
    }
    if (sapan.length) {
      const hepsi = sapan.reduce((acc, k) => derinBirlestir(acc, grupGovdesi(k)), {} as Record<string, unknown>)
      const yeni = await uygula(hepsi)
      if (yeni) sonucuIsle(yeni, sapan)
      else {
        for (const k of sapan) {
          const tek = await uygula(grupGovdesi(k)).catch(() => null)
          if (tek) sonucuIsle(tek, [k])
          else gruplar[k] = 'reddedildi'
        }
      }
    }
    const yedekLlm = yedekLlmDurumu(ajan)
    const sonuc: SesMotorSonuc = { once, degisti, gruplar, yedekLlm }
    console.info('[ses-motoru] ayar', JSON.stringify({ ajan: agentId, dil: g.dil, gruplar, yedekLlm }))
    ajanOnbellek.set(anahtar, { zaman: simdi, sonuc })
    if (ttsDahil && gruplar.tts !== 'reddedildi') onbellek.set(agentId, simdi)
    return sonuc
  } catch (e) {
    console.error('[ses-motoru]', e instanceof Error ? e.name : 'hata')
    return { once: 'hata', degisti: false }
  } finally {
    clearTimeout(zaman)
  }
}

/** Test-only. */
export function sesAjanOnbelleginiSil(): void {
  ajanOnbellek.clear()
}

/**
 * SES-OMURGA-V2 (C): the browser connects over WebRTC (echo cancellation + noise suppression in the browser's audio
 * stack) with a conversation token; NOTYA_SES_BAGLANTI=websocket switches back to the signed WebSocket URL.
 */
export function sesBaglantiTuru(deger: string | null | undefined = process.env.NOTYA_SES_BAGLANTI): 'webrtc' | 'websocket' {
  return String(deger || '').trim().toLowerCase() === 'websocket' ? 'websocket' : 'webrtc'
}
