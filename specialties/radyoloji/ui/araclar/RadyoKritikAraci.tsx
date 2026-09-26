'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { radyoStil, RadyoHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './RadyoAracKabugu'
import { kritikSkorla, KRITIK_BAYRAKLAR, BILDIRIM_MADDELER, type KritikBayrak, type BildirimMadde } from '../../engines/kritik'

export default function RadyoKritikAraci() {
  const [bayraklar, setBayraklar] = useState<KritikBayrak[]>([])
  const [bildirim, setBildirim] = useState<BildirimMadde[]>([])
  const [onay, setOnay] = useState(false)
  const [hastaId, setHastaId] = useState('')
  const [ok, setOk] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => kritikSkorla(bayraklar, bildirim), [bayraklar, bildirim])

  const kaydet = async () => {
    setOk(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    if (!onay) { setHata('Hekim onayı gerekir.'); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/radyoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'kritik', bayraklar, bildirim, hekimOnay: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setOk('Kritik bulgu bildirimi kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={radyoStil.kutu}>
        <div style={radyoStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <RadyoHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...radyoStil.etiket, marginTop: 12 }}>Kritik bulgu bayrakları (hekim işaretler — AI uydurmaz)</div>
        {KRITIK_BAYRAKLAR.map((m) => (
          <label key={m.kod} style={{ ...radyoStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={bayraklar.includes(m.kod)} onChange={() => setBayraklar((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <div style={{ ...radyoStil.etiket, marginTop: 12 }}>Klinisyen bildirimi kontrol listesi</div>
        {BILDIRIM_MADDELER.map((m) => (
          <label key={m.kod} style={{ ...radyoStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={bildirim.includes(m.kod)} onChange={() => setBildirim((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <label style={{ ...radyoStil.metin, display: 'flex', gap: 8, marginTop: 12 }}>
          <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} />
          Hekim gördü ve klinisyene bildirdi (kilit)
        </label>
      </div>
      <div style={radyoStil.kutu}>
        <div style={radyoStil.etiket}>Özet</div>
        <Istatistik deger={bayraklar.length} etiket="Bayrak" ton={bayraklar.length ? 'kirmizi' : 'notr'} />
        <div style={{ ...radyoStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...radyoStil.satir, marginTop: 12 }}>
          <button type="button" style={radyoStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {ok && <div style={{ ...radyoStil.kucuk, color: '#34D399', marginTop: 8 }}>{ok}</div>}
        {hata && <div style={{ ...radyoStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — kritik bulgu hekim işaretler; AI tanı/uydurma bulgu yok. Acilde 112.</TaslakNotu>
      </div>
    </>
  )
}
