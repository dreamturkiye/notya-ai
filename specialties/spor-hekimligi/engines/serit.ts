/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sticky "bugünkü vizit" şeridi (hekim yüzü). SAF fonksiyon.
 * Çipler: risk · RTP · sakatlık · yüklenme · kontrol · gecikmiş.
 */
import type { RtpBasamak } from './rtp'
import { RTP_BASAMAK_AD } from './rtp'
import { gunFarki } from './spor'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface SporSeritGirdi {
  bugun: string
  rtp: { basamak: RtpBasamak | null; tarih: string | null } | null
  sakatlikAktif: boolean
  yuklenmeUyari: boolean
  riskBayraklari: string[]
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface SporSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

export function sporSeridi(g: SporSeritGirdi): SporSerit {
  const chips: SporSerit['chips'] = []
  const kirmizi: string[] = []

  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Risk',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Kırmızı bayrak açık (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Risk', deger: 'yok', durum: 'iyi' })
  }

  if (g.rtp && g.rtp.basamak != null) {
    const b = g.rtp.basamak
    chips.push({
      ad: 'RTP',
      deger: String(b),
      durum: b <= 1 ? 'dikkat' : b >= 5 ? 'iyi' : 'dikkat',
      alt: RTP_BASAMAK_AD[b],
    })
  } else {
    chips.push({ ad: 'RTP', deger: '—', durum: 'yok', alt: 'bu vizitte kaydet' })
  }

  chips.push({
    ad: 'Sakatlık',
    deger: g.sakatlikAktif ? 'aktif' : 'yok',
    durum: g.sakatlikAktif ? 'dikkat' : 'iyi',
  })

  chips.push({
    ad: 'Yük',
    deger: g.yuklenmeUyari ? 'uyarı' : 'ok',
    durum: g.yuklenmeUyari ? 'dikkat' : 'iyi',
    alt: g.yuklenmeUyari ? 'yüklenme uyarısı' : undefined,
  })

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
