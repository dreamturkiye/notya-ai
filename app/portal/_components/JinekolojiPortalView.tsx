'use client'
/** NOTYA-JINE-04 — portal jinekoloji hatırlatmaları (Pap/HPV/RİA; tanı yok). */
import React from 'react'
import type { PortalJinekoloji } from '@/lib/portal/types'

const RENK: Record<string, string> = {
  gecikti: 'var(--sg-danger, #B23A48)',
  yaklasiyor: 'var(--sg-warn, #B7791F)',
  planli: 'var(--sg-ok, #2E7D5B)',
}

export function JinekolojiPortalView({ jine }: { jine: PortalJinekoloji }) {
  return (
    <section style={{ background: 'var(--sg-panel, #fff)', border: '1px solid var(--sg-line, #E6EAF0)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sg-accent, #C2603F)', fontWeight: 700 }}>Kadın sağlığı hatırlatmaları</div>
      <div style={{ fontSize: 13, color: 'var(--sg-muted, #6B7385)', marginTop: 6 }}>{jine.not}</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {jine.hatirlatmalar.map((h) => (
          <div key={h.ad} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5, border: '1px solid var(--sg-line, #E6EAF0)', borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ color: 'var(--sg-ink, #1C2430)' }}>{h.ad}</span>
            <span style={{ color: RENK[h.durum], fontWeight: 700, fontSize: 12 }}>{h.due || '—'} · {h.durum}</span>
          </div>
        ))}
      </div>
      {jine.riaIpKontrol && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--sg-ink, #1C2430)', background: 'var(--sg-soft, #F6F1EC)', borderRadius: 10, padding: '8px 12px' }}>
          RİA ip kontrol tarihi: <b>{new Date(jine.riaIpKontrol).toLocaleDateString('tr-TR')}</b>
        </div>
      )}
    </section>
  )
}
