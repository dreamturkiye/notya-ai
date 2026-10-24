'use client'

/**
 * The practice reports (Türkiye: Raporlar) — the doctor's own counts: patients, visits, notes, appointments.
 * Same cards and colours as the home screen; every sentence is the pack's (m.rapor). The numbers come from
 * GET /api/ulke/raporlar, counted for the signed-in doctor only.
 */
import React, { useEffect, useState, type CSSProperties } from 'react'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { rolAdi } from '@/lib/ulke/arayuz'
import { sayiYaz } from '@/lib/ulke/arayuz/sayi'
import type { RaporOzeti } from '@/lib/ulke/uygulama/raporlar'
import { Cerceve, Hata, Yukleniyor, useUygulama, YOL } from './Kabuk'

const KART: CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20, boxShadow: '0 16px 34px rgba(58,44,34,0.06)', padding: 20 }
const ETIKET: CSSProperties = { fontSize: 13, fontWeight: 700, color: '#4A4030', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }
const ALT: CSSProperties = { fontSize: 13, color: R.muted, marginTop: 4 }

export default function Raporlar() {
  const u = useUygulama('raporlar')
  const [rapor, setRapor] = useState<RaporOzeti | null>(null)
  const [hata, setHata] = useState(false)
  const { api, hesap } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    ;(async () => {
      try {
        const r = await api('/api/ulke/raporlar')
        if (iptal) return
        if (r.ok && r.j.rapor && typeof r.j.rapor === 'object') setRapor(r.j.rapor as RaporOzeti)
        else setHata(true)
      } catch { if (!iptal) setHata(true) }
    })()
    return () => { iptal = true }
  }, [hesap, api])

  const t = u.m.rapor
  if (!hesap || !t) return <Yukleniyor m={u.m} dil={u.dil} />
  const n = (x: number) => sayiYaz(x)
  const kutu = (etiket: string, deger: number, alt: string, renk: string = R.pine) => (
    <div style={KART} key={etiket + alt}>
      <p style={ETIKET}>{etiket}</p>
      <div style={{ fontSize: 34, fontWeight: 800, color: renk, lineHeight: 1.1 }}>{n(deger)}</div>
      <div style={ALT}>{alt}</div>
    </div>
  )
  const izgara: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="raporlar" cikis={u.cikis}>
      <div data-alan="raporlar-sayfasi" style={{ fontFamily: CHROME_FONT.sans, maxWidth: 1100, margin: '0 auto' }}>
        <a href={YOL.bugun} style={{ color: R.pine, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>‹ {t.geri}</a>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: R.ink, margin: '8px 0 4px' }}>{t.baslik}</h1>
        <p style={{ ...ALT, marginBottom: 20 }}>{t.alt}</p>
        {hata ? <Hata>{t.hata}</Hata> : !rapor ? <p style={ALT}>{t.yukleniyor}</p> : (
          <>
            <div style={izgara}>
              {kutu(t.hasta, rapor.hastaToplam, t.hastaAlt)}
              {kutu(t.yeniAy, rapor.hastaYeniAy, t.buAy, '#4A5C8A')}
            </div>
            <h2 style={{ ...ETIKET, marginTop: 22 }}>{t.muayene}</h2>
            <div style={izgara}>
              {kutu(t.muayene, rapor.muayeneHafta, t.buHafta)}
              {kutu(t.muayene, rapor.muayeneAy, t.buAy)}
              {kutu(t.muayene, rapor.muayeneToplam, t.toplam, '#4A5C8A')}
            </div>
            <h2 style={{ ...ETIKET, marginTop: 22 }}>{t.notlar}</h2>
            <div style={izgara}>
              {kutu(t.onayli, rapor.notOnayli, t.notlar)}
              {kutu(t.bekleyen, rapor.notBekleyen, t.notlar, '#B4832F')}
            </div>
            <h2 style={{ ...ETIKET, marginTop: 22 }}>{t.randevu}</h2>
            <div style={izgara}>
              {kutu(t.randevu, rapor.randevuAy, t.randevuAlt)}
              {kutu(t.tamamlanan, rapor.randevuTamam, t.randevuAlt, '#4A5C8A')}
              {kutu(t.iptal, rapor.randevuIptal, t.randevuAlt, '#B4832F')}
            </div>
          </>
        )}
      </div>
    </Cerceve>
  )
}
