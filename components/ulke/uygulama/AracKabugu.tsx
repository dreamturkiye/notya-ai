'use client'

/**
 * NOTYA-ULKE-ARAC-KABUGU-01 — the country tool page in Türkiye's tool shell (Kaan, 2026-10-23: "one look in every
 * country"). Same tokens and style objects as app/doktor-tools/* (lib/doktor/toolsUi, lib/doktor/aracUi): the serif
 * "Tools · <role>" kicker, serif title, description, white 16px cards with the same shadow, the accent-coloured card
 * labels and primary button, a form column on the left and a LIVE result panel beside it (stacked under 900 px).
 *
 * NO WORD IS WRITTEN HERE: every string arrives as a prop from the active country pack. This file only draws.
 */
import React from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeRenk'
import { toolsShell, toolsCard } from '@/lib/doktor/toolsUi'
import { AracVurguSaglayici, aracStil, type AracVurgu } from '@/lib/doktor/aracUi'

/** The accent of the shared tool shell (Türkiye's anaesthesia/neuro/BC studios use this same violet). */
export const ULKE_ARAC_VURGU: AracVurgu = { ana: '#8B5CF6', anaMetin: '#F5F3FF', yumusak: '#6D28D9', baslik: '#6D28D9' }
export const ulkeAracStil = aracStil(ULKE_ARAC_VURGU)

const CSS = `
.uza-ak { --ak-ana: ${ULKE_ARAC_VURGU.ana}; --ak-baslik: ${ULKE_ARAC_VURGU.baslik}; overflow-x: hidden; }
.uza-ak, .uza-ak * { min-width: 0; }
.uza-ak .uza-kart { background: #fff; border: 1px solid ${CHROME_RENK.border}; border-radius: 16px; padding: 18px; margin-bottom: 14px; box-shadow: 0 8px 18px rgba(58,44,34,0.045); }
.uza-ak .uza-h2 { font-family: ${CHROME_FONT.sans}; font-size: 13px; font-weight: 700; color: var(--ak-baslik); margin: 0 0 10px; letter-spacing: 0; }
.uza-ak .uza-etiket { color: ${CHROME_RENK.ink}; font-size: 13px; font-weight: 600; }
.uza-ak .uza-girdi { border: 1.5px solid ${CHROME_RENK.border}; border-radius: 12px; font-size: 16px; min-height: 44px; }
.uza-ak .uza-girdi:focus { outline: none; border-color: var(--ak-ana); }
.uza-ak .uza-secenek { min-height: 44px; border-radius: 12px; font-size: 14px; font-weight: 700; color: ${CHROME_RENK.ink}; border: 1px solid rgba(58,44,34,0.12); }
.uza-ak .uza-secenek[data-secili='evet'] { border-color: var(--ak-ana); background: rgba(139,92,246,0.10); color: var(--ak-baslik); }
.uza-ak .uza-secenek:focus-within { outline: 2px solid var(--ak-ana); }
.uza-ak .uza-onay input { accent-color: var(--ak-ana); }
.uza-ak .uza-dugme { background: var(--ak-ana); border-color: var(--ak-ana); color: ${ULKE_ARAC_VURGU.anaMetin}; border-radius: 12px; font-weight: 700; font-size: 14px; }
.uza-ak .uza-dugme-cizgi { background: transparent; border: 1.5px solid ${CHROME_RENK.border}; color: ${CHROME_RENK.ink}; font-weight: 600; }
.uza-ak .uza-ipucu { font-size: 12px; color: ${CHROME_RENK.muted}; line-height: 1.45; }
.uza-ak .uza-bilgiler dt { font-size: 12.5px; font-weight: 600; color: ${CHROME_RENK.ink}; }
.uza-ak-kolonlar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.uza-ak-sonuc { position: sticky; top: 16px; }
.uza-ak-sayilar { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 10px; }
@media (max-width: 899px) { .uza-ak-kolonlar { grid-template-columns: 1fr; } .uza-ak-sonuc { position: static; } .uza-ak { padding-bottom: 96px !important; } }
`

export function AracKabugu({ kicker, geriHref, geriEtiket, baslik, aciklama, ustEk, children }: {
  /** "Tools · Paediatrics": the pack's words. The part before the dot links back to the tools grid. */
  kicker: string; geriHref: string; geriEtiket: string
  baslik: string; aciklama: string
  /** Under the description (the patient the tool was opened for). */
  ustEk?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <AracVurguSaglayici vurgu={ULKE_ARAC_VURGU}>
      <style>{CSS}</style>
      <div className="uza-ak" data-arac-kabugu style={{ ...toolsShell, maxWidth: 1000, margin: '0 auto', padding: '8px 0 40px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>
            <a href={geriHref} data-eylem="araclara-don" aria-label={geriEtiket} style={{ color: 'inherit', textDecoration: 'none' }}>{kicker}</a>
          </div>
          <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, color: '#2e251d', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{baslik}</h1>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: CHROME_RENK.muted, lineHeight: 1.5, maxWidth: 680 }}>{aciklama}</p>
          {ustEk}
        </div>
        {children}
      </div>
    </AracVurguSaglayici>
  )
}

/** Form on the left, the live result panel beside it; stacked under 900 px (form first, result right under it). */
export function AracIkiKolon({ form, sonuc }: { form: React.ReactNode; sonuc: React.ReactNode }) {
  return (
    <div className="uza-ak-kolonlar">
      <div>{form}</div>
      <div className="uza-ak-sonuc">{sonuc}</div>
    </div>
  )
}

/** A big-number tile of the result strip: the shared tool look (cream tile, ink label). */
export function SonucSayisi({ deger, etiket, anahtar }: { deger: React.ReactNode; etiket: string; anahtar: string }) {
  return (
    <div style={{ background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '12px 14px', flex: '1 1 120px', minWidth: 0 }}>
      <div data-sayi={anahtar} style={{ fontSize: 24, fontWeight: 800, color: CHROME_RENK.ink, letterSpacing: '-0.5px', lineHeight: 1.15, overflowWrap: 'anywhere' }}>{deger}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: CHROME_RENK.ink, marginTop: 3, lineHeight: 1.35 }}>{etiket}</div>
    </div>
  )
}

export { toolsCard }
