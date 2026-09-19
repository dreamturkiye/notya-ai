'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { ccStil, CcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './CcAracKabugu'
import { prepostSkorla, prepostMaddeler, type PrepostMaddeId, type PrepostTip } from '../../engines/prepost'

export default function CcPrepostAraci() {
  const [tip, setTip] = useState<PrepostTip>('preop')
  const [etiket, setEtiket] = useState('')
  const [tarih, setTarih] = useState('')
  const [tamamlanan, setTamamlanan] = useState<PrepostMaddeId[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const maddeler = prepostMaddeler(tip)
  const sonuc = useMemo(() => prepostSkorla({
    tip,
    planlananAmeliyatEtiket: etiket || null,
    ameliyatTarihi: tarih || null,
    tamamlanan,
  }), [tip, etiket, tarih, tamamlanan])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/cocuk-cerrahisi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'prepost', prepost: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Pre/post-op checklist hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={ccStil.kutu}>
        <div style={ccStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <CcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Tip</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['preop', 'postop'] as PrepostTip[]).map((x) => (
            <button key={x} type="button" onClick={() => { setTip(x); setTamamlanan([]) }}
              style={{ ...ccStil.ghost, background: tip === x ? 'rgba(8,145,178,0.3)' : 'transparent' }}>
              {x === 'preop' ? 'Pre-op' : 'Post-op'}
            </button>
          ))}
        </div>
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>İşlem etiketi (tanı / ICD / Neyzi yok)</div>
        <input value={etiket} onChange={(e) => setEtiket(e.target.value)} placeholder="örn. hekim kısa işlem adı" style={ccStil.input} />
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Planlanan / işlem tarihi</div>
        <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={ccStil.input} />
        <div style={{ ...ccStil.etiket, marginTop: 12 }}>Checklist</div>
        {maddeler.map((m) => (
          <label key={m.id} style={{ ...ccStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={tamamlanan.includes(m.id)} onChange={() => setTamamlanan((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))} />
            {m.ad}
          </label>
        ))}
      </div>
      <div style={ccStil.kutu}>
        <div style={ccStil.etiket}>Özet (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={`${sonuc.kart.tamamlanan.length}/${maddeler.length}`} etiket="Tamamlanan" ton={sonuc.eksik.length ? 'uyari' : 'iyi'} />
        </div>
        <div style={ccStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...ccStil.satir, marginTop: 12 }}>
          <button type="button" style={ccStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...ccStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...ccStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — pre/post-op checklist karar desteğidir; doz, OR scheduling, tanı kilidi ve Neyzi/Hedef Boy yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
