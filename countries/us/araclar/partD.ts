/**
 * UNITED STATES — the Part D claim list and a prescription note that is not sent.
 * Switched on without a clinician's sign-off (./onayBekleyen.ts).
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'
import { BOS_SONUC, metin, sayi, secim } from '@/lib/ulke/araclar/yardimci'
import { US_ILACLAR, US_ILAC_KAYIT, usIlacAnahtari, usIlacBul, usIlacCumlesi } from '../referans/ilaclar'

const D = 'en-US'
const m = (metin: string): BicimliMetin => ({ [D]: metin })

const ANAHTARLAR = US_ILACLAR.map((r) => usIlacAnahtari(r.rank))
const CUMLELER = Object.fromEntries(US_ILACLAR.map((r) => [usIlacAnahtari(r.rank), m(usIlacCumlesi(r))]))
const KAYNAK = `Centers for Medicare & Medicaid Services. Medicare Part D Spending by Drug, ${US_ILAC_KAYIT.year}, manufacturer field Overall. ${US_ILAC_KAYIT.portalUrl}. Retrieved ${US_ILAC_KAYIT.retrieved}.`

function sonuc(anahtar: unknown, uyarilar: readonly string[]) {
  const satir = usIlacBul(anahtar)
  if (!satir) return BOS_SONUC
  return {
    tamam: true,
    sayilar: [{ anahtar: 'sira', deger: satir.rank, ondalik: 0, enCok: US_ILACLAR.length }],
    bant: usIlacAnahtari(satir.rank),
    uyarilar,
    tarihler: [],
  }
}

const LISANS = {
  durum: 'serbest' as const,
  hakSahibi: 'Centers for Medicare & Medicaid Services',
      kaynak: `Dataset page read 2026-10-14 (${US_ILAC_KAYIT.portalUrl}): it calls the file a Public Use File (Free). USAGov, "Learn about copyright and federal government materials", updated April 30, 2026 (${US_ILAC_KAYIT.licenceUrl}): a U.S. government work is a work of an officer or employee as part of official duties; not every file on a federal site is one; use must not imply endorsement. For the lawyer: whether this extract is a government work.`,
  bildirim: m('Source: Centers for Medicare & Medicaid Services, Medicare Part D Spending by Drug, 2024 claims, manufacturer rows marked Overall. Public Use File. Use of this material does not imply endorsement of this product by CMS or the United States Government. Medicare Part D only: not all prescriptions. No strength, dosage form, or controlled-substance schedule is in the table.'),
}

export const US_PART_D: AracTanimi = {
  anahtar: 'us-part-d-medicines',
  tur: 'liste',
  alanlar: [secim('ilac', ANAHTARLAR)],
  cikti: { sayilar: ['sira'], bantlar: ANAHTARLAR, uyarilar: ['takvim_yok'], tarihler: [] },
  kaynak: KAYNAK,
  hesapla: (g) => sonuc(g.ilac, ['takvim_yok']),
}

export const US_RECETE: AracTanimi = {
  anahtar: 'us-prescription-note',
  tur: 'liste',
  alanlar: [secim('ilac', ANAHTARLAR), sayi('miktar', 0.01, 9999, { istege: true }), metin('yon')],
  cikti: { sayilar: ['sira'], bantlar: ANAHTARLAR, uyarilar: ['takvim_yok', 'iletilmedi'], tarihler: [] },
  kaynak: KAYNAK,
  hesapla: (g) => sonuc(g.ilac, ['takvim_yok', 'iletilmedi']),
}

export function usPartDAraclari(hekimler: readonly string[]): readonly PaketAraci[] {
  const roller = [...hekimler]
  return [
    {
      anahtar: 'us-part-d-medicines',
      roller, sinif: 'hekimler',
      metin: {
        ad: m('Medicare Part D drugs by 2024 claims'),
        aciklama: m('The 250 drugs with the most Medicare Part D claims in 2024, counting every manufacturer together. Choosing one shows that row. It is a closed list. A drug that is not on it cannot be recorded here. This is not an all-payer ranking.'),
        alanlar: { ilac: m('Drug') },
        secenekler: { ilac: CUMLELER },
        sayilar: { sira: m('Rank by Part D claims') },
        bantlar: CUMLELER,
        uyarilar: { takvim_yok: m('This table states no strength, no dosage form, and no controlled-substance schedule.') },
        not: m('Self-administered drugs paid under Medicare Part D. Over-the-counter claims are excluded. Not a prescribing decision: diagnosis and treatment are the doctor\'s.'),
      },
      lisans: LISANS,
    },
    {
      anahtar: 'us-prescription-note',
      roller, sinif: 'hekimler',
      metin: {
        ad: m('Prescription note (not sent)'),
        aciklama: m('A note of one drug from the same Part D list, plus a quantity and directions you type yourself. The quantity is not a dose the tool suggests. The note is not sent anywhere.'),
        alanlar: {
          ilac: m('Drug'),
          miktar: m('Quantity you are writing'),
          yon: m('Directions you are writing'),
        },
        secenekler: { ilac: CUMLELER },
        sayilar: { sira: m('Rank by Part D claims') },
        bantlar: CUMLELER,
        uyarilar: {
          takvim_yok: m('This table states no strength, no dosage form, and no controlled-substance schedule.'),
          iletilmedi: m('This note is not sent to a pharmacy or to a payer.'),
        },
        not: m('Not a controlled-substance prescription and not a transmission. Federal writing rules for those prescriptions were not loaded: the regulation site blocked automated reading on 14 October 2026. Diagnosis and treatment are the doctor\'s.'),
      },
      lisans: LISANS,
    },
  ]
}

export const US_BLUE_BUTTON_ADRESI = 'https://bluebutton.cms.gov/'

export function usBlueButton(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'us-blue-button-link',
    roller: [...hekimler], sinif: 'hekimler',
    metin: {
      ad: m('Medicare Blue Button (link)'),
      aciklama: m('Opens the CMS Blue Button page. This product does not call that API and does not sign in.'),
      alanlar: {},
      not: m('The page describes a standards-based API for Medicare Part A, B, and D claims, a developer sandbox, and access that a person with Medicare allows. Nothing from the patient file is sent. Whether to use it is the doctor\'s decision.'),
      baglanti: m('Open the Blue Button page'),
    },
    baglanti: { adres: US_BLUE_BUTTON_ADRESI },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Centers for Medicare & Medicaid Services',
      kaynak: 'A link only. The page was read 2026-10-14: https://bluebutton.cms.gov/. No call is made. The developer documentation URL was not retrieved that day, so no conformance steps are stated on this tile.',
      bildirim: m('Blue Button is a service of the Centers for Medicare & Medicaid Services. This tile only links to its page. Use of this link does not imply endorsement of this product by the Centers for Medicare & Medicaid Services.'),
    },
  }
}
