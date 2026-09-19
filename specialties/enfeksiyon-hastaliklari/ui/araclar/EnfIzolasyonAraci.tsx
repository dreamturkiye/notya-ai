'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { enfStil, EnfHastaSecici, KopyalaButonu, TaslakNotu, useUrlHasta } from './EnfAracKabugu'
import { izolasyonPlanla, IZOLASYON_TIP_AD, type IzolasyonTip } from '../../engines/izolasyon'

const TIPLER = Object.keys(IZOLASYON_TIP_AD) as IzolasyonTip[]

export default function EnfIzolasyonAraci() {
  const [tip, setTip] = useState<IzolasyonTip>('temas')
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')
  const [bildirim, setBildirim] = useState('')
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const plan = useMemo(() => izolasyonPlanla({ tip, baslangic, bitis, bildirimTarihi: bildirim, not }), [tip, baslangic, bitis, bildirim, not])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!plan.tamamMi) { setHata(plan.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/enfeksiyon-hastaliklari', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'izolasyon', tip, baslangic, bitis, bildirimTarihi: bildirim, not, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('İzolasyon / bildirim hatırlatması kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={enfStil.kutu}>
        <div style={enfStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <EnfHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>İzolasyon tipi</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TIPLER.map((x) => (
            <button key={x} type="button" onClick={() => setTip(x)}
              style={{ ...enfStil.ghost, background: tip === x ? 'rgba(13,148,136,0.25)' : 'transparent' }}>
              {IZOLASYON_TIP_AD[x]}
            </button>
          ))}
        </div>
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Başlangıç</div>
        <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} style={enfStil.input} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Bitiş</div>
        <input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} style={enfStil.input} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Bildirim tarihi (isteğe bağlı)</div>
        <input type="date" value={bildirim} onChange={(e) => setBildirim(e.target.value)} style={enfStil.input} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Not (tanı / doz yok)</div>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={2} style={enfStil.input} placeholder="Kısa klinik not" />
      </div>
      <div style={enfStil.kutu}>
        <div style={enfStil.etiket}>Özet</div>
        <div style={enfStil.metin}>{plan.ozet}</div>
        <div style={{ ...enfStil.satir, marginTop: 12 }}>
          <button type="button" style={enfStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={plan.ozet} />
        </div>
        {durum && <div style={{ ...enfStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...enfStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — izolasyon/bildirim hatırlatmasıdır. Hastane enfeksiyon kontrolü full HIS bu araçta yoktur. Tanı yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
