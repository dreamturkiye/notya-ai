import type {
  AddressableUser,
  AddressingPreference,
  DoctorTitle,
  Gender,
} from './address'
import type { User } from '@/types/notya'

export type DoctorProfile = Partial<User> & {
  id?: string
  email?: string
  full_name?: string
}

export function toAddressableUser(user: Partial<User> | null | undefined): AddressableUser {
  const firstName =
    user?.first_name?.trim() ||
    user?.full_name?.split(/\s+/)[0] ||
    'Hocam'

  return {
    firstName,
    lastName: user?.last_name?.trim() || undefined,
    title: user?.title as DoctorTitle | undefined,
    gender: user?.gender as Gender | undefined,
    addressingPreference: (user?.addressing_preference as AddressingPreference) || 'named_hocam',
  }
}

export function buildFullName(profile: {
  first_name?: string | null
  last_name?: string | null
  title?: string | null
  full_name?: string | null
}): string {
  const first = profile.first_name?.trim()
  const last = profile.last_name?.trim()
  if (first && last) return `${first} ${last}`
  if (first) return first
  return profile.full_name?.trim() || ''
}
