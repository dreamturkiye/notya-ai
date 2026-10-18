'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'

export function LongTuval({ tanim, sonuc, bugun }: { tanim: AracTanim; sonuc: AracCikti; bugun: string }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  if (r.endsWith('long-reaksiyon')) {
    return (
      <section data-tuval="longevity" style={{ background: sonuc.acil ? '#3f6212' : '#f7fee7', color: sonuc.acil ? '#fff' : '#3f6212', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>IV REAKSİYON</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('long-guvenlik')) {
    return (
      <section data-tuval="longevity" style={{ display: 'grid', gap: 6 }}>
        {sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean).map((satir) => (
          <div key={satir} style={{ background: '#f7fee7', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{satir}</div>
        ))}
      </section>
    )
  }
  if (r.endsWith('long-sinif')) {
    return (
      <section data-tuval="longevity" style={{ background: '#f7fee7', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3f6212' }}>SINIF LİSTESİ</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12 }}>Karışım ve mL yazılmaz.</p>
      </section>
    )
  }
  return (
    <section data-tuval="longevity" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {gunler.map((s) => <span key={s.ad} style={{ background: '#ecfccb', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
    </section>
  )
}
