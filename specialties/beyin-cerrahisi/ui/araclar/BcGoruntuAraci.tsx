'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { bcStil, BcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './BcAracKabugu'
import { goruntuSkorla } from '../../engines/goruntu'

export default function BcGoruntuAraci() {
  const [etiket, setEtiket] = useState('BT / MR kontrolü')
  const [tarih, setTarih] = useState('')
  const [belgeId, setBelgeId] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => goruntuSkorla({ sonraki: tarih, etiket, belgeId: belgeId || null }), [tarih, etiket, belgeId])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/beyin-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'goruntu', ...sonuc.kart }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Görüntü belge köprüsü kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={bcStil.kutu}>
        <div style={bcStil.etiket}>Hasta</div>
        <BcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...bcStil.etiket, marginTop: 12 }}>Etiket (tanı yok)</div>
        <input value={etiket} onChange={(e) => setEtiket(e.target.value)} placeholder="örn. Kontrol BT" style={bcStil.input} />
        <label style={{ ...bcStil.kucuk, display: 'block', marginTop: 10 }}>Kontrol tarihi<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...bcStil.input, display: 'block', width: 160 }} /></label>
        <label style={{ ...bcStil.kucuk, display: 'block', marginTop: 10 }}>Belge id (isteğe bağlı)<input value={belgeId} onChange={(e) => setBelgeId(e.target.value)} placeholder="vault belge kimliği" style={{ ...bcStil.input, display: 'block' }} /></label>
      </div>
      <div style={bcStil.kutu}>
        <div style={bcStil.etiket}>Köprü özeti</div>
        <Istatistik deger={sonuc.kart.sonraki || '—'} etiket="Tarih" ton="notr" />
        <div style={{ ...bcStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...bcStil.satir, marginTop: 12 }}>
          <button type="button" style={bcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...bcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...bcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — görüntü köprüsü zaman çizelgesidir; AI tanı ve rapor yorumu yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
