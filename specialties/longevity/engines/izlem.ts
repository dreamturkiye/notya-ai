import { isoMu } from '@/lib/klinik/isoGun'

export function reaksiyonSonrasiAralik(reaksiyon: boolean, aralikGun: number): { hata: string } | null {
  if (reaksiyon && !(aralikGun >= 7)) return { hata: 'Reaksiyon sonrası 7 günden kısa seans yok. Karışım yazılmaz.' }
  return null
}

export function beklemeBitisi(reaksiyon: boolean, sonIso: string): { gun: number; ad: string } | null | { hata: string } {
  if (!reaksiyon) return null
  if (!isoMu(sonIso)) return { hata: 'Son seans gününü girin.' }
  return { gun: 7, ad: 'Reaksiyon bekleme bitişi' }
}
