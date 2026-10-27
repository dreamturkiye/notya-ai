'use client'

/**
 * NOTYA-ULKE-01 — the core login form (/login). One implementation for every country that is not the pre-split
 * application; every sentence comes from the country's pack (surface `giris`), passed in by the server page.
 *
 * Signs in against the deployment's OWN Supabase project (lib/ulke/istemciSupabase.ts — no fallback project), then
 * asks the server whether the account belongs to this country. Any refusal shows one sentence: the one a wrong
 * password gets.
 */
import React from 'react'
import { useState, type FormEvent } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { hesapBuUlkedeMi } from '@/lib/ulke/hesapUlkesi'
import { ulkeYolu } from '@/lib/ulke/yol'
import { dilliYol } from '@/lib/ulke/sayfaDili'
import type { DilKodu, YuzeyMetinleri } from '@/lib/ulke/tipler'
import { ULKE_STIL as S, UlkeKart, type DilSecenegi } from './UlkeKart'
import { sifreSifirlaMetni } from './sifreSifirlaMetinleri'

export type GirisFormuProps = {
  dil: DilKodu
  metin: YuzeyMetinleri<'giris'>
  /** The neutral refusal (surface `hesap`, key `girisReddi`). */
  ret: string
  diller: readonly DilSecenegi[]
  anaSayfa: string
  /** Where "sign up" goes; null when the country has no sign-up. */
  kayit: string | null
  /** Where a signed-in account lands: an address (already under the country's path prefix). */
  sonra: string
  /**
   * STRIPE-NOTYA-AU-02: a solo-doctor plan key carried from signup, to drive straight into Stripe Checkout
   * on THIS login — the first point a real session exists (the invited-signup endpoint issues none). Optional
   * and additive: a country page that never passes it (every country but AU, for now) sees no change at all.
   */
  planKey?: string | null
}

// The 3 solo-doctor plan keys this build's Stripe catalog actually prices (lib/billing/stripePlans.ts).
// Klinik/Kurumsal are out of scope — same boundary main's /kayit fix drew.
const SELF_SERVE_PLAN_KEYS = new Set(['metin_asistan', 'sesli_pro', 'muayenehane'])

export default function GirisFormu({ dil, metin, ret, diller, anaSayfa, kayit, sonra, planKey }: GirisFormuProps) {
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState('')
  const supabase = ulkeIstemciSupabase()
  // NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20): real forgot-password — this country build had none at all.
  const [fpAcik, setFpAcik] = useState(false)
  const [fpDurum, setFpDurum] = useState<'bos' | 'gonderiliyor' | 'gonderildi' | 'hata'>('bos')
  const m = sifreSifirlaMetni(dil)

  async function sifreSifirlaGonder() {
    if (!supabase || !eposta.trim()) return
    setFpDurum('gonderiliyor')
    const { error } = await supabase.auth.resetPasswordForEmail(eposta.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}${dilliYol('/password-reset', dil)}`,
    })
    setFpDurum(error ? 'hata' : 'gonderildi')
  }

  async function gonder(e: FormEvent) {
    e.preventDefault()
    if (!supabase) { setHata(metin.hazirDegil); return }
    if (!eposta.trim() || !sifre) { setHata(metin.bosAlan); return }
    setBekliyor(true); setHata('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: eposta.toLowerCase().trim(), password: sifre })
      if (error || !data.session) {
        const m = String(error?.message || '').toLowerCase()
        setHata(m.includes('rate limit') || m.includes('too many') ? metin.cokDeneme : m.includes('fetch') || m.includes('network') ? metin.baglantiHatasi : m.includes('invalid') ? ret : metin.hata)
        setBekliyor(false)
        return
      }
      const reddet = async () => { await supabase.auth.signOut(); setHata(ret); setBekliyor(false) }
      if (!hesapBuUlkedeMi(data.user)) { await reddet(); return }
      const r = await fetch(ulkeYolu('/api/ulke/hesap'), { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' })
      if (!r.ok) { await reddet(); return }

      // STRIPE-NOTYA-AU-02: a plan chosen at signup drives straight into Stripe Checkout here, the first
      // point a real session exists. Checkout failing (network, Stripe hiccup) must never strand a doctor
      // who already has a valid, confirmed account — fall through to the normal destination either way.
      if (planKey && SELF_SERVE_PLAN_KEYS.has(planKey)) {
        try {
          const cres = await fetch(ulkeYolu('/api/billing/checkout'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ plan_key: planKey, interval: 'month' }),
          })
          const cjson = await cres.json().catch(() => null)
          if (cjson?.success && cjson?.data?.checkout_url) {
            window.location.href = cjson.data.checkout_url
            return
          }
        } catch {
          // Fall through below — the account and session are already good.
        }
      }

      window.location.assign(sonra)
    } catch {
      setHata(metin.baglantiHatasi)
      setBekliyor(false)
    }
  }

  return (
    <UlkeKart dil={dil} altBaslik={metin.altBaslik} diller={diller} anaSayfa={{ href: anaSayfa, ad: metin.anaSayfa }}>
      <form onSubmit={gonder} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={S.etiket} htmlFor="ulke-giris-eposta">{metin.eposta}</label>
          <input id="ulke-giris-eposta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} placeholder={metin.epostaOrnek} autoCapitalize="none" autoCorrect="off" autoComplete="email" inputMode="email" spellCheck={false} style={S.girdi} />
        </div>
        <div>
          <label style={S.etiket} htmlFor="ulke-giris-sifre">{metin.sifre}</label>
          <input id="ulke-giris-sifre" type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder={metin.sifreOrnek} autoComplete="current-password" style={S.girdi} />
          <button type="button" onClick={() => setFpAcik((v) => !v)} style={{ background: 'transparent', border: 'none', color: S.baglanti.color, fontSize: 12.5, cursor: 'pointer', padding: '8px 0 0', textAlign: 'left', fontFamily: S.girdi.fontFamily, fontWeight: 600 }}>{m.forgotLink}</button>
          {fpAcik && (
            <div style={{ ...S.bilgi, marginTop: 6, padding: '10px 12px', fontSize: 13 }}>
              {fpDurum === 'gonderildi' ? (
                <span style={{ fontWeight: 600 }}>{m.sent}</span>
              ) : (
                <>
                  <div style={{ marginBottom: 8 }}>{m.emailPlaceholder}: <strong>{eposta || '—'}</strong></div>
                  <button type="button" disabled={fpDurum === 'gonderiliyor' || !eposta.trim()} onClick={sifreSifirlaGonder} style={{ ...S.cizgiDugme, padding: '8px 14px', fontSize: 12.5, cursor: fpDurum === 'gonderiliyor' ? 'not-allowed' : 'pointer', opacity: fpDurum === 'gonderiliyor' ? 0.6 : 1 }}>
                    {fpDurum === 'gonderiliyor' ? m.sending : m.send}
                  </button>
                  {fpDurum === 'hata' && <div style={{ marginTop: 6 }}>{m.sendError}</div>}
                </>
              )}
            </div>
          )}
        </div>
        {!supabase ? <div role="alert" style={S.hata}>{metin.hazirDegil}</div> : hata ? <div role="alert" style={S.hata}>{hata}</div> : null}
        <button type="submit" disabled={bekliyor || !supabase} style={{ ...S.dugme, opacity: bekliyor || !supabase ? 0.6 : 1 }}>
          {bekliyor ? metin.gonderiliyor : metin.gonder}
        </button>
      </form>
      {kayit ? (
        <div style={S.alt}>
          {metin.davetSorusu}{' '}
          <a href={kayit} style={S.baglanti}>{metin.kayitBaglantisi}</a>
        </div>
      ) : null}
    </UlkeKart>
  )
}
