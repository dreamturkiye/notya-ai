/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Kronik paket (DM / HT) izlem vadeleri. SAF fonksiyon.
 * SINIF düzeyi izlem görevleri. DOZ YAZMAZ, HbA1c/KB hedef sayısı yazmaz, tanı kilitlemez.
 */
import type { Dipnot } from './aile'
import { ayEkle } from './aile'

export type KronikPaketKod = 'dm' | 'ht' | 'dm_ht' | 'lipid' | 'astim_koah' | 'hipotiroid'

export interface KronikPaket {
  kod: KronikPaketKod
  ad: string
  izlemAy: number
  gorevler: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

export const KRONIK_PAKETLER: KronikPaket[] = [
  {
    kod: 'dm',
    ad: 'Diyabet izlem paketi',
    izlemAy: 3,
    gorevler: [
      { kod: 'kronik_dm_lab', ad: 'Diyabet laboratuvar / metabolik kontrol (hekim planı)' },
      { kod: 'kronik_dm_ayak', ad: 'Ayak / nöropati sorgusu kontrolü' },
      { kod: 'kronik_dm_goz', ad: 'Göz sevk / tarama hatırlatması' },
    ],
    dipnot: { ref: 'SB_AH', not: 'DM izlem aralığı hekimde; HbA1c hedefi ve doz yazılmaz' },
  },
  {
    kod: 'ht',
    ad: 'Hipertansiyon izlem paketi',
    izlemAy: 3,
    gorevler: [
      { kod: 'kronik_ht_kb', ad: 'Kan basıncı kontrol randevusu' },
      { kod: 'kronik_ht_lab', ad: 'Elektrolit / böbrek lab kontrolü (hekim planı)' },
    ],
    dipnot: { ref: 'SB_AH', not: 'HT izlem; hedef KB ve ilaç dozu hekimde' },
  },
  {
    kod: 'dm_ht',
    ad: 'Diyabet + hipertansiyon birleşik paket',
    izlemAy: 3,
    gorevler: [
      { kod: 'kronik_dm_lab', ad: 'Diyabet laboratuvar / metabolik kontrol (hekim planı)' },
      { kod: 'kronik_ht_kb', ad: 'Kan basıncı kontrol randevusu' },
      { kod: 'kronik_dm_ht_kv', ad: 'KV risk / organ hasarı sorgusu' },
    ],
    dipnot: { ref: 'SB_AH', not: 'Birleşik izlem; doz ve tanı hekimde' },
  },
  {
    kod: 'lipid',
    ad: 'Lipid / metabolik izlem',
    izlemAy: 6,
    gorevler: [{ kod: 'kronik_lipid_lab', ad: 'Lipid panel kontrolü (hekim planı)' }],
    dipnot: { ref: 'SB_AH', not: 'Lipid hedef ve statin dozu hekimde' },
  },
  {
    kod: 'astim_koah',
    ad: 'Astım / KOAH birinci basamak izlem',
    izlemAy: 6,
    gorevler: [
      { kod: 'kronik_solunum_kontrol', ad: 'Solunum kontrol randevusu' },
      { kod: 'kronik_inhaler', ad: 'İnhaler teknik kontrolü (doz yok)' },
    ],
    dipnot: { ref: 'SB_AH', not: 'İnhaler doz ve basamak tedavisi hekimde' },
  },
  {
    kod: 'hipotiroid',
    ad: 'Hipotiroidi izlem',
    izlemAy: 6,
    gorevler: [{ kod: 'kronik_tiroid_lab', ad: 'Tiroid lab kontrolü (hekim planı)' }],
    dipnot: { ref: 'TITCK', not: 'LT4 doz ayarı hekimde; Notya doz yazmaz' },
  },
]

export const KRONIK_PAKET_AD: Record<KronikPaketKod, string> = Object.fromEntries(
  KRONIK_PAKETLER.map((p) => [p.kod, p.ad]),
) as Record<KronikPaketKod, string>

export function kronikIzlemGorevleri(
  paketler: KronikPaketKod[],
  bugun: string,
): Array<{ kod: string; ad: string; due: string; kaynak: string }> {
  const out: Array<{ kod: string; ad: string; due: string; kaynak: string }> = []
  const seen = new Set<string>()
  for (const kod of paketler) {
    const p = KRONIK_PAKETLER.find((x) => x.kod === kod)
    if (!p) continue
    const due = ayEkle(bugun, p.izlemAy)
    for (const g of p.gorevler) {
      if (seen.has(g.kod)) continue
      seen.add(g.kod)
      out.push({ kod: g.kod, ad: g.ad, due, kaynak: 'kronik' })
    }
  }
  return out
}

export function kronikOzeti(paketler: KronikPaketKod[], sonrakiIzlem: string | null): string {
  if (!paketler.length) return 'Kronik paket seçilmedi — hekim değerlendirmesi esas'
  const adlar = paketler.map((k) => KRONIK_PAKET_AD[k] || k).join('; ')
  return `Kronik paket: ${adlar}${sonrakiIzlem ? ` · sonraki izlem ${sonrakiIzlem}` : ''} — doz/hedef sayı yok`
}
