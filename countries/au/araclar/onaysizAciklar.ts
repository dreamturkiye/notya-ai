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
]

/** The keys alone, sorted. */
export const AU_ONAYSIZ_ACIK_ANAHTARLAR: readonly string[] = AU_ONAYSIZ_ACIK_ARACLAR.map((a) => a.anahtar).sort()
