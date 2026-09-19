'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { plastikStil, PlastikHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './PlastikAracKabugu'
import { onamSkorla, ONAM_MADDELER, type OnamKod } from '../../engines/onam'

export default function PlastikOnamAraci() {
  const [secilen, setSecilen] = useState<OnamKod[]>([])
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => onamSkorla(secilen, not || null), [secilen, not])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/plastik-cerrahi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'onam', secilen, not: not || null }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Onam checklist hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={plastikStil.kutu}>
        <div style={plastikStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <PlastikHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...plastikStil.etiket, marginTop: 12 }}>Onam maddeleri</div>
        {ONAM_MADDELER.map((m) => (
          <label key={m.kod} style={{ ...plastikStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={secilen.includes(m.kod)} onChange={() => setSecilen((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <textarea value={not} onChange={(e) => setNot(e.target.value)} placeholder="Hekim notu (doz / tanı kilidi yok)" rows={3} style={{ ...plastikStil.input, marginTop: 10, width: '100%' }} />
      </div>
      <div style={plastikStil.kutu}>
        <div style={plastikStil.etiket}>Checklist özeti</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={`${sonuc.secilen.length}/${ONAM_MADDELER.length}`} etiket="Madde" ton="notr" />
        </div>
        <pre style={{ ...plastikStil.metin, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{sonuc.taslak || sonuc.ozet}</pre>
        <div style={{ ...plastikStil.satir, marginTop: 12 }}>
          <button type="button" style={plastikStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.taslak || sonuc.ozet} />
        </div>
        {durum && <div style={{ ...plastikStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...plastikStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — onam checklist karar desteğidir; tanı auto-lock, doz ve OR/HIS yok.</TaslakNotu>
      </div>
    </>
  )
}
