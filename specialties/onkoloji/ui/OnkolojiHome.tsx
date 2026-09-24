'use client'
/**
 * ONKOLOJI-EXCEPTIONAL-01 — Onkoloji bölüm ana ekranı (hasta dosyası › Onkoloji).
 * Sticky şerit + sekmeler: Özet | Kür | Toksisite | Görüntü | Acil | Görevler.
 * Kilitler: doz yazılmaz, tanı/evre kilitlenmez, Medula e-imza yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { OnkoSerit } from '../engines/serit'
import { kurNormalize } from '../engines/kur'
import { TOKSISITE_MADDELER, type ToksisiteKod } from '../engines/toksisite'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: OnkoSerit
  bolum: { nextKontrol: string | null; kur: Record<string, unknown> | null; toksisite: { secilen?: string[] } | null }
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

const ACCENT = '#DC2626'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: CHROME_RENK.warn, marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'Kür', 'Toksisite', 'Görüntü', 'Acil', 'Görevler'] as const
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

export default function OnkolojiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [kurForm, setKurForm] = useState({ protokolEtiket: '', mevcutKur: '1', toplamKur: '', sonKurTarihi: '', sonrakiKurTarihi: '' })
  const [toxSec, setToxSec] = useState<ToksisiteKod[]>([])
  const [toxDue, setToxDue] = useState('')
  const [goruntuTarih, setGoruntuTarih] = useState('')
  const [goruntuEtiket, setGoruntuEtiket] = useState('Görüntü / rapor kontrolü')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/onkoloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/onkoloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (j.bolum?.kur) {
        const k = kurNormalize(j.bolum.kur)
        setKurForm({
          protokolEtiket: k.protokolEtiket || '',
          mevcutKur: k.mevcutKur != null ? String(k.mevcutKur) : '1',
          toplamKur: k.toplamKur != null ? String(k.toplamKur) : '',
          sonKurTarihi: k.sonKurTarihi || '',
          sonrakiKurTarihi: k.sonrakiKurTarihi || '',
        })
      }
      if (Array.isArray(j.bolum?.toksisite?.secilen)) setToxSec(j.bolum.toksisite.secilen)
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Onkoloji yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="onkoloji">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(220,38,38,0.22)' : 'transparent', color: sekme === x ? '#FEE2E2' : CHROME_RENK.muted }}>{x}</button>
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
          <div style={metin}>Kür sayacı, toksisite listesi ve kontrol tarihleri karar desteğidir. Doz / evre / tanı hekimdedir.</div>
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

      {sekme === 'Kür' && (
        <div>
          <div style={etiket}>Tedavi döngü / kür (doz yok)</div>
          <input value={kurForm.protokolEtiket} onChange={(e) => setKurForm({ ...kurForm, protokolEtiket: e.target.value })} placeholder="Protokol etiketi" style={{ ...toolsInput, width: '100%' }} />
          <div style={satir}>
            <input type="number" value={kurForm.mevcutKur} onChange={(e) => setKurForm({ ...kurForm, mevcutKur: e.target.value })} placeholder="Mevcut" style={{ ...toolsInput, width: 90 }} />
            <input type="number" value={kurForm.toplamKur} onChange={(e) => setKurForm({ ...kurForm, toplamKur: e.target.value })} placeholder="Toplam" style={{ ...toolsInput, width: 90 }} />
            <input type="date" value={kurForm.sonKurTarihi} onChange={(e) => setKurForm({ ...kurForm, sonKurTarihi: e.target.value })} style={{ ...toolsInput, width: 150 }} />
            <input type="date" value={kurForm.sonrakiKurTarihi} onChange={(e) => setKurForm({ ...kurForm, sonrakiKurTarihi: e.target.value })} style={{ ...toolsInput, width: 150 }} />
            <button type="button" style={btn} onClick={() => calistir({
              adim: 'kur',
              kur: {
                protokolEtiket: kurForm.protokolEtiket || null,
                mevcutKur: kurForm.mevcutKur === '' ? null : Number(kurForm.mevcutKur),
                toplamKur: kurForm.toplamKur === '' ? null : Number(kurForm.toplamKur),
                sonKurTarihi: kurForm.sonKurTarihi || null,
                sonrakiKurTarihi: kurForm.sonrakiKurTarihi || null,
              },
              hekimKilit: true,
            }, 'Kür kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Toksisite' && (
        <div>
          <div style={etiket}>Toksisite kontrol listesi</div>
          {TOKSISITE_MADDELER.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={toxSec.includes(m.kod)} onChange={() => setToxSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <div style={satir}>
            <input type="date" value={toxDue} onChange={(e) => setToxDue(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'toksisite', secilen: toxSec, due: toxDue || null }, 'Toksisite kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Görüntü' && (
        <div>
          <div style={etiket}>Görüntü / rapor zaman çizelgesi</div>
          <div style={satir}>
            <input value={goruntuEtiket} onChange={(e) => setGoruntuEtiket(e.target.value)} style={{ ...toolsInput, width: 220 }} />
            <input type="date" value={goruntuTarih} onChange={(e) => setGoruntuTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'goruntu', tarih: goruntuTarih, etiket: goruntuEtiket }, 'Görüntü tarihi kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>Tanı yazılmaz — yalnız hekimin belirlediği kontrol tarihi.</div>
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
