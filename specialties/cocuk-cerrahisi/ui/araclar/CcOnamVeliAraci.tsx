'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { ccStil, CcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './CcAracKabugu'
import { onamSkorla, onamMaddeleri, type OnamKod } from '../../engines/onam'

export default function CcOnamVeliAraci() {
  const [yas, setYas] = useState('8')
  const [secilen, setSecilen] = useState<OnamKod[]>([])
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const yasYil = yas === '' ? null : Number(yas)
  const maddeler = onamMaddeleri(Number.isFinite(yasYil as number) ? (yasYil as number) : null)
  const sonuc = useMemo(() => onamSkorla(secilen, yasYil, not || null), [secilen, yasYil, not])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/cocuk-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'onam', secilen: sonuc.secilen, yasYil: sonuc.yasYil, not, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Onam / veli kontrol listesi kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={ccStil.kutu}>
        <div style={ccStil.etiket}>Hasta</div>
        <CcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Hasta yaşı (yıl) — veli maddeleri &lt;18 veya boşta açılır</div>
        <input type="number" min={0} max={120} value={yas} onChange={(e) => { setYas(e.target.value); setSecilen([]) }} style={ccStil.input} />
        <div style={{ ...ccStil.kucuk, marginTop: 6 }}>
          {sonuc.veliGerekli ? 'Veli / yasal temsilci maddeleri açık.' : 'Hasta ≥18 — veli maddeleri kapalı.'}
        </div>
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Kontrol listesi</div>
        {maddeler.map((m) => (
          <label key={m.kod} style={{ ...ccStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={secilen.includes(m.kod)} onChange={() => setSecilen((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Hekim notu</div>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} style={{ ...ccStil.input, minHeight: 60 }} />
      </div>
      <div style={ccStil.kutu}>
        <Istatistik deger={`${sonuc.secilen.length}/${maddeler.length}`} etiket="İşaretli" ton={sonuc.tamamMi ? 'iyi' : 'uyari'} />
        <div style={{ ...ccStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        {sonuc.taslak && (
          <pre style={{ ...ccStil.kucuk, whiteSpace: 'pre-wrap', marginTop: 10, background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 8 }}>{sonuc.taslak}</pre>
        )}
        <div style={{ ...ccStil.satir, marginTop: 12 }}>
          <button type="button" style={ccStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.taslak || sonuc.ozet} />
        </div>
        {durum && <div style={{ ...ccStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...ccStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>Yazılı onam klinik süreçtedir. Doz / tanı kilidi / ameliyathane planı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
