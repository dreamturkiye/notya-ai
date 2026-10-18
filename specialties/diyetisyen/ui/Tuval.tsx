'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'

export function DiyetTuval({ tanim, sonuc, bugun }: { tanim: AracTanim; sonuc: AracCikti; bugun: string }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  if (r.endsWith('diyet-acil')) {
    return (
      <section data-tuval="diyetisyen" style={{ background: sonuc.acil ? '#14532d' : '#f0fdf4', color: sonuc.acil ? '#fff' : '#14532d', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>BESLENME ACİL</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('diyet-makro')) {
    return (
      <section data-tuval="diyetisyen" style={{ background: '#f0fdf4', borderLeft: '4px solid #15803d', borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>MAKRO · HEKİM TANISI ŞART</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12 }}>kcal Sağlığım etiketine yazılmaz.</p>
      </section>
    )
  }
  if (r.endsWith('diyet-ogun')) {
    return (
      <section data-tuval="diyetisyen" style={{ display: 'grid', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>ÖĞÜN İSKELETİ</div>
        {sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean).map((satir) => <div key={satir} style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{satir}</div>)}
      </section>
    )
  }
  return (
    <section data-tuval="diyetisyen" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {gunler.map((s) => <span key={s.ad} style={{ background: '#dcfce7', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
    </section>
  )
}
