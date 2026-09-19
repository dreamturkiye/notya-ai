/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — VAS (0–10) + ODI (Oswestry) skorlama. SAF fonksiyon.
 * Bant KARAR DESTEĞİDİR; "disk hernisi tanısı" veya ilaç dozu yazılmaz.
 * Kaynak: VAS klinik kullanım; ODI (Fairbank); TR klinik kullanım — güncel eşikleri hekim doğrular.
 */
import type { Dipnot } from './fizik-tedavi'

export type VasBant = 'hafif' | 'orta' | 'siddetli'
export type OdiBant = 'minimal' | 'orta' | 'siddetli' | 'cok_siddetli' | 'yataga_bagli'

export const VAS_BANT_AD: Record<VasBant, string> = {
  hafif: 'Hafif ağrı (0–3) — karar desteği',
  orta: 'Orta ağrı (4–6) — karar desteği',
  siddetli: 'Şiddetli ağrı (7–10) — karar desteği',
}

export const ODI_BANT_AD: Record<OdiBant, string> = {
  minimal: 'Minimal engellilik (0–20%) — karar desteği',
  orta: 'Orta engellilik (21–40%) — karar desteği',
  siddetli: 'Şiddetli engellilik (41–60%) — karar desteği',
  cok_siddetli: 'Çok şiddetli engellilik (61–80%) — karar desteği',
  yataga_bagli: 'Yatağa bağımlı / abartılı (81–100%) — karar desteği',
}

/** ODI 10 madde — her madde 0–5; hasta/hekim doldurur. */
export const ODI_MADDELER: readonly string[] = [
  'Ağrı şiddeti',
  'Kişisel bakım (yıkanma, giyinme)',
  'Kaldırma',
  'Yürüme',
  'Oturma',
  'Ayakta durma',
  'Uyuma',
  'Cinsel yaşam (uygunsa) / sosyal yaşam',
  'Sosyal yaşam',
  'Seyahat',
]

export interface VasSonuc {
  tamamMi: boolean
  deger: number | null
  bant: VasBant | null
  bantAd: string
  ozet: string
  dipnot: Dipnot
}

export interface OdiSonuc {
  tamamMi: boolean
  eksikMadde: number
  toplam: number | null
  yuzde: number | null
  bant: OdiBant | null
  bantAd: string
  ozet: string
  dipnot: Dipnot
}

export function vasBanti(deger: number): VasBant {
  if (deger <= 3) return 'hafif'
  if (deger <= 6) return 'orta'
  return 'siddetli'
}

export function odiBanti(yuzde: number): OdiBant {
  if (yuzde <= 20) return 'minimal'
  if (yuzde <= 40) return 'orta'
  if (yuzde <= 60) return 'siddetli'
  if (yuzde <= 80) return 'cok_siddetli'
  return 'yataga_bagli'
}

export function skorlaVas(degerHam: number | null | undefined): VasSonuc {
  const dipnot: Dipnot = { ref: 'VAS', not: 'VAS bandı karar desteğidir; tanı ve tedavi hekimindir' }
  if (degerHam == null || degerHam === ('' as unknown) || Number.isNaN(Number(degerHam))) {
    return { tamamMi: false, deger: null, bant: null, bantAd: '—', ozet: 'VAS boş — skor yorumlanmaz', dipnot }
  }
  const deger = Number(degerHam)
  if (deger < 0 || deger > 10) {
    return { tamamMi: false, deger: null, bant: null, bantAd: '—', ozet: 'VAS 0–10 aralığında olmalı', dipnot }
  }
  const bant = vasBanti(deger)
  return {
    tamamMi: true,
    deger,
    bant,
    bantAd: VAS_BANT_AD[bant],
    ozet: `VAS ${deger}/10 — ${VAS_BANT_AD[bant]}. Bant karar desteğidir; tanı ve doz hekimindir.`,
    dipnot,
  }
}

/**
 * maddeler: 10 sayı (0–5). Eksik madde varsa yüzde hesaplanmaz ve yorumlanmaz.
 * Yüzde = (toplam / 50) * 100.
 */
export function skorlaOdi(maddeler: Array<number | null | undefined>): OdiSonuc {
  const dipnot: Dipnot = { ref: 'ODI', not: 'ODI bandı karar desteğidir; tanı ve tedavi hekimindir' }
  const sayilar = maddeler.map((x) => (x == null || x === ('' as unknown) || Number.isNaN(Number(x)) ? null : Number(x)))
  const eksik = sayilar.filter((x) => x == null).length
  if (eksik || sayilar.length < 10) {
    return {
      tamamMi: false,
      eksikMadde: eksik || 10 - sayilar.length,
      toplam: null,
      yuzde: null,
      bant: null,
      bantAd: '—',
      ozet: `ODI eksik: ${eksik || 10 - sayilar.length} madde boş — kısmi skor yorumlanmaz`,
      dipnot,
    }
  }
  for (const n of sayilar as number[]) {
    if (n < 0 || n > 5) {
      return {
        tamamMi: false,
        eksikMadde: 0,
        toplam: null,
        yuzde: null,
        bant: null,
        bantAd: '—',
        ozet: 'ODI maddeleri 0–5 aralığında olmalı',
        dipnot,
      }
    }
  }
  const toplam = (sayilar as number[]).reduce((a, b) => a + b, 0)
  const yuzde = Math.round((toplam / 50) * 100)
  const bant = odiBanti(yuzde)
  return {
    tamamMi: true,
    eksikMadde: 0,
    toplam,
    yuzde,
    bant,
    bantAd: ODI_BANT_AD[bant],
    ozet: `ODI ${yuzde}% (toplam ${toplam}/50) — ${ODI_BANT_AD[bant]}. Bant karar desteğidir; tanı ve doz hekimindir.`,
    dipnot,
  }
}

export function sonrakiOlcekGun(bant: VasBant | OdiBant | null): number {
  if (bant === 'siddetli' || bant === 'cok_siddetli' || bant === 'yataga_bagli' || bant === 'orta') return 28
  return 56
}
