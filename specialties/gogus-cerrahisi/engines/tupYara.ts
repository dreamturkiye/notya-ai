/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Toraks tüp / yara izlem. SAF fonksiyon.
 * Tarih + tip + durum. Tanı / doz / OR planı YOK.
 */
import { ISO_GUN } from './gogus-cerrahisi'
import type { Dipnot } from './gogus-cerrahisi'

export type TupYaraTip = 'toraks_tup' | 'yara' | 'dren'
export type TupYaraDurum = 'izlemde' | 'cikarildi' | 'iyilesiyor' | 'dikkat'

export interface TupYaraKart {
  tip: TupYaraTip
  durum: TupYaraDurum
  tarih: string | null
  sonrakiKontrol: string | null
  not: string | null
}

export interface TupYaraSonuc {
  tamamMi: boolean
  kart: TupYaraKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string }>
  dipnot: Dipnot
}

const TIP_AD: Record<TupYaraTip, string> = {
  toraks_tup: 'Toraks tüpü',
  yara: 'Cerrahi yara',
  dren: 'Dren',
}

const DURUM_AD: Record<TupYaraDurum, string> = {
  izlemde: 'izlemde',
  cikarildi: 'çıkarıldı',
  iyilesiyor: 'iyileşiyor',
  dikkat: 'dikkat — hekim değerlendirmesi',
}

export function tupYaraDozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|mg\/kg)\b|doz şeması|CAT\b|mMRC|GOLD\s*[ABCD]/i.test(metin)
}

export function tupYaraNormalize(ham: unknown): TupYaraKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const tipHam = String(o.tip || 'toraks_tup')
  const tip: TupYaraTip = tipHam === 'yara' || tipHam === 'dren' ? tipHam : 'toraks_tup'
  const durumHam = String(o.durum || 'izlemde')
  const durum: TupYaraDurum =
    durumHam === 'cikarildi' || durumHam === 'iyilesiyor' || durumHam === 'dikkat' ? durumHam : 'izlemde'
  return {
    tip,
    durum,
    tarih: tarih(o.tarih),
    sonrakiKontrol: tarih(o.sonrakiKontrol ?? o.sonraki_kontrol),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function tupYaraSkorla(ham: unknown): TupYaraSonuc {
  const kart = tupYaraNormalize(ham)
  const dipnot: Dipnot = { ref: 'TGCD', not: 'Tüp/yara izlem karar desteğidir; çekim ve tanı hekimin' }
  if (!kart.tarih) {
    return { tamamMi: false, kart, ozet: 'İzlem tarihi gerekli (YYYY-AA-GG).', gorevOnerileri: [], dipnot }
  }
  if (kart.not && tupYaraDozIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Tüp/yara notunda doz / CAT / mMRC yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const gorevOnerileri: TupYaraSonuc['gorevOnerileri'] = []
  if (kart.sonrakiKontrol) {
    gorevOnerileri.push({
      kod: `tup_yara_${kart.tip}`,
      ad: `${TIP_AD[kart.tip]} kontrolü`,
      due: kart.sonrakiKontrol,
    })
  }
  return {
    tamamMi: true,
    kart,
    ozet: `${TIP_AD[kart.tip]} · ${DURUM_AD[kart.durum]} · ${kart.tarih}${kart.sonrakiKontrol ? ` · sonraki: ${kart.sonrakiKontrol}` : ''}. Karar desteğidir; tanı/çekim hekimin.`,
    gorevOnerileri,
    dipnot,
  }
}

export const TUP_YARA_TIPLERI: Array<{ kod: TupYaraTip; ad: string }> = [
  { kod: 'toraks_tup', ad: TIP_AD.toraks_tup },
  { kod: 'yara', ad: TIP_AD.yara },
  { kod: 'dren', ad: TIP_AD.dren },
]

export const TUP_YARA_DURUMLARI: Array<{ kod: TupYaraDurum; ad: string }> = [
  { kod: 'izlemde', ad: DURUM_AD.izlemde },
  { kod: 'cikarildi', ad: DURUM_AD.cikarildi },
  { kod: 'iyilesiyor', ad: DURUM_AD.iyilesiyor },
  { kod: 'dikkat', ad: DURUM_AD.dikkat },
]
