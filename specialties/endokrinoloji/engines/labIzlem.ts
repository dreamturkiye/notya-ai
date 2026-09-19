/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — HbA1c / tiroid izlem döngüsü. SAF fonksiyon.
 * Değer → önerilen sonraki izlem aralığı (karar desteği). Tanı yazmaz, doz yazmaz.
 * Kaynak: TEMD DM / Tiroid kılavuzları — güncel eşikleri hekim doğrular.
 */
import type { Dipnot } from './endokrinoloji'
import { ayEkle } from './endokrinoloji'

export type LabTur = 'hba1c' | 'tsh' | 'ft4' | 'diger'

export type LabBant = 'hedef_yakin' | 'dikkat' | 'yuksek' | 'bilinmiyor'

export const LAB_BANT_AD: Record<LabBant, string> = {
  hedef_yakin: 'Hedefe yakın — karar desteği',
  dikkat: 'Dikkat aralığı — karar desteği',
  yuksek: 'Yüksek / düşük uç — karar desteği',
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

/** HbA1c % (NGSP). Bant karar desteği — diyabet tanısı veya doz yazılmaz. */
export function hba1cBanti(deger: number): LabBant {
  if (deger < 7) return 'hedef_yakin'
  if (deger < 9) return 'dikkat'
  return 'yuksek'
}

/** TSH mIU/L — kaba yetişkin aralık; hekim klinik bağlamı ekler. Tanı yazılmaz. */
export function tshBanti(deger: number): LabBant {
  if (deger >= 0.4 && deger <= 4.0) return 'hedef_yakin'
  if ((deger > 4.0 && deger <= 10) || (deger >= 0.1 && deger < 0.4)) return 'dikkat'
  return 'yuksek'
}

function sonrakiAyIcin(tur: LabTur, bant: LabBant): number {
  if (tur === 'hba1c') {
    if (bant === 'yuksek') return 3
    if (bant === 'dikkat') return 3
    return 6
  }
  if (tur === 'tsh' || tur === 'ft4') {
    if (bant === 'yuksek') return 2
    if (bant === 'dikkat') return 3
    return 6
  }
  return 6
}

/**
 * Lab değerini skorlar. Eksik / geçersiz değerde yorumlanmaz.
 * HbA1c: 3–20 % makul; TSH: 0.01–100 mIU/L makul.
 */
export function labSkorla(tur: LabTur, degerHam: number | null | undefined): LabSonuc {
  const dipnot: Dipnot = {
    ref: tur === 'hba1c' ? 'TEMD_DM' : 'TEMD_TIROID',
    not: 'Lab bandı karar desteğidir; tanı ve tedavi hekimindir',
  }
  if (degerHam == null || degerHam === ('' as unknown) || Number.isNaN(Number(degerHam))) {
    return {
      tamamMi: false, tur, deger: null, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'Değer eksik — kısmi lab yorumlanmaz', dipnot,
    }
  }
  const deger = Number(degerHam)
  if (tur === 'hba1c' && (deger < 3 || deger > 20)) {
    return {
      tamamMi: false, tur, deger, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'HbA1c %3–20 aralığında olmalı', dipnot,
    }
  }
  if ((tur === 'tsh' || tur === 'ft4') && (deger < 0.01 || deger > 100)) {
    return {
      tamamMi: false, tur, deger, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'TSH / FT4 makul aralık dışında — hekim doğrular', dipnot,
    }
  }
  if (tur === 'diger') {
    return {
      tamamMi: true, tur, deger, bant: 'bilinmiyor', bantAd: LAB_BANT_AD.bilinmiyor, sonrakiAy: 6,
      ozet: `Lab değeri ${deger} kaydedildi — izlem aralığı hekim kararı (öneri 6 ay).`, dipnot,
    }
  }
  const bant = tur === 'hba1c' ? hba1cBanti(deger) : tshBanti(deger)
  const sonrakiAy = sonrakiAyIcin(tur, bant)
  const etiket = tur === 'hba1c' ? 'HbA1c' : tur.toUpperCase()
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
  hba1c: 'HbA1c (%)',
  tsh: 'TSH (mIU/L)',
  ft4: 'FT4',
  diger: 'Diğer (hekim etiketi)',
}
