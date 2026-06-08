// ============================================================
// NOTYA AI — Assistant Greetings (Turkish Medical Culture)
// ============================================================

import { address, type AddressableUser } from './address'

export interface GreetingOptions {
  patientCount?: number
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
}

function resolveTimeOfDay(hour = new Date().getHours()): GreetingOptions['timeOfDay'] {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function timeGreeting(timeOfDay: GreetingOptions['timeOfDay']): string {
  switch (timeOfDay) {
    case 'morning':
      return 'Günaydın'
    case 'afternoon':
      return 'İyi günler'
    case 'evening':
      return 'İyi akşamlar'
    default:
      return 'Merhaba'
  }
}

export function buildAssistantGreeting(
  user: AddressableUser,
  options: GreetingOptions = {}
): string {
  const timeOfDay = options.timeOfDay ?? resolveTimeOfDay()
  const casual = address(user, 'casual').toLowerCase()
  const named = address(user, 'named')
  const base = `${timeGreeting(timeOfDay)} ${casual}`

  if (options.patientCount != null && options.patientCount > 0) {
    return `${named}, bugün ${options.patientCount} hastanız var`
  }

  return base.charAt(0).toUpperCase() + base.slice(1)
}

export function buildPersonaFirstMessage(
  personaShortName: string,
  doctor: AddressableUser,
  template: 'pediatri' | 'kardiyoloji' | 'genel'
): string {
  const hitap = address(doctor, 'casual')

  switch (template) {
    case 'pediatri':
      return `Merhaba ${hitap}. Ben ${personaShortName}. Bugün hangi hastamıza bakıyoruz?`
    case 'kardiyoloji':
      return `${hitap.charAt(0).toUpperCase() + hitap.slice(1)}, dinliyorum.`
    case 'genel':
    default:
      return `Merhaba ${hitap}. Ben ${personaShortName}. Vakayı dinliyorum.`
  }
}
