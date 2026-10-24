'use client'

/**
 * The account page (Türkiye: Hesabım) — profile photo, sign-in email, password and sign-out, drawn by the shared view
 * (components/doktor/hesap/HesapGorunumu.tsx) so it looks like Türkiye's. Every sentence is the pack's (m.ayarlar.hesap).
 * The photo and the password belong to the signed-in account only: the routes read the id from the session.
 */
import React, { useEffect, useRef, useState } from 'react'
import { HesapGorunumu, type HesapAvatarDurumu } from '@/components/doktor/hesap/HesapGorunumu'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ulkeYolu } from '@/lib/ulke/yol'
import { rolAdi } from '@/lib/ulke/arayuz'
import { Cerceve, Yukleniyor, harfler, useUygulama, YOL } from './Kabuk'

const AVATAR_OLAY = 'notya-avatar-guncellendi'
const AVATAR_AZAMI = 4 * 1024 * 1024
const IZINLI = ['image/jpeg', 'image/png', 'image/webp']

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
      />
    </Cerceve>
  )
}
