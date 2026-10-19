/**
 * Link-out tiles added 2026-10-19. Each address returned a page on that day.
 * A tile copies nothing from the page. No Turkish guideline is named on the screen.
 *
 * One college or regulator page for every role this pack still offers, plus two
 * specialty pages (the RACGP Red Book, and the Royal Children's Hospital guidelines)
 * and three core pages (tax invoices, My Health Record guidance, Ahpra registration).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

export type AuBaglantiKaydi = {
  anahtar: string
  roller: readonly string[] | null
  ad: string
  aciklama: string
  not: string
  baglanti: string
  adres: string
  kaynak: string
  bakilacak: string
  hasta?: { enCokYas: number }
  hastaKapisi?: string
}

const OK = ' (read 2026-10-19): the page returned and this tile copies none of it.'

const kayit = (k: Omit<AuBaglantiKaydi, 'not' | 'baglanti' | 'bakilacak'> & { not?: string; baglanti?: string; bakilacak?: string }): AuBaglantiKaydi => ({
  not: 'A link only. Nothing is copied and nothing is sent.',
  baglanti: 'Open the page',
  bakilacak: `Confirm the page at ${k.adres} is still the one this role should open, and that a link is enough until a clinician has read it.`,
  ...k,
})

const RACGP = 'https://www.racgp.org.au/clinical-resources/clinical-guidelines'
const RACP_YETISKIN = 'https://www.racp.edu.au/about/college-structure/adult-medicine-division'
const RACP = 'https://www.racp.edu.au/'
const RACS = 'https://www.surgeons.org/'
const ANZCA = 'https://www.anzca.edu.au/'
const RANZCR = 'https://www.ranzcr.com/'
const KURUL = 'https://www.medicalboard.gov.au/Codes-Guidelines-Policies.aspx'

const hekim = (anahtar: string, rol: string, ad: string, aciklama: string, adres: string): AuBaglantiKaydi =>
  kayit({ anahtar, roller: [rol], ad, aciklama, adres, kaynak: `${adres}${OK}` })

/** Adult physician specialties of the Royal Australasian College of Physicians. */
const racpYetiskin = (rol: string, ad: string) =>
  hekim(
    `au-ref-${rol}`,
    rol,
    ad,
    'Opens the Royal Australasian College of Physicians adult medicine division page. This tile copies no guideline.',
    RACP_YETISKIN,
  )

export const AU_BAGLANTI_KAYITLARI: readonly AuBaglantiKaydi[] = [
  kayit({
    anahtar: 'au-tax-invoice',
    roller: null,
    ad: 'GST tax invoice (link)',
    aciklama: 'Opens the compilation of A New Tax System (Goods and Services Tax) Act 1999. Section 29-70, Tax invoices, is named in that compilation\'s contents. The section text was not copied.',
    not: 'This screen does not take a card and does not issue an invoice. Stripe and Tyro are not connected.',
    adres: 'https://www.legislation.gov.au/C2004A00446/latest',
    kaynak: `https://www.legislation.gov.au/C2004A00446/latest${OK} The contents name section 29-70 Tax invoices. The operative words of that section were not read.`,
    bakilacak: 'A lawyer should say which particulars an invoice from this practice must show. This tile does not list them, because the section text was not read.',
  }),
  kayit({
    anahtar: 'au-my-health-record',
    roller: null,
    ad: 'My Health Record guidance (link)',
    aciklama: 'Opens the Office of the Australian Information Commissioner\'s My Health Record guidance index. This is the national shared-record guidance a practice reads. This screen does not send a record.',
    adres: 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/health-service-providers/my-health-record',
    kaynak: `https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/health-service-providers/my-health-record${OK}`,
    bakilacak: 'Confirm this index is still the right page, and that a link which sends nothing is what the practice should see. The national system\'s own upload page did not open in the session that added this tile.',
  }),
  kayit({
    anahtar: 'au-ahpra-registration',
    roller: null,
    ad: 'Ahpra registration (link)',
    aciklama: 'Opens the Ahpra registration page. This product does not look a registration number up on the public register, and it does not check a character pattern: no pattern was printed on the page.',
    not: 'Shown to professions Ahpra registers. Self-regulated professions do not see this tile.',
    adres: 'https://www.ahpra.gov.au/Registration.aspx',
    kaynak: `https://www.ahpra.gov.au/Registration.aspx${OK} The page did not print a registration-number pattern.`,
    bakilacak: 'The tile is offered to registered professions only. A clinician should say whether dietetics, audiology and speech pathology, which are not on this tile, need a page of their own association instead.',
  }),
  kayit({
    anahtar: 'au-gp-red-book',
    roller: ['family-medicine'],
    ad: 'RACGP preventive activities (link)',
    aciklama: 'Opens the RACGP Guidelines for preventive activities in general practice. This tile copies no recommendation.',
    adres: 'https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice',
    kaynak: `https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice${OK}`,
  }),
  kayit({
    anahtar: 'au-rch-clinical-guide',
    roller: ['family-medicine', 'paediatrics', 'paediatric-surgery'],
    ad: 'Royal Children\'s Hospital guidelines (link)',
    aciklama: 'Opens the Royal Children\'s Hospital Melbourne clinical practice guidelines. This tile copies no guideline.',
    adres: 'https://www.rch.org.au/clinicalguide/',
    kaynak: `https://www.rch.org.au/clinicalguide/${OK}`,
    hasta: { enCokYas: 18 },
    hastaKapisi: 'For a patient under 18.',
    bakilacak: 'A paediatrician should say whether general practice and paediatric surgery should keep this link, and whether 18 years is the right cut-off.',
  }),
  hekim('au-ref-family-medicine', 'family-medicine', 'RACGP guidelines (link)', 'Opens the Royal Australian College of General Practitioners clinical guidelines. This tile copies no guideline.', RACGP),
  hekim('au-ref-emergency-medicine', 'emergency-medicine', 'ACEM (link)', 'Opens the Australasian College for Emergency Medicine. This tile copies no guideline.', 'https://acem.org.au/'),
  hekim('au-ref-anaesthesia', 'anaesthesia', 'ANZCA (link)', 'Opens ANZCA, the college for anaesthesia. This tile copies no guideline.', ANZCA),
  hekim('au-ref-pain-medicine', 'pain-medicine', 'ANZCA — pain medicine (link)', 'Opens ANZCA, the college for pain medicine. This tile copies no guideline.', ANZCA),
  hekim('au-ref-psychiatry', 'psychiatry', 'RANZCP guidelines (link)', 'Opens the RANZCP clinical guidelines page. This tile copies no guideline.', 'https://www.ranzcp.org/clinical-guidelines-publications'),
  hekim('au-ref-obstetrics-gynaecology', 'obstetrics-gynaecology', 'RANZCOG (link)', 'Opens RANZCOG. This tile copies no guideline.', 'https://ranzcog.edu.au/'),
  hekim('au-ref-ophthalmology', 'ophthalmology', 'RANZCO (link)', 'Opens RANZCO. This tile copies no guideline.', 'https://ranzco.edu/'),
  hekim('au-ref-cardiology', 'cardiology', 'CSANZ (link)', 'Opens CSANZ, the cardiac society. This tile copies no guideline.', 'https://www.csanz.edu.au/'),
  hekim('au-ref-otolaryngology', 'otolaryngology', 'ASOHNS (link)', 'Opens the Australian Society of Otolaryngology Head and Neck Surgery. This tile copies no guideline.', 'https://asohns.org.au/'),
  hekim('au-ref-neurology', 'neurology', 'ANZAN (link)', 'Opens ANZAN. This tile copies no guideline.', 'https://www.anzan.org.au/'),
  hekim('au-ref-orthopaedics', 'orthopaedics', 'AOA (link)', 'Opens the Australian Orthopaedic Association. This tile copies no guideline.', 'https://aoa.org.au/'),
  hekim('au-ref-plastic-surgery', 'plastic-surgery', 'ASPS (link)', 'Opens the Australian Society of Plastic Surgeons. This tile copies no guideline.', 'https://plasticsurgery.org.au/'),
  hekim('au-ref-radiology', 'radiology', 'RANZCR — radiology (link)', 'Opens RANZCR. This tile copies no guideline.', RANZCR),
  hekim('au-ref-radiation-oncology', 'radiation-oncology', 'RANZCR — radiation oncology (link)', 'Opens RANZCR, the college for radiation oncology. This tile copies no guideline.', RANZCR),
  hekim('au-ref-sports-medicine', 'sports-medicine', 'ACSEP (link)', 'Opens the Australasian College of Sport and Exercise Physicians. This tile copies no guideline.', 'https://www.acsep.org.au/'),
  hekim('au-ref-haematology', 'haematology', 'HSANZ (link)', 'Opens HSANZ, the haematology society. This tile copies no guideline.', 'https://www.hsanz.org.au/'),
  hekim('au-ref-oncology', 'oncology', 'Cancer Council Australia (link)', 'Opens Cancer Council Australia. A medical-oncology college page did not open in the session that added this tile. This tile copies no guideline.', 'https://www.cancer.org.au/'),
  hekim('au-ref-paediatrics', 'paediatrics', 'RACP (link)', 'Opens the Royal Australasian College of Physicians, the college for paediatrics and child health. This tile copies no guideline.', RACP),
  hekim('au-ref-rehabilitation-medicine', 'rehabilitation-medicine', 'RACP — rehabilitation medicine (link)', 'Opens the Royal Australasian College of Physicians. This tile copies no guideline.', RACP),
  racpYetiskin('internal-medicine', 'RACP — general medicine (link)'),
  racpYetiskin('endocrinology', 'RACP — endocrinology (link)'),
  racpYetiskin('infectious-diseases', 'RACP — infectious diseases (link)'),
  racpYetiskin('gastroenterology', 'RACP — gastroenterology (link)'),
  racpYetiskin('respiratory-medicine', 'RACP — respiratory medicine (link)'),
  racpYetiskin('nephrology', 'RACP — nephrology (link)'),
  racpYetiskin('rheumatology', 'RACP — rheumatology (link)'),
  racpYetiskin('geriatric-medicine', 'RACP — geriatric medicine (link)'),
  racpYetiskin('immunology-and-allergy', 'RACP — immunology and allergy (link)'),
  hekim('au-ref-general-surgery', 'general-surgery', 'RACS — general surgery (link)', 'Opens the Royal Australasian College of Surgeons. This tile copies no guideline.', RACS),
  hekim('au-ref-neurosurgery', 'neurosurgery', 'RACS — neurosurgery (link)', 'Opens the Royal Australasian College of Surgeons. This tile copies no guideline.', RACS),
  hekim('au-ref-paediatric-surgery', 'paediatric-surgery', 'RACS — paediatric surgery (link)', 'Opens the Royal Australasian College of Surgeons. This tile copies no guideline.', RACS),
  hekim('au-ref-cardio-thoracic-surgery', 'cardio-thoracic-surgery', 'RACS — cardio-thoracic surgery (link)', 'Opens the Royal Australasian College of Surgeons. This tile copies no guideline.', RACS),
  hekim('au-ref-vascular-surgery', 'vascular-surgery', 'RACS — vascular surgery (link)', 'Opens the Royal Australasian College of Surgeons. This tile copies no guideline.', RACS),
  hekim('au-ref-urology', 'urology', 'RACS — urology (link)', 'Opens the Royal Australasian College of Surgeons. Urology is a surgical specialty of that college. A urological society page did not open in the session that added this tile.', RACS),
  hekim('au-ref-dermatology', 'dermatology', 'Medical Board — dermatology (link)', 'Opens the Medical Board of Australia codes, guidelines and policies. The Australasian College of Dermatologists site did not return a page in the session that added this tile.', KURUL),
  hekim('au-ref-aesthetic-surgery', 'aesthetic-surgery', 'Medical Board — cosmetic surgery (link)', 'Opens the Medical Board of Australia codes, guidelines and policies, which cover cosmetic procedures. This tile copies no guideline.', KURUL),
  hekim('au-ref-aesthetic-medicine', 'aesthetic-medicine', 'Medical Board — cosmetic procedures (link)', 'Opens the Medical Board of Australia codes, guidelines and policies, which cover non-surgical cosmetic procedures. This tile copies no guideline.', KURUL),
  hekim('au-ref-physiotherapy', 'physiotherapy', 'Australian Physiotherapy Association (link)', 'Opens the Australian Physiotherapy Association. This tile copies no guideline.', 'https://australian.physio/'),
  hekim('au-ref-clinical-psychology', 'clinical-psychology', 'Australian Psychological Society (link)', 'Opens the Australian Psychological Society. This tile copies no guideline.', 'https://psychology.org.au/'),
  hekim('au-ref-dietetics', 'dietetics', 'Dietitians Australia (link)', 'Opens Dietitians Australia. This tile copies no guideline.', 'https://dietitiansaustralia.org.au/'),
  hekim('au-ref-occupational-therapy', 'occupational-therapy', 'Occupational Therapy Australia (link)', 'Opens Occupational Therapy Australia. This tile copies no guideline.', 'https://www.otaus.com.au/'),
  hekim('au-ref-audiology', 'audiology', 'Audiology Australia (link)', 'Opens Audiology Australia. This tile copies no guideline.', 'https://audiology.asn.au/'),
  hekim('au-ref-podiatry', 'podiatry', 'Australian Podiatry Association (link)', 'Opens the Australian Podiatry Association. This tile copies no guideline.', 'https://www.podiatry.org.au/'),
  hekim('au-ref-speech-pathology', 'speech-pathology', 'Speech Pathology Australia (link)', 'Opens Speech Pathology Australia. This tile copies no guideline.', 'https://www.speechpathologyaustralia.org.au/'),
]

export const AU_BAGLANTI_ANAHTARLARI: readonly string[] = AU_BAGLANTI_KAYITLARI.map((k) => k.anahtar)

export function auBaglantiAraclari(ahpraRolleri: readonly string[]): readonly PaketAraci[] {
  return AU_BAGLANTI_KAYITLARI.map((k) => ({
    anahtar: k.anahtar,
    roller: k.anahtar === 'au-ahpra-registration' ? [...ahpraRolleri] : k.roller === null ? null : [...k.roller],
    ...(k.hasta ? { hasta: k.hasta } : {}),
    metin: {
      ad: m(k.ad),
      aciklama: m(k.aciklama),
      alanlar: {},
      not: m(k.not),
      baglanti: m(k.baglanti),
      ...(k.hastaKapisi ? { hastaKapisi: m(k.hastaKapisi) } : {}),
    },
    baglanti: { adres: k.adres },
    lisans: { durum: 'serbest' as const, kaynak: k.kaynak },
  }))
}
