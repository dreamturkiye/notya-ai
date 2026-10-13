/**
 * NOTYA-ULKE-DEMO-01 — the "Book a demo" page of a country (/demo): a 60-minute video call with Dr. Gökhan Mamur,
 * booked through Cal.com's inline embed.
 *
 * SELF-CONTAINED on purpose: it reuses only the shared presentational pieces the landing page reuses (Button, the
 * icons, `cn`) and the landing page's copy as DATA (bar and footer words, anchors, word mark, fonts) — never a
 * component of components/ulke/acilis — so the public pages can be restyled without touching this page. Same
 * markup and classes as the landing page's bar and footer; styles from that page's compiled sheet (./index.tsx).
 * Holds no text: every word comes from the active pack (countries/<code>/demo.ts and the landing copy).
 *
 * Link set (NEXT_PUBLIC_DEMO_BOOKING_URL, a Cal.com address): the calendar. Not set: a short "opens soon" text,
 * no address of any kind, no embed.
 */
import React from 'react'
import { Button } from '@/components/doktor-landing/button'
import { cn } from '@/components/doktor-landing/cn'
import { ArrowUpRight } from '@/components/doktor-landing/icons'
import type { UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'
import { demoAdresi, demoBaglantisi, type DemoMetni } from '@/lib/ulke/demo'
import { dilliYol } from '@/lib/ulke/sayfaDili'
import type { DilKodu } from '@/lib/ulke/tipler'
import { dilSec, ulkePaketi } from '@/lib/ulke/ulke'
import { YASAL_ANAHTARLARI, YASAL_YOLLAR } from '@/lib/ulke/yasal/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'
import { CalTakvim } from './CalTakvim'

/** The form of the page: one the address names and the landing page is written in, else the narrowed public language. */
export function demoFormu(a: UlkeAcilisi, dil: DilKodu, istenenDil: unknown): DilKodu {
  return typeof istenenDil === 'string' && (a.diller as readonly string[]).includes(istenenDil) ? (istenenDil as DilKodu) : dil
}

/** Brand colour of the calendar: the landing page's pine. */
const MARKA_RENGI = '#0e6b66'

export function DemoSayfasi({ acilis: a, metin, dil: d }: { acilis: UlkeAcilisi; metin: DemoMetni; dil: DilKodu }) {
  const t = a.icerik[d]
  if (!t) throw new Error(`[ulke/demo] no landing copy for "${d}". No fallback to another language.`)
  const c = a.capalar
  const varsayilan = ulkePaketi().varsayilanDil
  const kokHref = (capa = '') => ulkeYolu(`/${d === varsayilan ? '' : `?dil=${d}`}${capa}`)
  const girisHref = dilliYol('/login', dilSec(d))
  const kayitHref = dilliYol('/signup', dilSec(d))
  const baglanti = demoBaglantisi()
  const diller = a.diller.flatMap((k) => {
    const ad = a.dilAdlari[k]
    return ad ? [{ kod: k, ...ad, href: demoAdresi(k), secili: k === d }] : []
  })

  return (
    <div className="uzl" lang={d}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={a.fontHref} />
      <div className="relative bg-paper text-ink">
        <header className="fixed inset-x-0 top-0 z-40 bg-paper/92 text-ink shadow-border">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <a href={kokHref(`#${c.ust}`)} className="font-display text-2xl italic leading-none tracking-tight">
              {a.markaYazisi}
            </a>
            <div className="flex items-center gap-3">
              {diller.length > 1 ? (
                <nav className="uzl-dil mr-1 flex items-center gap-2 font-outfit text-sm" aria-label={t.nav.dil}>
                  {diller.map((x, i) => (
                    <React.Fragment key={x.kod}>
                      {i > 0 ? <span className="text-ink-muted" aria-hidden="true">/</span> : null}
                      <a
                        href={x.href}
                        hrefLang={x.kod}
                        lang={x.kod}
                        title={x.ad}
                        aria-current={x.secili ? 'true' : undefined}
                        className={cn('border-b transition-colors', x.secili ? 'border-pine text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
                      >
                        <span className="hidden sm:inline">{x.ad}</span>
                        <span className="text-xs uppercase tracking-widest sm:hidden" aria-hidden="true">{x.kisa}</span>
                      </a>
                    </React.Fragment>
                  ))}
                </nav>
              ) : null}
              <a href={girisHref} className="font-outfit text-sm text-ink-2 hover:text-ink">
                {t.nav.giris}
              </a>
              <Button href={kokHref(`#${c.sorov}`)} variant="pine" size="sm" className="hidden sm:inline-flex">
                {t.nav.sorov}
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-7xl px-5 pb-10 pt-24 sm:px-8 lg:pb-14 lg:pt-28">
            <p className="flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
              <span className="inline-block size-1.5 shrink-0 bg-pine" aria-hidden="true" />
              {a.markaYazisi}
            </p>
            <h1 className="mt-5 font-display text-display font-medium leading-display tracking-display">{metin.baslik}</h1>
            <p className="mt-6 max-w-xl font-outfit text-lede font-light leading-relaxed text-ink-2">{metin.giris}</p>

            {baglanti ? (
              <div className="mt-12 rounded-xl bg-cream p-1 shadow-border sm:p-6">
                <CalTakvim origin={baglanti.origin} calLink={baglanti.calLink} brandColor={MARKA_RENGI} ariaLabel={metin.takvimEtiketi} />
              </div>
            ) : (
              <div className="mt-12 rounded-xl border border-line bg-cream p-6 sm:p-8">
                <p className="font-display text-2xl italic">{metin.yakinda}</p>
                <p className="mt-3 max-w-xl font-outfit text-base text-ink-2">{metin.yakindaGovde}</p>
              </div>
            )}

            <p className="mt-6 font-outfit text-sm text-ink-muted">{metin.saglayici}</p>
          </section>
        </main>

        <footer className="border-t border-line bg-paper">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-3xl italic">{a.markaYazisi}</p>
              <p className="mt-2 max-w-xs font-outfit text-sm leading-relaxed text-ink-muted">{t.altBilgi.tanim}</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 font-outfit text-sm" aria-label={t.altBilgi.havolalar}>
              <a href={dilliYol('/for-clinics', dilSec(d))} className="text-ink-2 hover:text-ink">
                {t.altBilgi.klinik}
              </a>
              <a href={girisHref} className="text-ink-2 hover:text-ink">
                {t.altBilgi.giris}
              </a>
              <a href={kayitHref} className="text-ink-2 hover:text-ink">
                {t.altBilgi.kayit}
              </a>
              {t.altBilgi.yasal.map((etiket, i) => (
                <a key={YASAL_ANAHTARLARI[i]} href={dilliYol(YASAL_YOLLAR[YASAL_ANAHTARLARI[i]], d)} className="text-ink-2 hover:text-ink">
                  {etiket}
                </a>
              ))}
            </nav>
          </div>
          <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-5 py-6 font-outfit text-xs uppercase tracking-[0.14em] text-ink-muted sm:flex-row sm:justify-between sm:px-8">
            <p>
              © {new Date().getFullYear()} {t.altBilgi.haklar}
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
