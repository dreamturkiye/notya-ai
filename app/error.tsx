'use client'

import { turkceHataMesaji } from '@/lib/turkce/dogrulamaMesaji'
import { CHROME_RENK as R, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: R.cream,
        color: R.ink,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '14px',
        fontFamily: CHROME_FONT.sans,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ fontSize: '18px', fontWeight: 700, color: R.ink, fontFamily: CHROME_FONT.serif }}>Bir hata oluştu</div>
      <div style={{ fontSize: '14px', color: R.muted, maxWidth: '420px', lineHeight: 1.5 }}>
        Bu sayfa yüklenirken bir sorun çıktı.
      </div>
      {/* KURAL — TÜRKÇE: tarayıcının İngilizce çalışma hatası ("Cannot read properties…") gösterilmez; yalnız Türkçe mesaj. */}
      {turkceHataMesaji(error?.message) && (
        <div
          style={{
            fontSize: '12px',
            color: R.warn,
            background: 'rgba(164,91,62,0.08)',
            border: '1px solid rgba(164,91,62,0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            maxWidth: '420px',
            wordBreak: 'break-word',
          }}
        >
          {turkceHataMesaji(error?.message)}
        </div>
      )}
      <button
        type="button"
        onClick={() => reset()}
        style={{
          marginTop: '8px',
          background: R.pine,
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 18px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Tekrar dene
      </button>
    </div>
  )
}
