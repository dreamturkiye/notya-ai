import { isoMu } from '@/lib/klinik/isoGun'

export const AMELIYAT_IZLEM = [
  { gun: 90, ad: 'Üçüncü ay izlem' },
  { gun: 180, ad: 'Altıncı ay izlem' },
  { gun: 365, ad: 'On ikinci ay izlem' },
] as const

export function ucuncuAy(): { gun: number; ad: string } {
  return AMELIYAT_IZLEM[0]
}

export function gecDonem(ameliyatIso: string): typeof AMELIYAT_IZLEM | { hata: string } {
  if (!isoMu(ameliyatIso)) return { hata: 'Ameliyat gününü girin.' }
  return AMELIYAT_IZLEM
}

export function ucuncuAyTarihi(ameliyatIso: string): { gun: number; ad: string } | { hata: string } {
  const g = gecDonem(ameliyatIso)
  if ('hata' in g) return g
  return g[0]
}
