'use client'
import Link from 'next/link'
import { EmptyState, SectionHeader } from './ui'

export function KlinikHatirlatmaView({
  title, subtitle, acil, basePath, satirlar, ritim,
}: {
  title: string
  subtitle: string
  acil: string
  basePath: string
  satirlar?: Array<{ ad: string; durum: string }>
  ritim?: string[]
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
      {ritim && ritim.length > 0 && (
        <div style={{ margin: '0 20px 16px', fontSize: 13, color: '#475569' }}>
          <div style={{ fontWeight: 650, marginBottom: 6 }}>Bakım ritmi (tarih uzman kaydınca kesinleşir)</div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>{ritim.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
      <p style={{ margin: '0 20px 16px', fontSize: 13, color: '#b45309' }}>{acil}</p>
      <p style={{ margin: '0 20px 16px', fontSize: 12, color: '#64748b' }}>Bu sayfa tanı veya doz yazmaz. Acilde portal mesajı beklenmez — 112.</p>
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
    </div>
  )
}
