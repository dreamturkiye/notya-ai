'use client'

/**
 * NOTYA-FISILTI-UNIVERSAL (Kaan, 2026-09-24) — "Notya fısıldıyor" is no longer pediatri-only.
 * It now calls the universal `/api/doktor/fisilti` endpoint, which resolves the doctor's own
 * branş to the right existing kohort route and normalizes the result -- this component doesn't
 * need to know which of the 29 branş engines produced the flag.
 *
 * Everything from the original design carries over unchanged:
 * - "Clear by resolving, not dismissing": recomputed fresh from the real record every load, no
 *   separate dismiss state to get out of sync.
 * - Honest empty state when the doctor's branş IS supported but genuinely has nothing pending
 *   (renders a calm card, not nothing) -- vs. silently rendering nothing when the branş has no
 *   kohort engine at all yet (radyoloji has one; klinik doesn't -- that's Sprint 2).
 * - Own dark-blue visual identity (sampled from the header photo's leaves), separate from pine.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'
import type { FisiltiItem } from '@/lib/doktor/fisiltiOrtak'

// Sampled from public/doktor-chrome/plant.jpg (blue-green leaf tones), not a design-system token --
// this box is deliberately its own accent, separate from the page's pine.
// 2026-09-24 (Kaan): the lighter leaf, as actually seen on screen -- raw tone run through the
// page's own filter (saturate .65, contrast .88, brightness 1.1) and 50% opacity blend over the
// cream background. Border added since this tone sits close to the page bg in lightness.
const FISILTI_KOYU = '#d0d8d5'
const FISILTI_KOYU2 = '#dde3e0'
const FISILTI_BORDER = 'rgba(30,51,54,0.18)'

const LEAF = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)

export default function NotyaFisildiyor({ specialty }: { specialty: string }) {
  const router = useRouter()
  const [item, setItem] = useState<FisiltiItem | null>(null)
  const [toplam, setToplam] = useState(0)
  const [kapsamDisi, setKapsamDisi] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) { if (!iptal) setYukleniyor(false); return }
        const r = await fetch('/api/doktor/fisilti', { headers: { Authorization: `Bearer ${t}` } })
        if (!r.ok) { if (!iptal) setYukleniyor(false); return }
        const j = await r.json()
        if (!iptal) {
          setItem(j.item || null)
          setToplam(Number(j.toplam) || 0)
          setKapsamDisi(!!j.kapsamDisi)
          setYukleniyor(false)
        }
      } catch { if (!iptal) setYukleniyor(false) /* fısıltı kritik değil -- sessizce boş kalır */ }
    })()
    return () => { iptal = true }
  }, [specialty])

  // Bu branşta motor henüz yok -- kart hiç görünmez (bu, "kontrol edildi, boşçıktı"dan farklı).
  if (kapsamDisi) return null
  // Kontrol sürerken boş durumun yanıp sönmesini önler.
  if (yukleniyor) return null

  const S = (s: Record<string, unknown>) => s as React.CSSProperties

  if (!item) {
    // Gerçekten kontrol edildi, bekleyen yok -- kart kaybolmaz, durumu dürüstçe söyler.
    return (
      <div
        style={S({
          background: `linear-gradient(165deg, ${FISILTI_KOYU}, ${FISILTI_KOYU2})`,
          border: `1px solid ${FISILTI_BORDER}`,
          color: '#1e3336', borderRadius: 20, padding: '20px 22px 18px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 28px rgba(30,51,54,0.1)',
        })}
      >
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: '#2f5155', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 })}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.3, fontWeight: 500, color: '#1e3336' })}>
          Şu an bekleyen bir şey yok — her şey güncel.
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => router.push(item.hedefYol)}
      style={S({
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: `1px solid ${FISILTI_BORDER}`,
        background: `linear-gradient(165deg, ${FISILTI_KOYU}, ${FISILTI_KOYU2})`,
        color: '#1e3336', borderRadius: 20, padding: '20px 22px 18px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 28px rgba(30,51,54,0.1)',
      })}
    >
      <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: '#2f5155', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 })}>
        {LEAF} Notya fısıldıyor
      </div>
      <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.3, fontWeight: 500, color: '#1e3336' })}>
        {item.ad} — {item.baslik}
      </div>
      {item.detay[0] && (
        <div style={S({ marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.5, color: '#1e3336' })}>{item.detay[0]}</div>
      )}
      {toplam > 1 && (
        <div style={S({ marginTop: 10, fontSize: 12, opacity: 0.65, color: '#1e3336' })}>+{toplam - 1} hastada daha bekleyen kontrol var</div>
      )}
    </button>
  )
}
