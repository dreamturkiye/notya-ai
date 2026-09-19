'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { atStil, AtHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './AtAracKabugu'
import { kritikYolSkorla, KRITIK_YOLLAR, KRITIK_MADDELER, type KritikYol, type KritikMadde } from '../../engines/kritikYol'

export default function AtKritikYolAraci() {
  const [yollar, setYollar] = useState<KritikYol[]>([])
  const [maddeler, setMaddeler] = useState<KritikMadde[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => kritikYolSkorla({ yollar, maddeler }), [yollar, maddeler])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/acil-tip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'kritik', yollar, maddeler, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Kritik yol hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={atStil.kutu}>
        <div style={atStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <AtHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...atStil.etiket, marginTop: 12 }}>Yol bayrakları</div>
        {KRITIK_YOLLAR.map((m) => (
          <label key={m.kod} style={{ ...atStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={yollar.includes(m.kod)} onChange={() => setYollar((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <div style={{ ...atStil.etiket, marginTop: 12 }}>Checklist maddeleri</div>
        {KRITIK_MADDELER.map((m) => (
          <label key={m.kod} style={{ ...atStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={maddeler.includes(m.kod)} onChange={() => setMaddeler((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
      </div>
      <div style={atStil.kutu}>
        <div style={atStil.etiket}>Özet (karar desteği)</div>
        <Istatistik deger={yollar.length} etiket="Yol bayrağı" ton="notr" />
        <div style={{ ...atStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...atStil.satir, marginTop: 12 }}>
          <button type="button" style={atStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...atStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...atStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — kritik yol bayrağıdır; STEMI/inme tanısı kilidi ve doz yazılmaz. Kardiyoloji/nöroloji tile değildir.</TaslakNotu>
      </div>
    </>
  )
}
