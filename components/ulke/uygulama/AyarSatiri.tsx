'use client'

/**
 * One row of the settings list, drawn like the Türkiye settings rows (emoji, bold name, chevron) and opening in place
 * to the form it holds. The same row look as the link rows beside it, so the page reads as one list.
 */
import React from 'react'

export function AyarSatiri({ emoji, ad, alt, alan, children }: { emoji: string; ad: string; alt?: string; alan: string; children: React.ReactNode }) {
  return (
    <details className="yg-satir yg-acilir" data-alan={alan}>
      <summary className="yg-acilir-baslik">
        <span className="yg-satir-emoji" aria-hidden="true">{emoji}</span>
        <span className="yg-satir-metin">
          <span className="yg-satir-ad">{ad}</span>
          {alt ? <span className="yg-satir-alt">{alt}</span> : null}
        </span>
        <span className="yg-satir-ok" aria-hidden="true">{'\u203A'}</span>
      </summary>
      <div className="yg-acilir-govde">{children}</div>
    </details>
  )
}
