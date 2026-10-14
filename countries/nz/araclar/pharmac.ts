/**
 * NEW ZEALAND — Pharmac's top 20, a Schedule extract that is not a ranking, and a note that is not sent.
 * Switched on without a clinician's sign-off (./onaysiz.ts).
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'
import { BOS_SONUC, kontrolListesi, metin, sayi, secim } from '@/lib/ulke/araclar/yardimci'
import {
  NZ_TAKVIM, NZ_TAKVIM_KAYIT, NZ_UST20, NZ_UST_KAYIT,
  nzTakvimAnahtari, nzTakvimBul, nzTakvimCumlesi, nzUstAnahtari, nzUstBul, nzUstCumlesi,
} from '../referans/ilaclar'

const D = 'en-NZ'
const m = (metin: string): BicimliMetin => ({ [D]: metin })

const UST_ANAHTAR = NZ_UST20.map((r) => nzUstAnahtari(r.rank))
const UST_CUMLE = Object.fromEntries(NZ_UST20.map((r) => [nzUstAnahtari(r.rank), m(nzUstCumlesi(r))]))
const TAKVIM_ANAHTAR = NZ_TAKVIM.map((r) => nzTakvimAnahtari(r.rank))
const TAKVIM_CUMLE = Object.fromEntries(NZ_TAKVIM.map((r) => [nzTakvimAnahtari(r.rank), m(nzTakvimCumlesi(r))]))

const UST_KAYNAK = `Pharmac. Medicines prescription count, ${NZ_UST_KAYIT.year}. ${NZ_UST_KAYIT.sourceUrl}. Page last updated ${NZ_UST_KAYIT.pageUpdated}. Retrieved ${NZ_UST_KAYIT.retrieved}.`
const TAKVIM_KAYNAK = `Pharmac. Pharmaceutical Schedule, ${NZ_TAKVIM_KAYIT.edition}, published ${NZ_TAKVIM_KAYIT.published}. ${NZ_TAKVIM_KAYIT.sourceUrl}. Retrieved ${NZ_TAKVIM_KAYIT.retrieved}.`

const PHARMAC_LISANS = {
  durum: 'serbest' as const,
  hakSahibi: 'Pharmac',
  kaynak: `Copyright page read 2026-10-14 (https://www.pharmac.govt.nz/about-this-site/copyright, last updated 23 September 2026): Creative Commons Attribution 4.0 International. The Schedule file README states the same licence and asks for written attribution to PHARMAC, with no logo. Schedule file read 2026-10-14: ${NZ_TAKVIM_KAYIT.sourceUrl}. Top-20 page read 2026-10-14: ${NZ_UST_KAYIT.sourceUrl}. The page title still says 2021/22; the heading and the table say 2023/24.`,
  bildirim: m('Source: Pharmac. Top 20: medicines prescription count for 2023/24. Schedule extract: the first 250 chemical entries in the community section of the October 2026 Pharmaceutical Schedule, in file order, with the first formulation and the first brand of that formulation. This is not the whole Schedule. Creative Commons Attribution 4.0 International. This product is not Pharmac\'s. https://creativecommons.org/licenses/by/4.0/'),
}

function ustSonuc(anahtar: unknown) {
  const satir = nzUstBul(anahtar)
  if (!satir) return BOS_SONUC
  return {
    tamam: true,
    sayilar: [{ anahtar: 'sira', deger: satir.rank, ondalik: 0, enCok: NZ_UST20.length }],
    bant: nzUstAnahtari(satir.rank),
    uyarilar: ['takvim_yok'],
    tarihler: [],
  }
}

function takvimSonuc(anahtar: unknown, uyarilar: readonly string[]) {
  const satir = nzTakvimBul(anahtar)
  if (!satir) return BOS_SONUC
  return {
    tamam: true,
    sayilar: [{ anahtar: 'sira', deger: satir.rank, ondalik: 0, enCok: NZ_TAKVIM.length }],
    bant: nzTakvimAnahtari(satir.rank),
    uyarilar,
    tarihler: [],
  }
}

export const NZ_UST: AracTanimi = {
  anahtar: 'nz-pharmac-top-20',
  tur: 'liste',
  alanlar: [secim('ilac', UST_ANAHTAR)],
  cikti: { sayilar: ['sira'], bantlar: UST_ANAHTAR, uyarilar: ['takvim_yok'], tarihler: [] },
  kaynak: UST_KAYNAK,
  hesapla: (g) => ustSonuc(g.ilac),
}

export const NZ_TAKVIM_LISTE: AracTanimi = {
  anahtar: 'nz-schedule-medicines',
  tur: 'liste',
  alanlar: [secim('ilac', TAKVIM_ANAHTAR)],
  cikti: { sayilar: ['sira'], bantlar: TAKVIM_ANAHTAR, uyarilar: ['dosya_sirasi'], tarihler: [] },
  kaynak: TAKVIM_KAYNAK,
  hesapla: (g) => takvimSonuc(g.ilac, ['dosya_sirasi']),
}

/**
 * A record of regulation 29, read 14 October 2026 from the consolidation current to 5 July 2024.
 * There is no copyright in New Zealand legislation (legislation.govt.nz/copyright, read the same day).
 * The six points in `NZ_KONTROLLU_HER` are regulation 29(4) for every controlled-drug prescription.
 * The later points apply only in the case each label names.
 */
export const NZ_KONTROLLU_HER = ['tarih', 'adres', 'kisi', 'ad', 'miktar', 'doz'] as const
export const NZ_KONTROLLU_DURUM = ['yas12', 'dis', 'ebe', 'vet', 'kagit', 'sinif'] as const

export const NZ_KONTROLLU: AracTanimi = kontrolListesi({
  anahtar: 'nz-controlled-drug-note',
  maddeler: [...NZ_KONTROLLU_HER, ...NZ_KONTROLLU_DURUM],
  kaynak: 'Misuse of Drugs Regulations 1977 (SR 1977/37), regulation 29, as at 5 July 2024.',
})

export const NZ_RECETE: AracTanimi = {
  anahtar: 'nz-prescription-note',
  tur: 'liste',
  alanlar: [secim('ilac', TAKVIM_ANAHTAR), sayi('miktar', 0.01, 9999, { istege: true }), metin('yon')],
  cikti: { sayilar: ['sira'], bantlar: TAKVIM_ANAHTAR, uyarilar: ['dosya_sirasi', 'iletilmedi'], tarihler: [] },
  kaynak: TAKVIM_KAYNAK,
  hesapla: (g) => takvimSonuc(g.ilac, ['dosya_sirasi', 'iletilmedi']),
}

export function nzPharmacAraclari(hekimler: readonly string[]): readonly PaketAraci[] {
  const roller = [...hekimler]
  return [
    {
      anahtar: 'nz-pharmac-top-20',
      roller, sinif: 'hekimler',
      metin: {
        ad: m('Community medicines by prescription count'),
        aciklama: m('The 20 medicines with the most funded community prescriptions in 2023/24, as Pharmac\'s table prints them. Choosing one shows that row. It is a closed list of 20. A medicine that is not on it cannot be recorded here. Pharmac publishes no longer list on this page.'),
        alanlar: { ilac: m('Medicine') },
        secenekler: { ilac: UST_CUMLE },
        sayilar: { sira: m('Rank by funded prescriptions') },
        bantlar: UST_CUMLE,
        uyarilar: { takvim_yok: m('This table states no strength, no brand, and no dose.') },
        not: m('Community dispensing that Pharmac holds prescription data for. Not a prescribing decision: diagnosis and treatment are the doctor\'s.'),
      },
      lisans: PHARMAC_LISANS,
    },
    {
      anahtar: 'nz-schedule-medicines',
      roller, sinif: 'hekimler',
      metin: {
        ad: m('Pharmaceutical Schedule extract'),
        aciklama: m('The first 250 chemical entries in the community section of the October 2026 Pharmaceutical Schedule, in the order of the file. Choosing one shows that entry\'s first formulation and first brand. The position is not how often the medicine is prescribed.'),
        alanlar: { ilac: m('Chemical entry') },
        secenekler: { ilac: TAKVIM_CUMLE },
        sayilar: { sira: m('Position in this extract') },
        bantlar: TAKVIM_CUMLE,
        uyarilar: { dosya_sirasi: m('This position is the order of the Schedule file. It is not a count of prescriptions.') },
        not: m('Not the whole Schedule, and not a volume ranking. The only volume ranking loaded is the separate top 20. Some entries are devices listed as chemical entries. Diagnosis and treatment are the doctor\'s.'),
      },
      lisans: PHARMAC_LISANS,
    },
    {
      anahtar: 'nz-prescription-note',
      roller, sinif: 'hekimler',
      metin: {
        ad: m('Prescription note (not sent)'),
        aciklama: m('A note of one chemical from the same Schedule extract, plus a quantity and directions you type yourself. The quantity is not a dose the tool suggests. The note is not sent anywhere.'),
        alanlar: {
          ilac: m('Chemical entry'),
          miktar: m('Quantity you are writing'),
          yon: m('Directions you are writing'),
        },
        secenekler: { ilac: TAKVIM_CUMLE },
        sayilar: { sira: m('Position in this extract') },
        bantlar: TAKVIM_CUMLE,
        uyarilar: {
          dosya_sirasi: m('This position is the order of the Schedule file. It is not a count of prescriptions.'),
          iletilmedi: m('This note is not sent to the New Zealand ePrescription Service.'),
        },
        not: m('Not a controlled-medicine writing rule and not a transmission. The Schedule extract states no controlled-medicine class. Diagnosis and treatment are the doctor\'s.'),
      },
      lisans: PHARMAC_LISANS,
    },
    nzKontrollu(hekimler),
  ]
}

/** Regulation 29, as read on 14 October 2026. A record. Nothing is sent. */
export function nzKontrollu(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'nz-controlled-drug-note',
    roller: [...hekimler], sinif: 'hekimler',
    metin: {
      ad: m('Controlled-drug prescription: points regulation 29 names'),
      aciklama: m('A record of regulation 29 of the Misuse of Drugs Regulations 1977. The first six points are for every controlled-drug prescription. The other points apply only in the case the label names. A specified Class C drug, in regulation 29(5), is amobarbital, amobarbital sodium, buprenorphine, butobarbitone, glutethimide, ketamine, secobarbital, or secobarbital sodium, or a combination of two or more of those, unless it is combined with another active substance that the same clause excludes.'),
      alanlar: {
        tarih: m('Dated with the date it was issued'),
        adres: m('Address of the controlled-drug prescriber'),
        kisi: m('Surname, initials, and address of the person, or of the person who has custody of the animal'),
        ad: m('Name of the controlled drug'),
        miktar: m('Total amount for the one occasion, or for each occasion'),
        doz: m('Dose and how often, or directions for use if it is for external use'),
        yas12: m('Person under 12 years: age in years and months, written in words'),
        dis: m('Dentist: includes the words “for dental treatment only”'),
        ebe: m('Midwife: includes the words “for midwifery use only”'),
        vet: m('Veterinarian: includes the words “for animal treatment only”'),
        kagit: m('Paper form: legible, indelible, and signed in the prescriber’s own handwriting'),
        sinif: m('Class A, Class B, or a specified Class C drug: paper form the Director-General provides, in the prescriber’s handwriting, or an electronic form sent through a system named by notice in the Gazette'),
      },
      sayilar: { isaretli: m('Points recorded') },
      not: m('A record of those points. It is not a prescription and nothing is sent. A methadone prescription from a medical practitioner, nurse practitioner, or designated prescriber nurse at a place the Minister specifies may also be on another form the Director-General provides. An unusual dose is underlined on paper, with the prescriber’s initials in the margin. The prescription must not be in cipher. It does nothing else. Whether to write it is the doctor’s.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Parliamentary Counsel Office (New Zealand legislation)',
      kaynak: 'No copyright in New Zealand legislation, https://www.legislation.govt.nz/copyright/, read 2026-10-14. Regulation 29, as at 5 July 2024, https://www.legislation.govt.nz/regulation/public/1977/0037/latest/whole.html, read 2026-10-14',
      bildirim: m('Points from the Misuse of Drugs Regulations 1977, regulation 29, as at 5 July 2024. There is no copyright in New Zealand legislation.'),
    },
  }
}

export const NZ_NZEPS_ADRESI = 'https://www.tewhatuora.govt.nz/health-services-and-programmes/digital-health/emedicines-and-the-new-zealand-e-prescription-service'

export function nzNzeps(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'nz-nzeps-link',
    roller: [...hekimler], sinif: 'hekimler',
    metin: {
      ad: m('New Zealand ePrescription Service (link)'),
      aciklama: m('Opens the Health New Zealand page about the e-medicines programme, including the ePrescription service. This product does not call that service and does not sign in.'),
      alanlar: {},
      not: m('The page describes a broker between a prescriber and a community pharmacy. It does not state how a new product registers. Nothing from the patient file is sent. Whether to use the service is the doctor\'s decision.'),
      baglanti: m('Open the e-medicines page'),
    },
    baglanti: { adres: NZ_NZEPS_ADRESI },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Health New Zealand | Te Whatu Ora',
      kaynak: `A link only. The page was read 2026-10-14: ${NZ_NZEPS_ADRESI}. No call is made. The page names the service and does not state a registration form.`,
      bildirim: m('A link to a Health New Zealand page. This tile does not copy that page. This product is not Health New Zealand\'s.'),
    },
  }
}
