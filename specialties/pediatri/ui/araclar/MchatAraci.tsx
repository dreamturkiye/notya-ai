'use client'
/**
 * PEDI-MCHAT-EXCEPTIONAL-01 — Araçlar › M-CHAT-R/F (ayrı stüdyo).
 * Gelişim & Tarama içinde gömülü kalır; burada tek dokunuşla aynı HastaMchat bileşeni açılır.
 */
import React, { useState } from 'react'
import HastaMchat from '@/components/doktor/HastaMchat'
import { PediHastaSecici, useUrlHasta, pediStil } from './PediAracKabugu'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

const { kutu, kucuk } = pediStil

export default function MchatAraci() {
  const [hastaId, setHastaId] = useState('')
  useUrlHasta(setHastaId)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={kutu}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 8 }}>Hasta</div>
        <PediHastaSecici
          secili={hastaId}
          sec={(id) => setHastaId(id)}
        />
        <p style={{ ...kucuk, margin: '8px 0 0' }}>
          16–30 ay arası otizm tarama (M-CHAT-R/F). 20 soruyu aileyle doldurun; sonuç kayda geçer, isterseniz bugünkü muayene formuna eklenir.
        </p>
      </div>
      {hastaId ? (
        <HastaMchat patientId={hastaId} />
      ) : (
        <div style={{ ...kutu, color: CHROME_RENK.muted, fontSize: 14 }}>
          M-CHAT-R/F uygulamak için önce hasta seçin.
        </div>
      )}
    </div>
  )
}
