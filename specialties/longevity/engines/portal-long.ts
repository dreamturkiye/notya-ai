import { sonrakiInfuzon } from './long'

export function longevitimHatirlatmalari(sonIso: string | null, aralikGun: number | null, bugun: string): Array<{ ad: string; durum: string }> {
  if (!sonIso || !aralikGun) return [{ ad: 'Sonraki seans tarihi hekiminiz kaydedince görünür', durum: 'planli' }]
  const s = sonrakiInfuzon(sonIso, aralikGun, bugun)
  if ('hata' in s) return [{ ad: s.hata, durum: 'planli' }]
  return [{ ad: `Sonraki seans ${s.due}`, durum: s.durum }]
}
