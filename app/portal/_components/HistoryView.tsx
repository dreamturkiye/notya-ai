'use client'

import type { PortalBundle } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel, formatTrDate } from './ui'

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SoftPanel style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sg-accent)', marginBottom: 8 }}>{title}</div>
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
              <ul className="sg-history-list">
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
              <ul className="sg-history-list">
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
              <ul className="sg-history-list">
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
              <ul className="sg-history-list">
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
              <ul className="sg-history-list">
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
