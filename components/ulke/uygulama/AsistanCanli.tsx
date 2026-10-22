'use client'

/**
 * AU-CANLI-01 — the LIVE SPOKEN ASSISTANT on the doctor's home (the country kit's counterpart of Türkiye's /asistan
 * voice page). One microphone button, a short transcript, the full written answer on the screen.
 *
 * FAIL CLOSED. The component asks the server whether the assistant is available (`GET /api/ulke/asistan-canli`) and
 * draws NOTHING until the answer is `hazir: true`. A pack without the feature, a role without a persona, a deployment
 * without the agents or the secrets: no microphone, no placeholder, no error — the home looks as it did before.
 *
 * The call is the provider's ConvAI WebSocket with a signed, one-time address. The agent's brain is our Custom LLM
 * endpoint; the signed call token travels as `customLlmExtraBody`. The screen tool `show_on_screen` carries the full
 * answer (the voice says only the first few sentences — lib/ulke/asistan/konusma.ts).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Conversation } from '@/components/AsistanConversation'
import { SES_CALAR } from '@/lib/asistan/sesCalar'
import { ulkeYolu } from '@/lib/ulke/yol'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'
import type { Api } from './Kabuk'

export type CanliDurumu = 'bosta' | 'baglaniyor' | 'dinliyor' | 'konusuyor' | 'hata'
export type CanliMesaj = { id: number; rol: 'siz' | 'asistan'; metin: string }
type Metin = NonNullable<UygulamaMetni['asistanCanli']>

/** The two worklet files live under the country's path prefix (public/ses/). */
const CALAR = {
  workletPaths: { audioConcatProcessor: ulkeYolu(SES_CALAR.workletPaths.audioConcatProcessor) },
  libsampleratePath: ulkeYolu(SES_CALAR.libsampleratePath),
} as const

/** Pure: renders in a plain test. */
export function CanliPanel({ t, ad, durum, mesajlar, gecici, hata, onBaslat, onBitir }: {
  t: Metin; ad: string; durum: CanliDurumu; mesajlar: readonly CanliMesaj[]; gecici: string; hata: string | null
  onBaslat: () => void; onBitir: () => void
}) {
  const aktif = durum === 'baglaniyor' || durum === 'dinliyor' || durum === 'konusuyor'
  const etiket = durum === 'baglaniyor' ? t.baglaniyor : durum === 'dinliyor' ? t.dinliyor : durum === 'konusuyor' ? t.konusuyor : t.baslat
  return (
    <section className="uza-kart" data-alan="asistan-canli" data-durum={durum}>
      <p className="uza-ust-yazi">{ad}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 6 }}>
        <button type="button" className={aktif ? 'uza-dugme uza-dugme-cizgi' : 'uza-dugme'} data-eylem={aktif ? 'bitir' : 'baslat'} aria-pressed={aktif} disabled={durum === 'baglaniyor'} onClick={aktif ? onBitir : onBaslat}>
          {aktif ? t.bitir : t.baslat}
        </button>
        <span aria-live="polite" data-alan="asistan-canli-durum">{aktif ? etiket : ''}</span>
      </div>
      {hata ? <p role="alert" data-alan="asistan-canli-hata" style={{ marginTop: 8 }}>{hata}</p> : null}
      {mesajlar.length > 0 || gecici ? (
        <div data-alan="asistan-canli-yazi" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mesajlar.map((m) => (
            <div key={m.id} data-rol={m.rol} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              <strong>{m.rol === 'siz' ? t.siz : ad}</strong>{': '}{m.metin}
            </div>
          ))}
          {gecici ? <div data-rol="gecici" style={{ opacity: 0.7, lineHeight: 1.5 }}>{gecici}</div> : null}
        </div>
      ) : null}
      <p className="uza-ipucu" style={{ marginTop: 10 }} data-alan="asistan-canli-not">{t.not}</p>
    </section>
  )
}

type DurumCevabi = { hazir?: boolean; ad?: string }

export function AsistanCanli({ m, api }: { m: UygulamaMetni; api?: Api }) {
  const t = m.asistanCanli
  const [hazir, setHazir] = useState<{ ad: string } | null>(null)
  const [durum, setDurum] = useState<CanliDurumu>('bosta')
  const [mesajlar, setMesajlar] = useState<CanliMesaj[]>([])
  const [gecici, setGecici] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const sohbet = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null)
  const sayac = useRef(0)
  const geciciRef = useRef('')

  // Is it available? Anything but a clear yes draws nothing.
  useEffect(() => {
    if (!t || !api) return
    let iptal = false
    ;(async () => {
      try {
        const r = await api('/api/ulke/asistan-canli')
        const j = r.j as DurumCevabi
        if (!iptal && r.ok && j.hazir === true && typeof j.ad === 'string' && j.ad) setHazir({ ad: j.ad })
      } catch { /* stays hidden */ }
    })()
    return () => { iptal = true }
  }, [t, api])

  const ekle = useCallback((rol: CanliMesaj['rol'], metin: string) => {
    const temiz = metin.trim()
    if (!temiz) return
    sayac.current += 1
    setMesajlar((onceki) => [...onceki, { id: sayac.current, rol, metin: temiz }].slice(-40))
  }, [])

  const durdur = useCallback(async () => {
    const c = sohbet.current
    sohbet.current = null
    // A spoken line that never got its full answer (the screen tool was not called) is kept as the transcript.
    if (geciciRef.current) { ekle('asistan', geciciRef.current); geciciRef.current = ''; setGecici('') }
    if (c) { try { await c.endSession() } catch { /* already closed */ } }
    setDurum('bosta')
  }, [ekle])

  useEffect(() => () => { const c = sohbet.current; sohbet.current = null; if (c) void c.endSession().catch(() => {}) }, [])

  const baslat = useCallback(async () => {
    if (!t || !api || sohbet.current) return
    setHata(null); setDurum('baglaniyor'); setMesajlar([]); setGecici(''); geciciRef.current = ''
    try {
      const r = await api('/api/ulke/asistan-canli', { method: 'POST' })
      const j = r.j as { signed_url?: string; voice_id?: string; first_message?: string; notya_jeton?: string; ekran_araci?: string }
      if (r.status === 429) { setHata(t.limit); setDurum('hata'); return }
      if (!r.ok || !j.signed_url || !j.notya_jeton || !j.voice_id) { setHata(t.hata); setDurum('hata'); return }
      const aracAdi = j.ekran_araci || 'show_on_screen'
      const baglanti = await Conversation.startSession({
        signedUrl: j.signed_url,
        connectionType: 'websocket',
        ...CALAR,
        customLlmExtraBody: { notya_jeton: j.notya_jeton },
        overrides: { agent: { language: 'en', firstMessage: j.first_message || '' }, tts: { voiceId: j.voice_id } },
        clientTools: {
          [aracAdi]: (p: { text?: unknown }) => {
            // The full written answer replaces the spoken line shown while it was being said.
            geciciRef.current = ''; setGecici('')
            if (typeof p?.text === 'string') ekle('asistan', p.text)
            return 'ok'
          },
        },
        onConnect: () => { setDurum('dinliyor') },
        onDisconnect: () => { sohbet.current = null; setDurum((d) => (d === 'hata' ? d : 'bosta')) },
        onError: () => { setHata(t.hata); setDurum('hata') },
        onMessage: ({ message, role }: { message: string; role: string }) => {
          if (role === 'user') {
            if (geciciRef.current) { ekle('asistan', geciciRef.current); geciciRef.current = ''; setGecici('') }
            ekle('siz', message)
          } else {
            geciciRef.current = geciciRef.current ? `${geciciRef.current} ${message}` : message
            setGecici(geciciRef.current)
          }
        },
        onModeChange: ({ mode }: { mode: string }) => { setDurum(mode === 'speaking' ? 'konusuyor' : 'dinliyor') },
      })
      sohbet.current = baglanti
    } catch {
      sohbet.current = null
      setHata(t.mikrofon); setDurum('hata')
    }
  }, [t, api, ekle])

  if (!t || !api || !hazir) return null
  return <CanliPanel t={t} ad={hazir.ad} durum={durum} mesajlar={mesajlar} gecici={gecici} hata={hata} onBaslat={() => { void baslat() }} onBitir={() => { void durdur() }} />
}
