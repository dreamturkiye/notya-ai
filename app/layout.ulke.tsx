/**
 * NOTYA-ULKE-01 — ROOT LAYOUT of a country that is not the pre-split application.
 *
 * Why this file has a second extension. next.config.mjs sets `pageExtensions` per build:
 *   - the pre-split application (Türkiye today): the usual tsx / ts — its routes are every file named as always
 *     (layout.tsx, page.tsx, route.ts, middleware.ts). Files named *.ulke.* are not routes there and do not exist for it.
 *   - any other country: ulke.tsx / ulke.ts ONLY — its routes are the *.ulke.* files and nothing else (one exception
 *     forced by the framework: the root not-found page is app/not-found.mjs — that file says why). The thousands of
 *     Turkish route files are not compiled into that build at all; this layout replaces app/layout.tsx, which stays
 *     untouched (Turkish title, lang="tr", the assistant session and panel, the app manifest, the service worker).
 * So a route exists outside Türkiye only when somebody creates a *.ulke.* file for it AND the country's pack lists
 * its path (middleware.ulke.ts). Two deliberate steps; nothing arrives by accident.
 *
 * Document language, title, description, search-engine instruction and background all come from the active pack.
 */
import React from 'react'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { ulkeKabukMetadata, ulkeKabukViewport } from '@/lib/ulke/kabuk'

export const metadata: Metadata = ulkeKabukMetadata()
export const viewport: Viewport = ulkeKabukViewport()

export default function UlkeKokDuzeni({ children }: { children: ReactNode }) {
  const p = ulkePaketi()
  return (
    <html lang={p.varsayilanDil}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ margin: 0, background: p.kabuk.zemin }}>{children}</body>
    </html>
  )
}
