/**
 * NOTYA-EPIKRIZ-04 (Kaan/Gökhan 2026-09-14): epikrizde "pediatri Uzmanı" değil resmi
 * uzmanlık unvanı ("Çocuk Sağlığı ve Hastalıkları Uzmanı") gösterilmeli, ve "Kliniği" satırı
 * büyük harfle başlamalı — session.specialty ham anahtarı (küçük harf, "pediatri") doğrudan
 * kullanılıyordu.
 */
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI, SPECIALTY_MAP } from '@/lib/doktor/specialties'

/** İmza/klinik satırında kullanılacak RESMİ uzmanlık adı — UI etiketinden (parantezli, kısa) farklı. */
const RESMI_UZMANLIK_ADI: Partial<Record<SpecialtyKey, string>> = {
  pediatri: 'Çocuk Sağlığı ve Hastalıkları',
  dahiliye: 'İç Hastalıkları',
  psikiyatri: 'Ruh Sağlığı ve Hastalıkları',
  'kulak-burun-bogaz': 'Kulak Burun Boğaz Hastalıkları',
  'genel-cerrahi': 'Genel Cerrahi',
  'kadin-hastaliklari-dogum': KADIN_HASTALIKLARI_DOGUM_ETIKETI,
  dermatoloji: 'Deri ve Zührevi Hastalıklar',
  'aile-hekimligi': 'Aile Hekimliği',
}

function ilkHarfBuyuk(s: string): string {
  return s.split(' ').map((k) => (k ? k.charAt(0).toLocaleUpperCase('tr-TR') + k.slice(1) : k)).join(' ')
}

/** Klinik başlığında gösterilecek isim — "Kliniği: Pediatri (Çocuk Sağlığı)" gibi. */
export function klinikAdi(branşHam: string): string {
  const key = (bransAnahtari(branşHam) ?? branşHam) as SpecialtyKey
  return BRANS_ETIKETLERI[key] || ilkHarfBuyuk(branşHam.replace(/-/g, ' '))
}

/** İmza satırında gösterilecek resmi uzmanlık adı — "Çocuk Sağlığı ve Hastalıkları Uzmanı". */
export function resmiUzmanlikAdi(branşHam: string): string {
  const key = (bransAnahtari(branşHam) ?? branşHam) as SpecialtyKey
  const resmi = RESMI_UZMANLIK_ADI[key]
  if (resmi) return resmi
  const etiket = BRANS_ETIKETLERI[key] || ilkHarfBuyuk(branşHam.replace(/-/g, ' '))
  // UI etiketindeki parantezli kısmı at ("Pediatri (Çocuk Sağlığı)" -> "Pediatri")
  return etiket.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

/**
 * Ekranda / basılı notta / portalda gösterilecek branş adı, ham seans veya profil değerinden (`sessions.specialty`,
 * `users.specialty`). Ham anahtar ("kadin-hastaliklari-dogum", "kadin-dogum") hiçbir yüzeye yazılmaz (KD-ISIMLENDIRME-01).
 * `kisa`: dar alanlar için SPECIALTIES.shortLabel ("Kadın Hast. ve Doğum").
 */
export function bransEtiketi(ham: string | null | undefined, secenek: { kisa?: boolean } = {}): string {
  const s = String(ham || '').trim()
  if (!s) return 'Genel'
  const key = bransAnahtari(s)
  const bilinen = key ? SPECIALTY_MAP[key] : undefined
  if (bilinen) return (secenek.kisa && bilinen.shortLabel) || bilinen.label
  // Bilinmeyen değer: ham snake/kebab-case sızmasın, okunur hale getir.
  return s.toLocaleLowerCase('tr-TR').replace(/[_-]+/g, ' ').replace(/\S/u, (c) => c.toLocaleUpperCase('tr-TR'))
}
