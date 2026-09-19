/**
 * ROMATOLOJI-EXCEPTIONAL-01 — CRP / ESR / RF izlem. SAF fonksiyon.
 * Bant karar desteği; tanı yazılmaz, doz yazılmaz.
 */
import type { Dipnot } from './romatoloji'
import { ayEkle } from './romatoloji'

export type LabTur = 'crp' | 'esr' | 'rf' | 'anti_ccp' | 'diger'

export type LabBant = 'hedef_yakin' | 'dikkat' | 'yuksek' | 'bilinmiyor'

export const LAB_BANT_AD: Record<LabBant, string> = {
  hedef_yakin: 'Hedefe yakın — karar desteği',
  dikkat: 'Dikkat aralığı — karar desteği',
  yuksek: 'Yüksek uç — karar desteği',
  bilinmiyor: 'Aralık yorumlanmadı',
}

export interface LabSonuc {
  tamamMi: boolean
  tur: LabTur
  deger: number | null
  bant: LabBant | null
  bantAd: string
  sonrakiAy: number | null
  ozet: string
  dipnot: Dipnot
}

/** CRP mg/L — kaba yetişkin aralık; hekim klinik bağlamı ekler. */
export function crpBanti(deger: number): LabBant {
  if (deger < 5) return 'hedef_yakin'
  if (deger < 20) return 'dikkat'
  return 'yuksek'
}

/** ESR mm/saat — kaba; yaş/cinsiyet hekimde. */
export function esrBanti(deger: number): LabBant {
  if (deger < 20) return 'hedef_yakin'
  if (deger < 40) return 'dikkat'
  return 'yuksek'
}

function sonrakiAyIcin(tur: LabTur, bant: LabBant): number {
  if (tur === 'crp' || tur === 'esr') {
    if (bant === 'yuksek') return 1
    if (bant === 'dikkat') return 2
    return 3
  }
  return 6
}

export function labSkorla(tur: LabTur, degerHam: number | null | undefined): LabSonuc {
  const dipnot: Dipnot = { ref: 'TRD', not: 'Lab bandı karar desteğidir; tanı ve tedavi hekimindir' }
  if (degerHam == null || degerHam === ('' as unknown) || Number.isNaN(Number(degerHam))) {
    return {
      tamamMi: false, tur, deger: null, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'Değer eksik — kısmi lab yorumlanmaz', dipnot,
    }
  }
  const deger = Number(degerHam)
  if ((tur === 'crp' || tur === 'esr') && (deger < 0 || deger > 500)) {
    return {
      tamamMi: false, tur, deger, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'CRP / ESR makul aralık dışında — hekim doğrular', dipnot,
    }
  }
  if (tur === 'rf' || tur === 'anti_ccp' || tur === 'diger') {
    return {
      tamamMi: true, tur, deger, bant: 'bilinmiyor', bantAd: LAB_BANT_AD.bilinmiyor, sonrakiAy: 6,
      ozet: `${tur === 'rf' ? 'RF' : tur === 'anti_ccp' ? 'anti-CCP' : 'Lab'} ${deger} kaydedildi — izlem aralığı hekim kararı (öneri 6 ay). Tanı yazılmaz.`,
      dipnot,
    }
  }
  const bant = tur === 'crp' ? crpBanti(deger) : esrBanti(deger)
  const sonrakiAy = sonrakiAyIcin(tur, bant)
  const etiket = tur === 'crp' ? 'CRP' : 'ESR'
  return {
    tamamMi: true,
    tur,
    deger,
    bant,
    bantAd: LAB_BANT_AD[bant],
    sonrakiAy,
    ozet: `${etiket} ${deger} — ${LAB_BANT_AD[bant]}. Önerilen izlem ~${sonrakiAy} ay (karar desteği; tanı/doz hekimin).`,
    dipnot,
  }
}

export function sonrakiIzlemTarihi(tarih: string, sonrakiAy: number | null): string | null {
  if (sonrakiAy == null) return null
  return ayEkle(tarih, sonrakiAy)
}

export const LAB_TUR_ETIKET: Record<LabTur, string> = {
  crp: 'CRP (mg/L)',
  esr: 'ESR (mm/saat)',
  rf: 'RF',
  anti_ccp: 'anti-CCP',
  diger: 'Diğer (hekim etiketi)',
}
