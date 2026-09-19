/**
 * PSIK-EXCEPTIONAL-01 — Sticky "bugünkü vizit" şeridi (hekim yüzü). SAF fonksiyon; nota yazmaz.
 * Aynı desen: specialties/dahiliye/engines/serit.ts.
 *
 * Çipler: risk bayrağı · son PHQ-9 · son GAD-7 · lityum/valproat düzey vadesi · sonraki kontrol · gecikmiş görev.
 * Şiddet bandı gösterilir ama TANI değildir; plan taslağı hekim onayıyla SOAP'a kopyalanır.
 */
import type { Phq9Bant } from './phq9'
import type { Gad7Bant } from './gad7'
import { PHQ9_BANT_AD } from './phq9'
import { GAD7_BANT_AD } from './gad7'
import { gunFarki } from './psikiyatri'

export type CipDurum = 'iyi' | 'dikkat' | 'kotu' | 'yok'

export interface PsikSeritGirdi {
  bugun: string
  phq9: { toplam: number; bant: Phq9Bant; tarih: string | null; madde9: boolean } | null
  gad7: { toplam: number; bant: Gad7Bant; tarih: string | null } | null
  /** açık risk bayrakları (acil.ts kodları veya psik_risk satırı) */
  riskBayraklari: string[]
  /** hekim risk satırını onayladı mı — onaysız açık bayrak "kötü" çiptir */
  riskHekimOnay: boolean
  /** Li / VPA düzey görevlerinin en yakın vadesi */
  duzeyDue: { ad: string; due: string } | null
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  planlar: Array<{ kaynak: string; madde: string }>
}

export interface PsikSerit {
  chips: Array<{ ad: string; deger: string; durum: CipDurum; alt?: string }>
  overdue: Array<{ ad: string; due: string; gecikmeGun: number }>
  planTaslagi: string[]
  kirmizi: string[]
}

function eskiMi(tarih: string | null, bugun: string, gun: number): boolean {
  if (!tarih) return true
  return gunFarki(tarih, bugun) > gun
}

export function psikSeridi(g: PsikSeritGirdi): PsikSerit {
  const chips: PsikSerit['chips'] = []
  const kirmizi: string[] = []

  // 1) Risk — her zaman ilk çip. Açık bayrak + hekim onayı yok = kırmızı.
  if (g.riskBayraklari.length) {
    chips.push({
      ad: 'Risk',
      deger: String(g.riskBayraklari.length),
      durum: g.riskHekimOnay ? 'dikkat' : 'kotu',
      alt: g.riskHekimOnay ? 'hekim onayı verildi' : 'hekim onayı bekliyor',
    })
    if (!g.riskHekimOnay) kirmizi.push(`Güvenlik bayrağı açık (${g.riskBayraklari.join('; ')}) — hekim onayı olmadan vizit kapatılmaz`)
  } else {
    chips.push({ ad: 'Risk', deger: 'bayrak yok', durum: 'iyi' })
  }

  // 2) PHQ-9
  if (g.phq9) {
    chips.push({
      ad: 'PHQ-9',
      deger: String(g.phq9.toplam),
      durum: g.phq9.bant === 'siddetli' || g.phq9.bant === 'orta_siddetli' ? 'kotu' : g.phq9.bant === 'orta' ? 'dikkat' : 'iyi',
      alt: eskiMi(g.phq9.tarih, g.bugun, 90) ? '>3 ay eski' : PHQ9_BANT_AD[g.phq9.bant],
    })
    if (g.phq9.madde9) kirmizi.push('PHQ-9 9. madde pozitif — güvenlik değerlendirmesi ve kayıt zorunlu')
  } else {
    chips.push({ ad: 'PHQ-9', deger: '—', durum: 'yok', alt: 'bu vizitte doldur' })
  }

  // 3) GAD-7
  if (g.gad7) {
    chips.push({
      ad: 'GAD-7',
      deger: String(g.gad7.toplam),
      durum: g.gad7.bant === 'siddetli' ? 'kotu' : g.gad7.bant === 'orta' ? 'dikkat' : 'iyi',
      alt: eskiMi(g.gad7.tarih, g.bugun, 90) ? '>3 ay eski' : GAD7_BANT_AD[g.gad7.bant],
    })
  } else {
    chips.push({ ad: 'GAD-7', deger: '—', durum: 'yok' })
  }

  // 4) Li / VPA düzey vadesi
  if (g.duzeyDue) {
    const gecikme = gunFarki(g.duzeyDue.due, g.bugun)
    chips.push({
      ad: 'Düzey',
      deger: g.duzeyDue.ad,
      durum: gecikme > 0 ? 'kotu' : gecikme > -14 ? 'dikkat' : 'iyi',
      alt: gecikme > 0 ? `${gecikme} gün gecikti` : g.duzeyDue.due,
    })
    if (gecikme > 30) kirmizi.push(`${g.duzeyDue.ad} ${gecikme} gün gecikti — düzey görülmeden idame kararı verilmez`)
  } else {
    chips.push({ ad: 'Düzey', deger: '—', durum: 'yok', alt: 'izlem gerektiren ilaç yok' })
  }

  // 5) Sonraki kontrol
  chips.push(
    g.sonrakiKontrol
      ? { ad: 'Kontrol', deger: g.sonrakiKontrol, durum: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'dikkat' : 'iyi', alt: gunFarki(g.sonrakiKontrol, g.bugun) > 0 ? 'tarihi geçti' : undefined }
      : { ad: 'Kontrol', deger: '—', durum: 'yok', alt: 'tarih belirle' },
  )

  // 6) Gecikmiş görev sayısı
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
