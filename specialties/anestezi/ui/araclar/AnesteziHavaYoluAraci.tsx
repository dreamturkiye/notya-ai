'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { anesteziStil, AnesteziHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './AnesteziAracKabugu'
import { havaYoluSkorla, HAVA_YOLU_BAYRAKLAR, type HavaYoluBayrak } from '../../engines/havaYolu'

export default function AnesteziHavaYoluAraci() {
  const [bayraklar, setBayraklar] = useState<HavaYoluBayrak[]>([])
  const [tarih, setTarih] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => havaYoluSkorla({ bayraklar, tarih: tarih || null }), [bayraklar, tarih])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/anestezi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'havaYolu', bayraklar, tarih: tarih || null, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Hava yolu notu hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={anesteziStil.kutu}>
        <div style={anesteziStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <AnesteziHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...anesteziStil.etiket, marginTop: 12 }}>Hava yolu bayrakları</div>
        {HAVA_YOLU_BAYRAKLAR.map((m) => (
          <label key={m.kod} style={{ ...anesteziStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={bayraklar.includes(m.kod)} onChange={() => setBayraklar((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <label style={{ ...anesteziStil.kucuk, display: 'block', marginTop: 10 }}>Tarih<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...anesteziStil.input, display: 'block', width: 160 }} /></label>
      </div>
      <div style={anesteziStil.kutu}>
        <div style={anesteziStil.etiket}>Özet (karar desteği)</div>
        <Istatistik deger={bayraklar.length} etiket="Bayrak" ton="notr" />
        <div style={{ ...anesteziStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...anesteziStil.satir, marginTop: 12 }}>
          <button type="button" style={anesteziStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...anesteziStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...anesteziStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — hava yolu notu karar desteğidir; tanı, entübasyon tekniği detayı ve mg doz yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
