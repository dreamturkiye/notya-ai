'use client'
/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon bölüm ana ekranı (hasta dosyası › Enfeksiyon).
 * Sticky şerit + sekmeler: Özet | İzolasyon | ATB süre | Viral | Acil | Görevler.
 * Kilitler: doz yazılmaz, tanı kilitlenmez, hastane HIS yok, açık bayrakta 409.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { EnfSerit } from '../engines/serit'
import { IZOLASYON_TIP_AD, type IzolasyonTip } from '../engines/izolasyon'
import { VIRAL_TUR_ETIKET, type ViralTur } from '../engines/viralIzlem'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: EnfSerit
  bolum: { nextKontrol: string | null; atb: Record<string, unknown> | null }
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  atbBitis: string | null
  viralSonraki: string | null
  izolasyonBitis: string | null
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#0D9488'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: `1px solid ${CHROME_RENK.border}` }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'İzolasyon', 'ATB süre', 'Viral', 'Acil', 'Görevler'] as const
type Sekme = (typeof SEKMELER)[number]
const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: CHROME_RENK.muted }

function Cip({ ad, deger, durum, alt }: { ad: string; deger: string; durum: string; alt?: string }) {
  return (
    <span style={{ border: `1px solid ${durum === 'kotu' ? 'rgba(164,91,62,0.6)' : CHROME_RENK.border}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[durum] || CHROME_RENK.ink, whiteSpace: 'nowrap' }}>
      <span style={{ color: CHROME_RENK.muted }}>{ad} </span>{deger}
      {alt && <span style={{ color: CHROME_RENK.muted }}> · {alt}</span>}
    </span>
  )
}

export default function EnfeksiyonHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [izoTip, setIzoTip] = useState<IzolasyonTip>('temas')
  const [izoBas, setIzoBas] = useState('')
  const [izoBit, setIzoBit] = useState('')
  const [atbBas, setAtbBas] = useState('')
  const [atbSure, setAtbSure] = useState('7')
  const [viralTur, setViralTur] = useState<ViralTur>('hiv_viral')
  const [viralTarih, setViralTarih] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/enfeksiyon-hastaliklari', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/enfeksiyon-hastaliklari?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) setV(await r.json())
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, padding: 16, color: CHROME_RENK.muted }}>Enfeksiyon yükleniyor…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...toolsCard, padding: 12, position: 'sticky', top: 0, zIndex: 2 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {v.serit.chips.map((c) => <Cip key={c.ad} {...c} />)}
        </div>
        {v.serit.kirmizi.length > 0 && <div style={{ ...kucuk, color: '#F87171', marginTop: 8 }}>{v.serit.kirmizi.join(' · ')}</div>}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SEKMELER.map((s) => (
          <button key={s} type="button" onClick={() => setSekme(s)} style={sekme === s ? btn : ghost}>{s}</button>
        ))}
      </div>

      {mesaj && <div style={{ ...kucuk, color: mesaj.includes('Hata') || mesaj.includes('bayrak') ? '#F87171' : '#34D399' }}>{mesaj}</div>}
      {eklenenNot && <MuayeneFormunaDon notId={eklenenNot} />}

      {sekme === 'Özet' && (
        <div style={{ ...toolsCard, padding: 14 }}>
          <div style={etiket}>Kontrol tarihi</div>
          <div style={satir}>
            <input type="date" value={kontrolTarih || v.bolum.nextKontrol || ''} onChange={(e) => setKontrolTarih(e.target.value)} style={toolsInput} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kontrol', tarih: kontrolTarih || v.bolum.nextKontrol }, 'Kontrol kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.hekimKilidi}</div>
          <div style={{ ...kucuk, marginTop: 6 }}>{v.kutuphane.kapsam}</div>
          {v.serit.planTaslagi.length > 0 && (
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, ...metin }}>
              {v.serit.planTaslagi.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
        </div>
      )}

      {sekme === 'İzolasyon' && (
        <div style={{ ...toolsCard, padding: 14 }}>
          <div style={etiket}>İzolasyon tipi</div>
          <div style={satir}>
            {(Object.keys(IZOLASYON_TIP_AD) as IzolasyonTip[]).map((t) => (
              <button key={t} type="button" style={izoTip === t ? btn : ghost} onClick={() => setIzoTip(t)}>{IZOLASYON_TIP_AD[t]}</button>
            ))}
          </div>
          <div style={{ ...etiket, marginTop: 10 }}>Başlangıç / bitiş</div>
          <div style={satir}>
            <input type="date" value={izoBas} onChange={(e) => setIzoBas(e.target.value)} style={toolsInput} />
            <input type="date" value={izoBit} onChange={(e) => setIzoBit(e.target.value)} style={toolsInput} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'izolasyon', tip: izoTip, baslangic: izoBas, bitis: izoBit, hekimKilit: true })}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'ATB süre' && (
        <div style={{ ...toolsCard, padding: 14 }}>
          <div style={etiket}>Başlangıç · süre (gün) — doz yok</div>
          <div style={satir}>
            <input type="date" value={atbBas} onChange={(e) => setAtbBas(e.target.value)} style={toolsInput} />
            <input type="number" min={1} max={365} value={atbSure} onChange={(e) => setAtbSure(e.target.value)} style={{ ...toolsInput, width: 80 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'atb', baslangic: atbBas, sureGun: Number(atbSure), hekimKilit: true })}>Kaydet</button>
          </div>
          {v.atbBitis && <div style={{ ...kucuk, marginTop: 8 }}>Son ATB bitiş: {v.atbBitis}</div>}
        </div>
      )}

      {sekme === 'Viral' && (
        <div style={{ ...toolsCard, padding: 14 }}>
          <div style={etiket}>Viral izlem türü · son tarih</div>
          <div style={satir}>
            {(Object.keys(VIRAL_TUR_ETIKET) as ViralTur[]).slice(0, 4).map((t) => (
              <button key={t} type="button" style={viralTur === t ? btn : ghost} onClick={() => setViralTur(t)}>{VIRAL_TUR_ETIKET[t]}</button>
            ))}
          </div>
          <div style={satir}>
            <input type="date" value={viralTarih} onChange={(e) => setViralTarih(e.target.value)} style={toolsInput} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'viral', tur: viralTur, sonTarih: viralTarih, hekimKilit: true })}>Kaydet</button>
          </div>
          {v.viralSonraki && <div style={{ ...kucuk, marginTop: 8 }}>Sonraki izlem: {v.viralSonraki}</div>}
        </div>
      )}

      {sekme === 'Acil' && (
        <div style={{ ...toolsCard, padding: 14 }}>
          <div style={etiket}>Kırmızı bayraklar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {v.kutuphane.acilKodlari.map((k) => (
              <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={riskKodlari.includes(k.kod)}
                  onChange={() => setRiskKodlari((p) => p.includes(k.kod) ? p.filter((x) => x !== k.kod) : [...p, k.kod])} />
                {k.ad}
              </label>
            ))}
          </div>
          <textarea value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Hekim eylemi" rows={2} style={{ ...toolsInput, marginTop: 8 }} />
          <label style={{ ...kucuk, display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Hekim gördü ve eylemi yazdı
          </label>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: riskEylem, hekimOnay: riskOnay })}>Kaydet</button>
          <div style={{ ...kucuk, marginTop: 8, color: '#FBBF24' }}>{v.kutuphane.acilYonlendirme}</div>
        </div>
      )}

      {sekme === 'Görevler' && (
        <div style={{ ...toolsCard, padding: 14 }}>
          {(v.gorevler || []).length === 0 && <div style={kucuk}>Açık görev yok.</div>}
          {(v.gorevler || []).map((g) => (
            <div key={g.id} style={{ ...satir, justifyContent: 'space-between', borderBottom: `1px solid ${CHROME_RENK.border}`, padding: '8px 0' }}>
              <div>
                <div style={metin}>{g.ad}</div>
                <div style={kucuk}>{g.due || '—'} · {g.kod}</div>
              </div>
              <button type="button" style={ghost} onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' }, 'Tamamlandı.')}>Tamam</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
