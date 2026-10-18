'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'

export function CerrahiTuval({ tanim, sonuc, bugun }: { tanim: AracTanim; sonuc: AracCikti; bugun: string }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  if (r.endsWith('cerrahi-emboli')) {
    return (
      <section data-tuval="estetik-cerrahi" style={{ background: sonuc.acil ? '#9f1239' : '#fff1f2', color: sonuc.acil ? '#fff' : '#881337', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>{sonuc.acil ? 'EMBOLİ / KANAMA' : 'BAND'}</div>
        <p style={{ margin: '8px 0 0', fontSize: 16 }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('cerrahi-riza')) {
    return (
      <section data-tuval="estetik-cerrahi" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9d174d' }}>SOĞUMA</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9d174d' }}>Kesi bu kartta seçilmez.</p>
      </section>
    )
  }
  return (
    <section data-tuval="estetik-cerrahi" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {gunler.map((s) => <span key={s.ad} style={{ background: '#fce7f3', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
    </section>
  )
}
