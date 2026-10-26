const TITLE_PATTERN = /^(Prof\.\s*Dr\.|Doç\.\s*Dr\.|Uzm\.\s*Dr\.|Uzm\.\s*|Dr\.)\s*/i

/** Strip title → "Ayşe Kaya" */
export function formatColleagueDisplayName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Hocam'

  const withoutTitle = trimmed.replace(TITLE_PATTERN, '').trim()
  const parts = withoutTitle.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Hocam'
  if (parts.length === 1) return parts[0]
  // First + last (handles middle names by keeping first and final surname)
  return `${parts[0]} ${parts[parts.length - 1]}`
}

/** Spoken / header label — e.g. "Ayşe Kaya Hocam" */
export function formatColleagueName(fullName: string): string {
  const display = formatColleagueDisplayName(fullName)
  if (display === 'Hocam') return 'Hocam'
  return `${display} Hocam`
}

/** Tab label for colleague persona picker — e.g. "Ayşe Kaya Hocam" */
export function formatColleagueTabLabel(fullName: string): string {
  return formatColleagueName(fullName)
}

const ARKA_UNLULER = new Set(['a', 'ı', 'o', 'u'])
const ON_UNLULER = new Set(['e', 'i', 'ö', 'ü'])

/**
 * NOTYA-ASISTAN-PERSONA-YONELME-01 — Türkçe yönelme hali (-e/-a) eki, son ÜNLÜ harfe göre (büyük ünlü
 * uyumu). TDK kuralı: özel ada eklenen bu ek kesme işaretiyle ayrılır VE kökün yazımı değişmez (ünsüz
 * yumuşaması yazıya yansımaz — "Burak'a", "Burağa" değil). Ad sesli harfle bitiyorsa araya "y" girer
 * ("Ayşe'ye", "Tolga'ya"). 30 persona adının tamamı (`specialistsCatalog.ts`) ve bilinmeyen adlar için
 * doğrulanmıştır — bkz. `colleagueAddress.test.ts`.
 */
export function turkceYonelmeHali(isim: string): string {
  const ad = isim.trim()
  if (!ad) return ad
  const harfler = Array.from(ad.toLocaleLowerCase('tr-TR'))
  let ek: 'a' | 'e' = 'e'
  for (let i = harfler.length - 1; i >= 0; i--) {
    const h = harfler[i]
    if (ARKA_UNLULER.has(h)) { ek = 'a'; break }
    if (ON_UNLULER.has(h)) { ek = 'e'; break }
  }
  const sonHarfSesliMi = harfler.length > 0 && (ARKA_UNLULER.has(harfler[harfler.length - 1]) || ON_UNLULER.has(harfler[harfler.length - 1]))
  return `${ad}'${sonHarfSesliMi ? 'y' : ''}${ek}`
}
