'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gcStil, GcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GcAracKabugu'
import { patolojiSkorla, PATOLOJI_DURUM_AD } from '../../engines/patoloji'

export default function GcPatolojiAraci() {
  const [etiket, setEtiket] = useState('')
  const [durumKod, setDurumKod] = useState('bekleniyor')
  const [ornek, setOrnek] = useState('')
  const [rapor, setRapor] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => patolojiSkorla({
    etiket: etiket || null, durum: durumKod, ornekTarihi: ornek || null, raporTarihi: rapor || null,
  }), [etiket, durumKod, ornek, rapor])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/genel-cerrahi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'patoloji', patoloji: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Patoloji takip kaydı yazıldı.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Hasta</div>
        <GcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...gcStil.etiket, marginTop: 12 }}>Etiket (tanı yok)</div>
        <input value={etiket} onChange={(e) => setEtiket(e.target.value)} placeholder="örn. Ameliyat materyali" style={gcStil.input} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={gcStil.kucuk}>Durum
            <select value={durumKod} onChange={(e) => setDurumKod(e.target.value)} style={{ ...gcStil.input, display: 'block' }}>
              {Object.entries(PATOLOJI_DURUM_AD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label style={gcStil.kucuk}>Örnek<input type="date" value={ornek} onChange={(e) => setOrnek(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
          <label style={gcStil.kucuk}>Rapor<input type="date" value={rapor} onChange={(e) => setRapor(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
        </div>
      </div>
      <div style={gcStil.kutu}>
        <Istatistik deger={PATOLOJI_DURUM_AD[sonuc.kart.durum]} etiket="Durum" ton={sonuc.kart.durum === 'bekleniyor' ? 'uyari' : 'iyi'} />
        <div style={{ ...gcStil.metin, marginTop: 10 }}>{sonuc.ozet}</div>
        <div style={{ ...gcStil.satir, marginTop: 12 }}>
          <button type="button" style={gcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — patoloji tanısı / evre / ICD yazılmaz; yalnız belge takibi.</TaslakNotu>
      </div>
    </>
  )
}
