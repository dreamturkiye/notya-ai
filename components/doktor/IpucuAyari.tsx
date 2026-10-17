'use client'

/**
 * YENI-DOKTOR-UX-2026-10 — Ayarlar › "İpuçlarını göster" anahtarı.
 * Varsayılan AÇIK (Kaan: kullanım-temelli sezgisel kapatma gelene kadar herkes görür).
 * Değer localStorage'tadır (v1 — ipucuDurumu.ts başlığındaki gerekçe); değişiklik aynı
 * sayfadaki balonlara IPUCU_AYAR_OLAYI ile duyurulur.
 */

import React, { useEffect, useState } from 'react'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { IPUCU_AYAR_OLAYI, ipuclariAcikMi, ipuclariAyarla } from '@/lib/doktor/ipucu/ipucuDurumu'

export default function IpucuAyari() {
  const [acik, setAcik] = useState(true)
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    setAcik(ipuclariAcikMi())
    setHazir(true)
  }, [])

  function degistir(yeni: boolean) {
    setAcik(yeni)
    ipuclariAyarla(yeni)
    try {
      window.dispatchEvent(new Event(IPUCU_AYAR_OLAYI))
    } catch {
      /* olay gönderilemedi — bir sonraki sayfada okunur */
    }
  }

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: '#FFFFFF',
        border: `1px solid ${CHROME_RENK.border}`,
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
        cursor: 'pointer',
        minHeight: 40,
      }}
    >
      <span style={{ fontSize: 22 }} aria-hidden>
        💡
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: CHROME_RENK.ink }}>İpuçlarını göster</span>
        <span style={{ display: 'block', fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>
          Her bölümdeki “?” balonları ve ilk ziyarette kısa tanıtımlar
        </span>
      </span>
      <input
        type="checkbox"
        checked={hazir ? acik : true}
        onChange={(e) => degistir(e.target.checked)}
        aria-label="İpuçlarını göster"
        style={{ width: 22, height: 22, accentColor: CHROME_RENK.pine, cursor: 'pointer' }}
      />
    </label>
  )
}
