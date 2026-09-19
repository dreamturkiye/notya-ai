'use client'
import React, { useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { aileStil, AileHastaSecici, Onay, KopyalaButonu, TaslakNotu, useUrlHasta } from './AileAracKabugu'
import { KRONIK_PAKETLER, kronikOzeti, type KronikPaketKod } from '../../engines/kronik'

export default function AileKronikAraci() {
  const [secili, setSecili] = useState<KronikPaketKod[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const ozet = kronikOzeti(secili, null)

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!secili.length) { setHata('En az bir paket seçin.'); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/aile-hekimligi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'kronik', paketler: secili, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Kronik paket hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={aileStil.kutu}>
        <div style={aileStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <AileHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...aileStil.etiket, marginTop: 12 }}>Kronik paketler (DM / HT izlem vadeleri)</div>
        {KRONIK_PAKETLER.map((p) => (
          <Onay key={p.kod} ad={p.ad} deger={secili.includes(p.kod)} set={(b) => setSecili((prev) => (b ? [...prev, p.kod] : prev.filter((x) => x !== p.kod)))} />
        ))}
      </div>
      <div style={aileStil.kutu}>
        <div style={aileStil.etiket}>Özet</div>
        <div style={aileStil.metin}>{ozet}</div>
        <TaslakNotu>İzlem vadesi karar desteğidir; HbA1c/KB hedefi, ilaç dozu ve tanı yazılmaz.</TaslakNotu>
        <div style={{ ...aileStil.satir, marginTop: 10 }}>
          <KopyalaButonu metin={ozet} etiket="Özeti kopyala" />
          <button type="button" onClick={kaydet} style={aileStil.btn}>Kaydet</button>
        </div>
        {durum && <div style={{ ...aileStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...aileStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
      </div>
    </>
  )
}
