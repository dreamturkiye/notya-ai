'use client'

/**
 * NOTYA-UZ-ACILIS-02 — section 08 of the Uzbekistan landing page (what the assistant remembers by the tenth visit).
 * Same markup and classes as the Turkish page (components/doktor-landing/learning.tsx, not reused: Turkish text).
 */
import React from 'react'
import { useState } from 'react'
import { cn } from '@/components/doktor-landing/cn'
import { CAPA, type AcilisIcerigi } from './icerik'

export function Organish({ metin, gorsel }: { metin: AcilisIcerigi['organish']; gorsel: string }) {
  const [tenth, setTenth] = useState(true)
  const card = tenth ? metin.oninchi : metin.birinchi

  return (
    <section id={CAPA.organish} className="bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <img src={gorsel} alt={metin.gorselAlt} className="aspect-[3/2] w-full rounded-xl object-cover" />
          <p className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{metin.gorselAlti}</p>
        </div>

        <div>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{metin.ustBaslik}</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            {metin.baslik}
            <span className="block italic font-normal text-pine">{metin.baslikVurgu}</span>
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{metin.govde}</p>

          <div className="mt-8 inline-flex rounded-full bg-cream p-1 shadow-border" role="tablist" aria-label={metin.sekmeler}>
            <button
              type="button"
              role="tab"
              aria-selected={!tenth}
              onClick={() => setTenth(false)}
              className={cn('h-10 cursor-pointer rounded-full px-5 font-outfit text-sm', !tenth ? 'bg-ink text-cream' : 'text-ink-2')}
            >
              {metin.birinchi.etiket}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tenth}
              onClick={() => setTenth(true)}
              className={cn('h-10 cursor-pointer rounded-full px-5 font-outfit text-sm', tenth ? 'bg-ink text-cream' : 'text-ink-2')}
            >
              {metin.oninchi.etiket}
            </button>
          </div>

          <article className="mt-6 rounded-xl bg-cream p-6 shadow-border">
            <p className="font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{card.etiket}</p>
            <p className="mt-4 text-right font-display text-xl italic leading-snug">“{card.sorov}”</p>
            <p className="mt-5 max-w-md border-l-2 border-pine pl-4 font-display text-lg leading-snug text-pine">{card.javob}</p>
            {tenth ? <p className="mt-4 font-outfit text-sm text-ink-muted">{metin.izoh}</p> : null}
          </article>
        </div>
      </div>
    </section>
  )
}
