/**
 * ORTOPEDI-EXCEPTIONAL-01 — Sticky "bugünkü vizit" şeridi (hekim yüzü). SAF fonksiyon.
 * Çipler: risk · son VAS · kırık/alçı · kontrol · gecikmiş.
 */
import type { VasBant } from './vasFonksiyon'
import { VAS_BANT_AD } from './vasFonksiyon'
import { gunFarki } from './ortopedi'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface OrtoSeritGirdi {
  bugun: string
  vas: { vas: number | null; bant: VasBant | null; tarih: string | null } | null
  kirikAlci: { tip: string | null; bolge: string | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface OrtoSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export const VAS_TAZELIK_GUN = 56

function eskiMi(tarih: string | null, bugun: string, gun: number): boolean {
  if (!tarih) return true
  return gunFarki(tarih, bugun) > gun
}

export function ortoSeridi(g: OrtoSeritGirdi): OrtoSerit {
  const chips: OrtoSerit['chips'] = []
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

  if (g.vas && g.vas.vas != null) {
    const eski = eskiMi(g.vas.tarih, g.bugun, VAS_TAZELIK_GUN)
    const agir = g.vas.bant === 'siddetli'
    const orta = g.vas.bant === 'orta'
    chips.push({
      ad: 'VAS',
      deger: String(g.vas.vas),
      durum: agir ? 'kotu' : orta ? 'dikkat' : 'iyi',
      alt: eski ? '>8 hafta eski' : (g.vas.bant ? VAS_BANT_AD[g.vas.bant] : undefined),
    })
    if (agir) kirmizi.push('VAS/fonksiyon şiddetli bantta — plan ve tanı hekim kararı')
  } else {
    chips.push({ ad: 'VAS', deger: '—', durum: 'yok', alt: 'bu vizitte doldur' })
  }

  if (g.kirikAlci && g.kirikAlci.tip) {
    chips.push({
      ad: 'İzlem',
      deger: g.kirikAlci.tip,
      durum: 'dikkat',
      alt: g.kirikAlci.bolge || undefined,
    })
  } else {
    chips.push({ ad: 'İzlem', deger: '—', durum: 'yok', alt: 'kırık/alçı kaydı yok' })
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
