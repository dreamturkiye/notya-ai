/** Sağlığım › Saçım — tanı / greft sayısı / ilaç adı yok. */
import { yikamaTakvimi } from './sac'

export function sacimHatirlatmalari(ameliyatIso: string | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!ameliyatIso) return [{ ad: 'Kontrol tarihi hekiminiz kaydettiğinde burada görünür', durum: 'planli' }]
  return yikamaTakvimi(ameliyatIso, bugun).map((x) => ({ ad: x.ad, durum: x.durum }))
}
