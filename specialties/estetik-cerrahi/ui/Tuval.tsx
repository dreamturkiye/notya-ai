'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'

export function CerrahiTuval({ tanim, sonuc, bugun, girdi = {}, yaz }: { tanim: AracTanim; sonuc: AracCikti; bugun: string; girdi?: Record<string, string>; yaz?: (id: string, deger: string) => void }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  const alan = yaz ? <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} /> : null
  if (r.endsWith('cerrahi-emboli')) {
    return (
      <section data-tuval="estetik-cerrahi" style={{ background: sonuc.acil ? '#9f1239' : '#fff1f2', color: sonuc.acil ? '#fff' : '#881337', borderRadius: 14, padding: 16 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>{sonuc.acil ? 'EMBOLİ / KANAMA' : 'BAND'}</div>
        <p style={{ margin: '8px 0 0', fontSize: 16 }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('cerrahi-riza')) {
    return (
      <section data-tuval="estetik-cerrahi" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {alan}
        {['Nüsha 1 · hasta', 'Nüsha 2 · dosya'].map((ad) => (
          <div key={ad} style={{ border: '1px dashed #be185d', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#be185d' }}>{ad}</div>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>{sonuc.ozet}</p>
          </div>
        ))}
      </section>
    )
  }
  if (r.endsWith('cerrahi-onam')) {
    return (
      <section data-tuval="estetik-cerrahi" style={{ background: '#fdf2f8', borderRadius: 14, padding: 14 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9d174d' }}>SOĞUMA</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9d174d' }}>Kesi bu kartta seçilmez.</p>
      </section>
    )
  }
  return (
    <section data-tuval="estetik-cerrahi" style={{ display: 'grid', gap: 8 }}>
      {alan}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9d174d' }}>AMELİYAT SONRASI İZLEM</div>
      {gunler.map((s) => <div key={s.ad} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: '#fdf2f8', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}><span>{s.ad}</span><b>{s.durum}</b></div>)}
    </section>
  )
}
