/**
 * NOTYA-ULKE-01 — Uzbekistan landing page (the domain root of an Uzbekistan deployment).
 *
 * Look: the cream / pine tokens of the doctor application (lib/doktor/chromeRenk.ts), set as CSS variables on the
 * root element; layout and responsive rules in ./acilis.css (imported by ./index.tsx so this file stays renderable
 * in a plain Node test). Structure follows the doctor landing: nav, hero, numbered sections each with a typographic
 * card (never a product screenshot), price, footer.
 *
 * Server component. The only client part is the request form.
 */
import React from 'react'
import type { CSSProperties } from 'react'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK } from '@/lib/doktor/chromeRenk'
import type { AcilisSayfasiProps, DilKodu } from '@/lib/ulke/tipler'
import { ACILIS_ICERIGI, acilisIcerigi, type AcilisBolumu } from './icerik'
import { IletisimFormu } from './IletisimFormu'

/** What each language of the page calls itself, in the order of the switch. */
const DIL_SECENEKLERI: readonly { kod: keyof typeof ACILIS_ICERIGI; ad: string; kisa: string }[] = [
  { kod: 'uz-Latn', ad: 'Oʻzbekcha', kisa: 'OʻZ' },
  { kod: 'ru', ad: 'Русский', kisa: 'RU' },
]
const VARSAYILAN_DIL: DilKodu = 'uz-Latn'

/** Internal links keep the visitor's language; the default language needs no parameter. */
function yol(taban: string, dil: DilKodu, capa = ''): string {
  return `${taban}${dil === VARSAYILAN_DIL ? '' : `?dil=${dil}`}${capa}`
}

function Ok() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}

function Kart({ etiket, satirlar, not }: AcilisBolumu['kart']) {
  return (
    <article className="uzl-kart">
      <p className="uzl-kart-etiket">{etiket}</p>
      <ol className="uzl-kart-liste">
        {satirlar.map((s) => (
          <li key={s.ad}>
            <span className="uzl-kart-ad">{s.ad}</span>
            {s.aciklama ? <span className="uzl-kart-aciklama">{s.aciklama}</span> : null}
          </li>
        ))}
      </ol>
      {not ? <p className="uzl-kart-not">{not}</p> : null}
    </article>
  )
}

function Bolum({ b, sira }: { b: AcilisBolumu; sira: number }) {
  return (
    <section id={b.id} className={`uzl-bolum ${sira % 2 === 0 ? 'uzl-zemin-kagit' : 'uzl-zemin-krem'}`}>
      <div className={`uzl-ic uzl-iki ${sira % 2 === 1 ? 'uzl-ters' : ''}`}>
        <div className="uzl-metin">
          <p className="uzl-ust">{b.ustBaslik}</p>
          <h2 className="uzl-h2">
            {b.baslik}
            <span className="uzl-vurgu">{b.baslikVurgu}</span>
          </h2>
          <p className="uzl-govde">{b.govde}</p>
          <ul className="uzl-maddeler">
            {b.maddeler.map((m) => (
              <li key={m}>
                <span className="uzl-nokta" aria-hidden="true" />
                {m}
              </li>
            ))}
          </ul>
        </div>
        <div className="uzl-kart-sarici">
          <Kart {...b.kart} />
        </div>
      </div>
    </section>
  )
}

export function AcilisSayfasi({ dil, iletisimEposta }: AcilisSayfasiProps) {
  const t = acilisIcerigi(dil)
  const R = CHROME_RENK
  const degiskenler = {
    '--uzl-krem': R.cream,
    '--uzl-kagit': R.paper,
    '--uzl-murekkep': R.ink,
    '--uzl-soluk': R.muted,
    '--uzl-cam': R.pine,
    '--uzl-koyu': R.nav,
    '--uzl-altin': R.gold,
    '--uzl-uyari': R.warn,
    '--uzl-cizgi': R.border,
    '--uzl-serif': CHROME_FONT.serif,
    '--uzl-sans': CHROME_FONT.sans,
  } as CSSProperties

  return (
    <div className="uzl" lang={dil} style={degiskenler}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />

      <header className="uzl-ust-cubuk">
        <div className="uzl-ic uzl-ust-cubuk-ic">
          <a href={yol('/', dil, '#top')} className="uzl-marka">notya</a>
          <nav className="uzl-nav" aria-label={t.nav.bolumler}>
            {t.bolumler.map((b) => (
              <a key={b.id} href={`#${b.id}`}>
                <span className="uzl-nav-no">{b.no}</span>
                {b.navEtiketi}
              </a>
            ))}
            <a href="#narx">
              <span className="uzl-nav-no">{t.fiyat.no}</span>
              {t.fiyat.navEtiketi}
            </a>
          </nav>
          <div className="uzl-ust-sag">
            <nav className="uzl-dil" aria-label={t.nav.dil}>
              {DIL_SECENEKLERI.map((d) => (
                <a
                  key={d.kod}
                  href={yol('/', d.kod)}
                  hrefLang={d.kod}
                  lang={d.kod}
                  aria-current={d.kod === dil ? 'true' : undefined}
                  className={d.kod === dil ? 'uzl-dil-secili' : undefined}
                  title={d.ad}
                >
                  <span className="uzl-dil-uzun">{d.ad}</span>
                  <span className="uzl-dil-kisa" aria-hidden="true">{d.kisa}</span>
                </a>
              ))}
            </nav>
            <a href={yol('/login', dil)} className="uzl-dugme uzl-dugme-cizgi uzl-dugme-kucuk">{t.nav.giris}</a>
          </div>
        </div>
      </header>

      <main>
        <section id="top" className="uzl-kahraman uzl-zemin-krem">
          <div className="uzl-ic uzl-iki">
            <div className="uzl-metin">
              <p className="uzl-ust uzl-ust-nokta">
                <span className="uzl-nokta" aria-hidden="true" />
                {t.kahraman.ustBaslik}
              </p>
              <h1 className="uzl-h1">
                {t.kahraman.baslik}
                <span className="uzl-vurgu">{t.kahraman.baslikVurgu}</span>
              </h1>
              <p className="uzl-giris">{t.kahraman.giris}</p>
              <div className="uzl-eylemler">
                <a href="#narx" className="uzl-dugme uzl-dugme-cam">
                  {t.nav.fiyat}
                  <Ok />
                </a>
                <a href={yol('/login', dil)} className="uzl-dugme uzl-dugme-cizgi">{t.nav.giris}</a>
              </div>
            </div>
            <div className="uzl-kart-sarici">
              <article className="uzl-kart uzl-kart-kahraman">
                <p className="uzl-kart-etiket">{t.kahraman.kart.etiket}</p>
                <ol className="uzl-kart-liste">
                  {t.kahraman.kart.satirlar.map((s) => (
                    <li key={s}>
                      <span className="uzl-kart-ad">{s}</span>
                      <span className="uzl-cizgiler" aria-hidden="true"><i /><i /></span>
                    </li>
                  ))}
                </ol>
                <p className="uzl-rozet">{t.kahraman.kart.durum}</p>
              </article>
            </div>
          </div>
          <ul className="uzl-ic uzl-serit">
            {t.kahraman.serit.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {t.bolumler.map((b, i) => (
          <Bolum key={b.id} b={b} sira={i} />
        ))}

        <section className="uzl-guvence">
          <p className="uzl-ic">{t.guvence}</p>
        </section>

        <section id="narx" className="uzl-fiyat">
          <div className="uzl-ic uzl-iki">
            <div className="uzl-metin">
              <p className="uzl-ust">{t.fiyat.ustBaslik}</p>
              <h2 className="uzl-h2">
                {t.fiyat.baslik}
                <span className="uzl-vurgu">{t.fiyat.baslikVurgu}</span>
              </h2>
              <p className="uzl-govde">{t.fiyat.govde}</p>
              <p className="uzl-davet">
                {t.fiyat.davetSorusu}{' '}
                <a href={yol('/signup', dil)}>{t.fiyat.davetBaglantisi}</a>
              </p>
            </div>
            <div className="uzl-kart-sarici">
              {iletisimEposta ? (
                <IletisimFormu adres={iletisimEposta} metin={t.fiyat.form} />
              ) : (
                <article className="uzl-kart">
                  <p className="uzl-kart-etiket">{t.fiyat.form.etiket}</p>
                  <p className="uzl-kart-not">{t.fiyat.formYok}</p>
                </article>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="uzl-alt">
        <div className="uzl-ic uzl-alt-ic">
          <div>
            <p className="uzl-marka uzl-marka-buyuk">notya</p>
            <p className="uzl-alt-tanim">{t.altBilgi.tanim}</p>
          </div>
          <nav className="uzl-alt-nav" aria-label={t.nav.bolumler}>
            <a href={yol('/login', dil)}>{t.altBilgi.giris}</a>
            <a href={yol('/signup', dil)}>{t.altBilgi.kayit}</a>
            {DIL_SECENEKLERI.filter((d) => d.kod !== dil).map((d) => (
              <a key={d.kod} href={yol('/', d.kod)} hrefLang={d.kod} lang={d.kod}>{d.ad}</a>
            ))}
          </nav>
        </div>
        <p className="uzl-ic uzl-alt-hak">© {new Date().getFullYear()} {t.altBilgi.haklar}</p>
      </footer>
    </div>
  )
}
