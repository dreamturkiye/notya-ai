'use client'

/**
 * Settings sub-pages (Türkiye: Ayarlar > İletişim and Entegrasyonlar), drawn with the Türkiye header (back link, serif
 * title, one line) and the Türkiye card look. Every sentence is the pack's (m.ayarlar.ek). Nothing here sends anything:
 * a message to a patient is PREPARED and opens in the doctor's own mail app (lib/iletisim), so it leaves from their account.
 */
import React, { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { epostaLinki } from '@/lib/iletisim/baglantilar'
import { baglantiyiAc, cihazEpostaAcilisi, cihazEpostaAcilisiniKaydet } from '@/lib/iletisim/istemci'
import type { EpostaAcilis } from '@/lib/iletisim/tipler'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { rolAdi } from '@/lib/ulke/arayuz'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { Cerceve, Yukleniyor, useUygulama, YOL, type Uygulama } from './Kabuk'

const KUTU: CSSProperties = { background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: '18px 18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', marginBottom: 14 }
const SATIR: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, background: '#FFFFFF', border: `1px solid ${R.border}`, borderRadius: 16, padding: '16px 18px', textDecoration: 'none', color: R.ink, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }

function Sayfa({ u, baslik, alt, children }: { u: Uygulama; baslik: string; alt: string; children: ReactNode }) {
  const { hesap } = u
  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="ayarlar" cikis={u.cikis} onBuro={hesap.onBuro}>
      <div style={{ fontFamily: CHROME_FONT.sans, color: R.ink, maxWidth: 640 }}>
        <a href={YOL.ayarlar} style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4, display: 'inline-block', textDecoration: 'none', padding: '10px 0', minHeight: 40, boxSizing: 'border-box' }}>‹ {u.m.ayarlar.ek.geri}</a>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>{baslik}</h1>
        <p style={{ fontSize: 14, color: R.muted, margin: '0 0 22px' }}>{alt}</p>
        {children}
      </div>
    </Cerceve>
  )
}

export function Iletisim() {
  const u = useUygulama('iletisim')
  const [eposta, setEposta] = useState('')
  const [acilis, setAcilis] = useState<EpostaAcilis>('uygulama')
  const [saklandi, setSaklandi] = useState(false)
  useEffect(() => {
    setAcilis(cihazEpostaAcilisi() ?? 'uygulama')
    void (async () => {
      try { const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }; setEposta(data.session?.user.email ?? '') } catch { /* the field stays empty */ }
    })()
  }, [])
  const e = u.m.ayarlar.ek
  const sec = (a: EpostaAcilis) => { setAcilis(a); cihazEpostaAcilisiniKaydet(a); setSaklandi(true) }
  const dene = () => { const link = epostaLinki(eposta, e.denemeKonu, e.denemeMetni, acilis); if (link) baglantiyiAc(link) }
  const secenekler: [EpostaAcilis, string][] = [['uygulama', e.acilisUygulama], ['gmail', e.acilisGmail], ['outlook', e.acilisOutlook]]
  return (
    <Sayfa u={u} baslik={e.iletisimBaslik} alt={e.iletisimAlt}>
      <div style={KUTU} data-alan="iletisim-eposta">
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }} htmlFor="ilt-eposta">{e.eposta}</label>
        <input id="ilt-eposta" readOnly value={eposta} style={{ width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: `1px solid ${R.border}`, color: R.ink, borderRadius: 10, padding: '11px 12px', fontSize: 16, fontFamily: CHROME_FONT.sans }} />
        <p style={{ fontSize: 12, color: R.muted, margin: '8px 0 0' }}>{e.epostaIzoh}</p>
      </div>
      <div style={KUTU} data-alan="iletisim-acilis">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{e.acilis}</div>
        <div role="radiogroup" aria-label={e.acilis} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {secenekler.map(([k, ad]) => (
            <button key={k} type="button" role="radio" aria-checked={acilis === k} onClick={() => sec(k)} style={{ textAlign: 'left', minHeight: 44, padding: '10px 14px', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: CHROME_FONT.sans, background: acilis === k ? '#E4F3F1' : '#FFFFFF', border: `1px solid ${acilis === k ? R.pine : R.border}`, color: R.ink, fontWeight: acilis === k ? 700 : 500 }}>{ad}</button>
          ))}
        </div>
        {saklandi ? <p role="status" style={{ fontSize: 12, color: R.pine, margin: '8px 0 0' }}>{e.saklandi}</p> : null}
        <button type="button" onClick={dene} disabled={!eposta} style={{ marginTop: 14, background: 'none', border: 'none', padding: '10px 0', minHeight: 44, color: R.pine, fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>{e.deneme}</button>
      </div>
    </Sayfa>
  )
}

export function Entegrasyonlar() {
  const u = useUygulama('entegrasyonlar')
  const e = u.m.ayarlar.ek
  const kalem = (ad: string, alt: string, href: string | null) => {
    const ic = (
      <>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{ad}</span>
          <span style={{ display: 'block', fontSize: 12, color: R.muted, marginTop: 2 }}>{alt}</span>
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: href ? R.pine : R.muted, background: href ? '#E4F3F1' : '#F2ECDF', borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>{href ? e.hazir : e.bagliDegil}</span>
      </>
    )
    return href ? <a key={ad} href={href} style={SATIR}>{ic}</a> : <div key={ad} style={SATIR}>{ic}</div>
  }
  return (
    <Sayfa u={u} baslik={e.entegrasyonBaslik} alt={e.entegrasyonAlt}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-alan="entegrasyon-listesi">
        {kalem(e.epostaKalemi, e.epostaKalemiAlt, YOL.iletisim)}
        {ozellikAcik('hastaMesajlari') ? kalem(e.mesajKalemi, e.mesajKalemiAlt, YOL.mesajlar) : null}
        {kalem(e.takvimKalemi, e.takvimKalemiAlt, YOL.takvim)}
        {ozellikAcik('klinikHesaplari') ? kalem(e.personelKalemi, e.personelKalemiAlt, YOL.klinik) : null}
        {kalem(e.disSistemler, e.disSistemlerAlt, null)}
      </div>
    </Sayfa>
  )
}
