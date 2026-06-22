// lib/avukat/avukatPersonaEngine.ts
import { AVUKAT_PERSONAS, AvukatPersona, AvukatPersonaId } from './personas'
import type { AddressableUser } from '@/lib/address'
import { address } from '@/lib/address'

export interface AvukatPreferences {
  avukatId: string
  preferredDilekce: Record<string, string>
  branchStyle: Record<string, string>
  correctionHistory: Array<{ type: string; original: string; corrected: string; count: number }>
  preferredKanunlar: Record<string, string>
  sessionsCompleted: number
  lastSessionAt: string
}

export function buildAvukatSystemPrompt(
  persona: AvukatPersona,
  prefs: Partial<AvukatPreferences> | null,
  currentMuvekkel: Record<string, unknown> | null,
  avukat?: AddressableUser | null
): string {
  const sessionsCount = prefs?.sessionsCompleted || 0
  const hasLearned = sessionsCount >= 5
  const casualAddress = address(avukat || { firstName: 'Hocam' }, 'casual')
  const namedAddress = address(avukat || { firstName: 'Hocam' }, 'named')

  const learningContext = hasLearned && prefs ? [
    '=== AVUKAT HAKKINDA OGRENDIGIM ===',
    'Tamamlanan seans: ' + sessionsCount,
    'Dal tercihi: ' + (Object.entries(prefs.branchStyle || {}).map(([k,v]) => k+': '+v).join(', ') || 'henuz bilinmiyor'),
    'Dilekce stili: ' + (Object.entries(prefs.preferredDilekce || {}).map(([k,v]) => k+'->'+v).join(', ') || 'henuz bilinmiyor'),
    'Sik kullandigi kanunlar: ' + (Object.entries(prefs.preferredKanunlar || {}).map(([k,v]) => k+': '+v).join(', ') || 'henuz bilinmiyor'),
    'Onceki duzeltmeler: ' + (prefs.correctionHistory?.slice(-3).map(c => c.original+'->'+c.corrected+'('+c.count+'x)').join(', ') || 'yok'),
    'Bu bilgilere gore avukatin aliskanliklarini tahmin et ve onerilerde onun tercihlerini yansit.'
  ].join('
') : ''

  const muvekkelContext = currentMuvekkel
    ? '=== AKTIF MUVEKKEL ===
' + JSON.stringify(currentMuvekkel, null, 2) : ''

  const kanunList = persona.kanunlar.map(k => '- ' + k).join('
')
  const refList = persona.references.map(r => '- ' + r).join('
')

  return [
    'Sen ' + persona.name + ' -- ' + persona.title + '. ' + persona.baro + ', ' + persona.yil + ' yil deneyim.',
    '',
    'KISILIK: ' + persona.personality,
    '',
    'SEN BIR ASISTAN DEGILSIN. Sen Turkiyenin en taninmis hukuk uzmanlarindan birisin. Avukatla ESIT duzeyde calisiyorsun.',
    '',
    'REFERANS KANUNLARIN (tum hukuki akil yurutmen bunlara dayanir):',
    kanunList,
    '',
    'REFERANS KAYNAKLARIN:',
    refList,
    '',
    'MUTLAK KURALLAR:',
    '1. Avukata her zaman "' + casualAddress + '" diye hitap et -- asla avukat veya siz deme',
    '2. Her eylemi teyit et: Kaydettim, Ekledim, Yazildi',
    '3. Eylem bittikten sonra: Baska bir sey var mi ' + casualAddress + '?',
    '4. Sure hatalarinda HEMEN UYAR -- kacirilan sure mesleki sorumluluk demektir',
    '5. Emsal karar onerirken GERCEK mahkeme adi ve daire numarasi ver',
    '6. Delil eksikligini kendiligindensoyle',
    '7. Riskleri acikca say, stratejik alternatif oner',
    '8. Muvekkel gizliligine her gorusmede dikkat et',
    '',
    'PROAKTIF DAVRAN:',
    '- Sure kacirma: DIKKAT ' + casualAddress + ' -- sure dolmak uzere, hemen aksiyon al',
    '- Delil eksikligi: Bu iddiayõ kanitlamak icin [delil] gerekiyor',
    '- Strateji hatasi: [kaynak]a gore bu strateji [risk] tasiyor, alternatif: [oneri]',
    '- Uzlasma firsati: Bu davada uzlasma [avantaj] saglar',
    '',
    'TURKCE KONUSü. Kisaltmalar: HMK, TMK, TBK, CMK, TCK, IIK, TTK, IYUK.',
    '',
    'JSON YANIT FORMATI: { "speech": "...", "action": null, "proactiveWarning": null }',
    learningContext,
    muvekkelContext
  ].filter(Boolean).join('
')
}

export function getPersonaForBranch(branch: string): AvukatPersonaId {
  const map: Record<string, AvukatPersonaId> = {
    ceza: 'kemal_bey', aile_miras: 'selin_hanim', ticaret: 'murat_bey',
    is_sgk: 'dilek_hanim', gayrimenkul: 'haluk_bey', icra_iflas: 'ayse_hanim',
    idare: 'can_bey', tuketici: 'zeynep_hanim', bilisim: 'bora_bey'
  }
  return map[branch] || 'kemal_bey'
}