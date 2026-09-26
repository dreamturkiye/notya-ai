'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { bcStil, BcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './BcAracKabugu'
import { postopSkorla, POSTOP_MADDELER, type PostopKod } from '../../engines/postop'

export default function BcPostopAraci() {
  const [secilen, setSecilen] = useState<PostopKod[]>([])
  const [due, setDue] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => postopSkorla(secilen), [secilen])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/beyin-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'postop', secilen, due: due || null, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Post-op kontrol listesi hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={bcStil.kutu}>
        <div style={bcStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <BcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...bcStil.etiket, marginTop: 12 }}>Kontrol listesi maddeleri</div>
        {POSTOP_MADDELER.map((m) => (
          <label key={m.kod} style={{ ...bcStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={secilen.includes(m.kod)} onChange={() => setSecilen((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <label style={{ ...bcStil.kucuk, display: 'block', marginTop: 10 }}>İzlem tarihi<input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ ...bcStil.input, display: 'block', width: 160 }} /></label>
      </div>
      <div style={bcStil.kutu}>
        <div style={bcStil.etiket}>Özet (karar desteği)</div>
        <Istatistik deger={secilen.length} etiket="Seçilen madde" ton="notr" />
        <div style={{ ...bcStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...bcStil.satir, marginTop: 12 }}>
          <button type="button" style={bcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...bcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...bcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — post-op kontrol listesi karar desteğidir; tanı, ameliyathane/HIS ve AED dozu yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
