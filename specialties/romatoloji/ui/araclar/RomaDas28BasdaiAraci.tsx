'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { romaStil, RomaHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './RomaAracKabugu'
import { das28Skorla, basdaiSkorla, BASDAI_MADDELER } from '../../engines/das28Basdai'

type Mod = 'das28_crp' | 'das28_esr' | 'basdai'

export default function RomaDas28BasdaiAraci() {
  const [mod, setMod] = useState<Mod>('das28_crp')
  const [tjc, setTjc] = useState('')
  const [sjc, setSjc] = useState('')
  const [pga, setPga] = useState('')
  const [crp, setCrp] = useState('')
  const [esr, setEsr] = useState('')
  const [maddeler, setMaddeler] = useState(['', '', '', '', '', ''])
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const sonuc = useMemo(() => {
    if (mod === 'basdai') return basdaiSkorla(maddeler.map((m) => (m === '' ? null : Number(m))))
    return das28Skorla({
      tjc: tjc === '' ? null : Number(tjc),
      sjc: sjc === '' ? null : Number(sjc),
      pga: pga === '' ? null : Number(pga),
      crp: crp === '' ? null : Number(crp),
      esr: esr === '' ? null : Number(esr),
      varyant: mod === 'das28_esr' ? 'esr' : 'crp',
    })
  }, [mod, tjc, sjc, pga, crp, esr, maddeler])

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    if (!sonuc.tamamMi) { setHata(sonuc.ozet); return }
    try {
      const t = await getAccessTokenAsync()
      const body: Record<string, unknown> = { patientId: hastaId, adim: 'skor', tur: mod, hekimKilit: true }
      if (mod === 'basdai') body.maddeler = maddeler.map(Number)
      else {
        body.tjc = Number(tjc); body.sjc = Number(sjc); body.pga = Number(pga)
        if (mod === 'das28_crp') body.crp = Number(crp)
        else body.esr = Number(esr)
      }
      const r = await fetch('/api/doktor/romatoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Skor hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={romaStil.kutu}>
        <div style={romaStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <RomaHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...romaStil.etiket, marginTop: 12 }}>Ölçek</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {([
            ['das28_crp', 'DAS28-CRP'],
            ['das28_esr', 'DAS28-ESR'],
            ['basdai', 'BASDAI'],
          ] as const).map(([k, ad]) => (
            <button key={k} type="button" onClick={() => setMod(k)}
              style={{ ...romaStil.ghost, background: mod === k ? 'rgba(217,119,6,0.25)' : 'transparent' }}>
              {ad}
            </button>
          ))}
        </div>
        {mod !== 'basdai' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginTop: 12 }}>
            <label style={romaStil.kucuk}>TJC (0–28)<input type="number" value={tjc} onChange={(e) => setTjc(e.target.value)} style={romaStil.input} /></label>
            <label style={romaStil.kucuk}>SJC (0–28)<input type="number" value={sjc} onChange={(e) => setSjc(e.target.value)} style={romaStil.input} /></label>
            <label style={romaStil.kucuk}>PGA (0–100)<input type="number" value={pga} onChange={(e) => setPga(e.target.value)} style={romaStil.input} /></label>
            {mod === 'das28_crp'
              ? <label style={romaStil.kucuk}>CRP mg/L<input type="number" step="0.1" value={crp} onChange={(e) => setCrp(e.target.value)} style={romaStil.input} /></label>
              : <label style={romaStil.kucuk}>ESR mm/saat<input type="number" value={esr} onChange={(e) => setEsr(e.target.value)} style={romaStil.input} /></label>}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {BASDAI_MADDELER.map((ad, i) => (
              <label key={ad} style={{ ...romaStil.kucuk, display: 'block', marginBottom: 8 }}>
                {i + 1}. {ad}
                <input type="number" min={0} max={10} step={0.5} value={maddeler[i]}
                  onChange={(e) => setMaddeler((p) => { const n = [...p]; n[i] = e.target.value; return n })}
                  style={{ ...romaStil.input, width: 80, display: 'block' }} />
              </label>
            ))}
          </div>
        )}
      </div>
      <div style={romaStil.kutu}>
        <div style={romaStil.etiket}>Skor (karar desteği)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={sonuc.toplam ?? '—'} etiket="Toplam" ton={sonuc.bant === 'yuksek' ? 'kirmizi' : sonuc.bant === 'orta' ? 'uyari' : 'iyi'} />
          <Istatistik deger={sonuc.bantAd || '—'} etiket="Bant" ton="notr" />
        </div>
        <div style={romaStil.metin}>{sonuc.ozet}</div>
        <div style={{ ...romaStil.satir, marginTop: 12 }}>
          <button type="button" style={romaStil.btn} onClick={kaydet}>Kaydet</button>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        {durum && <div style={{ ...romaStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...romaStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <TaslakNotu>TASLAK — bant karar desteğidir; tanı yazmaz, doz yazmaz. İnfüzyon HIS yoktur.</TaslakNotu>
      </div>
    </>
  )
}
