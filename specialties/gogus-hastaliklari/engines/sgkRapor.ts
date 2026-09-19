/**
 * GOGUS-EXCEPTIONAL-01 — Solunum / oksijen / nebulizatör rapor taslağı + SUT kontrol listesi.
 * T.C. yazılmaz. Tanı hekim seçer. Medula e-imza yok. Doz yok.
 */
import type { Dipnot } from './gogus'

export type GogusRaporSablon = 'uzun_oksijen' | 'nebulizator' | 'solunum_fonksiyon' | 'is_gucu_solunum' | 'tütün_danismanlik'

export const GOGUS_RAPOR_SABLONLARI: Array<{ id: GogusRaporSablon; ad: string }> = [
  { id: 'uzun_oksijen', ad: 'Uzun süreli oksijen tedavisi (USOT) rapor taslağı' },
  { id: 'nebulizator', ad: 'Nebulizatör / solunum cihazı rapor taslağı' },
  { id: 'solunum_fonksiyon', ad: 'Solunum fonksiyon değerlendirme bilgi notu' },
  { id: 'is_gucu_solunum', ad: 'Solunum ile ilgili durum bildirir rapor (kurum talebi)' },
  { id: 'tütün_danismanlik', ad: 'Tütün bırakma danışmanlığı bilgi notu' },
]

const KONTROL_LISTESI: Record<GogusRaporSablon, readonly string[]> = {
  uzun_oksijen: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'SpO₂ / kan gazı değerleri hekim kaydına işlendi (Notya uydurmaz)',
    'SUT uzun süreli oksijen koşulları güncel metinden teyit edildi',
    'Cihaz / litre akış seçimi hekim tarafından yazılacak (bu taslakta doz alanı yok)',
    'Kontrol ve yenileme tarihi planlandı',
  ],
  nebulizator: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Nebulizatör endikasyonu klinik gerekçeyle yazıldı',
    'SUT / medikal malzeme koşulları teyit edildi',
    'Eğitim ve hijyen planı yazıldı',
    'Kontrol tarihi planlandı',
  ],
  solunum_fonksiyon: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Elle girilen spirometri sayıları (varsa) kayda işlendi — cihaz entegrasyonu yok',
    'Ölçüm tarihi ve teknik yeterlilik hekim tarafından değerlendirildi',
    'Sonuç yorumu hekim imzasıyla',
    'Kontrol / tekrar ölçüm tarihi planlandı',
  ],
  is_gucu_solunum: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Kurumun istediği rapor türü teyit edildi',
    'Mesleki maruziyet / toz / duman öyküsü kaydedildi',
    'Değerlendirme yalnız kayıtlı bulgulara dayanıyor',
    'Kontrol tarihi planlandı',
  ],
  tütün_danismanlik: [
    'Paket-yılı / mevcut kullanım hekim tarafından kaydedildi',
    'ALO 171 / bırakma danışmanlığı anlatıldı',
    'Farmakolojik destek kararı hekimindir (doz Notya’da yok)',
    'Kontrol randevusu planlandı',
  ],
}

export interface GogusRaporDraft {
  sablon: GogusRaporSablon
  sablonAd: string
  hastaAdi: string
  tcSon4: ''
  tani: { icd10: string; aciklama: string } | null
  skorOzet: string[]
  sureAy: number
  hekimDegerlendirmesi: string
  izlemPlani: string[]
  duzenlemeTarihi: string
}

export interface GogusRaporSonuc {
  draft: GogusRaporDraft
  kontrolListesi: Array<{ madde: string; tamam: boolean | null }>
  eksikler: string[]
  dipnotlar: Dipnot[]
}

export interface GogusRaporGirdi {
  sablon: GogusRaporSablon
  hastaAdi: string
  tani?: { icd10: string; aciklama: string } | null
  skorOzet?: string[]
  sureAy?: number
  hekimDegerlendirmesi?: string
  izlemPlani?: string[]
  kontrolIsaretleri?: Array<boolean | null>
  bugun: string
}

export function gogusRaporTaslagi(g: GogusRaporGirdi): GogusRaporSonuc {
  const ad = GOGUS_RAPOR_SABLONLARI.find((x) => x.id === g.sablon)?.ad || g.sablon
  const liste = KONTROL_LISTESI[g.sablon]
  const kontrolListesi = liste.map((madde, i) => ({
    madde,
    tamam: g.kontrolIsaretleri && i < g.kontrolIsaretleri.length ? g.kontrolIsaretleri[i] ?? null : null,
  }))
  const eksikler: string[] = []
  if (!g.tani?.icd10 && g.sablon !== 'tütün_danismanlik') eksikler.push('ICD-10 / tanı hekim tarafından seçilmedi')
  if (!(g.hekimDegerlendirmesi || '').trim()) eksikler.push('Hekim değerlendirme metni boş')

  return {
    draft: {
      sablon: g.sablon,
      sablonAd: ad,
      hastaAdi: g.hastaAdi || '',
      tcSon4: '',
      tani: g.tani?.icd10 ? { icd10: g.tani.icd10.toUpperCase(), aciklama: g.tani.aciklama || '' } : null,
      skorOzet: g.skorOzet || [],
      sureAy: g.sureAy && g.sureAy > 0 ? g.sureAy : 6,
      hekimDegerlendirmesi: (g.hekimDegerlendirmesi || '').trim(),
      izlemPlani: g.izlemPlani || [],
      duzenlemeTarihi: g.bugun,
    },
    kontrolListesi,
    eksikler,
    dipnotlar: [
      { ref: 'SGK_SUT', not: 'SUT koşulları değişir; güncel madde metnini hekim doğrular. Medula e-imza bu üründe yok.' },
      { ref: 'TTD', not: 'Rapor taslağıdır; klinik karar ve imza hekimindir' },
    ],
  }
}
