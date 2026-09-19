/**
 * GOGUS-EXCEPTIONAL-01 — Sticky "bugünkü vizit" şeridi (hekim yüzü). SAF fonksiyon.
 */
import { gunFarki } from './gogus'
import type { GoldGrup } from './catMmrc'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface GogusSeritGirdi {
  bugun: string
  skor: { cat: number | null; mmrc: number | null; grup: GoldGrup | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  sonSpiroTarihi: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface GogusSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export const SPIRO_TAZELIK_GUN = 365

export function gogusSeridi(g: GogusSeritGirdi): GogusSerit {
  const chips: GogusSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Kırmızı bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Kırmızı bayrak açık (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Kırmızı bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.skor && (g.skor.cat != null || g.skor.mmrc != null)) {
    const parcalar = [
      g.skor.cat != null ? `CAT ${g.skor.cat}` : null,
      g.skor.mmrc != null ? `mMRC ${g.skor.mmrc}` : null,
    ].filter(Boolean)
    const yuksek = (g.skor.cat != null && g.skor.cat >= 20) || (g.skor.mmrc != null && g.skor.mmrc >= 3) || g.skor.grup === 'E'
    chips.push({
      ad: 'Semptom',
      deger: parcalar.join(' · ') || '—',
      durum: yuksek ? 'dikkat' : 'iyi',
      alt: g.skor.grup ? `GOLD ${g.skor.grup} (karar desteği)` : undefined,
    })
  } else {
    chips.push({ ad: 'Semptom', deger: '—', durum: 'yok', alt: 'CAT / mMRC ölç' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  if (g.sonSpiroTarihi) {
    const eski = gunFarki(g.sonSpiroTarihi, g.bugun) > SPIRO_TAZELIK_GUN
    chips.push({ ad: 'Spirometri', deger: g.sonSpiroTarihi, durum: eski ? 'dikkat' : 'iyi', alt: eski ? '>1 yıl eski' : 'kayıtlı (elle)' })
  } else {
    chips.push({ ad: 'Spirometri', deger: '—', durum: 'yok', alt: 'elle gir / Belgeler' })
  }

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
