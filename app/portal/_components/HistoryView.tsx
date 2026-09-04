'use client'

import type { PortalBundle } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel, formatTrDate } from './ui'

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SoftPanel style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-accent)', marginBottom: 8 }}>{title}</div>
      {children}
    </SoftPanel>
  )
}

export function HistoryView({ data }: { data: PortalBundle }) {
  const h = data.history
  const empty =
    !h.kronikHastaliklar.length &&
    !h.alerjiler.length &&
    !h.ameliyatlar.length &&
    !h.aileOykusu.length &&
    !h.asilar.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Tıbbi ve aile öyküsü" subtitle="Kronik hastalıklar, alerjiler, ameliyatlar ve aşılar." />
      {empty ? (
        <EmptyState
          title="Öykü henüz paylaşılmadı"
          body="Doktorunuz notlarından çıkarılabilen bilgiler burada görünecek."
        />
      ) : (
        <>
          <Block title="Kronik hastalıklar">
            {h.kronikHastaliklar.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {h.kronikHastaliklar.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <span style={{ color: 'var(--sg-muted)' }}>—</span>
            )}
          </Block>
          <Block title="Alerjiler">
            {h.alerjiler.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {h.alerjiler.map((x) => (
                  <li key={x} style={{ color: 'var(--sg-warn)', fontWeight: 700 }}>
                    {x}
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: 'var(--sg-muted)' }}>Bilinen alerji yok</span>
            )}
          </Block>
          <Block title="Ameliyatlar">
            {h.ameliyatlar.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {h.ameliyatlar.map((x) => (
                  <li key={`${x.yil}-${x.aciklama}`}>
                    <strong>{x.yil}</strong> — {x.aciklama}
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: 'var(--sg-muted)' }}>—</span>
            )}
          </Block>
          <Block title="Aile öyküsü">
            {h.aileOykusu.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {h.aileOykusu.map((x) => (
                  <li key={`${x.yakinlik}-${x.durum}`}>
                    <strong>{x.yakinlik}</strong>: {x.durum}
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: 'var(--sg-muted)' }}>—</span>
            )}
          </Block>
          <Block title="Aşılar">
            {h.asilar.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {h.asilar.map((x) => (
                  <li key={`${x.ad}-${x.tarih}`}>
                    {x.ad} · {formatTrDate(x.tarih)}
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: 'var(--sg-muted)' }}>—</span>
            )}
          </Block>
        </>
      )}
    </div>
  )
}
