'use client'
/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Göğüs Cerrahisi bölüm ana ekranı (hasta dosyası › Göğüs Cerrahisi).
 * Sticky şerit + sekmeler: Özet | Pre-op | Tüp/Yara | Patoloji | Acil | Görevler.
 * Kilitler: doz yazılmaz, tanı kilitlenmez, OR/HIS yok, CAT/mMRC yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { GcSerit } from '../engines/serit'
import { PREOP_MADDELER, type PreopKod } from '../engines/preop'
import { TUP_YARA_TIPLERI, TUP_YARA_DURUMLARI, type TupYaraTip, type TupYaraDurum } from '../engines/tupYara'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: GcSerit
  bolum: {
    nextKontrol: string | null
    preop: { secilen?: string[] } | null
    tupYara: Record<string, unknown> | null
    patoloji: { hazir?: boolean; ornekTarihi?: string; raporHazirTarihi?: string } | null
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

const ACCENT = '#B91C1C'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: CHROME_RENK.warn, marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'Pre-op', 'Tüp/Yara', 'Patoloji', 'Acil', 'Görevler'] as const
type Sekme = (typeof SEKMELER)[number]
const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: CHROME_RENK.muted }

function Cip({ ad, deger, durum, alt }: { ad: string; deger: string; durum: string; alt?: string }) {
  return (
    <span style={{ border: `1px solid ${durum === 'kotu' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[durum] || CHROME_RENK.ink, whiteSpace: 'nowrap' }}>
      <span style={{ color: CHROME_RENK.muted }}>{ad} </span>{deger}
      {alt && <span style={{ color: CHROME_RENK.muted }}> · {alt}</span>}
    </span>
  )
}

export default function GogusCerrahiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [preopSec, setPreopSec] = useState<PreopKod[]>([])
  const [tupTip, setTupTip] = useState<TupYaraTip>('toraks_tup')
  const [tupDurum, setTupDurum] = useState<TupYaraDurum>('izlemde')
  const [tupTarih, setTupTarih] = useState('')
  const [tupSonraki, setTupSonraki] = useState('')
  const [patOrnek, setPatOrnek] = useState('')
  const [patRapor, setPatRapor] = useState('')
  const [patHazir, setPatHazir] = useState(false)
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/gogus-cerrahisi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/gogus-cerrahisi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (Array.isArray(j.bolum?.preop?.secilen)) setPreopSec(j.bolum.preop.secilen)
      if (j.bolum?.patoloji) {
        setPatHazir(!!j.bolum.patoloji.hazir)
        setPatOrnek(j.bolum.patoloji.ornekTarihi || '')
        setPatRapor(j.bolum.patoloji.raporHazirTarihi || '')
      }
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Göğüs Cerrahisi yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="gogus-cerrahisi">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(185,28,28,0.22)' : 'transparent', color: sekme === x ? '#FEE2E2' : CHROME_RENK.muted }}>{x}</button>
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
          <div style={metin}>Pre-op, tüp/yara ve patoloji köprü karar desteğidir. Tanı / doz / OR planı hekimdedir. CAT/mMRC bu bölümde yoktur.</div>
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

      {sekme === 'Pre-op' && (
        <div>
          <div style={etiket}>Pre-op solunum checklist</div>
          {PREOP_MADDELER.map((m) => (
            <label key={m.kod} style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: CHROME_RENK.ink }}>
              <input type="checkbox" checked={preopSec.includes(m.kod)} onChange={() => setPreopSec((p) => p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod])} />
              {m.ad}
            </label>
          ))}
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'preop', secilen: preopSec, hekimKilit: true }, 'Pre-op kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Tüp/Yara' && (
        <div>
          <div style={etiket}>Toraks tüp / yara izlem</div>
          <div style={satir}>
            <select value={tupTip} onChange={(e) => setTupTip(e.target.value as TupYaraTip)} style={toolsInput}>
              {TUP_YARA_TIPLERI.map((t) => <option key={t.kod} value={t.kod}>{t.ad}</option>)}
            </select>
            <select value={tupDurum} onChange={(e) => setTupDurum(e.target.value as TupYaraDurum)} style={toolsInput}>
              {TUP_YARA_DURUMLARI.map((d) => <option key={d.kod} value={d.kod}>{d.ad}</option>)}
            </select>
            <input type="date" value={tupTarih} onChange={(e) => setTupTarih(e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <input type="date" value={tupSonraki} onChange={(e) => setTupSonraki(e.target.value)} style={{ ...toolsInput, width: 150 }} title="Sonraki kontrol" />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'tup_yara', kart: { tip: tupTip, durum: tupDurum, tarih: tupTarih, sonrakiKontrol: tupSonraki || null }, hekimKilit: true }, 'Tüp/yara kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Patoloji' && (
        <div>
          <div style={etiket}>Patoloji köprü (tanı yazılmaz)</div>
          <div style={satir}>
            <input type="date" value={patOrnek} onChange={(e) => setPatOrnek(e.target.value)} style={{ ...toolsInput, width: 150 }} title="Örnek" />
            <input type="date" value={patRapor} onChange={(e) => setPatRapor(e.target.value)} style={{ ...toolsInput, width: 150 }} title="Rapor" />
            <label style={{ ...kucuk, color: CHROME_RENK.ink, display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={patHazir} onChange={(e) => setPatHazir(e.target.checked)} /> Rapor hazır
            </label>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'patoloji', kart: { ornekTarihi: patOrnek || null, raporHazirTarihi: patRapor || null, hazir: patHazir }, hekimKilit: true }, 'Patoloji köprü kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Acil' && (
        <div>
          <div style={etiket}>Toraks acil bayrak</div>
          <div style={kucuk}>{v.kutuphane.acilYonlendirme}</div>
          {v.kutuphane.acilKodlari.map((k) => (
            <label key={k.kod} style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12, color: CHROME_RENK.ink }}>
              <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={() => setRiskKodlari((p) => p.includes(k.kod) ? p.filter((x) => x !== k.kod) : [...p, k.kod])} />
              {k.ad}
            </label>
          ))}
          <textarea value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Hekim eylemi (doz yazılmaz)" style={{ ...toolsInput, width: '100%', minHeight: 60, marginTop: 8 }} />
          <label style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 12, color: CHROME_RENK.ink }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Hekim gördü ve eylemi yazdı
          </label>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: riskEylem, hekimOnay: riskOnay }, 'Acil bayrak kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...etiket, marginTop: 12 }}>Kontrol listesi</div>
          {v.kutuphane.acilListesi.map((x) => <div key={x} style={kucuk}>• {x}</div>)}
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
