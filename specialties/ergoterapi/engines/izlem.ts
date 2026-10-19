import { isoMu } from '@/lib/klinik/isoGun'

export function blokKontrol(basIso: string): { gun: number; ad: string } | { hata: string } {
  if (!isoMu(basIso)) return { hata: 'Başlangıç gününü girin.' }
  return { gun: 14, ad: 'Günlük blok gözden geçirme' }
}

export function altiHafta(sonIso: string): { gun: number; ad: string } | { hata: string } {
  if (!isoMu(sonIso)) return { hata: 'Son seans gününü girin.' }
  return { gun: 42, ad: 'Altı hafta GYA gözden geçirme' }
}
