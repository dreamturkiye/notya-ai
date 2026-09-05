'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { PortalBundle, PortalResult, ResultKind } from '@/lib/portal/types'
import { imagingDisplayLabel } from '@/lib/doktor/imagingModalities'
import { EmptyState, ListRow, SectionHeader, SoftPanel, formatTrDate } from './ui'

function modalityLabel(raw?: string | null) {
  if (!raw) return 'Görüntüleme'
  return imagingDisplayLabel(raw, 'patient')
}

const FILTERS: Array<{ key: ResultKind | 'hepsi'; label: string }> = [
  { key: 'hepsi', label: 'Hepsi' },
  { key: 'laboratuvar', label: 'Laboratuvar' },
  { key: 'goruntuleme', label: 'Görüntüleme' },
  { key: 'ekg', label: 'EKG' },
  { key: 'diger', label: 'Diğer' },
]

function durumLabel(d: PortalResult['durum']) {
  switch (d) {
    case 'anormal':
      return { text: 'Dikkat', color: 'var(--sg-warn)' }
    case 'normal':
      return { text: 'Normal', color: 'var(--sg-ok)' }
    case 'beklemede':
      return { text: 'Beklemede', color: 'var(--sg-muted)' }
    default:
      return { text: 'Raporlandı', color: 'var(--sg-accent)' }
  }
}

export function ResultsListView({ basePath, data }: { basePath: string; data: PortalBundle }) {
  const [filter, setFilter] = useState<ResultKind | 'hepsi'>('hepsi')
  const list = useMemo(
    () => (filter === 'hepsi' ? data.results : data.results.filter((r) => r.tur === filter)),
    [data.results, filter]
  )

  return (
    <div className="sg-fade">
      <SectionHeader title="Test sonuçları" subtitle="Laboratuvar, görüntüleme ve diğer tetkikler." />
      <div className="sg-filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`sg-chip-btn${filter === f.key ? ' is-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!list.length ? (
        <EmptyState title="Sonuç yok" body="Bu filtrede yayınlanmış sonuç bulunmuyor." />
      ) : (
        <SoftPanel className="sg-list-panel">
          {list.map((r) => {
            const d = durumLabel(r.durum)
            return (
              <ListRow
                key={r.id}
                href={`${basePath}/sonuclar/${r.id}`}
                meta={`${formatTrDate(r.tarih)} · ${r.tur}`}
                title={r.baslik}
                detail={r.ozet}
                badge={<span style={{ color: d.color, fontWeight: 800 }}>{d.text}</span>}
              />
            )
          })}
        </SoftPanel>
      )}
    </div>
  )
}

export function ResultDetailView({
  basePath,
  result,
}: {
  basePath: string
  result: PortalResult | null
}) {
  if (!result) {
    return (
      <>
        <SectionHeader title="Sonuç detayı" />
        <EmptyState title="Sonuç bulunamadı" body="Bu kayda erişilemiyor." />
        <Link href={`${basePath}/sonuclar`} className="sg-back-link" style={{ marginTop: 12 }}>
          ← Sonuçlara dön
        </Link>
      </>
    )
  }

  return (
    <div className="sg-fade">
      <Link href={`${basePath}/sonuclar`} className="sg-back-link">
        ← Sonuçlar
      </Link>
      <SectionHeader title={result.baslik} subtitle={`${formatTrDate(result.tarih)} · ${result.tur}`} />

      {result.labSatirlari && result.labSatirlari.length > 0 ? (
        <SoftPanel>
          <div className="sg-lab-mobile">
            <div className="sg-lab-cards">
              {result.labSatirlari.map((row) => (
                <div key={row.test} className="sg-lab-card">
                  <div className="sg-lab-card-name">{row.test}</div>
                  <div className="sg-lab-card-row">
                    <span
                      className="sg-lab-value"
                      style={{
                        color: row.anormal ? 'var(--sg-warn)' : 'inherit',
                        fontWeight: row.anormal ? 800 : 700,
                      }}
                    >
                      {row.deger}
                      {row.birim ? <span className="sg-lab-unit">{row.birim}</span> : null}
                    </span>
                    <span style={{ color: 'var(--sg-muted)', textAlign: 'right' }}>Ref: {row.referans}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="sg-lab-desktop sg-lab-table-wrap">
            <table className="sg-lab-table">
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--sg-muted)', fontSize: 12 }}>
                  <th style={{ padding: '10px 8px' }}>Test</th>
                  <th style={{ padding: '10px 8px' }}>Değer</th>
                  <th style={{ padding: '10px 8px' }}>Referans</th>
                </tr>
              </thead>
              <tbody>
                {result.labSatirlari.map((row) => (
                  <tr key={row.test} style={{ borderTop: '1px solid var(--sg-line)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{row.test}</td>
                    <td
                      className="sg-lab-value"
                      style={{
                        padding: '12px 8px 12px 20px',
                        color: row.anormal ? 'var(--sg-warn)' : 'inherit',
                        fontWeight: row.anormal ? 800 : 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.deger}
                      {row.birim ? <span className="sg-lab-unit">{row.birim}</span> : null}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--sg-muted)', whiteSpace: 'nowrap' }}>
                      {row.referans}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SoftPanel>
      ) : null}

      {(result.gorselUrl || result.raporMetni) && (
        <SoftPanel style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
          {result.gorselUrl ? (
            <div className="sg-imaging-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.gorselUrl}
                alt={modalityLabel(result.modalite)}
                className="sg-imaging-img"
              />
              <div className="sg-imaging-actions">
                <a
                  href={result.gorselUrl}
                  download={`${(result.baslik || 'goruntuleme').replace(/\s+/g, '-').toLowerCase()}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sg-chip-btn is-active"
                >
                  İndir
                </a>
                <a
                  href={result.gorselUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sg-chip-btn"
                >
                  Tam ekran
                </a>
              </div>
            </div>
          ) : null}
          {result.raporMetni ? (
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 8 }}>
                {modalityLabel(result.modalite)}
              </div>
              <p className="sg-prose">{result.raporMetni}</p>
            </div>
          ) : null}
        </SoftPanel>
      )}
    </div>
  )
}
