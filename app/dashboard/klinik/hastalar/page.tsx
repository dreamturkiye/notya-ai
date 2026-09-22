'use client'
import KlinikNav from '@/components/klinik/KlinikNav'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function KlinikHastalarPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFAFA', fontFamily: 'system-ui' }}>
      <KlinikNav clinicName="Notya Klinik" />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 26, color: '#0A1628' }}>Hastalar</h1>
        <p style={{ color: 'rgba(10,22,40,0.55)', fontSize: 14, maxWidth: 640 }}>
          Klinik hasta kaydı Doktor dosyasından ayrıdır. Pabau bağlıysa randevu ve müşteri oradan gelir;
          Notya Klinik araçları dalınıza özel seans / bakım takvimini tutar.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/klinik-tools" style={{ color: '#2563EB', fontWeight: 600 }}>Araçlar →</Link>
          <Link href="/dashboard/klinik/pabau" style={{ color: '#2563EB', fontWeight: 600 }}>Pabau →</Link>
        </div>
      </div>
    </div>
  )
}
