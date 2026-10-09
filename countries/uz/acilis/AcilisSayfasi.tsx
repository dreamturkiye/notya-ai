/**
 * NOTYA-UZ-ACILIS-02 — Uzbekistan landing page, rebuilt to match the Turkish doctor landing page section for section
 * (Kaan, 2026-10-08: "I need a landing page just like this for Uzbek").
 *
 * The Turkish page (app/doktor/page.tsx, components/doktor-landing/*) is the visual specification and is NOT edited.
 *   - Reused as they are, because they are presentational and hold no text of their own: Button, FeatureSection,
 *     TypeCard, the icons and `cn` (allowed by name in lib/ulke/ulkeDuvarlari.test.ts).
 *   - Everything that holds Turkish text or Türkiye-only content (the bar, hero, the typed visits, the specialty
 *     list read from Türkiye's registry, learning, safety, prices, the trial form, the footer) is written again
 *     here with the same markup and classes. No Turkish landing content is imported.
 * Text: ./icerik.ts, three forms (Uzbek Latin, Uzbek Cyrillic, Russian). Styles: ./utilities.css (compiled with the
 * Turkish page's own theme) and ./acilis.css, both imported by ./index.tsx so this file renders in a plain Node test.
 * Photographs: the same three files as the Turkish page (public/landing), handed in by ./index.tsx.
 *
 * Server component. Client parts: the bar, the typed visits, the learning toggle, the request form.
 */
import React from 'react'
import { Button } from '@/components/doktor-landing/button'
import { FeatureSection, TypeCard } from '@/components/doktor-landing/feature'
import { ArrowUpRight } from '@/components/doktor-landing/icons'
import { dilSec } from '@/lib/ulke/ulke'
import { dilliYol } from '@/lib/ulke/sayfaDili'
import type { AcilisSayfasiProps } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'
import { CAPA, acilisDiliMi, acilisIcerigi, type AcilisDili, type AcilisIcerigi, type OzellikBolumu } from './icerik'
import { IletisimFormu } from './IletisimFormu'
import { Organish } from './Organish'
import { Suhbat } from './Suhbat'
import { DilSecici, UstCubuk, type DilSecenegi } from './UstCubuk'

/** Addresses of the three photographs. The files are the Turkish page's own (public/landing); see ./index.tsx. */
export type AcilisGorselleri = { xona: string; stol: string; yolak: string }

/** Google Fonts: the two faces of the Turkish page (upright only, as there) and a Cyrillic companion for each. */
export const ACILIS_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:wght@100..900&family=Outfit:wght@100..900&family=Source+Serif+4:wght@200..900&family=Onest:wght@100..900&display=swap'

/** What each form of the page calls itself. `kisa` is what the switch shows on a phone. */
const DIL_ADLARI: Record<AcilisDili, { ad: string; kisa: string }> = {
  'uz-Latn': { ad: 'Oʻzbekcha', kisa: 'Oʻz' },
  'uz-Cyrl': { ad: 'Ўзбекча', kisa: 'Ўз' },
  ru: { ad: 'Русский', kisa: 'Ру' },
}
const VARSAYILAN: AcilisDili = 'uz-Latn'

/** The page's own address in one of its forms (the default form needs no parameter). */
const sayfa = (dil: AcilisDili, capa = '') => ulkeYolu(`/${dil === VARSAYILAN ? '' : `?dil=${dil}`}${capa}`)

function dilSecenegi(kod: AcilisDili, secili: boolean): DilSecenegi {
  return { kod, ...DIL_ADLARI[kod], href: sayfa(kod), secili }
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

function Kahraman({ t, gorsel }: { t: AcilisIcerigi['kahraman']; gorsel: string }) {
  return (
    <section id={CAPA.ust} className="relative bg-paper">
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
            <Button href={`#${CAPA.sorov}`} variant="pine" size="lg" className="w-full sm:w-auto">
              {t.birinciDugme}
              <ArrowUpRight className="size-4" />
            </Button>
            {/* Scrolls to the typed illustration in section 01 of this page. Not a demo, not a video, no account. */}
            <Button href={`#${CAPA.suhbat}`} variant="outline" size="lg" className="w-full sm:w-auto">
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

function Yonalishlar({ t }: { t: AcilisIcerigi['yonalish'] }) {
  return (
    <section id={CAPA.yonalish} className="scroll-mt-16 bg-cream py-20 sm:py-28">
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

function Xavfsizlik({ t, gorsel }: { t: AcilisIcerigi['xavfsizlik']; gorsel: string }) {
  return (
    <section id={CAPA.xavfsizlik} className="bg-paper py-20 sm:py-28">
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

/** Section 10. The Turkish page lists plans with amounts and a trial; here: who it is for, no amount, "request a price". */
function Narx({ t }: { t: AcilisIcerigi['narx'] }) {
  return (
    <section id={CAPA.narx} className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{t.ustBaslik}</p>
            <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
              {t.baslik}
              <span className="italic font-normal"> {t.baslikVurgu}</span>
            </h2>
          </div>
        </div>

        <ol className="mt-12 divide-y divide-line border-y border-line">
          {t.rejalar.map((reja) => (
            <li key={reja.ad} className="grid gap-4 py-7 sm:grid-cols-3 sm:items-center">
              <div>
                <p className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-3xl italic">{reja.ad}</span>
                </p>
                <p className="mt-1 font-outfit text-sm text-ink-muted">{reja.narx}</p>
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
                href={`#${CAPA.sorov}`}
                className="inline-flex h-11 w-fit items-center justify-center gap-1.5 rounded-full bg-pine px-5 font-outfit text-sm font-medium text-cream transition-colors hover:bg-pine-2 sm:justify-self-end"
              >
                {t.dugme}
                <ArrowUpRight className="size-3.5" />
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-6 font-outfit text-sm text-ink-muted">{t.izoh}</p>
      </div>
    </section>
  )
}

/** Closing section. The Turkish page has a trial sign-up form here; this is the request form and the invitation link. */
function Sorov({ t, iletisimEposta, kayitHref }: { t: AcilisIcerigi['sorov']; iletisimEposta: string | null; kayitHref: string }) {
  return (
    <section id={CAPA.sorov} className="scroll-mt-16 bg-pine text-cream">
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

export function AcilisSayfasi({ dil, istenenDil, iletisimEposta, gorseller }: AcilisSayfasiProps & { gorseller: AcilisGorselleri }) {
  // `dil` is one of the pack's public languages (Uzbek Latin, Russian). The page is also written in Uzbek Cyrillic:
  // that form is served when the address asks for it by name. Anything else stays what `dil` says — never a guess.
  const d: AcilisDili = acilisDiliMi(istenenDil) ? istenenDil : acilisDiliMi(dil) ? dil : (acilisIcerigi(dil), VARSAYILAN)
  const t = acilisIcerigi(d)
  // Login and sign-up exist in the pack's public languages only; a Cyrillic visitor continues in Uzbek Latin.
  const girisHref = dilliYol('/login', dilSec(d))
  const kayitHref = dilliYol('/signup', dilSec(d))
  const ozbekcha: AcilisDili = d === 'ru' ? VARSAYILAN : d
  const ustDiller = [dilSecenegi(ozbekcha, d !== 'ru'), dilSecenegi('ru', d === 'ru')]
  const altDiller = (['uz-Latn', 'uz-Cyrl', 'ru'] as const).map((k) => dilSecenegi(k, k === d))

  return (
    <div className="uzl" lang={d}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={ACILIS_FONT_HREF} />
      <div className="relative bg-paper text-ink">
        <UstCubuk metin={t.nav} diller={ustDiller} girisHref={girisHref} sorovHref={`#${CAPA.sorov}`} />
        <main>
          <Kahraman t={t.kahraman} gorsel={gorseller.xona} />
          <Suhbat metin={t.suhbat} />
          <Ozellik id={CAPA.qabul} b={t.qabul} tone="paper-2" />
          <Ozellik id={CAPA.portal} b={t.portal} tone="paper" reverse />
          <Ozellik id={CAPA.maslahat} b={t.maslahat} tone="paper-2" />
          <Ozellik id={CAPA.jadval} b={t.jadval} tone="paper" reverse />
          <Yonalishlar t={t.yonalish} />
          <Ozellik id={CAPA.kuzatuv} b={t.kuzatuv} tone="paper" />
          <Organish metin={t.organish} gorsel={gorseller.stol} />
          <Xavfsizlik t={t.xavfsizlik} gorsel={gorseller.yolak} />
          <Narx t={t.narx} />
          <Sorov t={t.sorov} iletisimEposta={iletisimEposta} kayitHref={kayitHref} />
        </main>
        <footer className="border-t border-line bg-paper">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-3xl italic">notya</p>
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
            {/* All three forms of the page, Uzbek Cyrillic among them. */}
            <DilSecici etiket={t.altBilgi.diller} secenekler={altDiller} className="uzl-dil-alt gap-3 text-xs uppercase tracking-[0.14em]" />
          </div>
        </footer>
      </div>
    </div>
  )
}
