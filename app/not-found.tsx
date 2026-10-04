import Link from 'next/link'
import { CHROME_RENK as R, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'

export default function NotFound() {
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
      <div style={{ fontSize: '42px', fontWeight: 560, color: R.pine, letterSpacing: '-0.02em', fontFamily: CHROME_FONT.serif }}>404</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: R.ink, fontFamily: CHROME_FONT.serif }}>Sayfa bulunamadı</div>
      <div style={{ fontSize: '14px', color: R.muted, maxWidth: '420px', lineHeight: 1.5 }}>
        Bu adres mevcut değil veya taşınmış olabilir. Ana sayfaya dönüp devam edebilirsiniz.
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
        <Link
          href="/home"
          style={{
            background: R.pine,
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 18px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Ana Sayfa
        </Link>
        <Link
          href="/giris"
          style={{
            background: 'transparent',
            color: R.pine,
            border: `1px solid ${R.pine}`,
            borderRadius: '12px',
            padding: '12px 18px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Giriş
        </Link>
      </div>
    </div>
  )
}
