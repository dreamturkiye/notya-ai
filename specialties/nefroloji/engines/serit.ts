/**
 * NEFROLOJI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil bayrak · eGFR · KDIGO · Hb · kontrol · diyaliz · gecikmiş.
 */
import { gunFarki } from './nefroloji'
import type { Renk } from './egfr'
import { RENK_AD } from './egfr'
import type { AnemiBant } from './anemi'
import { ANEMI_BANT_AD } from './anemi'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface NefSeritGirdi {
  bugun: string
  egfr: { deger: number | null; g: string | null; renk: Renk | null; tarih: string | null } | null
  hb: { deger: number | null; bant: AnemiBant | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  sonrakiDiyaliz: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface NefSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function nefSeridi(g: NefSeritGirdi): NefSerit {
  const chips: NefSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık nefro acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.egfr && g.egfr.deger != null) {
    const renk = g.egfr.renk
    chips.push({
      ad: 'eGFR',
      deger: String(g.egfr.deger),
      durum: renk === 'kirmizi' ? 'kotu' : renk === 'turuncu' || renk === 'sari' ? 'dikkat' : 'iyi',
      alt: g.egfr.g || undefined,
    })
    if (renk === 'kirmizi') kirmizi.push('KDIGO çok yüksek risk hücresi — plan hekim kararı')
  } else {
    chips.push({ ad: 'eGFR', deger: '—', durum: 'yok', alt: 'bu vizitte gir' })
  }

  if (g.egfr?.renk) {
    chips.push({
      ad: 'KDIGO',
      deger: g.egfr.renk,
      durum: g.egfr.renk === 'kirmizi' ? 'kotu' : g.egfr.renk === 'yesil' ? 'iyi' : 'dikkat',
      alt: RENK_AD[g.egfr.renk].split('—')[0].trim(),
    })
  } else {
    chips.push({ ad: 'KDIGO', deger: '—', durum: 'yok', alt: 'eGFR ile' })
  }

  if (g.hb && g.hb.deger != null && g.hb.bant) {
    chips.push({
      ad: 'Hb',
      deger: String(g.hb.deger),
      durum: g.hb.bant === 'dusuk' ? 'kotu' : g.hb.bant === 'dikkat' ? 'dikkat' : 'iyi',
      alt: ANEMI_BANT_AD[g.hb.bant].split('—')[0].trim(),
    })
  } else {
    chips.push({ ad: 'Hb', deger: '—', durum: 'yok', alt: 'isteğe bağlı' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push(
    g.sonrakiDiyaliz
      ? { ad: 'Diyaliz', deger: g.sonrakiDiyaliz, durum: gunFarki(g.sonrakiDiyaliz, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiDiyaliz, g.bugun) > 0 ? 'seans gecikti' : undefined }
      : { ad: 'Diyaliz', deger: '—', durum: 'yok', alt: 'plan yok' },
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
