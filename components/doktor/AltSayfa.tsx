'use client';

/**
 * ALT-SAYFA-01 (beta feedback, KBB doctor on iPhone Safari, 2026-11-21): on a phone the new-appointment sheet put
 * "Randevuyu kaydet" under the fixed bottom tab bar (Ana Sayfa / Randevular / Hastalar / Mesajlar / Menü), so it could
 * not be tapped. Two causes, both fixed for every sheet at once:
 *   1. The frame's content box (`.notya-icerik`, components/doktor/KabukGorunumu.tsx) was a stacking context
 *      (z-index: 1), so every modal inside the page — whatever its own z-index — was painted UNDER the tab bar (z 38).
 *      The frame no longer creates that context, and hides the tab bar while any `[aria-modal="true"]` is open.
 *   2. The sheet scrolled as one block (max-height 88vh — taller than the visible area in iOS Safari), so its buttons
 *      sat at the very bottom of the scroll. This view keeps the actions in a footer that never scrolls away, padded
 *      above the home indicator (safe-area-inset-bottom), with the body scrolling on its own.
 *
 * THE ONE PATTERN for a bottom sheet in the doctor app: overlay → panel (role="dialog", aria-modal="true") → scrolling
 * body → fixed action footer. No word is written here; the caller passes its own label and buttons, so a country build
 * uses the same view with its own words.
 */
import React from 'react';

export const ALT_SAYFA_CSS = `
.notya-alt-sayfa-panel { max-height: 88vh; max-height: calc(100dvh - env(safe-area-inset-top, 0px) - 12px); }
@supports (height: 100dvh) { .notya-alt-sayfa-panel { max-height: min(92dvh, calc(100dvh - env(safe-area-inset-top, 0px) - 12px)); } }
.notya-alt-sayfa-govde { overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; min-height: 0; flex: 1 1 auto; }
.notya-alt-sayfa-eylem { flex: 0 0 auto; padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px)); }
`;

type Ortak = {
  /** The dialog's accessible name (the caller's words). */
  etiket: string;
  /** Tap on the dimmed background = the caller's cancel. */
  onKapat: () => void;
  /** The scrolling content. */
  children?: React.ReactNode;
  /** The action buttons — always visible, above the home indicator. */
  eylemler: React.ReactNode;
  maxWidth?: number;
  testId?: string;
  /** Panel background (defaults to the doctor app's paper). */
  arkaPlan?: string;
};

export default function AltSayfa(p: Ortak & { onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void }) {
  const panelStil: React.CSSProperties = {
    width: '100%', maxWidth: p.maxWidth ?? 480, margin: 0, boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: p.arkaPlan ?? '#FAF8F4', color: '#3a2c22',
    borderRadius: '16px 16px 0 0', border: '1px solid rgba(58,44,34,0.12)', borderBottom: 'none',
    boxShadow: '0 -8px 28px rgba(47,67,52,0.18)',
  };
  const icerik = (
    <>
      <div className="notya-alt-sayfa-govde" style={{ padding: '20px 20px 8px' }}>{p.children}</div>
      <div className="notya-alt-sayfa-eylem" data-alt-sayfa-eylem="" style={{ padding: '10px 20px 0', borderTop: '1px solid rgba(58,44,34,0.1)', background: p.arkaPlan ?? '#FAF8F4' }}>
        {p.eylemler}
      </div>
    </>
  );
  const ortakOznitelik = {
    role: 'dialog' as const,
    'aria-modal': true as const,
    'aria-label': p.etiket,
    className: 'notya-alt-sayfa-panel',
    'data-testid': p.testId,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    style: panelStil,
  };
  return (
    <div
      role="presentation"
      data-alt-sayfa=""
      onClick={p.onKapat}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
    >
      <style>{ALT_SAYFA_CSS}</style>
      {p.onSubmit ? (
        <form {...ortakOznitelik} onSubmit={p.onSubmit}>{icerik}</form>
      ) : (
        <div {...ortakOznitelik}>{icerik}</div>
      )}
    </div>
  );
}
