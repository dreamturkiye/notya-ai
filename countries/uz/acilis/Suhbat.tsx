'use client'

/**
 * NOTYA-UZ-ACILIS-02 — section 01 of the Uzbekistan landing page: the fictional visits, typed out on the page.
 * Same markup, classes and timing as the Turkish page (components/doktor-landing/conversation.tsx and chart.tsx,
 * which hold Turkish text and so are not reused). An illustration set in type: no product screen, no recording,
 * no account — nothing here is a demo of the product.
 */
import React from 'react'
import { useEffect, useState } from 'react'
import { cn } from '@/components/doktor-landing/cn'
import { CAPA, type AcilisIcerigi, type Sahne, type SahneNavbati } from './icerik'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useTypedScene(sahne: Sahne, reduced: boolean) {
  const [visible, setVisible] = useState<SahneNavbati[]>([])
  const [partial, setPartial] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    setVisible([])
    setPartial('')
    setDone(false)

    if (reduced) {
      setVisible([...sahne.navbatlar])
      setDone(true)
      return
    }

    const timers: number[] = []
    const typeTurn = (index: number, startAt: number) => {
      const turn = sahne.navbatlar[index]
      if (!turn) {
        timers.push(window.setTimeout(() => {
          if (!cancelled) setDone(true)
        }, startAt))
        return
      }
      timers.push(window.setTimeout(() => {
        if (cancelled) return
        let i = 0
        const step = () => {
          if (cancelled) return
          i += 1
          setPartial(turn.matn.slice(0, i))
          if (i < turn.matn.length) {
            timers.push(window.setTimeout(step, turn.rol === 'ogohlantirish' ? 18 : 22))
          } else {
            setVisible((prev) => [...prev, turn])
            setPartial('')
            typeTurn(index + 1, 520)
          }
        }
        step()
      }, startAt))
    }

    typeTurn(0, 380)
    return () => {
      cancelled = true
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [sahne, reduced])

  return { visible, partial, done }
}

function Navbat({ turn, caret = false }: { turn: SahneNavbati; caret?: boolean }) {
  const isWarn = turn.rol === 'ogohlantirish'
  const isHekim = turn.rol === 'shifokor'
  return (
    <li className={cn('grid gap-1', isHekim ? 'justify-items-end' : 'justify-items-start')}>
      <p className={cn('font-outfit text-xs uppercase tracking-widest', isWarn ? 'text-warn' : 'text-ink-muted')}>
        {turn.kim}
      </p>
      <p
        className={cn(
          'max-w-md font-display text-base leading-snug sm:text-lg',
          isWarn && 'border-l-2 border-warn pl-3 text-warn',
          isHekim && 'text-right',
        )}
      >
        {turn.matn}
        {caret ? <span className="uzl-caret" /> : null}
      </p>
    </li>
  )
}

function QabulVaraqi({ sahne, yozmoqda, tayyor }: { sahne: Sahne; yozmoqda: string; tayyor: string }) {
  const reduced = usePrefersReducedMotion()
  const { visible, partial, done } = useTypedScene(sahne, reduced)
  const typing = sahne.navbatlar[visible.length]

  return (
    <article className="rounded-xl bg-cream p-5 text-ink shadow-border sm:p-6">
      <header className="flex items-start justify-between gap-4 border-b border-line pb-3">
        <div className="min-w-0">
          <p className="font-outfit text-xs uppercase tracking-widest text-ink-muted">
            {sahne.meta} · {sahne.saat} · {sahne.alan}
          </p>
          <p className="mt-1 font-display text-lg font-medium italic text-ink">{sahne.yordamchi}</p>
        </div>
        <p className="shrink-0 font-outfit text-xs text-ink-muted">{done ? tayyor : yozmoqda}</p>
      </header>
      <ol className="mt-4 flex flex-col gap-4">
        {visible.map((turn, i) => (
          <Navbat key={`${sahne.id}-${i}`} turn={turn} />
        ))}
        {typing && partial ? <Navbat turn={{ ...typing, matn: partial }} caret /> : null}
      </ol>
    </article>
  )
}

export function Suhbat({ metin }: { metin: AcilisIcerigi['suhbat'] }) {
  const [active, setActive] = useState(0)
  const sahne = metin.sahneler[active] ?? metin.sahneler[0]

  return (
    <section id={CAPA.suhbat} className="relative bg-paper py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{metin.ustBaslik}</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            {metin.baslik}
            <span className="block italic font-normal text-pine">{metin.baslikVurgu}</span>
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{metin.govde}</p>
          <ul className="mt-8 flex flex-col gap-3 font-outfit text-sm text-ink-2">
            {metin.maddeler.map((m) => (
              <li key={m} className="flex items-center gap-3">
                <span className="inline-block size-1.5 shrink-0 bg-pine" aria-hidden="true" />
                {m}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={metin.sekmeler}>
            {metin.sahneler.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={cn(
                  'h-10 cursor-pointer rounded-full px-4 font-outfit text-sm transition-colors duration-150',
                  active === i ? 'bg-pine text-cream' : 'bg-paper-2 text-ink-2 hover:bg-cream',
                )}
              >
                {item.meta}
              </button>
            ))}
          </div>
          <QabulVaraqi key={sahne.id} sahne={sahne} yozmoqda={metin.yozmoqda} tayyor={metin.tayyor} />
          <p className="mt-4 max-w-md font-outfit text-sm leading-relaxed text-ink-muted">{metin.izoh}</p>
        </div>
      </div>
    </section>
  )
}
