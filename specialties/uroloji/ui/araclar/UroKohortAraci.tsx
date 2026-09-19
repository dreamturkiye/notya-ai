'use client'
/**
 * UROLOJI-EXCEPTIONAL-01 — Araçlar › Üroloji kohort paneli.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { uroStil, Istatistik, TaslakNotu, Rozet } from './UroAracKabugu'
import { URO_BAYRAK_AD, uroKohortFiltre, type UroKohortBayrak, type UroKohortSatir } from '../../engines/kohort'

const S = uroStil
const BAYRAKLAR = Object.keys(URO_BAYRAK_AD) as UroKohortBayrak[]

export default function UroKohortAraci() {
  const [satirlar, setSatirlar] = useState<UroKohortSatir[] | null>(null)
  const [toplam, setToplam] = useState(0)
  const [suzgec, setSuzgec] = useState<UroKohortBayrak[]>([])
  const [secili, setSecili] = useState<string[]>([])
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  const yukle = useCallback(async () => {
    setHata('')
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/uroloji/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return }
      setSatirlar(j.satirlar || [])
      setToplam(j.toplamHasta || 0)
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]) }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const gorunen = uroKohortFiltre(satirlar || [], suzgec)

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true)
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/uroloji/kohort', {
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

  return (
    <>
      <div style={S.kutu}>
        <div style={S.etiket}>Süzgeç</div>
        <div style={S.satir}>
          {BAYRAKLAR.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSuzgec((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}
              style={{ ...S.ghost, background: suzgec.includes(b) ? 'rgba(13,148,136,0.25)' : 'transparent', color: suzgec.includes(b) ? '#99F6E4' : '#C9D4E3' }}
            >{URO_BAYRAK_AD[b]}</button>
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
              onChange={() => setSecili((p) => (p.includes(s.patientId) ? p.filter((x) => x !== s.patientId) : [...p, s.patientId]))}
            />
            <span style={{ flex: 1 }}>{s.ad}</span>
            <span style={S.kucuk}>{s.bayraklar.map((b) => URO_BAYRAK_AD[b]).join(' · ')}</span>
            {s.bayraklar.includes('risk_acik') && <Rozet ton="kirmizi">risk</Rozet>}
          </label>
        ))}
        <button type="button" style={{ ...S.btn, marginTop: 12 }} disabled={!secili.length || gonderiliyor} onClick={gonder}>
          {gonderiliyor ? 'Gönderiliyor…' : `Seçilenlere hatırlat (${secili.length})`}
        </button>
        {durum && <div style={{ ...S.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        <TaslakNotu>Hatırlatma metni tanı, PSA sayı, IPSS skor ve ilaç adı yazılmaz. Açık bayrakta &quot;sizi arayacağız&quot; dili kullanılır.</TaslakNotu>
      </div>
    </>
  )
}
