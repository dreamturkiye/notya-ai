'use client'

/**
 * The "new visit" set-up screen of the doctor application (Türkiye: app/session/new, step "setup"), as plain
 * presentational pieces. Türkiye's page and every country's visit page draw THROUGH these, so the look cannot
 * drift: page background, header row (back + title), cream card, branch banner, pill row, big dark start button,
 * dashed boxes. No word is written here; every string arrives as a prop.
 */
import React from 'react'
import { CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeRenk'

const S = (s: Record<string, unknown>) => s as React.CSSProperties

export function SeansSayfasi({ geri, onGeri, geriHref, baslik, ipucu, genis, hata, children }: {
  geri: string; onGeri?: () => void; geriHref?: string; baslik: string; ipucu?: React.ReactNode; genis?: boolean; hata?: React.ReactNode; children: React.ReactNode
}) {
  const geriStil = S({ color: '#8b7d70', cursor: 'pointer', fontSize: '14px', textDecoration: 'none' })
  return (
    <div className="notya-seans-sayfa" style={S({ minHeight: '100vh', background: '#f4eee3', fontFamily: CHROME_FONT.sans, padding: '20px' })}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={S({ maxWidth: genis ? '980px' : '600px', margin: '0 auto' })}>
        <div style={S({ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' })}>
          {geriHref ? <a href={geriHref} style={geriStil}>{'←'} {geri}</a> : <div onClick={onGeri} style={geriStil}>{'←'} {geri}</div>}
          <div style={S({ fontSize: '18px', fontWeight: '600', color: '#3b2e24' })}>{baslik}</div>
          {ipucu ?? null}
        </div>
        {hata ? <div style={S({ background: '#FCEBEB', border: '1px solid #F09595', borderRadius: '12px', padding: '14px', fontSize: '13px', color: '#A32D2D', marginBottom: '16px' })}>{hata}</div> : null}
        {children}
      </div>
    </div>
  )
}

export function SeansKarti({ children }: { children: React.ReactNode }) {
  return <div style={S({ background: '#faf6ee', border: '1px solid rgba(58,44,34,0.08)', borderRadius: '20px', padding: '24px' })}>{children}</div>
}

export function SeansBanner({ emoji, metin, alt }: { emoji?: string; metin: string; alt?: string }) {
  return (
    <div style={S({ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '10px 12px', background: '#e8ede6', border: '1px solid rgba(47,67,52,0.25)', borderRadius: '10px', fontSize: '13px', color: '#2f4334', fontWeight: '600', flexWrap: 'wrap' })}>
      {emoji ? <span>{emoji}</span> : null}
      <span>{metin}</span>
      {alt ? <span style={S({ fontWeight: '400', color: '#8b7d70' })}>{'·'} {alt}</span> : null}
    </div>
  )
}

export function SeansEtiketi({ children }: { children: React.ReactNode }) {
  return <div style={S({ fontSize: '15px', fontWeight: '600', color: '#3b2e24', marginBottom: '12px' })}>{children}</div>
}

export function SeansPilleri({ secenekler, secili, onSec }: { secenekler: { id: string; etiket: string }[]; secili: string; onSec: (id: string) => void }) {
  return (
    <div style={S({ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' })}>
      {secenekler.map((t) => (
        <div key={t.id} onClick={() => onSec(t.id)}
          style={S({ padding: '8px 16px', borderRadius: '20px', border: `1.5px solid ${secili === t.id ? '#2f4334' : '#e5ddd0'}`, background: secili === t.id ? '#e8ede6' : '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: secili === t.id ? '600' : '400', color: secili === t.id ? '#2f4334' : '#3b2e24' })}>
          {t.etiket}
        </div>
      ))}
    </div>
  )
}

export function SeansBaslatDugmesi({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={S({ width: '100%', padding: '16px', background: disabled ? '#8b9a8f' : '#2f4334', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer' })}>
      {children}
    </button>
  )
}

/** The cream box with a dashed border (Türkiye: the past-date box). */
export function SeansKesikKutu({ children }: { children: React.ReactNode }) {
  return <div style={S({ marginTop: '14px', padding: '10px 12px', background: '#F6F0E4', border: '1px dashed #c9bfa9', borderRadius: '10px' })}>{children}</div>
}

export function SeansAyirac({ children }: { children: React.ReactNode }) {
  return <div style={S({ textAlign: 'center', margin: '14px 0 6px', color: '#8b7d70', fontSize: '12px' })}>{children}</div>
}

/** The dashed "upload a file" block: a label around a hidden file input (Türkiye: "Ses dosyası yükle"). */
export function SeansYuklemeKutusu({ etiket, accept, disabled, onDosya, id }: { etiket: string; accept: string; disabled?: boolean; onDosya: (f: File) => void; id?: string }) {
  return (
    <label style={S({ display: 'block', width: '100%', padding: '13px', background: disabled ? '#e8ede6' : '#F6F0E4', color: '#3b2e24', border: '1.5px dashed #c9bfa9', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'center', boxSizing: 'border-box', opacity: disabled ? 0.6 : 1 })}>
      {'\u{1F4C1}'} {etiket}
      <input id={id} type="file" accept={accept} style={{ display: 'none' }} disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onDosya(f) }} />
    </label>
  )
}
