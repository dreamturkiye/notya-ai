/**
 * Hasta dosyası tab visibility. KD is gated by sex; pediatric tools by age.
 * Adults must not see M-CHAT / gelişim / büyüme eğrileri.
 */

export type HastaDosyaSekmeId =
  | 'ozet'
  | 'muayene'
  | 'buyume'
  | 'belgeler'
  | 'goruntuleme'
  | 'ilaclar'
  | 'formu'
  | 'asilar'
  | 'mchat'
  | 'gelisim'
  | 'ayse'
  | 'gebelik'
  | 'deri'

export type HastaDosyaSekme = { id: HastaDosyaSekmeId; label: string }

const PED_TAB_IDS: ReadonlySet<HastaDosyaSekmeId> = new Set(['buyume', 'mchat', 'gelisim'])

export function yasYilKesir(dogumIso: string | null | undefined, nowMs = Date.now()): number | null {
  if (!dogumIso) return null
  const d = new Date(dogumIso)
  if (isNaN(d.getTime())) return null
  return (nowMs - d.getTime()) / (365.25 * 86_400_000)
}

/** Pediatric file tabs: under 18, or unknown DOB (same unknown-default as KD). */
export function pediatriSekmesiUygun(dogumIso: string | null | undefined, nowMs = Date.now()): boolean {
  const y = yasYilKesir(dogumIso, nowMs)
  if (y == null) return true
  return y < 18
}

export function gebelikSekmesiUygun(input: {
  cinsiyet: string | null | undefined
  dogumIso: string | null | undefined
}, nowMs = Date.now()): boolean {
  if (!input.cinsiyet || input.cinsiyet !== 'Kadın') return false
  const y = yasYilKesir(input.dogumIso, nowMs)
  if (y == null) return true
  return y >= 12
}

export function hastaDosyaSekmeleri(opts: {
  pediatriUygun: boolean
  gebelikUygun: boolean
}): HastaDosyaSekme[] {
  const tabs: HastaDosyaSekme[] = [
    { id: 'ozet', label: 'Özet' },
    { id: 'muayene', label: 'Muayene Geçmişi' },
  ]
  if (opts.pediatriUygun) tabs.push({ id: 'buyume', label: 'Büyüme Eğrileri' })
  tabs.push(
    { id: 'belgeler', label: 'Belgeler' },
    { id: 'goruntuleme', label: 'Görüntüleme' },
    { id: 'ilaclar', label: 'İlaçlar' },
    { id: 'formu', label: 'Hasta Formu' },
    { id: 'asilar', label: 'Aşılar' },
  )
  if (opts.pediatriUygun) {
    tabs.push({ id: 'mchat', label: 'M-CHAT-R/F' }, { id: 'gelisim', label: 'Gelişim Taraması' })
  }
  tabs.push({ id: 'ayse', label: "Ayşe'ye Danış" })
  if (opts.gebelikUygun) tabs.push({ id: 'gebelik', label: 'Kadın Sağlığı & Gebelik' })
  tabs.push({ id: 'deri', label: 'Deri & Lezyon' })
  return tabs
}

export function pediatriSekmeIdleri(): readonly HastaDosyaSekmeId[] {
  return [...PED_TAB_IDS]
}
