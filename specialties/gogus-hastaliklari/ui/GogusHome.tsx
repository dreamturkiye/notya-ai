'use client'
/**
 * GOGUS-EXCEPTIONAL-01 — Göğüs bölüm ana ekranı (hasta dosyası › Göğüs).
 * Sticky şerit + sekmeler: Özet | CAT/mMRC | Spirometri | Risk | Görevler.
 * Kilitler: doz yok, tanı kilitlenmez, CAT/GOLD karar desteği, SFT cihaz entegrasyonu yok.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import { catMmrcDegerlendir, CAT_MADDELER, MMRC_AD, type MmrcSeviye } from '../engines/catMmrc'
import type { GogusSerit } from '../engines/serit'

type Veri = {
  serit: GogusSerit
  bolum: { nextKontrol: string | null; notes: { sonSpiro?: string; fev1Fvc?: number; fev1Yuzde?: number } }
  skorlar: Array<{ id: string; tarih: string; toplam: number | null; maddeler: Record<string, unknown> | null }>
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null }>
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#0284C7'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#7DD3FC', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }

const SEKMELER = ['Özet', 'CAT/mMRC', 'Spirometri', 'Risk', 'Görevler'] as const
type Sekme = (typeof SEKMELER)[number]
const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: '#64748B' }

export default function GogusHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [maddeler, setMaddeler] = useState<string[]>(Array(8).fill(''))
  const [mmrc, setMmrc] = useState('')
  const [orta, setOrta] = useState('0')
  const [yatis, setYatis] = useState('0')
  const [fev1, setFev1] = useState('')
  const [fev1Fvc, setFev1Fvc] = useState('')
  const [fev1Yuzde, setFev1Yuzde] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/gogus-hastaliklari', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/gogus-hastaliklari?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) setV(await r.json())
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  const skorSonuc = useMemo(() => catMmrcDegerlendir({
    catMaddeler: maddeler.map((x) => (x === '' ? null : Number(x))),
    mmrc: mmrc === '' ? null : Number(mmrc),
    ortaAlevlenme12Ay: Number(orta) || 0,
    yatisliAlevlenme12Ay: Number(yatis) || 0,
    fev1Yuzde: fev1 === '' ? null : Number(fev1),
  }), [maddeler, mmrc, orta, yatis, fev1])

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Göğüs yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="gogus-hastaliklari">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        {v.serit.chips.map((c) => (
          <span key={c.ad} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[c.durum] || '#EDF1F7' }}>
            <span style={{ color: '#8FA0B5' }}>{c.ad} </span>{c.deger}
            {c.alt && <span style={{ color: '#64748B' }}> · {c.alt}</span>}
          </span>
        ))}
      </div>
      <div style={{ ...kucuk, marginBottom: 10 }}>{v.kutuphane.hekimKilidi}</div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {SEKMELER.map((s) => (
          <button key={s} type="button" onClick={() => setSekme(s)} style={sekme === s ? btn : ghost}>{s}</button>
        ))}
      </div>

      {sekme === 'Özet' && (
        <div>
          <div style={etiket}>Plan taslağı</div>
          {(v.serit.planTaslagi.length ? v.serit.planTaslagi : ['Bugün için özel plan maddesi yok.']).map((p) => (
            <div key={p} style={metin}>• {p}</div>
          ))}
          <div style={{ ...etiket, marginTop: 12 }}>Sonraki kontrol</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="date" value={kontrolTarih || (v.bolum.nextKontrol || '')} onChange={(e) => setKontrolTarih(e.target.value)} style={toolsInput} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kontrol', tarih: kontrolTarih || v.bolum.nextKontrol }, 'Kontrol tarihi kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.kapsam}</div>
        </div>
      )}

      {sekme === 'CAT/mMRC' && (
        <div>
          <div style={etiket}>CAT maddeleri (0–5)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CAT_MADDELER.map((ad, i) => (
              <label key={ad} style={{ ...kucuk, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {i + 1}. {ad}
                <input type="number" min={0} max={5} value={maddeler[i]} onChange={(e) => setMaddeler(maddeler.map((x, j) => (j === i ? e.target.value : x)))} style={{ ...toolsInput, width: 64 }} />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <select value={mmrc} onChange={(e) => setMmrc(e.target.value)} style={toolsInput}>
              <option value="">mMRC seç</option>
              {([0, 1, 2, 3, 4] as MmrcSeviye[]).map((k) => <option key={k} value={k}>{MMRC_AD[k]}</option>)}
            </select>
            <input type="number" min={0} value={orta} onChange={(e) => setOrta(e.target.value)} placeholder="Orta alevlenme" style={{ ...toolsInput, width: 120 }} />
            <input type="number" min={0} value={yatis} onChange={(e) => setYatis(e.target.value)} placeholder="Yatışlı alevlenme" style={{ ...toolsInput, width: 120 }} />
            <input type="number" value={fev1} onChange={(e) => setFev1(e.target.value)} placeholder="FEV1 %" style={{ ...toolsInput, width: 90 }} />
          </div>
          <div style={{ ...metin, marginTop: 8 }}>{skorSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({
            adim: 'skor', catMaddeler: maddeler.map((x) => (x === '' ? null : Number(x))),
            mmrc: mmrc === '' ? null : Number(mmrc), ortaAlevlenme12Ay: Number(orta) || 0,
            yatisliAlevlenme12Ay: Number(yatis) || 0, fev1Yuzde: fev1 === '' ? null : Number(fev1),
          }, 'Skor kaydedildi.')}>Kaydet · forma ekle</button>
        </div>
      )}

      {sekme === 'Spirometri' && (
        <div>
          <div style={etiket}>Elle spirometri girişi (cihaz entegrasyonu yok)</div>
          <div style={kucuk}>Son kayıt: {v.bolum.notes?.sonSpiro || '—'}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <input type="number" step="0.01" value={fev1Fvc} onChange={(e) => setFev1Fvc(e.target.value)} placeholder="FEV1/FVC" style={{ ...toolsInput, width: 110 }} />
            <input type="number" value={fev1Yuzde} onChange={(e) => setFev1Yuzde(e.target.value)} placeholder="FEV1 %" style={{ ...toolsInput, width: 90 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'spiro', fev1Fvc: fev1Fvc === '' ? null : Number(fev1Fvc), fev1Yuzde: fev1Yuzde === '' ? null : Number(fev1Yuzde) }, 'Spirometri kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Risk' && (
        <div>
          <div style={etiket}>Kırmızı bayrak</div>
          <div style={{ ...kucuk, marginBottom: 8 }}>{v.kutuphane.acilYonlendirme}</div>
          {v.kutuphane.acilKodlari.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, marginTop: 4 }}>
              <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={() => setRiskKodlari((prev) => prev.includes(k.kod) ? prev.filter((x) => x !== k.kod) : [...prev, k.kod])} />
              {k.ad}
            </label>
          ))}
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={riskOnay} onChange={() => setRiskOnay(!riskOnay)} /> Hekim onayı (hemen bayraklarda zorunlu)
          </label>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'risk', kodlar: riskKodlari, hekimOnay: riskOnay }, 'Risk kaydedildi.')}>Kaydet</button>
          {v.risk.acik.length > 0 && <div style={{ ...kucuk, color: '#F87171', marginTop: 8 }}>Açık bayrak: {v.risk.acik.map((r) => r.bayraklar.join(', ')).join(' · ')}</div>}
        </div>
      )}

      {sekme === 'Görevler' && (
        <div>
          <div style={etiket}>Açık görevler</div>
          {!v.gorevler.length && <div style={kucuk}>Açık görev yok.</div>}
          {v.gorevler.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              <span style={metin}>{g.ad}{g.due ? ` · ${g.due}` : ''}</span>
              <button type="button" style={ghost} onClick={() => calistir({ adim: 'gorev_tamam', gorevId: g.id }, 'Görev tamamlandı.')}>Tamam</button>
            </div>
          ))}
        </div>
      )}

      {mesaj && <div style={{ ...kucuk, marginTop: 12 }}>{mesaj}</div>}
      {eklenenNot && <MuayeneFormunaDon notId={eklenenNot} />}
    </div>
  )
}
