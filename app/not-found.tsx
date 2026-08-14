import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#060C18',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '14px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: '42px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>404</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Sayfa bulunamadı</div>
      <div style={{ fontSize: '14px', color: '#E2E8F0', maxWidth: '420px', lineHeight: 1.5 }}>
        Bu adres mevcut değil veya taşınmış olabilir. Ana sayfaya dönüp devam edebilirsiniz.
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
        <Link
          href="/home"
          style={{
            background: '#0F9B8E',
            color: '#041016',
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
            background: 'rgba(255,255,255,0.08)',
            color: '#F8FAFC',
            border: '1px solid rgba(255,255,255,0.18)',
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
