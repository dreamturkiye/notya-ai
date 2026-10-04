'use client'
/**
 * NOTYA-TAKIP-01 — open follow-up cases on Ön büro (and reusable on doctor Ana Sayfa).
 * Clear by booking / answering / "Kapattım"; never deletes clinical data.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

const R = CHROME_RENK

type Oge = {
  id: string
  tur: string
  hastaAdi: string
  baslik: string
  ozet: string
  vade: string | null
  hedefYol: string
}

export default function TakipPaneli({ kartStili }: { kartStili?: React.CSSProperties } = {}) {
  const router = useRouter()
  const [ogeler, setOgeler] = useState<Oge[]>([])
  const [mesgul, setMesgul] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    try {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const r = await fetch('/api/doktor/takip', {
        headers: { Authorization: `Bearer ${t}` },
        cache: 'no-store',
      })
      if (!r.ok) { setOgeler([]); return }
      const j = await r.json()
      setOgeler(Array.isArray(j.ogeler) ? j.ogeler : [])
    } catch { setOgeler([]) } finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { void yukle() }, [yukle])

  const kapat = async (id: string) => {
    if (mesgul) return
    setMesgul(id)
    try {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const r = await fetch('/api/doktor/takip', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, islem: 'kapat' }),
      })
      if (r.ok) await yukle()
    } finally { setMesgul('') }
  }

  if (yukleniyor || !ogeler.length) return null

  return (
    <div style={{
      background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20,
      padding: '16px 20px', boxShadow: '0 16px 34px rgba(58,44,34,0.06)',
      fontFamily: CHROME_FONT.sans, color: R.ink, ...kartStili,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
        {ogeler.length === 1 ? '1 açık takip' : `${ogeler.length} açık takip`}
      </div>
      <div style={{ fontSize: 13, color: R.muted, marginBottom: 10 }}>
        Kontrol penceresi, gelmedi araması ve konsültasyon yanıtı — randevu veya yanıt ile kapanır.
      </div>
      {ogeler.slice(0, 8).map((o) => (
        <div key={o.id} style={{ borderTop: `1px solid ${R.border}`, padding: '10px 0' }}>
          <button
            type="button"
            onClick={() => router.push(o.hedefYol)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', background: 'none',
              border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontWeight: 600 }}>{o.hastaAdi} · {o.baslik}</div>
            {o.ozet && <div style={{ fontSize: 13, color: R.muted, marginTop: 3 }}>{o.ozet}</div>}
            {o.vade && <div style={{ fontSize: 12, color: R.muted, marginTop: 2 }}>Vade: {o.vade}</div>}
          </button>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => router.push(o.hedefYol)}
              style={{
                minHeight: 32, padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: 'none', background: R.pine, color: R.paper, cursor: 'pointer',
              }}
            >
              {o.tur === 'gelmedi' ? 'Randevu ver' : o.tur === 'konsultasyon' ? 'Dosyayı aç' : 'Randevu ver'}
            </button>
            <button
              type="button"
              disabled={!!mesgul}
              onClick={() => void kapat(o.id)}
              style={{
                minHeight: 32, padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: `1px solid ${R.border}`, background: 'transparent', color: R.ink, cursor: 'pointer',
              }}
            >
              Kapattım
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
