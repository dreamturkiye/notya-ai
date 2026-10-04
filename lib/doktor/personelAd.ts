/**
 * NOTYA-SEKRETER-01 — sekreter / personel adı: ayrı ad + soyad, görünen ad_soyad.
 */

export function personelAdSoyadBirlesik(ad: string | null | undefined, soyad: string | null | undefined): string {
  return [String(ad || '').trim(), String(soyad || '').trim()].filter(Boolean).join(' ').trim()
}

/** İlk boşluğa kadar ad, kalanı soyad — eski tek alanlı kayıtlar için. */
export function personelAdSoyadAyir(adSoyad: string | null | undefined): { ad: string; soyad: string } {
  const t = String(adSoyad || '').trim().replace(/\s+/g, ' ')
  if (!t) return { ad: '', soyad: '' }
  const i = t.indexOf(' ')
  if (i < 0) return { ad: t, soyad: '' }
  return { ad: t.slice(0, i), soyad: t.slice(i + 1).trim() }
}

export function personelGorunenAd(opts: {
  ad?: string | null
  soyad?: string | null
  adSoyad?: string | null
}): string {
  const birlesik = personelAdSoyadBirlesik(opts.ad, opts.soyad)
  if (birlesik) return birlesik
  return String(opts.adSoyad || '').trim()
}

/** Selamda kullanılan kısa ad — ilk ad. */
export function personelKisaAd(opts: {
  ad?: string | null
  soyad?: string | null
  adSoyad?: string | null
}): string {
  const ad = String(opts.ad || '').trim()
  if (ad) return ad
  return personelAdSoyadAyir(opts.adSoyad).ad || personelGorunenAd(opts)
}
