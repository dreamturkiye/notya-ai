import { GUVENLIK_MADDELERI, ivGuvenlik } from './long'

export function guvenlikKaydi(isaret: string[]): { ozet: string } | { hata: string } {
  const izinli = isaret.filter((m) => (GUVENLIK_MADDELERI as readonly string[]).includes(m))
  return ivGuvenlik(izinli)
}
