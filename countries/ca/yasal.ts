/**
 * NOTYA-ULKE-YASAL-01 — Canada policy drafts. A lawyer has not read them.
 * PIPEDA, plus provincial private-sector and health-privacy statutes (they differ; this draft names no province).
 * Medical-device marketing: Health Canada. Named only so a lawyer can look them up.
 * HUKUK-01 (2026-10-17): refund/cancellation and copyright added — provincial consumer-protection statutes
 * (no province chosen, same stance as privacy above); the Copyright Act (R.S.C., 1985, c. C-42).
 */
import { ingilizceYasal } from '@/lib/ulke/yasal/ingilizce'
import type { YasalKapisi } from '@/lib/ulke/yasal/tipler'

const dil = ingilizceYasal({
  kod: 'en-CA',
  ad: 'English',
  privacy: 'Review this draft against PIPEDA and against the provincial private-sector and health-privacy statutes that apply where the patient lives. Those provincial statutes differ. This draft does not choose a province and does not say the service meets any of them.',
  cookies: 'Review this draft against PIPEDA and the provincial statutes that govern cookies and similar storage. This draft does not say the service meets them.',
  medical: 'Review this draft against Health Canada rules on medical-device marketing. This draft does not say the service is or is not a device.',
  refund: 'Review this draft against the consumer-protection statute of the province where the clinician is located — several set their own cancellation and automatic-renewal rules, and they differ. This draft does not choose a province and does not say the service meets any of them.',
  copyright: 'Review this draft against the Copyright Act (R.S.C., 1985, c. C-42).',
})

export const CA_YASAL: YasalKapisi = { diller: [dil] }
