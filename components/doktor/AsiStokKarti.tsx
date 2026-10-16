'use client'

/**
 * NOTYA-ASI-STOK-BARKOD-01 — Entegrasyonlar sayfasındaki giriş kartı (FaturalamaKarti ile aynı
 * görsel kalıp: durum satırı + kendi sayfasına link).
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

export default function AsiStokKarti() {
  const [etkinAktif, setEtkinAktif] = useState<boolean | null>(null)

  useEffect(() => {
    const token = getDoctorAccessToken()
    if (!token) return
    fetch('/api/doktor/asi-stok/modul', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setEtkinAktif(!!d?.etkinAktif))
      .catch(() => setEtkinAktif(null))
  }, [])

  return (
    <Link
      href="/dashboard/doktor/entegrasyonlar/asi-stok"
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
          <div style={{ fontSize: 17, fontWeight: 600 }}>Aşı Stok ve Barkod Sistemi</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            Lot takibi, muayenede barkod tarama, tek dokunuşla stok düşümü ve kayıt — isteğe bağlı modül
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: etkinAktif ? GREEN : AMBER, whiteSpace: 'nowrap' }}>
          {etkinAktif === null ? 'Kurulum' : etkinAktif ? 'Açık' : 'Kapalı'}
        </div>
      </div>
    </Link>
  )
}
