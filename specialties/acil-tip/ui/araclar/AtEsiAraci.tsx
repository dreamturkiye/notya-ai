'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { atStil, AtHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './AtAracKabugu'
import { esiSkorla, ESI_KAYNAKLAR, type EsiKaynak, type EsiSeviye } from '../../engines/esi'

export default function AtEsiAraci() {
  const [seviye, setSeviye] = useState<EsiSeviye | null>(null)
  const [kaynaklar, setKaynaklar] = useState<EsiKaynak[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => esiSkorla({ seviye, kaynaklar }), [seviye, kaynaklar])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/acil-tip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'esi', seviye, kaynaklar, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('ESI hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={atStil.kutu}>
        <div style={atStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <AtHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...atStil.etiket, marginTop: 12 }}>ESI seviyesi</div>
        <div style={atStil.satir}>
          {([1, 2, 3, 4, 5] as EsiSeviye[]).map((s) => (
            <button key={s} type="button" style={{ ...atStil.ghost, background: seviye === s ? 'rgba(249,115,22,0.25)' : 'transparent' }} onClick={() => setSeviye(s)}>ESI {s}</button>
          ))}
        </div>
        <div style={{ ...atStil.etiket, marginTop: 12 }}>Kaynak bayrakları</div>
        {ESI_KAYNAKLAR.map((m) => (
          <label key={m.kod} style={{ ...atStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={kaynaklar.includes(m.kod)} onChange={() => setKaynaklar((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
      </div>
      <div style={atStil.kutu}>
        <div style={atStil.etiket}>Özet (karar desteği)</div>
        <Istatistik deger={seviye ?? '—'} etiket="ESI" ton="notr" />
        <div style={{ ...atStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...atStil.satir, marginTop: 12 }}>
          <button type="button" style={atStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...atStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...atStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — ESI karar desteğidir; tanı, doz ve ED bed board HIS yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
