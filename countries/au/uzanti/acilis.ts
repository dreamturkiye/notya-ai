/**
 * AU-BETA-01 — the Australian landing's disclaimer block. The four disclaimers are the OWNER'S WORDS and are shown
 * VERBATIM (2026-10-22). The public contact block carries only the e-mail addresses: no placeholder, no ABN and no Australian address are shown (Notya has none to claim; the privacy pages say that entity details are to be published before commercial launch). Nothing here claims a
 * certification, partnership, approval or validation, and no competitor is named.
 *
 * AU-POLITIKA-01 (Kaan, 2026-11-03): sentences 2 and 3 rewritten from docs/au/LEGAL-MEMO-2026-11.md section 4 — no Privacy Act
 * compliance claim, no "by using Notya you consent" bundled consent, no implied association with the guideline bodies. Explicit
 * consent is captured in the patient page, the intake form and the consent-before-recording gate (./gizlilik.ts, AU-RIZA-01).
 */
import type { AcilisYasalNotlari } from '@/lib/ulke/arayuz/acilisTipleri'
import { AU_TASLAK_ETIKETI } from './gizlilik'

export const AU_YASAL_SATIRLARI = [
  'Notya is a practice management and clinical documentation tool. It does not provide medical advice, diagnosis, or treatment. Clinical decisions remain the responsibility of the registered practitioner.',
  'How Notya handles personal and health information, and which providers process it, is set out in our Privacy Policy. A visit is recorded only after the practitioner confirms the patient has agreed.',
  'Where Notya shows clinical reference content, it names the publicly available source it comes from. Notya is not affiliated with those organisations, and they have not reviewed Notya.',
  'Notya is not a substitute for professional medical advice. Always consult a registered Australian health practitioner for medical concerns.',
] as const

export const AU_YASAL_NOTLARI: AcilisYasalNotlari = {
  baslik: 'Important information',
  satirlar: AU_YASAL_SATIRLARI,
  taslakEtiketi: AU_TASLAK_ETIKETI,
  iletisim: [
    'Notya LLC, 3424 Sollers Point Rd., Baltimore, MD 21222, USA  ·  Enquiries and privacy: kaan@notya.io',
  ],
  baglantilar: [
    { etiket: 'Privacy Policy', href: '/privacy' },
    { etiket: 'Data breach response', href: '/data-breach' },
    { etiket: 'Access and correction requests', href: '/data-request' },
    { etiket: 'Security', href: '/security' },
    { etiket: 'Data storage and retention', href: '/data-storage' },
    { etiket: 'Sub-processors', href: '/sub-processors' },
    { etiket: 'Data processing agreement', href: '/data-processing-agreement' },
    { etiket: 'Terms of use', href: '/terms' },
  ],
}
