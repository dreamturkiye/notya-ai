'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NOTYA_KLINIK_AD } from '@/lib/specialties/klinikDikey'
import { cn } from '@/components/doktor-landing/cn'

const LINKS = [
  { href: '/notya-klinik/ayarlar', ad: 'Kurulum' },
  { href: '/notya-klinik/takvim', ad: 'Takvim' },
]

/** Anasayfadaki hero ızgarası. Kurulum, takvim ve davet aynı sahneyi kullanır. */
export function MasaSahne(props: { kas: string; baslik: string; italik: string; govde: string; children?: React.ReactNode }) {
  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:py-16">
        <div className="min-w-0">
          <p className="flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
            <span className="inline-block size-1.5 bg-pine" aria-hidden="true" />
            {props.kas}
          </p>
          <h1 className="mt-5 font-display text-hero font-medium leading-hero tracking-hero">
            {props.baslik}
            <span className="mt-1 block italic font-normal text-pine">{props.italik}</span>
          </h1>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{props.govde}</p>
          {props.children ? <div className="mt-8">{props.children}</div> : null}
        </div>
        <figure className="order-first min-w-0 lg:order-none">
          <img
            src="/landing/corridor.jpg"
            alt="Gün ışığında bir klinik koridoru: muayene odası kapıları ve bekleme sediri"
            className="aspect-[16/10] w-full rounded-xl object-cover object-center lg:aspect-[5/4]"
          />
          <figcaption className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            Notya Klinik · görsel referans
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

export default function KlinikKabuk({ children }: { children: React.ReactNode }) {
  const yol = usePathname()
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper/92">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/notya-klinik" className="font-display text-2xl italic leading-none tracking-tight" aria-label={NOTYA_KLINIK_AD}>
            Notya Klinik
          </Link>
          <nav className="flex items-center gap-6" aria-label="Notya Klinik">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'font-outfit text-sm',
                  yol === l.href ? 'border-b border-pine text-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                {l.ad}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="pt-16">{children}</main>
    </div>
  )
}
