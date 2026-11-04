/**
 * AU-BETA-01 / AU-POLITIKA-01 — the public summary of the data breach response plan (served at /data-breach). The full
 * internal plan is docs/au/DATA-BREACH-RESPONSE-PLAN.md (2026-11-03); the older working note is docs/au/INCIDENT-RESPONSE.md.
 * Source: OAIC, Notifiable Data Breaches (oaic.gov.au/privacy/notifiable-data-breaches) and Privacy Act 1988 (Cth) Part IIIC
 * (s 26WH: a reasonable and expeditious assessment, within 30 days, of a suspected eligible data breach). Drafted 2026-11-03,
 * pending review by an Australian health lawyer.
 */
import type { UzantiBelgesi } from '@/lib/ulke/uzanti/tipler'
import { AU_OPERATOR, AU_PRIVACY_OFFICER } from './gizlilik'
import { AU_POLITIKA_EPOSTA, AU_POLITIKA_INCELEME } from './politikalar'

export const AU_DATA_BREACH: UzantiBelgesi = {
  baslik: 'Data breach response plan',
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'Our commitment', paragraflar: [
      `Notya is provided by ${AU_OPERATOR}. Because Notya holds health information for the practices that use it, the small business exemption in the Privacy Act 1988 (Cth) does not apply to Notya. If personal information is lost, or accessed or disclosed without authorisation, Notya follows the plan below, written for the Notifiable Data Breaches scheme run by the Office of the Australian Information Commissioner (OAIC).`,
    ] },
    { baslik: 'How to report a suspected breach', paragraflar: [
      `Email ${AU_POLITIKA_EPOSTA} straight away. Say what you saw, where and when. Do not include a patient’s name or the content of a record.`,
    ] },
    { baslik: 'The four steps', paragraflar: [
      '1. Contain: stop the exposure as soon as it is found (for example, revoke access, rotate keys, withdraw links) and keep the evidence.',
      '2. Assess: work out what information was involved, whose it is, and whether the breach is likely to result in serious harm to anyone. The assessment is done quickly, and in any case within 30 days of Notya suspecting a breach.',
      '3. Notify: if the breach is likely to result in serious harm (an eligible data breach), notify the OAIC and the people affected as soon as practicable, saying what happened, what information was involved and what they can do. Where a breach involves a practice’s information, the practice and Notya work together so the people affected are told once and clearly.',
      '4. Review: record what happened and what was done, and change what needs changing so it does not happen again.',
    ] },
    { baslik: 'Practices are told promptly', paragraflar: [
      'If a breach affects a practice’s information, Notya tells the practice without undue delay, and within 72 hours of confirming the breach, even while the assessment is still going.',
    ] },
    { baslik: 'Breaches at a service provider', paragraflar: [
      'If a provider on the Sub-processors page reports a breach that involves Notya data, Notya handles it as its own: it contains what it can on its side, assesses it under this plan and notifies as above.',
    ] },
    { baslik: 'Who is responsible', paragraflar: [
      `Response lead and Privacy Officer: ${AU_PRIVACY_OFFICER}. Every suspected breach, and the decision made about it, is recorded, whether or not it had to be notified.`,
    ] },
    { baslik: 'Not yet done', paragraflar: ['No breach drill has been run yet. The Privacy Officer is the founder of the operating company, not a dedicated privacy professional.'] },
  ],
}
