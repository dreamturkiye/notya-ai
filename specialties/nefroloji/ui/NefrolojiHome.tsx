'use client'
/**
 * NEFROLOJI-EXCEPTIONAL-01 + DEEPEN-01 — Nefroloji bölüm ana ekranı (hasta dosyası › Nefroloji).
 * Sticky şerit + sekmeler: Özet | eGFR/KDIGO | Diyaliz | Anemi | Acil | Görevler | SGK.
 * Kilitler: ESA dozu yazılmaz, tanı kilitlenmez, diyaliz HIS yok, açık bayrakta 409, T.C. yazılmaz.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import { egfrSkorla } from '../engines/egfr'
import { anemiSkorla } from '../engines/anemi'
import { nefRaporTaslagi, NEF_RAPOR_SABLONLARI, type NefRaporSablon } from '../engines/sgkRapor'
import type { NefSerit } from '../engines/serit'
import type { DiyalizModalite } from '../engines/diyaliz'
import { MODALITE_AD } from '../engines/diyaliz'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: NefSerit
  bolum: { nextKontrol: string | null; diyaliz: Record<string, unknown> | null }
  son: {
    egfr: { deger: number | null; g: string | null; a: string | null; renk: string | null; tarih: string } | null
    hb: { deger: number | null; bant: string | null; tarih: string } | null
    diyaliz: { tarih: string; modalite: string; sonraki_seans: string | null } | null
  }
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  sonrakiDiyaliz: string | null
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    anemiListesi?: string[]
    diyalizListesi?: string[]
    ilacUyariListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#06B6D4'
const btn: React.CSSProperties = { background: ACCENT, color: '#042F2E', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#67E8F9', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'eGFR/KDIGO', 'Diyaliz', 'Anemi', 'Acil', 'Görevler', 'SGK'] as const
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

export default function NefrolojiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [egfr, setEgfr] = useState('')
  const [uacr, setUacr] = useState('')
  const [hb, setHb] = useState('')
  const [ferritin, setFerritin] = useState('')
  const [modalite, setModalite] = useState<DiyalizModalite>('hd')
  const [seansTarih, setSeansTarih] = useState('')
  const [sonrakiSeans, setSonrakiSeans] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')
  const [raporSablon, setRaporSablon] = useState<NefRaporSablon>('kbh_izlem')
  const [raporIcd, setRaporIcd] = useState('')
  const [raporIcdAd, setRaporIcdAd] = useState('')
  const [raporNot, setRaporNot] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/nefroloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/nefroloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) setV(await r.json())
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  const egfrSonuc = useMemo(() => egfrSkorla(egfr === '' ? null : Number(egfr), uacr === '' ? null : Number(uacr)), [egfr, uacr])
  const anemiSonuc = useMemo(() => anemiSkorla(hb === '' ? null : Number(hb), ferritin === '' ? null : Number(ferritin)), [hb, ferritin])
  const raporOnizleme = useMemo(() => nefRaporTaslagi({
    sablon: raporSablon,
    hastaAdi: '',
    bugun: new Date().toISOString().slice(0, 10),
    tani: raporIcd ? { icd10: raporIcd, aciklama: raporIcdAd || raporIcd } : null,
    hekimDegerlendirmesi: raporNot,
  }), [raporSablon, raporIcd, raporIcdAd, raporNot])

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Nefroloji yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="nefroloji">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(6,182,212,0.22)' : 'transparent', color: sekme === x ? '#CFFAFE' : CHROME_RENK.muted }}>{x}</button>
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
            {v.son.egfr
              ? <>Son eGFR <b>{v.son.egfr.deger ?? '—'}</b> ({String(v.son.egfr.tarih).slice(0, 10)}) — {v.son.egfr.g}{v.son.egfr.a ? `×${v.son.egfr.a}` : ''} · {v.son.egfr.renk}. Bant karar desteğidir.</>
              : 'eGFR kaydı yok — eGFR/KDIGO sekmesinden girin.'}
          </div>
          {v.son.hb && (
            <div style={{ ...metin, marginTop: 6 }}>
              Son Hb <b>{v.son.hb.deger ?? '—'}</b> ({String(v.son.hb.tarih).slice(0, 10)}) — {v.son.hb.bant}. ESA dozu Notya yazılmaz.
            </div>
          )}
          {v.sonrakiDiyaliz && (
            <div style={{ ...metin, marginTop: 6 }}>Sonraki diyaliz seans: <b>{v.sonrakiDiyaliz}</b></div>
          )}
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
          <div style={{ ...etiket, marginTop: 12 }}>İlaç sınıfı checklist (doz yok)</div>
          {v.kutuphane.ilacUyariListesi.map((x) => <div key={x} style={kucuk}>☐ {x}</div>)}
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.hekimKilidi}</div>
          <div style={kucuk}>{v.kutuphane.kapsam}</div>
        </div>
      )}

      {sekme === 'eGFR/KDIGO' && (
        <div>
          <div style={etiket}>eGFR × UACR (doz yok)</div>
          <div style={satir}>
            <input type="number" step="0.1" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="eGFR" style={{ ...toolsInput, width: 100 }} />
            <input type="number" step="1" value={uacr} onChange={(e) => setUacr(e.target.value)} placeholder="UACR mg/g" style={{ ...toolsInput, width: 120 }} />
          </div>
          <div style={{ ...metin, marginTop: 8 }}>{egfrSonuc.ozet}</div>
          {egfrSonuc.plan.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {egfrSonuc.plan.map((p) => <div key={p} style={kucuk}>• {p}</div>)}
            </div>
          )}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'egfr', egfr: Number(egfr), uacr: uacr === '' ? null : Number(uacr), hekimKilit: true }, 'eGFR kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Diyaliz' && (
        <div>
          <div style={etiket}>Diyaliz seans (makine HIS yok)</div>
          <div style={satir}>
            {(Object.keys(MODALITE_AD) as DiyalizModalite[]).map((m) => (
              <button key={m} type="button" style={{ ...ghost, background: modalite === m ? 'rgba(6,182,212,0.22)' : 'transparent' }} onClick={() => setModalite(m)}>{MODALITE_AD[m]}</button>
            ))}
          </div>
          <div style={satir}>
            <input type="date" value={seansTarih} onChange={(e) => setSeansTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <input type="date" value={sonrakiSeans} onChange={(e) => setSonrakiSeans(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'diyaliz', modalite, tarih: seansTarih, sonrakiSeans: sonrakiSeans || null }, 'Diyaliz seans kaydedildi.')}>Kaydet</button>
          </div>
          {v.sonrakiDiyaliz && <div style={{ ...kucuk, marginTop: 8 }}>Sonraki seans: {v.sonrakiDiyaliz}</div>}
          {(v.kutuphane.diyalizListesi || []).length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Diyaliz kontrol listesi</div>
              {v.kutuphane.diyalizListesi!.map((x) => <div key={x} style={kucuk}>☐ {x}</div>)}
            </>
          )}
        </div>
      )}

      {sekme === 'Anemi' && (
        <div>
          <div style={etiket}>Anemi-CKD (ESA dozu yok)</div>
          <div style={satir}>
            <input type="number" step="0.1" value={hb} onChange={(e) => setHb(e.target.value)} placeholder="Hb g/dL" style={{ ...toolsInput, width: 100 }} />
            <input type="number" step="1" value={ferritin} onChange={(e) => setFerritin(e.target.value)} placeholder="Ferritin (isteğe bağlı)" style={{ ...toolsInput, width: 140 }} />
          </div>
          <div style={{ ...metin, marginTop: 8 }}>{anemiSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'anemi', hb: Number(hb), ferritin: ferritin === '' ? null : Number(ferritin), hekimKilit: true }, 'Anemi izlem kaydedildi.')}>Kaydet</button>
          {(v.kutuphane.anemiListesi || []).length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Anemi kontrol listesi</div>
              {v.kutuphane.anemiListesi!.map((x) => <div key={x} style={kucuk}>☐ {x}</div>)}
            </>
          )}
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
          <div style={{ ...etiket, marginTop: 12 }}>Acil kontrol listesi</div>
          {v.kutuphane.acilListesi.map((x) => <div key={x} style={kucuk}>☐ {x}</div>)}
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

      {sekme === 'SGK' && (
        <div>
          <div style={etiket}>SGK nefro rapor taslağı</div>
          <select value={raporSablon} onChange={(e) => setRaporSablon(e.target.value as NefRaporSablon)} style={toolsInput}>
            {NEF_RAPOR_SABLONLARI.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input placeholder="ICD-10" value={raporIcd} onChange={(e) => setRaporIcd(e.target.value)} style={{ ...toolsInput, width: 100 }} />
            <input placeholder="Tanı" value={raporIcdAd} onChange={(e) => setRaporIcdAd(e.target.value)} style={{ ...toolsInput, flex: 1 }} />
          </div>
          <textarea value={raporNot} onChange={(e) => setRaporNot(e.target.value)} rows={3} style={{ ...toolsInput, width: '100%', marginTop: 8 }} placeholder="Hekim değerlendirmesi" />
          <div style={{ ...kucuk, marginTop: 8 }}>
            Önizleme eksik: {raporOnizleme.eksikler.length} madde — T.C. yazılmaz; ESA dozu yok; Medula canlı yok.
          </div>
          {raporOnizleme.kontrolListesi.map((k) => (
            <div key={k.madde} style={kucuk}>☐ {k.madde}</div>
          ))}
        </div>
      )}
    </div>
  )
}
