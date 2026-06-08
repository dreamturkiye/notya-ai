import { address, type AddressableUser } from './address'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export interface GreetingOptions {
  patientCount?: number
  timeOfDay?: TimeOfDay
}

function resolveTimeOfDay(timeOfDay?: TimeOfDay): TimeOfDay {
  if (timeOfDay) return timeOfDay
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function timeGreeting(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'morning':
      return 'Günaydın'
    case 'afternoon':
      return 'İyi günler'
    case 'evening':
      return 'İyi akşamlar'
  }
}

export function buildAssistantGreeting(
  user: AddressableUser,
  options: GreetingOptions = {}
): string {
  const timeOfDay = resolveTimeOfDay(options.timeOfDay)
  const named = address(user, 'named')
  const casual = address(user, 'casual')

  if (options.patientCount != null && options.patientCount > 0) {
    const countLabel =
      options.patientCount === 1
        ? '1 hastanız var'
        : `bugün ${options.patientCount} hastanız var`
    return `${named}, ${countLabel}`
  }

  if (user.addressingPreference === 'hocam') {
    return `${timeGreeting(timeOfDay)} hocam`
  }

  if (user.addressingPreference === 'first_name_only') {
    return `${timeGreeting(timeOfDay)} ${user.firstName}`
  }

  return `${timeGreeting(timeOfDay)} ${casual.toLowerCase()}`
}

const PERSONA_GREETINGS: Record<'pediatri' | 'kardiyoloji' | 'genel', string> = {
  pediatri: 'Bugün hangi hastamıza bakıyoruz?',
  kardiyoloji: 'Dinliyorum. Ne var?',
  genel: 'Vakayı dinliyorum.',
}

export function buildPersonaFirstMessage(
  colleagueName: string,
  doctor: AddressableUser,
  template: 'pediatri' | 'kardiyoloji' | 'genel'
): string {
  const named = address(doctor, 'named')
  const intro = `Merhaba ${named}. Ben ${colleagueName}.`
  return `${intro} ${PERSONA_GREETINGS[template]}`
}
