"use client"

/**
 * NOTYA-ASISTAN-YUZEN-01 (Kaan, 2026-09-26) — "doktor asistanla çalışırken başka sayfaya gidince asistan
 * KAPANMAMALI; doktor kendisi kapatana kadar oturum ve konuşma sürer."
 *
 * Asistan oturumunun TEK sahibi burası: ElevenLabs konuşma nesnesi, sesli mesajlar, seçili persona, tek beyin
 * oturumu + ses-ekran yoklaması, hasta_bul / ses-eylem araçları, süre sayaçları ve yazılı sohbet. Provider
 * app/layout.tsx'te bütün sayfaları sarar; istemci tarafı sayfa geçişinde unmount olmaz — ses ve mesajlar yaşar.
 * NOTYA-ASISTAN-GECMIS-01: son 50 sıra localStorage'da (persona başına FIFO); mikrofona yeniden dokunmak / sayfaya
 * dönmek geçmişi silmez — WhatsApp gibi.
 * /asistan sayfası ve AsistanYuzenPanel bu context'in görünümleridir; ikisi de oturum AÇMAZ.
 * Mantık app/asistan/page.tsx'ten birebir taşındı — endpoint'ler, onay kartları ve tek beyin ekran biçimi aynı.
 *
 * NOTYA-SES-ELEVEN-GERI-01 (Kaan, 2026-10-02): Ayşe Kaya de ElevenLabs'le konuşur (Fish öncesi gibi). Fish yolu
 * (mic ASR + Haberci TTS, startFishOturumu) yalnız AYSE_SES_SAGLAYICI=fish iken açılır (lib/asistan/sesSaglayici.ts).
 */

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Conversation } from "@/components/AsistanConversation"
import { connectionErrorHelp, micPermissionHelp } from "@/lib/asistan/platform"
import {
  PERSONAS,
  buildVoiceSystemPrompt,
  resolveOpeningPersonaId,
  type Persona,
  type PersonaId,
} from "@/lib/asistan/personaEngine"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"
import { ensureDoctorAccessToken, isOnboardingDone } from "@/lib/doktor/clientAuth"
import { tarayiciSaatDilimi } from "@/lib/doktor/selam"
import { address } from '@/lib/address'
import { asistanYanitiCoz } from '@/lib/asistan/yanitCoz'
import type { EylemHasta, EylemOneriGorunumu } from '@/components/core/EylemKarti'
import { sayfaHastaId, type SesDurumu } from '@/lib/asistan/yuzenPanel'
import { SES_CALAR } from '@/lib/asistan/sesCalar'
import { fishBirlestir, fishCalarOlustur, fishYeniCumleler, type FishCalar } from '@/lib/asistan/fishCalar'
import { fishAkisAc, fishAkisKapat, fishAsrDosyaAdi, fishBirTurKaydet, fishDinleBaglamAc, fishVadGunlukSifirla, wavBirlestir, type FishKlip } from '@/lib/asistan/fishMikrofon'
import { klipGeldi, sesBasladi, sttGeldi, turBitti, turSirasiBaslat, yarimKaldi, type TurSirasi } from '@/lib/asistan/fishTurSirasi'
import { fishAsrDilUyumluMu } from '@/lib/asistan/fishSes'
import { ayseFishIstemcideMi } from '@/lib/asistan/sesSaglayici'
import { sileroAc, type SileroKapi } from '@/lib/asistan/fishSilero'
import { KelimeKesici, base64Pcm, sesDusKesimi, sesDusOfseti } from '@/lib/asistan/fishWs'

/** NOTYA-SES-1TO1: client-side ceilings for one Fish turn; the server has its own 20 s / 60 s limits. */
const FISH_TUR_ISTEMCI_MS = 55_000
/** NOTYA-FISH-WS-02: `ses_hazir` but no `ses` chunk this long after the first `soz` → REST for the rest of the turn. */
const FISH_WS_ILK_SES_MS = 2500
const FISH_ASR_HATA = "Sesinizi çözemedim Hocam, tekrar söyler misiniz?"
const FISH_ASR_UZUN = "Kayıt çok uzun oldu Hocam, daha kısa söyler misiniz?"
const FISH_TUR_HATA = "Şu an cevap veremiyorum Hocam, bir daha sorar mısınız?"
const FISH_TTS_HATA = "Sesim kesildi Hocam — cevap ekranınızda, dinlemeye devam ediyorum."
const FISH_OTURUM_HATA = "Oturum doğrulanamadı Hocam, yeniden deniyorum."
const FISH_MIK_HATA = "Mikrofona ulaşamıyorum Hocam, seansı kapattım — mikrofona dokunup yeniden başlatın."
import { kendiSelamiMi, acilisAjanSozuMu } from '@/lib/asistan/acilis'
import { sesGurultusuMu } from '@/lib/asistan/sesGurultu'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'
import { DEVAM_ISARETI } from '@/lib/asistan/konusma'
import { sohbetMaxSira, sohbetOku, sohbetYaz, type SakliYaziliMesaj } from '@/lib/asistan/sohbetGecmisi'
import { cevapEkle, kullaniciEkle } from '@/lib/asistan/balonSirasi'

const SESSIZ_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

/** iOS only lets the agent's voice out if play() succeeds inside the tap.
 *  The SDK plays later, after the microphone prompt, so the first session stays
 *  silent. The next start works because the site is then allowed to play.
 *  Must run before any await. */
function sesiDokunustaAc(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const audio = new Audio(SESSIZ_WAV)
    audio.setAttribute("playsinline", "true")
    ;(audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
    void audio.play()
  } catch { /* bağlanır, ses çıkmasa da oturum sürer */ }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    const ctx = new AC()
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export type ConvStatus = SesDurumu
/** sira: sesli ve yazılı mesajları yüzen panelde tek zaman çizgisinde sıralamak için. */
export type Message = { id: string; role: "user" | "ai"; text: string; sira: number; olay?: number }

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
  /** NOTYA-FISH-AYSE-02: Ayşe is a full Fish call — no ElevenLabs websocket. */
  const fishRef = useRef<FishCalar | null>(null)
  const fishAcikRef = useRef(false)
  const fishMicRef = useRef<MediaStream | null>(null)
  const fishYakalaRef = useRef<AudioContext | null>(null)
  /** NOTYA-SILERO-01: Silero VAD bound to the mic stream; null → RMS gate. */
  const fishSileroRef = useRef<SileroKapi | null>(null)
  const fishDinleNesilRef = useRef(0)
  const fishTurAbortRef = useRef<AbortController | null>(null)
  /** NOTYA-SES-TUR-01: the live listen loop's turn sequencer — the player reports "answer audio started" here. */
  const fishSiraRef = useRef<{ sesBasladi: () => void } | null>(null)
  /** Text already handed to Fish, and the agent event of the answer now playing. */
  const fishSozRef = useRef("")
  const fishBirikimRef = useRef("")
  const fishCevapOlayRef = useRef(0)
  /** NOTYA-OGRENME-03: addMsg ile eş zamanlı tutulur — endConversation()'ın kullandığı kapanışlar
   *  React state'in bayat bir kopyasını görebilir; ref her zaman güncel. */
  const messagesRef = useRef<Message[]>([])
  const yaziliMesajlarRef = useRef<YaziliMesaj[]>([])
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
  const sesDevamRef = useRef<{ mod: "speaking" | "listening"; doktorSozu: number; ajanSustu: number; gonderilen: Set<string>; bekleyen: { anahtar: string; kalan: string } | null }>({
    mod: "listening", doktorSozu: 0, ajanSustu: 0, gonderilen: new Set(), bekleyen: null,
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

  // NOTYA-ASISTAN-GECMIS-01: persona değişince (açılış / sekme) son 50 sırayı yükle.
  // sohbetAtlaYazRef: yükleme sonrası ilk persist turunu atla — boş state ile depoyu silme.
  const sohbetAtlaYazRef = useRef(true)
  useEffect(() => {
    const g = sohbetOku(personaKey)
    sohbetAtlaYazRef.current = true
    setMessages(g.ses)
    messagesRef.current = g.ses
    const yazili: YaziliMesaj[] = g.yazili.map((m) => ({ rol: m.rol, icerik: m.icerik, sira: m.sira }))
    setYaziliMesajlar(yazili)
    yaziliMesajlarRef.current = yazili
    siraRef.current = sohbetMaxSira(g)
  }, [personaKey])

  // Her balon değişiminde FIFO 50 ile kalıcı yaz.
  useEffect(() => {
    yaziliMesajlarRef.current = yaziliMesajlar
    if (sohbetAtlaYazRef.current) {
      sohbetAtlaYazRef.current = false
      return
    }
    const yazili: SakliYaziliMesaj[] = yaziliMesajlar.map((m) => ({ rol: m.rol, icerik: m.icerik, sira: m.sira }))
    const kirp = sohbetYaz(personaKeyRef.current, messages, yazili)
    if (kirp.ses.length !== messages.length) {
      setMessages(kirp.ses)
      messagesRef.current = kirp.ses
    }
    if (kirp.yazili.length !== yazili.length) {
      const y: YaziliMesaj[] = kirp.yazili.map((m) => ({ rol: m.rol, icerik: m.icerik, sira: m.sira }))
      setYaziliMesajlar(y)
      yaziliMesajlarRef.current = y
    }
  }, [messages, yaziliMesajlar])


  /**
   * NOTYA-SAYFA-HASTA-01 (Dr. Gökhan canlı vaka, Kaan kuralı, 2026-09-26): the assistant follows the doctor. Opening a
   * patient's page is an explicit focus signal, equal to naming the patient; the most recent explicit signal wins.
   * Sent ONCE per navigation into a patient's pages (not per message — NOTYA-HASTA-ODAK-01). No voice announcement:
   * the panel's "aktif hasta" is the signal; Ayşe's next turn reads the new focus and says the name first.
   * `onceki` = the page patient last seen (undefined before the first render); `bekleyen` = a page switch that has not
   * reached a shared session yet (consumed when ortakOturumId appears, or dropped when a new session takes the page).
   */
  const sayfaHasta = sayfaHastaId(usePathname())
  const sayfaHastaRef = useRef<string | null>(sayfaHasta)
  sayfaHastaRef.current = sayfaHasta
  // NOTYA-SES-ASR-KAZANC-01: skipped clips (language mismatch / empty) in the last seconds, and when the hint was last shown
  const atlaIpucuRef = useRef<number[]>([])
  const sonIpucuRef = useRef(0)
  const sayfaOdakRef = useRef<{ onceki: string | null | undefined; bekleyen: string | null }>({ onceki: undefined, bekleyen: null })

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
      if (fishAcikRef.current) return
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

  function yeniBalon(role: "user" | "ai", text: string, olay?: number): Message {
    return { id: `${Date.now()}-${Math.random()}`, role, text, sira: siradaki(), ...(olay != null ? { olay } : {}) }
  }

  function fishKes() {
    fishSozRef.current = ""
    fishBirikimRef.current = ""
    fishRef.current?.kes()
  }

  function fishSileroKapat() {
    const s = fishSileroRef.current
    fishSileroRef.current = null
    if (s) void s.kapat()
  }

  function fishIsle(tam: string, bitir: boolean, olay?: number) {
    if (!fishAcikRef.current) return
    if (typeof olay === "number" && olay > fishCevapOlayRef.current) fishCevapOlayRef.current = olay
    const r = fishYeniCumleler(fishSozRef.current, tam, bitir)
    fishSozRef.current = r.islenen
    for (const c of r.soyle) fishRef.current?.soyle(c)
  }

  function addMsg(role: "user" | "ai", text: string, olay?: number) {
    if (!text?.trim()) return
    const trimmed = text.trim()
    if (role === "user" && trimmed === DEVAM_ISARETI) return // NOTYA-SES-DEVAM-01: gizli devam turu baloncuk değildir
    setMessages((prev) => {
      const next = role === "user"
        ? kullaniciEkle(prev, trimmed, olay, yeniBalon)
        : (prev[prev.length - 1]?.role === role && prev[prev.length - 1]?.text === trimmed
          ? prev
          : [...prev, yeniBalon(role, trimmed, olay)])
      messagesRef.current = next
      return next
    })
  }

  /** NOTYA-SES-TUR-01: two sentences merged into one turn — the first sentence's bubble becomes the merged text. */
  function kullaniciBalonDegistir(eski: string, yeni: string) {
    const y = yeni.trim()
    if (!y) return
    setMessages((prev) => {
      let next: Message[] | null = null
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === "user" && prev[i].text === eski) {
          next = prev.slice()
          next[i] = { ...prev[i], text: y }
          break
        }
      }
      if (!next) next = kullaniciEkle(prev, y, undefined, yeniBalon)
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
    fishDinleNesilRef.current += 1
    fishTurAbortRef.current?.abort()
    fishTurAbortRef.current = null
    fishSiraRef.current = null
    fishSileroKapat()
    fishAkisKapat(fishMicRef.current)
    fishMicRef.current = null
    const yakala = fishYakalaRef.current
    fishYakalaRef.current = null
    if (yakala && yakala.state !== "closed") void yakala.close().catch(() => undefined)
    const conv = conversationRef.current
    conversationRef.current = null
    fishAcikRef.current = false
    fishSozRef.current = ""
    fishBirikimRef.current = ""
    fishCevapOlayRef.current = 0
    fishRef.current?.kapat()
    fishRef.current = null
    // A cut turn's remainder belongs to this call; the next call never reads it (ses-ekran's cursor agrees).
    sesDevamRef.current.bekleyen = null
    if (conv) {
      sesOgrenGonder()
      try { await conv.endSession() } catch { /* ignore */ }
    }
    yoklamayiDurdur()
    sureTimerlariTemizle()
    setSureUzatmaGoster(false)
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
      const j = (await r.json()) as { turlar?: { zaman: string; metin: string; soru?: string | null; kartlar: string[]; hastaId: string | null }[]; bekleyen?: string[]; devam?: boolean; devamAnahtar?: string | null; devamKalan?: string | null }
      const turlar = j.turlar || []
      for (const tur of turlar) {
        if (tur.zaman > tb.sonra) tb.sonra = tur.zaman
      }
      if (turlar.length) {
        setMessages((prev) => {
          let next = prev
          for (const tur of turlar) {
            const hamSoru = String(tur.soru || "").trim()
            // NOTYA-SES-ESKI-01: before the Fish work the poll wrote only the answer; the doctor line came from ElevenLabs alone. A second source made double bubbles.
            const soru = fishAcikRef.current && hamSoru && hamSoru !== DEVAM_ISARETI && !kendiSelamiMi(hamSoru) ? hamSoru : null
            next = cevapEkle(next, soru, tur.metin, yeniBalon)
          }
          messagesRef.current = next
          return next
        })
      }
      for (const tur of turlar) {
        if (tur.kartlar?.length && tur.hastaId) void kartiYukle(tur.hastaId, tur.kartlar[tur.kartlar.length - 1])
      }
      if (j.devam && j.devamAnahtar) sesDevamiIste(j.devamAnahtar, j.devamKalan || '')
      else if (!fishAcikRef.current && sesDevamRef.current.bekleyen) sesDevamiIste(sesDevamRef.current.bekleyen.anahtar, sesDevamRef.current.bekleyen.kalan)
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
   * On Fish (AYSE_SES_SAGLAYICI=fish) the page speaks the remainder itself instead of the hidden turn.
   */
  function sesDevamiIste(anahtar: string, kalan = "") {
    const d = sesDevamRef.current
    if (d.gonderilen.has(anahtar)) return
    const metin = String(kalan || "").trim()
    // NOTYA-AYSE-GERI-02: the screen poll reports the remainder ONCE (ses-ekran's cursor), usually while Ayşe is
    // still speaking the first sentences. It is kept and tried again: on Fish when her playback stops (onDurdu), on
    // ElevenLabs on the next poll (ekranYokla) — the f247ea1b "next poll re-checks" behaviour.
    if (metin || !fishAcikRef.current) d.bekleyen = { anahtar, kalan: metin }
    if (d.mod === "speaking") return
    if (fishAcikRef.current && fishRef.current?.caliyorMu()) return
    // The doctor spoke after the cut: the continuation is cancelled, not postponed.
    if (d.doktorSozu > d.ajanSustu) { d.bekleyen = null; return }
    if (fishAcikRef.current) {
      if (!metin) return
      d.gonderilen.add(anahtar)
      d.bekleyen = null
      d.mod = "speaking"
      setStatus("speaking")
      fishIsle(metin, true)
      // The server's copy is taken, so a later spoken "devam et" does not read the same sentences again.
      void fishDevamOkundu()
      return
    }
    const conv = conversationRef.current
    if (!conv) return
    d.gonderilen.add(anahtar)
    d.bekleyen = null
    try { conv.sendUserMessage(DEVAM_ISARETI) } catch { /* bağlantı kapandıysa devam yok */ }
  }

  function yoklamayiBaslat() {
    if (yoklamaRef.current) clearInterval(yoklamaRef.current)
    yoklamaRef.current = setInterval(() => { void ekranYokla() }, 500)
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

  /** SSE from /api/asistan/fish-tur. `hata` events reach the doctor (spoken + shown), not the void. */
  type FishTurOlayi = { t?: string; m?: string; b?: string; islenen?: number; neden?: string }
  async function fishSseOku(govde: ReadableStream<Uint8Array>, onSoz: (m: string) => void, sinyal: AbortSignal, onHata?: (m: string) => void, onOlay?: (j: FishTurOlayi) => void) {
    const okuyucu = govde.getReader()
    const dec = new TextDecoder()
    let buf = ""
    while (!sinyal.aborted) {
      const { done, value } = await okuyucu.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      for (;;) {
        const i = buf.indexOf("\n\n")
        if (i < 0) break
        const blok = buf.slice(0, i)
        buf = buf.slice(i + 2)
        const satir = blok.split("\n").find((l) => l.startsWith("data: "))
        if (!satir) continue
        try {
          const j = JSON.parse(satir.slice(6)) as FishTurOlayi
          if (j.t === "soz" && j.m) onSoz(j.m)
          else if (j.t === "hata" && j.m) onHata?.(j.m)
          else if (j.t) onOlay?.(j)
        } catch { /* parça */ }
      }
    }
  }

  /** NOTYA-SES-DEVAM-01: tell the turn route the page read the cut turn's remainder (best effort). */
  async function fishDevamOkundu() {
    const oturumId = tekBeyinRef.current?.oturumId
    if (!oturumId) return
    try {
      const t = authTokenRef.current || await ensureDoctorAccessToken()
      if (!t) return
      await fetch("/api/asistan/fish-tur", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ devamOkundu: true, asistanSessionId: oturumId }),
        keepalive: true,
      }).catch(() => null)
    } catch { /* the remainder then stays readable by "devam et" */ }
  }

  async function fishTurIsit(oturumId: string) {
    try {
      const t = authTokenRef.current || await ensureDoctorAccessToken()
      if (!t || !fishAcikRef.current) return
      const kontrol = new AbortController()
      const zaman = setTimeout(() => kontrol.abort(), 8000)
      await fetch("/api/asistan/fish-tur", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ isit: true, asistanSessionId: oturumId }),
        signal: kontrol.signal,
        keepalive: true,
      }).catch(() => null)
      clearTimeout(zaman)
    } catch { /* warm-up only */ }
  }

  async function startFishOturumu(g: {
    p: Persona
    firstMessage: string
    sayfaHastasi: string | null
    dokunus: AudioContext | null
    akis: MediaStream
    yakala: AudioContext | null
    tekBeyin: { oturumId: string; jeton: string; baslangic: string } | null
  }) {
    if (!g.tekBeyin?.oturumId) throw new Error("Asistan oturumu açılamadı")
    fishAcikRef.current = true
    fishDinleNesilRef.current += 1
    const nesil = fishDinleNesilRef.current
    fishMicRef.current = g.akis
    if (g.yakala) fishYakalaRef.current = g.yakala
    fishRef.current?.kapat()
    let acilisBitti: (() => void) | null = null
    const acilisSozu = new Promise<void>((r) => { acilisBitti = r })
    const acilisiKapat = () => { acilisBitti?.(); acilisBitti = null }
    fishRef.current = fishCalarOlustur(async (metin, sinyal) => {
      const t = authTokenRef.current || await ensureDoctorAccessToken()
      if (!t) return null
      const r = await fetch("/api/asistan/fish-ses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ metin }),
        signal: sinyal,
      })
      if (!r.ok || !r.body) return null
      return r.body
    }, {
      onHata: () => {
        // TTS failed for this sentence: the screen answer is still there, keep listening.
        if (fishAcikRef.current) {
          setStatus("listening")
          setErrorMsg(FISH_TTS_HATA)
        }
        acilisiKapat()
      },
      onBasladi: () => {
        fishSiraRef.current?.sesBasladi()
        if (fishAcikRef.current) setStatus("speaking")
      },
      onDurdu: () => {
        const d = sesDevamRef.current
        d.ajanSustu = Date.now()
        d.mod = "listening"
        if (fishAcikRef.current) setStatus("listening")
        acilisiKapat()
        // NOTYA-AYSE-GERI-02: a cut turn's remainder that arrived while she was speaking is read now.
        if (d.bekleyen) sesDevamiIste(d.bekleyen.anahtar, d.bekleyen.kalan)
      },
    }, g.dokunus)
    await fishRef.current.hazirla()
    // NOTYA-FISH-HAVUZ-01: mic is granted — warm the turn route now (Fish socket pre-open + keep-alive
    // agent), so the doctor's first sentence never pays a Fish cold start. Best effort, never awaited.
    void fishTurIsit(g.tekBeyin.oturumId)
    tekBeyinRef.current = { oturumId: g.tekBeyin.oturumId, sonra: g.tekBeyin.baslangic }
    setOrtakOturumId(g.tekBeyin.oturumId)
    if (g.sayfaHastasi) void odagiSayfayaAl(g.tekBeyin.oturumId, g.sayfaHastasi)
    yoklamayiBaslat()
    setErrorMsg("")
    sureTimerlariBaslat(address(doctorProfile || { firstName: "Hocam" }, "named"))
    addMsg("ai", g.firstMessage)
    setStatus("speaking")
    fishRef.current.soyle(g.firstMessage)
    await Promise.race([acilisSozu, new Promise<void>((r) => setTimeout(r, 15_000))])
    if (nesil !== fishDinleNesilRef.current || !fishAcikRef.current) return
    await new Promise<void>((r) => setTimeout(r, 400))
    if (nesil !== fishDinleNesilRef.current || !fishAcikRef.current) return
    const akis = fishMicRef.current
    if (!akis) throw new Error("Mikrofon yok")
    let baglam = g.yakala && g.yakala.state !== "closed" ? g.yakala : null
    if (!baglam) {
      baglam = fishDinleBaglamAc()
      fishYakalaRef.current = baglam
    }
    if (baglam.state === "suspended") await baglam.resume().catch(() => undefined)
    // Silero (opt-in, NEXT_PUBLIC_NOTYA_SILERO=1) loads in the background; the first turn may still run on RMS.
    fishSileroKapat()
    fishVadGunlukSifirla()
    void sileroAc(akis, baglam).then((s) => {
      if (!s) return
      if (nesil !== fishDinleNesilRef.current || !fishAcikRef.current) { void s.kapat(); return }
      fishSileroRef.current = s
    })
    setStatus("listening")
    void fishDinleDongusu(nesil, akis, baglam, g.p, g.tekBeyin.oturumId)
  }

  /**
   * NOTYA-SES-TUR-01: the recorder runs for the whole session — it no longer waits for the turn SSE or for
   * playback to end (that wait ate the doctor's first sentence after every answer). Each clip that leaves the
   * junk gate goes through the pure turn sequencer (fishTurSirasi): a clip while the brain still works and no
   * audio has started merges with the in-flight sentence (one turn, one merged utterance); a clip after the
   * answer audio started is barge-in as before. A turn (fish-tur: ASR ∥ TTS socket → brain → speak) runs
   * concurrently with the next recording. A failed call says so in one Turkish line; only a dead mic ends it.
   */
  async function fishDinleDongusu(nesil: number, akis: MediaStream, baglam: AudioContext, p: Persona, oturumId: string) {
    const canli = () => nesil === fishDinleNesilRef.current && fishAcikRef.current
    let sira: TurSirasi<FishKlip> = turSirasiBaslat<FishKlip>()
    let aktifKontrol: AbortController | null = null
    fishSiraRef.current = { sesBasladi: () => { sira = sesBasladi(sira) } }
    let ustUsteHata = 0

    const klipIsle = (klip: FishKlip) => {
      const eskiStt = sira.aktif?.stt ?? null
      const r = klipGeldi(sira, klip, klip.blob.type === "audio/wav")
      sira = r.durum
      if (r.karar.k === "yoksay") {
        console.info("[fish-vad]", { karar: `atlandi:${r.karar.neden}`, sira: true })
        return
      }
      if (r.karar.iptal !== "yok") console.info("[fish-tur]", { sira: r.karar.iptal, klip: r.karar.klipler.length })
      void turCalistir(r.karar.klipler, r.karar.birlesik ? eskiStt : null)
    }

    /** One doctor turn. `degistir`: the first clip's transcript already on screen — the merged one replaces it. */
    async function turCalistir(klipler: FishKlip[], degistir: string | null) {
      // Synchronous, before any await: the in-flight turn is cancelled now (fetch abort → route cancel → Fish socket closed).
      fishKes()
      fishSozRef.current = ""
      fishBirikimRef.current = ""
      fishTurAbortRef.current?.abort()
      const kontrol = new AbortController()
      fishTurAbortRef.current = kontrol
      aktifKontrol = kontrol
      const benim = () => aktifKontrol === kontrol
      const turZamani = setTimeout(() => kontrol.abort(), FISH_TUR_ISTEMCI_MS)
      let bargeIptal = false
      let kapatildi = false
      try {
        const blob = klipler.length > 1 ? await wavBirlestir(klipler.map((k) => k.blob)) : klipler[0].blob
        const t = authTokenRef.current || await ensureDoctorAccessToken()
        if (!canli() || !benim()) return
        if (!t) { setErrorMsg(FISH_OTURUM_HATA); return }
        const fd = new FormData()
        fd.append("audio", blob, fishAsrDosyaAdi(blob.type))
        fd.append("asistanSessionId", oturumId)
        fd.append("specialty", p.primarySpecialty)
        fd.append("personaId", p.id)
        fd.append("ses", "ws")
        fd.append("saatDilimi", tarayiciSaatDilimi())
        setErrorMsg("")
        const r = await fetch("/api/asistan/fish-tur", {
          method: "POST",
          headers: { Authorization: `Bearer ${t}` },
          body: fd,
          signal: kontrol.signal,
        })
        if (!r.ok || !r.body) {
          if (canli() && benim()) sesliHataSoyle(r.status === 413 ? FISH_ASR_UZUN : (r.status === 502 ? FISH_ASR_HATA : FISH_TUR_HATA))
          return
        }
        let hataSoylendi = false
        let atlandi = false
        // NOTYA-SES-YARIM-01: the server held an unfinished sentence — no answer; the clips wait for the continuation.
        let bekletildi = false
        // NOTYA-FISH-WS-01: socket opens during ASR; `stt` then `ses_hazir` before the first `soz`.
        let wsYazici: ReturnType<FishCalar["akisAc"]> | null = null
        let wsAktif = false
        let sozBitti = false
        let sesHazir = false
        let ilkSoz = 0
        let ilkSesMs: number | null = null
        let sesBekci: ReturnType<typeof setTimeout> | null = null
        const kelime = new KelimeKesici()
        /** WS audio gave up (server `ses_dus`, or no chunk in time): remaining text goes sentence-by-sentence via REST. */
        const sesDus = (neden: "sunucu" | "zaman_asimi", islenen: number) => {
          if (!wsAktif) return
          if (sesBekci) { clearTimeout(sesBekci); sesBekci = null }
          console.info("[fish-ses]", { yol: "rest", ses_dus: neden, islenen })
          wsYazici?.bitir()
          wsYazici = null
          wsAktif = false
          fishSozRef.current = sesDusKesimi(fishBirikimRef.current, islenen)
          fishIsle(fishBirikimRef.current, false)
        }
        const sesBekciKur = () => {
          if (sesBekci || ilkSesMs !== null || !wsAktif || !ilkSoz) return
          // NOTYA-AYSE-OZET-01: no chunk arrived, so nothing was heard — the REST fallback starts at the beginning.
          // (It used to start after the text already received, which left a short or already complete answer silent.)
          sesBekci = setTimeout(() => { sesBekci = null; if (canli() && ilkSesMs === null) sesDus("zaman_asimi", sesDusOfseti(false, kelime.islenen.length)) }, FISH_WS_ILK_SES_MS)
        }
        const bargeSonrasiKapat = () => {
          // Doctor cut in and the text is complete: nothing left to show, stop the audio relay.
          if (bargeIptal && sozBitti && fishTurAbortRef.current === kontrol) kontrol.abort()
        }
        await fishSseOku(r.body, (m) => {
          if (!canli()) return
          if (!ilkSoz) { ilkSoz = Date.now(); sesBekciKur() }
          fishBirikimRef.current = fishBirlestir(fishBirikimRef.current, m)
          kelime.ekle(m)
          if (wsAktif) fishSozRef.current = kelime.islenen
          else fishIsle(fishBirikimRef.current, false)
        }, kontrol.signal, (m) => {
          if (!canli() || hataSoylendi) return
          hataSoylendi = true
          sesliHataSoyle(m)
        }, (j) => {
          if (!canli()) return
          if (j.t === "atlandi") {
            atlandi = true
            console.info("[fish-vad]", { karar: `atlandi:${j.neden || "?"}`, sunucu: true })
            const sebep = String(j.neden || "")
            if (sebep === "dil" || sebep === "bos") {
              const simdi = Date.now()
              const liste = atlaIpucuRef.current.filter((z) => simdi - z < 25000)
              liste.push(simdi)
              atlaIpucuRef.current = liste
              if (liste.length >= 2 && simdi - sonIpucuRef.current > 45000 && sesDevamRef.current.mod === "listening") {
                sonIpucuRef.current = simdi
                addMsg("ai", "Sizi net duyamadım Hocam, mikrofona biraz yaklaşıp tekrar söyler misiniz?")
              }
            }
          } else if (j.t === "stt" && j.m) {
            const metin = String(j.m).trim()
            if (sesGurultusuMu(metin) || !fishAsrDilUyumluMu(metin) || kendiSelamiMi(metin)) {
              atlandi = true
              return
            }
            if (benim()) sira = sttGeldi(sira, metin)
            sesDevamRef.current.doktorSozu = Date.now()
            if (degistir) kullaniciBalonDegistir(degistir, metin)
            else addMsg("user", metin)
            if (asistaniKapatMi(metin)) {
              kapatildi = true
              void endConversation()
              kontrol.abort()
            }
          } else if (j.t === "bekle") {
            bekletildi = true
            if (benim()) sira = yarimKaldi(sira)
            console.info("[fish-vad]", { karar: `bekle:${j.neden || "?"}`, sunucu: true })
          } else if (j.t === "kapat" && j.m) {
            kapatildi = true
            addMsg("user", String(j.m).trim())
            void endConversation()
            kontrol.abort()
          } else if (j.t === "ses_hazir") {
            const calar = fishRef.current
            if (!calar) return
            sesHazir = true
            wsAktif = true
            wsYazici = calar.akisAc()
            sesBekciKur()
          } else if (j.t === "ses" && j.b) {
            if (!wsYazici) return
            if (ilkSesMs === null) {
              ilkSesMs = Date.now() - (ilkSoz || Date.now())
              if (sesBekci) { clearTimeout(sesBekci); sesBekci = null }
              console.info("[fish-ses]", { yol: "ws", ses_hazir: true, ilk_ses_ms: ilkSesMs })
            }
            if (wsYazici.kesildiMi()) { bargeIptal = true; wsYazici = null; bargeSonrasiKapat(); return }
            wsYazici.yaz(base64Pcm(j.b))
          } else if (j.t === "ses_bit") {
            wsYazici?.bitir()
            wsYazici = null
          } else if (j.t === "soz_bit") {
            sozBitti = true
            if (wsYazici?.kesildiMi()) bargeIptal = true
            bargeSonrasiKapat()
          } else if (j.t === "ses_dus") {
            // Socket died mid-turn: what Fish already had may have played; the rest goes via REST.
            sesDus("sunucu", sesDusOfseti(ilkSesMs !== null, Number(j.islenen ?? 0)))
          }
        })
        if (sesBekci) { clearTimeout(sesBekci); sesBekci = null }
        if (kapatildi || atlandi || bekletildi) return
        if (!sesHazir) console.info("[fish-ses]", { yol: "rest", ses_hazir: false })
        if (canli() && !hataSoylendi && !wsAktif) fishIsle(fishBirikimRef.current, true)
        ;(wsYazici as ReturnType<FishCalar["akisAc"]> | null)?.bitir()
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          if (kapatildi) return
          // Our own timeout (not a newer / merged turn) — tell the doctor instead of going quiet.
          if (canli() && benim() && fishTurAbortRef.current === kontrol && !bargeIptal) sesliHataSoyle(FISH_TUR_HATA)
          return
        }
        if (canli() && benim()) sesliHataSoyle(FISH_TUR_HATA)
      } finally {
        clearTimeout(turZamani)
        // A held turn stays in the sequencer (yarim) until the continuation arrives or its window passes.
        if (benim()) { if (!sira.aktif?.yarim) sira = turBitti(sira); aktifKontrol = null }
      }
    }

    while (canli()) {
      try {
        const klip = await fishBirTurKaydet(akis, baglam, {
          iptal: () => !canli(),
          ajanKonusuyorMu: () => Boolean(fishRef.current?.caliyorMu()),
          bargeIn: () => fishKes(),
          silero: () => fishSileroRef.current?.olasilik() ?? null,
        })
        if (!canli()) return
        ustUsteHata = 0
        if (klip) klipIsle(klip)
      } catch (e) {
        // Recorder / context failure: never let one exception kill the session silently.
        ustUsteHata += 1
        console.error("[fish-mic] tur", { hata: e instanceof Error ? e.message : String(e), ustUste: ustUsteHata })
        if (!canli()) return
        if (baglam.state === "closed" || ustUsteHata >= 3) {
          setErrorMsg(FISH_MIK_HATA)
          void endConversation()
          return
        }
        await new Promise((r) => setTimeout(r, 500))
      }
    }
  }

  /** One short Turkish line, spoken by Ayşe and shown on screen; the loop keeps listening. */
  function sesliHataSoyle(metin: string) {
    const m = String(metin || "").trim() || FISH_TUR_HATA
    setErrorMsg(m)
    addMsg("ai", m)
    fishSozRef.current = ""
    fishBirikimRef.current = ""
    fishIsle(m, true)
  }

  async function fetchSignedUrl(p: Persona, sayfaHastasi: string | null = null): Promise<{ signedUrl: string; voiceId: string; fish: boolean; tekBeyin: { oturumId: string; jeton: string; baslangic: string } | null }> {
    const token = authTokenRef.current
    if (!token) throw new Error("Oturum bulunamadı")
    const oturumParam = ortakOturumId ? `&asistanSessionId=${encodeURIComponent(ortakOturumId)}` : ""
    const hastaParam = sayfaHastasi ? `&patientId=${encodeURIComponent(sayfaHastasi)}` : ""
    const resp = await fetch(
      `/api/asistan/signed-url?specialty=${p.primarySpecialty}&persona=${p.id}${oturumParam}${hastaParam}&tz=${encodeURIComponent(tarayiciSaatDilimi())}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}))
      throw new Error((errBody as { error?: string }).error || `Sunucu hatası: ${resp.status}`)
    }
    const body = await resp.json()
    const fish = body.fish === true && p.id === "aysekaya"
    if (fish) {
      if (!body.asistan_session_id) throw new Error("Asistan oturumu açılamadı")
      return {
        signedUrl: "",
        voiceId: (body.voice_id as string) || p.voiceId,
        fish: true,
        tekBeyin: { oturumId: String(body.asistan_session_id), jeton: "", baslangic: String(body.baslangic || new Date().toISOString()) },
      }
    }
    if (!body.signed_url) throw new Error("Bağlantı adresi alınamadı")
    return {
      signedUrl: body.signed_url as string,
      voiceId: (body.voice_id as string) || p.voiceId,
      fish: false,
      tekBeyin: body.tek_beyin && body.notya_jeton && body.asistan_session_id
        ? { oturumId: String(body.asistan_session_id), jeton: String(body.notya_jeton), baslangic: String(body.baslangic || new Date().toISOString()) }
        : null,
    }
  }

  async function startConversation() {
    const dokunus = sesiDokunustaAc()
    const pEarly = PERSONAS[personaKeyRef.current] || PERSONAS[personaKey]
    // NOTYA-SES-ELEVEN-GERI-01: Fish only with AYSE_SES_SAGLAYICI=fish; by default Ayşe takes the ElevenLabs path below.
    const ayseFish = ayseFishIstemcideMi(pEarly.id)
    const micSozu = ayseFish ? fishAkisAc() : Promise.resolve(null as MediaStream | null)
    let yakala: AudioContext | null = null
    try { if (ayseFish) yakala = fishDinleBaglamAc() } catch { yakala = null }
    if (!authTokenRef.current) {
      const sonuc = await hazirla()
      if (sonuc === "giris" || sonuc === "onboarding") {
        try { fishAkisKapat(await micSozu) } catch { /* */ }
        if (yakala && yakala.state !== "closed") void yakala.close().catch(() => undefined)
        if (sonuc === "giris") router.push("/giris")
        else router.push("/onboarding?p=doktor")
        return
      }
    }
    if (!authTokenRef.current) {
      try { fishAkisKapat(await micSozu) } catch { /* */ }
      if (yakala && yakala.state !== "closed") void yakala.close().catch(() => undefined)
      router.push("/giris")
      return
    }
    await endConversation()
    if (yakala) fishYakalaRef.current = yakala
    setStatus("connecting")
    setErrorMsg("")
    // NOTYA-ASISTAN-GECMIS-01: mikrofona yeniden dokunmak geçmişi silmez — son 50 sıra kalır.
    fishSozRef.current = ""
    fishBirikimRef.current = ""
    fishCevapOlayRef.current = 0

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
      const sayfaHastasi = ortakOturumId ? null : yeniOturumSayfaHastasi()
      const { signedUrl, voiceId, fish, tekBeyin } = await fetchSignedUrl(p, sayfaHastasi)
      if (ayseFish && fish && p.id === pEarly.id) {
        const akis = await micSozu
        if (akis) fishMicRef.current = akis
        if (!akis) throw new Error("Mikrofon yok")
        await startFishOturumu({ p, firstMessage, sayfaHastasi, dokunus, akis, yakala, tekBeyin })
        return
      }
      // The page did not open the Fish microphone, so a Fish answer cannot be used (a tab built with another value).
      if (fish) throw new Error("Ses motoru uyuşmuyor — sayfayı yenileyin")
      if (ayseFish) {
        // Switch says fish but the server has no Fish key: Ayşe falls back to ElevenLabs; the SDK opens its own mic.
        try { fishAkisKapat(await micSozu) } catch { /* */ }
        const yakalaKapan = fishYakalaRef.current
        fishYakalaRef.current = null
        if (yakalaKapan && yakalaKapan.state !== "closed") void yakalaKapan.close().catch(() => undefined)
      }
      fishAcikRef.current = false
      fishRef.current?.kapat()
      fishRef.current = null
      if (tekBeyin) {
        tekBeyinRef.current = { oturumId: tekBeyin.oturumId, sonra: tekBeyin.baslangic }
        setOrtakOturumId(tekBeyin.oturumId)
        // NOTYA-SAYFA-HASTA-01: the new session already holds the page's patient; this only fetches the panel label.
        if (sayfaHastasi) void odagiSayfayaAl(tekBeyin.oturumId, sayfaHastasi)
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
          refreshSignedUrl: () => fetchSignedUrl(p, sayfaHastasi).then((r) => r.signedUrl),
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
      yoklamayiDurdur()
      fishDinleNesilRef.current += 1
      fishSileroKapat()
      fishAkisKapat(fishMicRef.current)
      fishMicRef.current = null
      const yakalaKapan = fishYakalaRef.current
      fishYakalaRef.current = null
      if (yakalaKapan && yakalaKapan.state !== "closed") void yakalaKapan.close().catch(() => undefined)
      fishRef.current?.kapat()
      fishRef.current = null
      fishAcikRef.current = false
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
    let selamBizden = false
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
        ...SES_CALAR,
        onConversationCreated: (c) => {
          conversationRef.current = c
        },
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
          if (!includeFirstMessage) {
            addMsg("ai", firstMessage)
          }
          if (tekBeyin) yoklamayiBaslat()
        },
        onDisconnect: (details) => {
          if (fishAcikRef.current) fishRef.current?.kes()
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
        onMessage: ({ message, role, event_id }) => {
          const olay = typeof event_id === "number" ? event_id : undefined
          if (role !== "user" && skipNextAgentTranscript) {
            skipNextAgentTranscript = false
            return
          }
          if (role === "user" && (String(message || "").trim() === DEVAM_ISARETI || kendiSelamiMi(message) || sesGurultusuMu(message))) return
          if (role === "user") {
            const gecikenSoru = typeof olay === "number" && fishCevapOlayRef.current > olay
            if (!gecikenSoru) fishKes()
            if (!gecikenSoru) sesDevamRef.current.doktorSozu = Date.now()
          } else if (sesGurultusuMu(message)) {
            return
          } else if (!doktorKonustu && acilisAjanSozuMu(message)) {
            if (!selamBizden) {
              selamBizden = true
              if (fishAcikRef.current) fishRef.current?.soyle(firstMessage)
              addMsg("ai", firstMessage, olay)
            }
            return
          } else if (fishAcikRef.current && String(message || "").trim()) {
            const eskiCevap = typeof olay === "number" && fishCevapOlayRef.current > 0 && olay < fishCevapOlayRef.current && fishSozRef.current.length > 0
            if (!eskiCevap) {
              const tam = String(message)
              const birikim = fishBirikimRef.current
              const hedef = !birikim || tam.startsWith(birikim) ? tam : (birikim.startsWith(tam) ? birikim : tam)
              fishBirikimRef.current = hedef
              fishIsle(hedef, true, olay)
            }
          }
          if (role === "user" && asistaniKapatMi(message)) {
            addMsg("user", message, olay)
            void endConversation()
            return
          }
          // NOTYA-TEK-BEYIN: açılış selamından sonra Ayşe'nin baloncuğu sözlü kısa biçim değil, ekran biçimidir (ekranYokla).
          if (tekBeyin) {
            if (role === "user") doktorKonustu = true
            else if (doktorKonustu) return
          }
          addMsg(role === "user" ? "user" : "ai", message, olay)
        },
        onAgentChatResponsePart: (part) => {
          if (!fishAcikRef.current || !part) return
          // Opening line is spoken once onConnect. Streaming it here is the second voice.
          if (!doktorKonustu) return
          const olay = typeof part.event_id === "number" ? part.event_id : undefined
          if (part.type === "start") {
            fishSozRef.current = ""
            fishBirikimRef.current = ""
            if (typeof olay === "number") fishCevapOlayRef.current = olay
            return
          }
          if (typeof olay === "number" && fishCevapOlayRef.current > olay && fishSozRef.current) return
          fishBirikimRef.current = fishBirlestir(fishBirikimRef.current, String(part.text || ""))
          fishIsle(fishBirikimRef.current, part.type === "stop", olay)
        },
        onInterruption: () => {
          fishKes()
        },
        onVadScore: ({ vadScore }) => {
          if (fishAcikRef.current && vadScore >= 0.55 && fishRef.current?.caliyorMu()) fishKes()
        },
        onModeChange: ({ mode }) => {
          const d = sesDevamRef.current
          const fishSuruyor = fishAcikRef.current && Boolean(fishRef.current?.caliyorMu())
          if (!fishSuruyor && d.mod === "speaking" && mode !== "speaking") d.ajanSustu = Date.now()
          if (fishSuruyor || mode === "speaking") {
            d.mod = "speaking"
            setStatus("speaking")
            return
          }
          d.mod = "listening"
          setStatus("listening")
        },
        onStatusChange: ({ status: sdkStatus }) => {
          if (sdkStatus === "connecting") setStatus("connecting")
          if (sdkStatus === "connected" && !(fishAcikRef.current && fishRef.current?.caliyorMu())) setStatus("listening")
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
      fishRef.current?.kapat()
      fishRef.current = null
      fishAcikRef.current = false
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

  async function odagiSayfayaAl(oturumId: string, patientId: string) {
    try {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const r = await fetch("/api/asistan/oturum-hasta", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ asistanSessionId: oturumId, patientId }),
      })
      if (!r.ok) return
      const j = (await r.json()) as { ad?: string | null }
      if (j.ad) setAktifHasta(String(j.ad))
    } catch { /* odak kritik değil — doktor hastayı adıyla da söyleyebilir */ }
  }

  /** New shared session: it starts on the page's patient (signed-url / chat patientId); a pending page switch is spent. */
  function yeniOturumSayfaHastasi(): string | null {
    sayfaOdakRef.current.bekleyen = null
    return sayfaHastaRef.current
  }

  useEffect(() => {
    const o = sayfaOdakRef.current
    if (sayfaHasta !== o.onceki) {
      o.onceki = sayfaHasta
      if (sayfaHasta) o.bekleyen = sayfaHasta
    }
    if (!ortakOturumId || !o.bekleyen) return
    const id = o.bekleyen
    o.bekleyen = null
    void odagiSayfayaAl(ortakOturumId, id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sayfaHasta, ortakOturumId])

  function switchPersona(key: PersonaId) {
    void stopConversation()
    // NOTYA-ASISTAN-GECMIS-01: ayrılmadan önce bu meslektaşın son 50 sırasını sakla; yenisi personaKey effect ile yüklenir.
    const yazili: SakliYaziliMesaj[] = yaziliMesajlarRef.current.map((m) => ({ rol: m.rol, icerik: m.icerik, sira: m.sira }))
    sohbetYaz(personaKeyRef.current, messagesRef.current, yazili)
    personaKeyRef.current = key
    setPersonaKey(key)
    setPersona(PERSONAS[key])
    // Önceki meslektaşın oturumu, hastası ve kesik kalanı bu sese taşınmaz.
    setOrtakOturumId(null)
    setAktifHasta(null)
    setYaziliGirdi('')
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

  /**
   * NOTYA-SES-SESSIZ-01 (Dr. Gökhan, 2026-09-26): he typed in the written panel while the mic was open; the written
   * answer came, but the voice agent kept talking ("Buradayım, devam edebiliriz", silence prompts). From the moment
   * the written panel is engaged the voice side goes silent: the ElevenLabs session ends (its silence prompts live
   * there), the server conversation stays, and the mic button reconnects to the same session.
   */
  async function sesiYaziliIcinSustur() {
    if (!['connecting', 'listening', 'speaking'].includes(status) && !conversationRef.current) return
    await endConversation()
    setStatus('sessiz')
  }
  const yaziliGirdiAyarla: typeof setYaziliGirdi = (g) => {
    setYaziliGirdi(g)
    const v = typeof g === 'function' ? '' : g
    if (v.trim()) void sesiYaziliIcinSustur()
  }

  async function yaziliGonder() {
    const metin = yaziliGirdi.trim()
    if (!metin || yaziliBekliyor) return
    await sesiYaziliIcinSustur()
    try { tanimaRef.current?.stop() } catch { /* sessiz */ }
    setYaziliDinliyor(false)
    setYaziliGirdi('')
    setYaziliAcik(true)
    const ekle = (m: Omit<YaziliMesaj, 'sira'>) => setYaziliMesajlar((onceki) => [...onceki, { ...m, sira: siradaki() }])
    ekle({ rol: 'doktor', icerik: metin })
    setYaziliBekliyor(true)
    const personaAdi = persona.shortName
    // NOTYA-SAYFA-HASTA-01: the first message of a new session starts on the page's patient.
    const sayfaHastasi = ortakOturumId ? null : yeniOturumSayfaHastasi()
    try {
      const token = await ensureDoctorAccessToken()
      const r = await fetch('/api/asistan/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: metin, personaId: personaKey, asistanSessionId: ortakOturumId, saatDilimi: tarayiciSaatDilimi(), ...(sayfaHastasi ? { patientId: sayfaHastasi } : {}) }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `${personaAdi} yanıt veremedi.`)
      const veri = d.data && typeof d.data === 'object' ? d.data : d
      // The route answers in data.speech (F3: the panel read response/message and showed "Yanıt alınamadı." for every answer).
      // Parsed once more as a guard so a JSON-shaped text can never reach the bubble.
      const cevap = asistanYanitiCoz(String(veri.speech || veri.response || veri.message || veri.cevap || '')).speech
      if (veri.asistanSessionId) setOrtakOturumId(String(veri.asistanSessionId))
      if (veri.aktifHasta) setAktifHasta(String(veri.aktifHasta))
      // Unnamed first question on a patient's page: focus stayed on the page patient — fetch its name for the panel.
      else if (sayfaHastasi && veri.asistanSessionId) void odagiSayfayaAl(String(veri.asistanSessionId), sayfaHastasi)
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
    // NOTYA-ASISTAN-GECMIS-01: Kapat sesi/paneli durdurur; sohbet geçmişi (son 50) kalır — WhatsApp gibi.
    setErrorMsg("")
    sesKartiniKapat()
    sesKartiIdRef.current = null
    setOrtakOturumId(null)
    try { tanimaRef.current?.stop() } catch { /* sessiz */ }
    setYaziliDinliyor(false)
    setYaziliAcik(false)
    setYaziliGirdi('')
    setAktifHasta(null)
    sayfaOdakRef.current.bekleyen = null
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
    setYaziliGirdi: yaziliGirdiAyarla,
    yaziliGonder,
    yaziliMikrofon,
    oturumuKapat,
  }

  return <AsistanOturumContext.Provider value={deger}>{children}</AsistanOturumContext.Provider>
}
