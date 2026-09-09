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
  // Unvan önekini at ("Dr. Gökhan Mamur" → "Gökhan"); ad yoksa 'Hocam'. (Kaan 2026-09-10: "Dr. Hocam" çıkıyordu.)
  const UNVAN = /^(?:prof|doç|doc|uzm|op|dr|dt|dr\.\s*öğr\.\s*üyesi)\.?$/i
  const fullParcalar = (user?.full_name || '').trim().split(/\s+/).filter((p) => p && !UNVAN.test(p))
  const hamIlk = user?.first_name?.trim() || fullParcalar[0] || ''
  const firstName = hamIlk && !UNVAN.test(hamIlk) ? hamIlk : 'Hocam'

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
