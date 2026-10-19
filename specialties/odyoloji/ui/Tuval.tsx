'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'
import { VadeListesi } from '@/components/klinik/VadeListesi'

export function OdyoTuval({ tanim, sonuc, bugun, girdi = {}, yaz }: { tanim: AracTanim; sonuc: AracCikti; bugun: string; girdi?: Record<string, string>; yaz?: (id: string, deger: string) => void }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  const alan = yaz ? <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} /> : null
  if (r.endsWith('odyo-ani')) {
    return (
      <section data-tuval="odyoloji" style={{ background: sonuc.acil ? '#0c4a6e' : '#f0f9ff', color: sonuc.acil ? '#fff' : '#0c4a6e', borderRadius: 14, padding: 16 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>ANİ İŞİTME</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('odyo-esik') || r.endsWith('odyo-oda')) {
    const baslik = r.endsWith('odyo-esik') ? 'EŞİK KAYDI' : 'SESSİZ ODA'
    return (
      <section data-tuval="odyoloji" style={{ background: '#f0f9ff', borderLeft: '4px solid #0369a1', borderRadius: 8, padding: 14 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>{baslik}</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12 }}>Bu kayıt tanı değildir. dB Sağlığım'a gitmez. KBB değil.</p>
      </section>
    )
  }
  return (
    <section data-tuval="odyoloji" style={{ background: '#f0f9ff', borderRadius: 14, padding: 14 }}>
      {alan}
      <p style={{ margin: '8px 0' }}>{sonuc.ozet}</p>
      <VadeListesi baslik="CİHAZ İZLEMİ" renk="#0369a1" zemin="#e0f2fe" gunler={gunler} />
    </section>
  )
}
