import { gunFarki, isoMu } from '@/lib/klinik/isoGun'

export function sogumaGun(onamIso: string, ameliyatIso: string): { gun: number } | { hata: string } {
  if (!isoMu(onamIso) || !isoMu(ameliyatIso)) return { hata: 'tarih' }
  const gun = gunFarki(onamIso, ameliyatIso)
  if (gun == null) return { hata: 'tarih' }
  if (gun < 0) return { hata: 'once' }
  return { gun }
}
