/**
 * AU-CANLI-01 — which ElevenLabs ConvAI agent speaks for an account, and whether the live assistant is available at
 * all in this deployment.
 *
 * Mirrors Türkiye's lib/asistan/agentSec.ts (a base agent per voice; identity and prompt are chosen per call) with one
 * difference that comes from the owner's rule for the English packs: exactly TWO voices per country, by the persona's
 * gender (`erkek` → the pack's male voice, `kadin` → its female voice), never a third. So a country has exactly two
 * agents, one per voice, named by environment variables of the country's own code:
 *
 *   ELEVENLABS_AGENT_<CC>_MALE      ELEVENLABS_AGENT_<CC>_FEMALE        (CC = the pack's code, upper case)
 *
 * FAIL CLOSED. The live assistant is offered only when EVERYTHING it needs exists: the pack's voices and live-assistant
 * settings, the role's persona (name and gender), the provider key, the agent for that gender, and the two secrets that
 * guard the Custom LLM endpoint. Anything missing = `hazir: false` and the screen draws no microphone at all.
 *
 * Pure: the environment is passed in. No secret value is ever returned, only whether it is long enough.
 */
import type { CanliAsistanAyarlari, UlkeSesCikisi } from '../tipler'
import type { AsistanKimligi } from '../arayuz/tipler'

export type AjanCinsiyeti = 'erkek' | 'kadin'
export type Ortam = Record<string, string | undefined>

/** ConvAI agent ids look like agent_ followed by 20+ letters and digits. Anything else is not an agent. */
const AJAN_BICIMI = /^agent_[A-Za-z0-9]{20,}$/
export const SIR_AZAMI_UZUNLUK = 32

export const ajanOrtamAdi = (kod: string, cinsiyet: AjanCinsiyeti): string =>
  `ELEVENLABS_AGENT_${kod.toUpperCase()}_${cinsiyet === 'erkek' ? 'MALE' : 'FEMALE'}`

export function ajanKimligi(kod: string, cinsiyet: AjanCinsiyeti, ortam: Ortam = process.env): string | null {
  const ham = (ortam[ajanOrtamAdi(kod, cinsiyet)] ?? '').trim()
  return AJAN_BICIMI.test(ham) ? ham : null
}

const sirVarMi = (ortam: Ortam, ad: string): boolean => (ortam[ad] ?? '').trim().length >= SIR_AZAMI_UZUNLUK

export type CanliDurum =
  | { hazir: true; cinsiyet: AjanCinsiyeti; ajan: string; sesId: string; sesAdi: string }
  | { hazir: false; neden: 'paket' | 'rol' | 'anahtar' | 'ajan' | 'sir' }

export type CanliGirdi = {
  kod: string
  ses: UlkeSesCikisi | null | undefined
  canli: CanliAsistanAyarlari | null | undefined
  kimlik: AsistanKimligi | null | undefined
  ortam?: Ortam
}

/** Is the live assistant available for this account's role right now, and with which agent and voice? */
export function canliDurum(g: CanliGirdi): CanliDurum {
  const ortam = g.ortam ?? process.env
  if (!g.ses || !g.canli) return { hazir: false, neden: 'paket' }
  const cinsiyet = g.kimlik?.cinsiyet
  if (!g.kimlik || (cinsiyet !== 'erkek' && cinsiyet !== 'kadin')) return { hazir: false, neden: 'rol' }
  const ses = g.ses.sesler[cinsiyet]
  if (!ses?.id || !/^[A-Za-z0-9]{20}$/.test(ses.id)) return { hazir: false, neden: 'paket' }
  if (!(ortam.ELEVENLABS_API_KEY ?? '').trim()) return { hazir: false, neden: 'anahtar' }
  const ajan = ajanKimligi(g.kod, cinsiyet, ortam)
  if (!ajan) return { hazir: false, neden: 'ajan' }
  if (!sirVarMi(ortam, 'NOTYA_SES_JETON_SECRET') || !sirVarMi(ortam, 'NOTYA_SES_LLM_SECRET')) return { hazir: false, neden: 'sir' }
  return { hazir: true, cinsiyet, ajan, sesId: ses.id, sesAdi: ses.ad }
}

/**
 * Do this deployment's environment hold both agents of the country and the key and secrets the assistant needs? Used by
 * the country's landing copy: a public page may mention the spoken assistant only while the deployment really has it.
 */
export function canliAjanlarVar(kod: string, ortam: Ortam = process.env): boolean {
  return Boolean(
    ajanKimligi(kod, 'erkek', ortam) && ajanKimligi(kod, 'kadin', ortam) &&
    (ortam.ELEVENLABS_API_KEY ?? '').trim() && sirVarMi(ortam, 'NOTYA_SES_JETON_SECRET') && sirVarMi(ortam, 'NOTYA_SES_LLM_SECRET'),
  )
}
