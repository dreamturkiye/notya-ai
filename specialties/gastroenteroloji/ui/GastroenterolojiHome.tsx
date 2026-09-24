'use client'
/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Gastroenteroloji bölüm ana ekranı (hasta dosyası › Gastroenteroloji).
 * Sticky şerit + sekmeler: Özet | IBD/IBS | Endoskopi | Hepatit | Rejim | Acil | Görevler.
 * Kilitler: doz yazılmaz, tanı kilitlenmez, HIS yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import { skorHesapla, SKOR_TUR_ETIKET, type SkorTur } from '../engines/ibdIbs'
import type { GastroSerit } from '../engines/serit'
import { rejimNormalize, rejimOzeti } from '../engines/rejim'
import { ENDOSKOPI_TUR_ETIKET, type EndoskopiTur } from '../engines/endoskopi'
import { HEPATIT_TUR_ETIKET, type HepatitTur, type HepatitBant } from '../engines/hbvHcv'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: GastroSerit
  bolum: { nextKontrol: string | null; rejim: Record<string, unknown> | null }
  sonSkor: { deger: number | null; bant: string | null; tarih: string; tur: string } | null
  hepatitSonraki: string | null
  endoskopiSonraki: string | null
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

const ACCENT = '#F43F5E'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#FDA4AF', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'IBD/IBS', 'Endoskopi', 'Hepatit', 'Rejim', 'Acil', 'Görevler'] as const
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

export default function GastroenterolojiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [skorTur, setSkorTur] = useState<SkorTur>('mayo_kismi')
  const [skorDeger, setSkorDeger] = useState('')
  const [endoTur, setEndoTur] = useState<EndoskopiTur>('kolonoskopi')
  const [endoTarih, setEndoTarih] = useState('')
  const [hepTur, setHepTur] = useState<HepatitTur>('hbv')
  const [hepBant, setHepBant] = useState<HepatitBant>('aktif_izlem')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')
  const [rejimForm, setRejimForm] = useState({ ppiBaslangic: '', ppiKontrol: '', biyolojikBaslangic: '', biyolojikKontrol: '', not: '' })

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/gastroenteroloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/gastroenteroloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (j.bolum?.rejim) {
        const rjm = rejimNormalize(j.bolum.rejim)
        setRejimForm({
          ppiBaslangic: rjm.ppiBaslangic || '',
          ppiKontrol: rjm.ppiKontrol || '',
          biyolojikBaslangic: rjm.biyolojikBaslangic || '',
          biyolojikKontrol: rjm.biyolojikKontrol || '',
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

  const skorSonuc = useMemo(() => skorHesapla(skorTur, skorDeger === '' ? null : Number(skorDeger)), [skorTur, skorDeger])

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Gastroenteroloji yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="gastroenteroloji">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(244,63,94,0.22)' : 'transparent', color: sekme === x ? '#FFE4E6' : CHROME_RENK.muted }}>{x}</button>
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
            {v.sonSkor
              ? <>Son skor <b>{v.sonSkor.deger ?? '—'}</b> ({String(v.sonSkor.tarih).slice(0, 10)}) — {v.sonSkor.bant || '—'}. Bant karar desteğidir.</>
              : 'IBD/IBS skoru yok — IBD/IBS sekmesinden girin.'}
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

      {sekme === 'IBD/IBS' && (
        <div>
          <div style={etiket}>IBD / IBS skor (doz yok)</div>
          <div style={satir}>
            {(['mayo_kismi', 'hbi', 'ibs_sss'] as SkorTur[]).map((t) => (
              <button key={t} type="button" style={{ ...ghost, background: skorTur === t ? 'rgba(244,63,94,0.22)' : 'transparent' }} onClick={() => setSkorTur(t)}>{SKOR_TUR_ETIKET[t]}</button>
            ))}
          </div>
          <input type="number" step="1" value={skorDeger} onChange={(e) => setSkorDeger(e.target.value)} style={{ ...toolsInput, width: 120, marginTop: 8 }} />
          <div style={{ ...metin, marginTop: 8 }}>{skorSonuc.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'skor', tur: skorTur, skor: Number(skorDeger), hekimKilit: true }, 'Skor kaydedildi.')}>Kaydet</button>
        </div>
      )}

      {sekme === 'Endoskopi' && (
        <div>
          <div style={etiket}>Endoskopi belge köprüsü (HIS yok)</div>
          <div style={satir}>
            {(Object.keys(ENDOSKOPI_TUR_ETIKET) as EndoskopiTur[]).slice(0, 4).map((t) => (
              <button key={t} type="button" style={{ ...ghost, background: endoTur === t ? 'rgba(244,63,94,0.22)' : 'transparent' }} onClick={() => setEndoTur(t)}>{ENDOSKOPI_TUR_ETIKET[t]}</button>
            ))}
          </div>
          <div style={satir}>
            <input type="date" value={endoTarih} onChange={(e) => setEndoTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'endoskopi', tur: endoTur, tarih: endoTarih }, 'Endoskopi köprüsü kaydedildi.')}>Kaydet</button>
          </div>
          {v.endoskopiSonraki && <div style={{ ...kucuk, marginTop: 8 }}>Önerilen sonraki kontrol: {v.endoskopiSonraki}</div>}
        </div>
      )}

      {sekme === 'Hepatit' && (
        <div>
          <div style={etiket}>HBV / HCV izlem (antiviral doz yok)</div>
          <div style={satir}>
            {(['hbv', 'hcv'] as HepatitTur[]).map((t) => (
              <button key={t} type="button" style={{ ...ghost, background: hepTur === t ? 'rgba(244,63,94,0.22)' : 'transparent' }} onClick={() => setHepTur(t)}>{HEPATIT_TUR_ETIKET[t]}</button>
            ))}
          </div>
          <select value={hepBant} onChange={(e) => setHepBant(e.target.value as HepatitBant)} style={{ ...toolsInput, marginTop: 8 }}>
            <option value="stabil">Stabil izlem</option>
            <option value="aktif_izlem">Aktif izlem</option>
            <option value="tedavi_degerlendirme">Tedavi değerlendirme</option>
          </select>
          <button type="button" style={{ ...btn, marginTop: 8, display: 'block' }} onClick={() => calistir({ adim: 'hepatit', tur: hepTur, bant: hepBant, hekimKilit: true }, 'Hepatit izlem kaydedildi.')}>Kaydet</button>
          {v.hepatitSonraki && <div style={{ ...kucuk, marginTop: 8 }}>Önerilen sonraki izlem: {v.hepatitSonraki}</div>}
        </div>
      )}

      {sekme === 'Rejim' && (
        <div>
          <div style={etiket}>PPI / biyolojik rejim (yalnız tarihler)</div>
          <div style={satir}>
            <label style={kucuk}>PPI başlangıç<input type="date" value={rejimForm.ppiBaslangic} onChange={(e) => setRejimForm({ ...rejimForm, ppiBaslangic: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
            <label style={kucuk}>PPI kontrol<input type="date" value={rejimForm.ppiKontrol} onChange={(e) => setRejimForm({ ...rejimForm, ppiKontrol: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
          </div>
          <div style={satir}>
            <label style={kucuk}>Biyolojik başlangıç<input type="date" value={rejimForm.biyolojikBaslangic} onChange={(e) => setRejimForm({ ...rejimForm, biyolojikBaslangic: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
            <label style={kucuk}>Biyolojik kontrol<input type="date" value={rejimForm.biyolojikKontrol} onChange={(e) => setRejimForm({ ...rejimForm, biyolojikKontrol: e.target.value })} style={{ ...toolsInput, display: 'block' }} /></label>
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
