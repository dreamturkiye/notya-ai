'use client'
/**
 * KONSULTASYONLAR-01 — Araçlar › Konsültasyonlar.
 * Üst sekme değil: Defter · İstem · Bekleyen alt sekmeleri. Görünüm: chromeTheme cream/pine.
 */
import React, { useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import BekleyenKonsultasyonlar from '@/components/doktor/araclar/BekleyenKonsultasyonlar'
import KonsultasyonDefter from '@/components/doktor/araclar/KonsultasyonDefter'
import KonsultasyonIstemSekmesi from '@/components/doktor/araclar/KonsultasyonIstemSekmesi'

type Sekme = 'defter' | 'istem' | 'bekleyen'

const SEKMELER: { id: Sekme; etiket: string }[] = [
  { id: 'defter', etiket: 'Defter' },
  { id: 'istem', etiket: 'İstem' },
  { id: 'bekleyen', etiket: 'Bekleyen' },
]

export default function Konsultasyonlar() {
  const [sekme, setSekme] = useState<Sekme>('bekleyen')

  return (
    <div style={{ minWidth: 0 }} data-konsultasyonlar="">
      <div
        role="tablist"
        aria-label="Konsültasyonlar sekmeleri"
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          marginBottom: 18,
          borderBottom: `1px solid ${CHROME_RENK.border}`,
          paddingBottom: 2,
        }}
      >
        {SEKMELER.map((s) => {
          const aktif = sekme === s.id
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={aktif}
              onClick={() => setSekme(s.id)}
              style={{
                fontFamily: CHROME_FONT.sans,
                fontSize: 15,
                fontWeight: aktif ? 600 : 500,
                color: aktif ? CHROME_RENK.pine : CHROME_RENK.muted,
                background: 'transparent',
                border: 'none',
                borderBottom: aktif ? `2px solid ${CHROME_RENK.pine}` : '2px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                marginBottom: -2,
              }}
            >
              {s.etiket}
            </button>
          )
        })}
      </div>

      {sekme === 'defter' && <KonsultasyonDefter />}
      {sekme === 'istem' && <KonsultasyonIstemSekmesi />}
      {sekme === 'bekleyen' && <BekleyenKonsultasyonlar />}
    </div>
  )
}
