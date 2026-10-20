'use client'

/**
 * NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20) — completes the Supabase password-recovery email link for a country
 * build. One implementation for every country, same pattern as GirisFormu: the deployment's own Supabase project
 * (lib/ulke/istemciSupabase.ts), no fallback. Supabase's browser client auto-detects the recovery token from the
 * URL on load (detectSessionInUrl, default true) and turns it into a real session — that session is what lets
 * updateUser() work here.
 */
import React from 'react'
import { useEffect, useState, type FormEvent } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ULKE_STIL as S, UlkeKart, type DilSecenegi } from './UlkeKart'
import { sifreSifirlaMetni } from './sifreSifirlaMetinleri'
import type { DilKodu } from '@/lib/ulke/tipler'

export type SifreSifirlaFormuProps = {
  dil: DilKodu
  diller: readonly DilSecenegi[]
  anaSayfa: string
  anaSayfaAdi: string
  girisHref: string
}

export default function SifreSifirlaFormu({ dil, diller, anaSayfa, anaSayfaAdi, girisHref }: SifreSifirlaFormuProps) {
  const m = sifreSifirlaMetni(dil)
  const supabase = ulkeIstemciSupabase()
  const [durum, setDurum] = useState<'kontrol' | 'hazir' | 'gecersiz'>('kontrol')
  const [sifre, setSifre] = useState('')
  const [sifre2, setSifre2] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [tamam, setTamam] = useState(false)

  useEffect(() => {
    if (!supabase) { setDurum('gecersiz'); return }
    supabase.auth.getSession().then(({ data }) => setDurum(data.session ? 'hazir' : 'gecersiz'))
  }, [supabase])

  async function gonder(e: FormEvent) {
    e.preventDefault()
    setHata('')
    if (!supabase) return
    if (sifre.length < 8) { setHata(m.tooShort); return }
    if (sifre !== sifre2) { setHata(m.mismatch); return }
    setYukleniyor(true)
    const { error } = await supabase.auth.updateUser({ password: sifre })
    setYukleniyor(false)
    if (error) { setHata(m.updateError); return }
    setTamam(true)
    setTimeout(() => { window.location.assign(girisHref) }, 2200)
  }

  return (
    <UlkeKart dil={dil} altBaslik={m.title} diller={diller} anaSayfa={{ href: anaSayfa, ad: anaSayfaAdi }}>
      {durum === 'kontrol' && <div style={{ textAlign: 'center', color: S.etiket.color, fontSize: 14 }}>{m.checking}</div>}
      {durum === 'gecersiz' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...S.hata, marginBottom: 16, textAlign: 'left' }}>{m.invalidLink}</div>
          <a href={girisHref} style={S.cizgiDugme}>{m.backToLogin}</a>
        </div>
      )}
      {durum === 'hazir' && !tamam && (
        <form onSubmit={gonder} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.etiket} htmlFor="ulke-sifre-yeni">{m.newPassword}</label>
            <input id="ulke-sifre-yeni" type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} autoComplete="new-password" style={S.girdi} />
          </div>
          <div>
            <label style={S.etiket} htmlFor="ulke-sifre-yeni2">{m.confirmPassword}</label>
            <input id="ulke-sifre-yeni2" type="password" value={sifre2} onChange={(e) => setSifre2(e.target.value)} autoComplete="new-password" style={S.girdi} />
          </div>
          {hata && <div role="alert" style={S.hata}>{hata}</div>}
          <button type="submit" disabled={yukleniyor} style={{ ...S.dugme, opacity: yukleniyor ? 0.6 : 1 }}>
            {yukleniyor ? m.updating : m.update}
          </button>
        </form>
      )}
      {tamam && <div style={{ ...S.bilgi, textAlign: 'center', fontWeight: 600 }}>{m.updated}</div>}
    </UlkeKart>
  )
}
