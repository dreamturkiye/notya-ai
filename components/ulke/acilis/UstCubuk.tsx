'use client'

/**
 * NOTYA-UZ-ACILIS-02 — top bar of the Uzbekistan landing page. Same markup and classes as the Turkish page's bar
 * (components/doktor-landing/site-nav.tsx, which holds Turkish text and so is not reused), with one addition:
 *   - a language switch, set in the same type as the section links.
 * Breakpoints, the bar class and the menu match that bar: links from 1024px (`lg`), `bg-paper/92` (the same class;
 * opacity 92 is not a Tailwind step, so both bars are paper-coloured by the page behind them).
 * All text arrives as properties, from the pack's catalogue.
 */
import React from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/doktor-landing/button'
import { cn } from '@/components/doktor-landing/cn'
import { ArrowUpRight, IconClose, IconMenu } from '@/components/doktor-landing/icons'
import type { AcilisIcerigi } from '@/lib/ulke/arayuz/acilisTipleri'

export type DilSecenegi = { kod: string; ad: string; kisa: string; href: string; secili: boolean }

export function DilSecici({ etiket, secenekler, className }: { etiket: string; secenekler: readonly DilSecenegi[]; className?: string }) {
  // A page written in one form has nothing to switch between.
  if (secenekler.length < 2) return null
  return (
    <nav className={cn('uzl-dil flex items-center gap-2 font-outfit text-sm', className)} aria-label={etiket}>
      {secenekler.map((d, i) => (
        <React.Fragment key={d.kod}>
          {i > 0 ? <span className="text-ink-muted" aria-hidden="true">/</span> : null}
          <a
            href={d.href}
            hrefLang={d.kod}
            lang={d.kod}
            title={d.ad}
            aria-current={d.secili ? 'true' : undefined}
            className={cn('border-b transition-colors', d.secili ? 'border-pine text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
          >
            <span className="hidden sm:inline">{d.ad}</span>
            <span className="text-xs uppercase tracking-widest sm:hidden" aria-hidden="true">{d.kisa}</span>
          </a>
        </React.Fragment>
      ))}
    </nav>
  )
}

export function UstCubuk({ metin, diller, girisHref, sorovHref, marka, markaEk, ustHref, demo }: { metin: AcilisIcerigi['nav']; diller: readonly DilSecenegi[]; girisHref: string; sorovHref: string; /** The word mark (the pack's). */ marka: string; /** Small word beside the mark, as on the Turkish clinic page. Omitted on the doctor page. */ markaEk?: string; /** The address of the top of the page (the pack's anchor). */ ustHref: string; /** NOTYA-ULKE-DEMO-01: the "Book a demo" button, when this pack has a demo page (lib/ulke/demo). */ demo?: { href: string; etiket: string } | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 bg-paper/92 text-ink transition-shadow duration-300',
          scrolled || open ? 'shadow-border' : '',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href={ustHref} className="flex items-baseline gap-2 font-display text-2xl italic leading-none tracking-tight">
            {marka}
            {markaEk ? <span className="font-outfit text-[11px] not-italic uppercase tracking-[0.3em] text-pine">{markaEk}</span> : null}
          </a>
          <nav className="hidden items-center gap-7 lg:flex" aria-label={metin.bolumler}>
            {metin.havolalar.map((item) => (
              <a key={item.capa} href={`#${item.capa}`} className="group flex items-baseline gap-2 text-sm font-outfit">
                <span className="font-outfit text-xs uppercase tracking-widest text-ink-muted">{item.no}</span>
                <span className="border-b border-transparent transition-colors group-hover:border-pine">{item.etiket}</span>
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <DilSecici etiket={metin.dil} secenekler={diller} className="mr-1" />
            <a href={girisHref} className="hidden font-outfit text-sm text-ink-2 hover:text-ink lg:inline">
              {metin.giris}
            </a>
            {demo ? (
              <Button href={demo.href} variant="demo" size="sm" className="hidden sm:inline-flex">
                {demo.etiket}
              </Button>
            ) : null}
            <Button href={sorovHref} variant="pine" size="sm" className="hidden sm:inline-flex">
              {metin.sorov}
              <ArrowUpRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-expanded={open}
              aria-label={open ? metin.menyuYop : metin.menyuAc}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <IconClose className="size-5" /> : <IconMenu className="size-5" />}
            </Button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-30 bg-paper pt-20 text-ink lg:hidden">
          <nav className="flex flex-col gap-1 px-6 py-8" aria-label={metin.mobil}>
            {metin.havolalar.map((item) => (
              <a
                key={item.capa}
                href={`#${item.capa}`}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between border-b border-line py-4"
              >
                <span className="font-display text-3xl italic">{item.etiket}</span>
                <span className="font-outfit text-xs tracking-widest text-ink-muted">{item.no}</span>
              </a>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              <Button href={sorovHref} size="lg" onClick={() => setOpen(false)}>
                {metin.sorov}
              </Button>
              {demo ? (
                <Button href={demo.href} variant="demo" size="lg">
                  {demo.etiket}
                </Button>
              ) : null}
              <Button href={girisHref} variant="outline" size="lg">
                {metin.girisUzun}
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  )
}
