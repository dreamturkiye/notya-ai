'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { enfStil, Istatistik, TaslakNotu, Rozet } from './EnfAracKabugu'
import { ENF_BAYRAK_AD, enfKohortFiltre, type EnfKohortBayrak, type EnfKohortSatir } from '../../engines/kohort'

const S = enfStil
const BAYRAKLAR = Object.keys(ENF_BAYRAK_AD) as EnfKohortBayrak[]

export default function EnfKohortAraci() {
  const [satirlar, setSatirlar] = useState<EnfKohortSatir[] | null>(null)
  const [toplam, setToplam] = useState(0)
  const [suzgec, setSuzgec] = useState<EnfKohortBayrak[]>([])
  const [secili, setSecili] = useState<string[]>([])
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const yukle = useCallback(async () => {
    setHata('')
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/enfeksiyon-hastaliklari/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return }
      setSatirlar(j.satirlar || [])
      setToplam(j.toplamHasta || 0)
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const gorunen = enfKohortFiltre(satirlar || [], suzgec)

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true)
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/enfeksiyon-hastaliklari/kohort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: secili }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Gönderilemedi'); return }
      setDurum(`${j.gonderilen || 0} hatırlatma gönderildi${j.atlanan ? ` · ${j.atlanan} atlandı` : ''}.`)
      setSecili([])
      await yukle()
    } catch { setHata('Gönderilemedi') }
    finally { setGonderiliyor(false) }
  }

  const toggleBayrak = (b: EnfKohortBayrak) => {
    setSuzgec((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b])
  }

  return (
    <>
      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <Istatistik deger={toplam} etiket="İzlenen hasta" ton="notr" />
          <Istatistik deger={gorunen.length} etiket="Bayraklı hasta" ton={gorunen.length ? 'uyari' : 'iyi'} />
        </div>
        <div style={S.etiket}>Filtre</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BAYRAKLAR.map((b) => (
            <button key={b} type="button" onClick={() => toggleBayrak(b)}
              style={{ ...S.ghost, background: suzgec.includes(b) ? 'rgba(13,148,136,0.25)' : 'transparent' }}>
              {ENF_BAYRAK_AD[b]}
            </button>
          ))}
        </div>
      </div>
      <div style={S.kutu}>
        {satirlar === null && <div style={S.kucuk}>Yükleniyor…</div>}
        {hata && <div style={{ ...S.kucuk, color: '#F87171' }}>{hata}</div>}
        {gorunen.map((s) => (
          <label key={s.patientId} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <input type="checkbox" checked={secili.includes(s.patientId)}
              onChange={() => setSecili((p) => p.includes(s.patientId) ? p.filter((x) => x !== s.patientId) : [...p, s.patientId])} />
            <div>
              <div style={S.metin}>{s.ad}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {s.bayraklar.map((b) => <Rozet key={b}>{ENF_BAYRAK_AD[b]}</Rozet>)}
              </div>
            </div>
          </label>
        ))}
        {satirlar && !gorunen.length && <div style={S.kucuk}>Bayraklı hasta yok.</div>}
        <div style={{ ...S.satir, marginTop: 12 }}>
          <button type="button" style={S.btn} disabled={!secili.length || gonderiliyor} onClick={gonder}>
            {gonderiliyor ? 'Gönderiliyor…' : `Seçilenlere hatırlatma (${secili.length})`}
          </button>
          <button type="button" style={S.ghost} onClick={yukle}>Yenile</button>
        </div>
        {durum && <div style={{ ...S.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        <TaslakNotu>TASLAK — hatırlatma tanı, skor, ilaç adı ve doz taşımaz. Acil bayrakta 112 yolu metinde yer alır.</TaslakNotu>
      </div>
    </>
  )
}
