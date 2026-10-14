/**
 * The FY2027 order file is on disk (../referans/icd10cm-order-2027.txt).
 * It is not imported here: this module can be read with the pack, and the
 * pack is loaded in the browser. The lookup is ../referans/icd10cm.ts, which
 * reads the file in Node and is imported only by tests.
 */
export const US_TANI = {
  ekranda: false,
  satirlar: [] as const,
  dosya: 'countries/us/referans/icd10cm-order-2027.txt',
  kaynak: 'https://ftp.cdc.gov/pub/health_statistics/nchs/publications/ICD10CM/2027/icd10cm-code-descriptions-2027.zip',
  okundu: '2026-10-14',
  gecerli: 'Services from 1 October 2026 through 30 September 2027, as the CDC files page states for the FY27 release.',
}
