'use client'
/**
 * ANESTEZI-EXCEPTIONAL-01 — Anestezi bölüm ana ekranı.
 * Sticky şerit + sekmeler: Özet | ASA/Pre-op | Hava yolu | Ağrı | Acil | Görevler.
 * Kilitler: doz yok, tanı kilitlenmez, OR anestezi makinesi HIS yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { AnesteziSerit } from '../engines/serit'
import { ASA_MADDELER, type AsaKod, type AsaSinif } from '../engines/asa'
import { HAVA_YOLU_BAYRAKLAR, type HavaYoluBayrak } from '../engines/havaYolu'
import { AGRI_BAYRAKLAR, type AgriBayrak } from '../engines/agri'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: AnesteziSerit
  bolum: {
    nextKontrol: string | null
    asa: { secilen?: string[]; asaSinif?: string } | null
    havaYolu: { bayraklar?: string[] } | null
    agri: { bayraklar?: string[]; agriSkor?: number } | null
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

const ACCENT = '#8B5CF6'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#C4B5FD', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'ASA/Pre-op', 'Hava yolu', 'Ağrı', 'Acil', 'Görevler'] as const
type Sekme = (typeof SEKMELER)[number]
const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: CHROME_RENK.muted }
const ASA_SINIFLAR: AsaSinif[] = ['I', 'II', 'III', 'IV', 'V', 'E']

function Cip({ ad, deger, durum, alt }: { ad: string; deger: string; durum: string; alt?: string }) {
  return (
    <span style={{ border: `1px solid ${durum === 'kotu' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[durum] || CHROME_RENK.ink, whiteSpace: 'nowrap' }}>
      <span style={{ color: CHROME_RENK.muted }}>{ad} </span>{deger}
      {alt && <span style={{ color: CHROME_RENK.muted }}> · {alt}</span>}
    </span>
  )
}

export default function AnesteziHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [asaSec, setAsaSec] = useState<AsaKod[]>([])
  const [asaSinif, setAsaSinif] = useState<AsaSinif | ''>('')
  const [asaDue, setAsaDue] = useState('')
  const [havaSec, setHavaSec] = useState<HavaYoluBayrak[]>([])
  const [havaTarih, setHavaTarih] = useState('')
  const [agriSec, setAgriSec] = useState<AgriBayrak[]>([])
  const [agriSkor, setAgriSkor] = useState('')
  const [agriTarih, setAgriTarih] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/anestezi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/anestezi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (Array.isArray(j.bolum?.asa?.secilen)) setAsaSec(j.bolum.asa.secilen)
      if (j.bolum?.asa?.asaSinif) setAsaSinif(j.bolum.asa.asaSinif)
      if (Array.isArray(j.bolum?.havaYolu?.bayraklar)) setHavaSec(j.bolum.havaYolu.bayraklar)
      if (Array.isArray(j.bolum?.agri?.bayraklar)) setAgriSec(j.bolum.agri.bayraklar)
      if (j.bolum?.agri?.agriSkor != null) setAgriSkor(String(j.bolum.agri.agriSkor))
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Anestezi yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="anestezi">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        {v.serit.chips.map((c) => <Cip key={c.ad} {...c} />)}
      </div>
      {v.serit.kirmizi.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: CHROME_RENK.warn, borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 8 }}>
          {v.serit.kirmizi.map((k) => <div key={k}>⚑ {k}</div>)}
          <div style={{ ...kucuk, color: CHROME_RENK.warn, marginTop: 4 }}>{v.kutuphane.acilYonlendirme}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {SEKMELER.map((x) => (
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(139,92,246,0.22)' : 'transparent', color: sekme === x ? '#EDE9FE' : CHROME_RENK.muted }}>{x}</button>
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
          <div style={metin}>ASA/pre-op kontrol listesi, hava yolu notu ve post-op ağrı izlemi karar desteğidir. Tanı / ilaç dozu hekimdedir. Ameliyathane anestezi makinesi HIS yok.</div>
          <div style={{ ...etiket, marginTop: 12 }}>Kontrol tarihi <span style={kucuk}>· hasta portalında &quot;Kontrol randevusu&quot;</span></div>
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

      {sekme === 'ASA/Pre-op' && (
        <div>
          <div style={etiket}>ASA / pre-op değerlendirme kontrol listesi</div>
          {ASA_MADDELER.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={asaSec.includes(m.kod)} onChange={() => setAsaSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <div style={satir}>
            <select value={asaSinif} onChange={(e) => setAsaSinif(e.target.value as AsaSinif | '')} style={{ ...toolsInput, width: 100 }}>
              <option value="">ASA —</option>
              {ASA_SINIFLAR.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={asaDue} onChange={(e) => setAsaDue(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'asa', secilen: asaSec, asaSinif: asaSinif || null, due: asaDue || null, hekimKilit: true }, 'ASA/pre-op kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Hava yolu' && (
        <div>
          <div style={etiket}>Hava yolu notu (doz yok)</div>
          {HAVA_YOLU_BAYRAKLAR.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={havaSec.includes(m.kod)} onChange={() => setHavaSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <div style={satir}>
            <input type="date" value={havaTarih} onChange={(e) => setHavaTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'havaYolu', bayraklar: havaSec, tarih: havaTarih || null, hekimKilit: true }, 'Hava yolu notu kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Ağrı' && (
        <div>
          <div style={etiket}>Post-op ağrı izlem (mg doz yok)</div>
          {AGRI_BAYRAKLAR.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={agriSec.includes(m.kod)} onChange={() => setAgriSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <div style={satir}>
            <input type="number" min={0} max={10} placeholder="Skor 0–10" value={agriSkor} onChange={(e) => setAgriSkor(e.target.value)} style={{ ...toolsInput, width: 100 }} />
            <input type="date" value={agriTarih} onChange={(e) => setAgriTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'agri', bayraklar: agriSec, agriSkor: agriSkor === '' ? null : Number(agriSkor), tarih: agriTarih || null, hekimKilit: true }, 'Ağrı izlem kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Acil' && (
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
          {v.risk.acik.length > 0 && <div style={{ ...kucuk, color: CHROME_RENK.warn, marginTop: 8 }}>Açık bayrak: {v.risk.acik.map((r) => r.bayraklar.join(', ')).join(' | ')}</div>}
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
