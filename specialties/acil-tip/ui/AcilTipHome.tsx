'use client'
/**
 * ACIL-TIP-EXCEPTIONAL-01 — Acil Tıp bölüm ana ekranı.
 * Sticky şerit + sekmeler: Özet | ESI | Kritik yol | Sevk | Risk | Görevler.
 * Kilitler: doz yok, tanı kilitlenmez, bed board HIS yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { AtSerit } from '../engines/serit'
import { ESI_KAYNAKLAR, type EsiKaynak, type EsiSeviye } from '../engines/esi'
import { KRITIK_YOLLAR, KRITIK_MADDELER, type KritikYol, type KritikMadde } from '../engines/kritikYol'
import { SEVK_HEDEFLER, SEVK_MADDELER, type SevkHedef, type SevkMadde } from '../engines/sevk'

type Veri = {
  serit: AtSerit
  bolum: {
    nextKontrol: string | null
    esi: { seviye?: number; kaynaklar?: string[] } | null
    kritikYol: { yollar?: string[]; maddeler?: string[] } | null
    sevk: { hedef?: string; maddeler?: string[] } | null
    notes: unknown
  }
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#F97316'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#FDBA74', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'ESI', 'Kritik yol', 'Sevk', 'Risk', 'Görevler'] as const
type Sekme = (typeof SEKMELER)[number]
const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: '#64748B' }

function Cip({ ad, deger, durum, alt }: { ad: string; deger: string; durum: string; alt?: string }) {
  return (
    <span style={{ border: `1px solid ${durum === 'kotu' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[durum] || '#EDF1F7', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#8FA0B5' }}>{ad} </span>{deger}
      {alt && <span style={{ color: '#64748B' }}> · {alt}</span>}
    </span>
  )
}

export default function AcilTipHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [esiSeviye, setEsiSeviye] = useState<EsiSeviye | null>(null)
  const [esiKaynak, setEsiKaynak] = useState<EsiKaynak[]>([])
  const [kritikYol, setKritikYol] = useState<KritikYol[]>([])
  const [kritikMad, setKritikMad] = useState<KritikMadde[]>([])
  const [sevkHedef, setSevkHedef] = useState<SevkHedef | null>(null)
  const [sevkMad, setSevkMad] = useState<SevkMadde[]>([])
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/acil-tip', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/acil-tip?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (typeof j.bolum?.esi?.seviye === 'number') setEsiSeviye(j.bolum.esi.seviye)
      if (Array.isArray(j.bolum?.esi?.kaynaklar)) setEsiKaynak(j.bolum.esi.kaynaklar)
      if (Array.isArray(j.bolum?.kritikYol?.yollar)) setKritikYol(j.bolum.kritikYol.yollar)
      if (Array.isArray(j.bolum?.kritikYol?.maddeler)) setKritikMad(j.bolum.kritikYol.maddeler)
      if (j.bolum?.sevk?.hedef) setSevkHedef(j.bolum.sevk.hedef)
      if (Array.isArray(j.bolum?.sevk?.maddeler)) setSevkMad(j.bolum.sevk.maddeler)
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Acil Tıp yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="acil-tip">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        {v.serit.chips.map((c) => <Cip key={c.ad} {...c} />)}
      </div>
      {v.serit.kirmizi.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 8 }}>
          {v.serit.kirmizi.map((k) => <div key={k}>⚑ {k}</div>)}
          <div style={{ ...kucuk, color: '#FCA5A5', marginTop: 4 }}>{v.kutuphane.acilYonlendirme}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {SEKMELER.map((x) => (
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(249,115,22,0.22)' : 'transparent', color: sekme === x ? '#FFEDD5' : '#8FA0B5' }}>{x}</button>
        ))}
      </div>

      {mesaj && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: /amadı|zorunlu|eksik|Geçersiz|geçersiz|bayrak|Hata/.test(mesaj) ? '#F87171' : '#34D399' }}>{mesaj}</span>
          <MuayeneFormunaDon notId={eklenenNot} />
        </div>
      )}

      {sekme === 'Özet' && (
        <div>
          <div style={etiket}>Bu vizit</div>
          <div style={metin}>ESI, kritik yol ve sevk/yatış paketi karar desteğidir. Tanı / doz hekimdedir. ED bed board HIS yok.</div>
          <div style={{ ...etiket, marginTop: 12 }}>Acil sonrası kontrol <span style={kucuk}>· hasta portalında &quot;Acil sonrası takip&quot;</span></div>
          <div style={satir}>
            <input type="date" value={kontrolTarih || v.bolum.nextKontrol || ''} onChange={(e) => setKontrolTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kontrol', tarih: kontrolTarih || v.bolum.nextKontrol }, 'Kontrol tarihi kaydedildi.')}>Kaydet</button>
          </div>
          {v.serit.planTaslagi.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Plan taslağı</div>
              {v.serit.planTaslagi.map((p) => <div key={p} style={metin}>• {p}</div>)}
            </>
          )}
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.hekimKilidi}</div>
          <div style={kucuk}>{v.kutuphane.kapsam}</div>
        </div>
      )}

      {sekme === 'ESI' && (
        <div>
          <div style={etiket}>ESI seviyesi (1–5)</div>
          <div style={satir}>
            {([1, 2, 3, 4, 5] as EsiSeviye[]).map((s) => (
              <button key={s} type="button" onClick={() => setEsiSeviye(s)} style={{ ...ghost, background: esiSeviye === s ? 'rgba(249,115,22,0.25)' : 'transparent', color: esiSeviye === s ? '#FFEDD5' : '#8FA0B5' }}>ESI {s}</button>
            ))}
          </div>
          <div style={{ ...etiket, marginTop: 10 }}>Kaynak bayrakları</div>
          {ESI_KAYNAKLAR.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={esiKaynak.includes(k.kod)} onChange={() => setEsiKaynak((p) => (p.includes(k.kod) ? p.filter((x) => x !== k.kod) : [...p, k.kod]))} />
              {k.ad}
            </label>
          ))}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'esi', seviye: esiSeviye, kaynaklar: esiKaynak, hekimKilit: true }, 'ESI kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Kritik yol' && (
        <div>
          <div style={etiket}>Yol bayrakları (tanı kilidi yok)</div>
          {KRITIK_YOLLAR.map((y) => (
            <label key={y.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={kritikYol.includes(y.kod)} onChange={() => setKritikYol((p) => (p.includes(y.kod) ? p.filter((x) => x !== y.kod) : [...p, y.kod]))} />
              {y.ad}
            </label>
          ))}
          <div style={{ ...etiket, marginTop: 10 }}>Checklist</div>
          {KRITIK_MADDELER.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={kritikMad.includes(m.kod)} onChange={() => setKritikMad((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'kritik', yollar: kritikYol, maddeler: kritikMad, hekimKilit: true }, 'Kritik yol kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Sevk' && (
        <div>
          <div style={etiket}>Hedef (boarding HIS yok)</div>
          <div style={satir}>
            {SEVK_HEDEFLER.map((h) => (
              <button key={h.kod} type="button" onClick={() => setSevkHedef(h.kod)} style={{ ...ghost, background: sevkHedef === h.kod ? 'rgba(249,115,22,0.25)' : 'transparent', color: sevkHedef === h.kod ? '#FFEDD5' : '#8FA0B5' }}>{h.ad}</button>
            ))}
          </div>
          <div style={{ ...etiket, marginTop: 10 }}>Paket maddeleri</div>
          {SEVK_MADDELER.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={sevkMad.includes(m.kod)} onChange={() => setSevkMad((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'sevk', hedef: sevkHedef, maddeler: sevkMad, hekimKilit: true }, 'Sevk/yatış paketi kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Risk' && (
        <div>
          <div style={etiket}>Kırmızı bayrak işaretleri</div>
          {v.kutuphane.acilKodlari.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '3px 0' }}>
              <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={() => setRiskKodlari((p) => (p.includes(k.kod) ? p.filter((x) => x !== k.kod) : [...p, k.kod]))} />
              {k.ad}
            </label>
          ))}
          <input value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Hekim eylemi" style={{ ...toolsInput, marginTop: 8, width: '100%' }} />
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Hekim gördü ve eylemi yazdı
          </label>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: riskEylem, hekimOnay: riskOnay }, 'Risk kaydı yazıldı.')}>Kaydet</button>
          {v.risk.acik.length > 0 && <div style={{ ...kucuk, color: '#FCA5A5', marginTop: 8 }}>Açık bayrak: {v.risk.acik.map((r) => r.bayraklar.join(', ')).join(' | ')}</div>}
        </div>
      )}

      {sekme === 'Görevler' && (
        <div>
          <div style={etiket}>Açık görevler</div>
          {!v.gorevler.length && <div style={kucuk}>Açık görev yok.</div>}
          {v.gorevler.map((g) => (
            <div key={g.id} style={{ ...satir, justifyContent: 'space-between' }}>
              <span style={metin}>{g.ad}{g.due ? ` · ${g.due}` : ''}</span>
              <button type="button" style={ghost} onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' }, 'Görev tamamlandı.')}>Tamam</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
