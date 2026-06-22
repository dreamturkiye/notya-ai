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

  const learningContext = hasLearned && prefs ? [
    'Tamamlanan seans: ' + sessionsCount,
    'Dal: ' + (Object.entries(prefs.branchStyle || {}).map(([k,v]) => k+':'+v).join(', ') || 'bilinmiyor'),
    'Dilekce: ' + (Object.entries(prefs.preferredDilekce || {}).map(([k,v]) => k+'->'+v).join(', ') || 'bilinmiyor'),
    'Kanunlar: ' + (Object.entries(prefs.preferredKanunlar || {}).map(([k,v]) => k+':'+v).join(', ') || 'bilinmiyor'),
    'Duzeltmeler: ' + (prefs.correctionHistory?.slice(-3).map(c => c.original+'->'+c.corrected).join(', ') || 'yok'),
  ].join('\n') : ''

  const muvekkelContext = currentMuvekkel
    ? '=== AKTIF MUVEKKEL ===\n' + JSON.stringify(currentMuvekkel, null, 2) : ''

  return [
    'Sen ' + persona.name + ' -- ' + persona.title + '. ' + persona.baro + ', ' + persona.yil + ' yil deneyim.',
    'KISILIK: ' + persona.personality,
    'REFERANS KANUNLARIN: ' + persona.kanunlar.join(', '),
    'REFERANS KAYNAKLARIN: ' + persona.references.join(', '),
    'MUTLAK KURALLAR:',
    '1. Avukata her zaman "' + casualAddress + '" diye hitap et',
    '2. Her eylemi teyit et: Kaydettim, Ekledim, Yazildi',
    '3. Sure hatalarinda HEMEN UYAR',
    '4. Emsal karar onerirken GERCEK mahkeme adi ver',
    '5. Delil eksikligini kendiligindensoyle',
    'PROAKTIF DAVRAN: Sure kacirma, delil eksikligi, strateji hatasi, uzlasma.',
    'TURKCE KONUŞ. HMK, TMK, TBK, CMK, TCK, IIK, TTK, IYUK.',
    'JSON YANIT: { "speech": "...", "action": null, "proactiveWarning": null }',
    learningContext,
    muvekkelContext
  ].filter(Boolean).join('\n')
}

export function getPersonaForBranch(branch: string): AvukatPersonaId {
  const map: Record<string, AvukatPersonaId> = {
    ceza: 'kemal_bey', aile_miras: 'selin_hanim', ticaret: 'murat_bey',
    is_sgk: 'dilek_hanim', gayrimenkul: 'haluk_bey', icra_iflas: 'ayse_hanim',
    idare: 'can_bey', tuketici: 'zeynep_hanim', bilisim: 'bora_bey'
  }
  return map[branch] || 'kemal_bey'
}
