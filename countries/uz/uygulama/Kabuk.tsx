'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — the frame every screen of the signed-in application shares: session, account, language.
 *
 * useUygulama(ekran)   resolves the browser session against the deployment's OWN Supabase project, asks the server
 *                      who the account is (/api/ulke/hesap) and in which language it reads. No session, or an
 *                      account that does not belong to this country → back to /login. An account that has not
 *                      answered the language question, or has not chosen its role (NOTYA-UZ-BRANSLAR-01), is sent
 *                      to /start before anything else.
 * Cerceve              the visible frame (word mark, four links, log out). Pure: it renders in a plain test.
 *
 * Every sentence comes from the pack's catalogue (./metinler) in the ACCOUNT's language, never the browser's.
 */
import React, { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { UYGULAMA_EKRANLARI, type UygulamaEkrani } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { uzRolMu } from '../klinik/rolAdlari'
import { uygulamaMetni, uzUygulamaDili, type UygulamaMetni, type UzUygulamaDili } from './metinler'
import { randevuMetni } from './randevuMetinleri'

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
  dil: UzUygulamaDili; notDili: UzUygulamaDili; ad: string
  /** The role the account works as (a key of ../klinik/rolAdlari.ts), or null while it has not chosen one. */
  rol: string | null
  /** false = the first-login language question is still to be answered. */
  dilSoruldu: boolean
}
export type ApiCevabi = { ok: boolean; status: number; j: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
/** `yol` is a ROUTE of the API ('/api/ulke/hesap'); the call adds the country's path prefix. */
export type Api = (yol: string, secenek?: { method?: 'GET' | 'POST' | 'PATCH'; govde?: unknown }) => Promise<ApiCevabi>

export type Uygulama = {
  /** null until the account is known. */
  hesap: Hesap | null
  m: UygulamaMetni
  dil: UzUygulamaDili
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
      try { const rr = await api('/api/ulke/rol'); if (rr.ok && uzRolMu(rr.j.rol)) rol = rr.j.rol } catch { return }
      if (iptal) return
      const dilSoruldu = Boolean(r.j.dilSoruldu)
      if ((!dilSoruldu || !rol) && ekran !== 'baslangic') { window.location.replace(YOL.baslangic); return }
      if (dilSoruldu && rol && ekran === 'baslangic') { window.location.replace(YOL.bugun); return }
      setHesap({ dil: uzUygulamaDili(r.j.dil), notDili: uzUygulamaDili(r.j.notDili), ad: String(r.j.ad || ''), rol, dilSoruldu })
    })()
    return () => { iptal = true }
  }, [api, cikis, ekran])

  const hesabiGuncelle = useCallback((h: Partial<Hesap>) => setHesap((eski) => (eski ? { ...eski, ...h } : eski)), [])
  const dil = hesap?.dil ?? 'uz-Latn'
  return { hesap, m: uygulamaMetni(dil), dil, api, hesabiGuncelle, cikis }
}

/** Colours and fonts as variables on the root, from the one source of the look (lib/doktor/chromeRenk.ts). */
const DEGISKENLER = {
  '--uza-krem': R.cream, '--uza-kagit': R.paper, '--uza-murekkep': R.ink, '--uza-soluk': R.muted, '--uza-cam': R.pine,
  '--uza-uyari': R.warn, '--uza-cizgi': R.border, '--uza-altin': R.gold, '--uza-serif': CHROME_FONT.serif, '--uza-sans': CHROME_FONT.sans,
} as CSSProperties

export type Sekme = 'bugun' | 'takvim' | 'hastalar' | 'ayarlar'

export function Cerceve({ dil, m, ad, aktif, cikis, sade, children }: {
  dil: UzUygulamaDili
  m: UygulamaMetni
  ad?: string
  aktif?: Sekme | null
  cikis?: () => void
  /** true = no navigation (the first-login question, and "loading" before the account is known). */
  sade?: boolean
  children: ReactNode
}) {
  const baglanti = (s: Sekme, href: string, ad2: string) => (
    <a href={href} className="uza-sekme" aria-current={aktif === s ? 'page' : undefined}>{ad2}</a>
  )
  return (
    <div className="uza" lang={dil} style={DEGISKENLER}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <header className="uza-ust">
        <div className="uza-ic uza-ust-ic">
          <a href={sade ? undefined : YOL.bugun} className="uza-marka">Notya</a>
          {sade ? null : (
            <nav className="uza-nav" aria-label={m.kabuk.menu}>
              {baglanti('bugun', YOL.bugun, m.kabuk.bugun)}
              {/* NOTYA-UZ-RANDEVU-01: the calendar. Its name is in the appointment catalogue, in the same form. */}
              {HAZIR.takvim ? baglanti('takvim', YOL.takvim, randevuMetni(dil).kabuk.takvim) : null}
              {baglanti('hastalar', YOL.hastalar, m.kabuk.hastalar)}
              {baglanti('ayarlar', YOL.ayarlar, m.kabuk.ayarlar)}
            </nav>
          )}
          <div className="uza-hesap">
            {ad ? <span className="uza-hesap-ad">{ad}</span> : null}
            {cikis ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={cikis}>{m.kabuk.cikis}</button> : null}
          </div>
        </div>
      </header>
      <main className="uza-ic uza-govde">{children}</main>
    </div>
  )
}

/** What a screen shows until the account (and so its language) is known. */
export function Yukleniyor({ m, dil }: { m: UygulamaMetni; dil: UzUygulamaDili }) {
  return (
    <Cerceve dil={dil} m={m} sade>
      <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>
    </Cerceve>
  )
}

// ───────────────────────── small shared pieces ─────────────────────────

/** DD.MM.YYYY from an ISO date or timestamp, in the country's time zone. Digits only: no month names to translate. */
export function tarihYaz(iso: string | null | undefined, saatDilimi = 'Asia/Tashkent'): string {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) { const [y, a, g] = iso.split('-'); return `${g}.${a}.${y}` }
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return ''
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(t)
  const al = (tur: string) => p.find((x) => x.type === tur)?.value ?? ''
  return `${al('day')}.${al('month')}.${al('year')}`
}

/** HH:MM in the country's time zone. */
export function saatYaz(iso: string | null | undefined, saatDilimi = 'Asia/Tashkent'): string {
  if (!iso) return ''
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, hour: '2-digit', minute: '2-digit', hour12: false }).format(t)
}

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
