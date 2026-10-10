/**
 * NOTYA-ULKE-UYGULA-US — United States: TOOLS SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF. Every tool this country has
 * built for itself (./tanimlar.ts, ./metinler.ts) is switched on by the owner's order of 2026-10-10 ("Bring on all the
 * tools built for the new 6 countries now. We will test as we go.") and stands on this list until a clinician of the
 * United States has signed it off. ./yeniAraclar.test.ts holds THIS LIST AND THE PACK'S SWITCHED-ON TOOLS OF ITS OWN
 * TO BE EXACTLY THE SAME: a new tool cannot be switched on without being listed here, and a tool cannot be dropped
 * from the list while it is on.
 *
 * HOW A TOOL LEAVES THE LIST. A clinician of the United States opens the source cited beside the tool's arithmetic,
 * reads every word of its screen and answers the questions below. Then the entry moves to a list of signed-off
 * tools, with the clinician's name and the date (to be written on the day the first one is signed: none is today),
 * and the test is extended to hold both lists.
 *
 * Plain data: read by tests and by the country's record; no screen reads it.
 */
export type OnayBekleyen = {
  /** The tool's key ("us-…"). */
  anahtar: string
  /** What the clinician is asked to confirm, beyond reading the source and the screen. */
  sorular: readonly string[]
}

export const US_ONAY_BEKLEYEN: readonly OnayBekleyen[] = [
  {
    anahtar: 'us-bmi',
    sorular: [
      'The index is rounded to one decimal place before it is placed in a category. No page read says so in words: it follows from the CDC\'s own example table (125 pounds at 5 feet 9 inches is "Healthy Weight"). Is that how the category should be read?',
      'Height is typed in feet and inches and weight in pounds only. Is a metric entry wanted beside it?',
    ],
  },
  {
    anahtar: 'us-egfr-ckd-epi-2021',
    sorular: [
      'The result is a whole number in mL/min/1.73 m², with no category. Should a value above or below a limit be written another way (a laboratory report often writes ">60" or stops at a reportable range)?',
      'The equation asks for sex as female or male. What should the screen say for a patient to whom neither word applies?',
      'The audit asked for a value in mL/min, without the body-surface term, beside this one for choosing a dose. It is not built: no US source naming a body-surface formula was found.',
    ],
  },
  {
    anahtar: 'us-pack-years',
    sorular: [
      'A patient who quit exactly 15 years ago is shown as no longer meeting the criteria ("15 or more years"). Is that the reading wanted?',
      'The tool asks the age itself and is not held back by the patient\'s age. Should it be shown only for patients aged 50 to 80?',
      'The criteria are the U.S. Preventive Services Task Force\'s as a CDC page restates them (page dated May 12, 2026). They change: who checks the page, and how often?',
    ],
  },
  {
    anahtar: 'us-blood-sugar-ranges',
    sorular: [
      'A 2-hour value of exactly 140 mg/dL is placed in the prediabetes range: the CDC\'s table prints 140 in both the normal and the prediabetes column.',
      'A value between two printed ranges (an A1C of 6.45%) is placed in the lower range. Should the tool instead take one decimal place only?',
      'One result is placed in a range; the tool does not say that a diagnosis needs a second test. Should the line under the result say more?',
    ],
  },
  {
    anahtar: 'us-fall-risk-screen',
    sorular: [
      'The three questions are in this product\'s own words, not the CDC\'s. Do they ask the same thing?',
      'The tool stops at the screen: no assessment (timed walk, chair stand, balance test) is offered, because the page read prints no limit for any of them.',
    ],
  },
  {
    anahtar: 'us-phq-9',
    sorular: [
      'The nine items are shown by number only ("Item 1" to "Item 9"); the doctor enters each score from the form. Is that usable in an office visit, or must the items be worded on the screen (the owner\'s line allows it)?',
      'When item 9 is scored above 0 the tool says so beside the total and nothing more. Is that the right prompt, and should anything follow it on the screen?',
      'A total of 0 is shown without a label, because the form\'s table begins at 1. The tool is not held back by the patient\'s age: for which ages should it be shown?',
      'The scoring table was read on an older printing of the owner\'s form (2005). Is it the table in use?',
    ],
  },
  {
    anahtar: 'us-ecog-performance-status',
    sorular: [
      'The grades are shown by number only (the wording of the scale is not in the product). Is a tool that records a number without its wording of use in an office visit?',
    ],
  },
]

/** The keys alone. */
export const US_ONAY_BEKLEYEN_ANAHTARLAR: readonly string[] = US_ONAY_BEKLEYEN.map((x) => x.anahtar)
