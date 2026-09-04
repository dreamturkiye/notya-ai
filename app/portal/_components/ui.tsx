import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="sg-fade sg-section-header">
      <div style={{ minWidth: 0, flex: '1 1 220px' }}>
        <h1 className="sg-display sg-section-title">{title}</h1>
        {subtitle ? <p className="sg-section-sub">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="sg-fade sg-empty">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sagligim/empty-cool.jpg" alt="" className="sg-empty-img" />
      <div className="sg-empty-copy">
        <h2 className="sg-display" style={{ margin: 0, fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
          {title}
        </h2>
        <p style={{ margin: '10px 0 0', color: 'var(--sg-muted)', lineHeight: 1.5, fontSize: 15 }}>{body}</p>
      </div>
    </div>
  )
}

export function ListRow({
  href,
  title,
  meta,
  detail,
  badge,
}: {
  href?: string
  title: string
  meta?: string
  detail?: string
  badge?: ReactNode
}) {
  const inner = (
    <div className="sg-list-row">
      <div className="sg-list-row-main">
        {meta ? <div className="sg-list-row-meta">{meta}</div> : null}
        <div className="sg-list-row-title">{title}</div>
        {detail ? <div className="sg-list-row-detail">{detail}</div> : null}
      </div>
      {badge ? <div className="sg-list-row-badge">{badge}</div> : null}
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="sg-list-row-link">
        {inner}
      </Link>
    )
  }
  return inner
}

export function SoftPanel({
  children,
  style,
  className,
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <div className={['sg-panel', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  )
}

export function formatTrDate(iso: string, withTime = false) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: withTime ? 'short' : 'long',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    })
  } catch {
    return iso
  }
}
