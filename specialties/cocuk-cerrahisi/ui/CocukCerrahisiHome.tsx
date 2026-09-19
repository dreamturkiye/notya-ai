'use client'
/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Hasta dosyası › Çocuk Cerrahisi.
 * Sekmeler: Özet | Pre/Post-op | Yara/Dren | Onam/Veli | Acil | Görevler.
 * Pediatri büyüme/Neyzi/Hedef Boy YOK.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { CcSerit } from '../engines/serit'
import { PREOP_MADDELER, POSTOP_MADDELER, type PrepostMaddeId, type PrepostTip } from '../engines/prepost'
import { onamMaddeleri, type OnamKod } from '../engines/onam'

type Veri = {
  serit: CcSerit
  bolum: { nextKontrol: string | null; prepost: Record<string, unknown> | null; yara: Record<string, unknown> | null; onam: Record<string, unknown> | null }
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#0891B2'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#67E8F9', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'Pre/Post-op', 'Yara/Dren', 'Onam/Veli', 'Acil', 'Görevler'] as const
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

export default function CocukCerrahisiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [tip, setTip] = useState<PrepostTip>('preop')
  const [etiketAmeliyat, setEtiketAmeliyat] = useState('')
  const [ameliyatTarihi, setAmeliyatTarihi] = useState('')
  const [prepostTamam, setPrepostTamam] = useState<PrepostMaddeId[]>([])
  const [yaraTip, setYaraTip] = useState('yara')
  const [yaraBolge, setYaraBolge] = useState('')
  const [yaraTarih, setYaraTarih] = useState('')
  const [yaraSonraki, setYaraSonraki] = useState('')
  const [yas, setYas] = useState('8')
  const [onamSec, setOnamSec] = useState<OnamKod[]>([])
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/cocuk-cerrahisi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/cocuk-cerrahisi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      const p = j.bolum?.prepost
      if (p) {
        setTip(p.tip === 'postop' ? 'postop' : 'preop')
        setEtiketAmeliyat(String(p.planlananAmeliyatEtiket || ''))
        setAmeliyatTarihi(String(p.ameliyatTarihi || ''))
        if (Array.isArray(p.tamamlanan)) setPrepostTamam(p.tamamlanan)
      }
      const o = j.bolum?.onam
      if (o?.yasYil != null) setYas(String(o.yasYil))
      if (Array.isArray(o?.secilen)) setOnamSec(o.secilen)
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  const maddeler = tip === 'preop' ? PREOP_MADDELER : POSTOP_MADDELER
  const onamListe = onamMaddeleri(yas === '' ? null : Number(yas))

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Çocuk Cerrahisi yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="cocuk-cerrahisi">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(8,145,178,0.22)' : 'transparent', color: sekme === x ? '#CFFAFE' : '#8FA0B5' }}>{x}</button>
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
          <div style={metin}>Pre/post-op, yara/dren ve onam/veli checklist karar desteğidir. Tanı / doz / OR hekimdedir. Pediatri Neyzi/Hedef Boy yok.</div>
          <div style={{ ...etiket, marginTop: 12 }}>Kontrol tarihi <span style={kucuk}>· portalda &quot;Çocuğumun Cerrahisi&quot;</span></div>
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

      {sekme === 'Pre/Post-op' && (
        <div>
          <div style={etiket}>Pre/post-op checklist</div>
          <div style={satir}>
            {(['preop', 'postop'] as PrepostTip[]).map((x) => (
              <button key={x} type="button" onClick={() => { setTip(x); setPrepostTamam([]) }} style={{ ...ghost, background: tip === x ? 'rgba(8,145,178,0.25)' : 'transparent' }}>
                {x === 'preop' ? 'Pre-op' : 'Post-op'}
              </button>
            ))}
          </div>
          <input value={etiketAmeliyat} onChange={(e) => setEtiketAmeliyat(e.target.value)} placeholder="İşlem etiketi (tanı yok)" style={{ ...toolsInput, width: '100%', marginTop: 8 }} />
          <div style={satir}>
            <input type="date" value={ameliyatTarihi} onChange={(e) => setAmeliyatTarihi(e.target.value)} style={{ ...toolsInput, width: 160 }} />
          </div>
          {maddeler.map((m) => (
            <label key={m.id} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={prepostTamam.includes(m.id)} onChange={() => setPrepostTamam((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))} />
              {m.ad}
            </label>
          ))}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({
            adim: 'prepost',
            prepost: { tip, planlananAmeliyatEtiket: etiketAmeliyat || null, ameliyatTarihi: ameliyatTarihi || null, tamamlanan: prepostTamam },
            hekimKilit: true,
          }, 'Pre/post-op kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Yara/Dren' && (
        <div>
          <div style={etiket}>Yara / dren (pediatrik ofis)</div>
          <div style={satir}>
            <select value={yaraTip} onChange={(e) => setYaraTip(e.target.value)} style={{ ...toolsInput, width: 160 }}>
              <option value="yara">Yara</option>
              <option value="dren">Dren</option>
              <option value="dikis">Dikiş</option>
              <option value="taburcu_kontrol">Taburcu kontrol</option>
            </select>
            <input value={yaraBolge} onChange={(e) => setYaraBolge(e.target.value)} placeholder="Bölge" style={{ ...toolsInput, width: 140 }} />
            <input type="date" value={yaraTarih} onChange={(e) => setYaraTarih(e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <input type="date" value={yaraSonraki} onChange={(e) => setYaraSonraki(e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <button type="button" style={btn} onClick={() => calistir({
              adim: 'yara',
              yara: { tip: yaraTip, bolge: yaraBolge || null, tarih: yaraTarih, sonrakiKontrol: yaraSonraki || null },
              hekimKilit: true,
            }, 'Yara/dren kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Onam/Veli' && (
        <div>
          <div style={etiket}>Onam / veli checklist (yaş kapılı)</div>
          <div style={satir}>
            <input type="number" min={0} max={120} value={yas} onChange={(e) => { setYas(e.target.value); setOnamSec([]) }} style={{ ...toolsInput, width: 80 }} />
            <span style={kucuk}>yaş (yıl)</span>
          </div>
          {onamListe.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={onamSec.includes(m.kod)} onChange={() => setOnamSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({
            adim: 'onam', secilen: onamSec, yasYil: yas === '' ? null : Number(yas), hekimKilit: true,
          }, 'Onam checklist kaydedildi.')}>Kaydet</button>
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
