/**
 * NOROLOJI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: kırmızı bayrak · son MIDAS · sonraki kontrol · ilaç izlem · gecikmiş görev.
 */
import { gunFarki } from './noroloji'
import type { MigrenBant } from './migren'
import { MIGREN_BANT_AD } from './migren'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface NoroSeritGirdi {
  bugun: string
  migren: { toplam: number | null; bant: MigrenBant | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  ilacIzlemAcik: number
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface NoroSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function noroSeridi(g: NoroSeritGirdi): NoroSerit {
  const chips: NoroSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'İnme/TIA bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık inme/TIA bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'İnme/TIA bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.migren && g.migren.toplam != null && g.migren.bant) {
    const agir = g.migren.bant === 'siddetli' || g.migren.bant === 'orta'
    chips.push({
      ad: 'MIDAS',
      deger: String(g.migren.toplam),
      durum: agir ? (g.migren.bant === 'siddetli' ? 'kotu' : 'dikkat') : 'iyi',
      alt: MIGREN_BANT_AD[g.migren.bant].split('—')[0].trim(),
    })
    if (g.migren.bant === 'siddetli') kirmizi.push('MIDAS şiddetli bant — önleyici tedavi ve plan hekim kararı')
  } else {
    chips.push({ ad: 'MIDAS', deger: '—', durum: 'yok', alt: 'bu vizitte doldur' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push({
    ad: 'İlaç izlem',
    deger: g.ilacIzlemAcik ? String(g.ilacIzlemAcik) : '—',
    durum: g.ilacIzlemAcik >= 2 ? 'dikkat' : g.ilacIzlemAcik ? 'iyi' : 'yok',
    alt: g.ilacIzlemAcik ? 'açık görev' : 'yok',
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
