/**
 * NOTYA-ULKE-KLINIK-ACILIS — the clinic landing of the country kit (`/for-clinics`).
 *
 * The Turkish clinic page (app/klinik/page.tsx, components/klinik-landing/*) is the visual specification and is
 * NOT edited. Section inventory, in that page's order: hero, patient page, disciplines, trust line, price, close.
 * Every word comes from the pack (`AcilisIcerigi['klinik']`). The request form reuses the doctor page's form labels
 * (`sorov`) so a label is written once. Prices are the clinic group of the same price list; a plan with no amount
 * says the pack's "on request" line. No trial, no demo, no screenshot of the product.
 */
import React from 'react'
import { Button } from '@/components/doktor-landing/button'
import { FeatureSection, TypeCard } from '@/components/doktor-landing/feature'
import { ArrowUpRight } from '@/components/doktor-landing/icons'
import { betaNotu } from '@/lib/ulke/acikIcerik'
import { araclarMetni } from '@/lib/ulke/arayuz'
import { dilSec, ulkePaketi } from '@/lib/ulke/ulke'
import { dilliYol } from '@/lib/ulke/sayfaDili'
import { YASAL_ANAHTARLARI, YASAL_YOLLAR } from '@/lib/ulke/yasal/tipler'
import type { AcilisSayfasiProps } from '@/lib/ulke/tipler'
import type { UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'
import { acilisAdresi, acilisFormu, narxSatirlari, ustDilSecenekleri } from './AcilisSayfasi'
import { IletisimFormu } from './IletisimFormu'
import { Narx } from './Narx'
import { DilSecici, UstCubuk } from './UstCubuk'

export function KlinikSayfasi({ dil, istenenDil, iletisimEposta, gorsel, acilis: a }: AcilisSayfasiProps & { gorsel: string; acilis: UlkeAcilisi }) {
  const d = acilisFormu(a, dil, istenenDil)
  const t = a.icerik[d]
  if (!t) throw new Error(`[ulke/acilis] no landing copy for "${d}". No fallback to another language.`)
  const k = t.klinik
  const c = a.capalar
  const girisHref = dilliYol('/login', dilSec(d))
  const kayitHref = dilliYol('/signup', dilSec(d))
  const doktorHref = dilliYol('/', dilSec(d))
  const ust = ustDilSecenekleri(a, ulkePaketi().uygulama?.dilGruplari ?? [], d, '/for-clinics')
  const alt = a.diller.map((kod) => {
    const ad = a.dilAdlari[kod]
    if (!ad) throw new Error(`[ulke/acilis] the clinic page has no name for its form "${kod}". No fallback to another language.`)
    return { kod, ...ad, href: acilisAdresi('/for-clinics', kod), secili: kod === d }
  })
  const klinikGrup = t.narx.gruplar.find((g) => g.id === 'clinic') ?? null
  const b = k.portal

  return (
    <div className="uzl" lang={d}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={a.fontHref} />
      <div className="relative bg-paper text-ink">
        <UstCubuk
          metin={k.nav}
          diller={ust}
          girisHref={girisHref}
          sorovHref={`#${c.klinikSorov}`}
          marka={a.markaYazisi}
          markaEk={k.markaEk}
          ustHref={`#${c.klinikUst}`}
        />
        <main>
          <section id={c.klinikUst} className="relative bg-paper">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-14 lg:pt-28">
              <div className="min-w-0">
                <p className="dl-reveal flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
                  <span className="inline-block size-1.5 shrink-0 bg-pine" aria-hidden="true" />
                  {k.kahraman.ustBaslik}
                </p>
                <h1 className="dl-reveal mt-5 font-display text-hero font-medium leading-hero tracking-hero">
                  {k.kahraman.baslik}
                  <span className="mt-1 block italic font-normal text-pine">{k.kahraman.baslikVurgu}</span>
                </h1>
                <p className="dl-reveal mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{k.kahraman.giris}</p>
                <div className="dl-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button href={`#${c.klinikSorov}`} variant="pine" size="lg" className="w-full sm:w-auto">
                    {k.kahraman.birinciDugme}
                    <ArrowUpRight className="size-4" />
                  </Button>
                  <Button href={`#${c.klinikDallar}`} variant="outline" size="lg" className="w-full sm:w-auto">
                    {k.kahraman.ikinciDugme}
                  </Button>
                </div>
              </div>
              <figure className="order-first min-w-0 lg:order-none">
                <img src={gorsel} alt={k.kahraman.gorselAlt} className="aspect-[16/10] w-full rounded-xl object-cover object-center lg:aspect-[5/4]" />
                <figcaption className="mt-3 font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{k.kahraman.gorselAlti}</figcaption>
              </figure>
            </div>
          </section>

          <FeatureSection
            id={c.klinikPortal}
            tone="paper-2"
            eyebrow={b.ustBaslik}
            title={b.baslik}
            titleItalic={b.baslikVurgu}
            body={b.govde}
            bullets={b.maddeler}
            card={<TypeCard label={b.kart.etiket} rows={b.kart.satirlar} note={b.kart.not} />}
          />

          <section id={c.klinikDallar} className="scroll-mt-16 bg-paper py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <p className="font-outfit text-xs uppercase tracking-[0.22em] text-ink-muted">{k.dallar.ustBaslik}</p>
              <h2 className="mt-4 max-w-3xl font-display text-display font-medium leading-display tracking-display">
                {k.dallar.baslik}
                <span className="block italic font-normal text-pine">{k.dallar.baslikVurgu}</span>
              </h2>
              <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{k.dallar.govde}</p>
              <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-8 font-display text-title italic leading-snug text-ink-2" aria-label={k.dallar.royxatEtiketi}>
                {k.dallar.royxat.map((ad) => (
                  <li key={ad}>{ad}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border-y border-line bg-paper">
            <p className="mx-auto max-w-7xl px-5 py-8 font-outfit text-sm leading-relaxed text-ink-2 sm:px-8">{k.guven}</p>
          </section>

          {klinikGrup ? (
            <Narx
              metin={{ ...t.narx, ustBaslik: k.fiyat.ustBaslik, baslik: k.fiyat.baslik, baslikVurgu: k.fiyat.baslikVurgu, gruplar: [klinikGrup] }}
              fiyatlar={narxSatirlari(a)}
              capa={c.klinikFiyat}
              sorovHref={`#${c.klinikSorov}`}
            />
          ) : null}

          <section id={c.klinikSorov} className="scroll-mt-16 bg-pine text-cream">
            <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="font-outfit text-xs uppercase tracking-[0.22em] text-cream/65">{k.cta.ustBaslik}</p>
                <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
                  {k.cta.baslik}
                  <span className="mt-2 block italic font-normal">{k.cta.baslikVurgu}</span>
                </h2>
                <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-cream/80">{k.cta.govde}</p>
                <p className="mt-6 font-outfit text-sm text-cream/80">
                  <a href={doktorHref} className="border-b border-cream/65 text-cream">
                    {k.cta.ikinciDugme}
                  </a>
                </p>
                <p className="mt-4 font-outfit text-sm text-cream/80">
                  {t.sorov.davetSorusu}{' '}
                  <a href={kayitHref} className="border-b border-cream/65 text-cream">
                    {t.sorov.davetBaglantisi}
                  </a>
                </p>
              </div>
              <div className="rounded-xl bg-cream p-6 text-ink shadow-border">
                {iletisimEposta ? (
                  <IletisimFormu adres={iletisimEposta} metin={t.sorov.form} />
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="font-outfit text-xs uppercase tracking-[0.18em] text-ink-muted">{t.sorov.form.etiket}</p>
                    <p className="font-outfit text-sm leading-relaxed text-ink-muted">{t.sorov.formYok}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
        <footer className="border-t border-line bg-paper">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <a href={`#${c.klinikUst}`} className="flex items-baseline gap-2 font-display text-2xl italic leading-none tracking-tight">
              {a.markaYazisi}
              <span className="font-outfit text-[11px] not-italic uppercase tracking-[0.3em] text-pine">{k.markaEk}</span>
            </a>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 font-outfit text-sm text-ink-2" aria-label={k.altBilgi.havolalar}>
              <a href={dilliYol('/medical', d)} className="hover:text-ink">
                {araclarMetni(d).kabuk.araclar}
              </a>
              {k.altBilgi.yasal.map((etiket, i) => (
                <a key={YASAL_ANAHTARLARI[i]} href={dilliYol(YASAL_YOLLAR[YASAL_ANAHTARLARI[i]], d)} className="hover:text-ink">
                  {etiket}
                </a>
              ))}
              <a href={doktorHref} className="hover:text-ink">
                {k.altBilgi.doktor}
              </a>
              <a href={girisHref} className="hover:text-ink">
                {k.altBilgi.giris}
              </a>
            </nav>
            <p className="font-outfit text-xs text-ink-muted">
              © {new Date().getFullYear()} {k.altBilgi.haklar}
            </p>
          </div>
          <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-5 py-6 sm:px-8">
            <p className="max-w-xs font-outfit text-sm leading-relaxed text-ink-muted">{k.altBilgi.tanim}</p>
            <p className="font-outfit text-sm text-ink-2" data-beta="evet">{betaNotu(d)}</p>
            <DilSecici etiket={k.altBilgi.diller} secenekler={alt} className="uzl-dil-alt gap-3 text-xs uppercase tracking-[0.14em]" />
          </div>
        </footer>
      </div>
    </div>
  )
}
