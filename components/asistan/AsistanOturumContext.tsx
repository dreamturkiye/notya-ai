"use client"

/**
 * NOTYA-ASISTAN-YUZEN-01 (Kaan, 2026-09-26) — "doktor asistanla çalışırken başka sayfaya gidince asistan
 * KAPANMAMALI; doktor kendisi kapatana kadar oturum ve konuşma sürer."
 *
 * Asistan oturumunun TEK sahibi burası: ElevenLabs konuşma nesnesi, sesli mesajlar, seçili persona, tek beyin
 * oturumu + ses-ekran yoklaması, hasta_bul / ses-eylem araçları, süre sayaçları ve yazılı sohbet. Provider
 * app/layout.tsx'te bütün sayfaları sarar; istemci tarafı sayfa geçişinde unmount olmaz — ses ve mesajlar yaşar.
 * /asistan sayfası ve AsistanYuzenPanel bu context'in görünümleridir; ikisi de oturum AÇMAZ.
 * Mantık app/asistan/page.tsx'ten birebir taşındı — endpoint'ler, onay kartları ve tek beyin ekran biçimi aynı.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Conversation } from "@/components/AsistanConversation"
import { connectionErrorHelp, micPermissionHelp, isAndroid } from "@/lib/asistan/platform"
import {
  PERSONAS,
  buildVoiceSystemPrompt,
  resolveOpeningPersonaId,
  type Persona,
  type PersonaId,
} from "@/lib/asistan/personaEngine"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"
import { ensureDoctorAccessToken, isOnboardingDone } from "@/lib/doktor/clientAuth"
import { address } from '@/lib/address'
import { asistanYanitiCoz } from '@/lib/asistan/yanitCoz'
import type { EylemHasta, EylemOneriGorunumu } from '@/components/core/EylemKarti'
import type { SesDurumu } from '@/lib/asistan/yuzenPanel'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'
import { DEVAM_ISARETI } from '@/lib/asistan/konusma'

export type ConvStatus = SesDurumu
/** sira: sesli ve yazılı mesajları yüzen panelde tek zaman çizgisinde sıralamak için. */
export type Message = { id: string; role: "user" | "ai"; text: string; sira: number }

// NOTYA-EYLEM: cards ride ON the assistant message. This surface has no patientId on the client —
// the patient is resolved server-side from free text — so both the proposal ids and the header name
// come back from the route; the client never picks a patient for a write.
export interface Yonlendirme { metin: string; etiket: string | null; yol: string | null }
export interface YaziliMesaj { rol: 'doktor' | 'asistan'; icerik: string; oneriler?: EylemOneriGorunumu[]; hasta?: EylemHasta; yonlendirme?: Yonlendirme | null; sira: number }

interface TanimaSonucu { isFinal: boolean; 0: { transcript: string } }
interface TanimaOlayi { resultIndex: number; results: { length: number; [i: number]: TanimaSonucu } }
interface Tanima {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: TanimaOlayi) => void) | null; onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
}

type ActiveConversation = Awaited<ReturnType<typeof Conversation.startSession>>

export type HazirlaSonucu = "tamam" | "giris" | "onboarding"

export interface AsistanOturumDegeri {
  persona: Persona
  personaKey: PersonaId
  status: ConvStatus
  isActive: boolean
  messages: Message[]
  errorMsg: string
  sureUzatmaGoster: boolean
  sesKarti: { oneri: EylemOneriGorunumu; hasta: EylemHasta } | null
  ortakOturumId: string | null
  /** /asistan açılışı: jeton + profil + açılış meslektaşı. Yönlendirme kararını sayfaya bırakır. */
  hazirla: () => Promise<HazirlaSonucu>
  startConversation: () => Promise<void>
  stopConversation: () => Promise<void>
  switchPersona: (key: PersonaId) => void
  sureUzat: (dk: number) => void
  sesKartiniKapat: () => void
  yazili: {
    acik: boolean
    mesajlar: YaziliMesaj[]
    girdi: string
    bekliyor: boolean
    dinliyor: boolean
    aktifHasta: string | null
  }
  setYaziliAcik: (acik: boolean) => void
  setYaziliGirdi: (g: string | ((onceki: string) => string)) => void
  yaziliGonder: () => Promise<void>
  yaziliMikrofon: () => void
  /** Yüzen paneldeki "Kapat": sesi bitirir, yazılı sohbeti kapatır, oturumun bütün durumunu temizler. */
  oturumuKapat: () => Promise<void>
}

const AsistanOturumContext = createContext<AsistanOturumDegeri | null>(null)

export function useAsistanOturum(): AsistanOturumDegeri {
  const d = useContext(AsistanOturumContext)
  if (!d) throw new Error("useAsistanOturum, AsistanOturumProvider içinde kullanılmalı")
  return d
}

export function AsistanOturumProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState<PersonaId>("aysekaya")
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const authTokenRef = useRef<string | null>(null)
  const personaKeyRef = useRef<PersonaId>("aysekaya")
  const doctorRef = useRef<ReturnType<typeof toAddressableUser> | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<ReturnType<typeof toAddressableUser> | null>(null)
  const conversationRef = useRef<ActiveConversation | null>(null)
  /** NOTYA-OGRENME-03: addMsg ile eş zamanlı tutulur — endConversation()'ın kullandığı kapanışlar
   *  React state'in bayat bir kopyasını görebilir; ref her zaman güncel. */
  const messagesRef = useRef<Message[]>([])
  /** Sesli + yazılı mesajların ortak sıra sayacı (yüzen panelin zaman çizgisi). */
  const siraRef = useRef(0)
  const siradaki = () => ++siraRef.current
  /** Açılış meslektaşı yalnız ilk açılışta çözülür — /asistan'a dönüş seçili personayı ezmez. */
  const personaHazirRef = useRef(false)
  /** Last voice-prepared öneri — eylem_onayla / vazgec use this when the agent omits oneriId. */
  const sesEylemRef = useRef<{ oneriId: string; hastaId: string } | null>(null)
  const sureUyariRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sureSonRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sureBaslangicRef = useRef<number>(0)
  const sureHedefDkRef = useRef<number>(60)
  const sureHitapRef = useRef<string>("Hocam")
  const [sureUzatmaGoster, setSureUzatmaGoster] = useState(false)
  const [sesKarti, setSesKarti] = useState<{ oneri: EylemOneriGorunumu; hasta: EylemHasta } | null>(null)
  /** NOTYA-TEK-BEYIN: yazılı sohbet ile sesin ORTAK asistan oturumu — tek konuşma, tek aktif hasta. */
  const [ortakOturumId, setOrtakOturumId] = useState<string | null>(null)
  /** Tek beyinli sesli görüşme sürerken: oturum + ses-ekran yoklamasının imleci (sunucu saati). */
  const tekBeyinRef = useRef<{ oturumId: string; sonra: string } | null>(null)
  const yoklamaRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sesKartiIdRef = useRef<string | null>(null)
  /**
   * NOTYA-SES-DEVAM-01: the hidden continuation turn. `mod` mirrors the SDK's speaking/listening mode; `doktorSozu`
   * / `ajanSustu` are the last doctor transcript and the last time Ayşe stopped speaking (the doctor interrupting
   * after the cut cancels the continuation); `gonderilen` holds turn keys already sent or cancelled (once per turn).
   */
  const sesDevamRef = useRef<{ mod: "speaking" | "listening"; doktorSozu: number; ajanSustu: number; gonderilen: Set<string> }>({
    mod: "listening", doktorSozu: 0, ajanSustu: 0, gonderilen: new Set(),
  })
  const SURE_TAVAN_DK = 120 // ElevenLabs platform sınırı 7200 sn — agent config'te de bu değere çekildi

  // NOTYA-KADEME-01 — yazılı sohbet (components/asistan/YaziliSohbet.tsx'ten taşındı; görünüm orada kaldı).
  const [yaziliAcik, setYaziliAcik] = useState(false)
  const [yaziliMesajlar, setYaziliMesajlar] = useState<YaziliMesaj[]>([])
  const [yaziliGirdi, setYaziliGirdi] = useState('')
  const [yaziliBekliyor, setYaziliBekliyor] = useState(false)
  const [yaziliDinliyor, setYaziliDinliyor] = useState(false)
  const [aktifHasta, setAktifHasta] = useState<string | null>(null)
  const tanimaRef = useRef<Tanima | null>(null)

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

  // Opening colleague: branch doctors (KD → Fatma) ignore stale localStorage Ayşe.
  async function hazirla(): Promise<HazirlaSonucu> {
    let token = await ensureDoctorAccessToken()
    if (!token) return "giris"
    authTokenRef.current = token
    setAuthToken(token)

    let resp = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Expired access token without reliable expires_at — refresh once, then login.
    if (resp.status === 401) {
      token = await ensureDoctorAccessToken({ forceRefresh: true })
      if (!token) return "giris"
      authTokenRef.current = token
      setAuthToken(token)
      resp = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.status === 401) return "giris"
    }
    const profileData = await resp.json().catch(() => ({} as { data?: DoctorProfile }))
    if (!isOnboardingDone(profileData.data)) return "onboarding"
    const doktor = toAddressableUser(profileData.data as DoctorProfile)
    doctorRef.current = doktor
    setDoctorProfile(doktor)
    if (personaHazirRef.current) return "tamam"
    personaHazirRef.current = true
    let secili: string | null = null
    try { secili = localStorage.getItem('notya_asistan_persona') } catch { /* ignore */ }
    const acilis = resolveOpeningPersonaId(
      (profileData.data as { specialty?: string } | undefined)?.specialty,
      secili,
    )
    personaKeyRef.current = acilis
    setPersonaKey(acilis)
    setPersona(PERSONAS[acilis])
    try {
      if (secili !== acilis) localStorage.setItem('notya_asistan_persona', acilis)
    } catch { /* ignore */ }
    return "tamam"
  }

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
    if (role === "user" && trimmed === DEVAM_ISARETI) return // NOTYA-SES-DEVAM-01: gizli devam turu baloncuk değildir
    setMessages((prev) => {
      // Guard against connect-seed + agent transcript of the same greeting.
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.text === trimmed) return prev
      const next = [...prev, { id: `${Date.now()}-${Math.random()}`, role, text: trimmed, sira: siradaki() }]
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
    // NOTYA-TEK-BEYIN: tek beyinli seste her tur sunucuda, yazılı sohbetle aynı yoldan öğrenilir — ikinci kez yollanmaz.
    if (tekBeyinRef.current) return
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
    yoklamayiDurdur()
    setStatus("idle")
  }

  /**
   * NOTYA-TEK-BEYIN: sesli Ayşe yalnız kısa sözlü biçimi konuşur; tam cevap (liste, tablo, kimlik değerleri) ve
   * onay kartları ortak oturuma yazılır. Görüşme sürerken burada hafifçe yoklanır ve baloncuğa / karta taşınır.
   */
  async function ekranYokla() {
    const tb = tekBeyinRef.current
    if (!tb) return
    try {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const r = await fetch(`/api/asistan/ses-ekran?oturum=${encodeURIComponent(tb.oturumId)}&sonra=${encodeURIComponent(tb.sonra)}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (!r.ok || tekBeyinRef.current !== tb) return
      const j = (await r.json()) as { turlar?: { zaman: string; metin: string; kartlar: string[]; hastaId: string | null }[]; bekleyen?: string[]; devam?: boolean; devamAnahtar?: string | null }
      for (const tur of j.turlar || []) {
        if (tur.zaman > tb.sonra) tb.sonra = tur.zaman
        addMsg("ai", tur.metin)
        if (tur.kartlar?.length && tur.hastaId) void kartiYukle(tur.hastaId, tur.kartlar[tur.kartlar.length - 1])
      }
      if (j.devam && j.devamAnahtar) sesDevamiIste(j.devamAnahtar)
      // Sesle onaylanan / vazgeçilen kart artık bekleyen değil → kapat.
      if (sesKartiIdRef.current && Array.isArray(j.bekleyen) && !j.bekleyen.includes(sesKartiIdRef.current)) {
        sesKartiIdRef.current = null
        setSesKarti(null)
      }
    } catch { /* yoklama kritik değil — bir sonraki turda tekrar */ }
  }

  /**
   * NOTYA-SES-DEVAM-01 (Dr. Gökhan: "özet yarıda kesilmesin"): the voice turn closed at the cap / guard before the
   * answer was fully said; the screen answer is now complete and the server holds the rest. Once Ayşe has stopped
   * speaking, send the hidden [devam] turn — exactly once per turn key. If she is still speaking, the next poll
   * re-checks. If the doctor spoke after she stopped, the doctor moved on: the continuation is dropped.
   */
  function sesDevamiIste(anahtar: string) {
    const d = sesDevamRef.current
    const conv = conversationRef.current
    if (!conv || d.gonderilen.has(anahtar) || d.mod === "speaking") return
    d.gonderilen.add(anahtar)
    if (d.doktorSozu > d.ajanSustu) return
    try { conv.sendUserMessage(DEVAM_ISARETI) } catch { /* bağlantı kapandıysa devam yok */ }
  }

  function yoklamayiBaslat() {
    if (yoklamaRef.current) clearInterval(yoklamaRef.current)
    yoklamaRef.current = setInterval(() => { void ekranYokla() }, 1500)
  }

  function yoklamayiDurdur() {
    if (yoklamaRef.current) { clearInterval(yoklamaRef.current); yoklamaRef.current = null }
    // Son turun ekranını da al, sonra bu görüşmenin imlecini bırak (yeni görüşme kendi imlecini kurmuş olabilir).
    const tb = tekBeyinRef.current
    if (tb) void ekranYokla().finally(() => { if (tekBeyinRef.current === tb) tekBeyinRef.current = null })
  }

  function isFirstMessageOverrideError(msg: string): boolean {
    // Narrow match: the prior broad "Override for field" also caught voice/prompt
    // failures and restarted a second session on the same mic → broken speech (Ayşe).
    return /first[_ ]?message/i.test(msg || "")
  }

  async function fetchSignedUrl(p: Persona): Promise<{ signedUrl: string; voiceId: string; tekBeyin: { oturumId: string; jeton: string; baslangic: string } | null }> {
    const token = authTokenRef.current
    if (!token) throw new Error("Oturum bulunamadı")
    const oturumParam = ortakOturumId ? `&asistanSessionId=${encodeURIComponent(ortakOturumId)}` : ""
    const resp = await fetch(
      `/api/asistan/signed-url?specialty=${p.primarySpecialty}&persona=${p.id}${oturumParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
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
      // NOTYA-TEK-BEYIN: yalnız bayraktaki doktorda gelir; yoksa eski sesli akış birebir sürer.
      tekBeyin: body.tek_beyin && body.notya_jeton && body.asistan_session_id
        ? { oturumId: String(body.asistan_session_id), jeton: String(body.notya_jeton), baslangic: String(body.baslangic || new Date().toISOString()) }
        : null,
    }
  }

  async function startConversation() {
    if (!authTokenRef.current) {
      const sonuc = await hazirla()
      if (sonuc === "giris") { router.push("/giris"); return }
      if (sonuc === "onboarding") { router.push("/onboarding?p=doktor"); return }
    }
    if (!authTokenRef.current) { router.push("/giris"); return }
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
      const doctor = doctorRef.current || doctorProfile || toAddressableUser(null)
      const p = PERSONAS[personaKeyRef.current] || PERSONAS[personaKey]
      // NOTYA-OGRENME-03: sesli Ayşe de meslektaş hafızasını okur — 5+ seansta kendini
      // tanıtmayı bırakır, bildiklerini promptta taşır. Başarısızlıkta eski davranış.
      let hafiza: { karsilama?: { tanit: boolean; onSoz: string }; sesBlogu?: string; gun?: { metin: string; blok: string } | null } = {}
      try {
        const hr = await fetch("/api/doktor/hafiza", { headers: { Authorization: `Bearer ${authTokenRef.current}` } })
        if (hr.ok) hafiza = await hr.json()
      } catch { /* hafıza kritik değil */ }
      const firstMessage = `Merhaba ${address(doctor || { firstName: 'Hocam' }, 'named')}. Nasıl yardımcı olabilirim?`
      const voicePrompt = buildVoiceSystemPrompt(p, doctor, [hafiza.sesBlogu, hafiza.gun?.blok].filter(Boolean).join("\n\n") || undefined)
      const { signedUrl, voiceId, tekBeyin } = await fetchSignedUrl(p)
      if (tekBeyin) {
        tekBeyinRef.current = { oturumId: tekBeyin.oturumId, sonra: tekBeyin.baslangic }
        setOrtakOturumId(tekBeyin.oturumId)
      }

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
          notyaJeton: tekBeyin?.jeton,
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
      /** NOTYA-TEK-BEYIN: imzalı konuşma jetonu → Custom LLM extra body; varken tarayıcı araçları kullanılmaz. */
      notyaJeton?: string
    }
  ) {
    const tekBeyin = Boolean(opts?.notyaJeton)
    let doktorKonustu = false
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
        // NOTYA-TEK-BEYIN: ElevenLabs bunu her LLM isteğinde elevenlabs_extra_body olarak /api/asistan/ses-llm'e taşır.
        ...(tekBeyin ? { customLlmExtraBody: { notya_jeton: opts?.notyaJeton } } : {}),
        // Kaan (2026-09-14): "Ayşe Hocam bana fırça attı, dosyalara giremiyorum diyor" —
        // sesli Ayşe'nin gerçekten hasta dosyasına erişimi yoktu (yazılı sohbette vardı).
        // ElevenLabs client tool: doktor bir hasta adı söylediğinde agent bunu çağırır,
        // tarayıcı doktorun kendi oturum belirtecinle /api/asistan/hasta-bul'u sorgular.
        //
        // NOTYA-EYLEM-19 — dosyaya kayıt HAZIRLAMA + sözlü onay. Bu araçlar klinik tabloya
        // yazmaz: /api/asistan/ses-eylem yalnız taslak açar veya eylemOnayla omurgasını çağırır.
        // Canlı ElevenLabs ajanına araç şeması Kaan tarafından yapıştırılmalı (docs/README_EYLEM.md).
        // NOTYA-TEK-BEYIN: tek beyinli seste hasta arama, kart hazırlama ve sözlü onay sunucuda — tarayıcı aracı yok.
        clientTools: tekBeyin ? {} : {
          hasta_bul: async (params: { isim?: string }) => {
            try {
              const t = await ensureDoctorAccessToken()
              const r = await fetch("/api/asistan/hasta-bul", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                body: JSON.stringify({ isim: params?.isim || "" }),
              })
              const j = await r.json()
              // NOTYA-BETA-0925: kimlik / iletişim değerleri (anne-baba adı, telefon…) yalnız ekrana yazılır;
              // ajana dönen `sonuc` bu değerleri taşımaz.
              if (j.ekran) addMsg("ai", String(j.ekran))
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
          if (tekBeyin) yoklamayiBaslat()
        },
        onDisconnect: (details) => {
          sureTimerlariTemizle()
          if (tekBeyin) yoklamayiDurdur()
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
          if (role === "user" && String(message || "").trim() === DEVAM_ISARETI) return
          if (role === "user") sesDevamRef.current.doktorSozu = Date.now()
          if (role === "user" && asistaniKapatMi(message)) {
            addMsg("user", message)
            void endConversation()
            return
          }
          if (role !== "user" && skipNextAgentTranscript) {
            skipNextAgentTranscript = false
            return
          }
          // NOTYA-TEK-BEYIN: açılış selamından sonra Ayşe'nin baloncuğu sözlü kısa biçim değil, ekran biçimidir (ekranYokla).
          if (tekBeyin) {
            if (role === "user") doktorKonustu = true
            else if (doktorKonustu) return
          }
          addMsg(role === "user" ? "user" : "ai", message)
        },
        onModeChange: ({ mode }) => {
          const d = sesDevamRef.current
          if (d.mod === "speaking" && mode !== "speaking") d.ajanSustu = Date.now()
          d.mod = mode === "speaking" ? "speaking" : "listening"
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
      if (oneri && j.hasta) {
        sesKartiIdRef.current = oneri.id
        setSesKarti({ oneri, hasta: j.hasta })
      }
    } catch { /* kart yoksa ses özeti yine durur */ }
  }

  async function stopConversation() {
    await endConversation()
  }

  function sesKartiniKapat() {
    sesEylemRef.current = null
    setSesKarti(null)
  }

  function switchPersona(key: PersonaId) {
    void stopConversation()
    personaKeyRef.current = key
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

  // NOTYA-GUN-01: panel açılınca Ayşe ilk sözü söyler — günün durumu (randevu, onaysız not, mesaj).
  // Sohbet geçmişine 'asistan' baloncuğu olarak girer; sunucuya gönderilmez (prompt zaten biliyor).
  useEffect(() => {
    if (!yaziliAcik || yaziliMesajlar.length > 0) return
    let iptal = false
    ;(async () => {
      try {
        const token = await ensureDoctorAccessToken()
        const r = await fetch('/api/doktor/hafiza', { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok) return
        const j = await r.json()
        const metin = j?.gun?.metin as string | undefined
        if (metin && !iptal) setYaziliMesajlar((m) => (m.length === 0 ? [{ rol: 'asistan', icerik: metin, sira: siradaki() }] : m))
      } catch { /* açılış kritik değil */ }
    })()
    return () => { iptal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yaziliAcik])

  function yaziliMikrofon() {
    if (yaziliDinliyor) { try { tanimaRef.current?.stop() } catch { /* sessiz */ } setYaziliDinliyor(false); return }
    const w = window as unknown as { webkitSpeechRecognition?: new () => Tanima; SpeechRecognition?: new () => Tanima }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) { setYaziliGirdi('(Bu tarayıcı sesli girişi desteklemiyor — yazarak sorun.)'); return }
    const t = new Ctor()
    t.lang = 'tr-TR'
    t.continuous = true
    t.interimResults = true
    t.onresult = (e) => {
      let son = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) son += e.results[i][0].transcript
      }
      if (son) setYaziliGirdi((g) => (g ? g + ' ' : '') + son.trim())
    }
    t.onend = () => setYaziliDinliyor(false)
    t.onerror = () => setYaziliDinliyor(false)
    tanimaRef.current = t
    t.start()
    setYaziliDinliyor(true)
  }

  async function yaziliGonder() {
    const metin = yaziliGirdi.trim()
    if (!metin || yaziliBekliyor) return
    try { tanimaRef.current?.stop() } catch { /* sessiz */ }
    setYaziliDinliyor(false)
    setYaziliGirdi('')
    setYaziliAcik(true)
    const ekle = (m: Omit<YaziliMesaj, 'sira'>) => setYaziliMesajlar((onceki) => [...onceki, { ...m, sira: siradaki() }])
    ekle({ rol: 'doktor', icerik: metin })
    setYaziliBekliyor(true)
    const personaAdi = persona.shortName
    try {
      const token = await ensureDoctorAccessToken()
      const r = await fetch('/api/asistan/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: metin, personaId: personaKey, asistanSessionId: ortakOturumId }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `${personaAdi} yanıt veremedi.`)
      const veri = d.data && typeof d.data === 'object' ? d.data : d
      // The route answers in data.speech (F3: the panel read response/message and showed "Yanıt alınamadı." for every answer).
      // Parsed once more as a guard so a JSON-shaped text can never reach the bubble.
      const cevap = asistanYanitiCoz(String(veri.speech || veri.response || veri.message || veri.cevap || '')).speech
      if (veri.asistanSessionId) setOrtakOturumId(String(veri.asistanSessionId))
      if (veri.aktifHasta) setAktifHasta(String(veri.aktifHasta))
      // NOTYA-EYLEM-24: Ayşe bir şeyi bu yoldan yapmıyorsa (reçete, tanı, hasta açma) cümlesi
      // baloncukta; ilgili ekranın bağlantısı burada, baloncuğun altında tek satır.
      ekle({ rol: 'asistan', icerik: cevap || 'Yanıt alınamadı.', oneriler: (veri.eylemOnerileri as EylemOneriGorunumu[]) || [], hasta: (veri.eylemHastasi as EylemHasta) || undefined, yonlendirme: (veri.eylemYonlendirme as Yonlendirme) || null })
    } catch (e) {
      ekle({ rol: 'asistan', icerik: e instanceof Error ? e.message : `${personaAdi} yanıt veremedi.` })
    } finally {
      setYaziliBekliyor(false)
    }
  }

  async function oturumuKapat() {
    await endConversation()
    sureTimerlariTemizle()
    setSureUzatmaGoster(false)
    setMessages([])
    messagesRef.current = []
    setErrorMsg("")
    sesKartiniKapat()
    sesKartiIdRef.current = null
    setOrtakOturumId(null)
    try { tanimaRef.current?.stop() } catch { /* sessiz */ }
    setYaziliDinliyor(false)
    setYaziliAcik(false)
    setYaziliMesajlar([])
    setYaziliGirdi('')
    setAktifHasta(null)
  }

  const isActive = ["connecting", "listening", "speaking"].includes(status)

  const deger: AsistanOturumDegeri = {
    persona,
    personaKey,
    status,
    isActive,
    messages,
    errorMsg,
    sureUzatmaGoster,
    sesKarti,
    ortakOturumId,
    hazirla,
    startConversation,
    stopConversation,
    switchPersona,
    sureUzat,
    sesKartiniKapat,
    yazili: { acik: yaziliAcik, mesajlar: yaziliMesajlar, girdi: yaziliGirdi, bekliyor: yaziliBekliyor, dinliyor: yaziliDinliyor, aktifHasta },
    setYaziliAcik,
    setYaziliGirdi,
    yaziliGonder,
    yaziliMikrofon,
    oturumuKapat,
  }

  return <AsistanOturumContext.Provider value={deger}>{children}</AsistanOturumContext.Provider>
}
