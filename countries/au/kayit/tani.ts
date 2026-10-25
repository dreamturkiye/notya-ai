/**
 * Diagnosis codes (AU-QUICK-01, read 2026-10-25). NO CODE DATA IS IN THIS REPOSITORY.
 *
 * The screen and its API are built (lib/ulke/kayit/taniKaynagi.ts, /api/ulke/tani-kodlari, /diagnosis-codes) and read
 * OPTIONAL server-side files:
 *   data/au/icd10-who-2019.txt      WHO ICD-10 2019 tabular list, "CODE<TAB>DESCRIPTION"
 *   data/au/icd10-to-icd10am.csv    open ICD-10 -> ICD-10-AM mapping, header `icd10,icd10am,edition` (codes only)
 * Until both are present the Quick access tile is not drawn and the screen says the list is not loaded.
 *
 * LICENCE STATUS (honest):
 *   - ICD-10-AM code DESCRIPTIONS are licensed by IHACPA (Electronic Code Lists need a licence): never stored here.
 *     Only mapped ICD-10-AM CODES may be shown. The licensed lists plug in at `lisansliKaynak` (same interface).
 *   - WHO ICD-10: https://icdcdn.who.int/icd10/index.html states NO terms of use on the download page; the WHO ICD-10
 *     copyright is not waived there, and permission to bundle it in a commercial product could NOT be confirmed.
 *     Not bundled. Open question for Kaan: docs/OPEN-COMMITMENTS.md AU-QUICK-01.
 *   - Open ICD-10 -> ICD-10-AM mapping (Digital Health Implementer Hub): page says "Licensing Required: No" / "Access
 *     Open" and states no copyright or reuse terms; the file terms could not be read from here. IHACPA's page offers
 *     only editions 1-3 free and sells 4-12. Not bundled until the file's own terms are read.
 */
export const AU_TANI_KODLARI = {
  satirlar: [] as readonly [],
  okundu: '2026-10-25',
  lisans: 'ICD-10-AM descriptions need a licence from IHACPA and are not stored. The WHO ICD-10 download page states no terms of use, so bundling it in a commercial product is unconfirmed; nothing is bundled.',
  kaynak: 'WHO ICD-10 + open ICD-10 to ICD-10-AM mapping (Digital Health Implementer Hub / IHACPA). Not the full licensed ICD-10-AM code set.',
  yol: 'Place the two files under data/au/ once the licence question is answered (docs/OPEN-COMMITMENTS.md, AU-QUICK-01); the tile then appears by itself.',
}
