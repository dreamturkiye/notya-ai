/**
 * NOTYA-SELAM-SAAT-01 (Kaan, 2026-09-27): selamlama, saat çipi ve Ayşe'nin açılışı doktorun BULUNDUĞU YERİN saatine
 * göre — hava durumuyla aynı kaynak (tarayıcı saat dilimi). Üst (Ana Sayfa kicker) ve alt (Ayşe) hep aynı bant.
 * Randevular TRT'de kalır (2026-09-02 kuralı); burası yalnız selam/saat gösterimi içindir.
 */
export type Selam = 'Günaydın' | 'İyi günler' | 'İyi akşamlar' | 'İyi geceler'
export const VARSAYILAN_SAAT_DILIMI = 'Europe/Istanbul'
export const SAAT_DILIMI_CEREZ = 'notya_tz'

/** Tek bant: 05–10 Günaydın · 11–17 İyi günler · 18–22 İyi akşamlar · 23–04 İyi geceler. */
export function selamla(saat: number): Selam {
  const s = ((Math.floor(saat) % 24) + 24) % 24
  if (s < 5) return 'İyi geceler'
  if (s < 11) return 'Günaydın'
  if (s < 18) return 'İyi günler'
  if (s < 23) return 'İyi akşamlar'
  return 'İyi geceler'
}

export function saatDilimiGecerliMi(tz: string | null | undefined): tz is string {
  if (!tz || tz.length > 64 || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(tz)) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}

/** Verilen andaki yerel saat (0–23) — geçersiz dilimde TRT. */
export function yerelSaat(d: Date, tz: string | null | undefined): number {
  const dilim = saatDilimiGecerliMi(tz) ? tz : VARSAYILAN_SAAT_DILIMI
  return Number(d.toLocaleTimeString('en-GB', { timeZone: dilim, hour: '2-digit', hour12: false }).slice(0, 2))
}

/** "14:32" — yerel. */
export function saatDizesi(d: Date, tz: string | null | undefined): string {
  const dilim = saatDilimiGecerliMi(tz) ? tz : VARSAYILAN_SAAT_DILIMI
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: dilim })
}

/** Tarayıcının saat dilimi (istemci); sunucuda çağrılırsa TRT. */
export function tarayiciSaatDilimi(): string {
  try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; return saatDilimiGecerliMi(tz) ? tz : VARSAYILAN_SAAT_DILIMI } catch { return VARSAYILAN_SAAT_DILIMI }
}
