'use client'

import Link from 'next/link'
import type { PortalBundle, PortalVisit } from '@/lib/portal/types'
import {
  YASAMSAL_BULGULAR_BASLIK,
  hasYasamsalBulgular,
  yasamsalBulguSatirlari,
} from '@/lib/clinical/yasamsalBulgular'
import { EmptyState, ListRow, SectionHeader, SoftPanel, formatTrDate } from './ui'

export function VisitsListView({ basePath, data }: { basePath: string; data: PortalBundle }) {
  return (
    <div className="sg-fade">
      <SectionHeader title="Ziyaretler" subtitle="Muayene kayıtları ve ziyaret özetleri." />
      {!data.visits.length ? (
        <EmptyState title="Ziyaret bulunamadı" body="Doktorunuz paylaştığında ziyaretleriniz burada listelenir." />
      ) : (
        <SoftPanel className="sg-list-panel">
          {data.visits.map((v) => (
            <ListRow
              key={v.id}
              href={`${basePath}/ziyaretler/${v.id}`}
              meta={formatTrDate(v.tarih)}
              title={`${v.brans} · ${v.hekim}`}
              detail={v.basvuruNedeni}
              badge={<span style={{ color: 'var(--sg-accent)', fontWeight: 700 }}>Özet →</span>}
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
    { label: 'Anamnez', text: visit.subjektif },
    { label: 'Fizik muayene', text: visit.objektif },
    { label: 'Değerlendirme', text: visit.degerlendirme },
    { label: 'Plan', text: visit.plan },
    { label: 'Takip', text: visit.takip },
  ]

  const vitalLines = yasamsalBulguSatirlari(visit.vitaller)

  return (
    <div className="sg-fade">
      <Link href={`${basePath}/ziyaretler`} className="sg-back-link">
        ← Ziyaretler
      </Link>
      <SectionHeader
        title="Ziyaret özeti"
        subtitle={`${formatTrDate(visit.tarih, true)} · ${visit.brans} · ${visit.hekim}`}
      />
      {hasYasamsalBulgular(visit.vitaller) ? (
        <SoftPanel style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 10 }}>
            {YASAMSAL_BULGULAR_BASLIK}
          </div>
          <div className="sg-vital-chips">
            {vitalLines.map((line) => (
              <span key={line.key} className="sg-vital-chip">
                {line.label}: {line.value}
              </span>
            ))}
          </div>
        </SoftPanel>
      ) : null}

      {blocks
        .filter((b) => b.text)
        .map((b) => (
          <SoftPanel key={b.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-accent)', marginBottom: 6 }}>{b.label}</div>
            <p className="sg-prose">{b.text}</p>
          </SoftPanel>
        ))}

      {visit.ilacDegisiklikleri && visit.ilacDegisiklikleri.length > 0 ? (
        <SoftPanel>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 8 }}>İLAÇ DEĞİŞİKLİKLERİ</div>
          <ul className="sg-history-list">
            {visit.ilacDegisiklikleri.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </SoftPanel>
      ) : null}
    </div>
  )
}
