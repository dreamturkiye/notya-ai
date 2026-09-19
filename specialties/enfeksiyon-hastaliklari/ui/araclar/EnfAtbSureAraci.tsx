'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { enfStil, EnfHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './EnfAracKabugu'
import { atbHesapla, atbDozIceriyorMu } from '../../engines/atbSure'

export default function EnfAtbSureAraci() {
  const [baslangic, setBaslangic] = useState('')
  const [sureGun, setSureGun] = useState('7')
  const [kontrol, setKontrol] = useState('')
  const [sinif, setSinif] = useState('')
  const [not, setNot] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(
    () => atbHesapla(baslangic || null, sureGun === '' ? null : Number(sureGun), kontrol || null, sinif || null, not || null),
    [baslangic, sureGun, kontrol, sinif, not],
  )

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (atbDozIceriyorMu(not)) { setHata('Not alanında doz / mg yazılamaz.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/enfeksiyon-hastaliklari', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hastaId, adim: 'atb',
          baslangic, sureGun: Number(sureGun), kontrol: kontrol || undefined,
          sinifEtiket: sinif || undefined, not: not || undefined, hekimKilit: true,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('ATB süre kaydı hasta dosyasına eklendi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={enfStil.kutu}>
        <div style={enfStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <EnfHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Başlangıç tarihi</div>
        <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} style={enfStil.input} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Süre (gün)</div>
        <input type="number" min={1} max={365} value={sureGun} onChange={(e) => setSureGun(e.target.value)} style={enfStil.input} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Kontrol tarihi (isteğe bağlı)</div>
        <input type="date" value={kontrol} onChange={(e) => setKontrol(e.target.value)} style={enfStil.input} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Sınıf etiketi (isteğe bağlı — etken madde yok)</div>
        <input value={sinif} onChange={(e) => setSinif(e.target.value)} placeholder="örn. beta-laktam" style={enfStil.input} />
        <div style={{ ...enfStil.etiket, marginTop: 12 }}>Not (doz / mg yok)</div>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={2} style={enfStil.input} />
      </div>
      <div style={enfStil.kutu}>
        <div style={enfStil.etiket}>Süre özeti (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.kart.sureGun ?? '—'} etiket="Gün" ton="notr" />
          <Istatistik deger={sonuc.kart.bitis ?? '—'} etiket="Bitiş" ton="iyi" />
        </div>
        <div style={enfStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...enfStil.satir, marginTop: 12 }}>
          <button type="button" style={enfStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...enfStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...enfStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — yalnız süre ve kontrol tarihi. Doz, mg, etken madde ve rejim invent edilmez.</TaslakNotu>
      </div>
    </>
  )
}
