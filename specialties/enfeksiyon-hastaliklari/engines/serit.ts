/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil bayrak · izolasyon · ATB bitiş · viral izlem · kontrol · gecikmiş.
 */
import { gunFarki } from './enfeksiyon'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface EnfSeritGirdi {
  bugun: string
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  atbBitis: string | null
  viralSonraki: string | null
  izolasyonBitis: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface EnfSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function enfSeridi(g: EnfSeritGirdi): EnfSerit {
  const chips: EnfSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık enfeksiyon acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  chips.push(
    g.izolasyonBitis
      ? { ad: 'İzolasyon', deger: g.izolasyonBitis, durum: gunFarki(g.izolasyonBitis, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.izolasyonBitis, g.bugun) > 0 ? 'bitiş geçti' : undefined }
      : { ad: 'İzolasyon', deger: '—', durum: 'yok', alt: 'plan yok' },
  )

  chips.push(
    g.atbBitis
      ? { ad: 'ATB bitiş', deger: g.atbBitis, durum: gunFarki(g.atbBitis, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.atbBitis, g.bugun) > 0 ? 'süre doldu' : undefined }
      : { ad: 'ATB bitiş', deger: '—', durum: 'yok', alt: 'süre yok' },
  )

  chips.push(
    g.viralSonraki
      ? { ad: 'Viral izlem', deger: g.viralSonraki, durum: gunFarki(g.viralSonraki, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.viralSonraki, g.bugun) > 0 ? 'vade geçti' : undefined }
      : { ad: 'Viral izlem', deger: '—', durum: 'yok', alt: 'plan yok' },
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
