/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil bayrak · IBD/IBS skor · hepatit · endoskopi · kontrol · gecikmiş.
 */
import { gunFarki } from './gastroenteroloji'
import type { SkorBant } from './ibdIbs'
import { SKOR_BANT_AD } from './ibdIbs'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface GastroSeritGirdi {
  bugun: string
  skor: { deger: number | null; bant: SkorBant | null; tarih: string | null; tur: string | null } | null
  hepatitSonraki: string | null
  endoskopiSonraki: string | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface GastroSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function gastroSeridi(g: GastroSeritGirdi): GastroSerit {
  const chips: GastroSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık GI acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.skor && g.skor.deger != null && g.skor.bant) {
    chips.push({
      ad: 'IBD/IBS',
      deger: String(g.skor.deger),
      durum: g.skor.bant === 'siddetli' ? 'kotu' : g.skor.bant === 'orta' ? 'dikkat' : 'iyi',
      alt: SKOR_BANT_AD[g.skor.bant].split('—')[0].trim(),
    })
    if (g.skor.bant === 'siddetli') kirmizi.push('Yüksek aktivite bandı — izlem ve plan hekim kararı')
  } else {
    chips.push({ ad: 'IBD/IBS', deger: '—', durum: 'yok', alt: 'bu vizitte gir' })
  }

  chips.push(
    g.hepatitSonraki
      ? { ad: 'HBV/HCV', deger: g.hepatitSonraki, durum: gunFarki(g.hepatitSonraki, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.hepatitSonraki, g.bugun) > 0 ? 'izlem gecikti' : undefined }
      : { ad: 'HBV/HCV', deger: '—', durum: 'yok', alt: 'plan yok' },
  )

  chips.push(
    g.endoskopiSonraki
      ? { ad: 'Endoskopi', deger: g.endoskopiSonraki, durum: gunFarki(g.endoskopiSonraki, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.endoskopiSonraki, g.bugun) > 0 ? 'kontrol gecikti' : undefined }
      : { ad: 'Endoskopi', deger: '—', durum: 'yok', alt: 'köprü yok' },
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
