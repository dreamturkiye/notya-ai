'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'

export function MedikalTuval({ tanim, sonuc, bugun }: { tanim: AracTanim; sonuc: AracCikti; bugun: string }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  if (r.endsWith('estetik-vaskuler')) {
    return (
      <section data-tuval="medikal-estetik" style={{ background: sonuc.acil ? '#7f1d1d' : '#fef2f2', color: sonuc.acil ? '#fff' : '#7f1d1d', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>GÖRME · LİVEDO · AĞRI · NEFES</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('estetik-lot')) {
    return (
      <section data-tuval="medikal-estetik" style={{ background: '#fff7ed', borderLeft: '4px solid #c2410c', borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c' }}>LOT KAYDI</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9a3412' }}>mL ve ünite bu alana yazılmaz.</p>
      </section>
    )
  }
  if (r.endsWith('estetik-soguma')) {
    return (
      <section data-tuval="medikal-estetik" style={{ background: '#fff7ed', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c' }}>SOĞUMA</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
      </section>
    )
  }
  return (
    <section data-tuval="medikal-estetik" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {gunler.map((s) => <span key={s.ad} style={{ background: '#ffedd5', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
    </section>
  )
}
