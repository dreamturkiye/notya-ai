/**
 * NOTYA-RRS — Renkli Reçete Sistemi (RRS) iş akışı, entegrasyonsuz P1 (Kaan, 2026-09-16).
 *
 * Türkiye'de kırmızı (uyuşturucu) ve yeşil (psikotrop) reçeteler 2017'den beri Sağlık Bakanlığı
 * Renkli Reçete Sistemi'nde elektronik düzenlenir; kâğıt kırmızı/yeşil reçete eczanede geçmez.
 * RRS web servisleri yalnız SBSGM kayıtlı HBYS/MBYS'lere açıktır (P4 rayı, ödeyen doktor sonrası).
 * Bu yüzden P1: Notya ilaçları RRS alan sırasında hazırlar (kopyala), RRS'yi açar, doktor TC + ilaçları
 * girip imzalar, dönen reçete numarasını Notya'ya yazar — kayıt kapanır ve dosyada görünür.
 * Notya hastanın TC'sini saklamaz (hash-only, tasarım gereği); TC daima RRS'de doktor tarafından girilir.
 */
export type RrsRenk = 'kirmizi' | 'yesil'
export interface RrsSatir { ilacAdi: string; etkenMadde: string; dozMetni: string; kullanimOzeti: string; kutu: number }

export const RRS_URL = 'https://renklirecete.saglik.gov.tr'
export const RRS_ETIKET: Record<RrsRenk, string> = { kirmizi: 'KIRMIZI REÇETE', yesil: 'YEŞİL REÇETE' }

export const RRS_ADIMLARI = [
  '"RRS için kopyala" ile ilaç satırlarını RRS alan sırasında panoya alın.',
  '"RRS\'yi aç" ile Renkli Reçete Sistemi\'ne girin (hekim girişi + e-imza/mobil imza).',
  'Hastanın TC kimlik numarasını RRS\'de siz girin; ilaçları yapıştırın, adet ve kullanımı doğrulayın, imzalayın.',
  'RRS\'nin verdiği reçete numarasını buraya yazıp kaydedin — kayıt kapanır, hasta dosyasında görünür.',
]

function trTarih(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso || ''
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

/** RRS'ye girilecek metin — alan sırası: ilaç, etken madde, doz/form, adet, kullanım. TC bilerek yok. */
export function rrsMetni(p: { renk: RrsRenk; hastaAd: string; tarih: string; tanilar: string[]; satirlar: RrsSatir[] }): string {
  const L: string[] = []
  L.push(`RENKLİ REÇETE SİSTEMİ — ${RRS_ETIKET[p.renk]}`)
  L.push(`Hasta: ${p.hastaAd || '—'}   (TC kimlik no RRS'de girilir; Notya TC saklamaz)`)
  L.push(`Tarih: ${trTarih(p.tarih)}`)
  if (p.tanilar.length) L.push(`Tanı (ICD-10): ${p.tanilar.join(', ')}`)
  L.push('')
  p.satirlar.forEach((s, i) => {
    L.push(`${i + 1}) İlaç: ${s.ilacAdi}${s.etkenMadde ? ` — Etken madde: ${s.etkenMadde}` : ''}`)
    if (s.dozMetni) L.push(`   Doz/Form: ${s.dozMetni}`)
    L.push(`   Adet: ${Math.max(1, s.kutu || 1)} kutu`)
    if (s.kullanimOzeti) L.push(`   Kullanım: ${s.kullanimOzeti}`)
  })
  L.push('')
  L.push('Not: Kırmızı/yeşil reçete miktar ve süre sınırlarını RRS uygular; uyarı verirse adet/süreyi RRS\'de düzeltin.')
  return L.join('\n')
}
