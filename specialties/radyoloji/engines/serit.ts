/**
 * RADYOLOJI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil · kuyruk · rapor · kritik · kontrol · belge · gecikmiş.
 */
import { gunFarki } from './radyoloji'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface RadyoSeritGirdi {
  bugun: string
  kuyrukSayi: number
  raporKategori: string | null
  kritikSayi: number
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  belgeSonraki: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface RadyoSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function radyoSeridi(g: RadyoSeritGirdi): RadyoSerit {
  const chips: RadyoSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık radyoloji acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  chips.push({
    ad: 'Kuyruk',
    deger: g.kuyrukSayi ? String(g.kuyrukSayi) : '—',
    durum: g.kuyrukSayi ? 'dikkat' : 'yok',
    alt: g.kuyrukSayi ? 'aktif tetkik' : 'kuyruk yok',
  })

  chips.push({
    ad: 'Rapor',
    deger: g.raporKategori ? `kat ${g.raporKategori}` : '—',
    durum: g.raporKategori ? 'dikkat' : 'yok',
    alt: g.raporKategori ? 'hekim seçimi' : 'taslak yok',
  })

  chips.push({
    ad: 'Kritik',
    deger: g.kritikSayi ? String(g.kritikSayi) : '—',
    durum: g.kritikSayi ? 'kotu' : 'yok',
    alt: g.kritikSayi ? 'bildirim' : 'yok',
  })

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push(
    g.belgeSonraki
      ? { ad: 'Belge', deger: g.belgeSonraki, durum: gunFarki(g.belgeSonraki, g.bugun) > 0 ? 'dikkat' : 'iyi' }
      : { ad: 'Belge', deger: '—', durum: 'yok' },
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
