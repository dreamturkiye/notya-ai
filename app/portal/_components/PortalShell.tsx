'use client'

import Link from 'next/link'
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

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(14px)',
          background: 'rgba(244, 241, 234, 0.88)',
          borderBottom: '1px solid var(--sg-line)',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '14px 20px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <Link href={basePath} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="sg-display" style={{ fontSize: 22, color: 'var(--sg-accent)' }}>
                Notya
              </span>
              <span style={{ color: 'var(--sg-muted)', fontSize: 14, fontWeight: 600 }}>· Sağlığım</span>
            </Link>
            <span style={{ fontSize: 12, color: 'var(--sg-muted)' }}>Hasta alanı</span>
          </div>
          <nav
            style={{
              display: 'flex',
              gap: 4,
              overflowX: 'auto',
              paddingBottom: 10,
              WebkitOverflowScrolling: 'touch',
            }}
            aria-label="Sağlığım bölümleri"
          >
            {NAV.map((item) => {
              const href = `${basePath}${item.path}`
              const active =
                item.path === ''
                  ? pathname === basePath || pathname === `${basePath}/`
                  : pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={item.key}
                  href={href}
                  style={{
                    flex: '0 0 auto',
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: active ? 'var(--sg-accent-ink)' : 'var(--sg-muted)',
                    background: active ? 'var(--sg-accent-soft)' : 'transparent',
                    transition: 'background 0.2s ease, color 0.2s ease',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '8px 20px 48px' }}>
        {children}
      </main>
      <footer
        style={{
          borderTop: '1px solid var(--sg-line)',
          padding: '18px 20px 28px',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--sg-muted)',
        }}
      >
        Notya · Sağlığım — kayıtlarınız doktorunuzla paylaşılır. Acil durumda 112&apos;yi arayın.
      </footer>
    </div>
  )
}
