'use client'

import type { CSSProperties } from 'react'

/**
 * KURAL — TÜRKÇE: tarayıcının kendi <input type="file"> kontrolü İngilizce yazar ("Choose File / No file chosen").
 * Bu düğme girdiyi gizler; Türkçe etiket ve seçilen dosyanın adını gösterir (desen: components/doktor/HastaGoruntuler.tsx).
 */
export function DosyaSecDugmesi({
  dosya,
  onSec,
  accept,
  etiket = 'Dosya seç',
  capture,
  disabled,
  style,
}: {
  dosya: File | null
  onSec: (dosya: File | null) => void
  accept?: string
  etiket?: string
  capture?: 'user' | 'environment'
  disabled?: boolean
  style?: CSSProperties
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        maxWidth: 260,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        padding: '7px 12px',
        borderRadius: 8,
        border: '1px solid rgba(127,127,127,0.35)',
        fontSize: 13,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      title={dosya ? dosya.name : etiket}
    >
      <input
        type="file"
        accept={accept}
        capture={capture}
        disabled={disabled}
        onChange={(e) => onSec(e.target.files?.[0] || null)}
        style={{ display: 'none' }}
      />
      <span aria-hidden>📎</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{dosya ? dosya.name : etiket}</span>
    </label>
  )
}
