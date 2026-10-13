/**
 * NOTYA-ULKE-YASAL-01 — New Zealand policy drafts. A lawyer has not read them.
 * Privacy Act 2020 and the Health Information Privacy Code. Medical-device marketing: Medsafe.
 * Named only so a lawyer can look them up.
 */
import { ingilizceYasal } from '@/lib/ulke/yasal/ingilizce'
import type { YasalKapisi } from '@/lib/ulke/yasal/tipler'

const dil = ingilizceYasal({
  kod: 'en-NZ',
  ad: 'English',
  privacy: 'Review this draft against the Privacy Act 2020 and the Health Information Privacy Code. This draft does not say the service meets either of them.',
  cookies: 'Review this draft against the Privacy Act 2020 as it applies to cookies and similar storage. This draft does not say the service meets it.',
  medical: 'Review this draft against Medsafe rules on medical-device marketing. This draft does not say the service is or is not a device.',
})

export const NZ_YASAL: YasalKapisi = { diller: [dil] }
