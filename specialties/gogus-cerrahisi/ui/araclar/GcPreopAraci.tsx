'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gcStil, GcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GcAracKabugu'
import { PREOP_MADDELER, preopSkorla, type PreopKod } from '../../engines/preop'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export default function GcPreopAraci() {
  const [secilen, setSecilen] = useState<PreopKod[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => preopSkorla(secilen), [secilen])

  const toggle = (kod: PreopKod) => {
    setSecilen((p) => (p.includes(kod) ? p.filter((x) => x !== kod) : [...p, kod]))
  }

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gogus-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'preop', secilen, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Pre-op checklist hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <GcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...gcStil.etiket, marginTop: 12 }}>Pre-op solunum maddeleri (tanı / doz yok)</div>
        {PREOP_MADDELER.map((m) => (
          <label key={m.kod} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 6, fontSize: 13, color: CHROME_RENK.ink }}>
            <input type="checkbox" checked={secilen.includes(m.kod)} onChange={() => toggle(m.kod)} />
            <span>{m.ad}</span>
          </label>
        ))}
      </div>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Checklist özeti (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={secilen.length} etiket="Seçilen madde" ton={secilen.length ? 'iyi' : 'notr'} />
          <Istatistik deger={PREOP_MADDELER.length - secilen.length} etiket="Eksik" ton={secilen.length < PREOP_MADDELER.length ? 'uyari' : 'iyi'} />
        </div>
        <div style={gcStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...gcStil.satir, marginTop: 12 }}>
          <button type="button" style={gcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — pre-op checklist karar desteğidir; CAT/mMRC, doz ve OR planı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
