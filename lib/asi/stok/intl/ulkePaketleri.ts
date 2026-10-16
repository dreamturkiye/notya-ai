/**
 * NOTYA-ASI-STOK-BARKOD-01 Phase 2 — one `AsiStokUlkePaketi` per non-Turkey country module,
 * proving the Phase 1 engine (`lib/asi/stok/motor.ts`, `lib/asi/stok/barkod.ts`'s `gs1Coz()`)
 * is reusable as designed: every field below is DATA, and nothing in the engine changed to add
 * a sixth country. See `docs/ASI-STOK-INTL-01-research.md` for the full sourced research behind
 * every field here, and `docs/OPEN-COMMITMENTS.md` (`ASI-STOK-INTL-*`) for what remains open.
 *
 * `pediatriBransi: 'pediatri'` and `varsayilanAcikBranslar` are identical for all six countries
 * — confirmed by `lib/asi/stok/modul.ts` comparing against `SpecialtyKey`, the canonical,
 * non-localized 30-branş enum (the same fact `lib/asi/onam/intl/ulkePaketleri.ts` independently
 * verified by reading each `release/<cc>:lib/specialties/registry.ts` directly). Listed again
 * here per-pack only for explicitness/documentation, not because any country needs a different
 * list — the branş-key GATE itself needs zero country-specific code.
 *
 * Unlike `NOTYA-ASI-ONAM-01`'s country packs (which are deliberately empty `icerik: []`
 * placeholders because a vaccine CONSENT flow needs a vetted, per-vaccine content dataset this
 * phase chose not to rush), this feature was never going to need a pre-built catalog: a clinic's
 * stock is whatever lots it actually has on hand, scanned or entered by the doctor, not a
 * pre-vetted national vaccine list. So every pack below is fully populated with the three
 * researched facts that DO generalize across any clinic's stock: the barcode/data-carrier
 * standard on that country's vaccine packaging, whether a national digital immunization-record
 * system equivalent to e-Nabız exists to mark records export-ready for, and the legal
 * requirement (if any) to record the lot/batch number.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export type AsiStokGuvenDuzeyi = 'VERIFIED' | 'BEST-EFFORT' | 'MODERATE' | 'UNCONFIRMED'

export type AsiStokBarkodBilgisi = {
  /** Vaccine packaging's data-carrier standard. 'GS1' covers both DataMatrix(2D) and GS1-128/DataBar(1D) — gs1Coz() already decodes the shared AI set (01/17/10/21) regardless of which. */
  standart: 'GS1' | 'bilinmiyor'
  guven: AsiStokGuvenDuzeyi
  not: string
  kaynaklar: readonly string[]
}

export type AsiStokDijitalKayitSistemi = {
  /** false = no e-Nabız-style export target exists (or none confirmed) for this country — honest absence, not a placeholder. */
  varMi: boolean
  adi: string | null
  /** 'ulusal' = one system covers the whole country; 'bolgesel-parcali' = fragmented by state/province/devolved nation; null = not applicable (varMi: false). */
  kapsam: 'ulusal' | 'bolgesel-parcali' | null
  /** true/false = confirmed; null = exists but mandatory-reporting status not independently confirmed. */
  zorunluMu: boolean | null
  not: string
  kaynaklar: readonly string[]
}

export type AsiStokLotTakipHukuku = {
  guven: AsiStokGuvenDuzeyi
  not: string
  kaynaklar: readonly string[]
}

export type AsiStokUlkePaketi = {
  ulkeKodu: string
  dil: string
  pediatriBransi: SpecialtyKey
  varsayilanAcikBranslar: readonly SpecialtyKey[]
  barkod: AsiStokBarkodBilgisi
  dijitalKayitSistemi: AsiStokDijitalKayitSistemi
  lotTakipHukuku: AsiStokLotTakipHukuku
}

/** Aynı 5 branş — hiçbir ülkede farklı değil, bkz. dosya başı not. */
const VARSAYILAN_ACIK_BRANSLAR: readonly SpecialtyKey[] = [
  'pediatri',
  'aile-hekimligi',
  'enfeksiyon-hastaliklari',
  'kadin-hastaliklari-dogum',
  'dahiliye',
]

/** AU — GS1 VERIFIED (TGA TGO106); AIR VERIFIED national + legally mandatory; lot-tracking VERIFIED (AIR batch-number field, same mandate). */
export const AU_ASI_STOK_PAKETI: AsiStokUlkePaketi = {
  ulkeKodu: 'au',
  dil: 'en-AU',
  pediatriBransi: 'pediatri',
  varsayilanAcikBranslar: VARSAYILAN_ACIK_BRANSLAR,
  barkod: {
    standart: 'GS1',
    guven: 'VERIFIED',
    not: 'TGA TGO 106: serialised primary pack GS1 DataMatrix carries GTIN+batch+expiry+serial — same AI set gs1Coz() already decodes. Not vaccine-specific on the TGA page, but vaccines are medicines under TGA remit.',
    kaynaklar: ['https://www.tga.gov.au/standard-serialisation-and-data-matrix-codes-medicines'],
  },
  dijitalKayitSistemi: {
    varMi: true,
    adi: 'Australian Immunisation Register (AIR)',
    kapsam: 'ulusal',
    zorunluMu: true,
    not: 'Real, API-reachable (PRODA/OAuth), legally mandatory national registry — the one country of the six with a direct e-Nabız equivalent.',
    kaynaklar: [
      'https://air.claiming.com.au/docs/introduction/overview/',
      'https://www.health.gov.au/news/mandatory-reporting-changes-to-the-australian-immunisation-register-air-from-1-march-2025',
    ],
  },
  lotTakipHukuku: {
    guven: 'VERIFIED',
    not: 'Batch number is a required AIR field per dose; mandatory AIR reporting makes this a legal, not just best-practice, requirement.',
    kaynaklar: ['https://www.ama.com.au/gpnn/issue-21-number-20/articles/make-sure-correct-batch-numbers-entered-air'],
  },
}

/** CA — GS1 VERIFIED (PHAC standard, voluntary target not binding law); no single national registry (provincial only); lot-tracking VERIFIED (Canadian Immunization Guide). */
export const CA_ASI_STOK_PAKETI: AsiStokUlkePaketi = {
  ulkeKodu: 'ca',
  dil: 'en-CA',
  pediatriBransi: 'pediatri',
  varsayilanAcikBranslar: VARSAYILAN_ACIK_BRANSLAR,
  barkod: {
    standart: 'GS1',
    guven: 'VERIFIED',
    not: 'PHAC bar-code standard: primary pack 2D GS1 DataMatrix (GTIN+lot, expiry optional); secondary/case level GS1-128/DataBar (GTIN+lot+expiry). Framed as a voluntary 2017 implementation target, not binding law.',
    kaynaklar: ['https://www.canada.ca/en/public-health/services/publications/healthy-living/bar-code-standards-vaccine-products-canada-update-2014-2015.html'],
  },
  dijitalKayitSistemi: {
    varMi: false,
    adi: null,
    kapsam: 'bolgesel-parcali',
    zorunluMu: null,
    not: 'No single Canada-wide registry. Canadian Immunization Guide: records go to the provincial/territorial registry "where one exists"; provinces/territories merely "should" build one (aspirational, not a federal mandate). A true equivalent would need a specific province chosen — not attempted this round.',
    kaynaklar: ['https://www.canada.ca/en/public-health/services/publications/healthy-living/canadian-immunization-guide-part-1-key-immunization-information/page-12-immunization-records.html'],
  },
  lotTakipHukuku: {
    guven: 'VERIFIED',
    not: 'Canadian Immunization Guide lists "lot number of the product and expiry date" as required at all three record locations (personal record, provider chart, registry) — federal clinical guidance adopted nationwide, not a binding statute per se.',
    kaynaklar: ['https://www.canada.ca/en/public-health/services/publications/healthy-living/canadian-immunization-guide-part-1-key-immunization-information/page-12-immunization-records.html'],
  },
}

/** GB — barcode MODERATE (GS1/Scan4Safety confirmed NHS-wide, not vaccine-vial-specific); registry VERIFIED to exist but devolved/fragmented (Scotland CDR real; England contractual CHIS reporting); lot-tracking VERIFIED (England, contractual). */
export const GB_ASI_STOK_PAKETI: AsiStokUlkePaketi = {
  ulkeKodu: 'gb',
  dil: 'en-GB',
  pediatriBransi: 'pediatri',
  varsayilanAcikBranslar: VARSAYILAN_ACIK_BRANSLAR,
  barkod: {
    standart: 'GS1',
    guven: 'MODERATE',
    not: 'GS1 UK Scan4Safety establishes GS1 GTIN scanning across NHS trusts for medicines/devices generally — confirms GS1 as the UK health-system standard, but not independently verified as a vaccine-vial-packaging-specific mandate.',
    kaynaklar: ['https://www.gs1uk.org/knowledge-hub/standards/how-gs1-uk-enables-scan4safety-for-the-nhs'],
  },
  dijitalKayitSistemi: {
    varMi: true,
    adi: 'Devolved — Scotland: Vaccination API / Clinical Data Repository (CDR); England: Child Health Information Service (CHIS) reporting',
    kapsam: 'bolgesel-parcali',
    zorunluMu: true,
    not: 'No single UK-wide e-Nabız. Scotland has a real FHIR Vaccination API into the CDR. England requires GP practices to share vaccination status with the local CHIS and other NHS-England-specified systems under a CONTRACTUAL (GP contract letter), not statutory, mandate from April 2024. Wales/NI not checked. A GB pack would need one devolved nation chosen first — not attempted this round.',
    kaynaklar: [
      'https://nds.nhs.scot/service-catalogue/api-catalogue/vaccinations/',
      'https://www.pulsetoday.co.uk/news/clinical-areas/immunology-and-vaccines/vaccination-and-immunisation-record-keeping-requirements-are-tightened',
    ],
  },
  lotTakipHukuku: {
    guven: 'VERIFIED',
    not: 'England, from April 2024 (GP contract / NHS England guidance): each vaccination-event record must include batch number, expiry date and vaccine name, with a narrow exception only for reliable verbal histories.',
    kaynaklar: ['https://www.pulsetoday.co.uk/news/clinical-areas/immunology-and-vaccines/vaccination-and-immunisation-record-keeping-requirements-are-tightened'],
  },
}

/** NZ — barcode MODERATE (HISO 10063 GS1 Standards confirmed to exist, body text not fetched); registry MODERATE (NIR real + national, mandatory status unconfirmed); lot-tracking MODERATE (official recording forms exist, statute text not fetched). */
export const NZ_ASI_STOK_PAKETI: AsiStokUlkePaketi = {
  ulkeKodu: 'nz',
  dil: 'en-NZ',
  pediatriBransi: 'pediatri',
  varsayilanAcikBranslar: VARSAYILAN_ACIK_BRANSLAR,
  barkod: {
    standart: 'GS1',
    guven: 'MODERATE',
    not: 'Ministry of Health publishes an official standard, HISO 10063 — GS1 Standards, confirming GS1 as NZ\'s sanctioned health-sector barcode standard — but the document\'s own body text (exact GTIN/AI encoding, vaccine-specific scope) could not be fetched directly in this pass.',
    kaynaklar: ['https://www.health.govt.nz/publication/hiso-10063-gs1-standards'],
  },
  dijitalKayitSistemi: {
    varMi: true,
    adi: 'National Immunisation Register (NIR)',
    kapsam: 'ulusal',
    zorunluMu: null,
    not: 'Real national system — Te Whatu Ora/Health NZ describes it directly as recording children\'s immunisations so authorised health professionals can check vaccination history. Whether provider reporting is a legal mandate, and the exact submission mechanism (API vs manual), is not stated on the page fetched — flagged, not guessed.',
    kaynaklar: ['https://www.tewhatuora.govt.nz/health-services-and-programmes/vaccine-information/national-immunisation-registers/national-immunisation-register/about-national-immunisation-register/'],
  },
  lotTakipHukuku: {
    guven: 'MODERATE',
    not: 'Official forms (NIR3 "Immunisation Event Form", NIP8898 "Vaccination recording form") confirm lot/batch recording is standard practice, but the specific Immunisation Handbook or statutory text mandating it was not independently fetched in this pass — the same gap ASI-ONAM-INTL-01 flagged for NZ\'s consent-law research.',
    kaynaklar: ['https://www.tewhatuora.govt.nz/health-services-and-programmes/vaccine-information/national-immunisation-registers/national-immunisation-register/about-national-immunisation-register/'],
  },
}

/** US — barcode VERIFIED (CDC advises GS1, adoption voluntary); no single national registry (63 separate state/local IISs, VERIFIED absence); lot-tracking VERIFIED (42 U.S.C. 300aa-25, direct statute citation). */
export const US_ASI_STOK_PAKETI: AsiStokUlkePaketi = {
  ulkeKodu: 'us',
  dil: 'en-US',
  pediatriBransi: 'pediatri',
  varsayilanAcikBranslar: VARSAYILAN_ACIK_BRANSLAR,
  barkod: {
    standart: 'GS1',
    guven: 'VERIFIED',
    not: 'CDC: "currently advises vaccine 2D barcodes of various types to use the GS1 General Specifications standard," encoding product ID, lot number and expiration — but scanning/adoption itself is voluntary ("can replace manual entry"), not mandated.',
    kaynaklar: ['https://www.cdc.gov/iis/2d-barcodes/index.html'],
  },
  dijitalKayitSistemi: {
    varMi: false,
    adi: null,
    kapsam: 'bolgesel-parcali',
    zorunluMu: null,
    not: 'No single national registry. CRS Report R47024: 63 separate state/local/territorial/tribal Immunization Information Systems (IISs), each under its own jurisdiction\'s law; CDC supports via grants/standards and receives only de-identified aggregate data. Federal-level participation is "voluntary," though jurisdiction-level mandates vary. A true equivalent would need one state chosen — its own 50-jurisdiction project, not attempted this round.',
    kaynaklar: ['https://www.everycrsreport.com/reports/R47024.html'],
  },
  lotTakipHukuku: {
    guven: 'VERIFIED',
    not: '42 U.S.C. § 300aa-25(a) (National Childhood Vaccine Injury Act): every provider administering a Vaccine-Injury-Table-listed vaccine must record the date given, "the vaccine manufacturer and lot number of the vaccine," and the administering provider\'s name/address/title. The single clearest legal citation found across all six countries.',
    kaynaklar: ['https://www.law.cornell.edu/uscode/text/42/300aa-25'],
  },
}

/**
 * UZ — barcode BEST-EFFORT (Asl Belgisi GS1 DataMatrix track-and-trace confirmed for "medicines
 * and medical devices" generally, vaccines not named explicitly); registry MODERATE (a real,
 * officially-published FHIR IG with a dedicated immunization data model exists, but its page
 * bodies could not be fetched directly in this pass — only the search-listed resource titles);
 * lot-tracking UNCONFIRMED (no citable clinical-charting mandate found, only the supply-chain
 * serialization system above). Per the brief's own instruction: no legal claim made beyond this
 * honest gap.
 */
export const UZ_ASI_STOK_PAKETI: AsiStokUlkePaketi = {
  ulkeKodu: 'uz',
  dil: 'uz',
  pediatriBransi: 'pediatri',
  varsayilanAcikBranslar: VARSAYILAN_ACIK_BRANSLAR,
  barkod: {
    standart: 'GS1',
    guven: 'BEST-EFFORT',
    not: 'Asl Belgisi (CRPT Turon, Decree 149): mandatory GS1 DataMatrix serialization (GTIN+serial+verification key/code; human-readable batch/lot+expiry) on imported medicines and medical devices since Sep–Nov 2022. The source names "medicines and medical devices" generically, not vaccines specifically — vaccine applicability is a reasonable inference (vaccines are medicines), not independently confirmed.',
    kaynaklar: ['https://www.optelgroup.com/en/blog/uzbekistan-asl-belgisi-update-mandatory-serialization-of-pharmaceutical-products/'],
  },
  dijitalKayitSistemi: {
    varMi: true,
    adi: 'Uzbekistan Digital Health Platform (uzinfocom.org FHIR Implementation Guide)',
    kapsam: 'ulusal',
    zorunluMu: null,
    not: 'A real, officially-published FHIR IG defines a dedicated immunization data model (a uz-core-immunization StructureDefinition and an immunization-identifier NamingSystem per the IG\'s own published resource list) — strong evidence of a real national digital immunization standard. The IG\'s page bodies (exact workflow, whether lot/batch is a modeled field, mandatory-submission status) could not be fetched directly in this pass (blocked by this environment\'s fetch-provenance rule on a second-hop URL) — MODERATE, pending a pass that fetches the IG\'s pages directly.',
    kaynaklar: ['https://build.fhir.org/ig/uzinfocom-org/digital-health-ig/branches/add-sushi-logging-params/en/toc.html'],
  },
  lotTakipHukuku: {
    guven: 'UNCONFIRMED',
    not: 'No citable official source found for an immunization-specific lot/batch clinical-charting mandate — only the general Asl Belgisi supply-chain traceability system above, which is about tracking through distribution, not a charting requirement. No legal claim made beyond this honest gap, per the brief\'s own instruction.',
    kaynaklar: [],
  },
}

export const ASI_STOK_ULKE_PAKETLERI = {
  au: AU_ASI_STOK_PAKETI,
  ca: CA_ASI_STOK_PAKETI,
  gb: GB_ASI_STOK_PAKETI,
  nz: NZ_ASI_STOK_PAKETI,
  us: US_ASI_STOK_PAKETI,
  uz: UZ_ASI_STOK_PAKETI,
} as const

export type AsiStokUlkeKodu = keyof typeof ASI_STOK_ULKE_PAKETLERI

export function asiStokUlkePaketiGetir(ulkeKodu: string | null | undefined): AsiStokUlkePaketi | null {
  if (!ulkeKodu) return null
  const key = ulkeKodu.toLowerCase() as AsiStokUlkeKodu
  return ASI_STOK_ULKE_PAKETLERI[key] ?? null
}
