/**
 * Conditions of registration in sections 45, 45A, 45B and 46 of the My Health Records Act 2012,
 * and the upload authorisation in Schedule 1 clause 9.
 *
 * READ 2026-10-20 — compilation in force on 1 July 2026, Compilation No. 18,
 *   https://www.legislation.gov.au/C2012A00063/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
 *   sections 45, 45A, 45B, 45C and 46, and Schedule 1 clause 9.
 * READ 2026-10-20 — My Health Records Rules 2026, as made on 31 March 2026, commenced 1 April 2026,
 *   https://www.legislation.gov.au/F2026L00392/asmade/2026-03-31/text/original/epub/OEBPS/document_1/document_1.html
 *   sections 23 and 24. A later amendment of the rules was not checked.
 * LICENCE, read 2026-10-15 for the Medicare particulars tool and relied on again here —
 *   https://www.legislation.gov.au/terms-of-use : Creative Commons Attribution 4.0 International, including
 *   commercial use. The checklist is a shortening, so the attribution is the "changed" form.
 * NOT IN THE TOOL: an upload, a call to the System Operator, a prescribed State or Territory law, or the
 *   Healthcare Identifiers Act beyond the paragraph the Act names. Nothing is sent. Section 45C is not a tick.
 * WHO SEES IT: every role. A shared record is the practice's, not one specialty's.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

export const AU_MHR_MADDELERI = ['depo', 'ozet', 'tur', 'hazirlayan', 'manevi', 'istemedi', 'eski', 'ayrim'] as const

const KAYNAK = 'https://www.legislation.gov.au/C2012A00063/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html (read 2026-10-20): compilation of the My Health Records Act 2012 in force on 1 July 2026, Compilation No. 18, sections 45, 45A, 45B and 46, and Schedule 1 clause 9. My Health Records Rules 2026, sections 23 and 24, as made on 31 March 2026, https://www.legislation.gov.au/F2026L00392/asmade/2026-03-31/text/original/epub/OEBPS/document_1/document_1.html (read 2026-10-20). Creative Commons Attribution 4.0 International, https://www.legislation.gov.au/terms-of-use (read 2026-10-15).'
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
      aciklama: m('Tick a condition sections 45, 45A, 45B and 46 of the My Health Records Act 2012 place on a registered healthcare provider organisation, and the limit in Schedule 1 clause 9. The compilation read was in force on 1 July 2026. Sections 23 and 24 of the My Health Records Rules 2026, as made on 31 March 2026, name the record kind and the fee exception. A tick is your note. This screen does not upload a record.'),
      alanlar: {
        depo: m('The record would be uploaded only to the National Repositories Service, or to a repository a registered repository operator\'s registration relates to'),
        ozet: m('A record that says it is the shared health summary would be that shared health summary'),
        tur: m('A record other than the shared health summary, and other than advance care planning information, was prepared by an individual healthcare provider to whom paragraph 9(1)(a) of the Healthcare Identifiers Act has assigned an identifier. This screen does not ask for that identifier'),
        hazirlayan: m('The record was prepared by an individual registered by a registration authority whose registration is not conditional, suspended, cancelled or lapsed, or by an individual represented by a professional body described in the Healthcare Identifiers Act whose credentials are not conditional, suspended, cancelled or lapsed. The rules except the case where fees to maintain that registration, or those credentials, are not more than 6 months overdue'),
        manevi: m('Uploading the record would not infringe a moral right of the author'),
        istemedi: m('The person has not advised that this record, every record, or this class of record must not be uploaded'),
        eski: m('A work, sound recording or film made before the Copyright Act provisions named in sections 45A and 45B commence is not uploaded where uploading it would infringe copyright for a healthcare purpose those sections describe'),
        ayrim: m('Healthcare is not refused, and the person is not otherwise treated differently, because they are not registered or because they set access controls'),
      },
      sayilar: { isaretli: m('Conditions noted') },
      uyarilar: {
        gonderilmedi: m('A tick is a note in this product. Nothing is uploaded and nothing is sent. This is not a finding that the organisation is registered, or that an upload is allowed.'),
      },
      not: m('Schedule 1 clause 9 authorises an upload unless the person has advised against it, or a State or Territory law prescribed for that clause says otherwise. Those prescribed laws were not copied. Section 23 of the rules specifies the record kind as records other than the shared health summary and other than advance care planning information. Section 24 states the fee exception. A later amendment of the rules was not checked. The Healthcare Identifiers Act was not read, so paragraph 9(1)(a) is named and not set out. Section 45C, about loss after an old work is uploaded, is not a tick.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Federal Register of Legislation',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
