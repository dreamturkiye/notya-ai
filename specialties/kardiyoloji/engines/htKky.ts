/**
 * KARDIO-EXCEPTIONAL-01 — HT / KKY (kalp yetersizliği) izlem motoru. SAF fonksiyon.
 * Sınıf düzeyi görev önerileri üretir; doz, tanı ve NYHA "tanısı" yazmaz — NYHA hekim seçimidir.
 */
import type { Dipnot } from './kardiyoloji'
import { gunEkle } from './kardiyoloji'

export type IzlemTip = 'ht' | 'kky' | 'af' | 'diger'
export type NyhaSinif = 'I' | 'II' | 'III' | 'IV'

export const IZLEM_TIP_AD: Record<IzlemTip, string> = {
  ht: 'Hipertansiyon izlemi',
  kky: 'Kalp yetersizliği (KKY) izlemi',
  af: 'Atriyal fibrilasyon izlemi',
  diger: 'Genel kardiyoloji izlemi',
}

export const NYHA_AD: Record<NyhaSinif, string> = {
  I: 'NYHA I (hekim)',
  II: 'NYHA II (hekim)',
  III: 'NYHA III (hekim)',
  IV: 'NYHA IV (hekim)',
}

export interface IzlemGirdi {
  tip: IzlemTip
  bugun: string
  sbp?: number | null
  dbp?: number | null
  kiloKg?: number | null
  nyha?: NyhaSinif | null
  /** hekim işaretleri — semptom / kontrol bayrakları */
  bayraklar?: string[]
  hekimNotu?: string
}

export interface IzlemGorev { kod: string; ad: string; due: string }

export interface IzlemSonuc {
  tip: IzlemTip
  tipAd: string
  ozet: string
  gorevler: IzlemGorev[]
  uyarilar: string[]
  dipnotlar: Dipnot[]
  eksikler: string[]
}

/** Ofis KB "dikkat" eşiği — karar desteği; tanı değildir. */
export const KB_DIKKAT_SBP = 140
export const KB_DIKKAT_DBP = 90

export function izlemDegerlendir(g: IzlemGirdi): IzlemSonuc {
  const eksikler: string[] = []
  if (!g.tip) eksikler.push('İzlem tipi seçilmedi')
  const uyarilar: string[] = []
  const gorevler: IzlemGorev[] = []
  const satirlar: string[] = []

  if (g.sbp != null && Number.isFinite(g.sbp)) {
    satirlar.push(`Sistolik KB ${Math.round(g.sbp)} mmHg (ofis)`)
    if (g.sbp >= KB_DIKKAT_SBP) uyarilar.push('Sistolik KB ≥140 — hedef ve ilaç düzeni hekim kararı (doz yazılmaz)')
  }
  if (g.dbp != null && Number.isFinite(g.dbp)) {
    satirlar.push(`Diyastolik KB ${Math.round(g.dbp)} mmHg (ofis)`)
    if (g.dbp >= KB_DIKKAT_DBP) uyarilar.push('Diyastolik KB ≥90 — hedef hekim kararı')
  }
  if (g.kiloKg != null && Number.isFinite(g.kiloKg)) satirlar.push(`Kilo ${g.kiloKg} kg`)
  if (g.nyha) satirlar.push(`NYHA ${g.nyha} (hekim değerlendirmesi)`)

  if (g.tip === 'ht') {
    gorevler.push(
      { kod: 'kb_kontrol', ad: 'Kan basıncı kontrol randevusu', due: gunEkle(g.bugun, 30) },
      { kod: 'lab_elektrolit', ad: 'Elektrolit / böbrek paneli (hekim kararı)', due: gunEkle(g.bugun, 90) },
    )
  } else if (g.tip === 'kky') {
    gorevler.push(
      { kod: 'kky_kontrol', ad: 'Kalp yetersizliği kontrol randevusu', due: gunEkle(g.bugun, 30) },
      { kod: 'kilo_izlem', ad: 'Kilo / ödem izlem kontrolü', due: gunEkle(g.bugun, 14) },
    )
    if (g.nyha === 'III' || g.nyha === 'IV') uyarilar.push('NYHA III–IV — acil kötüleşme planı hekim onayıyla; doz yok')
  } else if (g.tip === 'af') {
    gorevler.push(
      { kod: 'af_kontrol', ad: 'Ritim / AF kontrol randevusu', due: gunEkle(g.bugun, 60) },
      { kod: 'inr_lab', ad: 'Antikoagülan izlem lab (hekim kararı — doz yok)', due: gunEkle(g.bugun, 30) },
    )
  } else {
    gorevler.push({ kod: 'kontrol_randevu', ad: 'Kontrol randevusu', due: gunEkle(g.bugun, 90) })
  }

  if ((g.bayraklar || []).some((b) => /ekg|belge/i.test(b))) {
    gorevler.push({ kod: 'ekg_belge', ad: 'EKG / belge yükleme kontrolü', due: gunEkle(g.bugun, 14) })
  }

  if (!satirlar.length && !(g.hekimNotu || '').trim()) eksikler.push('Ölçüm veya hekim notu girilmedi')

  const ozet = [
    IZLEM_TIP_AD[g.tip],
    ...satirlar,
    g.hekimNotu ? `Hekim notu: ${String(g.hekimNotu).slice(0, 400)}` : null,
    'Tanı ve doz kararı hekimindir.',
  ].filter(Boolean).join(' · ')

  return {
    tip: g.tip,
    tipAd: IZLEM_TIP_AD[g.tip],
    ozet,
    gorevler,
    uyarilar,
    dipnotlar: [
      { ref: 'ESC_TKD', not: 'HT / KKY izlem aralıkları klinik karardır; Notya yalnız hatırlatma üretir.' },
      { ref: 'TITCK', not: 'İlaç dozu üretilmez.' },
    ],
    eksikler,
  }
}
