/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — HBV / HCV izlem vadeleri. SAF fonksiyon.
 * Durum bandı → önerilen sonraki izlem aralığı. Antiviral doz / şema YOK. Tanı yazmaz.
 */
import type { Dipnot } from './gastroenteroloji'
import { ayEkle } from './gastroenteroloji'

export type HepatitTur = 'hbv' | 'hcv' | 'diger'

export type HepatitBant = 'stabil' | 'aktif_izlem' | 'tedavi_degerlendirme' | 'bilinmiyor'

export const HEPATIT_BANT_AD: Record<HepatitBant, string> = {
  stabil: 'Stabil izlem — karar desteği',
  aktif_izlem: 'Aktif izlem — karar desteği',
  tedavi_degerlendirme: 'Tedavi değerlendirme penceresi — karar desteği',
  bilinmiyor: 'Band girilmedi',
}

export const HEPATIT_TUR_ETIKET: Record<HepatitTur, string> = {
  hbv: 'HBV izlem',
  hcv: 'HCV izlem',
  diger: 'Diğer hepatit izlem',
}

export interface HepatitSonuc {
  tamamMi: boolean
  tur: HepatitTur
  bant: HepatitBant
  bantAd: string
  sonrakiAy: number | null
  sonrakiTarih: string | null
  ozet: string
  dipnot: Dipnot
}

function sonrakiAyIcin(bant: HepatitBant): number {
  if (bant === 'tedavi_degerlendirme') return 3
  if (bant === 'aktif_izlem') return 6
  if (bant === 'stabil') return 12
  return 6
}

export function hepatitPlanla(
  tur: HepatitTur,
  bant: HepatitBant,
  bugun: string,
): HepatitSonuc {
  const dipnot: Dipnot = {
    ref: tur === 'hcv' ? 'TKAD_HCV' : 'TKAD_HBV',
    not: 'Hepatit izlem aralığı karar desteğidir; antiviral doz hekimindir',
  }
  if (bant === 'bilinmiyor') {
    return {
      tamamMi: false, tur, bant, bantAd: HEPATIT_BANT_AD.bilinmiyor, sonrakiAy: null, sonrakiTarih: null,
      ozet: 'İzlem bandı seçilmedi — plan yorumlanmaz', dipnot,
    }
  }
  const sonrakiAy = sonrakiAyIcin(bant)
  const sonrakiTarih = ayEkle(bugun, sonrakiAy)
  return {
    tamamMi: true,
    tur,
    bant,
    bantAd: HEPATIT_BANT_AD[bant],
    sonrakiAy,
    sonrakiTarih,
    ozet: `${HEPATIT_TUR_ETIKET[tur]} · ${HEPATIT_BANT_AD[bant]} · önerilen izlem ~${sonrakiAy} ay → ${sonrakiTarih}. Antiviral doz ve tanı hekimin.`,
    dipnot,
  }
}

export const HEPATIT_KONTROL_LISTESI: readonly string[] = [
  'Son laboratuvar / viral yük tarihi hekim dosyasında doğrulandı',
  'Fibroz / siroz durumu hekim değerlendirmesinde (Notya tanı yazmaz)',
  'Antiviral / DAA dozu hekim planında (Notya doz yazmaz)',
  'Sonraki izlem tarihi hasta ile paylaşıldı',
  'Tedavi başlatma / değiştirme kararı hekimindir',
]
