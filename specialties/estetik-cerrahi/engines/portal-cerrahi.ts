/** Sağlığım › Estetik ameliyat bakımı — tanı / kesi / implant yok. TUS Yaram değil. */
import { postOpTakvim } from './cerrahi'

export function estetikCerrahiHatirlatmalari(ameliyatIso: string | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!ameliyatIso) return [{ ad: 'Kontrol tarihi hekiminiz kaydettiğinde burada görünür', durum: 'planli' }]
  return postOpTakvim(ameliyatIso, bugun).map((x) => ({ ad: x.ad, durum: x.durum }))
}
export function ameliyatRitim(): string[] {
  return ['1. gün pansuman', '7. gün dikiş kontrolü', '14. gün yara bakımı', '42. gün geç izlem', 'Üçüncü ay izlem', 'Altıncı ay izlem', 'On ikinci ay izlem']
}
