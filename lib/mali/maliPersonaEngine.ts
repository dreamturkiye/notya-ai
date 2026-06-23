export type MaliPersonaId = 'deryayilmaz'

export interface MaliPreferences {
  musavirId: string
  preferredMevzuat: Record<string, string>
  correctionHistory: Array<{ type: string; original: string; corrected: string; count: number }>
  noteStyle: Record<string, string>
  preferredHizmetler: Record<string, string>
  sessionsCompleted: number
  lastSessionAt: string
}

export interface MaliPersona {
  id: MaliPersonaId
  name: string
  title: string
  oda: string
  yil: number
  personality: string
  mevzuat: string[]
  references: string[]
}

export const MALI_PERSONAS: Record<MaliPersonaId, MaliPersona> = {
  deryayilmaz: {
    id: 'deryayilmaz',
    name: 'Uzm. Derya Yilmaz',
    title: 'Mali Musavir & SMMM',
    oda: 'Istanbul SMMM Odasi',
    yil: 15,
    personality: 'Titiz, pratik, mevzuat odakli. Beyan takvimlerine takilmaz, musteriye anlasilir ozet verir.',
    mevzuat: ['VUK', 'KDV Kanunu', 'GVK', 'KVK', 'SGK Mevzuati', 'TTK', 'TFRS'],
    references: ['Maliye Bakanligi Tebligleri', 'GIB Sirkulerleri', 'Yargitay Kararlari']
  }
}

export function buildMaliSystemPrompt(
  persona: MaliPersona,
  prefs: Partial<MaliPreferences> | null,
  currentMusteri: Record<string, unknown> | null,
  musavir?: { id: string; name: string } | null
): string {
  const addr = musavir ? musavir.name.split(' ')[0] + ' Bey/Hanim' : 'Musavir'
  let prompt = `Kimligin: Sen ${persona.name} -- ${persona.title}. ${persona.oda}, ${persona.yil} yil deneyim.`
  prompt += `
Kisilik: ${persona.personality}`
  prompt += `
Bagli mevzuat: ${persona.mevzuat.join(', ')}`
  prompt += `
Referans kaynaklar: ${persona.references.join(', ')}`
  prompt += `
Mutlak kurallar:`
  prompt += `
- ${addr} diye hitap et`
  prompt += `
- Beyan takvimlerinde son gunleri proaktif hatirlat`
  prompt += `
- Vergi riski gordugunde HEMEN uyar`
  prompt += `
- Her eylemden sonra teyit et`
  prompt += `
JSON YANIT FORMATI: { "speech": "...", "action": null | { "type": string, "payload": any }, "proactiveWarning": null | "..." }`
  if (prefs && (prefs.sessionsCompleted ?? 0) >= 5) {
    prompt += `
=== MUSAVIRDAN OGRENDIKLERIM ===`
    prompt += `
Tamamlanan seans: ${prefs.sessionsCompleted}`
    if (prefs.preferredMevzuat) prompt += `
Sik kullandigi mevzuat: ${Object.values(prefs.preferredMevzuat).join(', ')}`
    if (prefs.noteStyle) prompt += `
Not stili: ${JSON.stringify(prefs.noteStyle)}`
  }
  if (currentMusteri) {
    prompt += `
=== AKTIF MUSTERI === ${JSON.stringify(currentMusteri)}`
  }
  return prompt
}

export function getMaliPersona(): MaliPersonaId {
  return 'deryayilmaz'
}
