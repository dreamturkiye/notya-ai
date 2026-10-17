'use client'

/**
 * YENI-DOKTOR-UX-2026-10 — the in-place tip of one screen: a small "?" beside the heading opens a two-to-four
 * sentence brief (what the screen is for, the one next action). The first time a screen opens, the tip opens once
 * by itself; after that only the "?" opens it.
 *
 * Every sentence is the pack's own (`m.ipuclari`); a pack that has not filled the section, or leaves this screen's
 * key out, renders nothing at all. Never blocking: outside click, Escape, "Got it" and "Don't show this again" all
 * close it; the trigger is a 40px target; on a narrow phone the brief docks above the bottom of the screen so it
 * can never overflow. Seen state and the Settings switch live in the browser, per device (no table, no migration —
 * deliberate v1, same decision as the Turkish product's lib/doktor/ipucu/ipucuDurumu.ts).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { UlkeIpucuBolumu, UygulamaMetni } from '@/lib/ulke/arayuz'

/** The Settings switch: '0' = off; missing or anything else = on (default ON). */
export const IPUCU_ACIK_ANAHTAR = 'notya_ipuclari_acik'
/** Window event the Settings switch sends so an open screen's triggers follow it at once. */
export const IPUCU_AYAR_OLAYI = 'notya-ipucu-ayar'
const GORULDU_ONEK = 'notya_ipucu_goruldu_'

function depo(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    /* private window / blocked site data */
  }
  return null
}

export function ipuclariAcikMi(): boolean {
  try {
    return depo()?.getItem(IPUCU_ACIK_ANAHTAR) !== '0'
  } catch {
    return true
  }
}

export function ipuclariAyarla(acik: boolean): void {
  try {
    depo()?.setItem(IPUCU_ACIK_ANAHTAR, acik ? '1' : '0')
  } catch {
    /* unsaved — the default applies on the next read */
  }
}

function gorulduMu(bolum: UlkeIpucuBolumu): boolean {
  try {
    return depo()?.getItem(GORULDU_ONEK + bolum) === '1'
  } catch {
    return false
  }
}

function gorulduIsaretle(bolum: UlkeIpucuBolumu): void {
  try {
    depo()?.setItem(GORULDU_ONEK + bolum, '1')
  } catch {
    /* at worst the tip opens by itself once more */
  }
}

export function Ipucu({ m, bolum }: { m: UygulamaMetni; bolum: UlkeIpucuBolumu }) {
  const sozler = m.ipuclari
  const icerik = sozler?.bolumler[bolum]
  const [acik, setAcik] = useState(false)
  const [etkin, setEtkin] = useState(true)
  const kokRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    setEtkin(ipuclariAcikMi())
    const dinle = () => setEtkin(ipuclariAcikMi())
    window.addEventListener(IPUCU_AYAR_OLAYI, dinle)
    return () => window.removeEventListener(IPUCU_AYAR_OLAYI, dinle)
  }, [])

  // First visit: open once by itself, a moment after the screen settles. The seen mark is written at once,
  // so a screen's tip opens by itself at most once, however it is closed.
  useEffect(() => {
    if (!icerik) return
    if (!ipuclariAcikMi() || gorulduMu(bolum)) return
    const t = window.setTimeout(() => {
      gorulduIsaretle(bolum)
      setAcik(true)
    }, 650)
    return () => window.clearTimeout(t)
  }, [bolum, icerik])

  const kapat = useCallback(() => setAcik(false), [])

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

  if (!sozler || !icerik || !etkin) return null

  return (
    <span ref={kokRef} className="uza-ipucu-kok" data-alan="ipucu" data-bolum={bolum} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <style>{`
        @media (max-width: 480px) {
          .uza-ipucu-balon {
            position: fixed !important;
            left: 16px !important;
            right: 16px !important;
            top: auto !important;
            bottom: calc(24px + env(safe-area-inset-bottom, 0px)) !important;
            width: auto !important;
            max-width: none !important;
          }
        }
      `}</style>
      <button
        type="button"
        aria-label={sozler.ac.replace('%', icerik.baslik)}
        aria-expanded={acik}
        data-eylem="ipucu-ac"
        onClick={() => {
          gorulduIsaretle(bolum)
          setAcik((v) => !v)
        }}
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: 999,
          border: '1.5px solid var(--uza-cizgi)',
          background: acik ? '#E4F3F1' : 'rgba(255,255,255,0.72)',
          color: acik ? 'var(--uza-cam)' : 'var(--uza-soluk)',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'var(--uza-sans)',
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
          className="uza-ipucu-balon"
          role="dialog"
          aria-label={icerik.baslik}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            zIndex: 60,
            width: 'min(320px, calc(100vw - 32px))',
            background: 'var(--uza-kagit, #FAF6EE)',
            border: '1px solid var(--uza-cizgi)',
            borderRadius: 16,
            boxShadow: '0 16px 36px rgba(58,44,34,0.16)',
            padding: '14px 16px 12px',
            fontFamily: 'var(--uza-sans)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--uza-serif)', fontSize: 16, fontWeight: 600, color: 'var(--uza-murekkep)', flex: 1 }}>{icerik.baslik}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--uza-cam)', background: '#E4F3F1', borderRadius: 999, padding: '3px 8px' }}>{sozler.rozet}</span>
          </div>
          {icerik.satirlar.map((s, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--uza-murekkep)' }}>
              {s}
            </p>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" data-eylem="ipucu-anladim" onClick={kapat} style={{ border: 'none', background: 'var(--uza-cam)', color: '#FAF8F4', borderRadius: 999, padding: '0 16px', minHeight: 40, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--uza-sans)' }}>
              {sozler.anladim}
            </button>
            <button
              type="button"
              data-eylem="ipucu-bir-daha"
              onClick={() => {
                gorulduIsaretle(bolum)
                kapat()
              }}
              style={{ border: 'none', background: 'transparent', color: 'var(--uza-soluk)', minHeight: 40, padding: '0 6px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--uza-sans)' }}
            >
              {sozler.birDaha}
            </button>
          </div>
        </div>
      )}
    </span>
  )
}

/** The Settings row: the switch that turns the tips on and off (default ON). Renders nothing when the pack has no tips. */
export function IpucuAyarKarti({ m }: { m: UygulamaMetni }) {
  const sozler = m.ipuclari
  const [acik, setAcik] = useState(true)
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    setAcik(ipuclariAcikMi())
    setHazir(true)
  }, [])

  if (!sozler) return null

  function degistir(yeni: boolean) {
    setAcik(yeni)
    ipuclariAyarla(yeni)
    try {
      window.dispatchEvent(new Event(IPUCU_AYAR_OLAYI))
    } catch {
      /* read on the next screen */
    }
  }

  return (
    <label className="yg-satir" data-alan="ipucu-ayari" style={{ cursor: 'pointer' }}>
      <span className="yg-satir-emoji" aria-hidden="true">{'\u{1F4A1}'}</span>
      <span className="yg-satir-metin">
        <span className="yg-satir-ad">{sozler.ayarEtiket}</span>
        <span className="yg-satir-alt">{sozler.ayarIzoh}</span>
      </span>
      <input
        type="checkbox"
        checked={hazir ? acik : true}
        onChange={(e) => degistir(e.target.checked)}
        aria-label={sozler.ayarEtiket}
        style={{ width: 22, height: 22, accentColor: 'var(--uza-cam)', cursor: 'pointer', flexShrink: 0 }}
      />
    </label>
  )
}
