// ============================================================
// NOTYA AI — Smart Addressing Engine (Turkish Medical Culture)
// ============================================================

export type AddressContext =
  | 'casual'
  | 'named'
  | 'formal'
  | 'written'
  | 'referral'
  | 'notification'

export type AddressingPreference = 'hocam' | 'named_hocam' | 'first_name_only'

export type DoctorTitle = 'Dr.' | 'Uzm. Dr.' | 'Doç. Dr.' | 'Prof. Dr.'

export type Gender = 'male' | 'female'

export interface AddressableUser {
  firstName: string
  lastName?: string
  title?: DoctorTitle
  gender?: Gender
  addressingPreference?: AddressingPreference
}

function formalSuffix(gender?: Gender): string {
  return gender === 'female' ? 'Hanım' : 'Bey'
}

function writtenName(user: AddressableUser): string {
  const title = user.title || 'Dr.'
  const last = user.lastName ? ` ${user.lastName}` : ''
  return `${title} ${user.firstName}${last}`.trim()
}

export function address(user: AddressableUser, context: AddressContext): string {
  const pref = user.addressingPreference ?? 'named_hocam'
  const firstName = user.firstName?.trim() || 'Hocam'

  if (pref === 'first_name_only') {
    switch (context) {
      case 'casual':
      case 'named':
      case 'notification':
        return firstName
      case 'formal':
        return `${firstName} ${formalSuffix(user.gender)}`
      case 'written':
        return writtenName(user)
      case 'referral':
        return `Sayın ${firstName}`
    }
  }

  if (pref === 'hocam') {
    switch (context) {
      case 'casual':
        return 'Hocam'
      case 'named':
      case 'notification':
        return `${firstName} Hocam`
      case 'formal':
        return `${firstName} ${formalSuffix(user.gender)}`
      case 'written':
        return writtenName(user)
      case 'referral':
        return `Sayın ${firstName} Hocam`
    }
  }

  // named_hocam (default)
  switch (context) {
    case 'casual':
      return 'Hocam'
    case 'named':
    case 'notification':
      return `${firstName} Hocam`
    case 'formal':
      return `${firstName} ${formalSuffix(user.gender)}`
    case 'written':
      return writtenName(user)
    case 'referral':
      return `Sayın ${firstName} Hocam`
  }
}
