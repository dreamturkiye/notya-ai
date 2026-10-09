/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — doktorun KENDİ cep telefonu (onboarding 3. adım). Pure, client-safe:
 * ekran ve sunucu aynı kuralı kullanır.
 *
 * Kabul: Türk cep numarası her yaygın yazımıyla (0532 123 45 67, 532 123 45 67, +90 532…, 0090 532…, boşluk / tire /
 * parantezli). Kayıt biçimi tektir: +905XXXXXXXXX (users.cep_telefonu, migration 150'deki CHECK ile aynı desen).
 * Sabit hat ve yurt dışı numarası kabul edilmez. Yazım kuralları lib/iletisim/cepTelefonu.ts ile ortaktır —
 * ikinci bir ayrıştırıcı yazılmadı; fark yalnız kayıt biçimi ve yurt dışı numaranın reddidir.
 *
 * Bu alan muayenehanenin hastaya görünen numarası DEĞİLDİR (o: users.iletisim_*).
 */
import { cepTelefonuDogrula, TELEFON_MESAJ } from '../iletisim/cepTelefonu'

export type DoktorCepSonucu = { ok: true; deger: string } | { ok: false; hata: string }

/** users.cep_telefonu için tek geçerli biçim — migration 150'deki CHECK ile birebir aynı. */
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
  // "90 532 123 45 67" (artı işareti unutulmuş ülke kodu) — ortak kural bunu tanımaz; burada +90 sayılır.
  if (!metin.startsWith('+') && /^905\d{9}$/.test(metin.replace(/\D/g, '')) && /^[0-9()\-.\s/]+$/.test(metin)) metin = `+${metin.replace(/\D/g, '')}`
  const s = cepTelefonuDogrula(metin)
  if (!s.ok) {
    if (s.hata === TELEFON_MESAJ.bos) return { ok: false, hata: DOKTOR_CEP_MESAJ.bos }
    if (s.hata === TELEFON_MESAJ.sabitHat) return { ok: false, hata: DOKTOR_CEP_MESAJ.sabitHat }
    return { ok: false, hata: DOKTOR_CEP_MESAJ.gecersiz }
  }
  // Ortak kural yurt dışı numarayı "+<rakamlar>" olarak döndürür; Türk cep numarası "0532 123 45 67" biçimindedir.
  if (s.deger.startsWith('+')) return { ok: false, hata: DOKTOR_CEP_MESAJ.yurtDisi }
  const deger = `+90${s.deger.replace(/\D/g, '').slice(1)}`
  return DOKTOR_CEP_DESENI.test(deger) ? { ok: true, deger } : { ok: false, hata: DOKTOR_CEP_MESAJ.gecersiz }
}
