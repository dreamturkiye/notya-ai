/**
 * NOTYA-ULKE-PORTAL-01 — a catalogue sentence with its values put in. Client-safe, pure.
 *
 *   yerine('Tries left: %', 3)                       one value  → '%'
 *   yerine('Booked: %1, at %2.', '12.10.2026', '10:00')   several → '%1', '%2', …
 *
 * A value is written as it is: nothing in it is read as a pattern (a name may hold '$' or '%').
 */
export function yerine(metin: string, ...degerler: readonly (string | number)[]): string {
  if (degerler.length === 1) return metin.replace('%', () => String(degerler[0]))
  return metin.replace(/%(\d)/g, (hepsi, n: string) => { const d = degerler[Number(n) - 1]; return d === undefined ? hepsi : String(d) })
}
