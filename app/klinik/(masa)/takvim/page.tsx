'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { dakikaSaat, istanbulAn } from '@/lib/randevu/v2/zaman'

type Satir = { id: string; doktorId: string; doktorAd: string; odaId: string | null; bas: string; son: string; tur: string; durum: string; hasta: string }
type Kart = { sonZiyaretler: { doktorId: string; tarih: string; ozet: string }[]; acikTakipler: { sahip: string; metin: string }[]; paket: { ad: string; kalanSeans: number } | null; gelmediRiski: string }

export default function KlinikTakvim() {
  const [gun, setGun] = useState(() => istanbulAn(Date.now()).gun)
  const [hata, setHata] = useState('')
  const [oturumYok, setOturumYok] = useState(false)
  const [randevular, setRandevular] = useState<Satir[]>([])
  const [akis, setAkis] = useState<{ odada: string[]; siradaki: string | null; geciken: string[] }>({ odada: [], siradaki: null, geciken: [] })
  const [odalar, setOdalar] = useState<{ id: string; ad: string }[]>([])
  const [secili, setSecili] = useState<string | null>(null)
  const [kart, setKart] = useState<Kart | null>(null)
  const [yonetici, setYonetici] = useState(false)
  const [ben, setBen] = useState('')

  async function yukle(g = gun) {
    const token = await ensureDoctorAccessToken()
    if (!token) { setOturumYok(true); return }
    const res = await fetch(`/api/klinik/takvim?gun=${g}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (!res.ok) { setHata(json.error || 'Takvim okunamadı.'); return }
    setRandevular(json.randevular || [])
    setAkis(json.akis || { odada: [], siradaki: null, geciken: [] })
    setOdalar(json.odalar || [])
    setYonetici(Boolean(json.yonetici))
    setBen(json.ben || '')
  }

  useEffect(() => { yukle().catch((e) => setHata(String(e.message || e))) }, [])

  async function hafiza(id: string) {
    setSecili(id)
    const token = await ensureDoctorAccessToken()
    const res = await fetch(`/api/klinik/hafiza?randevuId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (!res.ok) { setHata(json.error || 'Kart okunamadı.'); return }
    setKart(json.kart)
  }

  async function kapat(geldi: boolean) {
    if (!secili) return
    const token = await ensureDoctorAccessToken()
    const res = await fetch('/api/klinik/kapanis', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ randevuId: secili, geldi, paketDus: false, takipNotu: '' }),
    })
    const json = await res.json()
    if (!res.ok) setHata(json.error || 'Kapanış yazılamadı.')
    else hafiza(secili)
  }

  if (oturumYok) return <p>Takvim hekim oturumu ister. <Link href="/giris/doktor">Giriş</Link></p>

  const hekimler = Array.from(new Map(randevular.map((r) => [r.doktorId, r.doktorAd])))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 480 }}>Ortak takvim</h1>
        <input type="date" value={gun} onChange={(e) => { setGun(e.target.value); yukle(e.target.value) }} />
      </div>
      <p style={{ color: CHROME_RENK.muted }}>
        Odada {akis.odada.length} · sıradaki {akis.siradaki ? 'var' : 'yok'} · geciken {akis.geciken.length}
      </p>
      {hata && <p style={{ color: CHROME_RENK.warn }}>{hata}</p>}
      {randevular.length === 0 && <p>Bu günde klinik hekimlerinin randevusu yok.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(hekimler.length, 1)}, minmax(180px, 1fr))`, gap: 12 }}>
        {hekimler.map(([id, ad]) => (
          <section key={id} style={{ background: CHROME_RENK.paper, borderRadius: 16, padding: 12 }}>
            <h2 style={{ fontSize: 16 }}>{ad}</h2>
            {randevular.filter((r) => r.doktorId === id).map((r) => (
              <button key={r.id} onClick={() => { if (yonetici || r.doktorId === ben) hafiza(r.id) }} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 8, borderRadius: 10, border: `1px solid ${secili === r.id ? CHROME_RENK.pine : CHROME_RENK.border}`, background: '#fff' }}>
                <strong>{dakikaSaat(istanbulAn(r.bas).dakika)}–{dakikaSaat(istanbulAn(r.son).dakika)}</strong>
                <div>{r.hasta}</div>
                <div style={{ color: CHROME_RENK.muted }}>{r.tur}{r.odaId ? ` · ${odalar.find((o) => o.id === r.odaId)?.ad || 'oda'}` : ''}</div>
              </button>
            ))}
          </section>
        ))}
      </div>
      {kart && (
        <aside style={{ marginTop: 20, background: CHROME_RENK.paper, borderRadius: 16, padding: 16 }}>
          <h2 style={{ fontFamily: CHROME_FONT.serif }}>Klinik hafızası</h2>
          <p>Gelmedi riski: {kart.gelmediRiski}</p>
          <ul>{kart.sonZiyaretler.map((z, i) => <li key={i}>{z.tarih} · {z.ozet}</li>)}</ul>
          {kart.acikTakipler.map((t, i) => <p key={i}>Takip · {t.sahip}: {t.metin}</p>)}
          {!kart.paket && <p style={{ color: CHROME_RENK.muted }}>Bu kart seans bakiyesi tutmaz. Paket tanımı kurulumdadır.</p>}
          {yonetici && (
            <>
              <button onClick={() => kapat(true)}>Ziyareti geldi olarak kapat</button>
              <button onClick={() => kapat(false)} style={{ marginLeft: 8 }}>Gelmedi olarak kapat</button>
            </>
          )}
          <p style={{ color: CHROME_RENK.muted }}>Kapanış hekimin notuna yazılmaz.</p>
        </aside>
      )}
    </div>
  )
}
