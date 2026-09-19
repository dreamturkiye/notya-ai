'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { radyoStil, RadyoHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './RadyoAracKabugu'
import {
  kuyrukSkorla, RADYO_MODALITELER, RADYO_ONCELIKLER, RADYO_DURUMLAR,
  type RadyoModalite, type RadyoOncelik, type RadyoDurum,
} from '../../engines/kuyruk'

export default function RadyoKuyrukAraci() {
  const [modalite, setModalite] = useState<RadyoModalite>('xray')
  const [oncelik, setOncelik] = useState<RadyoOncelik>('rutin')
  const [durum, setDurum] = useState<RadyoDurum>('bekliyor')
  const [tarih, setTarih] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [ok, setOk] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => kuyrukSkorla({ modalite, oncelik, durum, tarih }), [modalite, oncelik, durum, tarih])

  const kaydet = async () => {
    setOk(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/radyoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'kuyruk', modalite, oncelik, durum, tarih: tarih || null, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setOk('Tetkik kuyruğu hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={radyoStil.kutu}>
        <div style={radyoStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <RadyoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...radyoStil.etiket, marginTop: 12 }}>Modalite</div>
        <select value={modalite} onChange={(e) => setModalite(e.target.value as RadyoModalite)} style={radyoStil.input}>
          {RADYO_MODALITELER.map((m) => <option key={m.kod} value={m.kod}>{m.ad}</option>)}
        </select>
        <div style={{ ...radyoStil.etiket, marginTop: 12 }}>Öncelik</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RADYO_ONCELIKLER.map((o) => (
            <button key={o.kod} type="button" onClick={() => setOncelik(o.kod)} style={{ ...radyoStil.ghost, background: oncelik === o.kod ? 'rgba(13,148,136,0.25)' : 'transparent' }}>{o.ad}</button>
          ))}
        </div>
        <div style={{ ...radyoStil.etiket, marginTop: 12 }}>Durum</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RADYO_DURUMLAR.map((d) => (
            <button key={d.kod} type="button" onClick={() => setDurum(d.kod)} style={{ ...radyoStil.ghost, background: durum === d.kod ? 'rgba(13,148,136,0.25)' : 'transparent' }}>{d.ad}</button>
          ))}
        </div>
        <label style={{ ...radyoStil.kucuk, display: 'block', marginTop: 10 }}>Tarih<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...radyoStil.input, display: 'block', width: 160 }} /></label>
      </div>
      <div style={radyoStil.kutu}>
        <div style={radyoStil.etiket}>Özet (karar desteği)</div>
        <Istatistik deger={oncelik} etiket="Öncelik" ton={oncelik === 'acil' ? 'kirmizi' : 'notr'} />
        <div style={{ ...radyoStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...radyoStil.satir, marginTop: 12 }}>
          <button type="button" style={radyoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {ok && <div style={{ ...radyoStil.kucuk, color: '#34D399', marginTop: 8 }}>{ok}</div>}
        {hata && <div style={{ ...radyoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — kuyruk/öncelik karar desteğidir; PACS/RIS/HIS ve AI tanı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
