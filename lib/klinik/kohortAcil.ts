import type { KlinikKohortSatir } from '@/lib/klinik/klinikKayit'

export type PlanAcilSatiri = {
  patient_id?: string | null
  acil?: string | null
}

/** Sunucudaki acil bandını kohort 112 satırına ekler. Aynı hasta için ikinci 112 yazılmaz. */
export function kohortAcilBirlestir(
  satirlar: KlinikKohortSatir[],
  planlar: PlanAcilSatiri[],
  adlar: ReadonlyMap<string, string>,
): KlinikKohortSatir[] {
  const out = [...satirlar]
  for (const p of planlar) {
    const id = String(p.patient_id || '')
    const acil = String(p.acil || '').trim()
    if (!id || !acil) continue
    if (out.some((s) => s.patientId === id && s.durum === '112')) continue
    out.unshift({ patientId: id, ad: adlar.get(id) || 'Hasta', durum: '112', ozet: acil })
  }
  return out
}
