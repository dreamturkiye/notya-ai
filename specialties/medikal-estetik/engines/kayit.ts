import { gunFarki, isoMu } from '@/lib/klinik/isoGun'

export function sogumaKaydi(onamIso: string, islemIso: string): { uygun: boolean; gun: number | null } | { hata: string } {
  if (!isoMu(onamIso) || !isoMu(islemIso)) return { hata: 'tarih' }
  const gun = gunFarki(onamIso, islemIso)
  if (gun == null || gun < 0) return { hata: 'once' }
  return { uygun: gun >= 1, gun }
}
