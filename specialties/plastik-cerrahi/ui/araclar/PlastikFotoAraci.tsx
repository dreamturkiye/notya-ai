'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { plastikStil, PlastikHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './PlastikAracKabugu'
import { fotoSkorla, FOTO_ETIKET_ONERILERI } from '../../engines/foto'

export default function PlastikFotoAraci() {
  const [tarih, setTarih] = useState('')
  const [etiket, setEtiket] = useState('Kontrol foto')
  const [sonrakiKontrol, setSonraki] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => fotoSkorla({ tarih, etiket, sonrakiKontrol }), [tarih, etiket, sonrakiKontrol])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/plastik-cerrahi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'foto', foto: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Foto zaman çizgisi hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={plastikStil.kutu}>
        <div style={plastikStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <PlastikHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...plastikStil.etiket, marginTop: 12 }}>Etiket (AI tanı yok)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {FOTO_ETIKET_ONERILERI.map((e) => (
            <button key={e} type="button" style={plastikStil.ghost} onClick={() => setEtiket(e)}>{e}</button>
          ))}
        </div>
        <input value={etiket} onChange={(e) => setEtiket(e.target.value)} style={plastikStil.input} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={plastikStil.kucuk}>Foto tarihi<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...plastikStil.input, display: 'block' }} /></label>
          <label style={plastikStil.kucuk}>Sonraki foto/kontrol<input type="date" value={sonrakiKontrol} onChange={(e) => setSonraki(e.target.value)} style={{ ...plastikStil.input, display: 'block' }} /></label>
        </div>
      </div>
      <div style={plastikStil.kutu}>
        <div style={plastikStil.etiket}>Zaman çizgisi özeti</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={tarih || '—'} etiket="Tarih" ton="notr" />
          <Istatistik deger={sonrakiKontrol || '—'} etiket="Sonraki" ton="notr" />
        </div>
        <div style={plastikStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...plastikStil.satir, marginTop: 12 }}>
          <button type="button" style={plastikStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...plastikStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...plastikStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — foto köprüsü tarih+etikettir; derm skor / AI tanı ve doz yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
