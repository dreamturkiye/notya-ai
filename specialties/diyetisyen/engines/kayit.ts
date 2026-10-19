import { taniReferansi } from './diyet'

export function hekimKapisi(tani: string): { ozet: string } | { hata: string } {
  return taniReferansi(tani)
}
