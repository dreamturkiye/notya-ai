/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Osteoporoz / DXA hatırlatma. SAF fonksiyon.
 * Son DXA tarihi + risk bandı → önerilen tekrar aralığı. Tanı / T-skor yorumu / doz YOK.
 */
import type { Dipnot } from './endokrinoloji'
import { ayEkle } from './endokrinoloji'

export type DxaRisk = 'dusuk' | 'orta' | 'yuksek' | 'bilinmiyor'

export const DXA_RISK_AD: Record<DxaRisk, string> = {
  dusuk: 'Düşük risk bandı — karar desteği',
  orta: 'Orta risk bandı — karar desteği',
  yuksek: 'Yüksek risk bandı — karar desteği',
  bilinmiyor: 'Risk bandı girilmedi',
}

/** TEMD OP tarzı kaba aralıklar — hekim doğrular. Yıl cinsinden. */
export function dxaTekrarYil(risk: DxaRisk): number {
  if (risk === 'yuksek') return 1
  if (risk === 'orta') return 2
  if (risk === 'dusuk') return 3
  return 2
}

export interface DxaSonuc {
  tamamMi: boolean
  risk: DxaRisk
  riskAd: string
  sonrakiTarih: string | null
  ozet: string
  dipnot: Dipnot
}

export function dxaPlanla(sonDxa: string | null | undefined, risk: DxaRisk, bugun: string): DxaSonuc {
  const dipnot: Dipnot = { ref: 'TEMD_OP', not: 'DXA tekrar aralığı karar desteğidir; tanı ve tedavi hekimindir' }
  const iso = /^\d{4}-\d{2}-\d{2}$/
  if (!sonDxa || !iso.test(sonDxa)) {
    return {
      tamamMi: false, risk, riskAd: DXA_RISK_AD[risk], sonrakiTarih: null,
      ozet: 'Son DXA tarihi eksik — tekrar planı yorumlanmaz', dipnot,
    }
  }
  const yil = dxaTekrarYil(risk)
  const sonraki = ayEkle(sonDxa, yil * 12)
  const gecikti = sonraki < bugun
  return {
    tamamMi: true,
    risk,
    riskAd: DXA_RISK_AD[risk],
    sonrakiTarih: sonraki,
    ozet: `Son DXA ${sonDxa} · ${DXA_RISK_AD[risk]} · önerilen tekrar ~${yil} yıl → ${sonraki}${gecikti ? ' (tarihi geçti — hekim karar verir)' : ''}. Tanı ve doz hekimin.`,
    dipnot,
  }
}

export const DXA_KONTROL_LISTESI: readonly string[] = [
  'Son DXA tarihi ve merkez kaydedildi',
  'Kırık öyküsü / glukokortikoid / menopoz durumu hekim tarafından değerlendirildi',
  'Kalsiyum / D vitamini / antiosteoporotik ilaç dozu hekim planında (Notya doz yazmaz)',
  'Düşme riski ve egzersiz önerisi görüşüldü',
  'Tekrar DXA tarihi hasta ile paylaşıldı',
]
