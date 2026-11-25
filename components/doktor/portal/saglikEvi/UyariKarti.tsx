'use client'
/**
 * HASTA-PORTALI-GUNLUK → BUGUN-V2 — the rule engine's friendly note to the patient, in calm language. Optional lead line
 * and visual (the metric's own curve on Bugün); the note text itself is the rule engine's, unchanged.
 * 'acil' always carries a large 112 call button first.
 */
import type { ReactNode } from 'react'
import type { UyariDuzeyi } from '@/lib/saglikEvi/tipler'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'

export function UyariKarti({ s, duzey, metin, okudum, mesajHref, baslik, children }: { s: SaglikEviSozleri; duzey: UyariDuzeyi; metin: string; okudum?: () => void; mesajHref?: string; baslik?: string; children?: ReactNode }) {
  return (
    <div className={`sge-uyari sge-uyari--${duzey}`} role={duzey === 'acil' ? 'alert' : 'status'}>
      <span className="sge-uyari-nokta" aria-hidden />
      <div className="sge-uyari-govde">
        {baslik ? <p className="sge-uyari-baslik">{baslik}</p> : null}
        <p className="sge-uyari-metin">{metin}</p>
        {children}
        <div className="sge-uyari-alt">
          {duzey === 'acil' ? (
            <a className="sge-112" href={`tel:${s.acilTel}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
              {s.ara112}
            </a>
          ) : null}
          {mesajHref && (duzey === 'hekime_bildir' || duzey === 'dikkat') ? <a className="sge-uyari-btn" href={mesajHref}>{s.mesajYaz}</a> : null}
          {okudum ? <button type="button" className="sge-uyari-okudum" onClick={okudum}>{s.uyariTamam}</button> : null}
        </div>
      </div>
    </div>
  )
}
