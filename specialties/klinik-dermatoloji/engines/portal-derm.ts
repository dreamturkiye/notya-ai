/** Sağlığım › Klinik deri bakımı — tanı / skor / fluence yok. TUS Derim değil. */
import { akneBakimTakvimi } from './derm'

export function klinikDermHatirlatmalari(baslangicIso: string | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!baslangicIso) return [{ ad: 'Kontrol tarihi uzmanınız kaydettiğinde burada görünür', durum: 'planli' }]
  return akneBakimTakvimi(baslangicIso, bugun).map((x) => ({ ad: x.ad, durum: x.durum }))
}
export function dermRitim(): string[] {
  return ['Lazer aralığı 14–90 gün (hekim)', 'Ertesi gün cilt kontrolü', 'Bir hafta cilt kontrolü', 'Akne bakım 2 / 6 / 12. hafta']
}
