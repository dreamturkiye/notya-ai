'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { endoStil, EndoHastaSecici, Onay, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './EndoAracKabugu'
import { labSkorla, LAB_TUR_ETIKET, type LabTur } from '../../engines/labIzlem'

const TURLER: LabTur[] = ['hba1c', 'tsh', 'ft4']

export default function EndoLabIzlemAraci() {
  const [tur, setTur] = useState<LabTur>('hba1c')
  const [deger, setDeger] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => labSkorla(tur, deger === '' ? null : Number(deger)), [tur, deger])
  const ozet = sonuc.ozet

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/endokrinoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'lab', tur, deger: Number(deger), hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Lab izlem hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={endoStil.kutu}>
        <div style={endoStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <EndoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>Lab türü</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TURLER.map((x) => (
            <button key={x} type="button" onClick={() => setTur(x)}
              style={{ ...endoStil.ghost, background: tur === x ? 'rgba(168,85,247,0.25)' : 'transparent' }}>
              {LAB_TUR_ETIKET[x]}
            </button>
          ))}
        </div>
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>Değer</div>
        <input type="number" step="0.01" value={deger} onChange={(e) => setDeger(e.target.value)} placeholder={tur === 'hba1c' ? '% örn. 7,2' : 'örn. 2,4'} style={endoStil.input} />
      </div>
      <div style={endoStil.kutu}>
        <div style={endoStil.etiket}>İzlem önerisi (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.deger ?? '—'} etiket={LAB_TUR_ETIKET[tur]} ton={sonuc.bant === 'yuksek' ? 'kirmizi' : sonuc.bant === 'dikkat' ? 'uyari' : 'iyi'} />
          <Istatistik deger={sonuc.sonrakiAy ? `${sonuc.sonrakiAy} ay` : '—'} etiket="Önerilen izlem" ton="notr" />
        </div>
        <div style={endoStil.metin}>{ozet}</div>
        <Onay ad="Hekim değerleri gördü ve kilitleyecek" deger={true} set={() => {}} />
        <div style={{ ...endoStil.satir, marginTop: 12 }}>
          <button type="button" style={endoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={ozet} />
        </div>
        {durum && <div style={{ ...endoStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...endoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — bant karar desteğidir; tanı yazmaz, doz yazmaz. CGM cihaz entegrasyonu bu araçta yoktur.</TaslakNotu>
      </div>
    </>
  )
}
