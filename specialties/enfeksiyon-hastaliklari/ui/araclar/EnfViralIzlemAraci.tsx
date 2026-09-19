'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { enfStil, EnfHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './EnfAracKabugu'
import { viralPlanla, VIRAL_TUR_ETIKET, type ViralTur } from '../../engines/viralIzlem'

const TURLER = Object.keys(VIRAL_TUR_ETIKET) as ViralTur[]

export default function EnfViralIzlemAraci() {
  const [tur, setTur] = useState<ViralTur>('hiv_viral')
  const [sonTarih, setSonTarih] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const bugun = new Date().toISOString().slice(0, 10)
  const plan = useMemo(() => viralPlanla(tur, sonTarih || null, bugun), [tur, sonTarih, bugun])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!plan.tamamMi) { setHata(plan.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/enfeksiyon-hastaliklari', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'viral', tur, sonTarih, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Viral izlem vadeleri kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={enfStil.kutu}>
        <div style={enfStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <EnfHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>İzlem türü</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TURLER.map((x) => (
            <button key={x} type="button" onClick={() => setTur(x)}
              style={{ ...enfStil.ghost, background: tur === x ? 'rgba(13,148,136,0.25)' : 'transparent' }}>
              {VIRAL_TUR_ETIKET[x]}
            </button>
          ))}
        </div>
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Son izlem tarihi</div>
        <input type="date" value={sonTarih} onChange={(e) => setSonTarih(e.target.value)} style={enfStil.input} />
      </div>
      <div style={enfStil.kutu}>
        <div style={enfStil.etiket}>Vade önerisi (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={plan.sonrakiTarih ?? '—'} etiket="Sonraki izlem" ton="iyi" />
        </div>
        <div style={enfStil.metin}>{plan.ozet}</div>
        <div style={{ ...enfStil.satir, marginTop: 12 }}>
          <button type="button" style={enfStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={plan.ozet} />
        </div>
        {durum && <div style={{ ...enfStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...enfStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — izlem vadeleri karar desteğidir. CD4/viral yük yorumu ve tanı hekimdedir; doz yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
