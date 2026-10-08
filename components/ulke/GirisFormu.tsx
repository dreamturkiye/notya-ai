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
import type { DilKodu, YuzeyMetinleri } from '@/lib/ulke/tipler'
import { ULKE_STIL as S, UlkeKart, type DilSecenegi } from './UlkeKart'

export type GirisFormuProps = {
  dil: DilKodu
  metin: YuzeyMetinleri<'giris'>
  /** The neutral refusal (surface `hesap`, key `girisReddi`). */
  ret: string
  diller: readonly DilSecenegi[]
  anaSayfa: string
  /** Where "sign up" goes; null when the country has no sign-up. */
  kayit: string | null
  /** Where a signed-in account lands. */
  sonra: string
}

export default function GirisFormu({ dil, metin, ret, diller, anaSayfa, kayit, sonra }: GirisFormuProps) {
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState('')
  const supabase = ulkeIstemciSupabase()

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
      const r = await fetch('/api/ulke/hesap', { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' })
      if (!r.ok) { await reddet(); return }
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
