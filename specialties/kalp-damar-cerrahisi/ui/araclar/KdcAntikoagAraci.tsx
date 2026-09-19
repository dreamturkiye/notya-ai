'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { kdcStil, KdcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './KdcAracKabugu'
import { antikoagSkorla, ANTIKOAG_SINIFLARI, type AntikoagSinif } from '../../engines/antikoag'

export default function KdcAntikoagAraci() {
  const [sinif, setSinif] = useState<AntikoagSinif>('doac')
  const [kontrol, setKontrol] = useState('')
  const [lab, setLab] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => antikoagSkorla({ sinif, sonrakiKontrol: kontrol || null, labVadesi: lab || null }), [sinif, kontrol, lab])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/kalp-damar-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'antikoag', kart: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Antikoagülan vade hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={kdcStil.kutu}>
        <div style={kdcStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <KdcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={kdcStil.kucuk}>Sınıf
            <select value={sinif} onChange={(e) => setSinif(e.target.value as AntikoagSinif)} style={{ ...kdcStil.input, display: 'block', minWidth: 220 }}>
              {ANTIKOAG_SINIFLARI.map((s) => <option key={s.kod} value={s.kod}>{s.ad}</option>)}
            </select>
          </label>
          <label style={kdcStil.kucuk}>Kontrol vadesi<input type="date" value={kontrol} onChange={(e) => setKontrol(e.target.value)} style={{ ...kdcStil.input, display: 'block' }} /></label>
          <label style={kdcStil.kucuk}>Lab vadesi<input type="date" value={lab} onChange={(e) => setLab(e.target.value)} style={{ ...kdcStil.input, display: 'block' }} /></label>
        </div>
        <div style={{ ...kdcStil.kucuk, marginTop: 10 }}>Doz, INR hedefi ve mg yazılmaz — yalnız hekimin belirlediği tarihler.</div>
      </div>
      <div style={kdcStil.kutu}>
        <div style={kdcStil.etiket}>Vade özeti (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sinif} etiket="Sınıf" ton="notr" />
          <Istatistik deger={kontrol || lab || '—'} etiket="Vade" ton={kontrol || lab ? 'uyari' : 'notr'} />
        </div>
        <div style={kdcStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...kdcStil.satir, marginTop: 12 }}>
          <button type="button" style={kdcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...kdcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...kdcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — antikoagülan vade hatırlatmasıdır; doz ve SCORE2 yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
