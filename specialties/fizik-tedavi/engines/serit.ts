/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: kırmızı bayrak · son VAS/ODI · seans · egzersiz · kontrol · gecikmiş.
 */
import { gunFarki } from './fizik-tedavi'
import type { VasBant, OdiBant } from './vasOdi'
import { VAS_BANT_AD, ODI_BANT_AD } from './vasOdi'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface FtrSeritGirdi {
  bugun: string
  vas: { deger: number | null; bant: VasBant | null; tarih: string | null } | null
  odi: { yuzde: number | null; bant: OdiBant | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  seansAcik: number
  egzersizAcik: number
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface FtrSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function ftrSeridi(g: FtrSeritGirdi): FtrSerit {
  const chips: FtrSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Kırmızı bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık kırmızı bayrak (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Kırmızı bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.vas && g.vas.deger != null && g.vas.bant) {
    chips.push({
      ad: 'VAS',
      deger: String(g.vas.deger),
      durum: g.vas.bant === 'siddetli' ? 'kotu' : g.vas.bant === 'orta' ? 'dikkat' : 'iyi',
      alt: VAS_BANT_AD[g.vas.bant].split('—')[0].trim(),
    })
  } else {
    chips.push({ ad: 'VAS', deger: '—', durum: 'yok', alt: 'bu vizitte doldur' })
  }

  if (g.odi && g.odi.yuzde != null && g.odi.bant) {
    const agir = g.odi.bant === 'siddetli' || g.odi.bant === 'cok_siddetli' || g.odi.bant === 'yataga_bagli'
    chips.push({
      ad: 'ODI',
      deger: `${g.odi.yuzde}%`,
      durum: agir ? 'kotu' : g.odi.bant === 'orta' ? 'dikkat' : 'iyi',
      alt: ODI_BANT_AD[g.odi.bant].split('—')[0].trim(),
    })
  } else {
    chips.push({ ad: 'ODI', deger: '—', durum: 'yok', alt: 'bu vizitte doldur' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push({
    ad: 'Seans',
    deger: g.seansAcik ? String(g.seansAcik) : '—',
    durum: g.seansAcik ? 'iyi' : 'yok',
    alt: g.seansAcik ? 'açık görev' : 'plan yok',
  })

  chips.push({
    ad: 'Egzersiz',
    deger: g.egzersizAcik ? String(g.egzersizAcik) : '—',
    durum: g.egzersizAcik ? 'iyi' : 'yok',
    alt: g.egzersizAcik ? 'açık görev' : 'reçete yok',
  })

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
