'use client'

/**
 * The messages page of the doctor application (Türkiye: app/dashboard/doktor/mesajlar) as plain presentational pieces:
 * the two white cards (list of conversations, open conversation), the chat bubbles, the attachment boxes and the reply
 * box. Türkiye's inbox and every country's patient-file conversation draw THROUGH these, so the look cannot drift. No
 * word and no endpoint is written here: every string, link and callback arrives as a prop.
 */
import React from 'react'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeRenk'

const GOLGE = '0 8px 18px rgba(58,44,34,0.045)'

/** The two cards side by side (stacked on a phone). */
export function MesajKartlari({ sol, sag }: { sol: React.ReactNode; sag: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: GOLGE }}>{sol}</div>
      <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 16, minHeight: 280, boxShadow: GOLGE }}>{sag}</div>
    </div>
  )
}

/** The empty list: what this is, and the first step. */
export function MesajListeBos({ baslik, children }: { baslik: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div style={{ padding: '22px 18px' }}>
      <p style={{ margin: 0, color: CHROME_RENK.ink, fontSize: 14.5, fontWeight: 600 }}>{baslik}</p>
      {children ? <p style={{ margin: '6px 0 0', color: CHROME_RENK.muted, fontSize: 13.5, lineHeight: 1.5 }}>{children}</p> : null}
    </div>
  )
}

export type MesajKonusu = { id: string; baslik: React.ReactNode; alt: React.ReactNode; ozet: React.ReactNode; okunmamis: boolean }

/** One row per conversation; the open one is tinted, an unread one has a green dot. */
export function MesajKonuListesi({ konular, aktifId, onSec }: { konular: MesajKonusu[]; aktifId: string | null; onSec: (id: string) => void }) {
  return (
    <>
      {konular.map((t) => (
        <button key={t.id} type="button" onClick={() => onSec(t.id)}
          style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${CHROME_RENK.border}`, background: aktifId === t.id ? '#E4F3F1' : 'transparent', color: CHROME_RENK.ink, padding: '14px 16px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <strong style={{ fontSize: 14 }}>{t.baslik}</strong>
            {t.okunmamis ? <span style={{ width: 8, height: 8, borderRadius: 99, background: CHROME_RENK.pine, marginTop: 5 }} /> : null}
          </div>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>{t.alt}</div>
          <div style={{ fontSize: 13, color: CHROME_RENK.ink, marginTop: 4 }}>{t.ozet}</div>
        </button>
      ))}
    </>
  )
}

/** The right card while nothing is open. */
export function MesajPanelBos({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, color: CHROME_RENK.muted }}>{children}</p>
}

/** The right card's head: the conversation's title and the line under it (patient, links). */
export function MesajPanelBasligi({ baslik, alt }: { baslik: React.ReactNode; alt?: React.ReactNode }) {
  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 20, color: '#2e251d' }}>{baslik}</h2>
      {alt ? <p style={{ margin: 0, color: CHROME_RENK.muted, fontSize: 13 }}>{alt}</p> : null}
    </>
  )
}

/** The column the bubbles stand in. */
export function MesajBalonlari({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
}

/**
 * A chat bubble. `karsi` = the other side (patient): left, cream. Otherwise: right, dark pine.
 * `veri` = data-* attributes for the caller's own hooks.
 */
export function MesajBalonu({ karsi, kimden, metin, zaman, ekler, alt, sag, veri }: {
  karsi: boolean; kimden: React.ReactNode; metin: React.ReactNode; zaman: React.ReactNode
  ekler?: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; veri?: Record<string, string | undefined>
}) {
  return (
    <div {...(veri ?? {})}
      style={{ alignSelf: karsi ? 'flex-start' : 'flex-end', maxWidth: '94%', padding: '10px 12px', borderRadius: 12, background: karsi ? '#F6F0E4' : CHROME_RENK.pine, color: karsi ? CHROME_RENK.ink : '#FAF8F4' }}>
      <div style={{ fontSize: 11, color: karsi ? CHROME_RENK.pine : CHROME_RENK.gold, fontWeight: 700, marginBottom: 4 }}>{kimden}</div>
      <div style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{metin}</div>
      {ekler}
      {alt}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: karsi ? CHROME_RENK.muted : 'rgba(250,248,244,0.7)' }}>{zaman}</span>
        {sag}
      </div>
    </div>
  )
}

/** The small underlined action at a bubble's lower right (Türkiye: delete). */
export function MesajBalonEylemi({ karsi, onClick, disabled, children }: { karsi: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ border: 'none', background: 'transparent', color: karsi ? CHROME_RENK.warn : 'rgba(250,248,244,0.85)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
      {children}
    </button>
  )
}

/** The pill button inside a bubble's attachment box. */
export function mesajEkDugmeStili(karsi: boolean): React.CSSProperties {
  return { border: `1px solid ${karsi ? 'rgba(47,67,52,0.25)' : 'rgba(255,255,255,0.35)'}`, background: karsi ? '#fff' : 'rgba(255,255,255,0.12)', color: karsi ? CHROME_RENK.pine : '#FAF8F4', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
}

/** The attachments of one bubble. */
export function MesajEkListesi({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
}

/** One attachment: its name, then its buttons. */
export function MesajEkKutusu({ karsi, ad, children }: { karsi: boolean; ad: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: 10, background: karsi ? 'rgba(47,67,52,0.06)' : 'rgba(255,255,255,0.12)', fontSize: 13 }}>
      <div style={{ fontWeight: 650, marginBottom: 6 }}>{'\u{1F4CE}'} {ad}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  )
}

/** The reply box: the text area and the dark pill button under it. `ara` sits between them (templates, notices). */
export function MesajYazmaKutusu({ deger, onDegis, yerTutucu, etiket, etiketFor, ad, kimlik, satir = 3, azami, ara, gonderMetni, onGonder, pasif, soluk, tur = 'button', veri }: {
  deger: string; onDegis: (y: string) => void; yerTutucu?: string; etiket?: React.ReactNode; etiketFor?: string; ad?: string; kimlik?: string; satir?: number; azami?: number
  ara?: React.ReactNode; gonderMetni: React.ReactNode; onGonder?: () => void; pasif?: boolean; soluk?: boolean; tur?: 'button' | 'submit'; veri?: Record<string, string>
}) {
  return (
    <>
      {etiket ? <label htmlFor={etiketFor} style={{ display: 'block', marginTop: 16, fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine }}>{etiket}</label> : null}
      <textarea id={kimlik} name={ad} value={deger} onChange={(e) => onDegis(e.target.value)} placeholder={yerTutucu} rows={satir} maxLength={azami}
        style={{ width: '100%', marginTop: etiket ? 6 : 16, boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${CHROME_RENK.border}`, background: '#FFFFFF', color: CHROME_RENK.ink, padding: 12, fontSize: 16, fontFamily: 'inherit', resize: 'vertical' }} />
      {ara ?? null}
      <button type={tur} onClick={onGonder} disabled={pasif} {...(veri ?? {})}
        style={{ marginTop: 10, padding: '10px 18px', borderRadius: 999, border: 'none', background: CHROME_RENK.pine, color: '#FAF8F4', fontWeight: 700, cursor: 'pointer', opacity: soluk ? 0.6 : 1 }}>
        {gonderMetni}
      </button>
    </>
  )
}

/** The heading of the messages page: the small italic line above, the title with the unread count and the tip, the line below. */
export function MesajSayfaBasligi({ eyebrow, baslik, okunmamis, ipucu, alt }: { eyebrow: React.ReactNode; baslik: React.ReactNode; okunmamis: number; ipucu?: React.ReactNode; alt: React.ReactNode }) {
  return (
    <>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>{eyebrow}</div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>
          {baslik} {okunmamis > 0 ? <span style={{ color: CHROME_RENK.pine }}>({okunmamis})</span> : null}
        </h1>
        {ipucu}
      </span>
      <p style={{ margin: '0 0 18px', color: CHROME_RENK.muted, fontSize: 14 }}>{alt}</p>
    </>
  )
}
