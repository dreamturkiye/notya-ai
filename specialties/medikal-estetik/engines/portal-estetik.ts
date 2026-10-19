import { islemTakvimi } from './estetik'

export function estetikHatirlatmalari(islemIso: string | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!islemIso) return [{ ad: 'Sonraki bakım tarihi hekiminiz kaydedince görünür', durum: 'planli' }]
  return islemTakvimi(islemIso, bugun).map((x) => ({ ad: x.ad, durum: x.durum }))
}
export function bakimRitim(): string[] {
  return ['1. gün erken kontrol', '14. gün botoks etki kontrolü', '28. gün dolgu oturma', 'Üçüncü ay kontrolü']
}
