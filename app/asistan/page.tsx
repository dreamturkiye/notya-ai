"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import HafifMarkdown from "@/components/asistan/HafifMarkdown";
import { useRouter } from "next/navigation"
import YaziliSohbet from "@/components/asistan/YaziliSohbet"
import { PERSONAS, PERSONA_ORDER } from "@/lib/asistan/personaEngine"
import { SPECIALTY_MAP } from "@/lib/doktor/specialties"
import { formatColleagueTabLabel, formatColleagueDisplayName } from "@/lib/colleagueAddress"
import { EylemKarti } from '@/components/core/EylemKarti'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import DoktorChrome, { useChromeKompakt } from '@/components/doktor/DoktorChrome'
import { pwaIkonundanAsistanMi } from '@/lib/pwa/ikonAcilis'
import { useAsistanOturum } from '@/components/asistan/AsistanOturumContext'

// NOTYA-CHROME-KOMPAKT-01 (Kaan, 2026-09-24): useContext reads from the nearest ANCESTOR
// provider -- calling useChromeKompakt at the top of the same component that RETURNS
// <DoktorChrome> doesn't work, because at the point the hook runs, this component hasn't
// rendered its own JSX yet, so there is no provider above it yet (DoktorChrome is a CHILD in the
// tree this component produces, not an ancestor of it). Split into a thin outer wrapper that owns
// the <DoktorChrome> boundary, and an inner component -- a genuine descendant -- that calls the
// hook and holds every bit of this page's existing logic unchanged.
export default function AsistanPage() {
  return (
    <DoktorChrome>
      <AsistanPageInner />
    </DoktorChrome>
  )
}

function AsistanPageInner() {
  // NOTYA-CHROME-KOMPAKT-01 (Kaan, 2026-09-24): "solda full menu ve logo olsun" — sidebar+logo
  // now come from DoktorChrome, wrapped around this component one level up (AsistanPage above).
  // This hook keeps the sidebar while telling DoktorChrome to skip its own header/footer/max-width
  // wrapper, so this page's own full-height persona/conversation/control-bar layout keeps working.
  useChromeKompakt(true)
  const router = useRouter()
  // NOTYA-ASISTAN-YUZEN-01 (Kaan, 2026-09-26): oturum (ses, mesajlar, persona, tek beyin yoklaması, araçlar,
  // yazılı sohbet) AsistanOturumContext'te — app/layout.tsx'te bütün sayfaları sarar. Bu sayfa yalnız görünüm:
  // kendi oturumunu açmaz, ayrılınca oturumu kapatmaz. Doktor başka sayfadayken AsistanYuzenPanel devralır.
  const {
    persona, personaKey, status, isActive, messages, errorMsg, sureUzatmaGoster, sesKarti,
    hazirla, startConversation, stopConversation, switchPersona, sureUzat, sesKartiniKapat,
  } = useAsistanOturum()
  const [isMobile, setIsMobile] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 768)
    chk()
    window.addEventListener('resize', chk)
    return () => window.removeEventListener('resize', chk)
  }, [])

  // Opening colleague: branch doctors (KD → Fatma) ignore stale localStorage Ayşe (AsistanOturumContext.hazirla).
  useEffect(() => {
    if (pwaIkonundanAsistanMi()) {
      window.location.replace('/dashboard/doktor')
      return
    }
    ;(async () => {
      const sonuc = await hazirla()
      if (sonuc === "giris") router.replace("/giris/doktor")
      else if (sonuc === "onboarding") router.replace("/onboarding?p=doktor")
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const statusLabel = {
    idle:       "Konuşmayı başlatmak için dokunun",
    connecting: "Bağlanıyor...",
    listening:  "Dinliyor — konuşabilirsiniz",
    speaking:   `${formatColleagueTabLabel(persona.name)} konuşuyor...`,
    error:      "Tekrar deneyin",
    sessiz:     "Sessizde — yazılı sohbet açık. Devam için mikrofona dokunun",
  }[status]

  return (
    <div style={{ height: "100%", minHeight: 0, background: CHROME_RENK.cream, display: "flex", flexDirection: isMobile ? "column" : "row",
                  fontFamily: CHROME_FONT.sans, overflow: "hidden", userSelect: "none" }}>

      {!isMobile && persona.photo && (
        <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${CHROME_RENK.border}`, background: "#faf6ee", padding: "40px 28px", gap: "20px" }}>
          <img src={persona.photo} alt={persona.name} style={{ width: "200px", height: "200px", borderRadius: "50%", objectFit: "cover", objectPosition: "center top", border: "3px solid " + persona.color + "CC", boxShadow: "0 0 60px " + persona.color + "33" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: CHROME_RENK.ink, marginBottom: "6px" }}>{formatColleagueTabLabel(persona.name)}</div>
            <div style={{ fontSize: "13px", color: CHROME_RENK.muted, marginBottom: "16px" }}>{persona.title}</div>
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
          <Link href="/dashboard/doktor" aria-label="Ana sayfaya dön"
            style={{ color: CHROME_RENK.muted, cursor: "pointer", fontSize: "24px", padding: "6px 8px", flexShrink: 0, lineHeight: 1, textDecoration: "none" }}>‹</Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: CHROME_RENK.ink, lineHeight: 1.35, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatColleagueTabLabel(persona.name)}</div>
            <div style={{ fontSize: "11px", color: CHROME_RENK.muted, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{persona.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "10px", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "2px" }}>
          {PERSONA_ORDER.map((key) => {
            const p = PERSONAS[key]
            if (!p) return null
            const active = personaKey === key
            const branş = SPECIALTY_MAP[p.primarySpecialty]?.label || p.primarySpecialty
            return (
              <button key={key} type="button" onClick={() => switchPersona(key)}
                title={`${p.name} — ${branş}`}
                style={{ padding: "6px 10px", borderRadius: "999px", fontSize: "11px", cursor: "pointer",
                         fontWeight: active ? 700 : 500, flexShrink: 0, whiteSpace: "nowrap",
                         background: active ? p.color : "#F6F0E4",
                         color: active ? "#fff" : CHROME_RENK.muted,
                         border: `1px solid ${active ? p.color : CHROME_RENK.border}` }}>
                {formatColleagueDisplayName(p.name)} · {branş}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.length === 0 && status === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: "12px" }}>
            <div style={{ width: 128, height: 128, borderRadius: '50%',
                          background: '#faf6ee',
                          border: '3px solid ' + persona.color + 'CC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          fontSize: '30px', fontWeight: 700, color: persona.color,
                          boxShadow: '0 0 48px ' + persona.color + '33' }}>
              {persona.photo
                ? <img src={persona.photo} alt={persona.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',borderRadius:'50%'}}/>
                : persona.shortName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: CHROME_RENK.ink }}>{formatColleagueTabLabel(persona.name)}</div>
            <div style={{ fontSize: "13px", color: CHROME_RENK.muted }}>{persona.title}</div>
            <div style={{ fontSize: "12px", color: CHROME_RENK.muted, marginTop: "8px",
                          textAlign: "center", maxWidth: "260px", lineHeight: "1.6" }}>
              1:1 sesli görüşme — doğal konuşun
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end", gap: "8px" }}>
            {msg.role === "ai" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: persona.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "14px", flexShrink: 0 }}>{persona.shortName.slice(0, 1)}</div>
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
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: persona.color,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
              {persona.shortName.slice(0, 1)}
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

      {sesKarti && (
        <div style={{ flexShrink: 0, maxHeight: '46%', overflowY: 'auto', padding: '8px 12px 4px', borderTop: '1px solid rgba(15,155,142,0.3)', background: '#F0FDFA' }}>
          <EylemKarti
            oneri={sesKarti.oneri}
            hasta={sesKarti.hasta}
            onSonuc={sesKartiniKapat}
          />
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
                          background: status === "speaking" ? persona.color
                            : status === "connecting" ? "#B4832F" : "#22C55E",
                          boxShadow: `0 0 8px ${status === "speaking" ? persona.color : "#22C55E"}` }} />
          )}
          {statusLabel}
        </div>
        {sureUzatmaGoster && (
          <div style={{ padding: "10px 14px", background: "#FBF3DE", border: "1px solid #E4C989", borderRadius: 10, textAlign: "center", maxWidth: 280 }}>
            <div style={{ fontSize: 12, color: "#7A5B1E", marginBottom: 8 }}>Süre 5 dakika içinde dolacak</div>
            <button type="button" onClick={() => sureUzat(30)} style={{ background: "#B4832F", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+30 dakika uzat</button>
          </div>
        )}
        <div onClick={isActive ? () => void stopConversation() : () => void startConversation()}
          style={{ width: "80px", height: "80px", borderRadius: "50%", cursor: "pointer",
                   display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
                   background: isActive
                     ? `radial-gradient(circle,${persona.color},${persona.color}88)`
                     : "#F6F0E4",
                   border: `2px solid ${isActive ? persona.color : CHROME_RENK.border}`,
                   boxShadow: isActive ? `0 0 32px ${persona.color}55` : "none",
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
          {isActive ? "Bitirmek için dokunun" : "Konuşmayı başlatmak için dokunun"}
        </div>
      </div>
      {/* NOTYA-KADEME-01: temel kademe yüzeyi — sesli sor (tarayıcı STT), yazılı cevap; dosya bilinçli */}
      <YaziliSohbet />
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes wave1{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}@keyframes wave2{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.4)}}`}</style>
    </div>
      </div>
  )
}
