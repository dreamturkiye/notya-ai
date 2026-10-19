/** Takvim aritmetiği. Branş içeriği taşımaz. */

export function isoMu(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export function gunFarki(bas: string, bit: string): number | null {
  if (!isoMu(bas) || !isoMu(bit)) return null
  return Math.round((Date.parse(bit + 'T12:00:00Z') - Date.parse(bas + 'T12:00:00Z')) / 86400000)
}

export function isoEkleGun(gun0: string, gun: number): string {
  const d = new Date(gun0 + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function vadeDurumu(bugun: string, iso: string): 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli' | null {
  const fark = gunFarki(bugun, iso)
  if (fark == null) return null
  if (fark < 0) return 'gecikti'
  if (fark === 0) return 'bugun'
  if (fark <= 7) return 'yaklasiyor'
  return 'planli'
}
