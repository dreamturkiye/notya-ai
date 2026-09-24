"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Conversation } from "@/components/AsistanConversation"
import YaziliSohbet from "@/components/asistan/YaziliSohbet"
import { connectionErrorHelp, micPermissionHelp, isAndroid } from "@/lib/asistan/platform"
import {
  PERSONAS,
  PERSONA_ORDER,
  buildVoiceSystemPrompt,
  resolveOpeningPersonaId,
  type Persona,
  type PersonaId,
} from "@/lib/asistan/personaEngine"
import { SPECIALTY_MAP } from "@/lib/doktor/specialties"
import { formatColleagueTabLabel, formatColleagueDisplayName } from "@/lib/colleagueAddress"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"
import { ensureDoctorAccessToken, isOnboardingDone } from "@/lib/doktor/clientAuth"
import { address } from '@/lib/address'
import { EylemKarti, type EylemHasta, type EylemOneriGorunumu } from '@/components/core/EylemKarti'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import DoktorChrome, { useChromeKompakt } from '@/components/doktor/DoktorChrome'

type ConvStatus = "idle" | "connecting" | "listening" | "speaking" | "error"
type Message = { id: string; role: "user" | "ai"; text: string }

type ActiveConversation = Awaited<ReturnType<typeof Conversation.startSession>>

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
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState<PersonaId>("aysekaya")
  const [isMobile, setIsMobile] = useState(true)
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<ReturnType<typeof toAddressableUser> | null>(null)
  const conversationRef = useRef<ActiveConversation | null>(null)
  /** NOTYA-OGRENME-03: addMsg ile eş zamanlı tutulur — endConversation()'ın kullandığı kapanışlar
   *  (özellikle mount-effect cleanup) React state'in bayat bir kopyasını görebilir; ref her zaman güncel. */
  const messagesRef = useRef<Message[]>([])
  /** Last voice-prepared öneri — eylem_onayla / vazgec use this when the agent omits oneriId. */
  const sesEylemRef = useRef<{ oneriId: string; hastaId: string } | null>(null)
  const sureUyariRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sureSonRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sureBaslangicRef = useRef<number>(0)
  const sureHedefDkRef = useRef<number>(60)
  const sureHitapRef = useRef<string>("Hocam")
  const [sureUzatmaGoster, setSureUzatmaGoster] = useState(false)
  const [sesKarti, setSesKarti] = useState<{ oneri: EylemOneriGorunumu; hasta: EylemHasta } | null>(null)
  const SURE_TAVAN_DK = 120 // ElevenLabs platform sınırı 7200 sn — agent config'te de bu değere çekildi

  const sureTimerlariTemizle = () => {
    if (sureUyariRef.current) { clearTimeout(sureUyariRef.current); sureUyariRef.current = null }
    if (sureSonRef.current) { clearTimeout(sureSonRef.current); sureSonRef.current = null }
  }
  const sureUyariSesli = (named: string) => {
    const uyari = `${named}, kayıt 5 dakika içinde otomatik olarak sonlanacak. Uzatmak isterseniz ekrandaki düğmeye basabilirsiniz.`
    addMsg("ai", `⏱️ ${uyari}`)
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(uyari)
        u.lang = "tr-TR"
        window.speechSynthesis.speak(u)
      }
    } catch { /* sesli uyarı olmazsa yazılı uyarı yeterli */ }
    setSureUzatmaGoster(true)
  }
  /** hedefDk: konuşma başından itibaren toplam dakika. Uyarı hedef-5'te, kapanış hedefte. */
  const sureTimerlariKur = (hedefDk: number) => {
    sureTimerlariTemizle()
    sureHedefDkRef.current = hedefDk
    const gecenMs = Date.now() - sureBaslangicRef.current
    const uyariMs = Math.max(0, (hedefDk - 5) * 60 * 1000 - gecenMs)
    const sonMs = Math.max(0, hedefDk * 60 * 1000 - gecenMs)
    sureUyariRef.current = setTimeout(() => sureUyariSesli(sureHitapRef.current), uyariMs)
    sureSonRef.current = setTimeout(() => {
      setSureUzatmaGoster(false)
      addMsg("ai", `⏱️ ${hedefDk} dakikalık süre doldu, görüşme otomatik olarak sonlandırıldı.`)
      conversationRef.current?.endSession().catch(() => { /* zaten kapanıyor olabilir */ })
    }, sonMs)
  }
  const sureTimerlariBaslat = (named: string) => {
    sureHitapRef.current = named
    sureBaslangicRef.current = Date.now()
    setSureUzatmaGoster(false)
    sureTimerlariKur(60)
  }
  const sureUzat = (dk: number) => {
    const yeniHedef = Math.min(SURE_TAVAN_DK, sureHedefDkRef.current + dk)
    sureTimerlariKur(yeniHedef)
    setSureUzatmaGoster(false)
    addMsg("ai", `⏱️ Süre ${yeniHedef} dakikaya uzatıldı.`)
  }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // auth via localStorage

  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 768)
    chk()
    window.addEventListener('resize', chk)
    return () => window.removeEventListener('resize', chk)
  }, [])

  // Opening colleague: branch doctors (KD → Fatma) ignore stale localStorage Ayşe.
  useEffect(() => {
    ;(async () => {
      let token = await ensureDoctorAccessToken()
      if (!token) {
        router.replace("/giris/doktor")
        return
      }
      setAuthToken(token)

      let resp = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Expired access token without reliable expires_at — refresh once, then login.
      if (resp.status === 401) {
        token = await ensureDoctorAccessToken({ forceRefresh: true })
        if (!token) {
          router.replace("/giris/doktor")
          return
        }
        setAuthToken(token)
        resp = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (resp.status === 401) {
          router.replace("/giris/doktor")
          return
        }
      }
      const profileData = await resp.json().catch(() => ({} as { data?: DoctorProfile }))
      if (!isOnboardingDone(profileData.data)) {
        router.replace("/onboarding?p=doktor")
        return
      }
      setDoctorProfile(toAddressableUser(profileData.data as DoctorProfile))
      let secili: string | null = null
      try { secili = localStorage.getItem('notya_asistan_persona') } catch { /* ignore */ }
      const acilis = resolveOpeningPersonaId(
        (profileData.data as { specialty?: string } | undefined)?.specialty,
        secili,
      )
      setPersonaKey(acilis)
      setPersona(PERSONAS[acilis])
      try {
        if (secili !== acilis) localStorage.setItem('notya_asistan_persona', acilis)
      } catch { /* ignore */ }
    })()
    return () => { void endConversation() }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // iOS notification banners can suspend the mic mid-call without firing onDisconnect.
  // Playback keeps working (separate audio pipe) but the mic input silently stays muted.
  // On tab/app return, force-unmute so the doctor's voice input resumes.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const conv = conversationRef.current as unknown as { setMuted?: (m: boolean) => void; isMuted?: boolean } | null
      if (!conv) return
      try {
        if (typeof conv.setMuted === 'function') {
          conv.setMuted(false)
        }
      } catch { /* non-fatal */ }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  function addMsg(role: "user" | "ai", text: string) {
    if (!text?.trim()) return
    const trimmed = text.trim()
    setMessages((prev) => {
      // Guard against connect-seed + agent transcript of the same greeting.
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.text === trimmed) return prev
      const next = [...prev, { id: `${Date.now()}-${Math.random()}`, role, text: trimmed }]
      messagesRef.current = next
      return next
    })
  }

  /** NOTYA-OGRENME-03: canlı sesli Ayşe, doktorun aslında EN çok konuştuğu yüzeydi ama Next.js
   *  sunucusuna hiç uğramadığı için hafıza buradan hiçbir şey öğrenmiyordu. SDK zaten her turu
   *  onMessage ile tarayıcıya veriyor (messagesRef) — konuşma biterken doktor tarafını tek istekte
   *  yolla. keepalive: sekme kapanırken/navigasyonda istek yarım kalmasın.
   */
  function sesOgrenGonder() {
    try {
      const doktorSozleri = messagesRef.current.filter((m) => m.role === "user").map((m) => m.text).join("\n").slice(0, 4000)
      if (!doktorSozleri || !authToken) return
      void fetch("/api/asistan/ses-ogren", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ doktorSozleri }),
        keepalive: true,
      }).catch(() => { /* öğrenme kritik değil */ })
    } catch { /* öğrenme kritik değil */ }
  }

  async function endConversation() {
    const conv = conversationRef.current
    conversationRef.current = null
    if (conv) {
      sesOgrenGonder()
      try { await conv.endSession() } catch { /* ignore */ }
    }
    setStatus("idle")
  }

  function isFirstMessageOverrideError(msg: string): boolean {
    // Narrow match: the prior broad "Override for field" also caught voice/prompt
    // failures and restarted a second session on the same mic → broken speech (Ayşe).
    return /first[_ ]?message/i.test(msg || "")
  }

  async function fetchSignedUrl(p: Persona): Promise<{ signedUrl: string; voiceId: string }> {
    if (!authToken) throw new Error("Oturum bulunamadı")
    const resp = await fetch(
      `/api/asistan/signed-url?specialty=${p.primarySpecialty}&persona=${p.id}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    )
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}))
      throw new Error((errBody as { error?: string }).error || `Sunucu hatası: ${resp.status}`)
    }
    const body = await resp.json()
    if (!body.signed_url) throw new Error("Bağlantı adresi alınamadı")
    return {
      signedUrl: body.signed_url as string,
      voiceId: (body.voice_id as string) || p.voiceId,
    }
  }

  async function startConversation() {
    if (!authToken) { router.push("/giris"); return }
    await endConversation()
    setStatus("connecting")
    setErrorMsg("")
    setMessages([])
    messagesRef.current = []
    // Pre-flight: request mic permission explicitly on user gesture
    // so the browser prompt fires before any async work
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch {
      setErrorMsg(micPermissionHelp())
      setStatus("error")
      return
    }
    // Android: unlock AudioContext on user gesture before any async work
    if (isAndroid() && typeof window !== "undefined") {
      try { const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)(); await ctx.resume() } catch { /* non-fatal */ }
    }

    try {
      const doctor = doctorProfile || toAddressableUser(null)
      const p = PERSONAS[personaKey]
      // NOTYA-OGRENME-03: sesli Ayşe de meslektaş hafızasını okur — 5+ seansta kendini
      // tanıtmayı bırakır, bildiklerini promptta taşır. Başarısızlıkta eski davranış.
      let hafiza: { karsilama?: { tanit: boolean; onSoz: string }; sesBlogu?: string; gun?: { metin: string; blok: string } | null } = {}
      try {
        const hr = await fetch("/api/doktor/hafiza", { headers: { Authorization: `Bearer ${authToken}` } })
        if (hr.ok) hafiza = await hr.json()
      } catch { /* hafıza kritik değil */ }
      const firstMessage = `Merhaba ${address(doctor || { firstName: 'Hocam' }, 'named')}. Nasıl yardımcı olabilirim?`
      const voicePrompt = buildVoiceSystemPrompt(p, doctor, [hafiza.sesBlogu, hafiza.gun?.blok].filter(Boolean).join("\n\n") || undefined)
      const { signedUrl, voiceId } = await fetchSignedUrl(p)

      // Pre-regression path (c38e18e): same for all personas — personalized
      // first_message with single-flight fallback; always pass tts.voiceId.
      await startConversationWithoutFirstMessage(
        signedUrl,
        voicePrompt,
        firstMessage,
        voiceId,
        {
          tryFirstMessage: true,
          refreshSignedUrl: () => fetchSignedUrl(p).then((r) => r.signedUrl),
        }
      )
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      setErrorMsg(
        raw.includes("denied") || raw.includes("NotAllowed") || raw.includes("Permission")
          ? micPermissionHelp()
          : connectionErrorHelp(raw)
      )
      setStatus("error")
      conversationRef.current = null
    }
  }

  async function startConversationWithoutFirstMessage(
    signedUrl: string,
    voicePrompt: string,
    firstMessage: string,
    voiceId: string,
    opts?: {
      tryFirstMessage?: boolean
      refreshSignedUrl?: () => Promise<string>
    }
  ) {
    const tryFirst = Boolean(opts?.tryFirstMessage)
    let usedFirstMessage = tryFirst
    let retriedWithoutFirst = false
    let retryInFlight = false
    let activeSignedUrl = signedUrl

    const endCurrentSession = async () => {
      const old = conversationRef.current
      conversationRef.current = null
      if (old) {
        try { await old.endSession() } catch { /* ignore */ }
      }
    }

    const scheduleRetryWithoutFirst = async () => {
      if (retriedWithoutFirst || retryInFlight) return
      retriedWithoutFirst = true
      retryInFlight = true
      try {
        await endCurrentSession()
        if (opts?.refreshSignedUrl) {
          try {
            activeSignedUrl = await opts.refreshSignedUrl()
          } catch {
            // Keep prior URL if refresh fails; begin(false) may still succeed.
          }
        }
        await begin(false)
      } catch (e: unknown) {
        setErrorMsg(connectionErrorHelp(e instanceof Error ? e.message : String(e)))
        setStatus("error")
        conversationRef.current = null
      } finally {
        retryInFlight = false
      }
    }

    const begin = async (includeFirstMessage: boolean) => {
      usedFirstMessage = includeFirstMessage
      // Fallback seeds UI greeting; skip the agent's own default transcript once.
      let skipNextAgentTranscript = !includeFirstMessage
      setStatus("connecting")
      const conversation = await Conversation.startSession({
        signedUrl: activeSignedUrl,
        connectionType: "websocket",
        overrides: {
          agent: {
            prompt: { prompt: voicePrompt },
            language: "tr",
            ...(includeFirstMessage ? { firstMessage } : {}),
          },
          tts: { voiceId },
        },
        // Kaan (2026-09-14): "Ayşe Hocam bana fırça attı, dosyalara giremiyorum diyor" —
        // sesli Ayşe'nin gerçekten hasta dosyasına erişimi yoktu (yazılı sohbette vardı).
        // ElevenLabs client tool: doktor bir hasta adı söylediğinde agent bunu çağırır,
        // tarayıcı doktorun kendi oturum belirtecinle /api/asistan/hasta-bul'u sorgular.
        //
        // NOTYA-EYLEM-19 — dosyaya kayıt HAZIRLAMA + sözlü onay. Bu araçlar klinik tabloya
        // yazmaz: /api/asistan/ses-eylem yalnız taslak açar veya eylemOnayla omurgasını çağırır.
        // Canlı ElevenLabs ajanına araç şeması Kaan tarafından yapıştırılmalı (docs/README_EYLEM.md).
        clientTools: {
          hasta_bul: async (params: { isim?: string }) => {
            try {
              const t = await ensureDoctorAccessToken()
              const r = await fetch("/api/asistan/hasta-bul", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                body: JSON.stringify({ isim: params?.isim || "" }),
              })
              const j = await r.json()
              return String(j.sonuc || "Dosyaya şu an ulaşamadım.")
            } catch {
              return "Dosyaya şu an ulaşamadım, bağlantı sorunu olabilir."
            }
          },
          dosyaya_kayit_hazirla: async (params: {
            eylem?: string
            hasta?: string
            alanlar?: Record<string, unknown> | string
          }) => {
            try {
              const t = await ensureDoctorAccessToken()
              let alanlar: Record<string, unknown> = {}
              if (typeof params?.alanlar === 'string' && params.alanlar.trim()) {
                try {
                  const p = JSON.parse(params.alanlar)
                  if (p && typeof p === 'object' && !Array.isArray(p)) alanlar = p as Record<string, unknown>
                } catch {
                  alanlar = { notlar: params.alanlar }
                }
              } else if (params?.alanlar && typeof params.alanlar === 'object') {
                alanlar = params.alanlar
              }
              const r = await fetch("/api/asistan/ses-eylem", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                body: JSON.stringify({
                  adim: "hazirla",
                  eylem: params?.eylem || "",
                  hastaAdi: params?.hasta || "",
                  alanlar,
                }),
              })
              const j = (await r.json()) as { sonuc?: string; oneriId?: string; hastaId?: string }
              if (j.oneriId && j.hastaId) {
                sesEylemRef.current = { oneriId: String(j.oneriId), hastaId: String(j.hastaId) }
                void kartiYukle(String(j.hastaId), String(j.oneriId))
              }
              return String(j.sonuc || "Kartı hazırlayamadım Hocam, ekrandan deneyelim.")
            } catch {
              return "Kartı hazırlayamadım Hocam, bağlantı sorunu olabilir."
            }
          },
          eylem_onayla: async (params: { onayMetni?: string; oneriId?: string; hastaId?: string }) => {
            try {
              const t = await ensureDoctorAccessToken()
              const son = sesEylemRef.current
              const r = await fetch("/api/asistan/ses-eylem", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                body: JSON.stringify({
                  adim: "onayla",
                  onayMetni: params?.onayMetni || "evet",
                  oneriId: params?.oneriId || son?.oneriId || "",
                  hastaId: params?.hastaId || son?.hastaId || "",
                }),
              })
              const j = (await r.json()) as { sonuc?: string; ok?: boolean }
              if (j.ok) {
                sesEylemRef.current = null
                setSesKarti(null)
              }
              return String(j.sonuc || "Onaylanamadı.")
            } catch {
              return "Onaylanamadı, bağlantı sorunu olabilir."
            }
          },
          eylem_vazgec: async (params: { oneriId?: string; hastaId?: string }) => {
            try {
              const t = await ensureDoctorAccessToken()
              const son = sesEylemRef.current
              const r = await fetch("/api/asistan/ses-eylem", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                body: JSON.stringify({
                  adim: "vazgec",
                  oneriId: params?.oneriId || son?.oneriId || "",
                  hastaId: params?.hastaId || son?.hastaId || "",
                }),
              })
              const j = (await r.json()) as { sonuc?: string }
              sesEylemRef.current = null
              setSesKarti(null)
              return String(j.sonuc || "Vazgeçilemedi.")
            } catch {
              return "Vazgeçilemedi, bağlantı sorunu olabilir."
            }
          },
          randevu_takvim: async (params: { tarih?: string; saat?: string; sure_dk?: number | string }) => {
            try {
              const t = await ensureDoctorAccessToken()
              const r = await fetch("/api/asistan/ses-eylem", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                body: JSON.stringify({
                  adim: "takvim",
                  tarih: params?.tarih || "",
                  saat: params?.saat || "",
                  sure_dk: params?.sure_dk || 20,
                }),
              })
              const j = (await r.json()) as { sonuc?: string }
              return String(j.sonuc || "Takvimi okuyamadım Hocam.")
            } catch {
              return "Takvimi okuyamadım, bağlantı sorunu olabilir."
            }
          },
        },
        onConnect: () => {
          setStatus("listening")
          setErrorMsg("")
          sureTimerlariBaslat(address(doctorProfile || { firstName: 'Hocam' }, 'named'))
          // When first_message override is active the agent speaks it and onMessage
          // adds the bubble once. Seeding here caused the doubled first text.
          // Fallback path (no override): seed personalized greeting in UI only.
          if (!includeFirstMessage) {
            addMsg("ai", firstMessage)
          }
        },
        onDisconnect: (details) => {
          sureTimerlariTemizle()
          setSureUzatmaGoster(false)
          if (details.reason === "error") {
            const msg = details.message || ""
            if (usedFirstMessage && !retriedWithoutFirst && isFirstMessageOverrideError(msg)) {
              void scheduleRetryWithoutFirst()
              return
            }
            conversationRef.current = null
            setErrorMsg(connectionErrorHelp(msg))
            setStatus("error")
          } else {
            conversationRef.current = null
            setStatus("idle")
          }
        },
        onError: (message) => {
          if (usedFirstMessage && !retriedWithoutFirst && isFirstMessageOverrideError(message || "")) {
            void scheduleRetryWithoutFirst()
            return
          }
          setErrorMsg(connectionErrorHelp(message))
          setStatus("error")
        },
        onMessage: ({ message, role }) => {
          if (role !== "user" && skipNextAgentTranscript) {
            skipNextAgentTranscript = false
            return
          }
          addMsg(role === "user" ? "user" : "ai", message)
        },
        onModeChange: ({ mode }) => {
          setStatus(mode === "speaking" ? "speaking" : "listening")
        },
        onStatusChange: ({ status: sdkStatus }) => {
          if (sdkStatus === "connecting") setStatus("connecting")
          if (sdkStatus === "connected") setStatus("listening")
        },
      })
      conversationRef.current = conversation
    }

    try {
      await begin(tryFirst ? true : false)
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      if (tryFirst && isFirstMessageOverrideError(raw) && !retriedWithoutFirst) {
        await scheduleRetryWithoutFirst()
        return
      }
      setErrorMsg(connectionErrorHelp(raw))
      setStatus("error")
      conversationRef.current = null
    }
  }

  async function kartiYukle(hastaId: string, oneriId: string) {
    try {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const r = await fetch(`/api/doktor/eylem?hastaId=${encodeURIComponent(hastaId)}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      const j = (await r.json()) as { oneriler?: EylemOneriGorunumu[]; hasta?: EylemHasta }
      const oneri = (j.oneriler || []).find((o) => o.id === oneriId) || (j.oneriler || [])[0]
      if (oneri && j.hasta) setSesKarti({ oneri, hasta: j.hasta })
    } catch { /* kart yoksa ses özeti yine durur */ }
  }

  async function stopConversation() {
    await endConversation()
  }

  function switchPersona(key: PersonaId) {
    void stopConversation()
    setPersonaKey(key)
    setPersona(PERSONAS[key])
    setMessages([])
    messagesRef.current = []
    setErrorMsg("")
    setSesKarti(null)
    sesEylemRef.current = null
    try {
      localStorage.setItem('notya_asistan_persona', key)
    } catch { /* ignore */ }
  }

  const isActive = ["connecting", "listening", "speaking"].includes(status)
  const statusLabel = {
    idle:       "Konuşmayı başlatmak için dokunun",
    connecting: "Bağlanıyor...",
    listening:  "Dinliyor — konuşabilirsiniz",
    speaking:   `${formatColleagueTabLabel(persona.name)} konuşuyor...`,
    error:      "Tekrar deneyin",
  }[status]

  return (
    <div style={{ height: "100dvh", minHeight: 0, background: CHROME_RENK.cream, display: "flex", flexDirection: isMobile ? "column" : "row",
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
      <div style={{ padding: "12px 16px", paddingTop: "calc(16px + env(safe-area-inset-top, 0px))", borderBottom: `1px solid ${CHROME_RENK.border}`, background: "#faf6ee", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div onClick={() => { void stopConversation(); router.push("/dashboard/doktor") }}
            style={{ color: CHROME_RENK.muted, cursor: "pointer", fontSize: "24px", padding: "6px 8px", flexShrink: 0, lineHeight: 1 }}>‹</div>
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
                          color: msg.role === "user" ? "#fff" : CHROME_RENK.ink }}>
              {msg.text}
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
            onSonuc={() => {
              sesEylemRef.current = null
              setSesKarti(null)
            }}
          />
        </div>
      )}

      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column",
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
          {status === 'idle' || status === 'error' ? (
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
      <YaziliSohbet personaId={personaKey} personaAdi={persona.shortName} />
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes wave1{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}@keyframes wave2{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.4)}}`}</style>
    </div>
      </div>
  )
}
