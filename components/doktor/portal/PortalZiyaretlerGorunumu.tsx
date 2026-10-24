'use client'

/**
 * The patient portal's visits (Türkiye: "Sağlığım" › Ziyaretler): the list and one visit's summary, as plain
 * presentational views. Türkiye's VisitsView and every country's patient page draw THROUGH these. No word is written
 * here: every string, date and link arrives as a prop. Needs `sagligim.css`.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { EmptyState, ListRow, SectionHeader, SoftPanel } from './ui'

export type PortalZiyaretSatiri = { id: string; href: string; meta: string; baslik: string; detay?: string; rozet: ReactNode }

export function PortalZiyaretListesiGorunumu({ baslik, altBaslik, bos, satirlar, ek, git }: {
  baslik: string
  altBaslik: string
  bos: { baslik: string; govde: string }
  satirlar: PortalZiyaretSatiri[]
  /** After the list (Türkiye: the referrals). */
  ek?: ReactNode
  git?: (href: string) => void
}) {
  return (
    <div className="sg-fade">
      <SectionHeader title={baslik} subtitle={altBaslik} />
      {!satirlar.length ? (
        <EmptyState art="ziyaretler" title={bos.baslik} body={bos.govde} />
      ) : (
        <SoftPanel className="sg-list-panel">
          {satirlar.map((v) => (
            <ListRow key={v.id} href={v.href} meta={v.meta} title={v.baslik} detail={v.detay} badge={v.rozet} onGit={git} />
          ))}
        </SoftPanel>
      )}
      {ek}
    </div>
  )
}

export type PortalZiyaretBlogu = { label: string; text?: string }

export function PortalZiyaretDetayGorunumu({ geriHref, geriEtiket, baslik, altBaslik, vitaller, bloklar, ilac, git }: {
  geriHref: string
  geriEtiket: string
  baslik: string
  altBaslik: string
  vitaller: { baslik: string; satirlar: Array<{ key: string; label: string; value: string }> } | null
  bloklar: PortalZiyaretBlogu[]
  ilac: { baslik: string; satirlar: string[] } | null
  git?: (href: string) => void
}) {
  return (
    <div className="sg-fade">
      <Link href={geriHref} className="sg-back-link" onClick={git ? (e) => { e.preventDefault(); git(geriHref) } : undefined}>
        {geriEtiket}
      </Link>
      <SectionHeader title={baslik} subtitle={altBaslik} />
      {vitaller ? (
        <SoftPanel style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 10 }}>{vitaller.baslik}</div>
          <div className="sg-vital-chips">
            {vitaller.satirlar.map((line) => (
              <span key={line.key} className="sg-vital-chip">
                {line.label}: {line.value}
              </span>
            ))}
          </div>
        </SoftPanel>
      ) : null}

      {bloklar
        .filter((b) => b.text)
        .map((b) => (
          <SoftPanel key={b.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-accent)', marginBottom: 6 }}>{b.label}</div>
            <p className="sg-prose">{b.text}</p>
          </SoftPanel>
        ))}

      {ilac && ilac.satirlar.length > 0 ? (
        <SoftPanel>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sg-muted)', marginBottom: 8 }}>{ilac.baslik}</div>
          <ul className="sg-history-list">
            {ilac.satirlar.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </SoftPanel>
      ) : null}
    </div>
  )
}

/** A visit that cannot be shown: gone, or the link ran out. */
export function PortalZiyaretYokGorunumu({ baslik, govde, geriHref, geriEtiket, git }: {
  baslik: { ust: string; bos: string }
  govde: string
  geriHref: string
  geriEtiket: string
  git?: (href: string) => void
}) {
  return (
    <>
      <SectionHeader title={baslik.ust} />
      <EmptyState art={false} title={baslik.bos} body={govde} />
      <Link href={geriHref} className="sg-back-link" style={{ marginTop: 16 }} onClick={git ? (e) => { e.preventDefault(); git(geriHref) } : undefined}>
        {geriEtiket}
      </Link>
    </>
  )
}
