/**
 * AU-BETA-01 — official-site lookups and reference links. LINK-OUT ONLY: no drug, dose, schedule, price, threshold or
 * restriction is stored or shown by this product. Each entry carries the source line shown on the screen.
 *
 * Initial clinical draft – external clinician review later. Sources read 2026-10-22 (docs/au/SOURCES.md).
 */
import type { ReferansAramasi, ReferansBolumu, UlkeKayitSistemiBaglantisi } from '@/lib/ulke/uzanti/tipler'

export const AU_KLINIK_TASLAK = 'Initial clinical draft – external clinician review later.'

export const AU_REFERANS_ARAMALARI: readonly ReferansAramasi[] = [
  {
    anahtar: 'pbs',
    etiket: 'Check PBS schedule — medicine name',
    yerTutucu: 'Type a medicine name',
    adresSablonu: 'https://www.pbs.gov.au/search?term={q}&analyse=false&search-type=medicines',
    dugme: 'Check PBS schedule',
    not: 'Opens the PBS website’s own search in a new tab. Only the name you type is sent, and only when you press the button. This product shows no PBS listing, restriction, dose or price; check the schedule and decide for the patient yourself.',
    kaynak: 'Pharmaceutical Benefits Scheme, https://www.pbs.gov.au/ . The search address pattern is the one the PBS medicine-listing page (https://www.pbs.gov.au/browse/medicine-listing) uses for its own links; read 2026-10-22. The PBS data site (https://data.pbs.gov.au/) states no licence and its embargo data needs a login, so no PBS data is used here.',
  },
]

export const AU_REFERANS_BOLUMLERI: readonly ReferansBolumu[] = [
  {
    baslik: 'Immunisation references',
    aciklama: 'Where Australian vaccination advice and the register live. No vaccine, age or dose is shown here: the pages below are the authority, and they change.',
    taslakEtiketi: AU_KLINIK_TASLAK,
    baglantilar: [
      { etiket: 'National Immunisation Program (NIP) schedule', adres: 'https://www.health.gov.au/topics/immunisation/when-to-get-vaccinated/national-immunisation-program-schedule', aciklama: 'The Department of Health, Disability and Ageing’s page for the schedule. Open it for the current ages and vaccines.', kaynak: 'health.gov.au page above, opened 2026-10-22. Its text could not be read reliably (garbled tables, the only date on it is “1 July 2020”), so no schedule content is copied.' },
      { etiket: 'The Australian Immunisation Handbook', adres: 'https://immunisationhandbook.health.gov.au/', aciklama: 'Clinical advice from ATAGI, approved by NHMRC; includes the National Immunisation Catch-up Calculator.', kaynak: 'immunisationhandbook.health.gov.au, read 2026-10-22 (publisher: Australian Government Department of Health and Aged Care; no update date shown).' },
      { etiket: 'Australian Immunisation Register (AIR) — what it is', adres: 'https://www.health.gov.au/topics/immunisation/immunisation-information-for-health-professionals/using-the-australian-immunisation-register', aciklama: 'Reference only. This product does not submit anything to the AIR; the statutory reporting particulars are a checklist in Tools.', kaynak: 'health.gov.au page above, read 2026-10-22 (“a national database that tracks vaccinations”; no date shown).' },
    ],
  },
  {
    baslik: 'Clinical guideline references',
    aciklama: 'Public guidelines this build points to. No threshold, growth flag or preventive interval is copied from them into this product.',
    taslakEtiketi: AU_KLINIK_TASLAK,
    baglantilar: [
      { etiket: 'RACGP — Guidelines for preventive activities in general practice (Red Book)', adres: 'https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/red-book', aciklama: '10th edition, maintained as a web document.', kaynak: 'racgp.org.au page above, read 2026-10-22 (10th edition; no update date on the page).' },
      { etiket: 'RCH Melbourne — Clinical Practice Guidelines', adres: 'https://www.rch.org.au/clinicalguide/', aciklama: 'Paediatric guidelines from the Royal Children’s Hospital, Melbourne.', kaynak: 'rch.org.au/clinicalguide, read 2026-10-22 (publisher: The Royal Children’s Hospital Melbourne).' },
      { etiket: 'Pharmaceutical Benefits Scheme', adres: 'https://www.pbs.gov.au/browse/medicine-listing', aciklama: 'The medicine listing index.', kaynak: 'pbs.gov.au, read 2026-10-22.' },
    ],
  },
]

export const AU_KAYIT_SISTEMI: UlkeKayitSistemiBaglantisi = {
  ad: 'My Health Record',
  durum: { bagli: false, neden: 'Not connected in this beta' },
  baslik: 'My Health Record',
  aciklama: 'My Health Record is the national online health summary. This build has NO connection to it: it reads nothing from it and writes nothing to it. The upload conditions are a checklist in Tools (a tick is your own note).',
  baglanmadi: 'Not connected in this beta. No data is sent to or read from My Health Record.',
  kaynak: 'My Health Record, digitalhealth.gov.au (https://www.digitalhealth.gov.au/initiatives-and-programs/my-health-record), read 2026-10-22: an online record accessed through myGov. The page does not describe software conformance; none is claimed.',
}
