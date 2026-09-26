'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { atStil, Istatistik, TaslakNotu, Rozet } from './AtAracKabugu'
import { AT_BAYRAK_AD, atKohortFiltre, type AtKohortBayrak, type AtKohortSatir } from '../../engines/kohort'

const S = atStil
const BAYRAKLAR = Object.keys(AT_BAYRAK_AD) as AtKohortBayrak[]

export default function AtKohortAraci() {
  const [satirlar, setSatirlar] = useState<AtKohortSatir[] | null>(null)
  const [toplam, setToplam] = useState(0)
  const [suzgec, setSuzgec] = useState<AtKohortBayrak[]>([])
  const [secili, setSecili] = useState<string[]>([])
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const yukle = useCallback(async () => {
    setHata('')
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/acil-tip/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return }
      setSatirlar(j.satirlar || [])
      setToplam(j.toplamHasta || 0)
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const gorunen = atKohortFiltre(satirlar || [], suzgec)

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true)
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/acil-tip/kohort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: secili }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Gönderilemedi'); return }
      setDurum(`${j.gonderilen || 0} hatırlatma · ${j.atlanan || 0} atlandı`)
      setSecili([])
      await yukle()
    } catch { setHata('Gönderilemedi') }
    finally { setGonderiliyor(false) }
  }

  return (
    <>
      <div style={S.kutu}>
        <div style={S.etiket}>Süzgeç</div>
        <div style={S.satir}>
          {BAYRAKLAR.map((b) => (
            <button key={b} type="button" style={{ ...S.ghost, background: suzgec.includes(b) ? 'rgba(249,115,22,0.25)' : 'transparent' }} onClick={() => setSuzgec((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}>
              {AT_BAYRAK_AD[b]}
            </button>
          ))}
        </div>
        <div style={{ ...S.satir, marginTop: 12 }}>
          <Istatistik deger={toplam} etiket="Kohort hasta" ton="notr" />
          <Istatistik deger={gorunen.length} etiket="Görünen" ton="notr" />
        </div>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Satırlar (yatak panosu HIS değil)</div>
        {!satirlar && <div style={S.kucuk}>Yükleniyor…</div>}
        {satirlar && !gorunen.length && <div style={S.kucuk}>Bayraklı hasta yok.</div>}
        {gorunen.map((s) => (
          <label key={s.patientId} style={{ ...S.metin, display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'flex-start' }}>
            <input type="checkbox" checked={secili.includes(s.patientId)} onChange={() => setSecili((p) => (p.includes(s.patientId) ? p.filter((x) => x !== s.patientId) : [...p, s.patientId]))} />
            <span style={{ flex: 1 }}>
              <strong>{s.ad}</strong>
              <div style={S.satir}>{s.bayraklar.map((b) => <Rozet key={b}>{AT_BAYRAK_AD[b]}</Rozet>)}</div>
            </span>
          </label>
        ))}
        <div style={{ ...S.satir, marginTop: 12 }}>
          <button type="button" style={S.btn} disabled={!secili.length || gonderiliyor} onClick={gonder}>
            {gonderiliyor ? 'Gönderiliyor…' : `Seçilenlere hatırlat (${secili.length})`}
          </button>
          <button type="button" style={S.ghost} onClick={yukle}>Yenile</button>
        </div>
        {durum && <div style={{ ...S.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...S.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>Hatırlatma tanı / doz / ESI sayı taşımaz. Acil servis yatak panosu HIS yoktur.</TaslakNotu>
      </div>
    </>
  )
}
