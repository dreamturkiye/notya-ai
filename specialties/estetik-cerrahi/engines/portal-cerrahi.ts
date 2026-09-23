/** Sağlığım › Estetik ameliyat bakımı — tanı / kesi / implant yok. TUS Yaram değil. */
import { postOpTakvim } from './cerrahi'

export function estetikCerrahiHatirlatmalari(ameliyatIso: string | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!ameliyatIso) return [{ ad: 'Kontrol tarihi hekiminiz kaydettiğinde burada görünür', durum: 'planli' }]
  return postOpTakvim(ameliyatIso, bugun).map((x) => ({ ad: x.ad, durum: x.durum }))
}
