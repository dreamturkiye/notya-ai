'use client'
/**
 * AU-PORTRE-01 — the ONE persona portrait renderer, shared by Türkiye (app/asistan/page.tsx) and the country kit
 * (components/ulke/uygulama/AsistanSayfasi.tsx, Asistan.tsx). Fills its parent (which supplies the circle, border and
 * size). A missing `src`, or a file that fails to load, falls back to the persona's initials — never a broken image.
 */
import React, { useState } from 'react'

export default function PersonaFoto({ src, ad, harf, imgStyle }: { src?: string | null; ad: string; harf: string; imgStyle?: React.CSSProperties }) {
  const [bozuk, setBozuk] = useState<string | null>(null)
  if (!src || bozuk === src) return <>{harf}</>
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={ad} width={256} height={256} loading="lazy" decoding="async" onError={() => setBozuk(src)}
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', borderRadius: '50%', display: 'block', ...imgStyle }} />
  )
}
