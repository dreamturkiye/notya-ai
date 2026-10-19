'use client'
import { portalSatirlari, type AracCikti, type AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'
import { VadeListesi } from '@/components/klinik/VadeListesi'

export function MedikalTuval({ tanim, sonuc, bugun, girdi = {}, yaz }: { tanim: AracTanim; sonuc: AracCikti; bugun: string; girdi?: Record<string, string>; yaz?: (id: string, deger: string) => void }) {
  const gunler = portalSatirlari(sonuc.vadeler, bugun)
  const r = tanim.route
  const alan = yaz ? <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} /> : null
  if (r.endsWith('estetik-vaskuler')) {
    return (
      <section data-tuval="medikal-estetik" style={{ background: sonuc.acil ? '#7f1d1d' : '#fef2f2', color: sonuc.acil ? '#fff' : '#7f1d1d', borderRadius: 14, padding: 16 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>GÖRME · LİVEDO · AĞRI · NEFES</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.acil || sonuc.ozet}</p>
      </section>
    )
  }
  if (r.endsWith('estetik-lot')) {
    return (
      <section data-tuval="medikal-estetik" style={{ background: '#fff7ed', borderLeft: '4px solid #c2410c', borderRadius: 8, padding: 14 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c' }}>LOT KAYDI</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9a3412' }}>mL ve ünite bu alana yazılmaz.</p>
      </section>
    )
  }
  if (r.endsWith('estetik-soguma')) {
    return (
      <section data-tuval="medikal-estetik" style={{ background: '#fff7ed', borderRadius: 14, padding: 14 }}>
        {alan}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c' }}>SOĞUMA</div>
        <p style={{ margin: '8px 0 0' }}>{sonuc.ozet}</p>
      </section>
    )
  }
  return (
    <section data-tuval="medikal-estetik" style={{ display: 'grid', gap: 8 }}>
      {alan}
      <VadeListesi baslik="BAKIM TAKVİMİ" renk="#9a3412" zemin="#ffedd5" gunler={gunler} />
    </section>
  )
}
