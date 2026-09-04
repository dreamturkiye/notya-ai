'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { PortalBundle, PortalResult, ResultKind } from '@/lib/portal/types'
import { EmptyState, ListRow, SectionHeader, SoftPanel, formatTrDate } from './ui'

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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              background: filter === f.key ? 'var(--sg-accent)' : 'var(--sg-surface)',
              color: filter === f.key ? '#fff' : 'var(--sg-muted)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!list.length ? (
        <EmptyState title="Sonuç yok" body="Bu filtrede yayınlanmış sonuç bulunmuyor." />
      ) : (
        <SoftPanel style={{ padding: '4px 16px' }}>
          {list.map((r) => {
            const d = durumLabel(r.durum)
            return (
              <ListRow
                key={r.id}
                href={`${basePath}/sonuclar/${r.id}`}
                meta={`${formatTrDate(r.tarih)} · ${r.tur}`}
                title={r.baslik}
                detail={r.ozet}
                badge={<span style={{ color: d.color, fontWeight: 800, fontSize: 12 }}>{d.text}</span>}
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
      </>
    )
  }

  return (
    <div className="sg-fade">
      <Link href={`${basePath}/sonuclar`} style={{ fontSize: 13, fontWeight: 700, color: 'var(--sg-accent)' }}>
        ← Sonuçlar
      </Link>
      <SectionHeader title={result.baslik} subtitle={`${formatTrDate(result.tarih)} · ${result.tur}`} />

      {result.labSatirlari && result.labSatirlari.length > 0 ? (
        <SoftPanel style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--sg-muted)', fontSize: 12 }}>
                <th style={{ padding: '8px 6px' }}>Test</th>
                <th style={{ padding: '8px 6px' }}>Değer</th>
                <th style={{ padding: '8px 6px' }}>Referans</th>
              </tr>
            </thead>
            <tbody>
              {result.labSatirlari.map((row) => (
                <tr key={row.test} style={{ borderTop: '1px solid var(--sg-line)' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 700 }}>{row.test}</td>
                  <td
                    style={{
                      padding: '10px 6px',
                      color: row.anormal ? 'var(--sg-warn)' : 'inherit',
                      fontWeight: row.anormal ? 800 : 600,
                    }}
                  >
                    {row.deger} {row.birim}
                  </td>
                  <td style={{ padding: '10px 6px', color: 'var(--sg-muted)' }}>{row.referans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SoftPanel>
      ) : null}

      {(result.gorselUrl || result.raporMetni) && (
        <SoftPanel style={{ marginTop: 14, padding: 0, overflow: 'hidden' }}>
          {result.gorselUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.gorselUrl}
              alt={result.modalite || 'Görüntüleme'}
              style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
            />
          ) : null}
          {result.raporMetni ? (
            <div style={{ padding: '16px 18px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 8 }}>
                {result.modalite || 'Rapor'}
              </div>
              <p style={{ margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{result.raporMetni}</p>
            </div>
          ) : null}
        </SoftPanel>
      )}
    </div>
  )
}
