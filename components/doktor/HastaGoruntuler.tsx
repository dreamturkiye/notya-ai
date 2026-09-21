'use client'

/**
 * Görüntüler — bu hastanın filmleri. Değerlendir = mevcut belge analiz POST.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import {
  altTipSecilmeli,
  analizHref,
  goruntuChip,
  hacimAiKapali,
  MG_DIPNOT,
  modalityFinalIcin,
  onayDurumDipnot,
  paylasimYorumu,
  portaldaGorunurMu,
  TIP_ETIKET,
  TIP_MODALITELER,
  type GoruntuTip,
} from '@/lib/doktor/goruntuCalisma'
import type { Modalite } from '@/core/belgeler/ontoloji'
import { MODALITE_TR } from '@/core/belgeler/ontoloji'

type Calisma = {
  id: string
  tip: GoruntuTip
  modalite: string
  bolge: string | null
  tarih: string | null
  belge_id: string | null
  calisma_id: string
  onay_durum: string
  hekim_yorum: string | null
  hastane_link: string | null
  asistan_analiz_id: string | null
  created_at: string
}

type Analiz = { id: string; belge_id?: string; durum: string; sonuc?: { ozet?: string; bulgular?: string[] } | null; hekim_ozet?: string | null }

const TIPS: GoruntuTip[] = ['xr', 'ekg', 'goz', 'derm', 'mg', 'us', 'ct', 'mr', 'pet']
const panel: React.CSSProperties = { background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' }

export default function HastaGoruntuler({ patientId }: { patientId: string }) {
  const [liste, setListe] = useState<Calisma[]>([])
  const [analizler, setAnalizler] = useState<Analiz[]>([])
  const [secili, setSecili] = useState<string | null>(null)
  const [oncekiler, setOncekiler] = useState<{ id: string; tarih: string | null; belge_id: string | null }[]>([])
  const [seri, setSeri] = useState<{ id: string; belge_id: string | null; bolge: string | null }[]>([])
  const [tip, setTip] = useState<GoruntuTip>('xr')
  const [alt, setAlt] = useState<string>('')
  const [bolge, setBolge] = useState('')
  const [dosya, setDosya] = useState<File | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync()
    const [cr, ar] = await Promise.all([
      fetch(`/api/doktor/goruntuler?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(`/api/doktor/belgeler/analiz?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
    ])
    if (cr.ok) {
      const j = await cr.json()
      setListe(j.calismalar || [])
    }
    if (ar.ok) {
      const j = await ar.json()
      setAnalizler(j.analizler || [])
    }
  }, [patientId])
  useEffect(() => { void yukle() }, [yukle])

  const satir = liste.find((x) => x.id === secili) || null
  const analiz = useMemo(() => {
    if (!satir?.belge_id) return null
    return analizler.find((a) => a.belge_id === satir.belge_id || a.id === satir.asistan_analiz_id) || null
  }, [analizler, satir])

  useEffect(() => {
    if (!secili) { setOncekiler([]); setSeri([]); return }
    void (async () => {
      const token = await getAccessTokenAsync()
      const r = await fetch(`/api/doktor/goruntuler/${secili}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()
      setOncekiler(j.oncekiler || [])
      setSeri(j.seri || [])
    })()
  }, [secili])

  const gonder = async () => {
    if (!dosya) { setMesaj('Dosya seçin.'); return }
    if (altTipSecilmeli(tip) && !alt) { setMesaj('Önce alt tipi seçin (PA akciğer, kemik, fundus…).'); return }
    setYukleniyor(true); setMesaj('')
    const token = await getAccessTokenAsync()
    const fd = new FormData()
    fd.set('patientId', patientId)
    fd.set('file', dosya)
    fd.set('tip', tip)
    if (alt) fd.set('modalite', alt)
    if (bolge.trim()) fd.set('bolge', bolge.trim())
    if (satir && satir.tip === tip) fd.set('calismaId', satir.calisma_id)
    const r = await fetch('/api/doktor/goruntuler', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const j = await r.json().catch(() => ({}))
    setYukleniyor(false)
    if (!r.ok) { setMesaj(j.error || 'Yüklenemedi'); return }
    setDosya(null); setBolge(''); await yukle(); setSecili(j.calisma?.id || null)
  }

  const paylas = async () => {
    if (!satir) return
    const yorum = paylasimYorumu({
      hekimOzet: analiz?.hekim_ozet,
      mevcut: satir.hekim_yorum,
      hamAsistan: analiz?.sonuc?.ozet,
    })
    if (satir.tip === 'mg' && !yorum) {
      setMesaj('Mamografiyi paylaşmadan önce Değerlendir’de hekim özetini onaylayın.')
      return
    }
    const token = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/goruntuler/${satir.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onay_durum: 'hasta_paylas',
        ...(yorum ? { hekim_yorum: yorum } : {}),
        asistan_analiz_id: analiz?.id || satir.asistan_analiz_id,
      }),
    })
    const j = await r.json().catch(() => ({}))
    setMesaj(r.ok ? 'Hastaya paylaşıldı.' : j.error || 'Paylaşılamadı')
    await yukle()
  }

  const alts = TIP_MODALITELER[tip]
  const gosterimler = seri.filter((s) => s.belge_id).map((s) => s.belge_id as string)
  const anaBelge: string | null = satir?.belge_id ?? null
  const ikiUp = satir?.tip === 'mg' && gosterimler.length >= 2
  const paylasYorum = paylasimYorumu({
    hekimOzet: analiz?.hekim_ozet,
    mevcut: satir?.hekim_yorum,
    hamAsistan: analiz?.sonuc?.ozet,
  })
  const portalHazir = !!satir && portaldaGorunurMu({
    onay_durum: 'hasta_paylas',
    tip: satir.tip,
    modalite: satir.modalite,
    hekim_yorum: paylasYorum || satir.hekim_yorum,
  })

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={panel}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#EDF1F7' }}>Görüntüler</div>
        <div style={{ fontSize: 13, color: '#8FA0B5', margin: '4px 0 12px' }}>Bu hastanın filmleri.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {liste.map((c) => (
            <button key={c.id} type="button" onClick={() => setSecili(c.id)} style={{
              ...ghost, padding: '6px 10px', borderRadius: 999,
              borderColor: secili === c.id ? '#0F9B8E' : 'rgba(255,255,255,0.15)',
              color: secili === c.id ? '#2DD4BF' : '#EDF1F7',
            }}>
              {goruntuChip(c.tip, c.tarih || c.created_at)}
            </button>
          ))}
          {liste.length === 0 && <span style={{ fontSize: 13, color: '#64748B' }}>Henüz film yok.</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select value={tip} onChange={(e) => { setTip(e.target.value as GoruntuTip); setAlt('') }} style={sel}>
            {TIPS.map((t) => <option key={t} value={t} style={{ color: '#000' }}>{TIP_ETIKET[t]}</option>)}
          </select>
          {alts.length > 1 && (
            <select value={alt} onChange={(e) => setAlt(e.target.value)} style={sel}>
              <option value="" style={{ color: '#000' }}>Alt tip</option>
              {alts.map((m) => <option key={m} value={m} style={{ color: '#000' }}>{MODALITE_TR[m]}</option>)}
            </select>
          )}
          <input value={bolge} onChange={(e) => setBolge(e.target.value)} placeholder="Bölge (akciğer, meme-R…)" style={inp} />
          <input type="file" accept={tip === 'us' ? 'image/*,.pdf,video/mp4,video/webm' : 'image/*,.pdf'} onChange={(e) => setDosya(e.target.files?.[0] || null)} style={{ color: '#8FA0B5', fontSize: 12 }} />
          <button type="button" onClick={() => void gonder()} disabled={yukleniyor || (altTipSecilmeli(tip) && !alt)} style={btn}>{yukleniyor ? 'Yükleniyor…' : 'Kasa’ya al'}</button>
          {satir?.tip === tip && <span style={{ fontSize: 12, color: '#8FA0B5' }}>Seçili çalışmaya eklenir (MG iki kare / seri).</span>}
        </div>
        {hacimAiKapali(tip) && <div style={{ fontSize: 11, color: '#FBBF24', marginTop: 8 }}>CT/MR/PET: yalnız anahtar kare + rapor. Hacim arşivi yok.</div>}
        {mesaj && <div style={{ fontSize: 12, color: /paylaşıldı|yok/.test(mesaj) && !/Paylaşılamadı/.test(mesaj) ? '#2DD4BF' : '#F87171', marginTop: 8 }}>{mesaj}</div>}
      </div>

      {satir && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 14 }} className="notya-grid-yigin">
          <div style={panel}>
            <GoruntuIzleyici
              belgeId={anaBelge}
              tip={satir.tip}
              ikiUp={ikiUp ? gosterimler.slice(0, 2) : null}
            />
            {oncekiler.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 }}>Öncekiler · aynı tip / bölge</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {oncekiler.map((o) => (
                    <button key={o.id} type="button" onClick={() => setSecili(o.id)} style={{ ...ghost, padding: '4px 8px', fontSize: 11 }}>
                      {goruntuChip(satir.tip, o.tarih)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={panel}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#EDF1F7', marginBottom: 6 }}>
              {TIP_ETIKET[satir.tip]} {satir.bolge ? `· ${satir.bolge}` : ''}
            </div>
            <div style={{ fontSize: 12, color: '#8FA0B5', marginBottom: 10 }}>{onayDurumDipnot(satir.onay_durum)}</div>
            {satir.tip === 'mg' && <div style={{ fontSize: 12, color: '#FBBF24', marginBottom: 10 }}>{MG_DIPNOT}</div>}
            <div style={{ fontSize: 13, color: '#EDF1F7', marginBottom: 8 }}>
              <b>{analiz?.hekim_ozet ? 'Hekim özeti' : 'Asistan taslağı'}</b>
              <div style={{ color: '#8FA0B5', fontWeight: 400, marginTop: 4 }}>{analiz?.hekim_ozet || analiz?.sonuc?.ozet || 'Henüz taslak yok.'}</div>
            </div>
            {!!analiz?.sonuc?.bulgular?.length && (
              <div style={{ fontSize: 13, color: '#EDF1F7', marginBottom: 8 }}>
                <b>Bulgular</b>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{analiz.sonuc.bulgular.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {satir.belge_id && !hacimAiKapali(satir.tip) && (
                <a href={analizHref(patientId, satir.belge_id, modalityFinalIcin(satir.tip, satir.modalite as Modalite))} style={{ ...btn, textDecoration: 'none' }}>Değerlendir</a>
              )}
              {satir.belge_id && hacimAiKapali(satir.tip) && (
                <a href={analizHref(patientId, satir.belge_id, 'pdf_rapor')} style={{ ...ghost, textDecoration: 'none' }}>Raporu özetle</a>
              )}
              {analiz && <a href={analizHref(patientId, satir.belge_id || '', modalityFinalIcin(satir.tip, satir.modalite as Modalite))} style={{ ...ghost, textDecoration: 'none' }}>Nota ekle</a>}
              <button type="button" onClick={() => void paylas()} style={ghost} disabled={satir.onay_durum === 'hasta_paylas' || !portalHazir}>
                {satir.onay_durum === 'hasta_paylas' ? 'Paylaşıldı' : satir.tip === 'goz' && satir.modalite !== 'fundus' ? 'Portala yalnız fundus' : 'Onayla ve paylaş'}
              </button>
            </div>
            {satir.hastane_link && <a href={satir.hastane_link} style={{ display: 'block', marginTop: 10, fontSize: 12, color: '#2DD4BF' }}>Hastane bağlantısı →</a>}
          </div>
        </div>
      )}
    </div>
  )
}

const sel: React.CSSProperties = { background: '#0A1220', color: '#EDF1F7', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }
const inp: React.CSSProperties = { ...sel, minWidth: 160 }

function GoruntuIzleyici({ belgeId, tip, ikiUp }: { belgeId: string | null; tip: GoruntuTip; ikiUp: string[] | null }) {
  const [url, setUrl] = useState<string | null>(null)
  const [url2, setUrl2] = useState<string | null>(null)
  const [ortam, setOrtam] = useState<'img' | 'video' | 'pdf'>('img')
  const [invert, setInvert] = useState(false)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const acilan: string[] = []
    let iptal = false
    const al = async (id: string) => {
      const token = await getAccessTokenAsync()
      const r = await fetch(`/api/doktor/documents/${id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) return null
      const blob = await r.blob()
      const u = URL.createObjectURL(blob)
      if (iptal) {
        URL.revokeObjectURL(u)
        return null
      }
      acilan.push(u)
      if (blob.type.startsWith('video/')) setOrtam('video')
      else if (blob.type.includes('pdf')) setOrtam('pdf')
      else setOrtam('img')
      return u
    }
    void (async () => {
      setOrtam('img')
      setInvert(false)
      setZoom(1)
      if (ikiUp) {
        const [u1, u2] = await Promise.all(ikiUp.map(al))
        if (iptal) return
        setUrl(u1); setUrl2(u2)
        return
      }
      if (!belgeId) { setUrl(null); setUrl2(null); return }
      const u = await al(belgeId)
      if (iptal) return
      setUrl(u); setUrl2(null)
    })()
    return () => {
      iptal = true
      for (const u of acilan) URL.revokeObjectURL(u)
    }
  }, [belgeId, ikiUp?.[0], ikiUp?.[1]])

  const xr = tip === 'xr' || tip === 'mg' || tip === 'ct' || tip === 'mr'
  const still = (
    src: string | null,
    key: string,
  ) => src ? (
    <img
      key={key}
      src={src}
      alt=""
      style={{
        width: '100%',
        maxHeight: 420,
        objectFit: 'contain',
        transform: `scale(${zoom})`,
        filter: invert ? 'invert(1)' : undefined,
        background: '#020812',
      }}
    />
  ) : <div style={{ color: '#64748B', fontSize: 13, padding: 24 }}>Kare yok.</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {xr && ortam === 'img' && <button type="button" onClick={() => setInvert((x) => !x)} style={ghost}>Ters</button>}
        {ortam !== 'pdf' && (
          <>
            <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} style={ghost}>Yakın</button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} style={ghost}>Uzak</button>
            <button type="button" onClick={() => { setZoom(1); setInvert(false) }} style={ghost}>Sığdır</button>
          </>
        )}
      </div>
      {ortam === 'pdf' && url ? (
        <iframe src={url} title="Rapor PDF" style={{ width: '100%', height: 420, border: 0, background: '#020812' }} />
      ) : ortam === 'video' && url ? (
        <video src={url} autoPlay loop muted playsInline style={{ width: '100%', maxHeight: 420, background: '#020812' }} />
      ) : ikiUp ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {still(url, 'l')}
          {still(url2, 'r')}
        </div>
      ) : still(url, 'tek')}
    </div>
  )
}
