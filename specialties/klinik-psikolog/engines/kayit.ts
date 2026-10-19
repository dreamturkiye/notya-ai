import { taniKacagi } from './girdi'

export function cerceveKaydi(yaklasim: string): { yaklasim: string } | { hata: string } {
  const k = taniKacagi(yaklasim)
  if (k) return k
  if (!yaklasim.trim()) return { hata: 'Seans yaklaşımını yazın — tanı yazmayın.' }
  return { yaklasim: yaklasim.trim() }
}
