'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { romaStil, RomaHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './RomaAracKabugu'
import {
  biyolojikSutKontrol, BIYO_ENDIKASYON_ADI, type BiyolojikEndikasyon,
} from '../../engines/biyolojikSut'

const ENDIKASYONLAR = Object.keys(BIYO_ENDIKASYON_ADI) as BiyolojikEndikasyon[]

export default function RomaBiyolojikSutAraci() {
  const [endikasyon, setEndikasyon] = useState<BiyolojikEndikasyon | null>('ra')
  const [etkenSinif, setEtkenSinif] = useState('')
  const [oncekiCsDmard, setOncekiCsDmard] = useState(false)
  const [tbTarama, setTbTarama] = useState(false)
  const [hbvTarama, setHbvTarama] = useState(false)
  const [hcvTarama, setHcvTarama] = useState(false)
  const [akcigerGrafisi, setAkcigerGrafisi] = useState(false)
  const [canliAsiBilgi, setCanliAsiBilgi] = useState(false)
  const [hekimKilit, setHekimKilit] = useState(false)
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => biyolojikSutKontrol({
    endikasyon, etkenSinif, oncekiCsDmard, tbTarama, hbvTarama, hcvTarama, akcigerGrafisi, canliAsiBilgi, hekimKilit,
  }), [endikasyon, etkenSinif, oncekiCsDmard, tbTarama, hbvTarama, hcvTarama, akcigerGrafisi, canliAsiBilgi, hekimKilit])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (sonuc.dozIceriyorMu) { setHata('Doz / infüzyon HIS ifadesi kaldırılsın.'); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/romatoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hastaId, adim: 'sut', endikasyon, etkenSinif, oncekiCsDmard,
          tbTarama, hbvTarama, hcvTarama, akcigerGrafisi, canliAsiBilgi, hekimKilit,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('SUT kontrol listesi kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={romaStil.kutu}>
        <div style={romaStil.etiket}>Hasta</div>
        <RomaHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...romaStil.etiket, marginTop: 12 }}>Endikasyon (hekim tanısı)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ENDIKASYONLAR.map((e) => (
            <button key={e} type="button" onClick={() => setEndikasyon(e)}
              style={{ ...romaStil.ghost, background: endikasyon === e ? 'rgba(217,119,6,0.25)' : 'transparent' }}>
              {BIYO_ENDIKASYON_ADI[e]}
            </button>
          ))}
        </div>
        <div style={{ ...romaStil.etiket, marginTop: 12 }}>Etken / sınıf adı (doz yazmayın)</div>
        <input value={etkenSinif} onChange={(e) => setEtkenSinif(e.target.value)} placeholder="örn. TNF inhibitörü" style={romaStil.input} />
        {([
          ['Önceki csDMARD değerlendirildi', oncekiCsDmard, setOncekiCsDmard],
          ['TB taraması', tbTarama, setTbTarama],
          ['HBV taraması', hbvTarama, setHbvTarama],
          ['HCV taraması', hcvTarama, setHcvTarama],
          ['Akciğer grafisi', akcigerGrafisi, setAkcigerGrafisi],
          ['Canlı aşı bilgilendirmesi', canliAsiBilgi, setCanliAsiBilgi],
          ['Hekim kilidi', hekimKilit, setHekimKilit],
        ] as const).map(([ad, v, set]) => (
          <label key={ad} style={{ ...romaStil.metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} />
            {ad}
          </label>
        ))}
      </div>
      <div style={romaStil.kutu}>
        <div style={romaStil.etiket}>Kontrol listesi</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.eksikler.length} etiket="Eksik madde" ton={sonuc.eksikler.length ? 'uyari' : 'iyi'} />
          <Istatistik deger={sonuc.tamamMi ? 'Hazır' : 'Taslak'} etiket="Durum" ton={sonuc.tamamMi ? 'iyi' : 'notr'} />
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#EDF1F7', fontSize: 13 }}>
          {sonuc.kontrol.map((k) => (
            <li key={k.id}>{k.tamam === true ? '✓' : k.tamam === false ? '✗' : '○'} {k.madde}</li>
          ))}
        </ul>
        <div style={{ ...romaStil.metin, marginTop: 10 }}>{sonuc.ozet}</div>
        <div style={{ ...romaStil.satir, marginTop: 12 }}>
          <button type="button" style={romaStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...romaStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...romaStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — doz / yükleme / infüzyon HIS yazılmaz. SUT madde numarası hekim/idare teyit eder.</TaslakNotu>
      </div>
    </>
  )
}
