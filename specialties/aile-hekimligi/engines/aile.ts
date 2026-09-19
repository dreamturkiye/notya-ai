/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Aile Hekimliği (birinci basamak) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. Aşı lot / mg / titrasyon Notya yazmaz.
 *  - Tanı kilidi yalnız hekimde: paket / sevk bayrağı KARAR DESTEĞİDİR.
 *  - Kırmızı bayraklar portal mesajı ile yönetilmez → 112.
 *  - Tam ulusal AHIS / e-Nabız canlı entegrasyon kapsam dışı.
 *  - Pediatri Baş Çevresi / Neyzi yalnız çocuk hastada (kapsam.ts cocuk-hastada); yetişkinde sızmaz.
 */
export type Ref =
  | 'TAHUD'
  | 'SB_AH'
  | 'SB_ASI'
  | 'SB_TARAMA'
  | 'SGK_SUT'
  | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TAHUD: 'Türkiye Aile Hekimleri Uzmanlık Derneği (TAHUD) — birinci basamak klinik kaynakları; güncel metni hekim doğrular',
  SB_AH: 'T.C. Sağlık Bakanlığı — Aile Hekimliği uygulama yönetmeliği ve kronik hastalık protokolleri',
  SB_ASI: 'T.C. SB Ulusal Aşılama Takvimi (çocuk + erişkin bağışıklama) — vade hatırlatması; doz / lot Notya yazmaz',
  SB_TARAMA: 'T.C. SB birinci basamak tarama ve koruyucu hekimlik rehberleri — vade karar desteği',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — aile hekimliği rapor/endikasyon koşulları; güncel metin hekim tarafından doğrulanır',
  TITCK: 'TİTCK — ürün kısa ürün bilgileri (KÜB); doz Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'Aşı/tarama paketi ve kronik izlem vadeleri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Göğüs ağrısı / baskı, ani şiddetli nefes darlığı, bilinç değişikliği, şiddetli kanama, ani yüz kayması veya güç kaybı varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Birinci basamak aile hekimliği muayenehanesi ürünü. Tam ulusal AHIS, tanı kilidi ve uydurma doz bu bölümün kapsamı değildir.'

export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function ayEkle(tarih: string, ay: number): string {
  const [y, m, d] = tarih.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10)
}

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}
