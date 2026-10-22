/**
 * AU-BETA-01 — the data-breach response process page (served at /data-breach). Initial compliance draft – external legal
 * review later. Source: OAIC, https://www.oaic.gov.au/privacy/notifiable-data-breaches , read 2026-10-22 (the page states the
 * trigger — "likely to result in serious harm" — and that individuals and the OAIC are notified; it states no assessment
 * period, so none is restated here). The working process document is docs/au/INCIDENT-RESPONSE.md.
 */
import { YASAL_EPOSTA as E } from '@/lib/ulke/yasal/eposta'
import type { UzantiBelgesi } from '@/lib/ulke/uzanti/tipler'
import { AU_OPERATOR, AU_PRIVACY_OFFICER, AU_TASLAK_ETIKETI } from './gizlilik'

const INCELEME = `${AU_TASLAK_ETIKETI} A lawyer has not read this text. It does not say the service complies with the Privacy Act 1988 (Cth) or any other law.`

export const AU_DATA_BREACH: UzantiBelgesi = {
  baslik: 'Data breach response',
  inceleme: INCELEME,
  bolumler: [
    { baslik: 'Purpose', paragraflar: ['This is a draft process for a suspected data breach: personal information lost, or accessed or disclosed without authorisation. It is written with the Notifiable Data Breaches (NDB) scheme of the Privacy Act 1988 (Cth) in mind. The scheme applies where the Act covers the organisation, and requires notifying affected individuals and the OAIC when a breach is likely to result in serious harm (OAIC, oaic.gov.au/privacy/notifiable-data-breaches). Whether and how it applies to each party here is for a lawyer.'] },
    { baslik: 'Steps', paragraflar: [
      '1. Report: anyone who suspects a breach writes to the security address straight away. The person who receives it records the time.',
      '2. Contain: stop the exposure (revoke access, rotate keys, withdraw links) and keep the evidence.',
      '3. Assess: decide promptly whether the breach is likely to result in serious harm to anyone. The OAIC’s guidance sets an assessment period; the exact rules must be confirmed by a lawyer, so this draft does not restate them.',
      '4. Notify: where the assessment says so, notify affected individuals and the OAIC without delay, using the OAIC’s own form, and tell the individuals what happened and what they can do.',
      '5. Review: record what happened, what was changed, and who was told.',
    ] },
    { baslik: 'Roles', paragraflar: [`Software provider: ${AU_OPERATOR}. Each practice remains responsible for its own patients’ information. Privacy officer: ${AU_PRIVACY_OFFICER}. Security reports: ${E.security}.`] },
    { baslik: 'Not yet done', paragraflar: ['No breach drill has been run. The privacy officer is the founder of the operating company, not a dedicated privacy professional. A lawyer has not reviewed this process.'] },
  ],
}

