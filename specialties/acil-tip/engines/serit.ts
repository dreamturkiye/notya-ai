/**
 * ACIL-TIP-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: risk · ESI · kritik yol · sevk · kontrol · gecikmiş.
 */
import { gunFarki } from './acilTip'
import { ESI_ETIKET, type EsiSeviye } from './esi'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface AtSeritGirdi {
  bugun: string
  esiSeviye: number | null
  kritikYolSayi: number
  sevkHedef: string | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface AtSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function atSeridi(g: AtSeritGirdi): AtSerit {
  const chips: AtSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.esiSeviye != null && g.esiSeviye >= 1 && g.esiSeviye <= 5) {
    const s = g.esiSeviye as EsiSeviye
    chips.push({
      ad: 'ESI',
      deger: String(s),
      durum: s <= 2 ? 'kotu' : s === 3 ? 'dikkat' : 'iyi',
      alt: ESI_ETIKET[s],
    })
  } else {
    chips.push({ ad: 'ESI', deger: '—', durum: 'yok', alt: 'seviye belirle' })
  }

  chips.push({
    ad: 'Kritik yol',
    deger: g.kritikYolSayi ? String(g.kritikYolSayi) : '—',
    durum: g.kritikYolSayi ? 'dikkat' : 'yok',
    alt: g.kritikYolSayi ? 'bayrak' : 'yok',
  })

  chips.push({
    ad: 'Sevk/paket',
    deger: g.sevkHedef || '—',
    durum: g.sevkHedef ? 'dikkat' : 'yok',
  })

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'taburcu sonrası' },
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
