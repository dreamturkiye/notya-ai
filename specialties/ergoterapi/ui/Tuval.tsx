'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'
import { VadeListesi } from '@/components/klinik/VadeListesi'

export function ErgoTuval({ tanim, sonuc, bugun, girdi = {}, yaz }: { tanim: AracTanim; sonuc: AracCikti; bugun: string; girdi?: Record<string, string>; yaz?: (id: string, deger: string) => void }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  const alan = yaz ? <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} /> : null
  if (r.endsWith('ergo-dusme')) {
    return (
      <section data-tuval="ergoterapi" style={{ background: sonuc.acil ? '#713f12' : '#fefce8', color: sonuc.acil ? '#fff' : '#713f12', borderRadius: 14, padding: 16 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>DÜŞME</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('ergo-blok')) {
    const blok = ['Sabah', 'Öğlen', 'Akşam']
    const parca = sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean)
    return (
      <section data-tuval="ergoterapi" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {alan}
        {blok.map((ad, i) => (
          <div key={ad} style={{ background: '#fefce8', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a16207' }}>{ad}</div>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>{parca[i] || sonuc.ozet}</p>
          </div>
        ))}
      </section>
    )
  }
  if (r.endsWith('ergo-gya')) {
    return (
      <section data-tuval="ergoterapi" style={{ background: '#fefce8', borderRadius: 14, padding: 14 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a16207' }}>GYA</div>
        {sonuc.ozet.split(/(?<=\.)\s+/).filter(Boolean).map((satir) => <p key={satir} style={{ margin: '6px 0 0', fontSize: 13 }}>{satir}</p>)}
        <p style={{ margin: '8px 0 0', fontSize: 12 }}>Neyzi bu tuvalde yok.</p>
      </section>
    )
  }
  return (
    <section data-tuval="ergoterapi" style={{ display: 'grid', gap: 8 }}>
      {alan}
      <VadeListesi baslik="GYA İZLEMİ" renk="#a16207" zemin="#fef9c3" gunler={gunler} />
    </section>
  )
}
