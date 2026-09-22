'use client'
import Link from 'next/link'
import { EmptyState, SectionHeader } from './ui'

export function KlinikHatirlatmaView({
  title, subtitle, acil, basePath, satirlar,
}: {
  title: string
  subtitle: string
  acil: string
  basePath: string
  satirlar?: Array<{ ad: string; durum: string }>
}) {
  const dolu = (satirlar || []).filter((s) => s.durum !== 'planli' || !s.ad.includes('kaydedilince'))
  return (
    <div className="sg-fade">
      <SectionHeader title={title} subtitle={subtitle} />
      {!dolu.length ? (
        <EmptyState art="takip" title="Henüz paylaşılan tarih yok" body="Uzmanınız kontrol tarihi kaydettiğinde burada görünür. Tanı ve doz yoktur." />
      ) : (
        <ul style={{ margin: '0 20px 16px', paddingLeft: 18, color: '#1e293b' }}>
          {dolu.map((s) => <li key={s.ad}>{s.ad}</li>)}
        </ul>
      )}
      <p style={{ margin: '0 20px 16px', fontSize: 13, color: '#b45309' }}>{acil}</p>
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
    </div>
  )
}
