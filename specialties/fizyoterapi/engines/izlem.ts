import { isoMu } from '@/lib/klinik/isoGun'

export function evKontrolGunu(basIso: string): { gun: number; ad: string } | { hata: string } {
  if (!isoMu(basIso)) return { hata: 'Başlangıç gününü girin.' }
  return { gun: 7, ad: 'Ev programı kontrolü' }
}
