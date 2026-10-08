/**
 * NOTYA-ULKE-01 — not-found and error pages of a country that is not the pre-split application. Text from the
 * country's pack (surface `sistem`), in the country's default language: these pages have no request to read a
 * language from. No hooks: the server not-found page and the client error pages both use it.
 */
import React from 'react'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { yuzeyMetinleri } from '@/lib/ulke/metin'
import { ulkeYolu } from '@/lib/ulke/yol'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { ULKE_STIL as S, UlkeKart } from './UlkeKart'

const baslik = { margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 560, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', lineHeight: 1.2, color: R.ink } as const
const govde = { margin: '14px 0 0', fontSize: 15, lineHeight: 1.6, color: R.muted } as const

export function UlkeBulunamadi() {
  const dil = ulkePaketi().varsayilanDil
  const m = yuzeyMetinleri('sistem', dil)
  return (
    <UlkeKart dil={dil}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={baslik}>{m.bulunamadiBaslik}</h1>
        <p style={govde}>{m.bulunamadiGovde}</p>
        <div style={{ marginTop: 24 }}>
          <a href={ulkeYolu('/')} style={S.cizgiDugme}>{m.anaSayfa}</a>
        </div>
      </div>
    </UlkeKart>
  )
}

/** The browser's own error text is never shown: it is English, and it is not for the visitor. */
export function UlkeHata({ tekrar }: { tekrar: () => void }) {
  const dil = ulkePaketi().varsayilanDil
  const m = yuzeyMetinleri('sistem', dil)
  return (
    <UlkeKart dil={dil}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={baslik}>{m.hataBaslik}</h1>
        <p style={govde}>{m.hataGovde}</p>
        <div style={{ marginTop: 24 }}>
          <button type="button" onClick={tekrar} style={S.cizgiDugme}>{m.tekrarDene}</button>
        </div>
      </div>
    </UlkeKart>
  )
}
