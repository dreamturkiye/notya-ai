import { cookies } from 'next/headers'
import { SAAT_DILIMI_CEREZ, VARSAYILAN_SAAT_DILIMI, saatDilimiGecerliMi } from '@/lib/doktor/selam'

/**
 * NOTYA-SELAM-SAAT-01: istemci (DoktorChrome) tarayıcı saat dilimini `notya_tz` çerezine yazar; sunucu tarafı
 * selamlamalar (gün özeti, Ayşe açılışı, sesli ilk söz) buradan okur. İstek bağlamı dışında ya da çerez yoksa TRT.
 */
export function istekSaatDilimi(): string {
  try {
    const tz = cookies().get(SAAT_DILIMI_CEREZ)?.value
    return saatDilimiGecerliMi(tz) ? tz : VARSAYILAN_SAAT_DILIMI
  } catch { return VARSAYILAN_SAAT_DILIMI }
}
