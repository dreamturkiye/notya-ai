'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { onkoStil, OnkoHastaSecici, KopyalaButonu, TaslakNotu, useUrlHasta } from './OnkoAracKabugu'
import { sutTaslagi, SUT_AMAC_ETIKET, type SutAmac } from '../../engines/sut'

const AMACLAR = Object.keys(SUT_AMAC_ETIKET) as SutAmac[]

export default function OnkoSutAraci() {
  const [amac, setAmac] = useState<SutAmac>('tedavi_raporu')
  const [endikasyon, setEndikasyon] = useState('')
  const [onceki, setOnceki] = useState('')
  const [lab, setLab] = useState('')
  const [hekimNot, setHekimNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => sutTaslagi({
    amac, endikasyonOzet: endikasyon, oncekiTedaviOzet: onceki || null, labOzet: lab || null, hekimNot: hekimNot || null,
  }), [amac, endikasyon, onceki, lab, hekimNot])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/onkoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hastaId, adim: 'sut', amac,
          endikasyonOzet: endikasyon, oncekiTedaviOzet: onceki || null, labOzet: lab || null, hekimNot: hekimNot || null,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('SUT taslağı gün notuna eklendi (canlı e-imza yok).')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={onkoStil.kutu}>
        <div style={onkoStil.etiket}>Hasta</div>
        <OnkoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>Rapor amacı</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {AMACLAR.map((a) => (
            <button key={a} type="button" onClick={() => setAmac(a)}
              style={{ ...onkoStil.ghost, background: amac === a ? 'rgba(220,38,38,0.25)' : 'transparent' }}>
              {SUT_AMAC_ETIKET[a]}
            </button>
          ))}
        </div>
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>Endikasyon özeti</div>
        <textarea value={endikasyon} onChange={(e) => setEndikasyon(e.target.value)} rows={3} style={{ ...onkoStil.input, width: '100%' }} />
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>Önceki tedavi özeti (isteğe bağlı)</div>
        <textarea value={onceki} onChange={(e) => setOnceki(e.target.value)} rows={2} style={{ ...onkoStil.input, width: '100%' }} />
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>Lab / görüntü özeti</div>
        <textarea value={lab} onChange={(e) => setLab(e.target.value)} rows={2} style={{ ...onkoStil.input, width: '100%' }} />
      </div>
      <div style={onkoStil.kutu}>
        <pre style={{ ...onkoStil.metin, whiteSpace: 'pre-wrap' }}>{sonuc.tamamMi ? sonuc.taslak : sonuc.ozet}</pre>
        <div style={{ ...onkoStil.satir, marginTop: 12 }}>
          <button type="button" style={onkoStil.btn} onClick={kaydet}>Taslağı kaydet</button>
          <KopyalaButonu metin={sonuc.taslak || sonuc.ozet} />
        </div>
        {durum && <div style={{ ...onkoStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...onkoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — canlı Medula e-imza yoktur. Güncel SUT maddesi ve doz hekimdedir; evre/TNM otomatik yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
