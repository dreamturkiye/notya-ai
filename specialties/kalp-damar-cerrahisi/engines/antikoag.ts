/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Antikoagülasyon izlem vadeleri. SAF fonksiyon.
 * Yalnız tarih / vade / ilaç sınıfı etiketi. DOZ, INR hedefi, mg YOK.
 */
import { ISO_GUN } from './kalp-damar'
import type { Dipnot } from './kalp-damar'

export type AntikoagSinif = 'warfarin' | 'doac' | 'lmwh' | 'antiplatelet' | 'diger'

export interface AntikoagKart {
  sinif: AntikoagSinif
  sonrakiKontrol: string | null
  labVadesi: string | null
  not: string | null
}

export interface AntikoagSonuc {
  tamamMi: boolean
  kart: AntikoagKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string }>
  dipnot: Dipnot
}

const SINIF_AD: Record<AntikoagSinif, string> = {
  warfarin: 'Warfarin / K vitamini antagonisti (doz hekimde)',
  doac: 'DOAC (doz hekimde)',
  lmwh: 'LMWH (doz hekimde)',
  antiplatelet: 'Antiplatelet (doz hekimde)',
  diger: 'Diğer antikoagülan / hekim notu',
}

/** Doz / INR hedef / SCORE2 sızıntısı. */
export function antikoagYasakIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|mg\/kg|IU)\b|doz şeması|INR\s*(hedef|target)|SCORE\s*2|SCORE2|warfarin\s*\d|5\s*mg|10\s*mg/i.test(metin)
}

export function antikoagNormalize(ham: unknown): AntikoagKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const sinifHam = String(o.sinif || 'diger')
  const sinif: AntikoagSinif =
    sinifHam === 'warfarin' || sinifHam === 'doac' || sinifHam === 'lmwh' || sinifHam === 'antiplatelet'
      ? sinifHam
      : 'diger'
  return {
    sinif,
    sonrakiKontrol: tarih(o.sonrakiKontrol ?? o.sonraki_kontrol),
    labVadesi: tarih(o.labVadesi ?? o.lab_vadesi),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function antikoagSkorla(ham: unknown): AntikoagSonuc {
  const kart = antikoagNormalize(ham)
  const dipnot: Dipnot = { ref: 'TITCK', not: 'Antikoagülan vade hatırlatması; doz KÜB/hekimde — Notya doz yazmaz' }
  if (!kart.sonrakiKontrol && !kart.labVadesi) {
    return { tamamMi: false, kart, ozet: 'Kontrol veya lab vadesi gerekli (YYYY-AA-GG). Doz yazılmaz.', gorevOnerileri: [], dipnot }
  }
  if (kart.not && antikoagYasakIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Antikoagülan notunda doz / INR hedef / SCORE2 yazılamaz — yalnız vade.', gorevOnerileri: [], dipnot }
  }
  const gorevOnerileri: AntikoagSonuc['gorevOnerileri'] = []
  if (kart.sonrakiKontrol) {
    gorevOnerileri.push({ kod: 'antikoag_kontrol', ad: 'Antikoagülan kontrolü', due: kart.sonrakiKontrol })
  }
  if (kart.labVadesi) {
    gorevOnerileri.push({ kod: 'antikoag_lab', ad: 'Lab / izlem vadesi', due: kart.labVadesi })
  }
  const parcalar = [
    SINIF_AD[kart.sinif],
    kart.sonrakiKontrol ? `kontrol: ${kart.sonrakiKontrol}` : null,
    kart.labVadesi ? `lab vadesi: ${kart.labVadesi}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `Antikoagülan izlem · ${parcalar.join(' · ')}. Doz yazılmaz; hekim KÜB’e göre belirler.`,
    gorevOnerileri,
    dipnot,
  }
}

export const ANTIKOAG_SINIFLARI: Array<{ kod: AntikoagSinif; ad: string }> = [
  { kod: 'warfarin', ad: SINIF_AD.warfarin },
  { kod: 'doac', ad: SINIF_AD.doac },
  { kod: 'lmwh', ad: SINIF_AD.lmwh },
  { kod: 'antiplatelet', ad: SINIF_AD.antiplatelet },
  { kod: 'diger', ad: SINIF_AD.diger },
]
