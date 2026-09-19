'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { endoStil, EndoHastaSecici, Onay, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './EndoAracKabugu'
import { dxaPlanla, DXA_RISK_AD, DXA_KONTROL_LISTESI, type DxaRisk } from '../../engines/dxa'

const RISLER = Object.keys(DXA_RISK_AD) as DxaRisk[]

export default function EndoDxaAraci() {
  const [sonDxa, setSonDxa] = useState('')
  const [risk, setRisk] = useState<DxaRisk>('orta')
  const [liste, setListe] = useState<number[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const bugun = new Date().toISOString().slice(0, 10)
  const sonuc = useMemo(() => dxaPlanla(sonDxa || null, risk, bugun), [sonDxa, risk, bugun])
  const ozet = [
    sonuc.ozet,
    ...liste.map((i) => `✓ ${DXA_KONTROL_LISTESI[i]}`),
  ].filter(Boolean).join('\n')

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi || !sonuc.sonrakiTarih) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/endokrinoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hastaId, adim: 'dxa', sonDxa, risk, sonraki: sonuc.sonrakiTarih,
          not: liste.map((i) => DXA_KONTROL_LISTESI[i]).join(' | '),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('DXA hatırlatması hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={endoStil.kutu}>
        <div style={endoStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <EndoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>Son DXA tarihi</div>
        <input type="date" value={sonDxa} onChange={(e) => setSonDxa(e.target.value)} style={endoStil.input} />
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>Hekim risk bandı (karar desteği)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {RISLER.map((x) => (
            <button key={x} type="button" onClick={() => setRisk(x)}
              style={{ ...endoStil.ghost, background: risk === x ? 'rgba(168,85,247,0.25)' : 'transparent' }}>
              {DXA_RISK_AD[x]}
            </button>
          ))}
        </div>
      </div>
      <div style={endoStil.kutu}>
        <div style={endoStil.etiket}>Tekrar planı</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.sonrakiTarih || '—'} etiket="Önerilen DXA" ton={sonuc.sonrakiTarih && sonuc.sonrakiTarih < bugun ? 'uyari' : 'iyi'} />
        </div>
        <div style={endoStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>Kontrol listesi</div>
        {DXA_KONTROL_LISTESI.map((x, i) => (
          <Onay key={x} ad={x} deger={liste.includes(i)} set={(b) => setListe((p) => (b ? [...p, i] : p.filter((y) => y !== i)))} />
        ))}
        <div style={{ ...endoStil.satir, marginTop: 12 }}>
          <button type="button" style={endoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={ozet} />
        </div>
        {durum && <div style={{ ...endoStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...endoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — T-skor / tanı / ilaç dozu yazılmaz. Yalnız tarih hatırlatması.</TaslakNotu>
      </div>
    </>
  )
}
