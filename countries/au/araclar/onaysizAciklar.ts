/**
 * NOTYA-ULKE-UYGULA-AU — Australia: THE TOOLS THAT ARE SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF.
 *
 * Every tool this country brought of its own (./tanimlar.ts, ./metinler.ts) is listed here, by key. Each was built
 * from a source opened on the day and from a rights holder's notice read on the day, and NO CLINICIAN OF AUSTRALIA
 * HAS READ IT. They are switched on by the owner's order of 2026-10-10 ("Bring on all the tools built for the new 6
 * countries now. We will test as we go."); until that order a tool on this list was kept switched off.
 *
 * WHAT THE LIST IS FOR. It is the worklist of the local clinical lead: a tool leaves it on the day a named clinician
 * of Australia has read its arithmetic, its words and its sources, and that name is written beside it. The pack's own
 * test (../au.test.ts) holds the list and the pack to each other, exactly: a tool of Australia's own that is switched
 * on and not listed fails it, and so does a listed key that is no longer a switched-on tool of the pack.
 *
 * Plain data: tests and documents read it; no screen does.
 */
export type OnaysizAcikArac = {
  anahtar: string
  /** The proposal of the audit it was built from (docs/araclar-denetim/au-kararlar.json → addTools). */
  oneri: string
  /** What a clinician must look at first. */
  bakilacak: string
  /** The clinician who signed it off; null = nobody yet. */
  klinisyen: string | null
}

export const AU_ONAYSIZ_ACIK_ARACLAR: readonly OnaysizAcikArac[] = [
  {
    anahtar: 'au-body-size', oneri: 'au-body-size', klinisyen: null,
    bakilacak: 'The index is rounded to one decimal place before its class is read (neither source states a rounding rule). One set of adult classes is shown; the waist limits are the ones printed for Caucasian men and for Caucasian and Asian women, and the screen says so. Body surface area is not in the tool.',
  },
  {
    anahtar: 'au-mental-health-screen', oneri: 'au-mental-health-screen', klinisyen: null,
    bakilacak: 'The items are numbered, not worded. The group shown is the Bureau of Statistics\' (10 to 15, 16 to 21, 22 to 29, 30 to 50); the same paper prints another grouping for primary care (10 to 19, 20 to 24, 25 to 29, 30 to 50): say which one general practice here should see. No age limit is set. The DASS-21, the second choice the audit named, is not built.',
  },
  {
    anahtar: 'au-oncology-grading', oneri: 'au-oncology-grading', klinisyen: null,
    bakilacak: 'Only the performance status grade is recorded, by its number. The graded side effects the proposal names beside it are not built. The Australian source is one state body\'s assessment form.',
  },
  {
    anahtar: 'au-my-health-record', oneri: 'NOTYA-ARACLAR-DENETIM-02-AU (founder\'s question #4, 2026-10-13)', klinisyen: null,
    bakilacak: 'A link-out tile only: opens the Department of Health, Disability and Ageing\'s own page about My Health Record. No connection to My Health Record exists, and none is implied. Check that the page named is still the right one for a doctor (not a consumer-only page) and that the wording does not overstate what the tile does.',
  },
  {
    anahtar: 'au-growth-chart-reference', oneri: 'NOTYA-ARACLAR-DENETIM-02-AU (founder\'s question #3, 2026-10-13)', klinisyen: null,
    bakilacak: 'Names WHO (under 2) and ANZSPED\'s own charts or the CDC 2000 charts (2 to 18) without choosing between the latter two, because ANZSPED\'s own page does not say which takes precedence. A paediatrician should say whether this product\'s own patients should default to one of them, and whether the under-18 age gate is the right cut-off (ANZSPED\'s charts run to 18; some practices may want this available to 19- or 20-year-olds using the CDC set).',
  },
  {
    anahtar: 'au-immunisation-schedule', oneri: 'NOTYA-ARACLAR-DENETIM-02-AU (founder\'s question #2, 2026-10-13)', klinisyen: null,
    bakilacak: 'Built CORE and switched on by the owner\'s explicit instruction, not waiting on this list — but still machine-written and unread by a clinician of Australia. It is a record only: no catch-up schedule, no eligibility test and no brand name. Sourced to NSW Health\'s published rendering of the National Immunisation Program Schedule (the Department\'s own PDF was robots-blocked this session): a clinician of Australia should confirm that rendering is still a faithful, current copy of the national schedule, and that the twelve milestones chosen are the right set to show (no risk-based or Aboriginal-and-Torres-Strait-Islander-specific additions beyond the one line that names them).',
  },
]

/** The keys alone, sorted. */
export const AU_ONAYSIZ_ACIK_ANAHTARLAR: readonly string[] = AU_ONAYSIZ_ACIK_ARACLAR.map((a) => a.anahtar).sort()
