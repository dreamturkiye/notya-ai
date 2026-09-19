'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { ftrStil, FtrHastaSecici, Alan, Sayi, Onay, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta } from './FtrAracKabugu'
import { seansPlani, FTR_MODALITELER } from '../../engines/seans'
import { REF_ACIKLAMA } from '../../engines/fizik-tedavi'

export default function FtrSeansAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [bolge, setBolge] = useState('')
  const [modal, setModal] = useState<string[]>([])
  const [seansSayisi, setSeansSayisi] = useState('10')
  const [siklik, setSiklik] = useState('3')
  const [not, setNot] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const sonuc = useMemo(() => seansPlani({
    bolge,
    modaliteler: modal,
    seansSayisi: seansSayisi === '' ? null : Number(seansSayisi),
    haftalikSiklik: siklik === '' ? null : Number(siklik),
    not,
  }), [bolge, modal, seansSayisi, siklik, not])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hasta) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/fizik-tedavi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hasta, adim: 'seans', bolge, modaliteler: modal,
          seansSayisi: Number(seansSayisi), haftalikSiklik: Number(siklik), not, hekimKilit: true,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Seans planı kaydedildi.')
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
        <div style={ftrStil.etiket}>Bölge</div>
        <input value={bolge} onChange={(e) => setBolge(e.target.value)} placeholder="Örn. bel, boyun, diz" style={{ ...ftrStil.input, width: '100%' }} />
        <div style={{ ...ftrStil.etiket, marginTop: 12 }}>Modaliteler</div>
        {FTR_MODALITELER.map((m) => (
          <Onay key={m} ad={m} deger={modal.includes(m)} set={(b) => setModal((p) => (b ? [...p, m] : p.filter((x) => x !== m)))} />
        ))}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <Sayi ad="Toplam seans" deger={seansSayisi} set={setSeansSayisi} />
          <Sayi ad="Haftalık sıklık" deger={siklik} set={setSiklik} />
        </div>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={2} placeholder="Hekim notu (ilaç/doz yok)" style={{ ...ftrStil.input, width: '100%', marginTop: 10, resize: 'vertical' }} />
      </div>
      <div style={ftrStil.kutu}>
        <div style={ftrStil.etiket}>Taslak özet</div>
        <div style={ftrStil.metin}>{sonuc.ozet}</div>
        {sonuc.uyari.map((u) => <div key={u} style={{ ...ftrStil.kucuk, color: '#FBBF24' }}>{u}</div>)}
        <TaslakNotu>Seans planı ilaç ve doz yazmaz. SGK/SUT seans üst sınırını hekim doğrular. Tanı yazılmaz.</TaslakNotu>
        <div style={{ ...ftrStil.satir, marginTop: 10 }}>
          <KopyalaButonu metin={sonuc.ozet} etiket="Notu kopyala" />
          <button type="button" onClick={kaydet} style={ftrStil.btn}>Kaydet</button>
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="FTR seans" satirlar={[sonuc.ozet]} alan="content_degerlendirme" />
        {durum && <div style={{ ...ftrStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...ftrStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <div style={{ ...ftrStil.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.SGK_SUT}</div>
      </div>
    </>
  )
}
