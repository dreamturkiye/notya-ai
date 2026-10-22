'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — the frame every screen of the signed-in application shares: session, account, language.
 *
 * useUygulama(ekran)   resolves the browser session against the deployment's OWN Supabase project, asks the server
 *                      who the account is (/api/ulke/hesap) and in which language it reads. No session, or an
 *                      account that does not belong to this country → back to /login. An account that has not
 *                      answered the language question, or has not chosen its role (NOTYA-UZ-BRANSLAR-01), is sent
 *                      to /start before anything else.
 * Cerceve              the visible frame (word mark, the links, log out). Pure: it renders in a plain test.
 *
 * NOTYA-ULKE-KLINIK-01 — two accounts are NOT sent to the role question: one that opens the clinic's screen (an
 * invitation code is entered before a role is chosen), and a FRONT-DESK member of a clinic, who needs no role and
 * whose application is the front-desk workspace, the clinic and the settings.
 *
 * Every sentence comes from the pack's catalogue (./metinler) in the ACCOUNT's language, never the browser's.
 */
import React, { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { UYGULAMA_EKRANLARI, type UygulamaEkrani } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'
import { useBitki } from './bitki'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { araclarMetni, klinikMetni, marka, randevuMetni, roller, rolMu, uygulamaDili, uygulamaMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { hesapSaatDilimi, hesapSaatDilimiAyarla, saatBicimi } from '@/lib/ulke/arayuz/bicim'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'

/**
 * ADDRESSES of the application's screens: the routes of UYGULAMA_EKRANLARI under the country's path prefix
 * (notya.io/uzbek/today). Every link, form action and `window.location` on these screens uses them.
 */
export const YOL = Object.fromEntries(Object.entries(UYGULAMA_EKRANLARI).map(([ekran, rota]) => [ekran, ulkeYolu(rota)])) as { readonly [E in UygulamaEkrani]: string }
/**
 * Screens that exist in this build. A link to a screen that has not landed yet is not rendered at all — an address
 * that answers "not found" is never offered. (The route test proves every `true` here has its page.)
 */
export const HAZIR = { muayene: true, takvim: true } as const
const GIRIS = ulkeYolu('/login')
const BEKLETME = ulkeYolu('/welcome')

export type Hesap = {
  dil: DilKodu; notDili: DilKodu; ad: string
  /** The role the account works as (a key of ../klinik/rolAdlari.ts), or null while it has not chosen one. */
  rol: string | null
  /** false = the first-login language question is still to be answered. */
  dilSoruldu: boolean
  /** The account's time zone and the zones it may choose — present only where the country has more than one. */
  saatDilimi?: string
  saatDilimleri?: readonly string[]
  /** Optional professional registration. Absent when the account has none. */
  meslekKaydi?: string
  /**
   * NOTYA-ULKE-KLINIK-01 — true = a FRONT-DESK member of a clinic who works in no role: the application is the
   * front-desk workspace, the clinic and the settings, and the navigation shows those and no doctor's screen.
   */
  onBuro?: boolean
}
export type ApiCevabi = { ok: boolean; status: number; j: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
/** `yol` is a ROUTE of the API ('/api/ulke/hesap'); the call adds the country's path prefix. */
export type Api = (yol: string, secenek?: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; govde?: unknown }) => Promise<ApiCevabi>

export type Uygulama = {
  /** null until the account is known. */
  hesap: Hesap | null
  m: UygulamaMetni
  dil: DilKodu
  api: Api
  hesabiGuncelle: (h: Partial<Hesap>) => void
  cikis: () => void
}

export function useUygulama(ekran: UygulamaEkrani): Uygulama {
  const [hesap, setHesap] = useState<Hesap | null>(null)
  const jeton = useRef<string>('')

  const cikis = useCallback(async () => {
    try { await ulkeIstemciSupabase()?.auth.signOut() } catch { /* already gone */ }
    window.location.replace(GIRIS)
  }, [])

  const api = useCallback<Api>(async (yol, secenek) => {
    // The session may have been refreshed since the page loaded: always ask for the current token.
    try {
      const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }
      if (data.session?.access_token) jeton.current = data.session.access_token
    } catch { /* keep the last known token */ }
    const r = await fetch(ulkeYolu(yol), {
      method: secenek?.method ?? 'GET',
      headers: { Authorization: `Bearer ${jeton.current}`, ...(secenek?.govde !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: secenek?.govde !== undefined ? JSON.stringify(secenek.govde) : undefined,
      cache: 'no-store',
    })
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>
    if (r.status === 401) { void cikis() }
    return { ok: r.ok, status: r.status, j }
  }, [cikis])

  useEffect(() => {
    let iptal = false
    ;(async () => {
      const supabase = ulkeIstemciSupabase()
      if (!supabase) { window.location.replace(GIRIS); return }
      const { data } = await supabase.auth.getSession()
      if (!data.session?.access_token) { window.location.replace(GIRIS); return }
      jeton.current = data.session.access_token
      let r: ApiCevabi
      try { r = await api('/api/ulke/hesap') } catch { return } // offline: stay on "loading"; a reload tries again
      if (iptal) return
      if (!r.ok) { await cikis(); return }
      if (r.j.durum !== 'uygulama') { window.location.replace(BEKLETME); return }
      // The role: asked after the language. A value that is not one of this country's roles counts as "not chosen".
      let rol: string | null = null
      try { const rr = await api('/api/ulke/rol'); if (rr.ok && rolMu(rr.j.rol)) rol = rr.j.rol } catch { return }
      if (iptal) return
      const dilSoruldu = Boolean(r.j.dilSoruldu)
      // A country without roles asks for none: only the language question stands between the account and the home.
      const rolTamam = Boolean(rol) || roller().length === 0
      // NOTYA-ULKE-KLINIK-01 — only an account WITHOUT a role is asked whether it is a clinic's front desk (one request,
      // and none for anybody who has chosen a role): a front-desk member needs no role, and works on the front-desk
      // workspace, the clinic's screen and the settings. (In a country that has no roles at all, nobody has one, and
      // every account is asked.) The clinic's screen is open to any account that has answered the language question,
      // so that an invitation code can be entered before a role is chosen.
      let onBuro = false
      if (dilSoruldu && !rol && ozellikAcik('klinikHesaplari')) {
        try { const kr = await api('/api/ulke/klinik'); onBuro = kr.ok && kr.j.klinik?.konum === 'on-buro' } catch { return }
        if (iptal) return
      }
      const onBuroEvi = ozellikAcik('randevu') ? YOL.onBuro : YOL.klinik
      if (onBuro) {
        if (ekran !== 'klinik' && ekran !== 'onBuro' && ekran !== 'ayarlar') { window.location.replace(onBuroEvi); return }
      } else if (!(dilSoruldu && !rolTamam && ekran === 'klinik' && ozellikAcik('klinikHesaplari'))) {
        // The rule for everybody else, exactly as before clinic accounts existed.
        if ((!dilSoruldu || !rolTamam) && ekran !== 'baslangic') { window.location.replace(YOL.baslangic); return }
        if (dilSoruldu && rolTamam && ekran === 'baslangic') { window.location.replace(YOL.bugun); return }
      }
      // Every day and hour the screens write from now on is in the account's own time zone (one of the pack's list).
      hesapSaatDilimiAyarla(r.j.saatDilimi)
      const dilimler = Array.isArray(r.j.saatDilimleri) ? (r.j.saatDilimleri as unknown[]).filter((x): x is string => typeof x === 'string') : []
      setHesap({ dil: uygulamaDili(r.j.dil), notDili: uygulamaDili(r.j.notDili), ad: String(r.j.ad || ''), rol, dilSoruldu, ...(onBuro ? { onBuro: true } : {}), ...(dilimler.length > 1 && typeof r.j.saatDilimi === 'string' ? { saatDilimi: r.j.saatDilimi, saatDilimleri: dilimler } : {}), ...(typeof r.j.meslekKaydi === 'string' && r.j.meslekKaydi ? { meslekKaydi: r.j.meslekKaydi } : {}) })
    })()
    return () => { iptal = true }
  }, [api, cikis, ekran])

  const hesabiGuncelle = useCallback((h: Partial<Hesap>) => setHesap((eski) => (eski ? { ...eski, ...h } : eski)), [])
  // Until the account is known a screen reads in the pack's default form.
  const dil = hesap?.dil ?? ulkePaketi().varsayilanDil
  return { hesap, m: uygulamaMetni(dil), dil, api, hesabiGuncelle, cikis }
}

/** Colours and fonts as variables on the root, from the one source of the look (lib/doktor/chromeRenk.ts). */
  const DEGISKENLER = {
  '--uza-krem': R.cream, '--uza-kagit': R.paper, '--uza-murekkep': R.ink, '--uza-soluk': R.muted, '--uza-cam': R.pine,
  '--uza-uyari': R.warn, '--uza-cizgi': R.border, '--uza-altin': R.gold, '--uza-nav': R.nav, '--uza-serif': CHROME_FONT.serif, '--uza-sans': CHROME_FONT.sans,
} as CSSProperties

export type Sekme = 'bugun' | 'takvim' | 'hastalar' | 'araclar' | 'klinik' | 'onBuro' | 'ayarlar' | 'fatura'

/** WMO weather code to a glyph. Same bands as the reference chrome; no sentence, so nothing to translate. */
function havaIkonu(kod: number): string {
  if (kod === 0) return '\u2600\uFE0F'
  if (kod <= 3) return '\u26C5'
  if (kod === 45 || kod === 48) return '\u{1F32B}\uFE0F'
  if (kod >= 51 && kod <= 67) return '\u{1F326}\uFE0F'
  if (kod >= 71 && kod <= 77) return '\u2744\uFE0F'
  if (kod >= 80 && kod <= 82) return '\u{1F326}\uFE0F'
  if (kod >= 95) return '\u26C8\uFE0F'
  return '\u{1F324}\uFE0F'
}

/** Clock in the account's zone, with the weather chip under it when the browser shares a place. */
function SaatKutusu() {
  const [saat, setSaat] = useState('')
  const [hava, setHava] = useState<{ sicaklik: number; kod: number } | null>(null)
  useEffect(() => {
    const yaz = () => {
      const tz = hesapSaatDilimi()
      const yerel = ulkePaketi().bicim.yerel
      setSaat(new Intl.DateTimeFormat(yerel, { hour: saatBicimi() === 12 ? 'numeric' : '2-digit', minute: '2-digit', hour12: saatBicimi() === 12, timeZone: tz }).format(new Date()))
    }
    yaz()
    const t = setInterval(yaz, 30000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    let iptal = false
    navigator.geolocation.getCurrentPosition(
      (konum) => {
        const { latitude, longitude } = konum.coords
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { current?: { temperature_2m?: number; weather_code?: number } } | null) => {
            if (iptal || !d?.current || typeof d.current.temperature_2m !== 'number') return
            setHava({ sicaklik: Math.round(d.current.temperature_2m), kod: Number(d.current.weather_code) })
          })
          .catch(() => {})
      },
      () => {},
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    )
    return () => { iptal = true }
  }, [])
  return (
    <div className="uza-saat-kutu">
      <div className="uza-saat-buyuk">{saat || '\u00A0'}</div>
      {hava ? <div className="uza-hava"><span>{havaIkonu(hava.kod)}</span><span>{hava.sicaklik}{'°'}</span></div> : null}
    </div>
  )
}

function harfler(ad: string): string {
  const p = ad.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

export function Cerceve({ dil, m, ad, unvan, aktif, cikis, sade, onBuro, children }: {
  dil: DilKodu
  m: UygulamaMetni
  ad?: string
  /** Role name under the account, in the account's language. */
  unvan?: string
  aktif?: Sekme | null
  cikis?: () => void
  /** true = no navigation (the first-login question, and "loading" before the account is known). */
  sade?: boolean
  /** NOTYA-ULKE-KLINIK-01 — true = the navigation of a front-desk member: the workspace, the clinic, the settings. */
  onBuro?: boolean
  children: ReactNode
}) {
  const baglanti = (s: Sekme, href: string, ad2: string) => (
    <a href={href} className="uza-sekme" aria-current={aktif === s ? 'page' : undefined}>{ad2}</a>
  )
  // Bundled photograph when the page provides one. The public/ address is only a fallback for a
  // test render: a country build does not serve files from public/.
  const bitkiSrc = useBitki() || ulkeYolu('/doktor-chrome/plant.jpg')
  return (
    <div className="uza" lang={dil} style={DEGISKENLER}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      {/* The same plant the Turkish doctor chrome uses (public/doktor-chrome/plant.jpg). The address goes through
          the country's path prefix; alt stays empty so it is decoration, not a sentence. */}
      {sade ? null : (
        <div className="uza-bitki-kutu" aria-hidden="true">
          <img src={bitkiSrc} alt="" className="uza-bitki" />
        </div>
      )}
      <header className="uza-ust">
        <div className="uza-ic uza-ust-ic">
          <a href={sade ? undefined : onBuro ? (ozellikAcik('randevu') ? YOL.onBuro : YOL.klinik) : YOL.bugun} className="uza-marka">
            <span className="uza-marka-yazi">
              <span className="uza-marka-ad">{marka()}</span>
              {m.kabuk.kas ? <span className="uza-kas">{onBuro && m.kabuk.onBuroKas ? m.kabuk.onBuroKas : m.kabuk.kas}</span> : null}
            </span>
          </a>
          {sade ? null : onBuro ? (
            <nav className="uza-nav" aria-label={m.kabuk.menu}>
              {m.kabuk.calismaAlani ? <div className="uza-grup">{m.kabuk.calismaAlani}</div> : null}
              {ozellikAcik('randevu') ? baglanti('onBuro', YOL.onBuro, klinikMetni(dil).kabuk.onBuro) : null}
              {baglanti('klinik', YOL.klinik, klinikMetni(dil).kabuk.klinik)}
              {m.kabuk.diger ? <><div className="uza-ayrac" /><div className="uza-grup">{m.kabuk.diger}</div></> : null}
              {baglanti('ayarlar', YOL.ayarlar, m.kabuk.ayarlar)}
            </nav>
          ) : (
            <nav className="uza-nav" aria-label={m.kabuk.menu}>
              {m.pano ? <span className="uza-duvar uza-asistan" data-duvar="asistan">{m.pano.asistanaSor}</span> : null}
              {m.kabuk.calismaAlani ? <div className="uza-grup">{m.kabuk.calismaAlani}</div> : null}
              {baglanti('bugun', YOL.bugun, m.kabuk.bugun)}
              {/* NOTYA-UZ-RANDEVU-01: the calendar. Its name is in the appointment catalogue, in the same form. */}
              {HAZIR.takvim ? baglanti('takvim', YOL.takvim, randevuMetni(dil).kabuk.takvim) : null}
              {baglanti('hastalar', YOL.hastalar, m.kabuk.hastalar)}
              {m.pano ? <span className="uza-duvar" data-duvar="mesaj">{m.pano.mesajlar}</span> : null}
              {m.kabuk.diger ? <><div className="uza-ayrac" /><div className="uza-grup">{m.kabuk.diger}</div></> : null}
              {m.pano ? <span className="uza-duvar" data-duvar="rapor">{m.pano.raporlar}</span> : null}
              {m.pano ? <span className="uza-duvar" data-duvar="odeme">{m.pano.odeme}</span> : null}
              {/* NOTYA-ULKE-ARACLAR-01: the tools area, where the country has it. Its name is in the tools catalogue, in the same form. */}
              {ozellikAcik('araclar') ? baglanti('araclar', YOL.araclar, araclarMetni(dil).kabuk.araclar) : null}
              {/* NOTYA-ULKE-KLINIK-01: the clinic, where the country has clinic accounts. Its name is in the clinic catalogue, in the same form. */}
              {ozellikAcik('klinikHesaplari') ? baglanti('klinik', YOL.klinik, klinikMetni(dil).kabuk.klinik) : null}
              {/* BYO-PAYMENTS-01: invoices, where the pack brings that extension. */}
              {ulkePaketi().uzanti?.fatura ? baglanti('fatura', YOL.fatura, ulkePaketi().uzanti!.fatura!.metin.baslik) : null}
              {baglanti('ayarlar', YOL.ayarlar, m.kabuk.ayarlar)}
            </nav>
          )}
        </div>
      </header>
      {/* Account row sits beside the sidebar (the Turkish chrome's top-right cluster), not inside it. */}
      {ad || cikis ? (
        <div className="uza-hesap">
          {ad ? <span className="uza-avatar" aria-hidden="true">{harfler(ad)}</span> : null}
          {ad ? (
            <span className="uza-hesap-blok">
              <span className="uza-hesap-ad">{ad}</span>
              {unvan ? <small className="uza-hesap-unvan">{unvan}</small> : null}
            </span>
          ) : null}
          <span className="uza-dik" aria-hidden="true" />
          <SaatKutusu />
          <span className="uza-dik" aria-hidden="true" />
          {cikis ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={cikis}>{m.kabuk.cikis}</button> : null}
        </div>
      ) : null}
      <main className="uza-ic uza-govde">{children}</main>
    </div>
  )
}

/** What a screen shows until the account (and so its language) is known. */
export function Yukleniyor({ m, dil }: { m: UygulamaMetni; dil: DilKodu }) {
  return (
    <Cerceve dil={dil} m={m} sade>
      <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>
    </Cerceve>
  )
}

// ───────────────────────── small shared pieces ─────────────────────────

// A day and a time of day as the country writes them, in the account's time zone: lib/ulke/arayuz/bicim.ts.
export { saatYaz, tarihYaz } from '@/lib/ulke/arayuz/bicim'

export function Hata({ children }: { children: ReactNode }) {
  return children ? <div role="alert" className="uza-uyari-kutu">{children}</div> : null
}

export function Bilgi({ children }: { children: ReactNode }) {
  return children ? <div role="status" className="uza-bilgi-kutu">{children}</div> : null
}

/** A two- or three-way choice shown as buttons (language, script, sex). */
export function Secim<T extends string>({ etiket, deger, secenekler, sec, ad }: {
  etiket: string
  deger: T | ''
  secenekler: readonly { deger: T; ad: string; dil?: string }[]
  sec: (d: T) => void
  ad: string
}) {
  return (
    <fieldset className="uza-secim">
      <legend className="uza-etiket">{etiket}</legend>
      <div className="uza-secim-satir">
        {secenekler.map((s) => (
          <label key={s.deger} className="uza-secenek" data-secili={deger === s.deger ? 'evet' : undefined}>
            <input type="radio" name={ad} value={s.deger} checked={deger === s.deger} onChange={() => sec(s.deger)} />
            <span lang={s.dil}>{s.ad}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
