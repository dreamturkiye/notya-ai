/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF.
 */
import { gunFarki } from './cocuk-cerrahisi'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface CcSeritGirdi {
  bugun: string
  prepostTamam: number | null
  prepostToplam: number
  ameliyatTarihi: string | null
  yaraTip: string | null
  onamTamam: number | null
  onamToplam: number
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface CcSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function ccSeridi(g: CcSeritGirdi): CcSerit {
  const chips: CcSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık cerrahi acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.prepostTamam != null) {
    const eksik = g.prepostTamam < g.prepostToplam
    chips.push({
      ad: 'Pre/post-op',
      deger: `${g.prepostTamam}/${g.prepostToplam}`,
      durum: eksik ? 'dikkat' : 'iyi',
      alt: g.ameliyatTarihi || undefined,
    })
  } else {
    chips.push({ ad: 'Pre/post-op', deger: '—', durum: 'yok', alt: 'checklist yok' })
  }

  chips.push(
    g.yaraTip
      ? { ad: 'Yara/dren', deger: g.yaraTip, durum: 'dikkat' }
      : { ad: 'Yara/dren', deger: '—', durum: 'yok', alt: 'kayıt yok' },
  )

  if (g.onamTamam != null) {
    chips.push({
      ad: 'Onam/veli',
      deger: `${g.onamTamam}/${g.onamToplam}`,
      durum: g.onamTamam < g.onamToplam ? 'dikkat' : 'iyi',
    })
  } else {
    chips.push({ ad: 'Onam/veli', deger: '—', durum: 'yok' })
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
