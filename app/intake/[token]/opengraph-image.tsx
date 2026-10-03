/**
 * NOTYA-INTAKE-OG-01 — WhatsApp / sosyal önizleme: krem zemin, çam stetoskop + doktor baş harfleri,
 * altta tam ad. Koyu Notya "N" markası kullanılmaz (mesaj doktordan geliyor).
 */
import { ImageResponse } from 'next/og'
import { intakeDoktorOg, INTAKE_OG_RENK } from '@/lib/intake/doktorOg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = 'Hasta Bilgi Formu'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { token: string } }) {
  const d = await intakeDoktorOg(params.token).catch(() => null)
  const initials = d?.initials || 'DR'
  const ad = d?.doktorAdi || 'Doktorunuz'
  const altSatir = d?.hastaAdi
    ? `${d.hastaAdi} · Hasta Bilgi Formu`
    : 'Hasta Bilgi Formu'
  const R = INTAKE_OG_RENK

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(165deg, ${R.paper} 0%, ${R.cream} 55%, #ebe3d4 100%)`,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Soft gold wash */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: R.gold,
            opacity: 0.85,
          }}
        />
        {/* Stethoscope + initials mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: 280,
            height: 280,
            marginBottom: 28,
          }}
        >
          {/* Tubing ring */}
          <div
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 110,
              border: `10px solid ${R.pine}`,
              opacity: 0.92,
            }}
          />
          {/* Earpiece left */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 48,
              width: 28,
              height: 28,
              borderRadius: 14,
              background: R.pine,
            }}
          />
          {/* Earpiece right */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              right: 48,
              width: 28,
              height: 28,
              borderRadius: 14,
              background: R.pine,
            }}
          />
          {/* Chest piece */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 36,
              width: 56,
              height: 56,
              borderRadius: 28,
              border: `8px solid ${R.pine}`,
              background: R.cream,
              display: 'flex',
            }}
          />
          {/* Initials */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 96,
              fontWeight: 700,
              color: R.pine,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {initials}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 700,
            color: R.ink,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: 1000,
            padding: '0 40px',
          }}
        >
          {ad}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 16,
            fontSize: 28,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            color: R.muted,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {altSatir}
        </div>
      </div>
    ),
    { ...size },
  )
}
