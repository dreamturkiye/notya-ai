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
import { sohbetMaxSira, sohbetOku, sohbetYaz } from '@/lib/asistan/sohbetGecmisi'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ulkeYolu } from '@/lib/ulke/yol'
import { ekranCevabi, geciciyiOturt, saklanacak, saklidan, selamEkle, sesAsistani, sesKullanicisi, yaziliEkle, yeniCagri, type BalonSayaci, type SohbetBalon } from '@/lib/ulke/asistan/balonlar'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'
import type { Api } from './Kabuk'

export type CanliDurumu = 'bosta' | 'baglaniyor' | 'dinliyor' | 'konusuyor' | 'hata'
export type Metin = NonNullable<UygulamaMetni['asistanCanli']>
export type Hazir = { ad: string; kisaAd: string; cinsiyet: 'erkek' | 'kadin' | null }

/** The two worklet files live under the country's path prefix (public/ses/). */
export const CALAR = {
  workletPaths: { audioConcatProcessor: ulkeYolu(SES_CALAR.workletPaths.audioConcatProcessor) },
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
type DurumCevabi = { hazir?: boolean; ad?: string; kisaAd?: string; cinsiyet?: string }

export function useCanliOturum({ t, api }: { t: Metin | undefined; api: Api | undefined }) {
  /** undefined = not asked yet · null = not available (draw nothing / say so) · object = available. */
  const [hazir, setHazir] = useState<Hazir | null | undefined>(undefined)
  const [durum, setDurum] = useState<CanliDurumu>('bosta')
  const [balonlar, setBalonlar] = useState<SohbetBalon[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
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
          setHazir({ ad: j.ad, kisaAd: typeof j.kisaAd === 'string' && j.kisaAd ? j.kisaAd : j.ad, cinsiyet: j.cinsiyet === 'erkek' || j.cinsiyet === 'kadin' ? j.cinsiyet : null })
        } else setHazir(null)
      } catch { if (!iptal) setHazir(null) }
    })()
    return () => { iptal = true }
  }, [t, api])

  // History: the last 50 bubbles of this browser, loaded once the persona is known (event ids of an earlier call are dropped).
  useEffect(() => {
    if (!anahtar || yuklendi.current) return
    yuklendi.current = true
    const g = sohbetOku(anahtar)
    const { liste, sira } = saklidan(g.ses)
    sayac.current.sira = Math.max(sira, sohbetMaxSira(g))
    if (liste.length) setBalonlar((onceki) => (onceki.length ? onceki : yeniCagri(liste)))
  }, [anahtar])
  useEffect(() => {
    // An empty list is never written here (the load above has not been applied yet on the first pass); "clear" writes it itself.
    if (!anahtar || !yuklendi.current || balonlar.length === 0) return
    sohbetYaz(anahtar, saklanacak(balonlar), [])
  }, [anahtar, balonlar])

  const bitir = useCallback(async () => {
    nesil.current += 1
    const c = sohbet.current
    sohbet.current = null
    setBalonlar((b) => geciciyiOturt(b))
    if (c) { try { await c.endSession() } catch { /* already closed */ } }
    setDurum('bosta')
  }, [])

  useEffect(() => () => { nesil.current += 1; const c = sohbet.current; sohbet.current = null; if (c) void c.endSession().catch(() => {}) }, [])

  const baslat = useCallback(async () => {
    if (!t || !api || sohbet.current || durum === 'baglaniyor') return
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
      const basarisiz = (yenidenDene: boolean) => {
        if (bitti || !gecerli()) return
        bitti = true
        const c = sohbet.current
        sohbet.current = null
        if (c) void c.endSession().catch(() => {})
        if (yenidenDene && ovr && !baglandi) { void dene(false); return }
        setHata(t.hata); setDurum('hata')
      }
      try {
        const r = await api('/api/ulke/asistan-canli', { method: 'POST' })
        if (!gecerli()) return
        const j = r.j as { signed_url?: string; voice_id?: string; first_message?: string; notya_jeton?: string; ekran_araci?: string }
        if (r.status === 429) { setHata(t.limit); setDurum('hata'); return }
        if (!r.ok || !j.signed_url || !j.notya_jeton || !j.voice_id) { setHata(t.hata); setDurum('hata'); return }
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
          onDisconnect: (d?: { reason?: string }) => {
            if (bitti || !gecerli()) return
            if (d?.reason === 'error') { basarisiz(true); return }
            bitti = true; sohbet.current = null; setBalonlar((b) => geciciyiOturt(b)); setDurum((x) => (x === 'hata' ? x : 'bosta'))
          },
          onError: () => basarisiz(true),
          onMessage: ({ message, role, event_id }: { message: string; role: string; event_id?: number }) => {
            if (bitti || !gecerli()) return
            const olay = typeof event_id === 'number' ? event_id : undefined
            if (role === 'user') { kullaniciKonustu = true; setBalonlar((b) => sesKullanicisi(geciciyiOturt(b), message, olay, sayac.current)) }
            else if (!kullaniciKonustu && baglanmaAni && Date.now() - baglanmaAni < 8000) setBalonlar((b) => selamEkle(b, message, sayac.current))
            else setBalonlar((b) => sesAsistani(b, message, sayac.current))
          },
          onModeChange: ({ mode }: { mode: string }) => { if (!bitti && gecerli()) setDurum(mode === 'speaking' ? 'konusuyor' : 'dinliyor') },
        })
        if (bitti || !gecerli()) { try { await baglanti.endSession() } catch { /* gone */ } return }
        sohbet.current = baglanti
      } catch {
        basarisiz(true)
      }
    }
    await dene(true)
  }, [t, api, durum])

  const gonder = useCallback(async (metin: string) => {
    const soru = metin.trim()
    if (!t || !api || !soru || bekliyor) return
    setHata(null)
    const gecmis = balonRef.current.filter((b) => !b.gecici).slice(-12).map((b) => ({ rol: b.role === 'user' ? 'siz' : 'asistan', metin: b.text }))
    setBalonlar((b) => yaziliEkle(b, 'user', soru, sayac.current))
    setBekliyor(true)
    try {
      const r = await api('/api/ulke/asistan-canli/yazili', { method: 'POST', govde: { mesaj: soru, gecmis } })
      const cevap = (r.j as { cevap?: unknown }).cevap
      if (r.status === 429) setHata(t.limit)
      else if (r.ok && typeof cevap === 'string' && cevap.trim()) setBalonlar((b) => yaziliEkle(b, 'ai', cevap, sayac.current))
      else setHata(t.sayfa.yaziHata)
    } catch { setHata(t.sayfa.yaziHata) }
    setBekliyor(false)
  }, [t, api, bekliyor])

  const temizle = useCallback(() => { setBalonlar([]); if (anahtar) sohbetYaz(anahtar, [], []) }, [anahtar])

  return { hazir, durum, balonlar, hata, bekliyor, baslat, bitir, gonder, temizle }
}
