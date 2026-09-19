/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil bayrak · pre-op · greft/yara · antikoag · kontrol · gecikmiş.
 */
import { gunFarki } from './kalp-damar'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface KdcSeritGirdi {
  bugun: string
  preopSayi: number
  greftYaraDurum: string | null
  antikoagVade: string | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface KdcSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function kdcSeridi(g: KdcSeritGirdi): KdcSerit {
  const chips: KdcSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık kalp-damar acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  chips.push({
    ad: 'Pre-op',
    deger: g.preopSayi ? String(g.preopSayi) : '—',
    durum: g.preopSayi ? 'iyi' : 'yok',
    alt: g.preopSayi ? 'madde' : 'checklist yok',
  })

  chips.push(
    g.greftYaraDurum
      ? { ad: 'Greft/yara', deger: g.greftYaraDurum, durum: g.greftYaraDurum === 'dikkat' ? 'dikkat' : 'iyi' }
      : { ad: 'Greft/yara', deger: '—', durum: 'yok', alt: 'izlem yok' },
  )

  chips.push(
    g.antikoagVade
      ? { ad: 'Antikoag', deger: g.antikoagVade, durum: 'dikkat', alt: 'vade' }
      : { ad: 'Antikoag', deger: '—', durum: 'yok' },
  )

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
