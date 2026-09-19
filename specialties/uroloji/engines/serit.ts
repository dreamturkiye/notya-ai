/**
 * UROLOJI-EXCEPTIONAL-01 — Sticky "bugünkü vizit" şeridi (hekim yüzü). SAF fonksiyon.
 * Çipler: risk · son IPSS · son PSA · kontrol · gecikmiş.
 */
import type { IpssBant } from './ipss'
import { IPSS_BANT_AD } from './ipss'
import type { PsaBant } from './psa'
import { PSA_BANT_AD } from './psa'
import { gunFarki } from './uroloji'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface UroSeritGirdi {
  bugun: string
  ipss: { toplam: number | null; bant: IpssBant | null; tarih: string | null } | null
  psa: { deger: number | null; bant: PsaBant | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface UroSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export const IPSS_TAZELIK_GUN = 365
export const PSA_TAZELIK_GUN = 365

function eskiMi(tarih: string | null, bugun: string, gun: number): boolean {
  if (!tarih) return true
  return gunFarki(tarih, bugun) > gun
}

export function uroSeridi(g: UroSeritGirdi): UroSerit {
  const chips: UroSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Risk',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Kırmızı bayrak açık (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Risk', deger: 'yok', durum: 'iyi' })
  }

  if (g.ipss && g.ipss.toplam != null) {
    const eski = eskiMi(g.ipss.tarih, g.bugun, IPSS_TAZELIK_GUN)
    const agir = g.ipss.bant === 'siddetli'
    const orta = g.ipss.bant === 'orta'
    chips.push({
      ad: 'IPSS',
      deger: String(g.ipss.toplam),
      durum: agir ? 'kotu' : orta ? 'dikkat' : 'iyi',
      alt: eski ? '>1 yıl eski' : (g.ipss.bant ? IPSS_BANT_AD[g.ipss.bant] : undefined),
    })
    if (agir) kirmizi.push('IPSS şiddetli bantta — plan ve tanı hekim kararı')
  } else {
    chips.push({ ad: 'IPSS', deger: '—', durum: 'yok', alt: 'bu vizitte doldur' })
  }

  if (g.psa && g.psa.deger != null) {
    const eski = eskiMi(g.psa.tarih, g.bugun, PSA_TAZELIK_GUN)
    const agir = g.psa.bant === 'cok_yuksek' || g.psa.bant === 'yuksek'
    const orta = g.psa.bant === 'sinir'
    chips.push({
      ad: 'PSA',
      deger: `${g.psa.deger}`,
      durum: agir ? 'kotu' : orta ? 'dikkat' : 'iyi',
      alt: eski ? '>1 yıl eski' : (g.psa.bant ? PSA_BANT_AD[g.psa.bant] : undefined),
    })
    if (agir) kirmizi.push('PSA yüksek/çok yüksek aralıkta — ileri değerlendirme hekim kararı (tanı değil)')
  } else {
    chips.push({ ad: 'PSA', deger: '—', durum: 'yok', alt: 'bu vizitte kaydet' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  const overdue = g.gorevler
    .filter((x) => x.due && x.due < g.bugun)
    .map((x) => ({ ad: x.ad, due: x.due as string, gecikmeGun: gunFarki(x.due as string, g.bugun) }))
    .sort((a, b) => b.gecikmeGun - a.gecikmeGun)
  chips.push({ ad: 'Gecikmiş', deger: String(overdue.length), durum: overdue.length ? (overdue.length >= 3 ? 'kotu' : 'dikkat') : 'iyi' })

  const planTaslagi = [
    ...kirmizi.map((k) => `⚑ ${k}`),
    ...g.planlar.map((p) => `${p.kaynak}: ${p.madde}`),
    ...overdue.slice(0, 5).map((o) => `Gecikmiş: ${o.ad} (${o.gecikmeGun} gün)`),
  ]

  return { chips, overdue, planTaslagi, kirmizi }
}
