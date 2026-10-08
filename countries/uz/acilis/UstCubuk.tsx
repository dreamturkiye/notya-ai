'use client'

/**
 * NOTYA-UZ-ACILIS-02 — top bar of the Uzbekistan landing page. Same markup and classes as the Turkish page's bar
 * (components/doktor-landing/site-nav.tsx, which holds Turkish text and so is not reused), with two differences:
 *   - a language switch, set in the same type as the section links;
 *   - the section links appear from 1280px, not 1024px: with the switch and the longer Russian labels the bar does
 *     not fit before that. Below it the links are in the menu, as on a phone.
 * All text arrives as properties, from the pack's catalogue.
 */
import React from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/doktor-landing/button'
import { cn } from '@/components/doktor-landing/cn'
import { ArrowUpRight, IconClose, IconMenu } from '@/components/doktor-landing/icons'
import type { AcilisIcerigi } from './icerik'

export type DilSecenegi = { kod: string; ad: string; kisa: string; href: string; secili: boolean }

export function DilSecici({ etiket, secenekler, className }: { etiket: string; secenekler: readonly DilSecenegi[]; className?: string }) {
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

export function UstCubuk({ metin, diller, girisHref, sorovHref }: { metin: AcilisIcerigi['nav']; diller: readonly DilSecenegi[]; girisHref: string; sorovHref: string }) {
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
          <a href="#top" className="font-display text-2xl italic leading-none tracking-tight">
            notya
          </a>
          <nav className="hidden items-center gap-7 xl:flex" aria-label={metin.bolumler}>
            {metin.havolalar.map((item) => (
              <a key={item.capa} href={`#${item.capa}`} className="group flex items-baseline gap-2 text-sm font-outfit">
                <span className="font-outfit text-xs uppercase tracking-widest text-ink-muted">{item.no}</span>
                <span className="border-b border-transparent transition-colors group-hover:border-pine">{item.etiket}</span>
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <DilSecici etiket={metin.dil} secenekler={diller} className="mr-1" />
            <a href={girisHref} className="hidden font-outfit text-sm text-ink-2 hover:text-ink xl:inline">
              {metin.giris}
            </a>
            <Button href={sorovHref} variant="pine" size="sm" className="hidden sm:inline-flex">
              {metin.sorov}
              <ArrowUpRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="xl:hidden"
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
        <div className="fixed inset-0 z-30 bg-paper pt-20 text-ink xl:hidden">
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
