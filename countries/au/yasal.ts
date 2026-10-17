/**
 * NOTYA-ULKE-YASAL-01 — Australia policy drafts. A lawyer has not read them.
 * Privacy Act 1988 (Cth) and the Australian Privacy Principles. Medical-device marketing: TGA.
 * Named only so a lawyer can look them up.
 * HUKUK-01 (2026-10-17): refund/cancellation and copyright added — the Australian Consumer Law's consumer
 * guarantees (Competition and Consumer Act 2010 (Cth), Sch 2), which cannot be excluded; the Copyright Act 1968 (Cth).
 */
import { ingilizceYasal } from '@/lib/ulke/yasal/ingilizce'
import type { YasalKapisi } from '@/lib/ulke/yasal/tipler'

const dil = ingilizceYasal({
  kod: 'en-AU',
  ad: 'English',
  privacy: 'Review this draft against the Privacy Act 1988 (Cth) and the Australian Privacy Principles. This draft does not say the service meets them.',
  cookies: 'Review this draft against the Privacy Act 1988 (Cth) and the Australian Privacy Principles as they apply to cookies and similar storage. This draft does not say the service meets them.',
  medical: 'Review this draft against TGA rules on medical-device marketing. This draft does not say the service is or is not a device.',
  refund: 'Review this draft against the consumer guarantees in the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)). Those guarantees cannot be excluded, restricted or modified by this or any other document — this draft does not attempt to, and a lawyer should confirm the wording never reads as if it does.',
  copyright: 'Review this draft against the Copyright Act 1968 (Cth).',
})

export const AU_YASAL: YasalKapisi = { diller: [dil] }
