'use client'

/**
 * NOTYA-UZ-FIYAT-UNVAN-01 — section 10 of the country kit's landing page: the plans and what they cost.
 * Same card-grid design as the Turkish page's price section (components/doktor-landing/pricing.tsx, not reused:
 * it holds Turkish text, the lira sign and Türkiye's sign-up address): a switch between groups of plans, one card
 * per plan with its name, the "most chosen" badge, the amount, what the plan includes and a button.
 *
 * NO TEXT AND NO AMOUNT IS WRITTEN HERE. Every word comes from the pack's copy (`AcilisIcerigi['narx']`); every
 * amount comes from the pack's price list (`UlkeAcilisi.fiyatlar`), already written with the pack's number rules by
 * the server (./AcilisSayfasi.tsx), so this file knows no currency and no country.
 *
 * A plan WITHOUT an amount in the price list shows the copy's "on request" line instead — also when the list has no
 * entry for it at all: an amount is never guessed. Every button leads to the request form of the same page.
 */
import React from 'react'
import { useState } from 'react'
import { cn } from '@/components/doktor-landing/cn'
import { ArrowUpRight } from '@/components/doktor-landing/icons'
import type { AcilisIcerigi } from '@/lib/ulke/arayuz/acilisTipleri'

/** One plan's price as the page shows it: the amount written out (null = on request), and whether it carries the badge. */
export type NarxSatiri = { tutar: string | null; oneCikan: boolean }

export function Narx({ metin: t, fiyatlar, capa, sorovHref }: { metin: AcilisIcerigi['narx']; /** plan id → price, written out */ fiyatlar: Readonly<Record<string, NarxSatiri>>; /** The section's anchor (the pack's). */ capa: string; /** Where every button leads: the request form. */ sorovHref: string }) {
  const [secili, setSecili] = useState(0)
  const grup = t.gruplar[secili] ?? t.gruplar[0]
  if (!grup) return null

  return (
    <section id={capa} className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col items-center text-center gap-6">
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{t.ustBaslik}</p>
          <h2 className="font-display text-display font-medium leading-display tracking-display">
            {t.baslik}
            <span className="italic font-normal"> {t.baslikVurgu}</span>
          </h2>
          {/* One group of plans has nothing to switch between. */}
          {t.gruplar.length > 1 ? (
            <div className="inline-flex rounded-full bg-paper-2 p-1" role="tablist" aria-label={t.guruhlar}>
              {t.gruplar.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={i === secili}
                  data-guruh={g.id}
                  onClick={() => setSecili(i)}
                  className={cn('h-10 cursor-pointer rounded-full px-5 font-outfit text-sm', i === secili ? 'bg-ink text-cream' : 'text-ink-2')}
                >
                  {g.ad}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn('mt-14 grid gap-6', grup.rejalar.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-4')}>
          {grup.rejalar.map((reja) => {
            const fiyat = fiyatlar[reja.id]
            const tutar = fiyat?.tutar ?? null
            return (
              <article
                key={reja.id}
                data-reja={reja.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm',
                  fiyat?.oneCikan ? 'border-pine ring-2 ring-pine/20' : 'border-line',
                )}
              >
                {fiyat?.oneCikan ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pine px-3 py-1 font-outfit text-xs uppercase tracking-widest text-cream">
                    {t.tavsiya}
                  </span>
                ) : null}

                <h3 className="font-display text-2xl italic text-ink">{reja.ad}</h3>

                <div className="mt-5" data-alan="narx">
                  {tutar ? (
                    <span className="font-display text-4xl font-semibold tracking-tight text-ink">{t.oylik.replace('%', tutar)}</span>
                  ) : (
                    <span className="font-display text-4xl font-medium text-ink">{t.sorovNarx}</span>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3 font-outfit text-sm text-ink-2">
                  {reja.maddeler.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pine" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <a
                  href={sorovHref}
                  className={cn(
                    'mt-8 inline-flex h-12 items-center justify-center gap-1.5 rounded-full px-5 font-outfit text-sm font-medium transition-colors',
                    fiyat?.oneCikan ? 'bg-pine text-cream hover:bg-pine-2' : 'bg-paper-2 text-ink hover:bg-line',
                  )}
                >
                  {tutar ? t.dugme : t.sorovDugme}
                  <ArrowUpRight className="size-3.5" />
                </a>
              </article>
            )
          })}
        </div>

        <p className="mt-10 text-center font-outfit text-sm text-ink-muted">{grup.izoh}</p>
      </div>
    </section>
  )
}
