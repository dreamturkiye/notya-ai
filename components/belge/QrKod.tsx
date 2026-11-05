/**
 * BELGE-NO-01 / REFERANS-01 — a QR code drawn as one SVG path (lib/belge/qr.ts). No words: every build passes its own
 * `etiket` (the accessible name). The same file on main and on every release branch; it renders identically everywhere.
 */
import React from 'react'
import { qrSvgYolu } from '@/lib/belge/qr'

export default function QrKod({ metin, boyut = 96, etiket }: { metin: string; boyut?: number; etiket: string }) {
  let yol: { kenar: number; d: string } | null = null
  try { yol = qrSvgYolu(metin) } catch { yol = null }
  if (!yol) return null
  return (
    <svg role="img" aria-label={etiket} width={boyut} height={boyut} viewBox={`0 0 ${yol.kenar} ${yol.kenar}`} shapeRendering="crispEdges" style={{ display: 'block', background: '#fff' }}>
      <path d={yol.d} fill="#000" />
    </svg>
  )
}
