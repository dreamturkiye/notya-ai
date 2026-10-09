/**
 * NOTYA-UZ-ACILIS-02 · NOTYA-ULKE-SABLON-01 — THE LANDING PAGE LAYOUT of the country kit: one layout for every
 * country, matching the Turkish doctor landing page section for section (Kaan, 2026-10-08).
 *
 * The Turkish page (app/doktor/page.tsx, components/doktor-landing/*) is the visual specification and is NOT edited.
 *   - Reused as they are, because they are presentational and hold no text of their own: Button, FeatureSection,
 *     TypeCard, the icons and `cn` (allowed by name in lib/ulke/ulkeDuvarlari.test.ts).
 *   - Everything else (the bar, hero, the typed visits, the list of specialties, learning, safety, prices, the request
 *     form, the footer) is written here with the same markup and classes, and holds NO TEXT: every word, every anchor,
 *     the names of the language forms, the fonts, the word mark and every amount come from the active pack (`UlkeAcilisi`,
 *     lib/ulke/arayuz/acilisTipleri.ts — countries/<code>/acilis/icerik.ts).
 * Styles: ./utilities.css (compiled with the Turkish page's own theme) and ./acilis.css, both imported by ./index.tsx
 * so this file renders in a plain Node test. Photographs: the same three files as the Turkish page (public/landing),
 * handed in by ./index.tsx.
 *
 * Server component. Client parts: the bar, the typed visits, the learning toggle, the price section, the request form.
 */
import React from 'react'
import { Button } from '@/components/doktor-landing/button'
import { FeatureSection, TypeCard } from '@/components/doktor-landing/feature'
import { ArrowUpRight } from '@/components/doktor-landing/icons'
import { dilSec, ulkePaketi } from '@/lib/ulke/ulke'
import { dilliYol } from '@/lib/ulke/sayfaDili'
import type { AcilisSayfasiProps } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'
import type { AcilisCapasi, AcilisIcerigi, OzellikBolumu, UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'
import type { DilGrubu, DilKodu } from '@/lib/ulke/tipler'
import { tutarYaz } from '@/lib/ulke/arayuz/sayi'
import { IletisimFormu } from './IletisimFormu'
import { Narx, type NarxSatiri } from './Narx'
import { Organish } from './Organish'
import { Suhbat } from './Suhbat'
import { DilSecici, UstCubuk, type DilSecenegi } from './UstCubuk'

/** Addresses of the three photographs. The files are the Turkish page's own (public/landing); see ./index.tsx. */
export type AcilisGorselleri = { xona: string; stol: string; yolak: string }

type Capalar = UlkeAcilisi['capalar']

/** The page's own address in one of its forms (the pack's default form needs no parameter). */
const sayfa = (dil: DilKodu, capa = '') => ulkeYolu(`/${dil === ulkePaketi().varsayilanDil ? '' : `?dil=${dil}`}${capa}`)

function dilSecenegi(a: UlkeAcilisi, kod: DilKodu, secili: boolean): DilSecenegi {
  const ad = a.dilAdlari[kod]
  if (!ad) throw new Error(`[ulke/acilis] the landing page has no name for its form "${kod}". No fallback to another language.`)
  return { kod, ...ad, href: sayfa(kod), secili }
}

/**
 * The switch at the top: ONE entry per language. A language the page is written in in several scripts appears in
 * the script the visitor is reading, or in its first form when the visitor reads another language. The footer
 * lists every form.
 */
export function ustDilSecenekleri(a: UlkeAcilisi, gruplar: readonly DilGrubu[], d: DilKodu): DilSecenegi[] {
  const sayfaninki = (g: DilGrubu) => g.bicimler.map((b) => b.dil).filter((x) => a.diller.includes(x))
  const gruplu = gruplar.map(sayfaninki).filter((x) => x.length > 0)
  // A form of the page that no language group of the pack names stands by itself.
  const kalan = a.diller.filter((x) => !gruplu.some((g) => g.includes(x))).map((x) => [x])
  return [...gruplu, ...kalan].map((bicimler) => dilSecenegi(a, bicimler.includes(d) ? d : bicimler[0], bicimler.includes(d)))
}

function Ozellik({ id, b, tone, reverse }: { id: string; b: OzellikBolumu; tone: 'paper' | 'paper-2'; reverse?: boolean }) {
  return (
    <FeatureSection
      id={id}
      tone={tone}
      reverse={reverse}
      eyebrow={b.ustBaslik}
      title={b.baslik}
      titleItalic={b.baslikVurgu}
      body={b.govde}
      bullets={b.maddeler}
      card={<TypeCard label={b.kart.etiket} rows={b.kart.satirlar} note={b.kart.not} />}
    />
  )
}

function Kahraman({ t, gorsel, c }: { t: AcilisIcerigi['kahraman']; gorsel: string; c: Capalar }) {
  return (
    <section id={c.ust} className="relative bg-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-14 lg:pt-28">
        <div className="min-w-0">
          <p className="uzl-reveal flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
            <span className="inline-block size-1.5 shrink-0 bg-pine" aria-hidden="true" />
            {t.ustBaslik}
          </p>
          <h1 className="uzl-reveal mt-5 font-display text-hero font-medium leading-hero tracking-hero">
            {t.baslik}
            <span className="mt-1 block italic font-normal text-pine">{t.baslikVurgu}</span>
          </h1>
          <p className="uzl-reveal mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{t.giris}</p>
          <div className="uzl-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href={`#${c.sorov}`} variant="pine" size="lg" className="w-full sm:w-auto">
              {t.birinciDugme}
              <ArrowUpRight className="size-4" />
            </Button>
            {/* Scrolls to the typed illustration in section 01 of this page. Not a demo, not a video, no account. */}
            <Button href={`#${c.suhbat}`} variant="outline" size="lg" className="w-full sm:w-auto">
              {t.ikinciDugme}
            </Button>
          </div>
        </div>

        <figure className="order-first min-w-0 lg:order-none">
          <img src={gorsel} alt={t.gorselAlt} className="aspect-[16/10] w-full rounded-xl object-cover object-center lg:aspect-[5/4]" />
          <figcaption className="mt-3 flex items-center justify-between gap-4 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">
            <span>{t.gorselAlti}</span>
          </figcaption>
        </figure>
      </div>

      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-8 border-t border-line px-5 py-8 sm:grid-cols-4 sm:px-8">
        {t.serit.map((item) => (
          <li key={item} className="font-display text-lg italic leading-snug text-ink">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Yonalishlar({ t, c }: { t: AcilisIcerigi['yonalish']; c: Capalar }) {
  return (
    <section id={c.yonalish} className="scroll-mt-16 bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{t.ustBaslik}</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-3xl font-display text-display font-medium leading-display tracking-display">
            {t.baslik}
            <span className="block italic font-normal text-pine">{t.baslikVurgu}</span>
          </h2>
          <p className="max-w-sm font-outfit text-sm leading-relaxed text-ink-2">{t.govde}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {t.misollar.map((e) => (
            <article key={e.k} className="rounded-xl bg-paper p-6 shadow-border">
              <h3 className="font-display text-2xl italic leading-none text-pine">{e.k}</h3>
              <p className="mt-3 font-outfit text-sm leading-relaxed text-ink-2">{e.v}</p>
            </article>
          ))}
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-6 font-outfit text-sm text-ink-muted" aria-label={t.royxatEtiketi}>
          {t.royxat.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Xavfsizlik({ t, gorsel, c }: { t: AcilisIcerigi['xavfsizlik']; gorsel: string; c: Capalar }) {
  return (
    <section id={c.xavfsizlik} className="bg-paper py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-end lg:gap-16">
        <div>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{t.ustBaslik}</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            {t.baslik}
            <span className="block italic font-normal text-pine">{t.baslikVurgu}</span>
          </h2>
          <blockquote className="mt-8 max-w-xl border-l-2 border-pine pl-5">
            <p className="font-display text-title font-normal italic leading-snug text-ink">{t.iqtibos}</p>
            <footer className="mt-6 font-outfit text-sm leading-relaxed text-ink-2">{t.izoh}</footer>
          </blockquote>
        </div>

        <figure>
          <img src={gorsel} alt={t.gorselAlt} className="aspect-[4/3] w-full rounded-xl object-cover" />
          <figcaption className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{t.gorselAlti}</figcaption>
        </figure>
      </div>

      <ul className="mx-auto mt-16 grid max-w-7xl gap-8 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {t.dalillar.map((item) => (
          <li key={item.k} className="border-t border-line pt-4">
            <p className="font-outfit text-xs uppercase tracking-[0.2em] text-ink-muted">{item.k}</p>
            <p className="mt-2 font-outfit text-sm leading-relaxed text-ink-2">{item.v}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Section 10 is ./Narx.tsx (a client part: it has the switch between the groups of plans). The amounts are written
 * out HERE, on the server, with the pack's own number rules, so the client part receives text and knows no currency.
 * A plan the price list gives no amount for, or does not name at all, has none: the copy's "on request" line stands.
 */
export function narxSatirlari(a: UlkeAcilisi): Record<string, NarxSatiri> {
  return Object.fromEntries(Object.entries(a.fiyatlar ?? {}).map(([id, f]) => [id, { tutar: typeof f.aylik === 'number' && f.aylik > 0 ? tutarYaz(f.aylik) : null, oneCikan: f.oneCikan === true }]))
}

/** Closing section. The Turkish page has a trial sign-up form here; this is the request form and the invitation link. */
function Sorov({ t, iletisimEposta, kayitHref, c }: { t: AcilisIcerigi['sorov']; iletisimEposta: string | null; kayitHref: string; c: Capalar }) {
  return (
    <section id={c.sorov} className="scroll-mt-16 bg-pine text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="font-outfit text-xs uppercase tracking-[0.22em] text-cream/65">{t.ustBaslik}</p>
          <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
            {t.baslik}
            <span className="mt-2 block italic font-normal">{t.baslikVurgu}</span>
          </h2>
          <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-cream/80">{t.govde}</p>
          <p className="mt-6 font-outfit text-sm text-cream/80">
            {t.davetSorusu}{' '}
            <a href={kayitHref} className="border-b border-cream/65 text-cream">
              {t.davetBaglantisi}
            </a>
          </p>
        </div>

        <div className="rounded-xl bg-cream p-6 text-ink shadow-border">
          {iletisimEposta ? (
            <IletisimFormu adres={iletisimEposta} metin={t.form} />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{t.form.etiket}</p>
              <p className="font-outfit text-sm leading-relaxed text-ink-muted">{t.formYok}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function AcilisSayfasi({ dil, istenenDil, iletisimEposta, gorseller, acilis: a }: AcilisSayfasiProps & { gorseller: AcilisGorselleri; acilis: UlkeAcilisi }) {
  // `dil` is one of the pack's public languages. The page may be written in more forms than those (a second script):
  // such a form is served when the address asks for it by name. Anything else stays what `dil` says — never a guess,
  // and a form the page is not written in is an error, never another language's text.
  const yazili = (x: unknown): x is DilKodu => typeof x === 'string' && (a.diller as readonly string[]).includes(x)
  const d: DilKodu = yazili(istenenDil) ? istenenDil : dil
  const t = a.icerik[d]
  if (!yazili(d) || !t) throw new Error(`[ulke/acilis] no landing copy for "${d}". No fallback to another language.`)
  const c = a.capalar
  // Login and sign-up exist in the pack's public languages only; a visitor reading another form continues in the default.
  const girisHref = dilliYol('/login', dilSec(d))
  const kayitHref = dilliYol('/signup', dilSec(d))
  const ustDiller = ustDilSecenekleri(a, ulkePaketi().uygulama?.dilGruplari ?? [], d)
  const altDiller = a.diller.map((k) => dilSecenegi(a, k, k === d))

  return (
    <div className="uzl" lang={d}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={a.fontHref} />
      <div className="relative bg-paper text-ink">
        <UstCubuk metin={t.nav} diller={ustDiller} girisHref={girisHref} sorovHref={`#${c.sorov}`} marka={a.markaYazisi} ustHref={`#${c.ust}`} />
        <main>
          <Kahraman c={c} t={t.kahraman} gorsel={gorseller.xona} />
          <Suhbat metin={t.suhbat} capa={c.suhbat} />
          <Ozellik id={c.qabul} b={t.qabul} tone="paper-2" />
          <Ozellik id={c.portal} b={t.portal} tone="paper" reverse />
          <Ozellik id={c.maslahat} b={t.maslahat} tone="paper-2" />
          <Ozellik id={c.jadval} b={t.jadval} tone="paper" reverse />
          <Yonalishlar c={c} t={t.yonalish} />
          <Ozellik id={c.kuzatuv} b={t.kuzatuv} tone="paper" />
          <Organish metin={t.organish} gorsel={gorseller.stol} capa={c.organish} />
          <Xavfsizlik c={c} t={t.xavfsizlik} gorsel={gorseller.yolak} />
          <Narx metin={t.narx} fiyatlar={narxSatirlari(a)} capa={c.narx} sorovHref={`#${c.sorov}`} />
          <Sorov c={c} t={t.sorov} iletisimEposta={iletisimEposta} kayitHref={kayitHref} />
        </main>
        <footer className="border-t border-line bg-paper">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-3xl italic">{a.markaYazisi}</p>
              <p className="mt-2 max-w-xs font-outfit text-sm leading-relaxed text-ink-muted">{t.altBilgi.tanim}</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 font-outfit text-sm" aria-label={t.altBilgi.havolalar}>
              <a href={girisHref} className="text-ink-2 hover:text-ink">
                {t.altBilgi.giris}
              </a>
              <a href={kayitHref} className="text-ink-2 hover:text-ink">
                {t.altBilgi.kayit}
              </a>
            </nav>
          </div>
          <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-5 py-6 font-outfit text-xs uppercase tracking-[0.14em] text-ink-muted sm:flex-row sm:justify-between sm:px-8">
            <p>
              © {new Date().getFullYear()} {t.altBilgi.haklar}
            </p>
            {/* Every form the page is written in. */}
            <DilSecici etiket={t.altBilgi.diller} secenekler={altDiller} className="uzl-dil-alt gap-3 text-xs uppercase tracking-[0.14em]" />
          </div>
        </footer>
      </div>
    </div>
  )
}
