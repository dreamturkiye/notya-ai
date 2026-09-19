/**
 * RADYOLOJI-EXCEPTIONAL-01 — Radyoloji (ayaktan görüntüleme / rapor) ortak referans.
 * Saf fonksiyonlar; motorlar taslak üretir, HEKİM kilitler.
 *
 * Standing kilitler:
 *  - Full PACS / RIS / HIS entegrasyonu YOK (intentional Missing).
 *  - AI otomatik tanı / uydurma bulgu YOK.
 *  - BI-RADS (ve benzeri) kategori hekim seçer — otomatik tanı kilidi değil.
 *  - Pediatri büyüme / baş çevresi / Neyzi bu bölümde hiç yer almaz.
 */
export type Ref =
  | 'TRD'
  | 'SB_RAD'
  | 'TAEK'
  | 'SGK_RAD'
  | 'ACR_TR'

export type Dipnot = { ref: Ref; not: string }

export const REF_ACIKLAMA: Record<Ref, string> = {
  TRD: 'Türk Radyoloji Derneği (TRD) klinik yaklaşımları — rapor şablonu / güvenlik; tanı hekimin',
  SB_RAD: 'T.C. Sağlık Bakanlığı radyasyon güvenliği / görüntüleme klinik protokolleri',
  TAEK: 'TAEK / SB iyonizan radyasyon güvenliği — gebelik ve doz hekim sorumluluğunda',
  SGK_RAD: 'SGK görüntüleme işlem ve rapor kuralları — güncel metin hekim doğrular; canlı e-imza yok',
  ACR_TR: 'Uluslararası ACR derinliği (BI-RADS vb.) — TRD üzerinden TR ayaktan bağlama; kategori hekim seçer',
}

export const HEKIM_KILIT_METNI =
  'Tetkik kuyruğu, BI-RADS-style rapor taslağı ve kritik bulgu bildirimi karar desteğidir. Tanı ve kategori kilidi hekimindir; Notya bulgu uydurmaz, AI tanı yazmaz ve PACS/RIS/HIS yönetmez.'

export const ACIL_YONLENDIRME_METNI =
  'Ciddi kontrast reaksiyonu, gebelikte iyonizan çekim şüphesi veya hekimin işaretlediği kritik bulguda klinik iletişimi geciktirmeyin: 112 veya ilgili klinisyen / en yakın acil. Portal mesajı yeterli değildir.'

export const KAPSAM_NOTU =
  'Ayaktan radyoloji / görüntüleme raporlama ürünü. Full PACS / RIS / HIS, AI otomatik tanı ve uydurma bulgular bu bölümün kapsamı değildir.'

export const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/

export function gunEkle(tarih: string, gun: number): string {
  const d = new Date(tarih + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

/** Uydurma bulgu / AI tanı sızıntısı (araç + API + portal kilidi). */
export function uydurmaBulguIceriyorMu(metin: string): boolean {
  return /AI\s*(tan[ıi]|diagnosis)|otomatik\s*tan[ıi]|uydurma\s*bulgu|model\s*tan[ıi]\s*kilit|kesin\s*kanser\s*tan[ıi]s[ıi]\s*kilit/i.test(metin)
}

/** BI-RADS kategori sayılarının hasta yüzüne sızmasını engelle (portal). */
export function biradsHastaYuzundeMi(metin: string): boolean {
  return /BI-?RADS\s*[0-6]|kategori\s*[0-6]\b|malignite\s*%|kanser\s*olas[ıi]l[ıi][ğg][ıi]/i.test(metin)
}
