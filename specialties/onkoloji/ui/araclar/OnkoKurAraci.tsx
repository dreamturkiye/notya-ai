'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { onkoStil, OnkoHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './OnkoAracKabugu'
import { kurSkorla, sonrakiKurOneri } from '../../engines/kur'

export default function OnkoKurAraci() {
  const [mevcutKur, setMevcutKur] = useState('1')
  const [toplamKur, setToplamKur] = useState('')
  const [protokolEtiket, setProtokolEtiket] = useState('')
  const [sonKurTarihi, setSonKur] = useState('')
  const [sonrakiKurTarihi, setSonrakiKur] = useState('')
  const [aralik, setAralik] = useState('21')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => kurSkorla({
    mevcutKur: mevcutKur === '' ? null : Number(mevcutKur),
    toplamKur: toplamKur === '' ? null : Number(toplamKur),
    protokolEtiket: protokolEtiket || null,
    sonKurTarihi: sonKurTarihi || null,
    sonrakiKurTarihi: sonrakiKurTarihi || null,
  }), [mevcutKur, toplamKur, protokolEtiket, sonKurTarihi, sonrakiKurTarihi])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/onkoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'kur', kur: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Kür sayacı hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={onkoStil.kutu}>
        <div style={onkoStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <OnkoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>Protokol etiketi (doz yok)</div>
        <input value={protokolEtiket} onChange={(e) => setProtokolEtiket(e.target.value)} placeholder="örn. hekim protokol kısa adı" style={onkoStil.input} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={onkoStil.kucuk}>Mevcut kür<input type="number" min={0} value={mevcutKur} onChange={(e) => setMevcutKur(e.target.value)} style={{ ...onkoStil.input, display: 'block', width: 100 }} /></label>
          <label style={onkoStil.kucuk}>Toplam kür<input type="number" min={0} value={toplamKur} onChange={(e) => setToplamKur(e.target.value)} style={{ ...onkoStil.input, display: 'block', width: 100 }} /></label>
          <label style={onkoStil.kucuk}>Son kür<input type="date" value={sonKurTarihi} onChange={(e) => setSonKur(e.target.value)} style={{ ...onkoStil.input, display: 'block' }} /></label>
          <label style={onkoStil.kucuk}>Sonraki kür<input type="date" value={sonrakiKurTarihi} onChange={(e) => setSonrakiKur(e.target.value)} style={{ ...onkoStil.input, display: 'block' }} /></label>
        </div>
        <div style={{ ...onkoStil.satir, marginTop: 8 }}>
          <label style={onkoStil.kucuk}>Öneri aralığı (gün)<input type="number" value={aralik} onChange={(e) => setAralik(e.target.value)} style={{ ...onkoStil.input, display: 'block', width: 80 }} /></label>
          <button type="button" style={onkoStil.ghost} onClick={() => {
            const o = sonrakiKurOneri(sonKurTarihi || null, Number(aralik) || 21)
            if (o) setSonrakiKur(o)
          }}>Sonraki tarihi öner</button>
        </div>
      </div>
      <div style={onkoStil.kutu}>
        <div style={onkoStil.etiket}>Kür özeti (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.kart.mevcutKur ?? '—'} etiket="Mevcut kür" ton="notr" />
          <Istatistik deger={sonuc.kart.toplamKur ?? '—'} etiket="Planlanan" ton="notr" />
        </div>
        <div style={onkoStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...onkoStil.satir, marginTop: 12 }}>
          <button type="button" style={onkoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...onkoStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...onkoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — kür sayacı karar desteğidir; mg/m², AUC, BSA ve eczane doz şeması yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
