/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: kırmızı bayrak · aşı/tarama · kronik izlem · sonraki kontrol · gecikmiş görev.
 */
import { gunFarki } from './aile'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface AileSeritGirdi {
  bugun: string
  asiTaramaSayi: number
  kronikPaketler: string[]
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface AileSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function aileSeridi(g: AileSeritGirdi): AileSerit {
  const chips: AileSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Sevk/acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık sevk/acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Sevk/acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  chips.push({
    ad: 'Aşı/tarama',
    deger: g.asiTaramaSayi ? String(g.asiTaramaSayi) : '—',
    durum: g.asiTaramaSayi ? 'iyi' : 'yok',
    alt: g.asiTaramaSayi ? 'açık görev' : 'paket seç',
  })

  chips.push({
    ad: 'Kronik paket',
    deger: g.kronikPaketler.length ? String(g.kronikPaketler.length) : '—',
    durum: g.kronikPaketler.length ? 'iyi' : 'yok',
    alt: g.kronikPaketler.length ? g.kronikPaketler.slice(0, 2).join(', ') : 'yok',
  })

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
