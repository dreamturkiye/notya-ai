/**
 * ONKOLOJI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil bayrak · kür · kontrol · toksisite · görüntü · gecikmiş.
 */
import { gunFarki } from './onkoloji'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface OnkoSeritGirdi {
  bugun: string
  mevcutKur: number | null
  toplamKur: number | null
  sonrakiKur: string | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  toksisiteSayi: number
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface OnkoSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function onkoSeridi(g: OnkoSeritGirdi): OnkoSerit {
  const chips: OnkoSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık onkoloji acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.mevcutKur != null) {
    chips.push({
      ad: 'Kür',
      deger: g.toplamKur != null ? `${g.mevcutKur}/${g.toplamKur}` : String(g.mevcutKur),
      durum: 'iyi',
      alt: g.sonrakiKur || undefined,
    })
  } else {
    chips.push({ ad: 'Kür', deger: '—', durum: 'yok', alt: 'bu vizitte gir' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push({
    ad: 'Toksisite',
    deger: g.toksisiteSayi ? String(g.toksisiteSayi) : '—',
    durum: g.toksisiteSayi ? 'dikkat' : 'yok',
    alt: g.toksisiteSayi ? 'açık madde' : 'liste yok',
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
