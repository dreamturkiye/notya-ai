/**
 * Particulars subsection 19(6) of the Health Insurance Act 1973 requires on an account, a receipt, or an assignment.
 *
 * READ 2026-10-15 — Health Insurance Regulations 2018, compilation in force on 1 March 2026 (Compilation No. 25),
 *   https://www.legislation.gov.au/F2018L01365/2026-03-01
 *   sections 47 to 56. Section 52 (named radiation and nuclear items) and section 57 (further diagnostic imaging
 *   particulars) were read and are not separate ticks: the note says so.
 * LICENCE, read 2026-10-15 — https://www.legislation.gov.au/terms-of-use : Creative Commons Attribution 4.0
 *   International, including commercial use. The checklist is a shortening, so the attribution is the "changed" form.
 * NOT IN THE TOOL: an item number, a fee, a provider number, or a patient identifier. Nothing is sent. This is not
 *   a claim.
 * WHO SEES IT: doctors only.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { isaret, secim } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const SINIF = ['genel', 'hastane', 'yerine', 'radyasyon', 'patoloji', 'goruntuleme'] as const
const sinif = (degerler: readonly string[]) => ({ kosul: { alan: 'sinif', degerler } })
const kutu = (anahtar: string, degerler: readonly string[] = SINIF) => ({ ...isaret(anahtar), ...sinif(degerler) })

const KAYNAK = 'https://www.legislation.gov.au/F2018L01365/2026-03-01 (read 2026-10-15): compilation of the Health Insurance Regulations 2018 in force on 1 March 2026, sections 47 to 56. Creative Commons Attribution 4.0 International, https://www.legislation.gov.au/terms-of-use.'
const BILDIRIM = 'Based on content from the Federal Register of Legislation at 15 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'

export const AU_MEDICARE = kosulluListe({
  anahtar: 'au-medicare-particulars',
  alanlar: [
    secim('sinif', SINIF),
    kutu('ad'),
    kutu('gun'),
    kutu('ucret'),
    kutu('odenen'),
    kutu('kalan'),
    kutu('kalem'),
    kutu('kim', ['genel', 'hastane', 'yerine']),
    kutu('hastane', ['hastane']),
    kutu('yerine', ['yerine']),
    kutu('konum', ['radyasyon']),
    kutu('pat_kim', ['patoloji']),
    kutu('pat_istek', ['patoloji']),
    kutu('pat_toplama', ['patoloji']),
    kutu('gor_fatura', ['goruntuleme']),
    kutu('gor_hizmet', ['goruntuleme']),
  ],
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})

/** Doctors only. Particulars for an account, a receipt or an assignment. Not a claim. */
export function auMedicare(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-medicare-particulars',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Medicare account particulars'),
      aciklama: m('Tick a particular the Health Insurance Regulations 2018 prescribe for an account, a receipt, or an assignment or agreement under section 20A of the Act. The compilation read was in force on 1 March 2026. Choose the kind of service first. A tick is your note. It does not decide that a benefit is payable.'),
      alanlar: {
        sinif: m('Kind of service'),
        ad: m('The name of the patient the service was rendered to'),
        gun: m('The date the service was rendered'),
        ucret: m('The amount charged for the service'),
        odenen: m('The total amount paid for the service'),
        kalan: m('Any amount outstanding for the service'),
        kalem: m('A description of the service sufficient to identify the item that specifies it'),
        kim: m('The name of the person who rendered the service and the address of the place of practice, or that person\'s provider number, and a statement that the service was provided by that person'),
        hastane: m('The description shows the service was part of hospital treatment, or the item number is followed by an asterisk or the letter H'),
        yerine: m('The description is preceded by the words hospital-substitute treatment, or a shorter description is used with the item number and those words'),
        konum: m('The location specific practice number for the registered premises or the registered mobile base'),
        pat_kim: m('The name and place of practice, or the provider number, of an approved pathology practitioner section 54 allows'),
        pat_istek: m('If the service was requested: the requesting practitioner\'s name, the place of practice or provider number, and the date the service was determined to be necessary'),
        pat_toplama: m('If the service is initiation of a patient episode by collection of a specimen, the collection point is identified as section 55(5) states'),
        gor_fatura: m('The name and a place of practice, or the provider number, of the medical practitioner claiming or receiving the fee, or of the assignee'),
        gor_hizmet: m('If that practitioner did not render the service: the name and place of the practitioner who did, or that provider number, unless those particulars and the request date are kept at the billing place of practice'),
      },
      secenekler: {
        sinif: {
          genel: m('A general medical service'),
          hastane: m('A general medical service rendered as part of hospital treatment'),
          yerine: m('Hospital-substitute treatment, where the person chooses a private insurer benefit'),
          radyasyon: m('A radiation oncology service using equipment at registered premises or a registered mobile base'),
          patoloji: m('A pathology service'),
          goruntuleme: m('A diagnostic imaging service'),
        },
      },
      sayilar: { isaretli: m('Particulars ticked') },
      uyarilar: {
        gonderilmedi: m('Nothing was sent. An account, a receipt, an assignment and a claim are the practitioner\'s own.'),
      },
      not: m('No fee and no item number is stored. Section 51(3) adds particulars where section 19AB of the Act applies; that branch is not a separate tick. Sections 52 and 57 name further particulars for some radiation, nuclear and diagnostic imaging services; they are not separate ticks here.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Federal Register of Legislation',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
