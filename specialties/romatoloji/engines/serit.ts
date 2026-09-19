/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 */
import { gunFarki } from './romatoloji'
import type { AktiviteBant } from './das28Basdai'
import { AKTIVITE_BANT_AD } from './das28Basdai'
import type { LabBant } from './labIzlem'
import { LAB_BANT_AD } from './labIzlem'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface RomaSeritGirdi {
  bugun: string
  das28: { toplam: number | null; bant: AktiviteBant | null; tarih: string | null } | null
  basdai: { toplam: number | null; bant: AktiviteBant | null; tarih: string | null } | null
  crp: { deger: number | null; bant: LabBant | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface RomaSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

function skorDurum(bant: AktiviteBant | null): CipDurum {
  if (!bant || bant === 'bilinmiyor') return 'yok'
  if (bant === 'yuksek') return 'kotu'
  if (bant === 'orta') return 'dikkat'
  return 'iyi'
}

export function romaSeridi(g: RomaSeritGirdi): RomaSerit {
  const chips: RomaSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık romatoloji acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.das28 && g.das28.toplam != null && g.das28.bant) {
    chips.push({
      ad: 'DAS28',
      deger: String(g.das28.toplam),
      durum: skorDurum(g.das28.bant),
      alt: AKTIVITE_BANT_AD[g.das28.bant].split('—')[0].trim(),
    })
    if (g.das28.bant === 'yuksek') kirmizi.push('DAS28 yüksek aktivite bandı — plan hekim kararı')
  } else {
    chips.push({ ad: 'DAS28', deger: '—', durum: 'yok', alt: 'bu vizitte gir' })
  }

  if (g.basdai && g.basdai.toplam != null && g.basdai.bant) {
    chips.push({
      ad: 'BASDAI',
      deger: String(g.basdai.toplam),
      durum: skorDurum(g.basdai.bant),
      alt: AKTIVITE_BANT_AD[g.basdai.bant].split('—')[0].trim(),
    })
  } else {
    chips.push({ ad: 'BASDAI', deger: '—', durum: 'yok', alt: 'isteğe bağlı' })
  }

  if (g.crp && g.crp.deger != null && g.crp.bant) {
    chips.push({
      ad: 'CRP',
      deger: String(g.crp.deger),
      durum: g.crp.bant === 'yuksek' ? 'kotu' : g.crp.bant === 'dikkat' ? 'dikkat' : 'iyi',
      alt: LAB_BANT_AD[g.crp.bant].split('—')[0].trim(),
    })
  } else {
    chips.push({ ad: 'CRP', deger: '—', durum: 'yok', alt: 'isteğe bağlı' })
  }

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
