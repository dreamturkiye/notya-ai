'use client'

/**
 * Hesabım — the account page (profile photo, sign-in details, password) as a PRESENTATIONAL view: words, data and
 * callbacks come in as props. Drawn with the very styles of Türkiye's page (app/dashboard/doktor/hesap/page.tsx), so a
 * country build and Türkiye look the same. Türkiye's page is not changed by this file.
 */
import React from 'react'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeRenk'

export type HesapSozleri = {
  geri: string; baslik: string; aciklama: string
  fotoVar: string; fotoYok: string; yukle: string; degistirFoto: string; kaldir: string; yukleniyor: string; fotoNot: string; fotoKaydedildi: string
  adSoyad: string; eposta: string; sifreBaslik: string; yeniSifre: string; tekrar: string; yerTutucu: string; kaydet: string; kaydediliyor: string; degisti: string; cikis: string
}

export type HesapAvatarDurumu = 'yukleniyor' | 'bos' | 'kaydediyor' | 'kaydedildi'

const kutu: React.CSSProperties = { width: '100%', background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8, color: CHROME_RENK.ink, fontSize: 14, padding: '10px 12px', boxSizing: 'border-box' }
const dugme: React.CSSProperties = { background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }

function Avatar({ harfler, fotoUrl, ad, boyut = 56 }: { harfler: string; fotoUrl: string | null; ad: string; boyut?: number }) {
  const ortak: React.CSSProperties = { width: boyut, height: boyut, minWidth: boyut, maxWidth: boyut, minHeight: boyut, maxHeight: boyut, aspectRatio: '1 / 1', borderRadius: '50%', flexShrink: 0, flexGrow: 0, border: '1px solid rgba(15,155,142,0.45)', boxSizing: 'border-box', overflow: 'hidden' }
  // eslint-disable-next-line @next/next/no-img-element -- data URL
  if (fotoUrl) return <img src={fotoUrl} alt={ad} width={boyut} height={boyut} style={{ ...ortak, objectFit: 'cover', objectPosition: 'center', display: 'block', background: CHROME_RENK.pine }} />
  return <div aria-label={ad} style={{ ...ortak, background: 'rgba(15,155,142,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(boyut * 0.36), fontWeight: 800, color: '#0F9B8E', letterSpacing: 0.5, lineHeight: 1 }}>{harfler}</div>
}

export function HesapGorunumu({ s, geriYol, adSoyad, harfler, eposta, fotoUrl, avatarDurum, avatarHata, dosyaRef, fotoSecildi, fotoKaldir, yeni, tekrar, setYeni, setTekrar, sifreDurumu, sifreHata, sifreKaydet, cikis, oturum }: {
  s: HesapSozleri; geriYol: string; adSoyad: string; harfler: string; eposta: string
  fotoUrl: string | null; avatarDurum: HesapAvatarDurumu; avatarHata: string
  dosyaRef: React.RefObject<HTMLInputElement>; fotoSecildi: (f: File | undefined) => void; fotoKaldir: () => void
  yeni: string; tekrar: string; setYeni: (v: string) => void; setTekrar: (v: string) => void
  sifreDurumu: 'bos' | 'kaydediyor' | 'kaydedildi' | 'hata'; sifreHata: string; sifreKaydet: () => void; cikis: () => void
  /** The sessions card (last sign-in, this device, sign out everywhere), drawn between the password card and sign-out. */
  oturum?: React.ReactNode
}) {
  return (
    <div data-alan="hesap-sayfasi">
      <a href={geriYol} style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none' }}>{s.geri}</a>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>{s.baslik}</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 24 }}>{s.aciklama}</p>
      <div style={{ maxWidth: 480 }}>
        <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
          <Avatar harfler={harfler} fotoUrl={fotoUrl} ad={adSoyad} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 8 }}>{avatarDurum === 'yukleniyor' ? s.yukleniyor : fotoUrl ? s.fotoVar : s.fotoYok}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" data-eylem="foto-yukle" style={{ ...dugme, opacity: avatarDurum === 'kaydediyor' ? 0.6 : 1 }} disabled={avatarDurum === 'kaydediyor'} onClick={() => dosyaRef.current?.click()}>
                {avatarDurum === 'kaydediyor' ? s.yukleniyor : fotoUrl ? s.degistirFoto : s.yukle}
              </button>
              {fotoUrl ? (
                <button type="button" data-eylem="foto-kaldir" onClick={fotoKaldir} disabled={avatarDurum === 'kaydediyor'} style={{ ...dugme, background: 'transparent', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink }}>{s.kaldir}</button>
              ) : null}
              <input ref={dosyaRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => fotoSecildi(e.target.files?.[0])} />
            </div>
            <p style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 8 }}>{s.fotoNot}</p>
            {avatarDurum === 'kaydedildi' ? <p style={{ fontSize: 12, color: '#2E6E4E', marginTop: 6 }}>{s.fotoKaydedildi}</p> : null}
            {avatarHata ? <p style={{ fontSize: 12, color: CHROME_RENK.warn, marginTop: 6 }}>{avatarHata}</p> : null}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>{s.adSoyad}</label>
          <div style={{ ...kutu, color: CHROME_RENK.ink, background: '#F6F0E4' }}>{adSoyad || '—'}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>{s.eposta}</label>
          <div data-alan="hesap-eposta" style={{ ...kutu, color: CHROME_RENK.ink, background: '#F6F0E4' }}>{eposta || '—'}</div>
        </div>
        <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: CHROME_RENK.ink }}>{s.sifreBaslik}</div>
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>{s.yeniSifre}</label>
          <input type="password" name="yeniSifre" autoComplete="new-password" value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder={s.yerTutucu} style={{ ...kutu, marginBottom: 12 }} />
          <label style={{ fontSize: 12, color: CHROME_RENK.muted, display: 'block', marginBottom: 4 }}>{s.tekrar}</label>
          <input type="password" name="tekrar" autoComplete="new-password" value={tekrar} onChange={(e) => setTekrar(e.target.value)} style={{ ...kutu, marginBottom: 14 }} />
          {sifreHata ? <div style={{ color: CHROME_RENK.warn, fontSize: 13, marginBottom: 10 }}>{sifreHata}</div> : null}
          <button type="button" data-eylem="sifre-degistir" onClick={sifreKaydet} disabled={sifreDurumu === 'kaydediyor'} style={{ background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
            {sifreDurumu === 'kaydediyor' ? s.kaydediliyor : sifreDurumu === 'kaydedildi' ? s.degisti : s.kaydet}
          </button>
        </div>
        {oturum ?? null}
        <button type="button" data-eylem="cikis" onClick={cikis} style={{ marginTop: 24, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}55`, color: CHROME_RENK.warn, borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>{s.cikis}</button>
      </div>
    </div>
  )
}
