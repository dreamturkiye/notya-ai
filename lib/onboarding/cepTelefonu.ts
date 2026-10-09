/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — the doctor's OWN mobile number (onboarding step 3). Pure and
 * client-safe: the screen and the server apply the same rule.
 *
 * Accepted: a Turkish mobile number in every common spelling (0532 123 45 67, 532 123 45 67, +90 532…,
 * 0090 532…, with spaces, dashes or brackets). Stored in ONE form: +905XXXXXXXXX (users.cep_telefonu, the same
 * pattern as the CHECK in migration 150). Landlines and foreign numbers are refused. The parsing rules are those
 * of lib/iletisim/cepTelefonu.ts — no second parser was written; the only differences are the stored form and
 * the refusal of foreign numbers.
 *
 * This is NOT the practice's number shown to patients (that is users.iletisim_*).
 */
import { cepTelefonuDogrula, TELEFON_MESAJ } from '../iletisim/cepTelefonu'

export type DoktorCepSonucu = { ok: true; deger: string } | { ok: false; hata: string }

/** The one valid form of users.cep_telefonu — identical to the CHECK in migration 150. */
export const DOKTOR_CEP_DESENI = /^\+905[0-9]{9}$/

export const DOKTOR_CEP_MESAJ = {
  bos: TELEFON_MESAJ.bos,
  sabitHat: TELEFON_MESAJ.sabitHat,
  gecersiz: 'Cep telefonu anlaşılamadı. Örnek: 0532 123 45 67',
  yurtDisi: 'Lütfen Türkiye cep telefonunuzu yazın (örnek: 0532 123 45 67).',
} as const

export function doktorCepTelefonu(ham: unknown): DoktorCepSonucu {
  if (ham != null && typeof ham !== 'string') return { ok: false, hata: DOKTOR_CEP_MESAJ.gecersiz }
  let metin = String(ham ?? '').trim()
  // "90 532 123 45 67" (country code typed without the plus sign) — the shared rule does not know it; read as +90 here.
  if (!metin.startsWith('+') && /^905\d{9}$/.test(metin.replace(/\D/g, '')) && /^[0-9()\-.\s/]+$/.test(metin)) metin = `+${metin.replace(/\D/g, '')}`
  const s = cepTelefonuDogrula(metin)
  if (!s.ok) {
    if (s.hata === TELEFON_MESAJ.bos) return { ok: false, hata: DOKTOR_CEP_MESAJ.bos }
    if (s.hata === TELEFON_MESAJ.sabitHat) return { ok: false, hata: DOKTOR_CEP_MESAJ.sabitHat }
    return { ok: false, hata: DOKTOR_CEP_MESAJ.gecersiz }
  }
  // The shared rule returns a foreign number as "+<digits>" and a Turkish mobile as "0532 123 45 67".
  if (s.deger.startsWith('+')) return { ok: false, hata: DOKTOR_CEP_MESAJ.yurtDisi }
  const deger = `+90${s.deger.replace(/\D/g, '').slice(1)}`
  return DOKTOR_CEP_DESENI.test(deger) ? { ok: true, deger } : { ok: false, hata: DOKTOR_CEP_MESAJ.gecersiz }
}
