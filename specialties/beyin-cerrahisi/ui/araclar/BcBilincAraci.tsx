'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { bcStil, BcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './BcAracKabugu'
import { bilincSkorla, BILINC_BAYRAKLAR, type BilincBayrak } from '../../engines/bilinc'

export default function BcBilincAraci() {
  const [bayraklar, setBayraklar] = useState<BilincBayrak[]>([])
  const [tarih, setTarih] = useState('')
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => bilincSkorla({ bayraklar, tarih: tarih || null, not: not || null }), [bayraklar, tarih, not])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/beyin-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'bilinc', bilinc: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Nöbet/bilinç izlem kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={bcStil.kutu}>
        <div style={bcStil.etiket}>Hasta</div>
        <BcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...bcStil.etiket, marginTop: 12 }}>Bayraklar (tanı / AED doz yok)</div>
        {BILINC_BAYRAKLAR.map((m) => (
          <label key={m.kod} style={{ ...bcStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={bayraklar.includes(m.kod)} onChange={() => setBayraklar((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <label style={{ ...bcStil.kucuk, display: 'block', marginTop: 10 }}>İzlem tarihi<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...bcStil.input, display: 'block', width: 160 }} /></label>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} placeholder="Hekim notu (mg / AED doz yazılmaz)" rows={3} style={{ ...bcStil.input, marginTop: 10, width: '100%' }} />
      </div>
      <div style={bcStil.kutu}>
        <div style={bcStil.etiket}>İzlem özeti</div>
        <Istatistik deger={bayraklar.length} etiket="Bayrak" ton="notr" />
        <div style={{ ...bcStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...bcStil.satir, marginTop: 12 }}>
          <button type="button" style={bcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...bcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...bcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — nöbet/bilinç bayrağı karar desteğidir; tanı ve AED dozu hekimdedir. Nöroloji Migren/İnme aracı değildir.</TaslakNotu>
      </div>
    </>
  )
}
