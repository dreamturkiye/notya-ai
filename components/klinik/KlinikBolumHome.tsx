'use client'
/**
 * KLINIK-AYNA-01 — hasta dosyası › klinik bölüm. Deterministik motorlar; nota ekle.
 * Her dalın paneli ayrı (branş sızıntısı yok).
 */
import React, { useMemo, useState } from 'react'
import { toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import { klinikYeniSlugMu, KLINIK_ETIKET } from '@/lib/specialties/klinikDikey'
import { greftBandi, yikamaTakvimi, HEKIM_KILIT as SAC_K, ACIL_METIN as SAC_A, NORWOOD } from '@/specialties/sac-ekimi/engines/sac'
import { sogumaUygun, islemTakvimi, HEKIM_KILIT as EST_K, ACIL_METIN as EST_A } from '@/specialties/medikal-estetik/engines/estetik'
import { sonrakiInfuzon, HEKIM_KILIT as LONG_K, ACIL_METIN as LONG_A, SINIFLAR } from '@/specialties/longevity/engines/long'
import { icfOzet, seansVadesi, HEKIM_KILIT as FIZ_K, ACIL_METIN as FIZ_A } from '@/specialties/fizyoterapi/engines/fizyo'
import { seansCercevesi, HEKIM_KILIT as PSI_K, ACIL_METIN as PSI_A } from '@/specialties/klinik-psikolog/engines/psikolog'
import { makroBand, taniReferansi, HEKIM_KILIT as DIY_K, ACIL_METIN as DIY_A } from '@/specialties/diyetisyen/engines/diyet'
import { gyaOzet, HEKIM_KILIT as ERG_K, ACIL_METIN as ERG_A, GYA } from '@/specialties/ergoterapi/engines/ergo'
import { ptaKayit, cihazListe, HEKIM_KILIT as ODY_K, ACIL_METIN as ODY_A } from '@/specialties/odyoloji/engines/odyo'

const inp: React.CSSProperties = { ...toolsInput, width: '100%', boxSizing: 'border-box' }
const btn: React.CSSProperties = { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }

function Kutu({ children }: { children: React.ReactNode }) {
  return <div style={{ ...toolsCard, marginBottom: 12 }}>{children}</div>
}

export default function KlinikBolumHome({ slug }: { patientId?: string; slug: string }) {
  const dal = klinikYeniSlugMu(slug) ? slug : null
  if (!dal) return null
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#EDF1F7', marginBottom: 8 }}>{KLINIK_ETIKET[dal]}</div>
      {dal === 'sac-ekimi' && <SacPanel />}
      {dal === 'medikal-estetik' && <EstetikPanel />}
      {dal === 'longevity' && <LongPanel />}
      {dal === 'fizyoterapi' && <FizyoPanel />}
      {dal === 'klinik-psikolog' && <PsikPanel />}
      {dal === 'diyetisyen' && <DiyetPanel />}
      {dal === 'ergoterapi' && <ErgoPanel />}
      {dal === 'odyoloji' && <OdyoPanel />}
    </div>
  )
}

function SacPanel() {
  const [cm2, setCm2] = useState('80')
  const [yog, setYog] = useState('40')
  const [ameliyat, setAmeliyat] = useState('')
  const [norwood, setNorwood] = useState('III')
  const g = useMemo(() => greftBandi(Number(cm2), Number(yog)), [cm2, yog])
  const takvim = useMemo(() => (ameliyat ? yikamaTakvimi(ameliyat, new Date().toISOString().slice(0, 10)) : []), [ameliyat])
  return (
    <>
      <Kutu>
        <div style={{ color: '#93C5FD', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Donör greft bandı</div>
        <input value={cm2} onChange={(e) => setCm2(e.target.value)} style={inp} placeholder="Donör cm²" />
        <input value={yog} onChange={(e) => setYog(e.target.value)} style={{ ...inp, marginTop: 8 }} placeholder="Greft/cm²" />
        <select value={norwood} onChange={(e) => setNorwood(e.target.value)} style={{ ...inp, marginTop: 8 }}>{NORWOOD.map((n) => <option key={n}>{n}</option>)}</select>
        <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in g ? g.hata : `${g.ozet} Norwood ${norwood} (kayıt).`}</div>
        <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{SAC_K}</div>
      </Kutu>
      <Kutu>
        <div style={{ color: '#93C5FD', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Yıkama takvimi</div>
        <input type="date" value={ameliyat} onChange={(e) => setAmeliyat(e.target.value)} style={inp} />
        {takvim.map((t) => <div key={t.gun} style={{ color: '#EDF1F7', fontSize: 12, marginTop: 4 }}>{t.gun}. gün · {t.ad} · {t.durum}</div>)}
        <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{SAC_A}</div>
      </Kutu>
    </>
  )
}

function EstetikPanel() {
  const [onam, setOnam] = useState('')
  const [islem, setIslem] = useState('')
  const s = useMemo(() => sogumaUygun(onam, islem), [onam, islem])
  const takvim = useMemo(() => (islem ? islemTakvimi(islem, new Date().toISOString().slice(0, 10)) : []), [islem])
  return (
    <>
      <Kutu>
        <div style={{ color: '#D8B4FE', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Onam / soğuma</div>
        <input type="date" value={onam} onChange={(e) => setOnam(e.target.value)} style={inp} />
        <input type="date" value={islem} onChange={(e) => setIslem(e.target.value)} style={{ ...inp, marginTop: 8 }} />
        <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{s.ozet}</div>
        <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{EST_K}</div>
      </Kutu>
      <Kutu>
        {takvim.map((t) => <div key={t.gun} style={{ color: '#EDF1F7', fontSize: 12, marginTop: 4 }}>{t.ad} · {t.durum}</div>)}
        <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{EST_A}</div>
      </Kutu>
    </>
  )
}

function LongPanel() {
  const [son, setSon] = useState('')
  const [gun, setGun] = useState('21')
  const [sinif, setSinif] = useState<(typeof SINIFLAR)[number]>(SINIFLAR[0])
  const s = useMemo(() => sonrakiInfuzon(son, Number(gun), new Date().toISOString().slice(0, 10)), [son, gun])
  return (
    <Kutu>
      <select value={sinif} onChange={(e) => setSinif(e.target.value as (typeof SINIFLAR)[number])} style={inp}>{SINIFLAR.map((x) => <option key={x}>{x}</option>)}</select>
      <input type="date" value={son} onChange={(e) => setSon(e.target.value)} style={{ ...inp, marginTop: 8 }} />
      <input value={gun} onChange={(e) => setGun(e.target.value)} style={{ ...inp, marginTop: 8 }} placeholder="Aralık (gün)" />
      <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in s ? s.hata : `Sonraki ${s.due} · ${s.durum} · ${sinif}`}</div>
      <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{LONG_K}</div>
      <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{LONG_A}</div>
    </Kutu>
  )
}

function FizyoPanel() {
  const [tani, setTani] = useState('')
  const [akt, setAkt] = useState('')
  const [kat, setKat] = useState('')
  const [son, setSon] = useState('')
  const [per, setPer] = useState('7')
  const icf = useMemo(() => icfOzet(akt, kat, tani), [akt, kat, tani])
  const seans = useMemo(() => seansVadesi(son, Number(per), 0, 0, new Date().toISOString().slice(0, 10)), [son, per])
  return (
    <>
      <Kutu>
        <input value={tani} onChange={(e) => setTani(e.target.value)} style={inp} placeholder="Hekim tanısı (zorunlu)" />
        <input value={akt} onChange={(e) => setAkt(e.target.value)} style={{ ...inp, marginTop: 8 }} placeholder="ICF aktivite" />
        <input value={kat} onChange={(e) => setKat(e.target.value)} style={{ ...inp, marginTop: 8 }} placeholder="ICF katılım" />
        <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in icf ? icf.hata : icf.ozet}</div>
        <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{FIZ_K}</div>
      </Kutu>
      <Kutu>
        <input type="date" value={son} onChange={(e) => setSon(e.target.value)} style={inp} />
        <input value={per} onChange={(e) => setPer(e.target.value)} style={{ ...inp, marginTop: 8 }} placeholder="Aralık gün" />
        <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in seans ? seans.hata : seans.ozet}</div>
        <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{FIZ_A}</div>
      </Kutu>
    </>
  )
}

function PsikPanel() {
  const [yak, setYak] = useState('BDT')
  const [olcek, setOlcek] = useState('')
  const [kriz, setKriz] = useState(false)
  const s = useMemo(() => seansCercevesi(yak, olcek, kriz), [yak, olcek, kriz])
  return (
    <Kutu>
      <input value={yak} onChange={(e) => setYak(e.target.value)} style={inp} placeholder="Yaklaşım" />
      <input value={olcek} onChange={(e) => setOlcek(e.target.value)} style={{ ...inp, marginTop: 8 }} placeholder="Ölçek adı (yorum yok)" />
      <label style={{ color: '#EDF1F7', fontSize: 12, display: 'block', marginTop: 8 }}>
        <input type="checkbox" checked={kriz} onChange={(e) => setKriz(e.target.checked)} /> Kriz bayrağı
      </label>
      <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in s ? s.hata : s.ozet}</div>
      <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{PSI_K}</div>
      <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{PSI_A}</div>
    </Kutu>
  )
}

function DiyetPanel() {
  const [kilo, setKilo] = useState('70')
  const [hedef, setHedef] = useState<'kilo' | 'koruma' | 'spor'>('koruma')
  const [tani, setTani] = useState('')
  const m = useMemo(() => makroBand(Number(kilo), hedef), [kilo, hedef])
  const t = useMemo(() => taniReferansi(tani), [tani])
  return (
    <Kutu>
      <input value={kilo} onChange={(e) => setKilo(e.target.value)} style={inp} placeholder="kg" />
      <select value={hedef} onChange={(e) => setHedef(e.target.value as 'kilo' | 'koruma' | 'spor')} style={{ ...inp, marginTop: 8 }}>
        <option value="kilo">Kilo</option><option value="koruma">Koruma</option><option value="spor">Spor</option>
      </select>
      <input value={tani} onChange={(e) => setTani(e.target.value)} style={{ ...inp, marginTop: 8 }} placeholder="Hekim tanısı" />
      <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in m ? m.hata : m.ozet}</div>
      <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 6 }}>{'hata' in t ? t.hata : t.ozet}</div>
      <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{DIY_K}</div>
      <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{DIY_A}</div>
    </Kutu>
  )
}

function ErgoPanel() {
  const [tani, setTani] = useState('')
  const [sec, setSec] = useState<string[]>([])
  const s = useMemo(() => gyaOzet(tani, sec), [tani, sec])
  return (
    <Kutu>
      <input value={tani} onChange={(e) => setTani(e.target.value)} style={inp} placeholder="Hekim tanısı (zorunlu)" />
      <div style={{ marginTop: 8 }}>
        {GYA.map((g) => (
          <label key={g} style={{ color: '#EDF1F7', fontSize: 12, display: 'block' }}>
            <input type="checkbox" checked={sec.includes(g)} onChange={() => setSec((x) => x.includes(g) ? x.filter((i) => i !== g) : [...x, g])} /> {g}
          </label>
        ))}
      </div>
      <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in s ? s.hata : s.ozet}</div>
      <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{ERG_K}</div>
      <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{ERG_A}</div>
    </Kutu>
  )
}

function OdyoPanel() {
  const [db, setDb] = useState('30')
  const [rapor, setRapor] = useState(false)
  const p = useMemo(() => ptaKayit(Number(db)), [db])
  const c = useMemo(() => cihazListe(rapor), [rapor])
  return (
    <Kutu>
      <input value={db} onChange={(e) => setDb(e.target.value)} style={inp} placeholder="Saf ses ortalaması dB" />
      <label style={{ color: '#EDF1F7', fontSize: 12, display: 'block', marginTop: 8 }}>
        <input type="checkbox" checked={rapor} onChange={(e) => setRapor(e.target.checked)} /> Uzman hekim raporu var
      </label>
      <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 10 }}>{'hata' in p ? p.hata : p.ozet}</div>
      <div style={{ color: '#EDF1F7', fontSize: 13, marginTop: 6 }}>{c.ozet}</div>
      <div style={{ color: '#8FA0B5', fontSize: 11, marginTop: 8 }}>{ODY_K}</div>
      <div style={{ color: '#F87171', fontSize: 11, marginTop: 8 }}>{ODY_A}</div>
    </Kutu>
  )
}

export { btn }
