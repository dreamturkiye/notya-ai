/**
 * NOTYA-VIZIT-TARIHI-01 (Dr. Gokhan's real-patient test, 2026-10-02): a visit entered after the fact has the day of its
 * NOTE, not the day its session row was created. The patient page already shows the note's day (seansTarihi in
 * hastalar/[id]/page.tsx); the dossier compiler and the event index used the session row's creation time, so Ayse saw
 * fifteen visits on 23-25 September, answered 'the previous exam was 24 September' for a 8 July visit, and could pick
 * the wrong 'last visit'. One definition for all of them.
 */
export function vizitGunu(seansOlusturma: string | null | undefined, notOlusturma?: string | null): string {
  const n = String(notOlusturma || '').trim()
  return n || String(seansOlusturma || '')
}

/** Sessions in visit-day order (the note's day, the row's creation time only when there is no note). Returns a new array. */
export function vizitGununeGoreSirala<T extends { id: string; created_at: string }>(seanslar: T[], notGunu: Map<string, string>): T[] {
  const gun = (s: T) => vizitGunu(s.created_at, notGunu.get(String(s.id)))
  return [...seanslar].sort((a, b) => gun(a).localeCompare(gun(b)))
}
