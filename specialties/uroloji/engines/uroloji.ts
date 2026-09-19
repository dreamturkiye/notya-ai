/**
 * UROLOJI-EXCEPTIONAL-01 — Üroloji (ayaktan muayenehane / poliklinik) ortak referans katmanı.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Uydurma doz YOK. İlaç önerileri yalnız SINIF düzeyinde; mg / gün sayısı hekimin.
 *  - Tanı kilidi yalnız hekimde: IPSS ve PSA bantları KARAR DESTEĞİDİR; "BPH" / "prostat kanseri"
 *    gibi tanılar Notya tarafından yazılmaz.
 *  - Makroskopik hematüri, anüri/retansiyon, flank+ateş, torsiyon şüphesi, priapizm, üretra travması
 *    portal mesajı ile yönetilmez → 112 veya en yakın acil.
 *  - Canlı Medula e-imza yok.
 *  - Ameliyathane planlama / cerrahi HIS bu ürünün kapsamı değildir.
 */
export type Ref =
  | 'TUD'
  | 'SB_URO'
  | 'SGK_SUT'
  | 'TITCK'
  | 'IPSS'
  | 'PSA_IZLEM'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TUD: 'Türk Üroloji Derneği (TÜD) — ayaktan üroloji uygulama kaynakları ve uzlaşı metinleri; güncel metni hekim doğrular',
  SB_URO: 'T.C. Sağlık Bakanlığı — ürolojik acil yönlendirme ve birinci basamak sevk düzenlemeleri',
  SGK_SUT: 'SGK Sağlık Uygulama Tebliği (SUT) — üroloji rapor/endikasyon koşulları; güncel metin hekim tarafından doğrulanır',
  TITCK: 'TİTCK — ürün kısa ürün bilgileri (KÜB); ilaç dozu Notya tarafından üretilmez',
  IPSS: 'IPSS (International Prostate Symptom Score) — 7 madde 0–5, toplam 0–35; şiddet bandı klinik karar desteğidir, tanı değildir',
  PSA_IZLEM: 'PSA ng/mL izlemi — değer ve hız karar desteğidir; kanser tanısı değildir; yorum ve ileri tetkik kararı hekimindir',
}

export const HEKIM_KILIT_METNI =
  'IPSS ve PSA bantları karar desteğidir. Tanı, ilaç ve doz kararı hekimindir; Notya doz üretmez ve tanı kilitlemez.'

export const ACIL_YONLENDIRME_METNI =
  'Gözle görülür idrar kanaması, idrar yapamama / retansiyon, yan ağrısı ile ateş, testis torsiyonu şüphesi, priapizm veya üretra travması varsa ayaktan izlem yeterli değildir: 112 veya en yakın acil.'

export const KAPSAM_NOTU =
  'Ayaktan üroloji muayenehanesi / polikliniği ürünü. Ameliyathane planlaması, cerrahi HIS ve canlı Medula e-imza bu bölümün kapsamı değildir.'

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
