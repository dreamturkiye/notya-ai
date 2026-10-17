/**
 * NOTYA-ULKE-YASAL-01 — United States policy drafts. A lawyer has not read them.
 * HIPAA Privacy Rule: 45 CFR Parts 160 and 164 (HHS). State medical-privacy and consumer-privacy statutes differ;
 * this draft does not choose a state. FDA device rules are named only so a lawyer can look them up.
 * HUKUK-01 (2026-10-17): refund/cancellation and copyright added — state auto-renewal/cancellation statutes and
 * the FTC's negative-option rules; 17 U.S.C. § 512 (DMCA) for an infringement-notice safe harbor.
 */
import { ingilizceYasal } from '@/lib/ulke/yasal/ingilizce'
import type { YasalKapisi } from '@/lib/ulke/yasal/tipler'

const dil = ingilizceYasal({
  kod: 'en-US',
  ad: 'English',
  privacy: 'Review this draft against the HIPAA Privacy Rule, 45 CFR Parts 160 and 164, and against the state medical-privacy and consumer-privacy statutes that apply where the patient lives. This draft does not say the service meets those rules, and it does not choose a state.',
  cookies: 'Review this draft against the state statutes that govern cookies and similar storage on a device. This draft does not say the service meets those statutes.',
  medical: 'Review this draft against FDA rules on medical-device marketing. This draft does not say the service is or is not a device.',
  refund: 'Review this draft against the state laws on automatic renewal and cancellation of a subscription that apply where the clinician is located, and against the FTC’s rules on negative-option billing. This draft does not choose a state and does not say the service meets them.',
  copyright: 'Review this draft against the notice-and-takedown procedure in 17 U.S.C. § 512 (the DMCA), if that safe harbor is wanted. This draft does not claim it.',
})

export const US_YASAL: YasalKapisi = { diller: [dil] }
