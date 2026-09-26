'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { nefStil, NefHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './NefAracKabugu'
import { egfrSkorla, ILAC_DOZ_UYARI_LISTESI } from '../../engines/egfr'

export default function NefEgfrAraci() {
  const [egfr, setEgfr] = useState('')
  const [uacr, setUacr] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => egfrSkorla(egfr === '' ? null : Number(egfr), uacr === '' ? null : Number(uacr)), [egfr, uacr])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/nefroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'egfr', egfr: Number(egfr), uacr: uacr === '' ? null : Number(uacr), hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('eGFR / KDIGO hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={nefStil.kutu}>
        <div style={nefStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <NefHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>eGFR (mL/dk/1.73m²)</div>
        <input type="number" step="0.1" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="örn. 48" style={nefStil.input} />
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>UACR (mg/g, isteğe bağlı)</div>
        <input type="number" step="1" value={uacr} onChange={(e) => setUacr(e.target.value)} placeholder="örn. 120" style={nefStil.input} />
      </div>
      <div style={nefStil.kutu}>
        <div style={nefStil.etiket}>KDIGO hücresi (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.g ?? '—'} etiket="G evresi" ton={sonuc.renk === 'kirmizi' ? 'kirmizi' : sonuc.renk === 'yesil' ? 'iyi' : 'uyari'} />
          <Istatistik deger={sonuc.a ?? '—'} etiket="A evresi" ton="notr" />
          <Istatistik deger={sonuc.sonrakiAy ? `${sonuc.sonrakiAy} ay` : '—'} etiket="Önerilen izlem" ton="notr" />
        </div>
        <div style={nefStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...nefStil.etiket, marginTop: 12 }}>İlaç sınıfı kontrol listesi (doz yok)</div>
        {ILAC_DOZ_UYARI_LISTESI.map((x) => <div key={x} style={nefStil.kucuk}>☐ {x}</div>)}
        <div style={{ ...nefStil.satir, marginTop: 12 }}>
          <button type="button" style={nefStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...nefStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...nefStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — KDIGO hücresi karar desteğidir; tanı yazmaz, ESA / ilaç dozu yazmaz. Bu araç, Dahiliye CKD aracından ayrıdır.</TaslakNotu>
      </div>
    </>
  )
}
