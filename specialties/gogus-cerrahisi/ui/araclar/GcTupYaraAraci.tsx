'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gcStil, GcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GcAracKabugu'
import { tupYaraSkorla, TUP_YARA_TIPLERI, TUP_YARA_DURUMLARI, type TupYaraTip, type TupYaraDurum } from '../../engines/tupYara'

export default function GcTupYaraAraci() {
  const [tip, setTip] = useState<TupYaraTip>('toraks_tup')
  const [durumTip, setDurumTip] = useState<TupYaraDurum>('izlemde')
  const [tarih, setTarih] = useState('')
  const [sonraki, setSonraki] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => tupYaraSkorla({ tip, durum: durumTip, tarih, sonrakiKontrol: sonraki || null }), [tip, durumTip, tarih, sonraki])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/gogus-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'tup_yara', kart: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Tüp / yara izlem hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <GcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={gcStil.kucuk}>Tip
            <select value={tip} onChange={(e) => setTip(e.target.value as TupYaraTip)} style={{ ...gcStil.input, display: 'block' }}>
              {TUP_YARA_TIPLERI.map((t) => <option key={t.kod} value={t.kod}>{t.ad}</option>)}
            </select>
          </label>
          <label style={gcStil.kucuk}>Durum
            <select value={durumTip} onChange={(e) => setDurumTip(e.target.value as TupYaraDurum)} style={{ ...gcStil.input, display: 'block' }}>
              {TUP_YARA_DURUMLARI.map((d) => <option key={d.kod} value={d.kod}>{d.ad}</option>)}
            </select>
          </label>
          <label style={gcStil.kucuk}>Tarih<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
          <label style={gcStil.kucuk}>Sonraki kontrol<input type="date" value={sonraki} onChange={(e) => setSonraki(e.target.value)} style={{ ...gcStil.input, display: 'block' }} /></label>
        </div>
      </div>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>İzlem özeti (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={tip === 'toraks_tup' ? 'Tüp' : tip === 'yara' ? 'Yara' : 'Dren'} etiket="Tip" ton="notr" />
          <Istatistik deger={durumTip} etiket="Durum" ton={durumTip === 'dikkat' ? 'uyari' : 'notr'} />
        </div>
        <div style={gcStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...gcStil.satir, marginTop: 12 }}>
          <button type="button" style={gcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — tüp/yara izlem karar desteğidir; tanı, doz ve OR planı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
