// ============================================================
// NOTYA AI — Doctor Profile Helpers
// ============================================================

import type { AddressableUser, AddressingPreference, DoctorTitle, Gender } from './address'

export interface DoctorProfile {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  title?: DoctorTitle | null
  specialty?: string | null
  hospital?: string | null
  gender?: Gender | null
  addressing_preference?: AddressingPreference | null
  onboarding_completed?: boolean | null
  full_name?: string | null
  clinic_name?: string | null
}

export function toAddressableUser(profile: DoctorProfile | null | undefined): AddressableUser {
  if (!profile) {
    return { firstName: 'Hocam', addressingPreference: 'named_hocam' }
  }

  const firstName =
    profile.first_name?.trim() ||
    profile.full_name?.trim().split(/\s+/)[0] ||
    'Hocam'

  return {
    firstName,
    lastName: profile.last_name?.trim() || undefined,
    title: (profile.title as DoctorTitle) || undefined,
    gender: (profile.gender as Gender) || undefined,
    addressingPreference: profile.addressing_preference || 'named_hocam',
  }
}
