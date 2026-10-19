import { isoMu } from '@/lib/klinik/isoGun'

export const DOKULME = [
  { gun: 14, ad: 'Geçici dökülme penceresi' },
  { gun: 56, ad: 'Dökülme penceresi kapanışı' },
] as const

/** Sonuç izlemi — 6 ve 12. ay. Greft sayısı bu satırda yok. */
export const SONUC_IZLEM = [
  { gun: 180, ad: 'Altıncı ay sonuç izlemi' },
  { gun: 365, ad: 'On ikinci ay sonuç izlemi' },
] as const

export function dokulmePenceresi(ameliyatIso: string): typeof DOKULME | { hata: string } {
  if (!isoMu(ameliyatIso)) return { hata: 'İşlem gününü girin.' }
  return DOKULME
}

export function sonucIzlemi(ameliyatIso: string): typeof SONUC_IZLEM | { hata: string } {
  if (!isoMu(ameliyatIso)) return { hata: 'İşlem gününü girin.' }
  return SONUC_IZLEM
}
