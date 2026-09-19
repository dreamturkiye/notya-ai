/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Biyolojik DMARD SUT kontrol listesi. SAF fonksiyon.
 * Doz / yükleme şeması / infüzyon HIS YAZILMAZ. SUT madde numarası hekim/idare teyit eder.
 */
import type { Dipnot } from './romatoloji'

export type BiyolojikEndikasyon = 'ra' | 'spa' | 'psa' | 'sle' | 'diger'

export const BIYO_ENDIKASYON_ADI: Record<BiyolojikEndikasyon, string> = {
  ra: 'Romatoid artrit (hekim tanısı)',
  spa: 'Aksiyel spondiloartrit (hekim tanısı)',
  psa: 'Psoriatik artrit (hekim tanısı)',
  sle: 'SLE (hekim tanısı)',
  diger: 'Diğer (hekim belirtir)',
}

export type SutMadde = {
  id: string
  madde: string
  tamam: boolean | null
}

export type BiyolojikSutGirdi = {
  endikasyon: BiyolojikEndikasyon | null
  /** hekim yazdığı sınıf / etken madde adı — doz YOK */
  etkenSinif?: string | null
  oncekiCsDmard?: boolean | null
  tbTarama?: boolean | null
  hbvTarama?: boolean | null
  hcvTarama?: boolean | null
  akcigerGrafisi?: boolean | null
  canliAsiBilgi?: boolean | null
  hekimKilit?: boolean
}

export type BiyolojikSutSonuc = {
  tamamMi: boolean
  kontrol: SutMadde[]
  eksikler: string[]
  ozet: string
  dipnot: Dipnot
  dozIceriyorMu: boolean
}

/** Doz / ünite / mg / haftalık şema yakala — kayda engel. */
export function biyolojikDozIceriyorMu(metin: string | null | undefined): boolean {
  if (!metin) return false
  return /\d+\s*(mg|µg|ug|mcg|IU|Ü|ml|mL)\b|haftada\s*\d|ayda\s*\d|yükleme|infüzyon\s*süiti|HIS\s*randevu/i.test(metin)
}

export function biyolojikSutKontrol(g: BiyolojikSutGirdi): BiyolojikSutSonuc {
  const dipnot: Dipnot = { ref: 'SGK_SUT', not: 'SUT kontrol listesi taslağı; güncel madde hekim/idare doğrular; doz yazılmaz' }
  const dozIceriyorMu = biyolojikDozIceriyorMu(g.etkenSinif)
  const kontrol: SutMadde[] = [
    { id: 'endikasyon', madde: 'Endikasyon hekim tarafından belirlendi', tamam: g.endikasyon != null },
    { id: 'csdmard', madde: 'Önceki csDMARD / basamak beyanı hekim tarafından değerlendirildi', tamam: g.oncekiCsDmard == null ? null : g.oncekiCsDmard },
    { id: 'tb', madde: 'TB taraması (Quantiferon / PPD + klinik) tamamlandı veya planlandı', tamam: g.tbTarama == null ? null : g.tbTarama },
    { id: 'hbv', madde: 'HBV taraması tamamlandı veya planlandı', tamam: g.hbvTarama == null ? null : g.hbvTarama },
    { id: 'hcv', madde: 'HCV taraması tamamlandı veya planlandı', tamam: g.hcvTarama == null ? null : g.hcvTarama },
    { id: 'akciger', madde: 'Akciğer grafisi / görüntü değerlendirmesi (hekim)', tamam: g.akcigerGrafisi == null ? null : g.akcigerGrafisi },
    { id: 'asi', madde: 'Canlı aşı bilgilendirmesi yapıldı', tamam: g.canliAsiBilgi == null ? null : g.canliAsiBilgi },
    { id: 'doz', madde: 'Doz / yükleme şeması hekim yazar (Notya üretmez)', tamam: true },
    { id: 'infuzyon', madde: 'İnfüzyon süiti / HIS randevu bu ürünün kapsamı değildir', tamam: true },
    { id: 'kilit', madde: 'Hekim kilidi — rapor taslağı onaylandı', tamam: g.hekimKilit === true },
  ]
  const eksikler = kontrol.filter((k) => k.tamam === false).map((k) => k.madde)
  if (dozIceriyorMu) eksikler.push('Etken/sınıf alanında doz veya infüzyon HIS ifadesi var — kaldırın')
  const tamamMi = !dozIceriyorMu && g.endikasyon != null && g.hekimKilit === true && !eksikler.length
  const sinif = (g.etkenSinif || '').trim() || 'sınıf belirtilmedi'
  const end = g.endikasyon ? BIYO_ENDIKASYON_ADI[g.endikasyon] : 'endikasyon seçilmedi'
  return {
    tamamMi,
    kontrol,
    eksikler,
    ozet: `Biyolojik SUT taslağı — ${end} · ${sinif}. ${eksikler.length ? `Eksik: ${eksikler.length} madde.` : 'Kontrol listesi tamam (hekim kilidi).'} Doz ve infüzyon HIS yazılmaz.`,
    dipnot,
    dozIceriyorMu,
  }
}
