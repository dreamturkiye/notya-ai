'use client'

import React, { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import {
  RAPOR_ARALIKLARI,
  sureYazi,
  type Adet,
  type GunOlcu,
  type RaporAralik,
  type TaniSatiri,
} from '@/lib/doktor/raporHesap'

export const dynamic = 'force-dynamic'

interface Hacim {
  yeniBuAy: number
  yeniGecenAy: number
  yeniSon3Ay: number
  yeniOnceki3Ay: number
  aktifHasta: number
  muayeneBuHafta: number
  muayeneGecenHafta: number
  muayeneBuAy: number
  muayeneGecenAy: number
  muayeneToplam: number
}

interface Rapor {
  aralikEtiket: string
  hacim: Hacim
  gunler: GunOlcu[]
  okuma: string
  tipler: Adet[]
  yakinmalar: Adet[]
  tanilar: TaniSatiri[]
  notTurleri: Adet[]
  onaylanan: number
  bekleyen: number
  tartiliOrtalamaDk: number | null
  ilaclar: Adet[]
  branslar: Adet[] | null
}

const bosHacim: Hacim = {
  yeniBuAy: 0, yeniGecenAy: 0, yeniSon3Ay: 0, yeniOnceki3Ay: 0, aktifHasta: 0,
  muayeneBuHafta: 0, muayeneGecenHafta: 0, muayeneBuAy: 0, muayeneGecenAy: 0, muayeneToplam: 0,
}

export default function RaporlarSayfasi() {
  const [aralik, setAralik] = useState<RaporAralik>('ay')
  const [dar, setDar] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [pdf, setPdf] = useState(false)
  const [hata, setHata] = useState('')
  const [veri, setVeri] = useState<Rapor | null>(null)

  useEffect(() => {
    const olc = () => setDar(window.innerWidth < 900)
    olc()
    window.addEventListener('resize', olc)
    return () => window.removeEventListener('resize', olc)
  }, [])

  useEffect(() => {
    let iptal = false
    setYukleniyor(true)
    setHata('')
    ;(async () => {
      try {
        const token = (await ensureDoctorAccessToken()) || ''
        const res = await fetch(`/api/doktor/raporlar?aralik=${aralik}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('yuklenemedi')
        const json = await res.json()
        if (!iptal) setVeri(json)
      } catch {
        if (!iptal) setHata('Rapor yüklenemedi.')
      } finally {
        if (!iptal) setYukleniyor(false)
      }
    })()
    return () => { iptal = true }
  }, [aralik])

  const indir = async () => {
    setPdf(true)
    try {
      const token = (await ensureDoctorAccessToken()) || ''
      const res = await fetch('/api/doktor/raporlar/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ aralik }),
      })
      if (!res.ok) throw new Error('pdf')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapor-${aralik}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setHata('PDF indirilemedi.')
    } finally {
      setPdf(false)
    }
  }

  const h = veri?.hacim || bosHacim
  const kartlar = [
    { deger: h.yeniBuAy, ad: 'Yeni hasta, bu ay', alt: `geçen ay ${h.yeniGecenAy.toLocaleString('tr-TR')}` },
    { deger: h.yeniSon3Ay, ad: 'Yeni hasta, son 3 ay', alt: `önceki 3 ay ${h.yeniOnceki3Ay.toLocaleString('tr-TR')}` },
    { deger: h.aktifHasta, ad: 'Aktif hasta', alt: 'toplam' },
    { deger: h.muayeneBuHafta, ad: 'Muayene, bu hafta', alt: `geçen hafta ${h.muayeneGecenHafta.toLocaleString('tr-TR')}` },
    { deger: h.muayeneBuAy, ad: 'Muayene, bu ay', alt: `geçen ay ${h.muayeneGecenAy.toLocaleString('tr-TR')}` },
    { deger: h.muayeneToplam, ad: 'Muayene, toplam', alt: 'tüm kayıtlar' },
  ]

  return (
    <div style={{ fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: dar ? 26 : 32, letterSpacing: '-0.02em' }}>Raporlar</div>
        <button type="button" onClick={indir} disabled={pdf || yukleniyor} style={btn(true, pdf || yukleniyor)}>{pdf ? 'Hazırlanıyor…' : 'PDF indir'}</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {RAPOR_ARALIKLARI.map((a) => (
          <button key={a.id} type="button" onClick={() => setAralik(a.id)} style={btn(aralik === a.id, false)}>{a.etiket}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 16 }}>Aralık, alttaki grafik ve listeleri değiştirir. Üstteki sayılar sabittir.</div>
      {hata ? <div style={{ color: CHROME_RENK.warn, marginBottom: 12, fontSize: 14 }}>{hata}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: dar ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        {kartlar.map((k) => (
          <div key={k.ad} style={kart}>
            <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 28, fontWeight: 600, color: CHROME_RENK.pine }}>{yukleniyor ? '…' : k.deger.toLocaleString('tr-TR')}</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>{k.ad}</div>
            <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>{yukleniyor ? '' : k.alt}</div>
          </div>
        ))}
      </div>

      <Bolum baslik={`Gün gün — ${veri?.aralikEtiket || ''}`}>
        <Cubuklar gunler={veri?.gunler || []} alan="sayi" birim="muayene" />
        <div style={{ fontSize: 12, color: CHROME_RENK.muted, margin: '14px 0 6px' }}>Ortalama süre, dakika. Süresi yazılmamış seans girmez.</div>
        <Cubuklar gunler={veri?.gunler || []} alan="ortalamaDk" birim="dk" />
        <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.45 }}>{veri?.okuma || ''}</div>
        <GunTablosu gunler={veri?.gunler || []} />
      </Bolum>

      <Bolum baslik="Muayene tipi">
        <Yatay satirlar={veri?.tipler || []} />
      </Bolum>

      <Bolum baslik="En sık yakınma">
        {(veri?.yakinmalar.length || 0) === 0
          ? <Bos metin="Bu aralıkta yakınma yok." />
          : <Yatay satirlar={veri?.yakinmalar || []} />}
      </Bolum>

      <Bolum baslik="En sık tanı">
        {(veri?.tanilar.length || 0) === 0 ? <Bos metin="Bu aralıkta tanı yok." /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 280 }}>
              <thead>
                <tr style={{ color: CHROME_RENK.muted, textAlign: 'left' }}>
                  <th style={th}>Kod</th>
                  <th style={th}>Ad</th>
                  <th style={{ ...th, textAlign: 'right' }}>Sayı</th>
                </tr>
              </thead>
              <tbody>
                {veri?.tanilar.map((t) => (
                  <tr key={t.kod}>
                    <td style={td}>{t.kod}</td>
                    <td style={td}>{t.ad}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{t.sayi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bolum>

      <Bolum baslik="İşin dökümü">
        <Yatay satirlar={veri?.notTurleri || []} />
        <div style={{ display: 'grid', gridTemplateColumns: dar ? '1fr' : '1fr 1fr', gap: 8, marginTop: 12 }}>
          <Satir ad="Onaylanan not" sayi={veri?.onaylanan ?? 0} />
          <Satir ad="Onay bekleyen" sayi={veri?.bekleyen ?? 0} />
          <Satir ad="Tartılı ortalama süre" sayi={veri?.tartiliOrtalamaDk == null ? '—' : `${veri.tartiliOrtalamaDk} dk`} />
          <Satir ad="En sık ilaç" sayi={veri?.ilaclar?.[0] ? `${veri.ilaclar[0].ad} · ${veri.ilaclar[0].sayi}` : '—'} />
        </div>
        {(veri?.ilaclar.length || 0) > 1 ? (
          <div style={{ marginTop: 10 }}>
            <Yatay satirlar={veri?.ilaclar?.slice(1) || []} />
          </div>
        ) : null}
        <a href="/dashboard/doktor/inceleme" style={{ display: 'inline-block', marginTop: 14, color: CHROME_RENK.pine, fontWeight: 700, fontSize: 14 }}>Onay bekleyen notlar</a>
      </Bolum>

      {veri?.branslar && veri.branslar.length > 0 ? (
        <Bolum baslik="Bu aralıkta branş">
          <Yatay satirlar={veri.branslar} />
        </Bolum>
      ) : null}
    </div>
  )
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section style={{ ...kart, marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: CHROME_RENK.pine, marginBottom: 12 }}>{baslik}</div>
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
          const n = deger(g)
          const bos = alan === 'ortalamaDk' && g.ortalamaDk == null
          return (
            <div key={g.ad + alan} style={{ flex: '1 0 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginBottom: 4 }}>{bos ? '' : n}</div>
              <div style={{ width: '70%', maxWidth: 22, height: bos ? 0 : Math.max(4, (n / max) * 112), background: alan === 'sayi' ? CHROME_RENK.pine : CHROME_RENK.ink, borderRadius: 4 }} />
              <div style={{ fontSize: 11, marginTop: 6, color: CHROME_RENK.muted }}>{g.etiket}</div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11, color: CHROME_RENK.muted }}>{birim}</div>
    </div>
  )
}

function GunTablosu({ gunler }: { gunler: GunOlcu[] }) {
  if (!gunler.length) return null
  return (
    <div style={{ overflowX: 'auto', marginTop: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 320 }}>
        <thead>
          <tr style={{ color: CHROME_RENK.muted, textAlign: 'left' }}>
            <th style={th}>Gün</th>
            <th style={{ ...th, textAlign: 'right' }}>Muayene</th>
            <th style={{ ...th, textAlign: 'right' }}>Ortalama</th>
            <th style={{ ...th, textAlign: 'right' }}>Koltuk</th>
          </tr>
        </thead>
        <tbody>
          {gunler.map((g) => (
            <tr key={g.ad}>
              <td style={td}>{g.ad}</td>
              <td style={{ ...td, textAlign: 'right' }}>{g.sayi}</td>
              <td style={{ ...td, textAlign: 'right' }}>{g.ortalamaDk == null ? '—' : `${g.ortalamaDk} dk`}</td>
              <td style={{ ...td, textAlign: 'right' }}>{g.koltukDk == null ? '—' : sureYazi(g.koltukDk)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Yatay({ satirlar }: { satirlar: Adet[] }) {
  const max = Math.max(...satirlar.map((s) => s.sayi), 1)
  if (!satirlar.length) return <Bos metin="Bu aralıkta kayıt yok." />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {satirlar.map((s) => (
        <div key={s.ad}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, marginBottom: 4 }}>
            <span>{s.ad}</span>
            <span>{s.sayi.toLocaleString('tr-TR')}</span>
          </div>
          <div style={{ height: 8, background: '#efe9dc', borderRadius: 99 }}>
            <div style={{ width: `${Math.max(s.sayi ? 4 : 0, (s.sayi / max) * 100)}%`, height: '100%', background: CHROME_RENK.pine, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Satir({ ad, sayi }: { ad: string; sayi: number | string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, padding: '8px 0', borderBottom: `1px solid ${CHROME_RENK.border}` }}>
      <span>{ad}</span>
      <span style={{ fontWeight: 700 }}>{sayi}</span>
    </div>
  )
}

function Bos({ metin }: { metin: string }) {
  return <div style={{ color: CHROME_RENK.muted, fontSize: 14 }}>{metin}</div>
}

const kart: React.CSSProperties = {
  background: '#fff',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  padding: 16,
}

const th: React.CSSProperties = { fontWeight: 600, fontSize: 12, padding: '6px 8px 8px 0' }
const td: React.CSSProperties = { padding: '8px 8px 8px 0', borderTop: `1px solid ${CHROME_RENK.border}`, verticalAlign: 'top' }

function btn(secili: boolean, kapali: boolean): React.CSSProperties {
  return {
    background: secili ? CHROME_RENK.pine : 'transparent',
    color: secili ? '#faf6ee' : CHROME_RENK.ink,
    border: `1px solid ${secili ? CHROME_RENK.pine : CHROME_RENK.border}`,
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 700,
    cursor: kapali ? 'not-allowed' : 'pointer',
    opacity: kapali ? 0.6 : 1,
    minHeight: 44,
  }
}
