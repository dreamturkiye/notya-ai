'use client'

/**
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25) — the doctor's identity on every patient portal surface: header lockup, PIN /
 * loading / error screens, and the settings preview (the SAME components, so the preview cannot drift from what the
 * patient sees). Mark = logo → photo → monogram (lib/portal/marka.ts). "Sağlığım" is the quieter section name; Notya
 * appears only as <NotyaAltyapi/>. Presentational: no fetch, no word decided here except through props / marka.ts.
 * Layout reacts to its own width (container queries in hekimMarkasi.css), so a phone frame in the preview looks like a
 * phone. Needs hekimMarkasi.css (imported by app/portal/layout.tsx and the settings page — not here, so the node test
 * renderer can load this file).
 */
import { useState, type CSSProperties, type ReactNode } from 'react'
import { BOLUM_ADI, NOTYA_ALTYAPI, VURGU_SECENEKLERI, type PortalMarka } from '@/lib/portal/marka'

function vurguStili(marka: PortalMarka): CSSProperties {
  const v = VURGU_SECENEKLERI[marka.vurgu] || VURGU_SECENEKLERI.petrol
  return { ['--hm-vurgu' as string]: v.koyu, ['--hm-vurgu-acik' as string]: v.acik } as CSSProperties
}

/** The mark. A logo that fails to load falls back to the monogram (never a broken image). */
export function MarkaIsareti({ marka, boyut = 44, className = '' }: { marka: PortalMarka; boyut?: number; className?: string }) {
  const [bozuk, setBozuk] = useState<string | null>(null)
  const g = marka.gorsel && marka.gorsel.url !== bozuk ? marka.gorsel : null
  const stil = { ...vurguStili(marka), ['--hm-boyut' as string]: `${boyut}px` } as CSSProperties
  if (g?.tur === 'logo') {
    return (
      <span className={`hm-isaret hm-isaret--logo ${className}`} style={stil} data-marka-isaret="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.url} alt="" referrerPolicy="no-referrer" decoding="async" onError={() => setBozuk(g.url)} />
      </span>
    )
  }
  if (g?.tur === 'foto') {
    return (
      <span className={`hm-isaret hm-isaret--foto ${className}`} style={stil} data-marka-isaret="foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.url} alt="" referrerPolicy="no-referrer" decoding="async" onError={() => setBozuk(g.url)} />
      </span>
    )
  }
  return (
    <span className={`hm-isaret hm-isaret--monogram ${className}`} style={stil} data-marka-isaret="monogram" aria-hidden>
      <span className="hm-monogram">{marka.monogram}</span>
    </span>
  )
}

/** Header lockup: mark · name (dominant) · "Sağlığım — branş · clinic" (quiet). `sag` = right side (patient name). */
export function MarkaBasligi({ marka, sag }: { marka: PortalMarka; sag?: ReactNode }) {
  return (
    <div className="hm-baslik-kap" style={vurguStili(marka)} data-testid="portal-hekim-marka">
    <div className="hm-baslik">
      <MarkaIsareti marka={marka} boyut={44} className="hm-baslik-isaret" />
      <span className="hm-baslik-metin">
        <span className="hm-ad">{marka.ad}</span>
        <span className="hm-alt">
          <span className="hm-bolum">{BOLUM_ADI}</span>
          {marka.altSatir ? <span className="hm-alt-detay">{marka.altSatir}</span> : null}
        </span>
      </span>
      {sag ? <span className="hm-baslik-sag">{sag}</span> : null}
    </div>
    </div>
  )
}

/** Centered doctor block for the PIN / loading / link-error screens. */
export function MarkaKarsilama({ marka, children }: { marka: PortalMarka; children?: ReactNode }) {
  return (
    <div className="hm-karsilama" style={vurguStili(marka)} data-testid="portal-hekim-karsilama">
      <MarkaIsareti marka={marka} boyut={84} />
      <p className="hm-karsilama-ad">{marka.ad}</p>
      {marka.altSatir ? <p className="hm-karsilama-alt">{marka.altSatir}</p> : null}
      <p className="hm-karsilama-bolum"><span aria-hidden className="hm-cizgi" />{BOLUM_ADI}<span aria-hidden className="hm-cizgi" /></p>
      {children}
    </div>
  )
}

/** The only Notya mark on a patient surface: small, at the very end. */
export function NotyaAltyapi({ className = '' }: { className?: string }) {
  return <p className={`hm-altyapi ${className}`} data-testid="notya-altyapi">{NOTYA_ALTYAPI}</p>
}
