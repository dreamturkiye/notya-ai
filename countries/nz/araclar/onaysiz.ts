/**
 * NOTYA-ULKE-UYGULA-NZ — New Zealand: THE TOOLS OF THIS COUNTRY'S OWN THAT ARE SWITCHED ON WITHOUT A CLINICIAN'S
 * SIGN-OFF. Plain data; tests and documents read it, no screen does.
 *
 * Kaan, 2026-10-10: "Bring on all the tools built for the new 6 countries now. We will test as we go." Each tool
 * below was built from a national source opened on that day, with a free licence printed in the source itself
 * (./tanimlar.ts, ./araclar.ts), and is on a doctor's screen in New Zealand. NO CLINICIAN OF NEW ZEALAND HAS READ ANY
 * OF THEM. This list is the record of that, and ./araclar.test.ts holds it to the pack: it must name exactly the
 * tools of this country's own that are switched on — no more, no fewer.
 *
 * WHEN A CLINICIAN SIGNS A TOOL OFF: move its key from `NZ_ONAYSIZ_ARACLAR` to `NZ_ONAYLI_ARACLAR`, with the
 * clinician's name and the date. The test then still holds the two lists together to the pack.
 */
export const NZ_ONAYSIZ_ARACLAR: readonly string[] = ['nz-bmi-waist', 'nz-psa-thresholds', 'nz-smoking-abc']

/** Signed off by a named clinician of New Zealand: key → who and when. Empty today. */
export const NZ_ONAYLI_ARACLAR: Readonly<Record<string, { klinisyen: string; tarih: string }>> = {}
