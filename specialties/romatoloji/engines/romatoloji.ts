/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Romatoloji (ayaktan muayenehane / poliklinik) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma biyolojik / DMARD dozu YOK.
 *  - Tanı kilidi yalnız hekimde: DAS28 / BASDAI / CRP karar desteğidir.
 *  - İnfüzyon süiti / HIS randevu core ürünü DEĞİLDİR (intentional Missing).
 *  - Septik artrit / ciddi alev portal mesajı ile yönetilmez → 112.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 *  - Ortopedi / FTR araçları bu chapter'a sızmaz (BRANS_… romatoloji only).
 */
export type Ref = 'TRD' | 'SB_ROMA' | 'SGK_SUT' | 'EULAR_ACR' | 'TITCK'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TRD: 'Türkiye Romatoloji Derneği klinik kılavuzları — aktivite skorları karar desteği; tanı/doz hekimin',
  SB_ROMA: 'T.C. Sağlık Bakanlığı — romatoid artrit / SLE klinik protokolleri (yönlendirme)',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — biyolojik DMARD rapor/endikasyon; güncel metin hekim doğrular',
  EULAR_ACR: 'EULAR/ACR kriterlerinin TR romatoloji pratiğindeki yorumu — skor bandı tanı değildir',
  TITCK: 'TİTCK — KÜB; biyolojik ajan dozu Notya tarafından üretilmez',
}

export const HEKIM_KILIT_METNI =
  'DAS28 / BASDAI / CRP izlem önerileri karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Ateşli sıcak eklem (septik artrit şüphesi), ani nefes darlığı / göğüs ağrısı, bilinç değişikliği veya yaygın döküntü + ateş varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan romatoloji muayenehanesi / polikliniği ürünü. İnfüzyon süiti HIS randevusu, tanı kilidi ve uydurma biyolojik doz bu bölümün kapsamı değildir.'

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
