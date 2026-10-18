'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'

export function PsikTuval({ tanim, sonuc, bugun }: { tanim: AracTanim; sonuc: AracCikti; bugun: string }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  if (r.endsWith('psikolog-kriz')) {
    return (
      <section data-tuval="klinik-psikolog" style={{ background: sonuc.acil ? '#1e1b4b' : '#eef2ff', color: sonuc.acil ? '#fff' : '#312e81', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>KRİZ</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('psikolog-siklik')) {
    const secenek = ['haftalık', 'iki haftada bir', 'aylık']
    return (
      <section data-tuval="klinik-psikolog" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {secenek.map((s) => (
          <span key={s} style={{ padding: '8px 12px', borderRadius: 999, fontSize: 13, background: sonuc.ozet.includes(s) ? '#312e81' : '#eef2ff', color: sonuc.ozet.includes(s) ? '#fff' : '#312e81' }}>{s}</span>
        ))}
      </section>
    )
  }
  if (r.endsWith('psikolog-seans')) {
    return (
      <section data-tuval="klinik-psikolog" style={{ background: '#eef2ff', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3730a3' }}>SEANS ÇERÇEVESİ</div>
        {sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean).map((satir) => <p key={satir} style={{ margin: '6px 0 0', fontSize: 13 }}>{satir}</p>)}
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#3730a3' }}>DSM ve ölçek yorumu yok.</p>
      </section>
    )
  }
  return (
    <section data-tuval="klinik-psikolog" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {gunler.map((s) => <span key={s.ad} style={{ background: '#e0e7ff', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
    </section>
  )
}
