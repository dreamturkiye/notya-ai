import { isoMu } from '@/lib/klinik/isoGun'
import { lazerAralik } from './girdi'

export const LAZER_SONRASI = [
  { gun: 1, ad: 'Ertesi gün cilt kontrolü' },
  { gun: 7, ad: 'Bir hafta cilt kontrolü' },
] as const

export function seansAraligi(gun: number): { gun: number } | { hata: string } {
  return lazerAralik(gun)
}

export function lazerSonrasi(sonIso: string): typeof LAZER_SONRASI | { hata: string } {
  if (!isoMu(sonIso)) return { hata: 'Son seans gününü girin.' }
  return LAZER_SONRASI
}
