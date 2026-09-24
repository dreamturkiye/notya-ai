'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gcStil, GcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GcAracKabugu'
import { patolojiSkorla } from '../../engines/patoloji'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export default function GcPatolojiAraci() {
  const [ornekTarihi, setOrnek] = useState('')
  const [raporHazirTarihi, setRapor] = useState('')
  const [hazir, setHazir] = useState(false)
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => patolojiSkorla({ ornekTarihi: ornekTarihi || null, raporHazirTarihi: raporHazirTarihi || null, hazir }), [ornekTarihi, raporHazirTarihi, hazir])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gogus-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'patoloji', kart: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Patoloji köprü hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <GcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={gcStil.kucuk}>Örnek tarihi<input type="date" value={ornekTarihi} onChange={(e) => setOrnek(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
          <label style={gcStil.kucuk}>Rapor tarihi<input type="date" value={raporHazirTarihi} onChange={(e) => setRapor(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 13, color: CHROME_RENK.ink }}>
          <input type="checkbox" checked={hazir} onChange={(e) => setHazir(e.target.checked)} />
          Rapor hazır (hekim değerlendirmesi — tanı yazılmaz)
        </label>
      </div>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Patoloji köprü özeti</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={hazir ? 'Hazır' : 'Bekliyor'} etiket="Durum" ton={hazir ? 'uyari' : 'notr'} />
        </div>
        <div style={gcStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...gcStil.satir, marginTop: 12 }}>
          <button type="button" style={gcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — patoloji köprü yalnız tarih / hazır bayrağıdır; tanı, ICD, CAT/mMRC yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
