'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gastroStil, GastroHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GastroAracKabugu'
import { hepatitPlanla, HEPATIT_TUR_ETIKET, HEPATIT_BANT_AD, type HepatitTur, type HepatitBant } from '../../engines/hbvHcv'

const TURLER: HepatitTur[] = ['hbv', 'hcv']
const BANLAR: HepatitBant[] = ['stabil', 'aktif_izlem', 'tedavi_degerlendirme']

export default function GastroHepatitAraci() {
  const [tur, setTur] = useState<HepatitTur>('hbv')
  const [bant, setBant] = useState<HepatitBant>('aktif_izlem')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const bugun = new Date().toISOString().slice(0, 10)
  const sonuc = useMemo(() => hepatitPlanla(tur, bant, bugun), [tur, bant, bugun])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gastroenteroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'hepatit', tur, bant, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Hepatit izlem hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gastroStil.kutu}>
        <div style={gastroStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <GastroHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...gastroStil.etiket, marginTop: 12 }}>Tür</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TURLER.map((x) => (
            <button key={x} type="button" onClick={() => setTur(x)}
              style={{ ...gastroStil.ghost, background: tur === x ? 'rgba(244,63,94,0.25)' : 'transparent' }}>
              {HEPATIT_TUR_ETIKET[x]}
            </button>
          ))}
        </div>
        <div style={{ ...gastroStil.etiket, marginTop: 12 }}>İzlem bandı</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BANLAR.map((x) => (
            <button key={x} type="button" onClick={() => setBant(x)}
              style={{ ...gastroStil.ghost, background: bant === x ? 'rgba(244,63,94,0.25)' : 'transparent' }}>
              {HEPATIT_BANT_AD[x].split('—')[0].trim()}
            </button>
          ))}
        </div>
      </div>
      <div style={gastroStil.kutu}>
        <div style={gastroStil.etiket}>İzlem önerisi (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.sonrakiAy ? `${sonuc.sonrakiAy} ay` : '—'} etiket="Önerilen izlem" ton="notr" />
          <Istatistik deger={sonuc.sonrakiTarih || '—'} etiket="Sonraki tarih" ton="iyi" />
        </div>
        <div style={gastroStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...gastroStil.satir, marginTop: 12 }}>
          <button type="button" style={gastroStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gastroStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gastroStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — izlem aralığı karar desteğidir; antiviral doz ve tanı hekimindir.</TaslakNotu>
      </div>
    </>
  )
}
