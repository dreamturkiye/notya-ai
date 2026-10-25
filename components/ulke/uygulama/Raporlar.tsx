'use client'

/**
 * The practice reports (Türkiye: Raporlar) — the SAME page structure as Türkiye's: title and range pills, six fixed
 * volume cards, day-by-day bars, visit types, complaints, diagnoses and the work breakdown. Every sentence is the
 * pack's (m.rapor); the numbers come from GET /api/ulke/raporlar?aralik=…, counted for the signed-in doctor only.
 * Complaints and diagnoses are listed where the country's notes carry them; otherwise the section says so.
 */
import React, { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { rolAdi } from '@/lib/ulke/arayuz'
import { sayiYaz } from '@/lib/ulke/arayuz/sayi'
import type { Adet, GunOlcu, RaporAralik, RaporOzeti } from '@/lib/ulke/uygulama/raporlar'
import { Cerceve, Hata, Yukleniyor, useUygulama } from './Kabuk'

const ARALIKLAR: readonly RaporAralik[] = ['hafta', 'ay', '3ay', 'yil']

export default function Raporlar() {
  const u = useUygulama('raporlar')
  const [aralik, setAralik] = useState<RaporAralik>('ay')
  const [rapor, setRapor] = useState<RaporOzeti | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(false)
  const [dar, setDar] = useState(false)
  const { api, hesap } = u

  useEffect(() => {
    const olc = () => setDar(window.innerWidth < 900)
    olc()
    window.addEventListener('resize', olc)
    return () => window.removeEventListener('resize', olc)
  }, [])

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    setYukleniyor(true); setHata(false)
    ;(async () => {
      try {
        const r = await api(`/api/ulke/raporlar?aralik=${aralik}`)
        if (iptal) return
        if (r.ok && r.j.rapor && typeof r.j.rapor === 'object') setRapor(r.j.rapor as RaporOzeti)
        else setHata(true)
      } catch { if (!iptal) setHata(true) } finally { if (!iptal) setYukleniyor(false) }
    })()
    return () => { iptal = true }
  }, [hesap, api, aralik])

  const t = u.m.rapor
  if (!hesap || !t) return <Yukleniyor m={u.m} dil={u.dil} />
  const a = t.ayrinti
  const n = (x: number) => sayiYaz(x)
  const h = rapor?.hacim
  const aralikAd: Record<RaporAralik, string> = { hafta: a.hafta, ay: a.ay, '3ay': a.ucAy, yil: a.yil }
  const kartlar = h ? [
    { deger: h.yeniBuAy, ad: a.yeniAy, alt: `${a.gecenAy} ${n(h.yeniGecenAy)}` },
    { deger: h.yeniSon3Ay, ad: a.yeni3Ay, alt: `${a.onceki3Ay} ${n(h.yeniOnceki3Ay)}` },
    { deger: h.aktifHasta, ad: a.aktif, alt: a.toplamAlt },
    { deger: h.muayeneBuHafta, ad: a.muayeneHafta, alt: `${a.gecenHafta} ${n(h.muayeneGecenHafta)}` },
    { deger: h.muayeneBuAy, ad: a.muayeneAy, alt: `${a.gecenAy} ${n(h.muayeneGecenAy)}` },
    { deger: h.muayeneToplam, ad: a.muayeneToplam, alt: a.tumKayitlar },
  ] : []
  const v = rapor?.veri

  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="raporlar" cikis={u.cikis}>
      <div data-alan="raporlar-sayfasi" style={{ fontFamily: CHROME_FONT.sans, color: R.ink }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: dar ? 26 : 32, letterSpacing: '-0.02em', margin: 0 }}>{t.baslik}</h1>
          <button type="button" onClick={() => window.print()} disabled={yukleniyor} style={btn(true, yukleniyor)}>{a.yazdir}</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {ARALIKLAR.map((k) => (
            <button key={k} type="button" onClick={() => setAralik(k)} style={btn(aralik === k, false)}>{aralikAd[k]}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: R.muted, marginBottom: 16 }}>{a.aralikNotu}</div>
        {hata ? <Hata>{t.hata}</Hata> : null}

        <div style={{ display: 'grid', gridTemplateColumns: dar ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
          {(kartlar.length ? kartlar : Array.from({ length: 6 }, (_, i) => ({ deger: 0, ad: '', alt: String(i) }))).map((k, i) => (
            <div key={i} style={kart}>
              <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 28, fontWeight: 600, color: R.pine }}>{!h ? '…' : n(k.deger)}</div>
              <div style={{ fontSize: 14, marginTop: 2 }}>{h ? k.ad : ''}</div>
              <div style={{ fontSize: 12, color: R.muted, marginTop: 2 }}>{h ? k.alt : ''}</div>
            </div>
          ))}
        </div>

        <Bolum baslik={`${a.gunGun} — ${aralikAd[aralik]}`}>
          <Cubuklar gunler={v?.gunler ?? []} alan="sayi" birim={a.birimMuayene} />
          <div style={{ fontSize: 12, color: R.muted, margin: '14px 0 6px' }}>{a.ortNotu}</div>
          <Cubuklar gunler={v?.gunler ?? []} alan="ortalamaDk" birim={a.birimDk} />
          <GunTablosu gunler={v?.gunler ?? []} basliklar={[a.gun, a.muayene, a.ortalama]} dk={a.dk} />
        </Bolum>

        <Bolum baslik={a.tip}><Yatay satirlar={v?.tipler ?? []} bos={a.kayitYok} /></Bolum>
        <Bolum baslik={a.yakinma}><Yatay satirlar={[]} bos={a.yakinmaYok} /></Bolum>
        <Bolum baslik={a.tani}><Yatay satirlar={[]} bos={a.taniYok} /></Bolum>

        <Bolum baslik={a.isinDokumu}>
          <Yatay satirlar={v?.notTurleri ?? []} bos={a.kayitYok} />
          <div style={{ display: 'grid', gridTemplateColumns: dar ? '1fr' : '1fr 1fr', gap: 8, marginTop: 12 }}>
            <Satir ad={a.onayliNot} sayi={n(v?.onaylanan ?? 0)} />
            <Satir ad={a.bekleyenNot} sayi={n(v?.bekleyen ?? 0)} />
            <Satir ad={a.ortSure} sayi={v?.tartiliOrtalamaDk == null ? '—' : `${v.tartiliOrtalamaDk} ${a.dk}`} />
          </div>
        </Bolum>
      </div>
    </Cerceve>
  )
}

function Bolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section style={{ ...kart, marginBottom: 14 }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: R.pine, margin: '0 0 12px' }}>{baslik}</h2>
      {children}
    </section>
  )
}

function Cubuklar({ gunler, alan, birim }: { gunler: GunOlcu[]; alan: 'sayi' | 'ortalamaDk'; birim: string }) {
  const deger = (g: GunOlcu) => (alan === 'sayi' ? g.sayi : g.ortalamaDk || 0)
  const max = Math.max(...gunler.map(deger), 1)
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, minWidth: Math.max(gunler.length * 36, 280), height: 168, paddingBottom: 4 }}>
        {gunler.map((g) => {
          const x = deger(g)
          const bos = alan === 'ortalamaDk' && g.ortalamaDk == null
          return (
            <div key={g.ad + alan} style={{ flex: '1 0 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontSize: 11, color: R.muted, marginBottom: 4 }}>{bos ? '' : x}</div>
              <div style={{ width: '70%', maxWidth: 22, height: bos ? 0 : Math.max(4, (x / max) * 112), background: alan === 'sayi' ? R.pine : R.ink, borderRadius: 4 }} />
              <div style={{ fontSize: 11, marginTop: 6, color: R.muted }}>{g.etiket}</div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11, color: R.muted }}>{birim}</div>
    </div>
  )
}

function GunTablosu({ gunler, basliklar, dk }: { gunler: GunOlcu[]; basliklar: [string, string, string]; dk: string }) {
  if (!gunler.length) return null
  return (
    <div style={{ overflowX: 'auto', marginTop: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 280 }}>
        <thead><tr style={{ color: R.muted, textAlign: 'left' }}>
          <th style={th}>{basliklar[0]}</th><th style={{ ...th, textAlign: 'right' }}>{basliklar[1]}</th><th style={{ ...th, textAlign: 'right' }}>{basliklar[2]}</th>
        </tr></thead>
        <tbody>
          {gunler.map((g) => (
            <tr key={g.ad}><td style={td}>{g.ad}</td><td style={{ ...td, textAlign: 'right' }}>{g.sayi}</td><td style={{ ...td, textAlign: 'right' }}>{g.ortalamaDk == null ? '—' : `${g.ortalamaDk} ${dk}`}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Yatay({ satirlar, bos }: { satirlar: Adet[]; bos: string }) {
  const max = Math.max(...satirlar.map((s) => s.sayi), 1)
  if (!satirlar.length) return <div style={{ color: R.muted, fontSize: 14 }}>{bos}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {satirlar.map((s) => (
        <div key={s.ad}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, marginBottom: 4 }}><span>{s.ad}</span><span>{sayiYaz(s.sayi)}</span></div>
          <div style={{ height: 8, background: '#efe9dc', borderRadius: 99 }}>
            <div style={{ width: `${Math.max(s.sayi ? 4 : 0, (s.sayi / max) * 100)}%`, height: '100%', background: R.pine, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Satir({ ad, sayi }: { ad: string; sayi: number | string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, padding: '8px 0', borderBottom: `1px solid ${R.border}` }}><span>{ad}</span><span style={{ fontWeight: 700 }}>{sayi}</span></div>
  )
}

const kart: CSSProperties = { background: '#fff', border: `1px solid ${R.border}`, borderRadius: 16, padding: 16 }
const th: CSSProperties = { fontWeight: 600, fontSize: 12, padding: '6px 8px 8px 0' }
const td: CSSProperties = { padding: '8px 8px 8px 0', borderTop: `1px solid ${R.border}`, verticalAlign: 'top' }
function btn(secili: boolean, kapali: boolean): CSSProperties {
  return { background: secili ? R.pine : 'transparent', color: secili ? '#faf6ee' : R.ink, border: `1px solid ${secili ? R.pine : R.border}`, borderRadius: 999, padding: '10px 14px', fontSize: 14, fontWeight: 700, cursor: kapali ? 'not-allowed' : 'pointer', opacity: kapali ? 0.6 : 1, minHeight: 44 }
}
