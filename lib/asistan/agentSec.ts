/**
 * NOTYA-TEK-BEYIN-CORE-01 — shared ElevenLabs base-agent selection for doktor + klinik asistan.
 *
 * Pediatri Ayşe / Kardiyoloji Mehmet / Nöroloji Elif are the three ConvAI base agents. Every other
 * specialty (and every klinik expert) rides one of them by gender / flagship specialty, then — when
 * tek-beyin is on — switches to the Custom-LLM copy in `TEK_BEYIN_AJANLARI` (thin mouth → /api/asistan/ses-llm).
 */
export const AYSE_TABAN_AGENT =
  process.env.ELEVENLABS_AGENT_PEDIATRI ||
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ||
  'agent_3601ktc884ntf3dbdkjtyx6vdfwa'

export const MEHMET_TABAN_AGENT =
  process.env.ELEVENLABS_AGENT_KARDIYOLOJI ||
  'agent_6501ktc87nmyeca88wskfvr8dfxh'

export const ELIF_TABAN_AGENT =
  process.env.ELEVENLABS_AGENT_ELIF ||
  process.env.ELEVENLABS_AGENT_NOROLOJI ||
  'agent_1301kwjdee1afajrqkdxmghna6sx'

/** Base ConvAI agent by flagship specialty / gender. Identity + voice are overridden client-side. */
export function tabanAgentSec(persona: { id?: string; gender: string; primarySpecialty?: string }): string {
  const id = String(persona.id || '')
  const brans = String(persona.primarySpecialty || '')
  if (id === 'aysekaya' || brans === 'pediatri') return AYSE_TABAN_AGENT
  if (id === 'mehmetdemir' || brans === 'kardiyoloji') return MEHMET_TABAN_AGENT
  if (id === 'elifsahin' || brans === 'noroloji') return ELIF_TABAN_AGENT
  return persona.gender === 'male' ? MEHMET_TABAN_AGENT : AYSE_TABAN_AGENT
}

/** Klinik experts: female → Ayşe base, male → Mehmet base (same as non-flagship doktor specialists). */
export function klinikTabanAgentSec(gender: 'female' | 'male'): string {
  return gender === 'male' ? MEHMET_TABAN_AGENT : AYSE_TABAN_AGENT
}

/** Jeton `pe` prefix for klinik experts so ses-llm routes to the klinik brain, not ayseCevapla. */
export const KLINIK_PERSONA_ONEKI = 'klinik:'

export function klinikPersonaJeton(slug: string): string {
  return `${KLINIK_PERSONA_ONEKI}${slug}`
}

export function klinikSlugJetonndan(pe: string | null | undefined): string | null {
  const s = String(pe || '')
  if (!s.startsWith(KLINIK_PERSONA_ONEKI)) return null
  const slug = s.slice(KLINIK_PERSONA_ONEKI.length).trim()
  return slug || null
}
