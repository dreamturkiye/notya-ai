'use client'

/**
 * AU-CANLI-02 — the SESSION of the assistant page: one hook that holds the call, the typed chat, the bubbles and the
 * stored history. Türkiye's counterpart is components/asistan/AsistanOturumContext.tsx (1869 lines of Turkish personas,
 * patient files and polls); this one is the country's: one persona per role, no patient file, the full answer arrives by
 * the `show_on_screen` tool. What is SHARED with Türkiye is the part that must never differ: the bubble ordering
 * (lib/asistan/balonSirasi.ts through lib/ulke/asistan/balonlar.ts) and the history store (lib/asistan/sohbetGecmisi.ts).
 *
 * Why the first version of the button was dead (AU-CANLI-01), all fixed here:
 *   1. A call that the provider closed with an ERROR was swallowed: `onDisconnect` reset the button to idle and showed
 *      nothing. Every error close now shows its message.
 *   2. The per-call greeting / language / voice are accepted only if the agent allows them; a fresh agent does not. The
 *      call is retried ONCE with no overrides (the server also switches the three overrides on: motorKilidi.ts).
 *   3. The microphone is asked for BEFORE the call is opened, so a refusal says "allow the microphone" and a missing
 *      device is not reported as a connection failure.
 *   4. A close that arrived before the session object was stored left a half-open session; it is now ended.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Conversation } from '@/components/AsistanConversation'
import { SES_CALAR } from '@/lib/asistan/sesCalar'
import { sohbetMaxSira, sohbetOku, sohbetYaz, type SakliYaziliMesaj } from '@/lib/asistan/sohbetGecmisi'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ulkeYolu } from '@/lib/ulke/yol'
import { ekranCevabi, geciciyiOturt, saklanacak, saklidan, selamEkle, sesAsistani, sesKullanicisi, yeniCagri, type BalonSayaci, type SohbetBalon } from '@/lib/ulke/asistan/balonlar'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'
import { hataYazisi, kisaAyrinti } from '@/lib/ulke/asistan/ayrinti'
import { okunurMu, sesiDokunustaAc } from '@/lib/ulke/asistan/sesAcma'
import type { Api } from './Kabuk'

/** `sessiz` = the written chat was used while the voice was live: the call ended, the page stays; the microphone starts a new one (Türkiye's "sessiz"). */
export type CanliDurumu = 'bosta' | 'baglaniyor' | 'dinliyor' | 'konusuyor' | 'hata' | 'sessiz'
/** A line of the written chat (Türkiye: YaziliMesaj, without patient cards — a country's assistant has no patient file). */
export type YaziliMesaj = SakliYaziliMesaj
export type Metin = NonNullable<UygulamaMetni['asistanCanli']>
export type Hazir = { ad: string; kisaAd: string; cinsiyet: 'erkek' | 'kadin' | null; portre?: string | null }

/** The two worklet files live under the country's path prefix (public/ses/). */
export const CALAR = {
  // rawAudioProcessor (microphone input) is served from our own origin as well: the library otherwise builds it from a
  // blob/data URL, which Safari/CSP refused on AU ("Failed to load the rawAudioProcessor worklet module").
  workletPaths: {
    audioConcatProcessor: ulkeYolu(SES_CALAR.workletPaths.audioConcatProcessor),
    rawAudioProcessor: ulkeYolu('/ses/ham-ses-islemcisi.js'),
  },
  libsampleratePath: ulkeYolu(SES_CALAR.libsampleratePath),
} as const

/** Microphone first, so that a refusal is named as one. */
export async function mikrofonIste(): Promise<'tamam' | 'reddedildi' | 'yok'> {
  try {
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined
    if (!md || typeof md.getUserMedia !== 'function') return 'yok'
    const akis = await md.getUserMedia({ audio: true })
    akis.getTracks().forEach((x) => x.stop())
    return 'tamam'
  } catch (e) {
    const ad = e instanceof Error ? e.name : ''
    return ad === 'NotAllowedError' || ad === 'SecurityError' || ad === 'PermissionDeniedError' ? 'reddedildi' : 'yok'
  }
}

type Baglanti = Awaited<ReturnType<typeof Conversation.startSession>>
interface TanimaSonucu { isFinal: boolean; 0: { transcript: string } }
interface TanimaOlayi { resultIndex: number; results: { length: number; [i: number]: TanimaSonucu } }
interface Tanima {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((e: TanimaOlayi) => void) | null; onend: (() => void) | null; onerror: (() => void) | null
  start: () => void; stop: () => void
}
type DurumCevabi = { hazir?: boolean; ad?: string; kisaAd?: string; cinsiyet?: string; portre?: string | null }

export function useCanliOturum({ t, api, dil }: { t: Metin | undefined; api: Api | undefined; /** The account's language: the language of the browser's dictation (en-AU …). */ dil?: string }) {
  /** undefined = not asked yet · null = not available (draw nothing / say so) · object = available. */
  const [hazir, setHazir] = useState<Hazir | null | undefined>(undefined)
  const [durum, setDurum] = useState<CanliDurumu>('bosta')
  const [balonlar, setBalonlar] = useState<SohbetBalon[]>([])
  const [hata, setHata] = useState<string | null>(null)
  // The written chat (Türkiye: components/asistan/YaziliSohbet): its own list, open/closed, input, dictation.
  const [yaziliAcik, setYaziliAcik] = useState(false)
  const [yazili, setYazili] = useState<YaziliMesaj[]>([])
  const [yaziliGirdi, setYaziliGirdi] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [yaziliDinliyor, setYaziliDinliyor] = useState(false)
  const tanimaRef = useRef<Tanima | null>(null)
  const yaziliRef = useRef<YaziliMesaj[]>([])
  const girdiRef = useRef('')
  yaziliRef.current = yazili
  girdiRef.current = yaziliGirdi
  const durumRef = useRef<CanliDurumu>('bosta')
  durumRef.current = durum
  const sohbet = useRef<Baglanti | null>(null)
  const sayac = useRef<BalonSayaci>({ sira: 0 })
  const nesil = useRef(0)
  const balonRef = useRef<SohbetBalon[]>([])
  const yuklendi = useRef(false)
  balonRef.current = balonlar

  // The history belongs to the signed-in account on this browser (a second doctor on the same computer does not see it).
  const [hesapId, setHesapId] = useState<string | null>(null)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try { const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }; if (!iptal) setHesapId(data.session?.user?.id ?? null) } catch { /* no history then */ }
    })()
    return () => { iptal = true }
  }, [])
  const anahtar = hazir && hesapId ? `au_${hesapId}_${hazir.cinsiyet ?? hazir.kisaAd}` : null

  // Is it available? Anything but a clear yes is "not available".
  useEffect(() => {
    if (!t || !api) return
    let iptal = false
    ;(async () => {
      try {
        const r = await api('/api/ulke/asistan-canli')
        const j = r.j as DurumCevabi
        if (iptal) return
        if (r.ok && j.hazir === true && typeof j.ad === 'string' && j.ad) {
          setHazir({ ad: j.ad, kisaAd: typeof j.kisaAd === 'string' && j.kisaAd ? j.kisaAd : j.ad, cinsiyet: j.cinsiyet === 'erkek' || j.cinsiyet === 'kadin' ? j.cinsiyet : null, portre: typeof j.portre === 'string' && j.portre.startsWith('/') ? ulkeYolu(j.portre) : null })
        } else setHazir(null)
      } catch { if (!iptal) setHazir(null) }
    })()
    return () => { iptal = true }
  }, [t, api])

  // History: the last 50 lines of this browser, voice and written together (Türkiye: sohbetGecmisi), loaded once the
  // persona is known (event ids of an earlier call are dropped).
  useEffect(() => {
    if (!anahtar || yuklendi.current) return
    yuklendi.current = true
    const g = sohbetOku(anahtar)
    const { liste, sira } = saklidan(g.ses)
    sayac.current.sira = Math.max(sira, sohbetMaxSira(g))
    if (liste.length) setBalonlar((onceki) => (onceki.length ? onceki : yeniCagri(liste)))
    if (g.yazili.length) setYazili((onceki) => (onceki.length ? onceki : g.yazili))
  }, [anahtar])
  useEffect(() => {
    // An empty list is never written here (the load above has not been applied yet on the first pass); "clear" writes it itself.
    if (!anahtar || !yuklendi.current || (balonlar.length === 0 && yazili.length === 0)) return
    const kirp = sohbetYaz(anahtar, saklanacak(balonlar), yazili)
    if (kirp.yazili.length !== yazili.length) setYazili(kirp.yazili)
  }, [anahtar, balonlar, yazili])

  const bitir = useCallback(async () => {
    nesil.current += 1
    const c = sohbet.current
    sohbet.current = null
    setBalonlar((b) => geciciyiOturt(b))
    if (c) { try { await c.endSession() } catch { /* already closed */ } }
    setDurum('bosta')
  }, [])

  useEffect(() => () => { nesil.current += 1; try { tanimaRef.current?.stop() } catch { /* quiet */ } const c = sohbet.current; sohbet.current = null; if (c) void c.endSession().catch(() => {}) }, [])

  const baslat = useCallback(async () => {
    if (!t || !api || sohbet.current || durum === 'baglaniyor') return
    sesiDokunustaAc() // inside the click, before any await: Safari plays the voice only after this
    setHata(null); setDurum('baglaniyor')
    const izin = await mikrofonIste()
    if (izin !== 'tamam') { setHata(t.mikrofon); setDurum('hata'); return }
    setBalonlar((b) => yeniCagri(geciciyiOturt(b)))
    const benim = ++nesil.current
    const gecerli = () => nesil.current === benim

    /** One attempt. `ovr` = with the per-call greeting, language and voice. */
    const dene = async (ovr: boolean): Promise<void> => {
      let bitti = false // this attempt has been judged (failed, or ended): later callbacks of it are ignored
      let baglandi = false
      let baglanmaAni = 0 // when the call opened; what the assistant says first, before the doctor has spoken, is the greeting
      let kullaniciKonustu = false
      const basarisiz = (yenidenDene: boolean, ayrinti: string) => {
        if (bitti || !gecerli()) return
        bitti = true
        const c = sohbet.current
        sohbet.current = null
        if (c) void c.endSession().catch(() => {})
        if (yenidenDene && ovr && !baglandi) { void dene(false); return }
        setHata(hataYazisi(t.hata, ayrinti)); setDurum('hata')
      }
      try {
        const r = await api('/api/ulke/asistan-canli', { method: 'POST' })
        if (!gecerli()) return
        const j = r.j as { signed_url?: string; voice_id?: string; first_message?: string; notya_jeton?: string; ekran_araci?: string }
        if (r.status === 429) { setHata(t.limit); setDurum('hata'); return }
        if (!r.ok || !j.signed_url || !j.notya_jeton || !j.voice_id) {
          // Which part of the opening answer was missing is the whole diagnosis (a 502 = the provider gave no address, a 404 = not available here).
          const eksik = !j.signed_url ? 'no address' : !j.notya_jeton ? 'no token' : !j.voice_id ? 'no voice' : ''
          setHata(hataYazisi(t.hata, kisaAyrinti(`start ${r.status}`, [(r.j as { code?: unknown }).code, eksik].filter((x) => typeof x === 'string' && x).join(' ')))); setDurum('hata'); return
        }
        const aracAdi = j.ekran_araci || 'show_on_screen'
        const baglanti = await Conversation.startSession({
          signedUrl: j.signed_url,
          connectionType: 'websocket',
          ...CALAR,
          customLlmExtraBody: { notya_jeton: j.notya_jeton },
          ...(ovr ? { overrides: { agent: { language: 'en', firstMessage: j.first_message || '' }, tts: { voiceId: j.voice_id } } } : {}),
          clientTools: {
            [aracAdi]: (p: { text?: unknown }) => {
              if (typeof p?.text === 'string') setBalonlar((b) => ekranCevabi(b, p.text as string, sayac.current))
              return 'ok'
            },
          },
          onConnect: () => { baglandi = true; baglanmaAni = Date.now(); if (!bitti && gecerli()) setDurum('dinliyor') },
          onDisconnect: (d?: { reason?: string; message?: string; closeCode?: number; closeReason?: string }) => {
            if (bitti || !gecerli()) return
            if (d?.reason === 'error') { basarisiz(true, kisaAyrinti(`call closed ${d.closeCode ?? ''}`.trim(), d.closeReason || d.message)); return }
            bitti = true; sohbet.current = null; setBalonlar((b) => geciciyiOturt(b)); setDurum((x) => (x === 'hata' ? x : 'bosta'))
          },
          // A provider error BEFORE the call is up ends the attempt; one in the middle of a call (a screen-tool hiccup, a model
          // error on one turn) is shown but does not hang the call up — the provider closes the socket itself when it is fatal.
          onError: (m?: string) => {
            if (baglandi && !bitti && gecerli()) { setHata(hataYazisi(t.hata, kisaAyrinti('call', m))); return }
            basarisiz(true, kisaAyrinti('call', m))
          },
          onMessage: ({ message, role, event_id }: { message: string; role: string; event_id?: number }) => {
            if (bitti || !gecerli()) return
            if (!okunurMu(message)) return // the provider's keep-alive "." is never a bubble
            const olay = typeof event_id === 'number' ? event_id : undefined
            if (role === 'user') { kullaniciKonustu = true; setBalonlar((b) => sesKullanicisi(geciciyiOturt(b), message, olay, sayac.current)) }
            else if (!kullaniciKonustu && baglanmaAni && Date.now() - baglanmaAni < 8000) setBalonlar((b) => selamEkle(b, message, sayac.current))
            else setBalonlar((b) => sesAsistani(b, message, sayac.current))
          },
          onModeChange: ({ mode }: { mode: string }) => { if (!bitti && gecerli()) setDurum(mode === 'speaking' ? 'konusuyor' : 'dinliyor') },
        })
        if (bitti || !gecerli()) { try { await baglanti.endSession() } catch { /* gone */ } return }
        sohbet.current = baglanti
      } catch (e) {
        // startSession rejects with the step that failed (socket, worklet, microphone): its message is the diagnosis.
        basarisiz(true, kisaAyrinti('setup', e))
      }
    }
    await dene(true)
  }, [t, api, durum])

  /**
   * Türkiye's rule (NOTYA-SES-SESSIZ-01): from the moment the written chat is used while the voice is live, the voice goes
   * quiet — the call ends, the page and the written chat stay, and the microphone starts a new call.
   */
  const sustur = useCallback(async () => {
    const d = durumRef.current
    if (!sohbet.current && d !== 'baglaniyor' && d !== 'dinliyor' && d !== 'konusuyor') return
    nesil.current += 1
    const c = sohbet.current
    sohbet.current = null
    setBalonlar((b) => geciciyiOturt(b))
    if (c) { try { await c.endSession() } catch { /* already closed */ } }
    setDurum('sessiz')
  }, [])

  const girdiAyarla = useCallback((g: string) => {
    setYaziliGirdi(g)
    if (g.trim()) void sustur()
  }, [sustur])

  const yaziliMikrofon = useCallback(() => {
    if (yaziliDinliyor) { try { tanimaRef.current?.stop() } catch { /* quiet */ } setYaziliDinliyor(false); return }
    const w = window as unknown as { webkitSpeechRecognition?: new () => Tanima; SpeechRecognition?: new () => Tanima }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) { setYaziliGirdi(t?.sayfa.sesDestegiYok ?? ''); return }
    const r = new Ctor()
    r.lang = dil || 'en'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      let son = ''
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) son += e.results[i][0].transcript
      if (son) girdiAyarla((girdiRef.current ? girdiRef.current + ' ' : '') + son.trim())
    }
    r.onend = () => setYaziliDinliyor(false)
    r.onerror = () => setYaziliDinliyor(false)
    tanimaRef.current = r
    r.start()
    setYaziliDinliyor(true)
  }, [yaziliDinliyor, t, dil, girdiAyarla])

  const yaziliGonder = useCallback(async () => {
    const soru = yaziliGirdi.trim()
    if (!t || !api || !soru || bekliyor) return
    await sustur()
    try { tanimaRef.current?.stop() } catch { /* quiet */ }
    setYaziliDinliyor(false)
    setYaziliGirdi('')
    setYaziliAcik(true)
    setHata(null)
    const siradaki = () => (sayac.current.sira += 1)
    // What the assistant is told so far: voice and written lines in the order they were said, the last twelve.
    const gecmis = [
      ...balonRef.current.filter((b) => !b.gecici).map((b) => ({ sira: b.sira, rol: b.role === 'user' ? 'siz' : 'asistan', metin: b.text })),
      ...yaziliRef.current.map((m) => ({ sira: m.sira, rol: m.rol === 'doktor' ? 'siz' : 'asistan', metin: m.icerik })),
    ].sort((a, b) => a.sira - b.sira).slice(-12).map(({ rol, metin }) => ({ rol, metin }))
    setYazili((onceki) => [...onceki, { rol: 'doktor', icerik: soru, sira: siradaki() }])
    setBekliyor(true)
    try {
      const r = await api('/api/ulke/asistan-canli/yazili', { method: 'POST', govde: { mesaj: soru, gecmis } })
      const cevap = (r.j as { cevap?: unknown }).cevap
      const satir = r.status === 429 ? t.limit : r.ok && typeof cevap === 'string' && cevap.trim() ? cevap : t.sayfa.yaziHata
      setYazili((onceki) => [...onceki, { rol: 'asistan', icerik: satir, sira: siradaki() }])
    } catch { setYazili((onceki) => [...onceki, { rol: 'asistan', icerik: t.sayfa.yaziHata, sira: siradaki() }]) }
    setBekliyor(false)
  }, [t, api, bekliyor, yaziliGirdi, sustur])

  const temizle = useCallback(() => { setBalonlar([]); setYazili([]); if (anahtar) sohbetYaz(anahtar, [], []) }, [anahtar])

  return {
    hazir, durum, balonlar, hata, baslat, bitir, temizle, sustur,
    yazili: { acik: yaziliAcik, mesajlar: yazili, girdi: yaziliGirdi, bekliyor, dinliyor: yaziliDinliyor },
    setYaziliAcik, setYaziliGirdi: girdiAyarla, yaziliGonder, yaziliMikrofon,
  }
}
