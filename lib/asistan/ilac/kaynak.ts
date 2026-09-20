/**
 * NOTYA-EYLEM-28 — source constructors for the drug table.
 *
 * `kub()` may ONLY be used for a KÜB that was actually fetched and read while writing the entry.
 * That is the whole meaning of `dogrulama: 'kub_okundu'`; a citation nobody opened is worse than no
 * citation, because it buys trust the number has not earned. `literatur()` is for a named non-KÜB
 * source, and it is the honest choice whenever the KÜB was not reachable.
 */
import type { IlacKaynagi } from './tipler'

/** A TİTCK KÜB PDF that was fetched and read. `urun` is the product whose KÜB it is. */
export function kub(urun: string, url: string, bolumler = '4.2/4.3/4.5/4.6'): IlacKaynagi {
  return { belge: `TİTCK KÜB — ${urun} §${bolumler}`, url, dogrulama: 'kub_okundu' }
}

/** A named, non-KÜB source: TEMD/TKD/TJOD/Türk Toraks uzlaşı raporu, SUT, BNF, FDA label. */
export function literatur(belge: string, url?: string): IlacKaynagi {
  return { belge, url, dogrulama: 'literatur' }
}
