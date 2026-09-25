'use client'
/**
 * NOTYA-ILETISIM-01 → 04 — the two "automatic sending" rows on Ayarlar › İletişim.
 *
 *   • EpostaBaglan   (NOTYA-ILETISIM-02): Gmail ile bağlan / Outlook ile bağlan — reminders leave from the doctor's
 *                    own address
 *   • WhatsAppBaglan (NOTYA-ILETISIM-03): WhatsApp'ı bağla — reminders leave from the doctor's own number
 *
 * Each stays a calm "Yakında" line until its env vars exist (its API answers 503). Once connected, the dispatcher
 * (lib/iletisim/otomatikGonderim.ts) sends the non-clinical queue items by itself; without a connection the
 * one-tap flow is unchanged. Contract: lib/iletisim/README.md.
 */
import React from 'react'
import EpostaBaglan from './EpostaBaglan'
import WhatsAppBaglan from './WhatsAppBaglan'

export default function OtomatikSlotlari() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <WhatsAppBaglan />
      <EpostaBaglan />
    </div>
  )
}
