import { cihazListe } from './odyo'

export function raporKaydi(rapor: boolean): { ozet: string } {
  return cihazListe(rapor)
}
