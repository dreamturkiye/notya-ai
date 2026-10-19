import { lotKaydi } from './estetik'

export function lotGirdi(lot: string, bolge: string): { ozet: string } | { hata: string } {
  return lotKaydi(lot, bolge)
}
