'use client'

import Link from 'next/link'
import type { PortalBundle, PortalVisit } from '@/lib/portal/types'
import { EmptyState, ListRow, SectionHeader, SoftPanel, formatTrDate } from './ui'

export function VisitsListView({ basePath, data }: { basePath: string; data: PortalBundle }) {
  return (
    <div className="sg-fade">
      <SectionHeader title="Ziyaretler" subtitle="Muayene kayıtları ve ziyaret özetleri." />
      {!data.visits.length ? (
        <EmptyState title="Ziyaret bulunamadı" body="Doktorunuz paylaştığında ziyaretleriniz burada listelenir." />
      ) : (
        <SoftPanel style={{ padding: '4px 16px' }}>
          {data.visits.map((v) => (
            <ListRow
              key={v.id}
              href={`${basePath}/ziyaretler/${v.id}`}
              meta={formatTrDate(v.tarih)}
              title={`${v.brans} · ${v.hekim}`}
              detail={v.basvuruNedeni}
              badge={<span style={{ color: 'var(--sg-accent)', fontWeight: 700, fontSize: 13 }}>Özet →</span>}
            />
          ))}
        </SoftPanel>
      )}
    </div>
  )
}

export function VisitDetailView({
  basePath,
  visit,
}: {
  basePath: string
  visit: PortalVisit | null
}) {
  if (!visit) {
    return (
      <>
        <SectionHeader title="Ziyaret özeti" />
        <EmptyState title="Ziyaret bulunamadı" body="Bu kayda erişilemiyor veya süresi dolmuş olabilir." />
        <Link href={`${basePath}/ziyaretler`} className="sg-back-link" style={{ marginTop: 16 }}>
          ← Ziyaretlere dön
        </Link>
      </>
    )
  }

  const blocks: Array<{ label: string; text?: string }> = [
    { label: 'Başvuru nedeni', text: visit.basvuruNedeni },
    { label: 'Subjektif', text: visit.subjektif },
    { label: 'Objektif', text: visit.objektif },
    { label: 'Değerlendirme', text: visit.degerlendirme },
    { label: 'Plan', text: visit.plan },
    { label: 'Takip', text: visit.takip },
  ]

  return (
    <div className="sg-fade">
      <Link href={`${basePath}/ziyaretler`} className="sg-back-link">
        ← Ziyaretler
      </Link>
      <SectionHeader
        title="Ziyaret özeti"
        subtitle={`${formatTrDate(visit.tarih, true)} · ${visit.brans} · ${visit.hekim}`}
      />
      {visit.vitaller && Object.values(visit.vitaller).some((v) => v != null && v !== '') ? (
        <SoftPanel style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 10 }}>VİTALLER</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(visit.vitaller).map(([k, val]) =>
              val == null || val === '' ? null : (
                <span
                  key={k}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: 'var(--sg-accent-soft)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {k}: {String(val)}
                </span>
              )
            )}
          </div>
        </SoftPanel>
      ) : null}

      {blocks
        .filter((b) => b.text)
        .map((b) => (
          <SoftPanel key={b.label} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-accent)', marginBottom: 6 }}>{b.label}</div>
            <p style={{ margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{b.text}</p>
          </SoftPanel>
        ))}

      {visit.ilacDegisiklikleri && visit.ilacDegisiklikleri.length > 0 ? (
        <SoftPanel>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 8 }}>İLAÇ DEĞİŞİKLİKLERİ</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {visit.ilacDegisiklikleri.map((x) => (
              <li key={x} style={{ marginBottom: 4, lineHeight: 1.45 }}>
                {x}
              </li>
            ))}
          </ul>
        </SoftPanel>
      ) : null}
    </div>
  )
}
