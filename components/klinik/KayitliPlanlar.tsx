'use client'
import { ozelAracBul, ozelAracCalistir } from '@/lib/klinik/ozelAracCalistir'
import { OZEL_TUVAL } from '@/lib/klinik/ozelTuvalKaydi'

export type KayitliPlan = {
  arac?: string
  ozet?: string
  acil?: string | null
  girdi?: Record<string, string> | null
}

export function KayitliPlanlar({ planlar, bugun }: { planlar: KayitliPlan[]; bugun: string }) {
  const satirlar = planlar.filter((p) => p.arac)
  if (!satirlar.length) return null
  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
      {satirlar.map((p) => {
        const route = String(p.arac)
        const tanim = ozelAracBul(route)
        const girdi: Record<string, string> = {}
        if (p.girdi && typeof p.girdi === 'object') {
          for (const [k, v] of Object.entries(p.girdi)) girdi[k] = String(v ?? '')
        }
        const sonuc = tanim ? ozelAracCalistir(route, girdi, bugun) : { hata: 'Araç yok.' }
        if (!tanim || 'hata' in sonuc) {
          return <p key={route} style={{ margin: 0, fontSize: 13, color: '#3b2e24' }}>{p.ozet || route}</p>
        }
        const Tuval = OZEL_TUVAL[tanim.slug]
        return (
          <section key={route} style={{ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: 12, padding: 12 }}>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", margin: '0 0 8px', fontSize: 16, color: '#3b2e24' }}>{tanim.baslik}</h2>
            <Tuval tanim={tanim} sonuc={sonuc} bugun={bugun} />
          </section>
        )
      })}
    </div>
  )
}
