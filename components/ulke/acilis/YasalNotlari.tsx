import React from 'react'
import type { AcilisYasalNotlari } from '@/lib/ulke/arayuz/acilisTipleri'
import { ulkeYolu } from '@/lib/ulke/yol'

/** AU-BETA-01 — the disclaimers block above a landing footer (written by the pack, shown as written). */
export function YasalNotlari({ n }: { n: AcilisYasalNotlari | undefined }) {
  if (!n) return null
  return (
    <section className="border-t border-line" data-alan="yasal-notlar" aria-label={n.baslik}>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <h2 className="font-display text-2xl">{n.baslik}</h2>
        <p className="mt-2 font-outfit text-xs uppercase tracking-[0.14em] text-ink-muted" data-alan="taslak-etiketi">{n.taslakEtiketi}</p>
        {n.satirlar.map((x, i) => <p key={i} className="mt-4 font-outfit text-sm leading-relaxed text-ink-2" data-yasal-satir={i + 1}>{x}</p>)}
        <div className="mt-6 font-outfit text-sm text-ink-muted">
          {n.iletisim.map((x, i) => <p key={i}>{x}</p>)}
          <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1">{n.baglantilar.map((b) => <a key={b.href} href={ulkeYolu(b.href)} className="text-ink-2 underline hover:text-ink">{b.etiket}</a>)}</p>
        </div>
      </div>
    </section>
  )
}
