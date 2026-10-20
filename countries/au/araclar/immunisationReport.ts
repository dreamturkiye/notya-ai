/**
 * Particulars a recognised vaccination provider reports under section 10A of the
 * Australian Immunisation Register Act 2015, for a vaccination given in Australia.
 *
 * READ 2026-10-20 — Australian Immunisation Register Act 2015, compilation in force on 5 December 2025,
 *   https://www.legislation.gov.au/C2015A00138/2025-12-05/2025-12-05/text/original/epub/OEBPS/document_1/document_1.html
 *   sections 4 (the definition of recognised vaccination provider), 10A and 10B.
 * READ 2026-10-20 — Australian Immunisation Register Rules 2026, as made on 12 March 2026, commenced 1 April 2026,
 *   https://www.legislation.gov.au/F2026L00326/asmade/2026-03-24/text/original/epub/OEBPS/document_1/document_1.html
 *   section 5 (the two vaccine definitions) and section 10. A later amendment was not checked.
 *   The National Health (Immunisation Program — Designated Vaccines) Determination was not read, so no vaccine
 *   is named from it.
 * LICENCE, read 2026-10-15 — https://www.legislation.gov.au/terms-of-use : Creative Commons Attribution 4.0
 *   International, including commercial use. The checklist is a shortening, so the attribution is the "changed" form.
 * NOT IN THE TOOL: a report, a medicare number, a healthcare identifier, a provider number, a brand, a batch,
 *   or a dose. Nothing is sent. Catch-up is not calculated. A vaccination given outside Australia is not this list.
 * WHO SEES IT: doctors only. Section 4 names a general practitioner, and an individual a government recognises
 *   to administer vaccines for the purposes of the register. This pack does not know that recognition. The allied
 *   professions are not this screen.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { isaret, secim } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const TUR = ['covid', 'influenza', 'program', 'ensefalit', 'diger'] as const
const YAZILAN = ['covid', 'influenza', 'program', 'ensefalit'] as const
const form = (degerler: readonly string[]) => ({ kosul: { alan: 'tur', degerler } })
const kutu = (anahtar: string, degerler: readonly string[] = YAZILAN) => ({ ...isaret(anahtar), ...form(degerler) })

const KAYNAK = 'https://www.legislation.gov.au/F2026L00326/asmade/2026-03-24/text/original/epub/OEBPS/document_1/document_1.html (read 2026-10-20): Australian Immunisation Register Rules 2026, section 10, as made on 12 March 2026 and commenced on 1 April 2026. Australian Immunisation Register Act 2015, compilation in force on 5 December 2025, sections 4, 10A and 10B, https://www.legislation.gov.au/C2015A00138/2025-12-05/2025-12-05/text/original/epub/OEBPS/document_1/document_1.html (read 2026-10-20). Creative Commons Attribution 4.0 International, https://www.legislation.gov.au/terms-of-use (read 2026-10-15).'
const BILDIRIM = 'Based on content from the Federal Register of Legislation at 20 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'

export const AU_AIR = kosulluListe({
  anahtar: 'au-immunisation-report',
  alanlar: [
    secim('tur', TUR),
    kutu('kisi'),
    kutu('kart'),
    kutu('kimlik'),
    kutu('saglayici'),
    kutu('gun'),
    kutu('marka'),
    kutu('yol', ['ensefalit']),
    kutu('tip'),
    kutu('gebelik'),
    kutu('sure'),
    kutu('bicim'),
    kutu('kosul'),
  ],
  uyarilar: ['air_yok'],
  uyari: () => ['air_yok'],
  kaynak: KAYNAK,
})

/** Doctors only. Particulars of a report. Not a report. */
export function auImmunisationReport(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-immunisation-report',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Immunisation register report particulars'),
      aciklama: m('Tick a particular section 10 of the Australian Immunisation Register Rules 2026 prescribes for a report under subsection 10A(1) of the Act, for a vaccination given in Australia. The rules were made on 12 March 2026 and commenced on 1 April 2026. Choose the kind of vaccination first. A tick is your note. This screen does not report a vaccination.'),
      alanlar: {
        tur: m('Kind of vaccination'),
        kisi: m('The name, contact details, date of birth and gender of the person vaccinated'),
        kart: m('If the person has a medicare number, in the meaning Part VII of the National Health Act gives that word, the report includes it. This screen does not ask for the number and does not store it'),
        kimlik: m('If a healthcare identifier, in the meaning the Healthcare Identifiers Act gives that word, is known, the report includes it. This screen does not ask for it and does not store it'),
        saglayici: m('Provider identification for the recognised vaccination provider who administers the vaccination. This screen does not store a provider number'),
        gun: m('The day of the vaccination'),
        marka: m('The brand, the dose number and the batch number of the vaccine administered. This screen does not check them against a schedule'),
        yol: m('For a Japanese encephalitis virus vaccine, the route of administration'),
        tip: m('The vaccine type information'),
        gebelik: m('Whether the person was pregnant at the time of the vaccination, in the antenatal field the rules name'),
        sure: m('The report is within 24 hours where that is reasonably practicable, and otherwise within 10 business days'),
        bicim: m('The report is in an electronic form, or in a written form where an electronic form is not reasonably practicable'),
        kosul: m('The vaccination was administered on or after 1 April 2026'),
      },
      secenekler: {
        tur: {
          covid: m('A vaccination for the coronavirus known as COVID-19'),
          influenza: m('A vaccination for influenza'),
          program: m('A vaccination with a national immunisation program vaccine other than influenza or Q fever'),
          ensefalit: m('A vaccination for the Japanese encephalitis virus'),
          diger: m('Another vaccination. Section 10 of these rules does not prescribe this kind'),
        },
      },
      sayilar: { isaretli: m('Particulars ticked') },
      uyarilar: {
        air_yok: m('A tick is a note in this product. Nothing was reported to the Australian Immunisation Register. This screen does not decide that a report was required.'),
      },
      not: m('Section 4 of the Act names a general practitioner, and an individual a government recognises to administer vaccines for the purposes of the register. This screen does not know that recognition. Subsection 10A(2) says the duty does not apply where the provider reasonably believes that reporting is likely to pose a risk to the health or safety of a person. That belief is not a tick. A vaccination given outside Australia is not this list. The designated-vaccines determination was not read, so a national immunisation program vaccine is not named here. Section 10A names a civil penalty. This screen does not apply it. A notice under section 10B is not produced.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Federal Register of Legislation',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
