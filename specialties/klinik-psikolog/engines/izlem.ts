import { isoMu } from '@/lib/klinik/isoGun'

export function cerceveGozden(sonIso: string): { gun: number; ad: string } | { hata: string } {
  if (!isoMu(sonIso)) return { hata: 'Son görüşme gününü girin.' }
  return { gun: 56, ad: 'Çerçeve gözden geçirme' }
}

export function siklikGun(siklik: string): { gun: number } | { hata: string } {
  if (siklik === 'haftalık') return { gun: 7 }
  if (siklik === 'iki haftada bir') return { gun: 14 }
  if (siklik === 'aylık') return { gun: 30 }
  return { hata: 'Sıklık: haftalık, iki haftada bir veya aylık.' }
}
