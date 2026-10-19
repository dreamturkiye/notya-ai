'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'

export function DermTuval({ tanim, sonuc, bugun, girdi = {}, yaz }: { tanim: AracTanim; sonuc: AracCikti; bugun: string; girdi?: Record<string, string>; yaz?: (id: string, deger: string) => void }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  const alan = yaz ? <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} /> : null
  if (r.endsWith('derm-acil')) {
    return (
      <section data-tuval="klinik-dermatoloji" style={{ background: sonuc.acil ? '#134e4a' : '#f0fdfa', color: sonuc.acil ? '#fff' : '#134e4a', borderRadius: 14, padding: 16 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>LAZER ACİL</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  const baslik = r.endsWith('derm-gunes') ? 'GÜNEŞ 1 / 4 / 8' : r.endsWith('derm-takvim') ? 'AKNE 2 / 6 / 12' : 'LAZER 14–90'
  return (
    <section data-tuval="klinik-dermatoloji" style={{ background: '#f0fdfa', borderRadius: 14, padding: 14 }}>
      {alan}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e' }}>{baslik}</div>
      <p style={{ margin: '8px 0' }}>{sonuc.ozet}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {gunler.map((s) => <span key={s.ad} style={{ background: '#ccfbf1', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#0f766e' }}>PASI ve GÖP bu tuvalde yok.</p>
    </section>
  )
}
