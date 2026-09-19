'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { nefStil, NefHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './NefAracKabugu'
import { anemiSkorla, ANEMI_KONTROL_LISTESI } from '../../engines/anemi'

export default function NefAnemiAraci() {
  const [hb, setHb] = useState('')
  const [ferritin, setFerritin] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => anemiSkorla(hb === '' ? null : Number(hb), ferritin === '' ? null : Number(ferritin)), [hb, ferritin])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/nefroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'anemi', hb: Number(hb), ferritin: ferritin === '' ? null : Number(ferritin), hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Anemi izlem kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={nefStil.kutu}>
        <div style={nefStil.etiket}>Hasta</div>
        <NefHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>Hb (g/dL)</div>
        <input type="number" step="0.1" value={hb} onChange={(e) => setHb(e.target.value)} placeholder="örn. 9,8" style={nefStil.input} />
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>Ferritin (isteğe bağlı)</div>
        <input type="number" step="1" value={ferritin} onChange={(e) => setFerritin(e.target.value)} style={nefStil.input} />
      </div>
      <div style={nefStil.kutu}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.hb ?? '—'} etiket="Hb" ton={sonuc.bant === 'dusuk' ? 'kirmizi' : sonuc.bant === 'dikkat' ? 'uyari' : 'iyi'} />
          <Istatistik deger={sonuc.sonrakiAy ? `${sonuc.sonrakiAy} ay` : '—'} etiket="Önerilen izlem" ton="notr" />
        </div>
        <div style={nefStil.metin}>{sonuc.ozet}</div>
        {ANEMI_KONTROL_LISTESI.map((x) => <div key={x} style={nefStil.kucuk}>☐ {x}</div>)}
        <div style={{ ...nefStil.satir, marginTop: 12 }}>
          <button type="button" style={nefStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...nefStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...nefStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — ESA / eritropoietin dozu yazılmaz. Bant karar desteğidir; tanı değildir.</TaslakNotu>
      </div>
    </>
  )
}
