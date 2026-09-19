'use client'
import React, { useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { nefStil, NefHastaSecici, KopyalaButonu, TaslakNotu, useUrlHasta } from './NefAracKabugu'
import { MODALITE_AD, diyalizSkorla, DIYALIZ_KONTROL_LISTESI, type DiyalizModalite } from '../../engines/diyaliz'

export default function NefDiyalizAraci() {
  const [modalite, setModalite] = useState<DiyalizModalite>('hd')
  const [tarih, setTarih] = useState('')
  const [sonraki, setSonraki] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = diyalizSkorla({ modalite, tarih, sonrakiSeans: sonraki || null })

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/nefroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'diyaliz', modalite, tarih, sonrakiSeans: sonraki || null }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Diyaliz seans kaydı yazıldı.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={nefStil.kutu}>
        <div style={nefStil.etiket}>Hasta</div>
        <NefHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>Modalite</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(MODALITE_AD) as DiyalizModalite[]).map((m) => (
            <button key={m} type="button" onClick={() => setModalite(m)}
              style={{ ...nefStil.ghost, background: modalite === m ? 'rgba(6,182,212,0.25)' : 'transparent' }}>
              {MODALITE_AD[m]}
            </button>
          ))}
        </div>
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>Seans tarihi</div>
        <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={nefStil.input} />
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>Sonraki seans (isteğe bağlı)</div>
        <input type="date" value={sonraki} onChange={(e) => setSonraki(e.target.value)} style={nefStil.input} />
      </div>
      <div style={nefStil.kutu}>
        <div style={nefStil.metin}>{sonuc.ozet}</div>
        {DIYALIZ_KONTROL_LISTESI.map((x) => <div key={x} style={nefStil.kucuk}>☐ {x}</div>)}
        <div style={{ ...nefStil.satir, marginTop: 12 }}>
          <button type="button" style={nefStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...nefStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...nefStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — yalnız seans tarihleri. Makine HIS, UF, Kt/V ve reçete bu araçta yoktur.</TaslakNotu>
      </div>
    </>
  )
}
