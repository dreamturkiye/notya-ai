'use client'

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
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Bir hata oluştu</div>
      <div style={{ fontSize: '14px', color: '#E2E8F0', maxWidth: '420px', lineHeight: 1.5 }}>
        Bu sayfa yüklenirken bir sorun çıktı.
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
  )
}
