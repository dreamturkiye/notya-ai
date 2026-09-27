'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { toolsCard, toolsPrimaryBtn } from '@/lib/doktor/toolsUi'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ENABIZ_PORTAL, MASA_KISA_REHBER, type EnabizMasaTur } from '@/lib/enabiz/masa'

type Alan = { id: string; etiket: string; deger: string; eksik: boolean }
type Cikti = { tur: EnabizMasaTur; ad: string; alanlar: Alan[]; topluMetin: string; eksikler: string[] }
type Vizit = { id: string; seansId: string; tarih: string; onayli: boolean }

export default function EnabizMasa({ gizliBaslik }: { gizliBaslik?: boolean }) {
  const sp = useSearchParams()
  const [hastaId, setHastaId] = useState(sp.get('hastaId') || '')
  const [notId, setNotId] = useState(sp.get('notId') || '')
  const [seansId] = useState(sp.get('seansId') || '')
  const [tur, setTur] = useState(sp.get('tur') || 'muayene')
  const [hastalar, setHastalar] = useState<{ id: string; ad: string }[]>([])
  const [q, setQ] = useState('')
  const [hastaAd, setHastaAd] = useState('')
  const [vizitler, setVizitler] = useState<Vizit[]>([])
  const [ciktilar, setCiktilar] = useState<{ tur: EnabizMasaTur; ad: string }[]>([])
  const [cikti, setCikti] = useState<Cikti | null>(null)
  const [paket, setPaket] = useState<Record<string, unknown> | null>(null)
  const [kilit, setKilit] = useState(false)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [kopya, setKopya] = useState('')

  const yukleListe = useCallback(async () => {
    const t = await ensureDoctorAccessToken()
    if (!t) return
    const r = await fetch('/api/doktor/araclar/enabiz', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
    const j = await r.json().catch(() => ({}))
    if (r.ok && Array.isArray(j.hastalar)) setHastalar(j.hastalar)
  }, [])

  const yukleMasa = useCallback(async (hid: string, nid: string, sid: string, tTur: string) => {
    if (!hid && !nid && !sid) return
    setYukleniyor(true)
    setHata('')
    try {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const u = new URLSearchParams()
      if (hid) u.set('hastaId', hid)
      if (nid) u.set('notId', nid)
      if (sid) u.set('seansId', sid)
      if (tTur) u.set('tur', tTur)
      const r = await fetch(`/api/doktor/araclar/enabiz?${u}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Hasta bulunamadı.'); setCikti(null); return }
      setHastaId(String(j.hastaId || hid))
      setHastaAd(String(j.hastaAd || ''))
      setNotId(String(j.notId || nid || ''))
      setVizitler(Array.isArray(j.vizitler) ? j.vizitler : [])
      setCiktilar(Array.isArray(j.ciktilar) ? j.ciktilar : [])
      setKilit(Boolean(j.izin?.kilit))
      setCikti(j.cikti || null)
      setPaket(j.paket && typeof j.paket === 'object' ? j.paket : null)
      if (j.tur) setTur(String(j.tur))
    } catch {
      setHata('Masa yüklenemedi.')
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => { void yukleListe() }, [yukleListe])
  useEffect(() => {
    const hid = sp.get('hastaId') || ''
    const nid = sp.get('notId') || ''
    const sid = sp.get('seansId') || ''
    const tTur = sp.get('tur') || 'muayene'
    if (hid || nid || sid) void yukleMasa(hid, nid, sid, tTur)
  }, [sp, yukleMasa])

  const kopyala = async (metin: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(metin)
      setKopya(id || 'toplu')
      window.setTimeout(() => setKopya(''), 1600)
    } catch {
      setHata('Kopyalanamadı.')
    }
  }

  const yazdir = () => window.print()

  const teknikIndir = () => {
    if (!paket) return
    const blob = new Blob([JSON.stringify(paket, null, 2)], { type: 'application/json;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `enabiz-${hastaId.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const filtre = hastalar.filter((h) => !q.trim() || h.ad.toLocaleLowerCase('tr-TR').includes(q.trim().toLocaleLowerCase('tr-TR')))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: gizliBaslik ? 0 : '24px 16px 48px' }}>
      {!gizliBaslik && (
        <>
          <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Araçlar</div>
          <h1 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, color: '#2e251d', lineHeight: 1.2 }}>e-Nabız</h1>
        </>
      )}
      <p style={{ marginTop: gizliBaslik ? 0 : 8, color: CHROME_RENK.muted, fontSize: 14, lineHeight: 1.5 }}>{MASA_KISA_REHBER}</p>

      <div style={{ ...toolsCard, marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: CHROME_RENK.ink, fontWeight: 600, fontSize: 14 }}>e-Nabız’ı aç</div>
          <div style={{ color: CHROME_RENK.muted, fontSize: 12, marginTop: 4 }}>{ENABIZ_PORTAL}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => void kopyala(ENABIZ_PORTAL, 'portal')} style={{ ...toolsPrimaryBtn(false), width: 'auto', padding: '10px 14px' }}>
            {kopya === 'portal' ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
          </button>
          <a href={ENABIZ_PORTAL} target="_blank" rel="noreferrer" style={{ ...toolsPrimaryBtn(false), width: 'auto', padding: '10px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Aç
          </a>
        </div>
      </div>

      <div style={{ ...toolsCard, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 8 }}>Hasta</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ad ile ara"
          aria-label="Hasta ara"
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 40, borderRadius: 10, border: `1px solid ${CHROME_RENK.border}`, padding: '0 12px', fontSize: 14 }}
        />
        <div style={{ marginTop: 8, display: 'grid', gap: 4, maxHeight: 220, overflow: 'auto' }}>
          {filtre.slice(0, 40).map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => { setHastaId(h.id); setNotId(''); void yukleMasa(h.id, '', '', tur) }}
              style={{
                textAlign: 'left', minHeight: 40, borderRadius: 8, border: `1px solid ${h.id === hastaId ? CHROME_RENK.pine : CHROME_RENK.border}`,
                background: h.id === hastaId ? '#E4F3F1' : '#fff', padding: '8px 10px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {h.ad || 'Hasta'}
            </button>
          ))}
        </div>
        {hastaAd && <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>{hastaAd}</div>}
      </div>

      {hastaId && vizitler.length > 0 && (
        <div style={{ ...toolsCard, marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 8 }}>Vizit</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {vizitler.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { setNotId(v.id); void yukleMasa(hastaId, v.id, '', tur) }}
                style={{
                  minHeight: 36, borderRadius: 8, padding: '0 10px',
                  border: `1px solid ${v.id === notId ? CHROME_RENK.pine : CHROME_RENK.border}`,
                  background: v.id === notId ? '#E4F3F1' : '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {v.tarih || 'Vizit'}{v.onayli ? '' : ' · taslak'}
              </button>
            ))}
          </div>
        </div>
      )}

      {hastaId && ciktilar.length > 0 && !kilit && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {ciktilar.map((c) => (
            <button
              key={c.tur}
              type="button"
              onClick={() => { setTur(c.tur); void yukleMasa(hastaId, notId, seansId, c.tur) }}
              style={{
                minHeight: 36, borderRadius: 999, padding: '0 12px',
                border: `1px solid ${c.tur === tur ? CHROME_RENK.pine : CHROME_RENK.border}`,
                background: c.tur === tur ? CHROME_RENK.pine : '#fff',
                color: c.tur === tur ? '#FAF8F4' : CHROME_RENK.ink,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              {c.ad}
            </button>
          ))}
        </div>
      )}

      {yukleniyor && <p style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Yükleniyor…</p>}
      {hata && <p style={{ color: '#8C2F2F', fontSize: 13 }}>{hata}</p>}

      {kilit && (
        <div style={{ ...toolsCard, marginTop: 16, background: '#FBEAE3', border: '1px solid #E8C4B8' }}>
          <div style={{ fontWeight: 800, color: '#7A3D28' }}>e-Nabız’a gönderilmesini istemiyor</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7A3D28' }}>Bu hasta için paket üretilmez. Sekreter ve hekim aynı kilidi görür.</p>
        </div>
      )}

      {cikti && !kilit && (
        <div style={{ ...toolsCard, marginTop: 16 }}>
          {cikti.eksikler.length > 0 && (
            <div style={{ background: '#FFF6E5', border: '1px solid #E8D4A8', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#7A5B1E' }}>
              <b>e-Nabız’da boş kalır:</b> {cikti.eksikler.join(' · ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" onClick={() => void kopyala(cikti.topluMetin, 'toplu')} style={{ ...toolsPrimaryBtn(false), width: 'auto' }}>
              {kopya === 'toplu' ? 'Kopyalandı' : 'Tümünü kopyala'}
            </button>
            <button type="button" onClick={yazdir} style={{ ...toolsPrimaryBtn(false), width: 'auto', background: '#fff', color: CHROME_RENK.pine, border: `1px solid ${CHROME_RENK.pine}` }}>
              Yazdır
            </button>
            {paket && (
              <button type="button" onClick={teknikIndir} style={{ background: 'none', border: 'none', color: CHROME_RENK.muted, fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}>
                Teknik paket indir
              </button>
            )}
          </div>
          {cikti.alanlar.map((a) => (
            <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderTop: `1px solid ${CHROME_RENK.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: a.eksik ? '#8A5A12' : CHROME_RENK.pine }}>{a.etiket}{a.eksik ? ' — eksik' : ''}</div>
                <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: a.eksik ? CHROME_RENK.muted : CHROME_RENK.ink }}>{a.deger || '—'}</div>
              </div>
              <button
                type="button"
                disabled={a.eksik}
                onClick={() => void kopyala(a.deger, a.id)}
                style={{ ...toolsPrimaryBtn(a.eksik), width: 'auto', padding: '8px 12px', flexShrink: 0 }}
              >
                {kopya === a.id ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
