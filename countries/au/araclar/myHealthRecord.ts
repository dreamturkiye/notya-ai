/**
 * Conditions of registration in sections 45, 45A, 45B and 46 of the My Health Records Act 2012,
 * and the upload authorisation in Schedule 1 clause 9.
 *
 * READ 2026-10-20 — compilation in force on 5 December 2025, Compilation No. 17,
 *   https://www.legislation.gov.au/C2012A00063/2025-12-05/2025-12-05/text/original/epub/OEBPS/document_1/document_1.html
 * LICENCE, read 2026-10-15 for the Medicare particulars tool and relied on again here —
 *   https://www.legislation.gov.au/terms-of-use : Creative Commons Attribution 4.0 International, including
 *   commercial use. The checklist is a shortening, so the attribution is the "changed" form.
 * NOT IN THE TOOL: an upload, a call to the System Operator, the My Health Records Rules, or a prescribed
 *   State or Territory law. Nothing is sent.
 * WHO SEES IT: every role. A shared record is the practice's, not one specialty's.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

export const AU_MHR_MADDELERI = ['depo', 'ozet', 'hazirlayan', 'manevi', 'istemedi', 'eski', 'ayrim'] as const

const KAYNAK = 'https://www.legislation.gov.au/C2012A00063/2025-12-05/2025-12-05/text/original/epub/OEBPS/document_1/document_1.html (read 2026-10-20): compilation of the My Health Records Act 2012 in force on 5 December 2025, Compilation No. 17, sections 45, 45A, 45B and 46, and Schedule 1 clause 9. Creative Commons Attribution 4.0 International, https://www.legislation.gov.au/terms-of-use (read 2026-10-15).'
const BILDIRIM = 'Based on content from the Federal Register of Legislation at 20 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'

export const AU_MHR = kontrolListesi({
  anahtar: 'au-my-health-record',
  maddeler: AU_MHR_MADDELERI,
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})

/** Every role. Conditions for an upload. Not an upload. */
export function auMyHealthRecord(): PaketAraci {
  return {
    anahtar: 'au-my-health-record',
    roller: null,
    metin: {
      ad: m('My Health Record upload conditions'),
      aciklama: m('Tick a condition sections 45, 45A, 45B and 46 of the My Health Records Act 2012 place on a registered healthcare provider organisation, and the limit in Schedule 1 clause 9. The compilation read was in force on 5 December 2025. A tick is your note. This screen does not upload a record.'),
      alanlar: {
        depo: m('The record would be uploaded only to the National Repositories Service, or to a repository a registered repository operator\'s registration relates to'),
        ozet: m('A record that says it is the shared health summary would be that shared health summary'),
        hazirlayan: m('Where the My Health Records Rules specify the kind of record, it was prepared by a registered individual whose registration is not conditional, suspended, cancelled or lapsed, or by a person represented by a professional body described in the Healthcare Identifiers Act, whose credentials are not conditional, suspended, cancelled or lapsed'),
        manevi: m('Uploading the record would not infringe a moral right of the author'),
        istemedi: m('The person has not advised that this record, every record, or this class of record must not be uploaded'),
        eski: m('An old work, sound recording or film is not uploaded where doing so would infringe copyright'),
        ayrim: m('Healthcare is not refused, and the person is not otherwise treated differently, because they are not registered or because they set access controls'),
      },
      sayilar: { isaretli: m('Conditions noted') },
      uyarilar: {
        gonderilmedi: m('A tick is a note in this product. Nothing is uploaded and nothing is sent. This is not a finding that the organisation is registered, or that an upload is allowed.'),
      },
      not: m('Schedule 1 clause 9 authorises an upload unless the person has advised against it, or a State or Territory law prescribed for that clause says otherwise. Those prescribed laws were not copied. The My Health Records Rules were not read, so the kinds of record they specify are not listed. The Healthcare Identifiers Act was not read.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Federal Register of Legislation',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
