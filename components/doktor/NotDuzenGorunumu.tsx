'use client'

/**
 * The note page of the doctor application (Türkiye: app/dashboard/doktor/notlar/[id]) as plain presentational pieces:
 * the sticky bar (back link, title, status pill, action pills, the dark main button), the single column of labelled
 * fields, the amber side box. Türkiye's note page and every country's note screen draw THROUGH these, so the look cannot
 * drift. No word and no endpoint is written here: every string, link and callback arrives as a prop.
 */
import React from 'react'
import { CHROME_RENK } from '@/lib/doktor/chromeRenk'

/** A text box of the note page (white, thin brown line, 8px corners). */
export const NOT_KUTU: React.CSSProperties = { width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 8, color: CHROME_RENK.ink, fontSize: 13.5, lineHeight: 1.6, padding: '10px 12px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }
/** The small bold pine label above a field. */
export const NOT_ETIKET: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 4 }

// Two columns while the side box exists (the box sits right, sticky; on a phone it comes first), else one column.
export const NOT_DUZEN_CSS = `.notDuzen{max-width:1180px;margin:0 auto;padding:18px 16px 60px;display:grid;gap:20px;grid-template-columns:minmax(0,1fr) 280px;align-items:start}
.notDuzen.tek{max-width:860px;grid-template-columns:minmax(0,1fr)}
.notDuzen aside{position:sticky;top:84px}
@media (max-width:900px){.notDuzen{grid-template-columns:minmax(0,1fr)}.notDuzen aside{order:-1;position:static}}`

/**
 * The sticky bar. `geri` is the back link (an element, so each build links in its own way); `baslik` is the first line
 * (name and what follows it); `rozet` the status pill; `ek` what sits after the pill (chips); `durum` the amber text
 * after that; `eylemler` the pills and buttons on the right (put NotAnaDugme last).
 */
export function NotUstCubugu({ geri, baslik, rozet, onayli, ek, durum, eylemler }: {
  geri: React.ReactNode; baslik: React.ReactNode; rozet: React.ReactNode; onayli: boolean; ek?: React.ReactNode; durum?: React.ReactNode; eylemler: React.ReactNode
}) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#F6F0E4', borderBottom: '1px solid rgba(58,44,34,0.1)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {geri}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{baslik}</div>
        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 3 }}>
          <span style={{ padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: 11.5, background: onayli ? 'rgba(46,110,78,0.12)' : 'rgba(180,131,47,0.14)', color: onayli ? '#2E6E4E' : '#B4832F', border: `1px solid ${onayli ? 'rgba(46,110,78,0.35)' : 'rgba(180,131,47,0.4)'}` }}>{rozet}</span>
          {ek ?? null}
          <span style={{ color: '#B4832F' }}>{durum}</span>
        </div>
      </div>
      {eylemler}
    </div>
  )
}

/** The title line's grey tail ("· branch · date · protocol"). */
export function NotBaslikKuyrugu({ children }: { children: React.ReactNode }) {
  return <span style={{ color: CHROME_RENK.muted, fontWeight: 500 }}>{children}</span>
}

/** A rounded pill of the bar: a link that opens in a new tab, or a button. */
export function NotPil({ href, onClick, ton = 'pine', disabled, veri, children }: { href?: string; onClick?: () => void; ton?: 'ink' | 'pine'; disabled?: boolean; veri?: Record<string, string>; children: React.ReactNode }) {
  const renk = ton === 'ink' ? CHROME_RENK.ink : CHROME_RENK.pine
  const kenar = ton === 'ink' ? '1px solid rgba(58,44,34,0.16)' : '1px solid rgba(47,67,52,0.4)'
  if (href) return <a href={href} target="_blank" rel="noreferrer" {...(veri ?? {})} style={{ color: renk, fontSize: 13, textDecoration: 'none', border: kenar, borderRadius: 999, padding: '7px 12px' }}>{children}</a>
  return <button type="button" onClick={onClick} disabled={disabled} {...(veri ?? {})} style={{ color: renk, fontSize: 13, background: 'transparent', textDecoration: 'none', border: kenar, borderRadius: 999, padding: '7px 12px', cursor: 'pointer' }}>{children}</button>
}

export function NotSilDugmesi({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ background: 'transparent', border: '1px solid rgba(178,58,58,0.5)', color: '#B23A3A', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{children}</button>
}

/** The big dark pine button (Türkiye: "Onayla"). */
export function NotAnaDugme({ children, onClick, disabled, soluk, tur = 'button', veri }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; soluk?: boolean; tur?: 'button' | 'submit'; veri?: Record<string, string> }) {
  return <button type={tur} className="notya-ana-eylem" onClick={onClick} disabled={disabled} {...(veri ?? {})} style={{ background: CHROME_RENK.pine, border: 'none', color: 'white', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: soluk ? 0.85 : 1 }}>{children}</button>
}

/** The page body: a column of fields, and (optionally) the amber side box beside it. */
export function NotDuzeni({ yan, children }: { yan?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <style>{NOT_DUZEN_CSS}</style>
      <div className={yan ? 'notDuzen' : 'notDuzen tek'}>
        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>{children}</div>
        {yan ?? null}
      </div>
    </>
  )
}

/** One field: the label above whatever is the field. */
export function NotAlani({ etiket, children }: { etiket: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={NOT_ETIKET}>{etiket}</div>
      {children}
    </div>
  )
}

/** The multi-line box of a field. */
export const NotYazi = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function NotYazi({ style, ...p }, ref) {
  return <textarea ref={ref} {...p} style={{ ...NOT_KUTU, ...style }} />
})

/** The same box, read-only (an approved note): text that keeps its line breaks. */
export function NotOkunurKutu({ children, ...p }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} style={{ ...NOT_KUTU, whiteSpace: 'pre-wrap', color: CHROME_RENK.ink, resize: undefined }}>{children}</div>
}

/** The amber side box ("what is still missing"). */
export function NotYanKutu({ baslik, alt, children }: { baslik: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode }) {
  return (
    <aside style={{ background: 'rgba(180,131,47,0.08)', border: '1px solid rgba(180,131,47,0.30)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#B4832F' }}>{baslik}</div>
      {alt ? <div style={{ fontSize: 11, color: CHROME_RENK.muted, margin: '2px 0 8px' }}>{alt}</div> : null}
      {children}
    </aside>
  )
}
