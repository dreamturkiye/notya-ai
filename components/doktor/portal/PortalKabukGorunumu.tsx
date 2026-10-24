'use client'

/**
 * The patient portal's frame (Türkiye: "Sağlığım") as a plain presentational view: the word mark, the patient's name,
 * the row of section tabs and the footer. Türkiye's PortalShell and every country's patient page draw THROUGH this, so
 * the look cannot drift. No word is written here: every string arrives as a prop. Needs `sagligim.css`.
 */
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export type PortalNavOgesi = { key: string; label: string; href: string; aktif: boolean }

export function PortalKabukGorunumu({ marka, urun, anaHref, hastaAdi, hastaAlani, navEtiketi, nav, altBilgi, git, children }: {
  marka: string
  urun: string
  anaHref: string
  /** The patient's name, or null (then `hastaAlani` is drawn). */
  hastaAdi: string | null
  /** The tag shown while no name is known ("Hasta alanı"). */
  hastaAlani: string
  navEtiketi: string
  nav: PortalNavOgesi[]
  /** The footer's paragraphs. */
  altBilgi: React.ReactNode
  /** A page that keeps its own tabs opens a tab itself instead of navigating. */
  git?: (href: string) => void
  children: React.ReactNode
}) {
  const navRef = useRef<HTMLElement>(null)
  const aktifKey = nav.find((o) => o.aktif)?.key ?? ''
  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('.sg-nav-link.is-active')
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [aktifKey])
  const tikla = (href: string) => (git ? (e: React.MouseEvent) => { e.preventDefault(); git(href) } : undefined)

  return (
    <div className="sg-shell">
      <header className="sg-header">
        <div className="sg-header-inner">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <Link href={anaHref} className="sg-brand-lockup" onClick={tikla(anaHref)}>
              <span className="sg-brand-mark">{marka}</span>
              <span className="sg-brand-product">{urun}</span>
            </Link>
            {hastaAdi ? (
              <span className="sg-header-hasta" data-testid="portal-header-hasta-adi" title={hastaAdi}>
                {hastaAdi}
              </span>
            ) : (
              <span className="sg-header-tag">{hastaAlani}</span>
            )}
          </div>
          <nav ref={navRef} className="sg-nav" aria-label={navEtiketi}>
            {nav.map((item) => (
              <Link key={item.key} href={item.href} className={`sg-nav-link${item.aktif ? ' is-active' : ''}`} onClick={tikla(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="sg-main">{children}</main>
      <footer className="sg-footer">{altBilgi}</footer>
    </div>
  )
}
