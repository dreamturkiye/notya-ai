'use client'

/**
 * YENI-DOKTOR-UX-2026-10 — Ana Sayfa'daki ilk-adımlar kartı (yalnız yeni doktor hesapları).
 *
 * Her satır doğrudan ilgili ekrana götürür; tamamlanan satır ✓ ile kalır. Kart "Gizle" ile
 * kapatılabilir (localStorage, cihaz başına) ve tüm adımlar tamamlanınca kendiliğinden
 * kaybolur. Veri tek istekle /api/doktor/ilk-adimlar'dan gelir; istek başarısızsa kart hiç
 * görünmez — hiçbir akışı engellemez.
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import {
  ILK_ADIM_GIZLE_ANAHTAR,
  ILK_ADIM_SATIRLARI,
  kartGorunurMu,
  type IlkAdimlar,
} from '@/lib/doktor/ilkAdimlar'

export default function IlkAdimlarKarti() {
  const router = useRouter()
  const [adimlar, setAdimlar] = useState<IlkAdimlar | null>(null)
  const [yeniHesap, setYeniHesap] = useState(false)
  const [gizlendi, setGizlendi] = useState(true) // SSR/ilk boyamada gizli — hidrasyon uyumsuzluğu olmaz

  useEffect(() => {
    try {
      setGizlendi(localStorage.getItem(ILK_ADIM_GIZLE_ANAHTAR) === '1')
    } catch {
      setGizlendi(false)
    }
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) return
        const r = await fetch('/api/doktor/ilk-adimlar', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json()
        if (iptal || !d?.adimlar) return
        setAdimlar(d.adimlar as IlkAdimlar)
        setYeniHesap(d.yeniHesap === true)
      } catch {
        /* kart görünmez kalır */
      }
    })()
    return () => {
      iptal = true
    }
  }, [])

  function gizle() {
    setGizlendi(true)
    try {
      localStorage.setItem(ILK_ADIM_GIZLE_ANAHTAR, '1')
    } catch {
      /* oturum boyunca state yeter */
    }
  }

  if (!kartGorunurMu(yeniHesap, adimlar, gizlendi)) return null
  const tamamSayisi = ILK_ADIM_SATIRLARI.filter((s) => adimlar![s.anahtar]).length

  return (
    <div
      style={{
        background: CHROME_RENK.paper,
        border: `1px solid ${CHROME_RENK.border}`,
        borderRadius: 20,
        boxShadow: '0 16px 34px rgba(58,44,34,0.06)',
        padding: '18px 20px 10px',
        fontFamily: CHROME_FONT.sans,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 19, fontWeight: 600, color: '#2e251d', flex: 1, minWidth: 180 }}>
          Notya’ya hoş geldiniz — kurulumunuz
        </div>
        <span style={{ fontSize: 12.5, color: CHROME_RENK.muted, fontVariantNumeric: 'tabular-nums' }}>
          {tamamSayisi}/{ILK_ADIM_SATIRLARI.length} tamam
        </span>
        <button
          type="button"
          onClick={gizle}
          aria-label="Kurulum kartını gizle"
          style={{ border: 'none', background: 'transparent', color: CHROME_RENK.muted, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', minHeight: 40, padding: '0 6px' }}
        >
          Gizle
        </button>
      </div>
      <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 8 }}>
        Birkaç adımda muayenehaneniz hazır. Her satır sizi doğrudan ilgili yere götürür.
      </div>
      <div>
        {ILK_ADIM_SATIRLARI.map((s, i) => {
          const tamam = adimlar![s.anahtar]
          return (
            <button
              key={s.anahtar}
              type="button"
              onClick={() => router.push(s.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                minHeight: 48,
                padding: '8px 6px',
                border: 'none',
                borderBottom: i < ILK_ADIM_SATIRLARI.length - 1 ? `1px solid ${CHROME_RENK.border}` : 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: CHROME_FONT.sans,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  background: tamam ? '#E4F3F1' : '#FFFFFF',
                  border: tamam ? `1.5px solid ${CHROME_RENK.pine}` : `1.5px solid ${CHROME_RENK.border}`,
                  color: tamam ? CHROME_RENK.pine : CHROME_RENK.muted,
                }}
              >
                {tamam ? '✓' : ''}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14.5,
                    fontWeight: 650,
                    color: tamam ? CHROME_RENK.muted : CHROME_RENK.ink,
                    textDecoration: tamam ? 'line-through' : 'none',
                    textDecorationColor: 'rgba(139,125,112,0.5)',
                  }}
                >
                  {s.etiket}
                </span>
                {!tamam && (
                  <span style={{ display: 'block', fontSize: 12, color: CHROME_RENK.muted, marginTop: 1 }}>{s.aciklama}</span>
                )}
              </span>
              {!tamam && <span style={{ color: CHROME_RENK.pine, fontSize: 15, fontWeight: 700, flexShrink: 0 }}>›</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
