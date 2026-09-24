'use client'
/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Spor kohort paneli.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { sporStil, Istatistik, TaslakNotu, Rozet } from './SporAracKabugu'
import { SPOR_BAYRAK_AD, sporKohortFiltre, type SporKohortBayrak, type SporKohortSatir } from '../../engines/kohort'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const S = sporStil
const BAYRAKLAR = Object.keys(SPOR_BAYRAK_AD) as SporKohortBayrak[]

export default function SporKohortAraci() {
  const [satirlar, setSatirlar] = useState<SporKohortSatir[] | null>(null)
  const [toplam, setToplam] = useState(0)
  const [suzgec, setSuzgec] = useState<SporKohortBayrak[]>([])
  const [secili, setSecili] = useState<string[]>([])
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const yukle = useCallback(async () => {
    setHata('')
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/spor-hekimligi/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return }
      setSatirlar(j.satirlar || [])
      setToplam(j.toplamHasta || 0)
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const gorunen = sporKohortFiltre(satirlar || [], suzgec)

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true)
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/spor-hekimligi/kohort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: secili }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Gönderilemedi'); return }
      setDurum(`${j.gonderilen} hatırlatma gönderildi${j.atlanan ? `, ${j.atlanan} atlandı` : ''}.`)
      setSecili([])
      await yukle()
    } catch { setHata('Gönderilemedi') }
    finally { setGonderiliyor(false) }
  }

  const toggleBayrak = (b: SporKohortBayrak) => {
    setSuzgec((x) => (x.includes(b) ? x.filter((y) => y !== b) : [...x, b]))
  }
  const toggleHasta = (id: string) => {
    setSecili((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))
  }

  return (
    <>
      <div style={S.kutu}>
        <div style={S.etiket}>Süzgeç</div>
        <div style={S.satir}>
          {BAYRAKLAR.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggleBayrak(b)}
              style={{ ...S.ghost, background: suzgec.includes(b) ? 'rgba(180,83,9,0.25)' : 'transparent', color: suzgec.includes(b) ? '#FCD34D' : CHROME_RENK.muted }}
            >{SPOR_BAYRAK_AD[b]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <Istatistik deger={satirlar == null ? '…' : gorunen.length} etiket="Bayraklı hasta" ton={gorunen.length ? 'uyari' : 'iyi'} />
          <Istatistik deger={satirlar == null ? '…' : gorunen.filter((s) => s.bayraklar.includes('risk_acik')).length} etiket="Açık kırmızı bayrak" ton={gorunen.some((s) => s.bayraklar.includes('risk_acik')) ? 'kirmizi' : 'notr'} />
          <Istatistik deger={satirlar == null ? '…' : toplam} etiket="Kohortta hasta" />
        </div>
        {hata && <div style={{ ...S.hata, marginTop: 8 }}>{hata}</div>}
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Hastalar</div>
        {satirlar == null && <div style={S.kucuk}>Yükleniyor…</div>}
        {satirlar && !gorunen.length && <div style={S.kucuk}>Bayraklı hasta yok.</div>}
        {gorunen.map((s) => (
          <label key={s.patientId} style={{ ...S.metin, display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              type="checkbox"
              checked={secili.includes(s.patientId)}
              onChange={() => toggleHasta(s.patientId)}
            />
            <span style={{ flex: 1 }}>{s.ad}</span>
            <span style={S.kucuk}>{s.bayraklar.map((b) => SPOR_BAYRAK_AD[b]).join(' · ')}</span>
            {s.bayraklar.includes('risk_acik') && <Rozet ton="kirmizi">risk</Rozet>}
            {s.bayraklar.includes('yuklenme_uyari') && <Rozet ton="uyari">yük</Rozet>}
          </label>
        ))}
        <button type="button" style={{ ...S.btn, marginTop: 12 }} disabled={!secili.length || gonderiliyor} onClick={gonder}>
          {gonderiliyor ? 'Gönderiliyor…' : `Seçilenlere hatırlat (${secili.length})`}
        </button>
        {durum && <div style={{ ...S.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        <TaslakNotu>Hatırlatma tanı, doz, doping ve skor taşımaz. Takım kadrosu HIS kapsam dışıdır.</TaslakNotu>
      </div>
    </>
  )
}
