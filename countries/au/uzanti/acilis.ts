/**
 * AU-BETA-01 — the Australian landing's disclaimer block. The four disclaimers are the OWNER'S WORDS and are shown
 * VERBATIM (2026-10-22). Contact particulars are placeholders and are marked as such. Nothing here claims a
 * certification, partnership, approval or validation, and no competitor is named.
 *
 * Sentence 2 is the owner-required wording ("By using Notya you consent …"). The product does NOT rely on it: explicit
 * consent is captured in the patient page and the intake form, with a stored, versioned record (./gizlilik.ts).
 */
import type { AcilisYasalNotlari } from '@/lib/ulke/arayuz/acilisTipleri'
import { AU_TASLAK_ETIKETI } from './gizlilik'

export const AU_YASAL_SATIRLARI = [
  'Notya is a practice management and clinical documentation tool. It does not provide medical advice, diagnosis, or treatment. Clinical decisions remain the responsibility of the registered practitioner.',
  'Health information is handled in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles. By using Notya you consent to the collection and use of health information for the purpose of providing the service.',
  'Clinical content is based on publicly available Australian guidelines (RACGP, RCH Melbourne, PBS, WHO). It is an initial compliance and clinical draft. External clinician and legal review is planned after the first customers.',
  'Notya is not a substitute for professional medical advice. Always consult a registered Australian health practitioner for medical concerns.',
] as const

export const AU_YASAL_NOTLARI: AcilisYasalNotlari = {
  baslik: 'Important information',
  satirlar: AU_YASAL_SATIRLARI,
  taslakEtiketi: AU_TASLAK_ETIKETI,
  iletisim: [
    'Notya (Australia) — [business address: street, suburb, state, postcode — placeholder]',
    'ABN: [ABN — placeholder, to be completed]  ·  Email: hello@notya.io',
  ],
  baglantilar: [
    { etiket: 'Privacy Policy', href: '/privacy' },
    { etiket: 'Data breach response', href: '/data-breach' },
    { etiket: 'Access and correction requests', href: '/data-request' },
    { etiket: 'Security', href: '/security' },
  ],
}
