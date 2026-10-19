import { isoMu } from '@/lib/klinik/isoGun'

export const EV_IZLEM = [
  { gun: 7, ad: 'Ev programı kontrolü' },
  { gun: 28, ad: 'Dört hafta gözden geçirme' },
] as const

export function evKontrolGunu(basIso: string): { gun: number; ad: string } | { hata: string } {
  const e = evIzlem(basIso)
  if ('hata' in e) return e
  return e[0]
}

export function evIzlem(basIso: string): typeof EV_IZLEM | { hata: string } {
  if (!isoMu(basIso)) return { hata: 'Başlangıç gününü girin.' }
  return EV_IZLEM
}
