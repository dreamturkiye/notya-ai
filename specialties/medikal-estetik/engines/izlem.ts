import { isoMu } from '@/lib/klinik/isoGun'

export const BAKIM_AYLARI = [
  { gun: 90, ad: 'Üçüncü ay kontrolü' },
  { gun: 120, ad: 'Dördüncü ay kontrolü' },
] as const

export function ucuncuAyKontrol(islemIso: string): { gun: number; ad: string } | { hata: string } {
  const a = bakimAylari(islemIso)
  if ('hata' in a) return a
  return a[0]
}

export function bakimAylari(islemIso: string): typeof BAKIM_AYLARI | { hata: string } {
  if (!isoMu(islemIso)) return { hata: 'İşlem gününü girin.' }
  return BAKIM_AYLARI
}
