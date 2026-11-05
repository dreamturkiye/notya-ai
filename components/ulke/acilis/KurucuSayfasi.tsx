/**
 * AU-KURUCU-01 (Kaan, 2026-11-03) - the founding-doctor page (/founding) of a country with a founding offer.
 *
 * Same look as the landing page (look parity rule, .cursor/rules/gorunum-paritesi-ulke.mdc): the kit's bar, hero markup, FeatureSection / TypeCard, the pine
 * closing section, the disclaimers and the footer, with the SAME classes (nothing new to compile into ./utilities.css).
 * Every word is the country's (lib/billing/ulkeTicari.ts `kurucuSayfasi`); every number is a setting of that table
 * (seats, prices, trial days and caps), so the page cannot drift from what checkout and the trial enforce.
 *
 *   kalan > 0     the founding offer and "N of 20 founding places left"; primary button: the founding sign-up link
 *   kalan = 0     the regular price, no founding wording in the buttons; primary button: the regular sign-up link
 *   kalan = null  (Stripe not readable) the founding offer without a counter - checkout still enforces the cap
 * Secondary button: the 30-minute private demo (lib/ulke/demo demoIstegi), hidden while no real calendar exists.
 * No product video, no testimonial, no competitor.
 */
import { YasalNotlari } from './YasalNotlari'
import React from 'react'
import { Button } from '@/components/doktor-landing/button'
import { FeatureSection, TypeCard } from '@/components/doktor-landing/feature'
import { ArrowUpRight } from '@/components/doktor-landing/icons'
import { betaNotu } from '@/lib/ulke/acikIcerik'
import { dilSec, ulkePaketi } from '@/lib/ulke/ulke'
import { dilliYol } from '@/lib/ulke/sayfaDili'
import { YASAL_ANAHTARLARI, YASAL_YOLLAR } from '@/lib/ulke/yasal/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'
import type { UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'
import { KURUCU_PLAN_KEY, ulkeTicari, type KurucuSayfasiMetni } from '@/lib/billing/ulkeTicari'
import { demoIstegi } from '@/lib/ulke/demo'
import { UstCubuk } from './UstCubuk'

export const KURUCU_SAYFASI = '/founding'

/** The sign-up address with the plan to carry into checkout after the first sign-in (app/signup/page.ulke.tsx). */
export function kayitAdresi(dil: DilKodu, plan: string, yillik = false): string {
  const y = dilliYol('/signup', dilSec(dil))
  return `${y}${y.includes('?') ? '&' : '?'}plan=${plan}${yillik ? '&interval=year' : ''}`
}

/** "N of 20 founding places left", or null when unknown. */
export function sayacMetni(m: KurucuSayfasiMetni, kalan: number | null, koltuk: number): string | null {
  if (kalan === null) return null
  if (kalan <= 0) return m.dolu.replace('{k}', String(koltuk))
  return (kalan === 1 ? m.sayacBir : m.sayac).replace('{n}', String(kalan)).replace('{k}', String(koltuk))
}

export function KurucuSayfasi({ acilis: a, dil, kalan, gorsel }: { acilis: UlkeAcilisi; dil: DilKodu; kalan: number | null; gorsel: string }) {
  const ayar = ulkeTicari(ulkePaketi().kod as string)
  const m = ayar?.kurucuSayfasi
  if (!m || !ayar?.kurucu || !ayar.fiyatlar?.kurucu || !ayar.deneme) throw new Error('[ulke/acilis] no founding offer in this country.')
  const t = a.icerik[dil]
  if (!t) throw new Error(`[ulke/acilis] no landing copy for "${dil}". No fallback to another language.`)
  const dolu = kalan !== null && kalan <= 0
  const f = ayar.fiyatlar
  const sayac = sayacMetni(m, kalan, ayar.kurucu.koltuk)
  const birinci = dolu ? kayitAdresi(dil, 'sesli_pro') : kayitAdresi(dil, KURUCU_PLAN_KEY)
  const yillik = dolu ? null : kayitAdresi(dil, KURUCU_PLAN_KEY, true)
  const demo = demoIstegi(dil)
  const teklif = dolu ? m.doluTeklif : m.teklif
  const fiyat = dolu ? f.normal : f.kurucu!
  const girisHref = dilliYol('/login', dilSec(dil))
  const anaHref = dilliYol('/', dilSec(dil))

  const dugmeler = (koyu: boolean) => (
    <div className="dl-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Button href={birinci} variant={koyu ? 'cream' : 'pine'} size="lg" className="w-full sm:w-auto">
        {m.birinciDugme}
        <ArrowUpRight className="size-4" />
      </Button>
      {demo ? (
        <Button href={demo.href} variant="blue" size="lg" className="w-full sm:w-auto">
          {demo.etiket}
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="uzl" lang={dil}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={a.fontHref} />
      <div className="relative bg-paper text-ink">
        <UstCubuk metin={{ ...t.nav, havolalar: [] }} diller={[]} girisHref={girisHref} sorovHref={birinci} marka={a.markaYazisi} ustHref={anaHref} demo={demo} />
        <main>
          <section id="founding" className="relative bg-paper">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-14 lg:pt-28">
              <div className="min-w-0">
                <p className="dl-reveal flex items-center gap-3 font-outfit text-xs uppercase tracking-[0.28em] text-ink-muted">
                  <span className="inline-block size-1.5 shrink-0 bg-pine" aria-hidden="true" />
                  {m.ustBaslik}
                </p>
                <h1 className="dl-reveal mt-5 font-display text-hero font-medium leading-hero tracking-hero">
                  {m.baslik}
                  <span className="mt-1 block italic font-normal text-pine">{m.baslikVurgu}</span>
                </h1>
                <p className="dl-reveal mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-ink-2">{m.giris}</p>
                {sayac ? <p className="mt-4 font-outfit text-sm text-ink-2" data-alan="kurucu-sayac" aria-live="polite">{sayac}</p> : null}
                {dugmeler(false)}
                {yillik ? (
                  <p className="mt-4 font-outfit text-sm text-ink-2">
                    <a href={yillik} className="text-ink-2 hover:text-ink" data-alan="kurucu-yillik">{m.yillikBaglanti}</a>
                  </p>
                ) : null}
              </div>
              <figure className="order-first min-w-0 lg:order-none">
                <img src={gorsel} alt={t.kahraman.gorselAlt} fetchPriority="high" decoding="async" className="aspect-[16/10] w-full rounded-xl object-cover object-center lg:aspect-[5/4]" />
              </figure>
            </div>
          </section>

          <FeatureSection
            id="offer"
            tone="paper-2"
            eyebrow={teklif.ustBaslik}
            title={teklif.baslik}
            titleItalic={teklif.baslikVurgu}
            body={teklif.govde}
            bullets={teklif.maddeler}
            card={<TypeCard label={teklif.kartEtiketi} rows={[
              { k: m.kartSatirlari.aylik, v: fiyat.month },
              { k: m.kartSatirlari.yillik, v: fiyat.year },
              ...(dolu ? [] : [{ k: m.kartSatirlari.yer, mark: String(ayar.kurucu.koltuk) }]),
            ]} note={teklif.kartNot} />}
          />
          <FeatureSection
            id="trial"
            tone="paper"
            reverse
            eyebrow={m.deneme.ustBaslik}
            title={m.deneme.baslik}
            titleItalic={m.deneme.baslikVurgu}
            body={m.deneme.govde}
            bullets={m.deneme.maddeler}
            card={<TypeCard label={m.deneme.kartEtiketi} rows={[
              { k: m.kartSatirlari.deneme, v: m.denemeDegerleri.sure },
              { k: m.kartSatirlari.kart, v: m.denemeDegerleri.kart },
              { k: m.kartSatirlari.sinir, v: m.denemeDegerleri.sinir },
              { k: m.kartSatirlari.sonra, mark: m.denemeDegerleri.sonra },
            ]} note={m.deneme.kartNot} />}
          />
          {dolu ? null : (
            <FeatureSection
              id="in-return"
              tone="paper-2"
              eyebrow={m.karsilik.ustBaslik}
              title={m.karsilik.baslik}
              titleItalic={m.karsilik.baslikVurgu}
              body={m.karsilik.govde}
              bullets={m.karsilik.maddeler}
              card={<TypeCard label={m.karsilik.kartEtiketi} rows={m.karsilik.maddeler.slice(0, 2).map((k) => ({ k }))} note={m.karsilik.kartNot} />}
            />
          )}

          <section className="scroll-mt-16 bg-pine text-cream">
            <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="font-outfit text-xs uppercase tracking-[0.22em] text-cream/65">{m.kapanis.ustBaslik}</p>
                <h2 className="mt-4 font-display text-display font-medium leading-display tracking-display">
                  {m.kapanis.baslik}
                  <span className="mt-2 block italic font-normal">{m.kapanis.baslikVurgu}</span>
                </h2>
                <p className="mt-6 max-w-md font-outfit text-lede font-light leading-relaxed text-cream/80">{demo ? m.kapanis.govde : m.kapanis.govdeDemosuz}</p>
              </div>
              <div>{dugmeler(true)}</div>
            </div>
          </section>
        </main>
        <YasalNotlari n={t.yasalNotlari} />
        <footer className="border-t border-line bg-paper">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-3xl italic">{a.markaYazisi}</p>
              <p className="mt-2 max-w-xs font-outfit text-sm leading-relaxed text-ink-muted">{t.altBilgi.tanim}</p>
              <p className="mt-3 font-outfit text-sm text-ink-2" data-beta="evet">{betaNotu(dil)}</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 font-outfit text-sm" aria-label={t.altBilgi.havolalar}>
              <a href={anaHref} className="text-ink-2 hover:text-ink">{a.markaYazisi}</a>
              <a href={girisHref} className="text-ink-2 hover:text-ink">{t.altBilgi.giris}</a>
              {t.altBilgi.yasal.map((etiket, i) => (
                <a key={YASAL_ANAHTARLARI[i]} href={dilliYol(YASAL_YOLLAR[YASAL_ANAHTARLARI[i]], dil)} className="text-ink-2 hover:text-ink">
                  {etiket}
                </a>
              ))}
            </nav>
          </div>
          <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-5 py-6 font-outfit text-xs uppercase tracking-[0.14em] text-ink-muted sm:flex-row sm:justify-between sm:px-8">
            <p>© {new Date().getFullYear()} {t.altBilgi.haklar}</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
