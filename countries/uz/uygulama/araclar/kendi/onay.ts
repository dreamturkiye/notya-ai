/**
 * NOTYA-ULKE-UYGULA-UZ — Uzbekistan: TOOLS THAT ARE SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF.
 *
 * Kaan, 2026-10-10, 14:17: "Bring on all the tools built for the new 6 countries now. We will test as we go."
 * The tools below are on a doctor's screen in Uzbekistan by that order. NO CLINICIAN OF UZBEKISTAN HAS READ THEM,
 * AND NO NATIVE READER HAS READ THEIR WORDS. This file is the list of what is owed for each: a clinician confirms
 * every line of `teyit`, and only then does a tool leave the list — with the clinician's name, in the same change.
 *
 * TWO LISTS, HELD TO THE PACK BY ./kendi.test.ts (neither can drift from what is switched on):
 *   UZ_ONAYSIZ_YENI_ARACLAR     the tools ONLY UZBEKISTAN HAS, built from the proposals of the tools audit of
 *                               2026-10-10. The list and the pack's switched-on new tools match exactly: a new tool
 *                               that is switched on and not listed here fails the test, and so does a listed tool
 *                               that is no longer on.
 *   UZ_ONAYSIZ_GERI_ACILAN      a tool of the kit that was switched off by the owner's order earlier the same day
 *                               and switched on again by the order above.
 *
 * NOT ON EITHER LIST, because it is not switched on: the ten-year cardiovascular risk (`kv-risk-score2`) stays an
 * empty placeholder — three national documents name three different charts, and both charts need their owner's
 * permission (../yuvalar.ts).
 */

export type UzOnaysizArac = {
  anahtar: string
  /** What the tool does, in one line. */
  ne: string
  /** What a clinician of Uzbekistan has to confirm before the tool leaves this list. */
  teyit: readonly string[]
}

export const UZ_ONAYSIZ_YENI_ARACLAR: readonly UzOnaysizArac[] = [
  {
    anahtar: 'uz-tana-vazni-indeksi',
    ne: 'Body mass index from weight and height, in one of four adult classes; waist circumference is recorded and not assessed.',
    teyit: [
      'The four classes and their limits are the ones in use here (they are those of Table 1 of the national antenatal protocol of 2021, of the World Health Organization and of the CDC).',
      'The index is held against the limits as it is written, to one decimal place (24,96 is written 25,0 and is called overweight).',
      'The tool is for a patient aged 20 or older. The age comes from the CDC page; no source of Uzbekistan that states an age was found.',
      'Whether a limit for the waist circumference should be shown: the 2015 national cardiology collection prints one; the tool shows none.',
      'The licence was read by a machine: a lawyer confirms that the calculation and the classes may be used in a commercial product.',
    ],
  },
  {
    anahtar: 'uz-homiladorlik-muddati',
    ne: 'Expected date of birth and gestational age today, from the last menstrual period or from an embryo transfer.',
    teyit: [
      'The national antenatal protocol of 2021 is the edition in force (its own planned revision was 2024; a newer edition was not found).',
      'The rule as built: 280 days from the first day of the last period; the ultrasound date of 11 to 14 weeks replaces it when the two differ by MORE than 5 days; after an embryo transfer, 266 days from the transfer minus the days of culture.',
      'A cycle that is not 28 days long: the protocol asks for a correction and prints no number. The tool corrects nothing and says so. A clinician says whether a correction should be built, and which.',
      'The gestational age shown when the date was set by ultrasound or by a transfer is counted back from the expected date (280 days = 40 weeks). The protocol states the date only.',
      'The licence was read by a machine: the protocol carries no notice of its own, and a lawyer confirms the reading of the copyright law.',
    ],
  },
  {
    anahtar: 'uz-emlash-qaydi',
    ne: 'One vaccination as the doctor enters it: name, dose number, day, source of the fact, and a next day the doctor sets.',
    teyit: [
      'The five fields are what a doctor here records for a vaccination, and nothing needed is missing (series and batch number are not asked).',
      'The tool holds no vaccine, no age and no interval, and must not be taken for the national calendar (SanQvaM 0239-07/3), which is not in the product.',
    ],
  },
]

export const UZ_ONAYSIZ_GERI_ACILAN: readonly UzOnaysizArac[] = [
  {
    anahtar: 'doz-hesabi',
    ne: 'Arithmetic on a dose per kilogram the doctor types; the tool holds no medicine and no dose.',
    teyit: [
      'The corrected arithmetic (pull request #615): the volume is not rounded to a step, and a volume below 1 ml carries a caution.',
      'How an amount is written here: with the decimals standing ("1,0"), by ../birimler.ts → UZ_DOZ_YAZIMI. A local pharmacist has not confirmed it.',
      'The tool is shown to paediatrics only. The audit asked for "every role that treats children" and did not name the roles.',
    ],
  },
]
