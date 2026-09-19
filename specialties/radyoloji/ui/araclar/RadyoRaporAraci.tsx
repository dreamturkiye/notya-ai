'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { radyoStil, RadyoHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './RadyoAracKabugu'
import { raporSkorla, BIRADS_KATEGORILER, RAPOR_SABLON, type BiradsKategori, type RaporSablonKod } from '../../engines/rapor'

export default function RadyoRaporAraci() {
  const [kategori, setKategori] = useState<BiradsKategori>('genel')
  const [secilen, setSecilen] = useState<RaporSablonKod[]>(['endikasyon', 'bulgular_yapilandirilmis', 'sonuc_ozet'])
  const [hastaId, setHastaId] = useState('')
  const [ok, setOk] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => raporSkorla(kategori, secilen), [kategori, secilen])

  const kaydet = async () => {
    setOk(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/radyoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'rapor', kategori, secilen, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setOk('Rapor taslağı hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={radyoStil.kutu}>
        <div style={radyoStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <RadyoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...radyoStil.etiket, marginTop: 12 }}>BI-RADS-style kategori (hekim seçer — otomatik tanı değil)</div>
        {BIRADS_KATEGORILER.map((k) => (
          <label key={k.kod} style={{ ...radyoStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="radio" name="birads" checked={kategori === k.kod} onChange={() => setKategori(k.kod)} />
            <span><strong>{k.ad}</strong> — {k.aciklama}</span>
          </label>
        ))}
        <div style={{ ...radyoStil.etiket, marginTop: 12 }}>Şablon maddeleri</div>
        {RAPOR_SABLON.map((m) => (
          <label key={m.kod} style={{ ...radyoStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={secilen.includes(m.kod)} onChange={() => setSecilen((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
      </div>
      <div style={radyoStil.kutu}>
        <div style={radyoStil.etiket}>Özet (karar desteği)</div>
        <Istatistik deger={kategori} etiket="Kategori" ton="notr" />
        <div style={{ ...radyoStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...radyoStil.satir, marginTop: 12 }}>
          <button type="button" style={radyoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {ok && <div style={{ ...radyoStil.kucuk, color: '#34D399', marginTop: 8 }}>{ok}</div>}
        {hata && <div style={{ ...radyoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — BI-RADS-style şablon klinik araçtır; AI otomatik tanı ve uydurma bulgu yazılmaz. Hasta portalında kategori sayısı gösterilmez.</TaslakNotu>
      </div>
    </>
  )
}
