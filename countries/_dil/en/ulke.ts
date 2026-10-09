/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: what a COUNTRY hands the set when it takes it.
 *
 * The set's catalogues are the same in every English-speaking country except for a handful of sentences that are a
 * country's own: its recording-consent sentence, the name of its patient identifier, how it speaks of its time zone.
 * A country pack states them here, in its own spelling, and they are put into the catalogues AS WRITTEN: the spelling
 * table never touches a country's own words.
 *
 * Nothing in this file is a default. A pack that takes the set states every one of these.
 */
import type { EnBicim } from './varyant'

export type EnUlkeSozleri = {
  /** The form of English the country's pack is written in: its language code. */
  bicim: EnBicim
  /** The word mark, as the screens write it. */
  marka: string
  /**
   * RECORDING CONSENT: the sentence beside the box a doctor selects before a visit is recorded. The country's, in the
   * country's legal terms; marked "not read by a lawyer" where the pack writes it, until one has read it.
   */
  kayitRizasi: string
  /** The label of the optional patient identifier on the patient form; null where the pack records none. */
  kimlikEtiketi: string | null
  /** true = the country has several time zones and an account chooses its own. */
  cokSaatDilimi: boolean
  /**
   * The sentence on the calendar that says which time its times are in. A country with one zone names it ("All times
   * are UK time."); a country with several says that the account's own zone applies.
   */
  saatDilimiCumlesi: string
  /** The date pattern as a person is asked to type it, in the country's order: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD. */
  tarihOrnegi: string
}
