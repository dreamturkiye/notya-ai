/**
 * KBB-EXCEPTIONAL-01 — Sticky "bugünkü vizit" şeridi (hekim yüzü). SAF fonksiyon; nota yazmaz.
 * Aynı desen: specialties/psikiyatri/engines/serit.ts ve dahiliye şeridi.
 *
 * Çipler: kırmızı bayrak · son odyometri (PTA + bant) · sonraki kontrol · OSAS sevk · gecikmiş görev.
 * Bant gösterilir ama TANI değildir; plan taslağı hekim onayıyla SOAP'a kopyalanır.
 */
import type { OdyoBant } from './odyometri'
import { ODYO_BANT_AD } from './odyometri'
import { gunFarki, type Yan } from './kbb'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface KbbSeritGirdi {
  bugun: string
  /** en son odyometri kaydı (varsa) */
  odyometri: { pta: number | null; bant: OdyoBant | null; yan: Yan; tarih: string | null } | null
  /** açık kırmızı bayraklar (acil.ts kodları veya kbb_risk satırı) */
  riskBayraklari: string[]
  /** hekim risk satırını onayladı mı — onaysız açık bayrak "kötü" çiptir */
  riskHekimOnay: boolean
  sonrakiKontrol: string | null
  /** hekimin işaretlediği uyku apnesi (OSAS) sevk durumu */
  osasSevk: { durum: 'yok' | 'planlandi' | 'gecikti'; not?: string | null } | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface KbbSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

/** Odyometri "eski" sayılma penceresi (gün) — hekim yeni ölçüm isteyebilir. */
export const ODYO_TAZELIK_GUN = 365

function eskiMi(tarih: string | null, bugun: string, gun: number): boolean {
  if (!tarih) return true
  return gunFarki(tarih, bugun) > gun
}

export function kbbSeridi(g: KbbSeritGirdi): KbbSerit {
  const chips: KbbSerit['chips'] = []
  const kirmizi: string[] = []

  // 1) Kırmızı bayrak — her zaman ilk çip. Açık bayrak + hekim onayı yok = kırmızı.
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

  // 2) Son odyometri
  if (g.odyometri && g.odyometri.pta != null) {
    const eski = eskiMi(g.odyometri.tarih, g.bugun, ODYO_TAZELIK_GUN)
    const agir = g.odyometri.bant === 'ileri' || g.odyometri.bant === 'cok_ileri'
    const orta = g.odyometri.bant === 'orta' || g.odyometri.bant === 'orta_ileri'
    chips.push({
      ad: 'Odyometri',
      deger: `${g.odyometri.pta} dB`,
      durum: agir ? 'kotu' : orta ? 'dikkat' : 'iyi',
      alt: eski ? '>1 yıl eski' : (g.odyometri.bant ? ODYO_BANT_AD[g.odyometri.bant] : undefined),
    })
    if (agir) kirmizi.push('Odyometri ileri/çok ileri bantta — cihaz ve rehabilitasyon planı hekim kararı')
  } else {
    chips.push({ ad: 'Odyometri', deger: '—', durum: 'yok', alt: 'bu vizitte ölç' })
  }

  // 3) Sonraki kontrol
  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  // 4) OSAS sevk
  if (g.osasSevk && g.osasSevk.durum !== 'yok') {
    chips.push({
      ad: 'OSAS sevk',
      deger: g.osasSevk.durum === 'gecikti' ? 'gecikti' : 'planlandı',
      durum: g.osasSevk.durum === 'gecikti' ? 'kotu' : 'dikkat',
      alt: g.osasSevk.not || undefined,
    })
    if (g.osasSevk.durum === 'gecikti') kirmizi.push('Uyku tetkiki / OSAS sevki gecikti — horlama + tanıklı apne izlemi hekim kararı')
  } else {
    chips.push({ ad: 'OSAS sevk', deger: '—', durum: 'yok', alt: 'gerekmiyor / işaretlenmedi' })
  }

  // 5) Gecikmiş görev sayısı
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
