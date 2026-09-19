'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { ftrStil, FtrHastaSecici, Alan, Sayi, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta } from './FtrAracKabugu'
import { egzersizRecetesi, EGZERSIZ_ORNEKLERI } from '../../engines/egzersiz'
import { REF_ACIKLAMA } from '../../engines/fizik-tedavi'

type Satir = { ad: string; set: string; tekrar: string; not: string }

export default function FtrEgzersizAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [satirlar, setSatirlar] = useState<Satir[]>([{ ad: '', set: '3', tekrar: '10', not: '' }])
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const sonuc = useMemo(() => egzersizRecetesi(satirlar.map((s) => ({
    ad: s.ad,
    set: s.set === '' ? null : Number(s.set),
    tekrar: s.tekrar === '' ? null : Number(s.tekrar),
    not: s.not || null,
  }))), [satirlar])

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
          patientId: hasta, adim: 'egzersiz', hekimKilit: true,
          maddeler: satirlar.map((s) => ({
            ad: s.ad, set: s.set === '' ? null : Number(s.set), tekrar: s.tekrar === '' ? null : Number(s.tekrar), not: s.not || null,
          })),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Ev egzersiz reçetesi kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={ftrStil.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <FtrHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
        <div style={{ ...ftrStil.kucuk, marginTop: 8 }}>Örnekler: {EGZERSIZ_ORNEKLERI.slice(0, 5).join(' · ')}…</div>
      </div>
      <div style={ftrStil.kutu}>
        <div style={ftrStil.etiket}>Egzersizler (ilaç/doz yok)</div>
        {satirlar.map((s, i) => (
          <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10, marginBottom: 10 }}>
            <input value={s.ad} onChange={(e) => { const n = [...satirlar]; n[i] = { ...s, ad: e.target.value }; setSatirlar(n) }} placeholder="Egzersiz adı" style={{ ...ftrStil.input, width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Sayi ad="Set" deger={s.set} set={(v) => { const n = [...satirlar]; n[i] = { ...s, set: v }; setSatirlar(n) }} />
              <Sayi ad="Tekrar" deger={s.tekrar} set={(v) => { const n = [...satirlar]; n[i] = { ...s, tekrar: v }; setSatirlar(n) }} />
            </div>
            <input value={s.not} onChange={(e) => { const n = [...satirlar]; n[i] = { ...s, not: e.target.value }; setSatirlar(n) }} placeholder="Not (isteğe bağlı)" style={{ ...ftrStil.input, width: '100%', marginTop: 8 }} />
          </div>
        ))}
        <button type="button" style={ftrStil.ghost} onClick={() => setSatirlar((p) => [...p, { ad: '', set: '3', tekrar: '10', not: '' }])}>+ Egzersiz ekle</button>
      </div>
      <div style={ftrStil.kutu}>
        <Istatistik etiket="Egzersiz sayısı" deger={sonuc.satirlar.length || '—'} ton={sonuc.tamamMi ? 'iyi' : 'uyari'} />
        <div style={{ ...ftrStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <TaslakNotu>Ev egzersiz reçetesi geneldir; ilaç adı ve mg yazılmaz. Set/tekrar hekim girdisidir, ilaç dozu değildir. Ağrı artınca dur.</TaslakNotu>
        <div style={{ ...ftrStil.satir, marginTop: 10 }}>
          <KopyalaButonu metin={sonuc.ozet} etiket="Notu kopyala" />
          <button type="button" onClick={kaydet} style={ftrStil.btn}>Kaydet</button>
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Ev egzersiz" satirlar={[sonuc.ozet]} alan="content_plan" />
        {durum && <div style={{ ...ftrStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...ftrStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <div style={{ ...ftrStil.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.TFTRD}</div>
      </div>
    </>
  )
}
