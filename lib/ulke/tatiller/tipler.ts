/**
 * A country's public days, as data on the pack. The calendar reads them. The working-pattern
 * rule does not: a weekday can still be booked, and the screen says so.
 *
 * A lawyer and a clinician have not signed any list. `inceleme` marks a day whose date is a
 * draft (a decree that is not out yet, or a provincial day a local source should confirm).
 */
export type ResmiGun = {
  /** YYYY-MM-DD, the day the calendar shows. */
  tarih: string
  ad: string
  /** Afternoon is closed (from 13:00). The morning stays open. */
  yarim?: boolean
  inceleme?: boolean
}

export type ResmiGunBolgesi = { kod: string; ad: string }

export type ResmiGunKaynagi = {
  bolgeler: readonly ResmiGunBolgesi[]
  /** The region used when the address names none, or names one this pack does not have. */
  varsayilan: string
  /** Days whose dates fall in [bas, bit], both YYYY-MM-DD, for one region code. */
  gunler: (bolge: string, bas: string, bit: string) => readonly ResmiGun[]
  /** Where the dates were read. Kept on the pack, not on the shared screens. */
  kaynak: string
  /** What a lawyer or a clinician still has to check. */
  inceleme: string
}
