/** Sağlığım › Saçım — tanı / greft sayısı / ilaç adı yok. */
import { yikamaTakvimi } from './sac'

export function sacimHatirlatmalari(ameliyatIso: string | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!ameliyatIso) return [{ ad: 'Kontrol tarihi hekiminiz kaydettiğinde burada görünür', durum: 'planli' }]
  return yikamaTakvimi(ameliyatIso, bugun).map((x) => ({ ad: x.ad, durum: x.durum }))
}
export function sacimRitim(): string[] {
  return ['1. gün ilk pansuman', '3. gün nazik yıkama', '10. gün kabuk kontrolü', '14. gün kontrol', 'Geçici dökülme penceresi', 'Dökülme penceresi kapanışı', 'Altıncı ay sonuç izlemi', 'On ikinci ay sonuç izlemi']
}
