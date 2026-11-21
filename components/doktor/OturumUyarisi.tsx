'use client'

/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — the inline "session expired" message, never a dead end: it always carries a
 * "Giriş yap" button that opens the right login page and brings the doctor back to this page afterwards.
 * Used by every doctor / secretary / Notya Klinik screen that shows a session message, and by OturumBekcisi.
 */
import React from 'react'
import { girisYolu, OTURUM_DOLDU_MESAJI } from '@/lib/doktor/oturumYolu'
import { buradakiYol } from '@/lib/doktor/oturumFetch'

export default function OturumUyarisi({ mesaj = OTURUM_DOLDU_MESAJI, sabit = false }: { mesaj?: string; sabit?: boolean }) {
  const kutu: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
    background: 'rgba(164,91,62,0.08)', border: '1px solid rgba(164,91,62,0.25)', borderRadius: 12,
    padding: '12px 14px', color: '#8a4a33', fontSize: 14, lineHeight: 1.4,
    ...(sabit ? { position: 'fixed', top: 'calc(12px + env(safe-area-inset-top, 0px))', left: 12, right: 12, zIndex: 1000, background: '#fbf3ee', boxShadow: '0 8px 24px rgba(58,44,34,0.12)' } : {}),
  }
  return (
    <div role="alert" style={kutu}>
      <span>{mesaj}</span>
      <a
        href={girisYolu(buradakiYol())}
        onClick={(e) => { e.preventDefault(); window.location.assign(girisYolu(buradakiYol())) }}
        style={{ background: '#2f4a3f', color: '#fff', borderRadius: 10, padding: '8px 14px', fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        Giriş yap
      </a>
    </div>
  )
}
