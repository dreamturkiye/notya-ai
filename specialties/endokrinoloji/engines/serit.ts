/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Sticky vizit şeridi. SAF fonksiyon.
 * Çipler: acil bayrak · HbA1c · TSH · kontrol · DXA · gecikmiş.
 */
import { gunFarki } from './endokrinoloji'
import type { LabBant } from './labIzlem'
import { LAB_BANT_AD } from './labIzlem'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface EndoSeritGirdi {
  bugun: string
  hba1c: { deger: number | null; bant: LabBant | null; tarih: string | null } | null
  tsh: { deger: number | null; bant: LabBant | null; tarih: string | null } | null
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  dxaSonraki: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface EndoSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function endoSeridi(g: EndoSeritGirdi): EndoSerit {
  const chips: EndoSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Acil bayrak',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Açık endokrin acil bayrağı (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Acil bayrak', deger: 'yok', durum: 'iyi' })
  }

  if (g.hba1c && g.hba1c.deger != null && g.hba1c.bant) {
    chips.push({
      ad: 'HbA1c',
      deger: String(g.hba1c.deger),
      durum: g.hba1c.bant === 'yuksek' ? 'kotu' : g.hba1c.bant === 'dikkat' ? 'dikkat' : 'iyi',
      alt: LAB_BANT_AD[g.hba1c.bant].split('—')[0].trim(),
    })
    if (g.hba1c.bant === 'yuksek') kirmizi.push('HbA1c yüksek uç — izlem ve plan hekim kararı')
  } else {
    chips.push({ ad: 'HbA1c', deger: '—', durum: 'yok', alt: 'bu vizitte gir' })
  }

  if (g.tsh && g.tsh.deger != null && g.tsh.bant) {
    chips.push({
      ad: 'TSH',
      deger: String(g.tsh.deger),
      durum: g.tsh.bant === 'yuksek' ? 'kotu' : g.tsh.bant === 'dikkat' ? 'dikkat' : 'iyi',
      alt: LAB_BANT_AD[g.tsh.bant].split('—')[0].trim(),
    })
  } else {
    chips.push({ ad: 'TSH', deger: '—', durum: 'yok', alt: 'isteğe bağlı' })
  }

  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  chips.push(
    g.dxaSonraki
      ? { ad: 'DXA', deger: g.dxaSonraki, durum: gunFarki(g.dxaSonraki, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.dxaSonraki, g.bugun) > 0 ? 'tekrar gecikti' : undefined }
      : { ad: 'DXA', deger: '—', durum: 'yok', alt: 'plan yok' },
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
