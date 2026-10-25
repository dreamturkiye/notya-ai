'use client'

/**
 * The account page (Türkiye: Hesabım) — profile photo, sign-in email, password and sign-out, drawn by the shared view
 * (components/doktor/hesap/HesapGorunumu.tsx) so it looks like Türkiye's. Every sentence is the pack's (m.ayarlar.hesap).
 * The photo and the password belong to the signed-in account only: the routes read the id from the session.
 */
import React, { useEffect, useRef, useState } from 'react'
import { CHROME_RENK } from '@/lib/doktor/chromeRenk'
import { HesapGorunumu, type HesapAvatarDurumu } from '@/components/doktor/hesap/HesapGorunumu'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ulkeYolu } from '@/lib/ulke/yol'
import { rolAdi } from '@/lib/ulke/arayuz'
import { Cerceve, Yukleniyor, harfler, useUygulama, YOL } from './Kabuk'

const AVATAR_OLAY = 'notya-avatar-guncellendi'
const AVATAR_AZAMI = 4 * 1024 * 1024
const IZINLI = ['image/jpeg', 'image/png', 'image/webp']

/** Sessions (Türkiye: Oturumlar): the last sign-in, this device, and "sign out of every device" (the auth service revokes every refresh token). */
function OturumKarti({ h }: { h: NonNullable<ReturnType<typeof useUygulama>['m']['ayarlar']['hesap']> }) {
  const [sonGiris, setSonGiris] = useState('—')
  const [cihaz, setCihaz] = useState('—')
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState('')
  useEffect(() => {
    void (async () => {
      try {
        const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }
        const t = data.session?.user.last_sign_in_at
        if (t) setSonGiris(new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))
      } catch { /* the card shows a dash */ }
    })()
    const ua = navigator.userAgent
    const tarayici = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
    const sistem = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : ''
    setCihaz([tarayici, sistem].filter(Boolean).join(' \u00b7 ') || '—')
  }, [])
  async function hepsindenCik() {
    if (!window.confirm(h.onay)) return
    setMesgul(true); setHata('')
    try {
      const { error } = (await ulkeIstemciSupabase()?.auth.signOut({ scope: 'global' })) ?? { error: new Error('x') }
      if (error) throw error
      window.location.replace(ulkeYolu('/login'))
    } catch { setHata(h.oturumHata); setMesgul(false) }
  }
  return (
    <div data-alan="hesap-oturum" style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, marginTop: 20, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: CHROME_RENK.ink }}>{h.oturumBaslik}</div>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted, margin: '0 0 12px' }}>{h.oturumAciklama}</p>
      <dl style={{ margin: '0 0 14px', display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 14px', fontSize: 13 }}>
        <dt style={{ color: CHROME_RENK.muted }}>{h.sonGiris}</dt><dd style={{ margin: 0, color: CHROME_RENK.ink }}>{sonGiris}</dd>
        <dt style={{ color: CHROME_RENK.muted }}>{h.buCihaz}</dt><dd style={{ margin: 0, color: CHROME_RENK.ink }}>{cihaz}</dd>
      </dl>
      {hata ? <div style={{ color: CHROME_RENK.warn, fontSize: 13, marginBottom: 10 }}>{hata}</div> : null}
      <button type="button" data-eylem="tum-cihazlardan-cik" onClick={() => { void hepsindenCik() }} disabled={mesgul} style={{ background: 'transparent', border: `1px solid ${CHROME_RENK.warn}55`, color: CHROME_RENK.warn, borderRadius: 8, padding: '10px 18px', minHeight: 44, fontWeight: 600, cursor: 'pointer', width: '100%' }}>{mesgul ? h.kapaniyor : h.tumuCikis}</button>
    </div>
  )
}

export default function Hesabim() {
  const u = useUygulama('hesabim')
  const [eposta, setEposta] = useState('')
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [avatarDurum, setAvatarDurum] = useState<HesapAvatarDurumu>('yukleniyor')
  const [avatarHata, setAvatarHata] = useState('')
  const dosyaRef = useRef<HTMLInputElement>(null)
  const [yeni, setYeni] = useState('')
  const [tekrar, setTekrar] = useState('')
  const [sifreDurumu, setSifreDurumu] = useState<'bos' | 'kaydediyor' | 'kaydedildi' | 'hata'>('bos')
  const [sifreHata, setSifreHata] = useState('')
  const { api, hesap } = u
  const h = u.m.ayarlar.hesap

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    ;(async () => {
      try {
        const e = await api('/api/ulke/hesap/sifre')
        if (!iptal && e.ok && typeof e.j.eposta === 'string') setEposta(e.j.eposta)
        const a = await api('/api/ulke/hesap/avatar')
        if (!iptal && a.ok && typeof a.j.avatar === 'string') setFotoUrl(a.j.avatar)
      } catch { /* the page still shows what it has */ }
      if (!iptal) setAvatarDurum('bos')
    })()
    return () => { iptal = true }
  }, [hesap, api])

  if (!hesap || !h) return <Yukleniyor m={u.m} dil={u.dil} />

  const duyur = (d: string | null) => { try { window.dispatchEvent(new CustomEvent(AVATAR_OLAY, { detail: { dataUrl: d } })) } catch { /* none */ } }
  const jeton = async () => (await ulkeIstemciSupabase()?.auth.getSession())?.data.session?.access_token ?? ''

  async function fotoSecildi(dosya: File | undefined) {
    if (!dosya || !h) return
    setAvatarHata('')
    if (!IZINLI.includes(dosya.type)) { setAvatarHata(h.fotoTur); return }
    if (dosya.size > AVATAR_AZAMI) { setAvatarHata(h.fotoBoyut); return }
    setAvatarDurum('kaydediyor')
    try {
      const form = new FormData(); form.append('file', dosya)
      const r = await fetch(ulkeYolu('/api/ulke/hesap/avatar'), { method: 'POST', headers: { Authorization: `Bearer ${await jeton()}` }, body: form })
      const j = (await r.json().catch(() => ({}))) as { avatar?: unknown; code?: string; alan?: string }
      if (!r.ok || typeof j.avatar !== 'string') { setAvatarHata(j.alan === 'tur' ? h.fotoTur : j.alan === 'boyut' ? h.fotoBoyut : h.fotoHata); setAvatarDurum('bos'); return }
      setFotoUrl(j.avatar); duyur(j.avatar); setAvatarDurum('kaydedildi')
      setTimeout(() => setAvatarDurum('bos'), 3000)
    } catch { setAvatarHata(h.fotoHata); setAvatarDurum('bos') }
    if (dosyaRef.current) dosyaRef.current.value = ''
  }

  async function fotoKaldir() {
    if (!h) return
    setAvatarHata(''); setAvatarDurum('kaydediyor')
    try {
      const r = await api('/api/ulke/hesap/avatar', { method: 'DELETE' })
      if (!r.ok) throw new Error('x')
      setFotoUrl(null); duyur(null); setAvatarDurum('bos')
    } catch { setAvatarHata(h.fotoKaldirilamadi); setAvatarDurum('bos') }
  }

  async function sifreKaydet() {
    if (!h) return
    setSifreHata('')
    if (yeni.length < 8) { setSifreHata(h.kisa); return }
    if (yeni !== tekrar) { setSifreHata(h.eslesmiyor); return }
    setSifreDurumu('kaydediyor')
    try {
      const r = await api('/api/ulke/hesap/sifre', { method: 'POST', govde: { yeniSifre: yeni } })
      if (!r.ok) throw new Error('x')
      setSifreDurumu('kaydedildi'); setYeni(''); setTekrar('')
      setTimeout(() => setSifreDurumu('bos'), 3000)
    } catch { setSifreDurumu('hata'); setSifreHata(h.hata) }
  }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="hesabim" cikis={u.cikis}>
      <HesapGorunumu
        s={h} geriYol={YOL.ayarlar} adSoyad={hesap.ad} harfler={harfler(hesap.ad)} eposta={eposta}
        fotoUrl={fotoUrl} avatarDurum={avatarDurum} avatarHata={avatarHata} dosyaRef={dosyaRef} fotoSecildi={(f) => { void fotoSecildi(f) }} fotoKaldir={() => { void fotoKaldir() }}
        yeni={yeni} tekrar={tekrar} setYeni={setYeni} setTekrar={setTekrar} sifreDurumu={sifreDurumu} sifreHata={sifreHata} sifreKaydet={() => { void sifreKaydet() }} cikis={() => { void u.cikis() }}
        oturum={<OturumKarti h={h} />}
      />
    </Cerceve>
  )
}
