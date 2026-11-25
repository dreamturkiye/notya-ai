/**
 * TR-PROTOKOL-KUTUPHANESI — the doctor's "Kaynak kütüphanesi" view model (GET /api/doktor/kaynaklar). Pure: registry data
 * shaped for one branş + the branş picker for all 40. No patient data; the only per-doctor input is the doctor's own branş.
 */
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { KLINIK_ETIKET, klinikYeniSlugMu } from '@/lib/specialties/klinikDikey'
import { bransBelgeleri, bransKapsami, TUM_BRANSLAR, TIP_BRANSLARI, type BransKapsami } from './index'
import type { BransKodu, ProtokolBelgesi } from './tipler'

export type KutuphaneBelgesi = Pick<ProtokolBelgesi, 'id' | 'baslik' | 'kisaAd' | 'yayinci' | 'tur' | 'surum' | 'yil' | 'yayinNo' | 'url' | 'durum' | 'sonDogrulama' | 'not' | 'yerineGelen'> & {
  bolumler: { baslik: string; sayfa?: number }[]
}

export type KutuphaneGorunumu = {
  secili: BransKodu
  seciliAd: string
  doktorBransi: BransKodu | null
  branslar: { kod: BransKodu; ad: string; grup: 'Tıp branşları' | 'Özel Branşlar' }[]
  belgeler: KutuphaneBelgesi[]
  kapsam: BransKapsami
}

export function bransAdi(kod: BransKodu): string {
  if (klinikYeniSlugMu(kod)) return KLINIK_ETIKET[kod]
  return SPECIALTIES.find((s) => s.key === kod)?.label || kod
}

export function bransKoduMu(ham: unknown): ham is BransKodu {
  return typeof ham === 'string' && (TUM_BRANSLAR as readonly string[]).includes(ham)
}

export function kutuphaneGorunumu(doktorBransi: BransKodu | null, istenen: unknown): KutuphaneGorunumu {
  const secili: BransKodu = bransKoduMu(istenen) ? istenen : doktorBransi || 'aile-hekimligi'
  return {
    secili,
    seciliAd: bransAdi(secili),
    doktorBransi,
    branslar: TUM_BRANSLAR.map((kod) => ({ kod, ad: bransAdi(kod), grup: (TIP_BRANSLARI as readonly string[]).includes(kod) ? 'Tıp branşları' as const : 'Özel Branşlar' as const })),
    belgeler: bransBelgeleri(secili).map((b) => ({
      id: b.id, baslik: b.baslik, kisaAd: b.kisaAd, yayinci: b.yayinci, tur: b.tur, surum: b.durum === 'guncel' ? b.surum : b.durum === 'yerine-yenisi-geldi' ? b.surum : null,
      yil: b.durum === 'dogrulanamadi' ? null : b.yil, yayinNo: b.yayinNo, url: b.url, durum: b.durum, sonDogrulama: b.sonDogrulama, not: b.not, yerineGelen: b.yerineGelen,
      bolumler: (b.bolumler || []).map((x) => ({ baslik: x.baslik, sayfa: x.sayfa })),
    })),
    kapsam: bransKapsami(secili),
  }
}
