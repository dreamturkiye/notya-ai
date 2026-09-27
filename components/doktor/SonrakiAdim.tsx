'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { kullanimEylem } from '@/lib/telemetri/kullanim'
import { sonrakiAday, sonrakiHref, sonrakiMetin, type RutinPaket } from '@/lib/doktor/ogrenme/rutinTuret'

export default function SonrakiAdim({
  sonEylem,
  paket,
  noteId,
  patientId,
}: {
  sonEylem: string
  paket: RutinPaket | null
  noteId?: string | null
  patientId?: string | null
}) {
  const router = useRouter()
  const [gizli, setGizli] = useState(false)
  const aday = sonrakiAday(paket, sonEylem)
  const href = aday ? sonrakiHref(aday.to, { noteId, patientId }) : null
  if (!aday || !href || gizli) return null
  const { soz, cta } = sonrakiMetin(aday)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      background: '#E4F3F1', border: `1px solid ${CHROME_RENK.border}`,
      borderRadius: 12, padding: '10px 14px', fontFamily: CHROME_FONT.sans, margin: '10px 0',
    }}>
      <span style={{ fontSize: 13, color: CHROME_RENK.ink, flex: 1 }}>{soz}</span>
      <button
        type="button"
        onClick={() => { kullanimEylem(aday.to === 'recete_ac' || aday.to === 'recete' ? 'recete_ac' : 'sayfa_ac'); router.push(href) }}
        style={{ border: 'none', background: CHROME_RENK.pine, color: '#FAF8F4', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        {cta}
      </button>
      <button
        type="button"
        onClick={() => { setGizli(true); kullanimEylem('reddet') }}
        style={{ border: 'none', background: 'transparent', color: CHROME_RENK.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        Şimdi değil
      </button>
    </div>
  )
}

export function IlkHastaAdimi({
  hastaAdi,
  patientId,
}: {
  hastaAdi: string
  patientId: string
}) {
  const router = useRouter()
  const [gizli, setGizli] = useState(false)
  const [goster, setGoster] = useState(false)
  useEffect(() => {
    try {
      const k = `ilk-hasta-${new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })}`
      if (sessionStorage.getItem(k)) return
      sessionStorage.setItem(k, '1')
      setGoster(true)
    } catch { setGoster(true) }
  }, [])
  if (!goster || gizli || !hastaAdi || !patientId) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      background: '#E4F3F1', border: `1px solid ${CHROME_RENK.border}`,
      borderRadius: 12, padding: '10px 14px', fontFamily: CHROME_FONT.sans, margin: '8px 0 14px',
    }}>
      <span style={{ fontSize: 13, color: CHROME_RENK.ink, flex: 1 }}>Bugünkü ilk hasta: {hastaAdi}</span>
      <button
        type="button"
        onClick={() => { kullanimEylem('hasta_ac'); router.push(`/dashboard/doktor/hastalar/${patientId}`) }}
        style={{ border: 'none', background: CHROME_RENK.pine, color: '#FAF8F4', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        Dosyayı aç
      </button>
      <button type="button" onClick={() => { setGizli(true); kullanimEylem('reddet') }} style={{ border: 'none', background: 'transparent', color: CHROME_RENK.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        Şimdi değil
      </button>
    </div>
  )
}
