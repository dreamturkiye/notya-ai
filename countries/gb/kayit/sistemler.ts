/**
 * National record and prescribing services for England, as read on 14 October 2026.
 * `bagli: false` on every row: this product calls none of them.
 * Registration steps are only what those pages stated. A step that was not on the page is not here.
 */
export type GbKayitSistemi = {
  anahtar: string
  ad: string
  adres: string
  bagli: false
  okundu: string
  neIcin: string
  kayit: readonly string[]
}

export const GB_KAYIT_SISTEMLERI: readonly GbKayitSistemi[] = [
  {
    anahtar: 'eps',
    ad: 'Electronic Prescription Service',
    adres: 'https://digital.nhs.uk/services/electronic-prescription-service',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'Sends a prescription to a dispenser the patient has nominated. NHS England Digital says it is not itself a clinical prescribing system. Primary care in England and Wales; secondary and community care in England.',
    kayit: [
      'Authentication to update a record is through the Care Identity Service.',
      'A system supplier asks epsonboarding@nhs.net about onboarding.',
      'Live service support is epssupport@nhs.net. Implementation questions go to england.digitalmedicines@nhs.net.',
      'Wales is Digital Health and Care Wales, not this England page.',
    ],
  },
  {
    anahtar: 'spine',
    ad: 'Spine',
    adres: 'https://digital.nhs.uk/services/spine',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'The messaging platform that hosts the Electronic Prescription Service, the Personal Demographics Service, GP Connect, the National Care Records Service and the Summary Care Record. England, Wales and the Isle of Man.',
    kayit: [
      'Most users reach Spine through a clinical system or the Spine portal. This product does not.',
      'A computer system that reaches NHS England services through Spine has to meet the Warrantied Environment Specification, and an application that needs a smartcard or other approved authenticator has to follow those terms.',
      'An organisation that already has Spine services can ask for them to be enabled over the internet. The Health and Social Care Network remains available during that change.',
      'Live service: National Service Desk, ssd.nationalservicedesk@nhs.net, 0300 303 5035.',
    ],
  },
  {
    anahtar: 'gp-connect',
    ad: 'GP Connect',
    adres: 'https://digital.nhs.uk/services/gp-connect',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'Access to a GP record in England for direct care away from the registered practice, through an approved clinical system. The page says you cannot sign up to GP Connect as its own login.',
    kayit: [
      'A health or care organisation uses it only through a supplier system that has completed national onboarding and assurance.',
      'The page\'s next steps for a new consumer are: review the prerequisites, check assurance on the consumer portal, and submit a use case.',
      'Onboarding: england.gpconnectonboarding@nhs.net. The GP Connect National Data Sharing Arrangement sets the sharing obligations.',
      'A record is available when the patient is registered with a GP in England, that GP system supports GP Connect and has gone live, and the patient has not opted out.',
    ],
  },
  {
    anahtar: 'scr',
    ad: 'Summary Care Record',
    adres: 'https://digital.nhs.uk/services/summary-care-records-scr',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'A national summary from the GP record: medicines, allergies and reactions, and additional information unless the patient has opted out of that part. England.',
    kayit: [
      'There is no Summary Care Record screen of its own. Staff view it through a local system, the National Care Records Service, or a supplier integration. This product has none of those.',
      'Viewing needs a legitimate relationship with the patient. The page says permission should be asked, and that urgent care may proceed in the patient\'s best interests when it cannot be asked.',
      'A smartcard with the right role-based access codes, on a machine signed in to the secure NHS network, is one route the page describes. The National Care Records Service also describes biometric and multifactor sign-in.',
      'Suppliers: Summary Care Record FHIR API (the page says currently only for GP software), the HL7 V3 API, or the National Care Records Service. Testing enquiries: sa.servicedesk@nhs.net.',
    ],
  },
  {
    anahtar: 'nhs-login',
    ad: 'NHS login',
    adres: 'https://digital.nhs.uk/services/nhs-login',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'A patient identity for digital health and care services in England, including the NHS App. It is not the staff smartcard used for Spine.',
    kayit: [
      'A patient-facing service can ask to use it when the service aligns with the NHS Long Term Plan and is commissioned or sponsored by an NHS organisation.',
      'Where a service has a commissioned part and a private part, the page says only the commissioned part can use NHS login.',
      'The page points partners to its "integrating with NHS login" onboarding. This product has not started that.',
      'The page names DAPB3051, the identity verification and authentication standard, as mandatory for patient-facing digital health and care services.',
    ],
  },
]
