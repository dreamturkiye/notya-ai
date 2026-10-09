'use client'

/**
 * NOTYA-UZ-FIYAT-UNVAN-01 — section 10 of the country kit's landing page: the plans and what they cost.
 * Same markup and classes as the Turkish page's price section (components/doktor-landing/pricing.tsx, not reused:
 * it holds Turkish text, the lira sign and Türkiye's sign-up address): the switch between the groups of plans, one
 * row per plan with its name, the badge, the amount, what the plan includes and a button, and one line under the list.
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
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{t.ustBaslik}</p>
            <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
              {t.baslik}
              <span className="italic font-normal"> {t.baslikVurgu}</span>
            </h2>
          </div>
          {/* One group of plans has nothing to switch between. */}
          {t.gruplar.length > 1 ? (
            <div className="inline-flex w-fit rounded-full bg-paper-2 p-1" role="tablist" aria-label={t.guruhlar}>
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

        <ol className="mt-12 divide-y divide-line border-y border-line">
          {grup.rejalar.map((reja) => {
            const fiyat = fiyatlar[reja.id]
            const tutar = fiyat?.tutar ?? null
            return (
              <li key={reja.id} data-reja={reja.id} className="grid gap-4 py-7 sm:grid-cols-3 sm:items-center">
                <div>
                  <p className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-3xl italic">{reja.ad}</span>
                    {fiyat?.oneCikan ? (
                      <span className="rounded-full bg-pine px-2.5 py-1 font-outfit text-xs uppercase tracking-widest text-cream">{t.tavsiya}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 whitespace-nowrap font-outfit text-sm text-ink-muted" data-alan="narx">
                    {tutar ? t.oylik.replace('%', tutar) : t.sorovNarx}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 font-outfit text-sm text-ink-2">
                  {reja.maddeler.map((item, i) => (
                    <li key={item} className="flex items-center gap-3">
                      {i > 0 ? (
                        <span className="text-ink-muted" aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={sorovHref}
                  className="inline-flex h-11 w-fit items-center justify-center gap-1.5 rounded-full bg-pine px-5 font-outfit text-sm font-medium text-cream transition-colors hover:bg-pine-2 sm:justify-self-end"
                >
                  {tutar ? t.dugme : t.sorovDugme}
                  <ArrowUpRight className="size-3.5" />
                </a>
              </li>
            )
          })}
        </ol>
        <p className="mt-6 font-outfit text-sm text-ink-muted">{grup.izoh}</p>
      </div>
    </section>
  )
}
