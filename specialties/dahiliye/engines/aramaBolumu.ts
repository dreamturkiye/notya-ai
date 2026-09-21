import type { KohortSatir } from './kohort'
import { kohortSatirUyar } from '@/lib/doktor/aramaBolum'
import type { SorguAyik } from '@/lib/doktor/hastaAramaFiltre'

export function dahiliyeAramaUygula(satirlar: KohortSatir[], q: SorguAyik, yakin: Set<string>) {
  const cikti: Array<{ patientId: string; ad: string; ozet: string; hatirlatilabilir: boolean }> = []
  for (const s of satirlar) {
    const u = kohortSatirUyar(s, q, yakin)
    if (!u.ok) continue
    cikti.push({ patientId: s.patientId, ad: s.ad, ozet: s.bayraklar.join(' · '), hatirlatilabilir: u.hatirlatilabilir })
  }
  return cikti
}
