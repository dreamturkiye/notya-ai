/**
 * UROLOJI-EXCEPTIONAL-01 — PSA ng/mL izlemi. SAF fonksiyon, LLM yok.
 *
 * Değer + (2+ nokta varsa) hız. Bantlar KARAR DESTEĞİDİR — kanser tanısı değildir.
 * Yaş notları hekim karar desteğidir; motor "prostat kanseri" demez.
 */
import type { Dipnot } from './uroloji'
import { gunFarki } from './uroloji'

export type PsaBant = 'dusuk' | 'sinir' | 'yuksek' | 'cok_yuksek'

/** Bant adları izlem dilidir — tanı dili değildir. */
export const PSA_BANT_AD: Record<PsaBant, string> = {
  dusuk: 'Düşük aralık (karar desteği)',
  sinir: 'Sınır / gri bölge (karar desteği)',
  yuksek: 'Yüksek aralık (karar desteği)',
  cok_yuksek: 'Çok yüksek aralık (karar desteği)',
}

/** Kabaca yerleşik izlem eşikleri (ng/mL): <2.5 / 2.5–3.9 / 4–9.9 / ≥10 — tanı değildir. */
export const PSA_BANT_ARALIK: Array<{ bant: PsaBant; alt: number; ust: number }> = [
  { bant: 'dusuk', alt: 0, ust: 2.49 },
  { bant: 'sinir', alt: 2.5, ust: 3.99 },
  { bant: 'yuksek', alt: 4, ust: 9.99 },
  { bant: 'cok_yuksek', alt: 10, ust: 1000 },
]

export const PSA_ENAZ = 0
export const PSA_ENUST = 1000
/** Hız için tercih edilen minimum aralık (gün). */
export const PSA_HIZ_MIN_GUN = 90

export interface PsaNokta {
  tarih: string
  deger: number
}

export interface PsaSonuc {
  deger: number | null
  bant: PsaBant | null
  bantAd: string
  hizNgMlYil: number | null
  hizNot: string
  yasNotu: string | null
  ozet: string
  dipnot: Dipnot
}

export function bantBul(deger: number): PsaBant {
  for (const a of PSA_BANT_ARALIK) if (deger >= a.alt && deger <= a.ust) return a.bant
  return deger < 0 ? 'dusuk' : 'cok_yuksek'
}

/** Yaş notu — hekim karar desteği; tanı iddiası yok. */
export function yasNotu(yas: number | null | undefined): string | null {
  if (yas == null || !Number.isFinite(yas)) return null
  const y = Math.floor(Number(yas))
  if (y < 40) return '40 yaş altı PSA izlemi endikasyonu hekim değerlendirmesidir (karar desteği).'
  if (y < 50) return '40–49 yaş: bireysel risk ve hekim kararına göre izlem (karar desteği).'
  if (y < 70) return '50–69 yaş: izlem sıklığı ve eşik yorumu hekim karar desteğidir.'
  return '70+ yaş: komorbidite ve yaşam beklentisiyle birlikte hekim karar desteği.'
}

/**
 * Tek ölçüm veya seri. Hız: en az 2 nokta, tercihen ≥3 ay ara; ng/mL/yıl.
 * "Kanser" / "malignite" dili YOK.
 */
export function skorla(
  deger: number | null | undefined,
  oncekiler: PsaNokta[] = [],
  yas: number | null | undefined = null,
): PsaSonuc {
  const yasN = yasNotu(yas)
  if (deger == null || !Number.isFinite(Number(deger))) {
    return {
      deger: null, bant: null, bantAd: '—', hizNgMlYil: null,
      hizNot: 'PSA değeri girilmedi', yasNotu: yasN,
      ozet: 'PSA değeri yok — izlem yorumlanmaz',
      dipnot: { ref: 'PSA_IZLEM', not: 'PSA ng/mL izlemi karar desteğidir; kanser tanısı değildir.' },
    }
  }
  const n = Number(deger)
  if (n < PSA_ENAZ || n > PSA_ENUST) {
    return {
      deger: null, bant: null, bantAd: '—', hizNgMlYil: null,
      hizNot: 'Değer aralık dışı', yasNotu: yasN,
      ozet: `PSA ${n} ng/mL aralık dışı (${PSA_ENAZ}–${PSA_ENUST}) — kaydedilmez`,
      dipnot: { ref: 'PSA_IZLEM', not: 'PSA ng/mL izlemi karar desteğidir; kanser tanısı değildir.' },
    }
  }
  const bant = bantBul(n)
  const onceki = oncekiler
    .filter((p) => Number.isFinite(p.deger) && /^\d{4}-\d{2}-\d{2}/.test(p.tarih))
    .sort((a, b) => b.tarih.localeCompare(a.tarih))[0]
  const hizNot = onceki
    ? `Önceki: ${onceki.deger} ng/mL (${onceki.tarih.slice(0, 10)}) — hız için skorlaSeri kullanın`
    : 'Karşılaştırma için önceki PSA yok'

  const ozet = `PSA ${n} ng/mL — ${PSA_BANT_AD[bant]} (karar desteği; tanı hekimin).${yasN ? ` ${yasN}` : ''}`
  return {
    deger: Math.round(n * 100) / 100,
    bant,
    bantAd: PSA_BANT_AD[bant],
    hizNgMlYil: null,
    hizNot,
    yasNotu: yasN,
    ozet,
    dipnot: {
      ref: 'PSA_IZLEM',
      not: 'PSA ng/mL ve hız karar desteğidir; prostat kanseri tanısı değildir. İleri tetkik ve tanı hekimindir.',
    },
  }
}

/**
 * Seri skorlama: en az iki nokta (tarih + değer). Tercihen ≥ PSA_HIZ_MIN_GUN ara.
 * Hız = (son − önceki) / (gün/365) ng/mL/yıl.
 */
export function skorlaSeri(noktalar: PsaNokta[], yas: number | null | undefined = null): PsaSonuc {
  const temiz = noktalar
    .filter((p) => Number.isFinite(p.deger) && p.deger >= PSA_ENAZ && p.deger <= PSA_ENUST && /^\d{4}-\d{2}-\d{2}/.test(p.tarih))
    .map((p) => ({ tarih: p.tarih.slice(0, 10), deger: Number(p.deger) }))
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
  if (!temiz.length) return skorla(null, [], yas)
  const son = temiz[temiz.length - 1]
  const base = skorla(son.deger, temiz.slice(0, -1), yas)
  if (temiz.length < 2) return base
  const onceki = temiz[temiz.length - 2]
  const gun = gunFarki(onceki.tarih, son.tarih)
  if (gun <= 0) {
    return { ...base, hizNot: 'Tarihler geçersiz — hız hesaplanmaz' }
  }
  const hiz = Math.round(((son.deger - onceki.deger) / (gun / 365)) * 100) / 100
  const kisa = gun < PSA_HIZ_MIN_GUN
  const hizNot = kisa
    ? `Hız ~${hiz} ng/mL/yıl (${gun} gün ara — tercih edilen ≥${PSA_HIZ_MIN_GUN} gün; kısa aralıkta dikkatli yorum, hekim karar desteği)`
    : `Hız ~${hiz} ng/mL/yıl (${gun} gün ara; karar desteği — tanı değildir)`
  return {
    ...base,
    hizNgMlYil: hiz,
    hizNot,
    ozet: `${base.ozet} ${hizNot}`,
  }
}

export function sonrakiPsaGun(bant: PsaBant | null): number {
  if (!bant) return 365
  if (bant === 'cok_yuksek') return 30
  if (bant === 'yuksek') return 90
  if (bant === 'sinir') return 180
  return 365
}
