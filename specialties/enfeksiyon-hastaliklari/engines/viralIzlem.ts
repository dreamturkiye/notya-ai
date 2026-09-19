/**
 * ENFEKSIYON-EXCEPTIONAL-01 — HIV / viral izlem vadeleri. SAF fonksiyon.
 * Son tarih + tür → önerilen sonraki izlem. Tanı yazmaz; CD4/viral yük yorumu hekimde.
 */
import type { Dipnot } from './enfeksiyon'
import { ayEkle, ISO_GUN } from './enfeksiyon'

export type ViralTur = 'hiv_cd4' | 'hiv_viral' | 'hbv' | 'hcv' | 'diger'

export const VIRAL_TUR_ETIKET: Record<ViralTur, string> = {
  hiv_cd4: 'HIV CD4 izlem',
  hiv_viral: 'HIV viral yük izlem',
  hbv: 'HBV (hepatit B) izlem',
  hcv: 'HCV (hepatit C) izlem',
  diger: 'Diğer viral izlem',
}

/** Önerilen ay aralığı — karar desteği; hekim doğrular. */
export function viralSonrakiAy(tur: ViralTur): number {
  if (tur === 'hiv_cd4' || tur === 'hiv_viral') return 3
  if (tur === 'hbv' || tur === 'hcv') return 6
  return 6
}

export interface ViralSonuc {
  tamamMi: boolean
  tur: ViralTur
  sonrakiTarih: string | null
  ozet: string
  dipnot: Dipnot
}

export function viralPlanla(tur: ViralTur, sonTarih: string | null | undefined, bugun: string): ViralSonuc {
  const dipnot: Dipnot = { ref: 'SB_HIV', not: 'Viral izlem aralığı karar desteğidir; tanı ve tedavi hekimindir' }
  if (!sonTarih || !ISO_GUN.test(sonTarih)) {
    return {
      tamamMi: false, tur, sonrakiTarih: null,
      ozet: 'Son izlem tarihi eksik — vade yorumlanmaz', dipnot,
    }
  }
  const ay = viralSonrakiAy(tur)
  const sonraki = ayEkle(sonTarih, ay)
  const gecikti = sonraki < bugun
  return {
    tamamMi: true,
    tur,
    sonrakiTarih: sonraki,
    ozet: `${VIRAL_TUR_ETIKET[tur]}: son ${sonTarih} · önerilen izlem ~${ay} ay → ${sonraki}${gecikti ? ' (tarihi geçti — hekim karar verir)' : ''}. Değer yorumu ve tanı hekimin.`,
    dipnot,
  }
}

export const VIRAL_KONTROL_LISTESI: readonly string[] = [
  'Son izlem tarihi ve tür kaydedildi',
  'Tedavi uyumu / ilaç değişikliği hekim tarafından değerlendirildi (doz Notya yazmaz)',
  'Gebelik / bağışıklık durumu klinik bağlamda ele alındı',
  'Sonraki izlem tarihi hasta ile paylaşıldı',
  'Tanı ve laboratuvar yorumu hekim kilidinde',
]
