/**
 * NOTYA-ULKE-YASAL-01 — United Kingdom policy drafts. A lawyer has not read them.
 * UK GDPR and the Data Protection Act 2018. Cookies: Privacy and Electronic Communications Regulations (PECR).
 * Medical-device marketing: MHRA. Named only so a lawyer can look them up.
 */
import { ingilizceYasal } from '@/lib/ulke/yasal/ingilizce'
import type { YasalKapisi } from '@/lib/ulke/yasal/tipler'

const dil = ingilizceYasal({
  kod: 'en-GB',
  ad: 'English',
  privacy: 'Review this draft against the UK GDPR and the Data Protection Act 2018. This draft does not say the service meets either of them.',
  cookies: 'Review this draft against the Privacy and Electronic Communications Regulations (PECR). This draft does not say the service meets PECR.',
  medical: 'Review this draft against MHRA rules on medical-device marketing. This draft does not say the service is or is not a device.',
})

export const GB_YASAL: YasalKapisi = { diller: [dil] }
