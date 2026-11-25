/**
 * UYARI-RENKLERI (Kaan, 2026-11-25) — the one warning mark: icon + word in the tone's colour, used on BOTH sides (Sağlığım
 * and the doctor app) so a clinical reading and an adherence lapse never look alike anywhere. Clinical tones draw a solid
 * mark (octagon / bell / triangle); the adherence tone draws a dashed ring on a dashed outline — shape, colour AND word
 * differ. Inline styles only (no stylesheet dependency), values from lib/doktor/chromeRenk.ts UYARI_RENK (WCAG AA,
 * pinned by lib/saglikEvi/uyariRenkleri.test.ts). Server-renderable (no hooks).
 */
import type { CSSProperties } from 'react'
import { UYARI_RENK, TON_IKON_YOLU, type UyariTonu } from '@/lib/saglikEvi/uyariRenkleri'

export function TonIkonu({ ton, boyut = 14 }: { ton: UyariTonu; boyut?: number }) {
  const r = UYARI_RENK[ton]
  if (ton === 'uyum') {
    return (
      <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden style={{ flex: 'none' }} data-ton-ikon="kesikli">
        <circle cx="12" cy="12" r="8.5" fill="none" stroke={r.vurgu} strokeWidth="2.4" strokeDasharray="3.2 3" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden style={{ flex: 'none' }} data-ton-ikon={ton}>
      <path d={TON_IKON_YOLU[ton]} fill={ton === 'acil' ? r.vurgu : 'none'} stroke={ton === 'acil' ? r.vurgu : r.ana} strokeWidth={ton === 'acil' ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
      {ton === 'acil' ? <path d="M12 7v6M12 16.6v.4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /> : null}
    </svg>
  )
}

export function UyariIsareti({ ton, etiket, kucuk = false, zeminsiz = false, style }: { ton: UyariTonu; etiket: string; kucuk?: boolean; zeminsiz?: boolean; style?: CSSProperties }) {
  const r = UYARI_RENK[ton]
  return (
    <span
      data-ton={ton}
      className="uyari-isareti"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: kucuk ? 4 : 6, whiteSpace: 'nowrap', verticalAlign: 'middle',
        color: r.ana, background: zeminsiz ? 'transparent' : r.zemin, borderRadius: 999,
        padding: zeminsiz ? 0 : kucuk ? '1px 7px 1px 5px' : '3px 10px 3px 7px',
        border: zeminsiz ? 'none' : ton === 'uyum' ? `1.5px dashed ${r.vurgu}` : `1px solid ${r.zemin}`,
        fontSize: kucuk ? 11.5 : 12.5, fontWeight: 650, lineHeight: 1.35, letterSpacing: '0.005em',
        ...style,
      }}
    >
      <TonIkonu ton={ton} boyut={kucuk ? 12 : 14} />
      {etiket}
    </span>
  )
}
