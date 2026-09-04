'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { PortalNavKey } from '@/lib/portal/types'

const NAV: Array<{ key: PortalNavKey; label: string; path: string }> = [
  { key: 'ozet', label: 'Özet', path: '' },
  { key: 'mesajlar', label: 'Mesajlar', path: '/mesajlar' },
  { key: 'ziyaretler', label: 'Ziyaretler', path: '/ziyaretler' },
  { key: 'sonuclar', label: 'Sonuçlar', path: '/sonuclar' },
  { key: 'ilaclar', label: 'İlaçlar', path: '/ilaclar' },
  { key: 'gecmis', label: 'Öykü', path: '/gecmis' },
  { key: 'takip', label: 'Takip', path: '/takip' },
]

export function PortalShell({
  basePath,
  children,
}: {
  basePath: string
  children: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('.sg-nav-link.is-active')
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="sg-shell">
      <header className="sg-header">
        <div className="sg-header-inner">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <Link href={basePath} style={{ display: 'flex', alignItems: 'baseline', gap: 8, minHeight: 40 }}>
              <span className="sg-display" style={{ fontSize: 22, color: 'var(--sg-accent)' }}>
                Notya
              </span>
              <span style={{ color: 'var(--sg-muted)', fontSize: 14, fontWeight: 600 }}>· Sağlığım</span>
            </Link>
            <span className="sg-header-tag">Hasta alanı</span>
          </div>
          <nav ref={navRef} className="sg-nav" aria-label="Sağlığım bölümleri">
            {NAV.map((item) => {
              const href = `${basePath}${item.path}`
              const active =
                item.path === ''
                  ? pathname === basePath || pathname === `${basePath}/`
                  : pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link key={item.key} href={href} className={`sg-nav-link${active ? ' is-active' : ''}`}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="sg-main">{children}</main>
      <footer className="sg-footer">
        Notya · Sağlığım — kayıtlarınız doktorunuzla paylaşılır. Acil durumda 112&apos;yi arayın.
      </footer>
    </div>
  )
}
