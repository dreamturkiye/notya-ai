/**
 * NOTYA-ULKE-UYGULA-CA — Canada: TOOLS SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF. Every tool this country has built
 * for itself (./tanimlar.ts, ./metinler.ts) stands on this list from the day it is written.
 *
 * WHAT THE LIST MEANS (the owner's order of 2026-10-10: "Bring on all the tools built for the new 6 countries now. We
 * will test as we go."). A tool on this list IS ON A DOCTOR'S SCREEN and has been read by no clinician of Canada. It
 * was built from a source opened on the day, with the source's own figures as its test, and its licence was read on
 * the rights holder's own notice. ./yeniAraclar.test.ts holds this list and the pack's switched-on tools of its own
 * to each other, EXACTLY: a tool of this country that is on and not listed here fails the suite, and so does a
 * listed tool that is not on.
 *
 * HOW A TOOL LEAVES THE LIST. A clinician of Canada opens the source cited beside the tool's arithmetic, reads every
 * word of its screen and answers the questions below. Then, in one change: the entry is taken off this list, with
 * the clinician's name and the date written into the country's record. The tool stays on.
 *
 * Plain data: read by tests and by the country's record; no screen reads it.
 */
export type OnayBekleyen = {
  /** The tool's key ("ca-…"). */
  anahtar: string
  /** What the clinician is asked to confirm, beyond reading the source and the screen. */
  sorular: readonly string[]
}

export const CA_ONAY_BEKLEYEN: readonly OnayBekleyen[] = [
  {
    anahtar: 'ca-unit-converter',
    sorular: [
      'The weight is written in kilograms to two decimal places and the height in centimetres to one. Is that how a converted weight should be written before it is used for a dose, for a newborn as for an adult?',
      'A height of "5 feet" with the inches left empty gives no result (the inches are typed, 0 included), and a weight is then not shown either. Is that the reading wanted?',
      'Degrees Fahrenheit, ounces and stones are not converted: no official Canadian page that prints the relation of the two temperature scales was opened. Which of them does a clinic need?',
    ],
  },
  {
    anahtar: 'ca-egfr-ckd-epi-2021',
    sorular: [
      'Which equation does the laboratory of each province report? The source read for Canada is one province\'s laboratory bulletin (Alberta, from 20 January 2026). The screen tells the doctor to check which equation their laboratory reports. Is that enough, or should the tool be held back where the laboratory reports another equation?',
      'The result is a whole number in mL/min/1.73 m², with no category. Should a value above or below a limit be written another way (a laboratory report often stops at a reportable range)?',
      'The equation asks for sex as female or male. What should the screen say for a patient to whom neither word applies?',
      'The bulletin read says the equation is not validated in children or in pregnancy. The tool is held back below 18 years; it cannot know of a pregnancy and says so in its description only. Is that enough?',
      'Creatinine is typed in µmol/L and divided by 88.4. Does any laboratory here report it in another unit?',
    ],
  },
]

/** The keys alone. */
export const CA_ONAY_BEKLEYEN_ANAHTARLAR: readonly string[] = CA_ONAY_BEKLEYEN.map((x) => x.anahtar)
