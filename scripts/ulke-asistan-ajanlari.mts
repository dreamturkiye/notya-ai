/**
 * AU-CANLI-01 — create or update a COUNTRY's two live-assistant agents in the ElevenLabs account, from Türkiye's
 * agents as the template. Run by the owner, or by Claude when the key is at hand. Nothing here runs in a build.
 *
 *   npx tsx scripts/ulke-asistan-ajanlari.mts --ulke au --site https://<host>/au              plan only (default)
 *   npx tsx scripts/ulke-asistan-ajanlari.mts --ulke au --site https://<host>/au --uygula     create / update
 *
 *   ELEVENLABS_API_KEY        the owner's key (.env.local or the environment). Never printed, never written to a file.
 *   NOTYA_SES_LLM_SECRET      ≥ 32 characters; the SAME value must be set in the country's deployment. Only needed
 *                             when the workspace secret "notya_ses_llm_secret" does not exist yet (Türkiye's script
 *                             creates it; the same secret serves every country).
 *   --site                    the public address of the country's deployment INCLUDING its path prefix (AU: .../au)
 *   --erkek-sablon / --kadin-sablon   template agent ids (default: Türkiye's male / female base agents)
 *
 * For each of the pack's TWO voices (ses.ts: erkek, kadin) one agent is made — "Notya <CC> · <Voice>" — by duplicating the
 * Turkish base agent once (an existing agent of that name is updated instead). Each copy is then set to:
 *   - LLM = custom-llm → <site>/api/ulke/asistan-canli/ses-llm/v1 (the provider adds /chat/completions), API key = the
 *     workspace secret; the browser's signed call token goes through as the extra body,
 *   - language en, an English opening, the Turkish pronunciation dictionary removed,
 *   - TTS = Flash v2.5, the pack's voice id, speed 1, stability 0.55, similarity 0.75, expressive mode off
 *     (the same lock lib/ulke/asistan/motorKilidi.ts re-asserts on every call),
 *   - one client tool, show_on_screen(text), expects no response: the full written answer for the screen,
 *   - the built-in end_call system tool on.
 * It prints the two environment variables to set in the country's deployment:
 *   ELEVENLABS_AGENT_<CC>_MALE   ELEVENLABS_AGENT_<CC>_FEMALE
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { AYSE_TABAN_AGENT, MEHMET_TABAN_AGENT } from '../lib/asistan/agentSec'

const API = 'https://api.elevenlabs.io/v1/convai'
const argv = process.argv.slice(2)
const al = (ad: string): string | null => (argv.includes(ad) ? (argv[argv.indexOf(ad) + 1] ?? null) : null)
const UYGULA = argv.includes('--uygula')
const SIR_ADI = 'notya_ses_llm_secret'
const ARAC_ADI = 'show_on_screen'

for (const f of ['.env.local', '.env']) {
  const p = resolve(process.cwd(), f)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const dur = (m: string): never => { console.error(m); process.exit(1) }
const kod = (al('--ulke') ?? '').toLowerCase()
if (!/^[a-z]{2}$/.test(kod) || kod === 'tr') dur('--ulke <code> is required (a country pack, not tr)')
const site = (al('--site') ?? '').replace(/\/$/, '')
if (!/^https:\/\/[^/\s]+(\/[a-z0-9-]+)?$/.test(site)) dur('--site https://<host>[/<prefix>] is required (the deployment address, with its path prefix)')
const KEY = process.env.ELEVENLABS_API_KEY
if (!KEY) dur('ELEVENLABS_API_KEY is required (.env.local or the environment)')
const SIR = String(process.env.NOTYA_SES_LLM_SECRET || '').trim()

type Ses = { ad: string; id: string }
type Paket = { yerel: string; dilKodu: string; sesler: { erkek: Ses; kadin: Ses } }
const modul = await import(`../countries/${kod}/ses`)
const ses = Object.values(modul).find((v) => v && typeof v === 'object' && 'sesler' in (v as object)) as Paket | undefined
if (!ses) dur(`countries/${kod}/ses.ts has no voices: this country has no live assistant to provision`)
const SES = ses as Paket

async function el<T>(method: string, yol: string, govde?: unknown): Promise<T> {
  const r = await fetch(`${API}${yol}`, { method, headers: { 'xi-api-key': KEY!, 'content-type': 'application/json' }, body: govde === undefined ? undefined : JSON.stringify(govde) })
  const t = await r.text()
  if (!r.ok) throw new Error(`${method} ${yol} → ${r.status}: ${t.slice(0, 400)}`)
  return (t ? JSON.parse(t) : {}) as T
}

async function sirKimligi(): Promise<string> {
  const liste = await el<{ secrets?: { secret_id: string; name: string }[] }>('GET', '/secrets')
  const var_ = (liste.secrets || []).find((s) => s.name === SIR_ADI)
  if (var_) return var_.secret_id
  if (SIR.length < 32) dur(`The workspace secret "${SIR_ADI}" does not exist and NOTYA_SES_LLM_SECRET (≥ 32 characters) is not set`)
  if (!UYGULA) return 'dry_secret'
  return (await el<{ secret_id: string }>('POST', '/secrets', { type: 'new', name: SIR_ADI, value: SIR })).secret_id
}

async function aracKimligi(): Promise<string> {
  const liste = await el<{ tools?: { id: string; tool_config?: { name?: string } }[] }>('GET', `/tools?search=${ARAC_ADI}&page_size=30`).catch(() => ({ tools: [] }))
  const var_ = (liste.tools || []).find((a) => a.tool_config?.name === ARAC_ADI)
  if (var_) return var_.id
  if (!UYGULA) return 'dry_tool'
  const yeni = await el<{ id: string }>('POST', '/tools', {
    tool_config: {
      type: 'client',
      name: ARAC_ADI,
      description: 'Show the full written answer on the clinician\'s screen. Called by the server after the spoken part of an answer.',
      expects_response: false,
      response_timeout_secs: 5,
      parameters: { type: 'object', required: ['text'], properties: { text: { type: 'string', description: 'The full written answer.' } } },
    },
  })
  return yeni.id
}

type Ajan = { agent_id?: string; name?: string; platform_settings?: { overrides?: Record<string, unknown> }; conversation_config?: { agent?: { prompt?: Record<string, unknown> }; tts?: Record<string, unknown> } }

async function ajanHazirla(cinsiyet: 'erkek' | 'kadin', sablon: string, sirId: string, aracId: string): Promise<string> {
  const v = SES.sesler[cinsiyet]
  const ad = `Notya ${kod.toUpperCase()} · ${v.ad}`
  const mevcut = await el<{ agents?: { agent_id: string; name: string }[] }>('GET', `/agents?search=${encodeURIComponent(ad)}&page_size=30`).catch(() => ({ agents: [] }))
  let ajan = (mevcut.agents || []).find((a) => a.name === ad)?.agent_id
  const t = await el<Ajan>('GET', `/agents/${sablon}`)
  if (!ajan) {
    if (!UYGULA) { console.log(`  [plan] duplicate ${t.name ?? sablon} → "${ad}"`); ajan = `dry_${cinsiyet}` }
    else { ajan = (await el<{ agent_id: string }>('POST', `/agents/${sablon}/duplicate`, { name: ad })).agent_id; console.log(`  created "${ad}"`) }
  } else console.log(`  exists  "${ad}" → updating`)
  const url = `${site}/api/ulke/asistan-canli/ses-llm/v1`
  const govde = {
    name: ad,
    conversation_config: {
      agent: {
        language: 'en',
        first_message: 'Hello. How can I help?',
        prompt: {
          // The real prompt is built per call on our server; this one only exists so the agent is valid.
          prompt: 'You are the Notya assistant. Your instructions are supplied by the server for every turn.',
          llm: 'custom-llm',
          custom_llm: { url, model_id: 'notya-canli', api_key: { secret_id: sirId }, request_headers: { 'x-notya-ses-sirri': { secret_id: sirId } } },
          tool_ids: [aracId],
          tools: [],
          built_in_tools: { end_call: { type: 'system', name: 'end_call', description: 'End the call when the clinician says goodbye or asks to stop.', params: { system_tool_type: 'end_call' } } },
        },
      },
      tts: { model_id: 'eleven_flash_v2_5', voice_id: v.id, stability: 0.55, similarity_boost: 0.75, speed: 1, expressive_mode: false, suggested_audio_tags: [], pronunciation_dictionary_locators: [] },
    },
    platform_settings: { overrides: { ...(t.platform_settings?.overrides || {}), custom_llm_extra_body: true } },
  }
  if (!UYGULA) { console.log(`  [plan] ${ad}: custom-llm ${url}, voice ${v.ad} (${v.id}), language en, tool ${ARAC_ADI}, end_call`); return ajan }
  try { await el('PATCH', `/agents/${ajan}`, govde) } catch (e) {
    // The built-in tool block is the part of the schema most likely to differ by account/version: retry without it, then say so.
    console.log(`    full patch refused (${String(e).slice(0, 200)}); retrying without end_call`)
    delete (govde.conversation_config.agent.prompt as Record<string, unknown>).built_in_tools
    await el('PATCH', `/agents/${ajan}`, govde)
    console.log('    WARNING: end_call could not be set; enable the "End conversation" system tool on this agent in the dashboard')
  }
  const son = await el<Ajan>('GET', `/agents/${ajan}`)
  const p = (son.conversation_config?.agent?.prompt || {}) as Record<string, unknown>
  const tts = son.conversation_config?.tts || {}
  console.log(`    llm=${p.llm} tool_ids=${JSON.stringify(p.tool_ids)} voice=${String(tts.voice_id)} model=${String(tts.model_id)} extra_body=${JSON.stringify(son.platform_settings?.overrides?.custom_llm_extra_body)}`)
  if (tts.voice_id !== v.id) console.log(`    WARNING: the agent's voice is not ${v.ad}; the server writes it back on the first call`)
  return ajan
}

console.log(UYGULA ? `=== ${kod.toUpperCase()} live-assistant agents: APPLY ===` : `=== ${kod.toUpperCase()} live-assistant agents: PLAN (nothing is changed; add --uygula) ===`)
const sirId = await sirKimligi()
const aracId = await aracKimligi()
const erkek = await ajanHazirla('erkek', al('--erkek-sablon') ?? MEHMET_TABAN_AGENT, sirId, aracId)
const kadin = await ajanHazirla('kadin', al('--kadin-sablon') ?? AYSE_TABAN_AGENT, sirId, aracId)
console.log('\nSet these in the country deployment (Vercel project), then redeploy:')
console.log(`  ELEVENLABS_AGENT_${kod.toUpperCase()}_MALE=${erkek}`)
console.log(`  ELEVENLABS_AGENT_${kod.toUpperCase()}_FEMALE=${kadin}`)
console.log('  ELEVENLABS_API_KEY, NOTYA_SES_JETON_SECRET (≥ 32), NOTYA_SES_LLM_SECRET (≥ 32, equal to the workspace secret), OPENROUTER_API_KEY')
