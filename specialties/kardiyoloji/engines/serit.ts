/**
 * KARDIO-EXCEPTIONAL-01 — Sticky "bugünkü vizit" şeridi. SAF fonksiyon; nota yazmaz.
 */
import { gunFarki } from './kardiyoloji'
import type { KvrKova } from './score2'
import { KOVA_AD } from './score2'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface KardioSeritGirdi {
  bugun: string
  score2: { riskPct: number | null; kova: KvrKova | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  sonIzlem: { tip: string; tarih: string | null } | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface KardioSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function kardioSeridi(g: KardioSeritGirdi): KardioSerit {
  const chips: KardioSerit['chips'] = []
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

  if (g.score2 && g.score2.riskPct != null) {
    const agir = g.score2.kova === 'cok_yuksek'
    const orta = g.score2.kova === 'yuksek'
    chips.push({
      ad: 'SCORE2',
      deger: `${g.score2.riskPct}%`,
      durum: agir ? 'kotu' : orta ? 'dikkat' : 'iyi',
      alt: g.score2.kova ? KOVA_AD[g.score2.kova] : undefined,
    })
    if (agir) kirmizi.push('SCORE2 çok yüksek bant — izlem ve hedef planı hekim kararı')
  } else {
    chips.push({ ad: 'SCORE2', deger: '—', durum: 'yok', alt: 'bu vizitte hesapla' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  if (g.sonIzlem?.tarih) {
    chips.push({ ad: 'Son izlem', deger: g.sonIzlem.tip || 'izlem', durum: 'iyi', alt: g.sonIzlem.tarih })
  } else {
    chips.push({ ad: 'Son izlem', deger: '—', durum: 'yok', alt: 'HT/KKY kaydı yok' })
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
