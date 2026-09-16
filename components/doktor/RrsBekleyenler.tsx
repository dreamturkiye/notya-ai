'use client'
/**
 * NOTYA-RRS-01 — E-Reçete aracında "Renkli reçete (RRS)" kartı: bekleyen RRS kayıtları + elle girilen
 * ilaçlar arasında kontrole tabi olanların uyarısı (normal e-reçeteye yazılamaz).
 */
import React, { useEffect, useState } from 'react'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { receteRengi } from '@/lib/doktor/receteRengi'
import { RRS_URL, RRS_ETIKET, type RrsRenk } from '@/lib/doktor/rrs'

interface Kayit { id: string; note_id: string | null; renk: RrsRenk; satirlar: { ilacAdi?: string }[]; created_at: string; hastaAd: string }

export default function RrsBekleyenler(props: { ilacAdlari: string[] }) {
  const [kayitlar, setKayitlar] = useState<Kayit[]>([])
  useEffect(() => {
    let iptal = false
    ;(async () => {
      const t = await getDoctorAccessToken()
      if (!t) return
      const r = await fetch('/api/doktor/rrs', { headers: { Authorization: `Bearer ${t}` } })
      const j = await r.json().catch(() => ({}))
      if (!iptal && Array.isArray(j.kayitlar)) setKayitlar(j.kayitlar)
    })()
    return () => { iptal = true }
  }, [])

  const kontrollu = props.ilacAdlari.map((ad) => ({ ad, renk: receteRengi('', ad) })).filter((x) => x.ad && x.renk !== 'normal')
  if (!kontrollu.length && !kayitlar.length) return null
  const renkHex = (r: RrsRenk) => (r === 'kirmizi' ? '#F87171' : '#4ADE80')

  return (
    <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: '#F59E0B', marginBottom: 8 }}>RENKLİ REÇETE (REÇETEM)</div>
      {kontrollu.length > 0 && (
        <div style={{ fontSize: 14, marginBottom: 10 }}>
          Kontrole tabi ilaç: {kontrollu.map((x) => `${x.ad} (${RRS_ETIKET[x.renk as RrsRenk]})`).join(', ')} — normal e-reçeteye yazılamaz; <a href={RRS_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#F59E0B' }}>Reçetem&apos;de</a> düzenlenir.
        </div>
      )}
      {kayitlar.length > 0 && (
        <div style={{ fontSize: 13 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Reçetem numarası bekleyen reçeteler</div>
          {kayitlar.map((k) => (
            <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
              <span><b style={{ color: renkHex(k.renk) }}>{RRS_ETIKET[k.renk]}</b> · {k.hastaAd} · {(k.satirlar || []).map((s) => s.ilacAdi).filter(Boolean).join(', ') || `${(k.satirlar || []).length} ilaç`} · {new Date(k.created_at).toLocaleDateString('tr-TR')}</span>
              {k.note_id && <a href={`/dashboard/doktor/notlar/${k.note_id}/recete`} style={{ color: '#F59E0B', textDecoration: 'none' }}>Reçete sayfası →</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
