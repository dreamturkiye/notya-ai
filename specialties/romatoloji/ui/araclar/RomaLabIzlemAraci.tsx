'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { romaStil, RomaHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './RomaAracKabugu'
import { labSkorla, LAB_TUR_ETIKET, type LabTur } from '../../engines/labIzlem'
import { EKLEM_28, EKLEM_28_ETIKET, eklemSay } from '../../engines/eklemHaritasi'

const TURLER: LabTur[] = ['crp', 'esr', 'rf', 'anti_ccp']

export default function RomaLabIzlemAraci() {
  const [sekme, setSekme] = useState<'lab' | 'eklem'>('lab')
  const [tur, setTur] = useState<LabTur>('crp')
  const [deger, setDeger] = useState('')
  const [hassas, setHassas] = useState<string[]>([])
  const [siskin, setSiskin] = useState<string[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const labSonuc = useMemo(() => labSkorla(tur, deger === '' ? null : Number(deger)), [tur, deger])
  const eklemSonuc = useMemo(() => eklemSay(hassas, siskin), [hassas, siskin])

  const toggle = (liste: string[], set: (x: string[]) => void, kod: string) => {
    set(liste.includes(kod) ? liste.filter((x) => x !== kod) : [...liste, kod])
  }

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    try {
      const t = await getAccessTokenAsync()
      if (sekme === 'lab') {
        if (!labSonuc.tamamMi) { setHata(labSonuc.ozet); return }
        const r = await fetch('/api/doktor/romatoloji', {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: hastaId, adim: 'lab', tur, deger: Number(deger), hekimKilit: true }),
        })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
        setDurum('Lab izlem kaydedildi.')
      } else {
        const r = await fetch('/api/doktor/romatoloji', {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: hastaId, adim: 'eklem', hassas, siskin, hekimKilit: true }),
        })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
        setDurum('Eklem haritası kaydedildi.')
      }
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={romaStil.kutu}>
        <div style={romaStil.etiket}>Hasta</div>
        <RomaHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" style={{ ...romaStil.ghost, background: sekme === 'lab' ? 'rgba(217,119,6,0.25)' : 'transparent' }} onClick={() => setSekme('lab')}>Lab izlem</button>
          <button type="button" style={{ ...romaStil.ghost, background: sekme === 'eklem' ? 'rgba(217,119,6,0.25)' : 'transparent' }} onClick={() => setSekme('eklem')}>28 eklem haritası</button>
        </div>
      </div>
      {sekme === 'lab' ? (
        <div style={romaStil.kutu}>
          <div style={romaStil.etiket}>Lab türü</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TURLER.map((x) => (
              <button key={x} type="button" onClick={() => setTur(x)}
                style={{ ...romaStil.ghost, background: tur === x ? 'rgba(217,119,6,0.25)' : 'transparent' }}>
                {LAB_TUR_ETIKET[x]}
              </button>
            ))}
          </div>
          <div style={{ ...romaStil.etiket, marginTop: 12 }}>Değer</div>
          <input type="number" step="0.1" value={deger} onChange={(e) => setDeger(e.target.value)} style={romaStil.input} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
            <Istatistik deger={labSonuc.deger ?? '—'} etiket={LAB_TUR_ETIKET[tur]} ton={labSonuc.bant === 'yuksek' ? 'kirmizi' : labSonuc.bant === 'dikkat' ? 'uyari' : 'iyi'} />
            <Istatistik deger={labSonuc.sonrakiAy ? `${labSonuc.sonrakiAy} ay` : '—'} etiket="Önerilen izlem" ton="notr" />
          </div>
          <div style={romaStil.metin}>{labSonuc.ozet}</div>
        </div>
      ) : (
        <div style={romaStil.kutu}>
          <div style={romaStil.etiket}>Hassas (TJC) / Şişkin (SJC)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 6 }}>
            {EKLEM_28.map((kod) => (
              <div key={kod} style={{ ...romaStil.kucuk, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 6 }}>
                <div style={{ marginBottom: 4 }}>{EKLEM_28_ETIKET[kod]}</div>
                <label><input type="checkbox" checked={hassas.includes(kod)} onChange={() => toggle(hassas, setHassas, kod)} /> Hassas</label>{' '}
                <label><input type="checkbox" checked={siskin.includes(kod)} onChange={() => toggle(siskin, setSiskin, kod)} /> Şişkin</label>
              </div>
            ))}
          </div>
          <div style={{ ...romaStil.metin, marginTop: 10 }}>{eklemSonuc.ozet}</div>
        </div>
      )}
      <div style={romaStil.kutu}>
        <div style={romaStil.satir}>
          <button type="button" style={romaStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sekme === 'lab' ? labSonuc.ozet : eklemSonuc.ozet} />
        </div>
        {durum && <div style={{ ...romaStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...romaStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — lab bandı ve eklem sayısı karar desteğidir; tanı/doz yok.</TaslakNotu>
      </div>
    </>
  )
}
