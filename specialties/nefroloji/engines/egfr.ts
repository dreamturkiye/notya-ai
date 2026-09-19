/**
 * NEFROLOJI-EXCEPTIONAL-01 — eGFR / KDIGO G×A şerit. SAF fonksiyon.
 * eGFR + UACR → G×A hücre ve izlem aralığı (karar desteği). Tanı yazmaz, doz yazmaz.
 * Kaynak: KDIGO uyarlaması / TND — güncel eşikleri hekim doğrular.
 */
import type { Dipnot } from './nefroloji'
import { ayEkle } from './nefroloji'

export type G = 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5'
export type A = 'A1' | 'A2' | 'A3'
export type Renk = 'yesil' | 'sari' | 'turuncu' | 'kirmizi'

export function gEvre(eGFR: number): G {
  return eGFR >= 90 ? 'G1' : eGFR >= 60 ? 'G2' : eGFR >= 45 ? 'G3a' : eGFR >= 30 ? 'G3b' : eGFR >= 15 ? 'G4' : 'G5'
}

export function aEvre(uacrMgG: number): A {
  return uacrMgG < 30 ? 'A1' : uacrMgG <= 300 ? 'A2' : 'A3'
}

export function kdigoRenk(g: G, a: A | null): Renk {
  const gi = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'].indexOf(g)
  const ai = a ? ['A1', 'A2', 'A3'].indexOf(a) : 0
  if (gi >= 4) return 'kirmizi'
  if (gi === 3) return ai === 0 ? 'turuncu' : 'kirmizi'
  if (gi === 2) return ai === 0 ? 'sari' : ai === 1 ? 'turuncu' : 'kirmizi'
  return ai === 0 ? 'yesil' : ai === 1 ? 'sari' : 'turuncu'
}

export const RENK_AD: Record<Renk, string> = {
  yesil: 'Düşük risk hücresi — karar desteği',
  sari: 'Orta risk hücresi — karar desteği',
  turuncu: 'Yüksek risk hücresi — karar desteği',
  kirmizi: 'Çok yüksek risk hücresi — karar desteği',
}

export interface EgfrSonuc {
  tamamMi: boolean
  g: G | null
  a: A | null
  renk: Renk | null
  renkAd: string
  sonrakiAy: number | null
  ozet: string
  plan: string[]
  dipnot: Dipnot
}

function izlemAy(renk: Renk): number {
  if (renk === 'yesil') return 12
  if (renk === 'sari') return 12
  if (renk === 'turuncu') return 6
  return 3
}

/**
 * eGFR (mL/dk/1.73m²) + isteğe bağlı UACR (mg/g). Eksik eGFR → yorumlanmaz.
 * Makul eGFR 2–200; UACR 0–10000.
 */
export function egfrSkorla(egfrHam: number | null | undefined, uacrHam: number | null | undefined): EgfrSonuc {
  const dipnot: Dipnot = { ref: 'KDIGO_TND', not: 'KDIGO G×A karar desteğidir; tanı ve tedavi hekimindir' }
  if (egfrHam == null || Number.isNaN(Number(egfrHam))) {
    return {
      tamamMi: false, g: null, a: null, renk: null, renkAd: '—', sonrakiAy: null,
      ozet: 'eGFR eksik — KDIGO hücresi yorumlanmaz', plan: [], dipnot,
    }
  }
  const egfr = Number(egfrHam)
  if (egfr < 2 || egfr > 200) {
    return {
      tamamMi: false, g: null, a: null, renk: null, renkAd: '—', sonrakiAy: null,
      ozet: 'eGFR makul aralık dışında (2–200) — hekim doğrular', plan: [], dipnot,
    }
  }
  const uacr = uacrHam == null || Number.isNaN(Number(uacrHam)) ? null : Number(uacrHam)
  if (uacr != null && (uacr < 0 || uacr > 10000)) {
    return {
      tamamMi: false, g: null, a: null, renk: null, renkAd: '—', sonrakiAy: null,
      ozet: 'UACR makul aralık dışında — hekim doğrular', plan: [], dipnot,
    }
  }
  const g = gEvre(egfr)
  const a = uacr != null ? aEvre(uacr) : null
  const renk = kdigoRenk(g, a)
  const sonrakiAy = izlemAy(renk)
  const plan: string[] = [
    `İzlem önerisi ~${sonrakiAy} ay: eGFR + UACR (karar desteği)`,
    'RAS / SGLT2 / NSAİİ sınıfı değerlendirmesi hekimde — doz Notya yazmaz',
  ]
  if (g === 'G4' || g === 'G5') plan.push('G4–G5: renal replasman / anemi / mineral-kemik planı hekim kararı')
  if (a === 'A3') plan.push('A3 albüminüri: izlem sıkılığı ve sevk kararı hekimde')
  return {
    tamamMi: true,
    g,
    a,
    renk,
    renkAd: RENK_AD[renk],
    sonrakiAy,
    ozet: `eGFR ${egfr} → ${g}${a ? ` × ${a}` : ' (UACR yok)'} · ${RENK_AD[renk]}. Önerilen izlem ~${sonrakiAy} ay. Tanı/doz hekimin.`,
    plan,
    dipnot,
  }
}

export function sonrakiIzlemTarihi(tarih: string, sonrakiAy: number | null): string | null {
  if (sonrakiAy == null) return null
  return ayEkle(tarih, sonrakiAy)
}

/** Hekim-facing ilaç sınıfı checklist — doz / mg YOK. Kohort ± araçta kullanılır. */
export const ILAC_DOZ_UYARI_LISTESI: readonly string[] = [
  'RAS blokeri: K / kreatinin izlemi planlandı (doz hekimde)',
  'SGLT2: eGFR eşiği ve hacim durumu hekim değerlendirdi',
  'NSAİİ: KBH’de kaçınma / alternatif analjezi görüşüldü',
  'Potasyum bağlayıcı / diüretik: endikasyon hekim kararı (doz Notya yazmaz)',
  'ESA / demir: anemi paneli bakıldı; ESA dozu hekim reçetesinde (Notya üretmez)',
  'Metformin / digoksin / diğer renal-clearance ilaçlar: doz ayarı hekimde',
]
