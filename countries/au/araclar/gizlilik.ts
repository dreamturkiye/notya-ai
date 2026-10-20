/**
 * The 13 Australian Privacy Principles, by the headings in Schedule 1 of the Privacy Act 1988.
 *
 * READ 2026-10-20 — compilation in force on 4 June 2026, Compilation No. 104,
 *   https://www.legislation.gov.au/C2004A03712/2026-06-04/2026-06-04/text/original/epub/OEBPS/document_1/document_1.html
 *   Schedule 1. The overview names principles 1 to 13. The operative subclauses were read and are not copied onto
 *   this screen.
 * LICENCE, read 2026-10-15 for the Medicare particulars tool and relied on again here —
 *   https://www.legislation.gov.au/terms-of-use : Creative Commons Attribution 4.0 International, including
 *   commercial use. The checklist is the Schedule's own headings, so the attribution is the "changed" form.
 * WHO SEES IT: every role. A privacy record is the practice's, not one specialty's.
 * NOT IN THE TOOL: a finding that the Act is met, a state or territory health-records Act, or Schedule 2.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

export const AU_GIZLILIK_MADDELERI = ['app1', 'app2', 'app3', 'app4', 'app5', 'app6', 'app7', 'app8', 'app9', 'app10', 'app11', 'app12', 'app13'] as const

const KAYNAK = 'https://www.legislation.gov.au/C2004A03712/2026-06-04/2026-06-04/text/original/epub/OEBPS/document_1/document_1.html (read 2026-10-20): compilation of the Privacy Act 1988 in force on 4 June 2026, Compilation No. 104, Schedule 1. Creative Commons Attribution 4.0 International, https://www.legislation.gov.au/terms-of-use (read 2026-10-15).'
const BILDIRIM = 'Based on content from the Federal Register of Legislation at 20 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'

export const AU_GIZLILIK = kontrolListesi({
  anahtar: 'au-privacy-principles',
  maddeler: AU_GIZLILIK_MADDELERI,
  uyarilar: ['hukuki_degil'],
  uyari: () => ['hukuki_degil'],
  kaynak: KAYNAK,
})

/** Every role. The Schedule 1 headings. Not a finding that the Act is met. */
export const AU_GIZLILIK_ARACI: PaketAraci = {
  anahtar: 'au-privacy-principles',
  roller: null,
  metin: {
    ad: m('Privacy Act record'),
    aciklama: m('Tick a heading in Schedule 1 of the Privacy Act 1988. The compilation read was in force on 4 June 2026 and names 13 Australian Privacy Principles. The operative subclauses are not set out here. A tick is your note.'),
    alanlar: {
      app1: m('Australian Privacy Principle 1: open and transparent management of personal information'),
      app2: m('Australian Privacy Principle 2: anonymity and pseudonymity'),
      app3: m('Australian Privacy Principle 3: collection of solicited personal information'),
      app4: m('Australian Privacy Principle 4: dealing with unsolicited personal information'),
      app5: m('Australian Privacy Principle 5: notification of the collection of personal information'),
      app6: m('Australian Privacy Principle 6: use or disclosure of personal information'),
      app7: m('Australian Privacy Principle 7: direct marketing'),
      app8: m('Australian Privacy Principle 8: cross-border disclosure of personal information'),
      app9: m('Australian Privacy Principle 9: adoption, use or disclosure of government related identifiers'),
      app10: m('Australian Privacy Principle 10: quality of personal information'),
      app11: m('Australian Privacy Principle 11: security of personal information'),
      app12: m('Australian Privacy Principle 12: access to personal information'),
      app13: m('Australian Privacy Principle 13: correction of personal information'),
    },
    sayilar: { isaretli: m('Principles noted') },
    uyarilar: {
      hukuki_degil: m('A tick is a note in this product. It is not a finding that the Privacy Act 1988 or the Australian Privacy Principles are satisfied. Nothing is sent.'),
    },
    not: m('Health information is sensitive information under that Act. State and territory health-records laws are not set out here. Schedule 2, the statutory tort, is not on this screen. Nothing is sent to the Office of the Australian Information Commissioner.'),
  },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Federal Register of Legislation',
    kaynak: KAYNAK,
    bildirim: m(BILDIRIM),
  },
}
