'use client'

/**
 * NOTYA-ILETISIM-03 — Ayarlar › İletişim: "WhatsApp mesajları kendiliğinden gitsin".
 *
 * Doktor bir kez WhatsApp'ı bağlar (Meta Embedded Signup, WhatsApp Business uygulaması kullanıcıları
 * için "coexistence"); Notya randevu hatırlatmalarını onun kendi numarasından gönderir, o da telefonundaki
 * uygulamayı kullanmaya devam eder. Facebook JS SDK YALNIZ bu bileşende, yalnız bağlı değilken yüklenir.
 * Ortam değişkenleri yoksa /status 503 döner → sakin bir "Yakında" satırı.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'

type SablonOzeti = 'hazir' | 'bekliyor' | 'sorun'
type Kurulum = { appId: string; configId: string; graphSurum: string }

export type WhatsAppGorunumu =
  | { tur: 'yukleniyor' }
  | { tur: 'yakinda' }
  | { tur: 'bagli-degil'; kurulum: Kurulum }
  | { tur: 'bagli'; numara: string | null; sablon: SablonOzeti }

const SABLON_METNI: Record<SablonOzeti, string> = {
  hazir: 'Hazır',
  bekliyor: 'Onay bekliyor',
  sorun: 'Onaylanmadı',
}

const kart: React.CSSProperties = {
  background: CHROME_RENK.paper,
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  padding: '18px 20px',
  color: CHROME_RENK.ink,
  fontFamily: CHROME_FONT.sans,
  boxSizing: 'border-box',
  width: '100%',
}

const birincilDugme: React.CSSProperties = {
  minHeight: 44,
  padding: '10px 20px',
  borderRadius: 12,
  border: 'none',
  background: CHROME_RENK.pine,
  color: CHROME_RENK.cream,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: CHROME_FONT.sans,
  cursor: 'pointer',
}

const sessizDugme: React.CSSProperties = {
  minHeight: 44,
  padding: '10px 4px',
  border: 'none',
  background: 'transparent',
  color: CHROME_RENK.muted,
  fontSize: 14,
  fontFamily: CHROME_FONT.sans,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
}

/** Sunumsal kısım (SSR testi için ayrı). */
export function WhatsAppBaglanKarti(props: {
  g: WhatsAppGorunumu
  mesgul?: boolean
  hata?: string | null
  onBagla?: () => void
  onKaldir?: () => void
}) {
  const { g, mesgul, hata } = props
  if (g.tur === 'yukleniyor') return null
  if (g.tur === 'yakinda') {
    return (
      <div data-whatsapp-baglan="yakinda" style={{ ...kart, color: CHROME_RENK.muted, fontSize: 14 }}>
        WhatsApp ile otomatik gönderim yakında.
      </div>
    )
  }
  const hataSatiri = hata ? (
    <p role="alert" style={{ margin: '10px 0 0', fontSize: 13, color: CHROME_RENK.warn }}>{hata}</p>
  ) : null

  if (g.tur === 'bagli-degil') {
    return (
      <div data-whatsapp-baglan="bagli-degil" style={kart}>
        <h3 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 560, fontSize: 19 }}>
          WhatsApp mesajları kendiliğinden gitsin
        </h3>
        <div style={{ marginTop: 14 }}>
          <button type="button" onClick={props.onBagla} disabled={mesgul} style={{ ...birincilDugme, opacity: mesgul ? 0.6 : 1 }}>
            {mesgul ? 'Bağlanıyor…' : 'WhatsApp’ı bağla'}
          </button>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.45 }}>
          WhatsApp Business uygulaması gerekir — ücretsizdir, numaranız ve sohbetleriniz aynen kalır.
        </p>
        {hataSatiri}
      </div>
    )
  }

  return (
    <div data-whatsapp-baglan="bagli" style={kart}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span aria-hidden style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: 12, background: CHROME_RENK.pine, color: CHROME_RENK.cream, alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>✓</span>
        <span style={{ fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{g.numara || 'WhatsApp bağlı'}</span>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: CHROME_RENK.ink }}>
        Mesaj şablonları: <strong style={{ color: g.sablon === 'sorun' ? CHROME_RENK.warn : g.sablon === 'hazir' ? CHROME_RENK.pine : CHROME_RENK.muted }}>{SABLON_METNI[g.sablon]}</strong>
      </p>
      <button type="button" onClick={props.onKaldir} disabled={mesgul} style={{ ...sessizDugme, marginTop: 6 }}>
        Bağlantıyı kaldır
      </button>
      {hataSatiri}
    </div>
  )
}

// ---- Facebook JS SDK (yalnız bu bileşen) ----

type FbLoginYaniti = { authResponse?: { code?: string } | null; status?: string }
type FbSdk = {
  init(o: { appId: string; autoLogAppEvents?: boolean; xfbml?: boolean; version: string }): void
  login(cb: (r: FbLoginYaniti) => void, o: Record<string, unknown>): void
}
declare global {
  interface Window { FB?: FbSdk; fbAsyncInit?: () => void }
}

const SDK_ID = 'facebook-jssdk'

function sdkYukle(k: Kurulum): Promise<FbSdk> {
  return new Promise((coz, reddet) => {
    if (window.FB) return coz(window.FB)
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: k.appId, autoLogAppEvents: true, xfbml: false, version: k.graphSurum })
      coz(window.FB!)
    }
    if (document.getElementById(SDK_ID)) return
    const s = document.createElement('script')
    s.id = SDK_ID
    s.src = 'https://connect.facebook.net/en_US/sdk.js'
    s.async = true
    s.defer = true
    s.crossOrigin = 'anonymous'
    s.onerror = () => reddet(new Error('sdk'))
    document.body.appendChild(s)
  })
}

type OturumBilgisi = { wabaId: string; phoneNumberId: string | null; businessId: string | null }

/**
 * Embedded Signup oturum bilgisi (window message, facebook.com kökenli). Yalnız bu şekli kabul eder.
 * Coexistence bitişi (FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING) çoğu zaman yalnız waba_id taşır; numara
 * sunucuda WABA'dan çözülür. Hata da CANCEL olarak gelir, data.error_code ile ayrılır.
 */
export function oturumBilgisiCoz(origin: string, veri: unknown): ({ tur: 'bitti' } & OturumBilgisi) | { tur: 'iptal' } | { tur: 'hata' } | null {
  let host = ''
  try { host = new URL(origin).hostname } catch { return null }
  if (!origin.startsWith('https://') || (host !== 'facebook.com' && !host.endsWith('.facebook.com'))) return null
  let j: Record<string, unknown>
  try { j = typeof veri === 'string' ? JSON.parse(veri) : (veri as Record<string, unknown>) } catch { return null }
  if (!j || j.type !== 'WA_EMBEDDED_SIGNUP') return null
  const d = (j.data && typeof j.data === 'object' ? j.data : {}) as Record<string, unknown>
  const olay = String(j.event || '')
  if (olay === 'FINISH' || olay === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' || olay === 'FINISH_ONLY_WABA') {
    const wabaId = String(d.waba_id || '')
    if (!wabaId) return { tur: 'hata' }
    return { tur: 'bitti', wabaId, phoneNumberId: d.phone_number_id ? String(d.phone_number_id) : null, businessId: d.business_id ? String(d.business_id) : null }
  }
  if (olay === 'CANCEL') return d.error_code != null || d.error_message ? { tur: 'hata' } : { tur: 'iptal' }
  return null
}

async function istek(yol: string, init?: RequestInit): Promise<Response | null> {
  const t = await ensureDoctorAccessToken()
  if (!t) return null
  return fetch(yol, { ...init, cache: 'no-store', headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}` } })
}

export default function WhatsAppBaglan() {
  const [g, setG] = useState<WhatsAppGorunumu>({ tur: 'yukleniyor' })
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const kod = useRef<string | null>(null)
  const oturum = useRef<OturumBilgisi | null>(null)
  const sdk = useRef<FbSdk | null>(null)

  const yenile = useCallback(async () => {
    try {
      const r = await istek('/api/iletisim/whatsapp/status')
      if (!r) return
      if (r.status === 503) return setG({ tur: 'yakinda' })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j) return setG({ tur: 'yakinda' })
      if (j.bagli) setG({ tur: 'bagli', numara: j.numara ?? null, sablon: j.sablon || 'bekliyor' })
      else setG({ tur: 'bagli-degil', kurulum: j.kurulum })
    } catch {
      setG({ tur: 'yakinda' })
    }
  }, [])

  useEffect(() => { yenile() }, [yenile])

  // SDK'yı düğmeden ÖNCE yükle: FB.login tıklamayla aynı anda çağrılmalı, yoksa açılır pencere engellenir.
  const kurulum = g.tur === 'bagli-degil' ? g.kurulum : null
  useEffect(() => {
    if (!kurulum) return
    let iptal = false
    sdkYukle(kurulum).then((fb) => { if (!iptal) sdk.current = fb }).catch(() => { if (!iptal) setHata('Facebook bağlantısı yüklenemedi. Sayfayı yenileyip yeniden deneyin.') })
    return () => { iptal = true }
  }, [kurulum])

  const tamamla = useCallback(async () => {
    if (!kod.current || !oturum.current) return
    const govde = { code: kod.current, ...oturum.current }
    kod.current = null
    oturum.current = null
    try {
      const r = await istek('/api/iletisim/whatsapp/complete-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) })
      const j = r ? await r.json().catch(() => ({})) : {}
      if (!r?.ok) setHata(j.error || 'WhatsApp bağlantısı tamamlanamadı. Lütfen yeniden deneyin.')
      else setHata(null)
    } catch {
      setHata('WhatsApp bağlantısı tamamlanamadı. Lütfen yeniden deneyin.')
    }
    setMesgul(false)
    yenile()
  }, [yenile])

  useEffect(() => {
    const dinle = (e: MessageEvent) => {
      const b = oturumBilgisiCoz(e.origin, e.data)
      if (!b) return
      if (b.tur === 'bitti') {
        oturum.current = { wabaId: b.wabaId, phoneNumberId: b.phoneNumberId, businessId: b.businessId }
        tamamla()
      } else {
        setMesgul(false)
        if (b.tur === 'hata') setHata('WhatsApp bağlantısı tamamlanamadı. Lütfen yeniden deneyin.')
      }
    }
    window.addEventListener('message', dinle)
    return () => window.removeEventListener('message', dinle)
  }, [tamamla])

  const bagla = () => {
    if (!kurulum || !sdk.current) {
      setHata('Facebook bağlantısı henüz hazır değil. Birkaç saniye sonra yeniden deneyin.')
      return
    }
    setHata(null)
    setMesgul(true)
    sdk.current.login(
      (r) => {
        const c = r?.authResponse?.code
        if (!c) { setMesgul(false); return }
        kod.current = c
        tamamla()
        // Kod 30 sn yaşar; oturum bilgisi gelmezse bekletme, doktora yeniden denemesini söyle.
        window.setTimeout(() => {
          if (kod.current === c) {
            kod.current = null
            setMesgul(false)
            setHata('WhatsApp bağlantısı tamamlanamadı. Lütfen yeniden deneyin.')
          }
        }, 15000)
      },
      {
        config_id: kurulum.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' },
      }
    )
  }

  const kaldir = async () => {
    if (!window.confirm('WhatsApp bağlantısı kaldırılsın mı? Telefonunuzdaki uygulama ve sohbetleriniz etkilenmez.')) return
    setMesgul(true)
    try {
      const r = await istek('/api/iletisim/whatsapp/disconnect', { method: 'POST' })
      if (!r?.ok) setHata('Bağlantı kaldırılamadı. Lütfen yeniden deneyin.')
      else setHata(null)
    } catch {
      setHata('Bağlantı kaldırılamadı. Lütfen yeniden deneyin.')
    }
    setMesgul(false)
    yenile()
  }

  return <WhatsAppBaglanKarti g={g} mesgul={mesgul} hata={hata} onBagla={bagla} onKaldir={kaldir} />
}
