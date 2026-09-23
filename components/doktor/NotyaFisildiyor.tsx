'use client'

/**
 * NOTYA-FISILTI-UNIVERSAL (Kaan, 2026-09-24) -- standalone production port of "Notya fısıldıyor",
 * styled for the CURRENT dark-navy production theme (this file intentionally does not import
 * anything from the yeni-görünüm redesign -- lib/doktor/chromeTheme.ts etc. don't exist on main).
 * Purpose: let Dr. Gökhan test the real capability on production without the redesign merge
 * decision being made for anyone -- see docs/OPEN-COMMITMENTS.md NOTYA-FISILTI-UNIVERSAL.
 *
 * Same backend, same behavior as the redesign version: calls the universal /api/doktor/fisilti
 * endpoint (resolves the doctor's own branş, reuses that branş's existing kohort route, also
 * checks overdue unread portal messages), same "clear by resolving, not dismissing" rule, same
 * honest empty state instead of rendering nothing.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import type { FisiltiItem } from '@/lib/doktor/fisiltiOrtak'

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
      } catch { if (!iptal) setYukleniyor(false) }
    })()
    return () => { iptal = true }
  }, [specialty])

  if (kapsamDisi) return null
  if (yukleniyor) return null

  const panel: React.CSSProperties = {
    background: '#0D1C33',
    border: '1px solid rgba(255,255,255,0.08)',
    borderLeft: '3px solid #0F9B8E',
    borderRadius: 16,
    padding: '18px 20px',
  }

  if (!item) {
    return (
      <div style={{ ...panel, marginTop: 18 }}>
        <div style={{ fontStyle: 'italic', color: '#2DD4BF', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={{ fontStyle: 'italic', fontSize: 16, lineHeight: 1.3, color: '#EDF1F7' }}>
          Şu an bekleyen bir şey yok — her şey güncel.
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => router.push(item.hedefYol)}
      style={{ ...panel, marginTop: 18, display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }}
    >
      <div style={{ fontStyle: 'italic', color: '#2DD4BF', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        {LEAF} Notya fısıldıyor
      </div>
      <div style={{ fontStyle: 'italic', fontSize: 17, lineHeight: 1.3, fontWeight: 600, color: '#EDF1F7' }}>
        {item.ad} — {item.baslik}
      </div>
      {item.detay[0] && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#C9D4E3', lineHeight: 1.5 }}>{item.detay[0]}</div>
      )}
      {toplam > 1 && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#8FA0B5' }}>+{toplam - 1} hastada daha bekleyen kontrol var</div>
      )}
    </button>
  )
}
