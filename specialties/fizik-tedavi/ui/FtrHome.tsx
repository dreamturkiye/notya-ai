'use client'
/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR bölüm ana ekranı (hasta dosyası › FTR).
 * Sticky şerit + sekmeler: Özet | VAS/ODI | Kırmızı bayrak | Seans | Görevler.
 * Kilitler: ilaç dozu yazılmaz, tanı kilitlenmez, VAS/ODI bandı karar desteği, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import { skorlaVas, skorlaOdi, ODI_MADDELER } from '../engines/vasOdi'
import type { FtrSerit } from '../engines/serit'

type Veri = {
  serit: FtrSerit
  bolum: { nextKontrol: string | null }
  sonVas: { toplam: number | null; bant: string | null; tarih: string } | null
  sonOdi: { toplam: number | null; bant: string | null; tarih: string } | null
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  kutuphane: {
    odiMaddeler: string[]
    acilKodlari: Array<{ kod: string; ad: string }>
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#16A34A'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#86EFAC', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'VAS/ODI', 'Kırmızı bayrak', 'Seans', 'Görevler'] as const
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

export default function FtrHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [vas, setVas] = useState('')
  const [odiMaddeler, setOdiMaddeler] = useState<string[]>(Array(10).fill(''))
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/fizik-tedavi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/fizik-tedavi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) setV(await r.json())
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  const vasSonuc = useMemo(() => skorlaVas(vas === '' ? null : Number(vas)), [vas])
  const odiSonuc = useMemo(() => skorlaOdi(odiMaddeler.map((x) => (x === '' ? null : Number(x)))), [odiMaddeler])

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>FTR yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="fizik-tedavi">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(22,163,74,0.22)' : 'transparent', color: sekme === x ? '#BBF7D0' : '#8FA0B5' }}>{x}</button>
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
          <div style={metin}>
            {v.sonVas
              ? <>Son VAS <b>{v.sonVas.toplam ?? '—'}</b> ({String(v.sonVas.tarih).slice(0, 10)}) — {v.sonVas.bant || '—}. </>
              : 'VAS kaydı yok. '}
            {v.sonOdi
              ? <>Son ODI <b>{v.sonOdi.toplam ?? '—'}%</b> — {v.sonOdi.bant || '—}. Bant karar desteğidir.</>
              : 'ODI kaydı yok — VAS/ODI sekmesinden girin.'}
          </div>
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

      {sekme === 'VAS/ODI' && (
        <div>
          <div style={etiket}>VAS 0–10</div>
          <input type="number" min={0} max={10} value={vas} onChange={(e) => setVas(e.target.value)} style={{ ...toolsInput, width: 100 }} />
          <div style={{ ...metin, marginTop: 6 }}>{vasSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'vas', deger: Number(vas), hekimKilit: true }, 'VAS kaydedildi.')}>VAS kaydet</button>
          <div style={{ ...etiket, marginTop: 16 }}>ODI (0–5)</div>
          {ODI_MADDELER.map((ad, i) => (
            <div key={ad} style={{ marginBottom: 8 }}>
              <div style={kucuk}>{ad}</div>
              <input type="number" min={0} max={5} value={odiMaddeler[i]} onChange={(e) => { const n = [...odiMaddeler]; n[i] = e.target.value; setOdiMaddeler(n) }} style={{ ...toolsInput, width: 100 }} />
            </div>
          ))}
          <div style={{ ...metin, marginTop: 8 }}>{odiSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'odi', maddeler: odiMaddeler.map(Number), hekimKilit: true }, 'ODI kaydedildi.')}>ODI kaydet</button>
        </div>
      )}

      {sekme === 'Kırmızı bayrak' && (
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

      {sekme === 'Seans' && (
        <div>
          <div style={etiket}>Seans / egzersiz</div>
          <div style={kucuk}>Detaylı seans planı ve ev egzersiz reçetesi Araçlar › FTR stüdyolarından açılır. Burada açık görevleri takip edin.</div>
          <div style={{ ...metin, marginTop: 8 }}>Açık seans/egzersiz görevleri: {v.gorevler.filter((g) => /seans|egzersiz/.test(g.kod)).length}</div>
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
