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
      'The tool holds no vaccine, no age and no interval, and must not be taken for the national calendar (SanQvaM 0239-07/3), which is not in this tool.',
    ],
  },
  {
    anahtar: 'uz-emlash-taqvimi',
    ne: 'The ages and vaccine kinds printed on the sanitary service flyer, as ticks the doctor sets.',
    teyit: [
      'The flyer opened on 2026-10-14 is the calendar in force. It has no issue date. Resolution PQ-402 of 22 November 2024 tells the ministry to review it; the re-approved text was not opened.',
      'The eleven rows are the flyer\'s ages and nothing else: no catch-up rule, no interval, and the 9 to 13 year row does not state sex or the gap between doses.',
      'The Cyrillic spelling is the letter-by-letter rule, not a native reader\'s, and a paediatrician confirms each row.',
    ],
  },
  {
    anahtar: 'uz-asosiy-dorilar',
    ne: 'One row of the essential-medicines annex: international nonproprietary name, form and strength, in annex order.',
    teyit: [
      'The annex of order No. 34 of 21 August 2023, registration No. 3455, is the list in force, and the 502 rows are every numbered row of the page opened on 2026-10-14.',
      'The position is the annex order, not a count of prescriptions. No brand was added beyond a parenthetical the annex itself prints.',
      'The Cyrillic and Russian lines are a machine rendering of the annex\'s Latin spelling. A pharmacist confirms them before a doctor relies on the spelling.',
      'The licence was read by a machine: a lawyer confirms that the annex may be stored in a commercial product.',
    ],
  },
  {
    anahtar: 'uz-retsept-qaydi',
    ne: 'A local note naming one annex row, plus a quantity and directions the doctor types. It is not sent.',
    teyit: [
      'The quantity is the doctor\'s and is not a dose the tool chose. The strength on the row is the annex\'s form, not a suggested dose.',
      'The note is not the pink narcotic form, is not sent to a pharmacy, and does not apply the narcotic rules. Those rules are the other tool.',
      'A lawyer confirms the same reading of the copyright law as for the annex itself.',
    ],
  },
  {
    anahtar: 'uz-giyohvand-qoidalari',
    ne: 'Ticks for the narcotic-prescription requirements in paragraphs 33, 34, 36 and 37 of order No. 3604.',
    teyit: [
      'Those four paragraphs, as opened on 2026-10-14, are the rules in force, and no required field from them is missing from the nine ticks.',
      'The tool does not check a form, does not send one, and is not the pink blank. Other annexes of the order were not opened.',
      'A lawyer confirms that storing these requirements from the order is allowed, and a clinician confirms the wording of each tick.',
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
