'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { anesteziStil, AnesteziHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './AnesteziAracKabugu'
import { asaSkorla, ASA_MADDELER, type AsaKod, type AsaSinif } from '../../engines/asa'

const ASA_SINIFLAR: AsaSinif[] = ['I', 'II', 'III', 'IV', 'V', 'E']

export default function AnesteziAsaAraci() {
  const [secilen, setSecilen] = useState<AsaKod[]>([])
  const [asaSinif, setAsaSinif] = useState<AsaSinif | ''>('')
  const [due, setDue] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => asaSkorla(secilen, asaSinif || null), [secilen, asaSinif])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/anestezi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'asa', secilen, asaSinif: asaSinif || null, due: due || null, hekimKilit: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('ASA/pre-op checklist hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={anesteziStil.kutu}>
        <div style={anesteziStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <AnesteziHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...anesteziStil.etiket, marginTop: 12 }}>Checklist maddeleri</div>
        {ASA_MADDELER.map((m) => (
          <label key={m.kod} style={{ ...anesteziStil.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={secilen.includes(m.kod)} onChange={() => setSecilen((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
            {m.ad}
          </label>
        ))}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <label style={anesteziStil.kucuk}>ASA sınıfı
            <select value={asaSinif} onChange={(e) => setAsaSinif(e.target.value as AsaSinif | '')} style={{ ...anesteziStil.input, display: 'block', width: 100 }}>
              <option value="">—</option>
              {ASA_SINIFLAR.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label style={anesteziStil.kucuk}>İzlem tarihi<input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ ...anesteziStil.input, display: 'block', width: 160 }} /></label>
        </div>
      </div>
      <div style={anesteziStil.kutu}>
        <div style={anesteziStil.etiket}>Özet (karar desteği)</div>
        <Istatistik deger={secilen.length} etiket="Seçilen madde" ton="notr" />
        <div style={{ ...anesteziStil.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <div style={{ ...anesteziStil.satir, marginTop: 12 }}>
          <button type="button" style={anesteziStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...anesteziStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...anesteziStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — ASA/pre-op checklist karar desteğidir; tanı, OR anestezi makinesi HIS ve ilaç dozu yazılmaz.</TaslakNotu>
      </div>
    </>
  )
}
