'use client'
/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Spor Hekimliği bölüm ana ekranı (hasta dosyası › Spor Hekimliği).
 * Sticky şerit + sekmeler: Özet | RTP | Sakatlık | Risk | Görevler.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { SporSerit } from '../engines/serit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Veri = {
  serit: SporSerit
  bolum: { nextKontrol: string | null; sporDali: string | null }
  sonRtp: { basamak: number | null; basamakAd: string; tarih: string } | null
  sonSakatlik: { bolge: string; mekanizma: string | null; siddet_bant: string | null; durum: string; yuklenme_uyari: boolean; tarih: string; siddetAd: string } | null
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }>; gecmis: Array<{ id: string; tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean }> }
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>
  kutuphane: {
    rtp: { basamaklar: Array<{ basamak: number; ad: string }>; adlar: Record<string, string> }
    sakatlik: { bolgeler: string[]; mekanizmalar: string[]; siddetler: Record<string, string> }
    acilKodlari: Array<{ kod: string; ad: string }>
    acilListesi: string[]
    hekimKilidi: string
    acilYonlendirme: string
    kapsam: string
  }
}

const ACCENT = '#B45309'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted, lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'RTP', 'Sakatlık', 'Risk', 'Görevler'] as const
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

export default function SporHekimligiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [basamak, setBasamak] = useState('0')
  const [bolge, setBolge] = useState('Diz')
  const [mekanizma, setMekanizma] = useState('Temas / darbe')
  const [siddet, setSiddet] = useState('orta')
  const [sakatDurum, setSakatDurum] = useState('aktif')
  const [dakika7, setDakika7] = useState('')
  const [dakikaOnce, setDakikaOnce] = useState('')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/spor-hekimligi', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/spor-hekimligi?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) setV(await r.json())
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Spor Hekimliği yükleniyor…</div>

  const cevir = (liste: string[], x: string) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x])

  return (
    <div style={toolsCard} data-chapter="spor-hekimligi">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(180,83,9,0.22)' : 'transparent', color: sekme === x ? '#FCD34D' : CHROME_RENK.muted }}>{x}</button>
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
            {v.sonRtp
              ? <>Son RTP basamak <b>{v.sonRtp.basamak ?? '—'}</b> ({String(v.sonRtp.tarih).slice(0, 10)}) — {v.sonRtp.basamakAd}.</>
              : 'RTP kaydı yok — RTP sekmesinden girin.'}
          </div>
          <div style={metin}>
            {v.sonSakatlik
              ? <>Son sakatlık <b>{v.sonSakatlik.bolge}</b> ({String(v.sonSakatlik.tarih).slice(0, 10)}) — {v.sonSakatlik.siddetAd} · {v.sonSakatlik.durum}{v.sonSakatlik.yuklenme_uyari ? ' · yük uyarısı' : ''}.</>
              : 'Sakatlık kaydı yok — Sakatlık sekmesinden girin.'}
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

      {sekme === 'RTP' && (
        <div>
          <div style={etiket}>RTP basamağı (0–5) · karar desteği</div>
          <select value={basamak} onChange={(e) => setBasamak(e.target.value)} style={{ ...toolsInput, width: '100%', maxWidth: 420 }}>
            {v.kutuphane.rtp.basamaklar.map((b) => <option key={b.basamak} value={b.basamak}>{b.basamak} — {b.ad}</option>)}
          </select>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'rtp', basamak: Number(basamak) }, 'RTP kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>Basamak tanı değildir; spora dönüş kararı hekimindir.</div>
        </div>
      )}

      {sekme === 'Sakatlık' && (
        <div>
          <div style={etiket}>Sakatlık günlüğü</div>
          <div style={satir}>
            <select value={bolge} onChange={(e) => setBolge(e.target.value)} style={{ ...toolsInput, width: 160 }}>
              {v.kutuphane.sakatlik.bolgeler.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select value={mekanizma} onChange={(e) => setMekanizma(e.target.value)} style={{ ...toolsInput, width: 180 }}>
              {v.kutuphane.sakatlik.mekanizmalar.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select value={siddet} onChange={(e) => setSiddet(e.target.value)} style={{ ...toolsInput, width: 140 }}>
              {Object.entries(v.kutuphane.sakatlik.siddetler).map(([k, ad]) => <option key={k} value={k}>{ad}</option>)}
            </select>
            <select value={sakatDurum} onChange={(e) => setSakatDurum(e.target.value)} style={{ ...toolsInput, width: 120 }}>
              <option value="aktif">Aktif</option>
              <option value="iyilesiyor">İyileşiyor</option>
              <option value="kapandi">Kapandı</option>
            </select>
          </div>
          <div style={{ ...etiket, marginTop: 10 }}>Yüklenme (dk, isteğe bağlı)</div>
          <div style={satir}>
            <input type="number" placeholder="Son 7 gün" value={dakika7} onChange={(e) => setDakika7(e.target.value)} style={{ ...toolsInput, width: 100 }} />
            <input type="number" placeholder="Önceki haftalık ort." value={dakikaOnce} onChange={(e) => setDakikaOnce(e.target.value)} style={{ ...toolsInput, width: 140 }} />
            <button type="button" style={btn} onClick={() => calistir({
              adim: 'sakatlik', bolge, mekanizma, siddet, durum: sakatDurum,
              yuklenmeDakika7: dakika7 === '' ? null : Number(dakika7),
              yuklenmeDakikaOnceki: dakikaOnce === '' ? null : Number(dakikaOnce),
            }, 'Sakatlık kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Risk' && (
        <div>
          <div style={etiket}>Kırmızı bayraklar</div>
          {v.kutuphane.acilKodlari.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, marginBottom: 4 }}>
              <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={() => setRiskKodlari(cevir(riskKodlari, k.kod))} />
              {k.ad}
            </label>
          ))}
          <textarea value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Hekim eylemi" style={{ ...toolsInput, width: '100%', minHeight: 60, marginTop: 8 }} />
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Hekim gördü ve eylemi yazdı (zorunlu — hemen bayraklarda)
          </label>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: riskEylem, hekimOnay: riskOnay }, 'Risk kaydedildi.')}>Kaydet</button>
          </div>
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
