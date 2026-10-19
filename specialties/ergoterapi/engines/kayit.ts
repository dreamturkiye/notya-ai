import { gyaOzet } from './ergo'
import { neyziRed } from './girdi'

export function gyaKaydi(tani: string, alanlar: string[]): { ozet: string } | { hata: string } {
  const red = neyziRed(`${tani} ${alanlar.join(' ')}`)
  if (red) return red
  return gyaOzet(tani, alanlar)
}
