'use client'

/**
 * KONSULTASYON-02 — doktor ana sayfası: yanıt bekleyen konsültasyon SAYISI → Araçlar › Bekleyen Konsültasyonlar.
 * Evrensel (her branş). Sayı 0 ise (ya da yüklenemezse) HİÇBİR ŞEY çizilmez — ana sayfada dikkat dağıtmaz.
 * Veri: GET /api/doktor/konsultasyon?bekleyen=sayi — araçtaki listeyle aynı bekleyenListesi(), ad çözülmez.
 * Görsel dil ana sayfa panelinin aynısı (#0D1C33 zemin, ince hat, tabular rakam); yeni stil yok.
 */
import { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { beklemeVurgusu, type BekleyenOzeti } from '@/lib/doktor/konsultasyon'
import { BEKLEYEN_KONSULTASYONLAR_ROTASI } from '@/lib/doktor/konsultasyonIstemci'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const VURGU_RENK = { kirmizi: CHROME_RENK.warn, uyari: '#7A5B1E', notr: CHROME_RENK.muted } as const

/** Sunumsal kısım (SSR testi için ayrı). */
export function BekleyenKonsultasyonOzetiKarti({ ozet }: { ozet: BekleyenOzeti | null }) {
  if (!ozet || !(ozet.sayi > 0)) return null
  const en = ozet.enUzunGun ?? 0
  return (
    <a
      href={BEKLEYEN_KONSULTASYONLAR_ROTASI}
      data-bekleyen-konsultasyon-ozeti=""
      style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minHeight: 44, boxSizing: 'border-box', background: '#0D1C33', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 18px', color: CHROME_RENK.ink, textDecoration: 'none' }}
    >
      <span style={{ fontSize: 26, fontWeight: 800, color: '#F59E0B', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{ozet.sayi}</span>
      <span style={{ fontSize: 14, fontWeight: 700 }}>yanıt bekleyen konsültasyon</span>
      {en > 0 && <span style={{ fontSize: 12, color: VURGU_RENK[beklemeVurgusu(en)] }}>en uzun {en} gündür</span>}
      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: '#2DD4BF' }}>Takip et →</span>
    </a>
  )
}

export default function BekleyenKonsultasyonOzeti() {
  const [ozet, setOzet] = useState<BekleyenOzeti | null>(null)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) return
        const r = await fetch('/api/doktor/konsultasyon?bekleyen=sayi', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        if (!iptal && typeof j?.sayi === 'number') setOzet(j as BekleyenOzeti)
      } catch { /* özet kritik değil */ }
    })()
    return () => { iptal = true }
  }, [])
  return <BekleyenKonsultasyonOzetiKarti ozet={ozet} />
}
