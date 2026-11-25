'use client'

/**
 * The patient portal's frame (Türkiye: "Sağlığım") as a plain presentational view: the word mark, the patient's name,
 * the row of section tabs and the footer. Türkiye's PortalShell and every country's patient page draw THROUGH this, so
 * the look cannot drift. No word is written here: every string arrives as a prop. Needs `sagligim.css`.
 */
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useGorselIzni } from './saglikEvi/SaglikKahramani'
import type { ZeminGorseli } from '@/lib/portal/zemin'

export type PortalNavOgesi = { key: string; label: string; href: string; aktif: boolean }

/**
 * SAGLIGIM-ZEMIN (Kaan, 2026-11-25) — the soft, faded full-page photo behind every portal page (which photo: one map,
 * lib/portal/zemin.ts). Fixed, behind the content, decorative (aria-hidden). Drawn only on the client after hydration
 * and never under Save-Data (useGorselIzni), so the server markup, the first paint and the content's LCP are untouched
 * and nothing moves. A page change cross-fades: the previous photo stays underneath while the new one fades in (CSS;
 * no fade under prefers-reduced-motion).
 */
function PortalZemini({ zemin }: { zemin: ZeminGorseli }) {
  const izin = useGorselIzni()
  const [simdiki, setSimdiki] = useState(zemin)
  const [onceki, setOnceki] = useState<ZeminGorseli | null>(null)
  if (zemin !== simdiki) { setOnceki(simdiki); setSimdiki(zemin) }
  if (!izin) return null
  return (
    <div className="sg-zemin" aria-hidden data-testid="portal-zemin">
      {onceki && onceki !== simdiki ? <div key={`o-${onceki}`} className="sg-zemin-foto" data-zemin={onceki} /> : null}
      <div key={simdiki} className="sg-zemin-foto is-yeni" data-zemin={simdiki} />
    </div>
  )
}

export function PortalKabukGorunumu({ marka, urun, markaBasligi, anaHref, hastaAdi, hastaAlani, navEtiketi, nav, altBilgi, git, zemin, children }: {
  /** Word mark — drawn only when no `markaBasligi` is given (country builds until the carry-over queue reaches them). */
  marka: string
  urun: string
  /**
   * HASTA-ALANI-MARKA (Kaan, 2026-11-25): the doctor's own lockup (HekimMarkasi › MarkaBasligi — logo → photo →
   * monogram, name, "Sağlığım"). When given it REPLACES the word mark: the portal is the doctor's service.
   */
  markaBasligi?: React.ReactNode
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
  /** SAGLIGIM-ZEMIN — the page's background photo (lib/portal/zemin.ts › portalZemini); omitted = none. */
  zemin?: ZeminGorseli | null
  children: React.ReactNode
}) {
  const navRef = useRef<HTMLElement>(null)
  const aktifKey = nav.find((o) => o.aktif)?.key ?? ''
  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('.sg-nav-link.is-active')
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [aktifKey])
  // SAGLIGIM-GORUNUM-V3: show that the tab row scrolls (soft fade on the side that has more tabs); from 720 px the row
  // wraps instead (sagligim.css), so no tab is ever cut off at the edge.
  useEffect(() => {
    const n = navRef.current
    if (!n) return
    const olc = () => {
      const sol = n.scrollLeft > 4
      const sag = n.scrollLeft + n.clientWidth < n.scrollWidth - 4
      n.classList.toggle('is-sol-tasma', sol)
      n.classList.toggle('is-sag-tasma', sag)
    }
    olc()
    n.addEventListener('scroll', olc, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(olc) : null
    ro?.observe(n)
    return () => { n.removeEventListener('scroll', olc); ro?.disconnect() }
  }, [nav.length])
  const tikla = (href: string) => (git ? (e: React.MouseEvent) => { e.preventDefault(); git(href) } : undefined)

  return (
    <div className="sg-shell">
      {zemin ? <PortalZemini zemin={zemin} /> : null}
      <header className="sg-header">
        <div className="sg-header-inner">
          <div style={{ display: 'flex', alignItems: markaBasligi ? 'center' : 'baseline', justifyContent: 'space-between', gap: 12 }}>
            {markaBasligi ? (
              <Link href={anaHref} className="sg-brand-lockup sg-brand-lockup--hekim" onClick={tikla(anaHref)}>
                {markaBasligi}
              </Link>
            ) : (
              <Link href={anaHref} className="sg-brand-lockup" onClick={tikla(anaHref)}>
                <span className="sg-brand-mark">{marka}</span>
                <span className="sg-brand-product">{urun}</span>
              </Link>
            )}
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
