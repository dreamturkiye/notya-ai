'use client'

/**
 * STRIPE-NOTYA-AU-05, trial model (Kaan, 2026-11-02) - the upgrade prompt and the read-only band of the in-app free trial.
 * "If they pass the limits they should be encouraged to sign up."
 *
 *   When   day 15 (read-only), the 40-visit cap, the 60 live-voice minutes - each as soon as the frame opens and again
 *          whenever an action is refused for it (the frame's API helper sends `notya-yukselt`) - and a gentle reminder
 *          once on day 10 and once on day 13.
 *   What   the founding offer first while a seat is left, otherwise the regular prices; one click opens Checkout
 *          (charged at once, the account and all its data carry over).
 *   Look   the application's own card, buttons and info box (uza-kart, uza-dugme, uza-bilgi-kutu): no visual fork.
 *
 * Draws nothing - and asks nothing - in a country without an in-app trial. The words are the country's
 * (lib/billing/ulkeTicari.ts). Browser storage only remembers what was already shown; it can fail without harm.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ulkeYolu } from '@/lib/ulke/yol'
import { aktifUlke } from '@/lib/ulke/ulke'
import { ulkeTicari } from '@/lib/billing/ulkeTicari'
import { istemIcerigi, type Istem, type IstemNedeni } from '@/lib/billing/deneme'
import { demoIstegi } from '@/lib/ulke/demo'

export const YUKSELT_OLAYI = 'notya-yukselt'
const DURUM_ANAHTARI = 'notya-deneme-durumu'
const DURUM_OMRU_MS = 10 * 60 * 1000

type Durum = {
  aktif: boolean; muaf?: boolean; tur?: 'ucretli' | 'deneme' | 'bitti'; kalanGun?: number
  muayeneSiniri?: number; sesSiniri?: number | null
  istem?: (Pick<Istem, 'neden' | 'teklif' | 'kalanGun' | 'hatirlatmaGunu'>) | null
}

const oku = (depo: 'session' | 'local', k: string): string | null => {
  try { return (depo === 'session' ? window.sessionStorage : window.localStorage).getItem(k) } catch { return null }
}
const yaz = (depo: 'session' | 'local', k: string, v: string | null) => {
  try { const d = depo === 'session' ? window.sessionStorage : window.localStorage; if (v === null) d.removeItem(k); else d.setItem(k, v) } catch { /* nothing to remember */ }
}

async function jeton(): Promise<string> {
  try {
    const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }
    return data.session?.access_token ?? ''
  } catch { return '' }
}

async function durumGetir(yenile: boolean): Promise<Durum | null> {
  if (!yenile) {
    const ham = oku('session', DURUM_ANAHTARI)
    if (ham) {
      try { const o = JSON.parse(ham) as { t: number; d: Durum }; if (Date.now() - o.t < DURUM_OMRU_MS) return o.d } catch { /* read again */ }
    }
  }
  const j = await jeton()
  if (!j) return null
  try {
    const r = await fetch(ulkeYolu('/api/ulke/deneme'), { headers: { Authorization: `Bearer ${j}` }, cache: 'no-store' })
    if (!r.ok) return null
    const d = (await r.json()) as Durum
    yaz('session', DURUM_ANAHTARI, JSON.stringify({ t: Date.now(), d }))
    return d
  } catch { return null }
}

/** Shown once: per session for a limit or read-only, once ever for each reminder day. */
function gosterildiMi(i: NonNullable<Durum['istem']>): boolean {
  return i.neden === 'hatirlatma' ? oku('local', `notya-istem-h${i.hatirlatmaGunu ?? 0}`) === '1' : oku('session', `notya-istem-${i.neden}`) === '1'
}
function gosterildi(i: NonNullable<Durum['istem']>) {
  if (i.neden === 'hatirlatma') yaz('local', `notya-istem-h${i.hatirlatmaGunu ?? 0}`, '1')
  else yaz('session', `notya-istem-${i.neden}`, '1')
}

export default function YukseltmeIstemi() {
  const ticari = ulkeTicari(aktifUlke())
  const acik = Boolean(ticari?.deneme && ticari.yukseltme && ticari.fiyatlar)
  const [durum, setDurum] = useState<Durum | null>(null)
  const [istem, setIstem] = useState<NonNullable<Durum['istem']> | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState('')

  useEffect(() => {
    if (!acik) return
    let iptal = false
    // Back from Checkout: the plan may have changed, ask again.
    const yenile = typeof window !== 'undefined' && /[?&]billing=success\b/.test(window.location.search)
    if (yenile) yaz('session', DURUM_ANAHTARI, null)
    void durumGetir(yenile).then((d) => {
      if (iptal || !d?.aktif) return
      setDurum(d)
      if (d.istem && !gosterildiMi(d.istem)) { gosterildi(d.istem); setIstem(d.istem) }
    })
    const olay = (e: Event) => {
      const neden = (e as CustomEvent<{ neden?: IstemNedeni }>).detail?.neden
      if (!neden) return
      // A refusal is fresh news: forget the kept status, and open the prompt at once with the offer known so far.
      yaz('session', DURUM_ANAHTARI, null)
      setIstem((onceki) => ({ neden, teklif: onceki?.teklif ?? (ticari?.kurucu ? 'kurucu' : 'normal') }))
      void durumGetir(true).then((d) => {
        // Founder exemption (migration 186): never an upgrade prompt, even after a refusal that slipped through.
        if (!iptal && d?.muaf) { setIstem(null); return }
        if (iptal || !d?.aktif) return
        setDurum(d)
        if (d.istem) setIstem((o) => (o ? { ...o, teklif: d.istem!.teklif } : o))
      })
    }
    window.addEventListener(YUKSELT_OLAYI, olay)
    return () => { iptal = true; window.removeEventListener(YUKSELT_OLAYI, olay) }
  }, [acik, ticari])

  const ode = useCallback(async (aralik: 'month' | 'year', planKey: string) => {
    setBekliyor(true); setHata('')
    try {
      const j = await jeton()
      const r = await fetch(ulkeYolu('/api/billing/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${j}` },
        body: JSON.stringify({ plan_key: planKey, interval: aralik }),
      })
      const c = (await r.json().catch(() => null)) as { success?: boolean; data?: { checkout_url?: string } } | null
      if (c?.success && c.data?.checkout_url) { window.location.href = c.data.checkout_url; return }
    } catch { /* below */ }
    setHata(ticari?.yukseltme?.acilamadi ?? ''); setBekliyor(false)
  }, [ticari])

  if (!acik || !ticari) return null
  const m = ticari.yukseltme!
  const salt = durum?.tur === 'bitti'
  const demo = demoIstegi()
  const icerik = istem ? istemIcerigi(ticari, istem, { muayene: durum?.muayeneSiniri ?? ticari.deneme!.muayene, ses: durum?.sesSiniri ?? ticari.sesDakika?.denemeDakika ?? null }) : null

  return (
    <>
      {salt && (
        <div className="uza-bilgi-kutu" role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <span>{m.saltOkunurBant}</span>
          <button type="button" className="uza-dugme uza-dugme-kucuk" onClick={() => setIstem({ neden: 'bitti', teklif: durum?.istem?.teklif ?? (ticari.kurucu ? 'kurucu' : 'normal') })}>{m.yukseltDugme}</button>
        </div>
      )}
      {icerik && (
        <div role="dialog" aria-modal="true" aria-labelledby="notya-yukselt-baslik" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(30, 26, 22, 0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="uza-kart" style={{ maxWidth: 480, width: '100%' }}>
            <h2 id="notya-yukselt-baslik" className="uza-h" style={{ marginTop: 0 }}>{icerik.baslik}</h2>
            <p className="uza-aciklama">{icerik.govde}</p>
            <div className="uza-bilgi-kutu">{icerik.teklif}</div>
            <div className="uza-eylemler">
              <button type="button" className="uza-dugme" disabled={bekliyor} onClick={() => void ode('month', icerik.planKey)}>{bekliyor ? m.aciliyor : icerik.aylik}</button>
              <button type="button" className="uza-dugme" disabled={bekliyor} onClick={() => void ode('year', icerik.planKey)}>{bekliyor ? m.aciliyor : icerik.yillik}</button>
              {/* AU-DEMO-02: the secondary action - a 30-minute private demo - only while /demo holds a real calendar. */}
              {demo ? <a className="uza-dugme uza-dugme-cizgi" data-alan="demo" href={demo.href}>{demo.etiket}</a> : null}
              <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={() => { setIstem(null); setHata('') }}>{m.sonra}</button>
            </div>
            {hata && <div role="alert" className="uza-uyari-kutu" style={{ marginTop: 12 }}>{hata}</div>}
          </div>
        </div>
      )}
    </>
  )
}
