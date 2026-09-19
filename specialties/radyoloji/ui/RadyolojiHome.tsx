'use client'
/**
 * RADYOLOJI-EXCEPTIONAL-01 — Radyoloji bölüm ana ekranı.
 * Sticky şerit + sekmeler: Özet | Kuyruk | Rapor | Kritik | Belge | Acil | Görevler.
 * Kilitler: AI tanı yok, uydurma bulgu yok, PACS/RIS/HIS yok, kritikte 409.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi'
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon'
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu'
import type { RadyoSerit } from '../engines/serit'
import { RADYO_MODALITELER, RADYO_ONCELIKLER, RADYO_DURUMLAR, type RadyoModalite, type RadyoOncelik, type RadyoDurum } from '../engines/kuyruk'
import { BIRADS_KATEGORILER, RAPOR_SABLON, type BiradsKategori, type RaporSablonKod } from '../engines/rapor'
import { KRITIK_BAYRAKLAR, BILDIRIM_MADDELER, type KritikBayrak, type BildirimMadde } from '../engines/kritik'

type Veri = {
  serit: RadyoSerit
  bolum: { nextKontrol: string | null; kuyruk: unknown; rapor: { kategori?: string; secilen?: string[] } | null; kritik: { bayraklar?: string[] } | null; notes: unknown }
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

const ACCENT = '#0D9488'
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#5EEAD4', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 }
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }

const SEKMELER = ['Özet', 'Kuyruk', 'Rapor', 'Kritik', 'Belge', 'Acil', 'Görevler'] as const
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

export default function RadyolojiHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null)
  const [sekme, setSekme] = useState<Sekme>('Özet')
  const [mesaj, setMesaj] = useState('')
  const [eklenenNot, setEklenenNot] = useState<string | null>(null)
  const [modalite, setModalite] = useState<RadyoModalite>('xray')
  const [oncelik, setOncelik] = useState<RadyoOncelik>('rutin')
  const [durum, setDurum] = useState<RadyoDurum>('bekliyor')
  const [kuyrukTarih, setKuyrukTarih] = useState('')
  const [kategori, setKategori] = useState<BiradsKategori>('genel')
  const [raporSec, setRaporSec] = useState<RaporSablonKod[]>(['endikasyon', 'sonuc_ozet'])
  const [kritikSec, setKritikSec] = useState<KritikBayrak[]>([])
  const [bildirimSec, setBildirimSec] = useState<BildirimMadde[]>([])
  const [kritikOnay, setKritikOnay] = useState(false)
  const [belgeTarih, setBelgeTarih] = useState('')
  const [belgeEtiket, setBelgeEtiket] = useState('Görüntü / belge kontrolü')
  const [riskKodlari, setRiskKodlari] = useState<string[]>([])
  const [riskEylem, setRiskEylem] = useState('')
  const [riskOnay, setRiskOnay] = useState(false)
  const [kontrolTarih, setKontrolTarih] = useState('')

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync()
    const r = await fetch('/api/doktor/radyoloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Hata')
    return j as Record<string, unknown>
  }, [patientId])

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/radyoloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      setV(j)
      if (j.bolum?.rapor?.kategori) setKategori(j.bolum.rapor.kategori)
      if (Array.isArray(j.bolum?.rapor?.secilen)) setRaporSec(j.bolum.rapor.secilen)
      if (Array.isArray(j.bolum?.kritik?.bayraklar)) setKritikSec(j.bolum.kritik.bayraklar)
    }
  }, [patientId])

  useEffect(() => { yukle() }, [yukle])

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null)
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null }
  }

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>Radyoloji yükleniyor…</div>

  return (
    <div style={toolsCard} data-chapter="radyoloji">
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
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(13,148,136,0.22)' : 'transparent', color: sekme === x ? '#CCFBF1' : '#8FA0B5' }}>{x}</button>
        ))}
      </div>

      {mesaj && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: /amadı|zorunlu|eksik|Geçersiz|geçersiz|bayrak|Hata|onay/.test(mesaj) ? '#F87171' : '#34D399' }}>{mesaj}</span>
          <MuayeneFormunaDon notId={eklenenNot} />
        </div>
      )}

      {sekme === 'Özet' && (
        <div>
          <div style={etiket}>Bu vizit</div>
          <div style={metin}>Tetkik kuyruğu, BI-RADS-style rapor taslağı ve kritik bildirim karar desteğidir. Tanı / AI bulgu hekimdedir. PACS/RIS/HIS yok.</div>
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

      {sekme === 'Kuyruk' && (
        <div>
          <div style={etiket}>Tetkik kuyruğu / öncelik</div>
          <select value={modalite} onChange={(e) => setModalite(e.target.value as RadyoModalite)} style={{ ...toolsInput, width: '100%', marginBottom: 8 }}>
            {RADYO_MODALITELER.map((m) => <option key={m.kod} value={m.kod}>{m.ad}</option>)}
          </select>
          <div style={satir}>
            {RADYO_ONCELIKLER.map((o) => (
              <button key={o.kod} type="button" onClick={() => setOncelik(o.kod)} style={{ ...ghost, background: oncelik === o.kod ? 'rgba(13,148,136,0.25)' : 'transparent' }}>{o.ad}</button>
            ))}
          </div>
          <div style={satir}>
            {RADYO_DURUMLAR.map((d) => (
              <button key={d.kod} type="button" onClick={() => setDurum(d.kod)} style={{ ...ghost, background: durum === d.kod ? 'rgba(13,148,136,0.25)' : 'transparent' }}>{d.ad}</button>
            ))}
          </div>
          <div style={satir}>
            <input type="date" value={kuyrukTarih} onChange={(e) => setKuyrukTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kuyruk', modalite, oncelik, durum, tarih: kuyrukTarih || null, hekimKilit: true }, 'Kuyruk kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Rapor' && (
        <div>
          <div style={etiket}>Yapılandırılmış rapor (BI-RADS-style — hekim seçer)</div>
          {BIRADS_KATEGORILER.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="radio" name="kat" checked={kategori === k.kod} onChange={() => setKategori(k.kod)} />
              {k.ad}
            </label>
          ))}
          <div style={{ ...etiket, marginTop: 10 }}>Şablon</div>
          {RAPOR_SABLON.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={raporSec.includes(m.kod)} onChange={() => setRaporSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'rapor', kategori, secilen: raporSec, hekimKilit: true }, 'Rapor taslağı kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Kritik' && (
        <div>
          <div style={etiket}>Kritik bulgu + klinisyen bildirimi</div>
          {KRITIK_BAYRAKLAR.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={kritikSec.includes(m.kod)} onChange={() => setKritikSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <div style={{ ...etiket, marginTop: 10 }}>Bildirim checklist</div>
          {BILDIRIM_MADDELER.map((m) => (
            <label key={m.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={bildirimSec.includes(m.kod)} onChange={() => setBildirimSec((p) => (p.includes(m.kod) ? p.filter((x) => x !== m.kod) : [...p, m.kod]))} />
              {m.ad}
            </label>
          ))}
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={kritikOnay} onChange={(e) => setKritikOnay(e.target.checked)} />
            Hekim gördü ve klinisyene bildirdi
          </label>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kritik', bayraklar: kritikSec, bildirim: bildirimSec, hekimOnay: kritikOnay }, 'Kritik bildirim kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Belge' && (
        <div>
          <div style={etiket}>Belge / görüntü köprüsü</div>
          <div style={kucuk}>Tarih + etiket + isteğe bağlı belge id. Tanı / BI-RADS sayı yazılmaz.</div>
          <div style={satir}>
            <input type="date" value={belgeTarih} onChange={(e) => setBelgeTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <input value={belgeEtiket} onChange={(e) => setBelgeEtiket(e.target.value)} style={{ ...toolsInput, flex: 1, minWidth: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'belge', sonraki: belgeTarih, etiket: belgeEtiket }, 'Belge köprüsü kaydedildi.')}>Kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'Acil' && (
        <div>
          <div style={etiket}>Radyoloji acil bayrak</div>
          {v.kutuphane.acilKodlari.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8, padding: '2px 0' }}>
              <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={() => setRiskKodlari((p) => (p.includes(k.kod) ? p.filter((x) => x !== k.kod) : [...p, k.kod]))} />
              {k.ad}
            </label>
          ))}
          <textarea value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Eylem / yönlendirme notu" rows={2} style={{ ...toolsInput, width: '100%', marginTop: 8 }} />
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Hekim gördü ve eylemi yazdı
          </label>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: riskEylem, hekimOnay: riskOnay }, 'Acil bayrak kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>{v.kutuphane.acilListesi.join(' · ')}</div>
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
