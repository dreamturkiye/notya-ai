'use client'
/**
 * UROLOJI-EXCEPTIONAL-01 — Üroloji bölüm ana ekranı (hasta dosyası › Üroloji).
 * Sticky şerit + sekmeler: Özet | IPSS | PSA | Risk | Görevler (kompakt).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import { skorla as ipssSkorla, IPSS_MADDELER } from '../engines/ipss'
import { skorla as psaSkorla } from '../engines/psa'
import type { UroSerit } from '../engines/serit'

type Veri = {
  serit: UroSerit
  bolum: { nextKontrol: string | null }
  sonIpss: { toplam: number | null; bantAd: string; tarih: string } | null
  sonPsa: { deger_ng_ml: number | null; bantAd: string; tarih: string } | null
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }>; gecmis: Array<{ id: string; tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  kutuphane: {
    ipss: { maddeler: Array<{ id: string; ad: string }>; bantlar: Record<string, string> }
    psa: { bantlar: Record<string, string> }
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#0D9488'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#99F6E4', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'IPSS', 'PSA', 'Risk', 'Görevler'] as const
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

export default function UrolojiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [maddeler, setMaddeler] = useState<string[]>(Array(7).fill(''))
  const [qol, setQol] = useState('')
  const [psaDeger, setPsaDeger] = useState('')
  const [psaOnceki, setPsaOnceki] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/uroloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/uroloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) setV(await r.json())
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  const ipssSonuc = useMemo(() => ipssSkorla(maddeler.map((x) => (x === '' ? null : Number(x))), qol === '' ? null : Number(qol)), [maddeler, qol])
  const psaSonuc = useMemo(() => psaSkorla(psaDeger === '' ? null : Number(psaDeger), psaOnceki === '' ? [] : [{ tarih: '2000-01-01', deger: Number(psaOnceki) }]), [psaDeger, psaOnceki])

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Üroloji yükleniyor…</div>

  const cevir = (liste: string[], x: string) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x])

  return (
    <div style={toolsCard} data-chapter="uroloji">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(13,148,136,0.22)' : 'transparent', color: sekme === x ? '#99F6E4' : '#8FA0B5' }}>{x}</button>
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
            {v.sonIpss
              ? <>Son IPSS <b>{v.sonIpss.toplam ?? '—'}</b> ({String(v.sonIpss.tarih).slice(0, 10)}) — {v.sonIpss.bantAd}.</>
              : 'IPSS kaydı yok — IPSS sekmesinden girin.'}
          </div>
          <div style={metin}>
            {v.sonPsa
              ? <>Son PSA <b>{v.sonPsa.deger_ng_ml ?? '—'} ng/mL</b> ({String(v.sonPsa.tarih).slice(0, 10)}) — {v.sonPsa.bantAd}.</>
              : 'PSA kaydı yok — PSA sekmesinden girin.'}
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

      {sekme === 'IPSS' && (
        <div>
          <div style={etiket}>IPSS-7 (0–5 her madde) <span style={kucuk}>· şiddet karar desteği, tanı değil</span></div>
          {IPSS_MADDELER.map((m, i) => (
            <div key={m.id} style={{ ...satir, marginTop: 4 }}>
              <span style={{ ...metin, flex: '1 1 200px' }}>{m.ad}</span>
              <input type="number" min={0} max={5} value={maddeler[i]} onChange={(e) => setMaddeler(maddeler.map((x, j) => (j === i ? e.target.value : x)))} style={{ ...toolsInput, width: 64 }} />
            </div>
          ))}
          <div style={{ ...etiket, marginTop: 10 }}>Yaşam kalitesi (0–6, ayrı)</div>
          <input type="number" min={0} max={6} value={qol} onChange={(e) => setQol(e.target.value)} style={{ ...toolsInput, width: 80 }} />
          <div style={{ ...metin, marginTop: 8 }}>{ipssSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 10 }} disabled={!ipssSonuc.tamamMi} onClick={() => calistir({ adim: 'ipss', maddeler: maddeler.map(Number), qol: qol === '' ? null : Number(qol) }, 'IPSS kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'PSA' && (
        <div>
          <div style={etiket}>PSA ng/mL <span style={kucuk}>· izlem karar desteği, kanser tanısı değil</span></div>
          <div style={satir}>
            <input type="number" step="0.01" value={psaDeger} onChange={(e) => setPsaDeger(e.target.value)} placeholder="ng/mL" style={{ ...toolsInput, width: 120 }} />
            <input type="number" step="0.01" value={psaOnceki} onChange={(e) => setPsaOnceki(e.target.value)} placeholder="Önceki (opsiyonel)" style={{ ...toolsInput, width: 140 }} />
          </div>
          <div style={{ ...metin, marginTop: 8 }}>{psaSonuc.ozet}</div>
          <div style={kucuk}>{psaSonuc.hizNot}</div>
          <button type="button" style={{ ...btn, marginTop: 10 }} disabled={psaDeger === ''} onClick={() => calistir({
            adim: 'psa', deger: Number(psaDeger),
            oncekiler: psaOnceki === '' ? [] : [{ tarih: '2000-01-01', deger: Number(psaOnceki) }],
          }, 'PSA kaydedildi.')}>Kaydet</button>
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
