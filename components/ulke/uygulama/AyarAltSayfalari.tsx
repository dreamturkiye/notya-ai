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
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
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

type PmsBaglantiOzet = { saglayici: string; baglantiDurum: string; sonDort: string | null }

export function Entegrasyonlar() {
  const u = useUygulama('entegrasyonlar')
  const e = u.m.ayarlar.ek
  const pms = ulkePaketi().uzanti?.pmsEntegrasyon
  const [baglantilar, setBaglantilar] = useState<PmsBaglantiOzet[]>([])
  const [saglayici, setSaglayici] = useState('best-practice')
  const [etiket, setEtiket] = useState('')
  const [anahtar, setAnahtar] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  const { hesap, api } = u
  useEffect(() => {
    if (!pms || !hesap) return
    void (async () => {
      try {
        const r = await api('/api/ulke/pms/baglanti')
        if (r.ok && Array.isArray(r.j.baglantilar)) setBaglantilar(r.j.baglantilar as PmsBaglantiOzet[])
      } catch { /* list stays empty */ }
    })()
  }, [pms, hesap, api])

  const durumRozet = (durum: string) => {
    if (durum === 'hazir-export') return { ad: 'Export ready', renk: R.pine, zemin: '#E4F3F1' }
    if (durum === 'kimlik-kayitli' || durum === 'partner-bekleniyor') {
      return { ad: 'Credentials saved · partner pending', renk: R.muted, zemin: '#F2ECDF' }
    }
    if (durum === 'partner-api') return { ad: 'Needs partner API', renk: R.muted, zemin: '#F2ECDF' }
    return { ad: 'On the roadmap', renk: R.muted, zemin: '#F2ECDF' }
  }

  async function kaydet() {
    if (!pms) return
    setBekliyor(true); setHata(null); setBilgi(null)
    try {
      const r = await api('/api/ulke/pms/baglanti', { method: 'POST', govde: { saglayici, anahtar, etiket } })
      if (r.ok && r.j.baglanti) {
        const o = r.j.baglanti as PmsBaglantiOzet
        setBaglantilar((eski) => {
          const kal = eski.filter((b) => b.saglayici !== o.saglayici)
          return [...kal, o]
        })
        setAnahtar('')
        setBilgi(pms.baglantiKaydedildi || 'Saved. Waiting for partner API — not Synced.')
      } else setHata('Credentials could not be saved.')
    } catch { setHata('Credentials could not be saved.') }
    setBekliyor(false)
  }

  async function sil(s: string) {
    if (!pms) return
    setBekliyor(true); setHata(null); setBilgi(null)
    try {
      const r = await api('/api/ulke/pms/baglanti', { method: 'DELETE', govde: { saglayici: s } })
      if (r.ok) setBaglantilar((eski) => eski.filter((b) => b.saglayici !== s))
      else setHata('Could not remove credentials.')
    } catch { setHata('Could not remove credentials.') }
    setBekliyor(false)
  }

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

  const kayitli = (anahtar: string) => baglantilar.find((b) => b.saglayici === anahtar)

  return (
    <Sayfa u={u} baslik={e.entegrasyonBaslik} alt={e.entegrasyonAlt}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-alan="entegrasyon-listesi">
        {kalem(e.epostaKalemi, e.epostaKalemiAlt, YOL.iletisim)}
        {ozellikAcik('hastaMesajlari') ? kalem(e.mesajKalemi, e.mesajKalemiAlt, YOL.mesajlar) : null}
        {kalem(e.takvimKalemi, e.takvimKalemiAlt, YOL.takvim)}
        {ozellikAcik('klinikHesaplari') ? kalem(e.personelKalemi, e.personelKalemiAlt, YOL.klinik) : null}
        {kalem(e.disSistemler, e.disSistemlerAlt, null)}
      </div>
      {/* AU-GAP-CLOSE-01/02: honest PMS roadmap + credential vault — never a Synced badge. */}
      {pms ? (
        <div style={{ ...KUTU, marginTop: 18 }} data-alan="pms-entegrasyon">
          <h2 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 22, margin: '0 0 6px', color: '#2e251d' }}>{pms.baslik}</h2>
          <p style={{ fontSize: 13, color: R.muted, margin: '0 0 14px' }}>{pms.aciklama}</p>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{pms.exportBaslik}</p>
          <p style={{ fontSize: 12, color: R.muted, margin: '0 0 12px' }}>{pms.exportAciklama}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pms.kalemler.map((k) => {
              const kayit = kayitli(k.anahtar)
              const durum = kayit ? kayit.baglantiDurum : k.durum
              const r = durumRozet(durum)
              return (
                <div key={k.anahtar} style={SATIR} data-pms={k.anahtar} data-durum={durum} data-kimlik={kayit ? 'var' : 'yok'}>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{k.ad}</span>
                    <span style={{ display: 'block', fontSize: 12, color: R.muted, marginTop: 2 }}>
                      {kayit?.sonDort ? `${k.aciklama} · key …${kayit.sonDort}` : k.aciklama}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.renk, background: r.zemin, borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>{r.ad}</span>
                  {kayit ? (
                    <button type="button" disabled={bekliyor} onClick={() => { void sil(k.anahtar) }} data-eylem={`pms-sil-${k.anahtar}`} style={{ marginLeft: 8, background: 'none', border: 'none', color: R.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                      {pms.baglantiSil || 'Remove'}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
          {pms.baglantiBaslik ? (
            <div style={{ marginTop: 18 }} data-alan="pms-vault">
              <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{pms.baglantiBaslik}</p>
              <p style={{ fontSize: 12, color: R.muted, margin: '0 0 10px' }}>{pms.baglantiAciklama}</p>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }} htmlFor="pms-saglayici">Practice system</label>
              <select id="pms-saglayici" value={saglayici} onChange={(ev) => setSaglayici(ev.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 15, marginBottom: 8, fontFamily: CHROME_FONT.sans }}>
                {pms.kalemler.filter((k) => k.anahtar !== 'export-pack').map((k) => (
                  <option key={k.anahtar} value={k.anahtar}>{k.ad}</option>
                ))}
              </select>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }} htmlFor="pms-etiket">Label (optional)</label>
              <input id="pms-etiket" value={etiket} onChange={(ev) => setEtiket(ev.target.value)} maxLength={80} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 15, marginBottom: 8, fontFamily: CHROME_FONT.sans }} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }} htmlFor="pms-anahtar">API key</label>
              <input id="pms-anahtar" type="password" autoComplete="off" value={anahtar} onChange={(ev) => setAnahtar(ev.target.value)} maxLength={500} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 15, marginBottom: 10, fontFamily: CHROME_FONT.sans }} />
              <button type="button" disabled={bekliyor || anahtar.trim().length < 8} onClick={() => { void kaydet() }} data-eylem="pms-baglanti-kaydet" style={{ background: R.pine, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: CHROME_FONT.sans, minHeight: 44 }}>
                {pms.baglantiKaydet || 'Save credentials'}
              </button>
              {bilgi ? <p role="status" data-alan="pms-vault-bilgi" style={{ fontSize: 12, color: R.pine, margin: '10px 0 0' }}>{bilgi}</p> : null}
              {hata ? <p role="alert" data-alan="pms-vault-hata" style={{ fontSize: 12, color: '#9b3b2e', margin: '10px 0 0' }}>{hata}</p> : null}
            </div>
          ) : null}
          <p style={{ fontSize: 12, color: R.muted, margin: '12px 0 0' }}>{pms.uyari}</p>
        </div>
      ) : null}
    </Sayfa>
  )
}
