/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil · pre-op · yara/dren · patoloji · kontrol · gecikmiş.
 */
import { gunFarki } from './genel-cerrahi'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface GcSeritGirdi {
  bugun: string
  preopTamam: number | null
  preopToplam: number
  ameliyatTarihi: string | null
  yaraTip: string | null
  patolojiDurum: string | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface GcSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function gcSeridi(g: GcSeritGirdi): GcSerit {
  const chips: GcSerit['chips'] = []
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

  if (g.preopTamam != null) {
    const eksik = g.preopTamam < g.preopToplam
    chips.push({
      ad: 'Pre-op',
      deger: `${g.preopTamam}/${g.preopToplam}`,
      durum: eksik ? 'dikkat' : 'iyi',
      alt: g.ameliyatTarihi || undefined,
    })
  } else {
    chips.push({ ad: 'Pre-op', deger: '—', durum: 'yok', alt: 'kontrol listesi yok' })
  }

  chips.push(
    g.yaraTip
      ? { ad: 'Yara/dren', deger: g.yaraTip, durum: 'dikkat' }
      : { ad: 'Yara/dren', deger: '—', durum: 'yok', alt: 'kayıt yok' },
  )

  chips.push(
    g.patolojiDurum
      ? { ad: 'Patoloji', deger: g.patolojiDurum, durum: g.patolojiDurum === 'bekleniyor' ? 'dikkat' : 'iyi' }
      : { ad: 'Patoloji', deger: '—', durum: 'yok' },
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
