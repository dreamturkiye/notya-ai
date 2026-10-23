'use client'

/**
 * YENI-DOKTOR-UX-2026-10 — İpucu baloncuğu: her ana bölümde küçük bir "?" tetikleyici ve
 * 2–4 cümlelik Türkçe brif (Kaan'ın insan-eğitimi-yerine-ipucu kararı).
 *
 * Davranış sözleşmesi:
 *  - Bölüm başına EN FAZLA BİR otomatik gösterim (ilk ziyaret; görüldü işareti anında yazılır).
 *  - Asla engellemez: dışarı tıklama, Escape, "Anladım" ve "Bir daha gösterme" ile kapanır.
 *  - Ayarlar › "İpuçlarını göster" kapalıysa tetikleyici de görünmez (IPUCU_AYAR_OLAYI dinlenir).
 *  - Dokunma hedefleri ≥ 40px; 390px genişlikte balon ekrana sığar (dar ekranda alta sabitlenir).
 *
 * Kalıcılık v1: localStorage (lib/doktor/ipucu/ipucuDurumu.ts — oradaki başlık yorumuna bakın).
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { IPUCLARI, type IpucuBolumu } from '@/lib/doktor/ipucu/ipuclari'
import {
  IPUCU_AYAR_OLAYI,
  gorulduIsaretle,
  ipuclariAcikMi,
  otomatikGosterilsinMi,
} from '@/lib/doktor/ipucu/ipucuDurumu'

export default function IpucuBaloncugu({
  bolum,
  otomatik = true,
  hizala = 'sol',
}: {
  bolum: IpucuBolumu
  /** false: yalnız "?" ile açılır (otomatik ilk gösterim yok). */
  otomatik?: boolean
  /** Balonun tetikleyiciye göre yaslandığı kenar (masaüstü). */
  hizala?: 'sol' | 'sag'
}) {
  const icerik = IPUCLARI[bolum]
  const [acik, setAcik] = useState(false)
  const [etkin, setEtkin] = useState(true)
  const kokRef = useRef<HTMLSpanElement | null>(null)
  const balonRef = useRef<HTMLDivElement | null>(null)

  // Global anahtar: ilk okumada ve Ayarlar'dan değiştirildiğinde.
  useEffect(() => {
    setEtkin(ipuclariAcikMi())
    const dinle = () => setEtkin(ipuclariAcikMi())
    window.addEventListener(IPUCU_AYAR_OLAYI, dinle)
    return () => window.removeEventListener(IPUCU_AYAR_OLAYI, dinle)
  }, [])

  // İlk ziyaret otomatik gösterimi — bölüm başına bir kez, sayfa otursun diye kısa gecikmeyle.
  useEffect(() => {
    if (!otomatik) return
    if (!otomatikGosterilsinMi(bolum)) return
    const t = window.setTimeout(() => {
      gorulduIsaretle(bolum)
      setAcik(true)
    }, 650)
    return () => window.clearTimeout(t)
  }, [bolum, otomatik])

  const kapat = useCallback(() => setAcik(false), [])

  // Balon hiçbir zaman ekranın dışına taşmasın (tetikleyici sağ kenardaysa "Anladım" görünmez kalıyordu): açılınca ölç, yatayda içeri it.
  useLayoutEffect(() => {
    const el = balonRef.current
    if (!acik || !el) return
    const yerlestir = () => {
      el.style.transform = ''
      if (window.innerWidth <= 480) return // dar ekranda CSS alta sabitliyor
      const r = el.getBoundingClientRect()
      const kenar = 12
      let dx = 0
      if (r.right > window.innerWidth - kenar) dx = window.innerWidth - kenar - r.right
      if (r.left + dx < kenar) dx = kenar - r.left
      if (dx) el.style.transform = `translateX(${Math.round(dx)}px)`
    }
    yerlestir()
    window.addEventListener('resize', yerlestir)
    return () => window.removeEventListener('resize', yerlestir)
  }, [acik])

  // Dışarı tıklama + Escape — yalnız açıkken dinle.
  useEffect(() => {
    if (!acik) return
    const tikla = (e: MouseEvent | TouchEvent) => {
      if (kokRef.current && e.target instanceof Node && !kokRef.current.contains(e.target)) kapat()
    }
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') kapat()
    }
    document.addEventListener('mousedown', tikla)
    document.addEventListener('touchstart', tikla)
    document.addEventListener('keydown', tus)
    return () => {
      document.removeEventListener('mousedown', tikla)
      document.removeEventListener('touchstart', tikla)
      document.removeEventListener('keydown', tus)
    }
  }, [acik, kapat])

  if (!icerik || !etkin) return null

  return (
    <span ref={kokRef} className="notya-ipucu" style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <style>{`
        @media (max-width: 480px) {
          .notya-ipucu-balon {
            position: fixed !important;
            left: 16px !important;
            right: 16px !important;
            top: auto !important;
            bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important;
            width: auto !important;
            max-width: none !important;
          }
        }
      `}</style>
      <button
        type="button"
        aria-label={`İpucu: ${icerik.baslik}`}
        aria-expanded={acik}
        title="İpucu"
        onClick={() => {
          gorulduIsaretle(bolum)
          setAcik((v) => !v)
        }}
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: 999,
          border: `1.5px solid ${CHROME_RENK.border}`,
          background: acik ? '#E4F3F1' : 'rgba(255,255,255,0.72)',
          color: acik ? CHROME_RENK.pine : CHROME_RENK.muted,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: CHROME_FONT.sans,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ?
      </button>

      {acik && (
        <div
          ref={balonRef}
          className="notya-ipucu-balon"
          role="dialog"
          aria-label={`${icerik.baslik} ipucu`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            ...(hizala === 'sag' ? { right: 0 } : { left: 0 }),
            zIndex: 60,
            width: 'min(320px, calc(100vw - 32px))',
            background: CHROME_RENK.paper,
            border: `1px solid ${CHROME_RENK.border}`,
            borderRadius: 16,
            boxShadow: '0 16px 36px rgba(58,44,34,0.16)',
            padding: '14px 16px 12px',
            fontFamily: CHROME_FONT.sans,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: CHROME_FONT.serif, fontSize: 16, fontWeight: 600, color: CHROME_RENK.ink, flex: 1 }}>
              {icerik.baslik}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: CHROME_RENK.pine, background: '#E4F3F1', borderRadius: 999, padding: '3px 8px' }}>
              İPUCU
            </span>
          </div>
          {icerik.satirlar.map((s, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0', fontSize: 13.5, lineHeight: 1.5, color: CHROME_RENK.ink }}>
              {s}
            </p>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={kapat}
              style={{
                border: 'none',
                background: CHROME_RENK.pine,
                color: '#FAF8F4',
                borderRadius: 999,
                padding: '0 16px',
                minHeight: 40,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: CHROME_FONT.sans,
              }}
            >
              Anladım
            </button>
            <button
              type="button"
              onClick={() => {
                gorulduIsaretle(bolum)
                kapat()
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: CHROME_RENK.muted,
                minHeight: 40,
                padding: '0 6px',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: CHROME_FONT.sans,
              }}
            >
              Bir daha gösterme
            </button>
          </div>
        </div>
      )}
    </span>
  )
}
