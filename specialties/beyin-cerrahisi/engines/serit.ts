/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil · post-op · bilinç · kontrol · görüntü · gecikmiş.
 */
import { gunFarki } from './beyin'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface BcSeritGirdi {
  bugun: string
  postopSayi: number
  bilincSayi: number
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  goruntuSonraki: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface BcSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function bcSeridi(g: BcSeritGirdi): BcSerit {
  const chips: BcSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık nöroşirürji acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  chips.push({
    ad: 'Post-op',
    deger: g.postopSayi ? String(g.postopSayi) : '—',
    durum: g.postopSayi ? 'dikkat' : 'yok',
    alt: g.postopSayi ? 'madde' : 'liste yok',
  })

  chips.push({
    ad: 'Bilinç/nöbet',
    deger: g.bilincSayi ? String(g.bilincSayi) : '—',
    durum: g.bilincSayi ? 'dikkat' : 'yok',
    alt: g.bilincSayi ? 'bayrak' : 'izlem yok',
  })

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push(
    g.goruntuSonraki
      ? { ad: 'Görüntü', deger: g.goruntuSonraki, durum: gunFarki(g.goruntuSonraki, g.bugun) > 0 ? 'dikkat' : 'iyi' }
      : { ad: 'Görüntü', deger: '—', durum: 'yok' },
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
