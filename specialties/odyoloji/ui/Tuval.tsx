'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'

export function OdyoTuval({ tanim, sonuc, bugun }: { tanim: AracTanim; sonuc: AracCikti; bugun: string }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  if (r.endsWith('odyo-ani')) {
    return (
      <section data-tuval="odyoloji" style={{ background: sonuc.acil ? '#0c4a6e' : '#f0f9ff', color: sonuc.acil ? '#fff' : '#0c4a6e', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>ANİ İŞİTME</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('odyo-esik') || r.endsWith('odyo-oda')) {
    const baslik = r.endsWith('odyo-esik') ? 'EŞİK KAYDI' : 'SESSİZ ODA'
    return (
      <section data-tuval="odyoloji" style={{ background: '#f0f9ff', borderLeft: '4px solid #0369a1', borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>{baslik}</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12 }}>Bu kayıt tanı değildir. dB Sağlığım'a gitmez. KBB değil.</p>
      </section>
    )
  }
  return (
    <section data-tuval="odyoloji" style={{ background: '#f0f9ff', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>CİHAZ İZLEMİ</div>
      <p style={{ margin: '8px 0' }}>{sonuc.ozet}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {gunler.map((s) => <span key={s.ad} style={{ background: '#e0f2fe', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>{s.ad} · {s.durum}</span>)}
      </div>
    </section>
  )
}
