/**
 * NOTYA-ULKE-YASAL-01 — English policy drafts shared by the English-speaking packs.
 * Statute names are NOT written here. Each pack passes the sentences a lawyer reviews against its own law
 * (countries/<code>/yasal.ts). A lawyer has not read the result.
 */
import { YASAL_EPOSTA } from './eposta'
import type { YasalBelge, YasalDilPaketi } from './tipler'

const E = YASAL_EPOSTA
const INCELEME = 'A lawyer has not read this text. It is written so a lawyer can review it. It is not a statement that the service meets any statute.'

function posta(baslik: string): YasalBelge['bolumler'][number] {
  return {
    baslik,
    paragraflar: [
      `Privacy and requests about your information: ${E.privacy}`,
      `Help: ${E.support}`,
      `Security reports: ${E.security}`,
      `Terms and other legal notices: ${E.legal}`,
      `Billing: ${E.billing}`,
      `General questions and sales: ${E.hello}`,
    ],
  }
}

export function ingilizceYasal(o: {
  kod: string
  ad: string
  /** The privacy statute or statutes, named for the lawyer. No other country's law. */
  privacy: string
  /** Cookie rule, named for the lawyer. */
  cookies: string
  /** Medical-device or advertising rule, named for the lawyer. */
  medical: string
  /** The refund/cancellation statute or consumer guarantee, named for the lawyer. HUKUK-01. */
  refund: string
  /** The copyright/infringement-notice statute, named for the lawyer. HUKUK-01. */
  copyright: string
}): YasalDilPaketi {
  const belgeler: YasalBelge[] = [
    {
      anahtar: 'privacy',
      baslik: 'Privacy notice',
      inceleme: INCELEME,
      bolumler: [
        { baslik: 'Who writes to you', paragraflar: [`Notya writes this draft. General questions go to ${E.hello}. Questions about personal information go to ${E.privacy}.`] },
        { baslik: 'For a lawyer to review', paragraflar: [o.privacy] },
        {
          baslik: 'What the service holds',
          paragraflar: [
            'An account holds the name, email address, phone number and profession the clinician gives, and a record of sign-ins.',
            'A patient record holds what the clinician types or records: the note, appointments, messages kept on the patient page, and a file the clinician uploads. A recording exists only when the clinician turns it on.',
            'Card numbers are taken by the payment provider. This draft does not say Notya stores them.',
          ],
        },
        {
          baslik: 'Who decides',
          paragraflar: [
            'The clinician decides what is written about their own patient and what is shared with that patient. Notya provides the software.',
            'A lawyer should name the role of the clinician and the role of Notya under the statute above. This draft does not name those roles as settled.',
          ],
        },
        {
          baslik: 'How long',
          paragraflar: [
            'A lawyer sets the retention periods. Until that review, the draft says: an account is kept while it is open, and a patient record is kept until the clinician deletes it or the account closes.',
          ],
        },
        { baslik: 'Your request', paragraflar: [`Write to ${E.privacy} to ask for a copy, a correction or a deletion. The data-request page says what to include.`] },
        posta('Addresses'),
      ],
    },
    {
      anahtar: 'terms',
      baslik: 'Terms of use',
      inceleme: INCELEME,
      bolumler: [
        { baslik: 'The account', paragraflar: ['An account is opened with an invitation code. The clinician keeps the password and does not share the account.'] },
        {
          baslik: 'Care stays with the clinician',
          paragraflar: [
            'The software prepares drafts: a note, a list, a reminder. Diagnosis, prescribing and what is said to a patient stay with the clinician. The medical-disclaimer page says the same thing for a patient who reads it.',
          ],
        },
        { baslik: 'Fees', paragraflar: [`A price, where one is shown, is a quote until it is agreed. Billing questions go to ${E.billing}.`] },
        { baslik: 'Which law', paragraflar: ['A lawyer names the law of the contract and the court. This draft does not choose them.'] },
        { baslik: 'Notices', paragraflar: [`Legal notices about these terms go to ${E.legal}.`] },
        posta('Addresses'),
      ],
    },
    {
      anahtar: 'cookies',
      baslik: 'Cookie policy',
      inceleme: INCELEME,
      bolumler: [
        { baslik: 'For a lawyer to review', paragraflar: [o.cookies] },
        {
          baslik: 'What is stored',
          paragraflar: [
            'The signed-in application keeps a session so the clinician stays signed in. The public pages may keep the language the visitor chose.',
            'This draft does not describe an advertising cookie. A lawyer should confirm the list against the deployment.',
          ],
        },
        posta('Addresses'),
      ],
    },
    {
      anahtar: 'data-request',
      baslik: 'Your information',
      inceleme: INCELEME,
      bolumler: [
        {
          baslik: 'How to ask',
          paragraflar: [
            `Write to ${E.privacy}. Say your name, the email address of the account, and whether you ask for a copy, a correction or a deletion.`,
            'Do not send a national identity number in that email. A lawyer sets how many days a reply may take. This draft does not set a number of days.',
          ],
        },
        posta('Addresses'),
      ],
    },
    {
      anahtar: 'accessibility',
      baslik: 'Accessibility',
      inceleme: INCELEME,
      bolumler: [
        {
          baslik: 'For a lawyer to review',
          paragraflar: [
            'This draft is written so a lawyer and an accessibility reviewer can read it against WCAG 2.2 Level AA. It is not a statement that the service meets WCAG.',
            `A barrier you hit can be sent to ${E.support}. Say the page and what you were trying to do.`,
          ],
        },
      ],
    },
    {
      anahtar: 'medical',
      baslik: 'Medical disclaimer',
      inceleme: INCELEME,
      bolumler: [
        {
          baslik: 'Drafts, not a decision',
          paragraflar: [
            'Notya prepares drafts for a clinician. It does not diagnose, prescribe or tell a patient what to do. Those decisions stay with the clinician.',
            'If you need urgent care, contact the local emergency service. This page does not give a phone number.',
          ],
        },
        { baslik: 'For a lawyer to review', paragraflar: [o.medical] },
      ],
    },
    {
      anahtar: 'security',
      baslik: 'Security',
      inceleme: INCELEME,
      bolumler: [
        {
          baslik: 'How to report',
          paragraflar: [
            `Write to ${E.security}. Say what you saw, the page, and the time. Leave out a patient\'s name and the content of a record if you can still describe the fault.`,
            'The same address is in /.well-known/security.txt on this deployment.',
            'This draft offers no payment for a report. A lawyer decides whether a programme of that kind exists.',
          ],
        },
        posta('Addresses'),
      ],
    },
    {
      // HUKUK-01 (2026-10-17): refund/cancellation, added to match the Türkiye suite's document set.
      anahtar: 'refund',
      baslik: 'Refunds and cancellation',
      inceleme: INCELEME,
      bolumler: [
        {
          baslik: 'Cancelling',
          paragraflar: [
            'The clinician can cancel at any time. The paid period that has already started continues to the date it was paid for; no further period begins after that date.',
          ],
        },
        { baslik: 'For a lawyer to review', paragraflar: [o.refund] },
        { baslik: 'Billing questions', paragraflar: [`Write to ${E.billing}.`] },
        posta('Addresses'),
      ],
    },
    {
      anahtar: 'copyright',
      baslik: 'Copyright',
      inceleme: INCELEME,
      bolumler: [
        {
          baslik: 'The software',
          paragraflar: ['The software, its interface and the Notya name belong to Notya. A subscription is a right to use it, not a transfer of it.'],
        },
        {
          baslik: "The clinician's own record",
          paragraflar: ['What a clinician writes or records about their own patient belongs to the clinician. Notya does not claim it, does not sell it, and does not use it to train a model.'],
        },
        { baslik: 'For a lawyer to review', paragraflar: [o.copyright] },
        { baslik: 'A notice of infringement', paragraflar: [`Send a notice to ${E.legal}: who you are, what you believe is yours, and where you saw it used.`] },
        posta('Addresses'),
      ],
    },
  ]
  return { kod: o.kod, ad: o.ad, geri: 'Home', belgeler }
}
