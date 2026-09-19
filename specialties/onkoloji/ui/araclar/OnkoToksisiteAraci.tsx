'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { onkoStil, OnkoHastaSecici, KopyalaButonu, TaslakNotu, useUrlHasta } from './OnkoAracKabugu'
import { toksisiteSkorla, TOKSISITE_MADDELER, type ToksisiteKod } from '../../engines/toksisite'

export default function OnkoToksisiteAraci() {
  const [secilen, setSecilen] = useState<ToksisiteKod[]>([])
  const [due, setDue] = useState('')
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => toksisiteSkorla(secilen, not || null), [secilen, not])

  const toggle = (k: ToksisiteKod) => setSecilen((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/onkoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'toksisite', secilen, not: not || null, due: due || null }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Toksisite listesi kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={onkoStil.kutu}>
        <div style={onkoStil.etiket}>Hasta</div>
        <OnkoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>Kontrol listesi (grade/tanı yok)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TOKSISITE_MADDELER.map((m) => (
            <button key={m.kod} type="button" onClick={() => toggle(m.kod)}
              style={{ ...onkoStil.ghost, background: secilen.includes(m.kod) ? 'rgba(220,38,38,0.25)' : 'transparent' }}>
              {m.ad}
            </button>
          ))}
        </div>
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>İzlem tarihi (isteğe bağlı)</div>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={onkoStil.input} />
        <div style={{ ...onkoStil.etiket, marginTop: 12 }}>Hekim notu</div>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={3} style={{ ...onkoStil.input, width: '100%' }} placeholder="Doz yazılmaz" />
      </div>
      <div style={onkoStil.kutu}>
        <div style={onkoStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...onkoStil.satir, marginTop: 12 }}>
          <button type="button" style={onkoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...onkoStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...onkoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — toksisite listesi karar desteğidir; CTCAE grade tanı değildir, doz azaltma hekimdedir.</TaslakNotu>
      </div>
    </>
  )
}
