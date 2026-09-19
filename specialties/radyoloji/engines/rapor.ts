/**
 * RADYOLOJI-EXCEPTIONAL-01 — Yapılandırılmış rapor taslağı (BI-RADS-style).
 * SAF fonksiyon. Kategori HEKİM seçer — otomatik tanı / AI kilidi DEĞİL.
 */
import { uydurmaBulguIceriyorMu, type Dipnot } from './radyoloji'

/** BI-RADS 0–6 + genel şablon maddeleri — klinik araç; tanı auto-lock yok. */
export type BiradsKategori = '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'genel'

export const BIRADS_KATEGORILER: Array<{ kod: BiradsKategori; ad: string; aciklama: string }> = [
  { kod: '0', ad: 'BI-RADS 0', aciklama: 'Eksik değerlendirme — ek görüntüleme gerekebilir (hekim kararı)' },
  { kod: '1', ad: 'BI-RADS 1', aciklama: 'Negatif — hekim rapor dilini yazar' },
  { kod: '2', ad: 'BI-RADS 2', aciklama: 'Benign bulgu — hekim rapor dilini yazar' },
  { kod: '3', ad: 'BI-RADS 3', aciklama: 'Muhtemel benign — kısa takip hekim planı' },
  { kod: '4', ad: 'BI-RADS 4', aciklama: 'Şüpheli — biyopsi değerlendirmesi hekimde' },
  { kod: '5', ad: 'BI-RADS 5', aciklama: 'Yüksek şüphe — klinik eylem hekimde' },
  { kod: '6', ad: 'BI-RADS 6', aciklama: 'Bilinen malignite (biyopsi kanıtlı) — hekim kilidi' },
  { kod: 'genel', ad: 'Genel yapılandırılmış rapor', aciklama: 'Mamografi dışı modalite şablonu — kategori zorunlu değil' },
]

export type RaporSablonKod =
  | 'endikasyon'
  | 'teknik'
  | 'bulgular_yapilandirilmis'
  | 'karsilastirma'
  | 'sonuc_ozet'
  | 'onerilen_izlem'
  | 'klinisyen_bildirim'

export const RAPOR_SABLON: Array<{ kod: RaporSablonKod; ad: string }> = [
  { kod: 'endikasyon', ad: 'Endikasyon / klinik soru' },
  { kod: 'teknik', ad: 'Teknik / protokol (doz sayısı yazılmaz)' },
  { kod: 'bulgular_yapilandirilmis', ad: 'Yapılandırılmış bulgular (hekim yazar)' },
  { kod: 'karsilastirma', ad: 'Önceki tetkikle karşılaştırma' },
  { kod: 'sonuc_ozet', ad: 'Sonuç özeti (tanı kilidi hekimde)' },
  { kod: 'onerilen_izlem', ad: 'Önerilen izlem / ek tetkik (hekim)' },
  { kod: 'klinisyen_bildirim', ad: 'Klinisyen bildirimi gerekti mi?' },
]

export interface RaporSonuc {
  tamamMi: boolean
  kategori: BiradsKategori
  secilen: RaporSablonKod[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

export function raporSkorla(kategoriHam: unknown, secilenHam: unknown, not?: string | null): RaporSonuc {
  const dipnot: Dipnot = { ref: 'ACR_TR', not: 'BI-RADS-style şablon klinik araçtır; otomatik tanı değildir' }
  const kategori = String(kategoriHam || 'genel') as BiradsKategori
  const izinliKat = new Set(BIRADS_KATEGORILER.map((k) => k.kod))
  const izinliSab = new Set(RAPOR_SABLON.map((s) => s.kod))
  const secilen = (Array.isArray(secilenHam) ? secilenHam.map(String) : []).filter((k): k is RaporSablonKod => izinliSab.has(k as RaporSablonKod))

  if (!izinliKat.has(kategori)) {
    return { tamamMi: false, kategori: 'genel', secilen, ozet: 'Geçerli bir kategori seçin.', gorevOnerileri: [], dipnot }
  }
  if (not && uydurmaBulguIceriyorMu(not)) {
    return { tamamMi: false, kategori, secilen, ozet: 'Rapor notunda AI / otomatik tanı dili yazılamaz.', gorevOnerileri: [], dipnot }
  }
  if (!secilen.length) {
    return { tamamMi: false, kategori, secilen, ozet: 'En az bir şablon maddesi seçin.', gorevOnerileri: [], dipnot }
  }

  const katAd = BIRADS_KATEGORILER.find((k) => k.kod === kategori)!.ad
  const adlar = RAPOR_SABLON.filter((s) => secilen.includes(s.kod)).map((s) => s.ad)
  const gorevOnerileri: RaporSonuc['gorevOnerileri'] = []
  if (secilen.includes('onerilen_izlem')) gorevOnerileri.push({ kod: 'rapor_izlem', ad: 'Rapor sonrası izlem / ek tetkik' })
  if (secilen.includes('klinisyen_bildirim') || kategori === '4' || kategori === '5') {
    gorevOnerileri.push({ kod: 'klinisyen_bildirim', ad: 'Klinisyen bildirimi kontrolü' })
  }

  return {
    tamamMi: true,
    kategori,
    secilen,
    ozet: `Yapılandırılmış rapor taslağı (${katAd}): ${adlar.join('; ')}. Hekim seçimi — otomatik tanı / AI kilidi değildir.`,
    gorevOnerileri,
    dipnot,
  }
}
