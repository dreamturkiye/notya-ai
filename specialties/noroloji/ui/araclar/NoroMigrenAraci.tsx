'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { noroStil, NoroHastaSecici, Alan, Sayi, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta } from './NoroAracKabugu'
import { skorla, MIGREN_MADDELER } from '../../engines/migren'
import { REF_ACIKLAMA } from '../../engines/noroloji'

export default function NoroMigrenAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [maddeler, setMaddeler] = useState<string[]>(['', '', '', '', ''])
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const sonuc = useMemo(() => skorla(maddeler.map((x) => (x === '' ? null : Number(x)))), [maddeler])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hasta) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/noroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hasta, adim: 'migren', maddeler: maddeler.map(Number), hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('MIDAS kaydı eklendi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={noroStil.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <NoroHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={noroStil.kutu}>
        <div style={noroStil.etiket}>Son 3 ay — MIDAS maddeleri (gün sayısı)</div>
        {MIGREN_MADDELER.map((ad, i) => (
          <div key={ad} style={{ marginBottom: 10 }}>
            <Sayi ad={ad} deger={maddeler[i]} set={(v) => { const n = [...maddeler]; n[i] = v; setMaddeler(n) }} />
          </div>
        ))}
      </div>
      <div style={noroStil.kutu}>
        <div style={noroStil.etiket}>Sonuç</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik etiket="Toplam" deger={sonuc.toplam == null ? '—' : String(sonuc.toplam)} ton={sonuc.bant === 'siddetli' ? 'kirmizi' : sonuc.bant === 'orta' ? 'uyari' : 'iyi'} />
          <Istatistik etiket="Bant (karar desteği)" deger={sonuc.bant ? sonuc.bantAd.split('—')[0].trim() : (sonuc.eksikMadde ? `${sonuc.eksikMadde} madde boş` : '—')} ton={sonuc.tamamMi ? 'notr' : 'uyari'} />
        </div>
        <div style={noroStil.metin}>{sonuc.ozet}</div>
        <TaslakNotu>MIDAS bandı karar desteğidir; tanı yazmaz. Eksik madde varken skor yorumlanmaz.</TaslakNotu>
        <div style={{ ...noroStil.satir, marginTop: 10 }}>
          <KopyalaButonu metin={sonuc.ozet} etiket="Notu kopyala" />
          <button type="button" onClick={kaydet} style={noroStil.btn}>Kaydet</button>
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="MIDAS" satirlar={[sonuc.ozet]} alan="content_objektif" />
        {durum && <div style={{ ...noroStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...noroStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <div style={{ ...noroStil.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.MIDAS}</div>
      </div>
    </>
  )
}
