'use client'
/**
 * HASTA-PORTALI-GUNLUK → BUGUN-V2 — the rule engine's friendly note to the patient, in calm language. Optional lead line
 * and visual (the metric's own curve on Bugün); the note text itself is the rule engine's, unchanged.
 * 'acil' always carries a large 112 call button first.
 * UYARI-RENKLERI (Kaan, 2026-11-25): the card's tone comes from lib/saglikEvi/uyariRenkleri.ts — a clinical reading
 * (acil red / doktora bildirildi coral / dikkat amber, solid mark) never looks like an adherence lapse (kritik medicine
 * unmarked: slate, dashed edge). Every warning card carries its word + icon, never colour alone.
 */
import type { ReactNode } from 'react'
import type { UyariDuzeyi } from '@/lib/saglikEvi/tipler'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { uyariTonu } from '@/lib/saglikEvi/uyariRenkleri'
import { UyariIsareti } from '@/components/doktor/saglikEvi/UyariIsareti'

export function TelefonIkonu({ boyut = 18 }: { boyut?: number }) {
  return <svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
}

export function UyariKarti({ s, duzey, kural, metin, okudum, mesajHref, baslik, children, ara112 = true }: { s: SaglikEviSozleri; duzey: UyariDuzeyi; kural?: string | null; metin: string; okudum?: () => void; mesajHref?: string; baslik?: string; children?: ReactNode; ara112?: boolean }) {
  const ton = uyariTonu(duzey, kural)
  const sinif = ton === 'uyum' ? 'uyum' : duzey
  const etiket = ton === 'uyum' ? s.uyumIsaretlenmedi : ton ? s.seviye[ton] : null
  return (
    <div className={`sge-uyari sge-uyari--${sinif}`} role={duzey === 'acil' ? 'alert' : 'status'} data-ton={ton ?? 'bilgi'}>
      <span className="sge-uyari-nokta" aria-hidden />
      <div className="sge-uyari-govde">
        {ton && etiket ? <p className="sge-uyari-isaret"><UyariIsareti ton={ton} etiket={etiket} kucuk /></p> : null}
        {baslik ? <p className="sge-uyari-baslik">{baslik}</p> : null}
        {metin ? <p className="sge-uyari-metin">{metin}</p> : null}
        {children}
        <div className="sge-uyari-alt">
          {duzey === 'acil' && ara112 ? (
            <a className="sge-112" href={`tel:${s.acilTel}`}>
              <TelefonIkonu />
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
