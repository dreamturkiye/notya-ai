'use client'

/**
 * NOTYA-KADEME-01 (Türkiye) / AU-DEPTH-PARITY-03 — the WRITTEN CHAT under the assistant page, as a pure view. Türkiye's
 * YaziliSohbet.tsx and every country's page hand it their words and their messages; the look is one: a collapsed
 * mint button, an open card with the messages, the browser-dictation button, the input and the send button.
 * Nothing here knows a country, a backend or a patient: patient-action cards and links ride in `ek` of each message.
 */
import React, { useEffect, useRef } from 'react'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import HafifMarkdown from '@/components/asistan/HafifMarkdown'
import type { YaziliSatir, YaziliSohbetMetni } from '@/components/asistan/asistanSayfaTipleri'

export interface YaziliSohbetGorunumuProps {
  /** The persona's short name, used in the sentences that name her. */
  ad: string
  metin: YaziliSohbetMetni
  acik: boolean
  mesajlar: readonly YaziliSatir[]
  girdi: string
  bekliyor: boolean
  dinliyor: boolean
  aktifHasta?: string | null
  onAc: (acik: boolean) => void
  onGirdi: (g: string) => void
  onGonder: () => void
  /** Browser dictation. Absent = no microphone button. */
  onMikrofon?: () => void
}

export default function YaziliSohbetGorunumu({ ad, metin, acik, mesajlar, girdi, bekliyor, dinliyor, aktifHasta, onAc, onGirdi, onGonder, onMikrofon }: YaziliSohbetGorunumuProps) {
  const altRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!acik || mesajlar.length === 0) return
    const t = setTimeout(() => altRef.current?.scrollIntoView?.({ behavior: 'smooth' }), 60)
    return () => clearTimeout(t)
  }, [acik, mesajlar.length, bekliyor])

  return (
    <div style={{ maxWidth: 560, margin: '18px auto 30px', padding: '0 16px', flexShrink: 0 }}>
      {!acik ? (
        <button
          type="button"
          onClick={() => onAc(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', textAlign: 'center', lineHeight: 1.4, background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0F9B8E', borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {metin.ac(ad)}{metin.acEk ? <> <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>{metin.acEk}</span></> : null}
        </button>
      ) : (
        <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.ink }}>{metin.baslik}{aktifHasta && metin.aktifHasta ? <span style={{ fontWeight: 400, fontSize: 12, color: '#0F9B8E' }}> · {metin.aktifHasta}: {aktifHasta}</span> : ''}</span>
            <span role="button" tabIndex={0} onClick={() => onAc(false)} onKeyDown={(e) => { if (e.key === 'Enter') onAc(false) }} style={{ fontSize: 12, color: CHROME_RENK.muted, cursor: 'pointer' }}>{metin.kapat}</span>
          </div>
          {mesajlar.length === 0 && (
            <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, lineHeight: 1.6, marginBottom: 10 }}>
              {metin.bos(ad)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', marginBottom: 10 }}>
            {mesajlar.map((m) => (
              <div key={m.sira} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'stretch', maxWidth: m.rol === 'doktor' ? '90%' : '100%', minWidth: 0 }}>
                <div style={{ display: 'inline-block', maxWidth: '100%', background: m.rol === 'doktor' ? '#0F9B8E' : '#FFFFFF', border: m.rol === 'doktor' ? 'none' : `1px solid ${CHROME_RENK.border}`, color: m.rol === 'doktor' ? '#fff' : CHROME_RENK.ink, borderRadius: 12, padding: '8px 12px', fontSize: 13.5, lineHeight: 1.55, whiteSpace: m.rol === 'doktor' ? 'pre-wrap' : 'normal', overflowWrap: 'anywhere' }}>{m.rol === 'asistan' ? <HafifMarkdown metin={m.icerik} /> : m.icerik}</div>
                {m.ek}
              </div>
            ))}
            {bekliyor && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{metin.bekliyor(ad)}</div>}
            <div ref={altRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onGonder() }} style={{ display: 'flex', gap: 6 }}>
            {onMikrofon ? (
              <button
                type="button"
                onClick={onMikrofon}
                title={dinliyor ? metin.mikrofonDurdur : metin.mikrofonAc}
                style={{ width: 42, flexShrink: 0, background: dinliyor ? '#EF4444' : '#FFFFFF', border: `1px solid ${dinliyor ? '#EF4444' : CHROME_RENK.border}`, color: dinliyor ? 'white' : CHROME_RENK.ink, borderRadius: 10, fontSize: 16, cursor: 'pointer' }}
              >
                {dinliyor ? '⏹' : '🎤'}
              </button>
            ) : null}
            <input
              value={girdi}
              onChange={(e) => onGirdi(e.target.value)}
              placeholder={dinliyor ? metin.yerTutucuDinliyor : metin.yerTutucu}
              style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 10, padding: '10px 12px', fontSize: 14 }}
            />
            <button type="submit" disabled={bekliyor || !girdi.trim()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: bekliyor || !girdi.trim() ? 0.5 : 1 }}>{metin.gonder}</button>
          </form>
        </div>
      )}
    </div>
  )
}
