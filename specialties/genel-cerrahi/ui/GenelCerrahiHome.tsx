'use client'
/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Genel Cerrahi bölüm ana ekranı (hasta dosyası › Genel Cerrahi).
 * Sticky şerit + sekmeler: Özet | Pre-op | Yara/Dren | Patoloji | Acil | Görevler.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { GcSerit } from '../engines/serit'
import { PREOP_MADDELER, type PreopMaddeId } from '../engines/preop'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: GcSerit
  bolum: { nextKontrol: string | null; preop: Record<string, unknown> | null; yara: Record<string, unknown> | null; patoloji: Record<string, unknown> | null }
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>
    preopMaddeler: Array<{ id: string; ad: string }>
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#EF4444'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: CHROME_RENK.warn, marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'Pre-op', 'Yara/Dren', 'Patoloji', 'Acil', 'Görevler'] as const
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

export default function GenelCerrahiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [etiketAmeliyat, setEtiketAmeliyat] = useState('')
  const [ameliyatTarihi, setAmeliyatTarihi] = useState('')
  const [preopTamam, setPreopTamam] = useState<PreopMaddeId[]>([])
  const [yaraTip, setYaraTip] = useState('yara')
  const [yaraBolge, setYaraBolge] = useState('')
  const [yaraTarih, setYaraTarih] = useState('')
  const [yaraSonraki, setYaraSonraki] = useState('')
  const [patDurum, setPatDurum] = useState('bekleniyor')
  const [patEtiket, setPatEtiket] = useState('')
  const [patRapor, setPatRapor] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/genel-cerrahi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/genel-cerrahi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      const p = j.bolum?.preop
      if (p) {
        setEtiketAmeliyat(String(p.planlananAmeliyatEtiket || ''))
        setAmeliyatTarihi(String(p.ameliyatTarihi || ''))
        if (Array.isArray(p.tamamlanan)) setPreopTamam(p.tamamlanan)
      }
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Genel Cerrahi yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="genel-cerrahi">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(239,68,68,0.22)' : 'transparent', color: sekme === x ? '#FEE2E2' : CHROME_RENK.muted }}>{x}</button>
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
          <div style={metin}>Pre-op, yara/dren ve patoloji köprüsü karar desteğidir. Tanı / doz / OR scheduling hekimdedir.</div>
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
          <div style={etiket}>Pre-op checklist (doz / OR slot yok)</div>
          <input value={etiketAmeliyat} onChange={(e) => setEtiketAmeliyat(e.target.value)} placeholder="İşlem etiketi (tanı yok)" style={{ ...toolsInput, width: '100%' }} />
          <div style={satir}>
            <input type="date" value={ameliyatTarihi} onChange={(e) => setAmeliyatTarihi(e.target.value)} style={{ ...toolsInput, width: 160 }} />
          </div>
          {PREOP_MADDELER.map((m) => (
            <label key={m.id} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={preopTamam.includes(m.id)} onChange={() => setPreopTamam((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))} />
              {m.ad}
            </label>
          ))}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({
            adim: 'preop',
            preop: { planlananAmeliyatEtiket: etiketAmeliyat || null, ameliyatTarihi: ameliyatTarihi || null, tamamlanan: preopTamam },
            hekimKilit: true,
          }, 'Pre-op kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Yara/Dren' && (
        <div>
          <div style={etiket}>Yara / dren izlem</div>
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

      {sekme === 'Patoloji' && (
        <div>
          <div style={etiket}>Patoloji belge köprüsü (tanı yazılmaz)</div>
          <div style={satir}>
            <input value={patEtiket} onChange={(e) => setPatEtiket(e.target.value)} placeholder="Etiket" style={{ ...toolsInput, width: 180 }} />
            <select value={patDurum} onChange={(e) => setPatDurum(e.target.value)} style={{ ...toolsInput, width: 140 }}>
              <option value="bekleniyor">Bekleniyor</option>
              <option value="geldi">Geldi</option>
              <option value="hekim_gordü">Hekim gördü</option>
            </select>
            <input type="date" value={patRapor} onChange={(e) => setPatRapor(e.target.value)} style={{ ...toolsInput, width: 150 }} />
            <button type="button" style={btn} onClick={() => calistir({
              adim: 'patoloji',
              patoloji: { etiket: patEtiket || null, durum: patDurum, raporTarihi: patRapor || null },
              hekimKilit: true,
            }, 'Patoloji takibi kaydedildi.')}>Kaydet</button>
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
