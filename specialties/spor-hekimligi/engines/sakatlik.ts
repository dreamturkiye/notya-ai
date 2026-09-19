/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sakatlık günlüğü. SAF fonksiyon.
 * Şiddet bandı KARAR DESTEĞİDİR; tanı (ACL yırtığı, kırık vb.) yazılmaz.
 */
import type { Dipnot } from './spor'

export type SiddetBant = 'hafif' | 'orta' | 'agir'

export const SIDDET_BANT_AD: Record<SiddetBant, string> = {
  hafif: 'Hafif düzey (karar desteği)',
  orta: 'Orta düzey (karar desteği)',
  agir: 'Ağır düzey (karar desteği)',
}

export const BOLGELER = [
  'Diz', 'Ayak bileği', 'Kalça', 'Omuz', 'Dirsek', 'El bileği', 'Bel', 'Boyun',
  'Kas (bacak)', 'Kas (gövde)', 'Kas (üst ekstremite)', 'Baş / boyun (konküzyon bağlamı)', 'Diğer',
] as const

export const MEKANIZMALAR = [
  'Temas / darbe', 'Non-kontakt (dönme / ani duruş)', 'Overuse / yüklenme', 'Aşırı gerilme', 'Bilinmiyor',
] as const

export type SakatlikDurum = 'aktif' | 'iyilesiyor' | 'kapandi'

export interface SakatlikGirdi {
  bolge: string
  mekanizma?: string | null
  siddet?: SiddetBant | null
  durum?: SakatlikDurum
  /** Hekim işaretliyse kohortta yüklenme uyarısı */
  yuklenmeUyari?: boolean
  /** Son 7 gün antrenman dakikası (opsiyonel) — doz/reçete değil */
  yuklenmeDakika7?: number | null
  /** Önceki 21 gün ortalama haftalık dakika (opsiyonel) */
  yuklenmeDakikaOnceki?: number | null
}

export interface SakatlikSonuc {
  bolge: string
  mekanizma: string | null
  siddet: SiddetBant | null
  siddetAd: string
  durum: SakatlikDurum
  yuklenmeUyari: boolean
  yuklenmeNot: string | null
  ozet: string
  dipnot: Dipnot
}

/** Basit acute:chronic yük oranı uyarısı — tanı değil; eşik klinik karar desteği. */
export function yuklenmeUyariHesapla(akut7: number | null | undefined, oncekiOrt: number | null | undefined): { uyari: boolean; not: string | null } {
  if (akut7 == null || oncekiOrt == null || !Number.isFinite(akut7) || !Number.isFinite(oncekiOrt) || oncekiOrt <= 0) {
    return { uyari: false, not: null }
  }
  const oran = akut7 / oncekiOrt
  if (oran >= 1.5) {
    return {
      uyari: true,
      not: `Yüklenme oranı ~${oran.toFixed(1)} (son 7 gün / önceki haftalık ort.) — yüksek; plan hekimde (tanı değil)`,
    }
  }
  if (oran >= 1.3) {
    return {
      uyari: true,
      not: `Yüklenme oranı ~${oran.toFixed(1)} — dikkat bandı; plan hekimde (tanı değil)`,
    }
  }
  return { uyari: false, not: `Yüklenme oranı ~${oran.toFixed(1)} — izlem` }
}

export function sakatlikDegerlendir(g: SakatlikGirdi): SakatlikSonuc | { hata: string } {
  const bolge = String(g.bolge || '').trim()
  if (!bolge) return { hata: 'Sakatlık bölgesi gerekli' }
  const siddet = g.siddet && g.siddet in SIDDET_BANT_AD ? g.siddet : null
  const durum: SakatlikDurum = g.durum === 'iyilesiyor' || g.durum === 'kapandi' ? g.durum : 'aktif'
  const yuk = yuklenmeUyariHesapla(g.yuklenmeDakika7, g.yuklenmeDakikaOnceki)
  const yuklenmeUyari = g.yuklenmeUyari === true || yuk.uyari
  const mekanizma = g.mekanizma ? String(g.mekanizma).trim().slice(0, 80) : null
  const siddetAd = siddet ? SIDDET_BANT_AD[siddet] : '—'
  const ozet = [
    `Sakatlık günlüğü: ${bolge}`,
    mekanizma ? `mekanizma ${mekanizma}` : null,
    siddet ? `şiddet ${siddetAd}` : null,
    `durum ${durum}`,
    yuklenmeUyari ? 'yüklenme uyarısı açık' : null,
    '(karar desteği; tanı hekimindir)',
  ].filter(Boolean).join(' · ')
  return {
    bolge,
    mekanizma,
    siddet,
    siddetAd,
    durum,
    yuklenmeUyari,
    yuklenmeNot: yuk.not,
    ozet,
    dipnot: { ref: 'TOTBID_SPOR', not: 'Sakatlık kaydı ve şiddet bandı karar desteğidir; ICD / tanı hekim kilitler' },
  }
}

export function sonrakiSakatlikGun(siddet: SiddetBant | null, durum: SakatlikDurum): number {
  if (durum === 'kapandi') return 30
  if (siddet === 'agir') return 7
  if (siddet === 'orta') return 10
  return 14
}
