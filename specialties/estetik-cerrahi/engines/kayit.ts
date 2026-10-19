import { rizaIkiNusha } from './cerrahi'

export function nushaKaydi(dosya: boolean, hasta: boolean): { ozet: string } | { hata: string } {
  return rizaIkiNusha(dosya, hasta)
}
