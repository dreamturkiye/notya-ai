/**
 * NOTYA-BETA-0925 — randevu penceresindeki "Cep telefonu" alanı. Pure, client-safe (modal + sunucu aynı kural).
 *
 * Kabul: Türk cep numarası her yaygın yazımıyla (0532 123 45 67, 5321234567, +90 532…, 0090 532…) ve yurt dışı
 * numarası uluslararası önekle (+1 202 555 0143, 0049…). Türk sabit hattı (0212…) cep değildir — WhatsApp ve
 * hatırlatma cep ister. Kayıt biçimi: Türk numarası "0532 123 45 67", yurt dışı "+<rakamlar>" — ikisi de
 * lib/iletisim/baglantilar.whatsappNumarasi ile WhatsApp bağlantısına dönüşür.
 */
export type TelefonSonucu = { ok: true; deger: string } | { ok: false; hata: string }

export const TELEFON_MESAJ = {
  bos: 'Lütfen cep telefonunu yazın.',
  gecersiz: 'Cep telefonu anlaşılamadı. Örnek: 0532 123 45 67 — yurt dışı için +1 202 555 0143.',
  sabitHat: 'Bu bir sabit hat numarası. Lütfen cep telefonunu yazın (örnek: 0532 123 45 67).',
} as const

function trBicim(on: string): string {
  // on = 5xx xxx xx xx (10 hane)
  return `0${on.slice(0, 3)} ${on.slice(3, 6)} ${on.slice(6, 8)} ${on.slice(8, 10)}`
}

export function cepTelefonuDogrula(ham: string | null | undefined): TelefonSonucu {
  const t = String(ham ?? '').trim()
  if (!t) return { ok: false, hata: TELEFON_MESAJ.bos }
  if (!/^[0-9+()\-.\s/]+$/.test(t) || (t.indexOf('+') > 0) || (t.split('+').length > 2)) return { ok: false, hata: TELEFON_MESAJ.gecersiz }
  let rakam = t.replace(/\D/g, '')
  const uluslararasi = t.startsWith('+') || rakam.startsWith('00')
  if (rakam.startsWith('00')) rakam = rakam.slice(2)

  if (uluslararasi) {
    if (rakam.startsWith('90')) {
      const on = rakam.slice(2)
      if (/^5\d{9}$/.test(on)) return { ok: true, deger: trBicim(on) }
      return { ok: false, hata: /^[2-4]\d{9}$/.test(on) ? TELEFON_MESAJ.sabitHat : TELEFON_MESAJ.gecersiz }
    }
    // E.164: ülke kodu 0 ile başlamaz, toplam 8–15 hane
    if (/^[1-9]\d{7,14}$/.test(rakam)) return { ok: true, deger: `+${rakam}` }
    return { ok: false, hata: TELEFON_MESAJ.gecersiz }
  }

  const on = rakam.startsWith('0') ? rakam.slice(1) : rakam
  if (/^5\d{9}$/.test(on)) return { ok: true, deger: trBicim(on) }
  if (/^[2-4]\d{9}$/.test(on)) return { ok: false, hata: TELEFON_MESAJ.sabitHat }
  return { ok: false, hata: TELEFON_MESAJ.gecersiz }
}

/** İsteğe bağlı gövde alanı: boş → { deger: null }; dolu ve geçerli → biçimlenmiş numara; dolu ve geçersiz → Türkçe hata. */
export function telefonAlani(ham: unknown): { deger: string | null } | { hata: string } {
  const t = typeof ham === 'string' ? ham.trim() : ''
  if (!t) return { deger: null }
  const s = cepTelefonuDogrula(t)
  return s.ok ? { deger: s.deger } : { hata: s.hata }
}
