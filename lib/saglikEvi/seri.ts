/**
 * HASTA-PORTALI-GUNLUK — streak with streak freezes ("seri kalkanı"). Rewards consistency, never punishes:
 *  - a day counts when the patient logged anything (a reading, or a dose taken);
 *  - every 7 consecutive active days earn one kalkan (max 2); a missed day spends one automatically and the streak
 *    survives; with no kalkan left the streak restarts quietly (the best streak is kept and shown);
 *  - today not yet logged never breaks anything.
 * Deterministic from the set of active days alone — nothing to store, the same answer on every device.
 */
import { gunEkle, gunFarki } from './zaman'

export const KALKAN_HER = 7
export const KALKAN_EN_COK = 2

export interface SeriSonucu {
  seri: number
  enUzun: number
  kalkan: number
  /** Days a kalkan covered (shown as a shield on the calendar strip). */
  kalkanGunleri: string[]
  bugunAktif: boolean
  /** Ever earned a kalkan (badge). */
  kalkanKazanildi: boolean
}

export function seriHesapla(aktifGunler: Iterable<string>, bugun: string): SeriSonucu {
  const gunler = new Set(aktifGunler)
  const sirali = [...gunler].filter((g) => g <= bugun).sort()
  const bugunAktif = gunler.has(bugun)
  if (!sirali.length) return { seri: 0, enUzun: 0, kalkan: 0, kalkanGunleri: [], bugunAktif, kalkanKazanildi: false }
  let seri = 0, enUzun = 0, kalkan = 0, ardisik = 0, kazanildi = false
  const kalkanGunleri: string[] = []
  const toplam = gunFarki(sirali[0], bugun)
  for (let i = 0; i <= toplam; i++) {
    const g = gunEkle(sirali[0], i)
    if (gunler.has(g)) {
      seri++; ardisik++
      if (ardisik % KALKAN_HER === 0 && kalkan < KALKAN_EN_COK) { kalkan++; kazanildi = true }
    } else if (g === bugun) {
      // today is still open
    } else if (kalkan > 0 && seri > 0) {
      kalkan--; ardisik = 0; kalkanGunleri.push(g)
    } else {
      seri = 0; ardisik = 0
    }
    enUzun = Math.max(enUzun, seri)
  }
  return { seri, enUzun, kalkan, kalkanGunleri, bugunAktif, kalkanKazanildi: kazanildi }
}
