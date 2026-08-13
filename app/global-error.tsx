'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: '#060C18', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Bir hata oluştu</div>
          <div style={{ fontSize: '14px', color: '#E2E8F0', maxWidth: '420px', lineHeight: 1.5 }}>
            Sayfa yüklenemedi. Lütfen tekrar deneyin.
          </div>
          {error?.message && (
            <div
              style={{
                fontSize: '12px',
                color: '#FECACA',
                background: 'rgba(220,38,38,0.18)',
                border: '1px solid rgba(248,113,113,0.45)',
                borderRadius: '12px',
                padding: '10px 12px',
                maxWidth: '420px',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </div>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: '8px',
              background: '#0F9B8E',
              color: '#041016',
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
      </body>
    </html>
  )
}
