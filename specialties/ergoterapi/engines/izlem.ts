import { isoMu } from '@/lib/klinik/isoGun'

export function blokKontrol(basIso: string): { gun: number; ad: string } | { hata: string } {
  if (!isoMu(basIso)) return { hata: 'Başlangıç gününü girin.' }
  return { gun: 14, ad: 'Günlük blok gözden geçirme' }
}
