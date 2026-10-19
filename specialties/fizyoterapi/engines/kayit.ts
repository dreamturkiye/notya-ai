import { hekimPlaniKayit } from './fizyo'

export function hekimPlanKaydi(tani: string, tarih: string): { ozet: string } | { hata: string } {
  return hekimPlaniKayit(tani, tarih)
}
