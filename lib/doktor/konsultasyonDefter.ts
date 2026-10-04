/**
 * KONSULTASYONLAR-01/02 — hekimin güvendiği konsültan defteri. Saf + istemci-güvenli.
 * Hekime özel pratik: başka hekim satırı görmez (RLS doctor_id). Hekim ve sekreter aynı defteri görür.
 */
import { SPECIALTY_MAP } from '@/lib/doktor/specialties'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export const DEFTER_SINIRLARI = {
  adSoyad: 120,
  brans: 80,
  telefon: 40,
  ofisTelefon: 40,
  adres: 300,
  eposta: 160,
  whatsapp: 40,
  /** ~4–5 satır genel not (ofis saatleri vb.). */
  not: 500,
} as const

export interface DefterSatiri {
  id: string
  doctor_id?: string
  ad_soyad: string
  brans: string
  telefon: string | null
  ofis_telefon?: string | null
  adres: string | null
  eposta: string | null
  whatsapp: string | null
  kurum_ici: boolean
  not_metni: string | null
  created_at: string
  updated_at?: string
}

export const DEFTER_KOLONLARI =
  'id, doctor_id, ad_soyad, brans, telefon, ofis_telefon, adres, eposta, whatsapp, kurum_ici, not_metni, created_at, updated_at'

const temiz = (s: unknown, tavan: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, tavan)
/** Not: satır sonlarını koru (ofis saatleri / Cumartesi çalışmaz). */
const temizNot = (s: unknown, tavan: number) =>
  String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, tavan)
const bosNull = (x: string) => (x ? x : null)

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type DefterGirdisi = {
  ad_soyad: string
  brans: string
  telefon: string | null
  ofis_telefon: string | null
  adres: string | null
  eposta: string | null
  whatsapp: string | null
  kurum_ici: boolean
  not_metni: string | null
}

/** POST/PATCH gövdesi. Hata Türkçe; yoksa temiz alanlar. */
export function defterDogrula(b: Record<string, unknown> | null | undefined): { hata: string } | { girdi: DefterGirdisi } {
  const ad = temiz(b?.adSoyad ?? b?.ad_soyad, DEFTER_SINIRLARI.adSoyad)
  if (ad.length < 2) return { hata: 'Konsültanın adını ve soyadını yazın.' }
  const bransHam = temiz(b?.brans, DEFTER_SINIRLARI.brans)
  if (!bransHam) return { hata: 'Branşı yazın veya listeden seçin.' }
  const eposta = bosNull(temiz(b?.eposta ?? b?.ePosta, DEFTER_SINIRLARI.eposta).toLowerCase())
  if (eposta && !EPOSTA.test(eposta)) return { hata: 'E-posta adresi geçersiz — ör. ad@ornek.com.' }
  const telefon = bosNull(temiz(b?.telefon ?? b?.cepTelefon ?? b?.cep, DEFTER_SINIRLARI.telefon))
  const ofis_telefon = bosNull(temiz(b?.ofisTelefon ?? b?.ofis_telefon, DEFTER_SINIRLARI.ofisTelefon))
  const whatsapp = bosNull(temiz(b?.whatsapp ?? b?.WhatsApp, DEFTER_SINIRLARI.whatsapp))
  const adres = bosNull(temiz(b?.adres, DEFTER_SINIRLARI.adres))
  const not_metni = bosNull(temizNot(b?.not ?? b?.not_metni ?? b?.genelNot, DEFTER_SINIRLARI.not))
  const kurum = b?.kurumIci ?? b?.kurum_ici
  const kurum_ici = kurum === true || kurum === 'true' || kurum === 1 || kurum === '1'
  return {
    girdi: {
      ad_soyad: ad,
      brans: bransHam,
      telefon,
      ofis_telefon,
      adres,
      eposta,
      whatsapp,
      kurum_ici,
      not_metni,
    },
  }
}

export function defterBransEtiketi(brans: string): string {
  const k = String(brans || '').trim()
  if (k && SPECIALTY_MAP[k as SpecialtyKey]) return SPECIALTY_MAP[k as SpecialtyKey].label
  return k || 'Belirtilmemiş'
}

/** UI listesi — branş etiketi çözülmüş. */
export function defterListeSatiri(s: DefterSatiri): {
  id: string
  adSoyad: string
  brans: string
  bransAnahtar: string
  telefon: string | null
  ofisTelefon: string | null
  adres: string | null
  eposta: string | null
  whatsapp: string | null
  kurumIci: boolean
  not: string | null
} {
  return {
    id: s.id,
    adSoyad: s.ad_soyad,
    brans: defterBransEtiketi(s.brans),
    bransAnahtar: s.brans,
    telefon: s.telefon ?? null,
    ofisTelefon: s.ofis_telefon ?? null,
    adres: s.adres,
    eposta: s.eposta,
    whatsapp: s.whatsapp,
    kurumIci: !!s.kurum_ici,
    not: s.not_metni,
  }
}
