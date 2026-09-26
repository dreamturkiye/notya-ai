'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { plastikStil, PlastikHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './PlastikAracKabugu'
import { yaraSkorla, YARA_TIP_AD, pansumanOneri, type YaraTip } from '../../engines/yara'

const TIPLER = Object.keys(YARA_TIP_AD) as YaraTip[]

export default function PlastikYaraAraci() {
  const [tip, setTip] = useState<YaraTip>('yara')
  const [bolge, setBolge] = useState('')
  const [taraf, setTaraf] = useState('')
  const [islemTarihi, setIslem] = useState('')
  const [pansumanTarihi, setPansuman] = useState('')
  const [dikisAlmaTarihi, setDikis] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => yaraSkorla({ tip, bolge, taraf, islemTarihi, pansumanTarihi, dikisAlmaTarihi }), [tip, bolge, taraf, islemTarihi, pansumanTarihi, dikisAlmaTarihi])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/plastik-cerrahi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'yara', yara: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Yara/greft izlem hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={plastikStil.kutu}>
        <div style={plastikStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <PlastikHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...plastikStil.etiket, marginTop: 12 }}>İzlem tipi</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TIPLER.map((x) => (
            <button key={x} type="button" style={{ ...plastikStil.ghost, background: tip === x ? 'rgba(190,24,93,0.25)' : 'transparent' }} onClick={() => setTip(x)}>{YARA_TIP_AD[x]}</button>
          ))}
        </div>
        <div style={{ ...plastikStil.etiket, marginTop: 12 }}>Bölge (tanı değil)</div>
        <input value={bolge} onChange={(e) => setBolge(e.target.value)} placeholder="örn. sağ meme, burun sırtı" style={plastikStil.input} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={plastikStil.kucuk}>Taraf<input value={taraf} onChange={(e) => setTaraf(e.target.value)} style={{ ...plastikStil.input, display: 'block', width: 120 }} /></label>
          <label style={plastikStil.kucuk}>İşlem<input type="date" value={islemTarihi} onChange={(e) => setIslem(e.target.value)} style={{ ...plastikStil.input, display: 'block' }} /></label>
          <label style={plastikStil.kucuk}>Pansuman<input type="date" value={pansumanTarihi} onChange={(e) => setPansuman(e.target.value)} style={{ ...plastikStil.input, display: 'block' }} /></label>
          <label style={plastikStil.kucuk}>Dikiş alma<input type="date" value={dikisAlmaTarihi} onChange={(e) => setDikis(e.target.value)} style={{ ...plastikStil.input, display: 'block' }} /></label>
        </div>
        <button type="button" style={{ ...plastikStil.ghost, marginTop: 8 }} onClick={() => { const o = pansumanOneri(islemTarihi || null, 3); if (o) setPansuman(o) }}>Pansuman +3 gün öner</button>
      </div>
      <div style={plastikStil.kutu}>
        <div style={plastikStil.etiket}>İzlem özeti (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={YARA_TIP_AD[tip]} etiket="Tip" ton="notr" />
          <Istatistik deger={bolge || '—'} etiket="Bölge" ton="notr" />
        </div>
        <div style={plastikStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...plastikStil.satir, marginTop: 12 }}>
          <button type="button" style={plastikStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...plastikStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...plastikStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — yara/greft izlem karar desteğidir; tanı, doz ve ameliyathane/HIS planı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
