import { isoEkleGun, isoMu } from '@/lib/klinik/isoGun'

export function fotoSaklama(riza: boolean, bas: string, ayMetin: string): { bitis: string | null; ozet: string } | { hata: string } {
  if (!riza) return { hata: 'Foto için ayrı KVKK rızası zorunlu.' }
  if (!ayMetin.trim()) return { bitis: null, ozet: '' }
  const ay = Number(ayMetin)
  if (![6, 12, 24].includes(ay)) return { hata: 'Saklama süresi 6, 12 veya 24 ay.' }
  if (!isoMu(bas)) return { hata: 'Saklama için işlem günü gerekir.' }
  const bitis = isoEkleGun(bas, ay * 30)
  return { bitis, ozet: `Saklama bitişi ${bitis}.` }
}
