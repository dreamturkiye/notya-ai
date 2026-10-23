'use client';

/**
 * AU-LOOK-PARITY-01 (Kaan, 2026-10-23, "one look in every country") — the doctor application's FRAME as a neutral view:
 * the left sidebar (word mark, the pine "ask the assistant" button, the grouped navigation with its icons and badges), the
 * account / clock / weather / sign-out cluster at the top right, the plant, the phone header, the bottom tab bar and the
 * phone menu sheet. It was DoktorChrome's own JSX, moved here unchanged; Türkiye's DoktorChrome now renders through it
 * and a country's frame (components/ulke/uygulama/Kabuk.tsx) renders through the SAME view, so the two cannot drift apart.
 *
 * PURE and WORD-FREE: every sentence, every item and every handler arrives as a prop (Türkiye's words are in DoktorChrome,
 * a country's are the pack's). The markup Türkiye gets from it is pinned byte for byte by lib/doktor/doktorChrome.test.ts.
 *
 * An item with `href` renders as a real link (a country's pages are separate documents); an item without it is the
 * Türkiye form (a div that calls `onGit(id)`); `pasif` is an item that has no page yet in this build: it looks the same
 * and does nothing.
 */

import React from 'react';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeRenk';

export interface KabukOge {
  id: string;
  label: string;
  /** Key into KABUK_IKON. */
  ikon: string;
  aktif: boolean;
  rozet?: number;
  href?: string;
  pasif?: boolean;
  /** A country's own marker for an item that has no page yet (`data-duvar`). Absent in Türkiye. */
  isaret?: string;
}

export interface KabukHesap {
  harfler: string;
  avatarUrl: string | null;
  /** The name line, already written the way the country writes it ("Dr. …"); a non-breaking space while unknown. */
  ad: string;
  /** The line under the name (specialty / role). */
  alt: string;
  avatarAd: string;
  avatarBasligi: string;
  avatarEtiketi: string;
  saat: string;
  hava: { sicaklik: number; kod: number } | null;
  cikis: string;
  onHesap: () => void;
  onCikis: () => void;
}

export interface KabukProps {
  marka: string;
  kicker: string;
  /** The pine button on top of the sidebar. */
  asistan: KabukOge | null;
  calisma: { baslik: string; ogeler: KabukOge[] } | null;
  diger: { baslik: string; ogeler: KabukOge[] } | null;
  onGit: (id: string) => void;
  hesap: KabukHesap;
  /** What sits under the sidebar (the specialty switch); null in a country. */
  yanAlt?: React.ReactNode;
  /** Phone tab bar, the phone menu and the phone header. */
  sekme: KabukOge[];
  menu: { asistan: KabukOge[]; ogeler: KabukOge[] };
  menuAktif: boolean;
  /** Badge on the phone "Menü" tab (Türkiye: the inbox count). */
  menuRozet?: number;
  menuAcik: boolean;
  onMenu: (acik: boolean) => void;
  menuAlt?: React.ReactNode;
  geri: { id: string; etiket: string; aria: string } | null;
  anaSayfaId: string;
  menuMetni: string;
  menuKapat: string;
  anaMenu: string;
  /** The path is the home screen / the wide calendar: two layout classes. */
  anaSayfa: boolean;
  genis: boolean;
  kompakt: boolean;
  /** Extra CSS of the phone layout (Türkiye: the touch rules). Spliced into the phone block of the frame's stylesheet. */
  cssEk?: string;
  bitkiSrc: string;
  altYazi: React.ReactNode;
  children: React.ReactNode;
}

export const KABUK_YAPRAK = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.15" />
    <path d="M10 13.2c2-2 4.2-3 6.8-3.4" stroke="currentColor" strokeWidth="1.05" />
    <path d="M6.2 20c1.2-4 2.2-6.6 4.8-9.8" stroke="currentColor" strokeWidth="1.05" />
  </svg>
);

/** The navigation icons, by key. One hand: the Türkiye chrome's. */
export const KABUK_IKON: Record<string, React.ReactNode> = {
  asistan: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 18c.5-3 2.2-4.6 5-4.6S16.5 15 17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  anaSayfa: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 5l8 6.5V20H4v-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
  ),
  randevular: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="12" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.55" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.45" /></svg>
  ),
  hastalar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.45" /><circle cx="15.4" cy="9" r="1.7" stroke="currentColor" strokeWidth="1.45" /><path d="M4.8 18c.6-3 2.4-4.5 4.3-4.5s3.6 1.5 4.2 4.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" /></svg>
  ),
  mesajlar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 6.5 12 12.5l7.5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  ),
  gelenBelgeler: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 13.5 6.5 6h11L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M4 13.5h4.5l1.2 2h4.6l1.2-2H20" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
  ),
  raporlar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 19V10M10 19V6M15 19v-7M20 19V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
  ),
  belge: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.4" /></svg>
  ),
  araclar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /></svg>
  ),
  ayarlar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.45" /><path d="M12 4.6v1.8M12 17.6v1.8M4.6 12h1.8M17.6 12h1.8" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" /></svg>
  ),
};

const MENU_IKON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="6" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
  </svg>
);

/** WMO weather code (Open-Meteo) -> a simple glyph. https://open-meteo.com/en/docs (WMO Weather interpretation codes). */
export function havaIkonu(kod: number): string {
  if (kod === 0) return '☀️';
  if (kod <= 3) return '⛅';
  if (kod === 45 || kod === 48) return '🌫️';
  if (kod >= 51 && kod <= 57) return '🌦️';
  if (kod >= 61 && kod <= 67) return '🌧️';
  if (kod >= 71 && kod <= 77) return '❄️';
  if (kod >= 80 && kod <= 82) return '🌦️';
  if (kod >= 95) return '⛈️';
  return '🌤️';
}

const S = (s: Record<string, unknown>) => s as React.CSSProperties;

/** One row of the sidebar (or of the phone menu): `vurgu` is the pine "ask the assistant" button. */
function SatirOge({ oge, vurgu, onGit }: { oge: KabukOge; vurgu?: boolean; onGit: (id: string) => void }) {
  const rozet = oge.rozet ?? 0;
  const tikla = oge.pasif || oge.href ? {} : { onClick: () => onGit(oge.id), role: 'link' as const };
  const link = oge.href ? { href: oge.href } : {};
  const Etiket = (oge.href ? 'a' : 'div') as 'a' | 'div';
  const baglanti: Record<string, unknown> = oge.href ? { textDecoration: 'none' } : {};
  const pasif: Record<string, unknown> = oge.pasif ? { cursor: 'default' } : {};
  if (vurgu) {
    return (
      <Etiket
        key={oge.id}
        {...link}
        {...tikla}
        aria-disabled={oge.pasif ? true : undefined}
        data-duvar={oge.isaret}
        style={S({ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 13, background: CHROME_RENK.pine, color: '#FAF8F4', cursor: 'pointer', marginBottom: 18, ...baglanti, ...pasif })}
      >
        {KABUK_IKON[oge.ikon]}
        <span style={S({ fontSize: 14.5, fontWeight: 700 })}>{oge.label}</span>
      </Etiket>
    );
  }
  return (
    <Etiket
      key={oge.id}
      {...link}
      {...tikla}
      aria-current={oge.href && oge.aktif ? 'page' : undefined}
      aria-disabled={oge.pasif ? true : undefined}
      data-duvar={oge.isaret}
      style={S({
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 11, cursor: 'pointer',
        fontSize: 14.5, fontWeight: 600, justifyContent: 'space-between',
        background: oge.aktif ? CHROME_RENK.nav : 'transparent', color: oge.aktif ? '#f4ead7' : '#4a4030',
        ...baglanti, ...pasif,
      })}
    >
      <span style={S({ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 })}>
        {KABUK_IKON[oge.ikon]}
        <span style={S({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{oge.label}</span>
      </span>
      {rozet > 0 && (
        <span style={S({
          flexShrink: 0, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: CHROME_RENK.warn,
          color: '#FAF8F4', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontVariantNumeric: 'tabular-nums',
        })}>
          {rozet > 9 ? '9+' : rozet}
        </span>
      )}
    </Etiket>
  );
}

export default function KabukGorunumu(p: KabukProps) {
  const { hesap } = p;
  const satir = (oge: KabukOge, vurgu = false) => <SatirOge key={oge.id} oge={oge} vurgu={vurgu} onGit={p.onGit} />;

  const sidebarInner = (
    <>
      <div onClick={() => p.onGit(p.anaSayfaId)} style={S({ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '0 6px 22px', cursor: 'pointer' })}>
        <div style={S({ color: '#6a7563', marginTop: 1 })}>{KABUK_YAPRAK}</div>
        <div>
          <div style={S({ fontFamily: CHROME_FONT.serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: CHROME_RENK.ink })}>{p.marka}</div>
          <span style={S({ display: 'block', marginTop: 3, fontSize: 9, letterSpacing: '0.28em', fontWeight: 700, color: '#7d7164' })}>
            {p.kicker}
          </span>
        </div>
      </div>

      {p.asistan && satir(p.asistan, true)}

      {p.calisma && p.calisma.ogeler.length > 0 && (
        <>
          <div style={S({ fontSize: 11, fontWeight: 700, color: '#9a8c7c', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 14px', marginBottom: 6 })}>{p.calisma.baslik}</div>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 })}>
            {p.calisma.ogeler.map((i) => satir(i))}
          </div>
        </>
      )}

      {p.diger && p.diger.ogeler.length > 0 && (
        <>
          <div style={S({ height: 1, background: CHROME_RENK.border, margin: '0 14px 14px' })} />
          <div style={S({ fontSize: 11, fontWeight: 700, color: '#9a8c7c', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 14px', marginBottom: 6 })}>{p.diger.baslik}</div>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: 2 })}>
            {p.diger.ogeler.map((i) => satir(i))}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
    <style>{`
      html, body { background: ${CHROME_RENK.cream}; }
      .notya-yan { display: flex; }
      .notya-masa-ust { display: flex; }
      .notya-telefon-ust, .notya-telefon-menu, .notya-telefon-perde, .notya-alt-nav { display: none; }
      /* globals.css pins every fixed nav to top:0. With bottom:0 that stretched the tab bar over the page. */
      body .notya-alt-nav { top: auto !important; height: auto !important; bottom: 0 !important; }
      .notya-icerik {
        width: min(1120px, calc(100% - 64px));
        margin: 0 auto;
        padding: calc(22px + env(safe-area-inset-top, 0px)) 0 48px;
        position: relative;
        z-index: 1;
        box-sizing: border-box;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      /* NOTYA-RANDEVU-GENIS-01: wide calendar: fewer side margins, wider month grid. */
      .notya-icerik.notya-icerik-genis {
        width: min(1480px, calc(100% - 40px));
      }
      .notya-alt { margin-top: auto; }
      .notya-bitki { opacity: 0.4; }
      @media (min-width: 900px) {
        .notya-bitki-asagi {
          top: 5.5rem !important;
          bottom: auto !important;
          right: -8% !important;
          width: min(44vw, 560px) !important;
          height: 70vh !important;
          object-position: 72% 28% !important;
          opacity: 0.34;
          -webkit-mask-image: linear-gradient(100deg, transparent 0%, #000 48%) !important;
          mask-image: linear-gradient(100deg, transparent 0%, #000 48%) !important;
        }
      }
      .notya-kompakt {
        position: absolute;
        left: 0; right: 0;
        top: env(safe-area-inset-top, 0px);
        bottom: env(safe-area-inset-bottom, 0px);
      }
      @media (max-width: 899px) {
        .notya-yan, .notya-masa-ust { display: none !important; }
        .notya-telefon-ust { display: flex !important; }
        .notya-telefon-perde { display: block !important; }
        .notya-telefon-menu { display: flex !important; }
        .notya-alt-nav { display: flex !important; }
        .notya-icerik { width: calc(100% - 32px); padding-top: 0; padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px)); }
        .notya-alt-nav {
          left: 8px !important;
          right: 8px !important;
          width: auto !important;
          bottom: calc(8px + env(safe-area-inset-bottom, 0px)) !important;
          border-radius: 16px !important;
          background: linear-gradient(165deg, #d0d8d5, #dde3e0) !important;
          border: 1px solid rgba(30,51,54,0.18) !important;
          color: #1e3336;
        }
        .notya-telefon-ust {
          position: sticky;
          top: 0;
          z-index: 40;
          margin: 0 -16px 16px;
          padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 12px;
          background: ${CHROME_RENK.cream};
          border-bottom: 1px solid ${CHROME_RENK.border};
        }
        ${p.cssEk ? `${p.cssEk}
        ` : ''}.notya-bitki { opacity: 0.28; }
        .notya-bitki-asagi {
          top: 18rem !important;
          right: -22% !important;
          bottom: auto !important;
          width: min(88vw, 460px) !important;
          height: 46vh !important;
          object-position: 70% 32% !important;
          opacity: 0.3;
          -webkit-mask-image: linear-gradient(105deg, transparent 0%, #000 58%) !important;
          mask-image: linear-gradient(105deg, transparent 0%, #000 58%) !important;
        }
        .notya-kompakt { bottom: calc(84px + env(safe-area-inset-bottom, 0px)); }
        .notya-telefon-menu [role="link"] { min-height: 44px; box-sizing: border-box; }
        .notya-alt-yuzer { bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important; }
        .notya-kabuk:has(.notya-alt-nav-akis) { flex-direction: column; }
        .notya-kabuk:has(.notya-alt-nav-akis) .notya-icerik { padding-bottom: calc(132px + env(safe-area-inset-bottom, 0px)) !important; }
        body .notya-alt-nav.notya-alt-nav-akis {
          position: relative !important;
          top: auto !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
          width: auto !important;
          margin: 12px 8px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
        }
      }
      @media print {
        .notya-alt-nav, .notya-telefon-menu, .notya-telefon-perde { display: none !important; }
      }
    `}</style>
    <div
      className="notya-kabuk"
      style={S({
        minHeight: '100dvh', position: 'relative',
        background: CHROME_RENK.cream, fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink,
        display: 'flex',
      })}
    >
      <nav
        className="notya-yan"
        style={S({
          width: 248, flexShrink: 0, minHeight: '100vh', background: CHROME_RENK.paper,
          borderRight: `1px solid ${CHROME_RENK.border}`, flexDirection: 'column',
          padding: '0 14px 22px', paddingTop: 'calc(22px + env(safe-area-inset-top, 0px))',
          boxSizing: 'border-box', position: 'sticky', top: 0,
          alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto',
        })}
      >
          {sidebarInner}
          <div style={S({ flex: 1 })} />
          {p.yanAlt ? (
            <div style={S({ borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: 14, marginTop: 10 })}>
              {p.yanAlt}
            </div>
          ) : null}
        </nav>

      <div className="notya-ana" style={S({ flex: 1, minWidth: 0, position: 'relative' })}>
        {p.kompakt ? (
          <div className="notya-kompakt">{p.children}</div>
        ) : (
        <>
        <div style={S({ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 })}>
        <img
          src={p.bitkiSrc}
          alt=""
          className={p.anaSayfa ? 'notya-bitki notya-bitki-asagi' : 'notya-bitki'}
          style={S({
            position: 'absolute', right: '-2%', top: 0, bottom: 0, width: 'min(50vw, 700px)',
            objectFit: 'cover', objectPosition: '58% 12%',
            filter: 'saturate(.65) contrast(.88) brightness(1.1)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
          })}
        />
        </div>

        <div className={p.genis ? 'notya-icerik notya-icerik-genis' : 'notya-icerik'}>

          <div className="notya-masa-ust" style={S({ alignItems: 'center', justifyContent: 'flex-end', gap: 16, color: '#6e6256', fontSize: 15, marginBottom: 24, flexWrap: 'wrap' })}>
              <button
                type="button"
                onClick={hesap.onHesap}
                title={hesap.avatarBasligi}
                aria-label={hesap.avatarEtiketi}
                style={S({
                  width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: CHROME_RENK.pine, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: CHROME_RENK.gold, fontWeight: 700, fontSize: 15, padding: 0, border: 'none', cursor: 'pointer',
                  boxShadow: `0 0 0 3px ${CHROME_RENK.cream}, 0 0 0 4px rgba(47,67,52,0.16)`,
                })}
              >
                {hesap.avatarUrl ? <img src={hesap.avatarUrl} alt={hesap.avatarAd} style={S({ width: '100%', height: '100%', objectFit: 'cover' })} /> : hesap.harfler}
              </button>
              <div>
                <strong style={S({ display: 'block', color: CHROME_RENK.ink, fontSize: 14.5, fontWeight: 650, whiteSpace: 'nowrap' })}>
                  {hesap.ad}
                </strong>
                <small style={S({ color: '#8a7b6c', fontSize: 12 })}>
                  {hesap.alt}
                </small>
              </div>
              <div style={S({ width: 1, height: 40, background: 'rgba(58,44,34,0.16)' })} />
              <div>
                <div style={S({ fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 600, color: CHROME_RENK.ink, lineHeight: 1 })}>{hesap.saat}</div>
                {hesap.hava && (
                  <div style={S({ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 22, fontWeight: 600, color: '#8a7b6c', lineHeight: 1 })}>
                    <span style={S({ fontSize: 22 })}>{havaIkonu(hesap.hava.kod)}</span>
                    <span>{hesap.hava.sicaklik}°</span>
                  </div>
                )}
              </div>
              <div style={S({ width: 1, height: 40, background: 'rgba(58,44,34,0.16)' })} />
              <button
                onClick={hesap.onCikis}
                style={S({ padding: '8px 15px', borderRadius: 999, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}66`, color: CHROME_RENK.warn, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 })}
              >
                {hesap.cikis}
              </button>
            </div>
            <header className="notya-telefon-ust" style={S({ alignItems: 'center', justifyContent: 'space-between', gap: 12 })}>
                {p.geri ? (
                  <button
                    type="button"
                    onClick={() => p.onGit(p.geri!.id)}
                    aria-label={p.geri.aria}
                    style={S({ display: 'flex', alignItems: 'center', gap: 4, minHeight: 44, padding: '0 4px', border: 'none', background: 'transparent', color: CHROME_RENK.pine, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })}
                  >
                    <span aria-hidden style={S({ fontSize: 26, lineHeight: 1, marginTop: -2 })}>‹</span>
                    {p.geri.etiket}
                  </button>
                ) : (
                  <div onClick={() => p.onGit(p.anaSayfaId)} style={S({ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minHeight: 44 })}>
                    <div style={S({ color: '#6a7563' })}>{KABUK_YAPRAK}</div>
                    <div style={S({ fontFamily: CHROME_FONT.serif, fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: CHROME_RENK.ink })}>{p.marka}</div>
                  </div>
                )}
                {p.geri && (
                  <div onClick={() => p.onGit(p.anaSayfaId)} style={S({ fontFamily: CHROME_FONT.serif, fontSize: 18, fontWeight: 500, color: CHROME_RENK.ink, cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' })}>{p.marka}</div>
                )}
              </header>

          <div>{p.children}</div>

          <div className="notya-alt" style={S({ padding: '20px 0 4px', textAlign: 'center', fontSize: 12, color: 'rgba(58,44,34,0.35)' })}>
            {p.altYazi}
          </div>
        </div>
        </>
        )}
      </div>

      {p.menuAcik && (
        <>
          <button type="button" className="notya-telefon-perde" aria-label={p.menuKapat} onClick={() => p.onMenu(false)} style={S({ position: 'fixed', inset: 0, zIndex: 32, border: 'none', background: 'rgba(58,44,34,0.32)', padding: 0 })} />
          <div className="notya-telefon-menu" role="dialog" aria-label={p.menuMetni} style={S({
            position: 'fixed', left: 12, right: 12, zIndex: 36, flexDirection: 'column',
            bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
            maxHeight: 'min(70dvh, 520px)', overflowY: 'auto',
            background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 18,
            padding: '14px 12px', boxShadow: '0 12px 32px rgba(58,44,34,0.16)',
          })}>
            {p.menu.asistan.map((i) => satir(i, true))}
            <div style={S({ display: 'flex', flexDirection: 'column', gap: 2 })}>
              {p.menu.ogeler.map((i) => satir(i))}
            </div>
            <div style={S({ borderTop: `1px solid ${CHROME_RENK.border}`, marginTop: 12, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' })}>
              {p.menuAlt}
              <button
                type="button"
                onClick={hesap.onCikis}
                style={S({ padding: '9px 15px', minHeight: 44, borderRadius: 999, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}66`, color: CHROME_RENK.warn, fontSize: 13, fontWeight: 700, cursor: 'pointer' })}
              >
                {hesap.cikis}
              </button>
            </div>
          </div>
        </>
      )}

      <div className={p.anaSayfa ? 'notya-alt-nav notya-alt-nav-akis' : 'notya-alt-nav'} role="navigation" aria-label={p.anaMenu} style={S({
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 38,
        background: CHROME_RENK.paper, borderTop: `1px solid ${CHROME_RENK.border}`,
        padding: '4px env(safe-area-inset-right, 0px) calc(4px + env(safe-area-inset-bottom, 0px)) env(safe-area-inset-left, 0px)',
        justifyContent: 'space-around', alignItems: 'stretch',
      })}>
        {p.sekme.map((item) => {
          const rozet = item.rozet ?? 0;
          const govde = (
            <>
              <span style={S({ position: 'relative', display: 'flex', width: 24, height: 22, alignItems: 'center', justifyContent: 'center' })}>
                {KABUK_IKON[item.ikon]}
                {rozet > 0 && (
                  <span style={S({
                    position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                    background: CHROME_RENK.warn, color: '#FAF8F4', fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  })}>
                    {rozet > 9 ? '9+' : rozet}
                  </span>
                )}
              </span>
              <span style={S({ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{item.label}</span>
            </>
          );
          const stil = S({
            flex: '1 1 0', minWidth: 0, minHeight: 48, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            color: item.aktif ? '#1e3336' : 'rgba(30,51,54,0.62)', fontFamily: 'inherit', fontSize: 11, fontWeight: item.aktif ? 700 : 600,
            padding: '4px 2px', ...(item.href ? { textDecoration: 'none' } : {}),
          });
          return item.href ? (
            <a key={item.id} href={item.href} aria-current={item.aktif ? 'page' : undefined} style={stil}>{govde}</a>
          ) : (
            <button key={item.id} type="button" onClick={() => p.onGit(item.id)} aria-current={item.aktif ? 'page' : undefined} style={stil}>{govde}</button>
          );
        })}
        <button
          type="button"
          onClick={() => p.onMenu(!p.menuAcik)}
          aria-expanded={p.menuAcik}
          aria-current={p.menuAktif ? 'page' : undefined}
          style={S({
            flex: '1 1 0', minWidth: 0, minHeight: 48, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            color: p.menuAktif ? '#1e3336' : 'rgba(30,51,54,0.62)', fontFamily: 'inherit', fontSize: 11, fontWeight: p.menuAktif ? 700 : 600,
            padding: '4px 2px',
          })}
        >
          <span style={S({ position: 'relative', display: 'flex', width: 24, height: 22, alignItems: 'center', justifyContent: 'center' })}>
            {MENU_IKON}
            {(p.menuRozet ?? 0) > 0 && (
              <span style={S({
                position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                background: CHROME_RENK.warn, color: '#FAF8F4', fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              })}>
                {(p.menuRozet ?? 0) > 9 ? '9+' : p.menuRozet}
              </span>
            )}
          </span>
          <span>{p.menuMetni}</span>
        </button>
      </div>
    </div>
    </>
  );
}
