'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { onkoStil, Istatistik, TaslakNotu, Rozet } from './OnkoAracKabugu'
import { ONKO_BAYRAK_AD, onkoKohortFiltre, type OnkoKohortBayrak, type OnkoKohortSatir } from '../../engines/kohort'

const S = onkoStil
const BAYRAKLAR = Object.keys(ONKO_BAYRAK_AD) as OnkoKohortBayrak[]

export default function OnkoKohortAraci() {
  const [satirlar, setSatirlar] = useState<OnkoKohortSatir[] | null>(null)
  const [toplam, setToplam] = useState(0)
  const [suzgec, setSuzgec] = useState<OnkoKohortBayrak[]>([])
  const [secili, setSecili] = useState<string[]>([])
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const yukle = useCallback(async () => {
    setHata('')
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/onkoloji/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return }
      setSatirlar(j.satirlar || [])
      setToplam(j.toplamHasta || 0)
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const gorunen = onkoKohortFiltre(satirlar || [], suzgec)

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true)
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/onkoloji/kohort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: secili }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Gönderilemedi'); return }
      setDurum(`${j.gonderilen || 0} hatırlatma gönderildi, ${j.atlanan || 0} atlandı.`)
      setSecili([])
    } catch { setHata('Gönderilemedi') }
    finally { setGonderiliyor(false) }
  }

  return (
    <>
      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={satirlar == null ? '…' : gorunen.length} etiket="Bayraklı hasta" ton={gorunen.length ? 'uyari' : 'iyi'} />
          <Istatistik deger={satirlar == null ? '…' : gorunen.filter((s) => s.bayraklar.includes('risk_acik')).length} etiket="Açık acil bayrağı" ton={gorunen.some((s) => s.bayraklar.includes('risk_acik')) ? 'kirmizi' : 'notr'} />
          <Istatistik deger={satirlar == null ? '…' : toplam} etiket="Kohortta hasta" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {BAYRAKLAR.map((b) => (
            <button key={b} type="button" onClick={() => setSuzgec((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}
              style={{ ...S.ghost, background: suzgec.includes(b) ? 'rgba(220,38,38,0.25)' : 'transparent' }}>
              {ONKO_BAYRAK_AD[b]}
            </button>
          ))}
        </div>
        {hata && <div style={{ ...S.kucuk, color: '#F87171' }}>{hata}</div>}
        {gorunen.map((s) => (
          <label key={s.patientId} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input type="checkbox" checked={secili.includes(s.patientId)} onChange={() => setSecili((p) => (p.includes(s.patientId) ? p.filter((x) => x !== s.patientId) : [...p, s.patientId]))} />
            <div>
              <div style={S.metin}>{s.ad}</div>
              <div style={S.kucuk}>
                {s.bayraklar.map((b) => <Rozet key={b} ton={b === 'risk_acik' ? 'kirmizi' : 'uyari'}>{ONKO_BAYRAK_AD[b]}</Rozet>)}
                {s.gecikmisSayi ? ` · ${s.gecikmisSayi} gecikmiş görev` : ''}
              </div>
            </div>
          </label>
        ))}
        {!gorunen.length && satirlar && <div style={S.kucuk}>Bayraklı hasta yok.</div>}
        <div style={{ ...S.satir, marginTop: 12 }}>
          <button type="button" style={S.btn} disabled={!secili.length || gonderiliyor} onClick={gonder}>
            {gonderiliyor ? 'Gönderiliyor…' : `Seçilenlere hatırlat (${secili.length})`}
          </button>
        </div>
        {durum && <div style={{ ...S.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        <TaslakNotu>TASLAK — hatırlatma tanı / evre / doz taşımaz. Görüntü zaman çizelgesi bayrağı hekim görevinden gelir.</TaslakNotu>
      </div>
    </>
  )
}
