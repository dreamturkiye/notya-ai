'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { kdcStil, KdcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './KdcAracKabugu'
import { greftYaraSkorla, GREFT_YARA_TIPLERI, GREFT_YARA_DURUMLARI, type GreftYaraTip, type GreftYaraDurum } from '../../engines/greftYara'

export default function KdcGreftYaraAraci() {
  const [tip, setTip] = useState<GreftYaraTip>('greft')
  const [durumTip, setDurumTip] = useState<GreftYaraDurum>('izlemde')
  const [tarih, setTarih] = useState('')
  const [sonraki, setSonraki] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => greftYaraSkorla({ tip, durum: durumTip, tarih, sonrakiKontrol: sonraki || null }), [tip, durumTip, tarih, sonraki])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/kalp-damar-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'greft_yara', kart: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Greft / yara izlem hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={kdcStil.kutu}>
        <div style={kdcStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <KdcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={kdcStil.kucuk}>Tip
            <select value={tip} onChange={(e) => setTip(e.target.value as GreftYaraTip)} style={{ ...kdcStil.input, display: 'block' }}>
              {GREFT_YARA_TIPLERI.map((t) => <option key={t.kod} value={t.kod}>{t.ad}</option>)}
            </select>
          </label>
          <label style={kdcStil.kucuk}>Durum
            <select value={durumTip} onChange={(e) => setDurumTip(e.target.value as GreftYaraDurum)} style={{ ...kdcStil.input, display: 'block' }}>
              {GREFT_YARA_DURUMLARI.map((d) => <option key={d.kod} value={d.kod}>{d.ad}</option>)}
            </select>
          </label>
          <label style={kdcStil.kucuk}>Tarih<input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...kdcStil.input, display: 'block' }} /></label>
          <label style={kdcStil.kucuk}>Sonraki kontrol<input type="date" value={sonraki} onChange={(e) => setSonraki(e.target.value)} style={{ ...kdcStil.input, display: 'block' }} /></label>
        </div>
      </div>
      <div style={kdcStil.kutu}>
        <div style={kdcStil.etiket}>İzlem özeti (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={tip} etiket="Tip" ton="notr" />
          <Istatistik deger={durumTip} etiket="Durum" ton={durumTip === 'dikkat' ? 'uyari' : 'notr'} />
        </div>
        <div style={kdcStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...kdcStil.satir, marginTop: 12 }}>
          <button type="button" style={kdcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...kdcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...kdcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — greft/yara izlem karar desteğidir; tanı, doz ve ameliyathane planı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
