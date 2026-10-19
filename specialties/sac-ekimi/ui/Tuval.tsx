'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'

export function SacTuval({ tanim, sonuc, bugun, girdi = {}, yaz }: { tanim: AracTanim; sonuc: AracCikti; bugun: string; girdi?: Record<string, string>; yaz?: (id: string, deger: string) => void }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  const alan = yaz ? <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} /> : null
  if (r.endsWith('sac-greft')) {
    return (
      <section data-tuval="sac-ekimi" style={{ background: '#eef3ff', borderRadius: 14, padding: 16 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#1e3a8a' }}>DONÖR BANDI</div>
        <p style={{ margin: '8px 0 0', fontSize: 18, color: '#1e3a8a' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>Greft sayısı ve Norwood bu kartta kalır. Sağlığım yalnız gün görür.</p>
      </section>
    )
  }
  if (r.endsWith('sac-cizgi')) {
    const parca = sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean)
    const bolge = ['Ön', 'Temporal', 'Verteks']
    return (
      <section data-tuval="sac-ekimi" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {alan}
        {bolge.map((ad, i) => (
          <div key={ad} style={{ background: '#f8fafc', borderTop: '3px solid #1d4ed8', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>{ad}</div>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>{parca[i] || sonuc.ozet}</p>
          </div>
        ))}
      </section>
    )
  }
  if (r.endsWith('sac-foto')) {
    return (
      <section data-tuval="sac-ekimi" style={{ background: '#f8fafc', borderRadius: 14, padding: 14 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af' }}>FOTO KVKK</div>
        <p style={{ margin: '6px 0 8px' }}>{sonuc.ozet}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {gunler.map((s) => <span key={s.ad} style={{ border: '1px solid #1e40af', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>{s.ad}</span>)}
        </div>
      </section>
    )
  }
  return (
    <section data-tuval="sac-ekimi" style={{ display: 'grid', gap: 8 }}>
      {alan}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>YIKAMA VE SONUÇ İZLEMİ</div>
      {gunler.map((s) => <div key={s.ad} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}><span>{s.ad}</span><b>{s.durum}</b></div>)}
    </section>
  )
}
