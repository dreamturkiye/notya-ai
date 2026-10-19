'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'

export function FizyoTuval({ tanim, sonuc, bugun, girdi = {}, yaz }: { tanim: AracTanim; sonuc: AracCikti; bugun: string; girdi?: Record<string, string>; yaz?: (id: string, deger: string) => void }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  const alan = yaz ? <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} /> : null
  if (r.endsWith('fizyo-bayrak')) {
    return (
      <section data-tuval="fizyoterapi" style={{ background: sonuc.acil ? '#7c2d12' : '#fff7ed', color: sonuc.acil ? '#fff' : '#7c2d12', borderRadius: 14, padding: 16 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>KIRMIZI BAYRAK</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('fizyo-icf')) {
    return (
      <section data-tuval="fizyoterapi" style={{ background: '#f0fdf4', borderRadius: 14, padding: 14 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>ICF</div>
        {sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean).map((satir) => <p key={satir} style={{ margin: '6px 0 0', fontSize: 13 }}>{satir}</p>)}
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#166534' }}>Hekim tanısı olmadan ICF yazılmaz. FTR değil.</p>
      </section>
    )
  }
  if (r.endsWith('fizyo-ev')) {
    const satirlar = sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean).slice(0, 4)
    return (
      <section data-tuval="fizyoterapi" style={{ display: 'grid', gap: 6 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>EV PROGRAMI · EN FAZLA 4</div>
        {satirlar.map((satir) => <div key={satir} style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{satir}</div>)}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{gunler.map((s) => <span key={s.ad} style={{ fontSize: 12 }}>{s.ad}</span>)}</div>
      </section>
    )
  }
  return (
    <section data-tuval="fizyoterapi" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {alan}
      {gunler.map((s) => <span key={s.ad} style={{ background: '#dcfce7', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
    </section>
  )
}
