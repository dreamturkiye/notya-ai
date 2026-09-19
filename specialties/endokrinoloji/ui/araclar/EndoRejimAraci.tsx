'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { endoStil, EndoHastaSecici, KopyalaButonu, TaslakNotu, useUrlHasta } from './EndoAracKabugu'
import { rejimNormalize, rejimOzeti, rejimDozIceriyorMu } from '../../engines/rejim'

export default function EndoRejimAraci() {
  const [insulinBaslangic, setInsulinBaslangic] = useState('')
  const [insulinKontrol, setInsulinKontrol] = useState('')
  const [tiroidBaslangic, setTiroidBaslangic] = useState('')
  const [tiroidKontrol, setTiroidKontrol] = useState('')
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const kart = useMemo(() => rejimNormalize({ insulinBaslangic, insulinKontrol, tiroidBaslangic, tiroidKontrol, not }), [insulinBaslangic, insulinKontrol, tiroidBaslangic, tiroidKontrol, not])
  const ozet = rejimOzeti(kart)

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (rejimDozIceriyorMu(not)) { setHata('Not alanında doz / ünite / mcg yazılamaz — yalnız tarih ve kısa klinik not.'); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/endokrinoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'rejim', rejim: kart }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Rejim tarih kartı kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={endoStil.kutu}>
        <div style={endoStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <EndoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>İnsülin rejim (yalnız tarihler)</div>
        <div style={endoStil.satir}>
          <label style={endoStil.kucuk}>Başlangıç<input type="date" value={insulinBaslangic} onChange={(e) => setInsulinBaslangic(e.target.value)} style={{ ...endoStil.input, display: 'block', marginTop: 4 }} /></label>
          <label style={endoStil.kucuk}>Kontrol<input type="date" value={insulinKontrol} onChange={(e) => setInsulinKontrol(e.target.value)} style={{ ...endoStil.input, display: 'block', marginTop: 4 }} /></label>
        </div>
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>Tiroid rejim (yalnız tarihler)</div>
        <div style={endoStil.satir}>
          <label style={endoStil.kucuk}>Başlangıç<input type="date" value={tiroidBaslangic} onChange={(e) => setTiroidBaslangic(e.target.value)} style={{ ...endoStil.input, display: 'block', marginTop: 4 }} /></label>
          <label style={endoStil.kucuk}>Kontrol<input type="date" value={tiroidKontrol} onChange={(e) => setTiroidKontrol(e.target.value)} style={{ ...endoStil.input, display: 'block', marginTop: 4 }} /></label>
        </div>
        <div style={{ ...endoStil.etiket, marginTop: 12 }}>Kısa not (doz yok)</div>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={2} placeholder="Örn. sabah açlık kontrolü planlandı" style={{ ...endoStil.input, width: '100%', resize: 'vertical' }} />
      </div>
      <div style={endoStil.kutu}>
        <div style={endoStil.etiket}>Özet</div>
        <pre style={{ ...endoStil.metin, whiteSpace: 'pre-wrap', margin: 0 }}>{ozet}</pre>
        <div style={{ ...endoStil.satir, marginTop: 12 }}>
          <button type="button" style={endoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={ozet} />
        </div>
        {durum && <div style={{ ...endoStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...endoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — ünite, mcg, mg ve sliding-scale şeması yazılmaz. Yalnız başlangıç / kontrol tarihleri.</TaslakNotu>
      </div>
    </>
  )
}
