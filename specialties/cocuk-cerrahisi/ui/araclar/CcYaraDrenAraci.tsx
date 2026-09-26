'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { ccStil, CcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './CcAracKabugu'
import { yaraSkorla, YARA_TIP_AD, type YaraTip } from '../../engines/yaraDren'

export default function CcYaraDrenAraci() {
  const [tip, setTip] = useState<YaraTip>('yara')
  const [bolge, setBolge] = useState('')
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10))
  const [sonraki, setSonraki] = useState('')
  const [ml, setMl] = useState('')
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => yaraSkorla({
    tip, bolge: bolge || null, tarih, sonrakiKontrol: sonraki || null,
    drenCikisMl: ml === '' ? null : Number(ml), not: not || null,
  }), [tip, bolge, tarih, sonraki, ml, not])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/cocuk-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'yara', yara: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Yara/dren izlemi kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={ccStil.kutu}>
        <div style={ccStil.etiket}>Hasta</div>
        <CcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Tip</div>
        <select value={tip} onChange={(e) => setTip(e.target.value as YaraTip)} style={ccStil.input}>
          {(Object.keys(YARA_TIP_AD) as YaraTip[]).map((k) => <option key={k} value={k}>{YARA_TIP_AD[k]}</option>)}
        </select>
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Bölge</div>
        <input value={bolge} onChange={(e) => setBolge(e.target.value)} style={ccStil.input} placeholder="örn. inguinal sağ" />
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>İzlem tarihi</div>
        <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={ccStil.input} />
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Sonraki kontrol</div>
        <input type="date" value={sonraki} onChange={(e) => setSonraki(e.target.value)} style={ccStil.input} />
        {tip === 'dren' && (
          <>
            <div style={{ ...ccStil.etiket, marginTop: 12 }}>Dren çıkış (mL — hekim kaydı)</div>
            <input type="number" min={0} value={ml} onChange={(e) => setMl(e.target.value)} style={ccStil.input} />
          </>
        )}
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Hekim notu (doz/tanı yok)</div>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} style={{ ...ccStil.input, minHeight: 60 }} />
      </div>
      <div style={ccStil.kutu}>
        <Istatistik deger={sonuc.tamamMi ? 'OK' : '—'} etiket="Durum" ton={sonuc.tamamMi ? 'iyi' : 'uyari'} />
        <div style={{ ...ccStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...ccStil.satir, marginTop: 12 }}>
          <button type="button" style={ccStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...ccStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...ccStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>Pediatrik cerrahi ofis izlemi — enfeksiyon tanısı ve antibiyotik dozu hekimde. Ameliyathane/HIS yok.</TaslakNotu>
      </div>
    </>
  )
}
