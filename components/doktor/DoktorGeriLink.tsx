'use client'

import React from 'react'
import Link from 'next/link'

type Props = {
  href: string
  children?: React.ReactNode
  /** Optional secondary “İleri” sibling rendered to the right */
  ileriHref?: string
  ileriLabel?: string
  style?: React.CSSProperties
}

const linkStyle: React.CSSProperties = {
  color: '#2DD4BF',
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

/**
 * Application-wide doctor back control — always an explicit destination (never history.back).
 */
export default function DoktorGeriLink({ href, children = '← Geri', ileriHref, ileriLabel, style }: Props) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, ...style }}>
      <Link href={href} style={linkStyle}>
        {children}
      </Link>
      {ileriHref && ileriLabel ? (
        <Link href={ileriHref} style={{ ...linkStyle, color: '#8FA0B5' }}>
          {ileriLabel} →
        </Link>
      ) : null}
    </span>
  )
}
