'use client'

/**
 * NOTYA-ACCOUNTING-01 — entry card on the main Entegrasyonlar page, same visual pattern as
 * RandevuPortalKarti/GoogleTakvimKarti: a status line + link into the module's own page rather
 * than a slide-up sheet, since Faturalama & Tahsilat is big enough to need its own screen.
 */
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

const CARD = '#FFFFFF'
const BORDER = CHROME_RENK.border
const INK = CHROME_RENK.ink
const MUTED = CHROME_RENK.muted
const GREEN = '#3F7D4A'
const AMBER = '#B4832F'

export default function FaturalamaKarti() {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    const token = getDoctorAccessToken()
    if (!token) return
    fetch('/api/accounting/module', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setEnabled(!!d?.data?.enabled))
      .catch(() => setEnabled(null))
  }, [])

  return (
    <Link
      href="/dashboard/doktor/entegrasyonlar/faturalama"
      style={{
        display: 'block',
        textAlign: 'left',
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: '18px 20px',
        color: INK,
        textDecoration: 'none',
        boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
        marginTop: 12,
        fontFamily: CHROME_FONT.sans,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Faturalama &amp; Tahsilat</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            Hizmet kataloğu, e-SMM/e-Fatura, banka sanal POS ve alacak takibi — isteğe bağlı modül
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: enabled ? GREEN : AMBER, whiteSpace: 'nowrap' }}>
          {enabled === null ? 'Kurulum' : enabled ? 'Açık' : 'Kapalı'}
        </div>
      </div>
    </Link>
  )
}
