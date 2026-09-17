'use client'

/**
 * Shared semantic Geri (+ optional İleri). Prefer this over history.back().
 * Dark = doktor chrome; light = mali / print toolbars.
 */
import React from 'react'
import Link from 'next/link'

type Props = {
  href: string
  children?: React.ReactNode
  ileriHref?: string
  ileriLabel?: string
  variant?: 'dark' | 'light'
  style?: React.CSSProperties
  /** button-style dismiss for in-page overlays (no navigation) */
  onClick?: () => void
}

const dark: React.CSSProperties = {
  color: '#2DD4BF',
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit',
}

const light: React.CSSProperties = {
  ...dark,
  color: '#475569',
  fontSize: 13,
}

export default function GeriLink({
  href,
  children = '← Geri',
  ileriHref,
  ileriLabel,
  variant = 'dark',
  style,
  onClick,
}: Props) {
  const base = variant === 'light' ? light : dark
  const geri = onClick ? (
    <button type="button" onClick={onClick} style={{ ...base, ...style }}>
      {children}
    </button>
  ) : (
    <Link href={href} style={{ ...base, ...style }}>
      {children}
    </Link>
  )

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      {geri}
      {ileriHref && ileriLabel ? (
        <Link href={ileriHref} style={{ ...base, color: variant === 'light' ? '#64748B' : '#8FA0B5' }}>
          {ileriLabel} →
        </Link>
      ) : null}
    </span>
  )
}
