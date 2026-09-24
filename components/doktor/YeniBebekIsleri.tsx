'use client'

/**
 * Pediatri / Ayşe worklist: yeni bebek after KD taburcu.
 * Same doctor-scope as bebek_gorevleri kind=yeni_bebek. Not e-Nabız.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { KADIN_HASTALIKLARI_DOGUM_ETIKETI } from '@/lib/doktor/specialties'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Satir = { id: string; bebek_id: string; bebekAd?: string; title?: string; due_at?: string; status?: string }

export default function YeniBebekIsleri() {
  const router = useRouter()
  const [liste, setListe] = useState<Satir[]>([])

  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) return
        const r = await fetch('/api/doktor/yenidogan?worklist=1', { headers: { Authorization: `Bearer ${t}` } })
        if (!r.ok) return
        const j = await r.json()
        const bekleyen = ((j.yeniBebekler || []) as Satir[]).filter((g) => g.status === 'bekliyor')
        if (!iptal) setListe(bekleyen)
      } catch { /* iş listesi kritik değil */ }
    })()
    return () => { iptal = true }
  }, [])

  if (!liste.length) return null

  return (
    <div style={{ marginTop: 18, background: '#FBF3DE', border: '1px solid #E4C989', borderRadius: 16, padding: '14px 18px' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#7A5B1E', marginBottom: 8 }}>Yeni bebek — pediatri iş listesi</div>
      <div style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginBottom: 10 }}>{KADIN_HASTALIKLARI_DOGUM_ETIKETI} taburcu paketinden. Ayşe bebek kartını açabilir. Notya e-Nabız değildir.</div>
      {liste.slice(0, 8).map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => router.push(`/dashboard/doktor/hastalar/${g.bebek_id}?tab=bebek`)}
          style={{ display: 'block', width: '100%', textAlign: 'left', background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: '8px 12px', marginBottom: 6, color: CHROME_RENK.ink, fontSize: 13, cursor: 'pointer' }}
        >
          {g.bebekAd || 'Yenidoğan'} · bebek kartı
        </button>
      ))}
    </div>
  )
}
