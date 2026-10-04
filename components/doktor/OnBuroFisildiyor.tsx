'use client'
/**
 * NOTYA-ONBURO-FISILTI-01 — "Notya fısıldıyor" for the Ön büro desk.
 *
 * Same one-item whisper pattern as clinical NotyaFisildiyor, but only desk sources
 * (mesaj / talep / belge / telefon / gelmedi / form). Clears by resolving — no Gizle menu.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'
import type { OnBuroFisiltiItem } from '@/lib/doktor/onBuroFisilti'

const FISILTI_KOYU = '#d0d8d5'
const FISILTI_KOYU2 = '#dde3e0'
const FISILTI_BORDER = 'rgba(30,51,54,0.18)'
const FISILTI_INK = '#1e3336'

const LEAF = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)

const CTA: Record<OnBuroFisiltiItem['kaynak'], string> = {
  mesaj: 'Mesajı aç',
  talep: 'Talepleri aç',
  belge: 'Belgeleri aç',
  telefon: 'Randevuyu aç',
  gelmedi: 'Randevuyu aç',
  form: 'Dosyayı aç',
  takip: 'Takibi aç',
}

export default function OnBuroFisildiyor() {
  const router = useRouter()
  const [item, setItem] = useState<OnBuroFisiltiItem | null>(null)
  const [toplam, setToplam] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    try {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const r = await fetch('/api/doktor/on-buro-fisilti', {
        headers: { Authorization: `Bearer ${t}` },
        cache: 'no-store',
      })
      if (!r.ok) return
      const j = await r.json()
      setItem(j.item || null)
      setToplam(Number(j.toplam) || 0)
    } catch { /* fısıltı kritik değil */ } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => { void yukle() }, [yukle])

  if (yukleniyor) return null

  const S = (s: Record<string, unknown>) => s as React.CSSProperties
  const kartStil = S({
    background: `linear-gradient(165deg, ${FISILTI_KOYU}, ${FISILTI_KOYU2})`,
    border: `1px solid ${FISILTI_BORDER}`,
    color: FISILTI_INK,
    borderRadius: 20,
    padding: '20px 22px 18px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 12px 28px rgba(30,51,54,0.1)',
  })

  if (!item) {
    return (
      <div style={kartStil} aria-label="Ön büro fısıltısı">
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: '#2f5155', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 })}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.3, fontWeight: 500, color: FISILTI_INK })}>
          Ön büroda bekleyen bir iş yok — masanız güncel.
        </div>
      </div>
    )
  }

  return (
    <div style={kartStil} aria-label="Ön büro fısıltısı">
      <button
        type="button"
        onClick={() => router.push(item.hedefYol)}
        style={S({ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'inherit' })}
      >
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: '#2f5155', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 })}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.3, fontWeight: 500, color: FISILTI_INK, whiteSpace: 'pre-wrap' })}>
          {item.ad} — {item.baslik}
        </div>
        {item.detay[0] && (
          <div style={S({ marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.5, color: FISILTI_INK })}>
            {item.detay[0]}
          </div>
        )}
        {toplam > 1 && (
          <div style={S({ marginTop: 10, fontSize: 12, opacity: 0.65, color: FISILTI_INK })}>
            +{toplam - 1} ön büro işi daha bekliyor
          </div>
        )}
      </button>
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => router.push(item.hedefYol)}
          style={S({
            background: 'transparent',
            border: `1px solid ${FISILTI_BORDER}`,
            borderRadius: 999,
            color: FISILTI_INK,
            fontSize: 12,
            padding: '6px 12px',
            minHeight: 32,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          })}
        >
          {CTA[item.kaynak]} ›
        </button>
      </div>
    </div>
  )
}
