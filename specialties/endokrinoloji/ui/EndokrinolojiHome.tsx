'use client'
/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrinoloji bölüm ana ekranı (hasta dosyası › Endokrinoloji).
 * Sticky şerit + sekmeler: Özet | Lab izlem | DXA | Rejim | Acil | Görevler.
 * Kilitler: doz yazılmaz, tanı kilitlenmez, CGM yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import { labSkorla, LAB_TUR_ETIKET, type LabTur } from '../engines/labIzlem'
import type { EndoSerit } from '../engines/serit'
import { rejimNormalize, rejimOzeti } from '../engines/rejim'
import type { DxaRisk } from '../engines/dxa'

type Veri = {
  serit: EndoSerit
  bolum: { nextKontrol: string | null; rejim: Record<string, unknown> | null }
  sonLab: { hba1c: { deger: number | null; bant: string | null; tarih: string } | null; tsh: { deger: number | null; bant: string | null; tarih: string } | null }
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  dxaSonraki: string | null
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#A855F7'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#D8B4FE', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'Lab izlem', 'DXA', 'Rejim', 'Acil', 'Görevler'] as const
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

export default function EndokrinolojiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [labTur, setLabTur] = useState<LabTur>('hba1c')
  const [labDeger, setLabDeger] = useState('')
  const [dxaTarih, setDxaTarih] = useState('')
  const [dxaRisk, setDxaRisk] = useState<DxaRisk>('orta')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')
  const [rejimForm, setRejimForm] = useState({ insulinBaslangic: '', insulinKontrol: '', tiroidBaslangic: '', tiroidKontrol: '', not: '' })

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/endokrinoloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/endokrinoloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (j.bolum?.rejim) {
        const rjm = rejimNormalize(j.bolum.rejim)
        setRejimForm({
          insulinBaslangic: rjm.insulinBaslangic || '',
          insulinKontrol: rjm.insulinKontrol || '',
          tiroidBaslangic: rjm.tiroidBaslangic || '',
          tiroidKontrol: rjm.tiroidKontrol || '',
          not: rjm.not || '',
        })
      }
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  const labSonuc = useMemo(() => labSkorla(labTur, labDeger === '' ? null : Number(labDeger)), [labTur, labDeger])

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Endokrinoloji yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="endokrinoloji">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(168,85,247,0.22)' : 'transparent', color: sekme === x ? '#F3E8FF' : '#8FA0B5' }}>{x}</button>
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
            {v.sonLab.hba1c
              ? <>Son HbA1c <b>{v.sonLab.hba1c.deger ?? '—'}</b> ({String(v.sonLab.hba1c.tarih).slice(0, 10)}) — {v.sonLab.hba1c.bant || '—'}. Bant karar desteğidir.</>
              : 'HbA1c kaydı yok — Lab izlem sekmesinden girin.'}
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

      {sekme === 'Lab izlem' && (
        <div>
          <div style={etiket}>HbA1c / TSH (doz yok)</div>
          <div style={satir}>
            {(['hba1c', 'tsh', 'ft4'] as LabTur[]).map((t) => (
              <button key={t} type="button" style={{ ...ghost, background: labTur === t ? 'rgba(168,85,247,0.22)' : 'transparent' }} onClick={() => setLabTur(t)}>{LAB_TUR_ETIKET[t]}</button>
            ))}
          </div>
          <input type="number" step="0.01" value={labDeger} onChange={(e) => setLabDeger(e.target.value)} style={{ ...toolsInput, width: 120, marginTop: 8 }} />
          <div style={{ ...metin, marginTop: 8 }}>{labSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'lab', tur: labTur, deger: Number(labDeger), hekimKilit: true }, 'Lab kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'DXA' && (
        <div>
          <div style={etiket}>Osteoporoz / DXA hatırlatma</div>
          <div style={satir}>
            <input type="date" value={dxaTarih} onChange={(e) => setDxaTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <select value={dxaRisk} onChange={(e) => setDxaRisk(e.target.value as DxaRisk)} style={toolsInput}>
              <option value="dusuk">Düşük risk</option>
              <option value="orta">Orta risk</option>
              <option value="yuksek">Yüksek risk</option>
              <option value="bilinmiyor">Bilinmiyor</option>
            </select>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'dxa', sonDxa: dxaTarih, risk: dxaRisk }, 'DXA planı kaydedildi.')}>Kaydet</button>
          </div>
          {v.dxaSonraki && <div style={{ ...kucuk, marginTop: 8 }}>Önerilen sonraki DXA: {v.dxaSonraki}</div>}
        </div>
      )}

      {sekme === 'Rejim' && (
        <div>
          <div style={etiket}>İnsülin / tiroid rejim (yalnız tarihler)</div>
          <div style={satir}>
            <label style={kucuk}>İnsülin başlangıç<input type="date" value={rejimForm.insulinBaslangic} onChange={(e) => setRejimForm({ ...rejimForm, insulinBaslangic: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
            <label style={kucuk}>İnsülin kontrol<input type="date" value={rejimForm.insulinKontrol} onChange={(e) => setRejimForm({ ...rejimForm, insulinKontrol: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
          </div>
          <div style={satir}>
            <label style={kucuk}>Tiroid başlangıç<input type="date" value={rejimForm.tiroidBaslangic} onChange={(e) => setRejimForm({ ...rejimForm, tiroidBaslangic: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
            <label style={kucuk}>Tiroid kontrol<input type="date" value={rejimForm.tiroidKontrol} onChange={(e) => setRejimForm({ ...rejimForm, tiroidKontrol: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
          </div>
          <pre style={{ ...metin, whiteSpace: 'pre-wrap', marginTop: 8 }}>{rejimOzeti(rejimNormalize(rejimForm))}</pre>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'rejim', rejim: rejimForm }, 'Rejim kartı kaydedildi.')}>Kaydet</button>
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
