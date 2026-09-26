'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gastroStil, GastroHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GastroAracKabugu'
import { endoskopiPlanla, ENDOSKOPI_TUR_ETIKET, type EndoskopiTur } from '../../engines/endoskopi'

const TURLER: EndoskopiTur[] = ['egd', 'kolonoskopi', 'sigmoidoskopi', 'eus']

export default function GastroEndoskopiAraci() {
  const [tur, setTur] = useState<EndoskopiTur>('kolonoskopi')
  const [tarih, setTarih] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => endoskopiPlanla(tur, tarih || null), [tur, tarih])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gastroenteroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'endoskopi', tur, tarih }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Endoskopi köprüsü hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gastroStil.kutu}>
        <div style={gastroStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <GastroHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...gastroStil.etiket, marginTop: 12 }}>İşlem türü</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TURLER.map((x) => (
            <button key={x} type="button" onClick={() => setTur(x)}
              style={{ ...gastroStil.ghost, background: tur === x ? 'rgba(244,63,94,0.25)' : 'transparent' }}>
              {ENDOSKOPI_TUR_ETIKET[x]}
            </button>
          ))}
        </div>
        <div style={{ ...gastroStil.etiket, marginTop: 12 }}>İşlem tarihi</div>
        <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={gastroStil.input} />
      </div>
      <div style={gastroStil.kutu}>
        <div style={gastroStil.etiket}>Köprü özeti</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.sonrakiKontrol || '—'} etiket="Önerilen kontrol" ton="notr" />
        </div>
        <div style={gastroStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...gastroStil.satir, marginTop: 12 }}>
          <button type="button" style={gastroStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gastroStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gastroStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — Belge köprüsü ve tarih. Tam endoskopi ünitesi / HIS / ameliyathane bu araçta yoktur. Tanı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
