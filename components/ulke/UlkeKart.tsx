/**
 * NOTYA-ULKE-01 — the one-card page used by the core country screens (login, sign-up, holding page, not-found,
 * error): cream background, paper card, the word mark. Same look as the doctor login (NOTYA-GIRIS-GORUNUM-01), from
 * the same tokens. Holds NO text of its own: every sentence comes from the country's pack through the caller.
 * No hooks, so server and client components can both use it.
 */
import React from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import type { DilKodu } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'

export const ULKE_STIL = {
  etiket: { fontSize: 13, color: R.muted, marginBottom: 6, display: 'block', fontWeight: 600, letterSpacing: 0.2 } as CSSProperties,
  girdi: { width: '100%', background: R.paper, border: `1px solid ${R.border}`, borderRadius: 12, padding: '12px 14px', color: R.ink, fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: CHROME_FONT.sans } as CSSProperties,
  dugme: { padding: 14, background: R.pine, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: CHROME_FONT.sans, letterSpacing: 0.2, width: '100%' } as CSSProperties,
  cizgiDugme: { display: 'inline-block', padding: '11px 22px', background: 'transparent', border: `1px solid ${R.pine}`, borderRadius: 12, color: R.pine, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: CHROME_FONT.sans, textDecoration: 'none' } as CSSProperties,
  hata: { background: 'rgba(164,91,62,0.08)', border: '1px solid rgba(164,91,62,0.25)', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: R.warn, lineHeight: 1.45 } as CSSProperties,
  bilgi: { background: 'rgba(47,67,52,0.08)', border: '1px solid rgba(47,67,52,0.28)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: R.pine, lineHeight: 1.5 } as CSSProperties,
  baglanti: { color: R.pine, fontWeight: 600, textDecoration: 'none' } as CSSProperties,
  alt: { marginTop: 22, paddingTop: 16, borderTop: `1px solid ${R.borderSoft}`, fontSize: 13.5, color: R.muted, textAlign: 'center', lineHeight: 1.9 } as CSSProperties,
} as const

export type DilSecenegi = { kod: DilKodu; ad: string; href: string }

export function UlkeKart({
  dil,
  altBaslik,
  diller,
  anaSayfa,
  children,
}: {
  dil: DilKodu
  /** Italic line under the word mark. */
  altBaslik?: string
  /** Language switch; omitted when there is nothing to switch to. */
  diller?: readonly DilSecenegi[]
  /** Link back to the landing page. */
  anaSayfa?: { href: string; ad: string }
  children: ReactNode
}) {
  return (
    <div lang={dil} style={{ minHeight: '100dvh', background: R.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))', fontFamily: CHROME_FONT.sans, color: R.ink, boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ background: R.paper, borderRadius: 24, padding: 'clamp(26px, 6vw, 44px)', border: `1px solid ${R.border}`, boxSizing: 'border-box', boxShadow: '0 18px 50px rgba(58,44,34,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <a href={anaSayfa?.href ?? ulkeYolu('/')} style={{ fontFamily: CHROME_FONT.serif, fontSize: 34, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1, textDecoration: 'none' }}>Notya</a>
            {altBaslik ? <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 16, color: R.muted, marginTop: 6 }}>{altBaslik}</div> : null}
          </div>
          {children}
        </div>
        {(diller && diller.length > 1) || anaSayfa ? (
          <nav style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: '6px 18px', justifyContent: 'center', fontSize: 13.5, color: R.muted }}>
            {anaSayfa ? <a href={anaSayfa.href} style={{ color: R.muted, textDecoration: 'none' }}>{anaSayfa.ad}</a> : null}
            {(diller && diller.length > 1 ? diller : []).map((d) => (
              <a key={d.kod} href={d.href} hrefLang={d.kod} lang={d.kod} aria-current={d.kod === dil ? 'true' : undefined} style={{ color: d.kod === dil ? R.pine : R.muted, fontWeight: d.kod === dil ? 700 : 400, textDecoration: 'none' }}>{d.ad}</a>
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  )
}
