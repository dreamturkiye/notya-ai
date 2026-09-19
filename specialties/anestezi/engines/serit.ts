/**
 * ANESTEZI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil · ASA · hava yolu · ağrı · kontrol · alerji · gecikmiş.
 */
import { gunFarki } from './anestezi'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface AnesteziSeritGirdi {
  bugun: string
  asaSayi: number
  havaYoluSayi: number
  agriSayi: number
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  alerjiIlac: boolean
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface AnesteziSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function anesteziSeridi(g: AnesteziSeritGirdi): AnesteziSerit {
  const chips: AnesteziSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık anestezi acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  chips.push({
    ad: 'ASA/pre-op',
    deger: g.asaSayi ? String(g.asaSayi) : '—',
    durum: g.asaSayi ? 'dikkat' : 'yok',
    alt: g.asaSayi ? 'madde' : 'liste yok',
  })

  chips.push({
    ad: 'Hava yolu',
    deger: g.havaYoluSayi ? String(g.havaYoluSayi) : '—',
    durum: g.havaYoluSayi ? 'dikkat' : 'yok',
    alt: g.havaYoluSayi ? 'bayrak' : 'not yok',
  })

  chips.push({
    ad: 'Ağrı izlem',
    deger: g.agriSayi ? String(g.agriSayi) : '—',
    durum: g.agriSayi ? 'dikkat' : 'yok',
    alt: g.agriSayi ? 'bayrak' : 'izlem yok',
  })

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push({
    ad: 'Alerji/ilaç',
    deger: g.alerjiIlac ? 'var' : '—',
    durum: g.alerjiIlac ? 'dikkat' : 'yok',
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
