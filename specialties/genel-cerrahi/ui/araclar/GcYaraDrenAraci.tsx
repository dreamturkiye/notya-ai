'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gcStil, GcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GcAracKabugu'
import { yaraSkorla, YARA_TIP_AD } from '../../engines/yaraDren'

export default function GcYaraDrenAraci() {
  const [tip, setTip] = useState('yara')
  const [bolge, setBolge] = useState('')
  const [tarih, setTarih] = useState('')
  const [sonraki, setSonraki] = useState('')
  const [ml, setMl] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => yaraSkorla({
    tip, bolge: bolge || null, tarih: tarih || null, sonrakiKontrol: sonraki || null,
    drenCikisMl: ml === '' ? null : Number(ml),
  }), [tip, bolge, tarih, sonraki, ml])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/genel-cerrahi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'yara', yara: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Yara/dren izlem kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Hasta</div>
        <GcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={gcStil.kucuk}>Tip
            <select value={tip} onChange={(e) => setTip(e.target.value)} style={{ ...gcStil.input, display: 'block' }}>
              {Object.entries(YARA_TIP_AD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label style={gcStil.kucuk}>Bölge<input value={bolge} onChange={(e) => setBolge(e.target.value)} style={{ ...gcStil.input, display: 'block', width: 140 }} /></label>
          <label style={gcStil.kucuk}>Tarih<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
          <label style={gcStil.kucuk}>Sonraki<input type="date" value={sonraki} onChange={(e) => setSonraki(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
          {tip === 'dren' && <label style={gcStil.kucuk}>Dren mL<input type="number" value={ml} onChange={(e) => setMl(e.target.value)} style={{ ...gcStil.input, display: 'block', width: 90 }} /></label>}
        </div>
      </div>
      <div style={gcStil.kutu}>
        <Istatistik deger={sonuc.kart.tip ? YARA_TIP_AD[sonuc.kart.tip] : '—'} etiket="İzlem tipi" />
        <div style={{ ...gcStil.metin, marginTop: 10 }}>{sonuc.ozet}</div>
        <div style={{ ...gcStil.satir, marginTop: 12 }}>
          <button type="button" style={gcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — enfeksiyon tanısı ve antibiyotik dozu yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
