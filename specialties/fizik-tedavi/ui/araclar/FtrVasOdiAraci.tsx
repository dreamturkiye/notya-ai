'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { ftrStil, FtrHastaSecici, Alan, Sayi, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta } from './FtrAracKabugu'
import { skorlaVas, skorlaOdi, ODI_MADDELER } from '../../engines/vasOdi'
import { REF_ACIKLAMA } from '../../engines/fizik-tedavi'

export default function FtrVasOdiAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [vas, setVas] = useState('')
  const [maddeler, setMaddeler] = useState<string[]>(Array(10).fill(''))
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const vasSonuc = useMemo(() => skorlaVas(vas === '' ? null : Number(vas)), [vas])
  const odiSonuc = useMemo(() => skorlaOdi(maddeler.map((x) => (x === '' ? null : Number(x)))), [maddeler])

  const kaydet = async (tip: 'vas' | 'odi') => {
    setDurum(''); setHata('')
    if (!hasta) { setHata('Kaydetmek için hasta seçin.'); return }
    const sonuc = tip === 'vas' ? vasSonuc : odiSonuc
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const body = tip === 'vas'
        ? { patientId: hasta, adim: 'vas', deger: Number(vas), hekimKilit: true }
        : { patientId: hasta, adim: 'odi', maddeler: maddeler.map(Number), hekimKilit: true }
      const r = await fetch('/api/doktor/fizik-tedavi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum(tip === 'vas' ? 'VAS kaydı eklendi.' : 'ODI kaydı eklendi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={ftrStil.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <FtrHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={ftrStil.kutu}>
        <div style={ftrStil.etiket}>VAS (0–10)</div>
        <Sayi ad="Ağrı şiddeti" deger={vas} set={setVas} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
          <Istatistik etiket="VAS" deger={vasSonuc.deger == null ? '—' : String(vasSonuc.deger)} ton={vasSonuc.bant === 'siddetli' ? 'kirmizi' : vasSonuc.bant === 'orta' ? 'uyari' : 'iyi'} />
          <Istatistik etiket="Bant (karar desteği)" deger={vasSonuc.bant ? vasSonuc.bantAd.split('—')[0].trim() : '—'} ton={vasSonuc.tamamMi ? 'notr' : 'uyari'} />
        </div>
        <div style={ftrStil.metin}>{vasSonuc.ozet}</div>
        <div style={{ ...ftrStil.satir, marginTop: 8 }}>
          <KopyalaButonu metin={vasSonuc.ozet} etiket="VAS kopyala" />
          <button type="button" onClick={() => kaydet('vas')} style={ftrStil.btn}>VAS kaydet</button>
        </div>
      </div>
      <div style={ftrStil.kutu}>
        <div style={ftrStil.etiket}>ODI (10 madde, 0–5)</div>
        {ODI_MADDELER.map((ad, i) => (
          <div key={ad} style={{ marginBottom: 10 }}>
            <Sayi ad={ad} deger={maddeler[i]} set={(v) => { const n = [...maddeler]; n[i] = v; setMaddeler(n) }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
          <Istatistik etiket="ODI %" deger={odiSonuc.yuzde == null ? '—' : String(odiSonuc.yuzde)} ton={odiSonuc.bant === 'siddetli' || odiSonuc.bant === 'cok_siddetli' || odiSonuc.bant === 'yataga_bagli' ? 'kirmizi' : odiSonuc.bant === 'orta' ? 'uyari' : 'iyi'} />
          <Istatistik etiket="Bant (karar desteği)" deger={odiSonuc.bant ? odiSonuc.bantAd.split('—')[0].trim() : (odiSonuc.eksikMadde ? `${odiSonuc.eksikMadde} madde boş` : '—')} ton={odiSonuc.tamamMi ? 'notr' : 'uyari'} />
        </div>
        <div style={ftrStil.metin}>{odiSonuc.ozet}</div>
        <TaslakNotu>VAS/ODI bandı karar desteğidir; tanı yazmaz. Eksik madde varken ODI yorumlanmaz. İlaç dozu yok.</TaslakNotu>
        <div style={{ ...ftrStil.satir, marginTop: 10 }}>
          <KopyalaButonu metin={odiSonuc.ozet} etiket="ODI kopyala" />
          <button type="button" onClick={() => kaydet('odi')} style={ftrStil.btn}>ODI kaydet</button>
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="VAS/ODI" satirlar={[vasSonuc.ozet, odiSonuc.ozet]} alan="content_objektif" />
        {durum && <div style={{ ...ftrStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...ftrStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <div style={{ ...ftrStil.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.VAS} · {REF_ACIKLAMA.ODI}</div>
      </div>
    </>
  )
}
