'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { gcStil, GcHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './GcAracKabugu'
import { preopSkorla, PREOP_MADDELER, type PreopMaddeId } from '../../engines/preop'

export default function GcPreopAraci() {
  const [etiket, setEtiket] = useState('')
  const [tarih, setTarih] = useState('')
  const [tamamlanan, setTamamlanan] = useState<PreopMaddeId[]>([])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => preopSkorla({
    planlananAmeliyatEtiket: etiket || null,
    ameliyatTarihi: tarih || null,
    tamamlanan,
  }), [etiket, tarih, tamamlanan])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/genel-cerrahi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'preop', preop: sonuc.kart, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Pre-op checklist hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <GcHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...gcStil.etiket, marginTop: 12 }}>İşlem etiketi (tanı / ICD yok)</div>
        <input value={etiket} onChange={(e) => setEtiket(e.target.value)} placeholder="örn. hekim kısa işlem adı" style={gcStil.input} />
        <div style={{ ...gcStil.etiket, marginTop: 12 }}>Planlanan tarih</div>
        <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={gcStil.input} />
        <div style={{ ...gcStil.etiket, marginTop: 12 }}>Checklist</div>
        {PREOP_MADDELER.map((m) => (
          <label key={m.id} style={{ ...gcStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={tamamlanan.includes(m.id)} onChange={() => setTamamlanan((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))} />
            {m.ad}
          </label>
        ))}
      </div>
      <div style={gcStil.kutu}>
        <div style={gcStil.etiket}>Özet (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={`${sonuc.kart.tamamlanan.length}/${PREOP_MADDELER.length}`} etiket="Tamamlanan" ton={sonuc.eksik.length ? 'uyari' : 'iyi'} />
        </div>
        <div style={gcStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...gcStil.satir, marginTop: 12 }}>
          <button type="button" style={gcStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...gcStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...gcStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — pre-op checklist karar desteğidir; doz, OR scheduling ve tanı kilidi yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
