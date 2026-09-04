export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div
      className="sg-fade"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        margin: '20px 0 14px',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1 className="sg-display" style={{ margin: 0, fontSize: 'clamp(1.6rem, 4vw, 2.1rem)' }}>
          {title}
        </h1>
        {subtitle ? (
          <p style={{ margin: '8px 0 0', color: 'var(--sg-muted)', fontSize: 15, maxWidth: 520, lineHeight: 1.45 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="sg-fade"
      style={{
        marginTop: 12,
        borderRadius: 'var(--sg-radius)',
        overflow: 'hidden',
        border: '1px solid var(--sg-line)',
        background: 'var(--sg-surface)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sagligim/calm-empty.jpg"
        alt=""
        style={{
          width: '100%',
          height: 'clamp(120px, 28vw, 160px)',
          objectFit: 'cover',
          display: 'block',
          opacity: 0.92,
        }}
      />
      <div style={{ padding: '20px 22px 24px' }}>
        <h2 className="sg-display" style={{ margin: 0, fontSize: 22 }}>
          {title}
        </h2>
        <p style={{ margin: '8px 0 0', color: 'var(--sg-muted)', lineHeight: 1.5 }}>{body}</p>
      </div>
    </div>
  )
}

import Link from 'next/link'

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
  badge?: React.ReactNode
}) {
  const inner = (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '16px 2px',
        minHeight: 56,
        borderBottom: '1px solid var(--sg-line)',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ minWidth: 0 }}>
        {meta ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sg-accent)', marginBottom: 4 }}>{meta}</div>
        ) : null}
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
        {detail ? (
          <div style={{ marginTop: 4, color: 'var(--sg-muted)', fontSize: 14, lineHeight: 1.4 }}>{detail}</div>
        ) : null}
      </div>
      {badge}
    </div>
  )
  if (href) {
    return (
      <Link href={href} style={{ display: 'block' }}>
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
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--sg-surface)',
        border: '1px solid var(--sg-line)',
        borderRadius: 'var(--sg-radius)',
        padding: '18px 16px',
        ...style,
      }}
    >
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
      month: 'long',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    })
  } catch {
    return iso
  }
}
