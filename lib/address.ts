export type AddressContext = 'casual' | 'named' | 'formal' | 'written' | 'referral' | 'notification'
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

export function address(user: AddressableUser, context: AddressContext): string {
  const pref = user.addressingPreference ?? 'named_hocam'
  const firstName = user.firstName?.trim() || 'Hocam'

  switch (context) {
    case 'casual':
      if (pref === 'first_name_only') return firstName
      return 'Hocam'

    case 'named':
      if (pref === 'first_name_only') return firstName
      if (pref === 'hocam') return 'Hocam'
      return `${firstName} Hocam`

    case 'formal': {
      const suffix = user.gender === 'female' ? 'Hanım' : 'Bey'
      return `${firstName} ${suffix}`
    }

    case 'written': {
      const title = user.title ?? 'Dr.'
      const lastName = user.lastName?.trim() ?? ''
      return [title, firstName, lastName].filter(Boolean).join(' ')
    }

    case 'referral':
      if (pref === 'first_name_only') return `Sayın ${firstName}`
      return `Sayın ${firstName} Hocam`

    case 'notification':
      if (pref === 'first_name_only') return firstName
      if (pref === 'hocam') return 'Hocam'
      return `${firstName} Hocam`

    default:
      return firstName
  }
}
