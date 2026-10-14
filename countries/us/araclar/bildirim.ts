/**
 * UNITED STATES — rows of the 2026 national notification protocol.
 * Read 14 October 2026 from the PDF cited below. A tick is a row of that
 * protocol. It is not a notice, and it is not a state's own reportable list.
 * The animal-rabies circumstance sentence that contains a banned claim-word
 * is not copied; the circumstances themselves are.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'

const D = 'en-US'
const m = (metin: string): BicimliMetin => ({ [D]: metin })

export const US_BILDIRIM_SAYFASI = 'https://ndc.services.cdc.gov/wp-content/uploads/NNC_Notification_Requirements_2026_v2.pdf'
const CDC = 'Centers for Disease Control and Prevention'
const MALZEME = 'https://www.cdc.gov/other/agencymaterials.html'

const SATIRLAR: readonly { anahtar: string; etiket: string }[] = [
  { anahtar: 'anthrax', etiket: 'Anthrax. Immediately notifiable, extremely urgent, confirmed and probable cases: source of infection not recognized; recognized bioterrorism exposure or potential mass exposure; serious illness of naturally occurring anthrax. Immediately notifiable, urgent, confirmed and probable cases: naturally occurring or occupational, responding to treatment. The protocol names the subclassifications cutaneous, ingestion, inhalation, injection, and welder’s anthrax.' },
  { anahtar: 'botulism', etiket: 'Botulism. Immediately notifiable, extremely urgent, all cases prior to classification: foodborne (except endemic to Alaska); intentional or suspected intentional release; infant botulism (clusters or outbreaks); cases of unknown etiology or not meeting standard notification criteria. Routinely notifiable, all cases prior to classification: infant, sporadic cases; wound, sporadic cases.' },
  { anahtar: 'plague', etiket: 'Plague. Immediately notifiable, extremely urgent, all cases prior to classification: suspected intentional release. Routinely notifiable, all cases prior to classification: all cases not suspected to be intentional.' },
  { anahtar: 'sars', etiket: 'SARS-associated coronavirus. Immediately notifiable, extremely urgent. All cases prior to classification.' },
  { anahtar: 'smallpox', etiket: 'Smallpox. Immediately notifiable, extremely urgent. Confirmed and probable cases.' },
  { anahtar: 'tularemia', etiket: 'Tularemia. Immediately notifiable, extremely urgent, confirmed, probable, and suspected cases: suspected intentional release. Routinely notifiable, confirmed and probable cases: all cases other than suspected intentional release.' },
  { anahtar: 'vhf', etiket: 'Viral hemorrhagic fevers. Immediately notifiable, extremely urgent, confirmed and suspected cases: suspected intentional release for suspected and confirmed cases. Immediately notifiable, urgent, confirmed and suspected cases: all suspected and confirmed cases other than suspected intentional. The protocol names Chapare virus, Crimean-Congo, Ebola, Guanarito, Junín (Argentine), Lassa virus, Lujo virus, Machupo (Bolivian), Marburg virus, Rift Valley fever virus, and Sabia-associated (Brazilian).' },
  { anahtar: 'brucellosis', etiket: 'Brucellosis. Immediately notifiable, urgent, confirmed and probable cases: multiple cases, temporally or spatially clustered. Routinely notifiable, confirmed and probable cases: cases not temporally or spatially clustered.' },
  { anahtar: 'cronobacter', etiket: 'Cronobacter invasive infection, infants. Immediately notifiable, urgent. Confirmed and probable cases.' },
  { anahtar: 'diphtheria', etiket: 'Diphtheria. Immediately notifiable, urgent. Confirmed cases.' },
  { anahtar: 'novel-flu', etiket: 'Novel influenza A virus infection. Immediately notifiable, urgent. Confirmed and probable cases.' },
  { anahtar: 'measles', etiket: 'Measles. Immediately notifiable, urgent. Confirmed cases.' },
  { anahtar: 'melioidosis', etiket: 'Melioidosis. Immediately notifiable, urgent. Confirmed and probable cases.' },
  { anahtar: 'mpox', etiket: 'Mpox. Immediately notifiable, urgent. Confirmed and probable cases.' },
  { anahtar: 'polio', etiket: 'Paralytic poliomyelitis. Immediately notifiable, urgent. Confirmed cases.' },
  { anahtar: 'polio-nonparalytic', etiket: 'Poliovirus infection, nonparalytic. Immediately notifiable, urgent. Confirmed cases.' },
  { anahtar: 'rabies-animal', etiket: 'Rabies, animal. Immediately notifiable, urgent, confirmed cases, for: detection of a case of rabies or non-rabies lyssavirus occurring in an animal imported from outside the continental United States within the previous 365 days, unless variant testing identifies a variant known to circulate in the United States; detection of a rabies virus variant or non-rabies lyssavirus in a new geographic area as determined by the jurisdiction; identification of sustained transmission of any rabies virus variant or non-rabies lyssavirus among animals of a previously unrecognized reservoir species for that virus or virus variant. Routinely notifiable, confirmed cases: positive and negative animal rabies test results that do not meet those immediate circumstances, no less frequently than monthly. The protocol also includes negative results from direct fluorescent antibody, direct rapid immunohistochemical test, immunohistochemistry on formalin-fixed tissues, and pan-lyssavirus real-time RT-PCR.' },
  { anahtar: 'rabies-human', etiket: 'Rabies, human. Immediately notifiable, urgent. Confirmed cases.' },
  { anahtar: 'rubella', etiket: 'Rubella. Immediately notifiable, urgent. Confirmed cases.' },
  { anahtar: 'anaplasmosis', etiket: 'Anaplasmosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'arboviral', etiket: 'Arboviral diseases. Routinely notifiable. Confirmed and probable cases. The protocol names: California encephalitis virus disease; California serogroup virus disease, neuroinvasive and non-neuroinvasive; Chikungunya virus disease; Eastern equine encephalitis virus disease, neuroinvasive and non-neuroinvasive; Jamestown Canyon virus disease, neuroinvasive and non-neuroinvasive; Keystone virus disease; La Crosse virus disease, neuroinvasive and non-neuroinvasive; Powassan virus disease, neuroinvasive and non-neuroinvasive; Snowshoe hare virus disease; St. Louis encephalitis virus disease, neuroinvasive and non-neuroinvasive; Trivittatus virus disease; Western equine encephalitis virus disease, neuroinvasive and non-neuroinvasive; West Nile virus disease, neuroinvasive and non-neuroinvasive.' },
  { anahtar: 'babesiosis', etiket: 'Babesiosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'campylobacteriosis', etiket: 'Campylobacteriosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'cancer', etiket: 'Cancer. Routinely notifiable. Confirmed cases. The protocol says notification for all confirmed cases of cancer should be made at least annually.' },
  { anahtar: 'candida-clinical', etiket: 'Candida auris, clinical. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'candida-screening', etiket: 'Candida auris, screening. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'cpo-clinical', etiket: 'Carbapenemase-producing organisms, clinical. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'cpo-screening', etiket: 'Carbapenemase-producing organisms, screening. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'chancroid', etiket: 'Chancroid. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'chlamydia', etiket: 'Chlamydia trachomatis infection. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'coccidioidomycosis', etiket: 'Coccidioidomycosis. Routinely notifiable. Confirmed and probable cases. The protocol says jurisdictions are grouped into high- and low-incidence categories, that only Arizona and California are classified as high-incidence jurisdictions currently, that probable cases are only reported from low-incidence jurisdictions, and that confirmed cases are reported from both.' },
  { anahtar: 'covid-pediatric', etiket: 'COVID-19-associated pediatric mortality. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'cryptosporidiosis', etiket: 'Cryptosporidiosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'cyclosporiasis', etiket: 'Cyclosporiasis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'dengue', etiket: 'Dengue virus infections. Routinely notifiable. Confirmed, probable, and suspected cases. The protocol says these include dengue and severe dengue.' },
  { anahtar: 'ehrlichiosis', etiket: 'Ehrlichiosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'stec', etiket: 'Escherichia coli, Shiga toxin-producing. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'foodborne', etiket: 'Foodborne disease outbreaks. Routinely notifiable. Confirmed outbreaks. The protocol says outbreaks are defined by state and local health departments, and that all situations deemed by a local or state health department to be an outbreak are notifiable.' },
  { anahtar: 'giardiasis', etiket: 'Giardiasis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'gonorrhea', etiket: 'Gonorrhea. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'hib', etiket: 'Haemophilus influenzae, invasive disease. Routinely notifiable. All cases prior to classification.' },
  { anahtar: 'leprosy', etiket: 'Leprosy (Hansen’s disease). Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'hantavirus', etiket: 'Hantavirus pulmonary syndrome. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'hus', etiket: 'Hemolytic uremic syndrome, post-diarrheal. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'hep-a', etiket: 'Hepatitis A, acute. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'hep-b-acute', etiket: 'Hepatitis B, acute. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'hep-b-chronic', etiket: 'Hepatitis B, chronic. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'hep-b-perinatal', etiket: 'Hepatitis B, perinatal infection. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'hep-c-acute', etiket: 'Hepatitis C, acute. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'hep-c-chronic', etiket: 'Hepatitis C, chronic. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'hep-c-perinatal', etiket: 'Hepatitis C, perinatal infection. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'hiv', etiket: 'HIV infection. Routinely notifiable. Confirmed cases of HIV infection, and perinatally exposed infants prior to classification.' },
  { anahtar: 'flu-pediatric', etiket: 'Influenza-associated mortality, pediatric. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'ipd', etiket: 'Invasive pneumococcal disease. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'lead', etiket: 'Lead in blood. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'legionellosis', etiket: 'Legionellosis. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'leptospirosis', etiket: 'Leptospirosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'listeriosis', etiket: 'Listeriosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'lyme', etiket: 'Lyme disease. Routinely notifiable. Confirmed and probable cases. The protocol says jurisdictions are grouped into high- and low-incidence categories, that confirmed cases are only reported from low-incidence jurisdictions, and that probable and suspected cases are reported from both.' },
  { anahtar: 'malaria', etiket: 'Malaria. Routinely notifiable. Confirmed and suspected cases.' },
  { anahtar: 'meningococcal', etiket: 'Meningococcal disease (Neisseria meningitidis). Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'mumps', etiket: 'Mumps. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'oropouche-congenital', etiket: 'Oropouche, congenital. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'oropouche', etiket: 'Oropouche, non-congenital. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'pertussis', etiket: 'Pertussis. Routinely notifiable. All cases prior to classification.' },
  { anahtar: 'pesticide', etiket: 'Pesticide-related illness, acute (non-occupational and occupational). Routinely notifiable. Definite, probable, possible, and suspicious cases.' },
  { anahtar: 'psittacosis', etiket: 'Psittacosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'q-fever', etiket: 'Q fever (acute and chronic). Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'spotted-fever', etiket: 'Rickettsiosis, spotted fever. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'rubella-congenital', etiket: 'Rubella, congenital syndrome. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'paratyphi', etiket: 'Salmonella enterica serotypes Paratyphi A, B (tartrate negative) and C (S. Paratyphi infection). Routinely notifiable.' },
  { anahtar: 'typhi', etiket: 'Salmonella enterica Typhi (S. Typhi) infection. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'salmonellosis', etiket: 'Salmonellosis (excluding S. Typhi infection and S. Paratyphi infection). Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'shigellosis', etiket: 'Shigellosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'silicosis', etiket: 'Silicosis. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'visa', etiket: 'Staphylococcus aureus infection, vancomycin-intermediate. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'vrsa', etiket: 'Staphylococcus aureus infection, vancomycin-resistant. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'stss', etiket: 'Streptococcal toxic-shock syndrome. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'syphilis-primary', etiket: 'Syphilis, primary. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'syphilis-secondary', etiket: 'Syphilis, secondary. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'syphilis-early', etiket: 'Syphilis, early non-primary non-secondary. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'syphilis-late', etiket: 'Syphilis, unknown duration or late. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'syphilis-congenital', etiket: 'Syphilis, congenital. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'tetanus', etiket: 'Tetanus. Routinely notifiable. All cases prior to classification.' },
  { anahtar: 'tss', etiket: 'Toxic-shock syndrome (non-Streptococcus). Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'trichinellosis', etiket: 'Trichinellosis (trichinosis). Routinely notifiable. All cases prior to classification.' },
  { anahtar: 'tuberculosis', etiket: 'Tuberculosis. Routinely notifiable. Confirmed cases.' },
  { anahtar: 'varicella', etiket: 'Varicella. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'cholera', etiket: 'Vibrio cholerae infection (cholera). Routinely notifiable. Confirmed cases.' },
  { anahtar: 'vibriosis', etiket: 'Vibriosis. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'waterborne', etiket: 'Waterborne disease outbreaks. Routinely notifiable. All outbreaks.' },
  { anahtar: 'yellow-fever', etiket: 'Yellow fever. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'zika-congenital', etiket: 'Zika virus disease, congenital. Routinely notifiable. Confirmed and probable cases.' },
  { anahtar: 'zika', etiket: 'Zika virus disease, non-congenital. Routinely notifiable. Confirmed and probable cases.' },
]

export const US_BILDIRIM_ANAHTARLARI = SATIRLAR.map((a) => a.anahtar)

const ham = kontrolListesi({
  anahtar: 'us-notifiable-diseases',
  maddeler: US_BILDIRIM_ANAHTARLARI,
  uyarilar: ['kayit', 'gonderilmedi'],
  uyari: () => ['kayit', 'gonderilmedi'],
  kaynak: `${CDC}. Protocol for Public Health Agencies to Notify CDC about the Occurrence of Nationally Notifiable Conditions, 2026. Implemented January 1, 2026. Updated January 2, 2026. Opened 14 October 2026. ${US_BILDIRIM_SAYFASI}`,
})

/** The protocol length stays off the screen. */
export const US_BILDIRIM: AracTanimi = {
  ...ham,
  hesapla: (g, ortam) => {
    const s = ham.hesapla(g, ortam)
    if (!s.tamam) return s
    return { ...s, sayilar: s.sayilar.map(({ enCok: _enCok, ...kalan }) => kalan) }
  },
}

export function usBildirimAraci(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'us-notifiable-diseases',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Nationally notifiable conditions, 2026'),
      aciklama: m('Tick a row of the 2026 national notification protocol. One tick is a row you are reading. The tool does not notify anyone.'),
      alanlar: Object.fromEntries(SATIRLAR.map((a) => [a.anahtar, m(a.etiket)])),
      sayilar: { isaretli: m('Rows ticked') },
      uyarilar: {
        kayit: m('A tick records a row of the national protocol. A state or territorial list can differ, and this screen does not hold those lists.'),
        gonderilmedi: m('Nothing is sent to a health department or to CDC.'),
      },
      not: m('The protocol is written for public health agencies. It is not a prescription and not a case definition. Diagnosis and the decision to notify are the doctor\'s.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: CDC,
      kaynak: `Protocol read 2026-10-14 (${US_BILDIRIM_SAYFASI}). Agency materials page read 2026-10-10 (${MALZEME}): most information on CDC sites may be used without permission; credit the agency; the use must not imply endorsement; say the material is available from the agency at no charge.`,
      bildirim: m('Source: Centers for Disease Control and Prevention, "Protocol for Public Health Agencies to Notify CDC about the Occurrence of Nationally Notifiable Conditions, 2026" (updated January 2, 2026), available on the CDC website at no charge. Use of this material does not imply endorsement of this product by CDC, ATSDR, HHS or the United States Government.'),
    },
  }
}
