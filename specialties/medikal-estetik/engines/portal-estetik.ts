import { islemTakvimi } from './estetik'

export function estetikHatirlatmalari(islemIso: string | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!islemIso) return [{ ad: 'Sonraki bakım tarihi hekiminiz kaydedince görünür', durum: 'planli' }]
  return islemTakvimi(islemIso, bugun).map((x) => ({ ad: x.ad, durum: x.durum }))
}
