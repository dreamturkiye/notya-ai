'use client'
/**
 * NOTYA-ILETISIM-01 — the two "automatic sending" rows on Ayarlar › İletişim.
 *
 * Today both are a calm "Yakında". Jobs B (Gmail / Outlook bağlantısı, NOTYA-ILETISIM-02) and C
 * (WhatsApp Business bağlantısı, NOTYA-ILETISIM-03) replace ONLY this file — the card around it,
 * the send button and the queue stay as they are. Contract: lib/iletisim/README.md.
 */
import React from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'

const SATIRLAR = [
  {
    baslik: 'Gmail / Outlook bağlantısı',
    aciklama: 'Hatırlatmalar sizin e-posta adresinizden kendiliğinden gitsin.',
  },
  {
    baslik: 'WhatsApp Business bağlantısı',
    aciklama: 'Randevu hatırlatmaları sizin WhatsApp numaranızdan kendiliğinden gitsin.',
  },
]

export default function OtomatikSlotlari() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: CHROME_FONT.sans }}>
      {SATIRLAR.map((s) => (
        <div
          key={s.baslik}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '12px 14px', borderRadius: 12, background: CHROME_RENK.cream, border: `1px solid ${CHROME_RENK.borderSoft}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink }}>{s.baslik}</div>
            <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 2 }}>{s.aciklama}</div>
          </div>
          <span style={{ fontSize: 13, color: CHROME_RENK.muted, fontStyle: 'italic', fontFamily: CHROME_FONT.serif, flexShrink: 0 }}>Yakında</span>
        </div>
      ))}
    </div>
  )
}
