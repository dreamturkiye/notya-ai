import { isoMu } from '@/lib/klinik/isoGun'

export function ucuncuAyKontrol(islemIso: string): { gun: number; ad: string } | { hata: string } {
  if (!isoMu(islemIso)) return { hata: 'İşlem gününü girin.' }
  return { gun: 90, ad: 'Üçüncü ay kontrolü' }
}
