/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Greft / yara izlem. SAF fonksiyon.
 * Tarih + tip + durum. Tanı / doz / OR planı YOK.
 */
import { ISO_GUN } from './kalp-damar'
import type { Dipnot } from './kalp-damar'

export type GreftYaraTip = 'greft' | 'yara' | 'bypass' | 'stent_graft'
export type GreftYaraDurum = 'izlemde' | 'iyilesiyor' | 'dikkat' | 'kapandi'

export interface GreftYaraKart {
  tip: GreftYaraTip
  durum: GreftYaraDurum
  tarih: string | null
  sonrakiKontrol: string | null
  not: string | null
}

export interface GreftYaraSonuc {
  tamamMi: boolean
  kart: GreftYaraKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string }>
  dipnot: Dipnot
}

const TIP_AD: Record<GreftYaraTip, string> = {
  greft: 'Vasküler greft',
  yara: 'Cerrahi yara',
  bypass: 'Bypass hattı',
  stent_graft: 'Stent-graft',
}

const DURUM_AD: Record<GreftYaraDurum, string> = {
  izlemde: 'izlemde',
  iyilesiyor: 'iyileşiyor',
  dikkat: 'dikkat — hekim değerlendirmesi',
  kapandi: 'kapandı / iyileşti',
}

export function greftYaraDozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|mg\/kg)\b|doz şeması|SCORE\s*2|SCORE2|warfarin\s*\d/i.test(metin)
}

export function greftYaraNormalize(ham: unknown): GreftYaraKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const tipHam = String(o.tip || 'greft')
  const tip: GreftYaraTip =
    tipHam === 'yara' || tipHam === 'bypass' || tipHam === 'stent_graft' ? tipHam : 'greft'
  const durumHam = String(o.durum || 'izlemde')
  const durum: GreftYaraDurum =
    durumHam === 'iyilesiyor' || durumHam === 'dikkat' || durumHam === 'kapandi' ? durumHam : 'izlemde'
  return {
    tip,
    durum,
    tarih: tarih(o.tarih),
    sonrakiKontrol: tarih(o.sonrakiKontrol ?? o.sonraki_kontrol),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function greftYaraSkorla(ham: unknown): GreftYaraSonuc {
  const kart = greftYaraNormalize(ham)
  const dipnot: Dipnot = { ref: 'TKD_DAMAR', not: 'Greft/yara izlem karar desteğidir; tanı hekimin' }
  if (!kart.tarih) {
    return { tamamMi: false, kart, ozet: 'İzlem tarihi gerekli (YYYY-AA-GG).', gorevOnerileri: [], dipnot }
  }
  if (kart.not && greftYaraDozIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Greft/yara notunda doz / SCORE2 yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const gorevOnerileri: GreftYaraSonuc['gorevOnerileri'] = []
  if (kart.sonrakiKontrol) {
    gorevOnerileri.push({
      kod: `greft_yara_${kart.tip}`,
      ad: `${TIP_AD[kart.tip]} kontrolü`,
      due: kart.sonrakiKontrol,
    })
  }
  return {
    tamamMi: true,
    kart,
    ozet: `${TIP_AD[kart.tip]} · ${DURUM_AD[kart.durum]} · ${kart.tarih}${kart.sonrakiKontrol ? ` · sonraki: ${kart.sonrakiKontrol}` : ''}. Karar desteğidir; tanı hekimin.`,
    gorevOnerileri,
    dipnot,
  }
}

export const GREFT_YARA_TIPLERI: Array<{ kod: GreftYaraTip; ad: string }> = [
  { kod: 'greft', ad: TIP_AD.greft },
  { kod: 'yara', ad: TIP_AD.yara },
  { kod: 'bypass', ad: TIP_AD.bypass },
  { kod: 'stent_graft', ad: TIP_AD.stent_graft },
]

export const GREFT_YARA_DURUMLARI: Array<{ kod: GreftYaraDurum; ad: string }> = [
  { kod: 'izlemde', ad: DURUM_AD.izlemde },
  { kod: 'iyilesiyor', ad: DURUM_AD.iyilesiyor },
  { kod: 'dikkat', ad: DURUM_AD.dikkat },
  { kod: 'kapandi', ad: DURUM_AD.kapandi },
]
