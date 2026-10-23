'use client'

/**
 * NOTYA-ASISTAN-YUZEN-01 (Türkiye) / AU-DEPTH-PARITY-03 — the ASSISTANT PAGE as a pure view: the persona column on a wide
 * screen, the header with the persona chips, the conversation of bubbles (the assistant's on the left with her initial,
 * the doctor's on the right, her answers through HafifMarkdown), the status line, the big microphone and the written chat
 * under it. This is the page Kaan calls "the gold": Türkiye's app/asistan/page.tsx and every country's /asistan page
 * render through this ONE component, so they cannot drift apart. What differs between them is what is handed in:
 *
 *   metin      the words (a catalogue per language: Türkiye's in AsistanSayfaTR.tsx, a country's in its language set)
 *   persona    the colleague (name, title, colour, photograph if there is one)
 *   kart/geri/yazili   slots for the pieces that belong to one backend (a patient-action card, the back link, the written chat)
 *
 * It holds no session and calls no API; the session is whoever renders it (Türkiye: AsistanOturumContext, a country: its
 * own hook). Its markup for Türkiye is pinned byte for byte by lib/asistan/asistanSayfa.test.ts.
 */
import PersonaFoto from './PersonaFoto'
import React, { useEffect, useRef, useState } from 'react'
import HafifMarkdown from '@/components/asistan/HafifMarkdown'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import type { AsistanSayfaMetni, PersonaSecenegi, SayfaMesaj, SayfaPersona, SesDurumu } from '@/components/asistan/asistanSayfaTipleri'

export interface AsistanSayfaGorunumuProps {
  persona: SayfaPersona
  /** The colleague chips under the header. Absent or one entry = no chips (a country with one assistant per role). */
  personalar?: readonly PersonaSecenegi[]
  onPersona?: (key: string) => void
  durum: SesDurumu
  aktif: boolean
  mesajlar: readonly SayfaMesaj[]
  hata: string
  sureUzatmaGoster: boolean
  metin: AsistanSayfaMetni
  onBasla: () => void
  onBitir: () => void
  onSureUzat: () => void
  /** A confirm card riding above the controls (Türkiye's patient actions). */
  kart?: React.ReactNode
  /** The back arrow: the caller draws the link its router wants. */
  geri: (p: { style: React.CSSProperties; 'aria-label': string }) => React.ReactNode
  /** The written chat under the controls. */
  yazili: React.ReactNode
  /** Header, right side: a small extra control (a country's "clear conversation"). */
  ustSag?: React.ReactNode
  /** Where there is no photograph, draw the initials in the wide-screen column too. */
  yanKolonBasHarf?: boolean
  /** An accessible name for the big microphone: when given it becomes a keyboard-reachable button. */
  mikrofonAdi?: string
  /** The page starts in the phone layout and switches on the first effect; a test can start in the wide one. */
  mobilBaslangic?: boolean
}

export default function AsistanSayfaGorunumu({
  persona, personalar, onPersona, durum: status, aktif: isActive, mesajlar: messages, hata: errorMsg, sureUzatmaGoster, metin,
  onBasla, onBitir, onSureUzat, kart, geri, yazili, ustSag, yanKolonBasHarf, mikrofonAdi, mobilBaslangic = true,
}: AsistanSayfaGorunumuProps) {
  const [isMobile, setIsMobile] = useState(mobilBaslangic)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sohbetKaydirRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 768)
    chk()
    window.addEventListener('resize', chk)
    return () => window.removeEventListener('resize', chk)
  }, [])

  // NOTYA-ASISTAN-AVATAR-01 (Kaan, iPhone, 2026-10-03): do not scroll on the empty idle screen —
  // scrollIntoView(messagesEndRef) used to yank the centered avatar up under the persona chips so
  // her photo started cut off at the top; the doctor then had to drag it down by hand. Keep the
  // empty idle view pinned to scrollTop 0 so the full circle is visible on open.
  useEffect(() => {
    if (messages.length === 0) {
      const el = sohbetKaydirRef.current
      if (el) el.scrollTop = 0
      return
    }
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  const statusLabel = {
    idle: metin.durum.idle,
    connecting: metin.durum.connecting,
    listening: metin.durum.listening,
    speaking: metin.durum.speaking(persona.etiket),
    error: metin.durum.error,
    sessiz: metin.durum.sessiz,
  }[status]

  const yanKolon = !isMobile && (persona.foto || yanKolonBasHarf)
  const mikrofonErisim = mikrofonAdi
    ? { role: 'button' as const, tabIndex: 0, 'aria-label': mikrofonAdi, 'aria-pressed': isActive, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (isActive) onBitir(); else onBasla() } } }
    : {}

  return (
    <div style={{ height: "100%", minHeight: 0, background: CHROME_RENK.cream, display: "flex", flexDirection: isMobile ? "column" : "row",
                  fontFamily: CHROME_FONT.sans, overflow: "hidden", userSelect: "none" }}>

      {yanKolon && (
        <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${CHROME_RENK.border}`, background: "#faf6ee", padding: "40px 28px", gap: "20px" }}>
          <div aria-hidden={persona.foto ? undefined : "true"} style={{ width: "200px", height: "200px", borderRadius: "50%", background: "#faf6ee", overflow: "hidden", border: "3px solid " + persona.renk + "CC", boxShadow: "0 0 60px " + persona.renk + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px", fontWeight: 700, color: persona.renk }}><PersonaFoto src={persona.foto} ad={persona.ad} harf={persona.kisaAd.slice(0, 2).toUpperCase()} /></div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: CHROME_RENK.ink, marginBottom: "6px" }}>{persona.etiket}</div>
            <div style={{ fontSize: "13px", color: CHROME_RENK.muted, marginBottom: "16px" }}>{persona.unvan}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: status === "speaking" ? "#10B981" : status === "listening" ? "#3B82F6" : CHROME_RENK.muted }} />
              <span style={{ fontSize: "12px", color: CHROME_RENK.muted }}>{statusLabel}</span>
            </div>
          </div>
        </div>
      )}
      {/* chat col */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${CHROME_RENK.border}`, background: "#faf6ee", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {/* NOTYA-ASISTAN-YUZEN-01: geri dönmek oturumu bitirmez — ses yüzen panelde sürer. */}
          {geri({ 'aria-label': metin.geri,
            style: { color: CHROME_RENK.muted, cursor: "pointer", fontSize: "24px", padding: "6px 8px", flexShrink: 0, lineHeight: 1, textDecoration: "none" } })}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: CHROME_RENK.ink, lineHeight: 1.35, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{persona.etiket}</div>
            <div style={{ fontSize: "11px", color: CHROME_RENK.muted, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{persona.unvan}</div>
          </div>
          {ustSag}
        </div>
        {personalar && personalar.length > 1 && (
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "2px" }}>
            {personalar.map((p) => (
              <button key={p.key} type="button" onClick={() => onPersona?.(p.key)}
                title={p.baslik}
                style={{ padding: "6px 10px", borderRadius: "999px", fontSize: "11px", cursor: "pointer",
                         fontWeight: p.aktif ? 700 : 500, flexShrink: 0, whiteSpace: "nowrap",
                         background: p.aktif ? p.renk : "#F6F0E4",
                         color: p.aktif ? "#fff" : CHROME_RENK.muted,
                         border: `1px solid ${p.aktif ? p.renk : CHROME_RENK.border}` }}>
                {p.etiket}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={sohbetKaydirRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.length === 0 && status === "idle" && (
          // NOTYA-ASISTAN-AVATAR-01: margin:auto centers when there is room; unlike flex:1 +
          // justifyContent:center it never clips the top of the avatar under the scroll edge on iPhone.
          <div style={{ marginBlock: "auto", display: "flex", flexDirection: "column", alignItems: "center",
                        gap: "12px", width: "100%", flexShrink: 0, paddingTop: 4 }}>
            <div style={{ width: 128, height: 128, borderRadius: '50%',
                          background: '#faf6ee',
                          border: '3px solid ' + persona.renk + 'CC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          fontSize: '30px', fontWeight: 700, color: persona.renk,
                          boxShadow: '0 0 48px ' + persona.renk + '33' }}>
              <PersonaFoto src={persona.foto} ad={persona.ad} harf={persona.kisaAd.slice(0, 2).toUpperCase()} />
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: CHROME_RENK.ink }}>{persona.etiket}</div>
            <div style={{ fontSize: "13px", color: CHROME_RENK.muted }}>{persona.unvan}</div>
            <div style={{ fontSize: "12px", color: CHROME_RENK.muted, marginTop: "8px",
                          textAlign: "center", maxWidth: "260px", lineHeight: "1.6" }}>
              {metin.bosIpucu}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end", gap: "8px" }}>
            {msg.role === "ai" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: persona.renk,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "14px", flexShrink: 0 }}>{persona.kisaAd.slice(0, 1)}</div>
            )}
            <div style={{ maxWidth: "78%", padding: "10px 14px", fontSize: "14px", lineHeight: "1.55",
                          borderRadius: msg.role === "user" ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                          background: msg.role === "user" ? "#0F9B8E" : "#FFFFFF",
                          border: msg.role === "user" ? "none" : `1px solid ${CHROME_RENK.border}`,
                          color: msg.role === "user" ? "#fff" : CHROME_RENK.ink,
                          whiteSpace: msg.role === "user" ? "pre-wrap" : "normal", overflowWrap: "anywhere" }}>
              {/* NOTYA-ASISTAN-REHBER-01: asistan balonu ham ** ve tek satır • zinciri gösteriyordu; YaziliSohbet ile aynı hafif biçimlendirici. */}
              {msg.role === "ai" ? <HafifMarkdown metin={msg.text} /> : msg.text}
            </div>
          </div>
        ))}
        {status === "connecting" && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: persona.renk,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
              {persona.kisaAd.slice(0, 1)}
            </div>
            <div style={{ padding: "12px 16px", background: "#FFFFFF", border: `1px solid ${CHROME_RENK.border}`, borderRadius: "16px 16px 16px 3px",
                          display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%",
                                      background: CHROME_RENK.muted,
                                      animation: `bounce 1.2s ease-in-out ${i * .2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {kart && (
        <div style={{ flexShrink: 0, maxHeight: '46%', overflowY: 'auto', padding: '8px 12px 4px', borderTop: '1px solid rgba(15,155,142,0.3)', background: '#F0FDFA' }}>
          {kart}
        </div>
      )}

      <div style={{ padding: "16px 16px 24px", flexShrink: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: "12px", borderTop: `1px solid ${CHROME_RENK.border}`,
                    background: "#faf6ee" }}>
        {errorMsg && (
          <div style={{ fontSize: "13px", color: CHROME_RENK.warn, background: "#FBEAE3",
                        border: `1px solid ${CHROME_RENK.warn}70`, padding: "12px 16px", borderRadius: "10px",
                        textAlign: "center", maxWidth: "340px", lineHeight: "1.5",
                        fontWeight: 500 }}>{errorMsg}</div>
        )}
        <div style={{ fontSize: "13px", color: CHROME_RENK.muted,
                      display: "flex", alignItems: "center", gap: "8px" }}>
          {isActive && (
            <div style={{ width: "7px", height: "7px", borderRadius: "50%",
                          background: status === "speaking" ? persona.renk
                            : status === "connecting" ? "#B4832F" : "#22C55E",
                          boxShadow: `0 0 8px ${status === "speaking" ? persona.renk : "#22C55E"}` }} />
          )}
          {statusLabel}
        </div>
        {sureUzatmaGoster && (
          <div style={{ padding: "10px 14px", background: "#FBF3DE", border: "1px solid #E4C989", borderRadius: 10, textAlign: "center", maxWidth: 280 }}>
            <div style={{ fontSize: 12, color: "#7A5B1E", marginBottom: 8 }}>{metin.sureUyari}</div>
            <button type="button" onClick={onSureUzat} style={{ background: "#B4832F", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{metin.sureUzat}</button>
          </div>
        )}
        <div onClick={isActive ? () => onBitir() : () => onBasla()}
          {...mikrofonErisim}
          style={{ width: "80px", height: "80px", borderRadius: "50%", cursor: "pointer",
                   display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
                   background: isActive
                     ? `radial-gradient(circle,${persona.renk},${persona.renk}88)`
                     : "#F6F0E4",
                   border: `2px solid ${isActive ? persona.renk : CHROME_RENK.border}`,
                   boxShadow: isActive ? `0 0 32px ${persona.renk}55` : "none",
                   transition: "all .25s" }}>
          {status === 'idle' || status === 'error' || status === 'sessiz' ? (
            <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke={CHROME_RENK.ink} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='9' y='2' width='6' height='11' rx='3'/>
              <path d='M5 10a7 7 0 0 0 14 0'/>
              <line x1='12' y1='21' x2='12' y2='17'/>
              <line x1='8' y1='21' x2='16' y2='21'/>
            </svg>
          ) : status === 'speaking' ? (
            <svg width='28' height='28' viewBox='0 0 30 24'>
              <rect x='1' y='9' width='4' height='6' rx='2' fill='white' style={{animation:'wave1 0.7s ease-in-out infinite'}}/>
              <rect x='8' y='5' width='4' height='14' rx='2' fill='white' style={{animation:'wave2 0.7s ease-in-out 0.1s infinite'}}/>
              <rect x='15' y='3' width='4' height='18' rx='2' fill='white' style={{animation:'wave1 0.7s ease-in-out 0.2s infinite'}}/>
              <rect x='22' y='6' width='4' height='12' rx='2' fill='white' style={{animation:'wave2 0.7s ease-in-out 0.15s infinite'}}/>
            </svg>
          ) : status === 'connecting' ? (
            <div style={{width:26,height:26,borderRadius:'50%',border:`2.5px solid ${CHROME_RENK.border}`,borderTopColor:'#B4832F',animation:'spin 0.8s linear infinite'}}/>
          ) : (
            <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='9' y='2' width='6' height='11' rx='3'/>
              <path d='M5 10a7 7 0 0 0 14 0'/>
              <line x1='12' y1='21' x2='12' y2='17'/>
              <line x1='8' y1='21' x2='16' y2='21'/>
            </svg>
          )}
        </div>
        <div style={{ fontSize: "11px", color: CHROME_RENK.muted }}>
          {isActive ? metin.dokunBitir : metin.dokunBaslat}
        </div>
      </div>
      {/* NOTYA-KADEME-01: temel kademe yüzeyi — sesli sor (tarayıcı STT), yazılı cevap; dosya bilinçli */}
      {yazili}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes wave1{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}@keyframes wave2{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.4)}}`}</style>
    </div>
      </div>
  )
}
