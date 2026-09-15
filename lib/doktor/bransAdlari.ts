/**
 * NOTYA-EPIKRIZ-04 (Kaan/Gökhan 2026-09-14): epikrizde "pediatri Uzmanı" değil resmi
 * uzmanlık unvanı ("Çocuk Sağlığı ve Hastalıkları Uzmanı") gösterilmeli, ve "Kliniği" satırı
 * büyük harfle başlamalı — session.specialty ham anahtarı (küçük harf, "pediatri") doğrudan
 * kullanılıyordu.
 */
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/** İmza/klinik satırında kullanılacak RESMİ uzmanlık adı — UI etiketinden (parantezli, kısa) farklı. */
const RESMI_UZMANLIK_ADI: Partial<Record<SpecialtyKey, string>> = {
  pediatri: 'Çocuk Sağlığı ve Hastalıkları',
  dahiliye: 'İç Hastalıkları',
  psikiyatri: 'Ruh Sağlığı ve Hastalıkları',
  'kulak-burun-bogaz': 'Kulak Burun Boğaz Hastalıkları',
  'genel-cerrahi': 'Genel Cerrahi',
  'kadin-hastaliklari-dogum': 'Kadın Hastalıkları ve Doğum',
  dermatoloji: 'Deri ve Zührevi Hastalıklar',
  'aile-hekimligi': 'Aile Hekimliği',
}

function ilkHarfBuyuk(s: string): string {
  return s.split(' ').map((k) => (k ? k.charAt(0).toLocaleUpperCase('tr-TR') + k.slice(1) : k)).join(' ')
}

/** Klinik başlığında gösterilecek isim — "Kliniği: Pediatri (Çocuk Sağlığı)" gibi. */
export function klinikAdi(branşHam: string): string {
  const key = branşHam as SpecialtyKey
  return BRANS_ETIKETLERI[key] || ilkHarfBuyuk(branşHam.replace(/-/g, ' '))
}

/** İmza satırında gösterilecek resmi uzmanlık adı — "Çocuk Sağlığı ve Hastalıkları Uzmanı". */
export function resmiUzmanlikAdi(branşHam: string): string {
  const key = branşHam as SpecialtyKey
  const resmi = RESMI_UZMANLIK_ADI[key]
  if (resmi) return resmi
  const etiket = BRANS_ETIKETLERI[key] || ilkHarfBuyuk(branşHam.replace(/-/g, ' '))
  // UI etiketindeki parantezli kısmı at ("Pediatri (Çocuk Sağlığı)" -> "Pediatri")
  return etiket.replace(/\s*\([^)]*\)\s*$/, '').trim()
}
