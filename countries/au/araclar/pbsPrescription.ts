/**
 * Particulars for a PBS prescription that is not a medication-chart prescription.
 *
 * READ 2026-10-15 — National Health (Pharmaceutical Benefits) Regulations 2017, compilation in force on 15 August 2026
 *   (Compilation No. 16), https://www.legislation.gov.au/F2017L00313/2026-08-15
 *   sections 39, 40, 41A and 42. Section 41 (medication charts) was read and is not this list.
 * LICENCE, read 2026-10-15 — https://www.legislation.gov.au/terms-of-use : Creative Commons Attribution 4.0
 *   International, including commercial use. The checklist is a shortening, so the attribution is the "changed" form.
 * NOT IN THE TOOL: a medicine name, a price, a restriction, or any identifier the doctor would type. Section 41A's
 *   metadata is named only as the prescribing software's own. Nothing is sent. This is not a State or Territory
 *   prescription form.
 * WHO SEES IT: doctors only. Prescribing under this instrument is not a dietitian's or a physiotherapist's screen.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { isaret, secim } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const BICIM = ['kagit', 'bilgisayar', 'elektronik', 'diger'] as const
const form = (degerler: readonly string[]) => ({ kosul: { alan: 'bicim', degerler } })
const kutu = (anahtar: string, degerler: readonly string[] = BICIM) => ({ ...isaret(anahtar), ...form(degerler) })

const KAYNAK = 'https://www.legislation.gov.au/F2017L00313/2026-08-15 (read 2026-10-15): compilation of the National Health (Pharmaceutical Benefits) Regulations 2017 in force on 15 August 2026, sections 40, 41A and 42. Creative Commons Attribution 4.0 International, https://www.legislation.gov.au/terms-of-use.'
const BILDIRIM = 'Based on content from the Federal Register of Legislation at 15 October 2026. For the latest information on Australian Government legislation please go to https://www.legislation.gov.au. Creative Commons Attribution 4.0 International.'

export const AU_PBS_RECETE = kosulluListe({
  anahtar: 'au-pbs-prescription',
  alanlar: [
    secim('bicim', BICIM),
    kutu('ad'),
    kutu('adres'),
    kutu('yarar'),
    kutu('miktar'),
    kutu('tekrar'),
    kutu('uygulama'),
    kutu('imza'),
    kutu('tarih'),
    kutu('tek_kisi'),
    kutu('ayni_gun'),
    kutu('yetki'),
    kutu('tek_arz'),
    kutu('kart'),
    kutu('olcu', ['kagit', 'bilgisayar']),
    kutu('baslik', ['kagit', 'bilgisayar']),
    kutu('kopya', ['kagit', 'bilgisayar']),
    kutu('varsayilan', ['bilgisayar', 'elektronik', 'diger']),
    kutu('meta', ['elektronik']),
  ],
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})

/** Doctors only. A note of particulars. Not a prescription and not a connection. */
export function auPbsRecete(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-pbs-prescription',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('PBS prescription particulars'),
      aciklama: m('Tick a particular section 40 asks for on a pharmaceutical-benefits prescription that is not a medication-chart prescription. The compilation read was in force on 15 August 2026. Choose how the prescription is prepared first. A tick is your note. It does not decide that the prescription is valid.'),
      alanlar: {
        bicim: m('How the prescription is prepared'),
        ad: m('The name of the person the pharmaceutical benefit is prescribed for'),
        adres: m('That person\'s residential address'),
        yarar: m('The pharmaceutical benefit is identified: each drug, and a brand only where you consider it necessary for treatment. A brand is not inserted by default'),
        miktar: m('The quantity or number of units to be supplied'),
        tekrar: m('If supply is to be repeated, the number of times'),
        uygulama: m('If the benefit is not a ready-prepared benefit, how it is to be administered'),
        imza: m('Signed after the prescription is prepared'),
        tarih: m('The date the prescription is written'),
        tek_kisi: m('The prescription is for one person only'),
        ayni_gun: m('No other prescription was written the same day for this person for the same benefit, another brand of it, or a schedule equivalent'),
        yetki: m('If it is an authority prescription that needs an approval number or a streamlined authority code, that number or code is written on it'),
        tek_arz: m('If a one-occasion supply above the usual quantity is directed under section 49, one of these is written: Reg 24, Regulation 24, Reg 49, Regulation 49, Section 49, one supply, or 1 supply'),
        kart: m('If a concessional status, or a concession or entitlement card, applies, that status is marked and the card number is on the prescription. This screen does not store the number'),
        olcu: m('The form is as nearly as practicable 18 centimetres long by 12 centimetres wide'),
        baslik: m('The prescriber\'s name and address, and the letters PBS, appear on the form'),
        kopya: m('One part says pharmacist/patient copy, and one part says Medicare/DVA copy'),
        varsayilan: m('The computer program does not, by default, mark that only the specified brand may be supplied, and does not insert a brand by default'),
        meta: m('The prescribing software supplies the extra metadata section 41A requires. This screen does not ask you to type an identifier'),
      },
      secenekler: {
        bicim: {
          kagit: m('Handwritten duplicate on a paper form'),
          bilgisayar: m('Computer duplicate on a paper form'),
          elektronik: m('Electronic prescription'),
          diger: m('Another method approved in writing by the Secretary'),
        },
      },
      sayilar: { isaretli: m('Particulars ticked') },
      uyarilar: {
        gonderilmedi: m('Nothing was sent. This screen does not create a prescription and does not connect to a prescription-exchange service.'),
      },
      not: m('Not a State or Territory prescription form. Medication-chart prescriptions under section 41 are not this list. Whether a medicine is a pharmaceutical benefit is not decided here. Subsection 40(2C) gives way where a State or Territory law says otherwise about identifying the benefit.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Federal Register of Legislation',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
