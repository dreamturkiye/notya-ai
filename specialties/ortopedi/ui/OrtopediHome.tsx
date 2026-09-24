'use client'
/**
 * ORTOPEDI-EXCEPTIONAL-01 — Ortopedi bölüm ana ekranı (hasta dosyası › Ortopedi).
 * Sticky şerit + sekmeler: Özet | VAS | Kırık/Alçı | Risk | Görevler.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import { skorla as vasSkorla, FONKSIYON_MADDELER } from '../engines/vasFonksiyon'
import type { OrtoSerit } from '../engines/serit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: OrtoSerit
  bolum: { nextKontrol: string | null }
  sonVas: { vas: number | null; bantAd: string; tarih: string } | null
  sonKirik: { tip: string; tarih: string; maddeler: { bolge?: string } | null } | null
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }>; gecmis: Array<{ id: string; tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  kutuphane: {
    vas: { maddeler: Array<{ id: string; ad: string }>; bantlar: Record<string, string> }
    tipAd: Record<string, string>
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#D97706'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#7A5B1E', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'VAS', 'Kırık/Alçı', 'Risk', 'Görevler'] as const
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

export default function OrtopediHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [vas, setVas] = useState('')
  const [maddeler, setMaddeler] = useState<string[]>(Array(4).fill(''))
  const [tip, setTip] = useState('alci')
  const [bolge, setBolge] = useState('Diz / bacak')
  const [taraf, setTaraf] = useState('Sağ')
  const [alciAlma, setAlciAlma] = useState('')
  const [yukVerme, setYukVerme] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/ortopedi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/ortopedi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) setV(await r.json())
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  const vasSonuc = useMemo(() => vasSkorla(vas === '' ? null : Number(vas), maddeler.map((x) => (x === '' ? null : Number(x)))), [vas, maddeler])

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Ortopedi yükleniyor…</div>

  const cevir = (liste: string[], x: string) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x])

  return (
    <div style={toolsCard} data-chapter="ortopedi">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(217,119,6,0.22)' : 'transparent', color: sekme === x ? '#7A5B1E' : CHROME_RENK.muted }}>{x}</button>
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
              ? <>Son VAS <b>{v.sonVas.vas ?? '—'}</b> ({String(v.sonVas.tarih).slice(0, 10)}) — {v.sonVas.bantAd}.</>
              : 'VAS kaydı yok — VAS sekmesinden girin.'}
          </div>
          <div style={metin}>
            {v.sonKirik
              ? <>Son izlem <b>{v.kutuphane.tipAd[v.sonKirik.tip] || v.sonKirik.tip}</b> ({String(v.sonKirik.tarih).slice(0, 10)}){v.sonKirik.maddeler?.bolge ? ` · ${v.sonKirik.maddeler.bolge}` : ''}.</>
              : 'Kırık/alçı kaydı yok — Kırık/Alçı sekmesinden girin.'}
          </div>
          <div style={{ ...etiket, marginTop: 12 }}>Kontrol tarihi <span style={kucuk}>· hasta portalında &quot;Kontrol randevusu&quot; olarak görünür</span></div>
          <div style={satir}>
            <input type="date" value={kontrolTarih || v.bolum.nextKontrol || ''} onChange={(e) => setKontrolTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kontrol', tarih: kontrolTarih || v.bolum.nextKontrol }, 'Kontrol tarihi kaydedildi.')}>Kaydet</button>
          </div>
          {v.serit.planTaslagi.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Plan taslağı <span style={kucuk}>· hekim onayıyla SOAP&apos;a kopyalanır</span></div>
              {v.serit.planTaslagi.map((p) => <div key={p} style={metin}>• {p}</div>)}
            </>
          )}
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.hekimKilidi}</div>
          <div style={kucuk}>{v.kutuphane.kapsam}</div>
        </div>
      )}

      {sekme === 'VAS' && (
        <div>
          <div style={etiket}>VAS 0–10 + fonksiyon 0–4 <span style={kucuk}>· şiddet karar desteği, tanı değil</span></div>
          <div style={satir}>
            <span style={metin}>VAS</span>
            <input type="number" min={0} max={10} value={vas} onChange={(e) => setVas(e.target.value)} style={{ ...toolsInput, width: 72 }} />
          </div>
          {FONKSIYON_MADDELER.map((m, i) => (
            <div key={m.id} style={{ ...satir, marginTop: 4 }}>
              <span style={{ ...metin, flex: '1 1 200px' }}>{m.ad}</span>
              <input type="number" min={0} max={4} value={maddeler[i]} onChange={(e) => setMaddeler(maddeler.map((x, j) => (j === i ? e.target.value : x)))} style={{ ...toolsInput, width: 64 }} />
            </div>
          ))}
          <div style={{ ...metin, marginTop: 8 }}>{vasSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 10 }} disabled={!vasSonuc.tamamMi} onClick={() => calistir({ adim: 'vas', vas: Number(vas), maddeler: maddeler.map(Number) }, 'VAS kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Kırık/Alçı' && (
        <div>
          <div style={etiket}>Kırık / alçı / ortez izlem <span style={kucuk}>· tanı yazılmaz</span></div>
          <div style={satir}>
            <select value={tip} onChange={(e) => setTip(e.target.value)} style={{ ...toolsInput, width: 140 }}>
              {Object.entries(v.kutuphane.tipAd).filter(([k]) => k !== 'op_sonrasi').map(([k, ad]) => <option key={k} value={k}>{ad}</option>)}
            </select>
            <input value={bolge} onChange={(e) => setBolge(e.target.value)} placeholder="Bölge" style={{ ...toolsInput, width: 140 }} />
            <input value={taraf} onChange={(e) => setTaraf(e.target.value)} placeholder="Taraf" style={{ ...toolsInput, width: 80 }} />
          </div>
          <div style={satir}>
            <input type="date" value={alciAlma} onChange={(e) => setAlciAlma(e.target.value)} title="Alçı alma" style={{ ...toolsInput, width: 150 }} />
            <input type="date" value={yukVerme} onChange={(e) => setYukVerme(e.target.value)} title="Yük verme" style={{ ...toolsInput, width: 150 }} />
          </div>
          <button type="button" style={{ ...btn, marginTop: 10 }} onClick={() => calistir({
            adim: 'kirik_alci', tip, bolge, taraf, alciAlma: alciAlma || null, yukVerme: yukVerme || null, nvDurum: 'NV tam — his/güç/nabız normal',
          }, 'İzlem kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Risk' && (
        <div>
          <div style={etiket}>Kırmızı bayrak <span style={kucuk}>· açık bayrakta hekim onayı zorunlu (409)</span></div>
          {v.kutuphane.acilKodlari.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '3px 0' }}>
              <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={() => setRiskKodlari(cevir(riskKodlari, k.kod))} />
              {k.ad}
            </label>
          ))}
          <textarea value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Hekim eylemi" style={{ ...toolsInput, width: '100%', minHeight: 60, marginTop: 8 }} />
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Hekim gördü ve eylemi yazdı
          </label>
          <button type="button" style={{ ...btn, marginTop: 10 }} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: riskEylem, hekimOnay: riskOnay }, 'Risk kaydedildi.')}>Kaydet</button>
          <div style={{ ...kucuk, marginTop: 8 }}>{v.kutuphane.acilYonlendirme}</div>
        </div>
      )}

      {sekme === 'Görevler' && (
        <div>
          <div style={etiket}>Açık görevler</div>
          {!v.gorevler.length && <div style={kucuk}>Açık görev yok.</div>}
          {v.gorevler.map((g) => (
            <div key={g.id} style={{ ...satir, justifyContent: 'space-between' }}>
              <span style={metin}>{g.ad}{g.due ? ` · ${String(g.due).slice(0, 10)}` : ''}</span>
              <button type="button" style={ghost} onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' }, 'Görev tamamlandı.')}>Tamamla</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
