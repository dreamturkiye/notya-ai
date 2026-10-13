/**
 * NOTYA-ULKE-YASAL-01 — Australia policy drafts. A lawyer has not read them.
 * Privacy Act 1988 (Cth) and the Australian Privacy Principles. Medical-device marketing: TGA.
 * Named only so a lawyer can look them up.
 */
import { ingilizceYasal } from '@/lib/ulke/yasal/ingilizce'
import type { YasalKapisi } from '@/lib/ulke/yasal/tipler'

const dil = ingilizceYasal({
  kod: 'en-AU',
  ad: 'English',
  privacy: 'Review this draft against the Privacy Act 1988 (Cth) and the Australian Privacy Principles. This draft does not say the service meets them.',
  cookies: 'Review this draft against the Privacy Act 1988 (Cth) and the Australian Privacy Principles as they apply to cookies and similar storage. This draft does not say the service meets them.',
  medical: 'Review this draft against TGA rules on medical-device marketing. This draft does not say the service is or is not a device.',
})

export const AU_YASAL: YasalKapisi = { diller: [dil] }
