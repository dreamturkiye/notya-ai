'use client'
/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik bölüm ana ekranı (hasta dosyası › Plastik).
 * Sticky şerit + sekmeler: Özet | Yara/Greft | Foto | Onam | Acil | Görevler.
 * Kilitler: doz yazılmaz, tanı kilitlenmez, OR/HIS yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { PlastikSerit } from '../engines/serit'
import { YARA_TIP_AD, type YaraTip } from '../engines/yara'
import { ONAM_MADDELER, type OnamKod } from '../engines/onam'
import { FOTO_ETIKET_ONERILERI } from '../engines/foto'

type Veri = {
  serit: PlastikSerit
  bolum: { nextKontrol: string | null; yara: Record<string, unknown> | null; foto: Record<string, unknown> | null }
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

const ACCENT = '#BE185D'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#F9A8D4', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'Yara/Greft', 'Foto', 'Onam', 'Acil', 'Görevler'] as const
type Sekme = (typeof SEKMELER)[number]
const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: '#64748B' }
const TIPLER = Object.keys(YARA_TIP_AD) as YaraTip[]

function Cip({ ad, deger, durum, alt }: { ad: string; deger: string; durum: string; alt?: string }) {
  return (
    <span style={{ border: `1px solid ${durum === 'kotu' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[durum] || '#EDF1F7', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#8FA0B5' }}>{ad} </span>{deger}
      {alt && <span style={{ color: '#64748B' }}> · {alt}</span>}
    </span>
  )
}

export default function PlastikHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [yaraForm, setYaraForm] = useState({ tip: 'yara' as YaraTip, bolge: '', taraf: '', islemTarihi: '', pansumanTarihi: '', dikisAlmaTarihi: '' })
  const [fotoForm, setFotoForm] = useState({ tarih: '', etiket: 'Kontrol foto', sonrakiKontrol: '' })
  const [onamSec, setOnamSec] = useState<OnamKod[]>([])
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/plastik-cerrahi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/plastik-cerrahi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (j.bolum?.yara) {
        const y = j.bolum.yara as Record<string, string>
        setYaraForm({
          tip: (y.tip as YaraTip) || 'yara',
          bolge: y.bolge || '',
          taraf: y.taraf || '',
          islemTarihi: y.islemTarihi || '',
          pansumanTarihi: y.pansumanTarihi || '',
          dikisAlmaTarihi: y.dikisAlmaTarihi || '',
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

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Plastik yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="plastik-cerrahi">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(190,24,93,0.22)' : 'transparent', color: sekme === x ? '#FCE7F3' : '#8FA0B5' }}>{x}</button>
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
          <div style={metin}>Yara/greft, foto çizgisi ve onam checklist karar desteğidir. Tanı / doz / OR hekimdedir.</div>
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

      {sekme === 'Yara/Greft' && (
        <div>
          <div style={etiket}>Yara / greft / flep izlem (tanı yok)</div>
          <div style={satir}>
            {TIPLER.map((t) => (
              <button key={t} type="button" style={{ ...ghost, background: yaraForm.tip === t ? 'rgba(190,24,93,0.22)' : 'transparent' }} onClick={() => setYaraForm({ ...yaraForm, tip: t })}>{YARA_TIP_AD[t]}</button>
            ))}
          </div>
          <input value={yaraForm.bolge} onChange={(e) => setYaraForm({ ...yaraForm, bolge: e.target.value })} placeholder="Bölge" style={{ ...toolsInput, width: '100%', marginTop: 8 }} />
          <div style={satir}>
            <input value={yaraForm.taraf} onChange={(e) => setYaraForm({ ...yaraForm, taraf: e.target.value })} placeholder="Taraf" style={{ ...toolsInput, width: 100 }} />
            <input type="date" value={yaraForm.islemTarihi} onChange={(e) => setYaraForm({ ...yaraForm, islemTarihi: e.target.value })} style={{ ...toolsInput, width: 150 }} />
            <input type="date" value={yaraForm.pansumanTarihi} onChange={(e) => setYaraForm({ ...yaraForm, pansumanTarihi: e.target.value })} style={{ ...toolsInput, width: 150 }} />
            <input type="date" value={yaraForm.dikisAlmaTarihi} onChange={(e) => setYaraForm({ ...yaraForm, dikisAlmaTarihi: e.target.value })} style={{ ...toolsInput, width: 150 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'yara', yara: yaraForm, hekimKilit: true }, 'Yara/greft kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Foto' && (
        <div>
          <div style={etiket}>Foto zaman çizgisi</div>
          <div style={satir}>
            {FOTO_ETIKET_ONERILERI.slice(0, 3).map((e) => (
              <button key={e} type="button" style={ghost} onClick={() => setFotoForm({ ...fotoForm, etiket: e })}>{e}</button>
            ))}
          </div>
          <div style={satir}>
            <input value={fotoForm.etiket} onChange={(e) => setFotoForm({ ...fotoForm, etiket: e.target.value })} style={{ ...toolsInput, width: 220 }} />
            <input type="date" value={fotoForm.tarih} onChange={(e) => setFotoForm({ ...fotoForm, tarih: e.target.value })} style={{ ...toolsInput, width: 160 }} />
            <input type="date" value={fotoForm.sonrakiKontrol} onChange={(e) => setFotoForm({ ...fotoForm, sonrakiKontrol: e.target.value })} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'foto', foto: fotoForm, hekimKilit: true }, 'Foto çizgisi kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>AI tanı / PASI yazılmaz — yalnız hekimin belirlediği tarih+etiket.</div>
        </div>
      )}

      {sekme === 'Onam' && (
        <div>
          <div style={etiket}>Onam taslağı checklist</div>
          {ONAM_MADDELER.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={onamSec.includes(m.kod)} onChange={() => setOnamSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'onam', secilen: onamSec }, 'Onam checklist kaydedildi.')}>Kaydet</button>
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
