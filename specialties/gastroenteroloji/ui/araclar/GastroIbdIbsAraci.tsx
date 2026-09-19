'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gastroStil, GastroHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GastroAracKabugu'
import { skorHesapla, SKOR_TUR_ETIKET, type SkorTur } from '../../engines/ibdIbs'

const TURLER: SkorTur[] = ['mayo_kismi', 'hbi', 'ibs_sss']

export default function GastroIbdIbsAraci() {
  const [tur, setTur] = useState<SkorTur>('mayo_kismi')
  const [skor, setSkor] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => skorHesapla(tur, skor === '' ? null : Number(skor)), [tur, skor])
  const ozet = sonuc.ozet

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gastroenteroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'skor', tur, skor: Number(skor), hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Skor hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gastroStil.kutu}>
        <div style={gastroStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <GastroHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...gastroStil.etiket, marginTop: 12 }}>Skor türü</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TURLER.map((x) => (
            <button key={x} type="button" onClick={() => setTur(x)}
              style={{ ...gastroStil.ghost, background: tur === x ? 'rgba(244,63,94,0.25)' : 'transparent' }}>
              {SKOR_TUR_ETIKET[x]}
            </button>
          ))}
        </div>
        <div style={{ ...gastroStil.etiket, marginTop: 12 }}>Skor</div>
        <input type="number" step="1" value={skor} onChange={(e) => setSkor(e.target.value)} placeholder={tur === 'ibs_sss' ? '0–500' : 'örn. 4'} style={gastroStil.input} />
      </div>
      <div style={gastroStil.kutu}>
        <div style={gastroStil.etiket}>Aktivite bandı (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.skor ?? '—'} etiket={SKOR_TUR_ETIKET[tur]} ton={sonuc.bant === 'siddetli' ? 'kirmizi' : sonuc.bant === 'orta' ? 'uyari' : 'iyi'} />
          <Istatistik deger={sonuc.sonrakiAy ? `${sonuc.sonrakiAy} ay` : '—'} etiket="Önerilen kontrol" ton="notr" />
        </div>
        <div style={gastroStil.metin}>{ozet}</div>
        <div style={{ ...gastroStil.satir, marginTop: 12 }}>
          <button type="button" style={gastroStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={ozet} />
        </div>
        {durum && <div style={{ ...gastroStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gastroStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — bant karar desteğidir; tanı yazmaz, doz yazmaz. Crohn / ÜK tanısı hekim kilidindedir.</TaslakNotu>
      </div>
    </>
  )
}
