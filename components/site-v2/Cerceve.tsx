'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { HEKIM, KAYNAK } from '@/lib/site-v2/demoVeri'
import { siteV2Yol } from '@/lib/site-v2/sandbox'

const NAV = [
  { href: '/', label: 'Stüdyo' },
  { href: '/doktor', label: 'Landing' },
  { href: '/uygulama', label: 'Uygulama' },
  { href: '/hastalar', label: 'Hastalar' },
  { href: '/asistan', label: 'Asistan' },
  { href: '/sagligim', label: 'Sağlığım' },
]

export function Cerceve({
  children,
  baslik,
}: {
  children: ReactNode
  baslik?: string
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE6', color: '#142018' }}>
      <div style={{
        background: '#1B4332', color: '#F4EFE6', fontSize: 12, letterSpacing: '0.08em',
        textTransform: 'uppercase', padding: '8px 20px', display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        <span>Sandbox · production’a gitmez</span>
        <span>{KAYNAK}</span>
        <span>{HEKIM.ad}</span>
      </div>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '16px 22px', borderBottom: '1px solid #D8D0C4', background: '#FBF7F0',
      }}>
        <Link href={siteV2Yol('/')} style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, color: '#142018', textDecoration: 'none' }}>
          notya
        </Link>
        <nav style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>
          {NAV.map((n) => (
            <Link key={n.href} href={siteV2Yol(n.href)} style={{ color: '#3D5348', textDecoration: 'none' }}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      {baslik && (
        <div style={{ padding: '28px 22px 0', maxWidth: 1080, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 32, margin: 0 }}>{baslik}</h1>
        </div>
      )}
      <main style={{ padding: '22px', maxWidth: 1080, margin: '0 auto' }}>{children}</main>
    </div>
  )
}
