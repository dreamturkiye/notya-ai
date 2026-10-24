'use client'

/**
 * The patient portal's first page (Türkiye: "Sağlığım" › Özet) as a plain presentational view: the welcome hero with the
 * doctor's card, the four chips, the shortcuts and the recent activity. Türkiye's HomeHero and every country's patient
 * page draw THROUGH this. No word is written here: every string, link and number arrives as a prop. Needs `sagligim.css`.
 */
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { SoftPanel } from './ui'

export type PortalHekimG = {
  ad: string
  /** Specialty and clinic, joined. */
  altSatir: string
  adres: string | null
  telefon: string | null
  telefonHref: string | null
  avatarUrl: string | null
  /** The initials drawn when there is no photo. */
  harfler: string
}

export type PortalCip = {
  key: string
  label: string
  value: string
  href: string
  /** A new message is waiting: the chip is drawn loud, with `yeniAlt` under `value`. */
  vurgu: boolean
  yeniAlt?: string
  testId?: string
}

export type PortalKisayol = { label: string; href: string; hint: string }
export type PortalAktivite = { id: string; baslik: string; tarih: string; href?: string }

export type PortalOzetSozleri = {
  karsilamaAria: string
  markaAria: string
  marka: string
  urun: string
  hastaEtiketi: string
  lede: string
  ctaEtiket: string
  hekimEtiketi: string
  hekimAria: string
  hekimBos: string
  kisayolBaslik: string
  aktiviteBaslik: string
  aktiviteBos: string
  aktiviteAc: string
}

function HekimAvatar({ hekim, boyut = 96 }: { hekim: PortalHekimG; boyut?: number }) {
  const stil: CSSProperties = {
    width: boyut,
    height: boyut,
    minWidth: boyut,
    maxWidth: boyut,
    minHeight: boyut,
    maxHeight: boyut,
    aspectRatio: '1 / 1',
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
  }
  if (hekim.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL; next/image uygulanmaz
      <img src={hekim.avatarUrl} alt="" width={boyut} height={boyut} className="sg-hekim-avatar-img" style={{ ...stil, objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
    )
  }
  return (
    <div className="sg-hekim-avatar-harf" style={stil} aria-hidden>
      {hekim.harfler}
    </div>
  )
}

function HekimKarti({ hekim, s }: { hekim: PortalHekimG; s: PortalOzetSozleri }) {
  return (
    <article className="sg-hekim-kart" aria-label={s.hekimAria}>
      <div className="sg-hekim-kart-glow" aria-hidden />
      <div className="sg-hekim-kart-icerik">
        <div className="sg-hekim-avatar-wrap">
          <HekimAvatar hekim={hekim} />
        </div>
        <div className="sg-hekim-metin">
          <p className="sg-hekim-etiket">{s.hekimEtiketi}</p>
          <h1 className="sg-hekim-ad">{hekim.ad}</h1>
          {hekim.altSatir ? <p className="sg-hekim-brans">{hekim.altSatir}</p> : null}
          <ul className="sg-hekim-iletisim">
            {hekim.adres ? (
              <li className="sg-hekim-satir">
                <span className="sg-hekim-ikon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <span>{hekim.adres}</span>
              </li>
            ) : null}
            {hekim.telefon ? (
              <li className="sg-hekim-satir">
                <span className="sg-hekim-ikon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L7.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7A2 2 0 0 1 22 16.9z" />
                  </svg>
                </span>
                {hekim.telefonHref ? (
                  <a href={hekim.telefonHref} className="sg-hekim-tel">
                    {hekim.telefon}
                  </a>
                ) : (
                  <span>{hekim.telefon}</span>
                )}
              </li>
            ) : null}
          </ul>
          {!hekim.adres && !hekim.telefon ? <p className="sg-hekim-bos">{s.hekimBos}</p> : null}
        </div>
      </div>
    </article>
  )
}

export function PortalOzetGorunumu({ s, hastaAdi, ctaHref, kutucuk, hekim, uyari, cipler, ekBolum, kisayollar, aktiviteler, git }: {
  s: PortalOzetSozleri
  hastaAdi: string | null
  ctaHref: string
  /** The tile under the hero: a link where there is a page behind it (vaccine card), else a caption. */
  kutucuk: { baslik: string; href: string | null }
  hekim: PortalHekimG
  /** The "your visit is close" strip, or null. */
  uyari: { baslik: string; metin: string; href: string; cta: string } | null
  cipler: PortalCip[]
  /** A section between the chips and the shortcuts (Türkiye: the target-height card). */
  ekBolum?: { baslik: string; icerik: ReactNode } | null
  kisayollar: PortalKisayol[]
  aktiviteler: PortalAktivite[]
  /** A page that keeps its own tabs opens a link itself instead of navigating. */
  git?: (href: string) => void
}) {
  const tikla = (href: string) => (git ? (e: React.MouseEvent) => { e.preventDefault(); git(href) } : undefined)
  return (
    <div className="sg-home">
      <section className="sg-hero sg-hero--hekim" aria-label={s.karsilamaAria}>
        {/* PORTAL-HEKIM-01 — Notya sol/üst kompakt; hekim kartı ana panel. */}
        <div className="sg-hero-side sg-hero-side--brand" aria-label={s.markaAria}>
          <div className="sg-hero-main sg-hero-main--compact">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sagligim/hero-walk.jpg" alt="" className="sg-hero-media" />
            <div className="sg-hero-veil" aria-hidden />
            <div className="sg-hero-copy">
              <div className="sg-hero-brand">
                <p className="sg-hero-brand-name">{s.marka}</p>
                <span className="sg-hero-brand-sub">{s.urun}</span>
              </div>
              <span className="sg-hero-rule" aria-hidden />
              {/* PORTAL-HASTA-ADI — whose page this is (adult or a parent on a child's page); nothing when unnamed. */}
              {hastaAdi ? (
                <div className="sg-hero-hasta" data-testid="portal-hasta-adi">
                  <span className="sg-hero-hasta-etiket">{s.hastaEtiketi}</span>
                  <p className="sg-hero-hasta-ad">{hastaAdi}</p>
                </div>
              ) : null}
              <p className="sg-hero-lede">{s.lede}</p>
              <Link href={ctaHref} className="sg-hero-cta" onClick={tikla(ctaHref)}>
                {s.ctaEtiket} <span className="sg-hero-cta-arrow" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          </div>

          {kutucuk.href ? (
            <Link href={kutucuk.href} className="sg-hero-tile" aria-label={kutucuk.baslik} onClick={tikla(kutucuk.href)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sagligim/preventive-care.jpg" alt="" />
              <span className="sg-hero-tile-caption">{kutucuk.baslik}</span>
            </Link>
          ) : (
            <figure className="sg-hero-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sagligim/preventive-care.jpg" alt="" />
              <figcaption className="sg-hero-tile-caption">{kutucuk.baslik}</figcaption>
            </figure>
          )}
        </div>

        <HekimKarti hekim={hekim} s={s} />
      </section>

      <div className="sg-home-body">
        {uyari ? (
          <div className="sg-muayene-uyari sg-fade" role="status" data-testid="muayene-uyari-48s">
            <span className="sg-muayene-uyari-ikon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <div className="sg-muayene-uyari-baslik">{uyari.baslik}</div>
              <div className="sg-muayene-uyari-metin">{uyari.metin}</div>
            </div>
            <Link href={uyari.href} className="sg-muayene-uyari-cta" onClick={tikla(uyari.href)}>{uyari.cta}</Link>
          </div>
        ) : null}

        <div className="sg-chip-grid sg-fade sg-fade-delay-1">
          {cipler.map((c) => (
            <Link key={c.key} href={c.href} className={`sg-chip${c.vurgu ? ' sg-chip--yeni-mesaj' : ''}`} data-testid={c.testId} onClick={tikla(c.href)}>
              <div className="sg-chip-label">{c.label}</div>
              {c.vurgu ? (
                <div className="sg-chip-yeni-mesaj">
                  <span className="sg-chip-yeni-mesaj-balon" aria-hidden>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <div className="sg-chip-yeni-mesaj-metin">
                    <span className="sg-chip-yeni-mesaj-baslik">{c.value}</span>
                    <span className="sg-chip-yeni-mesaj-sayi">{c.yeniAlt}</span>
                  </div>
                </div>
              ) : (
                <div className="sg-chip-value">{c.value}</div>
              )}
            </Link>
          ))}
        </div>

        {ekBolum ? (
          <section className="sg-home-section sg-fade sg-fade-delay-2">
            <h2 className="sg-display sg-home-section-title">{ekBolum.baslik}</h2>
            {ekBolum.icerik}
          </section>
        ) : null}

        <section className="sg-home-section sg-fade sg-fade-delay-2">
          <h2 className="sg-display sg-home-section-title">{s.kisayolBaslik}</h2>
          <div className="sg-shortcut-grid">
            {kisayollar.map((k) => (
              <Link key={k.label} href={k.href} className="sg-shortcut" onClick={tikla(k.href)}>
                <div className="sg-shortcut-label">{k.label}</div>
                <div className="sg-shortcut-hint">{k.hint}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="sg-home-section sg-fade sg-fade-delay-3">
          <h2 className="sg-display sg-home-section-title">{s.aktiviteBaslik}</h2>
          <SoftPanel className="sg-activity-panel">
            {aktiviteler.length === 0 ? (
              <p className="sg-activity-empty">{s.aktiviteBos}</p>
            ) : (
              aktiviteler.map((a) => {
                const body = (
                  <>
                    <div className="sg-activity-main">
                      <div className="sg-activity-title">{a.baslik}</div>
                      <div className="sg-activity-meta">{a.tarih}</div>
                    </div>
                    {a.href ? <span className="sg-activity-open">{s.aktiviteAc}</span> : null}
                  </>
                )
                if (a.href) {
                  return (
                    <Link key={a.id} href={a.href} className="sg-activity-row" onClick={tikla(a.href)}>
                      {body}
                    </Link>
                  )
                }
                return (
                  <div key={a.id} className="sg-activity-row">
                    {body}
                  </div>
                )
              })
            )}
          </SoftPanel>
        </section>
      </div>
    </div>
  )
}
